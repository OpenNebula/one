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
  var Humanize = require('utils/humanize');
  var RenameTr = require('utils/panel/rename-tr');
  var TemplateTable = require('utils/panel/template-table');
  var PermissionsTable = require('utils/panel/permissions-table');
  var OpenNebulaMarketPlaceApp = require('opennebula/marketplaceapp');
  var Sunstone = require('sunstone');

  /*
    TEMPLATES
   */

  var TemplateInfo = require('hbs!./templates/html');

  /*
    CONSTANTS
   */

  var TAB_ID = require('../tabId');
  var PANEL_ID = require('./templates/panelId');
  var RESOURCE = "MarketPlaceApp"
  var XML_ROOT = "MARKETPLACEAPP"

  /*
    CONSTRUCTOR
   */

  function Panel(info) {
    this.title = Locale.tr("Templates");
    this.icon = "fa-file";

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
    var vmTemplate = atob(this.element.TEMPLATE.VMTEMPLATE64 || '');
    var appTemplate = atob(this.element.TEMPLATE.APPTEMPLATE64 || '');

    return TemplateInfo({
      'element': this.element,
      'vmTemplate': vmTemplate,
      'appTemplate': appTemplate
    });
  }

  function _setup(context) {
    var that = this;
    
    context.off("click", ".vmTemplate_edit");
    context.on("click", ".vmTemplate_edit", function() {
      $("#vmTemplate_text", context).hide();
      $("#vmTemplate_textarea", context).show().focus();
    });

    context.off("change", "#vmTemplate_textarea");
    context.on("change", "#vmTemplate_textarea", function() {
      var templateStr = 'VMTEMPLATE64 = "' + btoa($(this).val()) + '"';
      Sunstone.runAction("MarketPlaceApp.append_template", that.element.ID, templateStr);
    });

    context.off("focusout", "#vmTemplate_textarea");
    context.on("focusout", "#vmTemplate_textarea", function() {
      $("#vmTemplate_text", context).show();
      $("#vmTemplate_textarea", context).hide();
    });

    $("#vmTemplate_text", context).show();
    $("#vmTemplate_textarea", context).hide();

    context.off("click", ".appTemplate_edit");
    context.on("click", ".appTemplate_edit", function() {
      $("#appTemplate_text", context).hide();
      $("#appTemplate_textarea", context).show().focus();
    });

    context.off("change", "#appTemplate_textarea");
    context.on("change", "#appTemplate_textarea", function() {
      var templateStr = 'APPTEMPLATE64 = "' + btoa($(this).val()) + '"';
      Sunstone.runAction("MarketPlaceApp.append_template", that.element.ID, templateStr);
    });

    context.off("focusout", "#appTemplate_textarea");
    context.on("focusout", "#appTemplate_textarea", function() {
      $("#appTemplate_text", context).show();
      $("#appTemplate_textarea", context).hide();
    });
    
    $("#appTemplate_text", context).show();
    $("#appTemplate_textarea", context).hide();

    return false;
  }
});
