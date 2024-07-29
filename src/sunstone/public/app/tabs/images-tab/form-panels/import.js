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

//  require('foundation.tab');
  var BaseFormPanel = require('utils/form-panels/form-panel');
  var Sunstone = require('sunstone');
  var Locale = require('utils/locale');
  var VCenterImages = require('utils/vcenter/images');
  var ResourceSelect = require('utils/resource-select');
  var HostsTable = require('tabs/hosts-tab/datatable');
  var UniqueId = require('utils/unique-id');
  var Notifier = require('utils/notifier');

  /*
    TEMPLATES
   */

  var TemplateHTML = require('hbs!./import/html');

  /*
    CONSTANTS
   */

  var FORM_PANEL_ID = require('./import/formPanelId');
  var TAB_ID = require('../tabId');

  /*
    CONSTRUCTOR
   */

  function FormPanel() {
    this.formPanelId = FORM_PANEL_ID;
    this.tabId = TAB_ID;
    this.actions = {
      'import': {
        'title': Locale.tr("Import vCenter Images"),
        'buttonText': Locale.tr("Import"),
        'resetButton': true
      }
    };

    this.vCenterImages = new VCenterImages();

    var options = {
      'select': true,
      'selectOptions': {
        'multiple_choice': false,
        "filter_fn": function(host) { return host.VM_MAD === "vcenter" && host.IM_MAD === "vcenter"; }
      }
    };
    this.hostsTable = new HostsTable('HostsTable' + UniqueId.id(), options);

    BaseFormPanel.call(this);
  }

  FormPanel.FORM_PANEL_ID = FORM_PANEL_ID;
  FormPanel.prototype = Object.create(BaseFormPanel.prototype);
  FormPanel.prototype.constructor = FormPanel;
  FormPanel.prototype.htmlWizard = _htmlWizard;
  FormPanel.prototype.submitWizard = _submitWizard;
  FormPanel.prototype.onShow = _onShow;
  FormPanel.prototype.setup = _setup;

  return FormPanel;

  /*
    FUNCTION DEFINITIONS
   */

  function _htmlWizard() {
    return TemplateHTML({
      'formPanelId': this.formPanelId,
      'vCenterHostsHTML': this.hostsTable.dataTableHTML,
      'vCenterImagesHTML': this.vCenterImages.html()
    });
  }

  function _setup(context) {
    var that = this;
    this.hostsTable.initialize();
    this.hostsTable.refreshResourceTableSelect();

    $(context).off("click", "#get-vcenter-images");
    $(context).on("click", "#get-vcenter-images", function(){
      var selectedHost = that.hostsTable.retrieveResourceTableSelect();
      if (selectedHost !== ""){
        var selectedDs = $("#vcenter_datastore option:selected").attr("elem_id");
        if (selectedDs !== undefined){
          that.vCenterImages.insert({
            container: context,
            selectedHost: selectedHost,
            selectedDs: selectedDs
          });
          $("#import_vcenter_images", this.parentElement).prop("disabled", false);
        } else {
          Notifier.notifyMessage("You need select a vCenter datastore first");
        }
      }
      else {
        Notifier.notifyMessage("You need select a vCenter host first");
      }
    });

    $(context).off("click", "#import_vcenter_images");
    $(context).on("click", "#import_vcenter_images", function(){
      that.vCenterImages.import(context);
      return false;
    });

    return false;
  }

  function _submitWizard(context) {
    var that = this;

    Sunstone.hideFormPanelLoading(TAB_ID);

    this.vCenterImages.import(context.closest("#import_images_form_wrapper"));

    return false;
  }

  function _onShow(context) {
    var that = this;

    $("#images-tab .submit_button").hide();
    var vcenter_datastore = $("div#vcenter_datastore_wrapper .resource_list_select", context).val();
    if (!vcenter_datastore) vcenter_datastore = undefined;

    ResourceSelect.insert({
        context: $('#vcenter_datastore_wrapper', context),
        resourceName: 'Datastore',
        initValue: vcenter_datastore,
        emptyValue: true,
        nameValues: true,
        filterKey: 'DS_MAD',
        filterValue: 'vcenter',
        selectId: 'vcenter_datastore',
        required: true
      });
  }
});
