/* -------------------------------------------------------------------------- */
/* Copyright 2002-2015, OpenNebula Project, OpenNebula Systems                */
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

  require('foundation-datatables');
  var Locale = require('utils/locale');
  var CanImportWilds = require('../utils/can-import-wilds');
  var OpenNebulaVM = require('opennebula/vm');
  var OpenNebulaAction = require('opennebula/action');
  var Sunstone = require('sunstone');
  var Notifier = require('utils/notifier');

  /*
    TEMPLATES
   */

  var TemplateWilds = require('hbs!./wilds/html');

  /*
    CONSTANTS
   */

  var PANEL_ID = require('./wilds/panelId');
  var RESOURCE = "Host"
  var IMPORT_TEMPLATE_COLUMN = 3;

  /*
    CONSTRUCTOR
   */

  function Panel(info) {
    this.title = Locale.tr("Wilds");
    this.icon = "fa-hdd-o";

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

    // Hide the import button if the Wilds cannot be imported
    if (!CanImportWilds(this.element)) {
      $("#import_wilds").hide();
    }

    that.dataTableWildHosts = $("#datatable_host_wilds", context).dataTable({
      "bSortClasses" : false,
      "bDeferRender": true,
      "aLengthMenu": [[2, 12, 36, 72], [2, 12, 36, 72]],
      "aoColumnDefs": [
          {"bSortable": false, "aTargets": [0]},
          {"sWidth": "35px", "aTargets": [0]},
          {"bVisible": true, "aTargets": [0, 1, 2]}, // Hide Import Template column
          {"bVisible": false, "aTargets": ['_all']}
      ]
    });

    if (that.element.TEMPLATE.VM) {
      var wilds = that.element.TEMPLATE.VM;

      if (!$.isArray(wilds)) { // If only 1 VM convert to array
        wilds = [wilds];
      }

      $.each(wilds, function(index, elem) {
        var name      = elem.VM_NAME;
        var deploy_id = elem.DEPLOY_ID;
        var template = elem.IMPORT_TEMPLATE || '';

        if (name && deploy_id && template) {
          var wilds_list_array = [
            [
              '<input type="checkbox" class="import_wild_checker import_' + index + '" unchecked/>',
              name,
              deploy_id,
              template
            ]
          ];

          that.dataTableWildHosts.fnAddData(wilds_list_array);
        }
      });
    }

    delete that.element.TEMPLATE.WILDS;
    delete that.element.TEMPLATE.VM;

    // Enable the import button when at least a VM is selected
    $("#import_wilds", context).attr("disabled", "disabled").on("click.disable", function(e) { return false; });

    context.off("change", ".import_wild_checker");
    context.on("change", ".import_wild_checker", function(){
      if ($(".import_wild_checker:checked", context).length == 0){
        $("#import_wilds", context).attr("disabled", "disabled").on("click.disable", function(e) { return false; });
      } else {
        $("#import_wilds", context).removeAttr("disabled").off("click.disable");
      }
    });

    // Add event listener for importing WILDS
    context.off("click", '#import_wilds');
    context.on("click", '#import_wilds', function () {
      $("#import_wilds", context).attr("disabled", "disabled").on("click.disable", function(e) { return false; });
      $("#import_wilds", context).html('<i class="fa fa-spinner fa-spin"></i>');

      $(".import_wild_checker:checked", "#datatable_host_wilds").each(function() {
        var import_host_id = that.element.ID;
        var wild_row       = $(this).closest('tr');

        var aData = that.dataTableWildHosts.fnGetData(wild_row);
        var wildTemplate64 = aData[IMPORT_TEMPLATE_COLUMN];

        if (wildTemplate64 !== '') {
          var vm_json = {
            "vm": {
              "vm_raw": atob(wildTemplate64)
            }
          };

          // Create the VM in OpenNebula
          OpenNebulaVM.create({
            timeout: true,
            data: vm_json,
            success: function(request, response) {
              OpenNebulaAction.clear_cache("VM");

              var extra_info = {};

              extra_info['host_id'] = import_host_id;
              extra_info['ds_id']   = -1;
              extra_info['enforce'] = false;

              // Deploy the VM
              Sunstone.runAction("VM.silent_deploy_action",
                                 response.VM.ID,
                                 extra_info);

              // Notify
              Notifier.notifyCustom(Locale.tr("VM imported"), " ID: " + response.VM.ID, false);

              // Delete row (shouldn't be there in next monitorization)
              that.dataTableWildHosts.fnDeleteRow(wild_row);

              $("#import_wilds", context).removeAttr("disabled").off("click.disable");
              $("#import_wilds", context).html(Locale.tr("Import Wilds"));
            },
            error: function (request, error_json) {
              var msg;
              if (error_json.error.message){
                msg = error_json.error.message;
              } else {
                msg = Locale.tr("Cannot contact server: is it running and reachable?");
              }

              Notifier.notifyError(msg);

              $("#import_wilds", context).removeAttr("disabled").off("click.disable");
              $("#import_wilds", context).html(Locale.tr("Import Wilds"));
            }
          });
        } else {
          Notifier.notifyError(Locale.tr("This resources doesn't have a template to be imported"));
        }
      });
    });

    return false;
  }
});
