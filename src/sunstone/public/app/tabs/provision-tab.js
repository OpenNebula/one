/* -------------------------------------------------------------------------- */
/* Copyright 2002-2020, OpenNebula Project, OpenNebula Systems                */
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
    require("datatables.net");
    require("datatables.foundation");
    var Locale = require("utils/locale");
    var Config = require("sunstone-config");
    var OpenNebula = require("opennebula");
    var Sunstone = require("sunstone");
    var Notifier = require("utils/notifier");
    var QuotaWidgets = require("utils/quotas/quota-widgets");
    var QuotaDefaults = require("utils/quotas/quota-defaults");
    var Accounting = require("utils/accounting");
    var Showback = require("utils/showback");
    var Humanize = require("utils/humanize");
    var QuotaLimits = require("utils/quotas/quota-limits");
    var RangeSlider = require("utils/range-slider");
    var DisksResize = require("utils/disks-resize");
    var NicsSection = require("utils/nics-section");
    var VMGroupSection = require("utils/vmgroup-section");
    var TemplateUtils = require("utils/template-utils");
    var ServiceUtils = require("utils/service-utils");
    var WizardFields = require("utils/wizard-fields");
    var UserInputs = require("utils/user-inputs");
    var CapacityInputs = require("tabs/templates-tab/form-panels/create/wizard-tabs/general/capacity-inputs");
    var LabelsUtils = require("utils/labels/utils");
    var DatastoresTable = require("tabs/datastores-tab/datatable");
    var UniqueId = require("utils/unique-id");
    var ProvisionVmsList = require("./provision-tab/vms/list");
    var ProvisionTemplatesList = require("./provision-tab/templates/list");
    var ProvisionFlowsList = require("./provision-tab/flows/list");
    // Templates
    var TemplateContent = require("hbs!./provision-tab/content");
    var TemplateDashboardQuotas = require("hbs!./provision-tab/dashboard/quotas");
    var TemplateDashboardGroupQuotas = require("hbs!./provision-tab/dashboard/group-quotas");
    var TemplateDashboardVms = require("hbs!./provision-tab/dashboard/vms");
    var TemplateDashboardGroupVms = require("hbs!./provision-tab/dashboard/group-vms");
    var TAB_ID = require("./provision-tab/tabId");
    var FLOW_TEMPLATE_LABELS_COLUMN = 2;
    var povision_actions = {
      "Provision.Flow.instantiate" : {
        type: "single",
        call: OpenNebula.ServiceTemplate.instantiate,
        callback: function(){
          OpenNebula.Action.clear_cache("SERVICE");
          ProvisionFlowsList.show(0);
          var context = $("#provision_create_flow");
          $("#flow_name", context).val("");
          $(".total_cost_div", context).hide();
          $(".provision-pricing-table", context).removeClass("selected");
        },
        error: Notifier.onError
      },
      "Provision.instantiate" : {
        type: "single",
        call: OpenNebula.Template.instantiate,
        callback: _clearVMCreate,
        error: Notifier.onError
      },
      "Provision.instantiate_persistent" : {
        type: "single",
        call: OpenNebula.Template.instantiate_persistent,
        callback: _clearVMCreate,
        error: Notifier.onError
      }
    };
    function _clearVMCreate(){
      OpenNebula.Action.clear_cache("VM");
      ProvisionVmsList.show(0);
      var context = $("#provision_create_vm");
      $("#vm_name", context).val("");
      $(".provision_selected_networks").html("");
      $(".provision_vmgroup_selector").html("");
      $(".provision_ds_selector").html("");
      $(".provision-pricing-table", context).removeClass("selected");
      $(".alert-box-error", context).hide();
      $(".total_cost_div", context).hide();
      $("#provision_vm_instantiate_templates_owner_filter").val("all").change();
      $("#provision_vm_instantiate_template_search").val("").trigger("input");
    }
    function generate_cardinality_selector(context, role_template, template_json) {
      context.off();
      var min_vms = (role_template.min_vms||1);
      var max_vms = (role_template.max_vms||20);
      context.html(
        "<fieldset>" +
          "<legend>" +
            Locale.tr("Cardinality") + " " +
            "<span class=\"provision_create_service_cost_div\" hidden>"+
              "<span class=\"cost_value\"></span>"+
              "<small> "+Locale.tr("COST")+" / " + Locale.tr("HOUR") + "</small>"+
            "</span>"+
          "</legend>" +
            "<div class=\"row\">"+
              "<div class=\"large-12 columns\">"+
                "<div class=\"cardinality_slider_div\">"+
                "</div>"+
                "<div class=\"cardinality_no_slider_div\">"+
                  "<label>"+Locale.tr("The cardinality for this role cannot be changed")+"</label>"+
                "</div>"+
              "</div>"+
            "</div>"+
        "</fieldset>");
        var cost = OpenNebula.Template.cost(template_json);
        var has_cost = (cost != 0) && Config.isFeatureEnabled("showback");
        if (has_cost) {
          $(".provision_create_service_cost_div", context).show();
          $(".provision_create_service_cost_div", context).data("cost", cost);
          var cost_value = cost*parseInt(role_template.cardinality);
          $(".cost_value", context).html(cost_value.toFixed(2));
          _calculateFlowCost();
        } else {
          $(".provision_create_service_cost_div", context).hide();
        }
        if (max_vms > min_vms) {
          $( ".cardinality_slider_div", context).html(RangeSlider.html({
              min: min_vms,
              max: max_vms,
              initial: role_template.cardinality,
              label: Locale.tr("Number of VMs for Role")+" "+role_template.name,
              name: "cardinality"
            }));
          $( ".cardinality_slider_div", context).show();
          $( ".cardinality_no_slider_div", context).hide();
          $( ".cardinality_slider_div", context).off("input");
          if (has_cost) {
            $( ".cardinality_slider_div", context).on("input", "input", function() {
              var cost_value = $(".provision_create_service_cost_div", context).data("cost")*$(this).val();
              $(".cost_value", context).html(cost_value.toFixed(2));
              _calculateFlowCost();
            });
          }
        } else {
          $( ".cardinality_slider_div", context).hide();
          $( ".cardinality_no_slider_div", context).show();
        }
    }
    function generate_provision_capacity_accordion(context, element) {
      var capacity = element.TEMPLATE;
      context.off();
      var memory_value;
      var memory_unit;
      if (capacity.MEMORY >= 1024){
        memory_value = (capacity.MEMORY/1024).toFixed(2);
        memory_unit = "GB";
      } else {
        memory_value = (capacity.MEMORY ? capacity.MEMORY : "-");
        memory_unit = "MB";
      }
      context.html(
        "<fieldset>" +
          "<legend>" +
            "<i class=\"fas fa-laptop fa-lg\"></i> "+
            Locale.tr("Capacity") + " " +
            "<span class=\"provision_create_template_cost_div\" hidden>" +
              "<span class=\"cost_value\">0.00</span> "+
              "<small>"+Locale.tr("COST")+" / " + Locale.tr("HOUR") + "</small>"+
            "</span>"+
          "</legend>" +
          CapacityInputs.html() +
        "</fieldset>");
      if (Config.provision.dashboard.isEnabled("quotas")) {
        $("#quotas-mem", context).show();
        $("#quotas-cpu", context).show();
        var quotaMem = false;
        var quotaCpu = false;
        var user = this.user;
        if (user && user.VM_QUOTA && !$.isEmptyObject(user.VM_QUOTA)){
          var memUsed = parseFloat(user.VM_QUOTA.VM.MEMORY_USED);
          var cpuUsed = parseFloat(user.VM_QUOTA.VM.CPU_USED);
          if (user.VM_QUOTA.VM.MEMORY === "-1" || user.VM_QUOTA.VM.MEMORY === "-2"){
            $("#quotas-mem", context).text(Humanize.size(memUsed * 1024) + " / ∞");
          } else {
            quotaMem = true;
            $("#quotas-mem", context).text(Humanize.size(memUsed * 1024) + " / " + Humanize.size(user.VM_QUOTA.VM.MEMORY * 1024));
          }
          if (user.VM_QUOTA.VM.CPU === "-1" || user.VM_QUOTA.VM.CPU === "-2"){
            $("#quotas-cpu", context).text(cpuUsed + " / ∞");
          } else {
            quotaCpu = true;
            $("#quotas-cpu", context).text(cpuUsed + " / " + user.VM_QUOTA.VM.CPU);
          }
        }
      }
      CapacityInputs.setup(context);
      CapacityInputs.fill(context, element);
      CapacityInputs.setCallback(context, function(values){
        $(".cpu_value", context).html(values.CPU);
        var memory_value;
        var memory_unit;
        if (values.MEMORY >= 1024){
          memory_value = (values.MEMORY/1024).toFixed(2);
          memory_unit = "GB";
        } else {
          memory_value = values.MEMORY;
          memory_unit = "MB";
        }
        $(".memory_value", context).html(memory_value);
        $(".memory_unit", context).html(memory_unit);
        if (!values.MEMORY){
          values.MEMORY = 0;
        }
        if (!values.CPU){
          values.CPU = 0;
        }

        if (user && user.VM_QUOTA && !$.isEmptyObject(user.VM_QUOTA)){
          if (quotaMem){
            $("#quotas-mem", context).text( Humanize.size((parseFloat(user.VM_QUOTA.VM.MEMORY_USED) + parseFloat(values.MEMORY)) * 1024) + " / " + Humanize.size(user.VM_QUOTA.VM.MEMORY * 1024));
            if ((parseFloat(values.MEMORY) + parseFloat(user.VM_QUOTA.VM.MEMORY_USED)) > user.VM_QUOTA.VM.MEMORY){
              $("#quotas-mem", context).css("color", "red");
            } else {
              $("#quotas-mem", context).css("color", "black");
            }
          } else {
            $("#quotas-mem", context).text( Humanize.size((parseFloat(user.VM_QUOTA.VM.MEMORY_USED) + parseFloat(values.MEMORY)) * 1024) + " / ∞");
          }
          if (quotaCpu){
            $("#quotas-cpu", context).text(((parseFloat(user.VM_QUOTA.VM.CPU_USED) + parseFloat(values.CPU))).toFixed(2) + " / " + user.VM_QUOTA.VM.CPU);
            if ((parseFloat(values.CPU) + parseFloat(user.VM_QUOTA.VM.CPU_USED)) > user.VM_QUOTA.VM.CPU){
              $("#quotas-cpu", context).css("color", "red");
            } else {
              $("#quotas-cpu", context).css("color", "black");
            }
          } else {
            $("#quotas-cpu", context).text(((parseFloat(user.VM_QUOTA.VM.CPU_USED) + parseFloat(values.CPU))).toFixed(2) + " / ∞");
          }
        }
      });

      var cpuCost    = capacity.CPU_COST;
      var memoryCost = capacity.MEMORY_COST;
      if (cpuCost == undefined){
        cpuCost = Config.onedConf.DEFAULT_COST.CPU_COST;
      }
      if (memoryCost == undefined){
        memoryCost = Config.onedConf.DEFAULT_COST.MEMORY_COST;
      }

      var _redoCost = function(values) {
        var cost = 0;
        if (values.CPU != undefined){
          cost += cpuCost * values.CPU;
        }
        if (values.MEMORY != undefined){
          cost += memoryCost * values.MEMORY;
        }
        $(".cost_value", context).html(cost.toFixed(2));
        _calculateCost();
      };

      if ((cpuCost != 0 || memoryCost != 0) && Config.isFeatureEnabled("showback")) {
        $(".provision_create_template_cost_div").show();
        _redoCost(capacity);
        if (Config.provision.create_vm.isEnabled("capacity_select")){
          CapacityInputs.setCallback(context, _redoCost);
        }
      } else {
        $(".provision_create_template_cost_div").hide();
      }
      
      if (!Config.provision.create_vm.isEnabled("capacity_select")) {
        $('input, select', $(".provision_capacity_selector"))
          .prop("disabled", true)
      }
    }
    function _calculateCost(){
      var context = $("#provision_create_vm");
      var capacity_val = parseFloat( $(".provision_create_template_cost_div .cost_value", context).text() );
      var disk_val = parseFloat( $(".provision_create_template_disk_cost_div .cost_value", context).text() );
      var total = capacity_val + disk_val;
      if (total != 0 && Config.isFeatureEnabled("showback")) {
        $(".total_cost_div", context).show();
        $(".total_cost_div .cost_value", context).text( (total).toFixed(2) );
      }
      if (Config.provision.dashboard.isEnabled("quotas") && this.user && this.user.VM_QUOTA && !$.isEmptyObject(user.VM_QUOTA)) {
        if (!$("#quotas-disks").text().includes("/")){
          var totalSize = parseFloat($("#quotas-disks").text());
          if (this.user.VM_QUOTA.VM.SYSTEM_DISK_SIZE === "-1" || this.user.VM_QUOTA.VM.SYSTEM_DISK_SIZE === "-2"){
            $("#quotas-disks").text(Humanize.size((parseFloat(this.user.VM_QUOTA.VM.SYSTEM_DISK_SIZE_USED) + totalSize) * 1024) + " / ∞");
          } else {
            $("#quotas-disks").text(Humanize.size((parseFloat(this.user.VM_QUOTA.VM.SYSTEM_DISK_SIZE_USED) + totalSize) * 1024) + " / " + Humanize.size(parseFloat(this.user.VM_QUOTA.VM.SYSTEM_DISK_SIZE) * 1024));
            if ((parseFloat(this.user.VM_QUOTA.VM.SYSTEM_DISK_SIZE_USED) + totalSize) > parseFloat(this.user.VM_QUOTA.VM.SYSTEM_DISK_SIZE)){
              $("#quotas-disks", context).css("color", "red");
            } else {
              $("#quotas-disks", context).css("color", "black");
            }
          }
        }
      }
    }
    function _calculateFlowCost(){
      var context = $("#provision_create_flow");
      var total = 0;
      $.each($(".provision_create_service_cost_div .cost_value", context), function(){
        total += parseFloat($(this).text());
      });
      if (total != 0 && Config.isFeatureEnabled("showback")) {
        $(".total_cost_div", context).show();
        $(".total_cost_div .cost_value", context).text( (total).toFixed(2) );
      }
    }
    function show_provision_dashboard() {
      $(".section_content").hide();
      $("#provision_dashboard").fadeIn();
      $("#provision_dashboard").html("");
      if (Config.provision.dashboard.isEnabled("vms")) {
        $("#provision_dashboard").append(TemplateDashboardVms());
        if(!Config.isFeatureEnabled("cloud_vm_create")){
          $(".provision_create_vm_button").hide();
        }
        var start_time =  Math.floor(new Date().getTime() / 1000);
        // ms to s
        // 604800 = 7 days = 7*24*60*60
        start_time = start_time - 604800;
        // today
        var end_time = -1;
        var options = {
          "start_time": start_time,
          "end_time": end_time,
          "userfilter": config["user_id"]
        };
        OpenNebula.VM.list({
          timeout: true,
          success: function (request, item_list){
            var total = 0;
            var running = 0;
            var off = 0;
            var error = 0;
            var deploying = 0;
            var groups = [];
            var diferentsGroups = function (item_list = []){
              var groups = [];
              var rtn = groups.length;
              if(Array.isArray(item_list)){
                var finderElements = function (element, index){
                  if(element && element.VM && element.VM.GNAME && !groups.includes(element.VM.GNAME)){
                    groups.push(element.VM.GNAME);
                  }
                }
                item_list.map(finderElements);
                rtn = groups.length;
              }
              return rtn;
            }

            $.each(item_list, function(index, vm){
              if (vm.VM.UID == config["user_id"]) {
                var state = ProvisionVmsList.state(vm.VM);
                total = total + 1;
                switch (state.color) {
                  case "deploying":
                    deploying = deploying + 1;
                    break;
                  case "error":
                    error = error + 1;
                    break;
                  case "running":
                    running = running + 1;
                    break;
                  case "powering_off":
                    off = off + 1;
                    break;
                  case "off":
                    off = off + 1;
                    break;
                }
              }
            });
            var context = $("#provision_vms_dashboard");
            $("#provision_dashboard_owner", context).html(total);
            $("#provision_dashboard_group", context).html(diferentsGroups(item_list));
            $("#provision_dashboard_running", context).html(running);
            $("#provision_dashboard_off", context).html(off);
            $("#provision_dashboard_error", context).html(error);
            $("#provision_dashboard_deploying", context).html(deploying);
          },
          error: Notifier.onError
        });
      }
      if (Config.provision.dashboard.isEnabled("groupvms")) {
        $("#provision_dashboard").append(TemplateDashboardGroupVms());
        var start_time =  Math.floor(new Date().getTime() / 1000);
        // ms to s
        // 604800 = 7 days = 7*24*60*60
        start_time = start_time - 604800;
        // today
        var end_time = -1;
        var options = {
          "start_time": start_time,
          "end_time": end_time
        };
        
        OpenNebula.VM.accounting({
          //timeout: true,
          success: function(req, response){
            var context = $("#provision_group_vms_dashboard");
            Accounting.fillAccounting(context, req, response, false);
          },
          error: Notifier.onError,
          data: options
        });

        OpenNebula.VM.list({
          timeout: true,
          success: function (request, item_list){
            var total = 0;
            var running = 0;
            var off = 0;
            var error = 0;
            var deploying = 0;
            $.each(item_list, function(index, vm){
                var state = ProvisionVmsList.state(vm.VM);
                total = total + 1;
                switch (state.color) {
                  case "deploying":
                    deploying = deploying + 1;
                    break;
                  case "error":
                    error = error + 1;
                    break;
                  case "running":
                    running = running + 1;
                    break;
                  case "powering_off":
                    off = off + 1;
                    break;
                  case "off":
                    off = off + 1;
                    break;
                  default:
                    break;
                }
            });
            var context = $("#provision_group_vms_dashboard");
            $("#provision_dashboard_group_total", context).html(total);
            $("#provision_dashboard_group_running", context).html(running);
            $("#provision_dashboard_group_off", context).html(off);
            $("#provision_dashboard_group_error", context).html(error);
            $("#provision_dashboard_group_deploying", context).html(deploying);
          },
          error: Notifier.onError
        });
      }
      if (Config.provision.dashboard.isEnabled("quotas")) {
        $("#provision_dashboard").append(TemplateDashboardQuotas());
        var that = this;
        OpenNebula.User.show({
          data : {
              id: "-1"
          },
          success: function(request,user_json){
            var user = user_json.USER;
            that.user = user;
            QuotaWidgets.initEmptyQuotas(user);
            if (user && user.VM_QUOTA && !$.isEmptyObject(user.VM_QUOTA)){
              $("#provision_quotas_dashboard").show();
              var default_user_quotas = QuotaDefaults.default_quotas(user.DEFAULT_USER_QUOTAS);
              //running VMS
              if(
                default_user_quotas &&
                default_user_quotas.VM_QUOTA &&
                default_user_quotas.VM_QUOTA.VM &&
                default_user_quotas.VM_QUOTA.VM.RUNNING_VMS
              ){
                var vms = QuotaWidgets.quotaInfo(
                  user.VM_QUOTA.VM.RUNNING_VMS_USED,
                  user.VM_QUOTA.VM.RUNNING_VMS,
                  default_user_quotas.VM_QUOTA.VM.RUNNING_VMS);
                $("#provision_dashboard_rvms_percentage").html(vms["percentage"]);
                $("#provision_dashboard_rvms_str").html(vms["str"]);
                $("#provision_dashboard_rvms_meter").val(vms["percentage"]);
              }
              //MEMORY
              if(
                default_user_quotas &&
                default_user_quotas.VM_QUOTA &&
                default_user_quotas.VM_QUOTA.VM &&
                default_user_quotas.VM_QUOTA.VM.MEMORY
              ){
                var memory = QuotaWidgets.quotaMBInfo(
                    user.VM_QUOTA.VM.MEMORY_USED,
                    user.VM_QUOTA.VM.MEMORY,
                    default_user_quotas.VM_QUOTA.VM.MEMORY);
                $("#provision_dashboard_memory_percentage").html(memory["percentage"]);
                $("#provision_dashboard_memory_str").html(memory["str"]);
                $("#provision_dashboard_memory_meter").val(memory["percentage"]);
              }
              //CPU
              if(
                default_user_quotas &&
                default_user_quotas.VM_QUOTA &&
                default_user_quotas.VM_QUOTA.VM &&
                default_user_quotas.VM_QUOTA.VM.CPU
              ){
                var cpu = QuotaWidgets.quotaFloatInfo(
                    user.VM_QUOTA.VM.CPU_USED,
                    user.VM_QUOTA.VM.CPU,
                    default_user_quotas.VM_QUOTA.VM.CPU);
                $("#provision_dashboard_cpu_percentage").html(cpu["percentage"]);
                $("#provision_dashboard_cpu_str").html(cpu["str"]);
                $("#provision_dashboard_cpu_meter").val(cpu["percentage"]);
              }
              //IP LEASES
              if(
                user &&
                user.NETWORK_QUOTA &&
                user.NETWORK_QUOTA.NETWORK
              ){
                var used = 0;
                var size = 0;
                var nets = user.NETWORK_QUOTA.NETWORK
                if(Array.isArray(nets)){
                  nets.map(function(network){
                    if(network.LEASES_USED){
                      used = used+parseInt(network.LEASES_USED,10);
                    }
                    if(network.LEASES){
                      size = size+parseInt(network.LEASES,10);
                    }
                  });
                  var ipLeases = QuotaWidgets.quotaInfo(used, size);
                }else{
                  used = parseInt(nets.LEASES_USED,10);
                  size = parseInt(nets.LEASES,10);
                }
                var ipLeases = QuotaWidgets.quotaInfo(used, size);
                $("#provision_dashboard_ips_percentage").html(ipLeases["percentage"]);
                $("#provision_dashboard_ips_str").html(ipLeases["str"]);
                $("#provision_dashboard_ips_meter").val(ipLeases["percentage"]);
              }
              //SYSTEM DISK
              if(
                default_user_quotas &&
                default_user_quotas.VM_QUOTA &&
                default_user_quotas.VM_QUOTA.VM.SYSTEM_DISK_SIZE
              ){
                var systemDisk = QuotaWidgets.quotaInfo(
                    user.VM_QUOTA.VM.SYSTEM_DISK_SIZE_USED,
                    user.VM_QUOTA.VM.SYSTEM_DISK_SIZE,
                    default_user_quotas.VM_QUOTA.VM.SYSTEM_DISK_SIZE);
                $("#provision_dashboard_system_disk_percentage").html(systemDisk["percentage"]);
                $("#provision_dashboard_system_disk_str").html(systemDisk["str"]);
                $("#provision_dashboard_system_disk_meter").val(systemDisk["percentage"]);
              }
              //DATASTORE
              if(
                user &&
                user.DATASTORE_QUOTA &&
                user.DATASTORE_QUOTA.DATASTORE &&
                user.DATASTORE_QUOTA.DATASTORE.SIZE &&
                user.DATASTORE_QUOTA.DATASTORE.SIZE_USED
              ){
                var datastore = QuotaWidgets.quotaInfo(
                  user.DATASTORE_QUOTA.DATASTORE.SIZE_USED,
                  user.DATASTORE_QUOTA.DATASTORE.SIZE);
                $("#provision_dashboard_datastore_percentage").html(datastore["percentage"]);
                $("#provision_dashboard_datastore_str").html(datastore["str"]);
                $("#provision_dashboard_datastore_meter").val(datastore["percentage"]);
              }
            } else {
              $("#provision_quotas_dashboard").hide();
            }
          }
        });
      }
      if (Config.provision.dashboard.isEnabled("groupquotas")) {
        $("#provision_dashboard").append(TemplateDashboardGroupQuotas());
        OpenNebula.Group.show({
          data : {
              id: "-1"
          },
          success: function(request,group_json){
            var group = group_json.GROUP;
            QuotaWidgets.initEmptyQuotas(group);
            if (group && group.VM_QUOTA && !$.isEmptyObject(group.VM_QUOTA)){
                var default_group_quotas = QuotaDefaults.default_quotas(group.DEFAULT_GROUP_QUOTAS);
                var vms = QuotaWidgets.quotaInfo(
                  group.VM_QUOTA.VM.RUNNING_VMS_USED,
                  group.VM_QUOTA.VM.RUNNING_VMS,
                  default_group_quotas.VM_QUOTA.VM.VMS);
                $("#provision_dashboard_group_rvms_percentage").html(vms["percentage"]);
                $("#provision_dashboard_group_rvms_str").html(vms["str"]);
                $("#provision_dashboard_group_rvms_meter").val(vms["percentage"]);
                var memory = QuotaWidgets.quotaMBInfo(
                    group.VM_QUOTA.VM.MEMORY_USED,
                    group.VM_QUOTA.VM.MEMORY,
                    default_group_quotas.VM_QUOTA.VM.MEMORY);
                $("#provision_dashboard_group_memory_percentage").html(memory["percentage"]);
                $("#provision_dashboard_group_memory_str").html(memory["str"]);
                $("#provision_dashboard_group_memory_meter").val(memory["percentage"]);
                var cpu = QuotaWidgets.quotaFloatInfo(
                    group.VM_QUOTA.VM.CPU_USED,
                    group.VM_QUOTA.VM.CPU,
                    default_group_quotas.VM_QUOTA.VM.CPU);
                $("#provision_dashboard_group_cpu_percentage").html(cpu["percentage"]);
                $("#provision_dashboard_group_cpu_str").html(cpu["str"]);
                $("#provision_dashboard_group_cpu_meter").val(cpu["percentage"]);
            }
          }
        });
      }
    }
    function show_provision_create_vm() {
      OpenNebula.Action.clear_cache("VMTEMPLATE");
      ProvisionTemplatesList.updateDatatable(provision_vm_instantiate_templates_datatable);
      $("#provision_vm_instantiate_templates_owner_filter").val("all").change();
      $("#provision_vm_instantiate_template_search").val("").trigger("input");
      $(".provision_accordion_template .selected_template").hide();
      $(".provision_accordion_template .select_template").show();
      $("#provision_create_vm .provision_capacity_selector").html("");
      $("#provision_create_vm .provision_disk_selector").html("");
      $("#provision_create_vm .provision_disk_selector").removeData("template_json");
      $("#provision_create_vm .provision_network_selector").html("");
      $("#provision_create_vm .provision_vmgroup_selector").html("");
      $("#provision_create_vm .provision_ds_selector").html("");
      $("#provision_create_vm .provision_add_vmgroup").show();
      $("#provision_create_vm .provision_vmgroup").hide();
      $("#provision_create_vm .provision_ds").hide();
      $("#provision_create_vm .provision_custom_attributes_selector").html("");
      $("#provision_create_vm li:not(.is-active) a[href='#provision_dd_template']").trigger("click");
      $("#provision_create_vm .total_cost_div").hide();
      $("#provision_create_vm .alert-box-error").hide();
      $(".section_content").hide();
      $("#provision_create_vm").fadeIn();
    }
    function show_provision_create_flow() {
      update_provision_flow_templates_datatable(provision_flow_templates_datatable);
      var context = $("#provision_create_flow");
      $("#provision_customize_flow_template", context).hide();
      $("#provision_customize_flow_template", context).html("");
      $(".provision_network_selector", context).html("");
      $(".provision_vmgroup_selector", context).html("");
      $(".provision_add_vmgroup", context).show();
      $(".provision_vmgroup", context).hide();
      //$(".provision_ds", context).hide();
      $(".provision_custom_attributes_selector", context).html("");
      $(".provision_accordion_flow_template .selected_template", context).hide();
      $(".provision_accordion_flow_template .select_template", context).show();
      $("li:not(.is-active) a[href='#provision_dd_flow_template']", context).trigger("click");
      $(".total_cost_div", context).hide();
      $(".alert-box-error", context).hide();
      $(".section_content").hide();
      $("#provision_create_flow").fadeIn();
    }
    function update_provision_flow_templates_datatable(datatable, timeout) {
      datatable.html("<div class=\"text-center\">"+
        "<span class=\"fa-stack fa-5x\">"+
          "<i class=\"fas fa-cloud fa-stack-2x\"></i>"+
          "<i class=\"fa  fa-spinner fa-spin fa-stack-1x fa-inverse\"></i>"+
        "</span>"+
        "<br>"+
        "<br>"+
        "<span>"+
        "</span>"+
        "</div>");
      setTimeout( function(){
        OpenNebula.ServiceTemplate.list({
          timeout: true,
          success: function (request, item_list){
            datatable.fnClearTable(true);
            if (item_list.length == 0) {
              datatable.html("<div class=\"text-center\">"+
                "<span class=\"fa-stack fa-5x\">"+
                  "<i class=\"fas fa-cloud fa-stack-2x\"></i>"+
                  "<i class=\"fas fa-info-circle fa-stack-1x fa-inverse\"></i>"+
                "</span>"+
                "<br>"+
                "<br>"+
                "<span>"+
                  Locale.tr("There are no templates available")+
                "</span>"+
                "</div>");
            } else {
              datatable.fnAddData(item_list);
            }
            LabelsUtils.clearLabelsFilter(datatable, FLOW_TEMPLATE_LABELS_COLUMN);
            var context = $(".labels-dropdown", datatable.closest("#provisionFlowInstantiateTemplatesRow"));
            context.html("");
            LabelsUtils.insertLabelsMenu({
              "context": context,
              "dataTable": datatable,
              "labelsColumn": FLOW_TEMPLATE_LABELS_COLUMN,
              "labelsPath": "DOCUMENT.TEMPLATE.LABELS",
              "placeholder": Locale.tr("No labels defined")
            });
          },
          error: Notifier.onError
        });
      }, timeout);
    }
    var _panels = [
      require("./vms-tab/panels/info"),
      require("./vms-tab/panels/capacity"),
      require("./vms-tab/panels/storage"),
      require("./vms-tab/panels/network"),
      require("./vms-tab/panels/snapshots"),
      require("./vms-tab/panels/placement"),
      require("./vms-tab/panels/actions"),
      require("./vms-tab/panels/conf"),
      require("./vms-tab/panels/template"),
      require("./vms-tab/panels/log")
    ];
    var _dialogs = [
      //require('./vms-tab/dialogs/deploy'),
      //require('./vms-tab/dialogs/migrate'),
      require("./vms-tab/dialogs/resize"),
      require("./vms-tab/dialogs/disk-resize"),
      require("./vms-tab/dialogs/attach-disk"),
      require("./vms-tab/dialogs/disk-snapshot"),
      require("./vms-tab/dialogs/disk-saveas"),
      require("./vms-tab/dialogs/disk-snapshot-rename"),
      require("./vms-tab/dialogs/attach-nic"),
      require("./vms-tab/dialogs/revert"),
      require("./vms-tab/dialogs/snapshot"),
      require("./vms-tab/dialogs/vnc"),
      require("./vms-tab/dialogs/spice"),
      //require('./vms-tab/dialogs/saveas-template')
      require("./users-tab/dialogs/login-token")
    ];
    var Actions = require("./vms-tab/actions");
    var Tab = {
      tabId: TAB_ID,
      list_header: "",
      actions: $.extend(povision_actions, Actions),
      content: TemplateContent(),
      setup: _setup,
      panels: _panels,
      dialogs: _dialogs
    };
    return Tab;
    function _setup() {
      $(document).ready(function(){
        var that = this;
        var tab_name = "provision-tab";
        var tab = $("#"+tab_name);
        if (Config.isTabEnabled(tab_name)) {
          $(".sunstone-content").addClass("large-centered small-centered");
          $("#footer").removeClass("right");
          $("#footer").addClass("large-centered small-centered");
          ProvisionVmsList.generate($(".provision_vms_list_section"), {active: true});
          if (Config.isProvisionTabEnabled("provision-tab", "templates")) {
            ProvisionTemplatesList.generate($(".provision_templates_list_section"), {active: true});
          }
          // TODO check if active
          ProvisionFlowsList.generate($(".provision_flows_list_section"), {active: true});
          //
          // Dashboard
          //
          $(".configuration").on("click", function(){
            $("li", ".provision-header").removeClass("active");
          });
          show_provision_dashboard();
          $(".provision-header").on("click", "a", function(){
            Sunstone.showTab(TAB_ID);
            $("li", ".provision-header").removeClass("active");
            $(this).closest("li").addClass("active");
          });
          $(document).on("click", ".provision_dashboard_button", function(){
            OpenNebula.Action.clear_cache("VM");
            show_provision_dashboard();
          });
          $(document).on("click", ".provision_vms_list_button", function(){
            OpenNebula.Action.clear_cache("VM");
            ProvisionVmsList.show(0);
          });
          $(document).on("click", ".provision_templates_list_button", function(){
            OpenNebula.Action.clear_cache("VMTEMPLATE");
            ProvisionTemplatesList.show(0);
          });
          $(document).on("click", ".provision_flows_list_button", function(){
            OpenNebula.Action.clear_cache("SERVICE");
            ProvisionFlowsList.show(0);
          });
          //
          // Create VM
          //
          function appendTemplateCard(aData, tableID) {
            var data = aData.VMTEMPLATE;
            var logo;
            if (data.TEMPLATE.LOGO) {
              logo = "<span class=\"provision-logo\">"+
                  "<img  src=\""+data.TEMPLATE.LOGO+"\">"+
                "</span>";
            } else {
              logo = "<span>"+
                "<i class=\"fas fa-fw fa-file-alt\"/>"+
              "</span>";
            }
            var owner;
            if (data.UID == config.user_id){
              owner = Locale.tr("mine");
            } else if (data.GID == config.user_gid){
              owner = Locale.tr("group");
            } else {
              owner = Locale.tr("system");
            }
            var li = $("<div class=\"column\">" +
                "<ul class=\"provision-pricing-table only-one hoverable menu vertical text-center\" opennebula_id=\""+data.ID+"\">"+
                  "<li class=\"provision-title\" title=\""+TemplateUtils.htmlEncode(data.NAME)+"\">"+
                    "<a href=\"\">" + TemplateUtils.htmlEncode(data.NAME) + "</a>" +
                  "</li>"+
                  "<li class=\"provision-bullet-item\">"+
                    logo +
                  "</li>"+
                  "<li class=\"provision-bullet-item\">"+
                    (TemplateUtils.htmlEncode(data.TEMPLATE.DESCRIPTION) || "...")+
                  "</li>"+
                  "<li class=\"provision-bullet-item-last text-left\">"+
                    "<span>"+
                      "<i class=\"fas fa-fw fa-lg fa-user\"/> "+
                      owner+
                    "</span>"+
                  "</li>"+
                "</ul>"+
              "</div>").appendTo($("#"+tableID+"_ul"));
            $(".provision-pricing-table", li).data("opennebula", aData);
          }
          function initializeTemplateCards(context, tableID) {
            // create a thumbs container if it doesn't exist. put it in the dataTables_scrollbody div
            if (context.$("tr", {"filter": "applied"} ).length == 0) {
              context.html("<div class=\"text-center\">"+
                "<span class=\"fa-stack fa-5x\">"+
                  "<i class=\"fas fa-cloud fa-stack-2x\"></i>"+
                  "<i class=\"fas fa-info-circle fa-stack-1x fa-inverse\"></i>"+
                "</span>"+
                "<br>"+
                "<br>"+
                "<span>"+
                  Locale.tr("There are no templates available")+
                "</span>"+
                "</div>");
            } else {
              $("#"+tableID+"_table").html(
                "<div id=\""+tableID+"_ul\" class=\"row large-up-4 medium-up-3 small-up-1\"></div>");
            }
            return true;
          }
          provision_vm_instantiate_templates_datatable = $("#provision_vm_instantiate_templates_table").dataTable({
            "iDisplayLength": 6,
            "bAutoWidth": false,
            "sDom" : "<\"H\">t<\"F\"lp>",
            "aLengthMenu": Sunstone.getPaginate(),
            "aoColumnDefs": [
                { "bVisible": false, "aTargets": ["all"]}
            ],
            "aoColumns": [
                { "mDataProp": "VMTEMPLATE.ID" },
                { "mDataProp": "VMTEMPLATE.NAME" },
                { "mDataProp": function ( data, type, val ) {
                    var owner;
                    if (data.VMTEMPLATE.UID == config.user_id){
                      owner = "mine";
                    } else if (data.VMTEMPLATE.GID == config.user_gid){
                      owner = "group";
                    } else {
                      owner = "system";
                    }
                    if (type === "filter") {
                      // In order to make "mine" search work
                      if(owner == "mine"){
                        return Locale.tr("mine");
                      } else if(owner == "group"){
                        return Locale.tr("group");
                      } else if(owner == "system"){
                        return Locale.tr("system");
                      }
                    }
                    return owner;
                  }
                },
                { "mDataProp": "VMTEMPLATE.TEMPLATE.LABELS", "sDefaultContent" : "-"  }
            ],
            "fnPreDrawCallback": function (oSettings) {
              initializeTemplateCards(this, "provision_vm_instantiate_templates");
            },
            "fnRowCallback": function( nRow, aData, iDisplayIndex, iDisplayIndexFull ) {
              appendTemplateCard(aData, "provision_vm_instantiate_templates");
              return nRow;
            },
            "fnDrawCallback": function(oSettings) {
            }
          });
          $("#provision_vm_instantiate_template_search").on("input",function(){
            provision_vm_instantiate_templates_datatable.fnFilter( $(this).val() );
          });
          $("#provision_vm_instantiate_templates_owner_filter").on("change", function(){
            switch($(this).val()){
              case "all":
                provision_vm_instantiate_templates_datatable.fnFilter("", 2);
                break;
              default:
                provision_vm_instantiate_templates_datatable.fnFilter("^" + $(this).val() + "$", 2, true, false);
                break;
            }
          });
          $("#provision_create_template_refresh_button").click(function(){
            OpenNebula.Action.clear_cache("VMTEMPLATE");
            ProvisionTemplatesList.updateDatatable(provision_vm_instantiate_templates_datatable);
          });

          $("#provision_create_vm input.instantiate_pers").on("change", function(){
            var create_vm_context = $("#provision_create_vm");

            var disksContext = $(".provision_disk_selector", create_vm_context);
            var template_json = disksContext.data("template_json");

            if (template_json != undefined &&
                Config.provision.create_vm.isEnabled("disk_resize")) {

              DisksResize.insert({
                template_json: template_json,
                disksContext: disksContext,
                force_persistent: $(this).prop("checked"),
                cost_callback: _calculateCost,
                uinput_mb: true
              });
            }
          });

          tab.on("click", "#provision_create_vm .provision_select_template .provision-pricing-table.only-one" , function(){
            var create_vm_context = $("#provision_create_vm");
            var that = this;

            that.template_base_json = {};

            if ($(this).hasClass("selected")){
              //$(".provision_disk_selector", create_vm_context).html("");
              //$(".provision_network_selector", create_vm_context).html("");
              //$(".provision_capacity_selector", create_vm_context).html("");
  //
              //$(".provision_accordion_template .selected_template").hide();
              //$(".provision_accordion_template .select_template").show();
            } else {
              var template_id = $(this).attr("opennebula_id");
              var template_json = $(this).data("opennebula");

              $(".provision_accordion_template .selected_template").show();
              $(".provision_accordion_template .select_template").hide();
              $(".provision_accordion_template .selected_template_name").html(TemplateUtils.htmlEncode(template_json.VMTEMPLATE.NAME));
              if (template_json.VMTEMPLATE.TEMPLATE.LOGO) {
                $(".provision_accordion_template .selected_template_logo").html("<img  src=\""+TemplateUtils.htmlEncode(template_json.VMTEMPLATE.TEMPLATE.LOGO)+"\">");
              } else {
                $(".provision_accordion_template .selected_template_logo").html("<i class=\"fas fa-file-alt fa-lg\"/> ");
              }

              $("#provision_create_vm .total_cost_div").hide();

              $(".provision_accordion_template a").first().trigger("click");

              $("#provision_create_vm .provision_vmgroup").show();
              $("#provision_create_vm .provision_ds").show();

              OpenNebula.Template.show({
                data : {
                  id: template_id,
                  extended: false
                },
                timeout: true,
                success: function (request, template_json) {
                  that.template_base_json= template_json;
                }
              });

              OpenNebula.Template.show({
                data : {
                  id: template_id,
                  extended: true
                },
                timeout: true,
                success: function (request, template_json) {
                  generate_provision_capacity_accordion(
                    $(".provision_capacity_selector", create_vm_context),
                    template_json.VMTEMPLATE);

                  var disksContext = $(".provision_disk_selector", create_vm_context);
                  disksContext.data("template_json", template_json);

                  if (Config.provision.create_vm.isEnabled("disk_resize")) {
                    var pers = $("input.instantiate_pers", create_vm_context).prop("checked");
                    if(pers == undefined){
                      pers = false;
                    }
                    DisksResize.insert({
                      template_base_json: that.template_base_json,
                      template_json: template_json,
                      disksContext: disksContext,
                      force_persistent: pers,
                      cost_callback: _calculateCost,
                      uinput_mb: true
                    });
                    if (Config.provision.dashboard.isEnabled("quotas") && user && user.VM_QUOTA && !$.isEmptyObject(user.VM_QUOTA)) {
                      $("#quotas-disks").show();
                      if (this.user.VM_QUOTA.VM.SYSTEM_DISK_SIZE === "-1" || this.user.VM_QUOTA.VM.SYSTEM_DISK_SIZE === "-2"){
                        $("#quotas-disks").text(Humanize.size(parseFloat(this.user.VM_QUOTA.VM.SYSTEM_DISK_SIZE_USED) * 1024) + " / " + "∞");
                      } else {
                        $("#quotas-disks").text(Humanize.size(parseFloat(this.user.VM_QUOTA.VM.SYSTEM_DISK_SIZE_USED) * 1024) + " / " + Humanize.size(parseFloat(this.user.VM_QUOTA.VM.SYSTEM_DISK_SIZE) * 1024));
                      }
                      $("input", disksContext).change();
                    }
                  } else {
                    disksContext.html("");
                  }

                  if (Config.provision.create_vm.isEnabled("network_select")) {
                    NicsSection.insert(template_json, create_vm_context,
                      { "forceIPv4": true,
                        "securityGroups": Config.isFeatureEnabled("secgroups")
                      });
                  } else {
                    $(".provision_network_selector", create_vm_context).html("");
                  }

                  if (Config.provision.create_vm.isEnabled("vmgroup_select")) {
                    $(".provision_vmgroup_selector", create_vm_context).html("");
                    $("#provision_create_vm .provision_add_vmgroup").show();
                    VMGroupSection.insert(template_json, $(".vmgroupContext", create_vm_context));
                  } else {
                    $(".provision_vmgroup_selector", create_vm_context).html("");
                    $(".provision_vmgroup", create_vm_context).hide();
                  }

                  if (Config.provision.create_vm.isEnabled("datastore_select")) {
                    $(".provision_ds_selector", create_vm_context).html("");
                    var options = {
                      "select": true,
                      "selectOptions": {
                        "multiple_choice": true
                      }
                    };
                    this.datastoresTable = new DatastoresTable("DatastoresTable" + UniqueId.id(), options);
                    $(".provision_ds_selector", create_vm_context).html(this.datastoresTable.dataTableHTML);
                    this.datastoresTable.initialize();
                    this.datastoresTable.filter("system", 10);
                    this.datastoresTable.refreshResourceTableSelect();
                    if(template_json.VMTEMPLATE.TEMPLATE.SCHED_DS_REQUIREMENTS){
                      var dsReqJSON = template_json.VMTEMPLATE.TEMPLATE.SCHED_DS_REQUIREMENTS;
                      var dsReq = TemplateUtils.escapeDoubleQuotes(dsReqJSON);
                      var ds_id_regexp = /(\s|\||\b)ID=\\"([0-9]+)\\"/g;
                      var ds = [];
                      while (match = ds_id_regexp.exec(dsReq)) {
                        ds.push(match[2]);
                      }
                      var selectedResources = {
                        ids : ds
                      };
                      this.datastoresTable.selectResourceTableSelect(selectedResources);
                      $(".provision_ds_selector", create_vm_context).data("dsTable", this.datastoresTable);
                    }
                  } else {
                    $(".provision_ds_selector", create_vm_context).html("");
                    $(".provision_ds", create_vm_context).hide();
                  }

                  if (template_json.VMTEMPLATE.TEMPLATE.USER_INPUTS) {
                    UserInputs.vmTemplateInsert(
                        $(".provision_custom_attributes_selector", create_vm_context),
                        template_json,
                        {text_header: "<i class=\"fas fa-gears\"></i> "+Locale.tr("Custom Attributes")});

                  } else {
                    $(".provision_custom_attributes_selector", create_vm_context).html("");
                  }

                },
                error: function(request, error_json, container) {
                  Notifier.onError(request, error_json, container);
                }
              });

              return false;
            }
          });

          tab.on("click", "#provision_create_vm .provision-pricing-table.only-one" , function(){
            if ($(this).hasClass("selected")){
              //$(this).removeClass("selected");
            } else {
              $(".provision-pricing-table", $(this).parents(".dataTable")).removeClass("selected");
              $(this).addClass("selected");
            }

            return false;
          });

          $("#provision_create_vm").submit(function(){
            var context = $(this);

            var template_id = $(".provision_select_template .selected", context).attr("opennebula_id");
            if (!template_id) {
              $(".alert-box-error", context).fadeIn().html(Locale.tr("You must select at least a template configuration"));
              return false;
            }

            var vm_name = $("#vm_name", context).val();
            var nics = NicsSection.retrieve(context);

            var disks = DisksResize.retrieve($(".provision_disk_selector", context));

            var extra_info = {
              "vm_name" : vm_name,
              "template": {
              }
            };

            var vmgroup = VMGroupSection.retrieve($(".vmgroupContext", context));

            if(vmgroup){
              $.extend(extra_info.template, vmgroup);
            }

            var dsTable = $(".provision_ds_selector", context).data("dsTable");
            if(dsTable != undefined){
              var req_string = [];
              var ds = dsTable.retrieveResourceTableSelect();
              if(ds){
                $.each(ds, function(index, dsId) {
                  req_string.push("ID=\"" + dsId + "\"");
                });
                req_string = req_string.join(" | ");
                req_string = TemplateUtils.escapeDoubleQuotes(req_string);
                extra_info.template.SCHED_DS_REQUIREMENTS = req_string;
              }
            }

            extra_info.template.NIC = nics;

            if (disks.length > 0) {
              extra_info.template.DISK = disks;
            }

            if (Config.provision.create_vm.isEnabled("capacity_select")){
              capacityContext = $(".provision_capacity_selector", context);
              $.extend(extra_info.template, CapacityInputs.retrieveChanges(capacityContext));
            }

            var user_inputs_values = WizardFields.retrieve($(".provision_custom_attributes_selector", $(this)));

            if (!$.isEmptyObject(user_inputs_values)) {
               $.extend(extra_info.template, user_inputs_values);
            }

            var topology = {}

            if (extra_info && extra_info.template && extra_info.template.CORES){
              topology.CORES = extra_info["template"]["CORES"];
              topology.SOCKETS = parseInt(extra_info["template"]["VCPU"]) / parseInt(extra_info["template"]["CORES"]);
              topology.THREADS = 1;
              delete extra_info["template"]["CORES"];
            }
      
            if (!$.isEmptyObject(topology)){
              extra_info.template.TOPOLOGY = topology;
            }

            var action;

            if ($("input.instantiate_pers", context).prop("checked")){
              action = "instantiate_persistent";
            }else{
              action = "instantiate";
            }

            Sunstone.runAction("Provision."+action, template_id, extra_info);
            return false;
          });

          $(document).on("click", ".provision_create_vm_button", function(){
            show_provision_create_vm();
          });

          Foundation.reflow($("#provision_create_vm"));


          //
          // Create FLOW
          //

          provision_flow_templates_datatable = $("#provision_flow_templates_table").dataTable({
            "iDisplayLength": 6,
            "bAutoWidth": false,
            "sDom" : "<\"H\">t<\"F\"lp>",
            "aLengthMenu": Sunstone.getPaginate(),
            "aaSorting"  : [[1, "asc"]],
            "aoColumnDefs": [
                { "bVisible": false, "aTargets": ["all"]}
            ],
            "aoColumns": [
                { "mDataProp": "DOCUMENT.ID" },
                { "mDataProp": "DOCUMENT.NAME" },
                { "mDataProp": "DOCUMENT.TEMPLATE.LABELS", "sDefaultContent" : "-"  }
            ],
            "fnPreDrawCallback": function (oSettings) {
              // create a thumbs container if it doesn't exist. put it in the dataTables_scrollbody div
              if (this.$("tr", {"filter": "applied"} ).length == 0) {
                this.html("<div class=\"text-center\">"+
                  "<span class=\"fa-stack fa-5x\">"+
                    "<i class=\"fas fa-cloud fa-stack-2x\"></i>"+
                    "<i class=\"fas fa-info-circle fa-stack-1x fa-inverse\"></i>"+
                  "</span>"+
                  "<br>"+
                  "<br>"+
                  "<span>"+
                    Locale.tr("There are no templates available")+
                  "</span>"+
                  "</div>");
              } else {
                $("#provision_flow_templates_table").html(
                  "<div id=\"provision_flow_templates_ul\" class=\"row large-up-4 medium-up-3 small-up-1\"></div>");
              }

              return true;
            },
            "fnRowCallback": function( nRow, aData, iDisplayIndex, iDisplayIndexFull ) {
              var data = aData.DOCUMENT;
              var body = data.TEMPLATE.BODY;
              var logo;

              var roles_li = "";
              if (body.roles) {
                $.each(body.roles, function(index, role) {
                  roles_li +=
                    "<li class=\"provision-bullet-item\">"+
                      "<i class=\"fas fa-fw fa-cube\"/> "+
                      role.name+
                      "<span class=\"right\">"+role.cardinality+" VMs</span>"+
                    "</li>";
                });
              }

              var li = $("<div class=\"column\">"+
                  "<ul class=\"provision-pricing-table hoverable only-one menu vertical\" opennebula_id=\""+data.ID+"\">"+
                    "<li class=\"provision-title\" title=\""+TemplateUtils.htmlEncode(data.NAME)+"\">"+
                      "<a href=\"\">" +
                        TemplateUtils.htmlEncode(data.NAME) +
                      "</a>" +
                    "</li>"+
                    roles_li +
                    "<li class=\"provision-bullet-item\">"+
                      (TemplateUtils.htmlEncode(data.TEMPLATE.DESCRIPTION) || "")+
                    "</li>"+
                  "</ul>"+
                "</div>").appendTo($("#provision_flow_templates_ul"));

              $(".provision-pricing-table", li).data("opennebula", aData);

              return nRow;
            }
          });

          $("#provision_create_flow_template_search").on("input",function(){
            provision_flow_templates_datatable.fnFilter( $(this).val() );
          });

          $("#provision_create_flow_template_refresh_button").click(function(){
            OpenNebula.Action.clear_cache("SERVICE_TEMPLATE");
            update_provision_flow_templates_datatable(provision_flow_templates_datatable);

          });

          tab.off("click", ".provision_select_flow_template .provision-pricing-table.only-one")
          .on("click", ".provision_select_flow_template .provision-pricing-table.only-one" , function(){
            var context = $("#provision_create_flow");

            if ($(this).hasClass("selected")){
              //$("#provision_customize_flow_template").hide();
              //$("#provision_customize_flow_template").html("");
              //$(".provision_network_selector", context).html("")
              //$(".provision_custom_attributes_selector", context).html("")
  //
              //$(".provision_accordion_flow_template .selected_template").hide();
              //$(".provision_accordion_flow_template .select_template").show();
            } else {
              $("#provision_customize_flow_template").show();
              $("#provision_customize_flow_template").html("");

              var data = $(this).data("opennebula");
              var body = data.DOCUMENT.TEMPLATE.BODY;

              $("#provision_create_flow .total_cost_div").hide();

              $(".provision_accordion_flow_template .selected_template").show();
              $(".provision_accordion_flow_template .select_template").hide();
              $(".provision_accordion_flow_template .selected_template_name").html(TemplateUtils.htmlEncode(data.DOCUMENT.NAME));
              $(".provision_accordion_flow_template .selected_template_logo").html("<i class=\"fas fa-cubes fa-lg\"/> ");
              $(".provision_accordion_flow_template a").first().trigger("click");

              var context = $("#provision_create_flow");

              if (body.custom_attrs || body.networks) {
                UserInputs.serviceTemplateInsert(
                  $(".provision_network_selector", context),
                  data,
                  { select_networks: Config.isFeatureEnabled("show_vnet_instantiate_flow") }
                );
              } else {
                $(".provision_network_selector", context).html("");
                $(".provision_custom_attributes_selector", context).html("");
              }

              $.each(body.roles, function(index, role){
                var context = $(
                  "<div id=\"provision_create_flow_role_"+index+"\" class=\"left medium-6 columns provision_create_flow_role\">"+
                    "<h5>"+
                      "<i class=\"fas fa-cube fa-lg\"></i> "+
                      TemplateUtils.htmlEncode(role.name)+
                    "</h5>"+
                    "<div class=\"row\">"+
                      "<div class=\"provision_cardinality_selector large-12 columns\">"+
                      "</div>"+
                    "</div>"+
                    "<div class=\"row\">"+
                      "<div class=\"provision_custom_attributes_selector large-12 columns\">"+
                      "</div>"+
                    "</div>"+
                "</div>").appendTo($("#provision_customize_flow_template"));

                context.data("opennebula", role);

                var template_id = role.vm_template;
                var role_html_id = "#provision_create_flow_role_"+index;

                OpenNebula.Template.show({
                  data : {
                      id: template_id,
                      extended: true
                  },
                  success: function(request,template_json){
                    var role_context = $(role_html_id);

                    generate_cardinality_selector(
                      $(".provision_cardinality_selector", context),
                      role,
                      template_json);

                    if (template_json.VMTEMPLATE.TEMPLATE.USER_INPUTS) {
                      UserInputs.vmTemplateInsert(
                          $(".provision_custom_attributes_selector", role_context),
                          template_json,
                          {text_header: "<i class=\"fas fa-gears\"></i> "+Locale.tr("Custom Attributes")});

                    } else {
                      $(".provision_custom_attributes_selector", role_context).html("");
                    }
                  }
                });


              });

              return false;
            }
          });

          tab.on("click", "#provision_create_flow .provision-pricing-table.only-one" , function(){
            if ($(this).hasClass("selected")){
              //$(this).removeClass("selected");
            } else {
              $(".provision-pricing-table", $(this).parents(".dataTable")).removeClass("selected");
              $(this).addClass("selected");
            }

            return false;
          });

          $("#provision_create_flow").submit(function(){
            var context = $(this);
            var flow_name = $("#flow_name", context).val();
            var template_id = $(".provision_select_flow_template .selected", context).attr("opennebula_id");

            if (!template_id) {
              $(".alert-box-error", context).fadeIn().html(Locale.tr("You must select at least a template configuration"));
              return false;
            }

            var extra_info = ServiceUtils.getExtraInfo(context, Config.isFeatureEnabled("show_vnet_instantiate_flow"));

            $(".provision_create_flow_role", context).each(function(){
              var user_inputs_values = WizardFields.retrieve($(".provision_custom_attributes_selector", $(this)));

              var role_template = $(this).data("opennebula");

              var cardinality = WizardFields.retrieve( $(".provision_cardinality_selector", $(this)) )["cardinality"];

              extra_info.merge_template.roles.push($.extend(role_template, {
                "cardinality": cardinality,
                "user_inputs_values": user_inputs_values
              }));
            });

            if (flow_name){
              extra_info["merge_template"]["name"] = flow_name;
            }

            Sunstone.runAction("Provision.Flow.instantiate", template_id, extra_info);
            return false;
          });

          $(".provision_create_flow_button").on("click", function(){
            show_provision_create_flow();
          });

          Foundation.reflow($("#provision_create_flow"));
        }
      });
    }

  });
