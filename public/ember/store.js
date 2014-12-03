// App.ApplicationAdapter = DS.FixtureAdapter;

// Serialise ID from REST response, otherwise Ember reports it as null
// http://stackoverflow.com/questions/16392258/adding-new-ember-js-objects-records-when-db-provides-id
App.ApplicationSerializer = DS.RESTSerializer.extend({
  primaryKey: "_id"
});

App.ApplicationAdapter = DS.RESTAdapter.extend({
  namespace: "api",
  primaryKey: "_id"
});