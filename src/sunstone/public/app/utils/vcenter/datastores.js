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
  var OpenNebulaDatastore = require('opennebula/datastore');
  var OpenNebulaError = require('opennebula/error');
  var DomDataTable = require('utils/dom-datatable');
  var Notifier = require('utils/notifier');
  var UniqueId = require('utils/unique-id');
  var VCenterCommon = require('./vcenter-common');
  var Sunstone = require('sunstone');

  var TemplateHTML = require('hbs!./common/html');
  var RowTemplate = require('hbs!./datastores/row');
  var EmptyFieldsetHTML = require('hbs!./common/empty-fieldset');
  var FieldsetTableHTML = require('hbs!./common/fieldset-table');

  function VCenterDatastores() {
    return this;
  }

  VCenterDatastores.prototype = {
    'html': VCenterCommon.html,
    'insert': _fillVCenterDatastores,
    'import': _import
  };
  VCenterDatastores.prototype.constructor = VCenterDatastores;

  return VCenterDatastores;

  /*
    Retrieve the list of Datastores from vCenter and fill the container with them

    opts = {
      datacenter: "Datacenter Name",
      cluster: "Cluster Name",
      container: Jquery div to inject the html,
      vcenter_user: vCenter Username,
      vcenter_password: vCenter Password,
      vcenter_host: vCenter Host
    }
   */
  function _fillVCenterDatastores(opts) {
    this.opts = opts;
    var path = '/vcenter/datastores';

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

        $.each(response, function(datacenter_name, elements){
          var content;
          if (elements.length == 0) {
            content = EmptyFieldsetHTML({
              title : datacenter_name + ' ' + Locale.tr("DataCenter"),
              message : Locale.tr("No new datastores found in this DataCenter")
            });

            $(".vcenter_datacenter_list", context).append(content);
          } else {
            var tableId = "vcenter_import_table" + UniqueId.id();
            content = FieldsetTableHTML({
              tableId : tableId,
              title : datacenter_name + ' ' + Locale.tr("DataCenter"),
              clearImported : Locale.tr("Clear Imported Datastores"),
              toggleAdvanced : false,
              columns : [
                '<input type="checkbox" class="check_all"/>',
                Locale.tr("Name"),
                Locale.tr("Total MB"),
                Locale.tr("Free MB"),
                Locale.tr("OpenNebula Cluster IDs"),
                ""
              ]
            });

            var newdiv = $(content).appendTo($(".vcenter_datacenter_list", context));
            var tbody = $('#' + tableId + ' tbody', context);

            $.each(elements, function(id, element){
              var opts = { name: element.simple_name, cluster: element.cluster, free_mb: element.free_mb, total_mb: element.total_mb };
              var trow = $(RowTemplate(opts)).appendTo(tbody);

              $(".check_item", trow).data("one_template", element.ds)
              $(".check_item", trow).data("one_clusters", element.cluster)
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
                  //"ordering": true,
                  "order": [],
                  "aoColumnDefs": [
                    {"bSortable": false, "aTargets": [0,3]},
                    {"bSortable": true, "aTargets": [1,2]},
                    {"sWidth": "35px", "aTargets": [0]},
                  ]
                }
              });

            elementsTable.initialize();

            $("a.vcenter-table-select-all").text(Locale.tr("Select all %1$s Datastores", elements.length));

            VCenterCommon.setupTable({
              context : newdiv,
              allSelected : Locale.tr("All %1$s Datastores selected."),
              selected: Locale.tr("%1$s Datastores selected.")
            });

            context.off('click', '.clear_imported');
            context.on('click', '.clear_imported', function() {
              _fillVCenterDatastores(opts);
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

  function _import(context) {
    var that = this;
    $.each($("table.vcenter_import_table", context), function() {
      $.each($(this).DataTable().$(".check_item:checked"), function() {
        var row_context = $(this).closest("tr");

        VCenterCommon.importLoading({context : row_context});
        var one_template  = $(this).data("one_template");
        var one_clusters  = $(this).data("one_clusters");
        var datastore_ids = [];
        if (one_clusters.length > 0) {
          $.each(one_template, function(id, element){
            var datastore_json = {
              "datastore": {
                "datastore_raw": this.one
              },
              "cluster_id" : -1
            };
            OpenNebulaDatastore.create({
              timeout: true,
              data: datastore_json,
              success: function(request, response) {
                datastore_ids.push(response.DATASTORE.ID);
                VCenterCommon.importSuccess({
                  context : row_context,
                  message : Locale.tr("Datastores created successfully. IDs: %1$s", datastore_ids.join())
                });

                var datastore_raw =
                "VCENTER_USER=\"" + that.opts.vcenter_user + "\"\n" +
                "VCENTER_PASSWORD=\"" + that.opts.vcenter_password + "\"\n" +
                "VCENTER_HOST=\"" + that.opts.vcenter_host + "\"\n";

                Sunstone.runAction("Datastore.append_template", response.DATASTORE.ID, datastore_raw);

                $.each(one_clusters, function(index, cluster_id){
                    Sunstone.runAction("Cluster.adddatastore",cluster_id,response.DATASTORE.ID);
                });

                if (one_clusters.length > 0) {
                    Sunstone.runAction("Cluster.deldatastore",0,response.DATASTORE.ID);
                }
              },
              error: function (request, error_json) {
                VCenterCommon.importFailure({
                  context : row_context,
                  message : (error_json.error.message || Locale.tr("Cannot contact server: is it running and reachable?"))
                });
              }
            });
          });
        } else {
          VCenterCommon.importFailure({
            context : row_context,
            message : Locale.tr("You need to import the associated vcenter cluster as one host first.")
          });
        }
      });
    });
  }
});
