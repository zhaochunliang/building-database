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

var User = require("../../models/user");

var userData = [{
  username: "Someone",
  password: "topsecret",
  email: "example@polygon.city",
  group: "admin",
  gravatar: "http://www.gravatar.com/avatar/fb2b8ae81bb14f846d850263464e4050",
  website: "http://somewebsite.com",
  twitter: "sometwitter"
}, {
  username: "SomeoneElse",
  password: "topsecret",
  email: "someoneelse@polygon.city",
  gravatar: "http://www.gravatar.com/avatar/fb2b8ae81bb14f846d850263464e4050",
  website: "http://somewebsite.com",
  twitter: "sometwitter"
}];

var sandbox;
beforeEach(function (done) {
  sandbox = sinon.sandbox.create();

  mockgoose.reset();

  // Add sample data
  User.create(userData);

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
  mockgoose.reset();
  done();
});

// TODO: Test for Express error responses
describe("Schema checks", function () {
  it("adds provided values", function(done) {
    var userCheck = _.first(userData);

    User.findOne({}, function(err, user) {
      expect(user).to.exist;
      expect(user._id).to.exist;
      expect(typeof user.username).to.equal("string");
      expect(user.username).to.equal(userCheck.username);
      expect(typeof user.password).to.equal("string");
      expect(user.password).to.equal(userCheck.password);
      expect(typeof user.email).to.equal("string");
      expect(user.email).to.equal(userCheck.email);
      expect(typeof user.website).to.equal("string");
      expect(user.website).to.equal(userCheck.website);
      expect(typeof user.twitter).to.equal("string");
      expect(user.twitter).to.equal(userCheck.twitter);
      expect(typeof user.gravatar).to.equal("string");
      expect(user.gravatar).to.equal(userCheck.gravatar);
      expect(typeof user.group).to.equal("string");
      expect(user.group).to.equal(userCheck.group);
      done();
    });
  });

  it("sets expected defaults", function(done) {
    User.findOne({}, function(err, user) {
      expect(typeof user.banned).to.equal("boolean");
      expect(user.banned).to.equal(false);
      expect(typeof user.verified).to.equal("boolean");
      expect(user.verified).to.equal(false);
      expect(typeof user.createdAt).to.equal("object");
      expect(typeof user.updatedAt).to.equal("object");
      done();
    });
  });

  // TODO: Re-enable when this works
  // it("can set tokens", function(done) {
  //   var token = "12345";
  //   var expires = new Date();
  //
  //   User.findOneAndUpdate({
  //     username: "Someone"
  //   }, {
  //     resetPasswordToken: token,
  //     resetPasswordExpires: expires,
  //     verifiedToken: token
  //   }, {
  //     upsert: true
  //   }, function(err, savedUser) {
  //     console.log(err, savedUser);
  //     expect(typeof savedUser.resetPasswordToken).to.equal("string");
  //     expect(savedUser.resetPasswordToken).to.equal(token);
  //     expect(typeof savedUser.resetPasswordExpires).to.equal("object");
  //     expect(savedUser.resetPasswordExpires).to.equal(expires);
  //     expect(typeof savedUser.verifiedToken).to.equal("string");
  //     expect(savedUser.verifiedToken).to.equal(token);
  //     done();
  //   });
  // });
});
