var _ = require("lodash");
var proxyquire = require("proxyquire");

var chai = require("chai");
var sinon = require("sinon");
var sinonChai = require("sinon-chai");
var expect = chai.expect;
chai.use(sinonChai);

var mongooseStub = require("../mongoose-helper");
var expressStub = require("../express-helper");
var nodemailerStub = require("../nodemailer-helper");

// Models
var Building;
var BuildingReport;
var User;

// Controllers
var site;

var buildingData = require("../building-data");
var buildingModel = require("../building-model");

var buildingReportModel = require("../building-report-model");

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
describe("getIndex()", function () {
  before(function(done) {
    Building = require("../../models/building");
    site = require("../../controllers/site")();
    done();
  });

  it("exists", function(done) {
    expect(site.getIndex).to.exist;
    done();
  });

  it("renders view", function(done) {
    var req = expressStub.req();
    var res = expressStub.res();

    var findRes = mongooseStub.model(buildingData);
    sandbox.stub(Building, "find").returns(mongooseStub.query(findRes));

    res.send = function(err) {
      expect.fail();
      done();
    };

    res.render = function(view, data) {
      expect(view).to.exist;
      expect(view).to.equal("index");
      expect(data.bodyId).to.exist;
      expect(data.bodyId).to.equal("home");
      expect(data.buildings).to.exist;
      expect(data.buildings).to.equal(buildingData);
      done();
    };

    site.getIndex(req, res);
  });
});

// TODO: Test for Mongo / Express error responses
describe("getBrowse()", function () {
  var selectedBuildings;

  before(function(done) {
    selectedBuildings = _.take(buildingData, 10);
    site = proxyquire("../../controllers/site", {
      "../models/building": buildingModel(selectedBuildings)
    })();
    done();
  });

  it("exists", function(done) {
    expect(site.getBrowse).to.exist;
    done();
  });

  it("renders view", function(done) {
    var req = expressStub.req();
    var res = expressStub.res();

    res.send = function(err) {
      expect.fail();
      done();
    };

    res.render = function(view, data) {
      expect(view).to.exist;
      expect(view).to.equal("browse");
      expect(data.bodyId).to.exist;
      expect(data.bodyId).to.equal("browse");
      expect(data.buildings).to.exist;
      expect(data.buildings).to.equal(selectedBuildings);
      expect(data.sort).to.exist;
      expect(data.pageCount).to.exist;
      done();
    };

    site.getBrowse(req, res);
  });
});

// TODO: Test for Mongo / Express error responses
describe("getBrowseAll()", function () {
  before(function(done) {
    Building = require("../../models/building");
    site = require("../../controllers/site")();
    done();
  });

  it("exists", function(done) {
    expect(site.getBrowseAll).to.exist;
    done();
  });

  it("renders view", function(done) {
    var req = expressStub.req();
    var res = expressStub.res();

    var findRes = mongooseStub.model(buildingData);
    sandbox.stub(Building, "find").yields(null, findRes);

    res.send = function(err) {
      expect.fail();
      done();
    };

    res.render = function(view, data) {
      expect(view).to.exist;
      expect(view).to.equal("browse_all");
      expect(data.bodyId).to.exist;
      expect(data.bodyId).to.equal("browse");
      expect(data.buildings).to.exist;
      expect(data.buildings).to.equal(buildingData);
      done();
    };

    site.getBrowseAll(req, res);
  });
});

// TODO: Test for Mongo / Express error responses
describe("getBuilding()", function () {
  before(function(done) {
    Building = require("../../models/building");
    User = require("../../models/user");
    site = require("../../controllers/site")();
    done();
  });

  it("exists", function(done) {
    expect(site.getBuilding).to.exist;
    done();
  });

  it("renders view", function(done) {
    var selectedBuilding = _.first(buildingData);
    var originalViews = selectedBuilding.stats.views;

    var req = expressStub.req();
    var res = expressStub.res();

    var findRes = mongooseStub.model(selectedBuilding);
    sandbox.stub(Building, "findOne").yields(null, findRes);

    var userData = {
      _id: selectedBuilding.userId,
      username: "Example"
    };

    sandbox.stub(User, "findById").yields(null, userData);

    res.send = function(err) {
      expect.fail();
      done();
    };

    res.sendStatus = function(status) {
      expect.fail();
      done();
    };

    res.render = function(view, data) {
      expect(view).to.exist;
      expect(view).to.equal("building");
      expect(data.bodyId).to.exist;
      expect(data.bodyId).to.equal("building");
      expect(data.building).to.exist;
      expect(data.building).to.equal(selectedBuilding);
      expect(data.building.stats.views).to.equal(originalViews + 1);
      expect(data.buildingUser).to.exist;
      expect(data.buildingUser.id).to.equal(userData._id);
      done();
    };

    site.getBuilding(req, res);
  });
});

// TODO: Test for Mongo / Express error responses
describe("getBuildingReport()", function () {
  before(function(done) {
    Building = require("../../models/building");
    site = require("../../controllers/site")();
    done();
  });

  it("exists", function(done) {
    expect(site.getBuildingReport).to.exist;
    done();
  });

  it("renders view", function(done) {
    var req = expressStub.req();
    var res = expressStub.res();

    res.render = function(view, data) {
      expect(view).to.exist;
      expect(view).to.equal("building-report");
      expect(data.bodyId).to.exist;
      expect(data.bodyId).to.equal("building-report");
      done();
    };

    site.getBuildingReport(req, res);
  });
});

// TODO: Test for Mongo / Express error responses
describe("postBuildingReport()", function () {
  before(function(done) {
    site = proxyquire("../../controllers/site", {
      "../models/building-report": buildingReportModel,
      "nodemailer": nodemailerStub
    })();
    done();
  });

  it("exists", function(done) {
    expect(site.postBuildingReport).to.exist;
    done();
  });

  it("successfully adds a building report", function(done) {
    var selectedBuilding = _.first(buildingData);

    var req = expressStub.req({
      body: {
        details: "A sample report.",
        email: "test@polygon.city",
        reason: "license"
      },
      params: {
        building_id: selectedBuilding._id
      }
    });

    var res = expressStub.res();

    res.send = function(err) {
      expect.fail();
      done();
    };

    res.redirect = function(path) {
      expect(path).to.exist;
      expect(path).to.equal("/report/" + selectedBuilding._id);
      expect(req.flash).to.be.calledWith("message");
      done();
    };

    site.postBuildingReport(req, res);
  });
});

// TODO: Test for Mongo / Express error responses
describe("getSearch()", function () {
  before(function(done) {
    site = require("../../controllers/site")();
    done();
  });

  it("exists", function(done) {
    expect(site.getSearch).to.exist;
    done();
  });

  it("renders view", function(done) {
    var req = expressStub.req();
    var res = expressStub.res();

    res.render = function(view, data) {
      expect(view).to.exist;
      expect(view).to.equal("search-form");
      expect(data.bodyId).to.exist;
      expect(data.bodyId).to.equal("search-form");
      done();
    };

    site.getSearch(req, res);
  });
});

// TODO: Test for Mongo / Express error responses
describe("postSearch()", function () {
  before(function(done) {
    site = require("../../controllers/site")();
    done();
  });

  it("exists", function(done) {
    expect(site.postSearch).to.exist;
    done();
  });

  it("redirects if sent from homepage", function(done) {
    var term = "Some building";

    var req = expressStub.req({
      body: {
        search: term
      }
    });

    var res = expressStub.res();

    res.redirect = function(path) {
      expect(path).to.exist;
      expect(path).to.equal("/search/" + term.toLowerCase());
      done();
    };

    site.postSearch(req, res);
  });

  it("redirects if searching by building name", function(done) {
    var term = "Some building";

    var req = expressStub.req({
      body: {
        name: term
      }
    });

    var res = expressStub.res();

    res.redirect = function(path) {
      expect(path).to.exist;
      expect(path).to.equal("/search/" + term.toLowerCase());
      done();
    };

    site.postSearch(req, res);
  });

  it("redirects if searching by location", function(done) {
    var req = expressStub.req({
      body: {
        longitude: 0.1,
        latitude: 50
      }
    });

    var res = expressStub.res();

    res.redirect = function(path) {
      expect(path).to.exist;
      expect(path).to.equal("/search/near/" + req.body.longitude + "," + req.body.latitude + ",1000");
      done();
    };

    site.postSearch(req, res);
  });

  it("redirects if searching by location (with distance)", function(done) {
    var req = expressStub.req({
      body: {
        longitude: 0.1,
        latitude: 50,
        distance: 500
      }
    });

    var res = expressStub.res();

    res.redirect = function(path) {
      expect(path).to.exist;
      expect(path).to.equal("/search/near/" + req.body.longitude + "," + req.body.latitude + "," + req.body.distance);
      done();
    };

    site.postSearch(req, res);
  });

  it("redirects to search page if no terms are found", function(done) {
    var req = expressStub.req();
    var res = expressStub.res();

    res.redirect = function(path) {
      expect(path).to.exist;
      expect(path).to.equal("/search");
      expect(req.flash).to.be.calledWith("message");
      done();
    };

    site.postSearch(req, res);
  });
});

// TODO: Test for Mongo / Express error responses
describe("getSearchNear()", function () {
  var selectedBuildings;

  before(function(done) {
    selectedBuildings = _.take(buildingData, 10);
    site = proxyquire("../../controllers/site", {
      "../models/building": buildingModel(selectedBuildings)
    })();
    done();
  });

  it("exists", function(done) {
    expect(site.getSearchNear).to.exist;
    done();
  });

  it("renders view", function(done) {
    var req = expressStub.req({
      params: {
        lon: 0.1,
        lat: 50
      }
    });

    var res = expressStub.res();

    res.render = function(view, data) {
      expect(view).to.exist;
      expect(view).to.equal("browse");
      expect(data.bodyId).to.exist;
      expect(data.bodyId).to.equal("search");
      expect(data.buildings).to.exist;
      expect(data.buildings).to.equal(selectedBuildings);
      expect(data.near[0]).to.equal(req.params.lon);
      expect(data.near[1]).to.equal(req.params.lat);
      expect(data.sort).to.exist;
      expect(data.pageCount).to.exist;
      done();
    };

    site.getSearchNear(req, res);
  });
});

// TODO: Test for Mongo / Express error responses
describe("getSearchUser()", function () {
  var selectedBuildings;

  before(function(done) {
    User = require("../../models/user");
    selectedBuildings = _.take(buildingData, 10);
    site = proxyquire("../../controllers/site", {
      "../models/building": buildingModel(selectedBuildings)
    })();
    done();
  });

  it("exists", function(done) {
    expect(site.getSearchUser).to.exist;
    done();
  });

  it("renders view", function(done) {
    var req = expressStub.req({
      params: {
        username: "someuser"
      }
    });

    var res = expressStub.res();

    var userData = {
      _id: 123,
      username: "Example"
    };

    sandbox.stub(User, "findOne").yields(null, userData);

    res.send = function(err) {
      expect.fail();
      done();
    };

    res.sendStatus = function(status) {
      expect.fail();
      done();
    };

    res.render = function(view, data) {
      expect(view).to.exist;
      expect(view).to.equal("browse");
      expect(data.bodyId).to.exist;
      expect(data.bodyId).to.equal("search");
      expect(data.buildings).to.exist;
      expect(data.buildings).to.equal(selectedBuildings);
      expect(data.sort).to.exist;
      expect(data.pageCount).to.exist;
      done();
    };

    site.getSearchUser(req, res);
  });
});

// TODO: Test for Mongo / Express error responses
describe("getSearchOSM()", function () {
  var selectedBuildings;

  before(function(done) {
    selectedBuildings = _.take(buildingData, 10);
    site = proxyquire("../../controllers/site", {
      "../models/building": buildingModel(selectedBuildings)
    })();
    done();
  });

  it("exists", function(done) {
    expect(site.getSearchOSM).to.exist;
    done();
  });

  it("renders view", function(done) {
    var req = expressStub.req({
      params: {
        osm_type: "way",
        osm_id: 123
      }
    });

    var res = expressStub.res();

    res.send = function(err) {
      expect.fail();
      done();
    };

    res.render = function(view, data) {
      expect(view).to.exist;
      expect(view).to.equal("browse");
      expect(data.bodyId).to.exist;
      expect(data.bodyId).to.equal("search");
      expect(data.buildings).to.exist;
      expect(data.buildings).to.equal(selectedBuildings);
      expect(data.sort).to.exist;
      expect(data.pageCount).to.exist;
      done();
    };

    site.getSearchOSM(req, res);
  });
});

// TODO: Test for Mongo / Express error responses
describe("getSearchTerm()", function () {
  var selectedBuildings;

  before(function(done) {
    selectedBuildings = _.take(buildingData, 10);
    site = proxyquire("../../controllers/site", {
      "../models/building": buildingModel(selectedBuildings)
    })();
    done();
  });

  it("exists", function(done) {
    expect(site.getSearchTerm).to.exist;
    done();
  });

  it("renders view", function(done) {
    var req = expressStub.req({
      params: {
        search_term: "Some building"
      }
    });

    var res = expressStub.res();

    res.send = function(err) {
      expect.fail();
      done();
    };

    res.render = function(view, data) {
      expect(view).to.exist;
      expect(view).to.equal("browse");
      expect(data.bodyId).to.exist;
      expect(data.bodyId).to.equal("search");
      expect(data.buildings).to.exist;
      expect(data.buildings).to.equal(selectedBuildings);
      expect(data.sort).to.exist;
      expect(data.pageCount).to.exist;
      done();
    };

    site.getSearchTerm(req, res);
  });
});

// TODO: Test for Mongo / Express error responses
describe("getAdd()", function () {
  before(function(done) {
    site = require("../../controllers/site")();
    done();
  });

  it("exists", function(done) {
    expect(site.getAdd).to.exist;
    done();
  });

  it("renders view", function(done) {
    var req = expressStub.req();
    var res = expressStub.res();

    res.render = function(view, data) {
      expect(view).to.exist;
      expect(view).to.equal("add");
      expect(data.bodyId).to.exist;
      expect(data.bodyId).to.equal("building-add");
      done();
    };

    site.getAdd(req, res);
  });
});

// TODO: Test for Mongo / Express error responses
describe("getAddLocation()", function () {
  before(function(done) {
    Building = require("../../models/building");
    site = require("../../controllers/site")();
    done();
  });

  it("exists", function(done) {
    expect(site.getAddLocation).to.exist;
    done();
  });

  it("renders view", function(done) {
    var selectedBuilding = _.first(buildingData);

    var req = expressStub.req({
      params: {
        building_id: 123
      }
    });

    var res = expressStub.res();

    var findRes = mongooseStub.model(selectedBuilding);
    sandbox.stub(Building, "findOne").yields(null, findRes);

    res.send = function(err) {
      expect.fail();
      done();
    };

    res.sendStatus = function(status) {
      expect.fail();
      done();
    };

    res.render = function(view, data) {
      expect(view).to.exist;
      expect(view).to.equal("add-location");
      expect(data.bodyId).to.exist;
      expect(data.bodyId).to.equal("building-add-location");
      expect(data.building).to.exist;
      expect(data.building).to.equal(selectedBuilding);
      done();
    };

    site.getAddLocation(req, res);
  });

  it("returns 403 if no building exists", function(done) {
    var req = expressStub.req({
      params: {
        building_id: 123
      }
    });

    var res = expressStub.res();

    sandbox.stub(Building, "findOne").yields(null, null);

    res.send = function(err) {
      expect.fail();
      done();
    };

    res.sendStatus = function(status) {
      expect(status).to.equal(403);
      done();
    };

    res.render = function(view, data) {
      expect.fail();
      done();
    };

    site.getAddLocation(req, res);
  });
});

// TODO: Test for Mongo / Express error responses
describe("getAddOSM()", function () {
  before(function(done) {
    Building = require("../../models/building");
    site = require("../../controllers/site")();
    done();
  });

  it("exists", function(done) {
    expect(site.getAddOSM).to.exist;
    done();
  });

  it("renders view", function(done) {
    var selectedBuilding = _.first(buildingData);

    var req = expressStub.req({
      params: {
        building_id: 123
      }
    });

    var res = expressStub.res();

    var findRes = mongooseStub.model(selectedBuilding);
    sandbox.stub(Building, "findOne").yields(null, findRes);

    res.send = function(err) {
      expect.fail();
      done();
    };

    res.sendStatus = function(status) {
      expect.fail();
      done();
    };

    res.render = function(view, data) {
      expect(view).to.exist;
      expect(view).to.equal("add-osm");
      expect(data.bodyId).to.exist;
      expect(data.bodyId).to.equal("building-add-osm");
      expect(data.building).to.exist;
      expect(data.building).to.equal(selectedBuilding);
      done();
    };

    site.getAddOSM(req, res);
  });

  it("returns 403 if no building exists", function(done) {
    var req = expressStub.req({
      params: {
        building_id: 123
      }
    });

    var res = expressStub.res();

    sandbox.stub(Building, "findOne").yields(null, null);

    res.send = function(err) {
      expect.fail();
      done();
    };

    res.sendStatus = function(status) {
      expect(status).to.equal(403);
      done();
    };

    res.render = function(view, data) {
      expect.fail();
      done();
    };

    site.getAddOSM(req, res);
  });
});

// TODO: Test for Mongo / Express error responses
describe("getUser()", function () {
  var selectedBuildings;
  before(function(done) {
    selectedBuildings = buildingData;
    Building = require("../../models/building");
    User = require("../../models/user");
    site = proxyquire("../../controllers/site", {
      "../models/building": buildingModel(selectedBuildings)
    })();
    done();
  });

  it("exists", function(done) {
    expect(site.getUser).to.exist;
    done();
  });

  it("renders view", function(done) {
    var req = expressStub.req({
      params: {
        username: "Example"
      }
    });

    var res = expressStub.res();

    var userData = {
      _id: 123,
      username: "Example",
      gravatar: "http://gravatar.com",
      twitter: "example",
      website: "http://somewebsite.com"
    };

    sandbox.stub(User, "findOne").yields(null, userData);

    res.send = function(err) {
      expect.fail();
      done();
    };

    res.sendStatus = function(status) {
      expect.fail();
      done();
    };

    res.render = function(view, data) {
      expect(view).to.exist;
      expect(view).to.equal("user");
      expect(data.bodyId).to.exist;
      expect(data.bodyId).to.equal("user");
      expect(data.buildings).to.exist;
      expect(data.buildings).to.equal(selectedBuildings);
      expect(data.profile).to.exist;
      expect(data.profile.id).to.equal(userData._id);
      expect(data.profile.username).to.equal(userData.username);
      expect(data.profile.gravatar).to.equal(userData.gravatar);
      expect(data.profile.twitter).to.equal(userData.twitter);
      expect(data.profile.website).to.equal(userData.website);
      expect(data.pageCount).to.exist;
      done();
    };

    site.getUser(req, res);
  });

  it("excludes profile if user is banned", function(done) {
    var req = expressStub.req({
      params: {
        username: "Example"
      }
    });

    var res = expressStub.res();

    var userData = {
      _id: 123,
      username: "Example",
      gravatar: "http://gravatar.com",
      twitter: "example",
      website: "http://somewebsite.com",
      banned: true
    };

    sandbox.stub(User, "findOne").yields(null, userData);

    res.send = function(err) {
      expect.fail();
      done();
    };

    res.sendStatus = function(status) {
      expect.fail();
      done();
    };

    res.render = function(view, data) {
      expect(view).to.exist;
      expect(view).to.equal("user");
      expect(data.bodyId).to.exist;
      expect(data.bodyId).to.equal("user");
      expect(data.buildings).to.not.exist;
      expect(data.profile).to.not.exist;
      expect(data.banned).to.equal(true);
      expect(data.pageCount).to.not.exist;
      done();
    };

    site.getUser(req, res);
  });

  it("returns 404 if no user exists", function(done) {
    var req = expressStub.req({
      params: {
        username: "Example"
      }
    });

    var res = expressStub.res();

    sandbox.stub(User, "findOne").yields(null, null);

    res.send = function(err) {
      expect.fail();
      done();
    };

    res.sendStatus = function(status) {
      expect(status).to.equal(404);
      done();
    };

    res.render = function(view, data) {
      expect.fail();
      done();
    };

    site.getUser(req, res);
  });
});

// TODO: Test for Mongo / Express error responses
describe("getUserEdit()", function () {
  before(function(done) {
    User = require("../../models/user");
    site = require("../../controllers/site")();
    done();
  });

  it("exists", function(done) {
    expect(site.getUserEdit).to.exist;
    done();
  });

  it("renders view", function(done) {
    var req = expressStub.req({
      params: {
        username: "Example"
      },
      user: {
        _id: 123
      }
    });

    var res = expressStub.res();

    var userData = {
      _id: 123,
      username: "Example",
      gravatar: "http://gravatar.com",
      twitter: "example",
      website: "http://somewebsite.com"
    };

    sandbox.stub(User, "findOne").yields(null, userData);

    res.send = function(err) {
      expect.fail();
      done();
    };

    res.sendStatus = function(status) {
      expect.fail();
      done();
    };

    res.render = function(view, data) {
      expect(view).to.exist;
      expect(view).to.equal("user-edit");
      expect(data.bodyId).to.exist;
      expect(data.bodyId).to.equal("user-edit");
      expect(data.profile).to.exist;
      expect(data.profile.id).to.equal(req.user._id);
      expect(data.profile.id).to.equal(userData._id);
      expect(data.profile.username).to.equal(userData.username);
      expect(data.profile.twitter).to.equal(userData.twitter);
      expect(data.profile.website).to.equal(userData.website);
      done();
    };

    site.getUserEdit(req, res);
  });

  it("returns 403 if no user exists", function(done) {
    var req = expressStub.req({
      params: {
        username: "Example"
      },
      user: {
        _id: 123
      }
    });

    var res = expressStub.res();

    sandbox.stub(User, "findOne").yields(null, null);

    res.send = function(err) {
      expect.fail();
      done();
    };

    res.sendStatus = function(status) {
      expect(status).to.equal(403);
      done();
    };

    res.render = function(view, data) {
      expect.fail();
      done();
    };

    site.getUserEdit(req, res);
  });
});

// TODO: Test for Mongo / Express error responses
describe("postUserEdit()", function () {
  before(function(done) {
    User = require("../../models/user");
    site = proxyquire("../../controllers/site", {
      "nodemailer": nodemailerStub
    })();
    done();
  });

  it("exists", function(done) {
    expect(site.postUserEdit).to.exist;
    done();
  });

  it("do nothing if no changes are requested", function(done) {
    var req = expressStub.req({
      params: {
        username: "Example"
      },
      user: {
        _id: 123
      }
    });

    var res = expressStub.res();

    var userData = {
      _id: 123,
      username: "Example",
      gravatar: "http://gravatar.com",
      twitter: "example",
      website: "http://somewebsite.com"
    };

    var findOneRes = mongooseStub.model(userData);
    sandbox.stub(User, "findOne").yields(null, findOneRes);

    res.send = function(err) {
      expect.fail();
      done();
    };

    res.sendStatus = function(status) {
      expect.fail();
      done();
    };

    res.render = function(view, data) {
      expect(view).to.exist;
      expect(view).to.equal("user-edit");
      expect(data.bodyId).to.exist;
      expect(data.bodyId).to.equal("user-edit");
      expect(data.profile).to.exist;
      expect(data.profile.id).to.equal(req.user._id);
      expect(data.profile.id).to.equal(userData._id);
      expect(data.profile.username).to.equal(userData.username);
      expect(data.profile.twitter).to.equal(userData.twitter);
      expect(data.profile.website).to.equal(userData.website);
      expect(req.flash).to.be.calledWith("message");
      done();
    };

    site.postUserEdit(req, res);
  });

  it("update user with non-email changes", function(done) {
    var req = expressStub.req({
      body: {
        twitter: "newtwitter",
        website: "http://somenewwebsite.com"
      },
      params: {
        username: "Example"
      },
      user: {
        _id: 123
      }
    });

    var res = expressStub.res();

    var userData = {
      _id: 123,
      username: "Example",
      gravatar: "http://gravatar.com",
      twitter: "example",
      website: "http://somewebsite.com"
    };

    var originalTwitter = userData.twitter;
    var originalWebsite = userData.website;

    var findOneRes = mongooseStub.model(userData);
    sandbox.stub(User, "findOne").yields(null, findOneRes);

    res.send = function(err) {
      expect.fail();
      done();
    };

    res.sendStatus = function(status) {
      expect.fail();
      done();
    };

    res.render = function(view, data) {
      expect(view).to.exist;
      expect(view).to.equal("user-edit");
      expect(data.bodyId).to.exist;
      expect(data.bodyId).to.equal("user-edit");
      expect(data.profile).to.exist;
      expect(data.profile.id).to.equal(req.user._id);
      expect(data.profile.id).to.equal(userData._id);
      expect(data.profile.username).to.equal(userData.username);
      expect(data.profile.twitter).to.not.equal(originalTwitter);
      expect(data.profile.website).to.not.equal(originalWebsite);
      expect(req.flash).to.be.calledWith("message");
      done();
    };

    site.postUserEdit(req, res);
  });

  // TODO: Fix this test
  // - Not working due to needing different User.find stub responses
  // it("update user email", function(done) {
  //   var req = expressStub.req({
  //     body: {
  //       email: "somebodyelse@polygon.city"
  //     },
  //     params: {
  //       username: "Example"
  //     },
  //     user: {
  //       _id: 123
  //     }
  //   });

  //   var res = expressStub.res();

  //   var userData = {
  //     _id: 123,
  //     email: "somebody@polygon.city",
  //     username: "Example",
  //     gravatar: "http://gravatar.com",
  //     twitter: "example",
  //     website: "http://somewebsite.com"
  //   };

  //   var originalEmail = userData.email;

  //   var findOneRes = mongooseStub.model(userData);
  //   sandbox.stub(User, "findOne").yields(null, findOneRes);

  //   res.send = function(err) {
  //     expect.fail();
  //     done();
  //   };

  //   res.sendStatus = function(status) {
  //     expect.fail();
  //     done();
  //   };

  //   res.render = function(view, data) {
  //     expect(view).to.exist;
  //     expect(view).to.equal("user-edit");
  //     expect(data.bodyId).to.exist;
  //     expect(data.bodyId).to.equal("user-edit");
  //     expect(data.profile).to.exist;
  //     expect(data.profile.id).to.equal(req.user._id);
  //     expect(data.profile.id).to.equal(userData._id);
  //     expect(data.profile.username).to.equal(userData.username);
  //     expect(data.profile.email).to.equal(originalEmail);
  //     expect(req.flash).to.be.calledWith("message", "A user already exists with that email");
  //     done();
  //   };

  //   site.postUserEdit(req, res);
  // });

  it("returns 403 if no user exists", function(done) {
    var req = expressStub.req({
      params: {
        username: "Example"
      },
      user: {
        _id: 123
      }
    });

    var res = expressStub.res();

    sandbox.stub(User, "findOne").yields(null, null);

    res.send = function(err) {
      expect.fail();
      done();
    };

    res.sendStatus = function(status) {
      expect(status).to.equal(403);
      done();
    };

    res.render = function(view, data) {
      expect.fail();
      done();
    };

    site.postUserEdit(req, res);
  });
});

// TODO: Test for Mongo / Express error responses
describe("getTerms()", function () {
  before(function(done) {
    site = require("../../controllers/site")();
    done();
  });

  it("exists", function(done) {
    expect(site.getTerms).to.exist;
    done();
  });

  it("renders view", function(done) {
    var req = expressStub.req();
    var res = expressStub.res();

    res.send = function(err) {
      expect.fail();
      done();
    };

    res.render = function(view, data) {
      expect(view).to.exist;
      expect(view).to.equal("terms");
      expect(data.bodyId).to.exist;
      expect(data.bodyId).to.equal("static-content");
      done();
    };

    site.getTerms(req, res);
  });
});

// TODO: Test for Mongo / Express error responses
describe("getContributing()", function () {
  before(function(done) {
    site = require("../../controllers/site")();
    done();
  });

  it("exists", function(done) {
    expect(site.getContributing).to.exist;
    done();
  });

  it("renders view", function(done) {
    var req = expressStub.req();
    var res = expressStub.res();

    res.send = function(err) {
      expect.fail();
      done();
    };

    res.render = function(view, data) {
      expect(view).to.exist;
      expect(view).to.equal("contributing");
      expect(data.bodyId).to.exist;
      expect(data.bodyId).to.equal("static-content");
      done();
    };

    site.getContributing(req, res);
  });
});

// TODO: Test for Mongo / Express error responses
describe("getPing()", function () {
  before(function(done) {
    Building = require("../../models/building");
    site = require("../../controllers/site")();
    done();
  });

  it("exists", function(done) {
    expect(site.getPing).to.exist;
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

    site.getPing(req, res);
  });
});
