module.exports = function (app, passport) {
  var account = require("./routes/account")(passport);
  // var api = require("./routes/api")(passport);

  app.use("/account", account);
  // app.use("/api", api);
};

// var express = require("express");
// var router = express.Router();

// var Building = require("../models/building");

// var isAuthenticated = function (req, res, next) {
//   // If user is authenticated in the session, call the next() to call the next request handler 
//   // Passport adds this method to request object. A middleware is allowed to add properties to request and response objects
//   if (req.isAuthenticated())
//     return next();
//   // If the user is not authenticated then redirect them to the login page
//   res.redirect("/login");
// }

// module.exports = function(passport){
//   /* GET index page */
//   router.get("/", isAuthenticated, function(req, res) {
//     res.render("index", { user: req.user });
//   });

//   /* GET login page */
//   router.get("/login", function(req, res) {
//     // Display the Login page with any flash message, if any
//     res.render("login", { message: req.flash("message") });
//   });

//   /* Handle Login POST */
//   router.post("/login", passport.authenticate("login", {
//     successRedirect: "/",
//     failureRedirect: "/login",
//     failureFlash : true  
//   }));

//   /* GET Registration page */
//   router.get("/signup", function(req, res){
//     res.render("register",{message: req.flash("message")});
//   });

//   /* Handle Registration POST */
//   router.post("/signup", passport.authenticate("signup", {
//     successRedirect: "/",
//     failureRedirect: "/signup",
//     failureFlash : true  
//   }));

//   /* Handle Logout */
//   router.get("/signout", function(req, res) {
//     req.logout();
//     res.redirect("/");
//   });

//   router.get("/add", isAuthenticated, function(req, res) {
//     res.render("add");
//   });

//   router.post("/add", isAuthenticated, function(req, res) {
//     // TODO: Perform validation on received data

//     var building = new Building();

//     building.name = "Testing";
//     building.location = {
//       type : "Point",
//       coordinates : [51, 0]
//     };

//     building.save(function(err) {
//       if (err) {
//         res.send(err);
//       }

//       res.json({message: "Building added", data: building});
//     });
//   });

//   return router;
// };