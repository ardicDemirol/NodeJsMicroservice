require("dotenv").config();
const mongoose = require("mongoose");
const logger = require("./utils/logger");
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const { RateLimiterRedis } = require("rate-limiter-flexible");
const Redis = require("ioredis");
const { rateLimit } = require("express-rate-limit");
const { RedisStore } = require("rate-limit-redis");
const routes = require("./routes/identity-service");
const errorHandler  = require("./middleware/error-handler")

const app = express();
const PORT = process.env.PORT || 3001;

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

const rateLimiter = new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: "middleware",
    points: 5,
    duration: 1 // second
});

app.use((req, res, next) => {
    rateLimiter.consume(req.ip).then(() => next()).catch(() => {
        logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({ success: false, message: "Too many requests" });
    })
});

const sensitiveEndpointsLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger.warn(`Sensitive endpoint rate limit exceed for IP: ${req.ip} `);
        res.status(429).json({ success: false, message: "Too many requests" });
    },
    store: new RedisStore({
        sendCommand: (...args) => redisClient.call(...args),
    }),
});


app.use("/api/auth/register", sensitiveEndpointsLimiter);

app.use("/api/auth", routes);

app.use(errorHandler);

app.listen(PORT, () => {
    logger.info(`Identity service running on port ${PORT}`)
});

process.on("unhandledRejection", (reason, promise) => {
    logger.error("unhandledRejection Rejection at", promise, "reason:", reason);
})
