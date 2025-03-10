require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const mediaRoutes = require("./routes/media-routes");
const logger = require("./utils/logger");
const errorHandler = require("./middlewares/error-handler");

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

app.listen(PORT, () => {
    logger.info(`Identity service running on port ${PORT}`)
});

process.on("unhandledRejection", (reason, promise) => {
    logger.error("unhandledRejection Rejection at", promise, "reason:", reason);
})