// for random id
const { validationResult } = require("express-validator");

const ExpressError = require("../utilities/ExpressError");

const mongoose = require("mongoose");

const { cloudinary } = require("../cloudinary");

// Translates the address the user enters to coordinates
const getCoordsForAddress = require("../utilities/location");

// Importing event model
const Event = require("../models/event");

// importing user model because we associated user in the schema(one event must belong to a user)
const User = require("../models/user");

// importing boughtEvent model
const BoughtEvent = require("../models/boughtEvent");

// ROUTES

let events;
// Gets all the events
const getAllEvents = async (req, res, next) => {
  try {
    events = await Event.find({});
  } catch (error) {
    const err = new ExpressError(
      "Fetching events failed, please try again later "
    );
    return next(error);
  }
  res.json({
    events: events.map((event) => event.toObject({ getters: true })),
  });
};

// Get a specific event by the eventid (eid)
const getEventById = async (req, res, next) => {
  const { eid } = req.params;

  // block scoping
  let event;
  try {
    event = await Event.findById(eid);
  } catch (err) {
    const error = new ExpressError(
      "Something went wrong, could not find an event.",
      500
    );
    return next(error);
  }

  // If event not found i.e no id matches
  if (!event) {
    const error = new ExpressError(
      "Could not find a event for the provided event id.",
      404
    );
    return next(error);
  }

  res.json({ event: event.toObject({ getters: true }) }); // => {event => (event: event)}
};

// Get events associated to a user using the user id (uid)
const getEventsByUserId = async (req, res, next) => {
  const { uid } = req.params;

  // finding events based on the user that created it
  let events;
  try {
    events = await Event.find({ creator: uid });
  } catch (err) {
    const error = new ExpressError(
      "Fetching Events Failed, please try again later",
      500
    );
    return next(error);
  }

  // didn't like the prompt whenever a user hits the page without an avent
  // // if there is no event
  // if (!events || events.length === 0) {
  //   return next(
  //     new ExpressError(
  //       "Hmmm! Seems there is no event created by you. Mind creating one?",
  //       404
  //     )
  //   );
  // }

  res.json({
    // getters to remove the underscore property in front of id
    events: events.map((event) => event.toObject({ getters: true })),
  });
};

// Get bought events associated to a specific user
const getBoughtEventsByUserId = async (req, res, next) => {
  const { uid } = req.params;

  // finding boughtEvents based on the user that created it
  let boughtEvents;
  try {
    boughtEvents = await BoughtEvent.find({ userThatBought: uid });
  } catch (err) {
    const error = new ExpressError(
      "Fetching BoughtEvent Failed, please try again later",
      500
    );
    return next(error);
  }

  // didn't like the prompt whenever a user hits the page without an avent
  // // if there is no boughtevent
  // if (!boughtEvents || boughtEvents.length === 0) {
  //   return next(
  //     new ExpressError(
  //       "Hmmm! Seems you've not bought a ticket yet. Mind buying one?",
  //       404
  //     )
  //   );
  // }

  res.json({
    // getters to remove the underscore property in front of id
    boughtEvents: boughtEvents.map((event) =>
      event.toObject({ getters: true })
    ),
  });
};

// creating a new Event route
const createEvent = async (req, res, next) => {
  // express-validator result configuration for server side validation - check routes for main configuration
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new ExpressError("Invalid inputs passed, please check your data", 422)
    );
  }

  const {
    title,
    description,
    address,
    organizer,
    category,
    province,
    date,
    startTime,
    endTime,
    price,
  } = req.body;

  // Handling error in async-await - getCoordsForAddress throws and error if it fails, so this handles it.
  let coordinates;
  try {
    coordinates = await getCoordsForAddress(address);
  } catch (error) {
    return next(error);
  }

  // this creates a new event in the database
  const createdEvent = new Event({
    title,
    description,
    address,
    location: coordinates,
    image: {
      url: req.file.path,
      filename: req.file.filename,
    },
    creator: req.userData.userId,
    organizer,
    category,
    province,
    date,
    startTime,
    endTime,
    price,
  });

  let user;
  // checking to see if the id of the user exists in our database
  try {
    user = await User.findById(req.userData.userId);
  } catch (err) {
    const error = new ExpressError(
      "Creating Event Failed, Please try again",
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

  // creating a new event within a session of independent transaction. saving the event and addig the eventid to the user
  try {
    const session = await mongoose.startSession();
    session.startTransaction();
    await createdEvent.save({ session: session });
    // adding the id of createdEvent to the user, mongoose adds just the ID
    user.events.push(createdEvent);
    await user.save({ session: session });
    await session.commitTransaction();
  } catch (error) {
    const err = new ExpressError(
      "Creating event failed, Please try again.",
      500
    );
    return next(error);
  }

  res.status(201).json({ event: createdEvent.toObject({ getters: true }) });
};

// update event route
const updateEvent = async (req, res, next) => {
  // express-validator result configuration for server side validation - check routes for main configuration
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new ExpressError("Invalid inputs passed, please check your data", 422)
    );
  }
  const {
    title,
    description,
    address,
    organizer,
    category,
    province,
    date,
    price,
  } = req.body;

  const { eid } = req.params;

  // Handling error in async-await - getCoordsForAddress throws and error if it fails, so this handles it.
  let coordinates;
  try {
    coordinates = await getCoordsForAddress(address);
  } catch (error) {
    return next(error);
  }

  // finding the event we want to update with the eid
  let event;
  try {
    event = await Event.findById(eid);
  } catch (error) {
    const err = new ExpressError(
      "Something Went Wrong, could not update event",
      500
    );
    return next(error);
  }

  // AUTHORIZATION
  // req.userData.userId was added in the auth middleware
  if (event.creator.toString() !== req.userData.userId) {
    const err = new ExpressError("You are not allowed to edit this event", 401);
    return next(err);
  }

  event.title = title;
  event.description = description;
  event.address = address;
  event.location = coordinates;
  event.organizer = organizer;
  event.category = category;
  event.province = province;
  event.data = date;
  event.price = price;

  try {
    await event.save();
  } catch (err) {
    const error = new ExpressError(
      "Something went wrong could not update event",
      500
    );
    return next(error);
  }

  res.status(200).json({ event: event.toObject({ getters: true }) });
};

// updating/creating the boughtevents dosument after an event is purchased

const boughtEvent = async (req, res, next) => {
  const { uid } = req.params;
  const { event } = req.body;

  // find the user that just bought the ticket
  let userThatBoughtTicket;
  try {
    userThatBoughtTicket = await User.findById(uid);
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

  const newBoughtEvents = [];

  // Create new BoughtEvent documents for each event in the 'events' array. Lopping through the event gotten from the front end
  for (const eventg of event) {
    // Check if a BoughtEvent already exists for this event and user
    let existingBoughtEvent;
    try {
      existingBoughtEvent = await BoughtEvent.findOne({
        eventId: eventg.id,
        userThatBought: req.userData.userId,
      });
    } catch (error) {
      const err = new ExpressError(
        "Error Buying Ticket, try again later.",
        404
      );
      return next(err);
    }

    // if the user has previously bought the event
    if (existingBoughtEvent) {
      // Update the quantity and price if it already exists
      try {
        // finding the document in mongoose
        const updatedBoughtEvent = await BoughtEvent.findOneAndUpdate(
          {
            eventId: eventg.id,
            userThatBought: req.userData.userId,
          },
          // updating the price and quantity
          {
            $set: {
              quantity:
                Number(eventg.quantity) + Number(existingBoughtEvent.quantity),
              price:
                (Number(eventg.quantity) +
                  Number(existingBoughtEvent.quantity)) *
                eventg.price,
            },
          },
          // returning the new document
          { new: true }
        );
      } catch (error) {
        const err = new ExpressError("Could not purchase ticket", 500);
        return next(err);
      }
    } else {
      const newBoughEvent = new BoughtEvent({
        title: eventg.title,
        description: eventg.description,
        quantity: eventg.quantity,
        organizer: eventg.organizer,
        category: eventg.category,
        province: eventg.province,
        date: eventg.date,
        startTime: eventg.startTime,
        endTime: eventg.endTime,
        image: eventg.image,
        address: eventg.address,
        location: eventg.location,
        creator: eventg.creator,
        eventId: eventg.id, // pairing up the bought event to the id of the created evenet
        price: eventg.price * eventg.quantity,
        userThatBought: req.userData.userId, // adding the id of user that bought it
      });
      newBoughtEvents.push(newBoughEvent);
    }
  }

  // push the bought tickets inside the boughtEvent document
  try {
    await BoughtEvent.insertMany(newBoughtEvents);

    const boughtEventIds = newBoughtEvents.map((event) => event.id);

    // // Push the IDs of new or updated BoughtEvents to the user's boughtEvents array
    userThatBoughtTicket.boughtEvents.push(...boughtEventIds);

    // Save the user and BoughtEvents\
    await userThatBoughtTicket.save();
  } catch (error) {
    const err = new ExpressError(
      "Issues With buying your tickets. Try again later",
      500
    );
    return next(err);
  }
};

//  deleting a event passes through this route
const deleteEvent = async (req, res, next) => {
  const { eid } = req.params;

  let event;

  try {
    event = await Event.findById(eid).populate("creator");
  } catch (error) {
    const err = new ExpressError(
      "Something went wrong, could not delete event",
      500
    );
    return next(err);
  }

  if (!event) {
    const error = new ExpressError("Could not find event for this id", 404);
    return next(error);
  }

  // AUTHORIZATION
  if (event.creator.id !== req.userData.userId) {
    const err = new ExpressError(
      "You are not allowed to delete this event",
      401
    );
    return next(err);
  }

  // Deleting image from cloudinary after event is deleted
  const filename = event.image.filename;
  cloudinary.uploader.destroy(filename);

  try {
    // deleting a new event from a user within a session of independent transaction. deleting the event from document and remvoing the eventid from the user
    const session = await mongoose.startSession();
    session.startTransaction();
    await event.deleteOne({ session: session });

    // Delete corresponding documents from BoughtEvent collection
    await BoughtEvent.deleteMany({ eventId: eid }, { session: session });

    // mongoose will remove the ID by just passing in the event "(event)"
    event.creator.events.pull(event);

    await event.creator.save({ session: session });
    await session.commitTransaction();
  } catch (err) {
    const error = new ExpressError(
      "Something went wrong, could not delete the event",
      500
    );
    return next(error);
  }

  res.status(200).json({ message: "Deleted Event." });
};

exports.getAllEvents = getAllEvents;
exports.getEventById = getEventById;
exports.getEventsByUserId = getEventsByUserId;
exports.getBoughtEventsByUserId = getBoughtEventsByUserId;
exports.createEvent = createEvent;
exports.updateEvent = updateEvent;
exports.deleteEvent = deleteEvent;
exports.boughtEvent = boughtEvent;
