module.exports = function (passport) {
  // Endpoint / for GET
  var getIndex = function(req, res) {
    res.render("layout");
  };

  // Endpoint /browse for GET
  var getBrowse = function(req, res) {
    res.sendStatus(404);
  };

  // Endpoint /search for GET
  var getSearch = function(req, res) {
    res.sendStatus(404);
  };

  // Endpoint /add for GET
  var getAdd = function(req, res) {
    res.render("add");
  };

  return {
    getIndex: getIndex,
    getBrowse: getBrowse,
    getSearch: getSearch,
    getAdd: getAdd
  };
};