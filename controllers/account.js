var async = require("async");
var crypto = require("crypto");
var nodemailer = require("nodemailer");

var config = require("../config/config.js");

var User = require("../models/user");

module.exports = function (passport) {
  var authController = require("./auth")(passport);

  // Endpoint /login for GET
  var getLogin = function(req, res) {
    res.render("login_new", {
      bodyId: "login",
      message: req.flash("message"),
      user: req.user
    });
  };

  // Endpoint /login for POST
  var postLogin = function(req, res, next) {
    passport.authenticate("login", {
      successRedirect: req.session.returnTo || "/",
      failureRedirect: "/login",
      failureFlash: true  
    })(req, res, next);
  };

  // Endpoint /logout for GET
  var getLogout = function(req, res, next) {
    req.logout();
    res.redirect("/");
  };

  // Endpoint /signup for GET
  var getSignup = function(req, res) {
    res.render("register_new", {
      bodyId: "register",
      message: req.flash("message")
    });
  };

  // Endpoint /signup for POST
  var postSignup = function(req, res, next) {
    passport.authenticate("signup", {
      successRedirect: "/",
      failureRedirect: "/signup",
      failureFlash: true  
    })(req, res, next);
  };

  // Endpoint /forgot for GET
  var getForgot = function(req, res) {
    res.render("forgot_new", {
      bodyId: "forgot",
      message: req.flash("message"),
      user: req.user
    });
  };

  // Endpoint /forgot for POST
  var postForgot = function(req, res, next) {
    async.waterfall([
      function(done) {
        crypto.randomBytes(20, function(err, buf) {
          var token = buf.toString("hex");
          done(err, token);
        });
      },
      function(token, done) {
        User.findOne({ email: req.body.email }, function(err, user) {
          if (!user) {
            // TODO: Should probably change this as to not reveal users with an account in the system
            req.flash("message", "No account with that email address exists.");
            return res.redirect("/forgot");
          }

          user.resetPasswordToken = token;
          user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

          user.save(function(err) {
            done(err, token, user);
          });
        });
      },
      function(token, user, done) {
        // Skip if email hasn't been set up
        if (!config.email.reset.fromAddress) {
          debug("Email reset.fromAddress not found in configuration");
          done();
          return;
        }

        // TODO: Move to an external service for email
        // - https://github.com/andris9/Nodemailer
        var smtpTransport = nodemailer.createTransport();

        var mailOptions = {
          to: user.email,
          from: config.email.reset.fromAddress,
          subject: (config.email.reset.subject) ? config.email.reset.subject : "Password reset",
          text: "You are receiving this because a password reset has been requested for your account.\n\n" +
            "Please click on the following link, or paste this into your browser to complete the process:\n\n" +
            "http://" + req.headers.host + "/reset/" + token + "\n\n" +
            "If you did not request this, please ignore this email and your password will remain unchanged.\n"
        };
        smtpTransport.sendMail(mailOptions, function(err) {
          // var err = null; // Fake err
          req.flash("message", "An e-mail has been sent to " + user.email + " with further instructions.");
          done(err, "done");
        });
      }
    ], function(err) {
      if (err) return next(err);
      res.redirect("/forgot");
    });
  };

  // Endpoint /reset/:token for GET
  var getReset = function(req, res) {
    User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
      if (!user) {
        req.flash("message", "Password reset token is invalid or has expired.");
        return res.redirect("/forgot");
      }
      res.render("reset_new", {
        bodyId: "reset",
        token: req.params.token,
        message: req.flash("message"),
        user: req.user
      });
    });
  };

  // Endpoint /reset/:token for POST
  var postReset = function(req, res) {
    async.waterfall([
      function(done) {
        User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
          if (!user) {
            req.flash("message", "Password reset token is invalid or has expired.");
            return res.redirect("/reset/" + req.params.token);
          }

          // Check passwords match
          if (req.body.password !== req.body.confirm) {
            req.flash("message", "Passwords do not match.");
            return res.redirect("/reset/" + req.params.token);
          }

          user.password = authController.createHash(req.body.password);
          user.resetPasswordToken = undefined;
          user.resetPasswordExpires = undefined;

          user.save(function(err) {
            req.login(user, function(err) {
              done(err, user);
            });
          });
        });
      },
      function(user, done) {
        // Skip if email hasn't been set up
        if (!config.email.reset.fromAddress) {
          debug("Email reset.fromAddress not found in configuration");
          done();
          return;
        }

        // TODO: Move to an external service for email
        // - https://github.com/andris9/Nodemailer
        var smtpTransport = nodemailer.createTransport();

        var mailOptions = {
          to: user.email,
          from: config.email.reset.fromAddress,
          subject: (config.email.reset.subject) ? config.email.reset.subject : "Password reset",
          text: "Hello,\n\n" +
            "This is a confirmation that the password for your account " + user.email + " has been changed.\n"
        };
        smtpTransport.sendMail(mailOptions, function(err) {
          req.flash("message", "Success! Your password has been changed.");
          done(err);
        });
      }
    ], function(err) {
      res.redirect("/");
    });
  };

  return {
    getLogin: getLogin,
    postLogin: postLogin,
    getLogout: getLogout,
    getSignup: getSignup,
    postSignup: postSignup,
    getForgot: getForgot,
    postForgot: postForgot,
    getReset: getReset,
    postReset: postReset
  };
};