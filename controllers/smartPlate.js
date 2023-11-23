const { validationResult } = require("express-validator");

const ExpressError = require("../utilities/ExpressError");

const mongoose = require("mongoose");

const SmartPlate = require("../models/smartplate");

const openai = require("../utilities/chatgpt");

// post req to gpt-4
const gptRequest = async (req, res, next) => {
  // express-validator result configuration for server side validation - check routes for main configuration
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new ExpressError("Invalid inputs passed, please check your data", 422)
    );
  }
  const {
    spicelevel,
    occasion,
    cusineType,
    servings,
    ingredients,
    dietaryPreferences,
  } = req.body;

  try {
    // for the title response
    const titleResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant designed to output JSON.",
        },
        {
          role: "user",
          content: `Create a unique recipe title for a ${occasion} occasion with ${cusineType} cuisine. Include ingredients like ${ingredients}. The dietary preference specified is none ${dietaryPreferences}, and the spice level is ${spicelevel} (1 to 3, low to high).`,
        },
      ],
    });
    const title = titleResponse.choices[0].message.content;

    // the recipe details
    const recipeResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant designed to output JSON. Give a List for the response",
        },
        {
          role: "user",
          content: `Create a recipe instructions for a ${occasion} occasion with ${cusineType} cuisine. Include ingredients like ${ingredients}. The dietary preference specified is none ${dietaryPreferences}, and the spice level is ${spicelevel} (1 to 3, low to high). The recipe instructions you generate should be in a list format, one instruction per list`,
        },
      ],
    });
    const recipe = recipeResponse.choices[0].message.content;

    // Generate cooking time
    const cookingTimeResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant designed to output JSON.",
        },
        {
          role: "user",
          content: `What is the recommended cooking time for this recipe "${recipe}", if it is to feed about ${servings} person or persons?`,
        },
      ],
    });

    const cookingTime = cookingTimeResponse.choices[0].message.content;

    // Generate ingredients list
    const ingredientsResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant designed to output JSON. Give a List for the response",
        },
        {
          role: "user",
          content: `List the ingredients for the recipe "${recipe}" and include the user-specified ingredients ${ingredients}.no duplicates please. Provide the ingredients in a list format.`,
        },
      ],
    });

    const ingredientsList = ingredientsResponse.choices[0].message.content;

    // Generate calories
    const caloriesResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant designed to output JSON.",
        },
        {
          role: "user",
          content: `What is the rough estimate of calories for this recipe "${recipe}". `,
        },
      ],
    });

    const calories = caloriesResponse.choices[0].message.content;
  } catch (error) {}
};

exports.gptRequest = gptRequest;
