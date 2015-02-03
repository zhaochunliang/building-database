var express = require("express");
var router = express.Router();

module.exports = function (passport) {
  var authController = require("../../controllers/auth")(passport);
  var adminController = require("../../controllers/admin")(passport);
  
  router.route("/admin")
    .get(authController.isAuthenticated, authController.needsGroup("admin"), adminController.getAdmin);

  router.route("/admin/buildings")
    .get(authController.isAuthenticated, authController.needsGroup("admin"), adminController.getBuildings);

  router.route("/admin/users")
    .get(authController.isAuthenticated, authController.needsGroup("admin"), adminController.getUsers);

  router.route("/admin/user/:username")
    .get(authController.isAuthenticated, authController.needsGroup("admin"), adminController.getUser)
    .post(authController.isAuthenticated, authController.needsGroup("admin"), adminController.postUser);

  return router;
};