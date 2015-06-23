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
      grunt: { 
        files: ['Gruntfile.js'] 
      },

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
      compileCSS: {
        options: {
          out: './css/app.min.css',
          cssIn: './css/app.css',
          optimizeCss: 'default'
        }
      },
      compileJS: {
        options: {
          appDir: './app',
          baseUrl: './', // 1
          dir: './dist', // 2
          //name: 'vendor/almond', // 3
          mainConfigFile: './app/main.js', // 5
          preserveLicenseComments: false,
          optimize: 'uglify2',
          generateSourceMaps: true,
          removeCombined: false,
          findNestedDependencies: true,
          modules: [
            {
              name: 'main',
              include: ['almond']
            },
            {
              name: 'login',
              include: ['almond'],
              insertRequire: ['login']
            }
            /*{
              name: 'main'
              excludeShallow: [
                'app'
              ],
              include: [
                'jquery',
                'datatables',
                'foundation-datatables',
                'jgrowl',
                'foundation.core',
                'foundation.abide',
                'foundation.accordion',
                'foundation.alert',
                'foundation.clearing',
                'foundation.dropdown',
                'foundation.equalizer',
                'foundation.interchange',
                'foundation.joyride',
                'foundation.magellan',
                'foundation.offcanvas',
                'foundation.orbit',
                'foundation.reveal',
                'foundation.slider',
                'foundation.tab',
                'foundation.tooltip',
                'foundation.topbar',
                'hbs',
                'jquery.cookie',
                'fastclick',
                'modernizr',
                'placeholder',
                'resumable',
                'flot',
                'flot.stack',
                'flot.resize',
                'flot.time',
                'flot.tooltip',
                'nouislider',
                'vnc-util',
                'spice-main',
                'spice-spicearraybuffer',
                'spice-enums',
                'spice-atKeynames',
                'spice-utils',
                'spice-png',
                'spice-lz',
                'spice-quic',
                'spice-bitmap',
                'spice-spicedataview',
                'spice-spicetype',
                'spice-spicemsg',
                'spice-wire',
                'spice-spiceconn',
                'spice-display',
                'spice-inputs',
                'spice-webm',
                'spice-playback',
                'spice-simulatecursor',
                'spice-cursor',
                'spice-jsbn',
                'spice-rsa',
                'spice-prng4',
                'spice-rng',
                'spice-sha1',
                'spice-ticket',
                'spice-resize',
                'spice-filexfer'
              ]
            },
            {
              name: 'app',
              exclude: [
                'jquery',
                'datatables',
                'foundation-datatables',
                'jgrowl',
                'foundation.core',
                'foundation.abide',
                'foundation.accordion',
                'foundation.alert',
                'foundation.clearing',
                'foundation.dropdown',
                'foundation.equalizer',
                'foundation.interchange',
                'foundation.joyride',
                'foundation.magellan',
                'foundation.offcanvas',
                'foundation.orbit',
                'foundation.reveal',
                'foundation.slider',
                'foundation.tab',
                'foundation.tooltip',
                'foundation.topbar',
                'hbs',
                'jquery.cookie',
                'fastclick',
                'modernizr',
                'placeholder',
                'resumable',
                'flot',
                'flot.stack',
                'flot.resize',
                'flot.time',
                'flot.tooltip',
                'nouislider',
                'vnc-util',
                'spice-main',
                'spice-spicearraybuffer',
                'spice-enums',
                'spice-atKeynames',
                'spice-utils',
                'spice-png',
                'spice-lz',
                'spice-quic',
                'spice-bitmap',
                'spice-spicedataview',
                'spice-spicetype',
                'spice-spicemsg',
                'spice-wire',
                'spice-spiceconn',
                'spice-display',
                'spice-inputs',
                'spice-webm',
                'spice-playback',
                'spice-simulatecursor',
                'spice-cursor',
                'spice-jsbn',
                'spice-rsa',
                'spice-prng4',
                'spice-rng',
                'spice-sha1',
                'spice-ticket',
                'spice-resize',
                'spice-filexfer'
              ]
            }*/
          ]
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
