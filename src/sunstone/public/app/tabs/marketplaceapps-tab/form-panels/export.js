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
  var Sunstone = require("sunstone");
  var Locale = require("utils/locale");
  var Tips = require("utils/tips");
  var DataStoresTable = require("tabs/datastores-tab/datatable");
  var TemplatesTable = require("tabs/templates-tab/datatable");
  var DockerTagsTable = require("./docker-tags");
  var DataStore = require("opennebula/datastore");
  var Template = require("opennebula/template");

  /*
    TEMPLATES
   */

  var TemplateWizardHTML = require("hbs!./export/wizard");

  /*
    CONSTANTS
   */

  var FORM_PANEL_ID = require("./export/formPanelId");
  var TAB_ID = require("../tabId");

  /*
    CONSTRUCTOR
  */

  function getDataStore(formPanelId){
    var r = null;
    if(formPanelId){
      r = new DataStoresTable(
        formPanelId + "datastoresTable", {
          "select": true,
          "selectOptions": {
            "filter_fn": function() { return }
          }
        }
      );
    }
    return r;
  }

  function getTemplates(formPanelId){
    var r = null;
    if(formPanelId){
      r = new TemplatesTable(
        formPanelId + "templatesTable", {
          "select": true
        }
      );
    }
    return r;
  }

  function _getDockerTagsTable(formPanelId, resourceId){
    return (formPanelId)
      ? new DockerTagsTable(
        formPanelId + "docketagsTable",
        { appId: resourceId, select: true }
      ) : null;
  }

  function FormPanel() {
    this.formPanelId = FORM_PANEL_ID;
    this.tabId = TAB_ID;
    this.actions = {
      "export": {
        "title": Locale.tr("Download App To OpenNebula"),
        "buttonText": Locale.tr("Download"),
        "resetButton": false
      }
    };

    this.datastoresTable = getDataStore(FORM_PANEL_ID);
    this.vCenterTemplatesTable = getTemplates(FORM_PANEL_ID);

    BaseFormPanel.call(this);
  }

  FormPanel.FORM_PANEL_ID = FORM_PANEL_ID;
  FormPanel.prototype = Object.create(BaseFormPanel.prototype);
  FormPanel.prototype.constructor = FormPanel;
  FormPanel.prototype.htmlWizard = _htmlWizard;
  FormPanel.prototype.submitWizard = _submitWizard;
  FormPanel.prototype.setResourceId = _setResourceId;
  FormPanel.prototype.setDockerTags = _setDockerTags;
  FormPanel.prototype.onShow = _onShow;
  FormPanel.prototype.setup = _setup;

  return FormPanel;

  /*
    FUNCTION DEFINITIONS
   */

  function _htmlWizard() {
    return TemplateWizardHTML({
      "formPanelId": this.formPanelId,
      "datastoresTableHTML": this.datastoresTable.dataTableHTML,
      "vCenterTemplatesTableHTML": this.vCenterTemplatesTable.dataTableHTML
    });
  }

  function _onShow(context) {
    var placeDataStore = "#placeDatatableDatastore";
    Sunstone.disableFormPanelSubmit(TAB_ID);

    if (this.type === "VMTEMPLATE") {
      this.datastoresTable.dataTable.parents(placeDataStore).remove();
    }
    else {
      if(!($(placeDataStore).length)){
        $("#exportMarketPlaceAppFormWizard").append(this.datastoresTable.dataTableHTML);
        this.datastoresTable = getDataStore(FORM_PANEL_ID);
        this.datastoresTable.initialize();
      }

      this.datastoresTable.resetResourceTableSelect();
      this.vCenterTemplatesTable.resetResourceTableSelect();
    }
    $("#NAME", context).focus();
    $(".vCenterTemplateSelection", context).hide();
    return false;
  }

  // Set up the create datastore context
  function _setup(context) {
    Tips.setup(context);
    this.datastoresTable.initialize();
    this.datastoresTable.idInput().attr("required", "");
    this.vCenterTemplatesTable.initialize();
    $("input#NAME", context).on("input", function(){
      var vmname = $("#VMNAME", context).val();
      if (vmname == "" || vmname == $(this).data("prev")){
        $("#VMNAME", context).val($(this).val());
      }
      $(this).data("prev", $(this).val());
    });

    var that = this;
    var section = $("#" + that.datastoresTable.dataTableId + "Container");
    $("#" + that.datastoresTable.dataTableId + " tbody", section).delegate("tr", "click", function() {
      var aData = that.datastoresTable.dataTable.fnGetData(this);

      if (aData[9] == "vcenter"){
        $(".vCenterTemplateSelection", context).show();
      }
      else{
        $(".vCenterTemplateSelection", context).hide();
      }
      return true;
    });
  }

  function _setResourceId(context, appJson, type) {
    this.type = type;
    var appTemplate64 = (appJson.MARKETPLACEAPP.TEMPLATE && appJson.MARKETPLACEAPP.TEMPLATE.APPTEMPLATE64)
      ? appJson.MARKETPLACEAPP.TEMPLATE.APPTEMPLATE64 : ""

    this.datastoresTable.selectOptions.filter_fn = function(ds) {
      return String(atob(appTemplate64)).includes("TYPE=\"KERNEL\"")
        ? ds.TYPE == DataStore.TYPES.FILE_DS
        : ds.TYPE == DataStore.TYPES.IMAGE_DS;
    }
    this.datastoresTable.updateFn();

    this.vCenterTemplatesTable.selectOptions.filter_fn = function(template) {   
      return template.TEMPLATE.HYPERVISOR === "vcenter";
    }
    this.vCenterTemplatesTable.updateFn()

    $("input#NAME", context).val(appJson.MARKETPLACEAPP.NAME).trigger("input");

    if (appJson.MARKETPLACEAPP.TEMPLATE.VMTEMPLATE64 != undefined){
      $(".vmname", context).show();
    }
  }

  function _setDockerTags(resourceId, appJson) {
    this.resourceId = resourceId;

    if (appJson.MARKETPLACEAPP &&
      appJson.MARKETPLACEAPP.MARKETPLACE != undefined &&
      String(appJson.MARKETPLACEAPP.MARKETPLACE).toLowerCase() === "dockerhub"
    ) {
        this.dockertagsTable = _getDockerTagsTable(FORM_PANEL_ID, resourceId);
        $("#placeDatatableDockerTags").show().append(this.dockertagsTable.dataTableHTML);
        this.dockertagsTable.initialize();
        this.dockertagsTable.resetResourceTableSelect();
    }
    else {
      $("#placeDatatableDockerTags").hide()
      Sunstone.enableFormPanelSubmit(TAB_ID);
    }
  }

  function _submitWizard(context) {
    var marketPlaceAppObj = {
      "name" : $("#NAME", context).val(),
      "vmtemplate_name" : $("#VMNAME", context).val(),
      "dsid" : this.datastoresTable.idInput().val(),
      "notemplate" : $("#NOTEMPLATE", context).is(':checked'),
      "vcenter_template" : this.vCenterTemplatesTable.idInput().val()
    };

    if (this.dockertagsTable) {
      $.extend(marketPlaceAppObj, { "tag": this.dockertagsTable.idInput().val() });
    }

    Sunstone.runAction("MarketPlaceApp.export", [this.resourceId], marketPlaceAppObj);
    return false;
  }
});
