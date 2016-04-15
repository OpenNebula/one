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
  // Dependencies
  var Locale = require('utils/locale');
  var OpenNebulaDatastore = require('opennebula/datastore');
  var OpenNebulaError = require('opennebula/error');
  var DomDataTable = require('utils/dom-datatable');
  var Notifier = require('utils/notifier');

  var TemplateHTML = require('hbs!./datastores/html');

  function VCenterDatastores() {
    return this;
  }

  VCenterDatastores.prototype = {
    'html': _html,
    'insert': _fillVCenterDatastores,
    'import': _import
  };
  VCenterDatastores.prototype.constructor = VCenterDatastores;

  return VCenterDatastores;

  function _html() {
    return '<div class="vcenter_datastores hidden"></div>';
  }

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
    var path = '/vcenter/datastores';

    var context = $(".vcenter_datastores", opts.container);

    context.html( TemplateHTML({}) );

    context.show();

    $(".accordion_advanced_toggle", context).trigger("click");

    $.ajax({
      url: path,
      type: "GET",
      data: {timeout: false},
      dataType: "json",
      headers: {
        "X_VCENTER_USER": opts.vcenter_user,
        "X_VCENTER_PASSWORD": opts.vcenter_password,
        "X_VCENTER_HOST": opts.vcenter_host
      },
      success: function(response){
        $(".content", context).html("");

        $.each(response, function(datacenter_name, datastores){
          var content;
          if (datastores.length == 0) {
            content = 
              '<fieldset>' +
                '<legend>' +
                  '<ul class="menu simple">' +
                    '<li> ' +
                      datacenter_name + ' ' + Locale.tr("DataCenter") +
                    '</li>' +
                    '<li>' +
                      '<span>' +
                        Locale.tr("No new datastores found in this DataCenter") +
                      '</span>' +
                    '</li>' +
                  '</ul>' +
                '</legend>' +
              '</fieldset>';

            $(".content", context).append(content);
          } else {
            var tableId = "vcenter_network_table_" + datacenter_name;
            content = 
              '<fieldset>' +
                '<legend>' +
                  '<ul class="menu simple">' +
                    '<li> ' +
                      datacenter_name + ' ' + Locale.tr("DataCenter") +
                    '</li>' +
                    '<li> ' +
                      '<button class="button small success import_selected">' +
                         Locale.tr("Import Selected Datastores") +
                      '</button>' +
                    '</li>' +
                    '<li> ' +
                      '<button class="button small secondary clear_imported">' +
                         Locale.tr("Clear Imported Datastores") +
                      '</button>' +
                    '</li>' +
                  '</ul>' +
                '</legend>' +
                '<div class="row">' +
                  '<div class="large-12 columns">' +
                    '<table class="dataTable vcenter_datastore_table" id="vcenter_datastore_table_' + datacenter_name + '">' +
                      '<thead>' +
                        '<th class="check">' +
                          '<input type="checkbox" class="check_all"/>' +
                        '</th>' +
                        '<th>' + Locale.tr("Name") + '</th>' +
                        '<th>' + Locale.tr("Datacenter") + '</th>' +
                        '<th/>' +
                        '<th/>' +
                      '</thead>' +
                      '<tbody/>' +
                    '</table>' +
                  '</div>' +
                '</div>';
            '</fieldset>';

            var newdiv = $(content).appendTo($(".content", context));
            var tbody = $('#vcenter_datastore_table_' + datacenter_name + ' tbody', context);

            $.each(datastores, function(id, datastore){
              var trow = $(
                '<tr class="vcenter_datastore">' +
                  '<td><input type="checkbox" class="check_item" checked/></td>' +
                  '<td>' + datastore.name + '</td>' +
                  '<td>' + datastore.cluster + '</td>' +
                  '<td><div class="vcenter_datastore_response"/></td>' +
                  '<td><div class="vcenter_datastore_result"/></td>' +
                '</tr>').appendTo(tbody);

              $(".check_item", trow).data("datastore_name", datastore.name)
              $(".check_item", trow).data("one_template", datastore.one)
            });

            var tmplDataTable = new DomDataTable(
              'vcenter_datastore_table_' + datacenter_name,
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
                    {"bSortable": false, "aTargets": [0]},
                    {"bSortable": true, "aTargets": [1,2]},
                    {"sWidth": "35px", "aTargets": [0]},
                  ]
                },
                customTrListener: function(tableObj, tr){
                  $("input.check_item", tr).click();
                }
              });

            tmplDataTable.initialize();

            newdiv.on("change", '.check_all', function() {
              var table = $(this).closest('table');
              if ($(this).is(":checked")) { //check all
                $('tbody input.check_item', table).prop('checked', true).change();
              } else { //uncheck all
                $('tbody input.check_item', table).prop('checked', false).change();
              }
            });

            $('table', newdiv).on('draw.dt', function(){
              _recountCheckboxes(this);
            });

            $(".check_item", newdiv).on('change', function(){
              _recountCheckboxes($('table', newdiv));
            });

            context.off('click', '.import_selected');
            context.on('click', '.import_selected', function() {
              tableContext = $(this).closest('fieldset');
              _import(tableContext);
              return false;
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

  function _recountCheckboxes(table) {
    var total_length = $('input.check_item', table).length;
    var checked_length = $('input.check_item:checked', table).length;
    $('.check_all', table).prop('checked', (total_length == checked_length));
  }

  function _import(context) {
    $.each($("table.vcenter_datastore_table", context), function() {
      $.each($(this).DataTable().$(".check_item:checked"), function() {
        var datastore_context = $(this).closest(".vcenter_datastore");

        $(".vcenter_datastore_result:not(.success)", datastore_context).html(
            '<span class="fa-stack" style="color: #dfdfdf">' +
              '<i class="fa fa-cloud fa-stack-2x"></i>' +
              '<i class="fa  fa-spinner fa-spin fa-stack-1x fa-inverse"></i>' +
            '</span>');

        var datastore_json = {
          "datastore": {
            "datastore_raw": $(this).data("one_template")
          },
          "cluster_id" : -1
        };

        OpenNebulaDatastore.create({
          timeout: true,
          data: datastore_json,
          success: function(request, response) {
            $(".vcenter_datastore_result", datastore_context).addClass("success").html(
                '<span class="fa-stack" style="color: #dfdfdf">' +
                  '<i class="fa fa-cloud fa-stack-2x"></i>' +
                  '<i class="fa  fa-check fa-stack-1x fa-inverse"></i>' +
                '</span>');

            $(".vcenter_datastore_result", datastore_context).html('<p style="font-size:12px" class="running-color">' +
                  Locale.tr("Datastore created successfully") + ' ID:' + response.DATASTORE.ID +
                '</p>');
          },
          error: function (request, error_json) {
            $(".vcenter_datastore_result", datastore_context).html('<span class="fa-stack" style="color: #dfdfdf">' +
                  '<i class="fa fa-cloud fa-stack-2x"></i>' +
                  '<i class="fa  fa-warning fa-stack-1x fa-inverse"></i>' +
                '</span>');

            $(".vcenter_datastore_result", datastore_context).html('<p style="font-size:12px" class="error-color">' +
                  (error_json.error.message || Locale.tr("Cannot contact server: is it running and reachable?")) +
                '</p>');
          }
        });
      });
    });
  }
});
