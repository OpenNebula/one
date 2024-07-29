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
  var TemplateHTML = require('hbs!tabs/vnets-tab/dialogs/add-ar/html');
  var ArTab = require('tabs/vnets-tab/utils/ar-tab');
  var Sunstone = require('sunstone');
  var Notifier = require('utils/notifier');
  var Locale = require('utils/locale');
  var TemplateUtils = require('utils/template-utils');

  /*
    CONSTANTS
   */

  var DIALOG_ID = require('./add-ar/dialogId');
  var TAB_ID = require('../tabId');

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
      'arTabHTML': this.arTab.html("add_ar"),
      'action': "VNTemplate.add_ar"
    });
  }

  function _setup(context) {
    var that = this;
    Foundation.reflow(context, 'abide');

    that.arTab.setup(context, "add_ar");

    $('#submit_ar_reset_button', context).click(function(){
      Sunstone.getDialog(DIALOG_ID).hide();
      Sunstone.getDialog(DIALOG_ID).reset();
      Sunstone.getDialog(DIALOG_ID).show();
    });

    $('#add_ar_form', context)
      .on('forminvalid.zf.abide', function(ev, frm) {
        Notifier.notifyError(Locale.tr("One or more required fields are missing."));
      })
      .on('formvalid.zf.abide', function(ev, frm) {
        var data = that.arTab.retrieve();

        if ( that.element.TEMPLATE.AR != undefined ) {
          if ( !Array.isArray(that.element.TEMPLATE.AR) ){
            that.element.TEMPLATE.AR = [that.element.TEMPLATE.AR];
          }
          data.AR_ID = that.element.TEMPLATE.AR[that.element.TEMPLATE.AR.length-1].AR_ID+1;
          that.element.TEMPLATE.AR.push(data);
        } else {
          that.element.TEMPLATE.AR = data;
        }

        delete that.element.TEMPLATE.AR_POOL;

        Sunstone.runAction('VNTemplate.add_ar', that.vntmplId, TemplateUtils.templateToString(that.element.TEMPLATE));
        return false;
      });
  }

  function _onShow(context) {
    this.setNames( {tabId: TAB_ID} );

    this.arTab.onShow();
  }

  function _setParams(params) {
    this.vntmplId = params.id;
    this.element = params.element;
  }
});
