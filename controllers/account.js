module.exports = function (passport) {
  // Endpoint /account/login for GET
  var getLogin = function(req, res) {
    res.render("login", { message: req.flash("message") });
  };

  // Endpoint /account/login for POST
  var postLogin = function(req, res, next) {
    passport.authenticate("login", {
      successRedirect: "/",
      failureRedirect: "/account/login",
      failureFlash : true  
    })(req, res, next);
  };

  return {
    getLogin: getLogin,
    postLogin: postLogin
  };
};