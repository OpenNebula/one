/* -------------------------------------------------------------------------- */
/* Copyright 2002-2017, OpenNebula Project, OpenNebula Systems                */
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
  var CanImportWilds = require('../utils/can-import-wilds');
  var OpenNebulaHost = require('opennebula/host');
  var OpenNebulaAction = require('opennebula/action');
  var OpenNebulaNetwork = require('opennebula/network');
  var OpenNebulaImage = require('opennebula/image');
  var OpenNebulaError = require('opennebula/error');
  var Sunstone = require('sunstone');
  var Notifier = require('utils/notifier');
  var Navigation = require('utils/navigation');

  /*
    TEMPLATES
   */

  var TemplateWilds = require('hbs!./wilds/html');

  /*
    CONSTANTS
   */

  var PANEL_ID = require('./wilds/panelId');
  var RESOURCE = "Host"

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

  function rollback_nics_and_disk(error_message, vmName, rollback_items, that, context, wild_row) {
    var rollback_index = 0;

    function nextRollback() {

      if (rollback_items.length == rollback_index) {
        var msg = Locale.tr("Could not import the wild VM " + vmName + " due to " + error_message + ". A rollback has been applied.");
        Notifier.notifyError(msg);
        $("#import_wilds", context).removeAttr("disabled").off("click.disable");
        $("#import_wilds", context).html(Locale.tr("Import Wilds"));

      } else {
          if (rollback_items[rollback_index].type === "NETWORK") {
            var path = '/vcenter/network_rollback/' + rollback_items[rollback_index].id;
            $.ajax({
              url: path,
              type: "POST",
              data: {timeout: false},
              dataType: "json",
              success: function(response){
                ++rollback_index;
                nextRollback();
              },
              error: function(response){
                var msg = OpenNebulaError(response).error.message;
                Notifier.notifyError(msg);
                $("#import_wilds", context).removeAttr("disabled").off("click.disable");
                $("#import_wilds", context).html(Locale.tr("Import Wilds"));              }
              });
          }

          if (rollback_items[rollback_index].type === "IMAGE") {
            var path = '/vcenter/image_rollback/' + rollback_items[rollback_index].id;
            $.ajax({
              url: path,
              type: "POST",
              data: {timeout: false},
              dataType: "json",
              success: function(response){
                ++rollback_index;
                nextRollback();
              },
              error: function(response){
                var msg = OpenNebulaError(response).error.message;
                Notifier.notifyError(msg);
                $("#import_wilds", context).removeAttr("disabled").off("click.disable");
                $("#import_wilds", context).html(Locale.tr("Import Wilds"));
              }
            });
          }
      }
    }

    nextRollback();
  }


  function import_images_and_nets(disks_and_nets, importHostId, vmName, that, context, wild_row) {
    var index = 0;
    var template = "";
    var rollback  = [];
    var duplicated_nics = {};

    function getNext() {

      // Update the template
      if (disks_and_nets.length == index) {

          // Create the VM in OpenNebula
          var dataJSON = {
            'id': importHostId,
            'extra_param': {
              'name': vmName
            }
          };

          OpenNebulaHost.import_wild({
            timeout: true,
            data: dataJSON,
            success: function(request, response) {
              OpenNebulaAction.clear_cache("VM");
              Notifier.notifyCustom(Locale.tr("VM imported"),
                Navigation.link(" ID: " + response.VM.ID, "vms-tab", response.VM.ID),
                false);

              // Delete row (shouldn't be there in next monitorization)
              that.dataTableWildHosts.fnDeleteRow(wild_row);

              $("#import_wilds", context).removeAttr("disabled").off("click.disable");
              $("#import_wilds", context).html(Locale.tr("Import Wilds"));
            },
            error: function (request, error_json) {
              rollback_nics_and_disk(error_json.error.message, vmName, rollback, that, context, wild_row);
            }
          });

      } else {

        if (disks_and_nets[index].type === "NEW_DISK") {

            var image_json = {
              "image": {
                "image_raw": disks_and_nets[index].image_tmpl
              },
              "ds_id" : disks_and_nets[index].ds_id
            };

            OpenNebulaImage.create({
              timeout: true,
              data: image_json,
              success: function(request, response) {
                var image_id    = response.IMAGE.ID;
                var image_uname = response.IMAGE.UNAME;
                ++index;
                var rollback_info = { type: "IMAGE", id: image_id};
                rollback.push(rollback_info);
                getNext();
              },
              error: function (request, error_json) {
                var error_message_str = error_json.error.message;

                // Rollback
                var msg = (error_json.error.message || Locale.tr("Cannot contact server: is it running and reachable?"));
                Notifier.notifyError(msg);
                $("#import_wilds", context).removeAttr("disabled").off("click.disable");
                $("#import_wilds", context).html(Locale.tr("Import Wilds"));

                rollback_nics_and_disk(error_json.error.message, vmName, rollback, that, context, wild_row);
              }
            });
          }

          if (disks_and_nets[index].type === "EXISTING_DISK") {
            ++index;
            getNext();
          }

          if (disks_and_nets[index].type === "NEW_NIC") {

              var vnet_json = {
                "vnet": {
                  "vnet_raw": disks_and_nets[index].network_tmpl
                }
              };

              var one_cluster_id  = disks_and_nets[index].one_cluster_id;

              OpenNebulaNetwork.create({
                timeout: true,
                data: vnet_json,
                success: function(request, response) {
                  var network_id = response.VNET.ID;
                  if (one_cluster_id != -1) {
                    Sunstone.runAction("Cluster.addvnet",one_cluster_id,response.VNET.ID);
                    // Remove vnet from cluster default 0
                    Sunstone.runAction("Cluster.delvnet",0,response.VNET.ID);
                  }
                  ++index;
                  var rollback_info = { type: "NETWORK", id: network_id};
                  rollback.push(rollback_info);
                  getNext();
                },
                error: function (request, error_json) {
                  // Rollback
                  var msg = (error_json.error.message || Locale.tr("Cannot contact server: is it running and reachable?"));
                  Notifier.notifyError(msg);
                  $("#import_wilds", context).removeAttr("disabled").off("click.disable");
                  $("#import_wilds", context).html(Locale.tr("Import Wilds"));

                  //rollback_nics_and_disk(error_json.error.message, template_id, rollback, row_context);
                }
              });
          }

          if (disks_and_nets[index].type == "EXISTING_NIC") {
            ++index;
            getNext();
          }

          if (disks_and_nets[index].type === "DUPLICATED_NIC") {
            ++index;
            getNext();
          }
      }
    }
    getNext();
  }

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
          {"sWidth": "35px", "aTargets": [0]}
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
        var template = elem.IMPORT_TEMPLATE;

        if (name && deploy_id && template) {
          var wilds_list_array = [
            [
              '<input type="checkbox" class="import_wild_checker import_' + index + '" unchecked/>',
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
        var importHostId = that.element.ID;
        var wild_row       = $(this).closest('tr');

        var aData = that.dataTableWildHosts.fnGetData(wild_row);
        var vmName = aData[1];
        var remoteID = aData[2];
        if (remoteID.startsWith("vm-")) {

            var path = '/vcenter/wild/' + remoteID;
            $.ajax({
                url: path,
                type: "GET",
                data: {timeout: false},
                headers: {
                  "X-VCENTER-USER": that.element.TEMPLATE.VCENTER_USER,
                  "X-VCENTER-PASSWORD": that.element.TEMPLATE.VCENTER_PASSWORD,
                  "X-VCENTER-HOST": that.element.TEMPLATE.VCENTER_HOST
                },
                dataType: "json",
                success: function(response){
                  var disks_and_nets = response.disks.concat(response.nics)
                  import_images_and_nets(disks_and_nets, importHostId, vmName, that, context, wild_row);
                },
                error: function(response){
                  var msg;
                  if (response.responseJSON && response.responseJSON.error.message){
                    msg = response.responseJSON.error.message;
                  } else {
                    msg = Locale.tr("Cannot contact server: is it running and reachable?");
                  }

                  Notifier.notifyError(msg);

                  $("#import_wilds", context).removeAttr("disabled").off("click.disable");
                  $("#import_wilds", context).html(Locale.tr("Import Wilds"));
                }
            });

        } else {

          var dataJSON = {
            'id': importHostId,
            'extra_param': {
              'name': vmName
            }
          };

          // Create the VM in OpenNebula
          OpenNebulaHost.import_wild({
            timeout: true,
            data: dataJSON,
            success: function(request, response) {
              OpenNebulaAction.clear_cache("VM");
              Notifier.notifyCustom(Locale.tr("VM imported"),
                Navigation.link(" ID: " + response.VM.ID, "vms-tab", response.VM.ID),
                false);

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
        }
      });
    });

    return false;
  }
});
