const mongoose = require("mongoose");

// for a unique email
const uniqueValidator = require("mongoose-unique-validator");

const Schema = mongoose.Schema;

const UserSchema = new Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, minlength: 8 },
  // Associating a smartPlate model to the user model using reference Id
  // it is put on an array to signify multi events can be owned by a user
  smartPlate: [
    { type: Schema.Types.ObjectId, required: true, ref: "SmartPlate" },
  ],
});

// to query email in the schema and create a unique email
UserSchema.plugin(uniqueValidator);

const User = mongoose.model("User", UserSchema);
module.exports = User;
