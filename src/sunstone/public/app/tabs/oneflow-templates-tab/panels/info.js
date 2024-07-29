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

  var Humanize = require('utils/humanize');
  var Locale = require('utils/locale');
  var PermissionsTable = require('utils/panel/permissions-table');
  var RenameTr = require('utils/panel/rename-tr');

  /*
    TEMPLATES
   */

  var TemplateHTML = require('hbs!./info/html');

  /*
    CONSTANTS
   */

  var TAB_ID = require('../tabId');
  var PANEL_ID = require('./info/panelId');
  var XML_ROOT = "DOCUMENT";
  var RESOURCE = "ServiceTemplate";

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
    var that = this;

    var renameTrHTML = RenameTr.html(TAB_ID, RESOURCE, this.element.NAME);
    var permissionsTableHTML = PermissionsTable.html(TAB_ID, RESOURCE, this.element);
    var prettyRegTime = this.element.TEMPLATE.BODY['registration_time'] ? Humanize.prettyTime(this.element.TEMPLATE.BODY['registration_time']) : "-";
    var customAttrs = [];

    if ( ! $.isEmptyObject( this.element.TEMPLATE.BODY['custom_attrs'] ) ) {
      $.each(this.element.TEMPLATE.BODY['custom_attrs'], function(key, attr){
        var parts = attr.split("|");
        // 0 mandatory; 1 type; 2 desc;

        var roles_using_net = [];

        switch (parts[1]) {
          case "vnet_id":
            $.each(that.element.TEMPLATE.BODY.roles, function(index, value){
              if (value.vm_template_contents){
                var reg = new RegExp("\\$"+key+"\\b");

                if(reg.exec(value.vm_template_contents) != null){
                  roles_using_net.push(value.name);
                }
              }
            });

            break;
        }

        customAttrs.push({
          "name": key,
          "mandatory": parts[0],
          "type": parts[1],
          "description": parts[2],
          "roles": roles_using_net.join(", ")
        });
      });
    }

    return TemplateHTML({
      'element': this.element,
      'prettyRegTime': prettyRegTime,
      'renameTrHTML': renameTrHTML,
      'permissionsTableHTML': permissionsTableHTML,
      'customAttrs': customAttrs
    });
  }

  function _setup(context) {
    RenameTr.setup(TAB_ID, RESOURCE, this.element.ID, context);
    PermissionsTable.setup(TAB_ID, RESOURCE, this.element, context);
  }
});
