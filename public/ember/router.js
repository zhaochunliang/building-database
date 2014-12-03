App.Router.map(function() {
  this.resource("buildings", function() {
    this.resource("building", { path:"/:building_id" });
    this.route("add");
  });

  this.route("login");
  this.route("signup");
});