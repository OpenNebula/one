/* -------------------------------------------------------------------------- */
/* Copyright 2002-2015, OpenNebula Project (OpenNebula.org), C12G Labs        */
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
  var Humanize = require('utils/humanize');
  var TemplateUtils = require('utils/template-utils');

  /*
    TEMPLATES
   */

  var TemplateTable = require('utils/panel/template-table');

  /*
    CONSTANTS
   */

  var PANEL_ID = require('./info/panelId');
  var RESOURCE = "Marketplace";
  var TAB_ID = require('../tabId');

  /*
    CONSTRUCTOR
   */

  function Panel(info) {
    this.title = Locale.tr("Info");
    this.icon = "fa-info-circle";

    this.element = info;

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
    var url = this.element.links.download.href;
    url = url.replace(/\/download$/, '');

    var short_description = "";

    if(this.element.short_description){
      short_description = TemplateUtils.htmlDecode(this.element.short_description).replace(/\n/g, "<br/>");
    }

    var description = TemplateUtils.htmlDecode(this.element.description).replace(/\n/g, "<br/>");

    return TemplateInfo({
      'element': this.element,
      'url': url,
      'short_description': short_description,
      'description': description
    });
  }

  function _setup(context) {
    $('.resource-id', '#' + TAB_ID).hide();
    $('.resource-info-header', '#' + TAB_ID).text(this.element.name);
    return false;
  }
});
