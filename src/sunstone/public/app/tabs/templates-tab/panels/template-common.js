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

  var Locale = require('utils/locale');
  var TemplateUtils = require('utils/template-utils');

  /*
    TEMPLATES
   */

  var TemplateInfo = require('hbs!./template/html');

  /*
    CONSTANTS
   */

  var PANEL_ID = require('./template/panelId');
  var XML_ROOT = "VMTEMPLATE"

  /*
    CONSTRUCTOR
   */

  function Panel(info) {
    this.title = Locale.tr("Template");
    this.icon = "fa-file";

    this.element = info[XML_ROOT];

    return this;
  };

  Panel.prototype.html = _html;
  Panel.prototype.setup = _setup;

  return Panel;

  /*
    FUNCTION DEFINITIONS
   */

  function _html() {
    return TemplateInfo({
      'element': this.element,
      'templateString': TemplateUtils.templateToString(this.element.TEMPLATE)
    });
  }

  function _setup(context) {
  }
});
