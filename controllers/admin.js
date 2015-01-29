var config = require("../config/config.js");

var User = require("../models/user");

module.exports = function (passport) {
  var authController = require("./auth")(passport);

  // Endpoint /admin for GET
  var getAdmin = function(req, res) {
    res.render("admin", {
      bodyId: "admin",
      user: req.user
    });
  };

  return {
    getAdmin: getAdmin
  };
};