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

define(function(require){
  /*
    DEPENDENCIES
   */
  var Locale = require('utils/locale');
  var Humanize = require("utils/humanize");
  var TemplateHTML = require("hbs!./increments/html");

  /*
    CONSTANTS
   */
  var PANEL_ID = require('./increments/panelId');
  var XML_ROOT = "IMAGE";

  /*
    CONSTRUCTOR
   */
  function Panel(info) {
    this.title = Locale.tr("Increments");
    this.icon = "fa-angle-double-up";

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
    if (!this.element.BACKUP_INCREMENTS.INCREMENT){
      return ""
    }

    var increments = Array.isArray(this.element.BACKUP_INCREMENTS.INCREMENT) ? 
      this.element.BACKUP_INCREMENTS.INCREMENT :
      [this.element.BACKUP_INCREMENTS.INCREMENT]

    var html = '<div class="backup_increments_content">'

    increments.forEach(function(increment){
      html += TemplateHTML({
        id: increment.ID,
        size: Humanize.sizeFromMB(increment.SIZE),
        date: Humanize.prettyTimeDatatable(increment.DATE),
        type: increment.TYPE
      })
    });

    html += "</div>"

    return html
  }

  function _setup(context) {
    return false;
  }
})
