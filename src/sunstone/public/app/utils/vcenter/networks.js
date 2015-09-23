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
  var OpenNebulaNetwork = require('opennebula/network');
  var OpenNebulaError = require('opennebula/error');

  var TemplateHTML = require('hbs!./networks/html');

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
    return '<div class="vcenter_networks hidden"></div>';
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

        $('<div class="row">' +
            '<div class="large-12 columns">' +
              '<p style="color: #999">' + Locale.tr("Please select the vCenter Networks to be imported to OpenNebula.") + '</p>' +
            '</div>' +
          '</div>').appendTo($(".content", context))

        $.each(response, function(datacenter_name, networks){
          $('<div class="row">' +
              '<div class="large-12 columns">' +
                '<h5>' +
                  datacenter_name + ' ' + Locale.tr("DataCenter") +
                '</h5>' +
              '</div>' +
            '</div>').appendTo($(".content", context))

          if (networks.length == 0) {
            $('<div class="row">' +
                '<div class="large-12 columns">' +
                  '<label>' +
                    Locale.tr("No new networks found in this DataCenter") +
                  '</label>' +
                '</div>' +
              '</div>').appendTo($(".content", context))
          } else {
            $.each(networks, function(id, network){
              var netname   = network.name.replace(" ","_");
              var vlan_info = ""

              if (network.vlan) {
                var vlan_info = '<div class="vlan_info">' +
                      '<div class="large-4 columns">'+
                        '<label>' + Locale.tr("VLAN") +
                           '<input type="text" class="vlaninfo" value="'+network.vlan+'" disabled/>' +
                        '</label>'+
                      '</div>'+
                    '</div>';
              }

              var trow = $('<div class="vcenter_network">' +
                  '<div class="row">' +
                    '<div class="large-10 columns">' +
                      '<div class="large-12 columns">' +
                        '<label>' +
                          '<input type="checkbox" class="network_name" checked/> ' +
                          network.name + '&emsp;<span style="color: #999">' + network.type + '</span>' +
                        '</label>' +
                      '</div>'+
                      '<div class="large-2 columns">'+
                        '<label>' + Locale.tr("SIZE") +
                          '<input type="text" class="netsize" value="255"/>' +
                        '</label>' +
                      '</div>'+
                      '<div class="large-2 columns">'+
                        '<label>' + Locale.tr("TYPE") +
                          '<select class="type_select">'+
                            '<option value="ETHER">eth</option>' +
                            '<option value="IP4">ipv4</option>'+
                            '<option value="IP6">ipv6</option>' +
                          '</select>' +
                        '</label>' +
                      '</div>'+
                      '<div class="net_options">' +
                        '<div class="large-4 columns">'+
                          '<label>' + Locale.tr("MAC") +
                            '<input type="text" class="eth_mac_net" placeholder="'+Locale.tr("Optional")+'"/>' +
                          '</label>'+
                        '</div>'+
                      '</div>'+
                      vlan_info +
                      '<div class="large-12 columns vcenter_network_response">'+
                      '</div>'+
                    '</div>' +
                    '<div class="large-2 columns vcenter_network_result">'+
                    '</div>'+
                  '</div>'+
                '</div>').appendTo($(".content", context))


              $('.type_select', trow).on("change",function(){
                var network_context = $(this).closest(".vcenter_network");
                var type = $(this).val();

                var net_form_str = ''

                switch(type) {
                  case 'ETHER':
                    net_form_str =
                      '<div class="large-4 columns">'+
                        '<label>' + Locale.tr("MAC") +
                          '<input type="text" class="eth_mac_net" placeholder="'+Locale.tr("Optional")+'"/>' +
                        '</label>'+
                      '</div>';
                    break;
                  case 'IP4':
                    net_form_str =
                      '<div class="large-4 columns">'+
                        '<label>' + Locale.tr("IP START") +
                          '<input type="text" class="four_ip_net"/>' +
                        '</label>'+
                      '</div>'+
                      '<div class="large-4 columns">'+
                        '<label>' + Locale.tr("MAC") +
                          '<input type="text" class="eth_mac_net" placeholder="'+Locale.tr("Optional")+'"/>' +
                        '</label>'+
                      '</div>';
                    break;
                  case 'IP6':
                    net_form_str =
                      '<div class="large-4 columns">'+
                        '<label>' + Locale.tr("MAC") +
                          '<input type="text" class="eth_mac_net"/>' +
                        '</label>'+
                      '</div>'+
                      '<div class="large-6 columns">'+
                        '<label>' + Locale.tr("GLOBAL PREFIX") +
                          '<input type="text" class="six_global_net" placeholder="'+Locale.tr("Optional")+'"/>' +
                        '</label>'+
                      '</div>'+
                      '<div class="large-6 columns">'+
                        '<label>' + Locale.tr("ULA_PREFIX") +
                          '<input type="text" class="six_ula_net" placeholder="'+Locale.tr("Optional")+'"/>' +
                        '</label>'+
                      '</div>';
                    break;
                }

                $('.net_options', network_context).html(net_form_str);
              });

              $(".network_name", trow).data("network_name", netname)
              $(".network_name", trow).data("one_network", network.one)
            });
          };
        });
      },
      error: function(response){
        context.hide();
        Notifier.onError({}, OpenNebulaError(response));
      }
    });
  }

  function _import(context) {
    $.each($(".network_name:checked", context), function() {
      var network_context = $(this).closest(".vcenter_network");

      $(".vcenter_network_result:not(.success)", network_context).html(
          '<span class="fa-stack fa-2x" style="color: #dfdfdf">' +
            '<i class="fa fa-cloud fa-stack-2x"></i>' +
            '<i class="fa  fa-spinner fa-spin fa-stack-1x fa-inverse"></i>' +
          '</span>');

      var network_size = $(".netsize", network_context).val();
      var network_tmpl = $(this).data("one_network");
      var netname      = $(this).data("network_name");
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
        network_tmpl += "VLAN=\"YES\"\n";
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

  }
});
