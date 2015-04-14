var model = {
  _id: "",
  username: "",
  email: "",
  password: "",
  gravatar: "",
  twitter: "",
  website: "",
  group: "",
  verified: false,
  banned: false,
  createdAt: new Date(),
  updatedAt: new Date()
};

model.save = function(callback) {
  callback(null, this);
};

module.exports = function(data) {
  model.paginate = function(query, page, limit, callback) {
    callback(null, 10, data);
  };

  return model;
};
