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

  var Locale = require('utils/locale');
  var Humanize = require('utils/humanize');
  var RenameTr = require('utils/panel/rename-tr');
  var TemplateTable = require('utils/panel/template-table');
  var PermissionsTable = require('utils/panel/permissions-table');
  var OpenNebulaMarketPlaceApp = require('opennebula/marketplaceapp');
  var Sunstone = require('sunstone');

  /*
    TEMPLATES
   */

  var TemplateInfo = require('hbs!./info/html');

  /*
    CONSTANTS
   */

  var TAB_ID = require('../tabId');
  var PANEL_ID = require('./info/panelId');
  var RESOURCE = "MarketPlaceApp"
  var XML_ROOT = "MARKETPLACEAPP"

  /*
    CONSTRUCTOR
   */

  function Panel(info) {
    this.title = Locale.tr("Info");
    this.icon = "fa-info-circle";

    this.element = info[XML_ROOT];

    return this;
  };

  Panel.PANEL_ID = PANEL_ID;
  Panel.prototype.html = _html;
  Panel.prototype.setup = _setup;

  return Panel;

  /*
    FUNCTION DEFINITIONS
   */


  function _html() {
    var strippedTemplate = $.extend({}, this.element.TEMPLATE);
    delete strippedTemplate["VMTEMPLATE64"];
    delete strippedTemplate["APPTEMPLATE64"];

    var templateTableHTML = TemplateTable.html(
                                      strippedTemplate, RESOURCE,
                                      Locale.tr("Attributes"));

    var renameTrHTML = RenameTr.html(TAB_ID, RESOURCE, this.element.NAME);
    var permissionsTableHTML = PermissionsTable.html(TAB_ID, RESOURCE, this.element);
    var prettyRegTime = Humanize.prettyTime(this.element.REGTIME);
    var stateStr = OpenNebulaMarketPlaceApp.stateStr(this.element.STATE);
    var typeStr = OpenNebulaMarketPlaceApp.typeStr(this.element.TYPE);
    var sizeStr = Humanize.sizeFromMB(this.element.SIZE);


    return TemplateInfo({
      'element': this.element,
      'renameTrHTML': renameTrHTML,
      'templateTableHTML': templateTableHTML,
      'permissionsTableHTML': permissionsTableHTML,
      'prettyRegTime': prettyRegTime,
      'stateStr': stateStr,
      'typeStr': typeStr,
      'sizeStr': sizeStr
    });
  }

  function _setup(context) {
    var strippedTemplate = $.extend({}, this.element.TEMPLATE);
    delete strippedTemplate["VMTEMPLATE64"];
    delete strippedTemplate["APPTEMPLATE64"];

    var hiddenValues = {};

    if (this.element.TEMPLATE.VMTEMPLATE64 !== undefined) {
      hiddenValues.VMTEMPLATE64 = this.element.TEMPLATE.VMTEMPLATE64;
    }
    if (this.element.TEMPLATE.APPTEMPLATE64 !== undefined) {
      hiddenValues.APPTEMPLATE64 = this.element.TEMPLATE.APPTEMPLATE64;
    }

    TemplateTable.setup(strippedTemplate, RESOURCE, this.element.ID, context, hiddenValues);

    RenameTr.setup(TAB_ID, RESOURCE, this.element.ID, context);
    PermissionsTable.setup(TAB_ID, RESOURCE, this.element, context);
    return false;
  }
});
