var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var Building = require("./building");

var BuildingReportSchema = new Schema({
  id: String,
  building: {type: Schema.Types.ObjectId, ref: "Building"},
  reason: String,
  details: String,
  email: String,
  createdAt: Date,
  updatedAt: Date
});

BuildingReportSchema.pre("save", function(next) {
  var now = new Date();
  this.updatedAt = now;
  if (!this.createdAt) {
    this.createdAt = now;
  }
  next();
});

BuildingReportSchema.plugin(require("mongoose-paginate"));

module.exports = mongoose.model("BuildingReport", BuildingReportSchema);