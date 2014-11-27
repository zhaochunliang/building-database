var express = require("express");
var router = express.Router();
  
module.exports = function (passport) {
  var authController = require("../../controllers/auth")(passport);
  var siteController = require("../../controllers/site")(passport);

  router.route("/")
    .get(siteController.getIndex);

  router.route("/browse")
    .get(siteController.getBrowse);

  router.route("/search")
    .get(siteController.getSearch);
  
  router.route("/add")
    .get(authController.isAuthenticated, siteController.getAdd);

  return router;
};