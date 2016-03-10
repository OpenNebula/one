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
  var Tips = require('utils/tips');
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

  /**
   * Inserts the section into the context container
   * @param  {Object} template_json VM Template
   * @param  {object} context       JQuery selector
   * @param  {object} options       Options
   *                                - hide_add_button {bool}
   *                                - click_add_button {bool}
   *                                - floatingIP {bool}: true to show the
   *                                floating IP checkbox
   *                                - forceIPv4 {bool}: true to show the
   *                                input to select the IPv4
   *                                - management {bool}: true to show the
   *                                management checkbox
   */
  function _insert(template_json, context, options) {
    if (options == undefined){
      options = {};
    }

    try {
      if (template_json.VMTEMPLATE.TEMPLATE.SUNSTONE.NETWORK_SELECT != "NO") {
        var template_nic = template_json.VMTEMPLATE.TEMPLATE.NIC
        var nics = []
        if ($.isArray(template_nic))
            nics = template_nic
        else if (!$.isEmptyObject(template_nic))
            nics = [template_nic]

        _generate_provision_network_accordion(
          $(".provision_network_selector", context), options);

        $.each(nics, function(index, nic) {
          var opt = $.extend({}, options);
          opt.nic = nic;

          _generate_provision_network_table(
            $(".provision_nic_accordion", context),
            opt);
        })
      }
    } catch(err) {
      _generate_provision_network_accordion(
        $(".provision_network_selector", context), options);
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
        if ($("input.floating_ip", $(this)).prop("checked")){
          nic["FLOATING_IP"] = "YES";
        }

        var ip4 = $("input.manual_ip4", $(this)).val();

        if (ip4 != undefined && ip4 != ""){
          nic["IP"] = ip4;
        }

        if ($("input.management", $(this)).prop("checked")){
          nic["VROUTER_MANAGEMENT"] = "YES";
        }

        nics.push(nic);
      }
    });

    return nics
  }

  /**
   * @param  {object} context       JQuery selector
   * @param  {object} options       Options
   *                                - nic {object}
   *                                - vnet_attr {object}
   *                                - floatingIP {bool}: true to show the
   *                                floating IP checkbox
   *                                - forceIPv4 {bool}: true to show the
   *                                input to select the IPv4
   *                                - management {bool}: true to show the
   *                                management checkbox
   */
  function _generate_provision_network_table(context, options) {
    context.off();
    var nic_span;

    if (options == undefined){
      options = {};
    }

    if (options.nic) {
      nic_span = '<span class="selected_network" template_nic=\'' + JSON.stringify(options.nic) + '\'>' +
          '<span>' + Locale.tr("INTERFACE") + "</span>" +
          '<span>' + (options.nic.NETWORK || options.nic.NETWORK_ID) + "</span>" +
        '</span>' +
        '<span class="has-tip right provision_remove_nic">' +
          '<i class="fa fa-times"/>' +
        '</span>' +
        '<span class="has-tip right">' +
          '<i class="fa fa-pencil"/>' +
        '</span>';
    } else if (options.vnet_attr) {
      nic_span = '<span>' + options.vnet_attr.description + "</span><br>" +
        '<span class="selected_network only-not-active" attr_name=\'' + options.vnet_attr.name + '\'>' +
          '<span>' + Locale.tr("INTERFACE") + "</span>" +
          '<span class="button radius small">' + Locale.tr("Select a Network") + "</span>" +
        '</span>' +
        '<span class="only-active">' +
          Locale.tr("Select a Network for this interface") +
        '</span>' +
        '<span class="has-tip right only-not-active">' +
          '<i class="fa fa-pencil"/>' +
        '</span>';
    } else {
      nic_span =
        '<span class="selected_network only-not-active">' +
          '<span>' + Locale.tr("INTERFACE") + "</span>" +
          '<span class="button radius small">' + Locale.tr("Select a Network") + "</span>" +
        '</span>' +
        '<span class="only-active">' +
          Locale.tr("Select a Network for this interface") +
        '</span>' +
        '<span class="has-tip right provision_remove_nic">' +
          '<i class="fa fa-times"/>' +
        '</span>' +
        '<span class="has-tip right only-not-active">' +
          '<i class="fa fa-pencil"/>' +
        '</span>';
    }

    var dd_context = $('<dd class="accordion-item" data-accordion-item>' +
      '<a href="#provision_accordion_dd_' + provision_nic_accordion_dd_id + '" class="accordion-title">' +
        nic_span +
      '</a>' +
      '<div id="provision_accordion_dd_' + provision_nic_accordion_dd_id + '" class="accordion-content" data-tab-content>' +
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
              '<thead hidden>' +
                '<tr>' +
                  '<th>' + Locale.tr("ID") + '</th>' +
                  '<th>' + Locale.tr("Name") + '</th>' +
                '</tr>' +
              '</thead>' +
              '<tbody hidden>' +
              '</tbody>' +
            '</table>' +
            '<br>' +
          '</div>' +
        '</div>' +
        '</div>' +
      '</dd>').appendTo(context);

    Foundation.reInit(context);

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
            '<span class="fa-stack fa-5x">' +
              '<i class="fa fa-cloud fa-stack-2x"></i>' +
              '<i class="fa fa-info-circle fa-stack-1x fa-inverse"></i>' +
            '</span>' +
            '<br>' +
            '<br>' +
            '<span>' +
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
                '<i class="fa fa-fw fa-globe"/>' +
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
      var html = 
        '<span>' + Locale.tr("INTERFACE") + "</span>" +
        '<span>' + $(this).attr("opennebula_name") + "</span>";

      if (options.floatingIP){
        html +=
          '<div class="row noclick">' +
            '<div class="small-12 columns">' +
              '<label class="inline">' +
                '<input type="checkbox" class="floating_ip" />' +
                Locale.tr("Floating IP") + " " +
                '<span class="tip">' +
                  Locale.tr("If checked, each Virtual Machine will have a floating IP added to its network interface.") +
                '</span>' +
              '</label>' +
            '</div>' +
          '</div>';
      }

      if (options.forceIPv4){
        html +=
          '<div class="row noclick">' +
            '<div class="small-5 columns">' +
              '<label class="right inline">' +
                Locale.tr("Force IPv4:") + " " +
                '<span class="tip">' +
                  Locale.tr("Optionally, you can force the IP assigned to the network interface.") +
                '</span>' +
              '</label>' +
            '</div>' +
            '<div class="small-7 columns">' +
              '<input type="text" class="manual_ip4" />' +
            '</div>' +
          '</div>';
      }

      if (options.management){
        html +=
          '<div class="noclick">' +
            '<label>' +
              '<input type="checkbox" class="management" />' +
              Locale.tr("Management Interface") + " " +
              '<span class="tip">' +
                Locale.tr("If checked, this network interface will be a Virtual Router management interface. Traffic will not be forwarded.") +
              '</span>' +
            '</label>' +
          '</div>';
      }

      $(".selected_network", dd_context).html(html);
      $(".selected_network", dd_context).attr("opennebula_id", $(this).attr("opennebula_id"))
      $(".selected_network", dd_context).removeAttr("template_nic")

      Tips.setup($(".selected_network", dd_context));

      $('a', dd_context).first().trigger("click");
    })

    dd_context.on("click", ".provision_remove_nic" , function() {
      dd_context.remove();
      return false;
    });

    dd_context.on("click", ".noclick" , function(event) {
      event.stopPropagation();
    });

    if (!options.nic && !options.vnet_attr) {
      $('a', dd_context).trigger("click");
    }

    update_provision_networks_datatable(provision_networks_datatable);
  }

  /**
   * @param  {object} context       JQuery selector
   * @param  {object} options       Options
   *                                - hide_add_button {bool}
   *                                - click_add_button {bool}
   *                                - floatingIP {bool}: true to show the
   *                                floating IP checkbox
   *                                - forceIPv4 {bool}: true to show the
   *                                input to select the IPv4
   *                                - management {bool}: true to show the
   *                                management checkbox
   */
  function _generate_provision_network_accordion(context, options) {
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
          '<dl class="accordion provision_nic_accordion" data-accordion data-allow-all-closed="true">' +
          '</dl>' +
          '<br>' +
          '<a class="button secondary provision_add_network_interface"' + (options.hide_add_button ? 'hidden' : '') + '>' +
            Locale.tr("Add another Network Interface") +
          '</a>' +
        '</div>' +
      '</div>' +
      '<br>')

    Foundation.reflow(context, 'accordion');

    provision_nic_accordion_id += 1;

    $(".provision_add_network_interface", context).on("click", function() {
      _generate_provision_network_table($(".accordion", context), options);
    });

    if (options.click_add_button == true){
      $(".provision_add_network_interface", context).click();
    }

    //TODO $(document).foundation();
  }

  function update_provision_networks_datatable(datatable) {
    datatable.html('<div class="text-center">' +
      '<span class="fa-stack fa-5x">' +
        '<i class="fa fa-cloud fa-stack-2x"></i>' +
        '<i class="fa  fa-spinner fa-spin fa-stack-1x fa-inverse"></i>' +
      '</span>' +
      '<br>' +
      '<br>' +
      '<span>' +
      '</span>' +
      '</div>');

    OpenNebula.Network.list({
      timeout: true,
      success: function (request, item_list) {
        datatable.fnClearTable(true);
        if (item_list.length == 0) {
          datatable.html('<div class="text-center">' +
            '<span class="fa-stack fa-5x">' +
              '<i class="fa fa-cloud fa-stack-2x"></i>' +
              '<i class="fa fa-info-circle fa-stack-1x fa-inverse"></i>' +
            '</span>' +
            '<br>' +
            '<br>' +
            '<span>' +
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
