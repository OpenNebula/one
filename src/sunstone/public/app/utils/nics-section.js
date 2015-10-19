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
  var Locale = require('utils/locale');
  var Notifier = require('utils/notifier');
  var OpenNebula = require('opennebula');

  var provision_nic_accordion_id = 0;
  var provision_nic_accordion_dd_id = 0;

  return {
    'insert': _insert,
    'retrieve': _retrieve,
    'generate_provision_network_accordion': _generate_provision_network_accordion,
    'generate_provision_network_table': _generate_provision_network_table
  }

  function _insert(template_json, context) {
    if (template_json.VMTEMPLATE.TEMPLATE.SUNSTONE_NETWORK_SELECT != "NO") {
      var template_nic = template_json.VMTEMPLATE.TEMPLATE.NIC
      var nics = []
      if ($.isArray(template_nic))
          nics = template_nic
      else if (!$.isEmptyObject(template_nic))
          nics = [template_nic]
        
      _generate_provision_network_accordion(
        $(".provision_network_selector", context));

      $.each(nics, function(index, nic) {
        _generate_provision_network_table(
          $(".provision_nic_accordion", context),
          nic);
      })
    }
  }

  function _retrieve(context) {
    var nics = [];
    var nic;
    $(".selected_network", context).each(function() {
      if ($(this).attr("template_nic")) {
        nic = JSON.parse($(this).attr("template_nic"))
      } else if ($(this).attr("opennebula_id")) {
        nic = {
          'network_id': $(this).attr("opennebula_id")
        }
      } else {
        nic = undefined;
      }

      if (nic) {
        nics.push(nic);
      }
    });

    return nics
  }

  function _generate_provision_network_table(context, nic, vnet_attr) {
    context.off();
    var nic_span;

    if (nic) {
      nic_span = '<span class="selected_network" template_nic=\'' + JSON.stringify(nic) + '\'>' +
          '<span style="color: #999; font-size: 14px">' + Locale.tr("INTERFACE") + "</span>&emsp;&emsp;" +
          '<span style="color: #777;">' + (nic.NETWORK || nic.NETWORK_ID) + "</span>" +
        '</span>' +
        '<span class="has-tip right provision_remove_nic" style="cursor: pointer;">' +
          '<i class="fa fa-times"/>' +
        '</span>' +
        '<span class="has-tip right" style="cursor: pointer; margin-right:10px">' +
          '<i class="fa fa-pencil"/>' +
        '</span>';
    } else if (vnet_attr) {
      nic_span = '<span style="color: #777; font-size: 16px">' + vnet_attr.description + "</span><br>" +
        '<span class="selected_network only-not-active" attr_name=\'' + vnet_attr.name + '\' style="color: #777;">' +
          '<span style="color: #999; font-size: 14px">' + Locale.tr("INTERFACE") + "</span>&emsp;&emsp;" +
          '<span class="button radius small">' + Locale.tr("Select a Network") + "</span>" +
        '</span>' +
        '<span class="only-active" style="color:#555">' +
          Locale.tr("Select a Network for this interface") +
        '</span>' +
        '<span class="has-tip right only-not-active" style="cursor: pointer; margin-right:10px">' +
          '<i class="fa fa-pencil"/>' +
        '</span>';
    } else {
      nic_span =
        '<span class="selected_network only-not-active" style="color: #777;">' +
          '<span style="color: #999; font-size: 14px">' + Locale.tr("INTERFACE") + "</span>&emsp;&emsp;" +
          '<span class="button radius small">' + Locale.tr("Select a Network") + "</span>" +
        '</span>' +
        '<span class="only-active" style="color:#555">' +
          Locale.tr("Select a Network for this interface") +
        '</span>' +
        '<span class="has-tip right provision_remove_nic" style="cursor: pointer;">' +
          '<i class="fa fa-times"/>' +
        '</span>' +
        '<span class="has-tip right only-not-active" style="cursor: pointer; margin-right:10px">' +
          '<i class="fa fa-pencil"/>' +
        '</span>';
    }

    var dd_context = $('<dd style="border-bottom: 1px solid #efefef;" class="accordion-navigation">' +
      '<a href="#provision_accordion_dd_' + provision_nic_accordion_dd_id + '" style="background: #fff; font-size: 24px">' +
        nic_span +
      '</a>' +
      '<div id="provision_accordion_dd_' + provision_nic_accordion_dd_id + '" class="content">' +
        '<div class="row">' +
          '<div class="large-12 large-centered columns">' +
            '<h3 class="subheader text-right">' +
              '<input type="search" class="provision-search-input right" placeholder="Search"/>' +
            '</h3>' +
            '<br>' +
          '</div>' +
        '</div>' +
        '<div class="row">' +
          '<div class="large-12 large-centered columns">' +
            '<table class="provision_networks_table">' +
              '<thead class="hidden">' +
                '<tr>' +
                  '<th>' + Locale.tr("ID") + '</th>' +
                  '<th>' + Locale.tr("Name") + '</th>' +
                '</tr>' +
              '</thead>' +
              '<tbody class="hidden">' +
              '</tbody>' +
            '</table>' +
            '<br>' +
          '</div>' +
        '</div>' +
        '</div>' +
      '</dd>').appendTo(context);

    provision_nic_accordion_dd_id += 1;

    var provision_networks_datatable = $('.provision_networks_table', dd_context).dataTable({
      "iDisplayLength": 6,
      "sDom" : '<"H">t<"F"lp>',
      "aLengthMenu": [[6, 12, 36, 72], [6, 12, 36, 72]],
      "aoColumnDefs": [
          {"bVisible": false, "aTargets": ["all"]}
      ],
      "aoColumns": [
          {"mDataProp": "VNET.ID"},
          {"mDataProp": "VNET.NAME"}
      ],
      "fnPreDrawCallback": function (oSettings) {
        // create a thumbs container if it doesn't exist. put it in the dataTables_scrollbody div
        if (this.$('tr', {"filter": "applied"}).length == 0) {
          this.html('<div class="text-center">' +
            '<span class="fa-stack fa-5x" style="color: #dfdfdf">' +
              '<i class="fa fa-cloud fa-stack-2x"></i>' +
              '<i class="fa fa-info-circle fa-stack-1x fa-inverse"></i>' +
            '</span>' +
            '<br>' +
            '<br>' +
            '<span style="font-size: 18px; color: #999">' +
              Locale.tr("There are no networks available. Please contact your cloud administrator") +
            '</span>' +
            '</div>');
        } else {
          $(".provision_networks_table", dd_context).html(
            '<ul class="provision_networks_ul large-block-grid-3 medium-block-grid-3 small-block-grid-1 text-center">' +
            '</ul>');
        }

        return true;
      },
      "fnRowCallback": function(nRow, aData, iDisplayIndex, iDisplayIndexFull) {
        var data = aData.VNET;
        $(".provision_networks_ul", dd_context).append(
          '<li>' +
            '<ul class="provision-pricing-table hoverable more-than-one" opennebula_id="' + data.ID + '" opennebula_name="' + data.NAME + '">' +
              '<li class="provision-title" title="' + data.NAME + '">' +
                data.NAME +
              '</li>' +
              '<li class="provision-bullet-item">' +
                '<i class="fa fa-fw fa-globe" style="font-size:40px;"/>' +
              '</li>' +
              '<li class="provision-description">' +
                (data.TEMPLATE.DESCRIPTION || '...') +
              '</li>' +
            '</ul>' +
          '</li>');

        return nRow;
      }
    });

    $('.provision-search-input', dd_context).on('input', function() {
      provision_networks_datatable.fnFilter($(this).val());
    })

    dd_context.on("click", ".provision-pricing-table.more-than-one" , function() {
      $(".selected_network", dd_context).html(
          '<span style="color: #999; font-size: 14px">' + Locale.tr("INTERFACE") + "</span>&emsp;&emsp;" +
          '<span style="color: #777;">' + $(this).attr("opennebula_name") + "</span>");

      $(".selected_network", dd_context).attr("opennebula_id", $(this).attr("opennebula_id"))
      $(".selected_network", dd_context).removeAttr("template_nic")

      $('a', dd_context).first().trigger("click");
    })

    dd_context.on("click", ".provision_remove_nic" , function() {
      dd_context.remove();
      return false;
    });

    if (!nic && !vnet_attr) {
      $('a', dd_context).trigger("click");
    }

    update_provision_networks_datatable(provision_networks_datatable);
  }

  function _generate_provision_network_accordion(context, hide_add_button) {
    context.off();
    context.html(
      '<br>' +
      '<div class="row">' +
        '<div class="large-12 columns">' +
          '<h3 class="subheader text-right">' +
            '<span class="left">' +
              '<i class="fa fa-globe fa-lg"></i>&emsp;' +
              Locale.tr("Network") +
            '</span>' +
          '</h3>' +
          '<br>' +
        '</div>' +
      '</div>' +
      '<div class="row">' +
        '<div class="large-12 large-centered columns">' +
          '<dl class="accordion provision_nic_accordion" data-accordion="provision_accordion_' + provision_nic_accordion_id + '">' +
          '</dl>' +
          '<br>' +
          '<a class="button radius secondary provision_add_network_interface" style="width:inherit; padding: 1rem; color: #555; ' + (hide_add_button ? 'display:none;' : '') + '">' +
            Locale.tr("Add another Network Interface") +
          '</a>' +
        '</div>' +
      '</div>' +
      '<br>')

    provision_nic_accordion_id += 1;

    $(".provision_add_network_interface", context).on("click", function() {
      _generate_provision_network_table($(".accordion", context));
    })

    $(document).foundation();
  }

  function update_provision_networks_datatable(datatable) {
    datatable.html('<div class="text-center">' +
      '<span class="fa-stack fa-5x" style="color: #dfdfdf">' +
        '<i class="fa fa-cloud fa-stack-2x"></i>' +
        '<i class="fa  fa-spinner fa-spin fa-stack-1x fa-inverse"></i>' +
      '</span>' +
      '<br>' +
      '<br>' +
      '<span style="font-size: 18px; color: #999">' +
      '</span>' +
      '</div>');

    OpenNebula.Network.list({
      timeout: true,
      success: function (request, item_list) {
        datatable.fnClearTable(true);
        if (item_list.length == 0) {
          datatable.html('<div class="text-center">' +
            '<span class="fa-stack fa-5x" style="color: #dfdfdf">' +
              '<i class="fa fa-cloud fa-stack-2x"></i>' +
              '<i class="fa fa-info-circle fa-stack-1x fa-inverse"></i>' +
            '</span>' +
            '<br>' +
            '<br>' +
            '<span style="font-size: 18px; color: #999">' +
              Locale.tr("There are no networks available.") +
            '</span>' +
            '</div>');
        } else {
          datatable.fnAddData(item_list);
        }
      },
      error: Notifier.onError
    });
  }
})
