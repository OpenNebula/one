/* -------------------------------------------------------------------------- */
/* Copyright 2002-2019, OpenNebula Project, OpenNebula Systems                */
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

  var TemplateInfo = require('hbs!tabs/vnets-tab/panels/info/html');
  var Locale = require('utils/locale');
  var PermissionsTable = require('utils/panel/permissions-table');
  var RenameTr = require('utils/panel/rename-tr');

  /*
    TEMPLATES
   */

  var TemplateTable = require('utils/panel/template-table');
  var TemplateTableVcenter = require('utils/panel/template-table');

  /*
    CONSTANTS
   */

  var TAB_ID = require('../tabId');
  var PANEL_ID = require('./info/panelId');
  var RESOURCE = "VNTemplate";
  var XML_ROOT = "VNTEMPLATE";

  var HIDE_ATTRIBUTES = ["AR", "CLUSTERS"];

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

    // TODO: simplify interface?
    var hiddenKeys = [
      "SECURITY_GROUPS",
      "INBOUND_AVG_BW",
      "INBOUND_PEAK_BW",
      "INBOUND_PEAK_KB",
      "OUTBOUND_AVG_BW",
      "OUTBOUND_PEAK_BW",
      "OUTBOUND_PEAK_KB" ];

    var strippedTemplate = {};
    var strippedTemplateVcenter = {};
    $.each(this.element.TEMPLATE, function(key, value) {
      if (!$.inArray(key, hiddenKeys) > -1) {
        if (key.match(/^VCENTER_*/)){
          strippedTemplateVcenter[key] = value;
        }
        else if ( HIDE_ATTRIBUTES.indexOf(key) > -1 ) {
          ;
        }
        else {
          strippedTemplate[key] = value;
        }
      }
    });
    var templateTableHTML = TemplateTable.html(
      strippedTemplate,
      RESOURCE,
      Locale.tr("Attributes")
    );
    var templateTableVcenterHTML = TemplateTableVcenter.html(
      strippedTemplateVcenter,
      RESOURCE,
      Locale.tr("vCenter information"),
      false
    );

    var reservationTrHTML = '';
    var auto_vlan_id = Locale.tr("NO");
    var auto_outer_vlan_id = Locale.tr("NO");

    if (this.element.VLAN_ID_AUTOMATIC == "1") {
      auto_vlan_id = Locale.tr("YES");
    }

    if (this.element.OUTER_VLAN_ID_AUTOMATIC == "1") {
      auto_outer_vlan_id = Locale.tr("YES");
    }
    return TemplateInfo({
      'element': this.element,
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
    var that = this;

    RenameTr.setup(TAB_ID, RESOURCE, this.element.ID, context);
    PermissionsTable.setup(TAB_ID, RESOURCE, this.element, context);

    // TODO: simplify interface?
    var hiddenKeys = [
      "SECURITY_GROUPS",
      "INBOUND_AVG_BW",
      "INBOUND_PEAK_BW",
      "INBOUND_PEAK_KB",
      "OUTBOUNDD_AVG_BW",
      "OUTBOUND_PEAK_BW",
      "OUTBOUND_PEAK_KB" ];

    var hiddenValues = {};
    var strippedTemplate = {};
    var strippedTemplateVcenter = {};
    $.each(that.element.TEMPLATE, function(key, value) {
      if ($.inArray(key, hiddenKeys) > -1) {
        hiddenValues[key] = value;
      }
      if (key.match(/^VCENTER_*/)){
          strippedTemplateVcenter[key] = value;
        }
        else {
          strippedTemplate[key] = value;
        }
    });

    if($.isEmptyObject(strippedTemplateVcenter)){
      $('.vcenter', context).hide();
    }

    TemplateTable.setup(strippedTemplate, RESOURCE, this.element.ID, context, hiddenValues, strippedTemplateVcenter);
    TemplateTableVcenter.setup(strippedTemplateVcenter, RESOURCE, this.element.ID, context, hiddenValues, strippedTemplate);
    //===

    return false;
  }
});
