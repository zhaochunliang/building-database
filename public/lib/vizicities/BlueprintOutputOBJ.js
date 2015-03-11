/* globals window, _, VIZI, d3, THREE */
(function() {
  "use strict";

/**
 * Blueprint OBJ output
 * @author Robin Hawkes - vizicities.com
 */ 

  // output: {
  //   type: "BlueprintOutputOBJ",
  //   options: {
  //     modelPathPrefix: "/data/kml-model/"
  //   }
  // }
  VIZI.BlueprintOutputOBJ = function(options) {
    var self = this;

    VIZI.BlueprintOutput.call(self, options);

    _.defaults(self.options, {
      infoUI: false,
      name: "OBJ"
    });

    // Triggers and actions reference
    self.triggers = [
      {name: "initialised", arguments: []}
    ];

    self.actions = [
      {name: "outputOBJ", arguments: ["obj"]}
    ];

    self.name = self.options.name;

    self.world;
    self.infoUI;
  };

  VIZI.BlueprintOutputOBJ.prototype = Object.create( VIZI.BlueprintOutput.prototype );

  // Initialise instance and start automated processes
  VIZI.BlueprintOutputOBJ.prototype.init = function() {
    var self = this;

    // Set up info UI
    if (self.options.infoUI) {
      self.infoUI = new VIZI.InfoUI2D(self.world);
    }

    self.emit("initialised");
  };

  // TODO: Process collada import and mesh generation in a Web Worker
  // TODO: Throttle requests for collada files
  VIZI.BlueprintOutputOBJ.prototype.outputOBJ = function(data) {
    var self = this;

    // TODO: Remove this hack around THREE.Loader.Handlers
    // THREE.Loader.Handlers = {get: function(){ return null; }};

    var loader = new THREE.OBJLoader();

    // Local pixels per meter - set once per tile
    var pixelsPerMeter;

    _.each(data, function(item) {
      var path = (self.options.modelPathPrefix) ? self.options.modelPathPrefix + item.modelPath : item.modelPath;
    
      loader.load(path, function (obj) {
        var latLon = new VIZI.LatLon(item.coordinates[1], item.coordinates[0]);

        var geoCoord = self.world.project(latLon);

        // Set local pixels per meter if not set
        if (pixelsPerMeter === undefined) {
          pixelsPerMeter = self.world.pixelsPerMeter(latLon);
        }

        // Move to correct position
        obj.position.x = geoCoord.x;
        obj.position.z = geoCoord.y;

        // Scale value below 1 indicates collada units are in metres
        // https://github.com/mrdoob/three.js/blob/master/examples/js/loaders/ColladaLoader.js#L219
        // if (dae.scale.x < 1) { 
        // Scale up model from meters to pixels
        obj.scale.x = obj.scale.y = obj.scale.z = obj.scale.x * pixelsPerMeter.y;
        obj.updateMatrix();
        // }

        self.add(obj);

        // Create info panel
        // TODO: Work out a way to pass in custom text for the info panel or
        // make it obvcious that you can only use the data avaiable.
        if (self.infoUI) {
          self.infoUI.addPanel(obj, obj.id);
        }
      });
    });
  };

  VIZI.BlueprintOutputOBJ.prototype.onTick = function(delta) {
    var self = this;

    // Update panel positions
    // TODO: Work out how to remove the visible lag between panel position
    // and actual scene / camera position.
    if (self.infoUI) {
      self.infoUI.onChange();
    }
  }

  VIZI.BlueprintOutputOBJ.prototype.onHide = function() {
    var self = this;

    if (self.infoUI) {
      self.infoUI.onHide();
    }
  };

  VIZI.BlueprintOutputOBJ.prototype.onShow = function() {
    var self = this;

    if (self.infoUI) {
      self.infoUI.onShow();
    }
  };

  VIZI.BlueprintOutputOBJ.prototype.onAdd = function(world) {
    var self = this;
    self.world = world;
    self.init();
  };
}());