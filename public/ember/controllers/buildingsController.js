App.BuildingsController = Ember.ArrayController.extend({
  sortProperties: ["name"],
  sortAscending: true, // false = descending,
  buildingsCount: function() {
    return this.get("model.length");
  }.property("@each")
});