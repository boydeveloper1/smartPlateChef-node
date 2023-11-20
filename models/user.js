const mongoose = require("mongoose");

// for a unique email
const uniqueValidator = require("mongoose-unique-validator");

const Schema = mongoose.Schema;

const UserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, minlength: 8 },
  image: {
    url: { type: String, required: true },
    filename: { type: String },
  },
  // Associating a event model to the user model using reference Id
  // it is put on an array to signify multi events can be owned by a user
  events: [{ type: Schema.Types.ObjectId, required: true, ref: "Event" }],
  boughtEvents: [
    { type: Schema.Types.ObjectId, required: true, ref: "BoughtEvent" },
  ],
});

// to query email in the schema and create a unique email
UserSchema.plugin(uniqueValidator);

const User = mongoose.model("User", UserSchema);
module.exports = User;
