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

  var BaseDialog = require('utils/dialogs/dialog');
  var Locale = require('utils/locale');
  var Notifier = require('utils/notifier');
  var SecGroupsTab = require('tabs/vnets-tab/utils/secgroups-tab');
  var Sunstone = require('sunstone');
  var TemplateUtils = require("utils/template-utils");
  
  /*
    TEMPLATES
   */

  var TemplateHTML = require('hbs!./add-secgroups/html');

  /*
    CONSTANTS
   */

  var DIALOG_ID = require('./add-secgroups/dialogId');
  var TAB_ID = require('../tabId');

  /*
    CONSTRUCTOR
   */

  function Dialog() {
    this.dialogId = DIALOG_ID;

    this.secgroupTab = new SecGroupsTab();

    BaseDialog.call(this);
  }

  Dialog.DIALOG_ID = DIALOG_ID;
  Dialog.prototype = Object.create(BaseDialog.prototype);
  Dialog.prototype.constructor = Dialog;
  Dialog.prototype.html = _html;
  Dialog.prototype.onShow = _onShow;
  Dialog.prototype.setup = _setup;
  Dialog.prototype.setElement = _setElement;

  return Dialog;

  /*
    FUNCTION DEFINITIONS
   */

  function _html() {
    return TemplateHTML({
      'secGroupsTabHTML': this.secgroupTab.html("add_secgroup"),
      'action': "Network.add_secgroup"
    });
  }

  function _setup(context) {
    var that = this;

    Foundation.reflow(context, 'abide');

    this.secgroupTab.setup(context, "add_secgroup");

    $('#submit_secgroups_reset_button', context).click(function(){
      Sunstone.getDialog(DIALOG_ID).hide();
      Sunstone.getDialog(DIALOG_ID).reset();
      Sunstone.getDialog(DIALOG_ID).show();
    });

    $('#add_secgroups_form', context)
      .on('forminvalid.zf.abide', function() {
        Notifier.notifyError(Locale.tr("One or more required fields are missing."));
      })
      .on('formvalid.zf.abide', function() {
        var str_current_secgroups = that.vnet.TEMPLATE.SECURITY_GROUPS || "";
        var current_secgroups = str_current_secgroups.split(',');
        
        var str_selected_secgroups = that.secgroupTab.retrieve()["SECURITY_GROUPS"] || ""
        var selected_secgroups = str_selected_secgroups.split(",");

        var merged_secgroups = current_secgroups.concat(selected_secgroups)

        var removed_duplicates = $.grep(merged_secgroups, function(item, index) {
          return merged_secgroups.indexOf(item) === index
        })

        var rawTemplate = TemplateUtils.templateToString({
          SECURITY_GROUPS: removed_duplicates.join(',')
        });

        Sunstone.runAction('Network.add_secgroup', that.vnet.ID, rawTemplate);
      })
      .on("submit", function(ev) {
        ev.preventDefault();
      });
  }

  function _onShow() {
    this.setNames( {tabId: TAB_ID} );
    this.secgroupTab.onShow();
  }

  function _setElement(element) {
    this.vnet = element;
  }
});
