module.exports = function (app, passport) {
  var site = require("./routes/site")(passport);
  var account = require("./routes/account")(passport);
  var admin = require("./routes/admin")(passport);
  var debug = require("./routes/debug")(passport);
  var api = require("./routes/api")(passport);

  // General site routes
  app.use("/", site);

  // Account routes
  app.use("/", account);

  // Admin routes
  app.use("/", admin);

  // Debug routes
  app.use("/", debug);

  // API routes
  app.use("/api", api);
};
