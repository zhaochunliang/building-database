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

describe("/contributing", function () {
  it("should be accessible", function(done) {
    api.get("/contributing")
    .expect(200)
    .end(function(err, res) {
      if (err) return done(err);
      done();
    });
  });
});

describe("/terms", function () {
  it("should be accessible", function(done) {
    api.get("/terms")
    .expect(200)
    .end(function(err, res) {
      if (err) return done(err);
      done();
    });
  });
});

describe("/browse", function () {
  it("should be accessible", function(done) {
    api.get("/browse")
    .expect(200)
    .end(function(err, res) {
      if (err) return done(err);
      done();
    });
  });
});

describe("/browse/all", function () {
  it("should be accessible", function(done) {
    api.get("/browse/all")
    .expect(200)
    .end(function(err, res) {
      if (err) return done(err);
      done();
    });
  });
});

describe("/search", function () {
  it("should be accessible", function(done) {
    api.get("/search")
    .expect(200)
    .end(function(err, res) {
      if (err) return done(err);
      done();
    });
  });
});

describe("/search/testing", function () {
  it("should be accessible", function(done) {
    api.get("/search/testing")
    .expect(200)
    .end(function(err, res) {
      if (err) return done(err);
      done();
    });
  });
});

describe("/search/near/-0.01924,51.50358,1000", function () {
  it("should be accessible", function(done) {
    api.get("/search/near/-0.01924,51.50358,1000")
    .expect(200)
    .end(function(err, res) {
      if (err) return done(err);
      done();
    });
  });
});

describe("/signup", function () {
  it("should be accessible", function(done) {
    api.get("/signup")
    .expect(200)
    .end(function(err, res) {
      if (err) return done(err);
      done();
    });
  });
});

describe("/login", function () {
  it("should be accessible", function(done) {
    api.get("/login")
    .expect(200)
    .end(function(err, res) {
      if (err) return done(err);
      done();
    });
  });
});

describe("/logout", function () {
  it("should redirect to index", function(done) {
    api.get("/logout")
    .expect(302)
    .end(function(err, res) {
      if (err) return done(err);
      done();
    });
  });
});

describe("/forgot", function () {
  it("should be accessible", function(done) {
    api.get("/forgot")
    .expect(200)
    .end(function(err, res) {
      if (err) return done(err);
      done();
    });
  });
});

describe("/add", function () {
  it("should redirect to login when not logged in", function(done) {
    api.get("/add")
    .expect(302)
    .end(function(err, res) {
      if (err) return done(err);
      done();
    });
  });
});