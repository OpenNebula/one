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
  var TemplateHTML = require('hbs!./clone/html');
  var Sunstone = require('sunstone');
  var Notifier = require('utils/notifier');
  var Locale = require('utils/locale');
  var OpenNebulaSecurityGroup = require('opennebula/securitygroup');

  /*
    CONSTANTS
   */

  var DIALOG_ID = require('./clone/dialogId');
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

    Foundation.reflow(context, 'abide');
    $('#' + DIALOG_ID + 'Form', context)
      .on('forminvalid.zf.abide', function(ev, frm) {
        Notifier.notifyError(Locale.tr("One or more required fields are missing or malformed."));
        Sunstone.hideFormPanelLoading(that.tabId);
      })
      .on('formvalid.zf.abide', function(ev, frm) {
      var name = $('input', frm).val();
      var sel_elems = Sunstone.getDataTable(TAB_ID).elements();

      if (sel_elems.length > 1){
        for (var i=0; i< sel_elems.length; i++)
          //use name as prefix if several items selected
          Sunstone.runAction('SecurityGroup.clone',
            sel_elems[i],
            name + OpenNebulaSecurityGroup.getName(sel_elems[i]));
      } else {
        Sunstone.runAction('SecurityGroup.clone',sel_elems[0],name);
      }
      })
      .on("submit", function(ev) {
        ev.preventDefault();
      });

    return false;
  }

  function _onShow(context) {
    var sel_elems = Sunstone.getDataTable(TAB_ID).elements({names: true});

    this.setNames( {elements: sel_elems} );

    //show different text depending on how many elements are selected
    if (sel_elems.length > 1) {
      $('.clone_one', context).hide();
      $('.clone_several', context).show();
      $('input',context).val('Copy of ');
    } else {
      $('.clone_one', context).show();
      $('.clone_several', context).hide();

      $('input',context).val('Copy of ' + sel_elems[0].name);
    }

    $("input[name='name']",context).focus();

    return false;
  }
});
