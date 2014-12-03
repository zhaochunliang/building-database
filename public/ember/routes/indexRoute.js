App.IndexRoute = Ember.Route.extend({
  model: function() {
    return Ember.RSVP.hash({
      buildings: this.store.find("building")
    });
  }
});