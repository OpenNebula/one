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
    var Accounting = require("utils/accounting");
    var Config = require("sunstone-config");
    var Notifier = require("utils/notifier");
    var OpenNebula = require("opennebula");
    var ProvisionFlowsList = require("../flows/list");
    var ProvisionTemplatesList = require("../templates/list");
    var ProvisionVmsList = require("../vms/list");
    var QuotaDefaults = require("utils/quotas/quota-defaults");
    var QuotaWidgets = require("utils/quotas/quota-widgets");
    var Sunstone = require("sunstone");

    // Templates
    var TemplateDashboardGroupQuotas = require("hbs!./html/group-quotas");
    var TemplateDashboardGroupVms = require("hbs!./html/group-vms");
    var TemplateDashboardQuotas = require("hbs!./html/quotas");
    var TemplateDashboardVms = require("hbs!./html/vms");

    // Constants
    var TAB_ID = require("../tabId");

    var _actions = {
        "setup": _setup
    }

    /**************************************************************************/
    // Functions
    /**************************************************************************/

    function get_dashboard_count(item_list, all=true){
      var total = 0;
      var running = 0;
      var off = 0;
      var error = 0;
      var deploying = 0;
      $.each(item_list, function(index, vm){
        if (all || vm.VM.UID == config["user_id"]) {
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
        }
      });

      return {
        "total": total,
        "running": running,
        "off": off,
        "error": error,
        "deploying": deploying
      }
    }

    function diferentsGroups(item_list = []){
        var groups = [];
        var rtn = groups.length;
        if(Array.isArray(item_list)){
            var finderElements = function (element){
            if(element && element.VM && element.VM.GNAME && !groups.includes(element.VM.GNAME)){
                groups.push(element.VM.GNAME);
            }
            }
            item_list.map(finderElements);
            rtn = groups.length;
        }
        return rtn;
    };

    function configure_dashboard_vms(){
      if (Config.provision.dashboard.isEnabled("vms")) {
        $("#provision_dashboard").append(TemplateDashboardVms());
        if(!Config.isFeatureEnabled("cloud_vm_create")){
          $(".provision_create_vm_button").hide();
        }
        OpenNebula.VM.list({
          timeout: true,
          success: function (request, item_list){
            var total = 0;
            var running = 0;
            var off = 0;
            var error = 0;
            var deploying = 0;

            var counts = get_dashboard_count(item_list, false);
            var context = $("#provision_vms_dashboard");
            $("#provision_dashboard_owner", context).html(counts.total);
            $("#provision_dashboard_group", context).html(diferentsGroups(item_list));
            $("#provision_dashboard_running", context).html(counts.running);
            $("#provision_dashboard_off", context).html(counts.off);
            $("#provision_dashboard_error", context).html(counts.error);
            $("#provision_dashboard_deploying", context).html(counts.deploying);
          },
          error: Notifier.onError
        });
      }
    }

    function configure_dashboard_groupvms(){
      if (Config.provision.dashboard.isEnabled("groupvms")) {
        $("#provision_dashboard").append(TemplateDashboardGroupVms());
        var start_time =  Math.floor(new Date().getTime() / 1000);
        var options = {
          "start_time": start_time - 604800, // ms to s: 604800 = 7 days = 7*24*60*60
          "end_time": -1 // Today
        };
        
        OpenNebula.VM.accounting({
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
            var counts = get_dashboard_count(item_list);
            var context = $("#provision_group_vms_dashboard");
            $("#provision_dashboard_group_total", context).html(counts.total);
            $("#provision_dashboard_group_running", context).html(counts.running);
            $("#provision_dashboard_group_off", context).html(counts.off);
            $("#provision_dashboard_group_error", context).html(counts.error);
            $("#provision_dashboard_group_deploying", context).html(counts.deploying);
          },
          error: Notifier.onError
        });
      }
    }

    function dashboard_quotas_running_vms(default_user_quotas, user){
      if(default_user_quotas.VM_QUOTA.VM.RUNNING_VMS){
        if(!Config.isFeatureEnabled("cloud_vm_create")){
          $(".provision_create_vm_button").hide();
        }
        var vms = QuotaWidgets.quotaInfo(
          user.VM_QUOTA.VM.RUNNING_VMS_USED,
          user.VM_QUOTA.VM.RUNNING_VMS,
          default_user_quotas.VM_QUOTA.VM.RUNNING_VMS);
        $("#provision_dashboard_rvms_percentage").html(vms["percentage"]);
        $("#provision_dashboard_rvms_str").html(vms["str"]);
        $("#provision_dashboard_rvms_meter").val(vms["percentage"]);
      }
    }

    function dashboard_quotas_memory(default_user_quotas, user){
      if(default_user_quotas.VM_QUOTA.VM.MEMORY){
        var memory = QuotaWidgets.quotaMBInfo(
            user.VM_QUOTA.VM.MEMORY_USED,
            user.VM_QUOTA.VM.MEMORY,
            default_user_quotas.VM_QUOTA.VM.MEMORY);
        $("#provision_dashboard_memory_percentage").html(memory["percentage"]);
        $("#provision_dashboard_memory_str").html(memory["str"]);
        $("#provision_dashboard_memory_meter").val(memory["percentage"]);
      }
    }

    function dashboard_quotas_cpu(default_user_quotas, user){
      if(default_user_quotas.VM_QUOTA.VM.CPU){
        var cpu = QuotaWidgets.quotaFloatInfo(
            user.VM_QUOTA.VM.CPU_USED,
            user.VM_QUOTA.VM.CPU,
            default_user_quotas.VM_QUOTA.VM.CPU);
        $("#provision_dashboard_cpu_percentage").html(cpu["percentage"]);
        $("#provision_dashboard_cpu_str").html(cpu["str"]);
        $("#provision_dashboard_cpu_meter").val(cpu["percentage"]);
      }
    }

    function dashboard_quotas_system_disk(default_user_quotas, user){
      if(default_user_quotas.VM_QUOTA.VM.SYSTEM_DISK_SIZE){
        var systemDisk = QuotaWidgets.quotaInfo(
            user.VM_QUOTA.VM.SYSTEM_DISK_SIZE_USED,
            user.VM_QUOTA.VM.SYSTEM_DISK_SIZE,
            default_user_quotas.VM_QUOTA.VM.SYSTEM_DISK_SIZE);
        $("#provision_dashboard_system_disk_percentage").html(systemDisk["percentage"]);
        $("#provision_dashboard_system_disk_str").html(systemDisk["str"]);
        $("#provision_dashboard_system_disk_meter").val(systemDisk["percentage"]);
      }
    }

    function dashboard_quotas_ip_leases(user){
      if(
        user &&
        user.NETWORK_QUOTA &&
        user.NETWORK_QUOTA.NETWORK
      ){
        var used = 0;
        var size = 0;
        var nets = user.NETWORK_QUOTA.NETWORK;
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
    }

    function dashboard_quotas_datastores(user){
      if(
        user &&
        user.DATASTORE_QUOTA &&
        user.DATASTORE_QUOTA.DATASTORE
      ){
        var used = 0;
        var size = 0;
        var datastores = user.DATASTORE_QUOTA.DATASTORE;
        if(Array.isArray(datastores)){
          datastores.map(function(datastore){
            if(datastore.SIZE_USED){
              used = used + parseInt(datastore.SIZE_USED,10);
            }
            if(datastore.SIZE){
              var sizeValue = parseInt(datastore.SIZE, 10)
              size = size + (sizeValue > 0 ?  sizeValue : 0)
            }
          });
        }else{
          used = parseInt(datastores.SIZE_USED,10);
          size = parseInt(datastores.SIZE,10);
        }
        var ds = QuotaWidgets.quotaMBInfo(used, size);
        $("#provision_dashboard_datastore_percentage").html(ds["percentage"]);
        $("#provision_dashboard_datastore_str").html(ds["str"]);
        $("#provision_dashboard_datastore_meter").val(ds["percentage"]);
      }
    }

    function configure_dashboard_quotas(){
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
              
              if(
                default_user_quotas &&
                default_user_quotas.VM_QUOTA &&
                default_user_quotas.VM_QUOTA.VM
              ){
                //running VMS
                dashboard_quotas_running_vms(default_user_quotas, user);
                //MEMORY
                dashboard_quotas_memory(default_user_quotas, user);
                //CPU
                dashboard_quotas_cpu(default_user_quotas, user);
                //SYSTEM DISK
                dashboard_quotas_system_disk(default_user_quotas, user);
              }
              
              //IP LEASES
              dashboard_quotas_ip_leases(user);
              //DATASTORE
              dashboard_quotas_datastores(user);              
            } else {
              $("#provision_quotas_dashboard").hide();
            }
          }
        });
      }
    }

    function configure_dashboard_groupquotas(){
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

    function show_provision_dashboard() {
      $(".section_content").hide();
      $("#provision_dashboard").fadeIn();
      $("#provision_dashboard").html("");
      configure_dashboard_vms();
      configure_dashboard_groupvms();
      configure_dashboard_quotas();
      configure_dashboard_groupquotas();
    }

    function _setup(){
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
    }

    return _actions;
})