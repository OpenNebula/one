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

  var DIALOG_ID = require('./instantiate-add-ar/dialogId');
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
      'arTabHTML': this.arTab.html("instantiate_add_ar"),
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
          data.AR_ID = 0;
          that.element.TEMPLATE.AR = data;
        }

        //delete that.element.TEMPLATE.AR_POOL;

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

        html = '<tr role="row" class="odd" ar="'+data.AR_ID+'">\
          <td style="white-space: nowrap" class="value_td">'+data.AR_ID+'</td>\
          <td style="white-space: nowrap" class="value_td">'+data.TYPE+'</td>\
          <td style="white-space: nowrap" class="value_td">'+start+'</td>\
          <td style="white-space: nowrap" class="value_td">'+prefix+'</td>\
          <td style="white-space: nowrap" class="value_td">--</td>\
        </tr>';

        var row = [ data.AR_ID, data.TYPE, start, prefix, "--"]
        $("#ar_list_datatable", that.context).DataTable().rows.add([row]);

        $("#ar_list_datatable", that.context).DataTable().columns.adjust().draw();

        $("#ar_list_datatable tbody tr:last", that.context).attr("ar", data.AR_ID);
      })
      .on("submit", function(ev) {
        ev.preventDefault();
        Sunstone.getDialog(DIALOG_ID).hide();
      });

      $("#instantiate_add_ar_ar_type_ip4", context).prop('checked', true);
      $("#instantiate_add_ar_ar_type_ip4", context).change();
  }

  function _onShow(context) {
    this.setNames( {tabId: TAB_ID} );

    this.arTab.onShow();
  }

  function _setParams(params) {
    this.vntmplId = params.id;
    this.element = params.element;
    this.table = params.table;
    this.context = params.context;
    this.tableObject = params.tableObject;

    return this.arTab;
  }
});
