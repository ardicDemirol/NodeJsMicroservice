const express = require("express");
const { registerUser } = require("../controllers/identity-controller");

const router = express.Router();

router.post("/register", registerUser);

module.exports = router;