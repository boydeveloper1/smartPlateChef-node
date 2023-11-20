const express = require("express");
const { check } = require("express-validator");

// making use of the routes
const router = express.Router();

// Requiring the event controller
const events = require("../controllers/events.js");

// For parsing images or files from a form
const multer = require("multer");

const { storage } = require("../cloudinary");

// telling multer to store cloudinary storage
const upload = multer({ storage });

const checkAuth = require("../middleware/authentication");

// all events
router.get("/", events.getAllEvents);

// Get events associated to a user using the user id (uid) - Used in the dashboard
router.get("/user/:uid", events.getEventsByUserId);

// Get boughtEvents associated to a user using the user id (uid) - Used in the dashboard
router.get("/boughtEvents/user/:uid", events.getBoughtEventsByUserId);

// Get a specific event by the eventid (eid) - Used in the details page of the event. Whenever an event is clicked
// also used to get details for an event before updating it
router.get("/:eid", events.getEventById);

router.use(checkAuth);

// creating a boughtEvent array of the user
router.post("/:uid", events.boughtEvent);

// creating an event - Used in the dashbaord / menu
router.post(
  "/",
  upload.single("image"),
  [
    check("title").not().isEmpty(),
    check("description").isLength({ min: 5 }),
    check("organizer").not().isEmpty(),
    check("category").not().isEmpty(),
    check("province").not().isEmpty(),
    check("address").not().isEmpty(),
    check("startTime").not().isEmpty(),
    check("endTime").not().isEmpty(),
    check("date").not().isEmpty(),
    check("price").not().isEmpty(),
  ],
  events.createEvent
);

// updating the event - used in dashbaord
router.patch(
  "/:eid",
  [
    check("title").not().isEmpty(),
    check("description").isLength({ min: 5 }),
    check("organizer").not().isEmpty(),
    check("category").not().isEmpty(),
    check("province").not().isEmpty(),
    check("address").not().isEmpty(),
    check("date").not().isEmpty(),
    check("startTime").not().isEmpty(),
    check("endTime").not().isEmpty(),
    check("price").not().isEmpty(),
  ],
  events.updateEvent
);

router.delete("/:eid", events.deleteEvent);

module.exports = router;
