"use strict";

// Based on: https://github.com/mgenev/nodember

// TODO: Separate build files from final, public output
// - A quick Google for "grunt ember express build" bring up loads
// - https://github.com/subeeshb/MEEN-starter
// - http://tech.pro/tutorial/1249/modern-emberjs-application-workflow-with-yeoman-and-mocha
// - http://linemanjs.com/
// - http://stackoverflow.com/questions/15302221/asset-pipeline-for-ember-js-express-js-and-node-js
// - http://stackoverflow.com/questions/25331380/building-ember-grunt-into-an-express-node-project
// - https://github.com/ericclemmons/grunt-express-server
// - http://davidtucker.net/articles/automating-with-grunt/
// - http://iamstef.net/ember-app-kit/guides/deployment.html
// - http://stackoverflow.com/questions/18345179/how-to-run-grunt-server-in-dist-directory-instead-of-app-directory

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
      neuter: {
        files: ["<%= config.app %>/ember/{,*/}*.js"],
        tasks: ["neuter", "replace:sourceMap"]
      },
      serverTemplates: {
        files: ["server/views/**"],
        options: {
          // livereload: true
        }
      },
      emberTemplates: {
        files: "<%= config.app %>/ember/templates/{,*/}*.hbs",
        tasks: ["emberTemplates"],
        options: {
          // livereload: true
        }
      },
      js: {                
        files: ["public/js/**", "app/**/*.js"],
        // tasks: ["jshint"],
        options: {
          // livereload: true
        }
      },
      css: {
        files: ["public/css/**"],
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
          "<%= config.app %>/style/main.css": "<%= config.app %>/sass/main.scss"
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
    // env: {
    //   test: {
    //     NODE_ENV: "test"
    //   }
    // },
    // mochaTest: {
    //   src: ["test/**/*.js"],
    //   options: {
    //     reporter: "spec",
    //     require: "server.js"
    //   }
    // },        
    emberTemplates: {
      options: {
        templateName: function(sourceFile) {
          var templatePath = config.app + "/ember/templates/";
          return sourceFile.replace(templatePath, "");
        }
      },
      dist: {
        files: {
          "<%= config.app %>/compiled-templates.js": "<%= config.app %>/ember/templates/{,*/}*.hbs"
        }
      }
    },
    neuter: {
      client: {
        options: {
          includeSourceMap: true,
          filepathTransform: function(filepath) {
            return "public/" + filepath;
          }
        },
        src: "<%= config.app %>/ember/app.js",
        dest: "<%= config.app %>/combined-scripts.js"
      }
    },
    replace: {
      sourceMap: {
        src: "<%= config.app %>/combined-scripts.js.map", // source files array (supports minimatch)
        dest: "<%= config.app %>/combined-scripts.js.map", // destination directory or file
        replacements: [{
          from: "public/", // string replacement
          to: "" 
        }]
      }
    },
    clean: {
      server: ".tmp"
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
    "neuter:client",
    "replace:sourceMap",
    "emberTemplates",
    "concurrent"
  ]);
};