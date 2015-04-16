var config;

try {
  config = require("./config");
} catch(err) {
  config = {};
}

module.exports = config;
