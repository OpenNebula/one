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

  var Config = require("sunstone-config");
  var Locale = require("utils/locale");
  var OpenNebulaAction = require('opennebula/action');
  var UniqueId = require("utils/unique-id");

  /*
    TEMPLATES
   */

  var TemplateHTML = require("hbs!./backup/html");

  /*
    CONSTANTS
   */

  var WIZARD_TAB_ID = require("./backup/wizardTabId");
  var idsElements = {
    backup_volatile: "#backup-volatile",
    fs_freeze: "#fs-freeze",
    keep_last: "#keep-last",
    mode: "#mode",
    increment_mode: "#increment-mode"
  }

  /*
    CONSTRUCTOR
   */

  function WizardTab(opts) {
    if (!Config.isTemplateCreationTabEnabled(opts.tabId, "backup")) {
      throw "Wizard Tab not enabled";
    }
    this.wizardTabId = WIZARD_TAB_ID + UniqueId.id();
    this.icon = "fa-database";
    this.title = Locale.tr("Backups");
  }

  WizardTab.prototype.constructor = WizardTab;
  WizardTab.prototype.html = _html;
  WizardTab.prototype.setup = _setup;
  WizardTab.prototype.onShow = _onShow;
  WizardTab.prototype.retrieve = _retrieve;
  WizardTab.prototype.fill = _fill;

  return WizardTab;

  /*
    FUNCTION DEFINITIONS
   */

  function _html() {
    return TemplateHTML();
  }

  function _onShow(dialog) {
    dialog.off("change", idsElements.mode)
    dialog.on('change', idsElements.mode, function() {
      var value = $(this).val()
      var parent = $(idsElements.increment_mode, dialog).parent().closest('div')
      if(value === "INCREMENT" && parent.hasClass("hide")){
        parent.removeClass("hide")
      }else{
        parent.addClass("hide")
      }
    });
  }

  function _setup(context) {
    Foundation.reflow(context, "tabs");
  }

  function _retrieve(context) {
    var backupConfigJSON = {}

    var backupVolatile = $(idsElements.backup_volatile, context).is(':checked');
    var fsFreeze = _getValue(idsElements.fs_freeze, context);
    var keepLast = _getValue(idsElements.keep_last, context);
    var mode = _getValue(idsElements.mode, context);
    var increment_mode = _getValue(idsElements.increment_mode, context);

    if (backupVolatile){
      backupConfigJSON['BACKUP_VOLATILE'] = 'YES'
    }

    if (fsFreeze !== '-' ){
      backupConfigJSON['FS_FREEZE'] = fsFreeze
    }

    if (keepLast !== ''){
      backupConfigJSON['KEEP_LAST'] = keepLast
    }

    if (mode !== '-'){
      backupConfigJSON['MODE'] = mode
    }

    if (increment_mode !== ''){
      backupConfigJSON['INCREMENT_MODE'] = increment_mode
    }

    return { 'BACKUP_CONFIG' : backupConfigJSON}
  }

  function _getValue(id = "", context = null) {
    return (id.length && context) ? $(String(id), context).val() : null;
  }

  function _fillBootValue(id = "", context = null, value = "") {
    if (id.length && context && value.length) {
      $(String(id), context).val(value);
    }
  }

  function _fill(context, templateJSON) {
    if(templateJSON && templateJSON.BACKUP_CONFIG){
      var configs = templateJSON.BACKUP_CONFIG
      if(configs && configs.BACKUP_VOLATILE && configs.BACKUP_VOLATILE === 'YES'){
        $(idsElements.backup_volatile, context).click();
      }
      if(configs && configs.FS_FREEZE){
        _fillBootValue(idsElements.fs_freeze, context, configs.FS_FREEZE);
      }
      if(configs && configs.KEEP_LAST){
        _fillBootValue(idsElements.keep_last, context, configs.KEEP_LAST);
      }
      if(configs && configs.MODE){
        _fillBootValue(idsElements.mode, context, configs.MODE);
        if(configs.MODE==="INCREMENT"){
          var parent = $(idsElements.increment_mode, context).parent().closest('div')
          parent.hasClass("hide") && parent.removeClass("hide")
          if(configs && configs.INCREMENT_MODE){
            _fillBootValue(idsElements.increment_mode, context, configs.INCREMENT_MODE);
          }
        }
      }
    }
  }
});
