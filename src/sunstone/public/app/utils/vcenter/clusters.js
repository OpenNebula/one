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
  // Dependencies
  var Locale = require("utils/locale");
  var Sunstone = require("sunstone");
  var OpenNebulaHost = require("opennebula/host");
  var OpenNebulaCluster = require("opennebula/cluster");
  var OpenNebulaError = require("opennebula/error");
  var DomDataTable = require("utils/dom-datatable");
  var Notifier = require("utils/notifier");
  var UniqueId = require("utils/unique-id");
  var VCenterCommon = require("./vcenter-common");

  var TemplateHTML = require("hbs!./common/html");
  var RowTemplate = require("hbs!./clusters/row");
  var EmptyFieldsetHTML = require("hbs!./common/empty-fieldset");
  var FieldsetTableHTML = require("hbs!./common/fieldset-table");

  function VCenterClusters() {
    return this;
  }

  VCenterClusters.prototype = {
    "html": VCenterCommon.html,
    "insert": _fillVCenterClusters,
    "import": _import
  };
  VCenterClusters.prototype.constructor = VCenterClusters;

  return VCenterClusters;

  /*
    opts = {
      container: Jquery div to inject the html,
      vcenter_user: vCenter Username,
      vcenter_password: vCenter Password,
      vcenter_host: vCenter Host
      success: function to call after a success
    }
   */
  function _fillVCenterClusters(opts) {
    this.opts = opts;

    var path = "/vcenter/hosts";

    var context = $(".vcenter_import", opts.container);
    context.html( TemplateHTML({}) );
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

        $.each(response, function(datacenter_name, elements) {
          var content;
          if (elements.length == 0) {
            content = EmptyFieldsetHTML({
              title : datacenter_name + " " + Locale.tr("DataCenter"),
              message : Locale.tr("No new clusters found in this DataCenter")
            });

            $(".vcenter_datacenter_list", context).append(content);
          } else {
            var tableId = "vcenter_import_table_" + UniqueId.id();
            content = FieldsetTableHTML({
              tableId : tableId,
              title : datacenter_name + " " + Locale.tr("DataCenter"),
              toggleAdvanced : false,
              columns : [
                "<input type=\"checkbox\" class=\"check_all\"/>",
                Locale.tr("Cluster"),
                Locale.tr("vCenter ref"),
                Locale.tr("Location"),
                ""
              ]
            });

            var newdiv = $(content).appendTo($(".vcenter_datacenter_list", context));
            var tbody = $("#" + tableId + " tbody", context);

            $.each(elements, function(id, cluster) {
              var cluster_name = cluster.simple_name;
              var cluster_location = cluster.cluster_location;
              var cluster_ref = cluster.cluster_ref;
              var rp_list = "<select class=\"select_rp\"><option></option>";
              if (cluster.rp_list.length > 0){
                for (var i = 0; i < cluster.rp_list.length; i++){
                  rp_list += "<option>" + cluster.rp_list[i].name + "</option>";
                }
              }
              rp_list += "</select>";
              var opts = { name: cluster_name, location: cluster_location, cluster_ref: cluster_ref };
              var trow = $(RowTemplate(opts)).appendTo(tbody);

              $(".check_item", trow).data("cluster", cluster);
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
                  //"ordering": false,
                  "aoColumnDefs": [
                    {"sWidth": "35px", "aTargets": [0]},
                    {"bSortable": false, "aTargets": [0,3,4]},
                    {"bSortable": true, "aTargets": [1,2]},
                  ],
                }
              });

            elementsTable.initialize();

            $("a.vcenter-table-select-all").text(Locale.tr("Select all %1$s Clusters", elements.length));

            VCenterCommon.setupTable({
              context : newdiv,
              allSelected : Locale.tr("All %1$s Clusters selected."),
              selected: Locale.tr("%1$s Clusters selected.")
            });

            context.off("click", ".clear_imported");
            context.on("click", ".clear_imported", function() {
              _fillVCenterClusters(opts);
              return false;
            });
          }
        });

        if(opts.success){
          opts.success();
        }
      },
      error: function(response){
        context.hide();
        Notifier.onError({}, OpenNebulaError(response));
      }
    });
  }

  function _import(context, cluster_id) {
    var that = this;

    $.each($("table.vcenter_import_table", context), function() {
      $.each($(this).DataTable().$(".check_item:checked"), function() {
        var row_context = $(this).closest("tr");

        VCenterCommon.importLoading({context : row_context});

        var cluster_ref = $(this).data("cluster").cluster_ref;
        var vcenter_uuid = $(this).data("cluster").vcenter_uuid;
        var vcenter_version = $(this).data("cluster").vcenter_version;
        var cluster_name = $(this).data("cluster").cluster_name;


        var host_json = {
          "host": {
            "name": cluster_name,
            "vm_mad": "vcenter",
            "vnm_mad": "dummy",
            "im_mad": "vcenter",
            "cluster_id": null
          }
        };

        function successClusterList(request, obj_list){
          if (cluster_name && obj_list) {
            let r = null;
            obj_list.forEach(function(cluster) {
              if (cluster && cluster.CLUSTER && cluster.CLUSTER.NAME) {
                if (cluster.CLUSTER.NAME === cluster_name){
                  r = cluster.CLUSTER;
                }
              }
            });
            if(r && r.ID){
              host_json.host.cluster_id = r.ID;
              createHost();
            }else{
              var cluster_json = {
                "cluster": {
                  "name": cluster_name
                }
              };
              OpenNebulaCluster.create({
                timeout: true,
                data: cluster_json,
                success: function(request, response) {
                  host_json.host.cluster_id = response.CLUSTER.ID;
                  createHost();
                },
                error: function (request, error_json) {
                  VCenterCommon.importFailure({
                    context : row_context,
                    message : (error_json.error.message || Locale.tr("Cannot contact server: is it running and reachable?"))
                  });
                }
              });
            }
          }
        }
        
        function createHost(){
          OpenNebulaHost.create({
            timeout: true,
            data: host_json,
            success: function(request, response) {
              VCenterCommon.importSuccess({
                context : row_context,
                message : Locale.tr("Host created successfully. ID: %1$s", response.HOST.ID)
              });
              var template_raw =
                  "VCENTER_USER=\"" + that.opts.vcenter_user + "\"\n" +
                  "VCENTER_PASSWORD=\"" + that.opts.vcenter_password + "\"\n" +
                  "VCENTER_INSTANCE_ID=\"" + vcenter_uuid + "\"\n" +
                  "VCENTER_CCR_REF=\"" + cluster_ref + "\"\n" +
                  "VCENTER_VERSION=\"" + vcenter_version + "\"\n";

              var vcenterHost = that.opts.vcenter_host.split(":");

              if (vcenterHost.length === 2) {
                template_raw += "VCENTER_HOST=\"" + vcenterHost[0] + "\"\n";
                template_raw += "VCENTER_PORT=\"" + vcenterHost[1] + "\"\n";
              } else {
                template_raw += "VCENTER_HOST=\"" + that.opts.vcenter_host + "\"\n";
              }

              Sunstone.runAction("Host.update_template", response.HOST.ID, template_raw);

              $.ajax({
                url: '/vcenter/register_hooks',
                type: "POST",
                processData: false
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

        if (cluster_id == 0) {
          OpenNebulaCluster.list({
            timeout: true,
            success: successClusterList,
            error: function(error) {
              console.log(error);
            }
          });
        } else {
          host_json.host.cluster_id = cluster_id;
          createHost();
        }
      });
    });
  }
});
