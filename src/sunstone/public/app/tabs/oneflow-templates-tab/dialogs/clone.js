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
  var OpenNebulaServiceTemplate = require("opennebula/servicetemplate");

  /*
    CONSTANTS
   */

  var DIALOG_ID = require("./clone/dialogId");
  var ONEFLOW_TEMPLATES_TAB_ID = require("tabs/oneflow-templates-tab/tabId");

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
      "dialogId": this.dialogId
    });
  }

  function _setup(context) {
    var id_cb_clone_vms = "clone-vms";
    var id_cb_clone_images = "clone-images";

    _drawCheckbox(context, id_cb_clone_vms, "Clone VM templates asssociated");

    $("#" + DIALOG_ID + "Form", context).submit(function() {
      var extra_info;
      var name = $("input[name=\"name\"]", this).val();
      var mode = _getModeClone(context, id_cb_clone_vms, id_cb_clone_images);
      var sel_elems = Sunstone.getDataTable(ONEFLOW_TEMPLATES_TAB_ID).elements();

      if (sel_elems.length > 1) {
        for (var i = 0; i < sel_elems.length; i++) {
          //If we are cloning several images we
          //use the name as prefix
          extra_info = {
            name: name + OpenNebulaServiceTemplate.getName(sel_elems[i]),
            mode: mode
          };
          Sunstone.runAction("ServiceTemplate.clone", sel_elems[i], extra_info);
        }
      } else {
        extra_info = { name: name, mode: mode };
        Sunstone.runAction("ServiceTemplate.clone", sel_elems[0], extra_info);
      }

      Sunstone.getDialog(DIALOG_ID).hide();
      Sunstone.getDialog(DIALOG_ID).reset();
      setTimeout(function() {
        Sunstone.runAction("ServiceTemplate.refresh");
      }, 1500);
      return false;
    });

    $("#" + id_cb_clone_vms, context).on('change', function() {
      this.checked
        ? _drawCheckbox(context, id_cb_clone_images, "Clone images asssociated")
        : _removeCheckbox(context, id_cb_clone_images);
    });

    return false;
  }

  function _onShow(context) {
    var sel_elems = Sunstone.getDataTable(ONEFLOW_TEMPLATES_TAB_ID).elements({names: true});

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

  function _drawCheckbox(context, id, text) {
    $("#clone-options", context).append(
      '<div class="large-12 columns" id="' + id + '-wrapper">\
        <input type="checkbox" class="'+ id +'" id="'+ id +'">\
        <label for="'+ id +'">\
          ' + Locale.tr(text) + '\
        </label>\
      </div>');
  }

  function _removeCheckbox(context, id) {
    $("#" + id, context).parent().remove();
  }

  function _getModeClone(context, id_cb_clone_vms, id_cb_clone_images) {
    return $("#" + id_cb_clone_images, context).is(":checked")
      ? "all"
      : $("#" + id_cb_clone_vms, context).is(":checked")
        ? "templates"
        : "none";
  }
});
