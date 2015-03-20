var debug = require("debug")("polygoncity");
var UUID = require("uuid");

var Building = require("../models/building");

module.exports = function (passport) {
  // Endpoint /api/batch/id for GET
  var getBatchID = function(req, res) {
    res.json({id: UUID.v4()});
  };

  // Endpoint /api/batch/status/:batch_id for GET
  var getBatchStatus = function(req, res) {
    Building.find({"batch.id": req.params.batch_id}, function(err, buildings) {
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
    getBatchStatus: getBatchStatus
  };
};