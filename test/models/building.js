var _ = require("lodash");

var chai = require("chai");
var sinon = require("sinon");
var sinonChai = require("sinon-chai");
var expect = chai.expect;
chai.use(sinonChai);

var mongoose = require("mongoose");
var mockgoose = require("mockgoose");

mockgoose(mongoose);
mongoose.connect("mongodb://localhost:27017/test-db");

var Building = require("../../models/building");

var buildingData = {
  name: "Some building",
  method: "handmade"
};

var sandbox;
beforeEach(function (done) {
  sandbox = sinon.sandbox.create();

  mockgoose.reset();

  // Add sample building data
  Building.create(buildingData, function(err, building) {
    if (err) {
      expect.fail();
      done();
    }

    done();
  });
});

afterEach(function (done) {
  sandbox.restore();
  done();
});

before(function(done) {
  done();
});

after(function(done) {
  mockgoose.reset();
  done();
});

// TODO: Test for Express error responses
describe("Schema checks", function () {
  it("adds provided values", function(done) {
    Building.findOne({}, function(err, building) {
      expect(building).to.exist;
      expect(building._id).to.exist;
      expect(typeof building.name).to.equal("string");
      expect(building.name).to.equal(buildingData.name);
      expect(typeof building.method).to.equal("string");
      expect(building.method).to.equal(buildingData.method);
      done();
    });
  });

  it("sets expected defaults", function(done) {
    Building.findOne({}, function(err, building) {
      expect(typeof building.createdAt).to.equal("object");
      expect(typeof building.updatedAt).to.equal("object");
      expect(typeof building.angle).to.equal("number");
      expect(building.angle).to.equal(0);
      expect(typeof building.structure.vertices).to.equal("number");
      expect(building.structure.vertices).to.equal(0);
      expect(typeof building.structure.faces).to.equal("number");
      expect(building.structure.faces).to.equal(0);
      expect(typeof building.stats.downloads).to.equal("number");
      expect(building.stats.downloads).to.equal(0);
      expect(typeof building.stats.views).to.equal("number");
      expect(building.stats.views).to.equal(0);
      expect(typeof building.highlight).to.equal("boolean");
      expect(building.highlight).to.equal(false);
      expect(typeof building.hidden).to.equal("boolean");
      expect(building.hidden).to.equal(false);
      done();
    });
  });
});
