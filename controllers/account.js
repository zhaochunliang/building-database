var debug = require("debug")("polygoncity");
var async = require("async");
var crypto = require("crypto");
var nodemailer = require("nodemailer");
var smtpTransport = require("nodemailer-smtp-transport");
var gravatar = require("gravatar");

var config = require("../config/configProxy");

var User = require("../models/user");

module.exports = function (passport) {
  var authController = require("./auth")(passport);

  // Endpoint /login for GET
  var getLogin = function(req, res) {
    res.render("login", {
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
    res.render("register", {
      bodyId: "register",
      message: req.flash("message")
    });
  };

  // Endpoint /signup for POST
  var postSignup = function(req, res, next) {
    passport.authenticate("signup", {
      successRedirect: "/signup",
      failureRedirect: "/signup",
      failureFlash: true
    })(req, res, next);
  };

  // Endpoint /verify for GET
  var getVerify = function(req, res) {
    User.findOne({verifiedToken: req.params.token}, function(err, user) {
      if (!user) {
        req.flash("message", "Verification token not valid.");
        return res.redirect("/signup");
      }

      // User wants to change their email
      if (user.changeEmail) {
        user.email = user.changeEmail;
        user.changeEmail = undefined;

        // Update Gravatar
        var grav = gravatar.url(user.email);
        user.gravatar = grav;
      }

      // Clear the token now it has been used
      user.verifiedToken = undefined;

      // Verified will be false if the user has just signed up
      // Verified will be true is the user is changing their email
      if (!user.verified) {
        user.verified = true;
      }

      user.save(function(err) {
        if (err) {
          debug(err);
          req.flash("message", "Failed to update your verification status.");
          return res.redirect("/signup");
        }

        req.flash("message", "Account verified.");

        req.login(user, function(err) {
          return res.redirect("/");
        });
      });
    });
  };

  // Endpoint /forgot for GET
  var getForgot = function(req, res) {
    res.render("forgot", {
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
          if (err) {
            done(err);
            return;
          }

          var token = buf.toString("hex");
          done(null, token);
        });
      },
      function(token, done) {
        User.findOne({$and: [{ email: req.body.email }, {"verified": true}, {"banned": false}]}, function(err, user) {
          if (!user) {
            // TODO: Should probably change this as to not reveal users with an account in the system
            req.flash("message", "No account with that email address exists.");
            return res.redirect("/forgot");
          }

          user.resetPasswordToken = token;
          user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

          user.save(function(err) {
            if (err) {
              done(err);
              return;
            }

            done(null, token, user);
          });
        });
      },
      function(token, user, done) {
        // Skip if email hasn't been set up
        if (!config.email.reset.fromAddress) {
          done(new Error("Email reset.fromAddress not found in configuration"));
          return;
        }

        // TODO: Move to an external service for email
        // - https://github.com/andris9/Nodemailer
        if (!config.email.smtp) {
          done(new Error("SMTP options not found in configuration"));
          return;
        }

        var transport = nodemailer.createTransport(smtpTransport(config.email.smtp));

        var mailOptions = {
          to: user.email,
          from: config.email.reset.fromAddress,
          subject: (config.email.reset.subject) ? config.email.reset.subject : "Password reset",
          text: "You are receiving this because a password reset has been requested for your account.\n\n" +
            "Please click on the following link, or paste this into your browser to complete the process:\n\n" +
            (config.siteURL || "http://" + req.headers.host) + "/reset/" + token + "\n\n" +
            "If you did not request this, please ignore this email and your password will remain unchanged.\n"
        };
        transport.sendMail(mailOptions, function(err) {
          if (err) {
            done(err);
            return;
          }

          req.flash("message", "An e-mail has been sent to " + user.email + " with further instructions.");

          done();
        });
      }
    ], function(err) {
      // TODO: Throw error?
      if (err) {
        debug(err);
        return next(err);
      }

      res.redirect("/forgot");
    });
  };

  // Endpoint /reset/:token for GET
  var getReset = function(req, res) {
    User.findOne({ $and: [{resetPasswordToken: req.params.token}, {resetPasswordExpires: { $gt: Date.now() } }]}, function(err, user) {
      if (err) {
        debug(err);
        req.flash("message", "Unable to retreive your details.");
        return res.redirect("/forgot");
      }

      if (!user) {
        req.flash("message", "Password reset token is invalid or has expired.");
        return res.redirect("/forgot");
      }

      res.render("reset", {
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
        User.findOne({ $and: [{resetPasswordToken: req.params.token}, {resetPasswordExpires: { $gt: Date.now() } }]}, function(err, user) {
          if (err) {
            debug(err);
            req.flash("message", "Unable to retreive your details");
            return res.redirect("/reset/" + req.params.token);
          }

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
            if (err) {
              done(err);
              return;
            }

            req.login(user, function(err) {
              if (err) {
                done(err);
                return;
              }

              done(null, user);
            });
          });
        });
      },
      function(user, done) {
        // Skip if email hasn't been set up
        if (!config.email.reset.fromAddress) {
          done(new Error("Email reset.fromAddress not found in configuration"));
          return;
        }

        var transport = nodemailer.createTransport(smtpTransport(config.email.smtp));

        var mailOptions = {
          to: user.email,
          from: config.email.reset.fromAddress,
          subject: (config.email.reset.subject) ? config.email.reset.subject : "Password reset",
          text: "Hello,\n\n" +
            "This is a confirmation that the password for your account " + user.email + " has been changed.\n"
        };
        transport.sendMail(mailOptions, function(err) {
          if (err) {
            debug("Unable to send email via SMTP server. Is it running?");
            req.flash("message", "Unable to send reset email, please try again later.");
            done(err);
            return;
          }

          req.flash("message", "Success! Your password has been changed.");

          done(null);
        });
      }
    ], function(err) {
      // TODO: Throw error?
      debug(err);

      res.redirect("/");
    });
  };

  return {
    getLogin: getLogin,
    postLogin: postLogin,
    getLogout: getLogout,
    getSignup: getSignup,
    postSignup: postSignup,
    getVerify: getVerify,
    getForgot: getForgot,
    postForgot: postForgot,
    getReset: getReset,
    postReset: postReset
  };
};
