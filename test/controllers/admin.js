var _ = require("lodash");
var proxyquire = require("proxyquire");

var chai = require("chai");
var sinon = require("sinon");
var sinonChai = require("sinon-chai");
var expect = chai.expect;
chai.use(sinonChai);

var passport = require("passport");

var mongooseStub = require("../mongoose-helper");
var expressStub = require("../express-helper");

// Models
var Building;
var BuildingReport;
var User;

// Controllers
var admin;

var buildingData = require("../building-data");
var buildingModel = require("../building-model");

var buildingReportData = require("../building-report-data");
var buildingReportModel = require("../building-report-model");

var userData = require("../user-data");
var userModel = require("../user-model");

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
describe("getAdmin()", function () {
  before(function(done) {
    admin = require("../../controllers/admin")(passport);
    done();
  });

  it("exists", function(done) {
    expect(admin.getAdmin).to.exist;
    done();
  });

  it("renders view", function(done) {
    var req = expressStub.req();
    var res = expressStub.res();

    res.render = function(view, data) {
      expect(view).to.exist;
      expect(view).to.equal("admin");
      expect(data.bodyId).to.exist;
      expect(data.bodyId).to.equal("admin");
      done();
    };

    admin.getAdmin(req, res);
  });
});

// TODO: Test for Mongo / Express error responses
describe("getBuildings()", function () {
  var selectedBuildings;

  before(function(done) {
    selectedBuildings = _.take(buildingData, 10);
    admin = proxyquire("../../controllers/admin", {
      "../models/building": buildingModel(selectedBuildings)
    })(passport);
    done();
  });

  it("exists", function(done) {
    expect(admin.getBuildings).to.exist;
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
      expect(view).to.equal("admin-buildings");
      expect(data.bodyId).to.exist;
      expect(data.bodyId).to.equal("admin-buildings");
      expect(data.buildings).to.exist;
      expect(data.buildings).to.equal(selectedBuildings);
      expect(data.sort).to.exist;
      expect(data.pageCount).to.exist;
      done();
    };

    admin.getBuildings(req, res);
  });
});

// TODO: Test for Mongo / Express error responses
describe("getBuilding()", function () {
  before(function(done) {
    Building = require("../../models/building");
    admin = require("../../controllers/admin")(passport);
    done();
  });

  it("exists", function(done) {
    expect(admin.getBuilding).to.exist;
    done();
  });

  it("renders view", function(done) {
    var selectedBuilding = _.first(buildingData);
    var originalViews = selectedBuilding.stats.views;

    var req = expressStub.req();
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
      expect(view).to.equal("admin-building");
      expect(data.bodyId).to.exist;
      expect(data.bodyId).to.equal("admin-building");
      expect(data.building).to.exist;
      expect(data.building).to.equal(selectedBuilding);
      done();
    };

    admin.getBuilding(req, res);
  });
});

// TODO: Test for Mongo / Express error responses
describe("getBuildingReports()", function () {
  var selectedReports;

  before(function(done) {
    selectedReports = _.take(buildingReportData, 10);
    admin = proxyquire("../../controllers/admin", {
      "../models/building-report": buildingReportModel(selectedReports)
    })(passport);
    done();
  });

  it("exists", function(done) {
    expect(admin.getBuildingReports).to.exist;
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
      expect(view).to.equal("admin-building-reports");
      expect(data.bodyId).to.exist;
      expect(data.bodyId).to.equal("admin-building-reports");
      expect(data.reports).to.exist;
      expect(data.reports).to.equal(selectedReports);
      expect(data.sort).to.exist;
      expect(data.pageCount).to.exist;
      done();
    };

    admin.getBuildingReports(req, res);
  });
});

// TODO: Test for Mongo / Express error responses
describe("getUsers()", function () {
  var selectedUsers;

  before(function(done) {
    selectedUsers = _.take(userData, 10);
    admin = proxyquire("../../controllers/admin", {
      "../models/user": userModel(selectedUsers)
    })(passport);
    done();
  });

  it("exists", function(done) {
    expect(admin.getUsers).to.exist;
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
      expect(view).to.equal("admin-users");
      expect(data.bodyId).to.exist;
      expect(data.bodyId).to.equal("admin-users");
      expect(data.siteUsers).to.exist;
      expect(data.siteUsers).to.equal(selectedUsers);
      expect(data.sort).to.exist;
      expect(data.pageCount).to.exist;
      done();
    };

    admin.getUsers(req, res);
  });
});

// TODO: Test for Mongo / Express error responses
describe("getUser()", function () {
  before(function(done) {
    User = require("../../models/user.js");
    admin = require("../../controllers/admin")(passport);
    done();
  });

  it("exists", function(done) {
    expect(admin.getUser).to.exist;
    done();
  });

  it("renders view", function(done) {
    var req = expressStub.req({
      params: {
        username: "Example"
      }
    });

    var res = expressStub.res();

    var selectedUser = _.first(userData);
    var originalUser = _.clone(selectedUser);

    var findRes = mongooseStub.model(selectedUser);
    sandbox.stub(User, "findOne").yields(null, findRes);

    res.sendStatus = function(status) {
      expect.fail();
      done();
    };

    res.render = function(view, data) {
      expect(view).to.exist;
      expect(view).to.equal("admin-user");
      expect(data.bodyId).to.exist;
      expect(data.bodyId).to.equal("admin-user");
      expect(data.profile).to.exist;
      expect(data.profile.id).to.equal(originalUser._id);
      expect(data.profile.username).to.equal(originalUser.username);
      expect(data.profile.twitter).to.equal(originalUser.twitter);
      expect(data.profile.website).to.equal(originalUser.website);
      done();
    };

    admin.getUser(req, res);
  });

  it("returns 404 if no user exists", function(done) {
    var req = expressStub.req({
      params: {
        username: "Example"
      }
    });

    var res = expressStub.res();

    sandbox.stub(User, "findOne").yields(null, null);

    res.sendStatus = function(status) {
      expect(status).to.equal(404);
      done();
    };

    res.render = function(view, data) {
      expect.fail();
      done();
    };

    admin.getUser(req, res);
  });
});

// TODO: Test for Mongo / Express error responses
describe("postUser()", function () {
  before(function(done) {
    User = require("../../models/user.js");
    admin = require("../../controllers/admin")(passport);
    done();
  });

  it("exists", function(done) {
    expect(admin.postUser).to.exist;
    done();
  });

  it("do nothing if no changes are requested", function(done) {
    var req = expressStub.req();
    var res = expressStub.res();

    var selectedUser = _.first(userData);
    var originalUser = _.clone(selectedUser);

    var findRes = mongooseStub.model(selectedUser);
    sandbox.stub(User, "findOne").yields(null, findRes);

    res.sendStatus = function(status) {
      expect.fail();
      done();
    };

    res.render = function(view, data) {
      expect(view).to.exist;
      expect(view).to.equal("admin-user");
      expect(data.bodyId).to.exist;
      expect(data.bodyId).to.equal("admin-user");
      expect(data.profile).to.exist;
      expect(data.profile.id).to.equal(originalUser._id);
      expect(data.profile.username).to.equal(originalUser.username);
      expect(data.profile.twitter).to.equal(originalUser.twitter);
      expect(data.profile.website).to.equal(originalUser.website);
      done();
    };

    admin.postUser(req, res);
  });

  it("update user with changes", function(done) {
    var req = expressStub.req();
    var res = expressStub.res();

    var selectedUser = _.first(userData);
    var originalUser = _.clone(selectedUser);

    selectedUser.twitter = "otherexample";
    selectedUser.website = "http://somenewwebsite.com";

    var findRes = mongooseStub.model(selectedUser);
    sandbox.stub(User, "findOne").yields(null, findRes);

    res.sendStatus = function(status) {
      expect.fail();
      done();
    };

    res.render = function(view, data) {
      expect(view).to.exist;
      expect(view).to.equal("admin-user");
      expect(data.bodyId).to.exist;
      expect(data.bodyId).to.equal("admin-user");
      expect(data.profile).to.exist;
      expect(data.profile.id).to.equal(originalUser._id);
      expect(data.profile.username).to.equal(originalUser.username);
      expect(data.profile.twitter).to.not.equal(originalUser.twitter);
      expect(data.profile.website).to.not.equal(originalUser.website);
      expect(req.flash).to.be.calledWith("message");
      done();
    };

    admin.postUser(req, res);
  });

  it("returns 404 if no user exists", function(done) {
    var req = expressStub.req({
      params: {
        username: "Example"
      }
    });

    var res = expressStub.res();

    sandbox.stub(User, "findOne").yields(null, null);

    res.sendStatus = function(status) {
      expect(status).to.equal(404);
      done();
    };

    res.render = function(view, data) {
      expect.fail();
      done();
    };

    admin.getUser(req, res);
  });
});
