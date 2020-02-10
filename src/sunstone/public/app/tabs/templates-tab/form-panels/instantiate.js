/* -------------------------------------------------------------------------- */
/* Copyright 2002-2019, OpenNebula Project, OpenNebula Systems                */
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
  var OpenNebulaTemplate = require("opennebula/template");
  var Locale = require("utils/locale");
  var Tips = require("utils/tips");
  var UserInputs = require("utils/user-inputs");
  var WizardFields = require("utils/wizard-fields");
  var TemplateUtils = require("utils/template-utils");
  var DisksResize = require("utils/disks-resize");
  var NicsSection = require("utils/nics-section");
  var VMGroupSection = require("utils/vmgroup-section");
  var VcenterVMFolder = require("utils/vcenter-vm-folder");
  var CapacityInputs = require("tabs/templates-tab/form-panels/create/wizard-tabs/general/capacity-inputs");
  var Config = require("sunstone-config");
  var HostsTable = require("tabs/hosts-tab/datatable");
  var DatastoresTable = require("tabs/datastores-tab/datatable");
  var UsersTable = require("tabs/users-tab/datatable");
  var GroupTable = require("tabs/groups-tab/datatable");
  var Humanize = require("utils/humanize");
  var TemplateUtils = require("utils/template-utils");
  var UniqueId = require("utils/unique-id");
  var ScheduleActions = require("utils/schedule_action");

  /*
    CONSTANTS
   */

  var FORM_PANEL_ID = require("./instantiate/formPanelId");
  var TAB_ID = require("../tabId");

  /*
    CONSTRUCTOR
   */

  function FormPanel() {
    this.formPanelId = FORM_PANEL_ID;
    this.tabId = TAB_ID;
    this.actions = {
      "instantiate": {
        "title": Locale.tr("Instantiate VM Template"),
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
  FormPanel.prototype.calculateCost = _calculateCost;

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
    var that = this;

    if(Config.isFeatureEnabled("instantiate_persistent")){
      $("input.instantiate_pers", context).on("change", function(){
        var persistent = $(this).prop("checked");

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
            cost_callback: that.calculateCost.bind(that),
            uinput_mb: true
          });
        });
      });
    } else {
      $("#vm_n_times_disabled", context).hide();
      $("#vm_n_times", context).show();
    }

    context.off("click", "#add_scheduling_inst_action");
    context.on("click", "#add_scheduling_inst_action", function() {
      var actions = ["terminate", "terminate-hard", "hold", "release", "stop", "suspend", "resume", "reboot", "reboot-hard", "poweroff", "poweroff-hard", "undeploy", "undeploy-hard", "snapshot-create"];
      $("#add_scheduling_inst_action", context).attr("disabled", "disabled");

      ScheduleActions.htmlNewAction(actions, context, "inst");
      ScheduleActions.setup(context);

      return false;
    });

    context.off("click", "#add_inst_action_json");
    context.on("click" , "#add_inst_action_json", function(){
      var sched_action = ScheduleActions.retrieveNewAction(context);
      if (sched_action != false) {
        $("#sched_inst_actions_body").append(ScheduleActions.fromJSONtoActionsTable(sched_action));
      }

      return false;
    });

    context.on("focusout" , "#time_input", function(){
      $("#time_input").removeAttr("data-invalid");
      $("#time_input").removeAttr("class");
    });

    context.off("click", ".remove_action_x");
    context.on("click", ".remove_action_x", function(){
      $(this).parents("tr").remove();
    });
  }

  function _calculateCost(){
    $.each($(".template-row", this.formContext), function(){
      var capacity_val = parseFloat( $(".capacity_cost_div .cost_value", $(this)).text() );
      var disk_val = parseFloat( $(".provision_create_template_disk_cost_div .cost_value", $(this)).text() );

      if(Number.isNaN(capacity_val)){
        capacity_val = 0;
      }
      if(Number.isNaN(disk_val)){
        disk_val = 0;
      }

      var total = capacity_val + disk_val;

      if (total != 0 && Config.isFeatureEnabled("showback")) {
        $(".total_cost_div", $(this)).show();

        $(".total_cost_div .cost_value", $(this)).text( (capacity_val + disk_val).toFixed(6) );
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

    var vm_name = $("#vm_name", context).val();
    var n_times = $("#vm_n_times", context).val();
    var n_times_int = 1;

    if (n_times.length) {
      n_times_int = parseInt(n_times, 10);
    }

    var hold = $("#hold", context).prop("checked");

    var action;

    if ($("input.instantiate_pers", context).prop("checked")){
      action = "instantiate_persistent";
      n_times_int = 1;
    } else {
      action = "instantiate";
    }

    $.each(this.selected_nodes, function(index, template_id) {
      var extra_info = {
        "hold": hold
      };

      var tmp_json = WizardFields.retrieve($(".template_user_inputs" + template_id, context));
      $.each(tmp_json, function(key, value){
        if (Array.isArray(value)){
          delete tmp_json[key];
          tmp_json[key] = value.join(",");
        }
      });

      var disks = DisksResize.retrieve($(".disksContext"  + template_id, context));
      if (disks.length > 0) {
        tmp_json.DISK = disks;
      }

      var networks = NicsSection.retrieve($(".nicsContext"  + template_id, context));

      var vmgroup = VMGroupSection.retrieve($(".vmgroupContext"+ template_id, context));
      if (vmgroup){
        $.extend(tmp_json, vmgroup);
      } else {
        tmp_json.VMGROUP = [];
      }

      //default requeriments
      var defaultSchedDSRequirements = [];
      var defaultSchedRequirements = [];
      if(
        that &&
        that.template_objects &&
        that.template_objects[0] &&
        that.template_objects[0].VMTEMPLATE &&
        that.template_objects[0].VMTEMPLATE.TEMPLATE
      ){
        var template = that.template_objects[0].VMTEMPLATE.TEMPLATE;
        defaultSchedDSRequirements = template.SCHED_DS_REQUIREMENTS? template.SCHED_DS_REQUIREMENTS.replace(/(["?])/g, "\\$1") : [];
        defaultSchedRequirements = template.SCHED_REQUIREMENTS? template.SCHED_REQUIREMENTS.replace(/(["?])/g, "\\$1") : [];
      }

      var sched = WizardFields.retrieveInput($("#SCHED_REQUIREMENTS"  + template_id, context));
      if (sched){
        tmp_json.SCHED_REQUIREMENTS = sched;
      } else {
        tmp_json.SCHED_REQUIREMENTS = defaultSchedRequirements ;
      }

      var sched_ds = WizardFields.retrieveInput($("#SCHED_DS_REQUIREMENTS"  + template_id, context));
      if (sched_ds){
        tmp_json.SCHED_DS_REQUIREMENTS = sched_ds;
      } else {
        tmp_json.SCHED_DS_REQUIREMENTS = defaultSchedDSRequirements;
      }

      var as_uid = that.usersTable.retrieveResourceTableSelect();
      if (as_uid){
        tmp_json.AS_UID = as_uid;
      }

      var as_gid = that.groupTable.retrieveResourceTableSelect();
      if (as_gid){
        tmp_json.AS_GID = as_gid;
      }

      var nics = [];
      var pcis = [];
      var alias = [];

      var rdp = true;
      $.each(networks, function(){
        if (this.TYPE == "NIC"){
          pcis.push(this);
        } else if (this.PARENT) {
          alias.push(this);
        } else {
          (rdp && this.RDP == "YES")
            ? rdp = false
            : delete this["RDP"];

          nics.push(this);
        }
      });
      debugger

      tmp_json.NIC = nics;
      tmp_json.NIC_ALIAS = alias;

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

      if (alias.length > 0) {
        tmp_json.NIC_ALIAS = alias;
      }

      if (Config.isFeatureEnabled("vcenter_vm_folder")){
        if(!$.isEmptyObject(original_tmpl.TEMPLATE.HYPERVISOR) &&
          original_tmpl.TEMPLATE.HYPERVISOR === "vcenter"){
          $.extend(tmp_json, VcenterVMFolder.retrieveChanges($(".vcenterVMFolderContext"  + template_id)));
        }
      }

      tmp_json["SCHED_ACTION"] = ScheduleActions.retrieve(context);

      if (tmp_json["SCHED_ACTION"].length == 0) {
        delete tmp_json["SCHED_ACTION"];
      }

      capacityContext = $(".capacityContext"  + template_id, context);
      $.extend(tmp_json, CapacityInputs.retrieveChanges(capacityContext));

      extra_info["template"] = tmp_json;
      for (var i = 0; i < n_times_int; i++) {
        extra_info["vm_name"] = vm_name.replace(/%i/gi, i); // replace wildcard

        Sunstone.runAction("Template."+action, [template_id], extra_info);
      }
    });

    return false;
  }

  function _setTemplateIds(context, selected_nodes) {
    var that = this;

    this.selected_nodes = selected_nodes;
    this.template_objects = [];
    this.template_base_objects = {};

    var templatesContext = $(".list_of_templates", context);

    var idsLength = this.selected_nodes.length;
    var idsDone = 0;

    $.each(this.selected_nodes, function(index, template_id) {
      OpenNebulaTemplate.show({
        data : {
          id: template_id,
          extended: false
        },
        timeout: true,
        success: function (request, template_json) {
          that.template_base_objects[template_json.VMTEMPLATE.ID] = template_json;
        }
      });
    });

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

          var options = {
            "select": true,
            "selectOptions": {
              "multiple_choice": true
            }
          };

          var options_unique = {
            "select": true,
            "selectOptions": {
              "multiple_choice": false
            }
          };

          that.hostsTable = new HostsTable("HostsTable" + UniqueId.id(), options);
          that.datastoresTable = new DatastoresTable("DatastoresTable" + UniqueId.id(), options);
          that.usersTable = new UsersTable("UsersTable" + UniqueId.id(), options_unique);
          that.groupTable = new GroupTable("GroupTable" + UniqueId.id(), options_unique);

          templatesContext.append(
            TemplateRowHTML(
              { element: template_json.VMTEMPLATE,
                capacityInputsHTML: CapacityInputs.html(),
                hostsDatatable: that.hostsTable.dataTableHTML,
                dsDatatable: that.datastoresTable.dataTableHTML,
                usersDatatable: that.usersTable.dataTableHTML,
                groupDatatable: that.groupTable.dataTableHTML,
                table_sched_actions: ScheduleActions.htmlTable("inst")
              }) );

          $(".provision_host_selector" + template_json.VMTEMPLATE.ID, context).data("hostsTable", that.hostsTable);
          $(".provision_ds_selector" + template_json.VMTEMPLATE.ID, context).data("dsTable", that.datastoresTable);
          $(".provision_uid_selector" + template_json.VMTEMPLATE.ID, context).data("usersTable", that.usersTable);
          $(".provision_gid_selector" + template_json.VMTEMPLATE.ID, context).data("groupTable", that.groupTable);

          var actions = ScheduleActions.fromJSONtoActionsTable(template_json.VMTEMPLATE.TEMPLATE.SCHED_ACTION);
          $("#sched_inst_actions_body").append(actions);

          var selectOptions = {
            "selectOptions": {
              "select_callback": function(aData, options) {
                var hostTable = $(".provision_host_selector" + template_json.VMTEMPLATE.ID, context).data("hostsTable");
                var dsTable = $(".provision_ds_selector" + template_json.VMTEMPLATE.ID, context).data("dsTable");
                generateRequirements(hostTable, dsTable, context, template_json.VMTEMPLATE.ID);
              },
              "unselect_callback": function(aData, options) {
                var hostTable = $(".provision_host_selector" + template_json.VMTEMPLATE.ID, context).data("hostsTable");
                var dsTable = $(".provision_ds_selector" + template_json.VMTEMPLATE.ID, context).data("dsTable");
                generateRequirements(hostTable, dsTable, context, template_json.VMTEMPLATE.ID);
               }
            }
          };
          that.hostsTable.initialize(selectOptions);
          that.hostsTable.refreshResourceTableSelect();
          that.datastoresTable.initialize(selectOptions);
          that.datastoresTable.filter("system", 10);
          that.datastoresTable.refreshResourceTableSelect();

          //select_options
          that.usersTable.initialize();
          that.usersTable.refreshResourceTableSelect();
          that.groupTable.initialize();
          that.groupTable.refreshResourceTableSelect();

          var reqJSON = template_json.VMTEMPLATE.TEMPLATE.SCHED_REQUIREMENTS;
          if (reqJSON) {
            $("#SCHED_REQUIREMENTS" + template_json.VMTEMPLATE.ID, context).val(reqJSON);
            var req = TemplateUtils.escapeDoubleQuotes(reqJSON);
            var host_id_regexp = /(\s|\||\b)ID=\\"([0-9]+)\\"/g;
            var hosts = [];
            while (match = host_id_regexp.exec(req)) {
                hosts.push(match[2]);
            }
            var selectedResources = {
              ids : hosts
            };
            that.hostsTable.selectResourceTableSelect(selectedResources);
          }

          var dsReqJSON = template_json.VMTEMPLATE.TEMPLATE.SCHED_DS_REQUIREMENTS;
          if (dsReqJSON) {
            $("#SCHED_DS_REQUIREMENTS" + template_json.VMTEMPLATE.ID, context).val(dsReqJSON);
            var dsReq = TemplateUtils.escapeDoubleQuotes(dsReqJSON);
            var ds_id_regexp = /(\s|\||\b)ID=\\"([0-9]+)\\"/g;
            var ds = [];
            while (match = ds_id_regexp.exec(dsReq)) {
              ds.push(match[2]);
            }
            var selectedResources = {
              ids : ds
            };
            that.datastoresTable.selectResourceTableSelect(selectedResources);
          }

          var asuidJSON = template_json.VMTEMPLATE.TEMPLATE.AS_UID;
          if (asuidJSON) {
            var selectedResources = {
              ids : asuidJSON
            };
            that.usersTable.selectResourceTableSelect(selectedResources);
          }

          var asgidJSON = template_json.VMTEMPLATE.TEMPLATE.AS_GID;
          if (asgidJSON) {
            var selectedResources = {
              ids : asgidJSON
            };
            that.groupTable.selectResourceTableSelect(selectedResources);
          }

          DisksResize.insert({
            template_base_json: that.template_base_objects[template_json.VMTEMPLATE.ID],
            template_json: template_json,
            disksContext: $(".disksContext"  + template_json.VMTEMPLATE.ID, context),
            force_persistent: $("input.instantiate_pers", context).prop("checked"),
            cost_callback: that.calculateCost.bind(that),
            uinput_mb: true
          });

          $(".memory_input_wrapper", context).removeClass("large-6 medium-8").addClass("large-12 medium-12");

          NicsSection.insert(template_json,
            $(".nicsContext"  + template_json.VMTEMPLATE.ID, context),
            { "forceIPv4": true,
              "securityGroups": Config.isFeatureEnabled("secgroups"),
              "name": " ",
              "fieldset": false
            });

          VMGroupSection.insert(template_json,
            $(".vmgroupContext"+ template_json.VMTEMPLATE.ID, context));

          vcenterVMFolderContext = $(".vcenterVMFolderContext"  + template_json.VMTEMPLATE.ID, context);
          VcenterVMFolder.setup(vcenterVMFolderContext);
          VcenterVMFolder.fill(vcenterVMFolderContext, template_json.VMTEMPLATE);

          var inputs_div = $(".template_user_inputs" + template_json.VMTEMPLATE.ID, context);

          UserInputs.vmTemplateInsert(
              inputs_div,
              template_json,
              {text_header: "<i class=\"fas fa-gears\"></i> "+Locale.tr("Custom Attributes")});

          Tips.setup(inputs_div);

          inputs_div.data("opennebula_id", template_json.VMTEMPLATE.ID);

          capacityContext = $(".capacityContext"  + template_json.VMTEMPLATE.ID, context);
          CapacityInputs.setup(capacityContext);
          CapacityInputs.fill(capacityContext, template_json.VMTEMPLATE);

          if (template_json.VMTEMPLATE.TEMPLATE.HYPERVISOR == "vcenter"){
            $(".memory_input .mb_input input", context).attr("pattern", "^([048]|\\d*[13579][26]|\\d*[24680][048])$");
          } else {
            $(".memory_input .mb_input input", context).removeAttr("pattern");
          }

          var cpuCost    = template_json.VMTEMPLATE.TEMPLATE.CPU_COST;
          var memoryCost = template_json.VMTEMPLATE.TEMPLATE.MEMORY_COST;
          var memoryUnitCost = template_json.VMTEMPLATE.TEMPLATE.MEMORY_UNIT_COST;

          if (memoryCost && memoryUnitCost && memoryUnitCost == "GB") {
            memoryCost = (memoryCost*1024).toString();
          }

          if (cpuCost == undefined){
            cpuCost = Config.onedConf.DEFAULT_COST.CPU_COST;
          }

          if (memoryCost == undefined){
            memoryCost = Config.onedConf.DEFAULT_COST.MEMORY_COST;
          } else {
            if (memoryUnitCost == "GB"){
              memoryCost = memoryCost / 1024;
            }
          }

          if ((cpuCost != 0 || memoryCost != 0) && Config.isFeatureEnabled("showback")) {
            $(".capacity_cost_div", capacityContext).show();

            CapacityInputs.setCallback(capacityContext, function(values){
              var cost = 0;

              if (values.MEMORY != undefined){
                cost += memoryCost * values.MEMORY;
              }

              if (values.CPU != undefined){
                cost += cpuCost * values.CPU;
              }

              $(".cost_value", capacityContext).html(cost.toFixed(6));

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

  function generateRequirements(hosts_table, ds_table, context, id) {
    var req_string = [];
    var req_ds_string = [];
    var selected_hosts = hosts_table.retrieveResourceTableSelect();
    var selected_ds = ds_table.retrieveResourceTableSelect();

    $.each(selected_hosts, function(index, hostId) {
      req_string.push("ID=\"" + hostId + "\"");
    });

    $.each(selected_ds, function(index, dsId) {
      req_ds_string.push("ID=\"" + dsId + "\"");
    });

    $("#SCHED_REQUIREMENTS" + id, context).val(req_string.join(" | "));
    $("#SCHED_DS_REQUIREMENTS" + id, context).val(req_ds_string.join(" | "));
  }

});
