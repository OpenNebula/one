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
  var CustomLayoutDataTable = require('utils/custom-layout-table');
  var Notifier = require('utils/notifier');
  var UniqueId = require('utils/unique-id');

  var TemplateHTML = require('hbs!./networks/html');
  var EmptyTableTemplate = require('hbs!./networks/empty-table');
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
    return '<div class="vcenter_networks" hidden></div>';
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

    var context = $(".vcenter_networks", opts.container);
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

        $.each(response, function(datacenter_name, networks) {
          var content;
          if (networks.length == 0) {
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
            var tableId = "vcenter_network_table_" + UniqueId.id();
            content = 
              '<fieldset>' +
                '<legend>' +
                  '<ul class="menu simple">' +
                    '<li> ' +
                      datacenter_name + ' ' + Locale.tr("DataCenter") +
                    '</li>' +
                    '<li> ' +
                      '<label class="inline">' +
                        '<input type="checkbox" class="check_all" checked/>' +
                        Locale.tr("Select All") +
                      '</label>' +
                    '</li>' +
                    '<li> ' +
                      '<label class="inline">' +
                        '<input type="checkbox" class="expand_all"/>' +
                         Locale.tr("Expand Advanced Sections") +
                      '</label>' +
                    '</li>' +
                    '<li> ' +
                      '<button class="button small success import_selected">' +
                         Locale.tr("Import Selected Networks") +
                      '</button>' +
                    '</li>' +
                    '<li> ' +
                      '<button class="button small secondary clear_imported">' +
                         Locale.tr("Clear Imported Networks") +
                      '</button>' +
                    '</li>' +
                  '</ul>' +
                '</legend>' +
                '<div class="row">' +
                  '<div class="large-12 columns">' +
                    '<table class="dataTable vcenter_network_table" id="' + tableId + '">' +
                      '<thead>' +
                        '<th>' + Locale.tr("Name") + '</th>' +
                      '</thead>' +
                      '<tbody/>' +
                    '</table>' +
                  '</div>' +
                '</div>';
            '</fieldset>';

            $(".vcenter_datacenter_list", context).append(content);

            var preDrawCallback = function (settings) {
                $('#' + tableId).html(EmptyTableTemplate());
              }
            var rowCallback = function(row, data, index) {
                opts.data = data;

                var networkRow = $(RowTemplate(opts)).appendTo($('#' + tableId));
                $('.check_item', networkRow).data("network_name", data.name)
                $('.check_item', networkRow).data("one_network", data.one);

                return row;
              }

            var networksTable = new CustomLayoutDataTable({
                tableId: '#' + tableId,
                columns: ['name'],
                preDrawCallback: preDrawCallback,
                rowCallback: rowCallback
              });

            networksTable.addData(networks);

            context.off('click', '.import_selected');
            context.on('click', '.import_selected', function() {
              tableContext = $(this).closest('fieldset');
              _import(tableContext);
              return false;
            });

            context.off('click', '.clear_imported');
            context.on('click', '.clear_imported', function() {
              _fillVCenterNetworks(opts);
              return false;
            });

            context.off('change', '.type_select');
            context.on("change", '.type_select', function() {
              var network_context = $(this).closest(".vcenter_row");
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
                    '<div class="large-4 medium-6 columns end">' +
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

              $('.net_options', network_context).html(net_form_str);
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

  function _import(context) {
    $.each($(".vcenter_network_table", context), function() {
      $.each($(".check_item:checked", this), function() {
        var network_context = $(this).closest(".vcenter_row");

        $(".vcenter_network_result:not(.success)", network_context).html(
            '<span class="fa-stack fa-2x" style="color: #dfdfdf">' +
              '<i class="fa fa-cloud fa-stack-2x"></i>' +
              '<i class="fa  fa-spinner fa-spin fa-stack-1x fa-inverse"></i>' +
            '</span>');

        var network_size = $(".netsize", network_context).val();
        var network_tmpl = $(this).data("one_network");
        var type         = $('.type_select', network_context).val();

        var ar_array = [];
        ar_array.push("TYPE=" + type);
        ar_array.push("SIZE=" + network_size);

        switch (type) {
          case 'ETHER':
            var mac = $('.eth_mac_net', network_context).val();

            if (mac) {
              ar_array.push("MAC=" + mac);
            }

            break;
          case 'IP4':
            var mac = $('.four_mac_net', network_context).val();
            var ip = $('.four_ip_net', network_context).val();

            if (mac) {
              ar_array.push("MAC=" + mac);
            }
            if (ip) {
              ar_array.push("IP=" + ip);
            }

            break;
          case 'IP6':
            var mac = $('.six_mac_net', network_context).val();
            var gp = $('.six_global_net', network_context).val();
            var ula = $('.six_mac_net', network_context).val();

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

        if ($(".vlaninfo", network_context)) {
          network_tmpl += "VLAN_ID=" + $(".vlaninfo", network_context).val() + "\n";
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
            $(".vcenter_network_result", network_context).addClass("success").html(
                '<span class="fa-stack fa-2x" style="color: #dfdfdf">' +
                  '<i class="fa fa-cloud fa-stack-2x"></i>' +
                  '<i class="fa  fa-check fa-stack-1x fa-inverse"></i>' +
                '</span>');

            $(".vcenter_network_response", network_context).html('<p style="font-size:12px" class="running-color">' +
                  Locale.tr("Virtual Network created successfully") + ' ID:' + response.VNET.ID +
                '</p>');
          },
          error: function (request, error_json) {
            $(".vcenter_network_result", network_context).html('<span class="fa-stack fa-2x" style="color: #dfdfdf">' +
                  '<i class="fa fa-cloud fa-stack-2x"></i>' +
                  '<i class="fa  fa-warning fa-stack-1x fa-inverse"></i>' +
                '</span>');

            $(".vcenter_network_response", network_context).html('<p style="font-size:12px" class="error-color">' +
                  (error_json.error.message || Locale.tr("Cannot contact server: is it running and reachable?")) +
                '</p>');
          }
        });
      });
    });

  }
});
