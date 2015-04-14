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
var batch;

var buildingData = require("../building-data");

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

// TODO: Test for Express error responses
describe("getBatchID()", function () {
  before(function(done) {
    batch = require("../../controllers/batch")();
    done();
  });

  it("exists", function(done) {
    expect(batch.getBatchID).to.exist;
    done();
  });

  it("returns batch ID", function(done) {
    var req = expressStub.req();
    var res = expressStub.res();

    res.json = function(data) {
      expect(data).to.exist;
      expect(data.id).to.exist;
      done();
    };

    batch.getBatchID(req, res);
  });
});

// TODO: Test for Mongo / Express error responses
describe("getBatch()", function () {
  before(function(done) {
    Building = require("../../models/building");
    batch = require("../../controllers/batch")();
    done();
  });

  it("exists", function(done) {
    expect(batch.getBatch).to.exist;
    done();
  });

  it("returns buildings in batch", function(done) {
    var req = expressStub.req();
    var res = expressStub.res();

    var findRes = mongooseStub.model(buildingData);
    sandbox.stub(Building, "find").yields(null, findRes);

    res.json = function(data) {
      expect(data).to.exist;
      expect(data.message).to.not.exist;
      expect(data).to.equal(buildingData);
      done();
    };

    batch.getBatch(req, res);
  });
});
