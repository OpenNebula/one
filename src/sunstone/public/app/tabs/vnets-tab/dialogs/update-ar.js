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

  var BaseDialog = require('utils/dialogs/dialog');
  var TemplateHTML = require('hbs!./update-ar/html');
  var ArTab = require('tabs/vnets-tab/utils/ar-tab');
  var Sunstone = require('sunstone');
  var Notifier = require('utils/notifier');
  var Locale = require('utils/locale');

  /*
    CONSTANTS
   */

  var DIALOG_ID = require('./update-ar/dialogId');

  /*
    CONSTRUCTOR
   */

  function Dialog() {
    this.dialogId = DIALOG_ID;

    this.arTab = new ArTab();

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
      'arTabHTML': this.arTab.html("update_ar")
    });
  }

  function _setup(context) {
    var that = this;
    context.foundation('abide', 'reflow');
    
    that.arTab.setup(context, "update_ar");

    $('#update_ar_form',context).on('invalid.fndtn.abide', function () {
        Notifier.notifyError(Locale.tr("One or more required fields are missing."));
    }).on('valid.fndtn.abide', function () {
        var data = that.arTab.retrieve();

        data['AR_ID'] = that.arId;

        var obj = {AR: data};
        Sunstone.runAction('Network.update_ar', that.vnetId, obj);

        return false;
    });
  }

  function _onShow(context) {
    this.arTab.onShow();
  }

  function _setParams(params) {
    this.vnetId = params.vnetId;
    this.arId = params.arId;

    $('#vnet_id', this.dialogElement).text(params.vnetId);
    $('#ar_id', this.dialogElement).text(params.arId);
    this.arTab.fill(params.arData);
  }
});
