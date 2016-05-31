/* -------------------------------------------------------------------------- */
/* Copyright 2002-2016, OpenNebula Project, OpenNebula Systems                */
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

  var TemplateInfo = require('hbs!./info/html');
  var Locale = require('utils/locale');
  var Config = require('sunstone-config');
  var Sunstone = require('sunstone');
  var PermissionsTable = require('utils/panel/permissions-table');
  var RenameTr = require('utils/panel/rename-tr');
  var OpenNebulaVirtualRouter = require('opennebula/virtualrouter');

  /*
    TEMPLATES
   */

  var TemplateTable = require('utils/panel/template-table');

  /*
    CONSTANTS
   */

  var TAB_ID = require('../tabId');
  var PANEL_ID = require('./info/panelId');
  var RESOURCE = "VirtualRouter";
  var XML_ROOT = "VROUTER";

  var ATTACH_NIC_DIALOG_ID = require('../dialogs/attach-nic/dialogId');
  var CONFIRM_DIALOG_ID = require('utils/dialogs/generic-confirm/dialogId');

  /*
    CONSTRUCTOR
   */

  function Panel(info) {
    this.title = Locale.tr("Info");
    this.icon = "fa-info-circle";

    this.element = info[XML_ROOT];

    return this;
  }

  Panel.PANEL_ID = PANEL_ID;
  Panel.prototype.html = _html;
  Panel.prototype.setup = _setup;

  return Panel;

  /*
    FUNCTION DEFINITIONS
   */

  function _html() {
    var renameTrHTML = RenameTr.html(TAB_ID, RESOURCE, this.element.NAME);

    var permissionsTableHTML = PermissionsTable.html(TAB_ID, RESOURCE, this.element);

    var nics = [];

    if ($.isArray(this.element.TEMPLATE.NIC)){
      nics = this.element.TEMPLATE.NIC;
    } else if (!$.isEmptyObject(this.element.TEMPLATE.NIC)){
      nics = [this.element.TEMPLATE.NIC];
    }

    $.map(nics, function(nic){
      if (nic.NETWORK == undefined){
        nic.NETWORK = "--";
      }

      if (nic.FLOATING_IP != undefined && nic.FLOATING_IP.toUpperCase() == "YES"){
        if(nic.IP == undefined){
          nic.IP = "--";
        }

        if(nic.IP6_ULA == undefined){
          nic.IP6_ULA = "--";
        }

        if(nic.IP6_GLOBAL == undefined){
          nic.IP6_GLOBAL = "--";
        }
      } else {
        nic.IP = "--";
        nic.IP6_ULA = "--";
        nic.IP6_GLOBAL = "--";
      }

      if(nic.VROUTER_MANAGEMENT == undefined){
        nic.VROUTER_MANAGEMENT = "--";
      }
    });

    // TODO: simplify interface?
    var strippedTemplate = $.extend({}, this.element.TEMPLATE);
    delete strippedTemplate["NIC"];

    var templateTableHTML = TemplateTable.html(strippedTemplate, RESOURCE,
                                              Locale.tr("Attributes"));
    //====

    return TemplateInfo({
      'element': this.element,
      'renameTrHTML': renameTrHTML,
      'permissionsTableHTML': permissionsTableHTML,
      'nics': nics,
      'templateTableHTML': templateTableHTML
    });
  }

  function _setup(context) {
    var that = this;

    RenameTr.setup(TAB_ID, RESOURCE, this.element.ID, context);
    PermissionsTable.setup(TAB_ID, RESOURCE, this.element, context);


    if (Config.isTabActionEnabled(TAB_ID, "VirtualRouter.attachnic")) {
      context.off('click', '.attach_nic');
      context.on('click', '.attach_nic', function() {
        var dialog = Sunstone.getDialog(ATTACH_NIC_DIALOG_ID);
        dialog.setElement(that.element);
        dialog.show();
        return false;
      });
    }

    if (Config.isTabActionEnabled(TAB_ID, "VirtualRouter.detachnic")) {
      context.off('click', '.detachnic');
      context.on('click', '.detachnic', function() {
        var nic_id = $(".nic_id", $(this).parents('tr')).attr('nic_id');

        Sunstone.getDialog(CONFIRM_DIALOG_ID).setParams({
          //header :
          body : Locale.tr("This will detach the nic immediately"),
          //question :
          submit : function(){
            Sunstone.runAction('VirtualRouter.detachnic', that.element.ID, nic_id);
            return false;
          }
        });

        Sunstone.getDialog(CONFIRM_DIALOG_ID).reset();
        Sunstone.getDialog(CONFIRM_DIALOG_ID).show();

        return false;
      });
    }

    // TODO: simplify interface?
    var strippedTemplate = $.extend({}, this.element.TEMPLATE);
    delete strippedTemplate["NIC"];

    var hiddenValues = {};

    if (this.element.TEMPLATE.NIC != undefined){
        hiddenValues.NIC = this.element.TEMPLATE.NIC;
    }

    TemplateTable.setup(strippedTemplate, RESOURCE, this.element.ID, context, hiddenValues);
    //===

    return false;
  }
});
