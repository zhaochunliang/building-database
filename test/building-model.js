var model = {
  id: "",
  name: "",
  slug: {
    id: "",
    name: ""
  },
  batch: {
    id: "",
    buildingRef: ""
  },
  creator: {
    name: "",
    url: ""
  },
  method: "",
  description: "",
  location: {
    type: "",
    coordinates: [0, 0]
  },
  locality: {
    countryCode: "",
    country: "",
    district: ""
  },
  nominatim: {},
  scale: 0,
  angle: 0,
  structure: {
    vertices: 0,
    faces: 0
  },
  models: {
    raw: [],
    zip: []
  },
  osm: {
    type: "",
    id: 0
  },
  userId: "",
  stats: {
    downloads: 0,
    views: 0
  },
  highlight: false,
  hidden: false,
  createdAt: new Date(),
  updatedAt: new Date()
};

model.save = function(callback) {
  callback(null, this);
};

module.exports = function() {
  return model
};