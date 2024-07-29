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
  var OpenNebulaDatastore = require("opennebula/datastore");
  var OpenNebulaError = require("opennebula/error");
  var DomDataTable = require("utils/dom-datatable");
  var Notifier = require("utils/notifier");
  var UniqueId = require("utils/unique-id");
  var VCenterCommon = require("./vcenter-common");

  var TemplateHTML = require("hbs!./common/html");
  var RowTemplate = require("hbs!./datastores/row");
  var EmptyFieldsetHTML = require("hbs!./common/empty-fieldset");
  var FieldsetTableHTML = require("hbs!./common/fieldset-table");

  var path = "/vcenter/datastores";
  var resource = "Datastore";

  function VCenterDatastores() {
    return this;
  }

  VCenterDatastores.prototype = {
    "html": VCenterCommon.html,
    "insert": _fillVCenterDatastores,
    "import": _import
  };
  VCenterDatastores.prototype.constructor = VCenterDatastores;

  return VCenterDatastores;

  /*
    Retrieve the list of Datastores from vCenter and fill the container with them

    opts = {
      container: JQuery div to inject the html,
      selectedHost: Host selected for vCenter credentials
    }
  */
  function _fillVCenterDatastores(opts) {
    this.opts = opts;

    var context = $(".vcenter_import", opts.container);
    context.html(TemplateHTML());
    context.show();

    $.ajax({
      url: path,
      type: "GET",
      data: { host: opts.selectedHost, timeout: false },
      dataType: "json",
      success: function(response){
        $(".vcenter_datacenter_list", context).html("");

        var vcenter_name = Object.keys(response)[0];
        response = response[vcenter_name];

        if (Object.keys(response).length === 0){
          content = EmptyFieldsetHTML({
            title : Locale.tr("vCenter Datastores") + ": " + vcenter_name,
            message : Locale.tr("No new datastores found")
          });
          $(".vcenter_datacenter_list", context).append(content);
        }

        else {
          var tableId = "vcenter_import_table" + UniqueId.id();
          content = FieldsetTableHTML({
            title: Locale.tr("vCenter Datastores") + ": " + vcenter_name,
            tableId : tableId,
            toggleAdvanced : false,
            columns : [
              "<input type=\"checkbox\" class=\"check_all\"/>",
              Locale.tr("Name"),
              Locale.tr("vCenter ref"),
              Locale.tr("Datacenter"),
              Locale.tr("Total MB"),
              Locale.tr("Free MB"),
              Locale.tr("OpenNebula Cluster IDs"),
              ""
            ]
          });

          var newdiv = $(content).appendTo($(".vcenter_datacenter_list", context));
          var tbody = $("#" + tableId + " tbody", context);

          var ds_num = 0;
          $.each(response, function(datastore_name, element){
            if (element.cluster.length !== 0){
              ds_num++;
              var opts = { name: element.simple_name, vcenter_ref: element.ref, datacenter: element.datacenter, cluster: element.cluster, free_mb: element.free_mb, total_mb: element.total_mb };
              var trow = $(RowTemplate(opts)).appendTo(tbody);
              $(".check_item", trow).data("import_data", element);
            }
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
                "aoColumnDefs": [
                  {"sWidth": "35px", "aTargets": [0]},
                  {"bSortable": false, "aTargets": [0,6,7]},
                  {"bSortable": true, "aTargets": [1,2,3]},
                  {"sType": "num", "aTargets": [4,5]}
                ],
              }
            });

          elementsTable.initialize();

          $("a.vcenter-table-select-all", context).text(Locale.tr("Select all %1$s Datastores", ds_num));

          VCenterCommon.setupTable({
            context : newdiv,
            allSelected : Locale.tr("All %1$s Datastores selected."),
            selected: Locale.tr("%1$s Datastores selected.")
          });

          context.off("click", ".clear_imported");
          context.on("click", ".clear_imported", function() {
            _fillVCenterDatastores(opts);
            return false;
          });
        }
      },
      error: function(response){
        context.hide();
        Notifier.onError({}, OpenNebulaError(response));
      }
    });
  }

  function _import(context) {
    var vcenter_refs = [];

    var table = $("table.vcenter_import_table", context);
    $.each(table.DataTable().$(".check_item:checked"), function(){
      vcenter_refs.push($(this).data("import_data").ref);
      var row_context = $(this).closest("tr");
      VCenterCommon.importLoading({context : row_context});
    });
    vcenter_refs = vcenter_refs.join(",");

    if (vcenter_refs.length === 0){
      Notifier.notifyMessage("You must select at least one datastore");
      return false;
    }

    $.ajax({
      url: path,
      type: "POST",
      data: { datastores: vcenter_refs, timeout: false },
      dataType: "json",
      success: function(response){
        VCenterCommon.jGrowlSuccess({success : response.success, resource : resource, link_tab : "datastores-tab"});
        VCenterCommon.jGrowlFailure({error : response.error, resource : resource});

        $("#get-vcenter-ds").click();
      },
      error: function (request, error_json) {
        if (request.responseJSON === undefined){
          Notifier.notifyError("Empty response received from server. Check your setup to avoid timeouts");
        } else {
          Notifier.notifyError(request.responseJSON.error.message);
        }
        $("#get-vcenter-ds").click();
      }
    });
  }
});
