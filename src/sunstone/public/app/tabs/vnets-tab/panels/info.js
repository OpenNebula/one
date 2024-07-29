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
  /*
    DEPENDENCIES
   */

  var Locale = require('utils/locale');
  var Navigation = require('utils/navigation');
  var OpenNebulaNetwork = require('opennebula/network');
  var PermissionsTable = require('utils/panel/permissions-table');
  var RenameTr = require('utils/panel/rename-tr');
  var TemplateTable = require('utils/panel/template-table');
  
  /*
    TEMPLATES
   */
 
  var TemplateInfo = require('hbs!./info/html');

  /*
    CONSTANTS
   */

  var TAB_ID = require('../tabId');
  var PANEL_ID = require('./info/panelId');
  var RESOURCE = "Network";
  var XML_ROOT = "VNET";
  var REGEX_VCENTER_ATTRS = /^VCENTER_/
  var REGEX_HIDDEN_ATTRS = /^(SECURITY_GROUPS|INBOUND_AVG_BW|INBOUND_PEAK_BW|INBOUND_PEAK_KB|OUTBOUND_AVG_BW|OUTBOUND_PEAK_BW|OUTBOUND_PEAK_KB)$/

  /*
    CONSTRUCTOR
   */

  function Panel(info) {
    this.title = Locale.tr("Info");
    this.icon = "fa-info-circle";

    this.element = info[XML_ROOT];

    return this;
  }

  Panel.PANEL_ID = PANEL_ID;
  Panel.prototype.html = _html;
  Panel.prototype.setup = _setup;

  return Panel;

  /*
    FUNCTION DEFINITIONS
   */

  function _html() {
    var renameTrHTML = RenameTr.html(TAB_ID, RESOURCE, this.element.NAME);
    var permissionsTableHTML = PermissionsTable.html(TAB_ID, RESOURCE, this.element);

    var attributes = TemplateTable.getTemplatesAttributes(this.element.TEMPLATE, {
      regexVCenter: REGEX_VCENTER_ATTRS,
      regexHidden: REGEX_HIDDEN_ATTRS
    })

    var templateTableHTML = TemplateTable.html(attributes.general, RESOURCE, Locale.tr("Attributes"));
    var templateTableVcenterHTML = TemplateTable.html(attributes.vcenter, RESOURCE, Locale.tr("vCenter information"));

    var reservationTrHTML = '';

    if (this.element.PARENT_NETWORK_ID.length > 0) {
      reservationTrHTML =
        '<tr>\
          <td class="key_td">' + Locale.tr("Reservation parent") + '</td>\
          <td class="value_td">' +
            Navigation.link(OpenNebulaNetwork.getName(this.element.PARENT_NETWORK_ID), "vnets-tab", this.element.PARENT_NETWORK_ID) +
          '</td>\
          <td></td>\
        </tr>';

      $(".reserve-sunstone-info").prop("disabled", true);
      $(".reserve-sunstone-info").addClass("has-tip");
      $(".reserve-sunstone-info").attr("title", Locale.tr("This Network is already a reservation"));
    } else{
      $(".reserve-sunstone-info").prop("disabled", false);
      $(".reserve-sunstone-info").removeClass("has-tip");
      $(".reserve-sunstone-info").removeAttr("title");
    }
 
    var auto_vlan_id = (this.element.VLAN_ID_AUTOMATIC == "1") ? Locale.tr("YES") : Locale.tr("NO");
    var auto_outer_vlan_id = (this.element.OUTER_VLAN_ID_AUTOMATIC == "1") ? Locale.tr("YES") : Locale.tr("NO");

    this.element.VLAN_ID = jQuery.isEmptyObject(this.element.VLAN_ID) && 
                           this.element.TEMPLATE && 
                           this.element.TEMPLATE.VCENTER_VLAN_ID? 
                           this.element.TEMPLATE.VCENTER_VLAN_ID : 
                           this.element.VLAN_ID;

    return TemplateInfo({
      'element': this.element,
      'stateStr': OpenNebulaNetwork.stateStr(this.element.STATE),
      'renameTrHTML': renameTrHTML,
      'reservationTrHTML': reservationTrHTML,
      'permissionsTableHTML': permissionsTableHTML,
      'templateTableHTML': templateTableHTML,
      'templateTableVcenterHTML': templateTableVcenterHTML,
      'autoVlanID': auto_vlan_id,
      'autoOuterVlanID': auto_outer_vlan_id,
    });
  }

  function _setup(context) {
    RenameTr.setup(TAB_ID, RESOURCE, this.element.ID, context);
    PermissionsTable.setup(TAB_ID, RESOURCE, this.element, context);

    var attributes = TemplateTable.getTemplatesAttributes(this.element.TEMPLATE, {
      regexVCenter: REGEX_VCENTER_ATTRS,
      regexHidden: REGEX_HIDDEN_ATTRS
    })

    if ($.isEmptyObject(attributes.vcenter)) {
      $('.vcenter', context).hide();
    }

    TemplateTable.setup(attributes.general, RESOURCE, this.element.ID, context, attributes.hidden, attributes.vcenter);
    TemplateTable.setup(attributes.vcenter, RESOURCE, this.element.ID, context, attributes.hidden, attributes.general);

    return false;
  }
});
