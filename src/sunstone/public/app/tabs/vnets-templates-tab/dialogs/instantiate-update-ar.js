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
  var TemplateHTML = require('hbs!tabs/vnets-tab/dialogs/update-ar/html');
  var ArTab = require('tabs/vnets-tab/utils/ar-tab');
  var Sunstone = require('sunstone');
  var Notifier = require('utils/notifier');
  var Locale = require('utils/locale');
  var Sunstone = require('sunstone');

  /*
    CONSTANTS
   */

  var DIALOG_ID = require('./instantiate-update-ar/dialogId');
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
      'arTabHTML': this.arTab.html("instantiate_update_ar"),
      'action': "VNTemplate.update_ar"
    });
  }

  function _setup(context) {
    var that = this;
    Foundation.reflow(context, 'abide');

    that.arTab.setup(context, "update_ar");

    $('#update_ar_form', context)
      .on('forminvalid.zf.abide', function(ev, frm) {
        Notifier.notifyError(Locale.tr("One or more required fields are missing."));
      })
      .on('formvalid.zf.abide', function(ev, frm) {
        var data = that.arTab.retrieve();

        data['AR_ID'] = that.arId;

        if ( !Array.isArray(that.element.TEMPLATE.AR) ){
          that.element.TEMPLATE.AR = [that.element.TEMPLATE.AR];
        }

        for (i in that.element.TEMPLATE.AR) {
          if ( that.element.TEMPLATE.AR[i].AR_ID == that.arId ) {
            that.element.TEMPLATE.AR[i] = data;
            break;
          }
        }

        var start = "";

        if(data.TYPE == "IP4" || data.TYPE == "IP4_6"){
          start = (data.IP ? data.IP : "--");
        } else {
          start = (data.MAC ? data.MAC : "--");
        }

        var prefix = "";

        if(data.GLOBAL_PREFIX && data.ULA_PREFIX){
          prefix += data.GLOBAL_PREFIX + "<br>" + data.ULA_PREFIX;
        } else if (data.GLOBAL_PREFIX){
          prefix += data.GLOBAL_PREFIX;
        } else if (data.ULA_PREFIX){
          prefix += data.ULA_PREFIX;
        } else {
          prefix = "--";
        }

        if ($('tr[ar="'+that.arId+'"]', this.context).length) {
          var newHtml = '<td style="white-space: nowrap" class="value_td">'+data.AR_ID+'</td>\
                        <td style="white-space: nowrap" class="value_td">'+data.TYPE+'</td>\
                        <td style="white-space: nowrap" class="value_td">'+start+'</td>\
                        <td style="white-space: nowrap" class="value_td">'+prefix+'</td>\
                        <td style="white-space: nowrap" class="value_td">--</td>';
          $('tr[ar="'+that.arId+'"]', this.context).html(newHtml);

          $("#ar_show_info",this.context).html("");
        }

        Sunstone.getDialog(DIALOG_ID).hide();

        return false;
      })
      .on("submit", function(ev) {
        ev.preventDefault();
      }
    );
  }

  function _onShow(context) {
    this.setNames( {tabId: TAB_ID} );

    this.arTab.onShow();
  }

  function _setParams(params) {
    this.vntmplId = params.vntmplId;
    this.arId = params.arId;
    this.element = params.element;
    this.table_id = params.table_id;
    this.context = params.context;

    $('#ar_id', this.dialogElement).text(params.arId);
    this.arTab.fill(params.arData);
  }
});
