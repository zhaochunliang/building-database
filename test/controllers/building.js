// TODO: Make it so an existing, populated database isn't required
// - https://github.com/mccormicka/Mockgoose
// - http://blog.jeffryhesse.com/test-driven-development-in-sails-js-with-mongoose-mocha-and-chai/
// TODO: Is it worth testing private methods too, or just the public interface?
// TODO: Mock S3
// - https://github.com/jsantell/mock-s3
// TODO: Create a helper function for Express req/res stubs

var _ = require("lodash");

var chai = require("chai");
var sinon = require("sinon");
var sinonChai = require("sinon-chai");
var expect = chai.expect;
chai.use(sinonChai);

var mongooseStub = require("../mongoose-helper");
var expressStub = require("../express-helper");

// Models
var Building = require("../../models/building");

// Could overload S3 and others using proxyquire
var building = require("../../controllers/building")();
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

// TODO: Need sample buildings to request from the database
// TODO: Test for Mongo / Express error responses
describe("getBuildings()", function () {
  it("exists", function(done) {
    expect(building.getBuildings).to.exist;
    done();
  });

  it("returns valid buildings response", function(done) {
    var req = expressStub.req();
    var res = expressStub.res();

    var findRes = mongooseStub.model(buildingData);
    sandbox.stub(Building, "find").returns(mongooseStub.query(findRes));

    // TODO: Validate response data
    res.json = function(data) {
      expect(data).to.exist;
      done();
    };

    building.getBuildings(req, res);
  });
});

// TODO: Work out how to test this without polluting database or S3
describe("postBuildings()", function () {
  it("exists", function(done) {
    expect(building.postBuildings).to.exist;
    done();
  });
});

// TODO: Work out how to test this without polluting database
// TODO: Test for Mongo / Express error responses
describe("putBuildings()", function () {
  it("exists", function(done) {
    expect(building.putBuildings).to.exist;
    done();
  });

  it("successfully saves building changes", function(done) {
    var req = expressStub.req({
      params: {
        building_id: 123
      }
    });

    var res = expressStub.res();

    var findOneRes = mongooseStub.model(_.first(buildingData));
    sandbox.stub(Building, "findOne").yields(null, findOneRes);

    res.send = function(err) {
      expect(err).to.not.exist;
      done();
    };

    res.sendStatus = function(status) {
      expect(status).to.not.exist;
      done();
    };

    // TODO: Validate response data is set to changes in req
    res.json = function(data) {
      expect(data).to.exist;
      done();
    };

    building.putBuildings(req, res);
  });
});

// TODO: Need sample buildings to request from the database
// TODO: Test for Mongo / Express error responses
describe("getBuildingsBbox()", function () {
  it("exists", function(done) {
    expect(building.getBuildingsBbox).to.exist;
    done();
  });

  it("returns valid buildings response", function(done) {
    var req = expressStub.req();
    var res = expressStub.res();

    var findRes = mongooseStub.model(_.take(buildingData, 10));
    sandbox.stub(Building, "find").returns(mongooseStub.query(findRes));

    // TODO: Handle KML response
    res.send = function(err) {
      expect(err).to.not.exist;
      done();
    };

    // TODO: Validate response data is corrent
    res.json = function(data) {
      expect(data).to.exist;
      done();
    };

    building.getBuildingsBbox(req, res);
  });
});

// TODO: Need sample buildings to request from the database
// TODO: Test for Mongo / Express error responses
describe("getBuildingsNear()", function () {
  it("exists", function(done) {
    expect(building.getBuildingsNear).to.exist;
    done();
  });

  it("returns valid buildings response", function(done) {
    var req = expressStub.req();
    var res = expressStub.res();

    var findRes = mongooseStub.model(_.take(buildingData, 10));
    sandbox.stub(Building, "find").returns(mongooseStub.query(findRes));

    // TODO: Validate response data is corrent
    res.json = function(data) {
      expect(data).to.exist;
      done();
    };

    building.getBuildingsNear(req, res);
  });
});

// TODO: Need sample buildings to request from the database
// TODO: Test for Mongo / Express error responses
describe("getBuildingsTile()", function () {
  it("exists", function(done) {
    expect(building.getBuildingsTile).to.exist;
    done();
  });

  it("returns valid buildings response", function(done) {
    var req = expressStub.req();
    var res = expressStub.res();

    var findRes = mongooseStub.model(_.take(buildingData, 10));
    sandbox.stub(Building, "find").returns(mongooseStub.query(findRes));

    // TODO: Validate response data is corrent
    res.json = function(data) {
      expect(data).to.exist;
      done();
    };

    building.getBuildingsNear(req, res);
  });
});

// TODO: Need sample buildings to request from the database
// TODO: Test for Mongo / Express error responses
describe("getBuilding()", function () {
  it("exists", function(done) {
    expect(building.getBuilding).to.exist;
    done();
  });

  it("returns valid building response", function(done) {
    var req = expressStub.req();
    var res = expressStub.res();

    var findRes = mongooseStub.model(_.first(buildingData));
    sandbox.stub(Building, "findOne").yields(null, findRes);

    // TODO: Validate response data is corrent
    res.json = function(data) {
      expect(data).to.exist;
      done();
    };

    building.getBuilding(req, res);
  });
});

// TODO: Need sample buildings to request from the database
// TODO: Test for Mongo / Express error responses
describe("getBuildingDownload()", function () {
  it("exists", function(done) {
    expect(building.getBuildingDownload).to.exist;
    done();
  });

  it("redirects to building download link", function(done) {
    var selectedBuilding = _.first(buildingData);

    var req = expressStub.req({
      params: {
        building_id: selectedBuilding._id,
        file_type: "zip",
        model_type: "dae"
      }
    });

    var res = expressStub.res();

    var findRes = mongooseStub.model(selectedBuilding);

    sandbox.stub(Building, "findOne").yields(null, findRes);

    res.send = function(err) {
      expect(err).to.not.exist;
      done();
    };

    res.sendStatus = function(status) {
      expect(status).to.not.exist;
      done();
    };

    // TODO: Validate path is corrent
    res.redirect = function(path) {
      expect(path).to.exist;
      done();
    };

    building.getBuildingDownload(req, res);
  });
});

// TODO: Need sample buildings to request from the database
// TODO: Test for Mongo / Express error responses
describe("getBuildingKML()", function () {
  it("exists", function(done) {
    expect(building.getBuildingKML).to.exist;
    done();
  });

  it("returns a valid KML response", function(done) {
    var selectedBuilding = _.first(buildingData);

    var req = expressStub.req({
      params: {
        building_id: selectedBuilding._id
      }
    });

    var res = expressStub.res();

    var findRes = mongooseStub.model(selectedBuilding);

    sandbox.stub(Building, "findOne").yields(null, findRes);

    // TODO: Validate returned data and response header
    res.send = function(data) {
      expect(data).to.exist;
      done();
    };

    res.sendStatus = function(status) {
      expect(status).to.not.exist;
      done();
    };

    building.getBuildingKML(req, res);
  });
});