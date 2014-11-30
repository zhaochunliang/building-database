App.BuildingController = Ember.ObjectController.extend({
  deleteMode: false,

  actions: {
    edit: function() {
      this.transitionToRoute("building.edit");
    },
    delete: function() {
      // our delete method now only toggles deleteMode"s value
      this.toggleProperty("deleteMode");
    },
    cancelDelete: function(){
      // set deleteMode back to false
      this.set("deleteMode", false);
    },
    confirmDelete: function(){
      // this tells Ember-Data to delete the current user
      this.get("model").deleteRecord();
      this.get("model").save();
      // and then go to the buildings route
      this.transitionToRoute("buildings");
      // set deleteMode back to false
      this.set("deleteMode", false);
    }
  }
});