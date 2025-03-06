const User = require("../models/user");
const generateTokens = require("../utils/generate-token");
const logger = require("../utils/logger");
const { validateRegistration } = require("../utils/validation");

const registerUser = async (req, res) => {
    logger.info("Registration endpoint hit...");
    try {
        const { error } = validateRegistration(req.body);
        if (error && error.details) { // Hata kontrolü eklendi
            logger.warn("Validation Error", error.details[0].message);
            return res.status(400).json({
                success: false,
                message: error.details[0].message, // "messsage" yerine "message"
            });
        }

        const { email, password, username } = req.body;
        let user = await User.findOne({ $or: [{ email }, { username }] });
        if (user) {
            logger.warn("User already exists");
            return res.status(400).json({
                success: false,
                message: "User already exists", // Hata düzeltildi
            });
        }

        user = new User({ username, email, password });
        await user.save();
        logger.info("User saved successfully", user._id);

        const { accessToken, refreshToken } = await generateTokens(user);
        res.status(201).json({
            success: true,
            message: "User registered successfully",
            accessToken,
            refreshToken
        });

    } catch (e) {
        logger.error("Registration error occurred", e);
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};



module.exports = { registerUser }; 