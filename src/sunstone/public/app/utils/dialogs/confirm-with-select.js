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
  var TemplateHTML = require('hbs!./confirm-with-select/html');
  var Sunstone = require('sunstone');
  var Locale = require('utils/locale');
  var Notifier = require('utils/notifier');
  var TemplateUtils = require('utils/template-utils');

  /*
    CONSTANTS
   */

  var DIALOG_ID = require('./confirm-with-select/dialogId');

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
  Dialog.prototype.setParams = _setParams;

  return Dialog;

  /*
    FUNCTION DEFINITIONS
   */

  function _setParams(params) {
    this.actionId = params.buttonAction;
    this.tabId = params.buttonTab;
    this.button = Sunstone.getButton(this.tabId, this.actionId);
  }

  function _html() {
    return TemplateHTML({
      dialogId: this.dialogId
    });
  }

  function _setup(dialog) {
    var that = this;

    //when we proceed with a "confirm with select" we need to
    //find out if we are running an action with a parametre on a datatable
    //items or if its just an action
    $('#confirm_with_select_proceed', dialog).click(function() {
      var action = Sunstone.getAction(that.actionId);

      var param;

      if (that.button.custom_select) {
        param = $('.resource_list_select', dialog).val();
      } else {
         param = that.resourcesTable.retrieveResourceTableSelect();
      }

      if (!param.length) {
        Notifier.notifyError("You must select a value");
        return false;
      };

      if (!action) {
        Notifier.notifyError("Action " + action + " not defined.");
        return false;
      };

      var error;
      switch (action.type){
      case "multiple":
        error = Sunstone.runAction(that.actionId, action.elements(), param);
        break;
      default:
        error = Sunstone.runAction(that.actionId, param);
        break;
      }

      if (!error) {
        dialog.foundation('close');
      }

      return false;
    });

    return false;
  }

  function _onShow(dialog) {
    var tip = Locale.tr("You have to confirm this action");
    if (this.button.tip) {
      tip = this.button.tip
    }

    $('#confirm_with_select_tip', dialog).html(tip);

    if(this.button.text) {
      $('.subheader', dialog).html(this.button.text);
    }

    var action = Sunstone.getAction(this.actionId);
    this.setNames( {elements: action.elements({names: true})} );

    if (this.button.custom_select) {
      $('div#confirm_select', dialog).html(this.button.custom_select);

      return false;
    }

    var Table;

    switch(this.button.select.toLowerCase()){
      case "acl":
        acls-tab
        break;
      case "cluster":
        Table = require('tabs/clusters-tab/datatable');
        break;
      case "datastore":
        Table = require('tabs/datastores-tab/datatable');
        break;
      case "group":
        Table = require('tabs/groups-tab/datatable');
        break;
      case "host":
        Table = require('tabs/hosts-tab/datatable');
        break;
      case "image":
        Table = require('tabs/images-tab/datatable');
        break;
      case "marketplaceapp":
        Table = require('tabs/marketplaceapps-tab/datatable');
        break;
      case "marketplace":
        Table = require('tabs/marketplaces-tab/datatable');
        break;
      case "vnet":
      case "network":
        Table = require('tabs/vnets-tab/datatable');
        break;
      case "secgroup":
      case "securitygroup":
        Table = require('tabs/secgroups-tab/datatable');
        break;
      case "oneflow-service":
      case "service":
        Table = require('tabs/oneflow-services-tab/datatable');
        break;
      case "oneflow-template":
      case "servicetemplate":
        Table = require('tabs/oneflow-templates-tab/datatable');
        break;
      case "template":
        Table = require('tabs/templates-tab/datatable');
        break;
      case "user":
        Table = require('tabs/users-tab/datatable');
        break;
      case "vdc":
        Table = require('tabs/vdcs-tab/datatable');
        break;
      case "vrouter":
      case "virtualrouter":
        Table = require('tabs/vrouters-tab/datatable');
        break;
      case "vm":
        Table = require('tabs/vms-tab/datatable');
        break;
      case "zone":
        Table = require('tabs/zones-tab/datatable');
        break;
    }

    var opts = {
      info: false,
      select: true,
      selectOptions: {"multiple_choice": false}
    };

    this.resourcesTable = new Table("confirm_with_select", opts);

    $('div#confirm_select', dialog).html(this.resourcesTable.dataTableHTML);

    this.resourcesTable.initialize();
    this.resourcesTable.refreshResourceTableSelect();

    return false;
  }
});
