define(function(require) {
  require('foundation.alert');
  var OpenNebula = require('opennebula');
  var Locale = require('utils/locale');
  var Config = require('sunstone-config');
  var Notifier = require('utils/notifier');
  var QuotaWidgets = require('utils/quotas/quota-widgets');
  var QuotaLimits = require('utils/quotas/quota-limits');
  var QuotaDefaults = require('utils/quotas/quota-defaults');
  var Accounting = require('utils/accounting');
  var Showback = require('utils/showback');

  var ProvisionQuotaWidget = require('./quota-widget');
  var ProvisionVmsList = require('tabs/provision-tab/vms/list');
  var ProvisionTemplatesList = require('tabs/provision-tab/templates/list');
  var ProvisionFlowsList = require('tabs/provision-tab/flows/list');

  var TemplateProvisionQuotaWidget = require('hbs!./quota-widget/html');
  var TemplateUsersList = require('hbs!./list');

  var _accordionId = 0;

  return {
    'generate': generate_provision_users_list,
    'show': show_provision_user_list
  };

  function show_provision_user_list(timeout) {
    $(".section_content").hide();
    $(".provision_users_list_section").fadeIn();

    $("dd:not(.active) .provision_back", $(".provision_users_list_section")).trigger("click");
    $(".provision_users_list_refresh_button", $(".provision_users_list_section")).trigger("click");
  }

  function generate_provision_users_list(context, opts) {
    context.off();
    context.html(html(opts));
    setup_provision_users_list(context);
    setup_provision_user_info(context);
  }

  function html(opts_arg) {
    _accordionId += 1;
    return TemplateUsersList({'accordionId': _accordionId});
  }

  function update_provision_users_datatable(datatable, timeout) {
    datatable.html('<div class="text-center">' +
      '<span class="fa-stack fa-5x" style="color: #dfdfdf">' +
        '<i class="fa fa-cloud fa-stack-2x"></i>' +
        '<i class="fa  fa-spinner fa-spin fa-stack-1x fa-inverse"></i>' +
      '</span>' +
      '<br>' +
      '<br>' +
      '<span style="font-size: 18px; color: #999">' +
      '</span>' +
      '</div>');

    setTimeout(function() {
      OpenNebula.User.list({
        timeout: true,
        success: function (request, item_list, quotas_list) {
          datatable.fnClearTable(true);
          if (item_list.length == 0) {
            datatable.html('<div class="text-center">' +
              '<span class="fa-stack fa-5x" style="color: #dfdfdf">' +
                '<i class="fa fa-cloud fa-stack-2x"></i>' +
                '<i class="fa fa-info-circle fa-stack-1x fa-inverse"></i>' +
              '</span>' +
              '<br>' +
              '<br>' +
              '<span style="font-size: 18px; color: #999">' +
                Locale.tr("The list of users is empty") +
              '</span>' +
              '</div>');
          } else {
            provision_quotas_list = quotas_list;
            datatable.fnAddData(item_list);
          }
        },
        error: Notifier.onError
      })
    }, timeout);
  }

  function setup_provision_users_list(context) {
    var provision_users_datatable = $('.provision_users_table', context).dataTable({
      "iDisplayLength": 6,
      "sDom" : '<"H">t<"F"lp>',
      "aLengthMenu": [[6, 12, 36, 72], [6, 12, 36, 72]],
      "aaSorting"  : [[0, "desc"]],
      "aoColumnDefs": [
          {"bVisible": false, "aTargets": ["all"]}
      ],
      "aoColumns": [
          {"mDataProp": "USER.ID"},
          {"mDataProp": "USER.NAME"}
      ],
      "fnPreDrawCallback": function (oSettings) {
        // create a thumbs container if it doesn't exist. put it in the dataTables_scrollbody div
        if (this.$('tr', {"filter": "applied"}).length == 0) {
          this.html('<div class="text-center">' +
            '<span class="fa-stack fa-5x" style="color: #dfdfdf">' +
              '<i class="fa fa-cloud fa-stack-2x"></i>' +
              '<i class="fa fa-info-circle fa-stack-1x fa-inverse"></i>' +
            '</span>' +
            '<br>' +
            '<br>' +
            '<span style="font-size: 18px; color: #999">' +
              Locale.tr("The list of users is empty") +
            '</span>' +
            '</div>');
        } else {
          $(".provision_users_table", context).html('<ul class="provision_users_ul large-block-grid-3 medium-block-grid-3 small-block-grid-1 text-center"></ul>');
        }

        return true;
      },
      "fnRowCallback": function(nRow, aData, iDisplayIndex, iDisplayIndexFull) {
        var data = aData.USER;
        //var state = get_provision_vm_state(data);
        var vms = "";
        var memory = "";
        var cpu = "";

        var quotas_html;
        QuotaWidgets.initEmptyQuotas(data);

        if (!$.isEmptyObject(data.VM_QUOTA)) {
          var default_user_quotas = QuotaDefaults.getDefaultUserQuotas();

          quotas = QuotaWidgets.quotaFloatInfo(
              data.VM_QUOTA.VM.VMS_USED,
              data.VM_QUOTA.VM.VMS,
              default_user_quotas.VM_QUOTA.VM.VMS,
              true);

          quotas_html = "";
          quotas_html += '<li class="provision-bullet-item text-left">' +
            '<i class="fa fa-fw fa-th"></i> '+ Locale.tr("VMs") +
            '<span class="right">' + quotas.str + "</span>" +
          '</li>';

          quotas = QuotaWidgets.quotaFloatInfo(
              data.VM_QUOTA.VM.CPU_USED,
              data.VM_QUOTA.VM.CPU,
              default_user_quotas.VM_QUOTA.VM.CPU,
              true);

          quotas_html += '<li class="provision-bullet-item text-left">' +
            '<i class="fa fa-fw fa-tachometer"></i> '+ Locale.tr("CPU") +
            '<span class="right">' + quotas.str + "</span>" +
          '</li>';

          quotas = QuotaWidgets.quotaMBInfo(
              data.VM_QUOTA.VM.MEMORY_USED,
              data.VM_QUOTA.VM.MEMORY,
              default_user_quotas.VM_QUOTA.VM.MEMORY,
              true);

          quotas_html += '<li class="provision-bullet-item text-left">' +
            '<i class="fa fa-fw fa-align-left"></i> '+ Locale.tr("Memory") +
            '<span class="right">' + quotas.str + "</span>" +
          '</li>';
        } else {
          quotas = QuotaWidgets.quotaFloatInfo(0, 0, null, true);

          quotas_html = "";
          quotas_html += '<li class="provision-bullet-item text-left">' +
            '<i class="fa fa-fw fa-th"></i> '+ Locale.tr("VMs") +
            '<span class="right">' + quotas.str + "</span>" +
          '</li>';

          quotas = QuotaWidgets.quotaFloatInfo(0, 0, null, true);

          quotas_html += '<li class="provision-bullet-item text-left">' +
            '<i class="fa fa-fw fa-tachometer"></i> '+ Locale.tr("CPU") +
            '<span class="right">' + quotas.str + "</span>" +
          '</li>';

          quotas = QuotaWidgets.quotaMBInfo(0, 0, null, true);

          quotas_html += '<li class="provision-bullet-item text-left">' +
            '<i class="fa fa-fw fa-align-left"></i> '+ Locale.tr("Memory") +
            '<span class="right">' + quotas.str + "</span>" +
          '</li>';
        }

        $(".provision_users_ul", context).append('<li>' +
            '<ul class="provision-pricing-table" opennebula_id="' + data.ID + '" datatable_index="' + iDisplayIndexFull + '">' +
              '<li class="provision-title text-left" style="padding-bottom: 10px">' +
                '<a class="provision_info_user_button" style="color:#555" href="#"><i class="fa fa-fw fa-lg fa-sign-in right only-on-hover"/>' + data.NAME + '</a>' +
              '</li>' +
                quotas_html +
            '</ul>' +
          '</li>');

        return nRow;
      }
    });

    $('.provision_list_users_search', context).on('input',function(){
      provision_users_datatable.fnFilter($(this).val());
    })

    context.on("click", ".provision_users_list_refresh_button", function() {
      OpenNebula.Action.clear_cache("USER");
      update_provision_users_datatable(provision_users_datatable, 0);
      return false;
    });

    $(document).foundation();
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
        success: function(request, response) {
          var data = response.USER

          $(".provision_vdc_user_confirm_action", context).html("");
          $(".provision_info_vdc_user_acct", context).html("");

          $(".provision_info_vdc_user", context).attr("opennebula_id", data.ID);
          $(".provision_info_vdc_user", context).attr("uname", data.NAME);
          $(".provision_info_vdc_user", context).attr("quotas", JSON.stringify(data.VM_QUOTA));
          $(".provision_info_vdc_user_name", context).text(data.NAME);

          $(".provision-pricing-table_user_info", context).html("");

          QuotaWidgets.initEmptyQuotas(data);

          if (!$.isEmptyObject(data.VM_QUOTA)) {
            var default_user_quotas = QuotaDefaults.default_quotas(data.DEFAULT_USER_QUOTAS);
            vms_quotas = QuotaWidgets.quotaFloatInfo(
                data.VM_QUOTA.VM.VMS_USED,
                data.VM_QUOTA.VM.VMS,
                default_user_quotas.VM_QUOTA.VM.VMS,
                true);

            cpu_quotas = QuotaWidgets.quotaFloatInfo(
                data.VM_QUOTA.VM.CPU_USED,
                data.VM_QUOTA.VM.CPU,
                default_user_quotas.VM_QUOTA.VM.CPU,
                true);

            mem_quotas = QuotaWidgets.quotaMBInfo(
                data.VM_QUOTA.VM.MEMORY_USED,
                data.VM_QUOTA.VM.MEMORY,
                default_user_quotas.VM_QUOTA.VM.MEMORY,
                true);

            $(".provision-pricing-table_user_info", context).append('<li class="provision-bullet-item text-left">' +
              '<div class="large-4 columns">'+
                '<i class="fa fa-fw fa-th"></i> '+ Locale.tr("VMs") +
                '<span class="right">' + vms_quotas.str + "</span>" +
              '</div>'+
              '<div class="large-4 columns">'+
                '<i class="fa fa-fw fa-tachometer"></i> '+ Locale.tr("CPU") +
                '<span class="right">' + cpu_quotas.str + "</span>" +
              '</div>'+
              '<div class="large-4 columns">'+
                '<i class="fa fa-fw fa-align-left"></i> '+ Locale.tr("Memory") +
                '<span class="right">' + mem_quotas.str + "</span>" +
              '</div>'+
            '</li>' +
            '<li class="provision-bullet-item text-left">' +
              '<div class="large-4 columns">'+
                '<div class="progress small radius" style="background: #f7f7f7">' +
                  '  <span class="meter" style="width: ' + vms_quotas.percentage + '%;"></span>' +
                '</div>' +
              '</div>'+
              '<div class="large-4 columns">'+
                '<div class="progress small radius" style="background: #f7f7f7">' +
                  '  <span class="meter" style="width: ' + cpu_quotas.percentage + '%;"></span>' +
                '</div>' +
              '</div>'+
              '<div class="large-4 columns">'+
                '<div class="progress small radius" style="background: #f7f7f7">' +
                  '  <span class="meter" style="width: ' + mem_quotas.percentage + '%;"></span>' +
                '</div>' +
              '</div>'+
            '</li>');
          } else {
            vms_quotas = QuotaWidgets.quotaFloatInfo(0, 0, null, true);
            cpu_quotas = QuotaWidgets.quotaFloatInfo(0, 0, null, true);
            mem_quotas = QuotaWidgets.quotaMBInfo(0, 0, null, true);

            $(".provision-pricing-table_user_info", context).append('<li class="provision-bullet-item text-left">' +
              '<div class="large-4 columns">'+
                '<i class="fa fa-fw fa-th"></i> '+ Locale.tr("VMs") +
                '<span class="right">' + vms_quotas.str + "</span>" +
              '</div>'+
              '<div class="large-4 columns">'+
                '<i class="fa fa-fw fa-tachometer"></i> '+ Locale.tr("CPU") +
                '<span class="right">' + cpu_quotas.str + "</span>" +
              '</div>'+
              '<div class="large-4 columns">'+
                '<i class="fa fa-fw fa-align-left"></i> '+ Locale.tr("Memory") +
                '<span class="right">' + mem_quotas.str + "</span>" +
              '</div>'+
            '</li>' +
            '<li class="provision-bullet-item text-left">' +
              '<div class="large-4 columns">'+
                '<div class="progress small radius" style="background: #f7f7f7">' +
                  '  <span class="meter" style="width: ' + vms_quotas.percentage + '%;"></span>' +
                '</div>' +
              '</div>'+
              '<div class="large-4 columns">'+
                '<div class="progress small radius" style="background: #f7f7f7">' +
                  '  <span class="meter" style="width: ' + cpu_quotas.percentage + '%;"></span>' +
                '</div>' +
              '</div>'+
              '<div class="large-4 columns">'+
                '<div class="progress small radius" style="background: #f7f7f7">' +
                  '  <span class="meter" style="width: ' + mem_quotas.percentage + '%;"></span>' +
                '</div>' +
              '</div>'+
            '</li>');
          }

          $(".provision-user-resource-header", context).html(
                '<span class="provision_vdc_user_info_show_vms button medium radius" data-tooltip title="' + Locale.tr("User Virtual Machines") + '" style="margin-right: 10px">' +
                  '<i class="fa fa-th fa-lg"></i>' +
                '</span>' +
                '<span class="provision_vdc_user_info_show_templates button medium radius" data-tooltip title="' + Locale.tr("User Saved Templates") + '" style="margin-right: 10px">' +
                  '<i class="fa fa-save fa-lg"></i>' +
                '</span>' +
                '<span class="provision_vdc_user_info_show_flows button medium radius" data-tooltip title="' + Locale.tr("User Services") + '" style="margin-right: 10px">' +
                  '<i class="fa fa-cubes fa-lg"></i>' +
                '</span>' +
                '<span class="provision_vdc_user_info_show_acct button medium radius" data-tooltip title="' + Locale.tr("User Accounting") + '" style="margin-right: 10px">' +
                  '<i class="fa fa-bar-chart-o fa-lg"></i>' +
                '</span>' +
                (Config.isFeatureEnabled("showback") ? '<span class="provision_vdc_user_info_show_showback button medium radius" data-tooltip title="' + Locale.tr("User Showback") + '" style="margin-right: 10px">' +
                  '<i class="fa fa-money fa-lg"></i>' +
                '</span>' : ''))

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
            success: function(req, response) {
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

    $(".provision_list_users", context).on("click", ".provision_info_user_button", function() {
      $("a.provision_show_user_accordion", context).trigger("click");
      // TODO loading

      var user_id = $(this).parents(".provision-pricing-table").attr("opennebula_id")
      update_provision_vdc_user_info(user_id, context);
    })

    context.on("click", ".provision_vdc_user_info_show_vms", function() {
      $(".provision_vdc_info_container", context).html('<div class="text-center">' +
        '<span class="fa-stack fa-5x" style="color: #dfdfdf">' +
          '<i class="fa fa-cloud fa-stack-2x"></i>' +
          '<i class="fa  fa-spinner fa-spin fa-stack-1x fa-inverse"></i>' +
        '</span>' +
        '<br>' +
        '<br>' +
        '<span style="font-size: 18px; color: #999">' +
        '</span>' +
        '</div>');

      ProvisionVmsList.generate(
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

    context.on("click", ".provision_vdc_user_info_show_templates", function() {
      $(".provision_vdc_info_container", context).html('<div class="text-center">' +
        '<span class="fa-stack fa-5x" style="color: #dfdfdf">' +
          '<i class="fa fa-cloud fa-stack-2x"></i>' +
          '<i class="fa  fa-spinner fa-spin fa-stack-1x fa-inverse"></i>' +
        '</span>' +
        '<br>' +
        '<br>' +
        '<span style="font-size: 18px; color: #999">' +
        '</span>' +
        '</div>');

      ProvisionTemplatesList.generate(
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

    context.on("click", ".provision_vdc_user_info_show_flows", function() {
      $(".provision_vdc_info_container", context).html('<div class="text-center">' +
        '<span class="fa-stack fa-5x" style="color: #dfdfdf">' +
          '<i class="fa fa-cloud fa-stack-2x"></i>' +
          '<i class="fa  fa-spinner fa-spin fa-stack-1x fa-inverse"></i>' +
        '</span>' +
        '<br>' +
        '<br>' +
        '<span style="font-size: 18px; color: #999">' +
        '</span>' +
        '</div>');

      ProvisionFlowsList.generate(
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

    context.on("click", ".provision_vdc_user_info_show_acct", function() {
      $(".provision_vdc_info_container", context).html("");

      $(".provision_vdc_info_container", context).html(Accounting.html());
      Accounting.setup(
        $(".provision_vdc_info_container", context),
          {fixed_user: $(".provision_info_vdc_user", context).attr("opennebula_id"),
            init_group_by: "vm"});

      $(".provision_vdc_info_container", context).prepend(
        '<h2 class="subheader">' +
          $(".provision_info_vdc_user", context).attr("uname") + ' ' + Locale.tr("Accounting") +
        '</h2>')
    })

    if (Config.isFeatureEnabled("showback")) {
      context.on("click", ".provision_vdc_user_info_show_showback", function() {
        $(".provision_vdc_info_container", context).html("");

        $(".provision_vdc_info_container", context).html(Showback.html());
        Showback.setup(
          $(".provision_vdc_info_container", context),
            {fixed_user: $(".provision_info_vdc_user", context).attr("opennebula_id"),
              fixed_group: ""});

        $(".provision_vdc_info_container", context).prepend(
          '<h2 class="subheader">' +
            $(".provision_info_vdc_user", context).attr("uname") + ' ' + Locale.tr("Showback") +
          '</h2>')
      })
    };

    context.on("click", ".provision_vdc_user_delete_confirm_button", function() {
      $(".provision_vdc_user_confirm_action", context).html(
        '<div data-alert class="alert-box secondary radius">' +
          '<div class="row">' +
            '<div class="large-10 large-centered columns">' +
              '<span style="font-size: 14px; line-height: 20px">' +
                Locale.tr("Be careful, this action will inmediately remove the User from OpenNebula") +
              '</span>' +
            '</div>' +
          '</div>' +
          '<br>' +
          '<div class="row">' +
            '<div class="large-10 large-centered columns">' +
              '<a href"#" class="provision_delete_button alert button large-12 large radius">' + Locale.tr("Delete User") + '</a>' +
            '</div>' +
          '</div>' +
          '<a href="#" class="close" style="top: 20px">&times;</a>' +
        '</div>');
    });

    context.on("click", ".provision_vdc_user_password_confirm_button", function() {
      $(".provision_vdc_user_confirm_action", context).html(
        '<div data-alert class="alert-box secondary radius">' +
          '<div class="row">' +
            '<div class="large-10 large-centered columns">' +
              '<input type="password" class="provision_vdc_user_new_password provision-input" placeholder="' + Locale.tr("New Password") + '" style="height: 40px !important; font-size: 16px; padding: 0.5rem  !important;"/>' +
            '</div>' +
          '</div>' +
          '<div class="row">' +
            '<div class="large-10 large-centered columns">' +
              '<input type="password" class="provision_vdc_user_new_confirm_password provision-input" placeholder="' + Locale.tr("Confirm Password") + '" style="height: 40px !important; font-size: 16px; padding: 0.5rem  !important;"/>' +
              '<br>' +
            '</div>' +
          '</div>' +
          '<div class="row">' +
            '<div class="large-10 large-centered columns">' +
              '<button href"#" type="submit" class="provision_vdc_user_change_password_button button success large radius large-12 small-12">' + Locale.tr("Update Password") + '</button>' +
            '</div>' +
          '</div>' +
          '<a href="#" class="close" style="top: 20px">&times;</a>' +
        '</div>');

      context.on("click", ".provision_vdc_user_change_password_button", function() {
          var button = $(this);
          button.attr("disabled", "disabled");
          var user_id = $(".provision_info_vdc_user", context).attr("opennebula_id");
          var pw = $('.provision_vdc_user_new_password', context).val();
          var confirm_password = $('.provision_vdc_user_new_confirm_password', context).val();

          if (!pw.length) {
            Notifier.notifyError(Locale.tr("Fill in a new password"));
            return false;
          }

          if (pw !== confirm_password) {
            Notifier.notifyError(Locale.tr("Passwords do not match"));
            return false;
          }

          OpenNebula.User.passwd({
            data : {
              id: user_id,
              extra_param: pw
            },
            success: function(request, response) {
              update_provision_vdc_user_info(user_id, context);
              button.removeAttr("disabled");
            },
            error: function(request, response) {
              Notifier.onError(request, response);
              button.removeAttr("disabled");
            }
          })
          return false;
        });
    });

    context.on("click", ".provision_vdc_user_quota_confirm_button", function() {
      $(".provision_vdc_user_confirm_action", context).html(
        '<div data-alert class="alert-box secondary radius">' +
          TemplateProvisionQuotaWidget() +
          '<br>' +
          '<br>' +
          '<div class="row">' +
            '<div class="large-10 large-centered columns">' +
              '<a href"#" class="provision_update_quota_button success large button large-12 radius" style="margin-right: 15px">' + Locale.tr("Update User Quota") + '</a>' +
            '</div>' +
          '</div>' +
          '<a href="#" class="close" style="top: 20px">&times;</a>' +
        '</div>');

      ProvisionQuotaWidget.setup(context);

      $(document).foundation();

      var quotas_str = $(".provision_info_vdc_user", context).attr("quotas");
      if (quotas_str) {
        var quotas = JSON.parse(quotas_str);

        var vms_limit = QuotaLimits.QUOTA_LIMIT_DEFAULT;
        var cpu_limit = QuotaLimits.QUOTA_LIMIT_DEFAULT;
        var mem_limit = QuotaLimits.QUOTA_LIMIT_DEFAULT;

        if (quotas.VM != undefined) {
          vms_limit = quotas.VM.VMS;
          cpu_limit = quotas.VM.CPU;
          mem_limit = quotas.VM.MEMORY;

          if (mem_limit != QuotaLimits.QUOTA_LIMIT_UNLIMITED &&
             mem_limit != QuotaLimits.QUOTA_LIMIT_DEFAULT) {

            mem_limit = quotas.VM.MEMORY / 1024;
          }
        }

        var fill_limits = function(limit, select, input) {
            switch (limit){
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
          $(".provision_rvms_quota_input", context));

        fill_limits(
          cpu_limit,
          $("div.provision_cpu_quota select.provision_quota_select", context),
          $(".provision_cpu_quota_input", context));

        fill_limits(
          mem_limit,
          $("div.provision_memory_quota select.provision_quota_select", context),
          $(".provision_memory_quota_tmp_input", context));
      }
    });

    context.on("click", ".provision_delete_button", function() {
      var button = $(this);
      button.attr("disabled", "disabled");
      var user_id = $(".provision_info_vdc_user", context).attr("opennebula_id");
      OpenNebula.User.del({
        data : {
          id: user_id
        },
        success: function(request, response) {
          $(".provision_back", context).click();
          $(".provision_users_list_refresh_button", context).click();
          button.removeAttr("disabled");
        },
        error: function(request, response) {
          Notifier.onError(request, response);
          button.removeAttr("disabled");
        }
      })
    });

    context.on("click", ".provision_update_quota_button", function() {
      var button = $(this);
      button.attr("disabled", "disabled");
      var user_id = $(".provision_info_vdc_user", context).attr("opennebula_id");

      quota_json = ProvisionQuotaWidget.retrieve(context);

      OpenNebula.User.set_quota({
        data : {
          id: user_id,
          extra_param: quota_json
        },
        success: function(request, response) {
          update_provision_vdc_user_info(user_id, context);
          button.removeAttr("disabled");
        },
        error: function(request, response) {
          Notifier.onError(request, response);
          button.removeAttr("disabled");
        }
      })
    });

    context.on("click", ".provision_refresh_info", function() {
      var user_id = $(".provision_info_vdc_user", context).attr("opennebula_id");
      update_provision_vdc_user_info(user_id, context);
      return false;
    });
  }
});
