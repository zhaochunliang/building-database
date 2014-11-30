App.BuildingRoute = Ember.Route.extend({
  model: function(params) {
    return this.store.find("building", params.building_id);
  }
});