var model = {
  id: "",
  building: {},
  reason: "",
  details: "",
  email: "",
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