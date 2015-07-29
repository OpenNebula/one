define(function(require) {
  require('foundation.core');
  require('foundation.accordion');
  require('foundation-datatables');
  var Locale = require('utils/locale');
  var Config = require('sunstone-config');
  var OpenNebula = require('opennebula');
  var Sunstone = require('sunstone');
  var Notifier = require('utils/notifier');
  var ResourceSelect = require('utils/resource-select');
  var QuotaWidgets = require('utils/quotas/quota-widgets');
  var QuotaDefaults = require('utils/quotas/quota-defaults');
  var Accounting = require('utils/accounting');
  var Showback = require('utils/showback');
  var Humanize = require('utils/humanize');
  var QuotaLimits = require('utils/quotas/quota-limits');
  var Graphs = require('utils/graphs');
  var RangeSlider = require('utils/range-slider');
  var DisksResize = require('utils/disks-resize');

  var ProvisionQuotaWidget = require('./provision-tab/users/quota-widget');

  var ProvisionVmsList = require('./provision-tab/vms/list');
  var ProvisionTemplatesList = require('./provision-tab/templates/list');
  var ProvisionUsersList = require('./provision-tab/users/list');
  var ProvisionFlowsList = require('./provision-tab/flows/list');

  // Templates
  var TemplateContent = require('hbs!./provision-tab/content');
  var TemplateHeader = require('hbs!./provision-tab/header');

  var TemplateDashboardQuotas = require('hbs!./provision-tab/dashboard/quotas');
  var TemplateDashboardVdcQuotas = require('hbs!./provision-tab/dashboard/vdc-quotas');
  var TemplateDashboardVms = require('hbs!./provision-tab/dashboard/vms');
  var TemplateDashboardVdcVms = require('hbs!./provision-tab/dashboard/vdc-vms');
  var TemplateDashboardUsers = require('hbs!./provision-tab/dashboard/users');

  var TemplateGroupInfo = require('hbs!./provision-tab/group/info');

  var TAB_ID = require('./provision-tab/tabId');

  var povision_actions = {
    "Provision.User.create" : {
        type: "create",
        call: OpenNebula.User.create,
        callback: function(request, response) {
          if ( $("div#provision_create_user_manual_quota",
               $("#provision_create_user")).hasClass("active") ){

            quota_json = ProvisionQuotaWidget.retrieve($("#provision_create_user"));

            Sunstone.runAction("Provision.User.set_quota",
                                [response.USER.ID], quota_json);
          } else {
            clear_provision_create_user();
          }
        },
        error: Notifier.onError
    },

    "Provision.User.set_quota" : {
        type: "multiple",
        call: OpenNebula.User.set_quota,
        callback: function(request) {
          clear_provision_create_user();
        },
        error: Notifier.onError
    },

    "Provision.Group.show" : {
        type: "single",
        call: OpenNebula.Group.show,
        callback: show_provision_group_info_callback,
        error: Notifier.onError
    },

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
        //$('a[href="#provision_system_templates_selector"]', context).click();
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
        $('a[href="#provision_system_templates_selector"]', context).click();
      },
      error: Notifier.onError
    }
  }

  $(document).foundation();

  function generate_custom_attrs(context, custom_attrs) {
    context.off();
    var text_attrs = [];

    $.each(custom_attrs, function(key, value){
      var parts = value.split("|");
      // 0 mandatory; 1 type; 2 desc;
      var attrs = {
        "name": key,
        "mandatory": parts[0],
        "type": parts[1],
        "description": parts[2],
      }

      switch (parts[1]) {
        case "text":
          text_attrs.push(attrs)
          break;
        case "password":
          text_attrs.push(attrs)
          break;
      }
    })

    if (text_attrs.length > 0) {
      context.html(
        '<br>'+
        '<div class="row">'+
          '<div class="large-12 large-centered columns">'+
            '<h3 class="subheader text-right">'+
              '<span class="left">'+
                '<i class="fa fa-th fa-gears"></i>&emsp;'+
                Locale.tr("Custom Attributes")+
              '</span>'+
            '</h3>'+
            '<br>'+
          '</div>'+
        '</div>'+
        '<br>'+
        '<div class="provision_custom_attributes">'+
        '</div>'+
        '<br>'+
        '<br>'+
        '<br>');


      $.each(text_attrs, function(index, custom_attr){
        $(".provision_custom_attributes", context).append(
          '<br>'+
          '<div class="row">'+
            '<div class="large-10 large-centered columns">'+
              '<label style="font-size: 16px">' +
                '<i class="fa fa-asterisk" style="color:#0099c3"/> '+
                custom_attr.description +
                '<input type="'+custom_attr.type+'" attr_name="'+custom_attr.name+'" class="provision_custom_attribute provision-input" style="height: 40px !important; font-size: 16px; padding: 0.5rem  !important;"/>'+
              '</label>'+
            '</div>'+
          '</div>');
      })
    } else {
      context.html("");
    }
  }

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
            '<div class="large-4 columns text-center provision_create_service_cost_div hidden">'+
              '<span class="cost_value" style="color: #777; font-size:40px"></span>'+
              '<br>'+
              '<span style="color: #999;">'+Locale.tr("COST")+' / ' + Locale.tr("HOUR") + '</span>'+
            '</div>'+
          '</div>'+
        '</div>'+
      '</div>');

      var capacity = template_json.VMTEMPLATE.TEMPLATE;
      var cost = 0;
      if (capacity.CPU_COST || capacity.MEMORY_COST && Config.isFeatureEnabled("showback")) {
        $(".provision_create_service_cost_div").show();

        if (capacity.CPU && capacity.CPU_COST) {
          cost += capacity.CPU * capacity.CPU_COST
          $(".cost_value", context).data("CPU_COST", capacity.CPU_COST);
        }

        if (capacity.MEMORY && capacity.MEMORY_COST) {
          cost += capacity.MEMORY * capacity.MEMORY_COST
          $(".cost_value", context).data("MEMORY_COST", capacity.MEMORY_COST);
        }

        $(".provision_create_service_cost_div", context).data("cost", cost)
        var cost_value = cost*parseInt(role_template.cardinality);
        $(".cost_value", context).html(cost_value.toFixed(2));
      } else {
        $(".provision_create_service_cost_div").hide();
      }

      if (max_vms > min_vms) {
        $( ".cardinality_slider", context).attr('data-options', 'start: '+min_vms+'; end: '+max_vms+';')
        context.foundation();
        $( ".cardinality_slider_div", context).show();
        $( ".cardinality_no_slider_div", context).hide();

        $( ".cardinality_slider", context).foundation('slider', 'set_value', role_template.cardinality);

        $( ".cardinality_slider", context).on('change', function(){
          $(".cardinality_value",context).html($(this).attr('data-slider'))
          var cost_value = $(".provision_create_service_cost_div", context).data("cost")*$(this).attr('data-slider');
          $(".cost_value", context).html(cost_value.toFixed(2));
        });
      } else {
        $( ".cardinality_slider_div", context).hide();
        $( ".cardinality_no_slider_div", context).show();
      }
  }

  var provision_instance_type_accordion_id = 0;

  function generate_provision_instance_type_accordion(context, capacity) {
    context.off();
    var memory_value;
    var memory_unit;

    if (capacity.MEMORY > 1000){
      memory_value = Math.floor(capacity.MEMORY/1024);
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
              '<span class="provision_create_template_cost_div hidden">' +
                '<span class="cost_value">0.00</span> '+
                '<small style="color: #999;">'+Locale.tr("COST")+' / ' + Locale.tr("HOUR") + '</small>'+
              '</span>'+
            '</span>'+
          '</h3>'+
          '<br>'+
        '</div>'+
      '</div>'+
      (Config.provision.create_vm.isEnabled("capacity_select") && (capacity.SUNSTONE_CAPACITY_SELECT != "NO") ?
      '<div class="row">'+
        '<div class="large-12 large-centered columns">'+
          '<dl class="accordion" data-accordion="provision_accordion_'+provision_instance_type_accordion_id+'">'+
            '<dd class="accordion-navigation">'+
              '<a href="#provision_instance_type_dd_'+provision_instance_type_accordion_id+'" class="button large-12 medium radius" style="color: #555;">'+
                Locale.tr("Change Capacity")+
              '</a>'+
              '<div id="provision_instance_type_dd_'+provision_instance_type_accordion_id+'" class="content">'+
                '<div class="row">'+
                  '<div class="large-12 large-centered columns">'+
                    '<h3 class="subheader text-right">'+
                      '<input type="search" class="provision-search-input right" placeholder="Search"/>'+
                    '</h3>'+
                    '<br>'+
                  '</div>'+
                '</div>'+
                '<div class="row">'+
                  '<div class="large-12 large-centered columns">'+
                    '<table class="provision_instance_types_table">'+
                      '<thead class="hidden">'+
                        '<tr>'+
                          '<th>'+Locale.tr("Name")+'</th>'+
                        '</tr>'+
                      '</thead>'+
                      '<tbody class="hidden">'+
                      '</tbody>'+
                    '</table>'+
                    '<br>'+
                  '</div>'+
                '</div>'+
              '</div>'+
            '</dd>'+
          '</dl>'+
        '</div>'+
      '</div>' : '' ) +
      '<br>');

    var cost = 0;
    if (capacity.CPU_COST || capacity.MEMORY_COST && Config.isFeatureEnabled("showback")) {
      $(".provision_create_template_cost_div").show();

      if (capacity.CPU && capacity.CPU_COST) {
        cost += capacity.CPU * capacity.CPU_COST
        $(".cost_value").data("CPU_COST", capacity.CPU_COST);
      }

      if (capacity.MEMORY && capacity.MEMORY_COST) {
        cost += capacity.MEMORY * capacity.MEMORY_COST
        $(".cost_value").data("MEMORY_COST", capacity.MEMORY_COST);
      }

      $(".cost_value").html(cost.toFixed(2));
    } else {
      $(".provision_create_template_cost_div").hide();
    }

    if (Config.provision.create_vm.isEnabled("capacity_select") && (capacity.SUNSTONE_CAPACITY_SELECT != "NO")) {
      provision_instance_type_accordion_id += 1;

      var provision_instance_types_datatable = $('.provision_instance_types_table', context).dataTable({
        "iDisplayLength": 6,
        "sDom" : '<"H">t<"F"lp>',
        "bSort" : false,
        "aLengthMenu": [[6, 12, 36, 72], [6, 12, 36, 72]],
        "aoColumnDefs": [
            { "bVisible": false, "aTargets": ["all"]}
        ],
        "aoColumns": [
            { "mDataProp": "name" }
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
                Locale.tr("There are no instance_types available. Please contact your cloud administrator")+
              '</span>'+
              '</div>');
          } else {
            $(".provision_instance_types_table", context).html(
              '<ul class="provision_instance_types_ul large-block-grid-3 medium-block-grid-3 small-block-grid-1 text-center">'+
              '</ul>');
          }

          return true;
        },
        "fnRowCallback": function( nRow, aData, iDisplayIndex, iDisplayIndexFull ) {
          var data = aData;

          var li = $('<li>'+
              '<ul class="provision-pricing-table hoverable only-one" cpu="'+data.cpu+'" memory="'+data.memory+'">'+
                '<li class="provision-title" title="'+data.name+'">'+
                  data.name+
                '</li>'+
                '<li class="provision-bullet-item">'+
                  '<span style="font-size: 40px">'+
                  '<i class="fa fa-fw fa-laptop"/>&emsp;'+
                  '<span style="vertical-align: middle; font-size:14px">'+
                    'x'+data.cpu+' - '+
                    ((data.memory > 1000) ?
                      (Math.floor(data.memory/1024)+'GB') :
                      (data.memory+'MB'))+
                  '</span>'+
                  '</span>'+
                '</li>'+
                '<li class="provision-description">'+
                  (data.description || '')+
                '</li>'+
              '</ul>'+
            '</li>').appendTo($(".provision_instance_types_ul", context));

          $(".provision-pricing-table", li).data("opennebula", data)

          return nRow;
        }
      });


      $('.provision-search-input', context).on('keyup',function(){
        provision_instance_types_datatable.fnFilter( $(this).val() );
      })

      $('.provision-search-input', context).on('change',function(){
        provision_instance_types_datatable.fnFilter( $(this).val() );
      })

      context.on("click", ".provision-pricing-table.only-one" , function(){
        $(".cpu_value", context).html($(this).attr("cpu"));

        var memory_value;
        var memory_unit;

        if ($(this).attr("memory") > 1000){
          memory_value = Math.floor($(this).attr("memory")/1024);
          memory_unit = "GB";
        } else {
          memory_value = $(this).attr("memory");
          memory_unit = "MB";
        }

        $(".memory_value", context).html(memory_value);
        $(".memory_unit", context).html(memory_unit);

        if (Config.isFeatureEnabled("showback")) {
          var cost = 0;

          if ($(".cost_value").data("CPU_COST")) {
            cost += $(this).attr("cpu") * $(".cost_value").data("CPU_COST")
          }

          if ($(".cost_value").data("MEMORY_COST")) {
            cost += $(this).attr("memory") * $(".cost_value").data("MEMORY_COST")
          }

          $(".cost_value").html(cost.toFixed(2));
        }

        $('.accordion a', context).first().trigger("click");
      })

      $(document).foundation();

      update_provision_instance_types_datatable(provision_instance_types_datatable);
    }
  }

  var provision_nic_accordion_id = 0;
  var provision_nic_accordion_dd_id = 0;

  function generate_provision_network_table(context, nic, vnet_attr){
    context.off();
    var nic_span;

    if (nic) {
      nic_span = '<span class="selected_network" template_nic=\''+JSON.stringify(nic)+'\'>'+
          '<span style="color: #999; font-size: 14px">' + Locale.tr("INTERFACE") + "</span>&emsp;&emsp;" +
          '<span style="color: #777;">' + (nic.NETWORK||nic.NETWORK_ID) + "</span>" +
        '</span>'+
        '<span class="has-tip right provision_remove_nic" style="cursor: pointer;">'+
          '<i class="fa fa-times"/>'+
        '</span>'+
        '<span class="has-tip right" style="cursor: pointer; margin-right:10px">'+
          '<i class="fa fa-pencil"/>'+
        '</span>';
    } else if (vnet_attr) {
      nic_span = '<span style="color: #777; font-size: 16px">' + vnet_attr.description + "</span><br>"+
        '<span class="selected_network only-not-active" attr_name=\''+vnet_attr.name+'\' style="color: #777;">'+
          '<span style="color: #999; font-size: 14px">' + Locale.tr("INTERFACE") + "</span>&emsp;&emsp;" +
          '<span class="button radius small">' + Locale.tr("Select a Network") + "</span>" +
        '</span>'+
        '<span class="only-active" style="color:#555">'+
          Locale.tr("Select a Network for this interface")+
        '</span>'+
        '<span class="has-tip right only-not-active" style="cursor: pointer; margin-right:10px">'+
          '<i class="fa fa-pencil"/>'+
        '</span>';
    } else {
      nic_span =
        '<span class="selected_network only-not-active" style="color: #777;">'+
          '<span style="color: #999; font-size: 14px">' + Locale.tr("INTERFACE") + "</span>&emsp;&emsp;" +
          '<span class="button radius small">' + Locale.tr("Select a Network") + "</span>" +
        '</span>'+
        '<span class="only-active" style="color:#555">'+
          Locale.tr("Select a Network for this interface")+
        '</span>'+
        '<span class="has-tip right provision_remove_nic" style="cursor: pointer;">'+
          '<i class="fa fa-times"/>'+
        '</span>'+
        '<span class="has-tip right only-not-active" style="cursor: pointer; margin-right:10px">'+
          '<i class="fa fa-pencil"/>'+
        '</span>';
    }

    var dd_context = $('<dd style="border-bottom: 1px solid #efefef;" class="accordion-navigation">'+
      '<a href="#provision_accordion_dd_'+provision_nic_accordion_dd_id+'" style="background: #fff; font-size: 24px">'+
        nic_span +
      '</a>'+
      '<div id="provision_accordion_dd_'+provision_nic_accordion_dd_id+'" class="content">'+
        '<div class="row">'+
          '<div class="large-12 large-centered columns">'+
            '<h3 class="subheader text-right">'+
              '<input type="search" class="provision-search-input right" placeholder="Search"/>'+
            '</h3>'+
            '<br>'+
          '</div>'+
        '</div>'+
        '<div class="row">'+
          '<div class="large-12 large-centered columns">'+
            '<table class="provision_networks_table">'+
              '<thead class="hidden">'+
                '<tr>'+
                  '<th>'+Locale.tr("ID")+'</th>'+
                  '<th>'+Locale.tr("Name")+'</th>'+
                '</tr>'+
              '</thead>'+
              '<tbody class="hidden">'+
              '</tbody>'+
            '</table>'+
            '<br>'+
          '</div>'+
        '</div>'+
        '</div>'+
      '</dd>').appendTo(context);

    provision_nic_accordion_dd_id += 1;

    var provision_networks_datatable = $('.provision_networks_table', dd_context).dataTable({
      "iDisplayLength": 6,
      "sDom" : '<"H">t<"F"lp>',
      "aLengthMenu": [[6, 12, 36, 72], [6, 12, 36, 72]],
      "aoColumnDefs": [
          { "bVisible": false, "aTargets": ["all"]}
      ],
      "aoColumns": [
          { "mDataProp": "VNET.ID" },
          { "mDataProp": "VNET.NAME" }
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
              Locale.tr("There are no networks available. Please contact your cloud administrator")+
            '</span>'+
            '</div>');
        } else {
          $(".provision_networks_table", dd_context).html(
            '<ul class="provision_networks_ul large-block-grid-3 medium-block-grid-3 small-block-grid-1 text-center">'+
            '</ul>');
        }

        return true;
      },
      "fnRowCallback": function( nRow, aData, iDisplayIndex, iDisplayIndexFull ) {
        var data = aData.VNET;
        $(".provision_networks_ul", dd_context).append(
          '<li>'+
            '<ul class="provision-pricing-table hoverable more-than-one" opennebula_id="'+data.ID+'" opennebula_name="'+data.NAME+'">'+
              '<li class="provision-title" title="'+data.NAME+'">'+
                data.NAME+
              '</li>'+
              '<li class="provision-bullet-item">'+
                '<i class="fa fa-fw fa-globe" style="font-size:40px;"/>'+
              '</li>'+
              '<li class="provision-description">'+
                (data.TEMPLATE.DESCRIPTION || '...')+
              '</li>'+
            '</ul>'+
          '</li>');

        return nRow;
      }
    });


    $('.provision-search-input', dd_context).on('keyup',function(){
      provision_networks_datatable.fnFilter( $(this).val() );
    })

    $('.provision-search-input', dd_context).on('change',function(){
      provision_networks_datatable.fnFilter( $(this).val() );
    })

    dd_context.on("click", ".provision-pricing-table.more-than-one" , function(){
      $(".selected_network", dd_context).html(
          '<span style="color: #999; font-size: 14px">' + Locale.tr("INTERFACE") + "</span>&emsp;&emsp;" +
          '<span style="color: #777;">' + $(this).attr("opennebula_name") + "</span>");

      $(".selected_network", dd_context).attr("opennebula_id", $(this).attr("opennebula_id"))
      $(".selected_network", dd_context).removeAttr("template_nic")

      $('a', dd_context).first().trigger("click");
    })

    dd_context.on("click", ".provision_remove_nic" , function(){
      dd_context.remove();
      return false;
    });

    if (!nic && !vnet_attr) {
      $('a', dd_context).trigger("click");
    }

    update_provision_networks_datatable(provision_networks_datatable);
  }

  function generate_provision_network_accordion(context, hide_add_button){
    context.off();
    context.html(
      '<br>'+
      '<div class="row">'+
        '<div class="large-12 columns">'+
          '<h3 class="subheader text-right">'+
            '<span class="left">'+
              '<i class="fa fa-globe fa-lg"></i>&emsp;'+
              Locale.tr("Network")+
            '</span>'+
          '</h3>'+
          '<br>'+
        '</div>'+
      '</div>'+
      '<div class="row">'+
        '<div class="large-12 large-centered columns">'+
          '<dl class="accordion provision_nic_accordion" data-accordion="provision_accordion_'+provision_nic_accordion_id+'">'+
          '</dl>'+
          '<br>'+
          '<a class="button large-12 medium radius secondary provision_add_network_interface" style="padding: 1rem; color: #555; ' + (hide_add_button ? 'display:none;' : '') + '">'+
            Locale.tr("Add another Network Interface")+
          '</a>'+
        '</div>'+
      '</div>'+
      '<br>')

    provision_nic_accordion_id += 1;

    $(".provision_add_network_interface", context).on("click", function(){
      generate_provision_network_table($(".accordion", context));
    })

    $(document).foundation();
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

    if (Config.provision.dashboard.isEnabled("users")) {
      $("#provision_dashboard").append(TemplateDashboardUsers());

      var start_time =  Math.floor(new Date().getTime() / 1000);
      // ms to s

      // 604800 = 7 days = 7*24*60*60
      start_time = start_time - 604800;

      // today
      var end_time = -1;

      var options = {
        "start_time": start_time,
        "end_time": end_time,
        "group": config["user_gid"]
      }

      var no_table = true;

      OpenNebula.VM.accounting({
          success: function(req, response){
              Accounting.fillAccounting($("#dashboard_vdc_user_accounting"), req, response, no_table);
          },
          error: Notifier.onError,
          data: options
      });

      OpenNebula.User.list({
        timeout: true,
        success: function (request, item_list){
          var total = item_list.length || 0;

          var context = $("#provision_users_dashboard");
          $("#provision_dashboard_users_total", context).html(total);
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
              var default_user_quotas = QuotasDefault.default_quotas(user.DEFAULT_USER_QUOTAS);

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


  function show_provision_user_info() {
    Sunstone.runAction("Provision.User.show", "-1");
    $(".section_content").hide();
    $("#provision_user_info").fadeIn();
    $("dd.active a", $("#provision_user_info")).trigger("click");
  }



  function show_provision_group_info_callback(request, response) {
    var info = response.GROUP;

    var context = $("#provision_manage_vdc");

    var default_group_quotas = QuotaDefaults.default_quotas(info.DEFAULT_GROUP_QUOTAS);

    var quotas_tab_html = QuotaWidgets.initQuotasPanel(info, default_group_quotas,
                                        "#provision_vdc_quotas_div", false);

    $("#provision_vdc_quotas_div").html(quotas_tab_html);

    QuotaWidgets.setupQuotasPanel(info,
        "#provision_vdc_quotas_div",
        false,
        "Group");

    $("#provision_info_vdc_group_acct", context).html(Accounting.html());
    Accounting.setup(
      $("#provision_info_vdc_group_acct", context),
      {   fixed_group: info.ID,
          init_group_by: "user" });

    if (Config.isFeatureEnabled("showback")) {
      $("#provision_info_vdc_group_showback", context).html(Showback.html());
      Showback.setup(
        $("#provision_info_vdc_group_showback", context),
        {   fixed_user: "", fixed_group: info.ID });
    }

    $("#acct_placeholder", context).hide();
  }

  function show_provision_create_vm() {
    OpenNebula.Action.clear_cache("VMTEMPLATE");
    ProvisionTemplatesList.updateDatatable(provision_system_templates_datatable);
    provision_system_templates_datatable.fnFilter("^-$", 2, true, false)

    ProvisionTemplatesList.updateDatatable(provision_vdc_templates_datatable);
    provision_vdc_templates_datatable.fnFilter("^(?!\-$)", 2, true, false);
    provision_vdc_templates_datatable.fnFilter("^1$", 3, true, false);

    if (Config.isTabPanelEnabled("provision-tab", "templates")) {
      ProvisionTemplatesList.updateDatatable(provision_saved_templates_datatable);
      provision_saved_templates_datatable.fnFilter("^(?!\-$)", 2, true, false);
      provision_saved_templates_datatable.fnFilter("^0$", 3, true, false);
    }

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

  function show_provision_create_user() {
    $(".section_content").hide();
    $("#provision_create_user").fadeIn();
    $(document).foundation();
  }

  function show_provision_vdc_info() {
    $(".section_content").hide();
    $("#provision_manage_vdc").fadeIn();

    Sunstone.runAction('Provision.Group.show', "-1");
  }

  function update_provision_instance_types_datatable(datatable) {
      datatable.fnClearTable(true);
      if (!config['instance_types'] || config['instance_types'].length == 0) {
        datatable.html('<div class="text-center">'+
          '<span class="fa-stack fa-5x" style="color: #dfdfdf">'+
            '<i class="fa fa-cloud fa-stack-2x"></i>'+
            '<i class="fa fa-info-circle fa-stack-1x fa-inverse"></i>'+
          '</span>'+
          '<br>'+
          '<br>'+
          '<span style="font-size: 18px; color: #999">'+
            Locale.tr("There are no instance types available")+
          '</span>'+
          '</div>');
      } else {
        datatable.fnAddData(config['instance_types']);
      }
  }

  function update_provision_networks_datatable(datatable) {
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

    OpenNebula.Network.list({
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
              Locale.tr("There are no networks available.")+
            '</span>'+
            '</div>');
        } else {
          datatable.fnAddData(item_list);
        }
      },
      error: Notifier.onError
    });
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

  // Closes and resets the create user wizard
  function clear_provision_create_user(){
    OpenNebula.Action.clear_cache("USER");
    ProvisionUsersList.show(0);

    var context = $("#provision_create_user");
    $("#username", context).val('');
    $("#password", context).val('');
    $("#repeat_password", context).val('');

    ProvisionQuotaWidget.reset(context);

    $(".alert-box-error", context).hide();
    $(".alert-box-error", context).html("");
  }

  var Tab = {
    tabId: TAB_ID,
    list_header: "",
    actions: povision_actions,
    content: TemplateContent(),
    setup: _setup
  };

  return Tab;

  function _setup() {
    $(document).ready(function(){
      var tab_name = 'provision-tab';
      var tab = $("#"+tab_name);

      if (Config.isTabEnabled(tab_name)) {
        $('.right-header').prepend(TemplateHeader({'logo': Config.provision.logo}));

        $(".left-content").remove();
        $(".right-content").addClass("large-centered small-centered");
        $("#footer").removeClass("right");
        $("#footer").addClass("large-centered small-centered");

        //$(".user-zone-info").remove();

        $("#provision_logout").click(function(){
            OpenNebula.Auth.logout({
              success: function(){
                window.location.href = "login";
              }
            });

            return false;
        });

        ProvisionVmsList.generate($(".provision_vms_list_section"), {active: true});

        if (Config.isTabPanelEnabled("provision-tab", "templates")) {
          ProvisionTemplatesList.generate($(".provision_templates_list_section"), {active: true});
        }

        // TODO check if active
        ProvisionFlowsList.generate($(".provision_flows_list_section"), {active: true});
        ProvisionUsersList.generate($(".provision_users_list_section"), {active: true});

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

        $(document).on("click", ".provision_users_list_button", function(){
          OpenNebula.Action.clear_cache("USER");
          ProvisionUsersList.show(0);
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

        provision_system_templates_datatable = $('#provision_system_templates_table').dataTable({
          "iDisplayLength": 6,
          "sDom" : '<"H">t<"F"lp>',
          "aLengthMenu": [[6, 12, 36, 72], [6, 12, 36, 72]],
          "aoColumnDefs": [
              { "bVisible": false, "aTargets": ["all"]}
          ],
          "aoColumns": [
              { "mDataProp": "VMTEMPLATE.ID" },
              { "mDataProp": "VMTEMPLATE.NAME" },
              { "mDataProp": "VMTEMPLATE.TEMPLATE.SAVED_TEMPLATE_ID", "sDefaultContent" : "-"  }
          ],
          "fnPreDrawCallback": function (oSettings) {
            initializeTemplateCards(this, "provision_system_templates")
          },
          "fnRowCallback": function( nRow, aData, iDisplayIndex, iDisplayIndexFull ) {
            appendTemplateCard(aData, "provision_system_templates");
            return nRow;
          }
        });


        provision_vdc_templates_datatable = $('#provision_vdc_templates_table').dataTable({
          "iDisplayLength": 6,
          "sDom" : '<"H">t<"F"lp>',
          "aLengthMenu": [[6, 12, 36, 72], [6, 12, 36, 72]],
          "aoColumnDefs": [
              { "bVisible": false, "aTargets": ["all"]}
          ],
          "aoColumns": [
              { "mDataProp": "VMTEMPLATE.ID" },
              { "mDataProp": "VMTEMPLATE.NAME" },
              { "mDataProp": "VMTEMPLATE.TEMPLATE.SAVED_TEMPLATE_ID", "sDefaultContent" : "-"  },
              { "mDataProp": "VMTEMPLATE.PERMISSIONS.GROUP_U" }
          ],
          "fnPreDrawCallback": function (oSettings) {
            initializeTemplateCards(this, "provision_vdc_templates")
          },
          "fnRowCallback": function( nRow, aData, iDisplayIndex, iDisplayIndexFull ) {
            appendTemplateCard(aData, "provision_vdc_templates");
            return nRow;
          }
        });


        provision_saved_templates_datatable = $('#provision_saved_templates_table').dataTable({
          "iDisplayLength": 6,
          "sDom" : '<"H">t<"F"lp>',
          "aLengthMenu": [[6, 12, 36, 72], [6, 12, 36, 72]],
          "aoColumnDefs": [
              { "bVisible": false, "aTargets": ["all"]}
          ],
          "aoColumns": [
              { "mDataProp": "VMTEMPLATE.ID" },
              { "mDataProp": "VMTEMPLATE.NAME" },
              { "mDataProp": "VMTEMPLATE.TEMPLATE.SAVED_TEMPLATE_ID", "sDefaultContent" : "-"  },
              { "mDataProp": "VMTEMPLATE.PERMISSIONS.GROUP_U" }
          ],
          "fnPreDrawCallback": function (oSettings) {
            initializeTemplateCards(this, "provision_saved_templates")
          },
          "fnRowCallback": function( nRow, aData, iDisplayIndex, iDisplayIndexFull ) {
            appendTemplateCard(aData, "provision_saved_templates");
            return nRow;
          }
        });


        $('#provision_create_template_search').on('keyup',function(){
          provision_system_templates_datatable.fnFilter( $(this).val() );
          provision_saved_templates_datatable.fnFilter( $(this).val() );
          provision_vdc_templates_datatable.fnFilter( $(this).val() );
        })

        $('#provision_create_template_search').on('change',function(){
          provision_system_templates_datatable.fnFilter( $(this).val() );
          provision_saved_templates_datatable.fnFilter( $(this).val() );
          provision_vdc_templates_datatable.fnFilter( $(this).val() );
        })

        $("#provision_create_template_refresh_button").click(function(){
          OpenNebula.Action.clear_cache("VMTEMPLATE");
          ProvisionTemplatesList.updateDatatable(provision_system_templates_datatable);
          ProvisionTemplatesList.updateDatatable(provision_saved_templates_datatable);
          ProvisionTemplatesList.updateDatatable(provision_vdc_templates_datatable);

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

            var template_nic = template_json.VMTEMPLATE.TEMPLATE.NIC
            var nics = []
            if ($.isArray(template_nic))
                nics = template_nic
            else if (!$.isEmptyObject(template_nic))
                nics = [template_nic]

            $(".provision_accordion_template .selected_template").show();
            $(".provision_accordion_template .select_template").hide();
            $(".provision_accordion_template .selected_template_name").html(template_json.VMTEMPLATE.NAME)
            if (template_json.VMTEMPLATE.TEMPLATE.LOGO) {
              $(".provision_accordion_template .selected_template_logo").html('<img  src="'+template_json.VMTEMPLATE.TEMPLATE.LOGO+'">');
            } else {
              $(".provision_accordion_template .selected_template_logo").html('<i class="fa fa-file-text-o fa-lg"/>&emsp;');
            }

            $(".provision_accordion_template a").first().trigger("click");

            generate_provision_instance_type_accordion(
              $(".provision_capacity_selector", create_vm_context),
              template_json.VMTEMPLATE.TEMPLATE);

            var disksContext = $(".provision_disk_selector", create_vm_context);
            if (Config.provision.create_vm.isEnabled("disk_resize")) {
              DisksResize.insert(template_json, disksContext);
            } else {
              disksContext.html("");
            }

            if (Config.provision.create_vm.isEnabled("network_select") && (template_json.VMTEMPLATE.TEMPLATE.SUNSTONE_NETWORK_SELECT != "NO")) {
              generate_provision_network_accordion(
                $(".provision_network_selector", create_vm_context));

              $.each(nics, function(index, nic){
                  generate_provision_network_table(
                    $(".provision_nic_accordion", create_vm_context),
                    nic);
              })
            } else {
              $(".provision_network_selector", create_vm_context).html("");
            }

            if (template_json.VMTEMPLATE.TEMPLATE.USER_INPUTS) {
              generate_custom_attrs(
                $(".provision_custom_attributes_selector", create_vm_context),
                template_json.VMTEMPLATE.TEMPLATE.USER_INPUTS);
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

          var vm_name = $("#vm_name", context).val();
          var template_id = $(".tabs-content .content.active .selected", context).attr("opennebula_id");

          var nics = [];
          var nic;
          $(".selected_network", context).each(function(){
            if ($(this).attr("template_nic")) {
              nic = JSON.parse($(this).attr("template_nic"))
            } else if ($(this).attr("opennebula_id")) {
              nic = {
                'network_id': $(this).attr("opennebula_id")
              }
            } else {
              nic = undefined;
            }

            if (nic) {
              nics.push(nic);
            }
          });

          var disks = DisksResize.retrieve($(".provision_disk_selector", context));

          var instance_type = $(".provision_instance_types_ul .selected", context);

          if (!template_id) {
            $(".alert-box-error", context).fadeIn().html(Locale.tr("You must select at least a template configuration"));
            return false;
          }

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

          if (instance_type.length > 0) {
            var instance_typa_data = instance_type.data("opennebula");
            delete instance_typa_data.name;

            $.extend(extra_info.template, instance_typa_data)
          }

          var missing_attr = false;
          var user_inputs_values = {};
          if ($(".provision_custom_attributes", $(this))) {
            $(".provision_custom_attribute", $(".provision_custom_attributes", $(this))).each(function(){
              if (!$(this).val()) {
                $(this).parent("label").css("color", "red");
                missing_attr = true;
              } else {
                $(this).parent("label").css("color", "#777");
                user_inputs_values[$(this).attr("attr_name")] = $(this).val();
              }
            })
          }

          if (missing_attr) {
            $(".alert-box-error", $(this)).fadeIn().html(Locale.tr("You have not specified all the Custom Atrributes for this VM"));
            return false;
          }

          if (!$.isEmptyObject(user_inputs_values)) {
             $.extend(extra_info.template, user_inputs_values)
          }

          Sunstone.runAction("Provision.instantiate", template_id, extra_info);
          return false;
        })

        $(document).on("click", ".provision_create_vm_button", function(){
          show_provision_create_vm();
        });


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

        $('#provision_create_flow_template_search').on('keyup',function(){
          provision_flow_templates_datatable.fnFilter( $(this).val() );
        })

        $('#provision_create_flow_template_search').on('change',function(){
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
                    text_attrs.push(attrs)
                    break;
                  case "password":
                    text_attrs.push(attrs)
                    break;
                }
              })

              if (network_attrs.length > 0) {
                generate_provision_network_accordion(
                  $(".provision_network_selector", context), true);

                $.each(network_attrs, function(index, vnet_attr){
                  generate_provision_network_table(
                    $(".provision_nic_accordion", context),
                    null,
                    vnet_attr);
                });
              }

              //if (text_attrs.length > 0) {
              //  generate_custom_attrs(
              //    $(".provision_custom_attributes_selector", context),
              //    text_attrs);
              //}
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
                    id: template_id
                },
                success: function(request,template_json){
                  var role_context = $(role_html_id)

                  generate_cardinality_selector(
                    $(".provision_cardinality_selector", context),
                    role,
                    template_json);

                  if (template_json.VMTEMPLATE.TEMPLATE.USER_INPUTS) {
                    generate_custom_attrs(
                      $(".provision_custom_attributes_selector", role_context),
                      template_json.VMTEMPLATE.TEMPLATE.USER_INPUTS);
                  } else {
                    $(".provision_custom_attributes_selector", role_context).html("");
                  }
                }
              })


            })

            $(document).foundation();
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
          var missing_attr = false;

          $(".provision_create_flow_role", context).each(function(){
            var user_inputs_values = {};
            if ($(".provision_custom_attributes", $(this))) {
              $(".provision_custom_attribute", $(".provision_custom_attributes", $(this))).each(function(){
                if (!$(this).val()) {
                  $(this).parent("label").css("color", "red");
                  missing_attr = true;
                } else {
                  $(this).parent("label").css("color", "#777");
                  user_inputs_values[$(this).attr("attr_name")] = $(this).val();
                }
              })
            }

            var role_template = $(this).data("opennebula");

            $.each(role_template.elasticity_policies, function(i, pol){
                pol.expression = htmlDecode(pol.expression);
            });

            roles.push($.extend(role_template, {
              "cardinality": $(".cardinality_value", $(this)).text(),
              "user_inputs_values": user_inputs_values
            }));
          })

          var extra_info = {
            'merge_template': {
              "name" : flow_name,
              "roles" : roles,
              "custom_attrs_values": custom_attrs
            }
          }

          if (missing_attr) {
            $(".alert-box-error", $(this)).fadeIn().html(Locale.tr("You have not specified all the Custom Atrributes for this Service"));
            return false;
          }

          Sunstone.runAction("Provision.Flow.instantiate", template_id, extra_info);
          return false;
        })

        $(".provision_create_flow_button").on("click", function(){
          show_provision_create_flow();
        });

        //
        // Group Info
        //


        $("#provision_vdc_info_button").on("click", function(){
          OpenNebula.Action.clear_cache("GROUP");
          show_provision_vdc_info();
        });

        //
        // Create User
        //

        var context = $("#provision_create_user");

        ProvisionQuotaWidget.setup(context);

        // Workaround to fix sliders. Apparently the setup fails while they are hidden
        $('a[href="#provision_create_user_manual_quota"]', context).on("click", function(){
          $(".provision_rvms_quota_input", context).change();
          $(".provision_memory_quota_input", context).change();
          $(".provision_memory_quota_tmp_input", context).change();
          $(".provision_cpu_quota_input", context).change();
        });

        $("#provision_create_user").submit(function(){
          var context = $(this);

          var username = $("#username", context).val();
          var password = $("#password", context).val();
          var repeat_password = $("#repeat_password", context).val();

          // TODO driver
          var driver = 'core';

          if (!username.length || !password.length){
            $(".alert-box-error", context).fadeOut();
            $(".alert-box-error", context).fadeIn().html(Locale.tr("You have to provide a username and password"));
            return false;
          }

          if (password !== repeat_password){
            $(".alert-box-error", context).fadeOut();
            $(".alert-box-error", context).fadeIn().html(Locale.tr("Passwords do not match"));
            return false;
          }

          var user_json = { "user" :
                            { "name" : username,
                              "password" : password,
                              "auth_driver" : driver
                            }
                          };

          Sunstone.runAction("Provision.User.create",user_json);
          $(".alert-box-error", context).html('<div class="text-center">'+
            '<span class="fa-stack fa-5x" style="color: #dfdfdf">'+
              '<i class="fa fa-cloud fa-stack-2x"></i>'+
              '<i class="fa  fa-spinner fa-spin fa-stack-1x fa-inverse"></i>'+
            '</span>'+
            '<br>'+
            '<br>'+
            '<span style="font-size: 18px; color: #999">'+
            '</span>'+
            '</div>');

          return false;
        });

        $(document).on("click", ".provision_create_user_button", function(){
          show_provision_create_user();
        });
      }
    });
  }

});
