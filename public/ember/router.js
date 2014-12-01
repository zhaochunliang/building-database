App.Router.map(function() {
  this.resource("buildings", function() {
    this.resource("building", { path:"/:building_id" }, function() {
      this.route("edit");
    });
    this.route("add");
  });

  this.route("login");
  this.route("signup");
});