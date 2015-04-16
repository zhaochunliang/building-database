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
var BuildingReport = require("../../models/building-report");

var buildingData = {
  name: "Some building"
};

var buildingReportData = {
  reason: "license",
  details: "The license was wrong",
  email: "someperson@polygon.city"
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

    // Add sample report data
    buildingReportData.building = building._id;
    BuildingReport.create(buildingReportData, function(err, report) {
      done();
    });
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
// TODO: Fix building population – doesn't work here for some reason
describe("Schema checks", function () {
  it("adds provided values", function(done) {
    BuildingReport.findOne({}).populate("building").exec(function(err, report) {
      expect(report).to.exist;
      expect(report._id).to.exist;
      // expect(report.building._id).to.exist;
      expect(typeof report.reason).to.equal("string");
      expect(report.reason).to.equal(buildingReportData.reason);
      expect(typeof report.details).to.equal("string");
      expect(report.details).to.equal(buildingReportData.details);
      expect(typeof report.email).to.equal("string");
      expect(report.email).to.equal(buildingReportData.email);
      done();
    });
  });

  it("sets expected defaults", function(done) {
    BuildingReport.findOne({}, function(err, report) {
      expect(typeof report.createdAt).to.equal("object");
      expect(typeof report.updatedAt).to.equal("object");
      done();
    });
  });
});
