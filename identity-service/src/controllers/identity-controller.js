const RefreshToken = require("../models/RefreshToken");
const User = require("../models/user");
const generateTokens = require("../utils/generate-token");
const logger = require("../utils/logger");
const { validateRegistration, validateLogin } = require("../utils/validation");

const registerUser = async (req, res) => {
    logger.info("Registration endpoint hit...");
    try {
        const { error } = validateRegistration(req.body);
        if (error && error.details) {
            logger.warn("Validation Error", error.details[0].message);
            return res.status(400).json({
                success: false,
                message: error.details[0].message,
            });
        }

        const { email, password, username } = req.body;
        let user = await User.findOne({ $or: [{ email }, { username }] });
        if (user) {
            logger.warn("User already exists");
            return res.status(400).json({
                success: false,
                message: "User already exists",
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


const loginUser = async (req, res) => {
    logger.info("Login endpoint hit...");
    try {
        const { error } = validateLogin(req.body);
        if (error && error.details) {
            logger.warn("Validation Error", error.details[0].message);
            return res.status(400).json({
                success: false,
                message: error.details[0].message,
            });
        }

        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            logger.warn("Invalid user");
            return res.status(400).json({
                success: false,
                message: "Invalid credentials"
            });
        }

        const isValidPassword = await user.comparePassword(password);
        if (!isValidPassword) {
            logger.warn("Invalid password");
            return res.status(400).json({
                success: false,
                message: "Invalid password"
            });
        }

        const { accessToken, refreshToken } = await generateTokens(user);

        res.json({
            accessToken,
            refreshToken,
            userId: user._id
        });

    } catch (e) {
        logger.error("Login error occurred", e);
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};

const refreshTokenUser = async (req, res) => {
    logger.info("Refresh token endpoint hit...");
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            logger.warn(`Refresh Token missing`);
            return res.status(400).json({
                success: false,
                message: "Refresh Token missing",
            });
        }

        const storedToken = await RefreshToken.findOne({ token: refreshToken })
        if (!storedToken || storedToken.expiresAt < new Date()) {
            logger.warn("Invalid or expired refresh token");
            return res.status(401).json({
                success: false,
                message: "Invalid or expired refresh token"
            });
        }

        const user = await User.findById(storedToken.user);
        if (!user) {
            logger.warn("User not found");
            return res.status(401).json({
                success: false,
                message: "User not found"
            });
        }

        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = await generateTokens(user);
        await RefreshToken.deleteOne({ _id: storedToken._id });

        res.json({
            accessToken: newAccessToken,
            refreshToken: newRefreshToken
        });

    } catch (e) {
        logger.error("Refresh token error occurred", e);
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};

const logoutUser = async (req, res) => {
    logger.info("Logout endpoint hit...");
    try {

        const { refreshToken } = req.body;
        if (!refreshToken) {
            logger.warn(`Refresh Token missing`);
            return res.status(400).json({
                success: false,
                message: "Refresh Token missing",
            });
        }

        await RefreshToken.deleteOne({token:refreshToken});
        logger.info("Refresh token deleted for logout");

        res.json({
            success:true,
            message:"Logout Successfully"
        });

    } catch (e) {
        logger.error("Refresh token error occurred", e);
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};



module.exports = { registerUser, loginUser, refreshTokenUser, logoutUser }; 