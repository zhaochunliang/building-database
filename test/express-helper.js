var _ = require("lodash");
var sinon = require("sinon");

var express = {};

express.req = function(req) {
  var defaultReq = {
    body: {},
    flash: sinon.spy(),
    login: function(user, callback) {
      callback(null);
    },
    logout: sinon.spy(),
    params: {},
    query: {},
    session: {},
    user: {
      _id: 123
    }
  };

  return _.defaults(req || {}, defaultReq);
};

// TODO: Clean up spy after each use
express.res = function(res) {
  var defaultRes = {
    header: sinon.spy(),
    set: sinon.spy()
  };

  return _.defaults(res || {}, defaultRes);
};

express.next = function() {
  return this;
};

module.exports = express;
