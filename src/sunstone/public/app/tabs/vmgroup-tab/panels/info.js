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

  var TemplateInfo = require('hbs!./info/html');
  var Locale = require('utils/locale');
  var OpenNebulaVMGroup= require('opennebula/vmgroup');
  var PermissionsTable = require('utils/panel/permissions-table');
  var Utils = require('../utils/common');

  /*
    TEMPLATES
   */

  var TemplateTable = require('utils/panel/template-table');

  /*
    CONSTANTS
   */

  var TAB_ID = require('../tabId');
  var PANEL_ID = require('./info/panelId');
  var RESOURCE = "VMGroup";
  var XML_ROOT = "VM_GROUP";

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
    //var renameTrHTML = RenameTr.html(TAB_ID, RESOURCE, this.element.NAME);
    
    var roles = Utils.getRoles(this.element);
    var groupRoles = Utils.getGroupRoles(this.element);
    var permissionsTableHTML = PermissionsTable.html(TAB_ID, RESOURCE, this.element);

    var roleTextList = [];
    var roleAffinityTextList = [];
    if(Array.isArray(roles["ROLE"])){
      $.each(roles["ROLE"], function(){
        roleTextList.push(Utils.sgRoleToSt(this));
      });
    }else{
      $.each(roles, function(){
        roleTextList.push(Utils.sgRoleToSt(this));
      });
    }

    $.each(groupRoles, function(){
      var text = Utils.sgGroupRoleToSt(this);
      if(text["ROLES"])
        roleAffinityTextList.push(text);
    });

    // TODO: simplify interface?
    var strippedTemplate = $.extend({}, this.element.TEMPLATE);
    delete strippedTemplate["ROLE"];

    var templateTableHTML = TemplateTable.html(strippedTemplate, RESOURCE,
                                              Locale.tr("Attributes"));
    //====

    return TemplateInfo({
      'element': this.element,
      'roleList': roleTextList,
      'roleAffinityList': roleAffinityTextList,
      'templateTableHTML': templateTableHTML,
      'permissionsTableHTML': permissionsTableHTML
    });
  }

  function _setup(context) {
    PermissionsTable.setup(TAB_ID, RESOURCE, this.element, context);
    var strippedTemplate = $.extend({}, this.element.TEMPLATE);
    delete strippedTemplate["ROLE"];

    var hiddenValues = {ROLE: this.element.ROLE};

    TemplateTable.setup(strippedTemplate, RESOURCE, this.element.ID, context, hiddenValues);
    //===

    return false;
  }
});
