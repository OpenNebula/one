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

  var Locale = require("utils/locale");
  var TemplateTable = require("utils/panel/template-table");
  var Tips = require("utils/tips");
  var Views = require("../utils/views");

  /*
    TEMPLATES
   */

  var TemplateInfo = require("hbs!./info/html");

  /*
    CONSTANTS
   */

  var TAB_ID = require("../tabId");
  var PANEL_ID = require("./info/panelId");
  var RESOURCE = "Group";
  var XML_ROOT = "GROUP";
  var REGEX_HIDDEN_ATTRS = /^(SUNSTONE|OPENNEBULA|TABLE_DEFAULT_PAGE_LENGTH)$/

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
    var adminViews = [];
    var userViews = [];
    var sunstone_template = this.element.TEMPLATE.SUNSTONE;
    if (sunstone_template) {
      adminViews = _processViews(
        sunstone_template.GROUP_ADMIN_VIEWS,
        sunstone_template.GROUP_ADMIN_DEFAULT_VIEW);

      userViews = _processViews(
        sunstone_template.VIEWS,
        sunstone_template.DEFAULT_VIEW);
    }

    
    var attributes = TemplateTable.getTemplatesAttributes(this.element.TEMPLATE, {
      regexHidden: REGEX_HIDDEN_ATTRS
    })

    var templateTableHTML = TemplateTable.html(attributes.general, RESOURCE, Locale.tr("Attributes"));

    return TemplateInfo({
      "element": this.element,
      "adminViews": adminViews,
      "userViews": userViews,
      "templateTableHTML": templateTableHTML
    });
  }

  function _setup(context) {
    Tips.setup(context);

    var attributes = TemplateTable.getTemplatesAttributes(this.element.TEMPLATE, {
      regexHidden: REGEX_HIDDEN_ATTRS
    })

    TemplateTable.setup(attributes.general, RESOURCE, this.element.ID, context, attributes.hidden);

    return false;
  }

  function _processViews(viewsStr, defaultView){
    var viewsArray = [];

    if (viewsStr){
      $.each(viewsStr.split(","), function(index, view){
        var viewElem;

        var knownView = Views.info[view];
        if (knownView){
          viewElem = {
            "name": knownView.name,
            "description": knownView.description
          };
        } else {
          viewElem = {
            "name": view,
            "description": ""
          };
        }

        if (view == defaultView){
          viewElem.name += " (" + Locale.tr("default") + ")";
        }

        viewsArray.push(viewElem);
      });
    }

    return viewsArray;
  }
});
