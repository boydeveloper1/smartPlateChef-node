const { validationResult } = require("express-validator");

const Contact = require("../models/contact");

// sending a contact form details to the database
const contactForm = async (req, res, next) => {
  // express-validator result configuration for server side validation - check routes for main configuration
  //checking to make sure the request fufils all validation put in the server. I put similar validators in the client
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new ExpressError("Invalid inputs passed, please check your data", 422)
    );
  }

  const { name, email, message } = req.body;

  // this creates a new Contact message in the database
  const createdContactMessage = new Contact({
    name,
    email,
    message,
  });

  try {
    await createdContactMessage.save();
  } catch (err) {
    const error = new ExpressError("Sending Message Failed", 500);
    return next(error);
  }

  res.status(200).json({
    message:
      "Your message has been successfully sent. I will respond to you within one business day.",
  });
};

exports.contactForm = contactForm;
