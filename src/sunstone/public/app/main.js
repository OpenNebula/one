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

require.config({
  paths: {
    /* Config */
    "sunstone-config": "sunstone-config",

    /* Almond */
    "almond": "../bower_components/almond/almond",

    /* jQuery */
    "jquery": "../bower_components/jquery/dist/jquery",
    "jquery-ui": "../bower_components/jquery-ui/jquery-ui",

    /** Wickedpicker */
    "wickedpicker": "../bower_components/wickedpicker/dist/wickedpicker.min",

    /** Guacamole-common-js */
    "guacamole-common-js": "../bower_components/guacamole-common-js/dist/guacamole-common.min",

    /* DataTables */
    "datatables.net": "../bower_components/datatables/media/js/jquery.dataTables",
    "datatables.foundation": "../bower_components/datatables/media/js/dataTables.foundation",

    /* jqrowl notfications */
    "jgrowl": "../bower_components/jgrowl/jquery.jgrowl",

    /* Foundation */
    "foundation": "../bower_components/foundation-sites/dist/foundation",

    /* Handlebars */
    "hbs": "../bower_components/require-handlebars-plugin/hbs",

    /* Resumable */
    "resumable": "../bower_components/resumablejs/resumable",

    /* Flot Graphs */
    "flot": "../bower_components/flot/jquery.flot",
    "flot.stack": "../bower_components/flot/jquery.flot.stack",
    "flot.navigate": "../bower_components/flot/jquery.flot.navigate",
    "flot.canvas": "../bower_components/flot/jquery.flot.canvas",
    "flot.resize": "../bower_components/flot/jquery.flot.resize",
    "flot.time": "../bower_components/flot/jquery.flot.time",
    "flot.tooltip": "../bower_components/flot.tooltip/js/jquery.flot.tooltip",

    /* VNC */
    "vnc-rfb": "../bower_components/no-vnc/lib/rfb",

    /* Spice */
    "spice-main": "../bower_components/spice-html5/main",
    "spice-spicearraybuffer": "../bower_components/spice-html5/spicearraybuffer",
    "spice-enums": "../bower_components/spice-html5/enums",
    "spice-atKeynames": "../bower_components/spice-html5/atKeynames",
    "spice-utils": "../bower_components/spice-html5/utils",
    "spice-png": "../bower_components/spice-html5/png",
    "spice-lz": "../bower_components/spice-html5/lz",
    "spice-quic": "../bower_components/spice-html5/quic",
    "spice-bitmap": "../bower_components/spice-html5/bitmap",
    "spice-spicedataview": "../bower_components/spice-html5/spicedataview",
    "spice-spicetype": "../bower_components/spice-html5/spicetype",
    "spice-spicemsg": "../bower_components/spice-html5/spicemsg",
    "spice-wire": "../bower_components/spice-html5/wire",
    "spice-spiceconn": "../bower_components/spice-html5/spiceconn",
    "spice-display": "../bower_components/spice-html5/display",
    "spice-inputs": "../bower_components/spice-html5/inputs",
    "spice-webm": "../bower_components/spice-html5/webm",
    "spice-playback": "../bower_components/spice-html5/playback",
    "spice-simulatecursor": "../bower_components/spice-html5/simulatecursor",
    "spice-cursor": "../bower_components/spice-html5/cursor",
    "spice-jsbn": "../bower_components/spice-html5/thirdparty/jsbn",
    "spice-rsa": "../bower_components/spice-html5/thirdparty/rsa",
    "spice-prng4": "../bower_components/spice-html5/thirdparty/prng4",
    "spice-rng": "../bower_components/spice-html5/thirdparty/rng",
    "spice-sha1": "../bower_components/spice-html5/thirdparty/sha1",
    "spice-ticket": "../bower_components/spice-html5/ticket",
    "spice-resize": "../bower_components/spice-html5/resize",
    "spice-filexfer": "../bower_components/spice-html5/filexfer",

    /* vis.js */
    "vis": "../bower_components/vis/dist/vis.min",

    /* navigo */
    "Navigo": "../bower_components/navigo/lib/navigo.min",

    /* sprintf */
    "sprintf": "../bower_components/sprintf/dist/sprintf.min",

    /* socket.io-client */
    "socket-io-client": "../bower_components/socket.io-client/dist/socket.io.min",

    /* ace editor */
    "ace-builds": "../bower_components/ace-builds/ace"
  },
  shim: {
    /* Tabs */
    "app": {
      deps: [
        "jquery",
        "foundation",
        "jquery-ui",
        "tabs/provision-tab",
        "tabs/dashboard-tab",
        "tabs/system-top-tab",
        "tabs/users-tab",
        "tabs/groups-tab",
        "tabs/vdcs-tab",
        "tabs/acls-tab",
        "tabs/templates-top-tab",
        "tabs/templates-tab",
        "tabs/oneflow-templates-tab",
        "tabs/vrouter-templates-tab",
        "tabs/instances-top-tab",
        "tabs/vms-tab",
        "tabs/oneflow-services-tab",
        "tabs/vrouters-tab",
        "tabs/infrastructure-top-tab",
        "tabs/clusters-tab",
        "tabs/hosts-tab",
        "tabs/zones-tab",
        "tabs/storage-top-tab",
        "tabs/datastores-tab",
        "tabs/images-tab",
        "tabs/files-tab",
        "tabs/backups-tab",
        "tabs/backupjob-tab",
        "tabs/marketplaces-tab",
        "tabs/marketplaceapps-tab",
        "tabs/network-top-tab",
        "tabs/vnets-tab",
        "tabs/vnets-templates-tab",
        "tabs/vnets-topology-tab",
        "tabs/secgroups-tab",
        "tabs/settings-tab",
        "tabs/support-tab",
        "tabs/official-support-tab",
        "tabs/vmgroup-tab",
        "addons/start",
        "addons/end"
      ]
    },

    /* jQuery */
    "jquery": {
      exports: "$"
    },

    /* jGrowl */
    "jgrowl": {
      deps: ["jquery"]
    },

    /* JQuery-UI */
    "jquery-ui": {
      deps: ["jquery"]
    },

    /* Foundation */
    "foundation": {
      deps: ["jquery"]
    },

    /* Flot Graphs */
    "flot": {
      deps: ["jquery"]
    },
    "flot.navigate": {
      deps: ["flot"]
    },
    "flot.canvas": {
      deps: ["flot"]
    },
    "flot.stack": {
      deps: ["flot"]
    },
    "flot.resize": {
      deps: ["flot"]
    },
    "flot.time": {
      deps: ["flot"]
    },
    "flot.tooltip": {
      deps: ["flot"]
    },
    "vnc-rfb": {
      deps: ["sunstone-config"]
    },
    "spice-main": {
      exports: "SpiceMainConn",
      deps: [
        "spice-spiceconn",
        "spice-spicearraybuffer",
        "spice-enums",
        "spice-atKeynames",
        "spice-utils",
        "spice-png",
        "spice-lz",
        "spice-quic",
        "spice-bitmap",
        "spice-spicedataview",
        "spice-spicetype",
        "spice-spicemsg",
        "spice-wire",
        "spice-display",
        "spice-inputs",
        "spice-webm",
        "spice-playback",
        "spice-simulatecursor",
        "spice-cursor",
        "spice-jsbn",
        "spice-rsa",
        "spice-prng4",
        "spice-rng",
        "spice-sha1",
        "spice-ticket",
        "spice-resize",
        "spice-filexfer"
      ]
    },

    "spice-rng": {
      deps: [
        "spice-prng4"
      ]
    },

    "spice-display": {
      deps: [
        "spice-spiceconn"
      ]
    },

    "spice-inputs": {
      deps: [
        "spice-spiceconn"
      ]
    },

    "spice-playback": {
      deps: [
        "spice-spiceconn"
      ]
    },

    "spice-cursor": {
      deps: [
        "spice-spiceconn"
      ]
    }
  }
});

require(["app"], function(App) {});
