var express = require("express");
var router = express.Router();

module.exports = function (passport) {
  var authController = require("../../controllers/auth")(passport);
  var buildingController = require("../../controllers/building")(passport);
  var batchController = require("../../controllers/batch")(passport);

  router.route("/batch/id")
    .get(authController.isAuthenticated, batchController.getBatchID);

  router.route("/batch/:batch_id")
    .get(authController.isAuthenticated, batchController.getBatch);

  router.route("/buildings")
    .get(buildingController.getBuildings)
    .post(authController.isAuthenticated, buildingController.postBuildings)

  router.route("/buildings/bbox/:west,:south,:east,:north")
    .get(buildingController.getBuildingsBbox);

  router.route("/buildings/bbox/:west,:south,:east,:north/:kml")
    .get(buildingController.getBuildingsBbox);

  router.route("/buildings/near/:lon,:lat,:distance")
    .get(buildingController.getBuildingsNear);

  router.route("/buildings/tile/:x,:y,:z")
    .get(buildingController.getBuildingsTile);

  router.route("/building/:building_id/download/:file_type/:model_type")
    .get(buildingController.getBuildingDownload);

  router.route("/building/:building_id.kml")
    .get(buildingController.getBuildingKML);

  router.route("/building/:building_id")
    .get(buildingController.getBuilding)
    .put(authController.isAuthenticated, buildingController.putBuildings);

  return router;
};