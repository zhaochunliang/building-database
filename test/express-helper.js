var _ = require("lodash");
var sinon = require("sinon");

var express = {};

express.req = function(req) {
  var defaultReq = {
    body: {},
    params: {},
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

module.exports = express;