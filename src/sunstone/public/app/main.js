require.config({
  paths: {
    /* jQuery */
    'jquery': '../bower_components/jquery/dist/jquery.min',

    /* DataTables */
    'datatables': '../bower_components/datatables/media/js/jquery.dataTables.min',
    'foundation-datatables': '../bower_components/foundation-datatables/integration/foundation/dataTables.foundation.min',

    /* DataTables */
    'jgrowl': '../bower_components/jgrowl/jquery.jgrowl.min',

    /* Foundation */
    'foundation.core': '../bower_components/foundation/js/foundation/foundation',
    'foundation.abide': '../bower_components/foundation/js/foundation/foundation.abide',
    'foundation.accordion': '../bower_components/foundation/js/foundation/foundation.accordion',
    'foundation.alert': '../bower_components/foundation/js/foundation/foundation.alert',
    'foundation.clearing': '../bower_components/foundation/js/foundation/foundation.clearing',
    'foundation.dropdown': '../bower_components/foundation/js/foundation/foundation.dropdown',
    'foundation.equalizer': '../bower_components/foundation/js/foundation/foundation.equalizer',
    'foundation.interchange': '../bower_components/foundation/js/foundation/foundation.interchange',
    'foundation.joyride': '../bower_components/foundation/js/foundation/foundation.joyride',
    'foundation.magellan': '../bower_components/foundation/js/foundation/foundation.magellan',
    'foundation.offcanvas': '../bower_components/foundation/js/foundation/foundation.offcanvas',
    'foundation.orbit': '../bower_components/foundation/js/foundation/foundation.orbit',
    'foundation.reveal': '../bower_components/foundation/js/foundation/foundation.reveal',
    'foundation.tab': '../bower_components/foundation/js/foundation/foundation.tab',
    'foundation.tooltip': '../bower_components/foundation/js/foundation/foundation.tooltip',
    'foundation.topbar': '../bower_components/foundation/js/foundation/foundation.topbar',

    /* Handlebars */
    'hbs': '../bower_components/require-handlebars-plugin/hbs',

    /* Vendor Scripts */
    'jquery.cookie': '../bower_components/foundation/js/vendor/jquery.cookie',
    'fastclick': '../bower_components/foundation/js/vendor/fastclick',
    'modernizr': '../bower_components/foundation/js/vendor/modernizr',
    'placeholder': '../bower_components/foundation/js/vendor/placeholder',

    /* Resumable */
    'resumable': '../bower_components/resumablejs/resumable',

    /* Flot Graphs */
    'flot': '../bower_components/flot/jquery.flot',
    'flot.stack': '../bower_components/flot/jquery.flot.stack',
    'flot.resize': '../bower_components/flot/jquery.flot.resize',
    'flot.time': '../bower_components/flot/jquery.flot.time',
    'flot.tooltip': '../bower_components/flot.tooltip/js/jquery.flot.tooltip.min',

    /* noUiSlider */
    'nouislider': '../vendor/4.0/nouislider/jquery.nouislider.min',

    /* VNC */
    'vnc-util': '../bower_components/no-vnc/include/util'
  },
  shim: {
    /* jQuery */
    'jquery': {
      exports: '$'
    },

    /* jGrowl */
    'jgrowl': {
      deps: ['jquery']
    },

    /* dataTables */
    'foundation-datatables': {
      deps: ['jquery', 'datatables']
    },

    /* Foundation */
    'foundation.core': {
      deps: ['jquery', 'modernizr'],
      exports: 'Foundation'
    },
    'foundation.abide': {
      deps: ['foundation.core']
    },
    'foundation.accordion': {
      deps: ['foundation.core']
    },
    'foundation.alert': {
      deps: ['foundation.core']
    },
    'foundation.clearing': {
      deps: ['foundation.core']
    },
    'foundation.dropdown': {
      deps: ['foundation.core']
    },
    'foundation.equalizer': {
      deps: ['foundation.core']
    },
    'foundation.interchange': {
      deps: ['foundation.core']
    },
    'foundation.joyride': {
      deps: ['foundation.core', 'foundation.cookie']
    },
    'foundation.magellan': {
      deps: ['foundation.core']
    },
    'foundation.offcanvas': {
      deps: ['foundation.core']
    },
    'foundation.orbit': {
      deps: ['foundation.core']
    },
    'foundation.reveal': {
      deps: ['foundation.core']
    },
    'foundation.tab': {
      deps: ['foundation.core']
    },
    'foundation.tooltip': {
      deps: ['foundation.core']
    },
    'foundation.topbar': {
      deps: ['foundation.core']
    },

    /* Vendor Scripts */
    'jquery.cookie': {
      deps: ['jquery']
    },
    'fastclick': {
      exports: 'FastClick'
    },
    'modernizr': {
      exports: 'Modernizr'
    },
    'placeholder': {
      exports: 'Placeholders'
    },

    /* Flot Graphs */
    'flot': {
      deps: ['jquery']
    },
    'flot.stack': {
      deps: ['flot']
    },
    'flot.resize': {
      deps: ['flot']
    },
    'flot.time': {
      deps: ['flot']
    },
    'flot.tooltip': {
      deps: ['flot']
    },

    /* noUiSlider */
    'nouislider': {
      deps: ['jquery']
    },

    /* VNC */
    'vnc-util': {
      exports: 'Util'
    },
  }
});

require(['app'], function(App) {});
