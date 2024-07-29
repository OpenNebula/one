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
  var TemplateHTML = require('hbs!./scale/html');
  var Sunstone = require('sunstone');
  var Notifier = require('utils/notifier');
  var Locale = require('utils/locale');
  var Tips = require('utils/tips');

  /*
    CONSTANTS
   */

  var DIALOG_ID = require('./scale/dialogId');
  var TAB_ID = require('../tabId');

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

  function _onShow(context) {
    this.setNames( {tabId: TAB_ID} );
  }

  function _setup(context) {
    var that = this;

    Foundation.reflow(context, 'abide');

    $('#' + DIALOG_ID + 'Form', context)
      .on('forminvalid.zf.abide', function(ev, frm) {
        Notifier.notifyError(Locale.tr("One or more required fields are missing or malformed."));
      })
      .on('formvalid.zf.abide', function(ev, frm) {
        var force = false;
        if ($("#force", context).is(":checked")) {
          force = true;
        }

        var obj = {
          "force": force,
          "cardinality": $("#cardinality", context).val(),
          "role_name": that.roleName,
        };

        Sunstone.runAction('Role.scale', that.serviceId, obj);

        return false;
      })
      .on("submit", function(ev) {
        ev.preventDefault();
      });

    Tips.setup(context);

    return false;
  }

  /**
   * @param {object} params
   *        - params.serviceId : selected service ID
   *        - params.roleName : selected role name
   */
  function _setParams(params) {
    this.serviceId = params.serviceId;
    this.roleName = params.roleName;
  }
});
