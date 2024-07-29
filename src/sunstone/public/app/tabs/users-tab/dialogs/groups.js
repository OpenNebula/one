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
  var GroupsTable = require('tabs/groups-tab/datatable');
  var Sunstone = require('sunstone');

  /*
    TEMPLATES
   */

  var TemplateHTML = require('hbs!./groups/html');

  /*
    CONSTANTS
   */

  var DIALOG_ID = require('./groups/dialogId');
  var TAB_ID = require('../tabId');

  /*
    CONSTRUCTOR
   */

  function Dialog() {
    this.dialogId = DIALOG_ID;

    BaseDialog.call(this);
  };

  Dialog.DIALOG_ID = DIALOG_ID;
  Dialog.prototype = Object.create(BaseDialog.prototype);
  Dialog.prototype.constructor = Dialog;
  Dialog.prototype.html = _html;
  Dialog.prototype.onShow = _onShow;
  Dialog.prototype.setup = _setup;
  Dialog.prototype.setParams = _setParams;

  return Dialog;

  /*
    FUNCTION DEFINITIONS
   */

  function _html() {
    this.groupsTable = new GroupsTable('user_groups', {
        info: false,
        select: true,
        selectOptions: {'multiple_choice': true}
      });

    return TemplateHTML({
      'dialogId': this.dialogId,
      'groupsTableHTML': this.groupsTable.dataTableHTML
    });
  }

  function _setup(dialog) {
    var that = this;
    that.groupsTable.initialize();

    $('#' + DIALOG_ID + 'Form', dialog).submit(function() {
      var selectedGroupsList = that.groupsTable.retrieveResourceTableSelect();

      $.each(selectedGroupsList, function(index, groupId) {
        if ($.inArray(groupId, that.originalGroupIds) === -1) {
          Sunstone.runAction('User.addgroup', [that.element.ID], groupId);
        }
      });

      $.each(that.originalGroupIds, function(index, groupId) {
        if ($.inArray(groupId, selectedGroupsList) === -1) {
          Sunstone.runAction('User.delgroup', [that.element.ID], groupId);
        }
      });

      Sunstone.getDialog(DIALOG_ID).hide();
      Sunstone.getDialog(DIALOG_ID).reset();
      setTimeout(function() {
        Sunstone.runAction('User.refresh');
      }, 1500);

      return false;
    });
  }


  /**
   * @param {object} params
   *        - params.element : user object, or empty object {}
   */
  function _setParams(params) {
    this.element = params.element;

    if (this.element.GROUPS !== undefined && this.element.GROUPS.ID !== undefined) {
      if (Array.isArray(this.element.GROUPS.ID)) {
        this.originalGroupIds = this.element.GROUPS.ID;
      } else {
        this.originalGroupIds = [this.element.GROUPS.ID];
      }
    } else {
      this.originalGroupIds = [];
    }
  }

  function _onShow(dialog) {
    this.setNames( {tabId: TAB_ID} );

    this.groupsTable.refreshResourceTableSelect();

    if (this.originalGroupIds !== undefined && this.originalGroupIds.length > 0) {
      this.groupsTable.selectResourceTableSelect({ids: this.originalGroupIds});
    }
  }
});
