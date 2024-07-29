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
    var TemplateHTML = require('hbs!./add/html');
    var Sunstone = require('sunstone');
    var Notifier = require('utils/notifier');
    var Locale = require('utils/locale');
    var Tips = require('utils/tips');
    var RoleTab = require('tabs/oneflow-services-tab/utils/role-tab');
    var OpenNebulaRole = require("opennebula/role");
  
    /*
      CONSTANTS
     */
  
    var DIALOG_ID = require('./add/dialogId');
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
    
      var html_role_id  = "newRole";

      var role = new RoleTab(html_role_id)

      var role_section = $("<div id=\"" + 
        html_role_id +
        "Tab\" class=\"role_content wizard_internal_tab\" role_id=\"0\">" +
        role.html() +
        "</div>"
      );

      $('.add-role-form', context).html(role_section);
      $('#roleTabTemplatesnewRoleContainer', context).closest('.row').show();
      
      role.setup(role_section);
      role.onShow();
      
      $('#refresh_button_roleTabTemplatesnewRole').trigger('click');
      
      $('#addServiceRoleDialogForm',context).on("submit", function(ev) {
        ev.preventDefault();
        var role_info = role.retrieve(context);
        var obj = {
          "action": {
            "perform":"add_role",
            "params" : {
              "role" : JSON.stringify(role_info)
            }
          }
        }

        
        var flow_id = $('.resource-id').text();
        Sunstone.runAction('Role.add', flow_id, obj);
        return false;
      });
  
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
