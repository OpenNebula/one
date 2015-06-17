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

  // Templates
  var TemplateContent = require('hbs!./provision-tab/content');
  var TemplateHeader = require('hbs!./provision-tab/header');

  var TemplateDashboardQuotas = require('hbs!./provision-tab/dashboard/quotas');
  var TemplateDashboardVdcQuotas = require('hbs!./provision-tab/dashboard/vdc-quotas');
  var TemplateDashboardVms = require('hbs!./provision-tab/dashboard/vms');
  var TemplateDashboardVdcVms = require('hbs!./provision-tab/dashboard/vdc-vms');
  var TemplateDashboardUsers = require('hbs!./provision-tab/dashboard/users');

  var TemplateVmsList = require('hbs!./provision-tab/vms/list');
  var TemplateFlowsList = require('hbs!./provision-tab/flows/list');
  var TemplateUsersList = require('hbs!./provision-tab/users/list');
  var TemplateGroupInfo = require('hbs!./provision-tab/group/info');
  var TemplateTemplatesList = require('hbs!./provision-tab/templates/list');

  var TAB_ID = require('./provision-tab/tabId');

  function setup_provision_quota_widget(context){
      // Mode selector, for the 3 sliders
      $("select.provision_quota_select", context).on('change', function(){
        var row = $(this).closest(".row");

        switch($(this).val()) {
          case "edit":
            $("div.provision_quota_edit", row).show();
            $("div.provision_quota_default", row).hide();
            $("div.provision_quota_unlimited", row).hide();

            $("input", row).change();

            break;

          case "default":
            $("div.provision_quota_edit", row).hide();
            $("div.provision_quota_default", row).show();
            $("div.provision_quota_unlimited", row).hide();

            break;

          case "unlimited":
            $("div.provision_quota_edit", row).hide();
            $("div.provision_quota_default", row).hide();
            $("div.provision_quota_unlimited", row).show();

            break;
        }

        return false;
      });

      var provision_rvms_quota_input = $(".provision_rvms_quota_input", context);

      $( ".provision_rvms_quota_slider", context).on('change', function(){
        provision_rvms_quota_input.val($(this).attr('data-slider'))
      });

      provision_rvms_quota_input.change(function() {
          $( ".provision_rvms_quota_slider", context).foundation(
                                              'slider', 'set_value', this.value);
      });

      var provision_cpu_quota_input = $(".provision_cpu_quota_input", context);

      $( ".provision_cpu_quota_slider", context).on('change', function(){
        provision_cpu_quota_input.val($(this).attr('data-slider'))
      });

      provision_cpu_quota_input.change(function() {
          $( ".provision_cpu_quota_slider", context).foundation(
                                              'slider', 'set_value', this.value);
      });

      var provision_memory_quota_input = $(".provision_memory_quota_input", context);
      var provision_memory_quota_tmp_input = $(".provision_memory_quota_tmp_input", context);

      var update_final_memory_input = function() {
        var value = provision_memory_quota_tmp_input.val();
        if (value > 0) {
         provision_memory_quota_input.val( Math.floor(value * 1024) );
        } else {
         provision_memory_quota_input.val(value);
        }
      }

      $( ".provision_memory_quota_slider", context).on('change', function(){
        provision_memory_quota_tmp_input.val($(this).attr('data-slider'));
        update_final_memory_input();
      });

      provision_memory_quota_tmp_input.change(function() {
          update_final_memory_input();
          $( ".provision_memory_quota_slider", context).foundation(
                                              'slider', 'set_value', this.value);
      });

      $(".provision_rvms_quota_input", context).val('').change();
      $(".provision_memory_quota_input", context).val('').change();
      $(".provision_memory_quota_tmp_input", context).val('').change();
      $(".provision_cpu_quota_input", context).val('').change();
  }

  function reset_provision_quota_widget(context){
    $("select.provision_quota_select", context).val('edit').change();

    $(".provision_rvms_quota_input", context).val('').change();
    $(".provision_memory_quota_input", context).val('').change();
    $(".provision_memory_quota_tmp_input", context).val('').change();
    $(".provision_cpu_quota_input", context).val('').change();
  }

  function retrieve_provision_quota_widget(context){
    var retrieve_quota = function(select, input){
      switch(select.val()) {
        case "edit":
          return input.val();
        case "default":
          return QuotaLimits.QUOTA_LIMIT_DEFAULT;
        case "unlimited":
          return QuotaLimits.QUOTA_LIMIT_UNLIMITED;
      }
    }

    var vms_limit = retrieve_quota(
          $(".provision_rvms_quota select.provision_quota_select", context),
          $(".provision_rvms_quota_input", context));

    var cpu_limit = retrieve_quota(
          $(".provision_cpu_quota select.provision_quota_select", context),
          $(".provision_cpu_quota_input", context));

    var mem_limit = retrieve_quota(
          $(".provision_memory_quota select.provision_quota_select", context),
          $(".provision_memory_quota_input", context));

    return {
      "VM" : {
        "VOLATILE_SIZE": QuotaLimits.QUOTA_LIMIT_DEFAULT,
        "VMS":    vms_limit,
        "MEMORY": mem_limit,
        "CPU":    cpu_limit
      }
    };
  }

  var provision_user_info = '<div id="provision_user_info" class="hidden section_content">'+
    '<div class="row">'+
      '<div class="large-12 large-centered columns">'+
        '<h2 class="subheader text-right">'+
          '<span class="left">'+
            '<i class="fa fa-fw fa-user"/>&emsp;'+
            config["display_name"]+
          '</span>'+
          '<a href"#" id="provision_user_info_refresh_button" data-tooltip title="'+ Locale.tr("Refresh")+'" class="has-tip tip-top">'+
            '<i class="fa fa-fw fa-refresh"/>'+
          '</a>&emsp;'+
          '<a href"#" class="off-color has-tip tip-top" data-tooltip title="Log out" id="provision_logout"><i class="fa fa-fw fa-sign-out"/></a>'+
        '</h2>'+
      '</div>'+
    '</div>'+
    '<br>'+
    '<div class="row">'+
      '<div class="large-12 large-centered columns">'+
        '<dl class="tabs text-center" data-tab style="width: 100%">'+
          '<dd class="active" style="width: '+ (Config.isFeatureEnabled("showback") ? '25%' : '33%')+';"><a href="#provision_info_settings"><i class="fa fa-fw fa-lg fa-cogs"/>&emsp;'+ Locale.tr("Settings") +'</a></dd>'+
          (Config.isFeatureEnabled("showback") ? '<dd style="width: 25%;"><a href="#provision_info_showback"><i class="fa fa-fw fa-lg fa-money"/>&emsp;'+ Locale.tr("Showback") +'</a></dd>' : '') +
          '<dd style="width: '+ (Config.isFeatureEnabled("showback") ? '25%' : '33%')+';"><a href="#provision_info_acct"><i class="fa fa-fw fa-lg fa-bar-chart-o"/>&emsp;'+ Locale.tr("Accounting") +'</a></dd>'+
          '<dd style="width: '+ (Config.isFeatureEnabled("showback") ? '25%' : '33%')+';"><a href="#provision_info_quotas"><i class="fa fa-fw fa-lg fa-align-left"/>&emsp;'+ Locale.tr("Quotas") +'</a></dd>'+
        '</dl>'+
        '<br>'+
      '</div>'+
    '</div>'+
    '<div class="tabs-content">'+
      '<div class="content" id="provision_info_acct">'+
        '<div class="row">'+
          '<div id="provision_user_info_acct_div" class="large-9 large-centered columns">'+
          '</div>'+
        '</div>'+
      '</div>'+
      (Config.isFeatureEnabled("showback") ? '<div class="content" id="provision_info_showback">'+
        '<div class="row">'+
          '<div id="provision_user_info_showback_div" class="large-12 large-centered columns">'+
          '</div>'+
        '</div>'+
      '</div>' : '')+
      '<div class="content" id="provision_info_quotas">'+
        '<div class="row">'+
          '<div id="provision_user_info_quotas_div" class="large-9 large-centered columns quotas">'+
          '</div>'+
        '</div>'+
      '</div>'+
      '<div class="content active" id="provision_info_settings">'+
        '<div class="row">'+
          '<div class="large-6 columns">'+
            '<div class="row">'+
              '<div class="large-12 large-centered columns">'+
                '<dl class="accordion" data-accordion>'+
                  '<dd class="accordion-navigation">'+
                    '<a href="#provision_update_language_accordion" class="text-center accordion-a">'+
                      '<div class="row only-not-active">'+
                        '<div class="large-12 large-centered columns">'+
                          '<div class="text-center">'+
                            '<span class="fa-stack fa-3x" style="color: #777">'+
                              '<i class="fa fa-cloud fa-stack-2x"></i>'+
                              '<i class="fa fa-comments fa-stack-1x fa-inverse"></i>'+
                            '</span>'+
                          '</div>'+
                        '</div>'+
                      '</div>'+
                      '<br class="only-not-active">'+
                      '<i class="fa fa-lg fa-comments only-active"></i> '+
                      Locale.tr("Change Language")+
                    '</a>'+
                    '<div id="provision_update_language_accordion" class="content">'+
                      '<br>'+
                      '<form id="provision_change_language_form">'+
                        '<div class="row">'+
                          '<div class="large-12 columns">'+
                            '<select type="language" id="provision_new_language" class="provision-input" style="height: 40px !important; font-size: 16px; padding: 0.5rem  !important;">'+
                            Locale.language_options +
                            '</select>'+
                          '</div>'+
                        '</div>'+
                        '<div class="row">'+
                          '<div class="large-12 columns">'+
                            '<button href"#" type="submit" class="button large radius large-12 small-12">'+Locale.tr("Update Language")+'</button>'+
                          '</div>'+
                        '</div>'+
                      '</form>'+
                    '</div>'+
                  '</dd>'+
                '</dl>'+
              '</div>'+
            '</div>'+
          '</div>'+
          '<div class="large-6 columns">'+
            '<div class="row">'+
              '<div class="large-12 large-centered columns">'+
                '<dl class="accordion" data-accordion>'+
                  '<dd class="accordion-navigation">'+
                    '<a href="#provision_update_password_accordion" class="text-center accordion-a">'+
                      '<div class="row only-not-active">'+
                        '<div class="large-12 large-centered columns">'+
                          '<div class="text-center">'+
                            '<span class="fa-stack fa-3x" style="color: #777">'+
                              '<i class="fa fa-cloud fa-stack-2x"></i>'+
                              '<i class="fa fa-lock fa-stack-1x fa-inverse"></i>'+
                            '</span>'+
                          '</div>'+
                        '</div>'+
                      '</div>'+
                      '<br class="only-not-active">'+
                      '<i class="fa fa-lg fa-lock only-active"></i> '+
                      Locale.tr("Change Password")+
                    '</a>'+
                    '<div id="provision_update_password_accordion" class="content">'+
                      '<br>'+
                      '<form id="provision_change_password_form">'+
                        '<div class="row">'+
                          '<div class="large-12 columns">'+
                            '<input type="password" id="provision_new_password" class="provision-input" placeholder="'+Locale.tr("New Password")+'" style="height: 40px !important; font-size: 16px; padding: 0.5rem  !important;"/>'+
                          '</div>'+
                        '</div>'+
                        '<div class="row">'+
                          '<div class="large-12 columns">'+
                            '<input type="password" id="provision_new_confirm_password" class="provision-input" placeholder="'+Locale.tr("Confirm Password")+'" style="height: 40px !important; font-size: 16px; padding: 0.5rem  !important;"/>'+
                          '</div>'+
                        '</div>'+
                        '<div class="row">'+
                          '<div class="large-12 columns">'+
                            '<button href"#" type="submit" class="button large radius large-12 small-12">'+Locale.tr("Update Password")+'</button>'+
                          '</div>'+
                        '</div>'+
                      '</form>'+
                    '</div>'+
                  '</dd>'+
                '</dl>'+
              '</div>'+
            '</div>'+
          '</div>'+
        '</div>'+
        '<br>'+
        '<br>'+
        '<div class="row">'+
          '<div class="large-6 columns">'+
            '<div class="row">'+
              '<div class="large-12 large-centered columns">'+
                '<dl class="accordion" data-accordion>'+
                  '<dd class="accordion-navigation">'+
                    '<a href="#provision_update_view_accordion" class="text-center accordion-a">'+
                      '<div class="row only-not-active">'+
                        '<div class="large-12 large-centered columns">'+
                          '<div class="text-center">'+
                            '<span class="fa-stack fa-3x" style="color: #777">'+
                              '<i class="fa fa-cloud fa-stack-2x"></i>'+
                              '<i class="fa fa-picture-o fa-stack-1x fa-inverse"></i>'+
                            '</span>'+
                          '</div>'+
                        '</div>'+
                      '</div>'+
                      '<br class="only-not-active">'+
                      '<i class="fa fa-lg fa-picture-o only-active"></i> '+
                      Locale.tr("Change view")+
                    '</a>'+
                    '<div id="provision_update_view_accordion" class="content">'+
                      '<br>'+
                      '<form id="provision_change_view_form">'+
                        '<div class="row">'+
                          '<div class="large-12 columns">'+
                            '<select id="provision_user_views_select" class="provision-input" style="height: 40px !important; font-size: 16px; padding: 0.5rem  !important;">'+
                            '</select>'+
                          '</div>'+
                        '</div>'+
                        '<div class="row">'+
                          '<div class="large-12 columns">'+
                            '<button href"#" type="submit" class="button large radius large-12 small-12">'+Locale.tr("Update view")+'</button>'+
                          '</div>'+
                        '</div>'+
                      '</form>'+
                    '</div>'+
                  '</dd>'+
                '</dl>'+
              '</div>'+
            '</div>'+
          '</div>'+
          '<div class="large-6 columns">'+
            '<form id="provision_add_ssh_key_form">'+
              '<div class="row">'+
                '<div class="large-12 large-centered columns">'+
                  '<dl class="accordion" data-accordion>'+
                    '<dd class="accordion-navigation">'+
                      '<a href="#provision_add_ssh_key_accordion" class="text-center accordion-a">'+
                        '<div class="row only-not-active">'+
                          '<div class="large-12 large-centered columns">'+
                            '<div class="text-center">'+
                              '<span class="fa-stack fa-3x" style="color: #777">'+
                                '<i class="fa fa-cloud fa-stack-2x"></i>'+
                                '<i class="fa fa-key fa-stack-1x fa-inverse"></i>'+
                              '</span>'+
                            '</div>'+
                          '</div>'+
                        '</div>'+
                        '<br class="only-not-active">'+
                        '<i class="fa fa-key fa-lg only-active"></i> '+
                        '<span class="provision_add_ssh_key_button">'+ Locale.tr("Add SSH Key")+ '</span>'+
                        '<span class="provision_update_ssh_key_button">'+ Locale.tr("Update SSH Key")+ '</span>'+
                      '</a>'+
                      '<div id="provision_add_ssh_key_accordion" class="content">'+
                        '<br>'+
                        '<p style="font-size: 16px; color: #999">'+
                          '<span class="provision_add_ssh_key_button">'+
                            Locale.tr("Add a public SSH key to your account!")+
                            '<br>'+
                            Locale.tr("You will be able to access your Virtual Machines without password")+
                          '</span>'+
                          '<span class="provision_update_ssh_key_button">'+
                            Locale.tr("Update your public SSH key!")+
                            '<br>'+
                            Locale.tr("You will be able to access your Virtual Machines without password")+
                          '</span>'+
                        '</p>'+
                        '<div class="row">'+
                          '<div class="large-12 large-centered columns">'+
                            '<textarea id="provision_ssh_key" style="height: 100px; font-size: 14px" placeholder="SSH key" class="provision-input"></textarea>'+
                          '</div>'+
                        '</div>'+
                        '<div class="row">'+
                          '<div class="large-12 large-centered columns">'+
                            '<button href="#" type="submit" class="provision_add_ssh_key_button button large radius large-12 small-12">'+Locale.tr("Add SSH Key")+'</button>'+
                            '<button href="#" type="submit" class="provision_update_ssh_key_button button large radius large-12 small-12 hidden">'+Locale.tr("Update SSH Key")+'</button>'+
                          '</div>'+
                        '</div>'+
                      '</div>'+
                    '</dd>'+
                  '</dl>'+
                '</div>'+
              '</div>'+
            '</form>'+
          '</div>'+
        '</div>'+
      '</div>'+
    '</div>'+
  '</div>';


  var list_users_accordion_id = 0;
  function provision_list_users(opts_arg){
    list_users_accordion_id += 1;
    return TemplateUsersList({'accordionId': list_users_accordion_id});
  }

  var list_templates_accordion_id = 0;
  function provision_list_templates(opts_arg){
    opts = $.extend({
        title: Locale.tr("Saved Templates"),
        refresh: true,
        create: true,
        active: true,
        filter: true
      },opts_arg)

    list_templates_accordion_id += 1;
    return TemplateTemplatesList({'accordionId': list_templates_accordion_id, 'opts': opts});
  }

  var list_vms_accordion_id = 0;
  function provision_list_vms(opts_arg){
    opts = $.extend({
        title: Locale.tr("Virtual Machines"),
        refresh: true,
        create: true,
        filter: true
      },opts_arg)

    list_vms_accordion_id += 1;
    return TemplateVmsList({'accordionId': list_vms_accordion_id, 'opts': opts});
  }

  var list_flows_accordion_id = 0;
  function provision_list_flows(opts_arg){
    opts = $.extend({
        title: Locale.tr("Services"),
        active: true,
        refresh: true,
        create: true,
        filter: true
      },opts_arg)

    list_flows_accordion_id += 1;
    return TemplateVmsList({'accordionId': list_flows_accordion_id, 'opts': opts});
  }

  var povision_actions = {
    "Provision.User.show" : {
        type: "single",
        call: OpenNebula.User.show,
        callback: show_provision_user_info_callback,
        error: Notifier.onError
    },

    "Provision.User.passwd" : {
        type: "single",
        call: OpenNebula.User.passwd,
        callback: function() {
          show_provision_user_info();
          Notifier.notifyMessage("Password updated successfully");
        },
        error: Notifier.onError
    },

    "Provision.User.update_template" : {
        type: "single",
        call: OpenNebula.User.update,
        callback: function() {
          show_provision_user_info();
          Notifier.notifyMessage("SSH key updated successfully");
        },
        error: Notifier.onError
    },

    "Provision.User.create" : {
        type: "create",
        call: OpenNebula.User.create,
        callback: function(request, response) {
          if ( $("div#provision_create_user_manual_quota",
               $("#provision_create_user")).hasClass("active") ){

            quota_json = retrieve_provision_quota_widget($("#provision_create_user"));

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
        show_provision_flow_list(0);
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
        show_provision_vm_list(0);
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
          '</h3>'+
          '<br>'+
        '</div>'+
      '</div>'+
      '<br>'+
      '<div class="row">'+
        '<div class="large-12 large-centered columns">'+
          '<div class="row text-center">'+
            '<div class="large-4 columns">'+
              '<span class="cpu_value" style="color: #777; font-size:60px">'+(capacity.CPU ? capacity.CPU : '-')+'</span>'+
              '<br>'+
              '<span style="color: #999;">'+Locale.tr("CPU")+'</span>'+
            '</div>'+
            '<div class="large-4 columns">'+
              '<span class="memory_value" style="color: #777; font-size:60px">'+memory_value+'</span>'+
              ' '+
              '<span class="memory_unit" style="color: #777; font-size:30px">'+memory_unit+'</span>'+
              '<br>'+
              '<span style="color: #999;">'+Locale.tr("MEMORY")+'</span>'+
            '</div>'+
            '<div class="large-4 columns provision_create_template_cost_div hidden">'+
              '<span class="cost_value" style="color: #777; font-size:60px"></span>'+
              '<br>'+
              '<span style="color: #999;">'+Locale.tr("COST")+' / ' + Locale.tr("HOUR") + '</span>'+
            '</div>'+
          '</div>'+
        '</div>'+
      '</div>'+
      (Config.provision.create_vm.isEnabled("capacity_select") && (capacity.SUNSTONE_CAPACITY_SELECT != "NO") ?
      '<br>'+
      '<br>'+
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
      '<br>'+
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
              var state = get_provision_vm_state(vm.VM);

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
              var state = get_provision_vm_state(vm.VM);

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

  }


  function show_provision_user_info() {
    Sunstone.runAction("Provision.User.show", "-1");
    $(".section_content").hide();
    $("#provision_user_info").fadeIn();
    $("dd.active a", $("#provision_user_info")).trigger("click");
  }


  function show_provision_user_info_callback(request, response) {
    var info = response.USER;

    var default_user_quotas = QuotaDefaults.default_quotas(info.DEFAULT_USER_QUOTAS);

    var quotas_tab_html = QuotaWidgets.initQuotasPanel(info, default_user_quotas,
                                        "#provision_user_info_quotas_div", false);

    $("#provision_user_info_quotas_div").html(quotas_tab_html);

    QuotaWidgets.setupQuotasPanel(info,
        "#provision_user_info_quotas_div",
        false,
        "User");

    var ssh_key = info.TEMPLATE.SSH_PUBLIC_KEY;
    if (ssh_key && ssh_key.length) {
      $("#provision_ssh_key").val(ssh_key);
      $(".provision_add_ssh_key_button").hide();
      $(".provision_update_ssh_key_button").show();
    } else {
      $(".provision_add_ssh_key_button").show();
      $(".provision_update_ssh_key_button").hide();
    }

    $('#provision_new_language option[value="'+config['user_config']["lang"]+'"]').attr('selected','selected');
    $('#provision_user_views_select option[value="'+config['user_config']["default_view"]+'"]').attr('selected','selected');

    $("#provision_user_info_acct_div").html(Accounting.html());
    Accounting.setup(
      $("#provision_user_info_acct_div"),
        { fixed_user: info.ID,
          fixed_group_by: "vm" });


    if (Config.isFeatureEnabled("showback")) {
      $("#provision_user_info_showback_div").html(Showback.html());
      Showback.setup(
        $("#provision_user_info_showback_div"),
          { fixed_user: info.ID, fixed_group: ""});
    }
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
    update_provision_templates_datatable(provision_system_templates_datatable);
    provision_system_templates_datatable.fnFilter("^-$", 2, true, false)

    update_provision_templates_datatable(provision_vdc_templates_datatable);
    provision_vdc_templates_datatable.fnFilter("^(?!\-$)", 2, true, false);
    provision_vdc_templates_datatable.fnFilter("^1$", 3, true, false);

    if (Config.isTabPanelEnabled("provision-tab", "templates")) {
      update_provision_templates_datatable(provision_saved_templates_datatable);
      provision_saved_templates_datatable.fnFilter("^(?!\-$)", 2, true, false);
      provision_saved_templates_datatable.fnFilter("^0$", 3, true, false);
    }

    $(".provision_accordion_template .selected_template").hide();
    $(".provision_accordion_template .select_template").show();

    $("#provision_create_vm .provision_capacity_selector").html("");
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

  function show_provision_vm_list(timeout, context) {
    $(".section_content").hide();
    $(".provision_vms_list_section").fadeIn();

    $("dd:not(.active) .provision_back", $(".provision_vms_list_section")).trigger("click");
    $(".provision_vms_list_refresh_button", $(".provision_vms_list_section")).trigger("click");
  }

  function show_provision_flow_list(timeout) {
    $(".section_content").hide();
    $(".provision_flows_list_section").fadeIn();

    $("dd:not(.active) .provision_back", $(".provision_flows_list_section")).trigger("click");
    $(".provision_flows_list_refresh_button", $(".provision_flows_list_section")).trigger("click");
  }

  function show_provision_user_list(timeout) {
    $(".section_content").hide();
    $(".provision_users_list_section").fadeIn();

    $("dd:not(.active) .provision_back", $(".provision_users_list_section")).trigger("click");
    $(".provision_users_list_refresh_button", $(".provision_users_list_section")).trigger("click");
  }

  function show_provision_vdc_info() {
    $(".section_content").hide();
    $("#provision_manage_vdc").fadeIn();

    Sunstone.runAction('Provision.Group.show', "-1");
  }

  function show_provision_template_list(timeout) {
    $(".section_content").hide();
    $(".provision_templates_list_section").fadeIn();

    //$("dd:not(.active) .provision_back", $(".provision_templates_list_section")).trigger("click");
    $(".provision_templates_list_refresh_button", $(".provision_templates_list_section")).trigger("click");
  }

  function update_provision_templates_datatable(datatable, timeout) {
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
      OpenNebula.Template.list({
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


  function update_provision_users_datatable(datatable, timeout) {
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
      OpenNebula.User.list({
        timeout: true,
        success: function (request, item_list, quotas_list){
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
                Locale.tr("The list of users is empty")+
              '</span>'+
              '</div>');
          } else {
            provision_quotas_list = quotas_list;
            datatable.fnAddData(item_list);
          }
        },
        error: Notifier.onError
      })
    }, timeout );
  }

  function fill_provision_vms_datatable(datatable, item_list){
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
          Locale.tr("There are no Virtual Machines")+
        '</span>'+
        '<br>'+
        '<br>'+
        '</div>');
    } else {
      datatable.fnAddData(item_list);
    }
  }

  function update_provision_vms_datatable(datatable, timeout) {
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

      var data = datatable.data('opennebula');
      if (data) {
        fill_provision_vms_datatable(datatable, data)
      } else {
        setTimeout( function(){
          OpenNebula.VM.list({
            timeout: true,
            success: function (request, item_list){
              fill_provision_vms_datatable(datatable, item_list)
            },
            error: Notifier.onError
          })
        }, timeout );
      }
  }

  function update_provision_flows_datatable(datatable, timeout) {
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
      OpenNebula.Service.list({
        timeout: true,
        success: function (request, item_list){
          $(".flow_error_message").hide();
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
                Locale.tr("There are no Services")+
              '</span>'+
              '<br>'+
              '<br>'+
              '</div>');
          } else {
            datatable.fnAddData(item_list);
          }
        },
        error: function(request, error_json) {
          datatable.html('<div class="text-center">'+
            '<br>'+
            '<br>'+
            '<div class="row flow_error_message" id="" hidden>'+
              '<div class="small-6 columns small-centered text-center">'+
                  '<div class="alert-box alert radius">'+Locale.tr("Cannot connect to OneFlow server")+'</div>'+
              '</div>'+
            '</div>'+
            '<br>'+
            '<br>'+
            '<span style="font-size: 18px; color: #999">'+
            '</span>'+
            '</div>');

            Notifier.onError(request, error_json, $(".flow_error_message"));
        }
      })
    }, timeout );
  }


  function get_provision_flow_start_time(data) {
    if (data.log) {
      return data.log[0].timestamp
    } else {
      return null;
    }
  }

  // @params
  //    data: and BODY object of the Document representing the Service
  //      Example: data.ID
  // @returns and object containing the following properties
  //    color: css class for this state.
  //      color + '-color' font color class
  //      color + '-bg' background class
  //    str: user friendly state string
  function get_provision_flow_state(data) {
    var state = OpenNebula.Service.state(data.state);
    var state_color;
    var state_str;

    switch (state) {
      case Locale.tr("PENDING"):
        state_color = 'deploying';
        state_str = Locale.tr("PENDING");
        break;
      case Locale.tr("DEPLOYING"):
        state_color = 'deploying';
        state_str = Locale.tr("DEPLOYING");
        break;
      case Locale.tr("UNDEPLOYING"):
        state_color = 'powering_off';
        state_str = Locale.tr("UNDEPLOYING");
        break;
      case Locale.tr("FAILED_UNDEPLOYING"):
        state_color = 'error';
        state_str = Locale.tr("FAILED UNDEPLOYING");
        break;
      case Locale.tr("FAILED_DEPLOYING"):
        state_color = 'error';
        state_str = Locale.tr("FAILED DEPLOYING");
        break;
      case Locale.tr("FAILED_SCALING"):
        state_color = 'error';
        state_str = Locale.tr("FAILED SCALING");
        break;
      case Locale.tr("WARNING"):
        state_color = 'error';
        state_str = Locale.tr("WARNING");
        break;
      case Locale.tr("RUNNING"):
        state_color = 'running';
        state_str = Locale.tr("RUNNING");
        break;
      case Locale.tr("SCALING"):
        state_color = 'deploying';
        state_str = Locale.tr("SCALING");
        break;
      case Locale.tr("COOLDOWN"):
        state_color = 'error';
        state_str = Locale.tr("COOLDOWN");
        break;
      case Locale.tr("DONE"):
        state_color = 'off';
        state_str = Locale.tr("DONE");
        break;
      default:
        state_color = 'powering_off';
        state_str = Locale.tr("UNKNOWN");
        break;
    }

    return {
      color: state_color,
      str: state_str
    }
  }

  // @params
  //    data: and VM object
  //      Example: data.ID
  // @returns and object containing the following properties
  //    color: css class for this state.
  //      color + '-color' font color class
  //      color + '-bg' background class
  //    str: user friendly state string
  function get_provision_vm_state(data) {
    var state = OpenNebula.VM.stateStr(data.STATE);
    var state_color;
    var state_str;

    switch (state) {
      case "INIT":
      case "PENDING":
      case "HOLD":
        state_color = 'deploying';
        state_str = Locale.tr("DEPLOYING") + " (1/3)";
        break;
      case "FAILED":
        state_color = 'error';
        state_str = Locale.tr("ERROR");
        break;
      case "ACTIVE":
        var lcm_state = OpenNebula.VM.shortLcmStateStr(data.LCM_STATE);

        switch (lcm_state) {
          case "LCM_INIT":
            state_color = 'deploying';
            state_str = Locale.tr("DEPLOYING") + " (1/3)";
            break;
          case "PROLOG":
            state_color = 'deploying';
            state_str = Locale.tr("DEPLOYING") + " (2/3)";
            break;
          case "BOOT":
            state_color = 'deploying';
            state_str = Locale.tr("DEPLOYING") + " (3/3)";
            break;
          case "RUNNING":
          case "SNAPSHOT":
          case "MIGRATE":
            state_color = 'running';
            state_str = Locale.tr("RUNNING");
            break;
          case "HOTPLUG":
            state_color = 'deploying';
            state_str = Locale.tr("SAVING IMAGE");
            break;
          case "FAILURE":
            state_color = 'error';
            state_str = Locale.tr("ERROR");
            break;
          case "SAVE":
          case "EPILOG":
          case "SHUTDOWN":
          case "CLEANUP":
            state_color = 'powering_off';
            state_str = Locale.tr("POWERING OFF");
            break;
          case "UNKNOWN":
            state_color = 'powering_off';
            state_str = Locale.tr("UNKNOWN");
            break;
          default:
            state_color = 'powering_off';
            state_str = Locale.tr("UNKNOWN");
            break;
        }

        break;
      case "STOPPED":
      case "SUSPENDED":
      case "POWEROFF":
        state_color = 'off';
        state_str = Locale.tr("OFF");

        break;
      default:
        state_color = 'powering_off';
        state_str = Locale.tr("UNKNOWN");
        break;
    }

    return {
      color: state_color,
      str: state_str
    }
  }

  function get_provision_disk_image(data) {
    var disks = []
    if ($.isArray(data.TEMPLATE.DISK))
        disks = data.TEMPLATE.DISK
    else if (!$.isEmptyObject(data.TEMPLATE.DISK))
        disks = [data.TEMPLATE.DISK]

    if (disks.length > 0) {
      return '<i class="fa fa-fw fa-lg fa-download"></i> ' + disks[0].IMAGE;
    } else {
      return '<i class="fa fa-fw fa-lg fa-download"></i> -';
    }
  }

  function get_provision_ips(data) {
    return '<i class="fa fa-fw fa-lg fa-globe"></i> ' + OpenNebula.VM.ipsStr(data);
  }

  // @params
  //    data: and IMAGE object
  //      Example: data.ID
  // @returns and object containing the following properties
  //    color: css class for this state.
  //      color + '-color' font color class
  //      color + '-bg' background class
  //    str: user friendly state string
  function get_provision_image_state(data) {
    var state = OpenNebula.Image.stateStr(data.STATE);
    var state_color;
    var state_str;

    switch (state) {
      case "READY":
      case "USED":
        state_color = 'running';
        state_str = Locale.tr("READY");
        break;
      case "DISABLED":
      case "USED_PERS":
        state_color = 'off';
        state_str = Locale.tr("OFF");
        break;
      case "LOCKED":
      case "CLONE":
      case "INIT":
        state_color = 'deploying';
        state_str = Locale.tr("DEPLOYING") + " (1/3)";
        break;
      case "ERROR":
        state_color = 'error';
        state_str = Locale.tr("ERROR");
        break;
      case "DELETE":
        state_color = 'error';
        state_str = Locale.tr("DELETING");
        break;
      default:
        state_color = 'powering_off';
        state_str = Locale.tr("UNKNOWN");
        break;
    }

    return {
      color: state_color,
      str: state_str
    }
  }

  function setup_info_vm(context) {
    function update_provision_vm_info(vm_id, context) {
      //var tempScrollTop = $(window).scrollTop();
      $(".provision_info_vm_name", context).text("");
      $(".provision_info_vm_loading", context).show();
      $(".provision_info_vm", context).css('visibility', 'hidden');

      OpenNebula.VM.show({
        data : {
          id: vm_id
        },
        error: Notifier.onError,
        success: function(request, response){
          var data = response.VM
          var state = get_provision_vm_state(data);

          switch (state.color) {
            case "deploying":
              $(".provision_reboot_confirm_button", context).hide();
              $(".provision_poweroff_confirm_button", context).hide();
              $(".provision_poweron_button", context).hide();
              $(".provision_delete_confirm_button", context).show();
              $(".provision_shutdownhard_confirm_button", context).hide();
              $(".provision_snapshot_button", context).hide();
              $(".provision_vnc_button", context).hide();
              $(".provision_snapshot_button_disabled", context).hide();
              $(".provision_vnc_button_disabled", context).hide();
              break;
            case "running":
              $(".provision_reboot_confirm_button", context).show();
              $(".provision_poweroff_confirm_button", context).show();
              $(".provision_poweron_button", context).hide();
              $(".provision_delete_confirm_button", context).hide();
              $(".provision_shutdownhard_confirm_button", context).show();
              $(".provision_snapshot_button", context).hide();
              $(".provision_vnc_button", context).show();
              $(".provision_snapshot_button_disabled", context).show();
              $(".provision_vnc_button_disabled", context).hide();
              break;
            case "off":
              $(".provision_reboot_confirm_button", context).hide();
              $(".provision_poweroff_confirm_button", context).hide();
              $(".provision_poweron_button", context).show();
              $(".provision_delete_confirm_button", context).show();
              $(".provision_shutdownhard_confirm_button", context).hide();
              $(".provision_snapshot_button", context).show();
              $(".provision_vnc_button", context).hide();
              $(".provision_snapshot_button_disabled", context).hide();
              $(".provision_vnc_button_disabled", context).show();
              break;
            case "powering_off":
            case "error":
              $(".provision_reboot_confirm_button", context).hide();
              $(".provision_poweroff_confirm_button", context).hide();
              $(".provision_poweron_button", context).hide();
              $(".provision_delete_confirm_button", context).show();
              $(".provision_shutdownhard_confirm_button", context).hide();
              $(".provision_snapshot_button", context).hide();
              $(".provision_vnc_button", context).hide();
              $(".provision_snapshot_button_disabled", context).hide();
              $(".provision_vnc_button_disabled", context).hide();
              break;
            default:
              color = 'secondary';
              $(".provision_reboot_confirm_button", context).hide();
              $(".provision_poweroff_confirm_button", context).hide();
              $(".provision_poweron_button", context).hide();
              $(".provision_delete_confirm_button", context).show();
              $(".provision_shutdownhard_confirm_button", context).hide();
              $(".provision_snapshot_button", context).hide();
              $(".provision_vnc_button", context).hide();
              $(".provision_snapshot_button_disabled", context).hide();
              $(".provision_vnc_button_disabled", context).hide();
              break;
          }

          if (!OpenNebula.VM.isVNCSupported(data) && !OpenNebula.VM.isSPICESupported(data)) {
              $(".provision_vnc_button", context).hide();
              $(".provision_vnc_button_disabled", context).hide();
          }

          $(".provision_info_vm", context).attr("vm_id", data.ID);
          $(".provision_info_vm", context).data("vm", data);

          $(".provision_info_vm_name", context).text(data.NAME);

          $(".provision-pricing-table_vm_info", context).html(
              '<li class="text-left provision-title">'+
                '<span class="'+ state.color +'-color">'+
                  '<i class="fa fa-fw fa-lg fa-square"/>&emsp;'+
                  state.str+
                '</span>'+
              '</li>'+
              '<li class="text-left provision-bullet-item">'+
                '<hr style="margin: 0px">'+
              '</li>'+
              '<li class="text-left provision-bullet-item" >'+
                '<span style="font-size: 16px">'+
                  '<i class="fa fa-fw fa-lg fa-laptop"/>&emsp;'+
                  'x'+data.TEMPLATE.CPU+' - '+
                  ((data.TEMPLATE.MEMORY > 1000) ?
                    (Math.floor(data.TEMPLATE.MEMORY/1024)+'GB') :
                    (data.TEMPLATE.MEMORY+'MB'))+
                '</span>'+
              '</li>'+
              '<li class="text-left provision-bullet-item" >'+
                '<span style="font-size: 16px">'+
                  get_provision_disk_image(data) +
                '</span>'+
              '</li>'+
              '<li class="text-left provision-bullet-item" >'+
                '<span style="font-size: 16px">'+
                  get_provision_ips(data) +
                '</span>'+
              '</li>'+
              //'<li  class="text-left provision-bullet-item" >'+
              //  '<span style="color: #afafaf;" style="font-size: 16px">'+
              //    "ID: " +
              //    data.ID+
              //  '</span>' +
              //'</li>'+
              '<li class="text-left provision-bullet-item">'+
                '<hr style="margin: 0px">'+
              '</li>'+
              '<li class="text-left provision-bullet-item" style="font-size: 16px">'+
                '<span style="color: #999;">'+
                  '<i class="fa fa-fw fa-lg fa-clock-o"/>&emsp;'+
                  Humanize.prettyTimeAgo(data.STIME)+
                '</span>'+
              '</li>'+
              '<li class="text-left provision-bullet-item" style="font-size: 16px">'+
                '<span style="color: #999;">'+
                  '<i class="fa fa-fw fa-lg fa-user"/>&emsp;'+
                  data.UNAME+
                '</span>'+
              '</li>'+
              '<li class="text-left provision-bullet-item" style="font-size: 16px">'+
                '<span style="color: #999;">'+
                  '<i class="fa fa-fw fa-lg fa-link"/>&emsp;'+
                  data.ID+
                '</span>'+
              '</li>'+
              '<li class="text-left provision-bullet-item">'+
              '</li>');

          $(".provision_confirm_action:first", context).html("");

          $(".provision_info_vm", context).css('visibility', 'visible');
          $(".provision_info_vm_loading", context).hide();

          //$(window).scrollTop(tempScrollTop);

          OpenNebula.VM.monitor({
            data : {
              timeout: true,
              id: data.ID,
              monitor: {
                monitor_resources : "CPU,MEMORY,NET_TX,NET_RX"
              }
            },
            success: function(request, response){
              var vm_graphs = [
                  {
                      monitor_resources : "CPU",
                      labels : "Real CPU",
                      humanize_figures : false,
                      div_graph : $(".vm_cpu_graph", context)
                  },
                  {
                      monitor_resources : "MEMORY",
                      labels : "Real MEM",
                      humanize_figures : true,
                      div_graph : $(".vm_memory_graph", context)
                  },
                  {
                      labels : "Network reception",
                      monitor_resources : "NET_RX",
                      humanize_figures : true,
                      convert_from_bytes : true,
                      div_graph : $(".vm_net_rx_graph", context)
                  },
                  {
                      labels : "Network transmission",
                      monitor_resources : "NET_TX",
                      humanize_figures : true,
                      convert_from_bytes : true,
                      div_graph : $(".vm_net_tx_graph", context)
                  },
                  {
                      labels : "Network reception speed",
                      monitor_resources : "NET_RX",
                      humanize_figures : true,
                      convert_from_bytes : true,
                      y_sufix : "B/s",
                      derivative : true,
                      div_graph : $(".vm_net_rx_speed_graph", context)
                  },
                  {
                      labels : "Network transmission speed",
                      monitor_resources : "NET_TX",
                      humanize_figures : true,
                      convert_from_bytes : true,
                      y_sufix : "B/s",
                      derivative : true,
                      div_graph : $(".vm_net_tx_speed_graph", context)
                  }
              ];

              for(var i=0; i<vm_graphs.length; i++) {
                  Graphs.plot(
                      response,
                      vm_graphs[i]
                  );
              }
            }
          })
        }
      })
    }

    if (Config.isTabPanelEnabled("provision-tab", "templates")) {
      context.on("click", ".provision_snapshot_button", function(){
        $(".provision_confirm_action:first", context).html(
          '<div data-alert class="alert-box secondary radius">'+
            '<div class="row">'+
              '<div class="large-12 columns">'+
                '<span style="font-size: 14px; line-height: 20px">'+
                  Locale.tr("This Virtual Machine will be saved in a new Template. Only the main disk will be preserved!")+
                '<br>'+
                  Locale.tr("You can then create a new Virtual Machine using this Template")+
                '</span>'+
              '</div>'+
            '</div>'+
            '<br>'+
            '<div class="row">'+
              '<div class="large-11 large-centered columns">'+
                '<input type="text" class="provision_snapshot_name" placeholder="'+Locale.tr("Template Name")+'" style="height: 40px !important; font-size: 16px; padding: 0.5rem  !important; margin: 0px"/>'+
              '</div>'+
            '</div>'+
            '<br>'+
            '<div class="row">'+
              '<div class="large-11 large-centered columns">'+
                '<a href"#" class="provision_snapshot_create_button success button large-12 radius right">'+Locale.tr("Save Virtual Machine to Template")+'</a>'+
              '</div>'+
            '</div>'+
            '<a href="#" class="close" style="top: 20px">&times;</a>'+
          '</div>');
      });

      context.on("click", ".provision_snapshot_create_button", function(){
        var button = $(this);
        button.attr("disabled", "disabled");
        var context = $(".provision_info_vm[vm_id]");

        var vm_id = context.attr("vm_id");
        var template_name = $('.provision_snapshot_name', context).val();

        OpenNebula.VM.save_as_template({
          data : {
            id: vm_id,
            extra_param: {
              name : template_name
            }
          },
          success: function(request, response){
            OpenNebula.Action.clear_cache("VMTEMPLATE");
            Notifier.notifyMessage(Locale.tr("Image") + ' ' + request.request.data[0][1].name + ' ' + Locale.tr("saved successfully"))
            update_provision_vm_info(vm_id, context);
            button.removeAttr("disabled");
          },
          error: function(request, response){
            Notifier.onError(request, response);
            button.removeAttr("disabled");
          }
        })

        return false;
      });
    }

    context.on("click", ".provision_delete_confirm_button", function(){
      $(".provision_confirm_action:first", context).html(
        '<div data-alert class="alert-box secondary radius">'+
          '<div class="row">'+
          '<div class="large-9 columns">'+
            '<span style="font-size: 14px; line-height: 20px">'+
              Locale.tr("Be careful, this action will inmediately destroy your Virtual Machine")+
              '<br>'+
              Locale.tr("All the information will be lost!")+
            '</span>'+
          '</div>'+
          '<div class="large-3 columns">'+
            '<a href"#" class="provision_delete_button alert button large-12 radius right" style="margin-right: 15px">'+Locale.tr("Delete")+'</a>'+
          '</div>'+
          '</div>'+
          '<a href="#" class="close">&times;</a>'+
        '</div>');
    });

    context.on("click", ".provision_shutdownhard_confirm_button", function(){
      $(".provision_confirm_action:first", context).html(
        '<div data-alert class="alert-box secondary radius">'+
          '<div class="row">'+
          '<div class="large-9 columns">'+
            '<span style="font-size: 14px; line-height: 20px">'+
              Locale.tr("Be careful, this action will inmediately destroy your Virtual Machine")+
              '<br>'+
              Locale.tr("All the information will be lost!")+
            '</span>'+
          '</div>'+
          '<div class="large-3 columns">'+
            '<a href"#" class="provision_shutdownhard_button alert button large-12 radius right" style="margin-right: 15px">'+Locale.tr("Delete")+'</a>'+
          '</div>'+
          '</div>'+
          '<a href="#" class="close" style="top: 20px">&times;</a>'+
        '</div>');
    });

    context.on("click", ".provision_poweroff_confirm_button", function(){
      $(".provision_confirm_action:first", context).html(
        '<div data-alert class="alert-box secondary radius">'+
          '<div class="row">'+
          '<div class="large-11 columns">'+
            '<span style="font-size: 14px; line-height: 20px">'+
              Locale.tr("This action will power off this Virtual Machine. The Virtual Machine will remain in the poweroff state, and can be powered on later")+
              '<br>'+
              '<br>'+
              Locale.tr("You can send the power off signal to the Virtual Machine (this is equivalent to execute the command from the console). If that doesn't effect your Virtual Machine, try to Power off the machine (this is equivalent to pressing the power off button in a physical computer).")+
            '</span>'+
          '</div>'+
          '</div>'+
          '<br>'+
          '<div class="row">'+
          '<div class="large-12 columns">'+
            '<a href"#" class="provision_poweroff_button button radius right" style="margin-right: 15px">'+Locale.tr("Power off")+'</a>'+
            '<label class="left" style="margin-left: 25px">'+
              '<input type="radio" name="provision_poweroff_radio" value="poweroff_hard" class="provision_poweroff_hard_radio">'+
              ' <i class="fa fa-fw fa-bolt"/> '+Locale.tr("Power off the machine")+
            '</label>'+
            '<label class="left" style="margin-left: 25px">'+
              '<input type="radio" name="provision_poweroff_radio" value="poweroff" class="provision_poweroff_radio" checked>'+
              ' <i class="fa fa-fw fa-power-off"/> '+Locale.tr("Send the power off signal")+
            '</label>'+
          '</div>'+
          '</div>'+
          '<a href="#" class="close" style="top: 20px">&times;</a>'+
        '</div>');
    });

    context.on("click", ".provision_reboot_confirm_button", function(){
      $(".provision_confirm_action:first", context).html(
        '<div data-alert class="alert-box secondary radius">'+
          '<div class="row">'+
          '<div class="large-11 columns">'+
            '<span style="font-size: 14px; line-height: 20px">'+
              Locale.tr("This action will reboot this Virtual Machine.")+
              '<br>'+
              '<br>'+
              Locale.tr("You can send the reboot signal to the Virtual Machine (this is equivalent to execute the reboot command form the console). If that doesn't effect your Virtual Machine, try to Reboot the machine (this is equivalent to pressing the reset button a physical computer).")+
            '</span>'+
          '</div>'+
          '</div>'+
          '<br>'+
          '<div class="row">'+
          '<div class="large-12 columns">'+
            '<a href"#" class="provision_reboot_button button radius right" style="margin-right: 15px">'+Locale.tr("Reboot")+'</a>'+
            '<label class="left" style="margin-left: 25px">'+
              '<input type="radio" name="provision_reboot_radio" value="reset" class="provision_reboot_hard_radio">'+
              ' <i class="fa fa-fw fa-bolt"/> '+Locale.tr("Reboot the machine")+
            '</label>'+
            '<label class="left" style="margin-left: 25px">'+
              '<input type="radio" name="provision_reboot_radio" value="reboot" class="provision_reboot_radio" checked>'+
              ' <i class="fa fa-fw fa-power-off"/> '+Locale.tr("Send the reboot signal")+
            '</label>'+
          '</div>'+
          '</div>'+
          '<a href="#" class="close" style="top: 20px">&times;</a>'+
        '</div>');
    });

    context.on("click", ".provision_delete_button", function(){
      var button = $(this);
      button.attr("disabled", "disabled");
      var vm_id = $(".provision_info_vm", context).attr("vm_id");

      OpenNebula.VM.del({
        data : {
          id: vm_id
        },
        success: function(request, response){
          $(".provision_back", context).click();
          $(".provision_vms_list_refresh_button", context).click();
          button.removeAttr("disabled");
        },
        error: function(request, response){
          Notifier.onError(request, response);
          button.removeAttr("disabled");
        }
      })

      return false;
    });

    context.on("click", ".provision_shutdownhard_button", function(){
      var button = $(this);
      button.attr("disabled", "disabled");
      var vm_id = $(".provision_info_vm", context).attr("vm_id");

      OpenNebula.VM.cancel({
        data : {
          id: vm_id
        },
        success: function(request, response){
          $(".provision_back", context).click();
          $(".provision_vms_list_refresh_button", context).click();
          button.removeAttr("disabled");
        },
        error: function(request, response){
          Notifier.onError(request, response);
          button.removeAttr("disabled");
        }
      })

      return false;
    });

    context.on("click", ".provision_poweroff_button", function(){
      var button = $(this);
      button.attr("disabled", "disabled");
      var vm_id = $(".provision_info_vm", context).attr("vm_id");
      var poweroff_action = $('input[name=provision_poweroff_radio]:checked').val()

      OpenNebula.VM[poweroff_action]({
        data : {
          id: vm_id
        },
        success: function(request, response){
          update_provision_vm_info(vm_id, context);
          button.removeAttr("disabled");
        },
        error: function(request, response){
          Notifier.onError(request, response);
          button.removeAttr("disabled");
        }
      })

      return false;
    });

    context.on("click", ".provision_reboot_button", function(){
      var button = $(this);
      button.attr("disabled", "disabled");

      var vm_id = $(".provision_info_vm", context).attr("vm_id");
      var reboot_action = $('input[name=provision_reboot_radio]:checked').val()

      OpenNebula.VM[reboot_action]({
        data : {
          id: vm_id
        },
        success: function(request, response){
          update_provision_vm_info(vm_id, context);
          button.removeAttr("disabled");
        },
        error: function(request, response){
          Notifier.onError(request, response);
          button.removeAttr("disabled");
        }
      })

      return false;
    });

    context.on("click", ".provision_poweron_button", function(){
      var button = $(this);
      button.attr("disabled", "disabled");
      var vm_id = $(".provision_info_vm", context).attr("vm_id");

      OpenNebula.VM.resume({
        data : {
          id: vm_id
        },
        success: function(request, response){
          update_provision_vm_info(vm_id, context);
          button.removeAttr("disabled");
        },
        error: function(request, response){
          Notifier.onError(request, response);
          button.removeAttr("disabled");
        }
      })

      return false;
    });

    context.on("click", ".provision_vnc_button", function(){
      var button = $(this);
      button.attr("disabled", "disabled");
      var vm_id = $(".provision_info_vm", context).attr("vm_id");
      var vm_data = $(".provision_info_vm", context).data("vm");

      OpenNebula.VM.vnc({
        data : {
          id: vm_id
        },
        success: function(request, response){
          if (OpenNebula.VM.isVNCSupported(vm_data)) {
            var proxy_host = window.location.hostname;
            var proxy_port = config['system_config']['vnc_proxy_port'];
            var pw = response["password"];
            var token = response["token"];
            var vm_name = response["vm_name"];
            var path = '?token='+token;

            var url = "vnc?";
            url += "host=" + proxy_host;
            url += "&port=" + proxy_port;
            url += "&token=" + token;
            url += "&password=" + pw;
            url += "&encrypt=" + config['user_config']['vnc_wss'];
            url += "&title=" + vm_name;

            window.open(url, '', '_blank');
            button.removeAttr("disabled");
          } else if (OpenNebula.VM.isSPICESupported(vm_data)) {
            var host, port, password, scheme = "ws://", uri, token, vm_name;

            if (config['user_config']['vnc_wss'] == "yes") {
                scheme = "wss://";
            }

            host = window.location.hostname;
            port = config['system_config']['vnc_proxy_port'];
            password = response["password"];
            token = response["token"];
            vm_name = response["vm_name"];

            uri = scheme + host + ":" + port + "?token=" + token;

            var url = "spice?";
            url += "host=" + host;
            url += "&port=" + port;
            url += "&token=" + token;
            url += "&password=" + password;
            url += "&encrypt=" + config['user_config']['vnc_wss'];
            url += "&title=" + vm_name;

            window.open(url, '', '_blank');
            button.removeAttr("disabled");
          } else {
            Notifier.notifyError("The remote console is not enabled for this VM")
          }
        },
        error: function(request, response){
          Notifier.onError(request, response);
          button.removeAttr("disabled");
        }
      })

      return false;
    });

    context.on("click", ".provision_refresh_info", function(){
      var vm_id = $(".provision_info_vm", context).attr("vm_id");
      update_provision_vm_info(vm_id, context);
      return false;
    });

    //
    // Info VM
    //

    $(".provision_list_vms", context).on("click", ".provision_info_vm_button", function(){
      $("a.provision_show_vm_accordion", context).trigger("click");
      // TODO loading

      var vm_id = $(this).parents(".provision-pricing-table").attr("opennebula_id")
      update_provision_vm_info(vm_id, context);
      return false;
    })
  }

  function setup_provision_vms_list(context, opts) {
    var provision_vms_datatable = $('.provision_vms_table', context).dataTable({
      "iDisplayLength": 6,
      "sDom" : '<"H">t<"F"lp>',
      "aLengthMenu": [[6, 12, 36, 72], [6, 12, 36, 72]],
      "aaSorting"  : [[0, "desc"]],
      "aoColumnDefs": [
          { "bVisible": false, "aTargets": ["all"]}
      ],
      "aoColumns": [
          { "mDataProp": "VM.ID" },
          { "mDataProp": "VM.NAME" },
          { "mDataProp": "VM.UID" }
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
              Locale.tr("There are no Virtual Machines")+
            '</span>'+
            '</div>');
        } else {
          $(".provision_vms_table", context).html('<ul class="provision_vms_ul large-block-grid-3 medium-block-grid-3 small-block-grid-1 text-center"></ul>');
        }

        return true;
      },
      "fnRowCallback": function( nRow, aData, iDisplayIndex, iDisplayIndexFull ) {
        var data = aData.VM;
        var state = get_provision_vm_state(data);

        $(".provision_vms_ul", context).append('<li>'+
            '<ul class="provision-pricing-table" opennebula_id="'+data.ID+'" datatable_index="'+iDisplayIndexFull+'">'+
              '<li class="provision-title text-left" style="padding-bottom: 0px">'+
                '<a class="provision_info_vm_button" style="color:#555" href="#">'+ data.NAME + '</a>'+
                '<a class="provision_info_vm_button right" style="color:#555;" href="#"><i class="fa fa-fw fa-lg fa-sign-in right only-on-hover"/></a>'+
              '</li>'+
              '<li class="provision-bullet-item text-right" style="color: #999; margin-bottom:10px;">'+
                '<span class="'+ state.color +'-color left">'+
                  '<i class="fa fa-fw fa-square"/> '+
                  state.str+
                '</span>'+
              '</li>'+
              //'<li class="provision-bullet-item" style="padding: 0px">'+
              //  '<div style="height:1px" class="'+ state.color +'-bg"></div>'+
              //'</li>'+
              '<li class="provision-bullet-item text-left" style="margin-left: 10px">'+
                '<i class="fa fa-fw fa-lg fa-laptop"/> '+
                'x'+data.TEMPLATE.CPU+' - '+
                ((data.TEMPLATE.MEMORY > 1000) ?
                  (Math.floor(data.TEMPLATE.MEMORY/1024)+'GB') :
                  (data.TEMPLATE.MEMORY+'MB'))+
              '</li>'+
              '<li class="provision-bullet-item text-left" style="margin-left: 10px">'+
                get_provision_disk_image(data) +
              '</li>'+
              '<li class="provision-bullet-item text-left" style="margin-left: 10px">'+
                get_provision_ips(data) +
              '</li>'+
              '<li class="provision-bullet-item text-right" style="font-size:12px; color: #999; margin-top:15px; padding-bottom:10px">'+
                '<span class="left">'+
                  '<i class="fa fa-fw fa-lg fa-user"/> '+
                  data.UNAME+
                '</span>'+
                '<span style="font-size:12px; color: #999; padding-bottom:10px">'+
                  '<i class="fa fa-fw fa-lg fa-clock-o"/> '+
                  Humanize.prettyTimeAgo(data.STIME)+
                '</span>'+
              '</li>'+
            '</ul>'+
          '</li>');

        return nRow;
      }
    });

    $('.provision_list_vms_search', context).keyup(function(){
      provision_vms_datatable.fnFilter( $(this).val() );
    })

    $('.provision_list_vms_search', context).change(function(){
      provision_vms_datatable.fnFilter( $(this).val() );
    })

    context.on("click", ".provision_vms_list_refresh_button", function(){
      OpenNebula.Action.clear_cache("VM");
      update_provision_vms_datatable(provision_vms_datatable, 0);
      return false;
    });

    $(".provision_list_vms_filter", context).on("change", ".resource_list_select", function(){
      if ($(this).val() != "-2"){
        provision_vms_datatable.fnFilter("^" + $(this).val() + "$", 2, true, false);
      } else {
        provision_vms_datatable.fnFilter("", 2);
      }
    })

    ResourceSelect.insert(
      ".provision_list_vms_filter",
      context,
      "User",
      (opts.filter_expression ? opts.filter_expression : "-2"),
      false,
      '<option value="-2">'+Locale.tr("ALL")+'</option>',
      null,
      null,
      true,
      true);

    context.on("click", ".provision_vms_list_filter_button", function(){
      $(".provision_list_vms_filter", context).fadeIn();
      return false;
    });

    OpenNebula.Action.clear_cache("VM");
    update_provision_vms_datatable(provision_vms_datatable, 0);

    $(document).foundation();
  }

  function generate_provision_vms_list(context, opts) {
    context.off();
    context.html(provision_list_vms(opts));

    if (opts.data) {
      $(".provision_vms_table", context).data("opennebula", opts.data)
    }

    setup_provision_vms_list(context, opts);
    setup_info_vm(context);
  }


  function setup_provision_templates_list(context, opts) {
    var provision_templates_datatable = $('.provision_templates_table', context).dataTable({
      "iDisplayLength": 8,
      "sDom" : '<"H">t<"F"lp>',
      "aLengthMenu": [[6, 12, 36, 72], [6, 12, 36, 72]],
      "aaSorting"  : [[0, "desc"]],
      "aoColumnDefs": [
          { "bVisible": false, "aTargets": ["all"]}
      ],
      "aoColumns": [
          { "mDataProp": "VMTEMPLATE.ID" },
          { "mDataProp": "VMTEMPLATE.NAME" },
          { "mDataProp": "VMTEMPLATE.TEMPLATE.SAVED_TEMPLATE_ID", "sDefaultContent" : "-"  },
          { "mDataProp": "VMTEMPLATE.UID" }
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
              Locale.tr("There are no saved templates available")+
              '<br>'+
              Locale.tr("Create a template by saving a running Virtual Machine")+
            '</span>'+
            '</div>');
        } else {
          $(".provision_templates_table", context).html('<ul class="provision_templates_ul large-block-grid-3 medium-block-grid-3 small-block-grid-1 text-center"></ul>');
        }
        return true;
      },
      "fnRowCallback": function( nRow, aData, iDisplayIndex, iDisplayIndexFull ) {
        var data = aData.VMTEMPLATE;
        //var state = get_provision_image_state(data);
        var actions_html = "";
        if (Config.isTabActionEnabled("provision-tab", "Template.chmod")) {
          if (data.UID == config['user_id']) {

            if (data.PERMISSIONS.GROUP_U == "1") {
              actions_html += '<a class="provision_confirm_unshare_template_button left" data-tooltip title="'+ Locale.tr("Unshare")+'" style="color:#555" href="#"><i class="fa fa-fw fa-lg fa-ban only-on-hover"/></a>';
              actions_html += '<span style="font-size:12px; color: #777">' + Locale.tr("SHARED") + '</span>';
            } else {
              actions_html += '<a class="provision_confirm_chmod_template_button left" data-tooltip title="'+ Locale.tr("Share")+'" style="color:#555" href="#"><i class="fa fa-fw fa-lg fa-share-alt only-on-hover"/></a>';
            }
          }
        }

        if (Config.isTabActionEnabled("provision-tab", "Template.delete")) {
          actions_html += '<a class="provision_confirm_delete_template_button" data-tooltip title="'+ Locale.tr("Delete")+'"  style="color:#555" href="#"><i class="fa fa-fw fa-lg fa-trash-o right only-on-hover"/></a>';
        }

        $(".provision_templates_ul", context).append('<li>'+
            '<ul class="provision-pricing-table" opennebula_id="'+data.ID+'" saved_to_image_id="'+data.TEMPLATE.SAVED_TO_IMAGE_ID+'" datatable_index="'+iDisplayIndexFull+'">'+
              '<li class="provision-title text-left" title="'+data.NAME+'">'+
                data.NAME +
              '</li>'+
              '<li class="provision-description text-left" style="padding-top:0px; padding-bottom: 5px">'+
                (data.TEMPLATE.DESCRIPTION || '...')+
              '</li>'+
              '<li class="provision-bullet-item text-left" style="margin-left: 5px">'+
                '<i class="fa fa-fw fa-file-text-o"/>&emsp;'+
                  'x'+(data.TEMPLATE.CPU||'-')+' - '+
                  ((data.TEMPLATE.MEMORY > 1000) ?
                    (Math.floor(data.TEMPLATE.MEMORY/1024)+'GB') :
                    ((data.TEMPLATE.MEMORY||'-')+'MB'))+
              '</li>'+
              '<li class="provision-bullet-item text-left" style="margin-left: 5px">'+
                '<i class="fa fa-fw fa-user"/>&emsp;'+
                data.UNAME+
              '</li>'+
              '<li class="provision-description text-right" style="padding-top:5px; margin-right: 5px">'+
                '<i class="fa fa-fw fa-clock-o"/>'+
                Humanize.prettyTimeAgo(data.REGTIME)+
              '</li>'+
              '<li class="provision-title" style="padding-top:10px">'+
                actions_html+
              '</li>'+
            '</ul>'+
          '</li>');

        return nRow;
      }
    });

    provision_templates_datatable.fnFilter("^(?!\-$)", 2, true, false);

    $('.provision_list_templates_search', context).keyup(function(){
      provision_templates_datatable.fnFilter( $(this).val() );
    })

    $('.provision_list_templates_search', context).change(function(){
      provision_templates_datatable.fnFilter( $(this).val() );
    })

    context.on("click", ".provision_templates_list_refresh_button", function(){
      OpenNebula.Action.clear_cache("VMTEMPLATE");
      $(".provision_confirm_delete_template_div", context).html("");
      update_provision_templates_datatable(provision_templates_datatable, 0);
      return false;
    });

    context.on("click", ".provision_templates_list_search_button", function(){
      $(".provision_list_templates_search", context).fadeIn();
    });

    $(".provision_list_templates_filter", context).on("change", ".resource_list_select", function(){
      if ($(this).val() != "-2"){
        provision_templates_datatable.fnFilter("^" + $(this).val() + "$", 3, true, false);
      } else {
        provision_templates_datatable.fnFilter("", 3);
      }
    })

    ResourceSelect.insert(
      ".provision_list_templates_filter",
      context,
      "User",
      (opts.filter_expression ? opts.filter_expression : "-2"),
      false,
      '<option value="-2">'+Locale.tr("ALL")+'</option>',
      null,
      null,
      true,
      true);

    context.on("click", ".provision_templates_list_filter_button", function(){
      $(".provision_list_templates_filter", context).fadeIn();
      return false;
    });

    if (Config.isTabActionEnabled("provision-tab", "Template.delete")) {
      context.on("click", ".provision_confirm_delete_template_button", function(){
        var ul_context = $(this).parents(".provision-pricing-table");
        var template_id = ul_context.attr("opennebula_id");
        var image_id = ul_context.attr("saved_to_image_id");
        var template_name = $(".provision-title", ul_context).text();

        $(".provision_confirm_delete_template_div", context).html(
          '<div data-alert class="alert-box secondary radius">'+
            '<div class="row">'+
            '<div class="large-9 columns">'+
              '<span style="font-size: 14px; line-height: 20px">'+
                Locale.tr("Handle with care! This action will inmediately destroy the template")+
                ' "' + template_name + '" ' +
                Locale.tr("and the image associated.") +
              '</span>'+
            '</div>'+
            '<div class="large-3 columns">'+
              '<a href"#" class="provision_delete_template_button alert button large-12 radius right" style="margin-right: 15px" image_id="'+image_id+'" template_id="'+template_id+'">'+Locale.tr("Delete")+'</a>'+
            '</div>'+
            '</div>'+
            '<a href="#" class="close">&times;</a>'+
          '</div>');
      });

      context.on("click", ".provision_delete_template_button", function(){
        var button = $(this);
        button.attr("disabled", "disabled");

        var template_id = $(this).attr("template_id");
        var image_id = $(this).attr("image_id");

        OpenNebula.Image.del({
          timeout: true,
          data : {
            id : image_id
          },
          success: function (){
            OpenNebula.Template.del({
              timeout: true,
              data : {
                id : template_id
              },
              success: function (){
                $(".provision_templates_list_refresh_button", context).trigger("click");
              },
              error: function (request,error_json, container) {
                Notifier.onError(request, error_json, container);
              }
            })
          },
          error: function (request,error_json, container) {
            if (error_json.error.http_status=="404") {
              OpenNebula.Template.del({
                timeout: true,
                data : {
                  id : template_id
                },
                success: function (){
                  $(".provision_templates_list_refresh_button", context).trigger("click");
                },
                error: function (request,error_json, container) {
                  Notifier.onError(request, error_json, container);
                  $(".provision_templates_list_refresh_button", context).trigger("click");
                }
              })
            } else {
              Notifier.onError(request, error_json, container);
            }
          }
        })
      });
    }


    if (Config.isTabActionEnabled("provision-tab", "Template.chmod")) {
      context.on("click", ".provision_confirm_chmod_template_button", function(){
        var ul_context = $(this).parents(".provision-pricing-table");
        var template_id = ul_context.attr("opennebula_id");
        var image_id = ul_context.attr("saved_to_image_id");
        var template_name = $(".provision-title", ul_context).text();

        $(".provision_confirm_delete_template_div", context).html(
          '<div data-alert class="alert-box secondary radius">'+
            '<div class="row">'+
            '<div class="large-8 columns">'+
              '<span style="font-size: 14px; line-height: 20px">'+
                Locale.tr("The template")+
                ' "' + template_name + '" ' +
                Locale.tr("and the image associated will be shared and all the users will be able to instantiate new VMs using this template.") +
              '</span>'+
            '</div>'+
            '<div class="large-4 columns">'+
              '<a href"#" class="provision_chmod_template_button success button large-12 radius right" style="margin-right: 15px" image_id="'+image_id+'" template_id="'+template_id+'">'+Locale.tr("Share template")+'</a>'+
            '</div>'+
            '</div>'+
            '<a href="#" class="close">&times;</a>'+
          '</div>');
      });

      context.on("click", ".provision_chmod_template_button", function(){
        var button = $(this);
        button.attr("disabled", "disabled");

        var template_id = $(this).attr("template_id");
        var image_id = $(this).attr("image_id");

        OpenNebula.Template.chmod({
          timeout: true,
          data : {
            id : template_id,
            extra_param: {'group_u': 1}
          },
          success: function (){
            $(".provision_templates_list_refresh_button", context).trigger("click");

            OpenNebula.Image.chmod({
              timeout: true,
              data : {
                id : image_id,
                extra_param: {'group_u': 1}
              },
              success: function (){
              },
              error: Notifier.onError
            })
          },
          error: Notifier.onError
        })
      });

      context.on("click", ".provision_confirm_unshare_template_button", function(){
        var ul_context = $(this).parents(".provision-pricing-table");
        var template_id = ul_context.attr("opennebula_id");
        var image_id = ul_context.attr("saved_to_image_id");
        var template_name = $(".provision-title", ul_context).first().text();

        $(".provision_confirm_delete_template_div", context).html(
          '<div data-alert class="alert-box secondary radius">'+
            '<div class="row">'+
            '<div class="large-8 columns">'+
              '<span style="font-size: 14px; line-height: 20px">'+
                Locale.tr("The template")+
                ' "' + template_name + '" ' +
                Locale.tr("and the image associated will be unshared and the users will not be able to instantiate new VMs using this template.") +
              '</span>'+
            '</div>'+
            '<div class="large-4 columns">'+
              '<a href"#" class="provision_unshare_template_button success button large-12 radius right" style="margin-right: 15px" image_id="'+image_id+'" template_id="'+template_id+'">'+Locale.tr("Unshare template")+'</a>'+
            '</div>'+
            '</div>'+
            '<a href="#" class="close">&times;</a>'+
          '</div>');
      });

      context.on("click", ".provision_unshare_template_button", function(){
        var button = $(this);
        button.attr("disabled", "disabled");

        var template_id = $(this).attr("template_id");
        var image_id = $(this).attr("image_id");

        OpenNebula.Template.chmod({
          timeout: true,
          data : {
            id : template_id,
            extra_param: {'group_u': 0}
          },
          success: function (){
            $(".provision_templates_list_refresh_button", context).trigger("click");

            OpenNebula.Image.chmod({
              timeout: true,
              data : {
                id : image_id,
                extra_param: {'group_u': 0}
              },
              success: function (){
              },
              error: Notifier.onError
            })
          },
          error: Notifier.onError
        })
      });
    }

    OpenNebula.Action.clear_cache("VMTEMPLATE");
    update_provision_templates_datatable(provision_templates_datatable, 0);
    context.foundation();
  }

  function generate_provision_templates_list(context, opts) {
    context.off();
    context.html(provision_list_templates(opts));
    setup_provision_templates_list(context, opts);
  }

  function setup_info_flow(context) {
    function update_provision_flow_info(flow_id, context, role_id) {
      $(".provision_info_flow_name", context).text("");
      $(".provision_info_flow", context).css('visibility', 'hidden');
      $(".provision_info_flow_loading", context).fadeIn();
      $(".provision_role_vms_container").html("");

      OpenNebula.Service.show({
        data : {
          id: flow_id
        },
        error: Notifier.onError,
        success: function(request, response){
          var data = response.DOCUMENT
          var body = data.TEMPLATE.BODY;
          var state = get_provision_flow_state(body);
          var start_time = get_provision_flow_start_time(body);

          switch (state.color) {
            case "deploying":
              $(".provision_recover_button", context).hide();
              $(".provision_delete_confirm_button", context).show();
              $(".provision_shutdown_confirm_button", context).show();
              break;
            case "running":
              $(".provision_recover_button", context).hide();
              $(".provision_delete_confirm_button", context).show();
              $(".provision_shutdown_confirm_button", context).show();
              break;
            case "off":
              $(".provision_recover_button", context).hide();
              $(".provision_delete_confirm_button", context).show();
              $(".provision_shutdown_confirm_button", context).hide();
              break;
            case "powering_off":
            case "error":
              $(".provision_recover_button", context).show();
              $(".provision_delete_confirm_button", context).show();
              $(".provision_shutdown_confirm_button", context).show();
              break;
            default:
              $(".provision_recover_button", context).show();
              $(".provision_delete_confirm_button", context).show();
              $(".provision_shutdown_confirm_button", context).show();
              break;
          }

          $(".provision_info_flow", context).attr("flow_id", data.ID);
          $(".provision_info_flow_name", context).text(data.NAME);

          $(".provision-pricing-table_flow_info", context).html(
              '<li class="text-left provision-title">'+
                '<span class="'+ state.color +'-color">'+
                  '<i class="fa fa-fw fa-lg fa-square"/>&emsp;'+
                  state.str+
                '</span>'+
              '</li>'+
              '<li class="text-left provision-bullet-item">'+
                '<hr style="margin: 0px">'+
              '</li>'+
              '<li class="text-left provision-bullet-item" style="font-size: 16px">'+
                '<span style="color: #999;">'+
                  '<i class="fa fa-fw fa-lg fa-clock-o"/>&emsp;'+
                  (start_time ? Humanize.prettyTimeAgo(start_time) : "-") +
                '</span>'+
              '</li>'+
              '<li class="text-left provision-bullet-item" style="font-size: 16px">'+
                '<span style="color: #999;">'+
                  '<i class="fa fa-fw fa-lg fa-user"/>&emsp;'+
                  data.UNAME+
                '</span>'+
              '</li>'+
              '<li class="text-left provision-bullet-item" style="font-size: 16px">'+
                '<span style="color: #999;">'+
                  '<i class="fa fa-fw fa-lg fa-link"/>&emsp;'+
                  data.ID+
                '</span>'+
              '</li>'+
              '<li class="text-left provision-bullet-item">'+
              '</li>'+
            '</ul>');

          $(".provision_roles_ul", context).html("");
          if (body.roles) {
            $.each(body.roles, function(index, role) {
              var role_state = get_provision_flow_state(role);
              var rvms = {
                str : (role.nodes ? role.nodes.length : 0) + " / " + role.cardinality ,
                percentage : Math.floor((role.nodes ? role.nodes.length : 0) / role.cardinality)*100
              }

              var li = $(
                '<li>'+
                  '<ul class="provision_role_ul provision-pricing-table">'+
                    '<li class="provision-title text-left">'+
                      '<i class="fa fa-fw fa-cube"/>&emsp;'+
                      role.name+
                    '</li>'+
                    '<li class="provision-bullet-item text-left" style="padding-top: 5px; margin-left: 10px; margin-right: 10px">'+
                      '<div class="progress small radius" style="margin-bottom:0px">'+
                      '  <span class="meter" style="width: '+rvms.percentage+'%;"></span>'+
                      '</div>'+
                    '</li>'+
                    '<li class="provision-bullet-item text-left" style="padding-top: 0px; margin-left: 10px; margin-right: 10px; font-size: 14px">'+
                      '<span class="'+ role_state.color +'-color">'+
                        role_state.str+
                      '</span>'+
                      '<span class="right">'+rvms.str+" VMs</span>"+
                    '</li>'+
                    '<li class="text-left provision-bullet-item">'+
                      '<br>'+
                    '</li>'+
                    '<li class="provision-bullet-item text-left" style="padding-top: 5px; margin-left: 10px; margin-right: 10px">'+
                      '<a class="provision_role_vms_button button medium radius">'+
                        '<i class="fa fa-th fa-lg"></i>'+
                      '</a>'+
                      '<a class="provision_role_cardinality_button button medium success right radius">'+
                        '<i class="fa fa-arrows-h fa-lg"></i>'+
                      '</a>'+
                    '</li>'+
                  '</ul>'+
                '</li>').appendTo($(".provision_roles_ul", context));

                $(".provision_role_ul", li).data("role", role);
                if (role_id && role_id == role.name) {
                  $(".provision_role_vms_button", li).trigger("click");
                }
            });
          }

          $(".provision_info_flow_state_hr", context).html('<div style="height:1px; margin-top:5px; margin-bottom: 5px; background: #cfcfcf"></div>');

          $(".provision_confirm_action:first", context).html("");

          $(".provision_info_flow_loading", context).hide();
          $(".provision_info_flow", context).css('visibility', 'visible');
        }
      })
    }

    context.on("click", ".provision_role_vms_button", function(){
      $(".provision_role_vms_container", context).html('<div class="text-center">'+
        '<span class="fa-stack fa-5x" style="color: #dfdfdf">'+
          '<i class="fa fa-cloud fa-stack-2x"></i>'+
          '<i class="fa  fa-spinner fa-spin fa-stack-1x fa-inverse"></i>'+
        '</span>'+
        '<br>'+
        '<br>'+
        '<span style="font-size: 18px; color: #999">'+
        '</span>'+
        '</div>');

      var role = $(this).closest(".provision_role_ul").data('role');
      $(".provision_info_flow", context).data("role_id", role.name);
      var vms = []

      if (role.nodes && role.nodes.length > 0) {
        $.each(role.nodes, function(index, node){
          vms.push(node.vm_info);
        })
      }

      generate_provision_vms_list(
        $(".provision_role_vms_container", context),
        {
          title: role.name + ' ' + Locale.tr("VMs"),
          active: true,
          refresh: false,
          create: false,
          filter: false,
          data: vms
        });
    })

    context.on("click", ".provision_role_cardinality_button", function(){
      var role = $(this).closest(".provision_role_ul").data('role');
      var min_vms = (role.min_vms||1);
      var max_vms = (role.max_vms||100);

      $(".provision_confirm_action:first", context).html(
        '<div data-alert class="alert-box secondary radius">'+
          '<div class="row">'+
            '<div class="large-12 large-centered columns">'+
              '<div class="row">'+
                '<div class="large-4 text-center columns">'+
                  '<span class="cardinality_value" style="color: #777; font-size:60px">'+role.cardinality+'</span>'+
                  '<br>'+
                  '<span style="color: #999; font-size:20px">'+role.name + ' ' + Locale.tr("VMs")+'</span>'+
                '</div>'+
                '<div class="large-8 columns text-center">'+
                '<div class="cardinality_slider_div">'+
                  '<br>'+
                  '<span class="left" style="color: #999;">'+min_vms+'</span>'+
                  '<span class="right" style="color: #999;">'+max_vms+'</span>'+
                  '<br>'+
                  '<div class="cardinality_slider">'+
                  '</div>'+
                  '<br>'+
                  '<a href"#" class="provision_change_cardinality_button success button radius large-12" role_id="'+role.name+'">'+Locale.tr("Change Cardinality")+'</a>'+
                '</div>'+
                '<div class="cardinality_no_slider_div">'+
                  '<br>'+
                  '<br>'+
                  '<span class="" style="color: #999;">'+Locale.tr("The cardinality for this role cannot be changed")+'</span>'+
                '</div>'+
              '</div>'+
            '</div>'+
          '</div>'+
          '<a href="#" class="close" style="top: 20px">&times;</a>'+
        '</div>');


      if (max_vms > min_vms) {
        $( ".cardinality_slider_div", context).show();
        $( ".cardinality_no_slider_div", context).hide();

        var provision_cardinality_slider = $( ".cardinality_slider", context).noUiSlider({
            handles: 1,
            connect: "lower",
            range: [min_vms, max_vms],
            step: 1,
            start: role.cardinality,
            value: role.cardinality,
            slide: function(type) {
                if ( type != "move"){
                  if ($(this).val()) {
                    $(".cardinality_value", context).html($(this).val());
                  }
                }
            }
        });

        provision_cardinality_slider.val(role.cardinality)

        provision_cardinality_slider.addClass("noUiSlider");
      } else {
        $( ".cardinality_slider_div", context).hide();
        $( ".cardinality_no_slider_div", context).show();
      }

      return false;
    });

    context.on("click", ".provision_change_cardinality_button", function(){
      var flow_id = $(".provision_info_flow", context).attr("flow_id");
      var cardinality = $(".cardinality_slider", context).val()

      OpenNebula.Role.update({
        data : {
          id: flow_id + '/role/' + $(this).attr("role_id"),
          extra_param: {
            cardinality: cardinality
          }
        },
        success: function(request, response){
          OpenNebula.Action.clear_cache("SERVICE");
          $(".provision_refresh_info", context).trigger("click");
        },
        error: Notifier.onError
      })
    });

    context.on("click", ".provision_delete_confirm_button", function(){
      $(".provision_confirm_action:first", context).html(
        '<div data-alert class="alert-box secondary radius">'+
          '<div class="row">'+
          '<div class="large-9 columns">'+
            '<span style="font-size: 14px; line-height: 20px">'+
              Locale.tr("Be careful, this action will inmediately destroy your Service")+
              '<br>'+
              Locale.tr("All the information will be lost!")+
            '</span>'+
          '</div>'+
          '<div class="large-3 columns">'+
            '<a href"#" class="provision_delete_button alert button large-12 radius right" style="margin-right: 15px">'+Locale.tr("Delete")+'</a>'+
          '</div>'+
          '</div>'+
          '<a href="#" class="close">&times;</a>'+
        '</div>');
    });

    context.on("click", ".provision_shutdown_confirm_button", function(){
      $(".provision_confirm_action:first", context).html(
        '<div data-alert class="alert-box secondary radius">'+
          '<div class="row">'+
          '<div class="large-9 columns">'+
            '<span style="font-size: 14px; line-height: 20px">'+
              Locale.tr("Be careful, this action will inmediately shutdown your Service")+
              '<br>'+
              Locale.tr("All the information will be lost!")+
            '</span>'+
          '</div>'+
          '<div class="large-3 columns">'+
            '<a href"#" class="provision_shutdown_button alert button large-12 radius right" style="margin-right: 15px">'+Locale.tr("Shutdown")+'</a>'+
          '</div>'+
          '</div>'+
          '<a href="#" class="close">&times;</a>'+
        '</div>');
    });

    context.on("click", ".provision_recover_button", function(){
      var flow_id = $(".provision_info_flow", context).attr("flow_id");

      OpenNebula.Service.recover({
        data : {
          id: flow_id
        },
        success: function(request, response){
          update_provision_flow_info(flow_id, context);
        },
        error: Notifier.onError
      })
    });

    context.on("click", ".provision_shutdown_button", function(){
      var flow_id = $(".provision_info_flow", context).attr("flow_id");

      OpenNebula.Service.shutdown({
        data : {
          id: flow_id
        },
        success: function(request, response){
          update_provision_flow_info(flow_id, context);
        },
        error: Notifier.onError
      })
    });

    context.on("click", ".provision_delete_button", function(){
      var button = $(this);
      button.attr("disabled", "disabled");
      var flow_id = $(".provision_info_flow", context).attr("flow_id");

      OpenNebula.Service.del({
        data : {
          id: flow_id
        },
        success: function(request, response){
          $(".provision_back", context).click();
          $(".provision_flows_list_refresh_button", context).click();
          button.removeAttr("disabled");
        },
        error: function(request, response){
          Notifier.onError(request, response);
          button.removeAttr("disabled");
        }
      })
    });

    context.on("click", ".provision_refresh_info", function(){
      var flow_id = $(".provision_info_flow", context).attr("flow_id");
      var role_id = $(".provision_info_flow", context).data("role_id");
      update_provision_flow_info(flow_id, context, role_id);
      //$(".provision_flows_list_refresh_button", $(".provision_flows_list_section")).trigger("click");
      return false;
    });

    //
    // Info Flow
    //

    $(".provision_list_flows", context).on("click", ".provision_info_flow_button", function(){
      $("a.provision_show_flow_accordion", context).trigger("click");

      var flow_id = $(this).parents(".provision-pricing-table").attr("opennebula_id")
      update_provision_flow_info(flow_id, context);
      return false;
    })
  }

  function setup_provision_flows_list(context, opts){
    //
    // List Flows
    //

    provision_flows_datatable = $('.provision_flows_table', context).dataTable({
      "iDisplayLength": 6,
      "sDom" : '<"H">t<"F"lp>',
      "aLengthMenu": [[6, 12, 36, 72], [6, 12, 36, 72]],
      "aaSorting"  : [[0, "desc"]],
      "aoColumnDefs": [
          { "bVisible": false, "aTargets": ["all"]}
      ],
      "aoColumns": [
          { "mDataProp": "DOCUMENT.ID" },
          { "mDataProp": "DOCUMENT.NAME" },
          { "mDataProp": "DOCUMENT.UID" }
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
              Locale.tr("Looks like you don't have any Service. Click the button below to get started")+
            '</span>'+
            '<br>'+
            '<br>'+
            '<div class="row">'+
              '<div class="large-6 large-centered columns">'+
                '<a href"#" class="medium large-12 button radius provision_create_flow_button"">'+Locale.tr("Create a new Service")+'</a>'+
              '</div>'+
            '</div>'+
            '<br>'+
            '<br>'+
            '</div>');
        } else {
          $(".provision_flows_table", context).html('<ul class="provision_flows_ul large-block-grid-3 medium-block-grid-3 small-block-grid-1 text-center"></ul>');
        }

        return true;
      },
      "fnRowCallback": function( nRow, aData, iDisplayIndex, iDisplayIndexFull ) {
        var data = aData.DOCUMENT;
        var body = data.TEMPLATE.BODY;
        var state = get_provision_flow_state(body);
        var start_time = get_provision_flow_start_time(body);

        var roles_li = "";
        if (body.roles) {
          $.each(body.roles, function(index, role) {
            var role_state = get_provision_flow_state(role);
            var rvms = {
              str : (role.nodes ? role.nodes.length : 0) + " / " + role.cardinality ,
              percentage : Math.floor((role.nodes ? role.nodes.length : 0) / role.cardinality)*100
            }

            roles_li +=
              '<li class="provision-bullet-item text-left" style="padding-top:0px; margin-left: 10px;">'+
                '<i class="fa fa-fw fa-cube"/>&emsp;'+
                role.name+
              '</li>'+
              '<li class="provision-bullet-item text-left" style="padding-top: 5px; margin-left: 10px; margin-right: 10px">'+
                '<div class="progress small radius" style="margin-bottom:0px">'+
                '  <span class="meter" style="width: '+rvms.percentage+'%;"></span>'+
                '</div>'+
              '</li>'+
              '<li class="provision-bullet-item text-left" style="padding-top: 0px; margin-left: 10px; margin-right: 10px; font-size: 11px">'+
                //'<span class="'+ state.color +'-color">'+
                //  state.str+
                //'</span>'+
                '<span class="right">'+rvms.str+" VMs</span>"+
              '</li>';
          });
        }

        $(".provision_flows_ul", context).append('<li>'+
            '<ul class="provision-pricing-table" opennebula_id="'+data.ID+'" datatable_index="'+iDisplayIndexFull+'">'+
              '<li class="provision-title text-left" style="padding-bottom: 0px">'+
                '<a class="provision_info_flow_button" style="color:#333" href="#">'+ data.NAME + '</a>'+
                '<a class="provision_info_flow_button right" style="color:#555;" href="#"><i class="fa fa-fw fa-lg fa-sign-in right only-on-hover"/></a>'+
              '</li>'+
              '<li class="provision-bullet-item text-right" style="font-size:12px; color: #999; margin-bottom:10px; padding-bottom:10px;">'+
                '<span class="'+ state.color +'-color left">'+
                  '<i class="fa fa-fw fa-square"/>&emsp;'+
                  state.str+
                '</span>'+
              '</li>'+
              roles_li +
              '<li class="provision-bullet-item text-right" style="font-size:12px; color: #999; margin-top:15px; padding-bottom:10px">'+
                '<span class="left">'+
                  '<i class="fa fa-fw fa-user"/>&emsp;'+
                  data.UNAME+
                '</span>'+
                '<span style="font-size:12px; color: #999; padding-bottom:10px">'+
                  '<i class="fa fa-fw fa-clock-o"/>'+
                  (start_time ? Humanize.prettyTimeAgo(start_time) : '-') +
                '</span>'+
              '</li>'+
            '</ul>'+
          '</li>');

        return nRow;
      }
    });

    $('.provision_list_flows_search', context).keyup(function(){
      provision_flows_datatable.fnFilter( $(this).val() );
    })

    $('.provision_list_flows_search', context).change(function(){
      provision_flows_datatable.fnFilter( $(this).val() );
    })

    context.on("click", ".provision_flows_list_refresh_button", function(){
      OpenNebula.Action.clear_cache("SERVICE");
      update_provision_flows_datatable(provision_flows_datatable, 0);
      return false;
    });

    context.on("click", ".provision_flows_list_search_button", function(){
      $(".provision_list_flows_search", context).fadeIn();
    });

    $(".provision_list_flows_filter", context).on("change", ".resource_list_select", function(){
      if ($(this).val() != "-2"){
        provision_flows_datatable.fnFilter("^" + $(this).val() + "$", 2, true, false);
      } else {
        provision_flows_datatable.fnFilter("", 2);
      }
    })

    ResourceSelect.insert(
      ".provision_list_flows_filter",
      context,
      "User",
      (opts.filter_expression ? opts.filter_expression : "-2"),
      false,
      '<option value="-2">'+Locale.tr("ALL")+'</option>',
      null,
      null,
      true,
      true);

    context.on("click", ".provision_flows_list_filter_button", function(){
      $(".provision_list_flows_filter", context).fadeIn();
      return false;
    });

    OpenNebula.Action.clear_cache("SERVICE");
    update_provision_flows_datatable(provision_flows_datatable, 0);

    $(document).foundation();
  }

  function generate_provision_flows_list(context, opts) {
    context.off();
    context.html(provision_list_flows(opts));
    setup_provision_flows_list(context, opts);
    setup_info_flow(context);
  }

  function setup_provision_user_info(context) {
    function update_provision_vdc_user_info(user_id, context) {
      $(".provision_info_vdc_user_name", context).text("");
      $(".provision_vdc_info_container", context).html("");
      $(".provision_info_vdc_user", context).hide();
      $(".provision_info_vdc_user_loading", context).fadeIn();

      OpenNebula.User.show({
        data : {
          id: user_id
        },
        error: Notifier.onError,
        success: function(request, response){
          var data = response.USER

          $(".provision_vdc_user_confirm_action",context).html("");
          $(".provision_info_vdc_user_acct",context).html("");

          $(".provision_info_vdc_user", context).attr("opennebula_id", data.ID);
          $(".provision_info_vdc_user", context).attr("uname", data.NAME);
          $(".provision_info_vdc_user", context).attr("quotas", JSON.stringify(data.VM_QUOTA));
          $(".provision_info_vdc_user_name", context).text(data.NAME);

          $(".provision-pricing-table_user_info", context).html("");

          QuotaWidgets.initEmptyQuotas(data);

          if (!$.isEmptyObject(data.VM_QUOTA)){
              var default_user_quotas = QuotaDefaults.default_quotas(data.DEFAULT_USER_QUOTAS);
              quotas = QuotaWidgets.quotaFloatInfo(
                  data.VM_QUOTA.VM.VMS_USED,
                  data.VM_QUOTA.VM.VMS,
                  default_user_quotas.VM_QUOTA.VM.VMS,
                  true);

              $(".provision-pricing-table_user_info", context).append('<li class="provision-bullet-item text-left">'+
                Locale.tr("Running VMs")+
                '<span class="right">'+quotas.str+"</span>"+
              '</li>'+
              '<li class="provision-bullet-item text-left">'+
                '<div class="progress small radius" style="background: #f7f7f7">'+
                '  <span class="meter" style="width: '+quotas.percentage+'%;"></span>'+
                '</div>'+
              '</li>');

              quotas = QuotaWidgets.quotaFloatInfo(
                  data.VM_QUOTA.VM.CPU_USED,
                  data.VM_QUOTA.VM.CPU,
                  default_user_quotas.VM_QUOTA.VM.CPU,
                  true);

              $(".provision-pricing-table_user_info", context).append('<li class="provision-bullet-item text-left">'+
                Locale.tr("CPU")+
                '<span class="right">'+quotas.str+"</span>"+
              '</li>'+
              '<li class="provision-bullet-item text-left">'+
                '<div class="progress small radius" style="background: #f7f7f7">'+
                '  <span class="meter" style="width: '+quotas.percentage+'%;"></span>'+
                '</div>'+
              '</li>');

              quotas = QuotaWidgets.quotaMBInfo(
                  data.VM_QUOTA.VM.MEMORY_USED,
                  data.VM_QUOTA.VM.MEMORY,
                  default_user_quotas.VM_QUOTA.VM.MEMORY,
                  true);

              $(".provision-pricing-table_user_info", context).append('<li class="provision-bullet-item text-left">'+
                Locale.tr("Memory")+
                '<span class="right">'+quotas.str+"</span>"+
              '</li>'+
              '<li class="provision-bullet-item text-left">'+
                '<div class="progress small radius" style="background: #f7f7f7">'+
                '  <span class="meter" style="width: '+quotas.percentage+'%;"></span>'+
                '</div>'+
              '</li>');
          } else {
            quotas = QuotaWidgets.quotaFloatInfo(0, 0, null, true);

            $(".provision-pricing-table_user_info", context).append('<li class="provision-bullet-item text-left">'+
              Locale.tr("Running VMs")+
              '<span class="right">'+quotas.str+"</span>"+
            '</li>'+
            '<li class="provision-bullet-item text-left">'+
              '<div class="progress small radius" style="background: #f7f7f7">'+
              '  <span class="meter" style="width: '+quotas.percentage+'%;"></span>'+
              '</div>'+
            '</li>');

            quotas = QuotaWidgets.quotaFloatInfo(0, 0, null, true);

            $(".provision-pricing-table_user_info", context).append('<li class="provision-bullet-item text-left">'+
              Locale.tr("CPU")+
              '<span class="right">'+quotas.str+"</span>"+
            '</li>'+
            '<li class="provision-bullet-item text-left">'+
              '<div class="progress small radius" style="background: #f7f7f7">'+
              '  <span class="meter" style="width: '+quotas.percentage+'%;"></span>'+
              '</div>'+
            '</li>');

            quotas = QuotaWidgets.quotaMBInfo(0, 0, null, true);

            $(".provision-pricing-table_user_info", context).append('<li class="provision-bullet-item text-left">'+
              Locale.tr("Memory")+
              '<span class="right">'+quotas.str+"</span>"+
            '</li>'+
            '<li class="provision-bullet-item text-left">'+
              '<div class="progress small radius" style="background: #f7f7f7">'+
              '  <span class="meter" style="width: '+quotas.percentage+'%;"></span>'+
              '</div>'+
            '</li>');
          }

          $(".provision-pricing-table_user_info", context).append(
              '<li class="text-left provision-bullet-item">'+
                '<hr style="margin: 0px">'+
              '</li>'+
              '<li class="provision-bullet-item ">'+
                '<span class="provision_vdc_user_info_show_vms button medium radius" data-tooltip title="'+Locale.tr("User Virtual Machines")+'" style="margin-right: 10px">'+
                  '<i class="fa fa-th fa-lg"></i>'+
                '</span>'+
                '<span class="provision_vdc_user_info_show_templates button medium radius" data-tooltip title="'+Locale.tr("User Saved Templates")+'" style="margin-right: 10px">'+
                  '<i class="fa fa-save fa-lg"></i>'+
                '</span>'+
                '<span class="provision_vdc_user_info_show_flows button medium radius" data-tooltip title="'+Locale.tr("User Services")+'" style="margin-right: 10px">'+
                  '<i class="fa fa-cubes fa-lg"></i>'+
                '</span>'+
                '<span class="provision_vdc_user_info_show_acct button medium radius" data-tooltip title="'+Locale.tr("User Accounting")+'" style="margin-right: 10px">'+
                  '<i class="fa fa-bar-chart-o fa-lg"></i>'+
                '</span>'+
                (Config.isFeatureEnabled("showback") ? '<span class="provision_vdc_user_info_show_showback button medium radius" data-tooltip title="'+Locale.tr("User Showback")+'" style="margin-right: 10px">'+
                  '<i class="fa fa-money fa-lg"></i>'+
                '</span>' : '') +
              '</li>'+
              '<li class="provision-bullet-item text-left">'+
              '</li>')

          var start_time =  Math.floor(new Date().getTime() / 1000);
          // ms to s

          // 604800 = 7 days = 7*24*60*60
          start_time = start_time - 604800;

          // today
          var end_time = -1;

          var options = {
            "start_time": start_time,
            "end_time": end_time,
            "userfilter": user_id
          }

          var no_table = true;

          OpenNebula.VM.accounting({
              success: function(req, response){
                  Accounting.fillAccounting($(".dashboard_vm_accounting", context), req, response, no_table);
              },
              error: Notifier.onError,
              data: options
          });

          $(".provision_info_vdc_user", context).show();
          $(".provision_info_vdc_user_loading", context).hide();

          $(document).foundation();
          //$("#provision_info_vdc_quotas").html(quotas_html);
        }
      })
    }
    //
    // Info User
    //

    $(".provision_list_users", context).on("click", ".provision_info_user_button", function(){
      $("a.provision_show_user_accordion", context).trigger("click");
      // TODO loading

      var user_id = $(this).parents(".provision-pricing-table").attr("opennebula_id")
      update_provision_vdc_user_info(user_id, context);
    })

    context.on("click", ".provision_vdc_user_info_show_vms", function(){
      $(".provision_vdc_info_container", context).html('<div class="text-center">'+
        '<span class="fa-stack fa-5x" style="color: #dfdfdf">'+
          '<i class="fa fa-cloud fa-stack-2x"></i>'+
          '<i class="fa  fa-spinner fa-spin fa-stack-1x fa-inverse"></i>'+
        '</span>'+
        '<br>'+
        '<br>'+
        '<span style="font-size: 18px; color: #999">'+
        '</span>'+
        '</div>');

      generate_provision_vms_list(
        $(".provision_vdc_info_container", context),
        {
          title:  $(".provision_info_vdc_user", context).attr("uname") + ' ' + Locale.tr("VMs"),
          active: true,
          refresh: true,
          create: false,
          filter: false,
          filter_expression:  $(".provision_info_vdc_user", context).attr("opennebula_id")
        });
    })

    context.on("click", ".provision_vdc_user_info_show_templates", function(){
      $(".provision_vdc_info_container", context).html('<div class="text-center">'+
        '<span class="fa-stack fa-5x" style="color: #dfdfdf">'+
          '<i class="fa fa-cloud fa-stack-2x"></i>'+
          '<i class="fa  fa-spinner fa-spin fa-stack-1x fa-inverse"></i>'+
        '</span>'+
        '<br>'+
        '<br>'+
        '<span style="font-size: 18px; color: #999">'+
        '</span>'+
        '</div>');

      generate_provision_templates_list(
        $(".provision_vdc_info_container", context),
        {
          title:  $(".provision_info_vdc_user", context).attr("uname") + ' ' + Locale.tr("Templates"),
          active: true,
          refresh: true,
          create: false,
          filter: false,
          filter_expression:  $(".provision_info_vdc_user", context).attr("opennebula_id")
        });
    })

    context.on("click", ".provision_vdc_user_info_show_flows", function(){
      $(".provision_vdc_info_container", context).html('<div class="text-center">'+
        '<span class="fa-stack fa-5x" style="color: #dfdfdf">'+
          '<i class="fa fa-cloud fa-stack-2x"></i>'+
          '<i class="fa  fa-spinner fa-spin fa-stack-1x fa-inverse"></i>'+
        '</span>'+
        '<br>'+
        '<br>'+
        '<span style="font-size: 18px; color: #999">'+
        '</span>'+
        '</div>');

      generate_provision_flows_list(
        $(".provision_vdc_info_container", context),
        {
          title:  $(".provision_info_vdc_user", context).attr("uname") + ' ' + Locale.tr("Services"),
          active: true,
          refresh: true,
          create: false,
          filter: false,
          filter_expression:  $(".provision_info_vdc_user", context).attr("opennebula_id")
        });
    })


    context.on("click", ".provision_vdc_user_info_show_acct", function(){
      $(".provision_vdc_info_container", context).html("");

      $(".provision_vdc_info_container", context).html(Accounting.html());
      Accounting.setup(
        $(".provision_vdc_info_container", context),
          { fixed_user: $(".provision_info_vdc_user", context).attr("opennebula_id"),
            init_group_by: "vm" });

      $(".provision_vdc_info_container", context).prepend(
        '<h2 class="subheader">'+
          $(".provision_info_vdc_user", context).attr("uname") + ' ' + Locale.tr("Accounting")+
        '</h2>')
    })

    if (Config.isFeatureEnabled("showback")) { 
      context.on("click", ".provision_vdc_user_info_show_showback", function(){
        $(".provision_vdc_info_container", context).html("");

        $(".provision_vdc_info_container", context).html(Showback.html());
        Showback.setup(
          $(".provision_vdc_info_container", context),
            { fixed_user: $(".provision_info_vdc_user", context).attr("opennebula_id"),
              fixed_group: "" });

        $(".provision_vdc_info_container", context).prepend(
          '<h2 class="subheader">'+
            $(".provision_info_vdc_user", context).attr("uname") + ' ' + Locale.tr("Showback")+
          '</h2>')
      })
    };

    context.on("click", ".provision_vdc_user_delete_confirm_button", function(){
      $(".provision_vdc_user_confirm_action", context).html(
        '<div data-alert class="alert-box secondary radius">'+
          '<div class="row">'+
            '<div class="large-10 large-centered columns">'+
              '<span style="font-size: 14px; line-height: 20px">'+
                Locale.tr("Be careful, this action will inmediately remove the User from OpenNebula")+
              '</span>'+
            '</div>'+
          '</div>'+
          '<br>'+
          '<div class="row">'+
            '<div class="large-10 large-centered columns">'+
              '<a href"#" class="provision_delete_button alert button large-12 large radius">'+Locale.tr("Delete User")+'</a>'+
            '</div>'+
          '</div>'+
          '<a href="#" class="close" style="top: 20px">&times;</a>'+
        '</div>');
    });

    context.on("click", ".provision_vdc_user_password_confirm_button", function(){
      $(".provision_vdc_user_confirm_action", context).html(
        '<div data-alert class="alert-box secondary radius">'+
          '<div class="row">'+
            '<div class="large-10 large-centered columns">'+
              '<input type="password" class="provision_vdc_user_new_password provision-input" placeholder="'+Locale.tr("New Password")+'" style="height: 40px !important; font-size: 16px; padding: 0.5rem  !important;"/>'+
            '</div>'+
          '</div>'+
          '<div class="row">'+
            '<div class="large-10 large-centered columns">'+
              '<input type="password" class="provision_vdc_user_new_confirm_password provision-input" placeholder="'+Locale.tr("Confirm Password")+'" style="height: 40px !important; font-size: 16px; padding: 0.5rem  !important;"/>'+
              '<br>'+
            '</div>'+
          '</div>'+
          '<div class="row">'+
            '<div class="large-10 large-centered columns">'+
              '<button href"#" type="submit" class="provision_vdc_user_change_password_button button success large radius large-12 small-12">'+Locale.tr("Update Password")+'</button>'+
            '</div>'+
          '</div>'+
          '<a href="#" class="close" style="top: 20px">&times;</a>'+
        '</div>');

        context.on("click", ".provision_vdc_user_change_password_button", function(){
          var button = $(this);
          button.attr("disabled", "disabled");
          var user_id = $(".provision_info_vdc_user", context).attr("opennebula_id");
          var pw = $('.provision_vdc_user_new_password', context).val();
          var confirm_password = $('.provision_vdc_user_new_confirm_password', context).val();

          if (!pw.length){
              Notifier.notifyError(Locale.tr("Fill in a new password"));
              return false;
          }

          if (pw !== confirm_password){
              Notifier.notifyError(Locale.tr("Passwords do not match"));
              return false;
          }

          OpenNebula.User.passwd({
            data : {
              id: user_id,
              extra_param: pw
            },
            success: function(request, response){
              update_provision_vdc_user_info(user_id, context);
              button.removeAttr("disabled");
            },
            error: function(request, response){
              Notifier.onError(request, response);
              button.removeAttr("disabled");
            }
          })
          return false;
        });
    });



    context.on("click", ".provision_vdc_user_quota_confirm_button", function(){
      $(".provision_vdc_user_confirm_action", context).html(
        '<div data-alert class="alert-box secondary radius">'+
          provision_quota_widget+
          '<br>'+
          '<br>'+
          '<div class="row">'+
            '<div class="large-10 large-centered columns">'+
              '<a href"#" class="provision_update_quota_button success large button large-12 radius" style="margin-right: 15px">'+Locale.tr("Update User Quota")+'</a>'+
            '</div>'+
          '</div>'+
          '<a href="#" class="close" style="top: 20px">&times;</a>'+
        '</div>');

        setup_provision_quota_widget(context);

        $(document).foundation();

        var quotas_str = $(".provision_info_vdc_user", context).attr("quotas");
        if (quotas_str) {
          var quotas = JSON.parse(quotas_str);

          var vms_limit = QuotaLimits.QUOTA_LIMIT_DEFAULT;
          var cpu_limit = QuotaLimits.QUOTA_LIMIT_DEFAULT;
          var mem_limit = QuotaLimits.QUOTA_LIMIT_DEFAULT;

          if ( quotas.VM != undefined ){
            vms_limit = quotas.VM.VMS;
            cpu_limit = quotas.VM.CPU;
            mem_limit = quotas.VM.MEMORY;

            if(mem_limit != QuotaLimits.QUOTA_LIMIT_UNLIMITED &&
               mem_limit != QuotaLimits.QUOTA_LIMIT_DEFAULT){

              mem_limit = quotas.VM.MEMORY/1024;
            }
          }

          var fill_limits = function(limit, select, input){
            switch(limit){
              case QuotaLimits.QUOTA_LIMIT_DEFAULT:
                select.val('default').change();
                input.val('').change();
                break;

              case QuotaLimits.QUOTA_LIMIT_UNLIMITED:
                select.val('unlimited').change();
                input.val('').change();
                break;

              default:
                select.val('edit').change();
                input.val(limit).change();
            }
          }

          fill_limits(
            vms_limit,
            $("div.provision_rvms_quota select.provision_quota_select", context),
            $(".provision_rvms_quota_input", context) );

          fill_limits(
            cpu_limit,
            $("div.provision_cpu_quota select.provision_quota_select", context),
            $(".provision_cpu_quota_input", context) );

          fill_limits(
            mem_limit,
            $("div.provision_memory_quota select.provision_quota_select", context),
            $(".provision_memory_quota_tmp_input", context) );
        }
    });

    context.on("click", ".provision_delete_button", function(){
      var button = $(this);
      button.attr("disabled", "disabled");
      var user_id = $(".provision_info_vdc_user", context).attr("opennebula_id");
      OpenNebula.User.del({
        data : {
          id: user_id
        },
        success: function(request, response){
          $(".provision_back", context).click();
          $(".provision_users_list_refresh_button", context).click();
          button.removeAttr("disabled");
        },
        error: function(request, response){
          Notifier.onError(request, response);
          button.removeAttr("disabled");
        }
      })
    });

    context.on("click", ".provision_update_quota_button", function(){
      var button = $(this);
      button.attr("disabled", "disabled");
      var user_id = $(".provision_info_vdc_user", context).attr("opennebula_id");

      quota_json = retrieve_provision_quota_widget(context);

      OpenNebula.User.set_quota({
        data : {
          id: user_id,
          extra_param: quota_json
        },
        success: function(request, response){
          update_provision_vdc_user_info(user_id, context);
          button.removeAttr("disabled");
        },
        error: function(request, response){
          Notifier.onError(request, response);
          button.removeAttr("disabled");
        }
      })
    });

    context.on("click", ".provision_refresh_info", function(){
      var user_id = $(".provision_info_vdc_user", context).attr("opennebula_id");
      update_provision_vdc_user_info(user_id, context);
      return false;
    });
  }

  function setup_provision_users_list(context){
    var provision_users_datatable = $('.provision_users_table', context).dataTable({
      "iDisplayLength": 6,
      "sDom" : '<"H">t<"F"lp>',
      "aLengthMenu": [[6, 12, 36, 72], [6, 12, 36, 72]],
      "aaSorting"  : [[0, "desc"]],
      "aoColumnDefs": [
          { "bVisible": false, "aTargets": ["all"]}
      ],
      "aoColumns": [
          { "mDataProp": "USER.ID" },
          { "mDataProp": "USER.NAME" }
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
              Locale.tr("The list of users is empty")+
            '</span>'+
            '</div>');
        } else {
          $(".provision_users_table", context).html('<ul class="provision_users_ul large-block-grid-3 medium-block-grid-3 small-block-grid-1 text-center"></ul>');
        }

        return true;
      },
      "fnRowCallback": function( nRow, aData, iDisplayIndex, iDisplayIndexFull ) {
        var data = aData.USER;
        //var state = get_provision_vm_state(data);
        var vms = "";
        var memory = "";
        var cpu = "";

        // Inject the VM user quota. This info is returned separately in the
        // pool info call, but the userElementArray expects it inside the USER,
        // as it is returned by the individual info call
        var q = provision_quotas_list[data.ID];

        var quotas_html;

        if (q != undefined){
            var quota = q.QUOTAS;

            if ($.isEmptyObject(quota.VM_QUOTA)){
              var limit = (data.ID != 0 ? QuotaLimits.QUOTA_LIMIT_DEFAULT : QuotaLimits.QUOTA_LIMIT_UNLIMITED);

              quota.VM_QUOTA = {
                VM: {
                  VMS         : limit,
                  VMS_USED    : 0,
                  CPU         : limit,
                  CPU_USED    : 0,
                  MEMORY      : limit,
                  MEMORY_USED : 0
                }
              }
            }

            if (!$.isEmptyObject(quota.VM_QUOTA)){
                var default_user_quotas = QuotaDefaults.getDefaultUserQuotas();
                
                quotas = QuotaWidgets.quotaFloatInfo(
                    quota.VM_QUOTA.VM.VMS_USED,
                    quota.VM_QUOTA.VM.VMS,
                    default_user_quotas.VM_QUOTA.VM.VMS,
                    true);

                quotas_html = "";
                quotas_html += '<li class="provision-bullet-item text-left" style="margin-top:5px; margin-left: 10px; margin-right: 10px; font-size: 12px">'+
                  Locale.tr("Running VMs")+
                  '<span class="right">'+quotas.str+"</span>"+
                '</li>'+
                '<li class="provision-bullet-item text-left" style="padding-top: 0px; margin-left: 10px; margin-right: 10px">'+
                  '<div class="progress small radius">'+
                  '  <span class="meter" style="width: '+quotas.percentage+'%;"></span>'+
                  '</div>'+
                '</li>';

                quotas = QuotaWidgets.quotaFloatInfo(
                    quota.VM_QUOTA.VM.CPU_USED,
                    quota.VM_QUOTA.VM.CPU,
                    default_user_quotas.VM_QUOTA.VM.CPU,
                    true);

                quotas_html += '<li class="provision-bullet-item text-left" style="margin-left: 10px; margin-right: 10px; font-size: 12px">'+
                  Locale.tr("CPU")+
                  '<span class="right">'+quotas.str+"</span>"+
                '</li>'+
                '<li class="provision-bullet-item text-left" style="padding-top: 0px; margin-left: 10px; margin-right: 10px">'+
                  '<div class="progress small radius">'+
                  '  <span class="meter" style="width: '+quotas.percentage+'%;"></span>'+
                  '</div>'+
                '</li>';

                quotas = QuotaWidgets.quotaMBInfo(
                    quota.VM_QUOTA.VM.MEMORY_USED,
                    quota.VM_QUOTA.VM.MEMORY,
                    default_user_quotas.VM_QUOTA.VM.MEMORY,
                    true);

                quotas_html += '<li class="provision-bullet-item text-left" style="margin-left: 10px; margin-right: 10px; font-size: 12px">'+
                  Locale.tr("Memory")+
                  '<span class="right">'+quotas.str+"</span>"+
                '</li>'+
                '<li class="provision-bullet-item text-left" style="padding-top: 0px; margin-left: 10px; margin-right: 10px">'+
                  '<div class="progress small radius">'+
                  '  <span class="meter" style="width: '+quotas.percentage+'%;"></span>'+
                  '</div>'+
                '</li>';
            } else {
                quotas = QuotaWidgets.quotaFloatInfo(0, 0, null, true);

                quotas_html = "";
                quotas_html += '<li class="provision-bullet-item text-left" style="margin-top:5px; margin-left: 10px; margin-right: 10px; font-size: 12px">'+
                  Locale.tr("Running VMs")+
                  '<span class="right">'+quotas.str+"</span>"+
                '</li>'+
                '<li class="provision-bullet-item text-left" style="padding-top: 0px; margin-left: 10px; margin-right: 10px">'+
                  '<div class="progress small radius">'+
                  '  <span class="meter" style="width: '+quotas.percentage+'%;"></span>'+
                  '</div>'+
                '</li>';

                quotas = QuotaWidgets.quotaFloatInfo(0, 0, null, true);

                quotas_html += '<li class="provision-bullet-item text-left" style="margin-left: 10px; margin-right: 10px; font-size: 12px">'+
                  Locale.tr("CPU")+
                  '<span class="right">'+quotas.str+"</span>"+
                '</li>'+
                '<li class="provision-bullet-item text-left" style="padding-top: 0px; margin-left: 10px; margin-right: 10px">'+
                  '<div class="progress small radius">'+
                  '  <span class="meter" style="width: '+quotas.percentage+'%;"></span>'+
                  '</div>'+
                '</li>';

                quotas = QuotaWidgets.quotaMBInfo(0, 0, null, true);

                quotas_html += '<li class="provision-bullet-item text-left" style="margin-left: 10px; margin-right: 10px; font-size: 12px">'+
                  Locale.tr("Memory")+
                  '<span class="right">'+quotas.str+"</span>"+
                '</li>'+
                '<li class="provision-bullet-item text-left" style="padding-top: 0px; margin-left: 10px; margin-right: 10px">'+
                  '<div class="progress small radius">'+
                  '  <span class="meter" style="width: '+quotas.percentage+'%;"></span>'+
                  '</div>'+
                '</li>';
              }
        }


        $(".provision_users_ul", context).append('<li>'+
            '<ul class="provision-pricing-table" opennebula_id="'+data.ID+'" datatable_index="'+iDisplayIndexFull+'">'+
              '<li class="provision-title text-left" style="padding-bottom: 10px">'+
                '<a class="provision_info_user_button" style="color:#555" href="#"><i class="fa fa-fw fa-lg fa-sign-in right only-on-hover"/>'+ data.NAME + '</a>'+
              '</li>'+
                quotas_html +
            '</ul>'+
          '</li>');

        return nRow;
      }
    });


    $('.provision_list_users_search', context).keyup(function(){
      provision_users_datatable.fnFilter( $(this).val() );
    })

    $('.provision_list_users_search', context).change(function(){
      provision_users_datatable.fnFilter( $(this).val() );
    })

    context.on("click", ".provision_users_list_refresh_button", function(){
      OpenNebula.Action.clear_cache("USER");
      update_provision_users_datatable(provision_users_datatable, 0);
      return false;
    });

    $(document).foundation();
  }

  function generate_provision_users_list(context, opts) {
    context.off();
    context.html(provision_list_users(opts));
    setup_provision_users_list(context);
    setup_provision_user_info(context);
  }

  // Closes and resets the create user wizard
  function clear_provision_create_user(){
    OpenNebula.Action.clear_cache("USER");
    show_provision_user_list(0);

    var context = $("#provision_create_user");
    $("#username", context).val('');
    $("#password", context).val('');
    $("#repeat_password", context).val('');

    reset_provision_quota_widget(context);

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
        $('.right-header').prepend(TemplateHeader({'logo': Config.provision.logo}))

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

        $(".provision_image_header").on("click", function(){
          show_provision_dashboard();
        })

        generate_provision_vms_list($(".provision_vms_list_section"), {active: true});

        if (Config.isTabPanelEnabled("provision-tab", "templates")) {
          generate_provision_templates_list($(".provision_templates_list_section"), {active: true});
        }

        // TODO check if active
        generate_provision_flows_list($(".provision_flows_list_section"), {active: true});
        generate_provision_users_list($(".provision_users_list_section"), {active: true});

        //
        // Dashboard
        //

        show_provision_dashboard();

        $(document).on("click", ".provision_vms_list_button", function(){
          OpenNebula.Action.clear_cache("VM");
          show_provision_vm_list(0);
        });

        $(document).on("click", ".provision_templates_list_button", function(){
          OpenNebula.Action.clear_cache("VMTEMPLATE");
          show_provision_template_list(0);
        });

        $(document).on("click", ".provision_flows_list_button", function(){
          OpenNebula.Action.clear_cache("SERVICE");
          show_provision_flow_list(0);
        });

        $(document).on("click", ".provision_users_list_button", function(){
          OpenNebula.Action.clear_cache("USER");
          show_provision_user_list(0);
        });

        //
        // User Info
        //

        $("#provision_user_info_button").on("click", function(){
          show_provision_user_info();
        });

        $("#provision_user_info").on("click", "#provision_user_info_refresh_button", function(){
          show_provision_user_info();
        });

        $.each( config['available_views'], function(id, view) {
          $('select#provision_user_views_select').append('<option value="'+view+'">'+view+'</option>')
        });

        $("#provision_change_password_form").submit(function(){
          var pw = $('#provision_new_password', this).val();
          var confirm_password = $('#provision_new_confirm_password', this).val();

          if (!pw.length){
              Notifier.notifyError(Locale.tr("Fill in a new password"));
              return false;
          }

          if (pw !== confirm_password){
              Notifier.notifyError(Locale.tr("Passwords do not match"));
              return false;
          }

          Sunstone.runAction("Provision.User.passwd", "-1", pw);
          return false;
        });

        $("#provision_add_ssh_key_form").submit(function(){
          var keypair = $('#provision_ssh_key', this).val();

          if (!keypair.length){
              Notifier.notifyError(Locale.tr("You have to provide an SSH key"));
              return false;
          }

          OpenNebula.User.show({
            data : {
                id: "-1"
            },
            success: function(request,user_json){
              var template = user_json.USER.TEMPLATE;

              template["SSH_PUBLIC_KEY"] = keypair;

              template_str = "";
              $.each(template,function(key,value){
                template_str += (key + '=' + '"' + value + '"\n');
              });

              Sunstone.runAction("Provision.User.update_template", "-1", template_str);
            }
          })
          return false;
        });

        $("#provision_change_view_form").submit(function(){
          var view = $('#provision_user_views_select', this).val();

          OpenNebula.User.show({
            data : {
                id: "-1"
            },
            success: function(request,user_json){
              var template = user_json.USER.TEMPLATE;

              template["DEFAULT_VIEW"] = view;

              template_str = "";
              $.each(template,function(key,value){
                template_str += (key + '=' + '"' + value + '"\n');
              });

              var data = OpenNebula.Helper.action('update', {"template_raw" : template_str });

              $.ajax({
                url: 'config',
                type: "POST",
                dataType: "json",
                data: JSON.stringify(data),
                success: function(){
                    window.location.href = ".";
                },
                error: function(response){
                }
              });
            }
          })
          return false;
        });

        $("#provision_change_language_form").submit(function(){
          var lang = $('#provision_new_language', this).val();

          OpenNebula.User.show({
            data : {
                id: "-1"
            },
            success: function(request,user_json){
              var template = user_json.USER.TEMPLATE;

              template["LANG"] = lang;

              template_str = "";
              $.each(template,function(key,value){
                template_str += (key + '=' + '"' + value + '"\n');
              });

              var data = OpenNebula.Helper.action('update', {"template_raw" : template_str });

              $.ajax({
                url: 'config',
                type: "POST",
                dataType: "json",
                data: JSON.stringify(data),
                success: function(){
                    window.location.href = ".";
                },
                error: function(response){
                }
              });
            }
          })
          return false;
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
          update_provision_templates_datatable(provision_system_templates_datatable);
          update_provision_templates_datatable(provision_saved_templates_datatable);
          update_provision_templates_datatable(provision_vdc_templates_datatable);

        });

        tab.on("click", "#provision_create_vm .provision_select_template .provision-pricing-table.only-one" , function(){
          var create_vm_context = $("#provision_create_vm");

          if ($(this).hasClass("selected")){
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
                var role_state = get_provision_flow_state(role);

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

        setup_provision_quota_widget(context);

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