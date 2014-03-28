/* -------------------------------------------------------------------------- */
/* Copyright 2002-2014, OpenNebula Project (OpenNebula.org), C12G Labs        */
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

var provision_create_vm = '<form id="provision_create_vm" class="hidden section_content">'+
  '<div class="row">'+
    '<div class="large-11 large-centered columns">'+
      '<h2 class="subheader">'+tr("Create Virtual Machine")+'</h2>'+
      '<br>'+
    '</div>'+
  '</div>'+
  '<div class="row">'+
    '<div class="large-9 large-centered columns">'+
      '<input type="text" id="vm_name" placeholder="'+tr("Virtual Machine Name")+'" style="height: 40px !important; font-size: 16px; padding: 0.5rem  !important;"/>'+
      '<br>'+
    '</div>'+
  '</div>'+
  '<div class="row">'+
    '<div class="large-10 large-centered columns">'+
      '<h3 class="subheader">'+tr("Select Capacity")+'</h3>'+
      '<br>'+
    '</div>'+
  '</div>'+
  '<div class="row">'+
    '<div class="large-9 large-centered columns">'+
      '<table id="provision_templates_table">'+
        '<thead class="hidden">'+
          '<tr>'+
            '<th>'+tr("ID")+'</th>'+
            '<th>'+tr("Name")+'</th>'+
          '</tr>'+
        '</thead>'+
        '<tbody class="hidden">'+
        '</tbody>'+
      '</table>'+
      '<br>'+
    '</div>'+
  '</div>'+
  '<div class="row">'+
    '<div class="large-10 large-centered columns">'+
      '<h3 class="subheader">'+tr("Select Image")+'</h3>'+
      '<br>'+
    '</div>'+
  '</div>'+
  '<div class="row">'+
    '<div class="large-9 large-centered columns">'+
      '<table id="provision_images_table">'+
        '<thead class="hidden">'+
          '<tr>'+
            '<th>'+tr("ID")+'</th>'+
            '<th>'+tr("Name")+'</th>'+
          '</tr>'+
        '</thead>'+
        '<tbody class="hidden">'+
        '</tbody>'+
      '</table>'+
      '<br>'+
    '</div>'+
  '</div>'+
  '<br>'+
  '<br>'+
  '<div class="row">'+
    '<div class="large-9 columns large-centered">'+
      '<div data-alert class="alert-box alert-box-error radius text-center hidden">'+
      '</div>'+
      '<button href="#" class="button large large-12 radius  right" type="submit">'+tr("Create")+'</button>'+
    '</div>'+
  '</div>'+
  '<br>'+
  '<br>'+
'</form>';

var provision_list_vms = '<div id="provision_list_vms" class="section_content">'+
  '<div class="row">'+
    '<div class="large-11 large-centered columns">'+
      '<h2 class="subheader">'+
        tr("Virtual Machines")+
        '<a href"#" id="provision_vms_list_refresh_button" data-tooltip title="'+ tr("Refresh the list of Virtual Machines")+'" class="has-tip tip-top" style="font-size:80%">'+
          '<i class="fa fa-fw fa-refresh"/>'+
        '</a>'+
        '<a href"#" id="provision_create_vm_button" class="button medium radius right"><i class="fa fa-fw fa-plus"/>'+tr("Create")+'</a>'+
      '</h2>'+
    '</div>'+
  '</div>'+
  '<br>'+
  '<div class="row">'+
    '<div class="large-10 large-centered columns">'+
      '<table id="provision_vms_table">'+
        '<thead class="hidden">'+
          '<tr>'+
            '<th>'+tr("ID")+'</th>'+
            '<th>'+tr("Name")+'</th>'+
          '</tr>'+
        '</thead>'+
        '<tbody class="hidden">'+
        '</tbody>'+
      '</table>'+
      '<br>'+
    '</div>'+
  '</div>'+
'</div>';

var provision_info_vm =  '<div id="provision_info_vm" class="section_content hidden">'+
  '<div class="row">'+
    '<div class="large-11 large-centered columns">'+
      '<h2 class="subheader">'+
        '<span id="provision_info_vm_name" class="left">'+
        '</span>'+
        '<a href"#" id="provision_refresh_info" data-tooltip title="'+ tr("Refresh the Virtual Machine information")+'" class="has-tip tip-top" style="font-size:80%">'+
          '<i class="fa fa-fw fa-refresh"/>'+
        '</a>'+
      '</h2>'+
    '</div>'+
  '</div>'+
  '<br>'+
  '<div class="row">'+
    '<div  id="provision_info_vm_state" class="large-10 large-centered columns">'+
    '</div>'+
  '</div>'+
  '<div class="row">'+
    '<div  id="provision_info_vm_state_hr" class="large-10 large-centered columns">'+
    '</div>'+
  '</div>'+
  '<div class="row">'+
    '<div id="provision_info_vm_resume" class="large-10 large-centered columns">'+
    '</div>'+
  '</div>'+
  '<div class="row">'+
    '<div class="large-10 large-centered columns">'+
  '<div class="row">'+
      '<div class="large-6 medium-6  columns">'+
        '<div class="row text-center">'+
          '<div class="large-12 columns">'+
            '<h3 class="subheader"><small>'+tr("CPU")+'</small></h3>'+
          '</div>'+
        '</div>'+
        '<div class="row">'+
          '<div class="large-12 columns">'+
            '<div class="large-10 columns centered graph vm_cpu_graph" style="height: 100px;">'+
            '</div>'+
          '</div>'+
        '</div>'+
        '<div class="row graph_legend">'+
          '<div class="large-10 columns centered" id="vm_cpu_legend">'+
          '</div>'+
        '</div>'+
      '</div>'+
      '<div class="large-6 medium-6 columns">'+
        '<div class="row text-center">'+
          '<div class="large-12 columns">'+
            '<h3 class="subheader"><small>'+tr("MEMORY")+'</small></h3>'+
          '</div>'+
        '</div>'+
        '<div class="row">'+
          '<div class="large-12 columns">'+
            '<div class="large-10 columns centered graph vm_memory_graph" style="height: 100px;">'+
            '</div>'+
          '</div>'+
        '</div>'+
        '<div class="row graph_legend">'+
          '<div class="large-10 columns centered" id="vm_memory_legend">'+
          '</div>'+
        '</div>'+
      '</div>'+
  '</div>'+
      '</div>'+
  '</div>'+
  '<br>'+
  '<br>'+
  '<br>'+
  '<div class="row">'+
    '<div class="large-10 large-centered columns">'+
      '<h2 class="subheader">'+
        '<span class="right" style="padding: 5px;border: 1px solid #dfdfdf; background: #f7f7f7; border-radius: 5px; color:#777 !important; width: 100%; font-size: 90%">'+
          '<a href"#" id="provision_delete_confirm_button" data-tooltip title="Delete" class="has-tip tip-top right" style="margin-left:15px; margin-right:15px">'+
            '<i class="fa fa-fw fa-trash-o"/><span style="font-size: 12px; vertical-align: middle">'+tr("Delete")+'</span>'+
          '</a>'+
          '<a href"#" id="provision_shutdownhard_confirm_button" data-tooltip title="Delete" class="has-tip tip-top right" style="margin-left:15px; margin-right:15px">'+
            '<i class="fa fa-fw fa-trash-o"/><span style="font-size: 12px; vertical-align: middle">'+tr("Delete")+'</span>'+
          '</a>'+
          '<a href"#" id="provision_poweroff_confirm_button" data-tooltip title="Power off" class="has-tip tip-top right" style="margin-left:15px; margin-right:15px">'+
            '<i class="fa fa-fw fa-power-off"/><span style="font-size: 12px; vertical-align: middle">'+tr("Power off")+'</span>'+
          '</a>'+
          '<a href"#" id="provision_poweron_button" data-tooltip title="Power on" class="has-tip tip-top right" style="margin-left:15px; margin-right:15px">'+
            '<i class="fa fa-fw fa-play"/><span style="font-size: 12px; vertical-align: middle">'+tr("Power on")+'</span>'+
          '</a>'+
          '<a href"#" id="provision_reboot_confirm_button" data-tooltip title="Reboot" class="has-tip tip-top right" style="margin-left:10px; margin-right:15px">'+
            '<i class="fa fa-fw fa-repeat"/><span style="font-size: 12px; vertical-align: middle">'+tr("Reboot")+'</span>'+
          '</a>'+
          '<a href"#" id="provision_vnc_button" data-tooltip title="Open a VNC console in a new window" class="has-tip tip-top" style="margin-left:15px; margin-right:25px">'+
            '<i class="fa fa-fw fa-desktop"/><span style="font-size: 12px; vertical-align: middle">'+tr("VNC")+'</span>'+
          '</a>'+
          '<span id="provision_vnc_button_disabled" data-tooltip title="You have to boot the Virtual Machine first" class="has-tip tip-top" style="margin-left:15px; margin-right:25px; color: #999">'+
            '<i class="fa fa-fw fa-desktop"/><span style="font-size: 12px; vertical-align: middle">'+tr("VNC")+'</span>'+
          '</span>'+
          '<a href"#" id="provision_snapshot_button" data-tooltip title="The main disk of the Virtual Machine will be saved in a new Image" class="has-tip tip-top" style="margin-left:15px; margin-right:15px">'+
            '<i class="fa fa-fw fa-camera-retro"/><span style="font-size: 12px; vertical-align: middle">'+tr("Snapshot")+'</span>'+
          '</a>'+
          '<span id="provision_snapshot_button_disabled" data-tooltip title="You have to power-off the virtual machine first" class="has-tip tip-top" style="margin-left:15px; margin-right:15px; color: #999">'+
            '<i class="fa fa-fw fa-camera-retro"/><span style="font-size: 12px; vertical-align: middle">'+tr("Snapshot")+'</span>'+
          '</span>'+
        '</span>'+
      '</h2>'+
    '</div>'+
  '</div>'+
  '<br>'+
  '<br>'+
  '<div class="row">'+
    '<div class="large-10 large-centered columns" id="provision_confirm_action">'+
    '</div>'+
  '</div>'+
'</div>';


var provision_content = provision_create_vm +
  provision_info_vm +
  provision_list_vms ;

var provision_tab = {
  title: '<img src="images/one_small_logo.png" style="height:40px">',
  list_header: '<img src="images/one_small_logo.png" style="height:40px">'+
    '<span class="right" style="font-size: 60%; color: #999">'+
      '<a href"#" class="medium" id="provision_vms_list_button" style="color: #555; margin-left: 10px;margin-right: 10px;">'+tr("Virtual Machines")+'</a>&emsp;|&emsp;'+
      '<a href"#" class="medium" style="color: #555; margin-left: 10px;margin-right: 10px;">'+tr("Images")+'</a>&emsp;|&emsp;'+
      '<a href"#" class="medium" style="color: #555; margin-left: 10px;margin-right: 10px;"><i class="fa fa-fw fa-user" style="color: #777"/>'+tr("oneadmin")+'</a>&emsp;|&emsp;'+
      '<a href"#" class="medium" style="color: #555; margin-left: 10px;margin-right: 10px;"><i class="fa fa-fw fa-sign-out" style="color: #777"/></a>'+
    '</span>'+
    '<br>',
  content: provision_content
};

var povision_actions = {
  "Provision.show" : {
    type: "single",
    call: OpenNebula.VM.show,
    callback: function(request, response){
        update_provision_vm_info(response.VM);
    },
    error: onError
  },
  "Provision.instantiate" : {
    type: "single",
    call: OpenNebula.Template.instantiate,
    callback: function(){
      show_provision_vm_list();
      $("#vm_name", $("#provision_create_vm")).val('');
      $(".provision-pricing-table", $("#provision_create_vm")).removeClass("selected");
      $(".alert-box-error", context).hide();
    },
    error: onError
  },
  "Provision.saveas" : {
    type: "single",
    call: OpenNebula.VM.saveas,
    callback: function(request, response){
      $("#provision_confirm_action").html(
        '<div data-alert class="alert-box secondary radius" style="background: #fff">'+
          '<div class="row">'+
          '<div class="large-11 columns">'+
            '<span style="font-size: 14px; line-height: 20px">'+
              'A new snapshot has been included in your list of images:'+
              '<br>'+
              equest.request.data[0][1].image_name +
              '<br>'+
              '<br>'+
              'This image can be used in a new virtual machine'+
            '</span>'+
          '</div>'+
          '</div>'+
          '<a href="#" class="close" style="top: 20px">&times;</a>'+
        '</div>');
    },
    error: onError
  },
  "Provision.poweroff" : {
      type: "single",
      call: OpenNebula.VM.poweroff,
      callback: provision_show_vm_callback,
      error: onError
  },

  "Provision.poweroff_hard" : {
      type: "single",
      call: OpenNebula.VM.poweroff_hard,
      callback: provision_show_vm_callback,
      error: onError
  },
  "Provision.resume" : {
      type: "single",
      call: OpenNebula.VM.resume,
      callback: provision_show_vm_callback,
      error: onError
  },

  "Provision.shutdown_hard" : {
      type: "single",
      call: OpenNebula.VM.cancel,
      callback: show_provision_vm_list,
      error: onError
  },

  "Provision.delete" : {
      type: "single",
      call: OpenNebula.VM.del,
      callback: show_provision_vm_list,
      error: onError
  },
  "Provision.monitor" : {
    type: "monitor",
    call : OpenNebula.VM.monitor,
    callback: function(req,response) {
      var vm_graphs = [
          {
              monitor_resources : "CPU",
              labels : "Real CPU",
              humanize_figures : false,
              div_graph : $(".vm_cpu_graph")
          },
          {
              monitor_resources : "MEMORY",
              labels : "Real MEM",
              humanize_figures : true,
              div_graph : $(".vm_memory_graph")
          },
          { labels : "Network reception",
            monitor_resources : "NET_RX",
            humanize_figures : true,
            convert_from_bytes : true,
            div_graph : $("#vm_net_rx_graph")
          },
          { labels : "Network transmission",
            monitor_resources : "NET_TX",
            humanize_figures : true,
            convert_from_bytes : true,
            div_graph : $("#vm_net_tx_graph")
          },
          { labels : "Network reception speed",
            monitor_resources : "NET_RX",
            humanize_figures : true,
            convert_from_bytes : true,
            y_sufix : "B/s",
            derivative : true,
            div_graph : $("#vm_net_rx_speed_graph")
          },
          { labels : "Network transmission speed",
            monitor_resources : "NET_TX",
            humanize_figures : true,
            convert_from_bytes : true,
            y_sufix : "B/s",
            derivative : true,
            div_graph : $("#vm_net_tx_speed_graph")
          }
      ];

      // The network speed graphs require the derivative of the data,
      // and this process is done in place. They must be the last
      // graphs to be processed

      for(var i=0; i<vm_graphs.length; i++) {
          plot_graph(
              response,
              vm_graphs[i]
          );
      }
    },
    error: vmMonitorError
  },
  "Provision.reboot" : {
      type: "single",
      call: OpenNebula.VM.reboot,
      callback: provision_show_vm_callback,
      error: onError
  },
  "Provision.reboot_hard" : {
      type: "single",
      call: OpenNebula.VM.reset,
      callback: provision_show_vm_callback,
      error: onError
  },
  "Provision.startvnc" : {
      type: "single",
      call: OpenNebula.VM.startvnc,
      callback: function(request, response) {
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

        window.open(url, '_blank');
      },
      error: onError
  }

}

Sunstone.addMainTab('provision-tab',provision_tab);
Sunstone.addActions(povision_actions);

function show_provision_vm_list() {
  update_provision_vms_datatable(provision_vms_datatable);

  $(".section_content").hide();
  $("#provision_list_vms").fadeIn();
}

function update_provision_images_datatable(datatable) {
  OpenNebula.Image.list({
    timeout: true,
    success: function (request, item_list){
      datatable.fnClearTable(false);
      datatable.fnAddData(item_list);
    }
  });
}

function update_provision_templates_datatable(datatable) {
  OpenNebula.Template.list({
    timeout: true,
    success: function (request, item_list){
      datatable.fnClearTable(false);
      datatable.fnAddData(item_list);
    }
  });
}

function update_provision_vms_datatable(datatable) {
  OpenNebula.VM.list({
    timeout: true,
    success: function (request, item_list){
      datatable.fnClearTable(false);
      datatable.fnAddData(item_list);
    }
  });
}

function get_provision_vm_state(data) {
  var state = OpenNebula.Helper.resource_state("vm",data.STATE);
  var state_color;
  var state_str;

  switch (state) {
    case tr("INIT"):
    case tr("PENDING"):
    case tr("HOLD"):
      state_color = 'deploying';
      state_str = tr("DEPLOYING") + " (1/3)";
      break;
    case tr("FAILED"):
      state_color = 'error';
      state_str = tr("ERROR");
      break;
    case tr("ACTIVE"):
      var lcm_state = OpenNebula.Helper.resource_state("vm_lcm",data.LCM_STATE);

      switch (lcm_state) {
        case tr("LCM_INIT"):
          state_color = 'deploying';
          state_str = tr("DEPLOYING") + " (1/3)";
          break;
        case tr("PROLOG"):
          state_color = 'deploying';
          state_str = tr("DEPLOYING") + " (2/3)";
          break;
        case tr("BOOT"):
          state_color = 'deploying';
          state_str = tr("DEPLOYING") + " (3/3)";
          break;
        case tr("RUNNING"):
        case tr("HOTPLUG"):
        case tr("SNAPSHOT"):
        case tr("MIGRATE"):
          state_color = 'running';
          state_str = tr("RUNNING");
          break;
        case tr("FAILURE"):
          state_color = 'error';
          state_str = tr("ERROR");
          break;
        case tr("SAVE"):
        case tr("EPILOG"):
        case tr("SHUTDOWN"):
        case tr("CLEANUP"):
          state_color = 'powering_off';
          state_str = tr("POWERING OFF");
          break;
        case tr("UNKNOWN"):
          state_color = 'powering_off';
          state_str = tr("UNKNOWN");
          break;
        default:
          state_color = 'powering_off';
          state_str = tr("UNKNOWN");
          break;
      }

      break;
    case tr("STOPPED"):
    case tr("SUSPENDED"):
    case tr("POWEROFF"):
      state_color = 'off';
      state_str = tr("OFF");

      break;
    default:
      state_color = 'powering_off';
      state_str = tr("UNKNOWN");
      break;
  }

  return {
    color: state_color,
    str: state_str
  }
}

function update_provision_vm_info(data) {
  var state = get_provision_vm_state(data);

  switch (state.color) {
    case "deploying":
      $("#provision_reboot_confirm_button").hide();
      $("#provision_poweroff_confirm_button").hide();
      $("#provision_poweron_button").hide();
      $("#provision_delete_confirm_button").show();
      $("#provision_shutdownhard_confirm_button").hide();
      $("#provision_snapshot_button").hide();
      $("#provision_vnc_button").hide();
      $("#provision_snapshot_button_disabled").hide();
      $("#provision_vnc_button_disabled").hide();
      break;
    case "running":
      $("#provision_reboot_confirm_button").show();
      $("#provision_poweroff_confirm_button").show();
      $("#provision_poweron_button").hide();
      $("#provision_delete_confirm_button").hide();
      $("#provision_shutdownhard_confirm_button").show();
      $("#provision_snapshot_button").hide();
      $("#provision_vnc_button").show();
      $("#provision_snapshot_button_disabled").show();
      $("#provision_vnc_button_disabled").hide();
      break;
    case "off":
      $("#provision_reboot_confirm_button").hide();
      $("#provision_poweroff_confirm_button").hide();
      $("#provision_poweron_button").show();
      $("#provision_delete_confirm_button").show();
      $("#provision_shutdownhard_confirm_button").hide();
      $("#provision_snapshot_button").show();
      $("#provision_vnc_button").hide();
      $("#provision_snapshot_button_disabled").hide();
      $("#provision_vnc_button_disabled").show();
      break;
    case "powering_off":
    case "error":
      $("#provision_reboot_confirm_button").hide();
      $("#provision_poweroff_confirm_button").hide();
      $("#provision_poweron_button").hide();
      $("#provision_delete_confirm_button").show();
      $("#provision_shutdownhard_confirm_button").hide();
      $("#provision_snapshot_button").hide();
      $("#provision_vnc_button").hide();
      $("#provision_snapshot_button_disabled").hide();
      $("#provision_vnc_button_disabled").hide();
      break;
    default:
      color = 'secondary';
      $("#provision_reboot_confirm_button").hide();
      $("#provision_poweroff_confirm_button").hide();
      $("#provision_poweron_button").hide();
      $("#provision_delete_confirm_button").show();
      $("#provision_shutdownhard_confirm_button").hide();
      $("#provision_snapshot_button").hide();
      $("#provision_vnc_button").hide();
      $("#provision_snapshot_button_disabled").hide();
      $("#provision_vnc_button_disabled").hide();
      break;
  }

  var context = $("#provision_info_vm");
  $("#provision_info_vm").attr("vm_id", data.ID);
  $("#provision_info_vm_name", context).text(data.NAME);

  $("#provision_info_vm_resume").html('<ul class="inline-list" style="color: #555; font-size: 14px;">'+
      '<li>'+
        '<span>'+
          '<i class="fa fa-fw fa-laptop"/>&emsp;'+
          'x'+data.TEMPLATE.CPU+' - '+
          ((data.TEMPLATE.MEMORY > 1000) ?
            (Math.floor(data.TEMPLATE.MEMORY/1024)+'GB') :
            (data.TEMPLATE.MEMORY+'MB'))+
        '</span>'+
      '</li>'+
      '<li>'+
        '<span>'+
          '<i class="fa fa-fw fa-download"></i>'+
          'Ubuntu 12.04'+
        '</span>'+
      '</li>'+
      '<li>'+
        '<span>'+
          '<i class="fa fa-fw fa-globe"/>'+
          '192.168.1.1'+
        '</span>'+
      '</li>'+
      '<li class="right">'+
      '</li>'+
    '</ul>');

  $("#provision_info_vm_state").html('<span class="'+ state.color +'-color">'+
      state.str+
    '</span>'+
    '<span style="color: #999; font-size:14px" class="right" >'+
      '<i class="fa fa-fw fa-clock-o"/>'+
      _format_date(data.STIME)+
    '</span>');
  $("#provision_info_vm_state_hr").html('<div style="height:1px; margin-top:5px; margin-bottom: 5px;" class="'+state.color+'-bg"></div>');

  $("#provision_confirm_action").html("");

  Sunstone.runAction("VM.monitor",data.ID, { monitor_resources : "CPU,MEMORY"});
}

function provision_show_vm_callback(request, response) {
    Sunstone.runAction("Provision.show",request.request.data[0]);
}

$(document).ready(function(){
  var tab_name = 'provision-tab';
  var tab = $("#"+tab_name);

  if (Config.isTabEnabled(tab_name)) {
    $(".left-content").remove();
    $(".right-content").addClass("large-centered small-12");

    $(".user-zone-info").remove();

    showTab('provision-tab');


    //
    // Create VM
    //

    var provision_templates_datatable = $('#provision_templates_table').dataTable({
      "iDisplayLength": 6,
      "sDom" : '<"H">t<"F"p>',
      "aoColumnDefs": [
          { "bVisible": false, "aTargets": ["all"]}
      ],
      "aoColumns": [
          { "mDataProp": "VMTEMPLATE.ID" },
          { "mDataProp": "VMTEMPLATE.NAME" }
      ],
      "fnPreDrawCallback": function (oSettings) {
        // create a thumbs container if it doesn't exist. put it in the dataTables_scrollbody div
        $("#provision_templates_table").html('<ul id="provision_templates_ul" class="large-block-grid-3 medium-block-grid-3 small-block-grid-1 text-center"></ul>');

        return true;
      },
      "fnRowCallback": function( nRow, aData, iDisplayIndex, iDisplayIndexFull ) {
        var data = aData.VMTEMPLATE;
        $("#provision_templates_ul").append('<li>'+
            '<ul class="provision-pricing-table hoverable" opennebula_id="'+data.ID+'">'+
              '<li class="provision-title" title="'+data.NAME+'">'+
                data.NAME+
              '</li>'+
              '<li class="provision-bullet-item">'+
                '<i class="fa fa-fw fa-laptop"/>&emsp;'+
                'x'+data.TEMPLATE.CPU+' - '+
                ((data.TEMPLATE.MEMORY > 1000) ?
                  (Math.floor(data.TEMPLATE.MEMORY/1024)+'GB') :
                  (data.TEMPLATE.MEMORY+'MB'))+
              '</li>'+
              '<li class="provision-bullet-item">'+
                '<i class="fa fa-fw fa-hdd-o"/>&emsp;'+
                "500GB DISK"+
              '</li>'+
              '<li class="provision-description">'+
                (data.TEMPLATE.DESCRIPTION || '...')+
              '</li>'+
            '</ul>'+
          '</li>');

        return nRow;
      }
    });

    update_provision_templates_datatable(provision_templates_datatable);

    var provision_images_datatable = $('#provision_images_table').dataTable({
      "iDisplayLength": 6,
      "sDom" : '<"H">t<"F"p>',
      "aoColumnDefs": [
          { "bVisible": false, "aTargets": ["all"]}
      ],
      "aoColumns": [
          { "mDataProp": "IMAGE.ID" },
          { "mDataProp": "IMAGE.NAME" }
      ],
      "fnPreDrawCallback": function (oSettings) {
        // create a thumbs container if it doesn't exist. put it in the dataTables_scrollbody div
        $("#provision_images_table").html('<ul id="provision_images_ul" class="large-block-grid-3 medium-block-grid-3 small-block-grid-1 text-center"></ul>');

        return true;
      },
      "fnRowCallback": function( nRow, aData, iDisplayIndex, iDisplayIndexFull ) {
        var data = aData.IMAGE;
        $("#provision_images_ul").append('<li>'+
            '<ul class="provision-pricing-table hoverable" opennebula_id="'+data.ID+'">'+
              '<li class="provision-title">'+
                data.NAME +
              '</li>'+
              '<li class="provision-bullet-item">'+'<i class="fa fa-fw fa-download" style="font-size:40px;"/>'+'</li>'+
              '<li class="provision-description">'+
                (data.TEMPLATE.DESCRIPTION || '...')+
              '</li>'+
            '</ul>'+
          '</li>');

        return nRow;
      }
    });

    update_provision_images_datatable(provision_images_datatable);

    tab.on("click", "#provision_create_vm .provision-pricing-table" , function(){
      $(".provision-pricing-table", $(this).parents(".small-block-grid-3")).removeClass("selected")
      $(this).addClass("selected");
    })

    $("#provision_create_vm").submit(function(){
      var context = $(this);

      var vm_name = $("#vm_name", context).val();
      var image_id = $("#provision_images_ul .selected", context).attr("opennebula_id");
      var template_id = $("#provision_templates_ul .selected", context).attr("opennebula_id");

      if (!template_id) {
        $(".alert-box-error", context).fadeIn().html(tr("You must select at least a capacity configuration"));
        return false;
      }

      if (!image_id) {
        $(".alert-box-error", context).fadeIn().html(tr("You must select at least an image"));
        return false;
      }

      var extra_info = {
        'vm_name' : vm_name,
        'template': {
          'disk': {
            'image_id': image_id
          }
        }
      }

      Sunstone.runAction("Provision.instantiate", template_id, extra_info);
      return false;
    })

    $("#provision_create_vm_button").on("click", function(){
      $(".section_content").hide();
      $("#provision_create_vm").fadeIn();
    });


    //
    // List VMs
    //

    provision_vms_datatable = $('#provision_vms_table').dataTable({
      "iDisplayLength": 6,
      "sDom" : '<"H">t<"F"p>',
      "aaSorting"  : [[0, "desc"]],
      "aoColumnDefs": [
          { "bVisible": false, "aTargets": ["all"]}
      ],
      "aoColumns": [
          { "mDataProp": "VM.ID" },
          { "mDataProp": "VM.NAME" }
      ],
      "fnPreDrawCallback": function (oSettings) {
        // create a thumbs container if it doesn't exist. put it in the dataTables_scrollbody div

        $("#provision_vms_table").html('<ul id="provision_vms_ul" class="large-block-grid-3 medium-block-grid-3 small-block-grid-1 text-center"></ul>');
        return true;
      },
      "fnRowCallback": function( nRow, aData, iDisplayIndex, iDisplayIndexFull ) {
        var data = aData.VM;
        var state = get_provision_vm_state(data);

        $("#provision_vms_ul").append('<li>'+
            '<ul class="provision-pricing-table" opennebula_id="'+data.ID+'" datatable_index="'+iDisplayIndexFull+'">'+
              '<li class="provision-title text-left">'+
                '<a class="provision_info_vm_button" style="color:#333" href="#"><i style="color:#0099c3" class="fa fa-fw fa-plus-square-o right"/>'+ data.NAME + '</a>'+
              '</li>'+
              '<li class="provision-bullet-item text-left" style="margin-left:20px">'+
                '<i class="fa fa-fw fa-laptop"/>&emsp;'+
                'x'+data.TEMPLATE.CPU+' - '+
                ((data.TEMPLATE.MEMORY > 1000) ?
                  (Math.floor(data.TEMPLATE.MEMORY/1024)+'GB') :
                  (data.TEMPLATE.MEMORY+'MB'))+
              '</li>'+
              '<li class="provision-bullet-item text-left" style="margin-left:20px">'+
                '<i class="fa fa-fw fa-download"></i>'+
                'Ubuntu 12.04'+
              '</li>'+
              '<li class="provision-bullet-item text-left" style="margin-left:20px">'+
                '<i class="fa fa-fw fa-globe"/>'+
                '192.168.1.1'+
              '</li>'+
              '<li class="provision-bullet-item text-left" style="font-size:12px; color: #999; margin-top:10px">'+
                '<i class="fa fa-fw fa-clock-o"/>'+
                _format_date(data.STIME)+
                '<span class="'+ state.color +'-color right">'+
                  state.str+
                '</span>'+
              '</li>'+
              '<li class="provision-bullet-item" style="padding: 0px">'+
                '<div style="height:1px" class="'+ state.color +'-bg"></div>'+
              '</li>'+
            '</ul>'+
          '</li>');

        return nRow;
      }
    });

    update_provision_vms_datatable(provision_vms_datatable);


    $("#provision_vms_list_button").on("click", function(){
      show_provision_vm_list();
    });

    $("#provision_list_vms").on("click", "#provision_vms_list_refresh_button", function(){
      show_provision_vm_list();
    });

    //
    // Info VM
    //

    $(document).on("click", "#provision_vms_ul .provision_info_vm_button", function(){
      $(".section_content").hide();
      $("#provision_info_vm").fadeIn();
      var vm_id = $(this).parents(".provision-pricing-table").attr("opennebula_id");
      Sunstone.runAction('Provision.show', vm_id);

      return false;
    })

    $("#provision_info_vm").on("click", "#provision_snapshot_button", function(){
      $("#provision_confirm_action").html(
        '<div data-alert class="alert-box secondary radius">'+
          '<div class="row">'+
            '<div class="large-12 columns">'+
              '<span style="font-size: 14px; line-height: 20px">'+
                'The main disk of the Virtual Machine will be saved in a new Image'+
              '</span>'+
            '</div>'+
          '</div>'+
          '<br>'+
          '<div class="row">'+
            '<div class="large-9 columns">'+
              '<input type="text" id="provision_snapshot_name" placeholder="'+tr("Image Name")+'" style="height: 40px !important; font-size: 16px; padding: 0.5rem  !important; margin: 0px"/>'+
            '</div>'+
            '<div class="large-3 columns">'+
              '<a href"#" id="provision_snapshot_create_button" class="success button large-12 radius right" style="margin-right: 15px">'+tr("Take Snapshot")+'</a>'+
            '</div>'+
          '</div>'+
          '<a href="#" class="close" style="top: 20px">&times;</a>'+
        '</div>');
    });

    $("#provision_info_vm").on("click", "#provision_delete_confirm_button", function(){
      $("#provision_confirm_action").html(
        '<div data-alert class="alert-box secondary radius">'+
          '<div class="row">'+
          '<div class="large-9 columns">'+
            '<span style="font-size: 14px; line-height: 20px">'+
              'This action will inmediately destroy the Virtual Machine and all the information will be lost.'+
            '</span>'+
          '</div>'+
          '<div class="large-3 columns">'+
            '<a href"#" id="provision_delete_button" class="alert button large-12 radius right" style="margin-right: 15px">'+tr("Delete")+'</a>'+
          '</div>'+
          '</div>'+
          '<a href="#" class="close">&times;</a>'+
        '</div>');
    });

    $("#provision_info_vm").on("click", "#provision_shutdownhard_confirm_button", function(){
      $("#provision_confirm_action").html(
        '<div data-alert class="alert-box secondary radius">'+
          '<div class="row">'+
          '<div class="large-9 columns">'+
            '<span style="font-size: 14px; line-height: 20px">'+
              'This action will inmediately destroy the Virtual Machine and all the information will be lost.'+
            '</span>'+
          '</div>'+
          '<div class="large-3 columns">'+
            '<a href"#" id="provision_shutdownhard_button" class="alert button large-12 radius right" style="margin-right: 15px">'+tr("Delete")+'</a>'+
          '</div>'+
          '</div>'+
          '<a href="#" class="close" style="top: 20px">&times;</a>'+
        '</div>');
    });

    $("#provision_info_vm").on("click", "#provision_poweroff_confirm_button", function(){
      $("#provision_confirm_action").html(
        '<div data-alert class="alert-box secondary radius">'+
          '<div class="row">'+
          '<div class="large-11 columns">'+
            '<span style="font-size: 14px; line-height: 20px">'+
              'This action will power off the given Virtual Machine.'+
              '<br>'+
              'The Virtual Machine will remain in the poweroff state, and can be powered on later'+
            '</span>'+
          '</div>'+
          '</div>'+
          '<br>'+
          '<div class="row">'+
          '<div class="large-12 columns">'+
            '<a href"#" id="provision_poweroff_button" class="button radius right" style="margin-right: 15px">'+tr("Power off")+'</a>'+
              '<input type="radio" name="provision_poweroff_radio" value="poweroff_hard" id="provision_poweroff_hard_radio">'+
                '<label for="provision_poweroff_hard_radio">'+
                  '<i class="fa fa-fw fa-bolt"/>'+tr("Power off the machine")+
                '</label>'+
              '<input type="radio" name="provision_poweroff_radio" value="poweroff" id="provision_poweroff_radio" checked>'+
                '<label for="provision_poweroff_radio">'+
                  '<i class="fa fa-fw fa-power-off"/>'+tr("Send the power off signal")+
                '</label>'+
          '</div>'+
          '</div>'+
          '<a href="#" class="close" style="top: 20px">&times;</a>'+
        '</div>');
    });

    $("#provision_info_vm").on("click", "#provision_reboot_confirm_button", function(){
      $("#provision_confirm_action").html(
        '<div data-alert class="alert-box secondary radius">'+
          '<div class="row">'+
          '<div class="large-11 columns">'+
            '<span style="font-size: 14px; line-height: 20px">'+
              'This action will reboot the given Virtual Machine.'+
              '<br>'+
              'The Virtual Machine will be ungracefully rebooted, unless the reboot signal is sent. This is equivalent to execute the reboot commnand from the console'+
            '</span>'+
          '</div>'+
          '</div>'+
          '<br>'+
          '<div class="row">'+
          '<div class="large-12 columns">'+
            '<a href"#" id="provision_reboot_button" class="button radius right" style="margin-right: 15px">'+tr("Reboot")+'</a>'+
              '<input type="radio" name="provision_reboot_radio" value="reboot_hard" id="provision_reboot_hard_radio">'+
              '<label for="provision_reboot_hard_radio">'+
                '<i class="fa fa-fw fa-bolt"/>'+tr("Reboot the machine")+
              '</label>'+
              '<input type="radio" name="provision_reboot_radio" value="reboot" id="provision_reboot_radio" checked>'+
              '<label for="provision_reboot_radio">'+
                '<i class="fa fa-fw fa-power-off"/>'+tr("Send the reboot signal")+
              '</label>'+
          '</div>'+
          '</div>'+
          '<a href="#" class="close" style="top: 20px">&times;</a>'+
        '</div>');
    });

    $("#provision_info_vm").on("click", "#provision_snapshot_create_button", function(){
      var context = $("#provision_info_vm");

      var vm_id = context.attr("vm_id");
      var image_name = $('#provision_snapshot_name', context).val();

      var obj = {
        disk_id : "0",
        image_name : image_name,
        type: "",
        hot: true
      };

      Sunstone.runAction('Provision.saveas', vm_id, obj);
    });

    $("#provision_info_vm").on("click", "#provision_delete_button", function(){
      var vm_id = $("#provision_info_vm").attr("vm_id");
      Sunstone.runAction('Provision.delete', vm_id);
    });

    $("#provision_info_vm").on("click", "#provision_shutdownhard_button", function(){
      var vm_id = $("#provision_info_vm").attr("vm_id");
      Sunstone.runAction('Provision.shutdown_hard', vm_id);
    });

    $("#provision_info_vm").on("click", "#provision_poweroff_button", function(){
      var vm_id = $("#provision_info_vm").attr("vm_id");
      var poweroff_action = $('input[name=provision_poweroff_radio]:checked').val()
      Sunstone.runAction('Provision.' + poweroff_action, vm_id);
    });

    $("#provision_info_vm").on("click", "#provision_reboot_button", function(){
      var vm_id = $("#provision_info_vm").attr("vm_id");
      var reboot_action = $('input[name=provision_reboot_radio]:checked').val()
      Sunstone.runAction('Provision.' + reboot_action, vm_id);
    });

    $("#provision_info_vm").on("click", "#provision_poweron_button", function(){
      var vm_id = $("#provision_info_vm").attr("vm_id");
      Sunstone.runAction('Provision.resume', vm_id);
    });

    $("#provision_info_vm").on("click", "#provision_vnc_button", function(){
      var vm_id = $("#provision_info_vm").attr("vm_id");
      Sunstone.runAction('Provision.startvnc', vm_id);
    });

    $("#provision_info_vm").on("click", "#provision_refresh_info", function(){
      $(".section_content").hide();
      $("#provision_info_vm").fadeIn();
      var vm_id = $("#provision_info_vm").attr("vm_id");
      Sunstone.runAction('Provision.show', vm_id);
    });
  }
});
