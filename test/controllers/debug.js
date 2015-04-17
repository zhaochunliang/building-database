var _ = require("lodash");
var proxyquire = require("proxyquire");

var chai = require("chai");
var sinon = require("sinon");
var sinonChai = require("sinon-chai");
var expect = chai.expect;
chai.use(sinonChai);

var mongooseStub = require("../mongoose-helper");
var expressStub = require("../express-helper");

// Models
var Building;

// Controllers
var debug;

var buildingData = require("../building-data");
var buildingModel = require("../building-model");

var config = require("../config");

var sandbox;
beforeEach(function (done) {
  sandbox = sinon.sandbox.create();
  done();
});

afterEach(function (done) {
  sandbox.restore();
  done();
});

before(function(done) {
  done();
});

after(function(done) {
  done();
});

// TODO: Test for Mongo / Express error responses
describe("getDebug()", function () {
  before(function(done) {
    Building = require("../../models/building");
    debug = proxyquire("../../controllers/debug", {
      "../config/configProxy": config
    })();
    done();
  });

  it("exists", function(done) {
    expect(debug.getDebug).to.exist;
    done();
  });

  it("renders view", function(done) {
    // Increase default timeout due to NPM API
    // TODO: Stub NPM API
    this.timeout(6000);

    var req = expressStub.req();
    var res = expressStub.res();

    res.render = function(path, data) {
      expect(path).to.exist;
      expect(path).to.equal("debug");
      expect(data).to.exist;
      expect(data.git).to.exist;
      expect(data.node).to.exist;
      expect(data.npm).to.exist;
      done();
    };

    res.sendStatus = function(status) {
      expect.fail();
      done();
    };

    debug.getDebug(req, res);
  });
});

// TODO: Test for Mongo / Express error responses
describe("getPing()", function () {
  before(function(done) {
    Building = require("../../models/building");
    debug = proxyquire("../../controllers/debug", {
      "../config/configProxy": config
    })();
    done();
  });

  it("exists", function(done) {
    expect(debug.getPing).to.exist;
    done();
  });

  it("renders view", function(done) {
    var req = expressStub.req();
    var res = expressStub.res();

    var findRes = mongooseStub.model([_.first(buildingData)]);
    sandbox.stub(Building, "find").returns(mongooseStub.query(findRes));

    res.send = function(data) {
      expect(data).to.exist;
      done();
    };

    res.sendStatus = function(status) {
      expect.fail();
      done();
    };

    debug.getPing(req, res);
  });
});
