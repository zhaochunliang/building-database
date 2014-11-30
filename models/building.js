var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var ModelSchema = new Schema({
  type: String,
  path: String
});

module.exports = mongoose.model("Building", {
  id: String,
  name: String,
  location: {
    type: { type: String },
    coordinates: []
  },
  models: [ModelSchema],
  userId: String
});