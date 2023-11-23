const express = require("express");
const { check } = require("express-validator");

// making use of the routes
const router = express.Router();

// Requiring the event controller
const smartPlate = require("../controllers/smartPlate.js");

// post req to gpt-4
router.post(
  "/",
  [
    check("spicelevel").not().isEmpty(),
    check("occasion").not().isEmpty(),
    check("cusineType").not().isEmpty(),
    check("servings").not().isEmpty(),
    check("ingredients").not().isEmpty(),
    check("dietaryPreferences").not().isEmpty(),
  ],
  smartPlate.gptRequest
);

module.exports = router;
