define(function(require) {
  require('foundation.alert');
  var OpenNebula = require('opennebula');
  var OpenNebulaVM = require('opennebula/vm');
  var Locale = require('utils/locale');
  var Config = require('sunstone-config');
  var Notifier = require('utils/notifier');
  var Humanize = require('utils/humanize');
  var ResourceSelect = require('utils/resource-select');
  var Graphs = require('utils/graphs');

  var TemplateVmsList = require('hbs!./list');

  var _accordionId = 0;

  return {
    'generate': generate_provision_vms_list,
    'show': show_provision_vm_list,
    'state': get_provision_vm_state
  };

  function show_provision_vm_list(timeout, context) {
    $(".section_content").hide();
    $(".provision_vms_list_section").fadeIn();

    $("dd:not(.active) .provision_back", $(".provision_vms_list_section")).trigger("click");
    $(".provision_vms_list_refresh_button", $(".provision_vms_list_section")).trigger("click");
  }

  function generate_provision_vms_list(context, opts) {
    context.off();
    context.html(html(opts));

    if (opts.data) {
      $(".provision_vms_table", context).data("opennebula", opts.data)
    }

    setup_provision_vms_list(context, opts);
    setup_info_vm(context);
  }

  function html(opts_arg) {
    opts = $.extend({
        title: Locale.tr("Virtual Machines"),
        refresh: true,
        create: true,
        filter: true
      }, opts_arg)

    _accordionId += 1;
    return TemplateVmsList({'accordionId': _accordionId, 'opts': opts});
  }

  function fill_provision_vms_datatable(datatable, item_list) {
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
          Locale.tr("There are no Virtual Machines") +
        '</span>' +
        '<br>' +
        '<br>' +
        '</div>');
    } else {
      datatable.fnAddData(item_list);
    }
  }

  function update_provision_vms_datatable(datatable, timeout) {
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

    var data = datatable.data('opennebula');
    if (data) {
      fill_provision_vms_datatable(datatable, data)
    } else {
      setTimeout(function() {
          OpenNebula.VM.list({
            timeout: true,
            success: function (request, item_list) {
              fill_provision_vms_datatable(datatable, item_list)
            },
            error: Notifier.onError
          })
        }, timeout);
    }
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
      "fnDrawCallback": function (oSettings) {
        $(".provision_vms_ul", context).foundation('reflow', 'tooltip');

        return true;
      },
      "fnRowCallback": function( nRow, aData, iDisplayIndex, iDisplayIndexFull ) {
        var data = aData.VM;
        var state = get_provision_vm_state(data);

        $(".provision_vms_ul", context).append('<li>'+
            '<ul class="provision-pricing-table" opennebula_id="'+data.ID+'" datatable_index="'+iDisplayIndexFull+'">'+
              '<li class="provision-title text-left">'+
                '<a class="provision_info_vm_button" style="color:#555" href="#">'+
                '<span class="'+ state.color +'-color"  data-tooltip title="'+state.str+'">'+
                  '<i class="fa fa-fw fa-square"/> '+
                '</span>'+
                data.NAME + '</a>'+
              '</li>'+
              '<li class="provision-bullet-item text-left" >'+
                '<i class="fa fa-fw fa-lg fa-laptop"/> '+
                'x'+data.TEMPLATE.CPU+' - '+
                ((data.TEMPLATE.MEMORY > 1000) ?
                  (Math.floor(data.TEMPLATE.MEMORY/1024)+'GB') :
                  (data.TEMPLATE.MEMORY+'MB'))+
                ' - '+
                get_provision_disk_image(data) +
              '</li>'+
              '<li class="provision-bullet-item text-left" >'+
                '<span class="">'+
                  get_provision_ips(data) +
                '</span>'+
              '</li>'+
              '<li class="provision-bullet-item-last text-left" >'+
                '<span class="">'+
                  '<i class="fa fa-fw fa-lg fa-user"/> '+
                  data.UNAME+
                '</span>'+
                '<span class="right">'+
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
              '<li class="text-left provision-bullet-item">'+
                '<span class="'+ state.color +'-color">'+
                  '<i class="fa fa-fw fa-lg fa-square"/>&emsp;'+
                  state.str+
                '</span>'+
              '</li>'+
              '<li class="text-left provision-bullet-item">'+
                '<hr style="margin: 0px">'+
              '</li>'+
              '<li class="text-left provision-bullet-item" >'+
                '<span>'+
                  '<i class="fa fa-fw fa-lg fa-laptop"/>&emsp;'+
                  'x'+data.TEMPLATE.CPU+' - '+
                  ((data.TEMPLATE.MEMORY > 1000) ?
                    (Math.floor(data.TEMPLATE.MEMORY/1024)+'GB') :
                    (data.TEMPLATE.MEMORY+'MB'))+
                '</span>'+
                ' - '+
                '<span>'+
                  get_provision_disk_image(data) +
                '</span>'+
              '</li>'+
              '<li class="text-left provision-bullet-item" >'+
                '<span>'+
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
              '<li class="text-right provision-bullet-item">'+
                '<span class="left" style="color: #999;">'+
                  '<i class="fa fa-fw fa-lg fa-user"/>&emsp;'+
                  data.UNAME+
                '</span>'+
                '<span class="right" style="color: #999;">'+
                  '<i class="fa fa-fw fa-lg fa-clock-o"/>&emsp;'+
                  Humanize.prettyTimeAgo(data.STIME)+
                  ' - '+
                  'ID: '+
                  data.ID+
                '</span>'+
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
                monitor_resources : "MONITORING/CPU,MONITORING/MEMORY,MONITORING/NETTX,MONITORING/NETRX"
              }
            },
            success: function(request, response){
              var vm_graphs = [
                  {
                      monitor_resources : "MONITORING/CPU",
                      labels : "Real CPU",
                      humanize_figures : false,
                      div_graph : $(".vm_cpu_graph", context)
                  },
                  {
                      monitor_resources : "MONITORING/MEMORY",
                      labels : "Real MEM",
                      humanize_figures : true,
                      div_graph : $(".vm_memory_graph", context)
                  },
                  {
                      labels : "Network reception",
                      monitor_resources : "MONITORING/NETRX",
                      humanize_figures : true,
                      convert_from_bytes : true,
                      div_graph : $(".vm_net_rx_graph", context)
                  },
                  {
                      labels : "Network transmission",
                      monitor_resources : "MONITORING/NETTX",
                      humanize_figures : true,
                      convert_from_bytes : true,
                      div_graph : $(".vm_net_tx_graph", context)
                  },
                  {
                      labels : "Network reception speed",
                      monitor_resources : "MONITORING/NETRX",
                      humanize_figures : true,
                      convert_from_bytes : true,
                      y_sufix : "B/s",
                      derivative : true,
                      div_graph : $(".vm_net_rx_speed_graph", context)
                  },
                  {
                      labels : "Network transmission speed",
                      monitor_resources : "MONITORING/NETTX",
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
            Notifier.notifyMessage(Locale.tr("VM Template") + ' ' + request.request.data[0][1].name + ' ' + Locale.tr("saved successfully"))
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

      OpenNebula.VM.shutdown_hard({
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


  // @params
  //    data: and VM object
  //      Example: data.ID
  // @returns and object containing the following properties
  //    color: css class for this state.
  //      color + '-color' font color class
  //      color + '-bg' background class
  //    str: user friendly state string
  function get_provision_vm_state(data) {
    var state = parseInt(data.STATE);
    var state_color;
    var state_str;

    switch (state) {
      case OpenNebulaVM.STATES.INIT:
      case OpenNebulaVM.STATES.PENDING:
      case OpenNebulaVM.STATES.HOLD:
        state_color = 'deploying';
        state_str = Locale.tr("DEPLOYING") + " (1/3)";
        break;
      case OpenNebulaVM.STATES.ACTIVE:
        var lcm_state = parseInt(data.LCM_STATE);

        switch (lcm_state) {
          case OpenNebulaVM.LCM_STATES.LCM_INIT:
            state_color = 'deploying';
            state_str = Locale.tr("DEPLOYING") + " (1/3)";
            break;
          case OpenNebulaVM.LCM_STATES.PROLOG:
          case OpenNebulaVM.LCM_STATES.PROLOG_RESUME:
          case OpenNebulaVM.LCM_STATES.PROLOG_UNDEPLOY:
            state_color = 'deploying';
            state_str = Locale.tr("DEPLOYING") + " (2/3)";
            break;
          case OpenNebulaVM.LCM_STATES.BOOT:
          case OpenNebulaVM.LCM_STATES.BOOT_UNKNOWN:
          case OpenNebulaVM.LCM_STATES.BOOT_POWEROFF:
          case OpenNebulaVM.LCM_STATES.BOOT_SUSPENDED:
          case OpenNebulaVM.LCM_STATES.BOOT_STOPPED:
          case OpenNebulaVM.LCM_STATES.BOOT_UNDEPLOY:
            state_color = 'deploying';
            state_str = Locale.tr("DEPLOYING") + " (3/3)";
            break;
          case OpenNebulaVM.LCM_STATES.RUNNING:
          case OpenNebulaVM.LCM_STATES.HOTPLUG_SNAPSHOT:
          case OpenNebulaVM.LCM_STATES.DISK_SNAPSHOT_POWEROFF:
          case OpenNebulaVM.LCM_STATES.DISK_SNAPSHOT_REVERT_POWEROFF:
          case OpenNebulaVM.LCM_STATES.DISK_SNAPSHOT_DELETE_POWEROFF:
          case OpenNebulaVM.LCM_STATES.DISK_SNAPSHOT_SUSPENDED:
          case OpenNebulaVM.LCM_STATES.DISK_SNAPSHOT_REVERT_SUSPENDED:
          case OpenNebulaVM.LCM_STATES.DISK_SNAPSHOT_DELETE_SUSPENDED:
          case OpenNebulaVM.LCM_STATES.DISK_SNAPSHOT:
          case OpenNebulaVM.LCM_STATES.DISK_SNAPSHOT_REVERT:
          case OpenNebulaVM.LCM_STATES.DISK_SNAPSHOT_DELETE:
          case OpenNebulaVM.LCM_STATES.MIGRATE:
          case OpenNebulaVM.LCM_STATES.PROLOG_MIGRATE:
          case OpenNebulaVM.LCM_STATES.PROLOG_MIGRATE_POWEROFF:
          case OpenNebulaVM.LCM_STATES.PROLOG_MIGRATE_SUSPEND:
            state_color = 'running';
            state_str = Locale.tr("RUNNING");
            break;
          case OpenNebulaVM.LCM_STATES.HOTPLUG:
          case OpenNebulaVM.LCM_STATES.HOTPLUG_NIC:
          case OpenNebulaVM.LCM_STATES.HOTPLUG_SAVEAS:
          case OpenNebulaVM.LCM_STATES.HOTPLUG_SAVEAS_POWEROFF:
          case OpenNebulaVM.LCM_STATES.HOTPLUG_SAVEAS_SUSPENDED:
          case OpenNebulaVM.LCM_STATES.HOTPLUG_PROLOG_POWEROFF:
          case OpenNebulaVM.LCM_STATES.HOTPLUG_EPILOG_POWEROFF:
            state_color = 'deploying';
            state_str = Locale.tr("SAVING IMAGE");
            break;
          case OpenNebulaVM.LCM_STATES.FAILURE:
          case OpenNebulaVM.LCM_STATES.BOOT_FAILURE:
          case OpenNebulaVM.LCM_STATES.BOOT_MIGRATE_FAILURE:
          case OpenNebulaVM.LCM_STATES.PROLOG_MIGRATE_FAILURE:
          case OpenNebulaVM.LCM_STATES.PROLOG_FAILURE:
          case OpenNebulaVM.LCM_STATES.EPILOG_FAILURE:
          case OpenNebulaVM.LCM_STATES.EPILOG_STOP_FAILURE:
          case OpenNebulaVM.LCM_STATES.EPILOG_UNDEPLOY_FAILURE:
          case OpenNebulaVM.LCM_STATES.PROLOG_MIGRATE_POWEROFF_FAILURE:
          case OpenNebulaVM.LCM_STATES.PROLOG_MIGRATE_SUSPEND_FAILURE:
          case OpenNebulaVM.LCM_STATES.BOOT_UNDEPLOY_FAILURE:
          case OpenNebulaVM.LCM_STATES.BOOT_STOPPED_FAILURE:
          case OpenNebulaVM.LCM_STATES.PROLOG_RESUME_FAILURE:
          case OpenNebulaVM.LCM_STATES.PROLOG_UNDEPLOY_FAILURE:
            state_color = 'error';
            state_str = Locale.tr("ERROR");
            break;
          case OpenNebulaVM.LCM_STATES.SAVE_STOP:
          case OpenNebulaVM.LCM_STATES.SAVE_SUSPEND:
          case OpenNebulaVM.LCM_STATES.SAVE_MIGRATE:
          case OpenNebulaVM.LCM_STATES.EPILOG_STOP:
          case OpenNebulaVM.LCM_STATES.EPILOG:
          case OpenNebulaVM.LCM_STATES.EPILOG_UNDEPLOY:
          case OpenNebulaVM.LCM_STATES.SHUTDOWN:
          case OpenNebulaVM.LCM_STATES.CANCEL:
          case OpenNebulaVM.LCM_STATES.SHUTDOWN_POWEROFF:
          case OpenNebulaVM.LCM_STATES.SHUTDOWN_UNDEPLOY:
          case OpenNebulaVM.LCM_STATES.CLEANUP_RESUBMIT:
          case OpenNebulaVM.LCM_STATES.CLEANUP_DELETE:
            state_color = 'powering_off';
            state_str = Locale.tr("POWERING OFF");
            break;
          case OpenNebulaVM.LCM_STATES.UNKNOWN:
            state_color = 'powering_off';
            state_str = Locale.tr("UNKNOWN");
            break;
          default:
            state_color = 'powering_off';
            state_str = Locale.tr("UNKNOWN");
            break;
        }

        break;
      case OpenNebulaVM.STATES.STOPPED:
      case OpenNebulaVM.STATES.SUSPENDED:
      case OpenNebulaVM.STATES.POWEROFF:
      case OpenNebulaVM.STATES.UNDEPLOYED:
      case OpenNebulaVM.STATES.DONE:
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
      return disks[0].IMAGE;
    } else {
      return '';
    }
  }

  function get_provision_ips(data) {
    return '<i class="fa fa-fw fa-lg fa-globe"></i> ' + OpenNebula.VM.ipsStr(data, ', ');
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
});
