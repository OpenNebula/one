/* -------------------------------------------------------------------------- */
/* Copyright 2002-2016, OpenNebula Project, OpenNebula Systems                */
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

require.config({
  paths: {
    /* Almond */
    'almond': '../bower_components/almond/almond',

    /* jQuery */
    'jquery': '../bower_components/jquery/dist/jquery',

    /* DataTables */
    'datatables.net': '../bower_components/datatables/media/js/jquery.dataTables',
    'datatables.foundation': '../bower_components/datatables/media/js/dataTables.foundation',

    /* DataTables */
    'jgrowl': '../bower_components/jgrowl/jquery.jgrowl',

    /* Foundation */
    'foundation': '../bower_components/foundation-sites/dist/foundation',
    //'foundation.core': '../bower_components/foundation/js/foundation/foundation',
    //'foundation.abide': '../bower_components/foundation/js/foundation/foundation.abide',
    //'foundation.accordion': '../bower_components/foundation/js/foundation/foundation.accordion',
    //'foundation.alert': '../bower_components/foundation/js/foundation/foundation.alert',
    //'foundation.clearing': '../bower_components/foundation/js/foundation/foundation.clearing',
    //'foundation.dropdown': '../bower_components/foundation/js/foundation/foundation.dropdown',
    //'foundation.equalizer': '../bower_components/foundation/js/foundation/foundation.equalizer',
    //'foundation.interchange': '../bower_components/foundation/js/foundation/foundation.interchange',
    //'foundation.joyride': '../bower_components/foundation/js/foundation/foundation.joyride',
    //'foundation.magellan': '../bower_components/foundation/js/foundation/foundation.magellan',
    //'foundation.offcanvas': '../bower_components/foundation/js/foundation/foundation.offcanvas',
    //'foundation.orbit': '../bower_components/foundation/js/foundation/foundation.orbit',
    //'foundation.reveal': '../bower_components/foundation/js/foundation/foundation.reveal',
    //'foundation.slider': '../bower_components/foundation/js/foundation/foundation.slider',
    //'foundation.tab': '../bower_components/foundation/js/foundation/foundation.tab',
    //'foundation.tooltip': '../bower_components/foundation/js/foundation/foundation.tooltip',
    //'foundation.topbar': '../bower_components/foundation/js/foundation/foundation.topbar',

    /* Handlebars */
    'hbs': '../bower_components/require-handlebars-plugin/hbs',

    /* Resumable */
    'resumable': '../bower_components/resumablejs/resumable',

    /* Flot Graphs */
    'flot': '../bower_components/flot/jquery.flot',
    'flot.stack': '../bower_components/flot/jquery.flot.stack',
    'flot.resize': '../bower_components/flot/jquery.flot.resize',
    'flot.time': '../bower_components/flot/jquery.flot.time',
    'flot.tooltip': '../bower_components/flot.tooltip/js/jquery.flot.tooltip',

    /* VNC */
    'vnc-util': '../bower_components/no-vnc/include/util',
    'vnc-webutil': '../bower_components/no-vnc/include/webutil',
    'vnc-base64': '../bower_components/no-vnc/include/base64',
    'vnc-websock': '../bower_components/no-vnc/include/websock',
    'vnc-des': '../bower_components/no-vnc/include/des',
    'vnc-keysymdef': '../bower_components/no-vnc/include/keysymdef',
    'vnc-keyboard': '../bower_components/no-vnc/include/keyboard',
    'vnc-input': '../bower_components/no-vnc/include/input',
    'vnc-display': '../bower_components/no-vnc/include/display',
    'vnc-jsunzip': '../bower_components/no-vnc/include/jsunzip',
    'vnc-rfb': '../bower_components/no-vnc/include/rfb',
    'vnc-keysym': '../bower_components/no-vnc/include/keysym',

    /* Spice */
    'spice-main': '../bower_components/spice-html5/main',
    'spice-spicearraybuffer': '../bower_components/spice-html5/spicearraybuffer',
    'spice-enums': '../bower_components/spice-html5/enums',
    'spice-atKeynames': '../bower_components/spice-html5/atKeynames',
    'spice-utils': '../bower_components/spice-html5/utils',
    'spice-png': '../bower_components/spice-html5/png',
    'spice-lz': '../bower_components/spice-html5/lz',
    'spice-quic': '../bower_components/spice-html5/quic',
    'spice-bitmap': '../bower_components/spice-html5/bitmap',
    'spice-spicedataview': '../bower_components/spice-html5/spicedataview',
    'spice-spicetype': '../bower_components/spice-html5/spicetype',
    'spice-spicemsg': '../bower_components/spice-html5/spicemsg',
    'spice-wire': '../bower_components/spice-html5/wire',
    'spice-spiceconn': '../bower_components/spice-html5/spiceconn',
    'spice-display': '../bower_components/spice-html5/display',
    'spice-inputs': '../bower_components/spice-html5/inputs',
    'spice-webm': '../bower_components/spice-html5/webm',
    'spice-playback': '../bower_components/spice-html5/playback',
    'spice-simulatecursor': '../bower_components/spice-html5/simulatecursor',
    'spice-cursor': '../bower_components/spice-html5/cursor',
    'spice-jsbn': '../bower_components/spice-html5/thirdparty/jsbn',
    'spice-rsa': '../bower_components/spice-html5/thirdparty/rsa',
    'spice-prng4': '../bower_components/spice-html5/thirdparty/prng4',
    'spice-rng': '../bower_components/spice-html5/thirdparty/rng',
    'spice-sha1': '../bower_components/spice-html5/thirdparty/sha1',
    'spice-ticket': '../bower_components/spice-html5/ticket',
    'spice-resize': '../bower_components/spice-html5/resize',
    'spice-filexfer': '../bower_components/spice-html5/filexfer',

    /* vis.js */
    'vis': '../bower_components/vis/dist/vis.min'
  },
  shim: {
    /* Tabs */
    'app': {
      deps: [
        'foundation',
        'jquery',
        'tabs/provision-tab',
        'tabs/dashboard-tab',
        'tabs/system-top-tab',
        'tabs/users-tab',
        'tabs/groups-tab',
        'tabs/vdcs-tab',
        'tabs/acls-tab',
        'tabs/templates-top-tab',
        'tabs/templates-tab',
        'tabs/oneflow-templates-tab',
        'tabs/vrouter-templates-tab',
        'tabs/instances-top-tab',
        'tabs/vms-tab',
        'tabs/oneflow-services-tab',
        'tabs/vrouters-tab',
        'tabs/infrastructure-top-tab',
        'tabs/clusters-tab',
        'tabs/hosts-tab',
        'tabs/zones-tab',
        'tabs/storage-top-tab',
        'tabs/datastores-tab',
        'tabs/images-tab',
        'tabs/files-tab',
        'tabs/marketplaces-tab',
        'tabs/marketplaceapps-tab',
        'tabs/network-top-tab',
        'tabs/vnets-tab',
        'tabs/vnets-topology-tab',
        'tabs/secgroups-tab',
        'tabs/settings-tab',
        'tabs/support-tab',
        'tabs/upgrade-top-tab'
      ]
    },

    /* jQuery */
    'jquery': {
      exports: '$'
    },

    /* jGrowl */
    'jgrowl': {
      deps: ['jquery']
    },

    /* Foundation */
    'foundation': {
        deps: ['jquery']
    },
    //'foundation.core': {
    //  deps: ['jquery', 'modernizr'],
    //  exports: 'Foundation'
    //},
    //'foundation.abide': {
    //  deps: ['foundation.core']
    //},
    //'foundation.accordion': {
    //  deps: ['foundation.core']
    //},
    //'foundation.alert': {
    //  deps: ['foundation.core']
    //},
    //'foundation.clearing': {
    //  deps: ['foundation.core']
    //},
    //'foundation.dropdown': {
    //  deps: ['foundation.core']
    //},
    //'foundation.equalizer': {
    //  deps: ['foundation.core']
    //},
    //'foundation.interchange': {
    //  deps: ['foundation.core']
    //},
    //'foundation.joyride': {
    //  deps: ['foundation.core', 'jquery.cookie']
    //},
    //'foundation.magellan': {
    //  deps: ['foundation.core']
    //},
    //'foundation.offcanvas': {
    //  deps: ['foundation.core']
    //},
    //'foundation.orbit': {
    //  deps: ['foundation.core']
    //},
    //'foundation.reveal': {
    //  deps: ['foundation.core']
    //},
    //'foundation.slider': {
    //  deps: ['foundation.core']
    //},
    //'foundation.tab': {
    //  deps: ['foundation.core']
    //},
    //'foundation.tooltip': {
    //  deps: ['foundation.core']
    //},
    //'foundation.topbar': {
    //  deps: ['foundation.core']
    //},

    /* Vendor Scripts */
    //'jquery.cookie': {
    //  deps: ['jquery']
    //},
    //'fastclick': {
    //  exports: 'FastClick'
    //},
    //'modernizr': {
    //  exports: 'Modernizr'
    //},
    //'placeholder': {
    //  exports: 'Placeholders'
    //},

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

    /* VNC */
    'vnc-util': {
      exports: 'Util'
    },
    'vnc-webutil': {
      deps: ["vnc-util"]
    },
    'vnc-base64': {
      deps: ["vnc-util"]
    },
    'vnc-websock': {
      deps: ["vnc-util"]
    },
    'vnc-des': {
      deps: ["vnc-util"]
    },
    'vnc-keysymdef': {
      deps: ["vnc-util"]
    },
    'vnc-keyboard': {
      deps: ["vnc-util"]
    },
    'vnc-input': {
      deps: ["vnc-util"]
    },
    'vnc-display': {
      deps: ["vnc-util"]
    },
    'vnc-jsunzip': {
      deps: ["vnc-util"]
    },
    'vnc-rfb': {
      deps: ["vnc-util"]
    },
    'vnc-keysym': {
      deps: ["vnc-util"]
    },

    'spice-main': {
      exports: 'SpiceMainConn',
      deps: [
        'spice-spiceconn',
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

    'spice-rng': {
      deps: [
        'spice-prng4'
      ]
    },

    'spice-display': {
      deps: [
        'spice-spiceconn'
      ]
    },

    'spice-inputs': {
      deps: [
        'spice-spiceconn'
      ]
    },

    'spice-playback': {
      deps: [
        'spice-spiceconn'
      ]
    },

    'spice-cursor': {
      deps: [
        'spice-spiceconn'
      ]
    }
  }
});

require(['app'], function(App) {});
