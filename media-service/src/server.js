require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const mediaRoutes = require("./routes/media-routes");
const logger = require("./utils/logger");
const errorHandler = require("./middlewares/error-handler");
const { consumeEvent,connectToRabbitMQ } = require("./utils/rabbitmq");
const { handlePostDeleted } = require("./eventHandlers/media-event-handlers");

const app = express();
const PORT = process.env.PORT || 3003

mongoose
    .connect(process.env.DB_URI)
    .then(() => logger.info("Connected to mongoDB"))
    .catch(e => logger.error("Mongo Connection Error", e));

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
    logger.info(`Received ${req.method} request to ${req.url}`);
    logger.info(`Request body, ${req.body}`);
    next();
});

app.use("/api/media",mediaRoutes);

app.use(errorHandler);


async function startServer() {
    try {
        await connectToRabbitMQ();

        await consumeEvent("post.deleted",handlePostDeleted);

        app.listen(PORT, () => {
            logger.info(`Media service running on port ${PORT}`)
        });
    } catch (e) {
        logger.error("Failed to connect to server", e);
        process.exit(1);
    }
};

startServer();


process.on("unhandledRejection", (reason, promise) => {
    logger.error("unhandledRejection Rejection at", promise, "reason:", reason);
})