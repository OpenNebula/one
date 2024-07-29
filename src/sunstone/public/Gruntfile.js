/* -------------------------------------------------------------------------- */
/* Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                */
/*                                                                            */
/* Licensed under the Apache License, Version 2.0 (the "License"); you may    */
/* not use this file except in compliance with the License. You may obtain    */
/* a copy of the License at                                                   */
/*                                                                            */
/* http://www.apache.org/licenses/LICENSE-2.0                                 */
/*                                                                            */
/* Unless required by applicable law or agreed to in writing, software        */
/* distributed under the License is distributed on an "AS IS" BASIS,          */
/* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.   */
/* See the License for the specific language governing permissions and        */
/* limitations under the License.                                             */
/* -------------------------------------------------------------------------- */

module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON("package.json"),

    sass: {
      options: {
        includePaths: ["bower_components/foundation-sites/scss"]
      },
      dist: {
        options: {
          outputStyle: "compressed"
        },
        files: {
          "css/app.css": "scss/app.scss"
        }
      }
    },

    watch: {
      grunt: {
        files: ["Gruntfile.js"]
      },

      sass: {
        files: "scss/*.scss",
        tasks: ["sass"]
      },

      requirejs: {
        files: "app/**/*.js",
        tasks: ["requirejs"]
      }
    },

    requirejs: {
      compileCSS: {
        options: {
          out: "./css/app.min.css",
          cssIn: "./css/app.css",
          optimizeCss: "default"
        }
      },
      compileJS: {
        options: {
          appDir: "./app",
          baseUrl: "./", // 1
          dir: "./dist", // 2
          //name: 'vendor/almond', // 3
          mainConfigFile: "./app/main.js", // 5
          preserveLicenseComments: false,
          optimize: "none",
          generateSourceMaps: true,
          removeCombined: true,
          //skipDirOptimize: false,
          //findNestedDependencies: true,
          modules: [
            {
              name: "main",
              include: ["almond"]
            },
            {
              name: "login",
              include: ["almond"],
              insertRequire: ["login"]
            },
            {
              name: "console/vnc",
              include: ["almond"],
              insertRequire: ["console/vnc"]
            },
            {
              name: "console/vmrc",
              include: ["almond"],
              insertRequire: ["console/vmrc"]
            },
            {
              name: "console/spice",
              include: ["almond"],
              insertRequire: ["console/spice"]
            },
            {
              name: "console/guacamole",
              include: ["almond"],
              insertRequire: ["console/guacamole"]
            }
          ]
        }
      }
    }
  });

  grunt.loadNpmTasks("grunt-sass");
  grunt.loadNpmTasks("grunt-contrib-watch");
  grunt.loadNpmTasks("grunt-contrib-requirejs");

  grunt.registerTask("build", ["sass"]);
  grunt.registerTask("default", ["build","watch"]);
};
