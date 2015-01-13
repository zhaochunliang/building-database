"use strict";

var config = {
  app: "public",
  dist: "dist"
};

module.exports = function(grunt) {
  // Project Configuration
  grunt.initConfig({
    config: config,
    pkg: grunt.file.readJSON("package.json"),
    watch: {
      sass: {
        files: ["<%= config.app %>/sass/{,*/}*.{scss,sass}"],
        tasks: ["sass"]
      },
      serverTemplates: {
        files: ["server/views/**"],
        options: {
          // livereload: true
        }
      },
      js: {                
        files: ["public/js/**"],
        // tasks: ["jshint"],
        options: {
          // livereload: true
        }
      }
    },
    sass: {
      options: {
        imagePath: "public/img",
        includePaths: require("node-neat").includePaths
      },
      dist: {
        files: {
          "<%= config.app %>/style/main.css": "<%= config.app %>/sass/main.scss",
          "<%= config.app %>/style/main_new.css": "<%= config.app %>/sass/main_new.scss"
        }
      }
    },
    nodemon: {
      dev: {
        script: "bin/www"
      },
      options: {
        ignore: ["node_modules/**"],
      }
    },
    concurrent: {
      tasks: ["nodemon", "watch"],
      options: {
        logConcurrentOutput: true
      }
    },    
    clean: {
      server: [".tmp", "tmp"]
    }
  });

  // Show elapsed time at the end
  require("time-grunt")(grunt);
  
  // Load all grunt tasks
  require("load-grunt-tasks")(grunt);

  // Making grunt default to force in order not to break the project.
  grunt.option("force", true);

  // Default task(s)
  grunt.registerTask("default", [
    "clean:server",
    "sass",
    "concurrent"
  ]);
};