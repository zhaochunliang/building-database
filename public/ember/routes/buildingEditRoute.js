App.BuildingEditRoute = Ember.Route.extend({
  model: function(){
    return this.modelFor("building");
  }
});