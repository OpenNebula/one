/* -------------------------------------------------------------------------- */
/* Copyright 2002-2016, OpenNebula Project, OpenNebula Systems                */
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
//  require('foundation.alert');
  var Sunstone = require('sunstone');
  var OpenNebula = require('opennebula');
  var OpenNebulaVM = require('opennebula/vm');
  var Locale = require('utils/locale');
  var Config = require('sunstone-config');
  var Notifier = require('utils/notifier');
  var Humanize = require('utils/humanize');
  var ResourceSelect = require('utils/resource-select');
  var Graphs = require('utils/graphs');
  var TemplateUtils = require('utils/template-utils');
  var StateActions = require('tabs/vms-tab/utils/state-actions');
  var Vnc = require('utils/vnc');
  var Spice = require('utils/spice');

  var TemplateVmsList = require('hbs!./list');
  var TemplateConfirmSaveAsTemplate = require('hbs!./confirm_save_as_template');
  var TemplateConfirmTerminate = require('hbs!./confirm_terminate');
  var TemplateConfirmPoweroff = require('hbs!./confirm_poweroff');
  var TemplateConfirmUndeploy = require('hbs!./confirm_undeploy');
  var TemplateConfirmReboot = require('hbs!./confirm_reboot');

  var TAB_ID = require('../tabId');
  var _accordionId = 0;

  var VNC_DIALOG_ID   = require('tabs/vms-tab/dialogs/vnc/dialogId');
  var SPICE_DIALOG_ID = require('tabs/vms-tab/dialogs/spice/dialogId');

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

    Foundation.reflow(context, 'accordion');
    
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
        '<span class="fa-stack fa-5x">' +
          '<i class="fa fa-cloud fa-stack-2x"></i>' +
          '<i class="fa fa-info-circle fa-stack-1x fa-inverse"></i>' +
        '</span>' +
        '<br>' +
        '<br>' +
        '<span>' +
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
      '<span class="fa-stack fa-5x">' +
        '<i class="fa fa-cloud fa-stack-2x"></i>' +
        '<i class="fa  fa-spinner fa-spin fa-stack-1x fa-inverse"></i>' +
      '</span>' +
      '<br>' +
      '<br>' +
      '<span>' +
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
      "bAutoWidth": false,
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
            '<span class="fa-stack fa-5x">'+
              '<i class="fa fa-cloud fa-stack-2x"></i>'+
              '<i class="fa fa-info-circle fa-stack-1x fa-inverse"></i>'+
            '</span>'+
            '<br>'+
            '<br>'+
            '<span>'+
              Locale.tr("There are no Virtual Machines")+
            '</span>'+
            '</div>');
        } else {
          $(".provision_vms_table", context).html('<div class="provision_vms_ul large-up-3 medium-up-3 small-up-1"></div>');
        }

        return true;
      },
      "fnRowCallback": function( nRow, aData, iDisplayIndex, iDisplayIndexFull ) {
        var data = aData.VM;
        var state = get_provision_vm_state(data);

        $(".provision_vms_ul", context).append('<div class="column">'+
            '<ul class="provision-pricing-table menu vertical" opennebula_id="'+data.ID+'" datatable_index="'+iDisplayIndexFull+'">'+
              '<li class="provision-title">'+
                '<a class="provision_info_vm_button">'+
                '<span class="'+ state.color +'-color right" title="'+state.str+'">'+
                  '<i class="fa fa-square"/>'+
                '</span>'+
                data.NAME + '</a>'+
              '</li>'+
              '<li class="provision-bullet-item" >'+
                '<i class="fa fa-fw fa-lg fa-laptop"/> '+
                'x'+data.TEMPLATE.CPU+' - '+
                ((data.TEMPLATE.MEMORY > 1000) ?
                  (Math.floor(data.TEMPLATE.MEMORY/1024)+'GB') :
                  (TemplateUtils.htmlEncode(data.TEMPLATE.MEMORY)+'MB'))+
                ' - '+
                get_provision_disk_image(data) +
              '</li>'+
              '<li class="provision-bullet-item" >'+
                '<span class="">'+
                  get_provision_ips(data) +
                '</span>'+
              '</li>'+
              '<li class="provision-bullet-item-last" >'+
                '<span class="">'+
                  '<i class="fa fa-fw fa-lg fa-user"/> '+
                  data.UNAME+
                '</span>'+
                '<span class="right">'+
                  Humanize.prettyTimeAgo(data.STIME)+
                '</span>'+
              '</li>'+
            '</ul>'+
          '</div>');

        return nRow;
      }
    });

    $('.provision_list_vms_search', context).on('input',function(){
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

    ResourceSelect.insert({
        context: $('.provision_list_vms_filter', context),
        resourceName: 'User',
        initValue: (opts.filter_expression ? opts.filter_expression : "-2"),
        extraOptions: '<option value="-2">' + Locale.tr("ALL") + '</option>',
        triggerChange: true,
        onlyName: true
      });

    context.on("click", ".provision_vms_list_filter_button", function(){
      $(".provision_list_vms_filter", context).fadeIn();
      return false;
    });

    OpenNebula.Action.clear_cache("VM");
    update_provision_vms_datatable(provision_vms_datatable, 0);

    // $(document).foundation();
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
          Sunstone.insertPanels(TAB_ID, response, TAB_ID, $(".provision-sunstone-info", context));

          var data = response.VM
          var state = get_provision_vm_state(data);

          // helper, cleaner code
          function enabled(action){
            return Config.isTabActionEnabled("provision-tab", action) &&
                   StateActions.enabledStateAction(action, data.STATE, data.LCM_STATE);
          }

          if (enabled("VM.reboot") || enabled("VM.reboot_hard")){
            $(".provision_reboot_confirm_button", context).show();
          } else {
            $(".provision_reboot_confirm_button", context).hide();
          }

          if (enabled("VM.poweroff") || enabled("VM.poweroff_hard")){
            $(".provision_poweroff_confirm_button", context).show();
          } else {
            $(".provision_poweroff_confirm_button", context).hide();
          }

          if (enabled("VM.undeploy") || enabled("VM.undeploy_hard")){
            $(".provision_undeploy_confirm_button", context).show();
          } else {
            $(".provision_undeploy_confirm_button", context).hide();
          }

          if (enabled("VM.resume")){
            $(".provision_resume_button", context).show();
          } else {
            $(".provision_resume_button", context).hide();
          }

          if (enabled("VM.terminate") || enabled("VM.terminate_hard")){
            $(".provision_terminate_confirm_button", context).show();
          } else {
            $(".provision_terminate_confirm_button", context).hide();
          }

          if(Config.isTabActionEnabled("provision-tab", "VM.save_as_template")){
            if (enabled("VM.save_as_template")){
              $(".provision_save_as_template_confirm_button", context).show();
              $(".provision_save_as_template_confirm_button_disabled", context).hide();
            } else {
              $(".provision_save_as_template_confirm_button", context).hide();
              $(".provision_save_as_template_confirm_button_disabled", context).show();
            }
          }else{
            $(".provision_save_as_template_confirm_button", context).hide();
            $(".provision_save_as_template_confirm_button_disabled", context).hide();
          }

          if (OpenNebula.VM.isVNCSupported(data) ||
             OpenNebula.VM.isSPICESupported(data)) {

            $(".provision_vnc_button", context).show();
            $(".provision_vnc_button_disabled", context).hide();
          }else{
            $(".provision_vnc_button", context).hide();
            $(".provision_vnc_button_disabled", context).show();
          }

          $(".provision_info_vm", context).attr("vm_id", data.ID);
          $(".provision_info_vm", context).data("vm", data);

          $(".provision_info_vm_name", context).text(data.NAME);

          if (Config.isTabActionEnabled("provision-tab", 'VM.rename')) {
            context.off("click", ".provision_info_vm_rename a");
            context.on("click", ".provision_info_vm_rename a", function() {
              var valueStr = $(".provision_info_vm_name", context).text();
              $(".provision_info_vm_name", context).html('<input class="input_edit_value_rename" type="text" value="' + valueStr + '"/>');
            });

            context.off("change", ".input_edit_value_rename");
            context.on("change", ".input_edit_value_rename", function() {
              var valueStr = $(".input_edit_value_rename", context).val();
              if (valueStr != "") {
                OpenNebula.VM.rename({
                  data : {
                    id: vm_id,
                    extra_param: {
                      "name" : valueStr
                    }
                  },
                  success: function(request, response){
                    update_provision_vm_info(vm_id, context);
                  },
                  error: function(request, response){
                    Notifier.onError(request, response);
                  }
                });
              }
            });
          }

          $(".provision-pricing-table_vm_info", context).html(
              '<li class="provision-title">'+
                '<span class="without-link '+ state.color +'-color">'+
                  '<span class="'+ state.color +'-color right" title="'+state.str+'">'+
                    '<i class="fa fa-square"/>'+
                  '</span>'+
                  state.str+
                '</span>'+
              '</li>'+
              '<li class="provision-bullet-item" >'+
                '<span>'+
                  '<i class="fa fa-fw fa-lg fa-laptop"/> '+
                  'x'+TemplateUtils.htmlEncode(data.TEMPLATE.CPU)+' - '+
                  ((data.TEMPLATE.MEMORY > 1000) ?
                    (Math.floor(data.TEMPLATE.MEMORY/1024)+'GB') :
                    (TemplateUtils.htmlEncode(data.TEMPLATE.MEMORY)+'MB'))+
                '</span>'+
                ' - '+
                '<span>'+
                  get_provision_disk_image(data) +
                '</span>'+
              '</li>'+
              '<li class="provision-bullet-item" >'+
                '<span>'+
                  get_provision_ips(data) +
                '</span>'+
              '</li>'+
              '<li class="provision-bullet-item-last text-right">'+
                '<span class="left">'+
                  '<i class="fa fa-fw fa-lg fa-user"/> '+
                  data.UNAME+
                '</span>'+
                '<span>'+
                  '<i class="fa fa-fw fa-lg fa-clock-o"/> '+
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
                      div_graph : $(".vm_cpu_provision_graph", context)
                  },
                  {
                      monitor_resources : "MONITORING/MEMORY",
                      labels : "Real MEM",
                      humanize_figures : true,
                      div_graph : $(".vm_memory_provision_graph", context)
                  },
                  {
                      labels : "Network reception",
                      monitor_resources : "MONITORING/NETRX",
                      humanize_figures : true,
                      convert_from_bytes : true,
                      div_graph : $(".vm_net_rx_provision_graph", context)
                  },
                  {
                      labels : "Network transmission",
                      monitor_resources : "MONITORING/NETTX",
                      humanize_figures : true,
                      convert_from_bytes : true,
                      div_graph : $(".vm_net_tx_provision_graph", context)
                  },
                  {
                      labels : "Network reception speed",
                      monitor_resources : "MONITORING/NETRX",
                      humanize_figures : true,
                      convert_from_bytes : true,
                      y_sufix : "B/s",
                      derivative : true,
                      div_graph : $(".vm_net_rx_speed_provision_graph", context)
                  },
                  {
                      labels : "Network transmission speed",
                      monitor_resources : "MONITORING/NETTX",
                      humanize_figures : true,
                      convert_from_bytes : true,
                      y_sufix : "B/s",
                      derivative : true,
                      div_graph : $(".vm_net_tx_speed_provision_graph", context)
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

    if (Config.isTabActionEnabled("provision-tab", "VM.save_as_template")) {
      context.on("click", ".provision_save_as_template_confirm_button", function(){
        $(".provision_confirm_action:first", context).html(
          TemplateConfirmSaveAsTemplate());
      });

      context.on("click", ".provision_save_as_template_button", function(){
        var button = $(this);
        button.attr("disabled", "disabled");
        var context = $(".provision_info_vm[vm_id]");

        var vm_id = context.attr("vm_id");
        var template_name = $('.provision_snapshot_name', context).val();
        var persistent =
          ($('input[name=provision_snapshot_radio]:checked').val() == "persistent");

        OpenNebula.VM.save_as_template({
          data : {
            id: vm_id,
            extra_param: {
              name : template_name,
              persistent : persistent
            }
          },
          timeout: false,
          success: function(request, response){
            OpenNebula.Action.clear_cache("VMTEMPLATE");
            Notifier.notifyMessage(Locale.tr("VM Template") + ' ' + request.request.data[0][1].name + ' ' + Locale.tr("saved successfully"))
            update_provision_vm_info(vm_id, context);
            button.removeAttr("disabled");
          },
          error: function(request, response){
            if(response.error.http_status == 0){   // Failed due to cloning template taking too long
                OpenNebula.Action.clear_cache("VMTEMPLATE");
                update_provision_vm_info(vm_id, context);
                Notifier.notifyMessage(Locale.tr("VM cloning in the background. The Template will appear as soon as it is ready, and the VM unlocked."));
            } else {
                Notifier.onError(request, response);
            }
            button.removeAttr("disabled");
          }
        })

        return false;
      });
    }

    context.on("click", ".provision_terminate_confirm_button", function(){
      var data = $(".provision_info_vm", context).data("vm");

      var hard = Config.isTabActionEnabled("provision-tab", "VM.terminate_hard") &&
             StateActions.enabledStateAction("VM.terminate_hard", data.STATE, data.LCM_STATE);

      var soft = Config.isTabActionEnabled("provision-tab", "VM.terminate") &&
             StateActions.enabledStateAction("VM.terminate", data.STATE, data.LCM_STATE);

      var opts = {};

      if(hard && soft){
        opts.both = true;
      } else if(hard){
        opts.hard = true;
      }

      $(".provision_confirm_action:first", context).html(TemplateConfirmTerminate({opts: opts}));
    });

    context.on("click", ".provision_poweroff_confirm_button", function(){
      var data = $(".provision_info_vm", context).data("vm");

      var hard = Config.isTabActionEnabled("provision-tab", "VM.poweroff_hard") &&
             StateActions.enabledStateAction("VM.poweroff_hard", data.STATE, data.LCM_STATE);

      var soft = Config.isTabActionEnabled("provision-tab", "VM.poweroff") &&
             StateActions.enabledStateAction("VM.poweroff", data.STATE, data.LCM_STATE);

      var opts = {};

      if(hard && soft){
        opts.both = true;
      } else if(hard){
        opts.hard = true;
      }

      $(".provision_confirm_action:first", context).html(TemplateConfirmPoweroff({opts: opts}));
    });

    context.on("click", ".provision_undeploy_confirm_button", function(){
      var data = $(".provision_info_vm", context).data("vm");

      var hard = Config.isTabActionEnabled("provision-tab", "VM.undeploy_hard") &&
             StateActions.enabledStateAction("VM.undeploy_hard", data.STATE, data.LCM_STATE);

      var soft = Config.isTabActionEnabled("provision-tab", "VM.undeploy") &&
             StateActions.enabledStateAction("VM.undeploy", data.STATE, data.LCM_STATE);

      var opts = {};

      if(hard && soft){
        opts.both = true;
      } else if(hard){
        opts.hard = true;
      }

      $(".provision_confirm_action:first", context).html(TemplateConfirmUndeploy({opts: opts}));
    });

    context.on("click", ".provision_reboot_confirm_button", function(){
      var data = $(".provision_info_vm", context).data("vm");

      var hard = Config.isTabActionEnabled("provision-tab", "VM.reboot_hard") &&
             StateActions.enabledStateAction("VM.reboot_hard", data.STATE, data.LCM_STATE);

      var soft = Config.isTabActionEnabled("provision-tab", "VM.reboot") &&
             StateActions.enabledStateAction("VM.reboot", data.STATE, data.LCM_STATE);

      var opts = {};

      if(hard && soft){
        opts.both = true;
      } else if(hard){
        opts.hard = true;
      }

      $(".provision_confirm_action:first", context).html(TemplateConfirmReboot({opts: opts}));
    });

    context.on("click", ".provision_terminate_button", function(){
      var button = $(this);
      button.attr("disabled", "disabled");
      var vm_id = $(".provision_info_vm", context).attr("vm_id");
      var terminate_action = $('input[name=provision_terminate_radio]:checked').val()

      OpenNebula.VM[terminate_action]({
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

    context.on("click", ".provision_undeploy_button", function(){
      var button = $(this);
      button.attr("disabled", "disabled");
      var vm_id = $(".provision_info_vm", context).attr("vm_id");
      var undeploy_action = $('input[name=provision_undeploy_radio]:checked').val()

      OpenNebula.VM[undeploy_action]({
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

    context.on("click", ".provision_resume_button", function(){
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

            var dialog = Sunstone.getDialog(VNC_DIALOG_ID);
            dialog.setElement(response);
            dialog.show();

            button.removeAttr("disabled");
          } else if (OpenNebula.VM.isSPICESupported(vm_data)) {
            var dialog = Sunstone.getDialog(SPICE_DIALOG_ID);
            dialog.setElement(response);
            dialog.show();

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
        state_str = Locale.tr("DEPLOYING") + " (2/4)";
        break;
      case OpenNebulaVM.STATES.ACTIVE:
        var lcm_state = parseInt(data.LCM_STATE);

        switch (lcm_state) {
          case OpenNebulaVM.LCM_STATES.LCM_INIT:
            state_color = 'deploying';
            state_str = Locale.tr("DEPLOYING") + " (2/4)";
            break;
          case OpenNebulaVM.LCM_STATES.PROLOG:
          case OpenNebulaVM.LCM_STATES.PROLOG_RESUME:
          case OpenNebulaVM.LCM_STATES.PROLOG_UNDEPLOY:
            state_color = 'deploying';
            state_str = Locale.tr("DEPLOYING") + " (3/4)";
            break;
          case OpenNebulaVM.LCM_STATES.BOOT:
          case OpenNebulaVM.LCM_STATES.BOOT_UNKNOWN:
          case OpenNebulaVM.LCM_STATES.BOOT_POWEROFF:
          case OpenNebulaVM.LCM_STATES.BOOT_SUSPENDED:
          case OpenNebulaVM.LCM_STATES.BOOT_STOPPED:
          case OpenNebulaVM.LCM_STATES.BOOT_UNDEPLOY:
            state_color = 'deploying';
            state_str = Locale.tr("DEPLOYING") + " (4/4)";
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
          case OpenNebulaVM.LCM_STATES.PROLOG_MIGRATE_UNKNOWN:
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
          case OpenNebulaVM.LCM_STATES.PROLOG_MIGRATE_UNKNOWN_FAILURE:
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
      case OpenNebulaVM.STATES.DONE:
        state_color = 'off';
        state_str = Locale.tr("OFF");

        break;
      case OpenNebulaVM.STATES.UNDEPLOYED:
        state_color = 'undeployed';
        state_str = Locale.tr("UNDEPLOYED");

        break;

      case OpenNebulaVM.STATES.CLONING:
        state_color = 'deploying';
        state_str = Locale.tr("DEPLOYING") + " (1/4)";
        break;

      case OpenNebulaVM.STATES.CLONING_FAILURE:
        state_color = 'error';
        state_str = Locale.tr("ERROR");
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
      return disks[0].IMAGE != undefined ? disks[0].IMAGE : '';
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
