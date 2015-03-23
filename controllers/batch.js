var debug = require("debug")("polygoncity");
var UUID = require("uuid");

var Building = require("../models/building");

module.exports = function (passport) {
  // Endpoint /api/batch/id for GET
  var getBatchID = function(req, res) {
    res.json({id: UUID.v4()});
  };

  // Endpoint /api/batch/:batch_id for GET
  var getBatch = function(req, res) {
    var columns = {
      "_id": 1,
      "name": 1,
      "batch": 1,
      "location": 1
    };

    Building.find({"batch.id": req.params.batch_id}, columns, function(err, buildings) {
      if (err) {
        debug(err);
        res.json({message: "Failed to retrieve buildings."});
        return;
      }

      // TODO: Split buildings by ones added successfully and ones uploaded but without a location set
      res.json(buildings);
    });
  };

  return {
    getBatchID: getBatchID,
    getBatch: getBatch
  };
};