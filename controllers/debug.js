var debug = require("debug")("polygoncity");
var _ = require("underscore");
var async = require("async");
var shell = require("shelljs");
var git = require("git-rev");
var npm = require("npm");

module.exports = function (passport) {
  var Building = require("../models/building");

  // Endpoint /debug for GET
  var getDebug = function(req, res) {
    async.parallel({
      git: function(callback) {
        git.short(function (sha) {
          callback(null, sha);
          return;
        });
      },
      node: function(callback) {
        shell.exec("node --version", {silent: true}, function(code, output) {
          callback(null, output);
        });
      },
      npm: function(callback) {
        npm.load(function(err, npm) {
          npm.commands.ls([], true, function(err, packages, lite) {
            var result = {
              version: 0,
              packages: [],
              issues: []
            };

            _.each(lite.dependencies, function(dependency, index) {
              result.packages.push({
                name: index,
                version: dependency.version,
                from: dependency.from,
                resolved: dependency.resolved
              });
            });

            result.packages.sort(function(a, b) {
              if(a.name < b.name) return -1;
              if(a.name > b.name) return 1;
              return 0;
            });

            _.each(lite.problems, function(problem) {
              result.issues.push(problem);
            });

            shell.exec("npm --version", {silent: true}, function(code, output) {
              result.version = output;
              callback(null, result);
            });
          });
        });
      }
    }, function(err, results) {
      if (err) {
        res.sendStatus(500);
        return;
      }

      res.render("debug", {
        git: {
          sha: results.git
        },
        node: {
          version: results.node
        },
        npm: {
          version: results.npm.version,
          packages: results.npm.packages,
          issues: results.npm.issues
        }
      });
    });
  };

  // Endpoint /ping for GET
  var getPing = function(req, res) {
    // Run a simple database query
    Building.find({hidden: false}).limit(1).sort({createdAt: -1}).exec(function(err, buildings) {
      if (err) {
        debug(err);
        res.sendStatus(500);
        return;
      }

      git.short(function (sha) {
        res.send(sha);
        return;
      });
    });
  };

  return {
    getDebug: getDebug,
    getPing: getPing
  };
};
