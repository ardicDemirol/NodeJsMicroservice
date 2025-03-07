require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const Redis = require("ioredis");
const cors = require("cors");
const helmet = require("helmet");
const postRoutes = require("./routes/post-routes");
const errorHandler = require("./middlewares/error-handler");
const logger = require("./utils/logger");

const app = express();
const PORT = process.env.PORT || 3002;

mongoose
    .connect(process.env.DB_URI)
    .then(() => logger.info("Connected to mongoDB"))
    .catch(e => logger.error("Mongo Connection Error", e));

const redisClient = new Redis(process.env.REDIS_URL);

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
    logger.info(`Received ${req.method} request to ${req.url}`);
    logger.info(`Request body, ${req.body}`);
    next();
});

app.use("/api/posts", (req, res, next) => {
    req.redisClient = redisClient;
    next();
}, postRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
    logger.info(`Identity service running on port ${PORT}`)
});

process.on("unhandledRejection", (reason, promise) => {
    logger.error("unhandledRejection Rejection at", promise, "reason:", reason);
})
