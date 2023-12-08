const mongoose = require("mongoose");

const Schema = mongoose.Schema;

// creation of Event Schema
const SmartPlateSchema = new Schema({
  ingredients: { type: String, required: true },
  cusineType: { type: String, required: true },
  servings: { type: Number, required: true },
  occasion: { type: String, required: true },
  dietaryPreferences: { type: String, required: true },
  title: { type: String, required: true },
  cookingTime: { type: String, required: true },
  recipe: { type: String, required: true },

  // Associating a user model to a smartPlate model using reference Id
  creator: { type: Schema.Types.ObjectId, required: true, ref: "User" },
});

const SmartPlate = mongoose.model("SmartPlate", SmartPlateSchema);

module.exports = SmartPlate;
