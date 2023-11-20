const mongoose = require("mongoose");

const Schema = mongoose.Schema;

// creation of Event Schema
const EventSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  organizer: { type: String, required: true },
  category: { type: String, required: true },
  province: { type: String, required: true },
  date: { type: String, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  image: {
    url: { type: String, required: true },
    filename: { type: String },
  },
  address: { type: String, required: true },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  price: { type: Number, required: true },
  // Associating a user model to the event model using reference Id
  creator: { type: Schema.Types.ObjectId, required: true, ref: "User" },
});

const Event = mongoose.model("Event", EventSchema);

module.exports = Event;
