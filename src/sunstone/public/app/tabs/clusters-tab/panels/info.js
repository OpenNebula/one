/* -------------------------------------------------------------------------- */
/* Copyright 2002-2016, OpenNebula Project, OpenNebula Systems                */
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

  var TemplateHTML = require('hbs!./info/html');
  var Locale = require('utils/locale');
  var RenameTr = require('utils/panel/rename-tr');
  var TemplateTable = require('utils/panel/template-table');
  var Sunstone = require('sunstone');

  /*
    CONSTANTS
   */

  var TAB_ID = require('../tabId');
  var PANEL_ID = require('./info/panelId');
  var RESOURCE = "Cluster";
  var XML_ROOT = "CLUSTER";

  var OVERCOMMIT_DIALOG_ID = require('utils/dialogs/overcommit/dialogId');

  /*
    CONSTRUCTOR
   */

  function Panel(info) {
    var that = this;

    this.title = Locale.tr("Info");
    this.icon = "fa-info-circle";

    this.element = info[XML_ROOT];

    // Hide information in the template table. Unshow values are stored
    // in the unshownTemplate object to be used when the element info is updated.
    that.unshownTemplate = {};
    that.strippedTemplate = {};
    var unshownKeys = ['RESERVED_CPU', 'RESERVED_MEM'];
    $.each(that.element.TEMPLATE, function(key, value) {
      if ($.inArray(key, unshownKeys) > -1) {
        that.unshownTemplate[key] = value;
      } else {
        that.strippedTemplate[key] = value;
      }
    });

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
    var templateTableHTML = TemplateTable.html(
                                      this.strippedTemplate,
                                      RESOURCE,
                                      Locale.tr("Attributes"));

    return TemplateHTML({
      'element': this.element,
      'renameTrHTML': renameTrHTML,
      'templateTableHTML': templateTableHTML
    });
  }

  function _setup(context) {
    var that = this;

    RenameTr.setup(TAB_ID, RESOURCE, this.element.ID, context);

    TemplateTable.setup(this.strippedTemplate, RESOURCE, this.element.ID, context, this.unshownTemplate);

    $(".edit_reserved", context).on("click", function(){
      var dialog = Sunstone.getDialog(OVERCOMMIT_DIALOG_ID);

      dialog.setParams(
        { element: that.element,
          action : "Cluster.append_template",
          resourceName : Locale.tr("Cluster")
        });

      dialog.show();
      return false;
    });
  }
});
