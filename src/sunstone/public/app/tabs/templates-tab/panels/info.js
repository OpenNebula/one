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

  var Locale = require('utils/locale');
  var Humanize = require('utils/humanize');
  var RenameTr = require('utils/panel/rename-tr');
  var PermissionsTable = require('utils/panel/permissions-table');
  var TagFilter = require('utils/tag-filter');

  /*
    TEMPLATES
   */

  var TemplateInfo = require('hbs!./info/html');

  /*
    CONSTANTS
   */

  var TAB_ID = require('../tabId');
  var PANEL_ID = require('./info/panelId');
  var RESOURCE = "Template"
  var XML_ROOT = "VMTEMPLATE"

  /*
    CONSTRUCTOR
   */

  function Panel(info) {
    this.title = Locale.tr("Info");
    this.icon = "fa-info-circle";

    this.element = info[XML_ROOT];

    this.tagFilter = new TagFilter({
      element: this.element,
      resource: RESOURCE,
      xmlRoot: XML_ROOT
    })

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
    var renameTrHTML = RenameTr.html(TAB_ID, RESOURCE, this.element.NAME);
    var permissionsTableHTML = PermissionsTable.html(TAB_ID, RESOURCE, this.element);
    var tagFilterTableHTML = this.tagFilter.html();
    var prettyRegTime = Humanize.prettyTime(this.element.REGTIME);

    return TemplateInfo({
      'element': this.element,
      'renameTrHTML': renameTrHTML,
      'permissionsTableHTML': permissionsTableHTML,
      'prettyRegTime': prettyRegTime,
      'tagFilterTableHTML': tagFilterTableHTML
    });
  }

  function _setup(context) {
    RenameTr.setup(TAB_ID, RESOURCE, this.element.ID, context);
    PermissionsTable.setup(TAB_ID, RESOURCE, this.element, context);
    this.tagFilter.setup(context);
  }
});
