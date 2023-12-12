const { validationResult } = require("express-validator");

const ExpressError = require("../utilities/ExpressError");

const mongoose = require("mongoose");

const SmartPlate = require("../models/smartplate");

const User = require("../models/user");

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

// saving a smartplate from gpt to a user
const saveSmartPlate = async (req, res, next) => {
  // express-validator result configuration for server side validation - check routes for main configuration
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new ExpressError("Invalid inputs passed, please check your data", 422)
    );
  }

  const {
    ingredients,
    dietaryPreferences,
    cusineType,
    servings,
    occasion,
    title,
    cookingTime,
    recipe,
  } = req.body;

  // this creates a new smartPlate in the database
  const savedRecipe = new SmartPlate({
    ingredients,
    dietaryPreferences,
    cusineType,
    servings,
    occasion,
    title,
    cookingTime,
    recipe,
    creator: req.userData.userId,
  });

  let user;
  // checking to see if the id of the user exists in our database
  try {
    user = await User.findById(req.userData.userId);
  } catch (err) {
    const error = new ExpressError(
      "Saving Recipe Failed, Please try again",
      500
    );
    return next(error);
  }

  if (!user) {
    const error = new ExpressError(
      "Could not find user for the provided id",
      404
    );
    return next(error);
  }

  // creating a new smartPlate within a session of independent transaction. saving the smartPlate and adding the smartPlateId to the user
  try {
    const session = await mongoose.startSession();
    session.startTransaction();
    await savedRecipe.save({ session: session });
    // adding the id of savedRecipe to the user, mongoose adds just the ID
    user.smartPlates.push(savedRecipe);
    await user.save({ session: session });
    await session.commitTransaction();
  } catch (error) {
    const err = new ExpressError(
      "Saving Recipe failed, Please try again.",
      500
    );
    return next(error);
  }

  res.status(201).json({ recipe: savedRecipe.toObject({ getters: true }) });
};

// Get smartPlate associated to a user using the user id (uid)
const getSmartPlateByUserId = async (req, res, next) => {
  const { uid } = req.params;

  // finding recipes based on the user that created it
  let smartPlates;
  try {
    smartPlates = await SmartPlate.find({ creator: uid });
  } catch (err) {
    const error = new ExpressError(
      "Fetching Recipe Failed, please try again later",
      500
    );
    return next(error);
  }

  res.json({
    // getters to remove the underscore property in front of id
    smartPlates: smartPlates.map((smartPlate) =>
      smartPlate.toObject({ getters: true })
    ),
  });
};

//  deleting a recipe passes through this route
const deleteRecipe = async (req, res, next) => {
  const { sid } = req.params;

  let smartPlate;

  try {
    smartPlate = await SmartPlate.findById(sid).populate("creator");
  } catch (error) {
    const err = new ExpressError(
      "Something went wrong, could not delete recipe",
      500
    );
    return next(err);
  }

  if (!smartPlate) {
    const error = new ExpressError("Could not find recipe for this id", 404);
    return next(error);
  }

  // AUTHORIZATION
  if (smartPlate.creator.id !== req.userData.userId) {
    const err = new ExpressError(
      "You are not allowed to delete this recipe",
      401
    );
    return next(err);
  }

  try {
    // deleting a new recipe from a user within a session of independent transaction. deleting the recipe from document and remvoing the smartPlateId from the user
    const session = await mongoose.startSession();
    session.startTransaction();
    await smartPlate.deleteOne({ session: session });

    // mongoose will remove the ID by just passing in the smartPlate
    smartPlate.creator.smartPlates.pull(smartPlate);

    await smartPlate.creator.save({ session: session });
    await session.commitTransaction();
  } catch (err) {
    const error = new ExpressError(
      "Something went wrong, could not delete the recipe",
      500
    );
    return next(error);
  }

  res.status(200).json({ message: "Deleted Recipe." });
};

//  deleting all recipe passes through this route
const deleteAllRecipe = async (req, res, next) => {
  const { uid } = req.params;

  let smartPlates;

  try {
    smartPlates = await SmartPlate.find({ creator: uid });
  } catch (error) {
    const err = new ExpressError(
      "Something went wrong, could not delete recipes1",
      500
    );
    return next(err);
  }

  let user;

  try {
    user = await User.findById(uid);
  } catch (error) {
    const err = new ExpressError(
      "Something went wrong, could not delete recipes2",
      500
    );
    return next(err);
  }

  if (!user || !smartPlates) {
    const error = new ExpressError(
      "Something went wrong, could not delete recipes3",
      404
    );
    return next(error);
  }

  // AUTHORIZATION
  if (user.id !== req.userData.userId) {
    const err = new ExpressError(
      "You are not allowed to delete these recipes",
      401
    );
    return next(err);
  }

  try {
    const session = await mongoose.startSession();
    session.startTransaction();

    // Delete all recipes
    const deleted = await SmartPlate.deleteMany({ creator: uid });

    // Clear the user's smartPlates array
    user.smartPlates = [];
    await user.save({ session: session });

    await session.commitTransaction();
  } catch (err) {
    const error = new ExpressError(
      "Something went wrong, could not delete the recipe",
      500
    );
    return next(error);
  }

  res.status(200).json({ message: "Deleted Recipes." });
};

exports.gptRequest = gptRequest;
exports.saveSmartPlate = saveSmartPlate;
exports.getSmartPlateByUserId = getSmartPlateByUserId;
exports.deleteRecipe = deleteRecipe;
exports.deleteAllRecipe = deleteAllRecipe;
