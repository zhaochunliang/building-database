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
  slug: {
    id: String,
    name: String
  },
  batch: {
    id: String,
    buildingRef: String
  },
  creator: {
    name: String,
    url: String
  },
  method: String,
  description: String,
  location: {
    type: { type: String },
    coordinates: [{ type: Number }, { type: Number }]
  },
  locality: {
    countryCode: String,
    country: String,
    district: String
  },
  nominatim: {},
  scale: Number,
  angle: { type: Number, default: 0 },
  structure: {
    vertices: { type: Number, default: 0 },
    faces: { type: Number, default: 0 }
  },
  models: {
    raw: [ModelSchema],
    zip: [ModelSchema]
  },
  osm: {
    type: { type: String },
    id: Number
  },
  userId: String,
  stats: {
    downloads: {type: Number, default: 0},
    views: {type: Number, default: 0}
  },
  highlight: {type: Boolean, default: false},
  hidden: {type: Boolean, default: false},
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

BuildingSchema.plugin(require("mongoose-paginate"));

module.exports = mongoose.model("Building", BuildingSchema);
