const logger = require("../utils/cloudinary");
const Media = require("../models/Media");

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

        const { originalName, mimeType, buffer } = req.file;
        const userId = req.user.userId;

        logger.info(`File details: name=${originalName},type=${mimeType}`);
        logger.info("Uploading to cloudinary starting ...");

        const cloudinaryUploadResult = await logger.uploadMediaToCloudinary(req.file);
        logger.info(`Cloudinary upload successfully. Public Id: - ${cloudinaryUploadResult.public_id}`);

        const newlyCreatedMedia = new Media({
            publicId: cloudinaryUploadResult.public_id,
            originalName,
            mimeType,
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