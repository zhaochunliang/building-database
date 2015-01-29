var express = require("express");
var router = express.Router();

module.exports = function (passport) {
  var authController = require("../../controllers/auth")(passport);
  var adminController = require("../../controllers/admin")(passport);
  
  // Add authentication for specific admin users
  router.route("/admin")
    .get(authController.isAuthenticated, authController.needsGroup("admin"), adminController.getAdmin);

  return router;
};