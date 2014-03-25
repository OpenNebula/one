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
  '<div class="row">'+
    '<div class="large-9 columns large-centered">'+
      '<div data-alert class="alert-box alert-box-error radius text-center hidden">'+
      '</div>'+
      '<button href="#" class="button large radius success right" type="submit">'+tr("Create")+'</button>'+
    '</div>'+
  '</div>'+
  '<br>'+
'</form>';

var provision_list_vms = '<div id="provision_list_vms" class="section_content">'+
  '<div class="row">'+
    '<div class="large-11 large-centered columns">'+
      '<h2 class="subheader">'+
        tr("Virtual Machines")+
        '<a href"#" id="provision_create_vm_button" class="button medium radius success right"><i class="fa fa-fw fa-plus"/>'+tr("Create")+'</a>'+
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
        '<span id="provision_info_vm_name">'+
        '</span>'+
      '</h2>'+
    '</div>'+
  '</div>'+
  '<div class="row">'+
    '<div id="provision_info_vm_resume" class="large-10 large-centered columns">'+
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
  '<br>'+
  '<br>'+
  '<div class="row">'+
    '<div class="large-10 large-centered columns">'+
        '<span class="left">'+
          '<a href"#" id="" class="secondary button medium radius" style="font-size:12px"><i style="color: #555" class="fa fa-fw fa-power-off fa-2x"/><br>'+tr("Power off")+'</a>'+
          '<a href"#" id="" class="secondary button medium radius" style="font-size:12px"><i style="color: #555" class="fa fa-fw fa-repeat fa-2x"/><br>'+tr("Reboot")+'</a>'+
          '<a href"#" id="" class="secondary button medium radius" style="font-size:12px"><i style="color: #555" class="fa fa-fw fa-trash-o fa-2x"/><br>'+tr("Destroy")+'</a>'+
        '</span>'+
        '<span class="right">'+
          '<a href"#" id="" class="secondary button medium radius" style="font-size:12px"><i style="color: #555" class="fa fa-fw fa-camera-retro fa-2x"/><br>'+tr("Snapshot")+'</a>'+
          '<a href"#" id="" class="secondary button medium radius" style="font-size:12px"><i style="color: #555" class="fa fa-fw fa-desktop fa-2x"/><br>'+tr("VNC")+'</a>'+
        '</span>'+
    '</div>'+
  '</div>'+
  '<br>'+
  '<div class="row">'+
      '<div class="large-6 columns">'+
        '<div class="row text-center">'+
          '<div class="large-12 columns">'+
            '<h3 class="subheader"><small>'+tr("REAL CPU")+'</small></h3>'+
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
      '<div class="large-6 columns">'+
        '<div class="row text-center">'+
          '<h3 class="subheader"><small>'+tr("REAL MEMORY")+'</small></h3>'+
        '</div>'+
        '<div class="row">'+
          '<div class="large-10 columns centered graph vm_memory_graph" style="height: 100px;">'+
          '</div>'+
        '</div>'+
        '<div class="row graph_legend">'+
          '<div class="large-10 columns centered" id="vm_memory_legend">'+
          '</div>'+
        '</div>'+
      '</div>'+
  '</div>'+
'</div>';


var provision_content = provision_create_vm +
  provision_info_vm +
  provision_list_vms ;

var provision_tab = {
  title: '<img src="images/one_small_logo.png" style="height:40px">',
  list_header: '<img src="images/one_small_logo.png" style="height:40px">'+
    '<span class="right" style="font-size: 70%">'+
      '<a href"#" class="medium" id="provision_vms_list_button" style="margin-left: 20px;">'+tr("Virtual Machines")+'&emsp;</a>'+
      '<a href"#" class="medium" style="margin-left: 20px;">'+tr("Images")+'</a>&emsp;'+
      '<a href"#" class="medium" style="margin-left: 20px;"><i class="fa fa-fw fa-user" style="color: #777"/>'+tr("oneadmin")+'</a>&emsp;'+
      '<a href"#" class="medium" style="margin-left: 20px;"><i class="fa fa-fw fa-sign-out" style="color: #777"/></a>'+
    '</span>'+
    '<br>',
  content: provision_content
};

Sunstone.addMainTab('provision-tab',provision_tab);

var update_provision_images_datatable = function(datatable) {
  OpenNebula.Image.list({
    timeout: true,
    success: function (request, item_list){
      datatable.fnClearTable(false);
      datatable.fnAddData(item_list);
    }
  });
}

var update_provision_templates_datatable = function(datatable) {
  OpenNebula.Template.list({
    timeout: true,
    success: function (request, item_list){
      datatable.fnClearTable(false);
      datatable.fnAddData(item_list);
    }
  });
}

var update_provision_vms_datatable = function(datatable) {
  OpenNebula.VM.list({
    timeout: true,
    success: function (request, item_list){
      datatable.fnClearTable(false);
      datatable.fnAddData(item_list);
    }
  });
}

$(document).ready(function(){
  var tab_name = 'provision-tab';
  var tab = $("#"+tab_name);

  if (Config.isTabEnabled(tab_name)) {
    $(".left-content").remove();
    $(".right-content").addClass("large-centered");

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
        $("#provision_templates_table").html('<ul id="provision_templates_ul" class="small-block-grid-3 text-center"></ul>');

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
        $("#provision_images_table").html('<ul id="provision_images_ul" class="small-block-grid-3 text-center"></ul>');

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

      Sunstone.runAction("Template.instantiate_quiet", template_id, extra_info);
      $(".alert-box-error", context).hide();
      return false;
    })

    $("#provision_create_vm_button").on("click", function(){
      $(".section_content").hide();
      $("#provision_create_vm").fadeIn();
    });

    //
    // List VMs
    //
    var provision_vms_datatable = $('#provision_vms_table').dataTable({
      "iDisplayLength": 6,
      "sDom" : '<"H">t<"F"lp>',
      "aoColumnDefs": [
          { "bVisible": false, "aTargets": ["all"]}
      ],
      "aoColumns": [
          { "mDataProp": "VM.ID" },
          { "mDataProp": "VM.NAME" }
      ],
      "fnPreDrawCallback": function (oSettings) {
        // create a thumbs container if it doesn't exist. put it in the dataTables_scrollbody div
        $("#provision_vms_table").html('<ul id="provision_vms_ul" class="small-block-grid-3 text-center"></ul>');

        return true;
      },
      "fnRowCallback": function( nRow, aData, iDisplayIndex, iDisplayIndexFull ) {
        var data = aData.VM;
        var state = OpenNebula.Helper.resource_state("vm",data.STATE);
        var state_color;
        switch (state) {
          case tr("INIT"):
          case tr("PENDING"):
          case tr("HOLD"):
            state_color = 'warning';
            break;
          case tr("FAILED"):
            state_color = 'error';
            break;
          case tr("ACTIVE"):
            state_color = 'success';
            break;
          case tr("STOPPED"):
          case tr("SUSPENDED"):
          case tr("POWEROFF"):
            state_color = 'secondary';
            break;
          default:
            state_color = 'secondary';
            break;
        }

      state_color= "success"
        $("#provision_vms_ul").append('<li>'+
            '<ul class="provision-pricing-table" opennebula_id="'+data.ID+'" datatable_index="'+iDisplayIndexFull+'">'+
              '<li class="provision-title text-left">'+
                '<a class="provision_info_vm_button" href="#"><i class="fa fa-fw fa-plus-square-o right"/>'+ data.NAME + '</a>'+
              '</li>'+
              '<li class="provision-bullet-item">'+
                '<i class="fa fa-fw fa-laptop"/>&emsp;'+
                'x'+data.TEMPLATE.CPU+' - '+
                ((data.TEMPLATE.MEMORY > 1000) ?
                  (Math.floor(data.TEMPLATE.MEMORY/1024)+'GB') :
                  (data.TEMPLATE.MEMORY+'MB'))+
              '</li>'+
              '<li class="provision-bullet-item">'+
                '<i class="fa fa-fw fa-download"></i>'+
                'Ubuntu 12.04'+
              '</li>'+
              '<li class="provision-bullet-item">'+
                '<i class="fa fa-fw fa-globe"/>'+
                '192.168.1.1'+
              '</li>'+
              '<li class="provision-bullet-item text-left" style="font-size:12px; color: #999; margin-top:10px">'+
                '<i class="fa fa-fw fa-clock-o"/>'+
                pretty_time_runtime(data.STIME)+
                '<span class="'+ state_color +'-color right">RUNNING</span>'+
              '</li>'+
              '<li class="provision-bullet-item '+ state_color +'-bg"></li>'+
            '</ul>'+
          '</li>');

        return nRow;
      }
    });

    update_provision_vms_datatable(provision_vms_datatable);

    $("#provision_vms_list_button").on("click", function(){
      $(".section_content").hide();
      $("#provision_list_vms").fadeIn();
    });

    $(document).on("click", "#provision_vms_ul .provision_info_vm_button", function(){
      $(".section_content").hide();
      $("#provision_info_vm").fadeIn();

      var datatable_index = $(this).parents(".provision-pricing-table").attr("datatable_index");
      var aData = provision_vms_datatable.fnGetData(datatable_index);
      var data = aData.VM;
      var state = OpenNebula.Helper.resource_state("vm",data.STATE);
      var state_color;
      switch (state) {
        case tr("INIT"):
        case tr("PENDING"):
        case tr("HOLD"):
          state_color = 'warning';
          break;
        case tr("FAILED"):
          state_color = 'error';
          break;
        case tr("ACTIVE"):
          state_color = 'success';
          break;
        case tr("STOPPED"):
        case tr("SUSPENDED"):
        case tr("POWEROFF"):
          state_color = 'secondary';
          break;
        default:
          state_color = 'secondary';
          break;
      }

      state_color= "success"
      var context = $("#provision_info_vm");
      $("#provision_info_vm_name", context).text(data.NAME);

      $("#provision_info_vm_resume").html('<span class="secondary-color">'+
              '<i class="fa fa-fw fa-laptop"/>&emsp;'+
              'x'+data.TEMPLATE.CPU+' - '+
              ((data.TEMPLATE.MEMORY > 1000) ?
                (Math.floor(data.TEMPLATE.MEMORY/1024)+'GB') :
                (data.TEMPLATE.MEMORY+'MB'))+
              '&emsp;&emsp;<i class="fa fa-fw fa-download"></i>'+
              'Ubuntu 12.04'+
              '&emsp;&emsp;<i class="fa fa-fw fa-globe"/>'+
              '192.168.1.1'+
              '&emsp;&emsp;<i class="fa fa-fw fa-clock-o"/>'+
              pretty_time_runtime(data.STIME)+
        '</span>');

      $("#provision_info_vm_state").html('<span class="'+ state_color +'-color right">'+state+'</span>');

      $("#provision_info_vm_state_hr").html('<div style="height:3px" class="'+state_color+'-bg">'+
        "</div>");

      Sunstone.runAction("VM.monitor",data.ID, { monitor_resources : "CPU,MEMORY"});
      return false;
    })
  }
});
