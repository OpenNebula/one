module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    sass: {
      options: {
        includePaths: ['bower_components/foundation/scss']
      },
      dist: {
        options: {
          outputStyle: 'compressed'
        },
        files: {
          'css/app.css': 'scss/app.scss'
        }
      }
    },

    watch: {
      grunt: { files: ['Gruntfile.js'] },

      sass: {
        files: 'scss/**/*.scss',
        tasks: ['sass']
      },

      requirejs: {
        files: 'app/**/*.js',
        tasks: ['requirejs']
      }
    },

    requirejs: {
      compile: {
        options: {
          //baseUrl: '../js', // 1
          out: 'dist/main.min.js', // 2
          //name: 'vendor/almond', // 3
          include: 'main', // 4
          mainConfigFile: 'app/main.js', // 5
          preserveLicenseComments: false,
          optimize: 'uglify2',
          generateSourceMaps: true
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-sass');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-requirejs');

  grunt.registerTask('build', ['sass']);
  grunt.registerTask('default', ['build','watch']);
}
