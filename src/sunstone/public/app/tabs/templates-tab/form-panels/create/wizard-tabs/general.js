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

  var Locale = require('utils/locale');
  var Tips = require('utils/tips');
  var CapacityCreate = require('./general/capacity-create');
  var WizardFields = require('utils/wizard-fields');
  var Config = require('sunstone-config');
  var UserInputs = require('utils/user-inputs');
  var UniqueId = require('utils/unique-id');

  /*
    TEMPLATES
   */

  var TemplateHTML = require('hbs!./general/html');

  /*
    CONSTANTS
   */

  var WIZARD_TAB_ID = require('./general/wizardTabId');

  /*
    CONSTRUCTOR
   */

  function WizardTab(opts) {
    if (!Config.isTemplateCreationTabEnabled(opts.tabId, 'general')) {
      throw "Wizard Tab not enabled";
    }

    this.wizardTabId = WIZARD_TAB_ID + UniqueId.id();
    this.icon = 'fa-laptop';
    this.title = Locale.tr("General");

    if(opts.listener != undefined){
      this.listener = opts.listener;
    }
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
    return TemplateHTML({
      'capacityCreateHTML': CapacityCreate.html(),
      'logos': Config.vmLogos
    });
  }

  function _onShow(context, panelForm) {
    if (panelForm.action == 'create') {
      $('#NAME', context)
        .removeAttr('disabled')
        .attr("required", "")
        .prop('wizard_field_disabled', false);
    } else if (panelForm.action == 'update') {
      $('#NAME', context)
        .attr("disabled", "disabled")
        .removeAttr("required")
        .prop('wizard_field_disabled', true);
    }

    if (panelForm.resource == "VirtualRouterTemplate"){
      $("input[wizard_field=VROUTER]", context).attr("checked", "checked");
    }

    //context.foundation('slider', 'reflow');
  }
  function convertCostNumber(number){
    if(number >= 1000000){
      number = (number/1000000).toFixed(2)
      return number.toString()+"M";
    }
    else if(number >= 1000){
      number = (number/1000).toFixed(2)
      return number.toString()+"K";
    }
    return number;
  }
  function caculatedTotalMemory(context){
    var memory = document.getElementById('MEMORY_COST').value;
    var type = document.getElementById('MEMORY_UNIT_COST').value;
    if(type == "GB")
      memory *= 1024;
    memory = memory * 24 * 30; //24 hours and 30 days
    document.getElementById('total_value_memory').textContent = convertCostNumber(memory);
    $(".total_memory_cost", context).show(); 
  }

  function _setup(context) {
    var that = this;

    $(document).on('click', "[href='#" + this.wizardTabId + "']", function(){
      //context.foundation('slider', 'reflow');
    });

    context.on("change", "#MEMORY_COST", function() {
      caculatedTotalMemory(context);
      CapacityCreate.calculatedRealMemory(context);
    });

    context.on("change", "#MEMORY_UNIT_COST", function() {
      caculatedTotalMemory(context);
      CapacityCreate.calculatedRealMemory();
    });

     context.on("change", "#CPU_COST", function() {
      var cpu = document.getElementById('CPU_COST').value;
      document.getElementById('total_value_cpu').textContent = convertCostNumber(cpu * 24 * 30);
      $(".total_cpu_cost", context).show(); 
      CapacityCreate.calculatedRealCpu();
    });

    context.on("change", "#DISK_COST", function() {
      var disk = document.getElementById('DISK_COST').value;
      document.getElementById('total_value_disk').textContent = convertCostNumber(disk * 1024 * 24 * 30);
      $(".total_disk_cost", context).show(); 
    });

    context.on("change", "#LOGO", function() {
      $("#template_create_logo", context).show();
      $("#template_create_logo", context).html('<span  class="">' +
          '<img src="' + $(this).val() + '">' +
        '</span>');
    });

    context.on("change", "input[name='hypervisor']", function() {
      // TODO define context (for example: this.closest('form'))
      $(".hypervisor").hide();
      $(".only_" + this.value).show();

      if (this.value == "vcenter"){
        $("#vcenter_template_uuid", context).attr("required", "");
      } else {
        $("#vcenter_template_uuid", context).removeAttr("required");
      }
      // There is another listener in context.js setup
    });

    CapacityCreate.setup($("div.capacityCreate", context));

    if(that.listener != undefined){
      $(context).on("change", "input[wizard_field=VROUTER]", function(){
        that.listener.notify();
      });
    }
  }

  function _retrieve(context) {
    var templateJSON = WizardFields.retrieve(context);
    templateJSON["DISK_COST"] = templateJSON["DISK_COST"] * 1024;
    if(templateJSON["MEMORY_UNIT_COST"] == "GB")
      templateJSON["MEMORY_COST"] = templateJSON["MEMORY_COST"] * 1024;
    if (templateJSON["HYPERVISOR"] == 'vcenter') {
      templateJSON["VCENTER_PUBLIC_CLOUD"] = {
        'TYPE': 'vcenter',
        'VM_TEMPLATE': WizardFields.retrieveInput($("#vcenter_template_uuid", context))
      };

      templateJSON["KEEP_DISKS_ON_DONE"] = $("#KEEP_DISKS", context).is(':checked')?"YES":"NO"
    }

    var sunstone_template = {};

    if ($('#sunstone_network_select:checked', context).length > 0) {
      sunstone_template["NETWORK_SELECT"] = "NO"
    }

    if (!$.isEmptyObject(sunstone_template)) {
      templateJSON['SUNSTONE'] = sunstone_template;
    }

    var userInputs = {};
    
    // Retrieve Datastore Attribute
    var dsInput = $(".vcenter_datastore_input", context);
    if (dsInput.length > 0) {
      var dsModify = WizardFields.retrieveInput($('.modify_datastore', dsInput));
      var dsInitial = WizardFields.retrieveInput($('.initial_datastore', dsInput));
      var dsParams = WizardFields.retrieveInput($('.available_datastores', dsInput));

      if (dsModify === 'fixed' && dsInitial !== '') {
        templateJSON['VCENTER_DATASTORE'] = dsInitial;
      } else if (dsModify === 'list' && dsParams !== '') {
        var dsUserInputsStr = UserInputs.marshall({
            type: 'list',
            description: Locale.tr("Which datastore you want this VM to run on?"),
            initial: dsInitial,
            params: dsParams
          });

        userInputs['VCENTER_DATASTORE'] = dsUserInputsStr;
      }
    }

    // Retrieve Resource Pool Attribute
    var rpInput = $(".vcenter_rp_input", context);
    if (rpInput.length > 0) {
      var rpModify = WizardFields.retrieveInput($('.modify_rp', rpInput));
      var rpInitial = WizardFields.retrieveInput($('.initial_rp', rpInput));
      var rpParams = WizardFields.retrieveInput($('.available_rps', rpInput));

      if (rpModify === 'fixed' && rpInitial !== '') {
        templateJSON['RESOURCE_POOL'] = rpInitial;
      } else if (rpModify === 'list' && rpParams !== '') {
        var rpUserInputs = UserInputs.marshall({
            type: 'list',
            description: Locale.tr("Which resource pool you want this VM to run in?"),
            initial: rpInitial,
            params: WizardFields.retrieveInput($('.available_rps', rpInput))
          });

        userInputs['RESOURCE_POOL'] = rpUserInputs;
      }
    }

    // Since the USER_INPUTS section is not enabled for vCenter, we can assume that there are no more user inputs defined
    if (!$.isEmptyObject(userInputs)) {
      templateJSON['USER_INPUTS'] = userInputs;
    }

    $.extend(true, templateJSON, CapacityCreate.retrieve($("div.capacityCreate", context)));

    return templateJSON;
  }

  function _fill(context, templateJSON) {
    var sunstone_template = templateJSON.SUNSTONE;
    if(templateJSON["MEMORY_UNIT_COST"] =="GB")
      templateJSON["MEMORY_COST"] = templateJSON["MEMORY_COST"] / 1024;
    if (sunstone_template) {
      if (sunstone_template["NETWORK_SELECT"] &&
          sunstone_template["NETWORK_SELECT"].toUpperCase() == "NO") {
        $("#sunstone_network_select", context).attr("checked", "checked");
      }

      delete sunstone_template["NETWORK_SELECT"];
    }

    if (templateJSON["HYPERVISOR"] == 'vcenter' &&
      templateJSON["KEEP_DISKS_ON_DONE"] &&
        templateJSON["KEEP_DISKS_ON_DONE"].toLowerCase() == "yes" ) {
      $("#KEEP_DISKS", context).attr("checked", "checked");
    }

    delete templateJSON["KEEP_DISKS_ON_DONE"];

    if (templateJSON["HYPERVISOR"] == 'vcenter') {
      var publicClouds = templateJSON["PUBLIC_CLOUD"];

      if (publicClouds != undefined) {
        if (!$.isArray(publicClouds)){
          publicClouds = [publicClouds];
        }

        $.each(publicClouds, function(){
          if(this["TYPE"] == "vcenter"){
            WizardFields.fillInput($("#vcenter_template_uuid", context), this["VM_TEMPLATE"]);
            return false;
          }
        });
      }
    }

    if (templateJSON["HYPERVISOR"]) {
      $("input[name='hypervisor'][value='"+templateJSON["HYPERVISOR"]+"']", context).trigger("click")
      delete templateJSON["HYPERVISOR"];
    }

    if (templateJSON["USER_INPUTS"]) {
      if (templateJSON["USER_INPUTS"]["VCENTER_DATASTORE"]) {
        var ds = UserInputs.unmarshall(templateJSON["USER_INPUTS"]["VCENTER_DATASTORE"]);
        $('.modify_datastore', context).val('list');
        $('.initial_datastore', context).val(ds.initial);
        $('.available_datastores', context).val(ds.params);

        delete templateJSON["USER_INPUTS"]["VCENTER_DATASTORE"];
      }

      if (templateJSON["USER_INPUTS"]["RESOURCE_POOL"]) {
        var rp = UserInputs.unmarshall(templateJSON["USER_INPUTS"]["RESOURCE_POOL"]);
        $('.modify_rp', context).val('list');
        $('.initial_rp', context).val(rp.initial);
        $('.available_rps', context).val(rp.params);

        delete templateJSON["USER_INPUTS"]["RESOURCE_POOL"];
      }
    }

    if (templateJSON["VCENTER_DATASTORE"]) {
      $('.modify_datastore', context).val('fixed');
      WizardFields.fillInput($('.initial_datastore', context), templateJSON["VCENTER_DATASTORE"]);

      delete templateJSON["VCENTER_DATASTORE"];
    }

    if (templateJSON["RESOURCE_POOL"]) {
      $('.modify_rp', context).val('fixed');
      WizardFields.fillInput($('.initial_rp', context), templateJSON["RESOURCE_POOL"]);

      delete templateJSON["RESOURCE_POOL"];
    }

    CapacityCreate.fill($("div.capacityCreate", context), templateJSON);

    WizardFields.fill(context, templateJSON);
  }
});
