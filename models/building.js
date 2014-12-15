var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var ModelSchema = new Schema({
  type: String,
  path: String,
  fileSize: { type: Number, default: 0 }
});

var BuildingSchema = new Schema({
  id: String,
  name: String,
  location: {
    type: { type: String },
    coordinates: [{ type: Number }, { type: Number }]
  },
  scale: { type: Number, default: 1 },
  angle: { type: Number, default: 0 },
  structure: {
    vertices: { type: Number, default: 0 },
    faces: { type: Number, default: 0 }
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