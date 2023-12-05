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
  const { spicelevel, occasion, cusineType, ingredients, dietaryPreferences } =
    req.body;

  let title;
  let recipeList;
  let cookingTime;
  let ingredientsList;

  try {
    // for the title response
    const prompt1 = `Generate a catchy recipe title for a ${occasion} with ${cusineType} cuisine. Ingredients: ${ingredients}, Dietary preference: ${dietaryPreferences}, Spice level: ${spicelevel} (1-3). Limit to 10 words. NO QUOTATION MARKS IN THE REPONSE PLEASE!!`;
    const titleResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant, DO NOT add 'QUOTAION MARKS' in response, the title should be innovative",
        },
        {
          role: "user",
          content: prompt1,
        },
      ],
    });
    title = titleResponse.choices[0].message.content;

    // the recipe details
    const prompt2 = `Provide numbered recipe instructions for a ${occasion} with ${cusineType} cuisine. Ingredients: "${ingredients}". No title. NUMBERED LIST INSTRUCTIONS. Dietary preference: ${dietaryPreferences}, Spice level: ${spicelevel} (1-3). Limit to 200 words.`;
    const recipeResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant, give me only 'instructions' for the dish as list. do not add ingredients",
        },
        {
          role: "user",
          content: prompt2,
        },
      ],
    });
    recipeList = recipeResponse.choices[0].message.content;

    // Generate cooking time
    const prompt3 = `Provide the final cooking time for a single dish comprising of "${recipeList}" in minutes. "TIME IN MINUTES" IN THE RESPONSE`;

    const cookingTimeResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant, give response in time only, do not include any other word but the time in minutes (E.G 30 Minutes). Give  in minutes of just the final dish",
        },
        {
          role: "user",
          content: prompt3,
        },
      ],
    });

    cookingTime = cookingTimeResponse.choices[0].message.content;

    // // Generate ingredients list
    const prompt4 = `List the ingredients for "${recipeList}" in a bullet-point format. Ingredients only, please.`;
    const ingredientsResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant",
        },
        {
          role: "user",
          content: prompt4,
        },
      ],
    });

    ingredientsList = ingredientsResponse.choices[0].message.content;
  } catch (error) {
    const err = new ExpressError(
      "Ooops! seems we experienced an error creating your recipe",
      404
    );
    return next(error);
  }
  res.status(200).json({ title, recipeList, cookingTime, ingredientsList });
};

exports.gptRequest = gptRequest;
