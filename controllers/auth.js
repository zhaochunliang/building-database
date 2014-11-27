var debug = require("debug")("buidingDatabase");
var LocalStrategy = require("passport-local").Strategy;
var bCrypt = require("bcrypt-nodejs");

var User = require("../models/user");

module.exports = function(passport) {
  // Serialize and deserialize users
  // Required for persistent login sessions
  passport.serializeUser(function(user, done) {
    debug("Serializing user: ", user);
    done(null, user._id);
  });

  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      debug("Deserializing user: ", user);
      done(err, user);
    });
  });

  passport.use("login", new LocalStrategy({
      passReqToCallback : true
    },
    function(req, username, password, done) { 
      // check in mongo if a user with username exists or not
      User.findOne({ "username" :  username }, 
        function(err, user) {
          // In case of any error, return using the done method
          if (err)
            return done(err);
          // Username does not exist, log the error and redirect back
          if (!user){
            debug("User Not Found with username "+username);
            return done(null, false, req.flash("message", "User Not found."));                 
          }
          // User exists but wrong password, log the error 
          if (!isValidPassword(user, password)){
            debug("Invalid Password");
              return done(null, false, req.flash("message", "Invalid Password"));
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
        // find a user in Mongo with provided username
        User.findOne({ "username" :  username }, function(err, user) {
          // In case of any error, return using the done method
          if (err){
            debug("Error in SignUp: "+err);
            return done(err);
          }
          // already exists
          if (user) {
            debug("User already exists with username: "+username);
            return done(null, false, req.flash("message","User Already Exists"));
          } else {
            // if there is no user with that email
            // create the user
            var newUser = new User();

            // set the user"s local credentials
            newUser.username = username;
            newUser.password = createHash(password);
            newUser.email = req.param("email");

            // save the user
            newUser.save(function(err) {
              if (err){
                debug("Error in Saving user: "+err);  
                throw err;  
              }
              debug("User Registration succesful");    
              return done(null, newUser);
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

    req.session.returnTo = req.path;
    res.redirect("/login");
  };

  var isValidPassword = function(user, password){
    return bCrypt.compareSync(password, user.password);
  };

  var createHash = function(password) {
    return bCrypt.hashSync(password, bCrypt.genSaltSync(10), null);
  };

  return {
    isAuthenticated: isAuthenticated
  };
};