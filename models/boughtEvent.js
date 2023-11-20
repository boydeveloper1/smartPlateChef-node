const mongoose = require("mongoose");

const Schema = mongoose.Schema;

// creation of Event Schema:
const BoughtEventSchema = new Schema({
  quantity: { type: String, required: true },
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
  price: { type: Number, required: true },
  address: { type: String, required: true },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  // Associating a user model to the boughtevent model using reference Id
  //   the users that have created the ticket
  creator: { type: Schema.Types.ObjectId, required: true, ref: "User" },
  userThatBought: {
    type: String,
    required: true,
  },
  eventId: { type: Schema.Types.ObjectId, required: true, ref: "Event" },
});

const BoughtEvent = mongoose.model("BoughtEvent", BoughtEventSchema);
module.exports = BoughtEvent;
