var mongoose = require("mongoose");

module.exports = mongoose.model("Building", {
  id: String,
  name: String,
  location: {
    type: { type: String },
    coordinates: []
  }
});