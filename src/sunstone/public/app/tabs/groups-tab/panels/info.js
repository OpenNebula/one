/* -------------------------------------------------------------------------- */
/* Copyright 2002-2018, OpenNebula Project, OpenNebula Systems                */
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
  var Views = require('../utils/views');
  var Tips = require('utils/tips');

  /*
    TEMPLATES
   */

  var TemplateTable = require('utils/panel/template-table');

  /*
    CONSTANTS
   */

  var TAB_ID = require('../tabId');
  var PANEL_ID = require('./info/panelId');
  var RESOURCE = "Group";
  var XML_ROOT = "GROUP";

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

    // TODO: simplify interface?
    var strippedTemplate = $.extend({}, this.element.TEMPLATE);
    delete strippedTemplate["SUNSTONE"];
    delete strippedTemplate["OPENNEBULA"];

    var templateTableHTML = TemplateTable.html(strippedTemplate, RESOURCE,
                                              Locale.tr("Attributes"));
    //====

    return TemplateInfo({
      'element': this.element,
      'adminViews': adminViews,
      'userViews': userViews,
      'templateTableHTML': templateTableHTML
    });
  }

  function _setup(context) {
    var that = this;

    Tips.setup(context);

    // Template update
    // TODO: simplify interface?
    var hiddenKeys = [
      "SUNSTONE",
      "TABLE_DEFAULT_PAGE_LENGTH",
      "OPENNEBULA"];

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

  function _processViews(viewsStr, defaultView){
    var viewsArray = [];

    if (viewsStr){
      $.each(viewsStr.split(','), function(index, view){
        var viewElem;

        var knownView = Views.info[view];
        if (knownView){
          viewElem = {
            'name': knownView.name,
            'description': knownView.description
          };
        } else {
          viewElem = {
            'name': view,
            'description': ''
          };
        }

        if (view == defaultView){
          viewElem.name += ' (' + Locale.tr("default") + ')';
        }

        viewsArray.push(viewElem);
      });
    }

    return viewsArray;
  }
});
