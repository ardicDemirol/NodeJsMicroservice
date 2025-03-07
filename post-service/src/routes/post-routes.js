const express = require("express");
const { createPost } = require("../controllers/post-controller");
const {authenticateRequest} = require("../middlewares/auth-middleware");

const router = express();

router.use(authenticateRequest);

router.post("/create-post",createPost);

module.exports = router;