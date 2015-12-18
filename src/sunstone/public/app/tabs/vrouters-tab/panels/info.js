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
  /*
    DEPENDENCIES
   */

  var TemplateInfo = require('hbs!./info/html');
  var Locale = require('utils/locale');
  var PermissionsTable = require('utils/panel/permissions-table');
  var RenameTr = require('utils/panel/rename-tr');
  var OpenNebulaVirtualRouter = require('opennebula/virtualrouter');
  var Sunstone = require('sunstone');
  var Config = require('sunstone-config');

  /*
    TEMPLATES
   */

  var TemplateTable = require('utils/panel/template-table');

  /*
    CONSTANTS
   */

  var TAB_ID = require('../tabId');
  var PANEL_ID = require('./info/panelId');
  var RESOURCE = "VirtualRouter";
  var XML_ROOT = "VROUTER";

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

    var nics = [];

    if ($.isArray(this.element.TEMPLATE.NIC)){
      nics = this.element.TEMPLATE.NIC;
    } else if (!$.isEmptyObject(this.element.TEMPLATE.NIC)){
      nics = [this.element.TEMPLATE.NIC];
    }

    // TODO: simplify interface?
    var strippedTemplate = $.extend({}, this.element.TEMPLATE);
    delete strippedTemplate["NIC"];

    var templateTableHTML = TemplateTable.html(strippedTemplate, RESOURCE,
                                              Locale.tr("Attributes"));
    //====

    return TemplateInfo({
      'element': this.element,
      'renameTrHTML': renameTrHTML,
      'permissionsTableHTML': permissionsTableHTML,
      'nics': nics,
      'templateTableHTML': templateTableHTML
    });
  }

  function _setup(context) {
    $("a.vmid", context).on("click", function(){
      // TODO: this should be checked internally in showElement,
      // but it won't work because of bug #4198

      if (Config.isTabEnabled("vms-tab")){
        Sunstone.showElement("vms-tab", "VM.show", $(this).text());
      }
    });

    RenameTr.setup(TAB_ID, RESOURCE, this.element.ID, context);
    PermissionsTable.setup(TAB_ID, RESOURCE, this.element, context);

    // TODO: simplify interface?
    var strippedTemplate = $.extend({}, this.element.TEMPLATE);
    delete strippedTemplate["NIC"];

    var hiddenValues = {};

    if (this.element.TEMPLATE.NIC != undefined){
        hiddenValues.NIC = this.element.TEMPLATE.NIC;
    }

    TemplateTable.setup(strippedTemplate, RESOURCE, this.element.ID, context, hiddenValues);
    //===

    return false;
  }
});
