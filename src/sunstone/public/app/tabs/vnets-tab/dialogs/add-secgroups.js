/* -------------------------------------------------------------------------- */
/* Copyright 2002-2020, OpenNebula Project, OpenNebula Systems                */
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
  var TemplateHTML = require('hbs!./add-secgroups/html');
  var SecGroupsTab = require('tabs/vnets-tab/utils/secgroups-tab');
  var Sunstone = require('sunstone');
  var Notifier = require('utils/notifier');
  var Locale = require('utils/locale');
  var TemplateUtils = require("utils/template-utils");

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
  Dialog.prototype.setId = _setId;

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

    that.secgroupTab.setup(context, "add_secgroup");

    $('#submit_secgroups_reset_button', context).click(function(){
      Sunstone.getDialog(DIALOG_ID).hide();
      Sunstone.getDialog(DIALOG_ID).reset();
      Sunstone.getDialog(DIALOG_ID).show();
    });

    $('#add_secgroups_form', context)
      .on('forminvalid.zf.abide', function(ev, frm) {
        Notifier.notifyError(Locale.tr("One or more required fields are missing."));
      })
      .on('formvalid.zf.abide', function(ev, frm) {
        var current_security_group = $("#value_td_input_SECURITY_GROUPS").text().split(",");
        var new_security_groups = [];
        for (var i = 0; i < current_security_group.length; i++) {
          var security_group = current_security_group[i];
          if (security_group != ""){
            new_security_groups.push(security_group);
          }
        }

        var selected_security_groups = that.secgroupTab.retrieve()["SECURITY_GROUPS"].split(",");

        for (var i = 0; i < selected_security_groups.length; i++) {
          var security_group = selected_security_groups[i];
          if (current_security_group.indexOf(security_group) < 0){
            new_security_groups += "," + security_group;
          }
        }
        var network_json = {};
        network_json["SECURITY_GROUPS"] = new_security_groups;
        Sunstone.runAction('Network.add_secgroup', that.vnetId, TemplateUtils.templateToString(network_json));
      })
      .on("submit", function(ev) {
        ev.preventDefault();
      });
  }

  function _onShow(context) {
    this.setNames( {tabId: TAB_ID} );

    this.secgroupTab.onShow();
  }

  function _setId(id) {
    this.vnetId = id;
  }
});
