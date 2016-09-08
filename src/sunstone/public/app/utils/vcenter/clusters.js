/* -------------------------------------------------------------------------- */
/* Copyright 2002-2016, OpenNebula Project, OpenNebula Systems                */
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
  var Sunstone = require('sunstone');
  var OpenNebulaHost = require('opennebula/host');
  var OpenNebulaError = require('opennebula/error');
  var DomDataTable = require('utils/dom-datatable');
  var Notifier = require('utils/notifier');
  var UniqueId = require('utils/unique-id');

  var TemplateHTML = require('hbs!./clusters/html');

  function VCenterClusters() {
    return this;
  }

  VCenterClusters.prototype = {
    'html': _html,
    'insert': _fillVCenterClusters,
    'import': _import
  };
  VCenterClusters.prototype.constructor = VCenterClusters;

  return VCenterClusters;

  function _html() {
    return '<div class="vcenter_import" hidden></div>';
  }

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

    var path = '/vcenter';

    var context = $(".vcenter_import", opts.container);
    context.html( TemplateHTML({}) );
    context.show();

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
        $(".vcenter_datacenter_list", context).html("");

        $.each(response, function(datacenter_name, elements) {
          var content;
          if (elements.length == 0) {
            content = 
              '<fieldset>' +
                '<legend>' +
                  '<ul class="menu simple">' +
                    '<li> ' +
                      datacenter_name + ' ' + Locale.tr("DataCenter") +
                    '</li>' +
                    '<li>' +
                      '<span>' +
                        Locale.tr("No new clusters found in this DataCenter") +
                      '</span>' +
                    '</li>' +
                  '</ul>' +
                '</legend>' +
              '</fieldset>';

            $(".vcenter_datacenter_list", context).append(content);
          } else {
            var tableId = "vcenter_import_table_" + UniqueId.id();
            content = 
              '<fieldset>' +
                '<legend>' +
                  '<ul class="menu simple">' +
                    '<li> ' +
                      datacenter_name + ' ' + Locale.tr("DataCenter") +
                    '</li>' +
                    '<li> ' +
                      '<button class="button small secondary clear_imported">' +
                         Locale.tr("Clear Imported DataCenters") +
                      '</button>' +
                    '</li>' +
                  '</ul>' +
                '</legend>' +
                '<div class="row">' +
                  '<div class="large-12 columns text-center">' +
                    '<p>' +
                      '<span class="vcenter-table-header-text">' +
                      '</span>  ' +
                      '<a class="vcenter-table-select-all">' +
                      '</a>' +
                      '<a class="vcenter-table-deselect-all">' +
                        Locale.tr("Clear selection") +
                      '</a>' +
                    '</p>' +
                  '</div>' +
                '</div>' +
                '<div class="row">' +
                  '<div class="large-12 columns">' +
                    '<table class="dataTable vcenter_import_table hover" id="' + tableId + '">' +
                      '<thead>' +
                        '<th class="check">' +
                          '<input type="checkbox" class="check_all"/>' +
                        '</th>' +
                        '<th>' + Locale.tr("Name") + '</th>' +
                        '<th/>' +
                      '</thead>' +
                      '<tbody/>' +
                    '</table>' +
                  '</div>' +
                '</div>';
              '</fieldset>';

            var newdiv = $(content).appendTo($(".vcenter_datacenter_list", context));
            var tbody = $('#' + tableId + ' tbody', context);

            $.each(elements, function(id, cluster_name) {
              var trow = $(
                '<tr>' +
                  '<td><input type="checkbox" class="check_item"/></td>' +
                  '<td>' + cluster_name + '</td>' +
                  '<td>' +
                    '<span class="vcenter_import_result">' +
                    '</span>&nbsp;' +
                    '<span class="vcenter_import_response">' +
                    '</span>' +
                  '</td>' +
                '</tr>').appendTo(tbody);

              $(".check_item", trow).data("cluster_name", cluster_name);
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
                    {"bSortable": false, "aTargets": [0,2]},
                    {"bSortable": true, "aTargets": [1]},
                  ],
                }
              });

            elementsTable.initialize();

            $("a.vcenter-table-select-all").text(Locale.tr("Select all %1$s DataCenters", elements.length));

            _recountCheckboxes($('table', newdiv));

            newdiv.on("change", '.check_all', function() {
              var table = $(this).closest('table');
              if ($(this).is(":checked")) { //check all
                $('tbody input.check_item', table).prop('checked', true).change();
              } else { //uncheck all
                $('tbody input.check_item', table).prop('checked', false).change();
              }
            });

            $('table', newdiv).on('draw.dt', function() {
              _recountCheckboxes(this);
            });

            $(newdiv).on('change', ".check_item", function() {
              _recountCheckboxes($('table', newdiv));
            });

            $(".vcenter-table-select-all", newdiv).on("click", function(){
              $("table.vcenter_import_table", newdiv).DataTable().$(".check_item").prop("checked", true).change();
            });

            $(".vcenter-table-deselect-all", newdiv).on("click", function(){
              $("table.vcenter_import_table", newdiv).DataTable().$(".check_item").prop("checked", false).change();
            });

            context.off('click', '.clear_imported');
            context.on('click', '.clear_imported', function() {
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

  function _recountCheckboxes(table) {
    // Counters for the whole table, all pages
    var dt = $(table).DataTable();
    var total = dt.$(".check_item").length;
    var selected = dt.$(".check_item:checked").length;

    if (selected == total){
      $(".vcenter-table-header-text").text(Locale.tr("All %1$s DataCenters selected.", selected));

      $(".vcenter-table-header-text").show();
      $("a.vcenter-table-select-all").hide();
      $("a.vcenter-table-deselect-all").show();
    } else if (selected == 0){
      $(".vcenter-table-header-text").hide();
      $("a.vcenter-table-select-all").show();
      $("a.vcenter-table-deselect-all").hide();
    } else {
      $(".vcenter-table-header-text").text(Locale.tr("%1$s DataCenters selected.", selected));

      $(".vcenter-table-header-text").show();
      $("a.vcenter-table-select-all").show();
      $("a.vcenter-table-deselect-all").hide();
    }

    // Counters for the current visible page
    var total_length = $('input.check_item', table).length;
    var checked_length = $('input.check_item:checked', table).length;
    $('.check_all', table).prop('checked', (total_length == checked_length));
  }

  function _import(context, cluster_id) {
    var that = this;

    $.each($("table.vcenter_import_table", context), function() {
      $.each($(this).DataTable().$(".check_item:checked"), function() {
        var row_context = $(this).closest("tr");

        $(".vcenter_import_result:not(.success)", row_context).html(
          '<span class="fa-stack" style="color: #dfdfdf">' +
            '<i class="fa fa-cloud fa-stack-2x"></i>' +
            '<i class="fa  fa-spinner fa-spin fa-stack-1x fa-inverse"></i>' +
          '</span>');

        var host_json = {
          "host": {
            "name": $(this).data("cluster_name"),
            "vm_mad": "vcenter",
            "vnm_mad": "dummy",
            "im_mad": "vcenter",
            "cluster_id": cluster_id
          }
        };

        OpenNebulaHost.create({
          timeout: true,
          data: host_json,
          success: function(request, response) {
            $(".vcenter_import_result", row_context).addClass("success").html(
              '<span class="fa-stack" style="color: #dfdfdf">' +
                '<i class="fa fa-cloud fa-stack-2x running-color"></i>' +
                '<i class="fa fa-check fa-stack-1x fa-inverse"></i>' +
              '</span>');

            $(".vcenter_import_response", row_context).html(
              Locale.tr("Host created successfully") + '. ID: ' + response.HOST.ID);

            var template_raw =
              "VCENTER_USER=\"" + that.opts.vcenter_user + "\"\n" +
              "VCENTER_PASSWORD=\"" + that.opts.vcenter_password + "\"\n" +
              "VCENTER_HOST=\"" + that.opts.vcenter_host + "\"\n";

            Sunstone.runAction("Host.update_template", response.HOST.ID, template_raw);
          },
          error: function (request, error_json) {
            $(".vcenter_import_result", row_context).html(
              '<span class="fa-stack" style="color: #dfdfdf">' +
                '<i class="fa fa-cloud fa-stack-2x error-color"></i>' +
                '<i class="fa fa-warning fa-stack-1x fa-inverse"></i>' +
              '</span>');

            $(".vcenter_import_response", row_context).addClass("error-color").html(
              (error_json.error.message || Locale.tr("Cannot contact server: is it running and reachable?")));
          }
        });
      });
    });
  }
});
