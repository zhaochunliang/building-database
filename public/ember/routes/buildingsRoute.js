App.BuildingsRoute = Ember.Route.extend({
  model: function() {
    return this.store.find("building");
  }
});