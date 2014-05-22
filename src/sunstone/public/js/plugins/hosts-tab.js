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

/*Host tab plugin*/
/* HOST_HISTORY_LENGTH is ignored by server */
var HOST_HISTORY_LENGTH = 40;

var create_host_tmpl =
'<div class="row">\
    <div class="large-12 columns">\
      <h3 id="create_cluster_header" class="subheader">'+tr("Create Host")+'</h3>\
    </div>\
  </div>\
  <div class="reveal-body">\
  <form id="create_host_form" action="" class="">\
  <div class="row">\
      <div class="large-6 columns">\
          <label for="name">' + tr("Hostname")  + '</label>\
          <input type="text" name="name" id="name" />\
      </div>\
      <div class="large-6 columns" id="cluster_select">\
          <label for="host_cluster_id">' + tr("Cluster") + '</label>\
          <div id="host_cluster_id" name="host_cluster_id">\
          </div>\
      </div>\
  </div>\
  <fieldset>\
    <legend>'+tr("Drivers")+'</legend>\
  <div class="row">\
      <div class="large-6 columns">\
    <div class="manager clear row" id="vmm_mads">\
      <div class="large-12 columns">\
          <label for="vmm">' +  tr("Virtualization") + '</label>\
          <select id="vmm_mad" name="vmm">\
                <option value="kvm">' + tr("KVM") + '</option>\
                <option value="xen">' + tr("XEN") + '</option>\
                <option value="vmware">' + tr("VMware") + '</option>\
                <option value="ec2">' + tr("EC2") + '</option>\
                <option value="dummy">' + tr("Dummy") + '</option>\
                <option value="custom">' + tr("Custom") + '</option>\
          </select>\
      </div>\
      <div class="large-12 columns">\
          <label>' + tr("Custom VMM_MAD") + '</label>\
          <input type="text" name="custom_vmm_mad" />\
      </div>\
    </div>\
    <div class="manager clear row" id="im_mads">\
      <div class="large-12 columns">\
          <label for="im">' +  tr("Information") + '</label>\
          <select id="im_mad" name="im">\
               <option value="kvm">' + tr("KVM") + '</option>\
               <option value="xen">' + tr("XEN") + '</option>\
               <option value="vmware">' + tr("VMware") + '</option>\
               <option value="ec2">' + tr("EC2") + '</option>\
               <option value="dummy">' + tr("Dummy") + '</option>\
               <option value="custom">' + tr("Custom") + '</option>\
          </select>\
      </div>\
      <div class="large-12 columns">\
          <label>' + tr("Custom IM_MAD") + ':</label>\
          <input type="text" name="custom_im_mad" />\
      </div>\
    </div>\
      </div>\
      <div class="large-6 columns">\
    <div class="manager clear row" id="vnm_mads">\
      <div class="large-12 columns">\
          <label for="vn">' +  tr("Networking") + '</label>\
          <select id="vnm_mad" name="vn">\
             <option value="dummy">' + tr("Default (dummy)") +'</option>\
             <option value="fw">'+tr("Firewall")+'</option>\
             <option value="802.1Q">'+tr("802.1Q")+'</option>\
             <option value="ebtables">'+tr("ebtables")+'</option>\
             <option value="ovswitch">'+tr("Open vSwitch")+'</option>\
             <option value="vmware">'+tr("VMware")+'</option>\
             <option value="custom">' + tr("Custom") + '</option>\
           </select>\
      </div>\
      <div class="large-12 columns">\
          <label>' + tr("Custom VNM_MAD") + '</label>\
          <input type="text" name="custom_vnm_mad" />\
      </div>\
    </div>\
      </div>\
    </div>\
  </fieldset>\
  <br>\
  <div class="form_buttons row">\
      <button id="wizard_host_reset_button" class="button secondary radius" type="reset" value="reset">' + tr("Reset") + '</button>\
      <button class="button success right radius" type="submit" id="create_host_submit" value="OpenNebula.Host.create">' + tr("Create") + '</button>\
  </div>\
</form>\
</div>\
<a class="close-reveal-modal">&#215;</a>';

var dataTable_hosts;
var $create_host_dialog;

//Setup actions
var host_actions = {

    "Host.create" : {
        type: "create",
        call : OpenNebula.Host.create,
        callback : function(request, response) {
            // Reset the create wizard
            $create_host_dialog.foundation('reveal', 'close');
            $create_host_dialog.empty();
            setupCreateHostDialog();

            addHostElement(request, response);
            notifyCustom(tr("Host created"), " ID: " + response.HOST.ID, false);
        },
        error : onError
    },

    "Host.create_dialog" : {
        type: "custom",
        call: popUpCreateHostDialog
    },

    "Host.list" : {
        type: "list",
        call: OpenNebula.Host.list,
        callback: updateHostsView,
        error: onError
    },

    "Host.show" : {
        type: "single",
        call: OpenNebula.Host.show,
        callback:  function(request, response) {
            updateHostElement(request, response);
            if (Sunstone.rightInfoVisible($("#hosts-tab"))) {
                updateHostInfo(request, response);
            }
        },
        error: onError
    },

    "Host.refresh" : {
        type: "custom",
        call: function(){
          var tab = dataTable_hosts.parents(".tab");
          if (Sunstone.rightInfoVisible(tab)) {
            Sunstone.runAction("Host.show", Sunstone.rightInfoResourceId(tab))
          } else {
            waitingNodes(dataTable_hosts);
            Sunstone.runAction("Host.list", {force: true});
          }
        },
        error: onError
    },

    "Host.enable" : {
        type: "multiple",
        call : OpenNebula.Host.enable,
        callback : function (req) {
            Sunstone.runAction("Host.show",req.request.data[0]);
        },
        elements: hostElements,
        error : onError
    },

    "Host.disable" : {
        type: "multiple",
        call : OpenNebula.Host.disable,
        callback : function (req) {
            Sunstone.runAction("Host.show",req.request.data[0]);
        },
        elements: hostElements,
        error : onError
    },

    "Host.delete" : {
        type: "multiple",
        call : OpenNebula.Host.del,
        callback : deleteHostElement,
        elements: hostElements,
        error : onError
    },

    "Host.monitor" : {
        type: "monitor",
        call : OpenNebula.Host.monitor,
        callback: function(req,response) {
            var host_graphs = [
            {
                monitor_resources : "HOST_SHARE/CPU_USAGE,HOST_SHARE/USED_CPU,HOST_SHARE/MAX_CPU",
                labels : tr("Allocated")+","+tr("Real")+","+tr("Total"),
                humanize_figures : false,
                div_graph : $("#host_cpu_graph"),
                div_legend : $("#host_cpu_legend")
            },
            {
                monitor_resources : "HOST_SHARE/MEM_USAGE,HOST_SHARE/USED_MEM,HOST_SHARE/MAX_MEM",
                labels : tr("Allocated")+","+tr("Real")+","+tr("Total"),
                humanize_figures : true,
                div_graph : $("#host_mem_graph"),
                div_legend : $("#host_mem_legend")
            }
            ];

            for(var i=0; i<host_graphs.length; i++) {
                plot_graph(
                    response,
                    host_graphs[i]
                );
            }
        },
        error: hostMonitorError
    },
    "Host.update_template" : {
        type: "single",
        call: OpenNebula.Host.update,
        callback: function(request) {
            Sunstone.runAction('Host.show',request.request.data[0][0]);
        },
        error: onError
    },

    "Host.addtocluster" : {
        type: "multiple",
        call: function(params){
            var cluster = params.data.extra_param;
            var host = params.data.id;

            if (cluster == -1){
                //get cluster name
                var current_cluster = getValue(host,1,3,dataTable_hosts);
                //get cluster id
                current_cluster = getValue(current_cluster,
                                           2,1,dataTable_clusters);
                if (!current_cluster) return;
                Sunstone.runAction("Cluster.delhost",current_cluster,host)
            }
            else
                Sunstone.runAction("Cluster.addhost",cluster,host);
        },
        callback: function(request) {
            Sunstone.runAction('Host.show',request.request.data[0]);
        },
        elements: hostElements
    },

    "Host.help" : {
        type: "custom",
        call: function() {
            hideDialog();
            $('div#hosts_tab div.legend_div').slideToggle();
        }
    },

    "Host.rename" : {
        type: "single",
        call: OpenNebula.Host.rename,
        callback: function(request) {
            Sunstone.runAction('Host.show',request.request.data[0]);
        },
        error: onError
    }
};

var host_buttons = {
    "Host.refresh" : {
        type: "action",
        layout: "refresh",
        alwaysActive: true
    },
//    "Sunstone.toggle_top" : {
//        type: "custom",
//        layout: "top",
//        alwaysActive: true
//    },
    "Host.create_dialog" : {
        type: "create_dialog",
        layout: "create",
        condition: mustBeAdmin
    },

    "Host.addtocluster" : {
        type: "confirm_with_select",
        text: tr("Select cluster"),
        select: "Cluster",
        tip: tr("Select the destination cluster:"),
        layout: "main",
        condition: mustBeAdmin
    },
    "Host.enable" : {
        type: "action",
        text: tr("Enable"),
        layout: "main",
        condition: mustBeAdmin
    },
    "Host.disable" : {
        type: "action",
        text: tr("Disable"),
        layout: "main",
        condition: mustBeAdmin
    },
    "Host.delete" : {
        type: "confirm",
        text: tr("Delete host"),
        layout: "del",
        condition: mustBeAdmin
    }
};

var host_info_panel = {
    "host_info_tab" : {
        title: tr("Information"),
        content:""
    },

    "host_monitoring_tab": {
        title: tr("Graphs"),
        content: ""
    }
};


var hosts_tab = {
    title: tr("Hosts"),
    resource: 'Host',
    buttons: host_buttons,
    tabClass: "subTab",
    parentTab: "infra-tab",
    search_input: '<input id="hosts_search" type="text" placeholder="'+tr("Search")+'" />',
    list_header: '<i class="fa fa-fw fa-hdd-o "></i>&emsp;'+tr("Hosts"),
    info_header: '<i class="fa fa-fw fa-hdd-o "></i>&emsp;'+tr("Host"),
    subheader: '<span class="total_hosts"/> <small>'+tr("TOTAL")+'</small>&emsp;\
        <span class="on_hosts"/> <small>'+tr("ON")+'</small>&emsp;\
        <span class="off_hosts"/> <small>'+tr("OFF")+'</small>&emsp;\
        <span class="error_hosts"/> <small>'+tr("ERROR")+'</small>',
    table: '<table id="datatable_hosts" class="datatable twelve">\
      <thead>\
        <tr>\
          <th class="check"><input type="checkbox" class="check_all" value=""></input></th>\
          <th>' + tr("ID") + '</th>\
          <th>' + tr("Name") + '</th>\
          <th>' + tr("Cluster") + '</th>\
          <th>' + tr("RVMs") + '</th>\
          <th>' + tr("Real CPU") + '</th>\
          <th>' + tr("Allocated CPU") + '</th>\
          <th>' + tr("Real MEM") + '</th>\
          <th>' + tr("Allocated MEM") + '</th>\
          <th>' + tr("Status") + '</th>\
          <th>' + tr("IM MAD") + '</th>\
          <th>' + tr("VM MAD") + '</th>\
          <th>' + tr("Last monitored on") + '</th>\
        </tr>\
      </thead>\
      <tbody id="tbodyhosts">\
      </tbody>\
    </table>'
};

Sunstone.addActions(host_actions);
Sunstone.addMainTab('hosts-tab',hosts_tab);
Sunstone.addInfoPanel("host_info_panel",host_info_panel);

// return selected elements from hosts datatable
function hostElements(){
    return getSelectedNodes(dataTable_hosts);
}

function generateCPUProgressBar(host) {
    var max_cpu = parseInt(host.HOST_SHARE.MAX_CPU);

    var info_str;

    var allocated_cpu = parseInt(host.HOST_SHARE.CPU_USAGE);

    if (max_cpu > 0) {
        var ratio_allocated_cpu = Math.round((allocated_cpu / max_cpu) * 100);
        info_str = allocated_cpu + ' / ' + max_cpu + ' (' + ratio_allocated_cpu + '%)';
    } else {
        info_str = "";
    }

    var pb_allocated_cpu = quotaBarHtml(allocated_cpu, max_cpu, info_str);

    var real_cpu = parseInt(host.HOST_SHARE.USED_CPU);

    if (max_cpu > 0) {
        var ratio_real_cpu = Math.round((real_cpu / max_cpu) * 100);
        info_str = real_cpu + ' / ' + max_cpu + ' (' + ratio_real_cpu + '%)';
    } else {
        info_str = "";
    }

    var pb_real_cpu = quotaBarHtml(real_cpu, max_cpu, info_str);

    return {
      real: pb_real_cpu,
      allocated: pb_allocated_cpu
    }
}

function generateMEMProgressBar(host){
    // Generate MEM progress bars
    var max_mem = parseInt(host.HOST_SHARE.MAX_MEM);

    var allocated_mem = parseInt(host.HOST_SHARE.MEM_USAGE);

    if (max_mem > 0) {
        var ratio_allocated_mem = Math.round((allocated_mem / max_mem) * 100);
        info_str = humanize_size(allocated_mem) + ' / ' + humanize_size(max_mem) + ' (' + ratio_allocated_mem + '%)';
    } else {
        info_str = humanize_size(allocated_mem) + ' / -';
    }

    var pb_allocated_mem = quotaBarHtml(allocated_mem, max_mem, info_str);

    var real_mem = parseInt(host.HOST_SHARE.USED_MEM);

    if (max_mem > 0) {
        var ratio_real_mem = Math.round((real_mem / max_mem) * 100);
        info_str = humanize_size(real_mem) + ' / ' + humanize_size(max_mem) + ' (' + ratio_real_mem + '%)';
    } else {
        info_str = humanize_size(real_mem) + ' / -';
    }

    var pb_real_mem = quotaBarHtml(real_mem, max_mem, info_str);

    return {
      real: pb_real_mem,
      allocated: pb_allocated_mem
    }
}

//Creates an array to be added to the dataTable from the JSON of a host.
function hostElementArray(host_json){
    var host = host_json.HOST;

    var cpu_bars = generateCPUProgressBar(host);
    var mem_bars = generateMEMProgressBar(host);

    var state_simple = OpenNebula.Helper.resource_state("host_simple",host.STATE);
    switch (state_simple) {
      case tr("INIT"):
      case tr("UPDATE"):
      case tr("ON"):
        on_hosts++;
        break;
      case tr("ERROR"):
      case tr("RETRY"):
        error_hosts++;
        break;
      case tr("OFF"):
        off_hosts++;
        break;
      default:
        break;
    }

    return [
        '<input class="check_item" type="checkbox" id="host_'+host.ID+'" name="selected_items" value="'+host.ID+'"/>',
        host.ID,
        host.NAME,
        host.CLUSTER.length ? host.CLUSTER : "-",
        host.HOST_SHARE.RUNNING_VMS, //rvm
        cpu_bars.real,
        cpu_bars.allocated,
        mem_bars.real,
        mem_bars.allocated,
        state_simple,
        host.IM_MAD,
        host.VM_MAD,
        pretty_time(host.LAST_MON_TIME)
    ];
}

//callback for an action affecting a host element
function updateHostElement(request, host_json){
    var id = host_json.HOST.ID;
    var element = hostElementArray(host_json);
    updateSingleElement(element,dataTable_hosts,'#host_'+id);
}

//callback for actions deleting a host element
function deleteHostElement(req){
    deleteElement(dataTable_hosts,'#host_'+req.request.data);
}

//call back for actions creating a host element
function addHostElement(request,host_json){
    var id = host_json.HOST.ID;
    var element = hostElementArray(host_json);
    addElement(element,dataTable_hosts);
}

//callback to update the list of hosts.
function updateHostsView (request,host_list){
    var host_list_array = [];

    on_hosts = 0;
    off_hosts = 0;
    error_hosts = 0;

    var max_cpu = 0;
    var allocated_cpu = 0;
    var real_cpu = 0;

    var max_mem = 0;
    var allocated_mem = 0;
    var real_mem = 0;


    $.each(host_list,function(){
        //Grab table data from the host_list
        host_list_array.push(hostElementArray(this));

        max_cpu += parseInt(this.HOST.HOST_SHARE.MAX_CPU);
        allocated_cpu += parseInt(this.HOST.HOST_SHARE.CPU_USAGE);
        real_cpu += parseInt(this.HOST.HOST_SHARE.USED_CPU);

        max_mem += parseInt(this.HOST.HOST_SHARE.MAX_MEM);
        allocated_mem += parseInt(this.HOST.HOST_SHARE.MEM_USAGE);
        real_mem += parseInt(this.HOST.HOST_SHARE.USED_MEM);
    });

    updateView(host_list_array,dataTable_hosts);

    var ratio_allocated_cpu = 0;
    if (max_cpu > 0) {
        ratio_allocated_cpu = Math.round((allocated_cpu / max_cpu) * 100);
        info_str = allocated_cpu + ' / ' + max_cpu ;
    } else {
        info_str = "";
    }

    //$("#dash_host_allocated_cpu").html(usageBarHtml(allocated_cpu, max_cpu, info_str, true));

    $("#dashboard_host_allocated_cpu").html(quotaDashboard(
      "dashboard_host_allocated_cpu",
      tr("ALLOCATED CPU"),
      "30px",
      "12px",
      {"percentage": ratio_allocated_cpu, "str": info_str })
    );

    var ratio_real_cpu = 0;
    if (max_cpu > 0) {
        ratio_real_cpu = Math.round((real_cpu / max_cpu) * 100);
        info_str = real_cpu + ' / ' + max_cpu;
    } else {
        info_str = "";
    }

    //$("#dash_host_real_cpu").html(usageBarHtml(real_cpu, max_cpu, info_str, true));

    $("#dashboard_host_real_cpu").html(quotaDashboard(
      "dashboard_host_real_cpu",
      tr("REAL CPU"),
      "30px",
      "12px",
      {"percentage": ratio_real_cpu, "str": info_str })
    );

    var ratio_allocated_mem = 0;
    if (max_mem > 0) {
        ratio_allocated_mem = Math.round((allocated_mem / max_mem) * 100);
        info_str = humanize_size(allocated_mem) + ' / ' + humanize_size(max_mem);
    } else {
        info_str = humanize_size(allocated_mem) + ' / -';
    }

    //$("#dash_host_allocated_mem").html(usageBarHtml(allocated_mem, max_mem, info_str, true));

    $("#dashboard_host_allocated_mem").html(quotaDashboard(
      "dashboard_host_allocated_mem",
      tr("ALLOCATED MEMORY"),
      "30px",
      "12px",
      {"percentage": ratio_allocated_mem, "str": info_str })
    );

    if (max_mem > 0) {
        var ratio_real_mem = Math.round((real_mem / max_mem) * 100);
        info_str = humanize_size(real_mem) + ' / ' + humanize_size(max_mem);
    } else {
        info_str = humanize_size(real_mem) + ' / -';
    }

    //$("#dash_host_real_mem").html(usageBarHtml(real_mem, max_mem, info_str, true));

    $("#dashboard_host_real_mem").html(quotaDashboard(
      "dashboard_host_real_mem",
      tr("REAL MEMORY"),
      "30px",
      "12px",
      {"percentage": ratio_real_mem, "str": info_str })
    );

    $(".total_hosts").text(host_list.length);
    $(".on_hosts").text(on_hosts);
    $(".off_hosts").text(off_hosts);
    $(".error_hosts").text(error_hosts);
}

function insert_datastores_capacity_table(host_share) {
  var datastores = []
  if ($.isArray(host_share.DATASTORES.DS))
      datastores = host_share.DATASTORES.DS
  else if (!$.isEmptyObject(host_share.DATASTORES.DS))
      datastores = [host_share.DATASTORES.DS]

  var str = "";

  if (datastores.length) {
    str += '<table id="info_host_datastore_table" class="dataTable extended_table">\
      <thead>\
        <tr>\
          <th>' + tr("Datastore ID") + '</th>\
          <th style="width:70%">' + tr("Capacity") + '</th>\
        </tr>\
      </thead>\
      <tbody>';

    $.each(datastores, function(index, value){
      var pbar = generate_datastore_capacity_bar(value, 1);

      str += '<tr>\
         <td class="key_td">' + value.ID + '</td>\
         <td class="value_td" colspan="2">'+ pbar +'</td>\
      </tr>'
    })

    str += '</tbody>\
      </table>'
  }

  return str;
}


//Updates the host info panel tab content and pops it up
function updateHostInfo(request,host){
    var host_info = host.HOST;

    var cpu_bars = generateCPUProgressBar(host_info);
    var mem_bars = generateMEMProgressBar(host_info);

    //Information tab
    var info_tab = {
        title : tr("Info"),
        icon: "fa-info-circle",
        content :
        '<div class="row">\
        <div class="large-6 columns">\
        <table id="info_host_table" class="dataTable extended_table">\
            <thead>\
               <tr><th colspan="3">' + tr("Information") + '</th></tr>\
            </thead>\
            <tbody>\
            <tr>\
                <td class="key_td">' + tr("id") + '</td>\
                <td class="value_td" colspan="2">'+host_info.ID+'</td>\
            </tr>'+
            insert_rename_tr(
                'hosts-tab',
                "Host",
                host_info.ID,
                host_info.NAME)+
            '<tr>' +
                insert_cluster_dropdown("Host",host_info.ID,host_info.CLUSTER,host_info.CLUSTER_ID,"#info_host_table") +
            '</tr>\
            <tr>\
                <td class="key_td">' + tr("State") + '</td>\
                <td class="value_td" colspan="2">'+tr(OpenNebula.Helper.resource_state("host",host_info.STATE))+'</td>\
            </tr>\
            <tr>\
                <td class="key_td">' + tr("IM MAD") + '</td>\
                <td class="value_td" colspan="2">'+host_info.IM_MAD+'</td>\
            </tr>\
            <tr>\
                <td class="key_td">' + tr("VM MAD") + '</td>\
                <td class="value_td" colspan="2">'+host_info.VM_MAD+'</td>\
            </tr>\
            <tr>\
                <td class="key_td">'+ tr("VN MAD") +'</td>\
                <td class="value_td" colspan="2">'+host_info.VN_MAD+'</td>\
            </tr>\
            </tbody>\
         </table>\
        </div>\
        <div class="large-6 columns">\
        <table id="info_host_table" class="dataTable extended_table">\
            <thead>\
               <tr><th colspan="3">' + tr("Capacity") + '</th></tr>\
            </thead>\
            <tbody>\
            <tr>\
              <td class="key_td">' + tr("Allocated Memory") + '</td>\
              <td class="value_td" colspan="2" style="width:50%;">'+mem_bars.allocated+'</td>\
            </tr>\
            <tr>\
              <td class="key_td">' + tr("Allocated CPU") + '</td>\
              <td class="value_td" colspan="2" style="width:50%;">'+cpu_bars.allocated+'</td>\
            </tr>\
            <tr>\
              <td class="key_td">' + tr("Real Memory") + '</td>\
              <td class="value_td" colspan="2" style="width:50%;">'+mem_bars.real+'</td>\
            </tr>\
            <tr>\
              <td class="key_td">' + tr("Real CPU") + '</td>\
              <td class="value_td" colspan="2" style="width:50%;">'+cpu_bars.real+'</td>\
            </tr>\
            <tr>\
              <td class="key_td">' + tr("Running VMs") + '</td>\
              <td class="value_td" colspan="2">'+host_info.HOST_SHARE.RUNNING_VMS+'</td>\
            </tr>\
            </tbody>\
         </table>' +
          insert_datastores_capacity_table(host_info.HOST_SHARE) +
        '</div>\
        </div>\
        <div class="row">\
          <div class="large-9 columns">'
          + insert_extended_template_table(host_info.TEMPLATE,
                                           "Host",
                                           host_info.ID,
                                           "Attributes") +
          '</div>\
        </div>\
      </div>'
    }


    var monitor_tab = {
        title: tr("Graphs"),
        icon: "fa-bar-chart-o",
        content:
        '<div class="">\
            <div class="large-6 columns">\
              <div class="row graph_legend">\
                <h3 class="subheader"><small>'+tr("CPU")+'</small></h3>\
              </div>\
              <div class="row">\
                <div class="large-10 columns centered graph" id="host_cpu_graph" style="height: 100px;">\
                </div>\
              </div>\
              <div class="row graph_legend">\
                <div class="large-10 columns centered" id="host_cpu_legend">\
                </div>\
              </div>\
            </div>\
            <div class="large-6 columns">\
              <div class="row graph_legend">\
                <h3 class="subheader"><small>'+tr("MEMORY")+'</small></h3>\
              </div>\
              <div class="row">\
                <div class="large-10 columns centered graph" id="host_mem_graph" style="height: 100px;">\
                </div>\
              </div>\
              <div class="row graph_legend">\
                <div class="large-10 columns centered" id="host_mem_legend">\
                </div>\
              </div>\
            </div>\
        </div>'
    }

    var vms_info_tab = {
        title: tr("VMs"),
        icon: "fa-cloud",
        content : '<div id="datatable_host_vms_info_div" class="row">\
          <div class="large-12 columns">\
            <table id="datatable_host_vms" class="datatable twelve">\
              <thead>\
                <tr>\
                  <th class="check"><input type="checkbox" class="check_all" value=""></input></th>\
                  <th>'+tr("ID")+'</th>\
                  <th>'+tr("Owner")+'</th>\
                  <th>'+tr("Group")+'</th>\
                  <th>'+tr("Name")+'</th>\
                  <th>'+tr("Status")+'</th>\
                  <th>'+tr("Used CPU")+'</th>\
                  <th>'+tr("Used Memory")+'</th>\
                  <th>'+tr("Host")+'</th>\
                  <th>'+tr("IPs")+'</th>\
                  <th>'+tr("Start Time")+'</th>\
                  <th>'+tr("VNC")+'</th>\
                </tr>\
              </thead>\
              <tbody id="tbody_host_vmachines">\
              </tbody>\
            </table>\
          </div>\
          </div>'
    }

    //Sunstone.updateInfoPanelTab(info_panel_name,tab_name, new tab object);
    Sunstone.updateInfoPanelTab("host_info_panel","host_info_tab",info_tab);
    Sunstone.updateInfoPanelTab("host_info_panel","host_monitoring_tab",monitor_tab);
    Sunstone.updateInfoPanelTab("host_info_panel","host_vms_tab",vms_info_tab);

    Sunstone.popUpInfoPanel("host_info_panel", "hosts-tab");

    var dataTable_host_vMachines = $("#datatable_host_vms", $("#host_info_panel")).dataTable({
        "bSortClasses" : false,
        "bDeferRender": true,
        "aoColumnDefs": [
            { "bSortable": false, "aTargets": ["check",6,7,11] },
            { "sWidth": "35px", "aTargets": [0] },
            { "bVisible": false, "aTargets": [0]},
            { "bVisible": true, "aTargets": Config.tabTableColumns("vms-tab")},
            { "bVisible": false, "aTargets": ['_all']},
        ]
    });

    infoListener(dataTable_host_vMachines,'VM.show','vms-tab');

    if (host_info.VMS) {

        var vm_ids = host_info.VMS.ID;
        var vm_ids_map = {};

        if (!(vm_ids instanceof Array)) {
            vm_ids = [vm_ids];
        }

        $.each(vm_ids,function(){
            vm_ids_map[this] = true;
        });

        OpenNebula.VM.list({
            timeout: true,
            success: function (request, vm_list){
                var vm_list_array = [];

                $.each(vm_list,function(){
                    if (vm_ids_map[this.VM.ID]){
                        //Grab table data from the vm_list
                        vm_list_array.push(vMachineElementArray(this));
                    }
                });

                updateView(vm_list_array, dataTable_host_vMachines);
            },
            error: onError
        });
    }

    // TODO: re-use Host.pool_monitor data?

    //pop up panel while we retrieve the graphs

    Sunstone.runAction("Host.monitor",host_info.ID,
        {monitor_resources : "HOST_SHARE/CPU_USAGE,HOST_SHARE/USED_CPU,HOST_SHARE/MAX_CPU,HOST_SHARE/MEM_USAGE,HOST_SHARE/USED_MEM,HOST_SHARE/MAX_MEM"});
}

//Prepares the host creation dialog
function setupCreateHostDialog(){
    if ($('#create_host_dialog').length == 0) {
        dialogs_context.append('<div id="create_host_dialog"></div>');
    }

    $('div#create_host_dialog').html(create_host_tmpl);
    $create_host_dialog =  $('#create_host_dialog');

    $create_host_dialog.addClass("reveal-modal medium").attr("data-reveal", "");
    $create_host_dialog.foundation()

    // Show custom driver input only when custom is selected in selects
    $('input[name="custom_vmm_mad"],'+
       'input[name="custom_im_mad"],'+
       'input[name="custom_vnm_mad"]',$create_host_dialog).parent().hide();

    $('select#vmm_mad',$create_host_dialog).change(function(){
        if ($(this).val()=="custom")
            $('input[name="custom_vmm_mad"]').parent().show();
        else
            $('input[name="custom_vmm_mad"]').parent().hide();
    });

    $('select#im_mad',$create_host_dialog).change(function(){
        if ($(this).val()=="custom")
            $('input[name="custom_im_mad"]').parent().show();
        else
            $('input[name="custom_im_mad"]').parent().hide();
    });

    $('select#vnm_mad',$create_host_dialog).change(function(){
        if ($(this).val()=="custom")
            $('input[name="custom_vnm_mad"]').parent().show();
        else
            $('input[name="custom_vnm_mad"]').parent().hide();
    });

    //Handle the form submission
    $('#create_host_form',$create_host_dialog).submit(function(){
        var name = $('#name',this).val();
        if (!name){
            notifyError(tr("Host name missing!"));
            return false;
        }

        var cluster_id = $('#host_cluster_id .resource_list_select',this).val();
        if (!cluster_id) cluster_id = "-1";

        var vmm_mad = $('select#vmm_mad',this).val();
        vmm_mad = vmm_mad == "custom" ? $('input[name="custom_vmm_mad"]').val() : vmm_mad;
        var im_mad = $('select#im_mad',this).val();
        im_mad = im_mad == "custom" ? $('input[name="custom_im_mad"]').val() : im_mad;
        var vnm_mad = $('select#vnm_mad',this).val();
        vnm_mad = vnm_mad == "custom" ? $('input[name="custom_vnm_mad"]').val() : vnm_mad;

        var host_json = {
            "host": {
                "name": name,
                "vm_mad": vmm_mad,
                "vnm_mad": vnm_mad,
                "im_mad": im_mad,
                "cluster_id": cluster_id
            }
        };

        //Create the OpenNebula.Host.
        //If it is successfull we refresh the list.
        Sunstone.runAction("Host.create",host_json);
        return false;
    });
}

//Open creation dialogs
function popUpCreateHostDialog(){
    var cluster_id = $('#host_cluster_id .resource_list_select',$('div#create_host_dialog')).val();
    if (!cluster_id) cluster_id = "-1";

    insertSelectOptions('#host_cluster_id',$('div#create_host_dialog'), "Cluster", cluster_id, false);

    $('div#create_host_dialog').foundation('reveal', 'open');
    $("input#name",$('div#create_host_dialog')).focus();
    return false;
}

// Call back when individual host history monitoring fails
function hostMonitorError(req,error_json){
    var message = error_json.error.message;
    var info = req.request.data[0].monitor;
    var labels = info.monitor_resources;
    var id_suffix = labels.replace(/,/g,'_');
    var id = '#host_monitor_'+id_suffix;
    $('#host_monitoring_tab '+id).html('<div style="padding-left:20px;">'+message+'</div>');
}

//This is executed after the sunstone.js ready() is run.
//Here we can basicly init the host datatable, preload it
//and add specific listeners
$(document).ready(function(){
    var tab_name = 'hosts-tab';

    if (Config.isTabEnabled(tab_name)) {
      //prepare host datatable
      dataTable_hosts = $("#datatable_hosts",main_tabs_context).dataTable({
            "bSortClasses" : false,
            "bDeferRender": true,
            "aoColumnDefs": [
              { "bSortable": false, "aTargets": ["check",5,6,7,8] },
              { "sWidth": "35px", "aTargets": [0] }, //check, ID, RVMS, Status,
              { "bVisible": true, "aTargets": Config.tabTableColumns(tab_name)},
              { "bVisible": false, "aTargets": ['_all']}
          ]
      });

      $('#hosts_search').keyup(function(){
        dataTable_hosts.fnFilter( $(this).val() );
      })

      dataTable_hosts.on('draw', function(){
        recountCheckboxes(dataTable_hosts);
      })

      Sunstone.runAction("Host.list");

      setupCreateHostDialog();

      initCheckAllBoxes(dataTable_hosts);
      tableCheckboxesListener(dataTable_hosts);
      infoListener(dataTable_hosts, "Host.show");

      // This listener removes any filter on hosts table when its menu item is
      // selected. The cluster plugins will filter hosts when the hosts
      // in a cluster are shown. So we have to make sure no filter has been
      // left in place when we want to see all hosts.
      $('div#menu li#li_hosts_tab').live('click',function(){
          dataTable_hosts.fnFilter('',3);
      });

      // Hide help
      $('div#hosts_tab div.legend_div',main_tabs_context).hide();

      dataTable_hosts.fnSort( [ [1,config['user_config']['table_order']] ] );
    }
});
