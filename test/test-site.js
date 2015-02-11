var expect = require("chai").expect;

var request = require("supertest");
var app = require("../app");
var api = request(app);

describe("/", function () {
  it("should be accessible", function(done) {
    api.get("/")
    .expect(200)
    .end(function(err, res) {
      if (err) return done(err);
      done();
    });
  });
});

describe("/browse", function () {
  it("should be accessible", function(done) {
    api.get("/")
    .expect(200)
    .end(function(err, res) {
      if (err) return done(err);
      done();
    });
  });
});

describe("/browse_all", function () {
  it("should be accessible", function(done) {
    api.get("/")
    .expect(200)
    .end(function(err, res) {
      if (err) return done(err);
      done();
    });
  });
});

describe("/signup", function () {
  it("should be accessible", function(done) {
    api.get("/")
    .expect(200)
    .end(function(err, res) {
      if (err) return done(err);
      done();
    });
  });
});

describe("/login", function () {
  it("should be accessible", function(done) {
    api.get("/")
    .expect(200)
    .end(function(err, res) {
      if (err) return done(err);
      done();
    });
  });
});