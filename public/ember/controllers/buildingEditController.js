App.BuildingEditController = Ember.ObjectController.extend({
  actions: {
    save: function(){
      var building = this.get("model");
      // this will tell Ember-Data to save/persist the new record
      building.save();
      // then transition to the current building
      this.transitionToRoute("building", building);
    }
  }
});