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
  var Locale = require('utils/locale');
  var Config = require('sunstone-config');
  var Sunstone = require('sunstone');
  var OpenNebula = require('opennebula');
  var QuotaWidgets = require('utils/quotas/quota-widgets');
  var QuotaDefaults = require('utils/quotas/quota-defaults');

  var TemplateDashboard = require('hbs!./dashboard-tab/html');

  var VMS_TAB_ID = require('tabs/vms-tab/tabId');
  var HOSTS_TAB_ID = require('tabs/hosts-tab/tabId');
  var USERS_TAB_ID = require('tabs/users-tab/tabId');
  var IMAGES_TAB_ID = require('tabs/images-tab/tabId');
  var VNETS_TAB_ID = require('tabs/vnets-tab/tabId');

  var VMS_CREATE_FORM_PANEL_ID = require('tabs/vms-tab/form-panels/create/formPanelId');
  var HOSTS_CREATE_FORM_PANEL_ID = require('tabs/hosts-tab/form-panels/create/formPanelId');
  var USERS_CREATE_FORM_PANEL_ID = require('tabs/users-tab/form-panels/create/formPanelId');
  var IMAGES_CREATE_FORM_PANEL_ID = require('tabs/images-tab/form-panels/create/formPanelId');
  var VNETS_CREATE_FORM_PANEL_ID = require('tabs/vnets-tab/form-panels/create/formPanelId');

  var TAB_ID = require('./dashboard-tab/tabId');

  var _initialized = false;
  var _activeWidgets = [];
  var _widgets = {
    'storage': {
      'html': require('hbs!./dashboard-tab/storage'),
      'onShow': function() {
        Sunstone.runAction("Image.list");
      }
    },
    'users': {
      'html': require('hbs!./dashboard-tab/users'),
      'onShow': function() {
        Sunstone.runAction("User.list");
        Sunstone.runAction("Group.list");

        var end_time = -1; // today
        var start_time =  Math.floor(new Date().getTime() / 1000);
        start_time = start_time - 604800; // 604800 = 7 days = 7*24*60*60

        var options = {
          "start_time": start_time,
          "end_time": end_time
        }

        var no_table = true;
        $("#acct_cpu_graph, #acct_mem_graph, #acct_disk_graph", "#dashboard_user_accounting").html('<span  id="provision_dashboard_total" style="font-size:80px">'+
          '<i class="fas fa-spinner fa-spin"></i>'+
        '</span>')
      }
    },
    'network': {
      'html': require('hbs!./dashboard-tab/network'),
      'onShow': function() {
        Sunstone.runAction("Network.list");
      }
    },
    'hosts': {
      'html': require('hbs!./dashboard-tab/hosts'),
      'onShow': function() {
        Sunstone.runAction("Host.list");
        Sunstone.runAction("Cluster.list");
      }
    },
    'vms': {
      'html': require('hbs!./dashboard-tab/vms'),
      'onShow': function() {
        Sunstone.runAction("VM.list");
      }
    },
    'groupquotas': {
      'html': require('hbs!./provision-tab/dashboard/html/group-quotas'),
      'onShow': function() {
        OpenNebula.Group.show({
          data : {
              id: "-1"
          },
          success: function(request,group_json){
            var group = group_json.GROUP;

            QuotaWidgets.initEmptyQuotas(group);

            if (!$.isEmptyObject(group.VM_QUOTA)){
                var default_group_quotas = QuotaDefaults.default_quotas(group.DEFAULT_GROUP_QUOTAS);

                var vms = QuotaWidgets.quotaInfo(
                  group.VM_QUOTA.VM.RUNNING_VMS_USED,
                  group.VM_QUOTA.VM.RUNNING_VMS,
                  default_group_quotas.VM_QUOTA.VM.VMS);

                $("#"+TAB_ID+" #provision_dashboard_group_rvms_percentage").html(vms["percentage"]);
                $("#"+TAB_ID+" #provision_dashboard_group_rvms_str").html(vms["str"]);
                $("#"+TAB_ID+" #provision_dashboard_group_rvms_meter").css("width", vms["percentage"]+"%");

                var memory = QuotaWidgets.quotaMBInfo(
                    group.VM_QUOTA.VM.MEMORY_USED,
                    group.VM_QUOTA.VM.MEMORY,
                    default_group_quotas.VM_QUOTA.VM.MEMORY);

                $("#"+TAB_ID+" #provision_dashboard_group_memory_percentage").html(memory["percentage"]);
                $("#"+TAB_ID+" #provision_dashboard_group_memory_str").html(memory["str"]);
                $("#"+TAB_ID+" #provision_dashboard_group_memory_meter").css("width", memory["percentage"]+"%");

                var cpu = QuotaWidgets.quotaFloatInfo(
                    group.VM_QUOTA.VM.CPU_USED,
                    group.VM_QUOTA.VM.CPU,
                    default_group_quotas.VM_QUOTA.VM.CPU);

                $("#"+TAB_ID+" #provision_dashboard_group_cpu_percentage").html(cpu["percentage"]);
                $("#"+TAB_ID+" #provision_dashboard_group_cpu_str").html(cpu["str"]);
                $("#"+TAB_ID+" #provision_dashboard_group_cpu_meter").css("width", cpu["percentage"]+"%");
            }
          }
        });
      }
    },
    'quotas': {
      'html': require('hbs!./provision-tab/dashboard/html/quotas'),
      'onShow': function() {
        OpenNebula.User.show({
          data : {
              id: "-1"
          },
          success: function(request,user_json){
            var user = user_json.USER;

            QuotaWidgets.initEmptyQuotas(user);

            if (!$.isEmptyObject(user.VM_QUOTA)){
                var default_user_quotas = QuotaDefaults.default_quotas(user.DEFAULT_USER_QUOTAS);

                var vms = QuotaWidgets.quotaInfo(
                  user.VM_QUOTA.VM.RUNNING_VMS_USED,
                  user.VM_QUOTA.VM.VMS,
                  default_user_quotas.VM_QUOTA.VM.VMS);

                $("#"+TAB_ID+" #provision_dashboard_rvms_percentage").html(vms["percentage"]);
                $("#"+TAB_ID+" #provision_dashboard_rvms_str").html(vms["str"]);
                $("#"+TAB_ID+" #provision_dashboard_rvms_meter").css("width", vms["percentage"]+"%");

                var memory = QuotaWidgets.quotaMBInfo(
                    user.VM_QUOTA.VM.MEMORY_USED,
                    user.VM_QUOTA.VM.MEMORY,
                    default_user_quotas.VM_QUOTA.VM.MEMORY);

                $("#"+TAB_ID+" #provision_dashboard_memory_percentage").html(memory["percentage"]);
                $("#"+TAB_ID+" #provision_dashboard_memory_str").html(memory["str"]);
                $("#"+TAB_ID+" #provision_dashboard_memory_meter").css("width", memory["percentage"]+"%");

                var cpu = QuotaWidgets.quotaFloatInfo(
                    user.VM_QUOTA.VM.CPU_USED,
                    user.VM_QUOTA.VM.CPU,
                    default_user_quotas.VM_QUOTA.VM.CPU);

                $("#"+TAB_ID+" #provision_dashboard_cpu_percentage").html(cpu["percentage"]);
                $("#"+TAB_ID+" #provision_dashboard_cpu_str").html(cpu["str"]);
                $("#"+TAB_ID+" #provision_dashboard_cpu_meter").css("width", cpu["percentage"]+"%");
            }
          }
        });
      }
    }
  }

  var _buttons = {
    "Dashboard.refresh" : {
      type: "action",
      layout: "refresh",
      alwaysActive: true
    }
  };

  var _actions = {
    "Dashboard.refresh" : {
      type: "custom",
      call: _onShow
    },
  }

  var Tab = {
    tabId: TAB_ID,
    resource: 'Dashboard',
    title: Locale.tr("Dashboard"),
    listHeader: Locale.tr("Dashboard"),
    actions: _actions,
    content: _html()
  };

  return Tab;

  function _html() {
    var widgetsTemplates = {
      'threePerRow': [],
      'twoPerRow': [],
      'onePerRow': [],
      'oneFooter': []
    }

    $.each(Config.dashboardWidgets('widgets_three_per_row'), function(id, widget) {
      _activeWidgets.push(widget);
      widgetsTemplates['threePerRow'].push(_widgets[widget].html());
    })

    $.each(Config.dashboardWidgets('widgets_two_per_row'), function(id, widget) {
      _activeWidgets.push(widget);
      widgetsTemplates['twoPerRow'].push(_widgets[widget].html());
    })

    $.each(Config.dashboardWidgets('widgets_one_per_row'), function(id, widget) {
      _activeWidgets.push(widget);
      widgetsTemplates['onePerRow'].push(_widgets[widget].html());
    })

    $.each(Config.dashboardWidgets('widgets_one_footer'), function(id, widget) {
      _activeWidgets.push(widget);
      widgetsTemplates['oneFooter'].push(_widgets[widget].html());
    });

    return TemplateDashboard(widgetsTemplates);
  }

  function _onShow() {
    if (!_initialized) {
      _setup();
    }

    $.each(_activeWidgets, function(id, widgetId) {
      if (_widgets[widgetId].onShow) {
        _widgets[widgetId].onShow();
      }
    });
  }

  function _setup() {
    _initialized = true;

    $(document).on("click", ".show_vms_tab", function(){
      Sunstone.showTab(VMS_TAB_ID);
      return false;
    })

    $(document).on("click", ".show_hosts_tab", function(){
      Sunstone.showTab(HOSTS_TAB_ID);
      return false;
    })

    $(document).on("click", ".show_users_tab", function(){
      Sunstone.showTab(USERS_TAB_ID);
      return false;
    })

    $(document).on("click", ".show_images_tab", function(){
      Sunstone.showTab(IMAGES_TAB_ID);
      return false;
    })

    $(document).on("click", ".show_vnets_tab", function(){
      Sunstone.showTab(VNETS_TAB_ID);
      return false;
    })

    $(document).on("click", ".show_create_vm", function(){
      Sunstone.showTab(VMS_TAB_ID);
      Sunstone.showFormPanel(VMS_TAB_ID, VMS_CREATE_FORM_PANEL_ID, "create");
      return false;
    })

    $(document).on("click", ".show_create_host", function(){
      Sunstone.showTab(HOSTS_TAB_ID);
      Sunstone.showFormPanel(HOSTS_TAB_ID, HOSTS_CREATE_FORM_PANEL_ID, "create");
      return false;
    })

    $(document).on("click", ".show_create_user", function(){
      Sunstone.showTab(USERS_TAB_ID);
      Sunstone.showFormPanel(USERS_TAB_ID, USERS_CREATE_FORM_PANEL_ID, "create");
      return false;
    })

    $(document).on("click", ".show_create_image", function(){
      Sunstone.showTab(IMAGES_TAB_ID);
      Sunstone.showFormPanel(IMAGES_TAB_ID, IMAGES_CREATE_FORM_PANEL_ID, "create");
      return false;
    })

    $(document).on("click", ".show_create_vnet", function(){
      Sunstone.showTab(VNETS_TAB_ID);
      Sunstone.showFormPanel(VNETS_TAB_ID, VNETS_CREATE_FORM_PANEL_ID, "create");
      return false;
    })
  }
});
