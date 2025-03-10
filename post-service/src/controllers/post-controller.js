const Post = require("../models/Post");
const logger = require("../utils/logger");
const { validateCreatePost } = require("../utils/validation");

async function invalidPostCache(req,input) {
    const cachedKey = `post:${input}`;
    await req.redisClient.del(cachedKey);

    const keys = await req.redisClient.keys("posts:*");
    if(keys.length > 0){
        await req.redisClient.del(keys);
    }
};

const createPost = async (req, res) => {
    logger.info("Create post endpoint hit");
    try {
        const { error } = validateCreatePost(req.body);
        if (error && error.details) {
            logger.warn("Validation Error", error.details[0].message);
            return res.status(400).json({
                success: false,
                message: error.details[0].message,
            });
        }

        const { content, mediaIds } = req.body;
        const newCreatedPost = new Post({
            user: req.user.userId,
            content,
            mediaIds: mediaIds || []
        });

        await newCreatedPost.save();
        await invalidPostCache(req,newCreatedPost._id.toString());
        logger.info("Post created successfully", newCreatedPost);
        res.status(201).json({
            success: true,
            message: "Post created successfully"
        });

    } catch (e) {
        logger.error("Error creating post", e);
        res.status(500).json({
            success: false,
            message: "Error creating post",
        });
    }
};


const getAllPosts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const startIndex = (page - 1) * limit;

        const cacheKey = `posts:${page}:${limit}`;
        const cachedPosts = await req.redisClient.get(cacheKey);
        if(cachedPosts) {
            return res.json(JSON.parse(cachedPosts));
        }

        const posts = await Post.find({})
            .sort({createdAt : -1})
            .skip(startIndex)
            .limit(limit);

        const totalNumberOfPosts = await Post.countDocuments();

        const result = {
            posts,
            currentPage : page,
            totalPages : Math.ceil(totalNumberOfPosts/limit),
            totalPosts : totalNumberOfPosts
        };

        await req.redisClient.setex(cacheKey,300,JSON.stringify(result));

        res.json(result);

    } catch (e) {
        logger.error("Error fetching posts", e);
        res.status(500).json({
            success: false,
            message: "Error fetching posts",
        });
    }
};

const getPost = async (req, res) => {
    try {
        const postId = req.params.id;
        const cacheKey = `post:${postId}`;
        const cachedPost = await req.redisClient.get(cacheKey);
        if(cachedPost) {
            return res.json(JSON.parse(cachedPost));
        }

        const postById = await Post.findById(postId);
        if(!postById){
            return res.status(404).json({
                success:false,
                message: "Post not found"
            });
        }

        await req.redisClient.setex(cachedPost,3600,JSON.stringify(postById));
        
        res.json(postById);

    } catch (e) {
        logger.error("Error fetching post", e);
        res.status(500).json({
            success: false,
            message: "Error fetching post by Id",
        });
    }
};


const deletePost = async (req, res) => {
    try {
        const post = await Post.findOneAndDelete({
            _id:req.params.id,
            user : req.user.userId
        });

        if(!post){
            return res.status(404).json({
                success:false,
                message: "Post not found"
            });
        }

        await invalidPostCache(req,req.params.id);
        res.json({
            success : true,
            message : "Successfully deleted"
        });


    } catch (e) {
        logger.error("Error deleting post", e);
        res.status(500).json({
            success: false,
            message: "Error deleting post",
        });
    }
};

module.exports = { createPost, getAllPosts, getPost, deletePost }