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
        <label for="host_type">' +  tr("Type") + '</label>\
        <select id="host_type_mad" name="host_type">\
              <option value="kvm">' + tr("KVM") + '</option>\
              <option value="xen">' + tr("XEN") + '</option>\
              <option value="vmware">' + tr("VMware") + '</option>\
              <option value="vcenter">' + tr("vCenter") + '</option>\
              <option value="az">' + tr("Microsoft Azure") + '</option>\
              <option value="ec2">' + tr("Amazon EC2") + '</option>\
              <option value="sl">' + tr("IBM Softlayer") + '</option>\
              <option value="dummy">' + tr("Dummy") + '</option>\
              <option value="custom">' + tr("Custom") + '</option>\
        </select>\
    </div>\
    <div class="large-6 columns" id="cluster_select">\
      <label for="host_cluster_id">' + tr("Cluster") + '</label>\
      <div id="host_cluster_id" name="host_cluster_id">\
      </div>\
    </div>\
  </div>\
  <div class="row">\
    <div class="large-6 columns" id="name_container">\
      <label for="name">' + tr("Hostname")  + '</label>\
      <input type="text" name="name" id="name" />\
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
  <div class="drivers">\
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
                      <option value="vcenter">' + tr("vCenter") + '</option>\
                      <option value="az">' + tr("Microsoft Azure") + '</option>\
                      <option value="ec2">' + tr("Amazon EC2") + '</option>\
                      <option value="sl">' + tr("IBM Softlayer") + '</option>\
                      <option value="dummy">' + tr("Dummy") + '</option>\
                      <option value="custom">' + tr("Custom") + '</option>\
                </select>\
            </div>\
            <div class="large-12 columns">\
                <label>' + tr("Custom VMM_MAD") + '</label>\
                <input type="text" name="custom_vmm_mad" />\
            </div>\
          </div>\
        </div>\
        <div class="large-6 columns">\
          <div class="manager clear row" id="im_mads">\
            <div class="large-12 columns">\
                <label for="im">' +  tr("Information") + '</label>\
                <select id="im_mad" name="im">\
                     <option value="kvm">' + tr("KVM") + '</option>\
                     <option value="xen">' + tr("XEN") + '</option>\
                     <option value="vmware">' + tr("VMware") + '</option>\
                     <option value="vcenter">' + tr("vCenter") + '</option>\
                      <option value="az">' + tr("Microsoft Azure") + '</option>\
                      <option value="ec2">' + tr("Amazon EC2") + '</option>\
                      <option value="sl">' + tr("IBM Softlayer") + '</option>\
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
      </div>\
    </fieldset>\
  </div>\
  <div class="row vcenter_credentials hidden">\
    <fieldset>\
      <legend>'+tr("vCenter")+'</legend>\
      <div class="row">\
        <div class="large-6 columns">\
          <label for="vcenter_user">' + tr("User")  + '</label>\
          <input type="text" name="vcenter_user" id="vcenter_user" />\
        </div>\
        <div class="large-6 columns">\
          <label for="vcenter_host">' + tr("Hostname")  + '</label>\
          <input type="text" name="vcenter_host" id="vcenter_host" />\
        </div>\
      </div>\
      <div class="row">\
        <div class="large-6 columns">\
          <label for="vcenter_password">' + tr("Password")  + '</label>\
          <input type="password" name="vcenter_password" id="vcenter_password" />\
        </div>\
        <div class="large-6 columns">\
          <br>\
          <a class="button radius small right" id="get_vcenter_clusters">'+tr("Get vCenter Clusters")+'</a>\
        </div>\
      </div>\
      <div class="vcenter_clusters">\
      </div>\
      <br>\
      <div class="vcenter_templates">\
      </div>\
      <br>\
      <div class="vcenter_networks">\
      </div>\
      <div class="row import_vcenter_clusters_div hidden">\
        <div class="large-12 columns">\
          <br>\
          <a class="button radius small right success" id="import_vcenter_clusters">'+tr("Import")+'</a>\
        </div>\
      </div>\
    </fieldset>\
  </div>\
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
var on_hosts = 0;
var off_hosts = 0;
var error_hosts = 0;


//Setup actions
var host_actions = {

    "Host.create" : {
        type: "create",
        call : OpenNebula.Host.create,
        callback : function(request, response) {
            // Reset the create wizard
            addHostElement(request, response);
            notifyCustom(tr("Host created"), " ID: " + response.HOST.ID, false);

            if (request.request.data[0].host.vm_mad != "vcenter") {
              $create_host_dialog.foundation('reveal', 'close');
            }
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
                $(".right-info-tabs > dd.active > a", "#hosts-tab").trigger("click");
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
                OpenNebula.Host.show({
                    data : {
                        id: host
                    },
                    success: function (request, host_info){
                        var current_cluster = host_info.HOST.CLUSTER_ID;

                        if(current_cluster != -1){
                            OpenNebula.Cluster.delhost({
                                data: {
                                    id: current_cluster,
                                    extra_param: host
                                },
                                success: function(){
                                    OpenNebula.Helper.clear_cache("HOST");
                                    Sunstone.runAction('Host.show',host);
                                },
                                error: onError
                            });
                        } else {
                            OpenNebula.Helper.clear_cache("HOST");
                            Sunstone.runAction('Host.show',host);
                        }
                    },
                    error: onError
                });
            } else {
                OpenNebula.Cluster.addhost({
                    data: {
                        id: cluster,
                        extra_param: host
                    },
                    success: function(){
                        OpenNebula.Helper.clear_cache("HOST");
                        Sunstone.runAction('Host.show',host);
                    },
                    error: onError
                });
            }
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
    search_input: '<input id="hosts_search" type="search" placeholder="'+tr("Search")+'" />',
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

function generateCPUProgressBar(host, host_share_flag) {
    var host_share = host_share_flag ? host : host.HOST_SHARE;
    var max_cpu = parseInt(host_share.MAX_CPU);

    var info_str;

    var pb_allocated_cpu
    if (host_share.CPU_USAGE) {
      var allocated_cpu = parseInt(host_share.CPU_USAGE);

      if (max_cpu > 0) {
          var ratio_allocated_cpu = Math.round((allocated_cpu / max_cpu) * 100);
          info_str = allocated_cpu + ' / ' + max_cpu + ' (' + ratio_allocated_cpu + '%)';
      } else {
          info_str = "";
      }

      pb_allocated_cpu = quotaBarHtml(allocated_cpu, max_cpu, info_str);
    }

    var pb_real_cpu
    if (host_share.USED_CPU) {
      var real_cpu = parseInt(host_share.USED_CPU);

      if (max_cpu > 0) {
          var ratio_real_cpu = Math.round((real_cpu / max_cpu) * 100);
          info_str = real_cpu + ' / ' + max_cpu + ' (' + ratio_real_cpu + '%)';
      } else {
          info_str = "";
      }

      pb_real_cpu = quotaBarHtml(real_cpu, max_cpu, info_str);
    }

    return {
      real: pb_real_cpu,
      allocated: pb_allocated_cpu
    }
}

function generateMEMProgressBar(host, host_share_flag) {
    var host_share = host_share_flag ? host : host.HOST_SHARE;
    // Generate MEM progress bars
    var max_mem = parseInt(host_share.MAX_MEM);

    var pb_allocated_mem;
    if (host_share.MEM_USAGE) {
      var allocated_mem = parseInt(host_share.MEM_USAGE);

      if (max_mem > 0) {
          var ratio_allocated_mem = Math.round((allocated_mem / max_mem) * 100);
          info_str = humanize_size(allocated_mem) + ' / ' + humanize_size(max_mem) + ' (' + ratio_allocated_mem + '%)';
      } else {
          info_str = humanize_size(allocated_mem) + ' / -';
      }

      pb_allocated_mem = quotaBarHtml(allocated_mem, max_mem, info_str);
    }

    var pb_real_mem;
    if (host_share.USED_MEM) {
      var real_mem = parseInt(host_share.USED_MEM);

      if (max_mem > 0) {
          var ratio_real_mem = Math.round((real_mem / max_mem) * 100);
          info_str = humanize_size(real_mem) + ' / ' + humanize_size(max_mem) + ' (' + ratio_real_mem + '%)';
      } else {
          info_str = humanize_size(real_mem) + ' / -';
      }

      pb_real_mem = quotaBarHtml(real_mem, max_mem, info_str);
    }

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
        info_str = "- / -";
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
        info_str = "- / -";
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

    var ratio_real_mem = 0;
    if (max_mem > 0) {
        ratio_real_mem = Math.round((real_mem / max_mem) * 100);
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

    $(".resource-info-header", $("#hosts-tab")).html(host_info.NAME);

    var cpu_bars = generateCPUProgressBar(host_info);
    var mem_bars = generateMEMProgressBar(host_info);

    // Get rid of the unwanted (for show) HOST keys
    var stripped_host_template = {};
    var unshown_values         = {};

    if (host_info.TEMPLATE.HYPERVISOR && host_info.TEMPLATE.HYPERVISOR.toLowerCase() != "vcenter")
    {
      stripped_host_template = host_info.TEMPLATE;
    }
    else
    {
      for (key in host_info.TEMPLATE)
          if(!key.match(/HOST/))
              stripped_host_template[key]=host_info.TEMPLATE[key];
          else
              unshown_values[key]=host_info.TEMPLATE[key];
    }

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
          + insert_extended_template_table(stripped_host_template,
                                           "Host",
                                           host_info.ID,
                                           "Attributes",
                                           unshown_values) +
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

    var esx_info_tab = {
        title: tr("ESX"),
        icon: "fa-hdd-o",
        content : '<div id="datatable_host_esx_info_div" class="row">\
          <div class="large-12 columns">\
            <table id="datatable_host_esx" class="datatable twelve">\
              <thead>\
                <tr>\
                  <th>' + tr("Hostname") + '</th>\
                  <th>' + tr("Status") + '</th>\
                  <th>' + tr("Real CPU") + '</th>\
                  <th>' + tr("Real Memory") + '</th>\
                </tr>\
              </thead>\
              <tbody id="tbody_host_esx">\
              </tbody>\
            </table>\
          </div>\
          </div>'
    }

    //Sunstone.updateInfoPanelTab(info_panel_name,tab_name, new tab object);
    Sunstone.updateInfoPanelTab("host_info_panel","host_info_tab",info_tab);
    Sunstone.updateInfoPanelTab("host_info_panel","host_monitoring_tab",monitor_tab);
    Sunstone.updateInfoPanelTab("host_info_panel","host_vms_tab",vms_info_tab);

    if (host_info.TEMPLATE.HYPERVISOR == "vcenter") {
      Sunstone.updateInfoPanelTab("host_info_panel","host_esx_tab",esx_info_tab);
    }

    Sunstone.popUpInfoPanel("host_info_panel", "hosts-tab");

    if (host_info.TEMPLATE.HYPERVISOR == "vcenter") {
      var dataTable_esx_hosts = $("#datatable_host_esx",main_tabs_context).dataTable({
            "bSortClasses" : false,
            "bDeferRender": true
      });

      var host_list_array = [];

      if (host_info.TEMPLATE.HOST) {
        if (!(host_info.TEMPLATE.HOST instanceof Array)) {
          host_info.TEMPLATE.HOST = [host_info.TEMPLATE.HOST];
        }

        if (host_info.TEMPLATE.HOST instanceof Array) {
          $.each(host_info.TEMPLATE.HOST, function(){
            var cpu_bars = generateCPUProgressBar(this, true);
            var mem_bars = generateMEMProgressBar(this, true);

            host_list_array.push([
                this.HOSTNAME,
                this.STATE,
                cpu_bars.real,
                mem_bars.real
            ]);
          });
        }

        dataTable_esx_hosts.fnAddData(host_list_array);
        delete host_info.TEMPLATE.HOST;
      }
    }

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

    $("[href='#host_monitoring_tab']").on("click", function(){
      Sunstone.runAction("Host.monitor",host_info.ID,
          {monitor_resources : "HOST_SHARE/CPU_USAGE,HOST_SHARE/USED_CPU,HOST_SHARE/MAX_CPU,HOST_SHARE/MEM_USAGE,HOST_SHARE/USED_MEM,HOST_SHARE/MAX_MEM"});
    });
}

/*
  Retrieve the list of templates from vCenter and fill the container with them

  opts = {
    datacenter: "Datacenter Name",
    cluster: "Cluster Name",
    container: Jquery div to inject the html,
    vcenter_user: vCenter Username,
    vcenter_password: vCenter Password,
    vcenter_host: vCenter Host
  }
 */
function fillVCenterTemplates(opts) {
  var path = '/vcenter/templates';
  opts.container.html(generateAdvancedSection({
    html_id: path,
    title: tr("Templates"),
    content: '<span class="fa-stack fa-2x" style="color: #dfdfdf">'+
      '<i class="fa fa-cloud fa-stack-2x"></i>'+
      '<i class="fa  fa-spinner fa-spin fa-stack-1x fa-inverse"></i>'+
    '</span>'
  }))

  $('a', opts.container).trigger("click")

  $.ajax({
      url: path,
      type: "GET",
      data: {timeout: false},
      dataType: "json",
      headers: {
        "X_VCENTER_USER": opts.vcenter_user,
        "X_VCENTER_PASSWORD": opts.vcenter_password,
        "X_VCENTER_HOST": opts.vcenter_host
      },
      success: function(response){
        $(".content", opts.container).html("");

        $('<div class="row">' +
            '<div class="large-12 columns">' +
              '<p style="color: #999">' + tr("Please select the vCenter Templates to be imported to OpenNebula.") + '</p>' +
            '</div>' +
          '</div>').appendTo($(".content", opts.container))

        $.each(response, function(datacenter_name, templates){
          $('<div class="row">' +
              '<div class="large-12 columns">' +
                '<h5>' +
                  datacenter_name + ' ' + tr("DataCenter") +
                '</h5>' +
              '</div>' +
            '</div>').appendTo($(".content", opts.container))

          if (templates.length == 0) {
              $('<div class="row">' +
                  '<div class="large-12 columns">' +
                    '<label>' +
                      tr("No new templates found in this DataCenter") +
                    '</label>' +
                  '</div>' +
                '</div>').appendTo($(".content", opts.container))
          } else {
            $.each(templates, function(id, template){
              var trow = $('<div class="vcenter_template">' +
                  '<div class="row">' +
                    '<div class="large-10 columns">' +
                      '<label>' +
                        '<input type="checkbox" class="template_name" checked/> ' +
                        template.name + '&emsp;<span style="color: #999">' + template.host + '</span>' +
                      '</label>' +
                      '<div class="large-12 columns vcenter_template_response">'+
                      '</div>'+
                    '</div>' +
                    '<div class="large-2 columns vcenter_template_result">'+
                    '</div>'+
                  '</div>'+
                '</div>').appendTo($(".content", opts.container))

              $(".template_name", trow).data("template_name", template.name)
              $(".template_name", trow).data("one_template", template.one)
            });
          };
        });
      },
      error: function(response){
        opts.container.html("");
        onError({}, OpenNebula.Error(response));
      }
  });

  return false;
}

/*
  Retrieve the list of networks from vCenter and fill the container with them
  
  opts = {
    datacenter: "Datacenter Name",
    cluster: "Cluster Name",
    container: Jquery div to inject the html,
    vcenter_user: vCenter Username,
    vcenter_password: vCenter Password,
    vcenter_host: vCenter Host
  }
 */
function fillVCenterNetworks(opts) {
  var path = '/vcenter/networks';
  opts.container.html(generateAdvancedSection({
    html_id: path,
    title: tr("Networks"),
    content: '<span class="fa-stack fa-2x" style="color: #dfdfdf">'+
      '<i class="fa fa-cloud fa-stack-2x"></i>'+
      '<i class="fa  fa-spinner fa-spin fa-stack-1x fa-inverse"></i>'+
    '</span>'
  }))

  $('a', opts.container).trigger("click")

  $.ajax({
      url: path,
      type: "GET",
      data: {timeout: false},
      dataType: "json",
      headers: {
        "X_VCENTER_USER": opts.vcenter_user,
        "X_VCENTER_PASSWORD": opts.vcenter_password,
        "X_VCENTER_HOST": opts.vcenter_host
      },
      success: function(response){
        $(".content", opts.container).html("");

        $('<div class="row">' +
            '<div class="large-12 columns">' +
              '<p style="color: #999">' + tr("Please select the vCenter Networks to be imported to OpenNebula.") + '</p>' +
            '</div>' +
          '</div>').appendTo($(".content", opts.container))

        $.each(response, function(datacenter_name, networks){
          $('<div class="row">' +
              '<div class="large-12 columns">' +
                '<h5>' +
                  datacenter_name + ' ' + tr("DataCenter") +
                '</h5>' +
              '</div>' +
            '</div>').appendTo($(".content", opts.container))

          if (networks.length == 0) {
              $('<div class="row">' +
                  '<div class="large-12 columns">' +
                    '<label>' +
                      tr("No new networks found in this DataCenter") +
                    '</label>' +
                  '</div>' +
                '</div>').appendTo($(".content", opts.container))
          } else {
            $.each(networks, function(id, network){
              var netname = network.name.replace(" ","_");

              var trow = $('<div class="vcenter_network">' +
                  '<div class="row">' +
                    '<div class="large-10 columns">' +
                      '<div class="large-12 columns">' +
                        '<label>' +
                          '<input type="checkbox" class="network_name" checked/> ' +
                          network.name + '&emsp;<span style="color: #999">' + network.type + '</span>' + 
                        '</label>' +
                      '</div>'+
                      '<div class="large-2 columns">'+
                        '<label>' + tr("SIZE") +
                          '<input type="text" class="netsize" value="255"/>' +
                        '</label>' +
                      '</div>'+
                      '<div class="large-2 columns">'+
                        '<label>' + tr("TYPE") +
                          '<select class="type_select">'+
                            '<option value="ETHER">eth</option>' +
                            '<option value="IP4">ipv4</option>'+
                            '<option value="IP6">ipv6</option>' + 
                          '</select>' + 
                        '</label>' +
                      '</div>'+
                      '<div class="net_options">' +
                        '<div class="large-4 columns">'+
                          '<label>' + tr("MAC") + 
                            '<input type="text" class="eth_mac_net" placeholder="'+tr("Optional")+'"/>' + 
                          '</label>'+
                        '</div>'+
                      '</div>'+
                      '<div class="large-12 columns vcenter_network_response">'+
                      '</div>'+
                    '</div>' +
                    '<div class="large-2 columns vcenter_network_result">'+
                    '</div>'+
                  '</div>'+
                '</div>').appendTo($(".content", opts.container))


              $('.type_select', trow).on("change",function(){
                  var network_context = $(this).closest(".vcenter_network");
                  var type = $(this).val();

                  var net_form_str = ''

                  switch(type) {
                      case 'ETHER':
                          net_form_str = 
                            '<div class="large-4 columns">'+
                              '<label>' + tr("MAC") + 
                                '<input type="text" class="eth_mac_net" placeholder="'+tr("Optional")+'"/>' + 
                              '</label>'+
                            '</div>';
                          break;
                      case 'IP4':
                          net_form_str = 
                            '<div class="large-4 columns">'+
                              '<label>' + tr("IP START") + 
                                '<input type="text" class="four_ip_net"/>' + 
                              '</label>'+
                            '</div>'+
                            '<div class="large-4 columns">'+
                              '<label>' + tr("MAC") + 
                                '<input type="text" class="eth_mac_net" placeholder="'+tr("Optional")+'"/>' + 
                              '</label>'+
                            '</div>';
                          break;
                      case 'IP6':
                          net_form_str = 
                            '<div class="large-4 columns">'+
                              '<label>' + tr("MAC") + 
                                '<input type="text" class="eth_mac_net"/>' + 
                              '</label>'+
                            '</div>'+
                            '<div class="large-6 columns">'+
                              '<label>' + tr("GLOBAL PREFIX") + 
                                '<input type="text" class="six_global_net" placeholder="'+tr("Optional")+'"/>' + 
                              '</label>'+
                            '</div>'+
                            '<div class="large-6 columns">'+
                              '<label>' + tr("ULA_PREFIX") + 
                                '<input type="text" class="six_ula_net" placeholder="'+tr("Optional")+'"/>' + 
                              '</label>'+
                            '</div>';
                          break;
                  }

                  $('.net_options', network_context).html(net_form_str);
              });

              $(".network_name", trow).data("network_name", netname)
              $(".network_name", trow).data("one_network", network.one)
            });
          };
        });
      },
      error: function(response){
        opts.container.html("");
        onError({}, OpenNebula.Error(response));
      }
  });

  return false;
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

    $("#wizard_host_reset_button", $create_host_dialog).on("click", function(){
      resetCreateHostDialog();
    })

    $(".drivers", $create_host_dialog).hide();

    $("#host_type_mad", $create_host_dialog).on("change", function(){
      $("#vmm_mad", $create_host_dialog).val(this.value).change();
      $("#im_mad", $create_host_dialog).val(this.value).change();

      if (this.value == "custom") {
        $(".vcenter_credentials", $create_host_dialog).hide();
        $("#vnm_mads", $create_host_dialog).show();
        $("#name_container", $create_host_dialog).show();
        $("#create_host_submit", $create_host_dialog).show();
        $(".drivers", $create_host_dialog).show();
      } else if (this.value == "vcenter") {
        $("#vnm_mads", $create_host_dialog).hide();
        $("#name_container", $create_host_dialog).hide();
        $(".vcenter_credentials", $create_host_dialog).show();
        $("#create_host_submit", $create_host_dialog).hide();
        $(".drivers", $create_host_dialog).hide();
      } else {
        $(".vcenter_credentials", $create_host_dialog).hide();
        $("#vnm_mads", $create_host_dialog).show();
        $("#name_container", $create_host_dialog).show();
        $("#create_host_submit", $create_host_dialog).show();
        $(".drivers", $create_host_dialog).hide();
      }
    })

    $("#get_vcenter_clusters", $create_host_dialog).on("click", function(){
      // TODO notify if credentials empty
      var container = $(".vcenter_clusters", $create_host_dialog); 

      container.html(generateAdvancedSection({
        html_id: "/vcenter",
        title: tr("Clusters"),
        content: '<span class="fa-stack fa-2x" style="color: #dfdfdf">'+
          '<i class="fa fa-cloud fa-stack-2x"></i>'+
          '<i class="fa  fa-spinner fa-spin fa-stack-1x fa-inverse"></i>'+
        '</span>'
      }))

      $('a', container).trigger("click")

      $.ajax({
          url: '/vcenter',
          type: "GET",
          data: {timeout: false},
          dataType: "json",
          headers: {
            "X_VCENTER_USER": $("#vcenter_user", $create_host_dialog).val(),
            "X_VCENTER_PASSWORD": $("#vcenter_password", $create_host_dialog).val(),
            "X_VCENTER_HOST": $("#vcenter_host", $create_host_dialog).val()
          },
          success: function(response){
              $("#vcenter_user", $create_host_dialog).attr("disabled", "disabled")
              $("#vcenter_password", $create_host_dialog).attr("disabled", "disabled")
              $("#vcenter_host", $create_host_dialog).attr("disabled", "disabled")
              $("#get_vcenter_clusters", $create_host_dialog).hide();
              $(".import_vcenter_clusters_div", $create_host_dialog).show();

              $(".content", container).html("");

              $('<div class="row">' +
                  '<div class="large-12 columns">' +
                    '<p style="color: #999">' + tr("Please select the vCenter Clusters to be imported to OpenNebula. Each vCenter Cluster will be included as a new OpenNebula Host") + '</p>' +
                  '</div>' +
                '</div>').appendTo($(".content", container))

              $.each(response, function(datacenter_name, clusters){
                $('<div class="row">' +
                    '<div class="large-12 columns">' +
                      '<h5>' +
                        datacenter_name + ' ' + tr("Datacenter") +
                      '</h5>' +
                    '</div>' +
                  '</div>').appendTo($(".content", container))

                if (clusters.length == 0) {
                    $('<div class="row">' +
                        '<div class="large-12 columns">' +
                          '<label>' +
                            tr("No clusters found in this DataCenter") +
                          '</label>' +
                        '</div>' +
                      '</div>').appendTo($(".content", container))
                } else {
                  $.each(clusters, function(id, cluster_name){
                    var row = $('<div class="vcenter_cluster">' +
                        '<div class="row">' +
                          '<div class="large-10 columns">' +
                            '<label>' +
                              '<input type="checkbox" class="cluster_name"/> ' +
                              cluster_name +
                            '</label>' +
                            '<div class="large-12 columns vcenter_host_response">'+
                            '</div>'+
                          '</div>' +
                          '<div class="large-2 columns vcenter_host_result">'+
                          '</div>'+
                        '</div>'+
                      '</div>').appendTo($(".content", container))

                    $(".cluster_name", row).data("cluster_name", cluster_name)
                    $(".cluster_name", row).data("datacenter_name", datacenter_name)
                  });
                }
              });

              var templates_container = $(".vcenter_templates", $create_host_dialog);
              var networks_container = $(".vcenter_networks", $create_host_dialog);

              var vcenter_user = $("#vcenter_user", $create_host_dialog).val();
              var vcenter_password = $("#vcenter_password", $create_host_dialog).val();
              var vcenter_host = $("#vcenter_host", $create_host_dialog).val();

              fillVCenterTemplates({
                container: templates_container,
                vcenter_user: vcenter_user,
                vcenter_password: vcenter_password,
                vcenter_host: vcenter_host
              });

              fillVCenterNetworks({
                container: networks_container,
                vcenter_user: vcenter_user,
                vcenter_password: vcenter_password,
                vcenter_host: vcenter_host
              });
          },
          error: function(response){
            $(".vcenter_clusters", $create_host_dialog).html('')
            onError({}, OpenNebula.Error(response));
          }
      });

      return false;
    })


    $("#import_vcenter_clusters", $create_host_dialog).on("click", function(){
      $(this).hide();

      var cluster_id = $('#host_cluster_id .resource_list_select', $create_host_dialog).val();
      if (!cluster_id) cluster_id = "-1";

      $.each($(".cluster_name:checked", $create_host_dialog), function(){
        var cluster_context = $(this).closest(".vcenter_cluster");
        $(".vcenter_host_result:not(.success)", cluster_context).html('<span class="fa-stack fa-2x" style="color: #dfdfdf">'+
              '<i class="fa fa-cloud fa-stack-2x"></i>'+
              '<i class="fa  fa-spinner fa-spin fa-stack-1x fa-inverse"></i>'+
            '</span>');

        var host_json = {
            "host": {
                "name": $(this).data("cluster_name"),
                "vm_mad": "vcenter",
                "vnm_mad": "dummy",
                "im_mad": "vcenter",
                "cluster_id": cluster_id
            }
        };

        OpenNebula.Host.create({
            timeout: true,
            data: host_json,
            success: function(request, response) {
              OpenNebula.Helper.clear_cache("HOST");

              $(".vcenter_host_result", cluster_context).addClass("success").html(
                  '<span class="fa-stack fa-2x" style="color: #dfdfdf">'+
                    '<i class="fa fa-cloud fa-stack-2x"></i>'+
                    '<i class="fa  fa-check fa-stack-1x fa-inverse"></i>'+
                  '</span>');

              $(".vcenter_host_response", cluster_context).html('<p style="font-size:12px" class="running-color">'+
                    tr("Host created successfully")+' ID:'+response.HOST.ID+
                  '</p>');

              var template_raw =
                "VCENTER_USER=\"" + $("#vcenter_user", $create_host_dialog).val() + "\"\n" +
                "VCENTER_PASSWORD=\"" + $("#vcenter_password", $create_host_dialog).val() + "\"\n" +
                "VCENTER_HOST=\"" + $("#vcenter_host", $create_host_dialog).val() + "\"\n";

              Sunstone.runAction("Host.update_template", response.HOST.ID, template_raw);
              addHostElement(request, response);
            },
            error: function (request, error_json){
                $(".vcenter_host_result",  $create_host_dialog).html('<span class="fa-stack fa-2x" style="color: #dfdfdf">'+
                      '<i class="fa fa-cloud fa-stack-2x"></i>'+
                      '<i class="fa  fa-warning fa-stack-1x fa-inverse"></i>'+
                    '</span>');

                $(".vcenter_host_response",  $create_host_dialog).html('<p style="font-size:12px" class="error-color">'+
                      (error_json.error.message || tr("Cannot contact server: is it running and reachable?"))+
                    '</p>');
            }
        });
      })

      $.each($(".template_name:checked", $create_host_dialog), function(){
        var template_context = $(this).closest(".vcenter_template");

        $(".vcenter_template_result:not(.success)", template_context).html(
            '<span class="fa-stack fa-2x" style="color: #dfdfdf">'+
              '<i class="fa fa-cloud fa-stack-2x"></i>'+
              '<i class="fa  fa-spinner fa-spin fa-stack-1x fa-inverse"></i>'+
            '</span>');

        var template_json = {
          "vmtemplate": {
            "template_raw": $(this).data("one_template")
          }
        };

        OpenNebula.Template.create({
            timeout: true,
            data: template_json,
            success: function(request, response) {
              OpenNebula.Helper.clear_cache("VMTEMPLATE");
              $(".vcenter_template_result", template_context).addClass("success").html(
                  '<span class="fa-stack fa-2x" style="color: #dfdfdf">'+
                    '<i class="fa fa-cloud fa-stack-2x"></i>'+
                    '<i class="fa  fa-check fa-stack-1x fa-inverse"></i>'+
                  '</span>');

              $(".vcenter_template_response", template_context).html('<p style="font-size:12px" class="running-color">'+
                    tr("Template created successfully")+' ID:'+response.VMTEMPLATE.ID+
                  '</p>');
            },
            error: function (request, error_json){
                $(".vcenter_template_result", template_context).html('<span class="fa-stack fa-2x" style="color: #dfdfdf">'+
                      '<i class="fa fa-cloud fa-stack-2x"></i>'+
                      '<i class="fa  fa-warning fa-stack-1x fa-inverse"></i>'+
                    '</span>');

                $(".vcenter_template_response", template_context).html('<p style="font-size:12px" class="error-color">'+
                      (error_json.error.message || tr("Cannot contact server: is it running and reachable?"))+
                    '</p>');
            }
        });
      })

      $.each($(".network_name:checked", $create_host_dialog), function(){
        var network_context = $(this).closest(".vcenter_network");

        $(".vcenter_network_result:not(.success)", network_context).html(
            '<span class="fa-stack fa-2x" style="color: #dfdfdf">'+
              '<i class="fa fa-cloud fa-stack-2x"></i>'+
              '<i class="fa  fa-spinner fa-spin fa-stack-1x fa-inverse"></i>'+
            '</span>');

        var network_size = $(".netsize", network_context).val();
        var network_tmpl = $(this).data("one_network");
        var netname      = $(this).data("network_name");
        var type         = $('.type_select', network_context).val();

        var ar_array = [];
        ar_array.push("TYPE=" + type);
        ar_array.push("SIZE=" + network_size);

        switch(type) {
            case 'ETHER':
                var mac = $('.eth_mac_net', network_context).val();

                if (mac){
                  ar_array.push("MAC=" + mac);
                }

                break;
            case 'IP4':
                var mac = $('.four_mac_net', network_context).val();
                var ip = $('.four_ip_net', network_context).val();

                if (mac){
                  ar_array.push("MAC=" + mac);
                }
                if (ip) {
                  ar_array.push("IP=" + ip);
                }

                break;
            case 'IP6':
                var mac = $('.six_mac_net', network_context).val();
                var gp = $('.six_global_net', network_context).val();
                var ula = $('.six_mac_net', network_context).val();

                if (mac){
                  ar_array.push("MAC=" + mac);
                }
                if (gp) {
                  ar_array.push("GLOBAL_PREFIX=" + gp);
                }
                if (ula){
                  ar_array.push("ULA_PREFIX=" + ula);
                }

                break;
        }

        network_tmpl += "\nAR=[" 
        network_tmpl += ar_array.join(",\n")
        network_tmpl += "]"

        var vnet_json = {
          "vnet": {
            "vnet_raw": network_tmpl
          }
        };

        OpenNebula.Network.create({
            timeout: true,
            data: vnet_json,
            success: function(request, response) {
              OpenNebula.Helper.clear_cache("VNET");
              $(".vcenter_network_result", network_context).addClass("success").html(
                  '<span class="fa-stack fa-2x" style="color: #dfdfdf">'+
                    '<i class="fa fa-cloud fa-stack-2x"></i>'+
                    '<i class="fa  fa-check fa-stack-1x fa-inverse"></i>'+
                  '</span>');

              $(".vcenter_network_response", network_context).html('<p style="font-size:12px" class="running-color">'+
                    tr("Virtual Network created successfully")+' ID:'+response.VNET.ID+
                  '</p>');
            },
            error: function (request, error_json){
                $(".vcenter_network_result", network_context).html('<span class="fa-stack fa-2x" style="color: #dfdfdf">'+
                      '<i class="fa fa-cloud fa-stack-2x"></i>'+
                      '<i class="fa  fa-warning fa-stack-1x fa-inverse"></i>'+
                    '</span>');

                $(".vcenter_network_response", network_context).html('<p style="font-size:12px" class="error-color">'+
                      (error_json.error.message || tr("Cannot contact server: is it running and reachable?"))+
                    '</p>');
            }
        });
      });

      return false
    });

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

function resetCreateHostDialog(){
  $create_host_dialog.empty();
  setupCreateHostDialog();

  $create_host_dialog = $('div#create_host_dialog');

  var cluster_id = $('#host_cluster_id .resource_list_select', $create_host_dialog).val();
  if (!cluster_id) cluster_id = "-1";

  insertSelectOptions('#host_cluster_id', $create_host_dialog, "Cluster", cluster_id, false);
  $("input#name", $create_host_dialog).focus();
  return false;
}

//Open creation dialogs
function popUpCreateHostDialog(){
  resetCreateHostDialog();
  $create_host_dialog.foundation('reveal', 'open');
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
