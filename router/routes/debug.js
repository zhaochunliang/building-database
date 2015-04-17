var express = require("express");
var router = express.Router();

module.exports = function (passport) {
  var debugController = require("../../controllers/debug")(passport);

  router.route("/debug")
    .get(debugController.getDebug);

  router.route("/ping")
    .get(debugController.getPing);

  return router;
};
