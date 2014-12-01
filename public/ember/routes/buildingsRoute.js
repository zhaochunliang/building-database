App.BuildingsRoute = Ember.Route.extend(SimpleAuth.AuthenticatedRouteMixin, {
  model: function() {
    return this.store.find("building");
  }
});