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
  var BaseDialog = require("utils/dialogs/dialog");
  var Notifier = require("utils/notifier");
  var SecgroupsTable = require('tabs/secgroups-tab/datatable');
  var Sunstone = require("sunstone");
  var TemplateHTML = require("hbs!./attach-sg/html");


  /*
    CONSTANTS
   */

  var DIALOG_ID = require("./attach-sg/dialogId");
  var TAB_ID = require("../tabId");

  /*
    CONSTRUCTOR
   */

  function Dialog() {
    var that = this;
    this.dialogId = DIALOG_ID;
    
    var secgroupSelectOptions = {
      'select': true,
      'selectOptions': {
        "multiple_choice": false,
        'unselect_callback': function(aData, options){
          if (that.secGroups && that.secGroups.includes(aData[options.id_index])){
            $("div[name='str_nic_tab_id'] table tbody tr td:contains('" + aData[options.name_index] + "')").click();
          }
        },
        'filter_fn': function(sg) {
          if (that.nic && that.nic.SECURITY_GROUPS) {
            var security_groups = that.nic.SECURITY_GROUPS ? that.nic.SECURITY_GROUPS.split(",") : [];
            return !security_groups.includes(sg.ID);
          }
          return true;
        }
      }
    };

    this.secgroupsTable = new SecgroupsTable(this.dialogId + 'SGTable', secgroupSelectOptions);

    BaseDialog.call(this);
  };

  Dialog.DIALOG_ID = DIALOG_ID;
  Dialog.prototype = Object.create(BaseDialog.prototype);
  Dialog.prototype.constructor = Dialog;
  Dialog.prototype.html = _html;
  Dialog.prototype.onShow = _onShow;
  Dialog.prototype.setup = _setup;
  Dialog.prototype.setElement = _setElement;
  
  return Dialog;

  /*
    FUNCTION DEFINITIONS
   */

  function _html() {
    return TemplateHTML({
      "dialogId": this.dialogId,
      "secGroupsDataTableHTML": this.secgroupsTable.dataTableHTML
    });
  }

  function _setup(context) {
    var that = this;
    that.secgroupsTable.initialize();
    that.secgroupsTable.refreshResourceTableSelect();

    $("#" + DIALOG_ID + "Form", context).submit(function() {
      var sg_id = that.secgroupsTable.retrieveResourceTableSelect();

      if(sg_id !== ''){
        var obj = {
          'nic_id': parseInt(that.nic.NIC_ID),
          'sg_id': parseInt(sg_id)
        };
        Sunstone.runAction("VM.attachsg", that.element.ID, obj);
        Sunstone.getDialog(DIALOG_ID).hide();
        Sunstone.getDialog(DIALOG_ID).reset();
      }else{
        Notifier.notifyError("Select a security group");
      }

      return false;
    });
    return false;
  }

  function _onShow(context) {
    return false;
  }

  function _setElement(element, nic_id) {
    this.element = element;
    var nic_array = [];

    nic_array = Array.isArray(element.TEMPLATE.NIC) ? element.TEMPLATE.NIC : [element.TEMPLATE.NIC];
    this.nic = nic_array.filter(function(nic) {
      return nic.NIC_ID == nic_id;
    })[0];

    this.secgroupsTable.refreshResourceTableSelect();
  }
});
