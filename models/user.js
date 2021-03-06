var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var UserSchema = new Schema({
  id: String,
  username: String,
  password: String,
  group: String,
  banned: {type: Boolean, default: false},
  email: String,
  gravatar: String,
  website: String,
  twitter: String,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  changeEmail: String,
  verified: {type: Boolean, default: false},
  verifiedToken: String,
  createdAt: Date,
  updatedAt: Date
});

UserSchema.pre("save", function(next) {
  var now = new Date();
  this.updatedAt = now;
  if (!this.createdAt) {
    this.createdAt = now;
  }
  next();
});

UserSchema.plugin(require("mongoose-paginate"));

module.exports = mongoose.model("User", UserSchema);