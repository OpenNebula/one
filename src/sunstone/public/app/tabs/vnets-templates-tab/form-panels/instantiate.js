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

  var BaseFormPanel = require("utils/form-panels/form-panel");
  var TemplateHTML = require("hbs!./instantiate/html");
  var TemplateRowHTML = require("hbs!./instantiate/templateRow");
  var Sunstone = require("sunstone");
  var Notifier = require("utils/notifier");
  var OpenNebulaVNTemplate = require("opennebula/vntemplate");
  var Locale = require("utils/locale");
  var Tips = require("utils/tips");
  var Utils = require('tabs/vnets-tab/utils/common');
  var ArTab = require("tabs/vnets-tab/utils/ar-tab");
  var Config = require('sunstone-config');
  var Ar = require("../panels/ar");
  var SecurityGroupsTable = require('tabs/secgroups-tab/datatable');
  var TemplateARInfo = require('hbs!tabs/vnets-tab/panels/ar/arInfo');
  var OpenNebulaNetworkTemplate = require('opennebula/vntemplate');
  var CustomTagsTable = require("utils/custom-tags-table");
  var WizardFields = require("utils/wizard-fields");
  /*
    CONSTANTS
   */

  var FORM_PANEL_ID = require("./instantiate/formPanelId");
  var SG_TABLE_ID = FORM_PANEL_ID + "SecurityGroupsTable";
  var TAB_ID = require("../tabId");

  var INSTANTIATE_ADD_AR_DIALOG_ID = require('../dialogs/instantiate-add-ar/dialogId');
  var INSTANTIATE_UPDATE_AR_DIALOG_ID = require('../dialogs/instantiate-update-ar/dialogId');
  var CONFIRM_DIALOG_ID = require('utils/dialogs/generic-confirm/dialogId');

  /*
    CONSTRUCTOR
   */

  function FormPanel() {
    this.formPanelId = FORM_PANEL_ID;
    this.tabId = TAB_ID;
    this.actions = {
      "instantiate": {
        "title": Locale.tr("Instantiate Network Template"),
        "buttonText": Locale.tr("Instantiate"),
        "resetButton": false
      }
    };

    this.template_objects = [];

    BaseFormPanel.call(this);
  }

  FormPanel.FORM_PANEL_ID = FORM_PANEL_ID;
  FormPanel.prototype = Object.create(BaseFormPanel.prototype);
  FormPanel.prototype.constructor = FormPanel;
  FormPanel.prototype.setTemplateIds = _setTemplateIds;
  FormPanel.prototype.htmlWizard = _html;
  FormPanel.prototype.submitWizard = _submitWizard;
  FormPanel.prototype.onShow = _onShow;
  FormPanel.prototype.setup = _setup;

  return FormPanel;

  /*
    FUNCTION DEFINITIONS
   */

  function _html() {
    return TemplateHTML({
      "formPanelId": this.formPanelId
    });
  }

  function _setup(context) {
    this.arTemplates = [];
    CustomTagsTable.setup(context)
  }

  function _submitWizard(context) {
    var that = this;

    if (!this.selected_nodes || this.selected_nodes.length == 0) {
      Notifier.notifyError(Locale.tr("No template selected"));
      Sunstone.hideFormPanelLoading();
      return false;
    }

    var vnet_name = $("#vnet_name", context).val();

    $.each(this.selected_nodes, function(index, template_id) {
      var extra_info = {};
      extra_info["template"] = {};

      if ( !Array.isArray(that.arTemplates[template_id].AR) ) {
        that.arTemplates[template_id].AR = [that.arTemplates[template_id].AR]
      }

      extra_info["template"]["AR"] = that.arTemplates[template_id].AR;

      $.extend(extra_info["template"], WizardFields.retrieve($("#instantiateContext", context)));

      $.extend(extra_info["template"], CustomTagsTable.retrieve(context));

      var secgroups = that.securityGroupsTable.retrieveResourceTableSelect();
      if (secgroups != undefined && secgroups.length != 0) {
        extra_info["template"]["SECURITY_GROUPS"] = secgroups.join(",");
      }

      extra_info["vnet_name"] = vnet_name.replace(/%i/gi, i); // replace wildcard

      Sunstone.runAction("VNTemplate.instantiate", [template_id], extra_info);
    });

    return false;
  }

  function _setTemplateIds(context, selected_nodes) {
    var that = this;

    this.arTemplates = [];

    this.selected_nodes = selected_nodes;
    this.template_objects = [];
    this.template_base_objects = {};

    var templatesContext = $(".list_of_vntemplates", context);

    var idsLength = this.selected_nodes.length;
    var idsDone = 0;

    $.each(this.selected_nodes, function(index, template_id) {
      OpenNebulaVNTemplate.show({
        data : {
          id: template_id,
          extended: false
        },
        timeout: true,
        success: function (request, template_json) {
          that.template_base_objects[template_json.VNTEMPLATE.ID] = template_json;
        }
      });
    });

    templatesContext.html("");
    $.each(this.selected_nodes, function(index, template_id) {

      OpenNebulaVNTemplate.show({
        data : {
          id: template_id
        },
        timeout: true,
        success: function (request, template_json) {
          that.template_objects.push(template_json);

          var ar = new Ar(template_json);

          var vn_tmpl = template_json.VNTEMPLATE;

          var opts = {
            info: false,
            select: true,
            selectOptions: {"multiple_choice": true}
          };

          that.securityGroupsTable = new SecurityGroupsTable("vnet_tmpl_instantiate_sg_"+vn_tmpl.ID, opts);

          templatesContext.append(
            TemplateRowHTML(
              {
                element  : vn_tmpl,
                "arHTML" : ar.html(),
                "securityGroupsTableHTML": that.securityGroupsTable.dataTableHTML,
                "customTagsHTML": CustomTagsTable.html()
              })
          );

          if (vn_tmpl.TEMPLATE.AR != undefined){
            $("button#add_ar_button", context).hide();
          }

          $(".provision_sg_selector" + vn_tmpl.ID, context).data("sgTable", that.securityGroupsTable);

          that.securityGroupsTable.initialize();
          that.securityGroupsTable.refreshResourceTableSelect();

          var sgs = template_json.VNTEMPLATE.TEMPLATE.SECURITY_GROUPS;
          if (sgs) {
            var selectedResources = {
              ids : sgs.split(",")
            };
            that.securityGroupsTable.selectResourceTableSelect(selectedResources);
          }

          WizardFields.fill($("#instantiateContext", context), vn_tmpl.TEMPLATE);

          _setup_ar(context, template_json.VNTEMPLATE, that.arTemplates);

          idsDone += 1;
          if (idsLength == idsDone){
            Sunstone.enableFormPanelSubmit(that.tabId);
          }
        },
        error: function(request, error_json, container) {
          Notifier.onError(request, error_json, container);
        }
      });
    });
  }

  function _onShow(context) {
    Sunstone.disableFormPanelSubmit(this.tabId);

    var templatesContext = $(".list_of_vntemplates", context);
    templatesContext.html("");

    Tips.setup(context);
    return false;
  }

  function _setup_ar(context, element, arTemplates) {
    var that = this;
    that.element = element;

    var arTemplates = arTemplates;

    arTemplates[element.ID] = element.TEMPLATE;

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
      if (id == undefined) return true;

      if ( !$(this).children().hasClass("markrowchecked") ) {

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
      } else {
        $("#ar_show_info", context).html("");
        if(that.last_selected_row_ar) {
          that.last_selected_row_ar.children().each(function(){
            $(this).removeClass('markrowchecked');
          });
        }
      }

      $("#ar_show_info .collapse", context).length
    });


    if (Config.isTabActionEnabled("vnets-templates-tab", "VNTemplate.remove_ar")) {
      context.off("click", 'button#rm_ar_button');
      context.on("click", 'button#rm_ar_button', function(){
        var ar_id = $(this).attr('ar_id');

        Sunstone.getDialog(CONFIRM_DIALOG_ID).setParams({
          //header :
          headerTabId: TAB_ID,
          body : Locale.tr("This will delete all the addresses in this range"),
          //question :
          submit : function(){
            $('#ar_list_datatable', context).DataTable().row('tr[ar="'+ar_id+'"]').remove().draw();
            $("#ar_show_info", context).html("");
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

        Sunstone.getDialog(INSTANTIATE_ADD_AR_DIALOG_ID).setParams({
          'id': id,
          'element': that.element,
          'table': "ar_list_datatable",
          'context': context,
          'tableObject': ar_list_dataTable
        });

        Sunstone.getDialog(INSTANTIATE_ADD_AR_DIALOG_ID).show();

        return false;
      });
    }

    if (Config.isTabActionEnabled("vnets-templates-tab", "VNTemplate.update_ar")) {
      context.off("click", 'button#update_ar_button');
      context.on("click", 'button#update_ar_button', function(){
        var id = that.element.ID;
        var ar_id = $(this).attr('ar_id');

        var ar = getAR(that.element, ar_id);

        if(ar != undefined){
          Sunstone.getDialog(INSTANTIATE_UPDATE_AR_DIALOG_ID).reset();

          Sunstone.getDialog(INSTANTIATE_UPDATE_AR_DIALOG_ID).setParams({
            'vntmplId': id,
            'arId': ar_id,
            'element': that.element,
            'arData': $.extend({}, ar),
            'table': "ar_list_datatable",
            'context': context
          });

          Sunstone.getDialog(INSTANTIATE_UPDATE_AR_DIALOG_ID).show();

        } else {
          Notifier.notifyError(Locale.tr("The Address Range was not found"));
        }

        return false;
      });
    }

    return false;
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
});
