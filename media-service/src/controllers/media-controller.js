const Media = require("../models/Media");
const logger = require("../utils/logger");
const { uploadMediaToCloudinary } = require("../utils/cloudinary");

const uploadMedia = async (req, res) => {
    logger.info("Starting media upload");
    try {
        if (!req.file) {
            logger.error("File not found. Please add a file and try");
            return res.status(400).json({
                success: false,
                message: "File not found. Please add a file and try"
            });
        }

        const { originalname, mimetype, buffer } = req.file;
        const userId = req.user.userId;

        logger.info(`File details: name=${originalname},type=${mimetype}`);
        logger.info("Uploading to cloudinary starting ...");

        const cloudinaryUploadResult = await uploadMediaToCloudinary(req.file);
        logger.info(`Cloudinary upload successfully. Public Id: - ${cloudinaryUploadResult.public_id}`);

        const newlyCreatedMedia = new Media({
            publicId: cloudinaryUploadResult.public_id,
            originalName : originalname,
            mimeType : mimetype,
            url: cloudinaryUploadResult.secure_url,
            userId
        });

        await newlyCreatedMedia.save();

        return res.status(201).json({
            success: true,
            mediaId: newlyCreatedMedia._id,
            url: newlyCreatedMedia.url,
            message: "Media upload is successfull"
        });

    } catch (e) {
        logger.error("Error uploading media", e);
        res.status(500).json({
            success: false,
            message: "Error uploading media",
        });
    }
};

module.exports = { uploadMedia };