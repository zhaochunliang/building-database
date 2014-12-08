var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var ModelSchema = new Schema({
  type: String,
  path: String
});

var BuildingSchema = new Schema({
  id: String,
  name: String,
  location: {
    type: { type: String },
    coordinates: []
  },
  models: [ModelSchema],
  userId: String,
  createdAt: Date,
  updatedAt: Date
});

BuildingSchema.pre("save", function(next) {
  var now = new Date();
  this.updatedAt = now;
  if (!this.createdAt) {
    this.createdAt = now;
  }
  next();
});

module.exports = mongoose.model("Building", BuildingSchema);