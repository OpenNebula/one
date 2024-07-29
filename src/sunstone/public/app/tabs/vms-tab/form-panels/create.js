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

  var InstantiateTemplateFormPanel = require("tabs/templates-tab/form-panels/instantiate");
  var Locale = require("utils/locale");
  var Tips = require("utils/tips");
  var TemplatesTable = require("tabs/templates-tab/datatable");
  var OpenNebulaAction = require("opennebula/action");

  /*
    CONSTANTS
   */

  var FORM_PANEL_ID = require("./create/formPanelId");
  var TAB_ID = require("../tabId");

  /*
    CONSTRUCTOR
   */

  function FormPanel() {
    InstantiateTemplateFormPanel.call(this);

    this.formPanelId = FORM_PANEL_ID;
    this.tabId = TAB_ID;
    this.actions = {
      "create": {
        "title": Locale.tr("Create Virtual Machine"),
        "buttonText": Locale.tr("Create"),
        "resetButton": true
      }
    };

    this.templatesTable = new TemplatesTable("vm_create", {"select": true});
  }

  FormPanel.FORM_PANEL_ID = FORM_PANEL_ID;
  FormPanel.prototype = Object.create(InstantiateTemplateFormPanel.prototype);
  FormPanel.prototype.constructor = FormPanel;
  FormPanel.prototype.onShow = _onShow;
  FormPanel.prototype.setup = _setup;

  return FormPanel;

  /*
    FUNCTION DEFINITIONS
   */
  function _setup(context) {
    var that = this;
    InstantiateTemplateFormPanel.prototype.setup.call(this, context);
    $(".selectTemplateTable", context).html("<br/>" + this.templatesTable.dataTableHTML + "<br/>");
    this.templatesTable.initialize();
    this.templatesTable.idInput().on("change", function(){
      var template_id = $(this).val();
      var showRestForm = template_id !== "";

      $(".nameContainer", context).toggle(showRestForm);
      $(".persistentContainer", context).toggle(showRestForm);

      var templatesContext = $(".list_of_templates", context);
      templatesContext.html("");
      templatesContext.toggle(showRestForm);

      if(showRestForm) {
        that.setTemplateIds(context, [template_id]);
        var leasesThat = {};
        function FormPanel() {
          this.name = this.name;
        }
        Object.assign(leasesThat, that);
        leasesThat.resource = "vm";
        leasesThat.resourceId = template_id;

        if(
          OpenNebulaAction &&
          OpenNebulaAction.cache &&
          OpenNebulaAction.cache("VMTEMPLATE") &&
          OpenNebulaAction.cache("VMTEMPLATE").data &&
          Array.isArray(OpenNebulaAction.cache("VMTEMPLATE").data)
        ){
          var vmTemplate = OpenNebulaAction.cache("VMTEMPLATE").data.find(
            function(ele){
              return ele && ele.VMTEMPLATE && ele.VMTEMPLATE.ID && ele.VMTEMPLATE.ID === template_id;
            }
          );
          if(vmTemplate && vmTemplate.VMTEMPLATE && vmTemplate.VMTEMPLATE.TEMPLATE){
            var vmtemplate = vmTemplate.VMTEMPLATE.TEMPLATE;
            var persistent = false;
            if(vmtemplate.DEFAULT_VM_PERSISTENT && vmtemplate.DEFAULT_VM_PERSISTENT.toLowerCase() === "yes"){
              persistent = true;
            }
            $("input.instantiate_pers", context).prop("checked", persistent);
            $("input.instantiate_pers", context).trigger("change");
            leasesThat.jsonTemplate = vmtemplate;
          }
        }
        leasesThat.__proto__ = FormPanel.prototype;
      }
    });
    Tips.setup(context);
  }

  function _onShow(context) {
    this.templatesTable.resetResourceTableSelect();
    InstantiateTemplateFormPanel.prototype.onShow.call(this, context);

    $(".nameContainer", context).hide();
    $(".persistentContainer", context).hide();
  }
});
