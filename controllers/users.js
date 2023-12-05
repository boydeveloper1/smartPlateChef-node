const { validationResult } = require("express-validator");

//  for hashing password
const bcrypt = require("bcryptjs");

// this generates a token that the server uses to track logged in users
// token will be forwarded to front end and used for routes that require a logged in user
const jwt = require("jsonwebtoken");

const ExpressError = require("../utilities/ExpressError");

// user model
const User = require("../models/user");

// Create a new user
const signup = async (req, res, next) => {
  // express-validator result configuration for server side validation - check routes for main configuration
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new ExpressError("Invalid inputs passed, please check your data", 422)
    );
  }
  const { fullName, email, password } = req.body;

  let exisitingUser;

  // check if email is associated with a user
  try {
    exisitingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new ExpressError(
      "Signing up Failed, please try again later",
      500
    );
    return next(error);
  }

  if (exisitingUser) {
    const error = new ExpressError(
      "User exists already, please login instead",
      422
    );
    return next(error);
  }

  let hashedpassword;
  try {
    hashedpassword = await bcrypt.hash(password, 12);
  } catch (error) {
    const err = new ExpressError(
      "Could not create user, please try again",
      500
    );
    return next(err);
  }

  const createdUser = new User({
    fullName,
    email,
    password: hashedpassword,
    smartPlate: [],
  });

  try {
    await createdUser.save();
  } catch (err) {
    const error = new ExpressError("Signing up failed, please try again.", 500);
    return next(error);
  }

  // token to track signed in user
  let token;
  try {
    token = jwt.sign(
      {
        userId: createdUser.id,
        email: createdUser.email,
        image: createdUser.image.url,
      },
      process.env.JWT_KEY,
      { expiresIn: "1h" }
    );
  } catch (err) {
    const error = new ExpressError("Signing up failed, please try again.", 500);
    return next(error);
  }

  res.status(201).json({
    userId: createdUser.id,
    email: createdUser.email,
    image: createdUser.image.url,
    name: createdUser.name,
    token: token,
  });
};
