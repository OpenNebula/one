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

/*Virtual networks tab plugin*/

var vnets_tab_content = 
'<form id="virtualNetworks_form" action="javascript:alert(\'js error!\');">\
  <div class="action_blocks">\
  </div>\
<table id="datatable_vnetworks" class="display">\
  <thead>\
    <tr>\
      <th class="check"><input type="checkbox" class="check_all" value="">All</input></th>\
      <th>ID</th>\
      <th>User</th>\
      <th>Name</th>\
      <th>Type</th>\
      <th>Bridge</th>\
      <th>Public?</th>\
      <th>Total Leases</th>\
    </tr>\
  </thead>\
  <tbody id="tbodyvnetworks">\
  </tbody>\
</table>\
</form>';

var create_vn_tmpl =
'<div id="vn_tabs">\
	<ul>\
		<li><a href="#easy">Wizard</a></li>\
		<li><a href="#manual">Advanced mode</a></li>\
	</ul>\
	<div id="easy">\
		<form id="create_vn_form_easy" action="">\
			<fieldset>\
				<label for="name">Name:</label>\
				<input type="text" name="name" id="name" /><br />\
			</fieldset>\
			<fieldset>\
				<label for="bridge">Bridge:</label>\
				<input type="text" name="bridge" id="bridge" /><br />\
			</fieldset>\
			<fieldset>\
				<label style="height:2em;">Network type:</label>\
				<input type="radio" name="fixed_ranged" id="fixed_check" value="fixed" checked="checked">Fixed network</input><br />\
				<input type="radio" name="fixed_ranged" id="ranged_check" value="ranged">Ranged network</input><br />\
			</fieldset>\
			<div class="clear"></div>\
			<div id="easy_tabs">\
					<div id="fixed">\
					<fieldset>\
						<label for="leaseip">Lease IP:</label>\
						<input type="text" name="leaseip" id="leaseip" /><br />\
						<label for="leasemac">Lease MAC (opt):</label>\
						<input type="text" name="leasemac" id="leasemac" />\
						<div class="clear"></div>\
						<button class="add_remove_button add_button" id="add_lease" value="add/lease">\
						Add\
						</button>\
						<button class="add_remove_button" id="remove_lease" value="remove/lease">\
						Remove selected\
						</button>\
						<label for="leases">Current leases:</label>\
						<select id="leases" name="leases" size="10" style="width:150px" multiple>\
						<!-- insert leases -->\
						</select><br />\
					</fieldset>\
					</div>\
					<div id="ranged">\
					<fieldset>\
						<label for="net_address">Network Address:</label>\
						<input type="text" name="net_address" id="net_address" /><br />\
						<label for="net_size">Network size:</label>\
						<input type="text" name="net_size" id="net_size" />\
					</fieldset>\
					</div>\
				</div>\
			<div class="clear"></div>\
			</fieldset>\
			<fieldset>\
			<div class="form_buttons">\
					<button class="button" id="create_vn_submit_easy" value="vn/create">\
					Create\
					</button>\
					<button class="button" type="reset" value="reset">Reset</button>\
				</div>\
			</fieldset>\
		</form>\
	</div>\
	<div id="manual">\
		<form id="create_vn_form_manual" action="">\
		  <h3 style="margin-bottom:10px;">Write the Virtual Network template here</h3>\
		  <fieldset style="border-top:none;">\
		    <textarea id="template" rows="15" style="width:100%;"></textarea>\
	     	<div class="clear"></div>\
	     </fieldset>\
	     <fieldset>\
	     	<div class="form_buttons">\
	    	<button class="button" id="create_vn_submit_manual" value="vn/create">\
		    Create\
		    </button>\
		    <button class="button" type="reset" value="reset">Reset</button>\
		    </div>\
		  </fieldset>\
		</form>\
	</div>\
</div>';

var vnetworks_select="";
var network_list_json = {};
var dataTable_vNetworks;

//Setup actions

var vnet_actions = {
    "Network.create" : {
        type: "create",
        call: OpenNebula.Network.create,
        callback: addVNetworkElement,
        error: onError,
        notify: False
    },
    
    "Network.create_dialog" : {
        type: "custom",
        call: popUpCreateNetworkDialog
    },
    
    "Network.list" : {
        type: "list",
        call: OpenNebula.Network.list,
        callback: updateVNetworksView,
        error: onError,
        notify: False
    },
    
    "Network.show" : {
        type: "single",
        call: OpenNebula.Network.show,
        callback: updateVNetworkElement,
        error: onError,
        notify: False
    },
    
    "Network.showinfo" : {
        type: "single",
        call: OpenNebula.Network.show,
        callback: updateVNetworkInfo,
        error: onError,
        notify: False
        }
    },
    
    "Network.refresh" : {
        type: "custom",
        call: function(){
            waitingNodes(dataTable_vNetworks);
            Sunstone.runAction("Network.list");
        },
        notify: False
    },
    
    "Network.publish" : {
        type: "multiple",
        call: OpenNebula.Network.publish,
        callback: function (req) {
            Sunstone.runAction("Network.show",req.request.data[0]);
        },
        dataTable: function() { return dataTable_vNetworks; },
        error: onError,
        notify:  False        
    },
            
    "Network.unpublish" : {
        type: "multiple",
        call: OpenNebula.Network.unpublish,
        callback:  function (req) {
            Sunstone.runAction("Network.show",req.request.data[0]);
        },
        dataTable: function() { return dataTable_vNetworks; },
        error: onError,
        notify:  False                       
    },
            
    "Network.delete" : {
        type: "multiple",
        call: OpenNebula.Network.delete,
        callback: deleteVNetworkElement,
        dataTable: function() { return dataTable_vNetworks; },
        error: onError,
        notify:  False                            
    }
    
}


var vnet_buttons = {
    "Network.refresh" : {
        type: "image",
        text: "Refresh list",
        img: "/images/Refresh-icon.png",
        condition: True
    },
    
    "Network.create_dialog" : {
        type: "create_dialog",
        text: "+ New",
        condition: True
    },
    
    "Network.publish" : {
        type: "action",
        text: "Publish",
        condition: True
    },
    
    "Network.unpublish" : {
        type: "action",
        text: "Unpublish",
        condition: True
    },
    
    "Network.delete" : {
        type: "action",
        text: "Delete",
        condition: True
    }
}

var vnet_info_panel = {
    "info_tab" : {
        
    },
    "template_tab" : {
        
    }
}

for (action in vnet_actions){
    Sunstone.addAction(action,vnet_actions[action]);
}

Sunstone.addMainTab('vnets_tab',"Virtual Networks",vnets_tab_content, vnet_buttons);
Sunstone.addInfoPanel('vnet_info_panel',vnet_info_panel);


function vNetworkElementArray(vn_json){
	network = vn_json.VNET;
    if (network.TOTAL_LEASES){
        total_leases = network.TOTAL_LEASES;
    }else if (network.LEASES && network.LEASES.LEASE){
        total_leases = network.LEASES.LEASE.length ? network.LEASES.LEASE.length : "1";
    } else{
        total_leases = "0";
    }
	username = network.USERNAME? network.USERNAME : getUserName(network.UID)
	return ['<input type="checkbox" id="vnetwork_'+network.ID+'" name="selected_items" value="'+network.ID+'"/>',
		network.ID,
		username,
		network.NAME,
		parseInt(network.TYPE) ? "FIXED" : "RANGED",
		network.BRIDGE,
		parseInt(network.PUBLIC) ? "yes" : "no",
		total_leases ];
}


//Adds a listener to show the extended info when clicking on a row
function vNetworkInfoListener(){

	$('#tbodyvnetworks tr').live("click", function(e){
		if ($(e.target).is('input')) {return true;}
		aData = dataTable_vNetworks.fnGetData(this);
		id = $(aData[0]).val();
		Sunstone.runAction("Network.showinfo",id);
		return false;
	});
}

function updateNetworkSelect(network_list){
	//update select helper
	vnetworks_select="";
	vnetworks_select += "<option value=\"\">Select a network</option>";
	$.each(network_list, function(){
		vnetworks_select += "<option value=\""+this.VNET.NAME+"\">"+this.VNET.NAME+"</option>";

	});

	//update static selectors
	$('div.vm_section#networks select#NETWORK').html(vnetworks_select);
}

function updateVNetworkElement(request, vn_json){
	id = vn_json.VNET.ID;
	element = vNetworkElementArray(vn_json);
	updateSingleElement(element,dataTable_vNetworks,'#vnetwork_'+id);
}

function deleteVNetworkElement(req){
	deleteElement(dataTable_vNetworks,'#vnetwork_'+req.request.data);
    //How to delete vNetwork select option here?
}

function addVNetworkElement(request,vn_json){
	element = vNetworkElementArray(vn_json);
	addElement(element,dataTable_vNetworks);
    vnetworks_select += "<option value=\""+vn_json.VNET.NAME+"\">"+vn_json.VNET.NAME+"</option>";
    $('div.vm_section#networks select#NETWORK').html(vnetworks_select);
}

function updateVNetworksView(request, network_list){
	network_list_json = network_list;
	network_list_array = [];

	$.each(network_list,function(){
		network_list_array.push(vNetworkElementArray(this));
	});

	updateView(network_list_array,dataTable_vNetworks);
	updateNetworkSelect(network_list);
	updateDashboard("vnets",network_list_json);

}


function updateVNetworkInfo(request,vn){
	var vn_info = vn.VNET;
    var info_tab_content = 
    '<table id="info_vn_table" class="info_table">\
			<thead>\
				<tr><th colspan="2">Virtual Network '+vn_info.ID+' information</th></tr>\
			</thead>\
			<tr>\
				<td class="key_td">ID</td>\
				<td class="value_td">'+vn_info.ID+'</td>\
			</tr>\
			<tr>\
				<td class="key_td">UID</td>\
				<td class="value_td">'+vn_info.UID+'</td>\
			</tr>\
			<tr>\
				<td class="key_td">Public</td>\
				<td class="value_td">'+(parseInt(vn_info.PUBLIC) ? "yes" : "no" )+'</td>\
			</tr>\
		</table>';
      
    if (vn_info.TEMPLATE.TYPE == "FIXED"){
		info_tab_content += '<table id="vn_leases_info_table" class="info_table">\
			<thead>\
				<tr><th colspan="2">Leases information</th></tr>\
			</thead>'+
			prettyPrintJSON(vn_info.LEASES)+
		'</table>';
    }
    
    
	var info_tab = {
        title: "Virtual Network information",
        content: info_tab_content
    }
    
    var template_tab = {
        title: "Virtual Network template",
        content: '<table id="vn_template_table" class="info_table">\
		<thead><tr><th colspan="2">Virtual Network template</th></tr></thead>'+
		prettyPrintJSON(vn_info.TEMPLATE)+
		'</table>'
    }
    
    Sunstone.updateInfoPanelTab("vnet_info_panel","vnet_info_tab",info_tab);
    Sunstone.updateInfoPanelTab("vnet_info_panel","vnet_template_tab",template_tab);
        
    Sunstone.popUpInfoPanel("vnet_info_panel");

}


function setupCreateVNetDialog {
     
     
    $('div#dialogs').append('<div title="Create Virtual Network" id="create_vn_dialog"></div>');
    
    //Prepare the jquery-ui dialog. Set style options here.
	$('#create_vn_dialog').dialog({
		autoOpen: false,
		modal: true,
		width: 475,
        height: 500
	});

	//Make the tabs look nice for the creation mode
	$('#vn_tabs').tabs();
    $('div#ranged').hide();
    $('#fixed_check').click(function(){
       $('div#fixed').show();
       $('div#ranged').hide();
    });
    $('#ranged_check').click(function(){
        $('div#fixed').hide();
        $('div#ranged').show();
    });
	$('#create_vn_dialog button').button();
    
    
	//When we hit the add lease button...
	$('#add_lease').click(function(){
		var create_form = $('#create_vn_form_easy'); //this is our scope

		//Fetch the interesting values
		var lease_ip = $('#leaseip',create_form).val();
		var lease_mac = $('#leasemac',create_form).val();

		//We don't add anything to the list if there is nothing to add
		if (lease_ip == null) {
			notifyError("Please provide a lease IP");
			return false;
		};


		var lease = ""; //contains the HTML to be included in the select box
		if (lease_mac == "") {
			lease='<option value="' + lease_ip + '">' + lease_ip + '</option>';
		} else {
			lease='<option value="' +
			lease_ip + ',' +
			lease_mac + '">' +
			lease_ip + ',' + lease_mac +
			'</option>';
		};

		//We append the HTML into the select box.
		$('select#leases').append(lease);
		return false;
	});

	$('#remove_lease').click(function(){
		$('select#leases :selected').remove();
		return false;
	});

	//Handle submission of the easy mode
	$('#create_vn_form_easy').submit(function(){
		//Fetch values
		var name = $('#name',this).val();
        if (!name.length){
            notifyError("Virtual Network name missing!");
            return false;
        }
		var bridge = $('#bridge',this).val();
		var type = $('input:checked',this).val();

		//TBD: Name and bridge provided?!

		var network_json = null;
		if (type == "fixed") {
			var leases = $('#leases option', this);
			var leases_obj=[];

			//for each specified lease we prepare the JSON object
			$.each(leases,function(){
				leases_obj.push({"ip": $(this).val() });
			});

			//and construct the final data for the request
			network_json = {
				"vnet" : {
					"type" : "FIXED",
					"leases" : leases_obj,
					"bridge" : bridge,
					"name" : name }};
			}
		else { //type ranged

			var network_addr = $('#net_address',this).val();
			var network_size = $('#net_size',this).val();
			if (!network_addr.length){
				notifyError("Please provide a network address");
				return false;
			};

			//we form the object for the request
			network_json = {
				"vnet" : {
					"type" : "RANGED",
					"bridge" : bridge,
					"network_size" : network_size,
					"network_address" : network_addr,
					"name" : name }
				};
		};

		//Create the VNetwork.
        
        Sunstone.runAction("Network.create",network_json);
		$('#create_vn_dialog').dialog('close');
		return false;
	});

	$('#create_vn_form_manual').submit(function(){
		var template=$('#template',this).val();
        var vnet_json = {vnet: {vnet_raw: template}};
        Sunstone.runAction("Network.create",vnet_json);
        $('#create_vn_dialog').dialog('close');
		return false;
	});
}

function popUpCreateVnetDialog {
    $('#create_vn_dialog').dialog('open');
}


$(document).ready(function(){
    
   dataTable_vNetworks = $("#datatable_vnetworks").dataTable({
      "bJQueryUI": true,
      "bSortClasses": false,
      "bAutoWidth":false,
      "sPaginationType": "full_numbers",
      "aoColumnDefs": [
                        { "bSortable": false, "aTargets": ["check"] },
                        { "sWidth": "60px", "aTargets": [0,4,5,6,7] },
                        { "sWidth": "35px", "aTargets": [1] },
                        { "sWidth": "100px", "aTargets": [2] }
                       ]
    });
    
    dataTable_vNetworks.fnClearTable();
    addElement([
        spinner,
        '','','','','','',''],dataTable_vNetworks);
    Sunstone.runAction("Network.list");
    
    setupCreateVNetDialog();
    
    setInterval(function(){
		var nodes = $('input:checked',dataTable_vNetworks.fnGetNodes());
        var filter = $("#datatable_vnetworks_filter input").attr("value");
		if (!nodes.length && !filter.length){
			OpenNebula.Network.list({timeout: true, success: updateVNetworksView, error: onError});
		}
	},68000);
    
    initCheckAllBoxes(dataTable_vNetworks);
    tableCheckboxesListener(dataTable_vNetworks);
    vNetworkInfoListener()
    
    
}

