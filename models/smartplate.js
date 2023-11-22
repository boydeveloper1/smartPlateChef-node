const mongoose = require("mongoose");

const Schema = mongoose.Schema;

// creation of Event Schema
const SmartPlateSchema = new Schema({
  ingredients: { type: String, required: true },
  cusineType: { type: String, required: true },
  servings: { type: String, required: true },
  occasion: { type: String, required: true },
  dietaryPreferences: { type: String, required: true },
  spicelevel: { type: String, required: true },
  // Associating a user model to the event model using reference Id
  creator: { type: Schema.Types.ObjectId, required: true, ref: "User" },
});

const SmartPlate = mongoose.model("SmartPlate", SmartPlateSchema);

module.exports = SmartPlate;
