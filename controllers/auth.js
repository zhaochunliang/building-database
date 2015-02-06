var debug = require("debug")("polygoncity");
var LocalStrategy = require("passport-local").Strategy;
var bCrypt = require("bcrypt-nodejs");
var async = require("async");
var crypto = require("crypto");
var nodemailer = require("nodemailer");
var gravatar = require("gravatar");

var config = require("../config/config.js");

var User = require("../models/user");

module.exports = function(passport) {
  // Serialize and deserialize users
  // Required for persistent login sessions
  passport.serializeUser(function(user, done) {
    // debug("Serializing user: ", user);
    done(null, user._id);
  });

  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      // debug("Deserializing user: ", user);
      done(err, user);
    });
  });

  passport.use("login", new LocalStrategy({
      passReqToCallback : true
    },
    function(req, username, password, done) { 
      // check in mongo if a user with username exists or not
      User.findOne({ $and: [{"username": username}, {"verified": true}]}, 
        function(err, user) {
          // In case of any error, return using the done method
          if (err)
            return done(err);
          // Username does not exist, log the error and redirect back
          if (!user){
            debug("User not found with username "+username);
            return done(null, false, req.flash("message", "User not found"));                 
          }
          // User exists but wrong password, log the error 
          if (!isValidPassword(user, password)){
            debug("Invalid Password");
              return done(null, false, req.flash("message", "Incorrect password"));
              // redirect back to login page
            }
          // User and password both match, return user from done method
          // which will be treated like success
          return done(null, user);
        }
      );
    }
  ));

  passport.use("signup", new LocalStrategy({
      passReqToCallback : true // allows us to pass back the entire request to the callback
    },
    function(req, username, password, done) {
      findOrCreateUser = function() {
        // Find a user in Mongo with provided email
        User.findOne({ $or: [{"email": req.param("email")}, {"username": req.param("username")}] }, function(err, user) {
          // In case of any error, return using the done method
          if (err){
            debug("Error in signup: "+err);
            return done(err);
          }
          // Already exists
          if (user) {
            debug("User already exists: "+username);
            return done(null, false, req.flash("message","A user already exists with that email or username"));
          } else {
            // If there is no user with that email
            // create the user
            var newUser = new User();

            // Set the user"s local credentials
            newUser.username = username;
            newUser.password = createHash(password);
            newUser.email = req.param("email");

            if (req.param("website")) {
              newUser.website = req.param("website");
            }

            if (req.param("twitter")) {
              newUser.twitter = req.param("twitter");
            }

            // Get gravatar
            var grav = gravatar.url(req.param("email"));
            newUser.gravatar = grav;

            // Initially unverified
            newUser.verified = false;

            async.waterfall([
              function(asyncDone) {
                // Generate verify token
                crypto.randomBytes(20, function(err, buf) {
                  var token = buf.toString("hex");
                  asyncDone(err, token);
                });
              }, function(token, asyncDone) {
                // Store verify token
                newUser.verifiedToken = token;
                asyncDone(null, token);
              }, function(token, asyncDone) {
                // Save the user
                newUser.save(function(err) {
                  asyncDone(err, token);
                });
              }, function(token, asyncDone) {
                // Send verify email
                
                // Skip if email hasn't been set up
                if (!config.email.verify.fromAddress) {
                  debug("Email verify.fromAddress not found in configuration");
                  asyncDone("Email verify.fromAddress not found in configuration");
                  return;
                }

                // TODO: Move to an external service for email
                // - https://github.com/andris9/Nodemailer
                var smtpTransport = nodemailer.createTransport();

                var mailOptions = {
                  to: newUser.email,
                  from: config.email.verify.fromAddress,
                  subject: (config.email.verify.subject) ? config.email.verify.subject : "Please verify your account",
                  text: "You are receiving this because an account has been registered using this email address and requires verification before it can be used.\n\n" +
                    "Please click on the following link, or paste this into your browser to complete the verification process:\n\n" +
                    "http://" + req.headers.host + "/verify/" + token + "\n\n" +
                    "If you did not request this, please ignore this email.\n"
                };
                
                smtpTransport.sendMail(mailOptions, function(err) {
                  // var err = null; // Fake err
                  req.flash("message", "A verification link has been sent by e-mail to " + newUser.email + ".");
                  asyncDone(err, newUser);
                });
              }
            ], function(err) {
              if (!err) {
                done(null, newUser);
                return;
              }

              debug("Error in saving user: " + err);
              throw err;
            });
          }
        });
      };

      // Delay the execution of findOrCreateUser and execute the method
      // in the next tick of the event loop
      process.nextTick(findOrCreateUser);
    })
  );

  var isAuthenticated = function (req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }
    
    // Send 403 on AJAX
    if (req.xhr) {
      // TODO: Should this be a 401?
      // http://en.wikipedia.org/wiki/List_of_HTTP_status_codes#4xx_Client_Error
      res.sendStatus(403);
      return;
    // Else, redirect to login
    } else {
      req.session.returnTo = req.path;
      res.redirect("/login");
      return;
    }
  };

  var isValidPassword = function(user, password){
    return bCrypt.compareSync(password, user.password);
  };

  var createHash = function(password) {
    return bCrypt.hashSync(password, bCrypt.genSaltSync(10), null);
  };

  var needsGroup = function(group) {
    return function(req, res, next) {
      if (req.user && req.user.group === group) {
        next();
      } else {
        res.sendStatus(403);
      }
    };
  };

  return {
    isAuthenticated: isAuthenticated,
    needsGroup: needsGroup,
    createHash: createHash
  };
};