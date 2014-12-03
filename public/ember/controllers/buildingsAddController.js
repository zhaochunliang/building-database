App.BuildingsAddController = Ember.ObjectController.extend({
  actions: {
    save: function() {
      var self = this;
      
      // Avoid Ember Data and save manually due to mis-mitch between building model (which expects converted files)
      // TODO: Redirect to building page on completed upload so data store is refreshed
      // TODO: Surely there's a better way to handle auth on a application level

      console.log("Save building");

      // var files = fileInput.files;
      // var file = files[0];

      $.ajax({
        url: "/api/buildings",
        type: "POST",
        error: function(xhr, exception) {
          if (xhr.status === 401) {
            // Invalidate session and redirect to login
            self.send("invalidateSession");
          }
        }
      });

      // // just before saving, we set the creationDate
      // // this.get("model").set("creationDate", new Date());

      // Create a record and save it to the store
      // var newBuilding = this.store.createRecord("building", this.get("model"));
      // newBuilding.save();

      // // redirects to the building itself
      // this.transitionToRoute("building", newBuilding);
    }
  }
});