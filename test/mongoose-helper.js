var _ = require("lodash");

var mongoose = {};

mongoose.model = function(model) {
  var defaultModel = {
    save: function(callback) {
      callback(null, this);
    }
  };

  return _.defaults(model || {}, defaultModel);
};

mongoose.query = function(data) {
  return {
    equals: function () {
      return this;
    },
    exec: function (callback) {
      callback(null, data);
    },
    limit: function () {
      return this;
    },
    sort: function () {
      return this;
    },
    where: function () {
      return this;
    }
  };
};

module.exports = mongoose;