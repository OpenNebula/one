/* -------------------------------------------------------------------------- */
/* Copyright 2002-2015, OpenNebula Project, OpenNebula Systems                */
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
//  require('foundation.core');
//  require('foundation.accordion');
  require('datatables.net');
  require('datatables.foundation');
  var Locale = require('utils/locale');
  var Config = require('sunstone-config');
  var OpenNebula = require('opennebula');
  var Sunstone = require('sunstone');
  var Notifier = require('utils/notifier');
  var QuotaWidgets = require('utils/quotas/quota-widgets');
  var QuotaDefaults = require('utils/quotas/quota-defaults');
  var Accounting = require('utils/accounting');
  var Showback = require('utils/showback');
  var Humanize = require('utils/humanize');
  var QuotaLimits = require('utils/quotas/quota-limits');
  var Graphs = require('utils/graphs');
  var RangeSlider = require('utils/range-slider');
  var DisksResize = require('utils/disks-resize');
  var NicsSection = require('utils/nics-section');
  var TemplateUtils = require('utils/template-utils');
  var LabelsUtils = require('utils/labels/utils');
  var WizardFields = require('utils/wizard-fields');
  var UserInputs = require('utils/user-inputs');
  var CapacityInputs = require('tabs/templates-tab/form-panels/create/wizard-tabs/general/capacity-inputs');

  var ProvisionVmsList = require('./provision-tab/vms/list');
  var ProvisionTemplatesList = require('./provision-tab/templates/list');
  var ProvisionFlowsList = require('./provision-tab/flows/list');

  // Templates
  var TemplateContent = require('hbs!./provision-tab/content');
  var TemplateHeader = require('hbs!./provision-tab/header');

  var TemplateDashboardQuotas = require('hbs!./provision-tab/dashboard/quotas');
  var TemplateDashboardVdcQuotas = require('hbs!./provision-tab/dashboard/vdc-quotas');
  var TemplateDashboardVms = require('hbs!./provision-tab/dashboard/vms');
  var TemplateDashboardVdcVms = require('hbs!./provision-tab/dashboard/vdc-vms');

  var TAB_ID = require('./provision-tab/tabId');
  var TEMPLATE_LABELS_COLUMN = 4;

  var povision_actions = {
    "Provision.Flow.instantiate" : {
      type: "single",
      call: OpenNebula.ServiceTemplate.instantiate,
      callback: function(){
        OpenNebula.Action.clear_cache("SERVICE");
        ProvisionFlowsList.show(0);
        var context = $("#provision_create_flow");
        $("#flow_name", context).val('');
        //$(".provision_selected_networks").html("");
        $(".provision-pricing-table", context).removeClass("selected");
      },
      error: Notifier.onError
    },

    "Provision.instantiate" : {
      type: "single",
      call: OpenNebula.Template.instantiate,
      callback: function(){
        OpenNebula.Action.clear_cache("VM");
        ProvisionVmsList.show(0);
        var context = $("#provision_create_vm");
        $("#vm_name", context).val('');
        $(".provision_selected_networks").html("");
        $(".provision-pricing-table", context).removeClass("selected");
        $(".alert-box-error", context).hide();

        $('#provision_vm_instantiate_templates_owner_filter').val('all').change();
        $('#provision_vm_instantiate_template_search').val('').trigger('input');
      },
      error: Notifier.onError
    }
  }

  //$(document).foundation();

  function generate_cardinality_selector(context, role_template, template_json) {
    context.off();
    var min_vms = (role_template.min_vms||1);
    var max_vms = (role_template.max_vms||20);

    context.html(
      '<br>'+
      '<div class="row">'+
        '<div class="large-12 large-centered columns">'+
          '<h3 class="subheader text-right">'+
            '<span class="left">'+
              '<i class="fa fa-th fa-lg"></i>&emsp;'+
              Locale.tr("Cardinality")+
            '</span>'+
          '</h3>'+
          '<br>'+
        '</div>'+
      '</div>'+
      '<br>'+
      '<br>'+
      '<div class="row">'+
        '<div class="large-12 columns">'+
          '<div class="row">'+
            '<div class="large-2 text-center columns">'+
              '<span class="cardinality_value" style="color: #777; font-size:40px">'+role_template.cardinality+'</span>'+
              '<br>'+
              '<span style="color: #999;">'+Locale.tr("VMs")+'</span>'+
            '</div>'+
            '<div class="large-6 columns">'+
              '<div class="cardinality_slider_div">'+
                '<span class="" style="color: #777;">'+Locale.tr("Change cardinality")+'</span>'+
                '<br>'+
                '<div class="range-slider radius cardinality_slider" data-slider data-options="start: 1; end: 50;">'+
                  '<span class="range-slider-handle"></span>'+
                  '<span class="range-slider-active-segment"></span>'+
                  '<input type="hidden">'+
                '</div>'+
                '<span class="left" style="color: #999;">'+min_vms+'</span>'+
                '<span class="right" style="color: #999;">'+max_vms+'</span>'+
              '</div>'+
              '<div class="cardinality_no_slider_div">'+
                '<br>'+
                '<br>'+
                '<span class="" style="color: #999;">'+Locale.tr("The cardinality for this role cannot be changed")+'</span>'+
              '</div>'+
            '</div>'+
            '<div class="large-4 columns text-center provision_create_service_cost_div" hidden>'+
              '<span class="cost_value" style="color: #777; font-size:40px"></span>'+
              '<br>'+
              '<span style="color: #999;">'+Locale.tr("COST")+' / ' + Locale.tr("HOUR") + '</span>'+
            '</div>'+
          '</div>'+
        '</div>'+
      '</div>');

      var capacity = template_json.VMTEMPLATE.TEMPLATE;
      var cost = 0;

      var cpuCost    = capacity.CPU_COST;
      var memoryCost = capacity.MEMORY_COST;
      var diskCost   = capacity.DISK_COST;

      if (cpuCost == undefined){
        cpuCost = Config.onedConf.DEFAULT_COST.CPU_COST;
      }

      if (memoryCost == undefined){
        memoryCost = Config.onedConf.DEFAULT_COST.MEMORY_COST;
      }

      if (diskCost == undefined){
        diskCost = Config.onedConf.DEFAULT_COST.DISK_COST;
      }

      if ((cpuCost != 0 || memoryCost != 0 || diskCost != 0) && Config.isFeatureEnabled("showback")) {
        $(".provision_create_service_cost_div", context).show();

        if (capacity.CPU) {
          cost += capacity.CPU * cpuCost;
          $(".cost_value", context).data("CPU_COST", cpuCost);
        }

        if (capacity.MEMORY) {
          cost += capacity.MEMORY * memoryCost;
          $(".cost_value", context).data("MEMORY_COST", memoryCost);
        }

        if (diskCost != 0) {
          var template_disk = capacity.DISK;
          var disks = [];
          if ($.isArray(template_disk)) {
            disks = template_disk;
          } else if (!$.isEmptyObject(template_disk)) {
            disks = [template_disk];
          }

          $(".cost_value", context).data("DISK_COST", diskCost);

          $.each(disks, function(i,disk){
            if (disk.SIZE) {
              cost += diskCost * disk.SIZE;
            }

            if (disk.DISK_SNAPSHOT_TOTAL_SIZE) {
              cost += diskCost * disk.DISK_SNAPSHOT_TOTAL_SIZE;
            }
          });
        }

        $(".provision_create_service_cost_div", context).data("cost", cost)
        var cost_value = cost*parseInt(role_template.cardinality);
        $(".cost_value", context).html(cost_value.toFixed(2));
      } else {
        $(".provision_create_service_cost_div", context).hide();
      }

      if (max_vms > min_vms) {
//TODO        $( ".cardinality_slider", context).attr('data-options', 'start: '+min_vms+'; end: '+max_vms+';')
//TODO        context.foundation();
//TODO        $( ".cardinality_slider_div", context).show();
//TODO        $( ".cardinality_no_slider_div", context).hide();
//TODO
//TODO        $( ".cardinality_slider", context).foundation('slider', 'set_value', role_template.cardinality);
//TODO
//TODO        $( ".cardinality_slider", context).on('change.fndtn.slider', function(){
//TODO          $(".cardinality_value",context).html($(this).attr('data-slider'))
//TODO          var cost_value = $(".provision_create_service_cost_div", context).data("cost")*$(this).attr('data-slider');
//TODO          $(".cost_value", context).html(cost_value.toFixed(2));
//TODO        });
      } else {
        $( ".cardinality_slider_div", context).hide();
        $( ".cardinality_no_slider_div", context).show();
      }
  }

  var provision_capacity_accordion_id = 0;

  function generate_provision_capacity_accordion(context, element) {

    var capacity = element.TEMPLATE;

    context.off();
    var memory_value;
    var memory_unit;

    if (capacity.MEMORY >= 1024){
      memory_value = (capacity.MEMORY/1024).toFixed(2);
      memory_unit = "GB";
    } else {
      memory_value = (capacity.MEMORY ? capacity.MEMORY : '-');
      memory_unit = "MB";
    }

    context.html(
      '<br>'+
      '<div class="row">'+
        '<div class="large-12 large-centered columns">'+
          '<h3 class="subheader text-right">'+
            '<span class="left">'+
              '<i class="fa fa-laptop fa-lg"></i>&emsp;'+
              Locale.tr("Capacity")+
            '</span>'+
            '<span>'+
              '<span class="cpu_value">'+(capacity.CPU ? capacity.CPU : '-')+'</span> '+
              '<small style="color: #999; margin-right: 10px">'+Locale.tr("CPU")+'</small>'+
              '<span class="memory_value">'+memory_value+'</span>'+
              ' '+
              '<span class="memory_unit">'+memory_unit+'</span> '+
              '<small style="color: #999; margin-right: 10px">'+Locale.tr("MEMORY")+'</small>'+
              '<span class="provision_create_template_cost_div" hidden>' +
                '<span class="cost_value">0.00</span> '+
                '<small style="color: #999;">'+Locale.tr("COST")+' / ' + Locale.tr("HOUR") + '</small>'+
              '</span>'+
            '</span>'+
          '</h3>'+
          '<br>'+
        '</div>'+
      '</div>'+
      (Config.provision.create_vm.isEnabled("capacity_select") ?
      '<div class="row">'+
        '<div class="large-12 large-centered columns">'+
          '<dl class="accordion" data-accordion="provision_accordion_'+provision_capacity_accordion_id+'">'+
            '<dd class="accordion-navigation">'+
              '<a href="#provision_capacity_dd_'+provision_capacity_accordion_id+'" class="button large-12 medium radius" style="color: #555;">'+
                Locale.tr("Change Capacity")+
              '</a>'+
              '<div id="provision_capacity_dd_'+provision_capacity_accordion_id+'" class="content">'+
                '<br>'+
                CapacityInputs.html() +
              '</div>'+
            '</dd>'+
          '</dl>'+
        '</div>'+
      '</div>' : '' ) +
      '<br>');

    if (Config.provision.create_vm.isEnabled("capacity_select")) {
      provision_capacity_accordion_id += 1;

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
      });
    }

    var cost = 0;

    var cpuCost    = capacity.CPU_COST;
    var memoryCost = capacity.MEMORY_COST;

    if (cpuCost == undefined){
      cpuCost = Config.onedConf.DEFAULT_COST.CPU_COST;
    }

    if (memoryCost == undefined){
      memoryCost = Config.onedConf.DEFAULT_COST.MEMORY_COST;
    }

    var _redoCost = function(values){
      var cost = 0;

      if (values.CPU != undefined){
        cost += cpuCost * values.CPU;
      }

      if (values.MEMORY != undefined){
        cost += memoryCost * values.MEMORY;
      }

      $(".cost_value", context).html(cost.toFixed(2));
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
  }

  function show_provision_dashboard() {
    $(".section_content").hide();
    $("#provision_dashboard").fadeIn();

    $("#provision_dashboard").html("");

    if (Config.provision.dashboard.isEnabled("vms")) {
      $("#provision_dashboard").append(TemplateDashboardVms());

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
      }

      var no_table = true;

      OpenNebula.VM.accounting({
          success: function(req, response){
              Accounting.fillAccounting($("#dashboard_vm_accounting"), req, response, no_table);
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
          })

          var context = $("#provision_vms_dashboard");
          $("#provision_dashboard_total", context).html(total);
          $("#provision_dashboard_running", context).html(running);
          $("#provision_dashboard_off", context).html(off);
          $("#provision_dashboard_error", context).html(error);
          $("#provision_dashboard_deploying", context).html(deploying);
        },
        error: Notifier.onError
      });
    }

    if (Config.provision.dashboard.isEnabled("vdcvms")) {
      $("#provision_dashboard").append(TemplateDashboardVdcVms());

      var start_time =  Math.floor(new Date().getTime() / 1000);
      // ms to s

      // 604800 = 7 days = 7*24*60*60
      start_time = start_time - 604800;

      // today
      var end_time = -1;

      var options = {
        "start_time": start_time,
        "end_time": end_time
      }

      var no_table = true;

      OpenNebula.VM.accounting({
          success: function(req, response){
              Accounting.fillAccounting($("#dashboard_vdc_vm_accounting"), req, response, no_table);
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
          })

          var context = $("#provision_vdc_vms_dashboard");
          $("#provision_dashboard_vdc_total", context).html(total);
          $("#provision_dashboard_vdc_running", context).html(running);
          $("#provision_dashboard_vdc_off", context).html(off);
          $("#provision_dashboard_vdc_error", context).html(error);
          $("#provision_dashboard_vdc_deploying", context).html(deploying);
        },
        error: Notifier.onError
      });
    }

    if (Config.provision.dashboard.isEnabled("quotas")) {
      $("#provision_dashboard").append(TemplateDashboardQuotas());


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
                  user.VM_QUOTA.VM.VMS_USED,
                  user.VM_QUOTA.VM.VMS,
                  default_user_quotas.VM_QUOTA.VM.VMS,
                  true);

              $("#provision_dashboard_rvms_percentage").html(vms["percentage"]);
              $("#provision_dashboard_rvms_str").html(vms["str"]);
              $("#provision_dashboard_rvms_meter").css("width", vms["percentage"]+"%");

              var memory = QuotaWidgets.quotaMBInfo(
                  user.VM_QUOTA.VM.MEMORY_USED,
                  user.VM_QUOTA.VM.MEMORY,
                  default_user_quotas.VM_QUOTA.VM.MEMORY,
                  true);

              $("#provision_dashboard_memory_percentage").html(memory["percentage"]);
              $("#provision_dashboard_memory_str").html(memory["str"]);
              $("#provision_dashboard_memory_meter").css("width", memory["percentage"]+"%");

              var cpu = QuotaWidgets.quotaFloatInfo(
                  user.VM_QUOTA.VM.CPU_USED,
                  user.VM_QUOTA.VM.CPU,
                  default_user_quotas.VM_QUOTA.VM.CPU,
                  true);

              $("#provision_dashboard_cpu_percentage").html(cpu["percentage"]);
              $("#provision_dashboard_cpu_str").html(cpu["str"]);
              $("#provision_dashboard_cpu_meter").css("width", cpu["percentage"]+"%");
          }
        }
      })
    }

    if (Config.provision.dashboard.isEnabled("vdcquotas")) {
      $("#provision_dashboard").append(TemplateDashboardVdcQuotas());


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
                  group.VM_QUOTA.VM.VMS_USED,
                  group.VM_QUOTA.VM.VMS,
                  default_group_quotas.VM_QUOTA.VM.VMS,
                  true);

              $("#provision_dashboard_vdc_rvms_percentage").html(vms["percentage"]);
              $("#provision_dashboard_vdc_rvms_str").html(vms["str"]);
              $("#provision_dashboard_vdc_rvms_meter").css("width", vms["percentage"]+"%");

              var memory = QuotaWidgets.quotaMBInfo(
                  group.VM_QUOTA.VM.MEMORY_USED,
                  group.VM_QUOTA.VM.MEMORY,
                  default_group_quotas.VM_QUOTA.VM.MEMORY,
                  true);

              $("#provision_dashboard_vdc_memory_percentage").html(memory["percentage"]);
              $("#provision_dashboard_vdc_memory_str").html(memory["str"]);
              $("#provision_dashboard_vdc_memory_meter").css("width", memory["percentage"]+"%");

              var cpu = QuotaWidgets.quotaFloatInfo(
                  group.VM_QUOTA.VM.CPU_USED,
                  group.VM_QUOTA.VM.CPU,
                  default_group_quotas.VM_QUOTA.VM.CPU,
                  true);

              $("#provision_dashboard_vdc_cpu_percentage").html(cpu["percentage"]);
              $("#provision_dashboard_vdc_cpu_str").html(cpu["str"]);
              $("#provision_dashboard_vdc_cpu_meter").css("width", cpu["percentage"]+"%");
          }
        }
      })
    }
  }

  function show_provision_create_vm() {
    OpenNebula.Action.clear_cache("VMTEMPLATE");

    ProvisionTemplatesList.updateDatatable(provision_vm_instantiate_templates_datatable);
    $('#provision_vm_instantiate_templates_owner_filter').val('all').change();
    $('#provision_vm_instantiate_template_search').val('').trigger('input');

    $(".provision_accordion_template .selected_template").hide();
    $(".provision_accordion_template .select_template").show();

    $("#provision_create_vm .provision_capacity_selector").html("");
    $("#provision_create_vm .provision_disk_selector").html("");
    $("#provision_create_vm .provision_network_selector").html("");
    $("#provision_create_vm .provision_custom_attributes_selector").html("")

    $("#provision_create_vm dd:not(.active) a[href='#provision_dd_template']").trigger("click")

    $(".section_content").hide();
    $("#provision_create_vm").fadeIn();
  }

  function show_provision_create_flow() {
    update_provision_flow_templates_datatable(provision_flow_templates_datatable);

    var context = $("#provision_create_flow");

    $("#provision_customize_flow_template", context).hide();
    $("#provision_customize_flow_template", context).html("");

    $(".provision_network_selector", context).html("")
    $(".provision_custom_attributes_selector", context).html("")

    $(".provision_accordion_flow_template .selected_template", context).hide();
    $(".provision_accordion_flow_template .select_template", context).show();

    $("dd:not(.active) a[href='#provision_dd_flow_template']", context).trigger("click")

    $(".alert-box-error", context).hide();

    $(".section_content").hide();
    $("#provision_create_flow").fadeIn();
  }

  function update_provision_flow_templates_datatable(datatable, timeout) {
    datatable.html('<div class="text-center">'+
      '<span class="fa-stack fa-5x" style="color: #dfdfdf">'+
        '<i class="fa fa-cloud fa-stack-2x"></i>'+
        '<i class="fa  fa-spinner fa-spin fa-stack-1x fa-inverse"></i>'+
      '</span>'+
      '<br>'+
      '<br>'+
      '<span style="font-size: 18px; color: #999">'+
      '</span>'+
      '</div>');

    setTimeout( function(){
      OpenNebula.ServiceTemplate.list({
        timeout: true,
        success: function (request, item_list){
          datatable.fnClearTable(true);
          if (item_list.length == 0) {
            datatable.html('<div class="text-center">'+
              '<span class="fa-stack fa-5x" style="color: #dfdfdf">'+
                '<i class="fa fa-cloud fa-stack-2x"></i>'+
                '<i class="fa fa-info-circle fa-stack-1x fa-inverse"></i>'+
              '</span>'+
              '<br>'+
              '<br>'+
              '<span style="font-size: 18px; color: #999">'+
                Locale.tr("There are no templates available")+
              '</span>'+
              '</div>');
          } else {
            datatable.fnAddData(item_list);
          }
        },
        error: Notifier.onError
      });
    }, timeout);
  }

  var _panels = [
    require('./vms-tab/panels/info'),
    require('./vms-tab/panels/capacity'),
    require('./vms-tab/panels/storage'),
    require('./vms-tab/panels/network'),
    require('./vms-tab/panels/snapshots'),
    require('./vms-tab/panels/placement'),
    require('./vms-tab/panels/actions'),
    require('./vms-tab/panels/template'),
    require('./vms-tab/panels/log')
  ];


  var _dialogs = [
    //require('./vms-tab/dialogs/deploy'),
    //require('./vms-tab/dialogs/migrate'),
    require('./vms-tab/dialogs/resize'),
    require('./vms-tab/dialogs/attach-disk'),
    require('./vms-tab/dialogs/disk-snapshot'),
    require('./vms-tab/dialogs/disk-saveas'),
    require('./vms-tab/dialogs/attach-nic'),
    require('./vms-tab/dialogs/snapshot'),
    //require('./vms-tab/dialogs/vnc'),
    //require('./vms-tab/dialogs/spice'),
    //require('./vms-tab/dialogs/saveas-template')
  ];

  var Actions = require('./vms-tab/actions');

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
      var tab_name = 'provision-tab';
      var tab = $("#"+tab_name);

      if (Config.isTabEnabled(tab_name)) {
        $('.right-header').prepend(TemplateHeader());

        $(".right-content").addClass("large-centered small-centered");
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

        $(".provision_image_header").on("click", function(){
          Sunstone.showTab(TAB_ID);
          $('li', '.provision-header').removeClass("active");
          show_provision_dashboard();
        })

        $(".configuration").on("click", function(){
          $('li', '.provision-header').removeClass("active");
        })

        show_provision_dashboard();

        $('.provision-header').on('click', 'li', function(){
          Sunstone.showTab(TAB_ID);
          $('li', '.provision-header').removeClass("active");
          $(this).closest('li').addClass("active");
        })

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
            logo = '<span class="provision-logo" href="#">'+
                '<img  src="'+data.TEMPLATE.LOGO+'">'+
              '</span>';
          } else {
            logo = '<span style="color: #bfbfbf; font-size: 60px;">'+
              '<i class="fa fa-fw fa-file-text-o"/>'+
            '</span>';
          }

          var owner;

          if (data.UID == config.user_id){
            owner = Locale.tr("mine");
          } else if (data.GID == config.user_gid){
            owner = Locale.tr("group");
          } else {
            owner = Locale.tr("system");
          }

          var li = $('<li>'+
              '<ul class="provision-pricing-table hoverable only-one" opennebula_id="'+data.ID+'">'+
                '<li class="provision-title" title="'+data.NAME+'">'+
                  data.NAME+
                '</li>'+
                '<li style="height: 85px" class="provision-bullet-item">'+
                  logo +
                '</li>'+
                '<li class="provision-description">'+
                  (data.TEMPLATE.DESCRIPTION || '...')+
                '</li>'+
                '<li class="text-right provision-bullet-item">'+
                  '<span class="left" style="color: #999;">'+
                    '<i class="fa fa-fw fa-lg fa-user"/>&emsp;'+
                    owner+
                  '</span>'+
                '</li>'+
              '</ul>'+
            '</li>').appendTo($("#"+tableID+'_ul'));

          $(".provision-pricing-table", li).data("opennebula", aData);
        }

        function initializeTemplateCards(context, tableID) {
          // create a thumbs container if it doesn't exist. put it in the dataTables_scrollbody div
          if (context.$('tr', {"filter": "applied"} ).length == 0) {
            context.html('<div class="text-center">'+
              '<span class="fa-stack fa-5x" style="color: #dfdfdf">'+
                '<i class="fa fa-cloud fa-stack-2x"></i>'+
                '<i class="fa fa-info-circle fa-stack-1x fa-inverse"></i>'+
              '</span>'+
              '<br>'+
              '<br>'+
              '<span style="font-size: 18px; color: #999">'+
                Locale.tr("There are no templates available")+
              '</span>'+
              '</div>');
          } else {
            $('#'+tableID+'_table').html(
              '<ul id="'+tableID+'_ul" class="large-block-grid-3 medium-block-grid-3 small-block-grid-1 text-center"></ul>');
          }

          return true;
        }


        provision_vm_instantiate_templates_datatable = $('#provision_vm_instantiate_templates_table').dataTable({
          "iDisplayLength": 6,
          "sDom" : '<"H">t<"F"lp>',
          "aLengthMenu": [[6, 12, 36, 72], [6, 12, 36, 72]],
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

                  if (type === 'filter') {
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

        $('#provision_vm_instantiate_template_search').on('input',function(){
          provision_vm_instantiate_templates_datatable.fnFilter( $(this).val() );
        });

        $('#provision_vm_instantiate_templates_owner_filter').on('change', function(){
          switch($(this).val()){
            case "all":
              provision_vm_instantiate_templates_datatable.fnFilter('', 2);
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

        tab.on("click", "#provision_create_vm .provision_select_template .provision-pricing-table.only-one" , function(){
          var create_vm_context = $("#provision_create_vm");

          if ($(this).hasClass("selected")){
            $(".provision_disk_selector", create_vm_context).html("");
            $(".provision_network_selector", create_vm_context).html("");
            $(".provision_capacity_selector", create_vm_context).html("");

            $(".provision_accordion_template .selected_template").hide();
            $(".provision_accordion_template .select_template").show();
          } else {
            var template_id = $(this).attr("opennebula_id");
            var template_json = $(this).data("opennebula");

            $(".provision_accordion_template .selected_template").show();
            $(".provision_accordion_template .select_template").hide();
            $(".provision_accordion_template .selected_template_name").html(template_json.VMTEMPLATE.NAME)
            if (template_json.VMTEMPLATE.TEMPLATE.LOGO) {
              $(".provision_accordion_template .selected_template_logo").html('<img  src="'+template_json.VMTEMPLATE.TEMPLATE.LOGO+'">');
            } else {
              $(".provision_accordion_template .selected_template_logo").html('<i class="fa fa-file-text-o fa-lg"/>&emsp;');
            }

            $(".provision_accordion_template a").first().trigger("click");

            generate_provision_capacity_accordion(
              $(".provision_capacity_selector", create_vm_context),
              template_json.VMTEMPLATE);

            provisionInvalidCapacity = function(input){
              if(!$(input).closest(".accordion-navigation").hasClass("active")){
                $("a", $(input).closest(".accordion-navigation")).click();
              }
            };

            $(".provision_capacity_selector input[required]", create_vm_context).attr("oninvalid", "provisionInvalidCapacity(this)");

            var disksContext = $(".provision_disk_selector", create_vm_context);
            if (Config.provision.create_vm.isEnabled("disk_resize")) {
              DisksResize.insert(template_json, disksContext);
            } else {
              disksContext.html("");
            }

            if (Config.provision.create_vm.isEnabled("network_select")) {
              NicsSection.insert(template_json, create_vm_context);
            } else {
              $(".provision_network_selector", create_vm_context).html("");
            }

            if (template_json.VMTEMPLATE.TEMPLATE.USER_INPUTS) {
              UserInputs.vmTemplateInsert(
                  $(".provision_custom_attributes_selector", create_vm_context),
                  template_json,
                  {text_header: '<i class="fa fa-gears fa-lg"></i>&emsp;'+Locale.tr("Custom Attributes")});

            } else {
              $(".provision_custom_attributes_selector", create_vm_context).html("");
            }
          }
        })

        tab.on("click", "#provision_create_vm .provision-pricing-table.only-one" , function(){
          if ($(this).hasClass("selected")){
            $(this).removeClass("selected");
          } else {
            $(".provision-pricing-table", $(this).parents(".large-block-grid-3,.large-block-grid-2")).removeClass("selected")
            $(this).addClass("selected");
          }
        })

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
            'vm_name' : vm_name,
            'template': {
            }
          }

          if (nics.length > 0) {
            extra_info.template.nic = nics;
          }

          if (disks.length > 0) {
            extra_info.template.DISK = disks;
          }

          if (Config.provision.create_vm.isEnabled("capacity_select")){
            capacityContext = $(".provision_capacity_selector", context);
            $.extend(extra_info.template, CapacityInputs.retrieveChanges(capacityContext));
          }

          var user_inputs_values = WizardFields.retrieve($(".provision_custom_attributes_selector", $(this)));

          if (!$.isEmptyObject(user_inputs_values)) {
             $.extend(extra_info.template, user_inputs_values)
          }

          Sunstone.runAction("Provision.instantiate", template_id, extra_info);
          return false;
        })

        $(document).on("click", ".provision_create_vm_button", function(){
          show_provision_create_vm();
        });

        Foundation.reflow($('#provision_create_vm'), 'accordion');


        //
        // Create FLOW
        //

        provision_flow_templates_datatable = $('#provision_flow_templates_table').dataTable({
          "iDisplayLength": 6,
          "sDom" : '<"H">t<"F"lp>',
          "aLengthMenu": [[6, 12, 36, 72], [6, 12, 36, 72]],
          "aaSorting"  : [[1, "asc"]],
          "aoColumnDefs": [
              { "bVisible": false, "aTargets": ["all"]}
          ],
          "aoColumns": [
              { "mDataProp": "DOCUMENT.ID" },
              { "mDataProp": "DOCUMENT.NAME" }
          ],
          "fnPreDrawCallback": function (oSettings) {
            // create a thumbs container if it doesn't exist. put it in the dataTables_scrollbody div
            if (this.$('tr', {"filter": "applied"} ).length == 0) {
              this.html('<div class="text-center">'+
                '<span class="fa-stack fa-5x" style="color: #dfdfdf">'+
                  '<i class="fa fa-cloud fa-stack-2x"></i>'+
                  '<i class="fa fa-info-circle fa-stack-1x fa-inverse"></i>'+
                '</span>'+
                '<br>'+
                '<br>'+
                '<span style="font-size: 18px; color: #999">'+
                  Locale.tr("There are no templates available")+
                '</span>'+
                '</div>');
            } else {
              $("#provision_flow_templates_table").html('<ul id="provision_flow_templates_ul" class="large-block-grid-3 medium-block-grid-3 small-block-grid-1 text-center"></ul>');
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
                  '<li class="provision-bullet-item text-left" style="margin-left: 10px;margin-right: 10px;">'+
                    '<i class="fa fa-fw fa-cube"/>&emsp;'+
                    role.name+
                    '<span class="right">'+role.cardinality+" VMs</span>"+
                  '</li>';
              });
            }

            if (body.LOGO) {
              logo = '<span class="provision-logo" href="#">'+
                  '<img  src="'+body.LOGO+'">'+
                '</span>';
            } else {
              logo = '<span style="color: #bfbfbf; font-size: 60px;">'+
                '<i class="fa fa-fw fa-cubes"/>'+
              '</span>';
            }

            var li = $('<li>'+
                '<ul class="provision-pricing-table hoverable only-one" opennebula_id="'+data.ID+'">'+
                  '<li class="provision-title" title="'+data.NAME+'">'+
                    data.NAME+
                  '</li>'+
                  '<li style="height: 85px" class="provision-bullet-item">'+
                    logo +
                  '</li>'+
                  roles_li +
                  '<li class="provision-description" style="padding-top:0px">'+
                    (data.TEMPLATE.DESCRIPTION || '')+
                  '</li>'+
                '</ul>'+
              '</li>').appendTo($("#provision_flow_templates_ul"));

            $(".provision-pricing-table", li).data("opennebula", aData);

            return nRow;
          }
        });

        $('#provision_create_flow_template_search').on('input',function(){
          provision_flow_templates_datatable.fnFilter( $(this).val() );
        })

        $("#provision_create_flow_template_refresh_button").click(function(){
          OpenNebula.Action.clear_cache("SERVICE_TEMPLATE");
          update_provision_flow_templates_datatable(provision_flow_templates_datatable);

        });

        tab.on("click", ".provision_select_flow_template .provision-pricing-table.only-one" , function(){
          var context = $("#provision_create_flow");

          if ($(this).hasClass("selected")){
            $("#provision_customize_flow_template").hide();
            $("#provision_customize_flow_template").html("");
            $(".provision_network_selector", context).html("")
            $(".provision_custom_attributes_selector", context).html("")

            $(".provision_accordion_flow_template .selected_template").hide();
            $(".provision_accordion_flow_template .select_template").show();
          } else {
            $("#provision_customize_flow_template").show();
            $("#provision_customize_flow_template").html("");

            var data = $(this).data("opennebula");
            var body = data.DOCUMENT.TEMPLATE.BODY;

            $(".provision_accordion_flow_template .selected_template").show();
            $(".provision_accordion_flow_template .select_template").hide();
            $(".provision_accordion_flow_template .selected_template_name").html(body.name)
            $(".provision_accordion_flow_template .selected_template_logo").html('<i class="fa fa-cubes fa-lg"/>&emsp;');
            $(".provision_accordion_flow_template a").first().trigger("click");

            var context = $("#provision_create_flow");

            if (body.custom_attrs) {
              var network_attrs = [];
              var text_attrs = [];

              $.each(body.custom_attrs, function(key, value){
                var parts = value.split("|");
                // 0 mandatory; 1 type; 2 desc;
                var attrs = {
                  "name": key,
                  "mandatory": parts[0],
                  "type": parts[1],
                  "description": parts[2],
                }

                switch (parts[1]) {
                  case "vnet_id":
                    network_attrs.push(attrs)
                    break;
                  case "text":
                  case "text64":
                  case "password":
                    text_attrs.push(attrs)
                    break;
                }
              })

              if (network_attrs.length > 0) {
                NicsSection.generate_provision_network_accordion(
                  $(".provision_network_selector", context), {hide_add_button:true});

                $.each(network_attrs, function(index, vnet_attr){
                  NicsSection.generate_provision_network_table(
                    $(".provision_nic_accordion", context),
                    {vnet_attr: vnet_attr});
                });
              }

            } else {
              $(".provision_network_selector", context).html("")
              $(".provision_custom_attributes_selector", context).html("")
            }

            $.each(body.roles, function(index, role){
              var context = $('<div id="provision_create_flow_role_'+index+'" class="provision_create_flow_role">'+
                '<div class="row">'+
                  '<div class="large-10 large-centered columns">'+
                    '<h2 class="subheader">'+
                      '<i class="fa fa-cube fa-lg"></i>&emsp;'+
                      role.name+
                    '</h2>'+
                    '<br>'+
                  '</div>'+
                '</div>'+
                '<div class="row">'+
                  '<div class="provision_cardinality_selector large-9 large-centered columns">'+
                  '</div>'+
                '</div>'+
                '<br>'+
                '<div class="row">'+
                  '<div class="provision_custom_attributes_selector large-9 large-centered columns">'+
                  '</div>'+
                '</div>'+
              '</div>'+
              '<br>'+
              '<br>').appendTo($("#provision_customize_flow_template"))

              context.data("opennebula", role);

              var template_id = role.vm_template;
              var role_html_id = "#provision_create_flow_role_"+index;

              OpenNebula.Template.show({
                data : {
                    id: template_id,
                    extended: true
                },
                success: function(request,template_json){
                  var role_context = $(role_html_id)

                  generate_cardinality_selector(
                    $(".provision_cardinality_selector", context),
                    role,
                    template_json);

                  if (template_json.VMTEMPLATE.TEMPLATE.USER_INPUTS) {
                    UserInputs.vmTemplateInsert(
                        $(".provision_custom_attributes_selector", role_context),
                        template_json,
                        {text_header: '<i class="fa fa-gears fa-lg"></i>&emsp;'+Locale.tr("Custom Attributes")});

                  } else {
                    $(".provision_custom_attributes_selector", role_context).html("");
                  }
                }
              })


            })

            //$(document).foundation();
          }
        })

        tab.on("click", "#provision_create_flow .provision-pricing-table.only-one" , function(){
          if ($(this).hasClass("selected")){
            $(this).removeClass("selected");
          } else {
            $(".provision-pricing-table", $(this).parents(".large-block-grid-3,.large-block-grid-2")).removeClass("selected")
            $(this).addClass("selected");
          }
        })

        $("#provision_create_flow").submit(function(){
          var context = $(this);

          var flow_name = $("#flow_name", context).val();
          var template_id = $(".provision_select_flow_template .selected", context).attr("opennebula_id");

          if (!template_id) {
            $(".alert-box-error", context).fadeIn().html(Locale.tr("You must select at least a template configuration"));
            return false;
          }

          var custom_attrs = {}
          var missing_network = false;
          if ($(".provision_nic_accordion", context)) {
            $(".selected_network", $(".provision_nic_accordion", context)).each(function(){
              if (!$(this).attr("opennebula_id")) {
                $(this).css("color", "red");
                missing_network = true;
              } else {
                $(this).css("color", "#777");
                custom_attrs[$(this).attr("attr_name")] = $(this).attr("opennebula_id");
              }
            })
          }

          if (missing_network) {
            $(".alert-box-error", context).fadeIn().html(Locale.tr("You have not specified all the Networks for this Service"));
            return false;
          }

          var roles = [];

          $(".provision_create_flow_role", context).each(function(){
            var user_inputs_values = WizardFields.retrieve($(".provision_custom_attributes_selector", $(this)));

            var role_template = $(this).data("opennebula");

            if (role_template.elasticity_policies != undefined){
              $.each(role_template.elasticity_policies, function(i, pol){
                  pol.expression = TemplateUtils.htmlDecode(pol.expression);
              });
            }

            roles.push($.extend(role_template, {
              "cardinality": $(".cardinality_value", $(this)).text(),
              "user_inputs_values": user_inputs_values
            }));
          })

          var extra_info = {
            'merge_template': {
              "roles" : roles,
              "custom_attrs_values": custom_attrs
            }
          }

          if (flow_name){
            extra_info["merge_template"]["name"] = flow_name;
          }

          Sunstone.runAction("Provision.Flow.instantiate", template_id, extra_info);
          return false;
        })

        $(".provision_create_flow_button").on("click", function(){
          show_provision_create_flow();
        });
      }
    });
  }

});
