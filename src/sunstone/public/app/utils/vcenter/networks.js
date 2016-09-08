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
  var OpenNebulaNetwork = require('opennebula/network');
  var OpenNebulaError = require('opennebula/error');
  var DomDataTable = require('utils/dom-datatable');
  var Notifier = require('utils/notifier');
  var UniqueId = require('utils/unique-id');

  var TemplateHTML = require('hbs!./networks/html');
  var RowTemplate = require('hbs!./networks/row');

  function VCenterNetworks() {
    return this;
  }

  VCenterNetworks.prototype = {
    'html': _html,
    'insert': _fillVCenterNetworks,
    'import': _import
  };
  VCenterNetworks.prototype.constructor = VCenterNetworks;

  return VCenterNetworks;

  function _html() {
    return '<div class="vcenter_import" hidden></div>';
  }

  /*
    Retrieve the list of networks from vCenter and fill the container with them

    opts = {
      datacenter: "Datacenter Name",
      cluster: "Cluster Name",
      container: Jquery div to inject the html,
      vcenter_user: vCenter Username,
      vcenter_password: vCenter Password,
      vcenter_host: vCenter Host
    }
   */
  function _fillVCenterNetworks(opts) {
    var path = '/vcenter/networks';

    var context = $(".vcenter_import", opts.container);
    context.html(TemplateHTML());
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
      success: function(response) {
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
                        Locale.tr("No new networks found in this DataCenter") +
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
                         Locale.tr("Clear Imported Networks") +
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
                      '&emsp;|&emsp;<a class="vcenter-table-toggle-advanced">' +
                        Locale.tr("Toggle advanced sections") +
                      '</a>' +
                    '</p>' +
                  '</div>' +
                '</div>' +
                '<div class="row">' +
                  '<div class="large-12 columns">' +
                    '<table class="dataTable vcenter_import_table" id="' + tableId + '">' +
                      '<thead>' +
                        '<th class="check">' +
                          '<input type="checkbox" class="check_all"/>' +
                        '</th>' +
                        '<th>' + Locale.tr("Network") + '</th>' +
                      '</thead>' +
                      '<tbody/>' +
                    '</table>' +
                  '</div>' +
                '</div>';
              '</fieldset>';

            var newdiv = $(content).appendTo($(".vcenter_datacenter_list", context));
            var tbody = $('#' + tableId + ' tbody', context);

            $.each(elements, function(id, element) {
              var opts = { data: element };
              var trow = $(
                '<tr>' +
                  '<td><input type="checkbox" class="check_item"/></td>' +
                  '<td>'+RowTemplate(opts)+'</td>' +
                '</tr>').appendTo(tbody);

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

            $("a.vcenter-table-select-all").text(Locale.tr("Select all %1$s Networks", elements.length));

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

            $(".vcenter-table-toggle-advanced", newdiv).on("click", function(){
              var unactive_n = $(".accordion_advanced_toggle:not(.active)", newdiv).length;

              if (unactive_n > 0){
                $(".accordion_advanced_toggle:not(.active)", newdiv).click();
              } else {
                $(".accordion_advanced_toggle", newdiv).click();
              }
            });

            context.off('click', '.clear_imported');
            context.on('click', '.clear_imported', function() {
              _fillVCenterNetworks(opts);
              return false;
            });

            context.off('change', '.type_select');
            context.on("change", '.type_select', function() {
              var row_context = $(this).closest(".vcenter_row");
              var type = $(this).val();

              var net_form_str = ''

              switch (type) {
                case 'ETHER':
                  net_form_str =
                    '<div class="large-4 medium-6 columns end">' +
                      '<label>' + Locale.tr("MAC") +
                        '<input type="text" class="eth_mac_net" placeholder="' + Locale.tr("Optional") + '"/>' +
                      '</label>' +
                    '</div>';
                  break;
                case 'IP4':
                  net_form_str =
                    '<div class="large-4 medium-6 columns">' +
                      '<label>' + Locale.tr("IP Start") +
                        '<input type="text" class="four_ip_net"/>' +
                      '</label>' +
                    '</div>' +
                    '<div class="large-4 medium-6 columns end">' +
                      '<label>' + Locale.tr("MAC") +
                        '<input type="text" class="eth_mac_net" placeholder="' + Locale.tr("Optional") + '"/>' +
                      '</label>' +
                    '</div>';
                  break;
                case 'IP6':
                  net_form_str =
                    '<div class="large-6 medium-6 columns">' +
                      '<label>' + Locale.tr("Global Prefix") +
                        '<input type="text" class="six_global_net" placeholder="' + Locale.tr("Optional") + '"/>' +
                      '</label>' +
                    '</div>' +
                    '<div class="large-4 medium-6 columns">' +
                      '<label>' + Locale.tr("MAC") +
                        '<input type="text" class="eth_mac_net"/>' +
                      '</label>' +
                    '</div>' +
                    '<div class="large-6 medium-6 columns end">' +
                      '<label>' + Locale.tr("ULA Prefix") +
                        '<input type="text" class="six_ula_net" placeholder="' + Locale.tr("Optional") + '"/>' +
                      '</label>' +
                    '</div>';
                  break;
              }

              $('.net_options', row_context).html(net_form_str);
            });
          }
        });
      },
      error: function(response) {
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
      $(".vcenter-table-header-text").text(Locale.tr("All %1$s Networks selected.", selected));

      $(".vcenter-table-header-text").show();
      $("a.vcenter-table-select-all").hide();
      $("a.vcenter-table-deselect-all").show();
    } else if (selected == 0){
      $(".vcenter-table-header-text").hide();
      $("a.vcenter-table-select-all").show();
      $("a.vcenter-table-deselect-all").hide();
    } else {
      $(".vcenter-table-header-text").text(Locale.tr("%1$s Networks selected.", selected));

      $(".vcenter-table-header-text").show();
      $("a.vcenter-table-select-all").show();
      $("a.vcenter-table-deselect-all").hide();
    }

    // Counters for the current visible page
    var total_length = $('input.check_item', table).length;
    var checked_length = $('input.check_item:checked', table).length;
    $('.check_all', table).prop('checked', (total_length == checked_length));
  }

  function _import(context) {
    $.each($(".vcenter_import_table", context), function() {
      $.each($(this).DataTable().$(".check_item:checked"), function() {
        var row_context = $(this).closest("tr");

        $(".vcenter_import_result:not(.success)", row_context).html(
          '<span class="fa-stack" style="color: #dfdfdf">' +
            '<i class="fa fa-cloud fa-stack-2x"></i>' +
            '<i class="fa  fa-spinner fa-spin fa-stack-1x fa-inverse"></i>' +
          '</span>');

        $(".vcenter_import_result_row", row_context).show();

        var network_size = $(".netsize", row_context).val();
        var network_tmpl = $(this).data("import_data").one;
        var type         = $('.type_select', row_context).val();

        var ar_array = [];
        ar_array.push("TYPE=" + type);
        ar_array.push("SIZE=" + network_size);

        switch (type) {
          case 'ETHER':
            var mac = $('.eth_mac_net', row_context).val();

            if (mac) {
              ar_array.push("MAC=" + mac);
            }

            break;
          case 'IP4':
            var mac = $('.four_mac_net', row_context).val();
            var ip = $('.four_ip_net', row_context).val();

            if (mac) {
              ar_array.push("MAC=" + mac);
            }
            if (ip) {
              ar_array.push("IP=" + ip);
            }

            break;
          case 'IP6':
            var mac = $('.six_mac_net', row_context).val();
            var gp = $('.six_global_net', row_context).val();
            var ula = $('.six_mac_net', row_context).val();

            if (mac) {
              ar_array.push("MAC=" + mac);
            }
            if (gp) {
              ar_array.push("GLOBAL_PREFIX=" + gp);
            }
            if (ula) {
              ar_array.push("ULA_PREFIX=" + ula);
            }

            break;
        }

        network_tmpl += "\nAR=["
        network_tmpl += ar_array.join(",\n")
        network_tmpl += "]"

        var vlaninfo = $(".vlaninfo", row_context).text();

        if ( vlaninfo != undefined && vlaninfo != "" ) {
          network_tmpl += "\nVLAN_ID=" + vlaninfo + "\n";
        }

        var vnet_json = {
          "vnet": {
            "vnet_raw": network_tmpl
          }
        };

        OpenNebulaNetwork.create({
          timeout: true,
          data: vnet_json,
          success: function(request, response) {
            $(".vcenter_import_result", row_context).addClass("success").html(
              '<span class="fa-stack" style="color: #dfdfdf">' +
                '<i class="fa fa-cloud fa-stack-2x running-color"></i>' +
                '<i class="fa fa-check fa-stack-1x fa-inverse"></i>' +
              '</span>');

            $(".vcenter_import_response", row_context).html(
              Locale.tr("Virtual Network created successfully") + '. ID: ' + response.VNET.ID);
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
