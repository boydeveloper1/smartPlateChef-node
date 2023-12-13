const express = require("express");
const { check } = require("express-validator");

// making use of the routes
const router = express.Router();

const checkAuth = require("../middleware/authentication");

// Requiring the smartPlate controller
const smartPlate = require("../controllers/smartPlate.js");

// get smartPlates
router.get("/user/:uid", smartPlate.getSmartPlateByUserId);

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

router.use(checkAuth);

// saving a smartPlate to user //
router.post(
  "/smartplate/:uid",
  [
    check("ingredients").not().isEmpty(),
    check("cusineType").not().isEmpty(),
    check("servings").not().isEmpty(),
    check("occasion").not().isEmpty(),
    check("dietaryPreferences").not().isEmpty(),
    check("title").not().isEmpty(),
    check("cookingTime").not().isEmpty(),
    check("recipe").not().isEmpty(),
  ],
  smartPlate.saveSmartPlate
);

router.delete("/:sid", smartPlate.deleteRecipe);

router.delete("/all/:uid", smartPlate.deleteAllRecipe);

module.exports = router;
