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

  var TemplateAR = require('hbs!tabs/vnets-tab/panels/ar/html');
  var TemplateARInfo = require('hbs!tabs/vnets-tab/panels/ar/arInfo');
  var Locale = require('utils/locale');
  var Config = require('sunstone-config');
  var Utils = require('tabs/vnets-tab/utils/common');
  var SecurityGroupsTable = require('tabs/secgroups-tab/datatable');
  var Sunstone = require('sunstone');
  var OpenNebulaNetworkTemplate = require('opennebula/vntemplate');
  var Notifier = require('utils/notifier');
  var TemplateUtils = require('utils/template-utils');

  /*
    CONSTANTS
   */

  var TAB_ID = require('../tabId');
  var PANEL_ID = require('./ar/panelId');
  var SG_TABLE_ID = PANEL_ID + "SecurityGroupsTable";
  var RESOURCE = "VNTemplate";
  var XML_ROOT = "VNTEMPLATE";

  var ADD_AR_DIALOG_ID = require('../dialogs/add-ar/dialogId');
  var UPDATE_AR_DIALOG_ID = require('../dialogs/update-ar/dialogId');
  var CONFIRM_DIALOG_ID = require('utils/dialogs/generic-confirm/dialogId');

  /*
    CONSTRUCTOR
   */

  function Panel(info) {
    this.title = Locale.tr("Addresses");
    this.icon = "fa-align-justify";

    this.element = JSON.parse(JSON.stringify(info[XML_ROOT]));

    this.last_selected_row_ar = "";

    this.secgroupTable = undefined;

    return this;
  }

  Panel.PANEL_ID = PANEL_ID;
  Panel.prototype.html = _html;
  Panel.prototype.setup = _setup;
  Panel.prototype.getState = _getState;
  Panel.prototype.setState = _setState;

  return Panel;

  /*
    FUNCTION DEFINITIONS
   */

  function _html() {
    var processedARList = [];

    if (this.element.TEMPLATE.AR != undefined) {
      this.element.TEMPLATE.AR_POOL = {};
      this.element.TEMPLATE.AR_POOL.AR = this.element.TEMPLATE.AR;
      var arList = Utils.getARList(this.element.TEMPLATE);

      for (var i=0; i<arList.length; i++){
        var ar = arList[i];
        var id = i;
        ar.AR_ID = i;

        var type = (ar.TYPE ? ar.TYPE : "--");

        var start = "";

        if(ar.TYPE == "IP4" || ar.TYPE == "IP4_6"){
          start = (ar.IP ? ar.IP : "--");
        } else {
          start = (ar.MAC ? ar.MAC : "--");
        }

        var prefix = "";

        if(ar.GLOBAL_PREFIX && ar.ULA_PREFIX){
          prefix += ar.GLOBAL_PREFIX + "<br>" + ar.ULA_PREFIX;
        } else if (ar.GLOBAL_PREFIX){
          prefix += ar.GLOBAL_PREFIX;
        } else if (ar.ULA_PREFIX){
          prefix += ar.ULA_PREFIX;
        } else {
          prefix = "--";
        }

        var leases = "--";

        processedARList.push({
          "id" : id,
          "type" : type,
          "start" : start,
          "prefixHTML" : prefix,
          "leases": leases
        });
      }
    }

    return TemplateAR({
      'element': this.element,
      'arList' : processedARList,
      'tab': "vnets-templates-tab",
      'action_add': "VNTemplate.add_ar",
      'action_update': "VNTemplate.update_ar",
      'action_rm': "VNTemplate.remove_ar"
    });
  }

  function _setup(context) {

    var that = this;

    var ar_list_dataTable = $("#ar_list_datatable", context).dataTable({
      "bSortClasses" : false,
      "bDeferRender": true,
      "aoColumnDefs": [
        //{ "bSortable": false, "aTargets": [3,4] },
      ]
    });

    // TODO: should be a method for sunstone-config?
    ar_list_dataTable.fnSort( [ [0,config['user_config']['table_order']] ] );

    ar_list_dataTable.off("click", 'tbody tr');
    ar_list_dataTable.on("click", 'tbody tr', function(e){
      var aData = ar_list_dataTable.fnGetData(this);
      if (!aData) return true;
      var id = aData[0];
      if (!id) return true;

      if(that.last_selected_row_ar) {
        that.last_selected_row_ar.children().each(function(){
          $(this).removeClass('markrowchecked');
        });
      }

      that.last_selected_row_ar = $(this);
      $(this).children().each(function(){
        $(this).addClass('markrowchecked');
      });

      $("#update_ar_button", context).attr("ar_id", id);
      $("#update_ar_button", context).prop("disabled", false);

      $("#rm_ar_button", context).attr("ar_id", id).removeAttr('disabled');

      $("#ar_show_info", context).html(_arHTML(that.element, id));

      _arSetup($("#ar_show_info", context), that.element, id);

      return false;
    });


    if (Config.isTabActionEnabled("vnets-templates-tab", "VNTemplate.remove_ar")) {
      context.off("click", 'button#rm_ar_button');
      context.on("click", 'button#rm_ar_button', function(){
        var ar_id = $(this).attr('ar_id');
        var ar_list = Array.isArray(that.element.TEMPLATE.AR)
          ? that.element.TEMPLATE.AR
          : [that.element.TEMPLATE.AR]

        Sunstone.getDialog(CONFIRM_DIALOG_ID).setParams({
          //header :
          headerTabId: TAB_ID,
          body : Locale.tr("This will delete all the addresses in this range"),
          //question :
          submit : function(){
            for (var i=0; i<ar_list.length; i++){
              if (ar_id == i){
                delete ar_list[i]
                break;
              }
            }

            that.element.TEMPLATE.AR = ar_list
            that.element.TEMPLATE.AR_POOL = ar_list

            Sunstone.runAction('VNTemplate.remove_ar', that.element.ID, TemplateUtils.templateToString(that.element.TEMPLATE));

            return false;
          }
        });

        Sunstone.getDialog(CONFIRM_DIALOG_ID).reset();
        Sunstone.getDialog(CONFIRM_DIALOG_ID).show();

        return false;
      });
    }

    if (Config.isTabActionEnabled("vnets-templates-tab", "VNTemplate.add_ar")) {
      context.off("click", 'button#add_ar_button');
      context.on("click", 'button#add_ar_button', function(){
        var id = that.element.ID;

        Sunstone.getDialog(ADD_AR_DIALOG_ID).setParams({
          'id': id,
          'element': that.element,
        });

        Sunstone.getDialog(ADD_AR_DIALOG_ID).show();

        return false;
      });
    }

    if (Config.isTabActionEnabled("vnets-templates-tab", "VNTemplate.update_ar")) {
      context.off("click", 'button#update_ar_button');
      context.on("click", 'button#update_ar_button', function(){
        var id = that.element.ID;
        var ar_id = $(this).attr('ar_id');

        var element = that.element;

        OpenNebulaNetworkTemplate.show({
          data : {
            id: id
          },
          timeout: true,
          success: function (request, vn){
            var vntmpl_info = vn.VNTEMPLATE;

            var ar = getAR(vntmpl_info, ar_id);

            if(ar != undefined){
              Sunstone.getDialog(UPDATE_AR_DIALOG_ID).reset();

              Sunstone.getDialog(UPDATE_AR_DIALOG_ID).setParams({
                'vntmplId': id,
                'arId': ar_id,
                'element': element,
                'arData': $.extend({}, ar)
              });

              Sunstone.getDialog(UPDATE_AR_DIALOG_ID).show();

            } else {
              Notifier.notifyError(Locale.tr("The Address Range was not found"));
              Sunstone.runAction("VNTemplate.show", id);
            }
          },
          error: Notifier.onError
        });

        return false;
      });
    }

    return false;
  }

  function _getState(context) {
    var state = {};

    if(this.last_selected_row_ar){
      state["ar"] = this.last_selected_row_ar.attr("ar");
    }

    return state;
  }

  function _setState(state, context) {
    var that = this;

    if(state.ar){
      $('#ar_list_datatable tr[ar="'+state.ar+'"]',context).click();
    }
  }

  //============================================================================
  //============================================================================

  // TODO move to util?
  function getAR(vntmpl_info, arId){
    vntmpl_info.TEMPLATE.AR_POOL = {};
    vntmpl_info.TEMPLATE.AR_POOL.AR = vntmpl_info.TEMPLATE.AR;
    var ar_list = Utils.getARList(vntmpl_info.TEMPLATE);
    var ar = undefined;

    for (var i=0; i<ar_list.length; i++){
      if (arId == i){
        ar = $.extend({}, ar_list[i]);
        break;
      }
    }

    return ar;
  }
  //====


  // TODO: move to its own file?

  function _arHTML(vntmpl_info, arId){
    var ar = getAR(vntmpl_info, arId);

    if(ar == undefined){
        return "";
    }

    var first_mac       = ar.MAC;
    var last_mac        = ar.MAC_END;
    var first_ip        = ar.IP;
    var last_ip         = ar.IP_END;
    var first_ip6_static= ar.IP6;
    var last_ip6_static = ar.IP6_END;
    var first_ip6_global= ar.IP6_GLOBAL;
    var last_ip6_global = ar.IP6_GLOBAL_END;
    var first_ip6_ula   = ar.IP6_ULA;
    var last_ip6_ula    = ar.IP6_ULA_END;

    var arKnownAttr = [
      {key: Locale.tr("Type"),         value: ar.TYPE},
      {key: Locale.tr("Global prefix"),value: ar.GLOBAL_PREFIX},
      {key: Locale.tr("ULA prefix"),   value: ar.ULA_PREFIX},
      {key: Locale.tr("Size"),         value: ar.SIZE},
      {key: Locale.tr("IPAM driver"),  value: ar.IPAM_MAD},
    ];

    delete ar["MAC_END"];
    delete ar["IP_END"];
    delete ar["IP6_ULA"];
    delete ar["IP6_ULA_END"];
    delete ar["IP6"];
    delete ar["IP6_END"];
    delete ar["IP6_GLOBAL"];
    delete ar["IP6_GLOBAL_END"];
    delete ar["AR_ID"];
    delete ar["IPAM_MAD"];
    delete ar["TYPE"];
    delete ar["MAC"];
    delete ar["IP"];
    delete ar["GLOBAL_PREFIX"];
    delete ar["ULA_PREFIX"];
    delete ar["SIZE"];
    delete ar["LEASES"];

    this.secgroupTable = undefined;
    var secgroupTableHTML = undefined;

    if (ar.SECURITY_GROUPS != undefined &&
        ar.SECURITY_GROUPS.length != 0){

      var secgroups = ar.SECURITY_GROUPS.split(",");

      var opts = {
        info: true,
        select: true,
        selectOptions: {
          read_only: true,
          fixed_ids: secgroups
        }
      };

      this.secgroupTable = new SecurityGroupsTable(SG_TABLE_ID, opts);
      secgroupTableHTML = this.secgroupTable.dataTableHTML;
    }

    delete ar["SECURITY_GROUPS"];

    var arExtraAttr = ar;

    return TemplateARInfo({
      'arId': arId,
      'arKnownAttr': arKnownAttr,
      'arExtraAttr': arExtraAttr,
      'first_mac': first_mac,
      'last_mac': last_mac,
      'first_ip': first_ip,
      'last_ip': last_ip,
      'first_ip6_static': first_ip6_static,
      'last_ip6_static': last_ip6_static,
      'first_ip6_global': first_ip6_global,
      'last_ip6_global': last_ip6_global,
      'first_ip6_ula': first_ip6_ula,
      'last_ip6_ula': last_ip6_ula,
      'secgroupTableHTML': secgroupTableHTML
    });
  }

  function _arSetup(section, vntmpl_info, ar_id){
    var ar = getAR(vntmpl_info, ar_id);

    if(ar == undefined){
        return;
    }

    if (this.secgroupTable != undefined){
      this.secgroupTable.initialize();
      this.secgroupTable.refreshResourceTableSelect();
    }
  }
});
