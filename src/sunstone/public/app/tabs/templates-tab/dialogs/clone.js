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
  var TemplateHTML = require('hbs!./clone/html');
  var Sunstone = require('sunstone');
  var Notifier = require('utils/notifier');
  var OpenNebulaTemplate = require('opennebula/template');

  /*
    CONSTANTS
   */

  var DIALOG_ID = require('./clone/dialogId');
  var TEMPLATES_TAB_ID = require('tabs/templates-tab/tabId')

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

    $('#' + DIALOG_ID + 'Form', context).submit(function() {
      var extra_info;
      var name = $('input[name="name"]', this).val();
      var sel_elems = Sunstone.getDataTable(TEMPLATES_TAB_ID).elements();

      if (!name || !sel_elems.length)
        Notifier.notifyError('A name or prefix is needed!');

      if (sel_elems.length > 1) {
        for (var i = 0; i < sel_elems.length; i++) {
          //If we are cloning several images we
          //use the name as prefix
          extra_info = name + OpenNebulaTemplate.getName(sel_elems[i]);
          Sunstone.runAction('Template.clone', sel_elems[i], extra_info);
        }
      } else {
        extra_info = name;
        Sunstone.runAction('Template.clone', sel_elems[0], extra_info)
      }

      Sunstone.getDialog(DIALOG_ID).hide();
      Sunstone.getDialog(DIALOG_ID).reset();
      setTimeout(function() {
        Sunstone.runAction('Template.refresh');
      }, 1500);
      return false;
    });

    return false;
  }

  function _onShow(context) {
    var sel_elems = Sunstone.getDataTable(TEMPLATES_TAB_ID).elements();
    //show different text depending on how many elements are selected
    if (sel_elems.length > 1) {
      $('.clone_one', context).hide();
      $('.clone_several', context).show();
      $('input[name="name"]',context).val('Copy of ');
    } else {
      $('.clone_one', context).show();
      $('.clone_several', context).hide();
      $('input[name="name"]', context).val('Copy of ' + OpenNebulaTemplate.getName(sel_elems[0]));
    };

    $("input[name='name']", context).focus();

    return false;
  }
});
