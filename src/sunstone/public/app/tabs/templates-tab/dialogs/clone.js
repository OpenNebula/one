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
  var TemplateHTML = require("hbs!./clone/html");
  var Sunstone = require("sunstone");
  var Notifier = require("utils/notifier");
  var OpenNebulaTemplate = require("opennebula/template");

  /*
    CONSTANTS
   */

  var DIALOG_ID = require("./clone/dialogId");

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

  function _html() {
    return TemplateHTML({
      "dialogId": this.dialogId
    });
  }

  function _setParams(params) {
    this.params = params;
    this.tabId = params.tabId;
    this.resource = params.resource;
  }

  function _setup(context) {
    var that = this;

    $("#" + DIALOG_ID + "Form", context).submit(function(e) {
      e.preventDefault();
      return false;
    });

    $("#" + DIALOG_ID + "Form", context).on("click", "button.custom_submit", function() {
      if(!$("#" + DIALOG_ID + "Form", context)[0].checkValidity()){
        if ($(this).val() == that.resource+".clone_recursive"){
          $("#" + DIALOG_ID + "Form button[type=\"submit\"]", context).click();
          return true;
        } else {
          return true;
        }
      }

      var extra_info;
      var name = $("#" + DIALOG_ID + "Form input[name=\"name\"]").val();
      var sel_elems = Sunstone.getDataTable(that.tabId).elements();

      if (sel_elems.length > 1) {
        for (var i = 0; i < sel_elems.length; i++) {
          //If we are cloning several images we
          //use the name as prefix
          extra_info = name + OpenNebulaTemplate.getName(sel_elems[i]);
          Sunstone.runAction($(this).val(), sel_elems[i], extra_info);
        }
      } else {
        extra_info = name;
        Sunstone.runAction($(this).val(), sel_elems[0], extra_info);
      }

      Sunstone.getDialog(DIALOG_ID).hide();
      Sunstone.getDialog(DIALOG_ID).reset();
      setTimeout(function() {
        Sunstone.runAction(that.resource+'.refresh');
        Sunstone.runAction(that.resource+".refresh");
      }, 1500);

      return false;
    });

    return false;
  }

  function _onShow(context) {
    var sel_elems = Sunstone.getDataTable(this.tabId).elements({names: true});

    this.setNames( {elements: sel_elems} );

    //show different text depending on how many elements are selected
    if (sel_elems.length > 1) {
      $(".clone_one", context).hide();
      $(".clone_several", context).show();
      $("input[name=\"name\"]",context).val("Copy of ");
    } else {
      $(".clone_one", context).show();
      $(".clone_several", context).hide();
      $("input[name=\"name\"]", context).val("Copy of " + sel_elems[0].name);
    };

    $("input[name='name']", context).focus();

    return false;
  }
});
