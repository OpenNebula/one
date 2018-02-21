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
  // Dependencies
  var Locale = require('utils/locale');
  var OpenNebulaTemplate = require('opennebula/template');
  var OpenNebulaNetwork = require('opennebula/network');
  var OpenNebulaImage = require('opennebula/image');
  var OpenNebulaError = require('opennebula/error');
  var DomDataTable = require('utils/dom-datatable');
  var UserInputs = require('utils/user-inputs');
  var Notifier = require('utils/notifier');
  var UniqueId = require('utils/unique-id');
  var VCenterCommon = require('./vcenter-common');
  var Sunstone = require('sunstone');
  var Tips = require('utils/tips');

  var TemplateHTML = require('hbs!./common/html');
  var RowTemplate = require('hbs!./templates/row');
  var EmptyFieldsetHTML = require('hbs!./common/empty-fieldset');
  var FieldsetTableHTML = require('hbs!./common/fieldset-table');

  function VCenterTemplates() {
    return this;
  }

  VCenterTemplates.prototype = {
    'html': VCenterCommon.html,
    'insert': _fillVCenterTemplates,
    'import': _import
  };
  VCenterTemplates.prototype.constructor = VCenterTemplates;

  return VCenterTemplates;

  /*
    Retrieve the list of templates from vCenter and fill the container with them
    opts = {
      datacenter: "Datacenter Name",
      cluster: "Cluster Name",
      container: Jquery div to inject the html,
      vcenter_user: vCenter Username,
      vcenter_password: vCenter Password,
      vcenter_host: vCenter Host
    }
   */
  function _fillVCenterTemplates(opts) {
    this.opts = opts;
    var path = '/vcenter/templates';

    var context = $(".vcenter_import", opts.container);
    context.html(TemplateHTML());
    context.show();

    $.ajax({
      url: path,
      type: "GET",
      data: {timeout: false},
      dataType: "json",
      headers: {
        "X-VCENTER-USER": opts.vcenter_user,
        "X-VCENTER-PASSWORD": opts.vcenter_password,
        "X-VCENTER-HOST": opts.vcenter_host
      },
      success: function(response){
        $(".vcenter_datacenter_list", context).html("");

        $.each(response, function(datacenter_name, elements){
          var content;
          if (elements.length == 0) {
            content = EmptyFieldsetHTML({
              title : datacenter_name + ' ' + Locale.tr("DataCenter"),
              message : Locale.tr("No new templates found in this DataCenter")
            });

            $(".vcenter_datacenter_list", context).append(content);
          } else {
            var tableId = "vcenter_import_table_" + UniqueId.id();
            content = FieldsetTableHTML({
              tableId : tableId,
              title : datacenter_name + ' ' + Locale.tr("DataCenter"),
              clearImported : Locale.tr("Clear Imported Templates"),
              toggleAdvanced : true,
              columns : [
                '<input type="checkbox" class="check_all"/>',
                Locale.tr("Template")
              ]
            });

            var newdiv = $(content).appendTo($(".vcenter_datacenter_list", context));
            var tbody = $('#' + tableId + ' tbody', context);

            $.each(elements, function(id, element) {
              var opts = {};

              opts.data = element;
              opts.id = UniqueId.id();

              if (element.rp && element.rp !== '') {
                opts.resourcePool = UserInputs.unmarshall(element.rp);
                opts.resourcePool.params = opts.resourcePool.params.split(",");
               /* $.each(opts.resourcePool.params, function(){
                  $("#available_rps_" + opts.id + " [value ='" + this + "']").mousedown(function(e) {
                    e.preventDefault();
                    $(this).prop('selected', !$(this).prop('selected'));
                    return false;
                  });
                });*/
              }

              var trow = $(RowTemplate(opts)).appendTo(tbody);
              Tips.setup(trow);

              $("#modify_rp_" + opts.id).change(function(){
                var val = $("#modify_rp_" + opts.id).val();
                if (val == "default"){
                  $("#div_rp_" + opts.id).hide();
                } else if (val == "fixed"){
                  $("#div_rp_" + opts.id).show();
                  $("#available_rps_" + opts.id).attr("multiple", false);
                } else {
                  $("#div_rp_" + opts.id).show();
                  $("#available_rps_" + opts.id).attr("multiple", true);
                }
              });

              $("#linked_clone_"+opts.id).on("change", function(){
                if ($("#linked_clone_"+opts.id).is(":checked")){
                  $("#create_"+opts.id).show();
                } else {
                  $("#create_"+opts.id).hide();
                  $("#create_copy_"+opts.id).prop("checked", false);
                  $("#name_"+opts.id).hide();
                }
              });

              $("#create_copy_"+opts.id).on("change", function(){
                if ($("#create_copy_"+opts.id).is(":checked")){
                  $("#name_"+opts.id).show();
                } else {
                  $("#name_"+opts.id).hide();
                }
              });

              $('.check_item', trow).data("import_data", element);
            });

            var elementsTable = new DomDataTable(
              tableId,
              {
                actions: false,
                info: false,
                dataTableOptions: {
                  "bAutoWidth": false,
                  "bSortClasses" : false,
                  "bDeferRender": false,
                  "ordering": false,
                  "aoColumnDefs": [
                  {"sWidth": "35px", "aTargets": [0]},
                  ],
                },
                "customTrListener": function(tableObj, tr){ return false; }
              });

            elementsTable.initialize();

            $("a.vcenter-table-select-all").text(Locale.tr("Select all %1$s Templates", elements.length));

            VCenterCommon.setupTable({
              context : newdiv,
              allSelected : Locale.tr("All %1$s Templates selected."),
              selected: Locale.tr("%1$s Templates selected.")
            });

            context.off('click', '.clear_imported');
            context.on('click', '.clear_imported', function() {
              _fillVCenterTemplates(opts);
              return false;
            });
          }
        });
      },
      error: function(response){
        context.hide();
        Notifier.onError({}, OpenNebulaError(response));
      }
    });
  }

  function rollback_nics_and_disk(error_message, template_id, rollback_items, row_context) {
    var rollback_index = 0;

    function nextRollback() {

      if (rollback_items.length == rollback_index) {
        var path = '/vcenter/template_rollback/' + template_id;
        $.ajax({
          url: path,
          type: "POST",
          data: {timeout: false},
          dataType: "json",
          success: function(response){
            VCenterCommon.importFailure({
                context : row_context,
                message : Locale.tr("Could not import the template due to " + error_message + ". A rollback has been applied.")
            });
          },
          error: function(response){
            VCenterCommon.importFailure({
                    context : row_context,
                    message : OpenNebulaError(response).error.message
            });
          }
        });
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
                VCenterCommon.importFailure({
                    context : row_context,
                    message : OpenNebulaError(response).error.message
                });
                Notifier.onError({}, OpenNebulaError(response));
              }
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
                VCenterCommon.importFailure({
                    context : row_context,
                    message : OpenNebulaError(response).error.message
                });
                Notifier.onError({}, OpenNebulaError(response));
              }
            });
          }
      }
    }

    nextRollback();
  }

  function import_images_and_nets(disks_and_nets, row_context, template_id) {
    var index = 0;
    var template = "";
    var rollback  = [];
    var duplicated_nics = {};

    function getNext() {

      // Update the template
      if (disks_and_nets.length == index) {
        var template_json = {
          "extra_param": template
        };

        Sunstone.runAction('Template.append_template', template_id, template);

        VCenterCommon.importSuccess({
          context : row_context,
          message : Locale.tr("Template created successfully. ID: %1$s", template_id)
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
                template += "DISK=[\n";
                template += "IMAGE_ID=\"" + image_id + "\",\n";
                template += "OPENNEBULA_MANAGED=\"NO\"\n";
                template += "]\n";

                var rollback_info = { type: "IMAGE", id: image_id};
                rollback.push(rollback_info);
                getNext();
              },
              error: function (request, error_json) {
                var error_message_str = error_json.error.message;

                // Rollback
                VCenterCommon.importFailure({
                  context : row_context,
                  message : (error_json.error.message || Locale.tr("Cannot contact server: is it running and reachable?"))
                });

                rollback_nics_and_disk(error_json.error.message, template_id, rollback, row_context);
              }
            });
          }

          if (disks_and_nets[index].type === "EXISTING_DISK") {
            template += disks_and_nets[index].image_tmpl;
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
                    //Remove bnet from default datastore
                    Sunstone.runAction("Cluster.delvnet",0,response.VNET.ID);
                  }
                  duplicated_nics[disks_and_nets[index].network_name]=network_id;

                  ++index;
                  template += "NIC=[\n";
                  template += "NETWORK_ID=\"" + network_id + "\",\n";
                  template += "OPENNEBULA_MANAGED=\"NO\"\n";
                  template += "]\n";

                  var rollback_info = { type: "NETWORK", id: network_id};
                  rollback.push(rollback_info);
                  getNext();
                },
                error: function (request, error_json) {
                  // Rollback
                  VCenterCommon.importFailure({
                    context : row_context,
                    message : (error_json.error.message || Locale.tr("Cannot contact server: is it running and reachable?"))
                  });

                  rollback_nics_and_disk(error_json.error.message, template_id, rollback, row_context);
                }
              });
          }

          if (disks_and_nets[index] != undefined && disks_and_nets[index].type == "EXISTING_NIC") {
            template += disks_and_nets[index].network_tmpl;
            ++index;
            getNext();
          }

          if (disks_and_nets[index] != undefined && disks_and_nets[index].type == "DUPLICATED_NIC") {
            var network_id = duplicated_nics[disks_and_nets[index].network_name];

            template += "NIC=[\n";
            template += "NETWORK_ID=\"" + network_id + "\",\n";
            template += "OPENNEBULA_MANAGED=\"NO\"\n";
            template += "]\n";
            ++index;
            getNext();
          }
      }
    }
    getNext();
  }

  function _import(context) {
    that = this;
    $.each($(".vcenter_import_table", context), function() {
      var checked = $(this).DataTable().$(".check_item:checked");
      if (checked.length > 1){
        Notifier.notifySubmit(Locale.tr("Please select one (and just one) template to import."));
        return false;
      }
      $.each($(this).DataTable().$(".check_item:checked"), function() {
        var vcenter_ref = $(this).data("import_data").vcenter_ref;
        var linked = false;
        var copy = false;
        var template_name = "";
        var row_context = $(this).closest("tr");

        VCenterCommon.importLoading({context : row_context});

        var attrs = [];
        var userInputs = [];

        // Retrieve Resource Pool Attribute
        var rpInput = $(".vcenter_rp_input", row_context);
        if (rpInput.length > 0) {
          var rpModify = $('.modify_rp', rpInput).val();
          var rpParams = "";
          var linkedClone = $('.linked_clone', rpInput).prop("checked");
          var createCopy = $('.create_copy', rpInput).prop("checked");
          var templateName = $('.template_name', rpInput).val();

          if (linkedClone) {
            linked = true;

            if (createCopy && templateName != "") {
              copy = true;
              template_name  = templateName;
            } else {
              copy = false;
              template_name = "";
            }
          }

          $.each($('.available_rps option:selected', rpInput), function(){
            rpParams += $(this).val() + ",";
          });
          var rpParams = rpParams.slice(0,-1);

          if (rpModify === 'fixed' && rpParams!== '') {
            attrs.push('VCENTER_RESOURCE_POOL="' + rpParams + '"');
          } else if (rpModify === 'list' && rpParams !== '') {
            var rpUserInputs = UserInputs.marshall({
                type: 'list',
                description: Locale.tr("Which resource pool you want this VM to run in?"),
                initial: "",
                params: rpParams
              });

            userInputs.push('VCENTER_RESOURCE_POOL="' + rpUserInputs + '"');
          }
        }

        // Append new attrs and user inputs if necessary
        var template = $(this).data("import_data").one;

        if (attrs.length > 0) {
          template += "\n" + attrs.join("\n");
        }

        if (userInputs.length > 0) {
          template += "\nUSER_INPUTS=[\n" + userInputs.join(",\n") + "]";
        }

        if (linked) {
          template += "\nVCENTER_LINKED_CLONES=\"YES\"";
        }

        if($(this).data("import_data").import_disks_and_nics){
              var template_json = {
                "vmtemplate": { "template_raw": template }
              };
              OpenNebulaTemplate.create({
                timeout: false,
                data: template_json,
                success: function(request, response) {
                   VCenterCommon.importLoading({
                      context : row_context,
                      message : Locale.tr("Importing images and vnets associated to template disks and nics...")
                   });
                   var template_id = response.VMTEMPLATE.ID;
                   var path = '/vcenter/template/' + vcenter_ref + '/' + template_id;

                   $.ajax({
                    url: path,
                    type: "GET",
                    data: {
                      timeout: false,
                      use_linked_clones: linked,
                      create_copy: copy,
                      template_name: template_name
                    },
                    headers: {
                      "X-VCENTER-USER": that.opts.vcenter_user,
                      "X-VCENTER-PASSWORD": that.opts.vcenter_password,
                      "X-VCENTER-HOST": that.opts.vcenter_host
                    },
                    dataType: "json",
                    success: function(response){
                      var disks_and_nets = response.disks.concat(response.nics);

                      var template_json = {
                        "vmtemplate": { "template_raw": response.one }
                      };

                      if(response.create_copy){
                        OpenNebulaTemplate.del({
                          timeout: true,
                          data : {
                            id : template_id
                          },
                          success: function(){
                            OpenNebulaTemplate.create({
                              timeout: false,
                              data: template_json,
                              success: function(request, response){
                                import_images_and_nets(disks_and_nets, row_context, response.VMTEMPLATE.ID);
                              }
                            });
                          }
                        });
                      } else {
                        import_images_and_nets(disks_and_nets, row_context, template_id);
                      }
                    },
                    error: function(response){
                      VCenterCommon.importFailure({
                          context : row_context,
                          message : OpenNebulaError(response).error.message
                      });
                      Notifier.onError({}, OpenNebulaError(response));

                      // Remove template - Rollback
                      var path = '/vcenter/template_rollback/' + template_id;
                      $.ajax({
                        url: path,
                        type: "POST",
                        data: {timeout: false},
                        dataType: "json",
                        success: function(response){
                          // Do nothing
                        },
                        error: function(response){
                          VCenterCommon.importFailure({
                              context : row_context,
                              message : Locale.tr("Could not delete the template " + template_id + " due to " + OpenNebulaError(response).error.message + ". Please remote it manually before importing this template again.")
                          });
                        }
                      });
                    }
                  });
                },
                error: function (request, error_json) {
                  VCenterCommon.importFailure({
                    context : row_context,
                    message : (error_json.error.message || Locale.tr("Cannot contact server: is it running and reachable?"))
                  });
                }
            });
        }
        else {
          var template_json = {
            "vmtemplate": {
              "template_raw": template
            }
          };

          OpenNebulaTemplate.create({
            timeout: true,
            data: template_json,
            success: function(request, response) {
              VCenterCommon.importSuccess({
                context : row_context,
                message : Locale.tr("Template created successfully. ID: %1$s", response.VMTEMPLATE.ID)
              });
            },
            error: function (request, error_json) {
              VCenterCommon.importFailure({
                context : row_context,
                message : (error_json.error.message || Locale.tr("Cannot contact server: is it running and reachable?"))
              });
            }
          });
        }
      });
    });
  }
});
