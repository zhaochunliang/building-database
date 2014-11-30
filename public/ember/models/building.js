App.Building = DS.Model.extend({
  name: DS.attr("string")
});

// Sample data
App.Building.reopenClass({
  FIXTURES: [{
    id: 1,
    name: "The Shard"
  }, {
    id: 2,
    name: "One Canada Square"
  }]
});