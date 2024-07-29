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
  var TemplateHTML = require('hbs!./overcommit/html');
  var Sunstone = require('sunstone');
  var Notifier = require('utils/notifier');
  var WizardFields = require('utils/wizard-fields');
  var TemplateUtils = require('utils/template-utils');
  var Config = require('sunstone-config');

  /*
    CONSTANTS
   */

  var DIALOG_ID = require('./overcommit/dialogId');

  /*
    CONSTRUCTOR
   */
  function Dialog() {
    this.dialogId = DIALOG_ID;

    BaseDialog.call(this);
  }

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
    return TemplateHTML({
      'dialogId': this.dialogId
    });
  }

  function _setup(context) {
    var that = this;

    $('#' + that.dialogId + 'Form', context).submit(function() {
      var obj = WizardFields.retrieve(context);

      if (obj.RESERVED_CPU == undefined){
        obj.RESERVED_CPU = "";
      }

      if (obj.RESERVED_MEM == undefined){
        obj.RESERVED_MEM = "";
      }

      Sunstone.runAction(that.action, that.element.ID,
                          TemplateUtils.templateToString(obj));

      Sunstone.getDialog(that.dialogId).hide();
      Sunstone.getDialog(that.dialogId).reset();
      return false;
    });

    return false;
  }

  function _onShow(context) {
    this.setNames( {tabId: this.tabId} );

    WizardFields.fill(context, this.element.TEMPLATE);

    return false;
  }

  /**
   * @param {object} params.
   *        - params.element : host or cluster element
   *        - params.action : sunstone action e.g. "Host.append_template"
   *        - params.resourceName : For the header. e.g. "Host"
   *        - params.tabId: e.g. 'hosts-tab'
   */
  function _setParams(params) {
    this.element = params.element;

    this.action = params.action;
    this.resourceName = params.resourceName;
    this.tabId = params.tabId;
  }
});
