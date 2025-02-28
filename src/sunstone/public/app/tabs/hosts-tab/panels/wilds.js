/* -------------------------------------------------------------------------- */
/* Copyright 2002-2025, OpenNebula Project, OpenNebula Systems                */
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

  require("datatables.net");
  require("datatables.foundation");
  var Locale = require("utils/locale");
  var OpenNebulaHost = require("opennebula/host");
  var OpenNebulaAction = require("opennebula/action");
  var Notifier = require("utils/notifier");
  var Navigation = require("utils/navigation");
  var VCenterCommon = require("utils/vcenter/vcenter-common");

  /*
    TEMPLATES
   */

  var TemplateWilds = require("hbs!./wilds/html");

  /*
    CONSTANTS
   */

  var PANEL_ID = require("./wilds/panelId");
  var RESOURCE = "Host";

  /*
    CONSTRUCTOR
   */

  function Panel(info) {
    this.title = Locale.tr("Wilds");
    this.icon = "fa-hdd";

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
    return TemplateWilds();
  }

  function _setup(context) {
    var that = this;

    that.dataTableWildHosts = $("#datatable_host_wilds", context).dataTable({
      "bSortClasses" : false,
      "bDeferRender": true,
      "bAutoWidth": false,
      "aoColumnDefs": [
          {"bSortable": false, "aTargets": [0]},
          {"sWidth": "35px", "aTargets": [0]},
          {"sType": "string", "aTargets": [1]}
      ],
      "aLengthMenu": [ [10, 25, 50, -1], [10, 25, 50, "All"] ]
    });

    if (that.element.TEMPLATE.VM) {
      var wilds = that.element.TEMPLATE.VM;
      if (!Array.isArray(wilds)) { // If only 1 VM convert to array
        wilds = [wilds];
      }

      wilds.map(function(elem,index){
        var name      = elem && elem.VM_NAME;
        var deploy_id = elem && elem.DEPLOY_ID;
        var template = elem && elem.IMPORT_TEMPLATE;
        if (name && deploy_id && template) {
          var wilds_list_array = [
            [
              "<input type='checkbox' class='import_wild_checker import_" + index + "' unchecked import_data='"+JSON.stringify(elem)+"' />",
              name,
              deploy_id
            ]
          ];
          that.dataTableWildHosts.fnAddData(wilds_list_array);
        }
      });
    }

    delete that.element.TEMPLATE.WILDS;
    delete that.element.TEMPLATE.VM;

    // Perform search in wilds VM
    $("#host_wilds_search").on('input', function() {
      that.dataTableWildHosts.fnFilter($(this).val());
      return false;
    })

    return false;
  }

});
