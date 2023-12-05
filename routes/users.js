const express = require("express");
const { check } = require("express-validator");

// making use of the routes
const router = express.Router();

const users = require("../controllers/users.js");

// Create a new user
router.post(
  "/signup",
  [
    check("name").not().isEmpty(),
    check("email").normalizeEmail().isEmail(),
    check("password").isLength({ min: 8 }),
  ],
  users.signup
);

// Login a user
router.post("/login", users.login);

module.exports = router;
