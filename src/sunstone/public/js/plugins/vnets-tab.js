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
