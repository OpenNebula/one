/* -------------------------------------------------------------------------- */
/* Copyright 2002-2012, OpenNebula Project Leads (OpenNebula.org)             */
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
// Configuration object for historical graphs of individual hosts
var host_graphs = [
    {
        title : tr("CPU Monitoring information"),
        monitor_resources : "HOST_SHARE/CPU_USAGE,HOST_SHARE/USED_CPU,HOST_SHARE/MAX_CPU",
        labels : "Allocated CPU,Real CPU,Total CPU",
        humanize_figures : false,
        history_length : HOST_HISTORY_LENGTH
    },
    {
        title: tr("Memory monitoring information"),
        monitor_resources : "HOST_SHARE/MEM_USAGE,HOST_SHARE/USED_MEM,HOST_SHARE/MAX_MEM",
        labels : "Allocated MEM,Real MEM,Total MEM",
        humanize_figures : true,
        history_length : HOST_HISTORY_LENGTH
    }
]


var hosts_tab_content = '\
<h2><i class="icon-hdd"></i> '+tr("Hosts")+'</h2>\
<form id="form_hosts" action="javascript:alert(\'js errors?!\')">\
  <div class="action_blocks">\
  </div>\
<table id="datatable_hosts" class="display">\
  <thead>\
    <tr>\
      <th class="check"><input type="checkbox" class="check_all" value="">' + tr("All") + '</input></th>\
      <th>' + tr("ID") + '</th>\
      <th>' + tr("Name") + '</th>\
      <th>' + tr("Cluster") + '</th>\
      <th>' + tr("Running VMs") + '</th>\
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
</table>\
<div class="legend_div">\
  <span>?</span>\
  <p class="legend_p">\
'+tr("CPU Use is calculated as the minimum between (total CPU - real CPU usage) and (allocated CPU). Real CPU usage is provided by the hosts monitoring driver. Available CPU is calculated using the information from the CPU setting of the VMs running on that host (allocated CPU)")+'\
  </p>\
  <p class="legend_p">\
'+tr("Memory use is calculated according to the information provided by the host monitoring driver.")+'\
  </p>\
  <p class="legend_p">\
'+tr("You can get monitoring graphs by clicking in the desired host and visiting the monitoring information tab. Note that oneacctd must be running for this information to be updated/available.")+'\
  </p>\
</div>\
</form>';

var create_host_tmpl =
'<div class="create_form"><form id="create_host_form" action="">\
  <fieldset>\
  <legend style="display:none;">' + tr("Host parameters") + '</legend>\
  <label for="name">' + tr("Name") + ':</label><input type="text" name="name" id="name" />\
  </fieldset>\
  <h3>' + tr("Drivers") + '</h3>\
  <fieldset>\
    <div class="manager clear" id="vmm_mads">\
          <label>' + tr("Virtualization Manager") + ':</label>\
          <select id="vmm_mad" name="vmm">\
                <option value="vmm_kvm">' + tr("KVM") + '</option>\
                <option value="vmm_xen">' + tr("XEN") + '</option>\
                <option value="vmm_vmware">' + tr("VMware") + '</option>\
                <option value="vmm_ec2">' + tr("EC2") + '</option>\
                <option value="vmm_dummy">' + tr("Dummy") + '</option>\
                <option value="custom">' + tr("Custom") + '</option>\
          </select>\
          <div>\
          <label>' + tr("Custom VMM_MAD") + ':</label>\
          <input type="text" name="custom_vmm_mad" /></div>\
    </div>\
    <div class="manager clear" id="im_mads">\
      <label>' + tr("Information Manager") + ':</label>\
      <select id="im_mad" name="im">\
               <option value="im_kvm">' + tr("KVM") + '</option>\
               <option value="im_xen">' + tr("XEN") + '</option>\
               <option value="im_vmware">' + tr("VMware") + '</option>\
               <option value="im_ec2">' + tr("EC2") + '</option>\
               <option value="im_ganglia">' + tr("Ganglia") + '</option>\
               <option value="im_dummy">' + tr("Dummy") + '</option>\
               <option value="custom">' + tr("Custom") + '</option>\
      </select>\
      <div>\
        <label>' + tr("Custom IM_MAD") + ':</label>\
        <input type="text" name="custom_im_mad" />\
      </div>\
    </div>\
    <div class="manager clear" id="vnm_mads">\
      <label>Virtual Network Manager:</label>\
       <select id="vnm_mad" name="vn">\
         <option value="dummy">' + tr("Default (dummy)") +'</option>\
         <option value="fw">'+tr("Firewall")+'</option>\
         <option value="802.1Q">'+tr("802.1Q")+'</option>\
         <option value="ebtables">'+tr("ebtables")+'</option>\
         <option value="ovswitch">'+tr("Open vSwitch")+'</option>\
         <option value="vmware">'+tr("VMware")+'</option>\
         <option value="custom">' + tr("Custom") + '</option>\
       </select>\
       <div>\
          <label>' + tr("Custom VNM_MAD") + ':</label>\
          <input type="text" name="custom_vnm_mad" />\
       </div>\
    </div>\
    <div class="manager clear" id="cluster_select">\
      <label>' + tr("Cluster") + ':</label>\
       <select id="host_cluster_id" name="host_cluster_id">\
       </select>\
    </div>\
    </fieldset>\
    <fieldset>\
    <div class="form_buttons">\
        <div><button class="button" type="submit" id="create_host_submit" value="OpenNebula.Host.create">' + tr("Create") + '</button>\
        <button class="button" type="reset" value="reset">' + tr("Reset") + '</button></div>\
    </div>\
  </fieldset>\
</form></div>';

var hosts_select="";
var dataTable_hosts;
var $create_host_dialog;

//Setup actions
var host_actions = {

    "Host.create" : {
        type: "create",
        call : OpenNebula.Host.create,
        callback : addHostElement,
        error : onError,
        notify: true
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
        callback: updateHostElement,
        error: onError
    },

    "Host.showinfo" : {
        type: "single",
        call: OpenNebula.Host.show,
        callback: updateHostInfo,
        error: onError
    },

    "Host.refresh" : {
        type: "custom",
        call: function(){
            waitingNodes(dataTable_hosts);
            Sunstone.runAction("Host.list");
        },
        error: onError
    },

    "Host.autorefresh" : {
        type: "custom",
        call : function() {
            OpenNebula.Host.list({timeout: true, success: updateHostsView,error: onError});
        }
    },

    "Host.enable" : {
        type: "multiple",
        call : OpenNebula.Host.enable,
        callback : function (req) {
            Sunstone.runAction("Host.show",req.request.data[0]);
        },
        elements: hostElements,
        error : onError,
        notify: true
    },

    "Host.disable" : {
        type: "multiple",
        call : OpenNebula.Host.disable,
        callback : function (req) {
            Sunstone.runAction("Host.show",req.request.data[0]);
        },
        elements: hostElements,
        error : onError,
        notify:true
    },

    "Host.delete" : {
        type: "multiple",
        call : OpenNebula.Host.del,
        callback : deleteHostElement,
        elements: hostElements,
        error : onError,
        notify:true
    },

    "Host.monitor" : {
        type: "monitor",
        call : OpenNebula.Host.monitor,
        callback: function(req,response) {
            var info = req.request.data[0].monitor;
            plot_graph(response,'#host_monitoring_tab',
                       'host_monitor_',info);
        },
        error: hostMonitorError
    },

    "Host.fetch_template" : {
        type: "single",
        call: OpenNebula.Host.fetch_template,
        callback: function (request,response) {
            $('#template_update_dialog #template_update_textarea').val(response.template);
        },
        error: onError
    },

    "Host.update_dialog" : {
        type: "custom",
        call: function() {
            popUpTemplateUpdateDialog("Host",
                                      makeSelectOptions(dataTable_hosts,
                                                        1,//id_col
                                                        2,//name_col
                                                        [],
                                                        []
                                                       ),
                                      getSelectedNodes(dataTable_hosts));
        }
    },

    "Host.update" : {
        type: "single",
        call: OpenNebula.Host.update,
        callback: function() {
            notifyMessage(tr("Template updated correctly"));
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
        callback: null,
        elements: hostElements,
        notify:true
    },

    "Host.help" : {
        type: "custom",
        call: function() {
            hideDialog();
            $('div#hosts_tab div.legend_div').slideToggle();
        }
    }

};

var host_buttons = {
    "Host.refresh" : {
        type: "action",
        text: '<i class="icon-refresh icon-large">',
        alwaysActive: true
    },
    "Host.create_dialog" : {
        type: "create_dialog",
        text: tr("+ New"),
        condition: mustBeAdmin
    },
    "Host.update_dialog" : {
        type: "action",
        text: tr("Update a template"),
        alwaysActive: true,
        condition: mustBeAdmin
    },
    "Host.addtocluster" : {
        type: "confirm_with_select",
        text: tr("Select cluster"),
        select: clusters_sel,
        tip: tr("Select the destination cluster:"),
        condition: mustBeAdmin
    },
    "Host.enable" : {
        type: "action",
        text: tr("Enable"),
        condition: mustBeAdmin
    },
    "Host.disable" : {
        type: "action",
        text: tr("Disable"),
        condition: mustBeAdmin
    },
    "Host.delete" : {
        type: "confirm",
        text: tr("Delete host"),
        condition: mustBeAdmin
    },
    "Host.help" : {
        type: "action",
        text: '?',
        alwaysActive: true
    }
};

var host_info_panel = {
    "host_info_tab" : {
        title: tr("Host information"),
        content:""
    },

    "host_template_tab" : {
        title: tr("Host template"),
        content: ""
    },
    "host_monitoring_tab": {
        title: tr("Monitoring information"),
        content: ""
    }
};


var hosts_tab = {
    title: tr("Hosts"),
    content: hosts_tab_content,
    buttons: host_buttons,
    tabClass: "subTab",
    parentTab: "infra_tab",
    showOnTopMenu: false
};


// Configuration object for plots related to hosts in the dashboard
SunstoneMonitoringConfig['HOST'] = {
    plot: function(monitoring){
        // Write the total hosts and discard this value
        $('#totalHosts', $dashboard).text(monitoring['totalHosts'])
        delete monitoring['totalHosts']

        //if (!$dashboard.is(':visible')) return;

        //Plot each of the monitored series
        for (plotID in monitoring){
            var container = $('div#'+plotID,$dashboard);
            if (!container.length) continue;
            SunstoneMonitoring.plot("HOST",
                                    plotID,
                                    container,
                                    monitoring[plotID]); //serie
        };
    },
    monitor : {
        // Config to extract data to make state pie
        "statePie" : {
            partitionPath: "STATE", //we partition hosts acc. to STATE
            operation: SunstoneMonitoring.ops.partition,
            dataType: "pie", //we want to paint a pie
            colorize: function(state){
                switch (state) { //This is how we color each pie sector
                case '0': return "rgb(239,201,86)" //yellow
                case '1': return "rgb(175,216,248)" //blue
                case '2': return "rgb(108,183,108)" //green
                case '3': return "rgb(203,75,75)" //red
                case '4': return "rgb(71,71,71)" //gray
                case '5': return "rgb(160,160,160)" //light gray
                }
            },
            plotOptions : { //jquery.flot plotting options
                series: { pie: { show: true  } },
                legend : {
                    labelFormatter: function(label, series){
                        return OpenNebula.Helper.resource_state("host_simple",label) +
                            ' - ' + series.data[0][1] + ' (' +
                            Math.floor(series.percent) + '%' + ')';
                    }
                }
            }
        },
        "cpuPerCluster" : { //cpu used in each cluster
            path: ["HOST_SHARE","CPU_USAGE"], //totalize cpu
            partitionPath: "CLUSTER_ID", //in each cluster
            operation: SunstoneMonitoring.ops.partition,
            dataType: "bars", //we want to paint vertical bars
            plotOptions: {
                series: { bars: {show: true, barWidth: 0.5, align: 'center' }},
                //customLabels is a custom option, means a ticks array will
                //be added to this configuration with the labels (cluster
                //names) when it is ready.
                xaxis: { show: true, customLabels: true },
                yaxis: { min: 0 },
                legend : {
                    show: false,
                    noColumns: 2,
                    labelFormatter: function(label){
                        if (label == "-1") return "none"
                        return getClusterName(label)
                    }
                }
            }
        },
        "memoryPerCluster" : { //memory used in each cluster. same as above.
            path: ["HOST_SHARE","MEM_USAGE"],
            partitionPath: "CLUSTER_ID",
            operation: SunstoneMonitoring.ops.partition,
            dataType: "bars",
            plotOptions: {
                series: { bars: {show: true, barWidth: 0.5, align: 'center' }},
                xaxis: { show: true, customLabels: true },
                yaxis: {
                    tickFormatter : function(val,axis) {
                        return humanize_size(val);
                    },
                    min: 0
                },
                legend : {
                    show: false,
                    noColumns: 2,
                    labelFormatter: function(label){
                        if (label == "-1") return "none"
                        return getClusterName(label)
                    }
                }
            }
        },
        "globalCpuUsage" : { //pie according to cpu usage.
            partitionPath: ["HOST_SHARE", "USED_CPU"],
            dataType: "pie",
            operation: SunstoneMonitoring.ops.hostCpuUsagePartition,
            plotOptions: {
                series: { pie: { show: true  } }
            }
        },
        "totalHosts" : { //count number of hosts
            operation: SunstoneMonitoring.ops.totalize
        },
        "cpuUsageBar" : { //horizontal bar with cpu usage
            // we want the following values to be totalized in the same bar
            paths: [
                ["HOST_SHARE","MAX_CPU"],
                ["HOST_SHARE","USED_CPU"],
                ["HOST_SHARE","CPU_USAGE"],
            ],
            operation: SunstoneMonitoring.ops.singleBar,
            plotOptions: {
                series: { bars: { show: true,
                                  horizontal: true,
                                  barWidth: 0.5 }
                        },
                yaxis: { show: false },
                xaxis: { min:0 },
                legend: {
                    noColumns: 3,
                    container: '#cpuUsageBar_legend',
                    labelFormatter: function(label, series){
                        if (label[1] == "USED_CPU") {
                            return tr("Real CPU");
                        }
                        else if (label[1] == "CPU_USAGE") {
                            return tr("Allocated CPU");
                        }
                        else if (label[1] == "MAX_CPU") {
                            return tr("Total CPU");
                        }
                    }
                }
            }
        },
        "memoryUsageBar" : { //same as above
            paths: [
                ["HOST_SHARE","MAX_MEM"],
                ["HOST_SHARE","USED_MEM"],
                ["HOST_SHARE","MEM_USAGE"],
            ],
            operation: SunstoneMonitoring.ops.singleBar,
            plotOptions: {
                series: { bars: { show: true,
                                  horizontal: true,
                                  barWidth: 0.5 }
                        },
                yaxis: { show: false },
                xaxis: {
                    tickFormatter : function(val,axis) {
                        return humanize_size(val);
                    },
                    min: 0
                },
                legend: {
                    noColumns: 3,
                    container: '#memoryUsageBar_legend',
                    labelFormatter: function(label, series){
                        if (label[1] == "USED_MEM") {
                            return tr("Real MEM");
                        }
                        else if (label[1] == "MEM_USAGE") {
                            return tr("Allocated MEM");
                        }
                        else if (label[1] == "MAX_MEM") {
                            return tr("Total MEM");
                        }
                    }
                }
            }
        }
    }
}


Sunstone.addActions(host_actions);
Sunstone.addMainTab('hosts_tab',hosts_tab);
Sunstone.addInfoPanel("host_info_panel",host_info_panel);

// return selected elements from hosts datatable
function hostElements(){
    return getSelectedNodes(dataTable_hosts);
}

//Creates an array to be added to the dataTable from the JSON of a host.
function hostElementArray(host_json){
    var host = host_json.HOST;

    // Generate CPU progress bars
    var max_cpu = parseInt(host.HOST_SHARE.MAX_CPU);
    if (!max_cpu) { 
        max_cpu = 100
    }

    var allocated_cpu = parseInt(host.HOST_SHARE.CPU_USAGE);
    var ratio_allocated_cpu = Math.round((allocated_cpu / max_cpu) * 100);

    var pb_allocated_cpu = progressBar(ratio_allocated_cpu, { 
        label: allocated_cpu + ' / ' + max_cpu + ' (' + ratio_allocated_cpu + '%)',
        width: '150px', 
        height: '15px', 
        fontSize: '1em' });


    var real_cpu = parseInt(host.HOST_SHARE.USED_CPU);
    var ratio_real_cpu = Math.round((real_cpu / max_cpu) * 100);

    var pb_real_cpu      = progressBar(ratio_real_cpu, { 
        label: real_cpu + ' / ' + max_cpu + ' (' + ratio_real_cpu + '%)',
        width: '150px', 
        height: '15px', 
        fontSize: '1em'});


    // Generate MEM progress bars
    var max_mem = parseInt(host.HOST_SHARE.MAX_MEM);
    if (!max_mem) { 
        max_mem = 100
    }

    var allocated_mem = parseInt(host.HOST_SHARE.MEM_USAGE);
    var ratio_allocated_mem = Math.round((allocated_mem / max_mem) * 100);

    var pb_allocated_mem = progressBar(ratio_allocated_mem, { 
        label: humanize_size(allocated_mem) + ' / ' + humanize_size(max_mem) + ' (' + ratio_allocated_mem + '%)',
        width: '150px', 
        height: '15px', 
        fontSize: '1em' });


    var real_mem = parseInt(host.HOST_SHARE.USED_MEM);
    var ratio_real_mem = Math.round((real_mem / max_mem) * 100);

    var pb_real_mem      = progressBar(ratio_real_mem, { 
        label: humanize_size(real_mem) + ' / ' + humanize_size(max_mem) + ' (' + ratio_real_mem + '%)',
        width: '150px', 
        height: '15px', 
        fontSize: '1em' });


    return [
        '<input class="check_item" type="checkbox" id="host_'+host.ID+'" name="selected_items" value="'+host.ID+'"/>',
        host.ID,
        host.NAME,
        host.CLUSTER.length ? host.CLUSTER : "-",
        host.HOST_SHARE.RUNNING_VMS, //rvm
        pb_real_cpu,
        pb_allocated_cpu,
        pb_real_mem,
        pb_allocated_mem,
        OpenNebula.Helper.resource_state("host_simple",host.STATE),
        host.IM_MAD,
        host.VM_MAD,
        pretty_time(host.LAST_MON_TIME)
    ];
}

//updates the host select by refreshing the options in it
function updateHostSelect(){
    hosts_select = makeSelectOptions(dataTable_hosts,
                                     1,//id_col
                                     2,//name_col
                                     [7,7],//status_cols
                                     [tr("ERROR"),tr("OFF"),tr("RETRY")]//bad_st
                                    );
}

//callback for an action affecting a host element
function updateHostElement(request, host_json){
    var id = host_json.HOST.ID;
    var element = hostElementArray(host_json);
    updateSingleElement(element,dataTable_hosts,'#host_'+id);
    updateHostSelect();
}

//callback for actions deleting a host element
function deleteHostElement(req){
    deleteElement(dataTable_hosts,'#host_'+req.request.data);
    updateHostSelect();
}

//call back for actions creating a host element
function addHostElement(request,host_json){
    var id = host_json.HOST.ID;
    var element = hostElementArray(host_json);
    addElement(element,dataTable_hosts);
    updateHostSelect();
}

//callback to update the list of hosts.
function updateHostsView (request,host_list){
    var host_list_array = [];

    $.each(host_list,function(){
        //Grab table data from the host_list
        host_list_array.push(hostElementArray(this));
    });

    SunstoneMonitoring.monitor('HOST', host_list)

    //if clusters_sel is there, it means the clusters have arrived.
    //Otherwise do not attempt to monitor them.
    if (typeof(monitorClusters) != 'undefined' && clusters_sel())
        monitorClusters(host_list)
    updateView(host_list_array,dataTable_hosts);
    updateHostSelect();
    //dependency with the dashboard plugin
    updateInfraDashboard("hosts",host_list);
}

//Updates the host info panel tab content and pops it up
function updateHostInfo(request,host){
    var host_info = host.HOST;

    //Information tab
    var info_tab = {
        title : tr("Host information"),
        content :
        '<table id="info_host_table" class="info_table">\
            <thead>\
               <tr><th colspan="2">' + tr("Host information") + ' - '+host_info.NAME+'</th></tr>\
            </thead>\
            <tbody>\
            <tr>\
                <td class="key_td">' + tr("id") + '</td>\
                <td class="value_td">'+host_info.ID+'</td>\
            </tr>\
            <tr>\
                <td class="key_td">' + tr("Name") + '</td>\
                <td class="value_td">'+host_info.NAME+'</td>\
            </tr>\
            <tr>\
                <td class="key_td">' + tr("Cluster") + '</td>\
                <td class="value_td">'+(host_info.CLUSTER.length ? host_info.CLUSTER : "-")+'</td>\
            </tr>\
            <tr>\
                <td class="key_td">' + tr("State") + '</td>\
                <td class="value_td">'+tr(OpenNebula.Helper.resource_state("host",host_info.STATE))+'</td>\
            </tr>\
            <tr>\
                <td class="key_td">' + tr("IM MAD") + '</td>\
                <td class="value_td">'+host_info.IM_MAD+'</td>\
            </tr>\
            <tr>\
                <td class="key_td">' + tr("VM MAD") + '</td>\
                <td class="value_td">'+host_info.VM_MAD+'</td>\
            </tr>\
            <tr>\
                <td class="key_td">'+ tr("VN MAD") +'</td>\
                <td class="value_td">'+host_info.VN_MAD+'</td>\
            </tr>\
            </tbody>\
         </table>\
         <table id="host_shares_table" class="info_table">\
            <thead>\
               <tr><th colspan="2">' + tr("Host shares") + '</th></tr>\
            </thead>\
            <tbody>\
               <tr>\
                  <td class="key_td">' + tr("Total Mem") + '</td>\
                  <td class="value_td">'+humanize_size(host_info.HOST_SHARE.MAX_MEM)+'</td>\
               </tr>\
               <tr>\
                  <td class="key_td">' + tr("Used Mem (real)") + '</td>\
                  <td class="value_td">'+humanize_size(host_info.HOST_SHARE.USED_MEM)+'</td>\
               </tr>\
               <tr>\
                  <td class="key_td">' + tr("Used Mem (allocated)") + '</td>\
                  <td class="value_td">'+humanize_size(host_info.HOST_SHARE.MEM_USAGE)+'</td>\
               </tr>\
               <tr>\
                  <td class="key_td">' + tr("Total CPU") + '</td>\
                  <td class="value_td">'+host_info.HOST_SHARE.MAX_CPU+'</td>\
               </tr>\
               <tr>\
                  <td class="key_td">' + tr("Used CPU (real)") + '</td>\
                  <td class="value_td">'+host_info.HOST_SHARE.USED_CPU+'</td>\
               </tr>\
               <tr>\
                  <td class="key_td">' + tr("Used CPU (allocated)") + '</td>\
                  <td class="value_td">'+host_info.HOST_SHARE.CPU_USAGE+'</td>\
               </tr>\
               <tr>\
                  <td class="key_td">' + tr("Running VMs") + '</td>\
                  <td class="value_td">'+host_info.HOST_SHARE.RUNNING_VMS+'</td>\
               </tr>\
            </tbody>\
          </table>'
    }

    //Template tab
    var template_tab = {
        title : tr("Host template"),
        content :
        '<table id="host_template_table" class="info_table" style="width:80%">\
                <thead><tr><th colspan="2">' + tr("Host template") + '</th></tr></thead>'+
                prettyPrintJSON(host_info.TEMPLATE)+
                '</table>'
    }

    var monitor_tab = {
        title: tr("Monitoring information"),
        content : generateMonitoringDivs(host_graphs,"host_monitor_")
    }

    //Sunstone.updateInfoPanelTab(info_panel_name,tab_name, new tab object);
    Sunstone.updateInfoPanelTab("host_info_panel","host_info_tab",info_tab);
    Sunstone.updateInfoPanelTab("host_info_panel","host_template_tab",template_tab);
    Sunstone.updateInfoPanelTab("host_info_panel","host_monitoring_tab",monitor_tab);

    Sunstone.popUpInfoPanel("host_info_panel");
    //pop up panel while we retrieve the graphs
    for (var i=0; i<host_graphs.length; i++){
        Sunstone.runAction("Host.monitor",host_info.ID,host_graphs[i]);
    };


}

//Prepares the host creation dialog
function setupCreateHostDialog(){
    dialogs_context.append('<div title=\"'+tr("Create host")+'\" id="create_host_dialog"></div>');
    $create_host_dialog = $('div#create_host_dialog');
    var dialog = $create_host_dialog;

    dialog.html(create_host_tmpl);
    dialog.dialog({
        autoOpen: false,
        modal: true,
        width: 500
    });

    $('button',dialog).button();


    // Show custom driver input only when custom is selected in selects
    $('input[name="custom_vmm_mad"],'+
       'input[name="custom_im_mad"],'+
       'input[name="custom_vnm_mad"]',dialog).parent().hide();

    $('select#vmm_mad',dialog).change(function(){
        if ($(this).val()=="custom")
            $('input[name="custom_vmm_mad"]').parent().show();
        else
            $('input[name="custom_vmm_mad"]').parent().hide();
    });

    $('select#im_mad',dialog).change(function(){
        if ($(this).val()=="custom")
            $('input[name="custom_im_mad"]').parent().show();
        else
            $('input[name="custom_im_mad"]').parent().hide();
    });

    $('select#vnm_mad',dialog).change(function(){
        if ($(this).val()=="custom")
            $('input[name="custom_vnm_mad"]').parent().show();
        else
            $('input[name="custom_vnm_mad"]').parent().hide();
    });

    //Handle the form submission
    $('#create_host_form',dialog).submit(function(){
        var name = $('#name',this).val();
        if (!name){
            notifyError(tr("Host name missing!"));
            return false;
        }

        var cluster_id = $('#host_cluster_id',this).val();
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
        $create_host_dialog.dialog('close');
        return false;
    });
}

//Open creation dialogs
function popUpCreateHostDialog(){
    $('#host_cluster_id',$create_host_dialog).html(clusters_sel());
    $create_host_dialog.dialog('open');
    return false;
}

//Prepares the autorefresh for hosts
function setHostAutorefresh() {
    setInterval(function(){
        var checked = $('input.check_item:checked',dataTable_hosts);
        var  filter = $("#datatable_hosts_filter input",dataTable_hosts.parents('#datatable_hosts_wrapper')).attr('value');
        if (!checked.length && !filter.length){
            Sunstone.runAction("Host.autorefresh");
        }
    },INTERVAL+someTime());
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

    //prepare host datatable
    dataTable_hosts = $("#datatable_hosts",main_tabs_context).dataTable({
        "bJQueryUI": true,
        "bSortClasses": false,
        "sDom" : '<"H"lfrC>t<"F"ip>',
        "oColVis": { //exclude checkbox column
            "aiExclude": [ 0 ]
        },
        "bAutoWidth":false,
        "sPaginationType": "full_numbers",
        "aoColumnDefs": [
            { "bSortable": false, "aTargets": ["check"] },
            { "sWidth": "60px", "aTargets": [0,4] },
            { "sWidth": "35px", "aTargets": [1] },
            { "sWidth": "100px", "aTargets": [9,3,10,11,12] },
            { "sWidth": "150", "aTargets": [5,6,7,8] },
            { "bVisible": false, "aTargets": [5,7,10,11,12]}
        ],
        "oLanguage": (datatable_lang != "") ?
            {
                sUrl: "locale/"+lang+"/"+datatable_lang
            } : ""
    });

    //preload it
    dataTable_hosts.fnClearTable();
    addElement([
        spinner,
        '','','','','','','','','','','',''],dataTable_hosts);
    Sunstone.runAction("Host.list");

    setupCreateHostDialog();

    setHostAutorefresh();

    initCheckAllBoxes(dataTable_hosts);
    tableCheckboxesListener(dataTable_hosts);
    infoListener(dataTable_hosts, "Host.showinfo");

    // This listener removes any filter on hosts table when its menu item is
    // selected. The cluster plugins will filter hosts when the hosts
    // in a cluster are shown. So we have to make sure no filter has been
    // left in place when we want to see all hosts.
    $('div#menu li#li_hosts_tab').live('click',function(){
        dataTable_hosts.fnFilter('',3);
    });

    // Hide help
    $('div#hosts_tab div.legend_div',main_tabs_context).hide();
});
