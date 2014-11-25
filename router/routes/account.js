module.exports = function (passport) {
  var express = require("express");
  var router = express.Router();
  
  var accountController = require("../../controllers/account")(passport);

  router.route("/login")
    .get(accountController.getLogin)
    .post(accountController.postLogin);

  var isAuthenticated = function (req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }

    res.redirect("/login");
  }

  return router;
};