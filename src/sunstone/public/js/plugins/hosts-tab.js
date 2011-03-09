/* -------------------------------------------------------------------------- */
/* Copyright 2002-2011, OpenNebula Project Leads (OpenNebula.org)             */
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

var hosts_tab_content = 
'<form id="form_hosts" action="javascript:alert(\'js errors?!\')">\
  <div class="action_blocks">\
  </div>\
<table id="datatable_hosts" class="display">\
  <thead>\
    <tr>\
      <th class="check"><input type="checkbox" class="check_all" value="">All</input></th>\
      <th>ID</th>\
      <th>Name</th>\
      <th>Cluster</th>\
      <th>Running VMs</th>\
      <th>CPU Use</th>\
      <th>Memory use</th>\
      <th>Status</th>\
    </tr>\
  </thead>\
  <tbody id="tbodyhosts">\
  </tbody>\
</table>\
</form>';

var create_host_tmpl =
'<div class="create_form"><form id="create_host_form" action="">\
  <fieldset>\
  <legend style="display:none;">Host parameters</legend>\
  <label for="name">Name: </label><input type="text" name="name" id="name" />\
  </fieldset>\
  <h3>Drivers</h3>\
  <fieldset>\
    <div class="manager clear" id="vmm_mads">\
	  <label>Virtualization Manager:</label>\
	  <select id="vmm_mad" name="vmm">\
	    <option value="vmm_kvm">KVM</option>\
		<option value="vmm_xen">XEN</option>\
		<option value="vmm_ec2">EC2</option>\
		<option value="vmm_dummy">Dummy</option>\
	  </select>\
    </div>\
    <div class="manager clear" id="im_mads">\
      <label>Information Manager:</label>\
      <select id="im_mad" name="im">\
	    <option value="im_kvm">KVM</option>\
		<option value="im_xen">XEN</option>\
		<option value="im_ec2">EC2</option>\
		<option value="im_dummy">Dummy</option>\
	  </select>\
    </div>\
    <div class="manager clear" id="tm_mads">\
      <label>Transfer Manager:</label>\
       <select id="tm_mad" name="tm">\
	    <option value="tm_nfs">NFS</option>\
		<option value="tm_ssh">SSH</option>\
		<option value="tm_dummy">Dummy</option>\
	  </select>\
    </div>\
    </fieldset>\
    <fieldset>\
    <div class="form_buttons">\
		<div><button class="button" id="create_host_submit" value="OpenNebula.Host.create">Create</button>\
		<button class="button" type="reset" value="reset">Reset</button></div>\
	</div>\
  </fieldset>\
</form></div>';

var create_cluster_tmpl =
'<form id="create_cluster_form" action="">\
  <fieldset style="border:none;">\
	<div>\
		<label for="name">Cluster name:</label>\
		<input type="text" name="name" id="name" /><br />\
	</div>\
  </fieldset>\
  <fieldset>\
	<div class="form_buttons">\
		<button class="button" id="create_cluster_submit" value="cluster/create">Create</button>\
		<button class="button" type="reset" value="reset">Reset</button>\
	</div>\
  </fieldset>\
</form>';

var hosts_select="";
var clusters_select="";
var host_list_json = {};
var cluster_list_json = {};
var dataTable_hosts;

//Setup actions
var host_actions = {
    
            "Host.create" : {
                type: "create",
                call : OpenNebula.Host.create,
                callback : addHostElement,
                error : onError,
                notify:False,
            },
            
            "Host.create_dialog" : {
                type: "custom",
                call: popUpCreateHostDialog
            },
            
            //Custom below
            //~ "Host.list" : {
                //~ type: "list",
                //~ call: OpenNebula.Host.list,
                //~ callback: updateHostsView,
                //~ error: onError,
                //~ notify:False
            //~ },
            
            "Host.show" : {
                type: "single",
                call: OpenNebula.Host.show,
                callback: updateHostElement,
                error: onError,
                notify:False
            },
            
            "Host.showinfo" : {
                type: "single",
                call: OpenNebula.Host.show,
                callback: updateHostInfo,
                error: onError,
                notify: False
            },
            
            "Host.refresh" : {
                type: "custom",
                call: function(){
                    waitingNodes(dataTable_hosts);
                    Sunstone.runAction("Host.list");
                },
                callback: function(){},
                error: onError,
                notify: False
            },
            
            "Host.enable" : {
                type: "multiple",
                call : OpenNebula.Host.enable,
                callback : function (req) {
                    Sunstone.runAction("Host.show",req.request.data[0]);
                },
                dataTable: function() { return dataTable_hosts },
                error : onError,
                notify:True,
            },
            
            "Host.disable" : {
                type: "multiple",
                call : OpenNebula.Host.disable,
                callback : function (req) {
                    Sunstone.runAction("Host.show",req.request.data[0]);
                },
                dataTable: function() { return dataTable_hosts },
                error : onError,
                notify:True,
            },
            
            "Host.delete" : {
                type: "multiple",
                call : OpenNebula.Host.delete,
                callback : deleteHostElement,
                dataTable: function() { return dataTable_hosts },
                error : onError,
                notify:True,
            },
            
            "Host.list" : {
                type: "custom",
                call : function() {
                    OpenNebula.Host.list({success: updateHostsView, error: onError});
                    OpenNebula.Cluster.list({success: updateClustersView, error: onError});
                    },
                callback: function(){},
                error: onError,
                notify:True,
            },
                        
            "Cluster.create" : {
                type: "create",
                call : OpenNebula.Cluster.create,
                callback : function(){
                    //OpenNebula.Cluster.list({success: updateClustersView, error: onError});
                    Sunstone.runAction("Cluster.list");
                },
                error : onError,
                notify:True
            },
            
            "Cluster.create_dialog" : {
                type: "custom",
                call: popUpCreateClusterDialog
            },
            
            "Cluster.list" : {
                type: "list",
                call: OpenNebula.Cluster.list,
                callback: updateClustersView,
                error: onError,
                notify:True
            },
            
            "Cluster.delete" : {
                type: "single",
                call : OpenNebula.Cluster.delete,
                callback : function(){
                    //OpenNebula.Cluster.list({success: updateClustersView, error: onError});
                    Sunstone.runAction("Cluster.list");
                },
                error : onError,
                notify:True,
            },
            
            "Cluster.addhost" : {
                type: "multiple",
                call : OpenNebula.Cluster.addhost,
                callback : function(req){
                    Sunstone.runAction("Host.show",req.request.data);
					},
                dataTable: function() { return dataTable_hosts },
                error : onError,
                notify:True,
            },
            
            "Cluster.removehost" : {
                type: "multiple",
                call : OpenNebula.Cluster.removehost,
                callback : deleteHostElement,
                error : onError,
                notify:True,
            }
        };

var host_buttons = {
        "Host.refresh" : {
            type: "image",
            text: "Refresh list",
            img: "/images/Refresh-icon.png",
            condition: True
        },
        "Host.create_dialog" : {
            type: "create_dialog",
            text: "+ New",
            condition :True
        },
        "Host.enable" : {
            type: "action",
            text: "Enable",
            condition : True
        },
        "Host.disable" : {
            type: "action",
            text: "Disable",
            condition : True
        },
        "Cluster.create_dialog" : {
            type: "create_dialog",
            text: "+ New Cluster",
            condition : True
        },
        "Cluster.delete" : {
            type: "confirm_with_select",
            text: "Delete cluster",
            select: function(){return clusters_select},
            tip: "Select the cluster you want to remove",
            condition : True
        },
        "action_list" : { //Special button
            type: "select",
            actions: { "Cluster.addhost": { 
                            type: "confirm_with_select",
                            text: "Add host to cluster", 
                            select: function(){return clusters_select;},
                            tip: "Select the cluster in which you would like to place the hosts",
                            condition: True
                        },
                        "Cluster.removehost" : {
                            type: "action",
                            text: "Remove host from cluster",
                            condition: True
                        }},
            condition : True
        },
        "Host.delete" : {
            type: "action",
            text: "Delete host",
            condition : True
        }
        };
            
var host_info_panel = {
    "info_host_tab" : {
        title: "Host information",
        content:""
    },
    
    "host_template_tab" : {
        title: "Host template",
        content: ""
    }
};
            
for (action in host_actions){
    Sunstone.addAction(action,host_actions[action]);
}

// title, content, buttons, id
Sunstone.addMainTab('hosts_tab','Hosts',hosts_tab_content,host_buttons);
Sunstone.addInfoPanel("host_info_panel",host_info_panel);


function hostElementArray(host_json){
	host = host_json.HOST;
	acpu = parseInt(host.HOST_SHARE.MAX_CPU);
		if (!acpu) {acpu=100};
	acpu = acpu - parseInt(host.HOST_SHARE.CPU_USAGE);

    total_mem = parseInt(host.HOST_SHARE.MAX_MEM);
    free_mem = parseInt(host.HOST_SHARE.FREE_MEM);

    if (total_mem == 0) {
        ratio_mem = 0;
    } else {
        ratio_mem = Math.round(((total_mem - free_mem) / total_mem) * 100);
    }


    total_cpu = parseInt(host.HOST_SHARE.MAX_CPU);
    used_cpu = Math.max(total_cpu - parseInt(host.HOST_SHARE.USED_CPU),acpu);

    if (total_cpu == 0) {
        ratio_cpu = 0;
    } else {
        ratio_cpu = Math.round(((total_cpu - used_cpu) / total_cpu) * 100);
    }

     pb_mem =
'<div style="height:10px" class="ratiobar ui-progressbar ui-widget ui-widget-content ui-corner-all" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+ratio_mem+'">\
    <div class="ui-progressbar-value ui-widget-header ui-corner-left ui-corner-right" style="width: '+ratio_mem+'%;"/>\
    <span style="position:relative;left:45px;top:-4px;font-size:0.6em">'+ratio_mem+'%</span>\
    </div>\
</div>';

    pb_cpu =
'<div style="height:10px" class="ratiobar ui-progressbar ui-widget ui-widget-content ui-corner-all" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+ratio_cpu+'">\
    <div class="ui-progressbar-value ui-widget-header ui-corner-left ui-corner-right" style="width: '+ratio_cpu+'%;"/>\
    <span style="position:relative;left:45px;top:-4px;font-size:0.6em">'+ratio_cpu+'%</span>\
    </div>\
</div>';


    return [ '<input type="checkbox" id="host_'+host.ID+'" name="selected_items" value="'+host.ID+'"/>',
			host.ID,
			host.NAME,
			host.CLUSTER,
			host.HOST_SHARE.RUNNING_VMS, //rvm
            pb_cpu,
			pb_mem,
			OpenNebula.Helper.resource_state("host",host.STATE) ];

}


function hostInfoListener(){
	$('#tbodyhosts tr').live("click",function(e){

		//do nothing if we are clicking a checkbox!
		if ($(e.target).is('input')) {return true;}

        popDialogLoading();
		aData = dataTable_hosts.fnGetData(this);
		id = $(aData[0]).val();
        Sunstone.runAction("Host.showinfo",id);
		//OpenNebula.Host.show({data:{id:id},success: updateHostInfo,error: onError});
		return false;
	});
}

function updateHostSelect(host_list){

	//update select helper
	hosts_select="";
	hosts_select += "<option value=\"\">Select a Host</option>";
	$.each(host_list, function(){
		hosts_select += "<option value=\""+this.HOST.ID+"\">"+this.HOST.NAME+"</option>";
	});

	//update static selectors
	$('#vm_host').html(hosts_select);
}


function updateClusterSelect(cluster_list){

	//update select helper
	clusters_select= "";
	clusters_select+="<option value=\"\">Select a cluster</option>";
	$.each(cluster_list, function(){
		clusters_select += "<option value=\""+this.CLUSTER.ID+"\">"+this.CLUSTER.NAME+"</option>";
	});

	//update static selectors
	//$('#host_cluster').html(clusters_select);

}

function updateHostElement(request, host_json){
	id = host_json.HOST.ID;
	element = hostElementArray(host_json);
	updateSingleElement(element,dataTable_hosts,'#host_'+id);
}

function deleteHostElement(req){
	deleteElement(dataTable_hosts,'#host_'+req.request.data);
}

function addHostElement(request,host_json){
    id = host_json.HOST.ID;
	element = hostElementArray(host_json);
	addElement(element,dataTable_hosts);
}

function updateHostsView (request,host_list){
	host_list_json = host_list;
	host_list_array = []

	$.each(host_list,function(){
	//Grab table data from the host_list
		host_list_array.push(hostElementArray(this));
	});

	updateView(host_list_array,dataTable_hosts);
	updateHostSelect(host_list);
	updateDashboard("hosts",host_list_json);
}

function updateClustersView(request, cluster_list){
	cluster_list_json = cluster_list;
	//~ cluster_list_array = [];

	//~ $.each(cluster_list, function(){
		//~ cluster_list_array.push(clusterElementArray(this));
	//~ });
	//~ updateView(cluster_list_array,dataTable_clusters);
	updateClusterSelect(cluster_list);
	updateDashboard("clusters",cluster_list);
}


function updateHostInfo(request,host){
	var host_info = host.HOST;
    var info_host_tab = {
        title : "Host information",
        content :
    '<table id="info_host_table" class="info_table">\
			<thead>\
				<tr><th colspan="2">Host information - '+host_info.NAME+'</th></tr>\
			</thead>\
			<tr>\
				<td class="key_td">ID</td>\
				<td class="value_td">'+host_info.ID+'</td>\
			</tr>\
			<tr>\
				<td class="key_td">State</td>\
				<td class="value_td">'+OpenNebula.Helper.resource_state("host",host_info.STATE)+'</td>\
			</tr>\
			<tr>\
				<td class="key_td">Cluster</td>\
				<td class="value_td">'+host_info.CLUSTER+'</td>\
			</tr>\
			<tr>\
				<td class="key_td">IM MAD</td>\
				<td class="value_td">'+host_info.IM_MAD+'</td>\
			</tr>\
			<tr>\
				<td class="key_td">VM MAD</td>\
				<td class="value_td">'+host_info.VM_MAD+'</td>\
			</tr>\
			<tr>\
				<td class="key_td">TM MAD</td>\
				<td class="value_td">'+host_info.TM_MAD+'</td>\
			</tr>\
		</table>\
		<table id="host_shares_table" class="info_table">\
			<thead>\
				<tr><th colspan="2">Host shares</th></tr>\
			</thead>\
			<tr>\
				<td class="key_td">Max Mem</td>\
				<td class="value_td">'+humanize_size(host_info.HOST_SHARE.MAX_MEM)+'</td>\
			</tr>\
			<tr>\
				<td class="key_td">Used Mem (real)</td>\
				<td class="value_td">'+humanize_size(host_info.HOST_SHARE.USED_MEM)+'</td>\
			</tr>\
			<tr>\
				<td class="key_td">Used Mem (allocated)</td>\
				<td class="value_td">'+humanize_size(host_info.HOST_SHARE.MAX_USAGE)+'</td>\
			</tr>\
			<tr>\
				<td class="key_td">Used CPU (real)</td>\
				<td class="value_td">'+host_info.HOST_SHARE.USED_CPU+'</td>\
			</tr>\
			<tr>\
				<td class="key_td">Used CPU(allocated)</td>\
				<td class="value_td">'+host_info.HOST_SHARE.CPU_USAGE+'</td>\
			</tr>\
			<tr>\
				<td class="key_td">Running VMs</td>\
				<td class="value_td">'+host_info.HOST_SHARE.RUNNING_VMS+'</td>\
			</tr>\
		</table>'
    }
    
    var host_template_tab = {
        title : "Host template",
        content : 
    	'<table id="host_template_table" class="info_table">\
		<thead><tr><th colspan="2">Host template</th></tr></thead>'+
		prettyPrintJSON(host_info.TEMPLATE)+
		'</table>'
    }
    
    Sunstone.updateInfoPanelTab("host_info_panel","info_host_tab",info_host_tab);
    Sunstone.updateInfoPanelTab("host_info_panel","host_template_tab",host_template_tab);
    Sunstone.popUpInfoPanel("host_info_panel");

}

function setUpCreateHostDialog(){
    $('div#dialogs').append('<div title="Create host" id="create_host_dialog"></div>');
    $('div#create_host_dialog').html(create_host_tmpl);
    $('#create_host_dialog').dialog({
		autoOpen: false,
		modal: true,
		width: 500
	});
    
    $('#create_host_dialog button').button();
    
    //Handle the form submission
	$('#create_host_form').submit(function(){
        if (!($('#name',this).val().length)){
            notifyError("Host name missing!");
            return false;
        }
		host_json = { "host": { "name": $('#name',this).val(),
							"tm_mad": $('#tm_mad :selected',this).val(),
							"vm_mad": $('#vmm_mad :selected',this).val(),
							"im_mad": $('#im_mad :selected',this).val()}}

		//Create the OpenNebula.Host.
		//If it's successfull we refresh the list.
        Sunstone.runAction("Host.create",host_json);
		//OpenNebula.Host.create({data: host_json, success: addHostElement, error: onError});
		$('#create_host_dialog').dialog('close');
		return false;
	});
    
}

function setUpCreateClusterDialog(){
    $('div#dialogs').append('<div title="Create cluster" id="create_cluster_dialog"></div>');
    $('#create_cluster_dialog').html(create_cluster_tmpl);

    $('#create_cluster_dialog').dialog({
		autoOpen: false,
		modal: true,
		width: 400
	});
    
    $('#create_cluster_dialog button').button();
    
    $('#create_cluster_form').submit(function(){
		name=$('#name',this).val();
		cluster_json = { "cluster" : { "name" : name }};
        Sunstone.runAction("Cluster.create",cluster_json);
		$('#create_cluster_dialog').dialog('close');
		return false;
	});

}



function popUpCreateHostDialog(){
    $('#create_host_dialog').dialog('open');
    return false;
}

function popUpCreateClusterDialog(){
    $('#create_cluster_dialog').dialog('open');
    return false;
}



//Document ready
$(document).ready(function(){
    
    //prepare host datatable
    dataTable_hosts = $("#datatable_hosts").dataTable({
      "bJQueryUI": true,
      "bSortClasses": false,
      "bAutoWidth":false,
      "sPaginationType": "full_numbers",
      "aoColumnDefs": [
                        { "bSortable": false, "aTargets": ["check"] },
                        { "sWidth": "60px", "aTargets": [0,4] },
                        { "sWidth": "35px", "aTargets": [1] },
                        { "sWidth": "120px", "aTargets": [5,6] }
                       ]
    });
    
    //preload it
    dataTable_hosts.fnClearTable();
    addElement([
        spinner,
        '','','','','','',''],dataTable_hosts);
	//OpenNebula.Host.list({success: updateHostsView,error: onError});
    Sunstone.runAction("Host.list");
    
    setUpCreateHostDialog();
    setUpCreateClusterDialog();
    
    //set refresh interval
    setInterval(function(){
		nodes = $('input:checked',dataTable_hosts.fnGetNodes());
        filter = $("#datatable_hosts_filter input").attr("value");
		if (!nodes.length && !filter.length){
			OpenNebula.Host.list({timeout: true, success: updateHostsView,error: onError});
		}
	},60000);
    
    initCheckAllBoxes(dataTable_hosts);
    tableCheckboxesListener(dataTable_hosts);
    hostInfoListener();
    
        
});
