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

  var Locale = require("utils/locale");
  var CapacityCreate = require("./general/capacity-create");
  var WizardFields = require("utils/wizard-fields");
  var Config = require("sunstone-config");
  var UserInputs = require("utils/user-inputs");
  var UniqueId = require("utils/unique-id");
  var OpenNebula = require("opennebula");
  var UsersTable = require("tabs/users-tab/datatable");
  var GroupTable = require("tabs/groups-tab/datatable");
  var CoresPerSocket = require("tabs/templates-tab/form-panels/create/wizard-tabs/utils/cores-per-socket");
  var OpenNebulaMarketplace = require("opennebula/marketplace");
  var Notifier = require("utils/notifier");

  /*
    TEMPLATES
   */

  var TemplateHTML = require("hbs!./general/html");

  /*
    CONSTANTS
   */

  var WIZARD_TAB_ID = require("./general/wizardTabId");
  var VCPU_SELECTOR = "#VCPU";

  /*
    CONSTRUCTOR
   */

  function WizardTab(opts) {
    if (!Config.isTemplateCreationTabEnabled(opts.tabId, "general")) {
      throw "Wizard Tab not enabled";
    }

    this.wizardTabId = WIZARD_TAB_ID + UniqueId.id();
    this.icon = "fa-laptop";
    this.title = Locale.tr("General");

    if (opts.listener != undefined){
      this.listener = opts.listener;
    }

    var opts = {
      "select": true,
      "selectOptions": {
        "multiple_choice": false
      }
    };

    this.usersTable = new UsersTable("UsersTable" + UniqueId.id(), opts);
    this.groupTable = new GroupTable("GroupTable" + UniqueId.id(), opts);
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
      "capacityCreateHTML": CapacityCreate.html(),
      "logos": Config.vmLogos,
      "usersDatatable": this.usersTable.dataTableHTML,
      "groupDatatable": this.groupTable.dataTableHTML,
    });
  }

  function _onShow(context, panelForm) {
    if (panelForm.action == "create") {
      $("#NAME", context)
        .removeAttr("disabled")
        .attr("required", "")
        .prop("wizard_field_disabled", false);
    } else if (panelForm.action == "update") {
      $("#NAME", context)
        .attr("disabled", "disabled")
        .removeAttr("required")
        .prop("wizard_field_disabled", true);
    }

    if (panelForm.resource == "VirtualRouterTemplate"){
      $("input[wizard_field=VROUTER]", context).attr("checked", "checked");
    }

    //context.foundation('slider', 'reflow');
  }
  function convertCostNumber(number){
    if(number >= 1000000){
      number = (number/1000000).toFixed(6);
      return number.toString()+"M";
    }
    else if(number >= 1000){
      number = (number/1000).toFixed(6);
      return number.toString()+"K";
    }
    return number.toFixed(6);
  }

  function _setup(context) {
    var that = this;

    this.usersTable.initialize();
    this.usersTable.refreshResourceTableSelect();
    this.groupTable.initialize();
    this.groupTable.refreshResourceTableSelect();

    $(document).on("click", "[href='#" + this.wizardTabId + "']", function(){
      //context.foundation('slider', 'reflow');
    });

    context.on("change", "#MEMORY_COST", function() {
      CapacityCreate.calculatedRealMemory(context);
    });

    context.on("change", "#MEMORY_UNIT_COST", function() {
      CapacityCreate.calculatedRealMemory(context);
    });

    context.on("change", "#CPU_COST", function() {
      CapacityCreate.calculatedRealCpu(context);
    });

    context.on("change", "#DISK_COST", function() {
      that.disk = parseFloat(document.getElementById("DISK_COST").value);
      if(!isNaN(that.disk)){
        that.templateDISKS = JSON.parse(localStorage.getItem("disksJSON"));
        if (that.templateDISKS){
          OpenNebula.Image.list({
            timeout: true,
            success: function(request, obj_files){
              var totalGB = 0;
              $.each(that.templateDISKS, function(ikey, ivalue){
                if (ivalue.IMAGE || ivalue.IMAGE_ID){
                  $.each(obj_files, function(jkey, jvalue){
                    if ((ivalue.IMAGE && ivalue.IMAGE === jvalue.IMAGE.NAME && ivalue.IMAGE_UNAME === jvalue.IMAGE.UNAME) || (ivalue.IMAGE_ID && ivalue.IMAGE_ID === jvalue.IMAGE.ID)){
                      totalGB += jvalue.IMAGE.SIZE / 1024;
                    }
                  });
                } else {
                  totalGB += ivalue.SIZE / 1024;
                }
              });
              var totalCostDisk = 0;
              if (!isNaN(totalGB)){
                totalCostDisk = totalGB * that.disk;
                document.getElementById("total_value_disk").textContent = convertCostNumber(totalCostDisk * 24 * 30);
                CapacityCreate.totalCost();
              } else {
                document.getElementById("total_value_disk").textContent = totalCostDisk;
              }
              $(".total_disk_cost", context).show();
            }
          });
        }
      } else {
        document.getElementById("total_value_disk").textContent = 0;
      }
    });

    context.on("change", "#LOGO", function() {
      $("#template_create_logo", context).show();
      $("#template_create_logo", context).html("<span  class=\"\">" +
          "<img src=\"" + $(this).val() + "\">" +
        "</span>");
    });

    context.on("change", "input[name='hypervisor']", function() {
      if (this.value == "vcenter"){
        $("#vcenter_template_ref", context).attr("required", "");
        $("#vcenter_instance_id", context).attr("required", "");
        $("#vcenter_ccr_ref", context).attr("required", "");
        $("#MEMORY", context).attr("pattern", "^([048]|\\d*[13579][26]|\\d*[24680][048])$");
        $(".only_kvm").hide();
        $(".only_lxc").hide();
        $(".only_vcenter").show();
      } else {
        $("#vcenter_template_ref", context).removeAttr("required");
        $("#vcenter_instance_id", context).removeAttr("required");
        $("#vcenter_ccr_ref", context).removeAttr("required");
        $("#MEMORY", context).removeAttr("pattern");
        $(".only_kvm").show();
        $(".only_vcenter").hide();
        if (this.value != "lxc")
        {
            $(".only_lxc").hide();
            $(".not_lxc").show();
            $(".raw_type").val("kvm");
        }
      }
      // There is another listener in context.js setup

      // Needs proper LXC view, this is just a workaround
        // All KVM settings are available in LXC plus
        // Privileged, Profile and Security Nesting
      if (this.value == "lxc") {
        $(".only_lxc").show();
        $(".not_lxc").hide();
        $(".raw_type").val("lxc");
      }

      var formContext = "#createVMTemplateFormWizard";
      var NUMA_THREADS_MIN = 1;
      var NUMA_THREADS_MAX = 2;
      var cpu_input = "";
      if (this.value === "firecracker") {
        // [GENERAL]
        cpu_input = "1";
        // [NUMA]
        $("#numa-pin-policy", formContext)
          .prop("disabled", false)
          .val("SHARED")
          .prop("disabled", true);
        $("#numa-sockets", formContext).val("1");
        $("#numa-threads", formContext)
          .prop("disabled", false)
          .prop("max", NUMA_THREADS_MAX)
          .val(NUMA_THREADS_MIN)
          .keyup(function(){
            if (this.value > NUMA_THREADS_MAX)
              this.value = NUMA_THREADS_MAX;
            else if (this.value < NUMA_THREADS_MIN)
              this.value = NUMA_THREADS_MIN;
          });


        $(".disabled_firecracker", formContext).prop("disabled", true);
        $(".not_firecracker", formContext).hide();
        $(".not_vcenter", formContext).show();
        $(".only_vcenter", formContext).hide();
      }
      else if (this.value === "vcenter"){
        // [NUMA]
        $("#numa-pin-policy", formContext)
          .prop("disabled", false)
          .val("NONE")
          .prop("disabled", true);

        $("#numa-sockets", formContext)
          .val("");

        $("#numa-threads", formContext)
          .prop("disabled", false)
          .removeAttr("max")
          .val("1")
          .prop("disabled", true);


        $(".disabled_firecracker", formContext).removeAttr("disabled");
        $(".not_firecracker", formContext).show();
        $(".not_vcenter", formContext).hide();
        $(".only_vcenter", formContext).show();

        CoresPerSocket.calculateSockets(VCPU_SELECTOR);
      } else {
        // [NUMA]
        $("#numa-pin-policy", formContext)
          .prop("disabled", false)
          .val("NONE");

        $("#numa-sockets", formContext).val("");

        $("#numa-threads", formContext)
          .prop("disabled", false)
          .removeAttr("max")
          .val("");

        $(".disabled_firecracker", formContext).removeAttr("disabled");
        $(".not_firecracker", formContext).show();
        $(".not_vcenter", formContext).show();
        $(".only_vcenter", formContext).hide();
        if(this.value === "lxc"){
          $(".not_lxc").hide();
          $(".only_kvm").hide();
          $(".only_vcenter").hide();
          $(".only_firecracker").hide();
        }
      }
      $(".cpu_input > input", formContext).val(cpu_input);
    });

    CapacityCreate.setup($("div.capacityCreate", context));

    if(that.listener != undefined){
      $(context).on("change", "input[wizard_field=VROUTER]", function(){
        that.listener.notify();
      });
    }

    function removeByMode(mode=""){
      if(mode && mode.length){
        var selectHypervisor = $("#template_hypervisor_form", context);
        var id = mode+"Radio";
        var option = selectHypervisor.find("#"+id).remove();
        var label = selectHypervisor.find("label[for=\""+id+"\"]").remove();
      }
    }

    if (config["mode"] === "kvm"){
      $("#kvmRadio", context).click();
      removeByMode("vcenter");
      $(".only_kvm").show();
      $(".only_vcenter").hide();
    } else if (config["mode"] === "vcenter"){
      $("#vcenterRadio", context).click();
      removeByMode("kvm");
      $(".only_kvm").hide();
      $(".only_vcenter").show();
    }

    fillMarketplaces();
  }

  function fillMarketplaces(){
    var fillMP = function(_, marketplaces){
      // EMPTY
      $("#MARKETPLACE_ID").empty();
      $("#MARKETPLACE_ID").append("<option value=\"\">-</option>");

      $.each(marketplaces, function(index, marketplace){
        var id = marketplace.MARKETPLACE.ID;
        var text = id + " - " + marketplace.MARKETPLACE.NAME;
        var type = marketplace.MARKETPLACE.MARKET_MAD;

        if (type == "http" || type == "s3"){
          $("#MARKETPLACE_ID").append("<option value=\"" + id + "\">"+ text + "</option>");
        }

      });
    };

    OpenNebulaMarketplace.list({
      success: fillMP,
      error: Notifier.onError,
      options: {force: true} // Do not use cache
    });

  }

  function _retrieve(context) {
    var templateJSON = WizardFields.retrieve(context);
    if (templateJSON["HYPERVISOR"] == "vcenter") {
      templateJSON["VCENTER_TEMPLATE_REF"] = WizardFields.retrieveInput($("#vcenter_template_ref", context));
      templateJSON["VCENTER_CCR_REF"] = WizardFields.retrieveInput($("#vcenter_ccr_ref", context));
      templateJSON["VCENTER_INSTANCE_ID"] = WizardFields.retrieveInput($("#vcenter_instance_id", context));

      if (Config.isFeatureEnabled("vcenter_vm_folder")) {
        templateJSON["VCENTER_VM_FOLDER"] = WizardFields.retrieveInput($("#vcenter_vm_folder", context));
      }
    }

    if (templateJSON["HYPERVISOR"] == "lxc"){
      templateJSON["LXC_UNPRIVILEGED"] = $("#lxc_security_unprivileged", context).val().toUpperCase();
    }

    var sunstone_template = {};

    if ($("#sunstone_network_select:checked", context).length > 0) {
      sunstone_template["NETWORK_SELECT"] = "NO";
    }

    if (!$.isEmptyObject(sunstone_template)) {
      templateJSON["SUNSTONE"] = sunstone_template;
    }

    var userInputs = {};

    // Retrieve Resource Pool Attribute
    var rpInput = $(".vcenter_rp_input", context);
    if (rpInput.length > 0) {
      var rpModify = WizardFields.retrieveInput($(".modify_rp", rpInput));
      var rpInitial = WizardFields.retrieveInput($(".initial_rp", rpInput));
      var rpParams = WizardFields.retrieveInput($(".available_rps", rpInput));

      if (rpModify === "fixed" && rpInitial !== "") {
        templateJSON["VCENTER_RESOURCE_POOL"] = rpInitial;
      } else if (rpModify === "list" && rpParams !== "") {
        var rpUserInputs = UserInputs.marshall({
            type: "list",
            description: Locale.tr("Which resource pool you want this VM to run in?"),
            initial: rpInitial,
            params: WizardFields.retrieveInput($(".available_rps", rpInput))
          });

        userInputs["VCENTER_RESOURCE_POOL"] = rpUserInputs;
      }
    }

    // Since the USER_INPUTS section is not enabled for vCenter, we can assume that there are no more user inputs defined
    if (!$.isEmptyObject(userInputs)) {
      templateJSON["USER_INPUTS"] = userInputs;
    }

    $.extend(true, templateJSON, CapacityCreate.retrieve($("div.capacityCreate", context)));

    if (templateJSON["MEMORY_COST"] && templateJSON["MEMORY_UNIT_COST"] && templateJSON["MEMORY_UNIT_COST"] == "GB") {
      templateJSON["MEMORY_COST"] = (templateJSON["MEMORY_COST"] / 1024).toString();
    }
    if (templateJSON["DISK_COST"]) {
      templateJSON["DISK_COST"] = (templateJSON["DISK_COST"] / 1024).toString();
    }

    var as_uid = this.usersTable.retrieveResourceTableSelect();
    if (as_uid){
      templateJSON["AS_UID"] = as_uid;
    }

    var as_gid = this.groupTable.retrieveResourceTableSelect();
    if (as_gid){
      templateJSON["AS_GID"] = as_gid;
    }

    templateJSON.HOT_RESIZE = {
      "CPU_HOT_ADD_ENABLED": templateJSON["CPU_HOT_ADD_ENABLED"],
      "MEMORY_HOT_ADD_ENABLED": templateJSON["MEMORY_HOT_ADD_ENABLED"],
    };
    delete templateJSON.CPU_HOT_ADD_ENABLED;
    delete templateJSON.MEMORY_HOT_ADD_ENABLED;

    return templateJSON;
  }

  function _fill(context, templateJSON) {

    if (templateJSON["MEMORY_COST"] && templateJSON["MEMORY_UNIT_COST"] && templateJSON["MEMORY_UNIT_COST"] == "GB") {
      templateJSON["MEMORY_COST"] = templateJSON["MEMORY_COST"] * 1024;
    }
    if (templateJSON["DISK_COST"]) {
      templateJSON["DISK_COST"] = templateJSON["DISK_COST"] * 1024;
    }

    that.templateDISKS = $.extend(true, {}, templateJSON.DISK);
    localStorage.setItem("disksJSON", JSON.stringify(that.templateDISKS));
    var sunstone_template = templateJSON.SUNSTONE;
    if (sunstone_template) {
      if (sunstone_template["NETWORK_SELECT"] &&
          sunstone_template["NETWORK_SELECT"].toUpperCase() == "NO") {
        $("#sunstone_network_select", context).attr("checked", "checked");
      }

      delete sunstone_template["NETWORK_SELECT"];
    }

    if (Config.isFeatureEnabled("vcenter_vm_folder")) {
      if (templateJSON["HYPERVISOR"] == "vcenter" &&
        templateJSON["VCENTER_VM_FOLDER"]) {
        WizardFields.fillInput($("#vcenter_vm_folder", context), templateJSON["VCENTER_VM_FOLDER"]);
      }
    } else {
      $(".vcenter_vm_folder_input", context).remove();
    }

    delete templateJSON["VCENTER_VM_FOLDER"];

    if (templateJSON["HYPERVISOR"] == "vcenter") {
      var publicClouds = templateJSON["PUBLIC_CLOUD"];

      if (publicClouds != undefined) {
        if (!Array.isArray(publicClouds)){
          publicClouds = [publicClouds];
        }

        $.each(publicClouds, function(){
          if(this["TYPE"] == "vcenter"){
            WizardFields.fillInput($("#vcenter_template_ref", context), this["VCENTER_TEMPLATE_REF"]);
            return false;
          }
        });
      }
    }

    // LXC specific attributes
    if (templateJSON["HYPERVISOR"] == "lxc") {
      $("#lxc_security_unprivileged").val(templateJSON["LXC_UNPRIVILEGED"].toLowerCase());
    }

    if (templateJSON["HYPERVISOR"]) {
      $("input[name='hypervisor'][value='"+templateJSON["HYPERVISOR"]+"']", context).trigger("click");
      delete templateJSON["HYPERVISOR"];
    }

    if (templateJSON["USER_INPUTS"]) {

      if (templateJSON["USER_INPUTS"]["VCENTER_RESOURCE_POOL"]) {
        var rp = UserInputs.unmarshall(templateJSON["USER_INPUTS"]["VCENTER_RESOURCE_POOL"]);
        $(".modify_rp", context).val("list");
        $(".initial_rp", context).val(rp.initial);
        $(".available_rps", context).val(rp.params);

        delete templateJSON["USER_INPUTS"]["VCENTER_RESOURCE_POOL"];
      }
    }

    if (templateJSON["VCENTER_RESOURCE_POOL"]) {
      $(".modify_rp", context).val("fixed");
      WizardFields.fillInput($(".initial_rp", context), templateJSON["VCENTER_RESOURCE_POOL"]);

      delete templateJSON["VCENTER_RESOURCE_POOL"];
    }

    if (templateJSON["VCENTER_TEMPLATE_REF"]){
      WizardFields.fillInput($("#vcenter_template_ref", context), templateJSON["VCENTER_TEMPLATE_REF"]);
      delete templateJSON["VCENTER_TEMPLATE_REF"];
    }

    if (templateJSON["VCENTER_CCR_REF"]){
      WizardFields.fillInput($("#vcenter_ccr_ref", context), templateJSON["VCENTER_CCR_REF"]);
      delete templateJSON["VCENTER_CCR_REF"];
    }

    if (templateJSON["VCENTER_INSTANCE_ID"]){
      WizardFields.fillInput($("#vcenter_instance_id", context), templateJSON["VCENTER_INSTANCE_ID"]);
      delete templateJSON["VCENTER_INSTANCE_ID"];
    }

    CapacityCreate.fill($("div.capacityCreate", context), templateJSON);

    if (templateJSON["AS_UID"]){
      var asuidJSON = templateJSON["AS_UID"];
      var selectedResources = {
        ids : asuidJSON
      };
      this.usersTable.selectResourceTableSelect(selectedResources);
      delete templateJSON["AS_UID"];
    }

    if (templateJSON["AS_GID"]){
      var asgidJSON = templateJSON["AS_GID"];
      var selectedResources = {
        ids : asgidJSON
      };
      this.groupTable.selectResourceTableSelect(selectedResources);
      delete templateJSON["AS_GID"];
    }

    if (templateJSON["HOT_RESIZE"]){
      if (templateJSON.HOT_RESIZE["MEMORY_HOT_ADD_ENABLED"]){
        WizardFields.fillInput($("#MEMORY_HOT_ADD_ENABLED",context), templateJSON.HOT_RESIZE["MEMORY_HOT_ADD_ENABLED"]);
      }
      if (templateJSON.HOT_RESIZE["CPU_HOT_ADD_ENABLED"]){
        WizardFields.fillInput($("#CPU_HOT_ADD_ENABLED",context), templateJSON.HOT_RESIZE["CPU_HOT_ADD_ENABLED"]);
      }
      delete templateJSON["HOT_RESIZE"];
    }

    WizardFields.fill(context, templateJSON);
  }

});
