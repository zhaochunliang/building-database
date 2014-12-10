module.exports = function (passport) {
  // Endpoint /login for GET
  var getLogin = function(req, res) {
    res.render("login", {
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
    res.render("register", { message: req.flash("message") });
  };

  // Endpoint /signup for POST
  var postSignup = function(req, res, next) {
    passport.authenticate("signup", {
      successRedirect: "/",
      failureRedirect: "/signup",
      failureFlash: true  
    })(req, res, next);
  };

  return {
    getLogin: getLogin,
    postLogin: postLogin,
    getSignup: getSignup,
    postSignup: postSignup,
    getLogout: getLogout
  };
};