var express = require("express");
var router = express.Router();

module.exports = function (passport) {
  var authController = require("../../controllers/auth")(passport);
  var buildingController = require("../../controllers/building")(passport);

  router.route("/buildings")
    .get(buildingController.getBuildings)
    .post(authController.isAuthenticated, buildingController.postBuildings);

  router.route("/building/:building_id")
    .get(buildingController.getBuilding);

  return router;
};