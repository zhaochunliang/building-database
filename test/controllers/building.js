// TODO: Clean up the Mongoose stubbing
// TODO: Make the example building model easier to update

var _ = require("lodash");
var proxyquire = require("proxyquire");
var Q = require("q");

var fs = require("fs-extra");
var rimraf = require("rimraf");

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
var building;

var buildingData = require("../building-data");
var buildingModel = require("../building-model");

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
describe("getBuildings()", function () {
  before(function(done) {
    Building = require("../../models/building");
    building = require("../../controllers/building")();
    done();
  });

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

// TODO: Test for Mongo / Express error responses
describe("postBuildings()", function () {
  before(function(done) {
    building = proxyquire("../../controllers/building", {
      "../models/building": buildingModel,
      "aws-sdk": {
        S3: function() {
          return {
            upload: function(options) {
              return {
                on: function() {
                  return this;
                },
                send: function(callback) {
                  var data = {
                    Location: options.Key
                  };

                  callback(null, data);
                }
              };
            }
          };
        }
      },
      "model-converter": {
        convert: function(inputPath, outputPath) {
          var deferred = Q.defer();

          var outputExt = outputPath.split(".").pop();

          fs.copy(__dirname + "/../files/postBuildings/example." + outputExt, __dirname + "/../files/tmp/example/example." + outputExt, function(err) {
            if (err) {
              deferred.reject(err);
              return;
            }

            deferred.resolve(outputPath);
          });

          return deferred.promise;
        }
      },
    })();

    // Set up and move files
    fs.copy(__dirname + "/../files/postBuildings/example.dae", __dirname + "/../files/tmp/example.dae", function(err) {
      if (err) {
        expect.fail();
        return;
      }

      done();
    });
  });

  after(function(done) {
    // Clean up files if not already cleaned
    rimraf(__dirname + "/../files/tmp", function(err) {
      if (err) {
        expect.fail();
        return;
      }

      done();
    });
  });

  it("exists", function(done) {
    expect(building.postBuildings).to.exist;
    done();
  });

  it("successfully adds a building", function(done) {
    var req = expressStub.req({
      body: {
        name: "example-building",
        method: "handmade"
      },
      files: {
        model: {
          path: __dirname + "/../files/tmp/example.dae",
          extension: "dae"
        }
      }
    });

    var res = expressStub.res();

    // TODO: Validate response data
    res.json = function(data) {
      expect(data).to.exist;
      expect(data.error).to.not.exist;
      done();
    };

    building.postBuildings(req, res);
  });
});

// TODO: Test for Mongo / Express error responses
describe("putBuildings()", function () {
  before(function(done) {
    Building = require("../../models/building");
    building = require("../../controllers/building")();
    done();
  });

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

// TODO: Test for Mongo / Express error responses
describe("getBuildingsBbox()", function () {
  before(function(done) {
    Building = require("../../models/building");
    building = require("../../controllers/building")();
    done();
  });

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

// TODO: Test for Mongo / Express error responses
describe("getBuildingsNear()", function () {
  before(function(done) {
    Building = require("../../models/building");
    building = require("../../controllers/building")();
    done();
  });

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

// TODO: Test for Mongo / Express error responses
describe("getBuildingsTile()", function () {
  before(function(done) {
    Building = require("../../models/building");
    building = require("../../controllers/building")();
    done();
  });

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

// TODO: Test for Mongo / Express error responses
describe("getBuilding()", function () {
  before(function(done) {
    Building = require("../../models/building");
    building = require("../../controllers/building")();
    done();
  });

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

// TODO: Test for Mongo / Express error responses
describe("getBuildingDownload()", function () {
  before(function(done) {
    Building = require("../../models/building");
    building = require("../../controllers/building")();
    done();
  });

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

// TODO: Test for Mongo / Express error responses
describe("getBuildingKML()", function () {
  before(function(done) {
    Building = require("../../models/building");
    building = require("../../controllers/building")();
    done();
  });

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