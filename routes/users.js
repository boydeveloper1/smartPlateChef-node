const express = require("express");

const { check } = require("express-validator");

const router = express.Router();

// Requiring users controllers
const users = require("../controllers/users");

// For parsing images or files from a form
const multer = require("multer");

const { storage } = require("../cloudinary");

// telling multer to use cloudinary storage
const upload = multer({ storage });

// Gets specific user
router.get("/:uid", users.getUser);

// Create a new user
router.post(
  "/signup",
  upload.single("image"),
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
