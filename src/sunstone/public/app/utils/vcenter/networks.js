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
  var OpenNebulaNetwork = require('opennebula/network');
  var OpenNebulaError = require('opennebula/error');
  var DomDataTable = require('utils/dom-datatable');
  var Notifier = require('utils/notifier');
  var UniqueId = require('utils/unique-id');
  var VCenterCommon = require('./vcenter-common');
  var Sunstone = require('sunstone');

  var TemplateHTML = require('hbs!./common/html');
  var RowTemplate = require('hbs!./networks/row');
  var EmptyFieldsetHTML = require('hbs!./common/empty-fieldset');
  var FieldsetTableHTML = require('hbs!./common/fieldset-table');

  function VCenterNetworks() {
    return this;
  }

  VCenterNetworks.prototype = {
    'html': VCenterCommon.html,
    'insert': _fillVCenterNetworks,
    'import': _import
  };
  VCenterNetworks.prototype.constructor = VCenterNetworks;

  return VCenterNetworks;

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
        "X-VCENTER-USER": opts.vcenter_user,
        "X-VCENTER-PASSWORD": opts.vcenter_password,
        "X-VCENTER-HOST": opts.vcenter_host
      },
      success: function(response) {
        $(".vcenter_datacenter_list", context).html("");

        $.each(response, function(datacenter_name, elements) {
          var content;
          if (elements.length == 0) {
            content = EmptyFieldsetHTML({
              title : datacenter_name + ' ' + Locale.tr("DataCenter"),
              message : Locale.tr("No new networks found in this DataCenter")
            });

            $(".vcenter_datacenter_list", context).append(content);
          } else {
            var tableId = "vcenter_import_table_" + UniqueId.id();
            content = FieldsetTableHTML({
              tableId : tableId,
              title : datacenter_name + ' ' + Locale.tr("DataCenter"),
              clearImported : Locale.tr("Clear Imported Networks"),
              toggleAdvanced : true,
              columns : [
                '<input type="checkbox" class="check_all"/>',
                Locale.tr("Network")
              ]
            });

            var newdiv = $(content).appendTo($(".vcenter_datacenter_list", context));
            var tbody = $('#' + tableId + ' tbody', context);

            $.each(elements, function(id, element) {
              var opts = { data: element };
              var trow = $(RowTemplate(opts)).appendTo(tbody);

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

            VCenterCommon.setupTable({
              context : newdiv,
              allSelected : Locale.tr("All %1$s Networks selected."),
              selected: Locale.tr("%1$s Networks selected.")
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
                  case 'IP6_STATIC':
                  net_form_str =
                    '<div class="large-6 medium-6 columns end">' +
                      '<label>' + Locale.tr("IPv6 address") +
                        '<input type="text" class="six_static_net"/>' +
                      '</label>' +
                    '</div>'+'<div class="large-4 medium-6 columns end">' +
                      '<label>' + Locale.tr("Prefix length") +
                        '<input type="text" class="six_prefix_net"/>' +
                      '</label>' +
                    '</div>'+
                    '<div class="large-6 medium-6 columns end">' +
                      '<label>' + Locale.tr("MAC") +
                        '<input type="text" class="eth_mac_net" placeholder="' + Locale.tr("Optional") + '"/>' +
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

  function _import(context) {
    $.each($(".vcenter_import_table", context), function() {
      $.each($(this).DataTable().$(".check_item:checked"), function() {
        var row_context = $(this).closest("tr");

        VCenterCommon.importLoading({context : row_context});

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
          case 'IP6_STATIC':
            var mac = $('.six_mac_net', row_context).val();
            var ip6_static = $('.six_static_net', row_context).val();
            var prefix = $('.six_prefix_net', row_context).val();

            if (mac) {
              ar_array.push("MAC=" + mac);
            }
            if (ip6_static) {
              ar_array.push("IP6=" + ip6_static);
            }
            if (prefix) {
              ar_array.push("PREFIX_LENGTH=" + prefix);
            }
            break;
        }

        network_tmpl += "\nAR=["
        network_tmpl += ar_array.join(",\n")
        network_tmpl += "]"

        var vlaninfo = $(".vlaninfo", row_context).text();

        if ( vlaninfo != undefined && vlaninfo != "" ) {
          network_tmpl += "\nVLAN_TAGGED_ID=" + vlaninfo + "\n";
        }

        var vnet_json = {
          "vnet": {
            "vnet_raw": network_tmpl
          }
        };

        var one_cluster_id  = $(this).data("import_data").one_cluster_id;

        if (one_cluster_id != -1){
          OpenNebulaNetwork.create({
            timeout: true,
            data: vnet_json,
            success: function(request, response) {
              VCenterCommon.importSuccess({
                context : row_context,
                message : Locale.tr("Virtual Network created successfully. ID: %1$s", response.VNET.ID)
              });
              Sunstone.runAction("Cluster.addvnet",one_cluster_id,response.VNET.ID);
            },
            error: function (request, error_json) {
              VCenterCommon.importFailure({
                context : row_context,
                message : (error_json.error.message || Locale.tr("Cannot contact server: is it running and reachable?"))
              });
            }
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
