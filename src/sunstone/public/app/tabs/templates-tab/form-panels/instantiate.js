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

  var BaseFormPanel = require('utils/form-panels/form-panel');
  var TemplateHTML = require('hbs!./instantiate/html');
  var TemplateRowHTML = require('hbs!./instantiate/templateRow');
  var Sunstone = require('sunstone');
  var Notifier = require('utils/notifier');
  var OpenNebulaTemplate = require('opennebula/template');
  var Locale = require('utils/locale');
  var Tips = require('utils/tips');
  var UserInputs = require('utils/user-inputs');
  var WizardFields = require('utils/wizard-fields');
  var DisksResize = require('utils/disks-resize');
  var NicsSection = require('utils/nics-section');
  var VMGroupSection = require('utils/vmgroup-section');
  var DeployFolder = require('utils/deploy-folder');
  var CapacityInputs = require('tabs/templates-tab/form-panels/create/wizard-tabs/general/capacity-inputs');
  var Config = require('sunstone-config');

  /*
    CONSTANTS
   */

  var FORM_PANEL_ID = require('./instantiate/formPanelId');
  var TAB_ID = require('../tabId');

  /*
    CONSTRUCTOR
   */

  function FormPanel() {
    this.formPanelId = FORM_PANEL_ID;
    this.tabId = TAB_ID;
    this.actions = {
      'instantiate': {
        'title': Locale.tr("Instantiate VM Template"),
        'buttonText': Locale.tr("Instantiate"),
        'resetButton': false
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
  FormPanel.prototype.calculateCost = _calculateCost;

  return FormPanel;

  /*
    FUNCTION DEFINITIONS
   */

  function _html() {
    return TemplateHTML({
      'formPanelId': this.formPanelId
    });
  }

  function _setup(context) {
    var that = this;

    $("input.instantiate_pers", context).on("change", function(){
      var persistent = $(this).prop('checked');

      if(persistent){
        $("#vm_n_times_disabled", context).show();
        $("#vm_n_times", context).hide();
      } else {
        $("#vm_n_times_disabled", context).hide();
        $("#vm_n_times", context).show();
      }

      $.each(that.template_objects, function(index, template_json) {
        DisksResize.insert({
          template_json:    template_json,
          disksContext:     $(".disksContext"  + template_json.VMTEMPLATE.ID, context),
          force_persistent: persistent,
          cost_callback: that.calculateCost.bind(that)
        });
      });
    });
  }

  function _calculateCost(){
    $.each($(".template-row", this.formContext), function(){
      var capacity_val = parseFloat( $(".capacity_cost_div .cost_value", $(this)).text() );
      var disk_val = parseFloat( $(".provision_create_template_disk_cost_div .cost_value", $(this)).text() );

      var total = capacity_val + disk_val;

      if (total != 0 && Config.isFeatureEnabled("showback")) {
        $(".total_cost_div", $(this)).show();

        $(".total_cost_div .cost_value", $(this)).text( (capacity_val + disk_val).toFixed(2) );
      }
    });
  }

  function _submitWizard(context) {
    var that = this;

    if (!this.selected_nodes || this.selected_nodes.length == 0) {
      Notifier.notifyError(Locale.tr("No template selected"));
      Sunstone.hideFormPanelLoading();
      return false;
    }

    var vm_name = $('#vm_name', context).val();
    var n_times = $('#vm_n_times', context).val();
    var n_times_int = 1;

    if (n_times.length) {
      n_times_int = parseInt(n_times, 10);
    }

    var hold = $('#hold', context).prop("checked");

    var action;

    if ($("input.instantiate_pers", context).prop("checked")){
      action = "instantiate_persistent";
      n_times_int = 1;
    }else{
      action = "instantiate";
    }

    $.each(this.selected_nodes, function(index, template_id) {
      var extra_info = {
        'hold': hold
      };

      var tmp_json = WizardFields.retrieve($(".template_user_inputs" + template_id, context));
      var disks = DisksResize.retrieve($(".disksContext"  + template_id, context));
      if (disks.length > 0) {
        tmp_json.DISK = disks;
      }

      var networks = NicsSection.retrieve($(".nicsContext"  + template_id, context));

      var vmgroup = VMGroupSection.retrieve($(".vmgroupContext"+ template_id));

      if(vmgroup){
        $.extend(tmp_json, vmgroup);
      }

      var nics = [];
      var pcis = [];

      $.each(networks, function(){
        if (this.TYPE == "NIC"){
          pcis.push(this);
        }else{
          nics.push(this);
        }
      });

      if (nics.length > 0) {
        tmp_json.NIC = nics;
      }

      // Replace PCIs of type nic only
      var original_tmpl = that.template_objects[index].VMTEMPLATE;

      var regular_pcis = [];

      if(original_tmpl.TEMPLATE.PCI != undefined){
        var original_pcis;

        if ($.isArray(original_tmpl.TEMPLATE.PCI)){
          original_pcis = original_tmpl.TEMPLATE.PCI;
        } else if (!$.isEmptyObject(original_tmpl.TEMPLATE.PCI)){
          original_pcis = [original_tmpl.TEMPLATE.PCI];
        }

        $.each(original_pcis, function(){
          if(this.TYPE != "NIC"){
            regular_pcis.push(this);
          }
        });
      }

      pcis = pcis.concat(regular_pcis);

      if (pcis.length > 0) {
        tmp_json.PCI = pcis;
      }

      if (Config.isFeatureEnabled("vcenter_deploy_folder")){
        if(!$.isEmptyObject(original_tmpl.TEMPLATE.HYPERVISOR) &&
          original_tmpl.TEMPLATE.HYPERVISOR === 'vcenter'){
          $.extend(tmp_json, DeployFolder.retrieveChanges($(".deployFolderContext"  + template_id)));
        }
      }

      capacityContext = $(".capacityContext"  + template_id, context);
      $.extend(tmp_json, CapacityInputs.retrieveChanges(capacityContext));

      extra_info['template'] = tmp_json;
        for (var i = 0; i < n_times_int; i++) {
          extra_info['vm_name'] = vm_name.replace(/%i/gi, i); // replace wildcard

          Sunstone.runAction("Template."+action, [template_id], extra_info);
        }
    });

    return false;
  }

  function _setTemplateIds(context, selected_nodes) {
    var that = this;

    this.selected_nodes = selected_nodes;
    this.template_objects = [];

    var templatesContext = $(".list_of_templates", context);

    var idsLength = this.selected_nodes.length;
    var idsDone = 0;

    templatesContext.html("");
    $.each(this.selected_nodes, function(index, template_id) {
      OpenNebulaTemplate.show({
        data : {
          id: template_id,
          extended: true
        },
        timeout: true,
        success: function (request, template_json) {
          that.template_objects.push(template_json);

          templatesContext.append(
            TemplateRowHTML(
              { element: template_json.VMTEMPLATE,
                capacityInputsHTML: CapacityInputs.html()
              }) );

          DisksResize.insert({
            template_json: template_json,
            disksContext: $(".disksContext"  + template_json.VMTEMPLATE.ID, context),
            force_persistent: $("input.instantiate_pers", context).prop("checked"),
            cost_callback: that.calculateCost.bind(that)
          });

          NicsSection.insert(template_json,
            $(".nicsContext"  + template_json.VMTEMPLATE.ID, context),
            { 'forceIPv4': true,
              'securityGroups': Config.isFeatureEnabled("secgroups")
            });

          VMGroupSection.insert(template_json,
            $(".vmgroupContext"+ template_json.VMTEMPLATE.ID, context));

          deployFolderContext = $(".deployFolderContext"  + template_json.VMTEMPLATE.ID, context);
          DeployFolder.setup(deployFolderContext);
          DeployFolder.fill(deployFolderContext, template_json.VMTEMPLATE);

          var inputs_div = $(".template_user_inputs" + template_json.VMTEMPLATE.ID, context);

          UserInputs.vmTemplateInsert(
              inputs_div,
              template_json,
              {text_header: '<i class="fa fa-gears"></i> '+Locale.tr("Custom Attributes")});

          inputs_div.data("opennebula_id", template_json.VMTEMPLATE.ID);

          capacityContext = $(".capacityContext"  + template_json.VMTEMPLATE.ID, context);
          CapacityInputs.setup(capacityContext);
          CapacityInputs.fill(capacityContext, template_json.VMTEMPLATE);

          var cpuCost    = template_json.VMTEMPLATE.TEMPLATE.CPU_COST;
          var memoryCost = template_json.VMTEMPLATE.TEMPLATE.MEMORY_COST;

          if (cpuCost == undefined){
            cpuCost = Config.onedConf.DEFAULT_COST.CPU_COST;
          }

          if (memoryCost == undefined){
            memoryCost = Config.onedConf.DEFAULT_COST.MEMORY_COST;
          }

          if ((cpuCost != 0 || memoryCost != 0) && Config.isFeatureEnabled("showback")) {
            $(".capacity_cost_div", capacityContext).show();

            CapacityInputs.setCallback(capacityContext, function(values){
              var cost = 0;

              if (values.CPU != undefined){
                cost += cpuCost * values.CPU;
              }

              if (values.MEMORY != undefined){
                cost += memoryCost * values.MEMORY;
              }

              $(".cost_value", capacityContext).html(cost.toFixed(2));

              _calculateCost(context);
            });
          }

          idsDone += 1;
          if (idsLength == idsDone){
            Sunstone.enableFormPanelSubmit(that.tabId);
          }
        },
        error: function(request, error_json, container) {
          Notifier.onError(request, error_json, container);
          $("#instantiate_vm_user_inputs", context).empty();
        }
      });
    });
  }

  function _onShow(context) {
    Sunstone.disableFormPanelSubmit(this.tabId);

    $("input.instantiate_pers", context).change();

    var templatesContext = $(".list_of_templates", context);
    templatesContext.html("");

    Tips.setup(context);
    return false;
  }
});
