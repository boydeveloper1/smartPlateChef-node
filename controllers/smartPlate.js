const { validationResult } = require("express-validator");

const ExpressError = require("../utilities/ExpressError");

const mongoose = require("mongoose");

const SmartPlate = require("../models/");

// post req to gpt-4
const gptRequest = async (req, res, next) => {};

exports.gptRequest = gptRequest;
