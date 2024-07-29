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
  var TemplateHTML = require("hbs!./leases/html");
  var Sunstone = require("sunstone");

  /*
    CONSTANTS
   */

  var DIALOG_ID = require("./leases/dialogId");

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
    return TemplateHTML({dialogId: this.dialogId});
  }

  /**
   * @param {object} params.
   *        - params.header : Optional, html string
   *        - params.headerTabId : Optional, tabId for the subheader resource ids
   *        - params.body : Optional, html string
   *        - params.question : Optional, html string
   *        - params.buttons : Optional, html string for the button.
   *                           Can be an array for multiple options
   *        - params.submit : Mandatory, function to call if user confirms
   *                          If buttons is an array, it must be an array
   *                          of the same size
   */
  function _setParams(params) {
    this.params = params;

    if (this.params.buttons != undefined && !Array.isArray(this.params.buttons)){
      this.params.buttons = [this.params.buttons];
    }

    if (this.params.submit != undefined && !Array.isArray(this.params.submit)){
      this.params.submit = [this.params.submit];
    }
  }

  function _setup(context) {
    var that = this;

    $(context).keypress(function (e) {
      if (e.which == 13 || e.keyCode == 13) {
        $("#" + DIALOG_ID + "Form", context).submit();
        return false;
      } else {
        return true;
      }
    });

    $("#" + DIALOG_ID + "Form", context).submit(function(e) {
      // With more than one button, skip
      if (that.params.buttons != undefined && that.params.buttons.length > 1){
        e.preventDefault();
        return false;
      }

      Sunstone.getDialog(DIALOG_ID).hide();

      if (that.params.submit != undefined){
        that.params.submit[0](this);
      }

      return false;
    });

    $(context).on("click", ".custom_submit", function(){
      var index = $(this).attr("submit");
      that.params.submit[index]();

      Sunstone.getDialog(DIALOG_ID).hide();
      return false;
    });

    return false;
  }

  function _onShow(context) {
    if (this.params.header != undefined){
      $("#header", context).html(this.params.header);
    }

    if (this.params.body != undefined){
      $("#body", context).html(this.params.body);
    }

    if (this.params.question != undefined){
      $("#question", context).html(this.params.question);
    }

    if (this.params.buttons != undefined){
      var html = "";

      $.each(this.params.buttons, function(i, text){
        html += "<button class=\"custom_submit radius button right\" submit=\""+i+"\">"+text+"</button>";
      });

      $(".form_buttons", context).html(html);
    }

    if (this.params.headerTabId != undefined){
      this.setNames( {tabId: this.params.headerTabId} );
    }

    return false;
  }
});
