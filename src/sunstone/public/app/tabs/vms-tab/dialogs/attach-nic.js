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

  var OpennebulaVM = require("opennebula/vm");
  var BaseDialog = require("utils/dialogs/dialog");
  var TemplateHTML = require("hbs!./attach-nic/html");
  var Sunstone = require("sunstone");
  var Notifier = require("utils/notifier");
  var Tips = require("utils/tips");
  var NicTab = require("tabs/templates-tab/form-panels/create/wizard-tabs/network/nic-tab");
  var WizardFields = require("utils/wizard-fields");

  /*
    CONSTANTS
   */

  var DIALOG_ID = require("./attach-nic/dialogId");
  var TAB_ID = require("../tabId");

  /*
    CONSTRUCTOR
   */

  function Dialog() {
    this.dialogId = DIALOG_ID;

    this.nicTab = new NicTab(DIALOG_ID + "NicTab");

    BaseDialog.call(this);
  };

  Dialog.DIALOG_ID = DIALOG_ID;
  Dialog.prototype = Object.create(BaseDialog.prototype);
  Dialog.prototype.constructor = Dialog;
  Dialog.prototype.html = _html;
  Dialog.prototype.onShow = _onShow;
  Dialog.prototype.setup = _setup;
  Dialog.prototype.setElement = _setElement;
  Dialog.prototype.setNicsNames = _setNicsNames;

  return Dialog;

  /*
    FUNCTION DEFINITIONS
   */

  function _html() {
    return TemplateHTML({
      "dialogId": this.dialogId,
      "nicTabHTML": this.nicTab.html()
    });
  }

  function _setup(context) {
    this.context = context;

    var that = this;

    that.nicTab.setup(context, {hide_pci: true, hide_auto: true});

    Tips.setup(context);

    $("#parent", context).hide();
    $(".attach_external", context).hide();

    $("#cb_attach_alias", context).change(function() {
      $("#parent", context).toggle(this.checked);
      $(".attach_external", context).toggle(this.checked);
    });

    $("#" + DIALOG_ID + "Form", context).submit(function() {
      var templateJSON = that.nicTab.retrieve(context);
      var selectedNetwork = Object.keys(templateJSON).length > 0 && templateJSON.constructor === Object;

      if($("#cb_attach_rdp", context).prop("checked")) {
        templateJSON.RDP = "YES";
      }

      var obj = undefined

      if (['pci-auto','pci-manual'].includes($("select.pci-type-nic", context).val())){
        var pciObj = $.extend({
          'TYPE': 'NIC',
        }, templateJSON);

        obj = {
          "PCI": pciObj
        };
      }
      else{
        if($("#cb_attach_alias", context).prop("checked")) {
          templateJSON.PARENT = $("#parent").val();

          if ($('#cb_external').is(':checked')) {
            templateJSON.EXTERNAL = 'YES'
          }
          
          obj = {
              "NIC_ALIAS": templateJSON
          };
        } else {
          obj = {
              "NIC": templateJSON
          };
        }
      }

      if(selectedNetwork){
        Sunstone.runAction("VM.attachnic", that.element.ID, obj);
        Sunstone.getDialog(DIALOG_ID).hide();
        Sunstone.getDialog(DIALOG_ID).reset();
      }else{
        Notifier.notifyError("Select a network");
      }

      return false;
    });

    return false;
  }

  function _onShow(context) {
    this.setNames( {tabId: TAB_ID} );

    this.nicTab.onShow(context);
    $("#cb_attach_alias").prop("checked", false).change();

    var showRdp = false, template = this.element.TEMPLATE;
    if (template.NIC) {
      showRdp = OpennebulaVM.hasConnection(template.NIC, "rdp");

      if (!showRdp && template.NIC_ALIAS) {
        showRdp = OpennebulaVM.hasConnection(template.NIC_ALIAS, "rdp");
      }
    }
    $(".attach_rdp").toggle(!showRdp);

    return false;
  }

  function _setElement(element) {
    this.element = element;
  }

  function _setNicsNames(nicsNames) {
    $("#parent", this.context).empty();
    var that = this;

    nicsNames.forEach(function(element) {
      var nicID = element && element.ID? element.ID : "";
      var nicNET = element && element.NET? element.NET : "";
      var nicIP = element && element.IP? element.IP : "";
      var alias_str = nicID + " - " + nicNET + " " + nicIP;
      $("#parent", that.context).append(new Option(alias_str, element.NAME));
    });
  }
});
