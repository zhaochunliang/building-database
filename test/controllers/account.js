var _ = require("lodash");
var proxyquire = require("proxyquire").noCallThru();

var chai = require("chai");
var sinon = require("sinon");
var sinonChai = require("sinon-chai");
var expect = chai.expect;
chai.use(sinonChai);

var passport = require("passport");

var mongooseStub = require("../mongoose-helper");
var expressStub = require("../express-helper");
var nodemailerStub = require("../nodemailer-helper");

var config = require("../config");

// Models
var User;

// Controllers
var account;

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
describe("getLogin()", function () {
  before(function(done) {
    account = proxyquire("../../controllers/account", {
      "../config/configProxy": config
    })(passport);
    done();
  });

  it("exists", function(done) {
    expect(account.getLogin).to.exist;
    done();
  });

  it("renders view", function(done) {
    var req = expressStub.req();
    var res = expressStub.res();

    res.render = function(view, data) {
      expect(view).to.exist;
      expect(view).to.equal("login");
      expect(data.bodyId).to.exist;
      expect(data.bodyId).to.equal("login");
      done();
    };

    account.getLogin(req, res);
  });
});

// TODO: Test for Mongo / Express error responses
describe("postLogin()", function () {
  before(function(done) {
    account = proxyquire("../../controllers/account", {
      "../config/configProxy": config
    })(passport);
    done();
  });

  it("exists", function(done) {
    expect(account.postLogin).to.exist;
    done();
  });

  it("requests passport authentication", function(done) {
    var req = expressStub.req({
      body: {
        username: "Example",
        password: "123abc"
      },
      session: {
        returnTo: "http://polygon.city/somepage"
      }
    });

    var res = expressStub.res();
    var next = expressStub.next();

    sandbox.stub(passport, "authenticate").returns(function(req, res, next) {});

    account.postLogin(req, res, next);

    expect(passport.authenticate).to.be.called;
    done();
  });
});

// TODO: Test for Mongo / Express error responses
describe("getLogout()", function () {
  before(function(done) {
    account = proxyquire("../../controllers/account", {
      "../config/configProxy": config
    })(passport);
    done();
  });

  it("exists", function(done) {
    expect(account.getLogout).to.exist;
    done();
  });

  it("renders view", function(done) {
    var req = expressStub.req();
    var res = expressStub.res();
    var next = expressStub.next();

    res.redirect = function(path) {
      expect(path).to.exist;
      expect(path).to.equal("/");
      expect(req.logout).to.be.called;
      done();
    };

    account.getLogout(req, res, next);
  });
});

// TODO: Test for Mongo / Express error responses
describe("getSignup()", function () {
  before(function(done) {
    account = proxyquire("../../controllers/account", {
      "../config/configProxy": config
    })(passport);
    done();
  });

  it("exists", function(done) {
    expect(account.getSignup).to.exist;
    done();
  });

  it("renders view", function(done) {
    var req = expressStub.req();
    var res = expressStub.res();

    res.render = function(view, data) {
      expect(view).to.exist;
      expect(view).to.equal("register");
      expect(data.bodyId).to.exist;
      expect(data.bodyId).to.equal("register");
      done();
    };

    account.getSignup(req, res);
  });
});

// TODO: Test for Mongo / Express error responses
describe("postSignup()", function () {
  before(function(done) {
    account = proxyquire("../../controllers/account", {
      "../config/configProxy": config
    })(passport);
    done();
  });

  it("exists", function(done) {
    expect(account.postSignup).to.exist;
    done();
  });

  it("requests passport authentication", function(done) {
    var req = expressStub.req({});
    var res = expressStub.res();
    var next = expressStub.next();

    sandbox.stub(passport, "authenticate").returns(function(req, res, next) {});

    account.postSignup(req, res, next);

    expect(passport.authenticate).to.be.calledWith("signup");
    done();
  });
});

// TODO: Test for Mongo / Express error responses
describe("getVerify()", function () {
  before(function(done) {
    User = require("../../models/user.js");
    account = proxyquire("../../controllers/account", {
      "../config/configProxy": config
    })(passport);
    done();
  });

  it("exists", function(done) {
    expect(account.getVerify).to.exist;
    done();
  });

  it("redirects to homepage on successful validation", function(done) {
    var req = expressStub.req({
      params: {
        token: 123
      }
    });

    var res = expressStub.res();

    var userData = {
      _id: 123,
      username: "Example",
      gravatar: "http://gravatar.com",
      twitter: "example",
      website: "http://somewebsite.com",
      verified: false,
      verifiedToken: 123,
      email: "someemail@polygon.city",
      changeEmail: "someotheremail@polygon.city"
    };

    var originalUser = _.clone(userData);

    var findRes = mongooseStub.model(userData);
    sandbox.stub(User, "findOne").yields(null, findRes);

    res.redirect = function(path) {
      expect(path).to.equal("/");
      expect(userData._id).to.equal(originalUser._id);
      expect(userData.email).to.equal(originalUser.changeEmail);
      expect(userData.verified).to.equal(true);
      expect(userData.verifiedToken).to.not.exist;
      expect(req.flash).to.be.calledWith("message");
      done();
    };

    account.getVerify(req, res);
  });

  it("doesn't update email if not requested", function(done) {
    var req = expressStub.req({
      params: {
        token: 123
      }
    });

    var res = expressStub.res();

    var userData = {
      _id: 123,
      username: "Example",
      gravatar: "http://gravatar.com",
      twitter: "example",
      website: "http://somewebsite.com",
      verified: false,
      verifiedToken: 123,
      email: "someemail@polygon.city"
    };

    var originalUser = _.clone(userData);

    var findRes = mongooseStub.model(userData);
    sandbox.stub(User, "findOne").yields(null, findRes);

    res.redirect = function(path) {
      expect(path).to.equal("/");
      expect(userData._id).to.equal(originalUser._id);
      expect(userData.email).to.equal(originalUser.email);
      expect(userData.verified).to.equal(true);
      expect(req.flash).to.be.calledWith("message");
      done();
    };

    account.getVerify(req, res);
  });

  it("redirects to signup if user not found", function(done) {
    var req = expressStub.req({
      params: {
        token: 123
      }
    });

    var res = expressStub.res();

    sandbox.stub(User, "findOne").yields(null, null);

    res.redirect = function(path) {
      expect(path).to.equal("/signup");
      expect(req.flash).to.be.calledWith("message");
      done();
    };

    account.getVerify(req, res);
  });
});

// TODO: Test for Mongo / Express error responses
describe("getForgot()", function () {
  before(function(done) {
    account = proxyquire("../../controllers/account", {
      "../config/configProxy": config
    })(passport);
    done();
  });

  it("exists", function(done) {
    expect(account.getForgot).to.exist;
    done();
  });

  it("renders view", function(done) {
    var req = expressStub.req();
    var res = expressStub.res();

    res.render = function(view, data) {
      expect(view).to.exist;
      expect(view).to.equal("forgot");
      expect(data.bodyId).to.exist;
      expect(data.bodyId).to.equal("forgot");
      done();
    };

    account.getForgot(req, res);
  });
});

// TODO: Test for Mongo / Express error responses
describe("postForgot()", function () {
  before(function(done) {
    User = require("../../models/user.js");
    account = proxyquire("../../controllers/account", {
      "../config/configProxy": config,
      "nodemailer": nodemailerStub
    })(passport);
    done();
  });

  it("exists", function(done) {
    expect(account.postForgot).to.exist;
    done();
  });

  it("successfully sets up password reset", function(done) {
    var req = expressStub.req({
      body: {
        email: "someemail@polygon.city"
      }
    });

    var res = expressStub.res();
    var next = expressStub.next();

    var userData = {
      _id: 123,
      username: "Example",
      gravatar: "http://gravatar.com",
      twitter: "example",
      website: "http://somewebsite.com",
      email: "someemail@polygon.city"
    };

    var originalUser = _.clone(userData);

    var findRes = mongooseStub.model(userData);
    sandbox.stub(User, "findOne").yields(null, findRes);

    res.redirect = function(path) {
      expect(path).to.exist;
      expect(path).to.equal("/forgot");
      expect(userData.resetPasswordToken).to.exist;
      expect(userData.resetPasswordExpires).to.exist;
      expect(req.flash).to.be.calledWith("message");
      done();
    };

    account.postForgot(req, res, next);
  });

  it("redirects if user doesn't exist", function(done) {
    var req = expressStub.req({
      body: {
        email: "someemail@polygon.city"
      }
    });

    var res = expressStub.res();
    var next = expressStub.next();

    sandbox.stub(User, "findOne").yields(null, null);

    res.redirect = function(path) {
      expect(path).to.exist;
      expect(path).to.equal("/forgot");
      expect(req.flash).to.be.calledWith("message");
      done();
    };

    account.postForgot(req, res, next);
  });
});

// TODO: Test for Mongo / Express error responses
describe("getReset()", function () {
  before(function(done) {
    User = require("../../models/user.js");
    account = proxyquire("../../controllers/account", {
      "../config/configProxy": config
    })(passport);
    done();
  });

  it("exists", function(done) {
    expect(account.getReset).to.exist;
    done();
  });

  it("renders view", function(done) {
    var req = expressStub.req({
      params: {
        token: 123
      }
    });

    var res = expressStub.res();

    var userData = {
      _id: 123,
      username: "Example",
      gravatar: "http://gravatar.com",
      twitter: "example",
      website: "http://somewebsite.com",
      resetPasswordToken: 123,
      resetPasswordExpires: new Date(),
      email: "someemail@polygon.city"
    };

    var originalUser = _.clone(userData);

    var findRes = mongooseStub.model(userData);
    sandbox.stub(User, "findOne").yields(null, findRes);

    res.redirect = function(path) {
      expect.fail();
      done();
    };

    res.render = function(view, data) {
      expect(view).to.exist;
      expect(view).to.equal("reset");
      expect(data.bodyId).to.exist;
      expect(data.bodyId).to.equal("reset");
      done();
    };

    account.getReset(req, res);
  });

  it("redirects if user doesn't exist", function(done) {
    var req = expressStub.req({
      params: {
        token: 123
      }
    });
    var res = expressStub.res();

    sandbox.stub(User, "findOne").yields(null, null);

    res.redirect = function(path) {
      expect(path).to.exist;
      expect(path).to.equal("/forgot");
      expect(req.flash).to.be.calledWith("message");
      done();
    };

    res.render = function(view, data) {
      expect.fail();
      done();
    };

    account.getReset(req, res);
  });
});

// TODO: Test for Mongo / Express error responses
describe("postReset()", function () {
  before(function(done) {
    User = require("../../models/user.js");
    account = proxyquire("../../controllers/account", {
      "../config/configProxy": config,
      "nodemailer": nodemailerStub
    })(passport);
    done();
  });

  it("exists", function(done) {
    expect(account.postReset).to.exist;
    done();
  });

  it("successfully resets password", function(done) {
    var req = expressStub.req({
      body: {
        password: "testing",
        confirm: "testing"
      },
      params: {
        token: 123
      }
    });

    var res = expressStub.res();
    var next = expressStub.next();

    var userData = {
      _id: 123,
      username: "Example",
      gravatar: "http://gravatar.com",
      twitter: "example",
      website: "http://somewebsite.com",
      resetPasswordToken: 123,
      resetPasswordExpires: new Date(),
      email: "someemail@polygon.city"
    };

    var originalUser = _.clone(userData);

    var findRes = mongooseStub.model(userData);
    sandbox.stub(User, "findOne").yields(null, findRes);

    res.redirect = function(path) {
      expect(path).to.exist;
      expect(path).to.equal("/");
      expect(userData.password).to.exist;
      expect(userData.password).to.not.equal(req.body.password);
      expect(userData.resetPasswordToken).to.not.exist;
      expect(userData.resetPasswordExpires).to.not.exist;
      expect(req.flash).to.be.calledWith("message");
      done();
    };

    account.postReset(req, res, next);
  });

  it("redirects if user doesn't exist", function(done) {
    var req = expressStub.req({
      body: {
        password: "testing",
        confirm: "testing"
      },
      params: {
        token: 123
      }
    });

    var res = expressStub.res();
    var next = expressStub.next();

    sandbox.stub(User, "findOne").yields(null, null);

    res.redirect = function(path) {
      expect(path).to.exist;
      expect(path).to.equal("/reset/" + req.params.token);
      expect(req.flash).to.be.calledWith("message");
      done();
    };

    account.postReset(req, res, next);
  });

  it("redirects if passwords don't match", function(done) {
    var req = expressStub.req({
      body: {
        password: "testing",
        confirm: "nottesting"
      },
      params: {
        token: 123
      }
    });

    var res = expressStub.res();
    var next = expressStub.next();

    sandbox.stub(User, "findOne").yields(null, null);

    res.redirect = function(path) {
      expect(path).to.exist;
      expect(path).to.equal("/reset/" + req.params.token);
      expect(req.flash).to.be.calledWith("message");
      done();
    };

    account.postReset(req, res, next);
  });
});
