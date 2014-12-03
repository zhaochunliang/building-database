var express = require("express");
var router = express.Router();

module.exports = function (passport) {
  var accountController = require("../../controllers/account")(passport);
  
  router.route("/login")
    .post(accountController.postLogin);

  router.route("/logout")
    .get(accountController.getLogout);

  router.route("/signup")
    .post(accountController.postSignup);

  return router;
};