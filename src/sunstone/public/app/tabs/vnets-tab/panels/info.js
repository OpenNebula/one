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
  /*
    DEPENDENCIES
   */

  var TemplateInfo = require('hbs!./info/html');
  var Locale = require('utils/locale');
  var PermissionsTable = require('utils/panel/permissions-table');
  var RenameTr = require('utils/panel/rename-tr');
  var OpenNebulaNetwork = require('opennebula/network');
  var Navigation = require('utils/navigation');

  /*
    TEMPLATES
   */

  var TemplateTable = require('utils/panel/template-table');

  /*
    CONSTANTS
   */

  var TAB_ID = require('../tabId');
  var PANEL_ID = require('./info/panelId');
  var RESOURCE = "Network";
  var XML_ROOT = "VNET";

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
      "OUTBOUNDD_AVG_BW",
      "OUTBOUND_PEAK_BW",
      "OUTBOUND_PEAK_KB" ];

    var strippedTemplate = $.extend({}, this.element.TEMPLATE);

    $.each(hiddenKeys, function(i, key){
      delete strippedTemplate[key];
    });

    var templateTableHTML = TemplateTable.html(strippedTemplate, RESOURCE,
                                              Locale.tr("Attributes"));
    //====

    // TODO: move to util?
    var reservationTrHTML = '';

    if(this.element.PARENT_NETWORK_ID.length > 0){
      reservationTrHTML =
        '<tr>\
          <td class="key_td">'+Locale.tr("Reservation parent")+'</td>\
          <td class="value_td">'+Navigation.link(OpenNebulaNetwork.getName(this.element.PARENT_NETWORK_ID), "vnets-tab", this.element.PARENT_NETWORK_ID)+'</td>\
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
    //====

    return TemplateInfo({
      'element': this.element,
      'renameTrHTML': renameTrHTML,
      'reservationTrHTML': reservationTrHTML,
      'permissionsTableHTML': permissionsTableHTML,
      'templateTableHTML': templateTableHTML
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

    var strippedTemplate = $.extend({}, this.element.TEMPLATE);

    $.each(hiddenKeys, function(i, key){
      delete strippedTemplate[key];
    });

    var hiddenValues = {};

    $.each(hiddenKeys, function(i, key){
      if (that.element.TEMPLATE[key] != undefined){
          hiddenValues[key] = that.element.TEMPLATE[key];
      }
    });

    TemplateTable.setup(strippedTemplate, RESOURCE, this.element.ID, context, hiddenValues);
    //===

    return false;
  }
});
