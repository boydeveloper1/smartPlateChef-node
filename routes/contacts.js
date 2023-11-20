// for the contact form
const express = require("express");

const { check } = require("express-validator");

const router = express.Router();

// Requiring the contact controller
const contact = require("../controllers/contact.js");

router.post(
  "/contact",
  [
    check("name").not().isEmpty(),
    check("email").normalizeEmail().isEmail(),
    check("message").isLength({ min: 5 }),
  ],
  contact.contactForm
);

module.exports = router;
