module.exports = function (app, passport) {
  var site = require("./routes/site")(passport);
  var account = require("./routes/account")(passport);
  var admin = require("./routes/admin")(passport);
  var api = require("./routes/api")(passport);

  // General site routes
  app.use("/", site);

  // Account routes
  app.use("/", account);

  // Admin routes
  app.use("/", admin);

  // API routes
  app.use("/api", api);
};