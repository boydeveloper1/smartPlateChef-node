// Basic express setup
const express = require("express");

const app = express();
const port = 5000;
const mongoose = require("mongoose");
const cors = require("cors");

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const path = require("path");

// for passing all incoming request body
const bodyParser = require("body-parser");

const ExpressError = require("./utilities/ExpressError");

// importing event Routes
const eventsRoutes = require("./routes/events");

// importing users Routes
const usersRoutes = require("./routes/users");

// importing contact toutes
const contactRoutes = require("./routes/contacts");

const User = require("./models/user");

const dbUrl = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@event-hive.hfexoxu.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;

// Connecting To our Mongoose database with different options embedded
mongoose.connect(dbUrl, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Displaying Errors just like try and catch
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error: "));
db.once("open", () => {
  console.log("Database Connected");
});

// This parses all incoming requests and extracts the body which is a Json, convert to array and objects and then call next
app.use(bodyParser.json());

// for our images route - to get images to the frontend
app.use("/uploads/images", express.static(path.join("uploads", "images")));

// this middleware adds a header to all responses before it then hits the specific route - this allows our front end to acknowledge reciept of the response from another server. "localhost:5000"
// this fixes CORS error - getting requests from another domain
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PATCH, DELETE, OPTIONS"
  );
  next();
});

// All events routes hit this middleware
app.use("/api/events", eventsRoutes);

// All users routes hit this middleware
app.use("/api/users", usersRoutes);

// All contact routes hits this middleware
app.use("/api/secured", contactRoutes);

app.use(cors());

//stripe function for payment intent
app.post("/create-payment-intent", async (req, res, next) => {
  const { amount, user } = req.body;

  let paymentIntent;
  try {
    paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: "cad",
      payment_method_types: ["card"],
    });
  } catch (err) {
    const error = new ExpressError(
      "Something went with processing payment",
      500
    );
    return next(error);
  }

  // find the user that just bought the ticket - becuase a user should have created an account before buying
  let userThatBoughtTicket;
  try {
    userThatBoughtTicket = await User.findById(user);
  } catch (error) {
    const err = new ExpressError(
      "Something Went Wrong, could not find user that created event",
      500
    );
    return next(err);
  }

  if (!userThatBoughtTicket) {
    const error = new ExpressError(
      "Could not find user that created event",
      404
    );
    return next(error);
  }

  res.status(200).json({ clientSecret: paymentIntent.client_secret });
});

// Main Custom Error Handler - If there is an error encountered before here, then middleware triggers
// express default middleware function
app.use((err, req, res, next) => {
  const { status = 500, message = "You have encountered an error" } = err;
  if (res.headerSent) {
    return next(err);
  }
  res.status(status).json({ message: err.message || message });
});

const workingPort = process.env.PORT || port;

// Confirmation of Express Listening to Server. End of Exporess connection
app.listen(workingPort, () => {
  console.log(`Serving at Port https://localhost:${workingPort}`);
});
