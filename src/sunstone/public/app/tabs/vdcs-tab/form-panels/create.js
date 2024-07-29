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

  // require('foundation.tab');
  var BaseFormPanel = require('utils/form-panels/form-panel');
  var Sunstone = require('sunstone');
  var Locale = require('utils/locale');
  var Tips = require('utils/tips');
  var CustomTagsTable = require('utils/custom-tags-table');
  var WizardFields = require('utils/wizard-fields');
  var GroupsTable = require('tabs/groups-tab/datatable');
  var OpenNebulaZone = require('opennebula/zone');
  var Utils = require('../utils/common');
  var Notifier = require('utils/notifier');
  var ResourcesTab = require('../utils/resources-tab');
  var TemplateUtils = require('utils/template-utils');

  /*
    TEMPLATES
   */

  var TemplateWizardHTML = require('hbs!./create/wizard');
  var TemplateAdvancedHTML = require('hbs!./create/advanced');

  /*
    CONSTANTS
   */

  var FORM_PANEL_ID = require('./create/formPanelId');
  var TAB_ID = require('../tabId');

  /*
    CONSTRUCTOR
   */

  function FormPanel() {
    this.formPanelId = FORM_PANEL_ID;
    this.tabId = TAB_ID;
    this.actions = {
      'create': {
        'title': Locale.tr("Create Virtual Data Center"),
        'buttonText': Locale.tr("Create"),
        'resetButton': true
      },
      'update': {
        'title': Locale.tr("Update Virtual Data Center"),
        'buttonText': Locale.tr("Update"),
        'resetButton': false
      }
    };

    BaseFormPanel.call(this);
  }

  FormPanel.FORM_PANEL_ID = FORM_PANEL_ID;
  FormPanel.prototype = Object.create(BaseFormPanel.prototype);
  FormPanel.prototype.constructor = FormPanel;
  FormPanel.prototype.htmlWizard = _htmlWizard;
  FormPanel.prototype.htmlAdvanced = _htmlAdvanced;
  FormPanel.prototype.submitWizard = _submitWizard;
  FormPanel.prototype.submitAdvanced = _submitAdvanced;
  FormPanel.prototype.onShow = _onShow;
  FormPanel.prototype.fill = _fill;
  FormPanel.prototype.setup = _setup;

  return FormPanel;

  /*
    FUNCTION DEFINITIONS
   */

  function _htmlWizard() {
    var opts = {
      info: false,
      select: true,
      selectOptions: {"multiple_choice": true}
    };

    this.groupsTable = new GroupsTable("vdc_wizard_groups", opts);

    if (this.action == "create") {
      this.resourcesTab = new ResourcesTab("vdc_create_wizard");
    } else {
      this.resourcesTab = new ResourcesTab("vdc_update_wizard");
    }

    return TemplateWizardHTML({
      'formPanelId': this.formPanelId,
      'customTagsHTML': CustomTagsTable.html(),
      'groupsTableHTML': this.groupsTable.dataTableHTML,
      'resourcesTabHTML': this.resourcesTab.html()
    });
  }

  function _htmlAdvanced() {
    return TemplateAdvancedHTML({formPanelId: this.formPanelId});
  }

  function _setup(context) {
    var that = this;

    CustomTagsTable.setup($("#vdcCreateGeneralTab", context));
    this.groupsTable.initialize();

    // If this is an update, the _fill method may be called before the zone.list
    // finishes. And resourcesTab.fill only works if all the
    // resourcesTab.addResourcesZone have finished.
    // It's better to duplicate this code in _fill and make sure the
    // resourcesTab.fill is executed in the callback
    if (this.action != "update") {
      OpenNebulaZone.list({
        timeout: true,
        success: function (request, obj_list){
          var zoneSection = $("#vdcCreateResourcesTab",context);

          $.each(
            obj_list,
            function(){
              that.resourcesTab.addResourcesZone(
                this.ZONE.ID,
                this.ZONE.NAME,
                zoneSection
              );
            }
          );

          that.resourcesTab.setup(zoneSection);
        },
        error: Notifier.onError
      });
    }

    Foundation.reflow(context, 'tabs');
    Tips.setup();
  }

  function _submitWizard(context) {
    var that = this;

    //Fetch values
    var vdc_json = {};

    $.extend(vdc_json, WizardFields.retrieve($("#vdcCreateGeneralTab", context)));

    $.extend(vdc_json, CustomTagsTable.retrieve($("#vdcCreateGeneralTab", context)));

    var group_ids = this.groupsTable.retrieveResourceTableSelect();
    if (this.action == "create") {
      var resources = this.resourcesTab.retrieve(context);

      vdc_json = {
        "vdc" : vdc_json,
        "group_ids" : group_ids,
        "clusters" : resources.clusters,
        "hosts" : resources.hosts,
        "vnets" : resources.vnets,
        "datastores" : resources.datastores
      };

      Sunstone.runAction("Vdc.create",vdc_json);
      return false;
    } else if (this.action == "update") {
      // Add/delete groups

      var selected_groups_list = this.groupsTable.retrieveResourceTableSelect();

      $.each(selected_groups_list, function(i,group_id){
        if (that.original_groups_list.indexOf(group_id) == -1){
          Sunstone.runAction("Vdc.add_group",
            that.resourceId, {group_id : group_id});
        }
      });

      $.each(that.original_groups_list, function(i,group_id){
        if (selected_groups_list.indexOf(group_id) == -1){
          Sunstone.runAction("Vdc.del_group",
            that.resourceId, {group_id : group_id});
        }
      });

      // Add/delete resources

      var selectedResources = that.resourcesTab.retrieveIndexed(context);

      for (var zoneId in selectedResources){
        var originalSelectedZone = that.originalSelectedResources[zoneId];

        $.each(selectedResources[zoneId].clusters, function(i,id){
          if (originalSelectedZone.clusters.indexOf(id) == -1){
            Sunstone.runAction(
              "Vdc.add_cluster",
              that.resourceId,
              {zone_id: zoneId, cluster_id: id});
          }
        });

        $.each(selectedResources[zoneId].hosts, function(i,id){
          if (originalSelectedZone.hosts.indexOf(id) == -1){
            Sunstone.runAction(
              "Vdc.add_host",
              that.resourceId,
              {zone_id: zoneId, host_id: id});
          }
        });

        $.each(selectedResources[zoneId].vnets, function(i,id){
          if (originalSelectedZone.vnets.indexOf(id) == -1){
            Sunstone.runAction(
              "Vdc.add_vnet",
              that.resourceId,
              {zone_id: zoneId, vnet_id: id});
          }
        });

        $.each(selectedResources[zoneId].datastores, function(i,id){
          if (originalSelectedZone.datastores.indexOf(id) == -1){
            Sunstone.runAction(
              "Vdc.add_datastore",
              that.resourceId,
              {zone_id: zoneId, ds_id: id});
          }
        });
      }

      for (var zoneId in that.originalSelectedResources){
        var selectedZone = selectedResources[zoneId];

        $.each(that.originalSelectedResources[zoneId].clusters, function(i,id){
          if (selectedZone.clusters.indexOf(id) == -1){
            Sunstone.runAction(
              "Vdc.del_cluster",
              that.resourceId,
              {zone_id: zoneId, cluster_id: id});
          }
        });

        $.each(that.originalSelectedResources[zoneId].hosts, function(i,id){
          if (selectedZone.hosts.indexOf(id) == -1){
            Sunstone.runAction(
              "Vdc.del_host",
              that.resourceId,
              {zone_id: zoneId, host_id: id});
          }
        });

        $.each(that.originalSelectedResources[zoneId].vnets, function(i,id){
          if (selectedZone.vnets.indexOf(id) == -1){
            Sunstone.runAction(
              "Vdc.del_vnet",
              that.resourceId,
              {zone_id: zoneId, vnet_id: id});
          }
        });

        $.each(that.originalSelectedResources[zoneId].datastores, function(i,id){
          if (selectedZone.datastores.indexOf(id) == -1){
            Sunstone.runAction(
              "Vdc.del_datastore",
              that.resourceId,
              {zone_id: zoneId, ds_id: id});
          }
        });
      }

      // TODO: this method ends now, but the add/del actions may still
      // be pending. A vdc.show now will get outdated information

      Sunstone.runAction("Vdc.update", that.resourceId, TemplateUtils.templateToString(vdc_json));
      return false;
    }

  }

  function _submitAdvanced(context) {
    if (this.action == "create") {
      var template = $('textarea#template',context).val();
      var vdc_json = {vdc: {vdc_raw: template}};
      Sunstone.runAction("Vdc.create",vdc_json);
      return false;
    } else if (this.action == "update") {
      var template_raw = $('textarea#template', context).val();
      Sunstone.runAction("Vdc.update", this.resourceId, template_raw);
      return false;
    }
  }

  function _onShow(context) {
    // TODO bug, does not work until the input is visible
    //$("input#name", context).focus();

    this.groupsTable.refreshResourceTableSelect();
    this.resourcesTab.onShow(context);
  }

  function _fill(context, element) {
    var that = this;

    this.setHeader(element);
    this.resourceId = element.ID;

    // Populates the Avanced mode Tab
    $('#template', context).val(TemplateUtils.templateToString(element.TEMPLATE));

    WizardFields.fillInput($('[wizard_field="NAME"]',context), element.NAME);
    $('[wizard_field="NAME"]',context).prop("disabled", true).prop('wizard_field_disabled', true);

    WizardFields.fill($("#vdcCreateGeneralTab", context), element.TEMPLATE);

    // Delete so these attributes don't end in the custom tags table also
    var fields = $('[wizard_field]', context);

    fields.each(function(){
      var field = $(this);
      var field_name = field.attr('wizard_field');

      delete element.TEMPLATE[field_name];
    });

    CustomTagsTable.fill($("#vdcCreateGeneralTab", context), element.TEMPLATE);

    // Fill groups table

    var group_ids = element.GROUPS.ID;

    if (typeof group_ids == 'string') {
      group_ids = [group_ids];
    }

    this.original_groups_list = [];

    if (group_ids) {
      this.original_groups_list = group_ids;
      this.groupsTable.selectResourceTableSelect({ ids : group_ids });
    }

    // Fill resource tables

    this.originalSelectedResources = Utils.indexedVdcResources(element);

    OpenNebulaZone.list({
      timeout: true,
      success: function (request, obj_list){
        var zoneSection = $("#vdcCreateResourcesTab",context);

        $.each(obj_list,function(){
          that.resourcesTab.addResourcesZone(
            this.ZONE.ID,
            this.ZONE.NAME,
            zoneSection);
          }
        );

        that.resourcesTab.setup(zoneSection);
        that.resourcesTab.fill(zoneSection, that.originalSelectedResources);
      },
      error: Notifier.onError
    });
  }
});
