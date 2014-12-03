App.BuildingsAddRoute = Ember.Route.extend(SimpleAuth.AuthenticatedRouteMixin, {
  model: function(){
    // the model for this route is a new empty Ember.Object
    return Em.Object.create({});
  },
});