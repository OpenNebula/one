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

  require("datatables.net");
  require("datatables.foundation");
  var Locale = require("utils/locale");
  var CanImportWilds = require("../utils/can-import-wilds");
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
    // Hide the import button if the Wilds cannot be imported
    if (!CanImportWilds(this.element)) {
      $("#import_wilds").hide();
    }

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
    context.off("click", "#import_wilds");
    context.on("click", "#import_wilds", function () {
      $("#import_wilds", context).attr("disabled", "disabled").on("click.disable", function(e) { return false; });
      $("#import_wilds", context).html("<i class=\"fas fa-spinner fa-spin\"></i>");

      if (that.element.TEMPLATE.HYPERVISOR === "vcenter"){
        var path = "/vcenter/wild";
        var resource = "Wild";
        var vcenter_refs = [];
        var opts = {};
        $(".import_wild_checker:checked", "#datatable_host_wilds").each(function() {
          var wild_obj = $(this).attr("import_data");
          try{
            var wild_data = JSON.parse(wild_obj);
            if(wild_data && wild_data.DEPLOY_ID){
              var ref = wild_data.DEPLOY_ID;
              vcenter_refs.push(ref);
              opts[ref] = wild_data;
            }
          }catch(error){
            Notifier.notifyError("Empty data Vm Wild");
          }
        });

        $.ajax({
          url: path,
          type: "POST",
          data: {
            wilds: vcenter_refs.join(","),
            opts: opts,
            host: that.element.ID,
            timeout: false
          },
          dataType: "json",
          success: function(response){
            $.each(response.success, function(key, value){
              Notifier.notifyCustom(Locale.tr("VM imported"),
              Navigation.link(" ID: " + value, "vms-tab", value), false);
            });
            VCenterCommon.jGrowlFailure({error : response.error, resource : resource});
          },
          error: function (request, error_json) {
            if (request.responseJSON === undefined){
              Notifier.notifyError("Empty response received from server. Check your setup to avoid timeouts");
            } else {
              Notifier.notifyError(request.responseJSON.error.message);
            }
          },
          complete: function (data) {
            $("#import_wilds", context).removeAttr("disabled").off("click.disable");
            $("#import_wilds", context).html(Locale.tr("Import Wilds"));
          }
        });
      } else {
        $(".import_wild_checker:checked", "#datatable_host_wilds").each(function() {
          var wild_row = $(this).closest("tr");
          var aData = that.dataTableWildHosts.fnGetData(wild_row);

          var dataJSON = {
            "id": that.element.ID,
            "extra_param": {
              "name": aData[1]
            }
          };

          // Create the VM in OpenNebula
          OpenNebulaHost.import_wild({
            timeout: true,
            data: dataJSON,
            success: function(request, response) {
              OpenNebulaAction.clear_cache("VM");
              Notifier.notifyCustom(Locale.tr("VM imported"),
              Navigation.link(" ID: " + response.VM.ID, "vms-tab", response.VM.ID), false);
              // Delete row (shouldn't be there in next monitorization)
              that.dataTableWildHosts.fnDeleteRow(wild_row);
            },
            error: function (request, error_json) {
              wildsError(error_json, context);
            },
            complete: function (data) {
              $("#import_wilds", context).removeAttr("disabled").off("click.disable");
              $("#import_wilds", context).html(Locale.tr("Import Wilds"));
            }
          });
        });
      }
    });

    return false;
  }

  function wildsError(error_json, context){
    var msg;
    if (error_json.error.message){
      msg = error_json.error.message;
    } else {
      msg = Locale.tr("Cannot contact server: is it running and reachable?");
    }
    Notifier.notifyError(msg);
  }
});
