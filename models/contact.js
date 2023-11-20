const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const UserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  message: { type: String, required: true },
});

// to query email in the schema and create a unique email

const Contact = mongoose.model("Contact", UserSchema);
module.exports = Contact;
