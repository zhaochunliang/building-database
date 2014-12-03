module.exports = function (passport) {
  // Endpoint /login for POST
  var postLogin = function(req, res, next) {
    // Tweaked so redirect doesn't confuse Ember
    passport.authenticate("login", function(err, user, info) {
      if (err) { return res.sendStatus(401, "User is not authorized"); }
      if (!user) { return res.sendStatus(401, "User is not authorized"); }
      req.login(user, function(err) {
        if (err) { return res.sendStatus(401, "User is not authorized"); }
        return res.json({user: [user]});
      });
    })(req, res, next);

    // passport.authenticate("login", {
    //   successRedirect: req.session.returnTo || "/",
    //   failureRedirect: "/login",
    //   failureFlash: true  
    // })(req, res, next);
  };

  // Endpoint /logout for GET
  var getLogout = function(req, res, next) {
    req.logout();
    // Redirect automatically occurs in Ember on sessionInvalidationSucceeded
    // res.redirect("/");
    res.sendStatus(200);
  };

  // Endpoint /signup for POST
  // TODO: Are 401 errors appropriate here?
  var postSignup = function(req, res, next) {
    passport.authenticate("signup", function(err, user, info) {
      if (err) { return res.sendStatus(401, "User is not authorized"); }
      if (!user) { return res.sendStatus(401, "User is not authorized"); }
      req.login(user, function(err) {
        if (err) { return res.sendStatus(401, "User is not authorized"); }
        return res.json({user: [user]});
      });
    })(req, res, next);
    // passport.authenticate("signup", {
    //   successRedirect: "/",
    //   failureRedirect: "/signup",
    //   failureFlash: true  
    // })(req, res, next);
  };

  return {
    postLogin: postLogin,
    postSignup: postSignup,
    getLogout: getLogout
  };
};