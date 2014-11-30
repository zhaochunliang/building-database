App.BuildingsAddController = Ember.ObjectController.extend({
  actions: {
    save: function(){
      // just before saving, we set the creationDate
      // this.get("model").set("creationDate", new Date());

      // create a record and save it to the store
      var newBuilding = this.store.createRecord("building", this.get("model"));
      newBuilding.save();

      // redirects to the building itself
      this.transitionToRoute("building", newBuilding);
    }
  }
});