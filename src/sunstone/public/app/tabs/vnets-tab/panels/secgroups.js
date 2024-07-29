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

  var Locale = require('utils/locale');
  var SecurityGroupsTable = require('tabs/secgroups-tab/datatable');
  var SecGroupsTemplate = require('hbs!./secgroups/html');
  var Sunstone = require('sunstone');
  var Config = require('sunstone-config');
  var TemplateUtils = require("utils/template-utils");

  /*
    CONSTANTS
   */
  var TAB_ID = require('../tabId');
  var PANEL_ID = require('./secgroups/panelId');
  var SG_TABLE_ID = PANEL_ID + "SecurityGroupsTable";
  var RESOURCE = "Network";
  var XML_ROOT = "VNET";

  var ADD_SECGROUPS_DIALOG_ID = require('../dialogs/add-secgroups/dialogId');
  var CONFIRM_DIALOG_ID = require('utils/dialogs/generic-confirm/dialogId');
  /*
    CONSTRUCTOR
   */

  function Panel(info) {
    this.title = Locale.tr("Security");
    this.icon = "fa-shield-alt";

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
    var secgroups = [];

    if (this.element.TEMPLATE.SECURITY_GROUPS != undefined &&
        this.element.TEMPLATE.SECURITY_GROUPS.length != 0){

        secgroups = this.element.TEMPLATE.SECURITY_GROUPS.split(",");
    }

    var opts = {
      info: true,
      select: true,
      selectOptions: {
        read_only: true,
        fixed_ids: secgroups
      }
    };

    this.secgroupTable = new SecurityGroupsTable(SG_TABLE_ID, opts);

    return SecGroupsTemplate(
      {
        'element': this.element,
        'tab': "vnets-tab",
        'action_add': "Network.add_secgroup",
        'action_rm': "Network.remove_secgroup",
        'dataTableHTML': this.secgroupTable.dataTableHTML
      }
    );
  }

  function _setup(context) {
    var that = this;
    $("#selected_ids_row_vnet_sg_list_tabSecurityGroupsTable",context).hide();
    
    if (that.secgroupTable){
      that.secgroupTable.initialize();
      that.secgroupTable.refreshResourceTableSelect();
    }

    var secGroupDatatable = $("#vnet_sg_list_tabSecurityGroupsTable", context).dataTable({
      "bSortClasses" : false,
      "bDeferRender": true,
      "aoColumnDefs": [
        //{ "bSortable": false, "aTargets": [3,4] },
      ]
    });

    secGroupDatatable.off("click", 'tbody tr');
    secGroupDatatable.on("click", 'tbody tr', function(e){
      var aData = secGroupDatatable.fnGetData(this);
      if (!aData) return true;
      var id = aData[1];
      if (!id) return true;
      var name = aData[2];
      if (!name) return true;

      if(that.last_selected_row_secgroup) {
        that.last_selected_row_secgroup.children().each(function(){
          $(this).removeClass('markrowchecked');
        });
      }

      that.last_selected_row_secgroup = $(this);
      $(this).children().each(function(){
        $(this).addClass('markrowchecked');
      });

      $("#rm_secgroup_button", context).attr("secgroups_id", id).attr("secgroups_name", name).removeAttr('disabled');

      return false;
    });
    
    if (Config.isTabActionEnabled("vnets-tab", "Network.remove_secgroup")) {
      context.off("click", 'button#rm_secgroup_button');
      context.on("click", 'button#rm_secgroup_button', function(){
        var secgroups_id = $(this).attr('secgroups_id');
        var secgroups_name = $(this).attr('secgroups_name');
        Sunstone.getDialog(CONFIRM_DIALOG_ID).setParams({
          //header :
          headerTabId: TAB_ID,
          body : Locale.tr("This will remove the security group") + ' "' + secgroups_name + '"', 
          //question :
          submit : function(){
            var current_security_group = that.element.TEMPLATE.SECURITY_GROUPS.split(",");
            var new_security_groups = [];
            // Get current values of VNet.
            var network_json = {}
            obj = that.element.TEMPLATE;
            for (var key in obj){
              var value = obj[key];
              network_json[key] = value;
            }

            for (var i = 0; i < current_security_group.length; i++) {
              var security_group = current_security_group[i];
              if (security_group != secgroups_id){
                new_security_groups.push(security_group);
              }
            }
            
            network_json["SECURITY_GROUPS"] = new_security_groups.join(",");
            Sunstone.runAction('Network.rm_secgroup',that.element.ID,TemplateUtils.templateToString(network_json));

            return false;
          }
        });

        Sunstone.getDialog(CONFIRM_DIALOG_ID).reset();
        Sunstone.getDialog(CONFIRM_DIALOG_ID).show();

        return false;
      });
    }

    if (Config.isTabActionEnabled("vnets-tab", "Network.add_secgroup")) {
      context.off("click", 'button#add_secgroup_button');
      context.on("click", 'button#add_secgroup_button', function(){
        Sunstone.getDialog(ADD_SECGROUPS_DIALOG_ID).setElement(that.element);
        Sunstone.getDialog(ADD_SECGROUPS_DIALOG_ID).show();

        return false;
      });
    }

    return false;
  }
});
