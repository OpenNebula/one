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

  var BaseDialog = require('utils/dialogs/dialog');
  var TemplateHTML = require('hbs!./generic-confirm/html');
  var Sunstone = require('sunstone');
  var Locale = require('utils/locale');

  /*
    CONSTANTS
   */

  var DIALOG_ID = require('./generic-confirm/dialogId');

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
    return TemplateHTML({dialogId: this.dialogId});
  }

  /**
   * @param {object} params.
   *        - params.header : Optional, html string
   *        - params.body : Optional, html string
   *        - params.question : Optional, html string
   *        - params.submit : Mandatory, function to call if user confirms
   */
  function _setParams(params) {
    this.params = params;
  }

  function _setup(context) {
    var that = this;

    $('#' + DIALOG_ID + 'Form', context).submit(function() {
      Sunstone.getDialog(DIALOG_ID).hide();

      if (that.params.submit){
        that.params.submit(this);
      }

      return false;
    });

    return false;
  }

  function _onShow(context) {
    if (this.params.header){
      $("#header", context).html(this.params.header);
    }

    if (this.params.body){
      $("#body", context).html(this.params.body);
    }

    if (this.params.question){
      $("#question", context).html(this.params.question);
    }

    return false;
  }
});
