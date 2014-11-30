App.BuildingsAddRoute = Ember.Route.extend({
  model: function(){
    // the model for this route is a new empty Ember.Object
    return Em.Object.create({});
  },

  // in this case (the create route), we can reuse the building/edit template
  // associated with the buildingsAddController
  renderTemplate: function(){
    this.render("building.edit", {
      controller: "buildingsAdd"
    });
  }
});