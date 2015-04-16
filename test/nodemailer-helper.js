var nodemailer = {};

nodemailer.createTransport = function(transport) {
  return this;
};

nodemailer.sendMail = function(options, callback) {
  callback(null);
};

module.exports = nodemailer;