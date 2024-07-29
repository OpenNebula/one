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

define(function(require) {
  /*
    DEPENDENCIES
   */

  require('datatables.net');
  require('datatables.foundation');
  var Locale = require('utils/locale');
  var OpenNebulaHost = require('opennebula/host');
  var OpenNebulaAction = require('opennebula/action');
  var Sunstone = require('sunstone');
  var Notifier = require('utils/notifier');

  /*
    TEMPLATES
   */

  var TemplateZombies = require('hbs!./zombies/html');

  /*
    CONSTANTS
   */

  var PANEL_ID = require('./zombies/panelId');
  var RESOURCE = "Host"

  /*
    CONSTRUCTOR
   */

  function Panel(info) {
    this.title = Locale.tr("Zombies");
    this.icon = "fa-bug";

    this.element = info[RESOURCE.toUpperCase()];

    return this;
  }

  Panel.PANEL_ID = PANEL_ID;
  Panel.prototype.html = _html;
  Panel.prototype.setup = _setup;

  return Panel;

  /*
    FUNCTION DEFINITIONS
   */

  function _html() {
    return TemplateZombies();
  }

  function _setup(context) {
    var that = this;

    that.dataTableZombieHosts = $("#datatable_host_zombies", context).dataTable({
      "bSortClasses" : false,
      "bDeferRender": true,
      "bAutoWidth": false,
      "aoColumnDefs": [
          {"bSortable": false, "aTargets": [0]},
          {"sWidth": "35px", "aTargets": [0]}
      ]
    });

    if (that.element.TEMPLATE.ZOMBIES) {
      var zombies = that.element.TEMPLATE.ZOMBIES;

      zombies = zombies.split(", ");

      $.each(zombies, function(index, elem) {
        var zombies_list_array = [
          [
            elem
          ]
        ];

        that.dataTableZombieHosts.fnAddData(zombies_list_array);
      });
    }

    delete that.element.TEMPLATE.ZOMBIES;

    return false;
  }
});
