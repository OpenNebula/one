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
      <th>Owner</th>\
      <th>Group</th>\
      <th>Name</th>\
      <th>Type</th>\
      <th>Bridge</th>\
      <th>Public</th>\
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
                   <select id="leases" name="leases" style="height:10em;" multiple>\
                     <!-- insert leases -->\
                   </select><br />\
                 </fieldset>\
              </div>\
              <div id="ranged">\
                 <fieldset>\
                    <label for="net_address">Network Address:</label>\
                    <input type="text" name="net_address" id="net_address" /><br />\
                    <label for="net_mask">Network Mask:</label>\
                    <input type="text" name="net_mask" id="net_mask" /><br />\
                    <label for="custom_pool" style="height:2em;">Define a subnet by IP range:</label>\
                    <input type="checkbox" name="custom_pool" id="custom_pool" style="margin-bottom:2em;" value="yes" /><br />\
                    <label for="ip_start">IP start:</label>\
                    <input type="text" name="ip_start" id="ip_start" disabled="disabled" /><br />\
                    <label for="ip_end">IP end:</label>\
                    <input type="text" name="ip_end" id="ip_end" disabled="disabled" />\
                 </fieldset>\
              </div>\
            </div>\
            <div class="clear"></div>\
          </fieldset>\
          <fieldset>\
              <div class="">\
                    <label for="custom_var_vnet_name">Name:</label>\
                    <input type="text" id="custom_var_vnet_name" name="custom_var_vnet_name" /><br />\
                    <label for="custom_var_vnet_value">Value:</label>\
                    <input type="text" id="custom_var_vnet_value" name="custom_var_vnet_value" /><br />\
                    <button class="add_remove_button add_button" id="add_custom_var_vnet_button" value="add_custom_vnet_var">Add</button>\
                    <button class="add_remove_button" id="remove_custom_var_vnet_button" value="remove_custom_vnet_var">Remove selected</button>\
                    <div class="clear"></div>\
                    <label for="custom_var_vnet_box">Custom attributes:</label>\
                    <select id="custom_var_vnet_box" name="custom_var_vnet_box" style="height:100px;" multiple>\
                    </select>\
              </div>\
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

var update_vnet_tmpl =
   '<form action="javascript:alert(\'js error!\');">\
         <h3 style="margin-bottom:10px;">Please, choose and modify the virtual network you want to update:</h3>\
            <fieldset style="border-top:none;">\
                 <label for="vnet_template_update_select">Select a network:</label>\
                 <select id="vnet_template_update_select" name="vnet_template_update_select"></select>\
                 <div class="clear"></div>\
                 <div>\
                   <label for="vnet_template_update_public">Public:</label>\
                   <input type="checkbox" name="vnet_template_update_public" id="vnet_template_update_public" />\
                 </div>\
                 <label for="vnet_template_update_textarea">Template:</label>\
                 <div class="clear"></div>\
                 <textarea id="vnet_template_update_textarea" style="width:100%; height:14em;"></textarea>\
            </fieldset>\
            <fieldset>\
                 <div class="form_buttons">\
                    <button class="button" id="vnet_template_update_button" value="Network.update_template">\
                       Update\
                    </button>\
                 </div>\
            </fieldset>\
</form>';

var dataTable_vNetworks;
var $create_vn_dialog;
var $lease_vn_dialog;

//Setup actions

var vnet_actions = {
    "Network.create" : {
        type: "create",
        call: OpenNebula.Network.create,
        callback: addVNetworkElement,
        error: onError,
        notify: true
    },

    "Network.create_dialog" : {
        type: "custom",
        call: popUpCreateVnetDialog
    },

    "Network.list" : {
        type: "list",
        call: OpenNebula.Network.list,
        callback: updateVNetworksView,
        error: onError
    },

    "Network.show" : {
        type: "single",
        call: OpenNebula.Network.show,
        callback: updateVNetworkElement,
        error: onError
    },

    "Network.showinfo" : {
        type: "single",
        call: OpenNebula.Network.show,
        callback: updateVNetworkInfo,
        error: onError

    },

    "Network.refresh" : {
        type: "custom",
        call: function(){
            waitingNodes(dataTable_vNetworks);
            Sunstone.runAction("Network.list");
        }
    },

    "Network.autorefresh" : {
        type: "custom",
        call: function() {
            OpenNebula.Network.list({timeout: true, success: updateVNetworksView, error: onError});
        }
    },

    "Network.publish" : {
        type: "multiple",
        call: OpenNebula.Network.publish,
        callback: vnShow,
        elements: vnElements,
        error: onError,
        notify: true
    },

    "Network.unpublish" : {
        type: "multiple",
        call: OpenNebula.Network.unpublish,
        callback: vnShow,
        elements: vnElements,
        error: onError,
        notify: true
    },

    "Network.delete" : {
        type: "multiple",
        call: OpenNebula.Network.delete,
        callback: deleteVNetworkElement,
        elements: vnElements,
        error: onError,
        notify: true
    },

    "Network.addleases" : {
        type: "single",
        call: OpenNebula.Network.addleases,
        callback: vnShow,
        error: onError,
        notify: false,
    },

    "Network.rmleases" : {
        type: "single",
        call: OpenNebula.Network.rmleases,
        callback: vnShow,
        error: onError,
        notify: false,
    },

    "Network.hold" : {
        type: "single",
        call: OpenNebula.Network.hold,
        callback: vnShow,
        error: onError,
        notify: false,
    },

    "Network.release" : {
        type: "single",
        call: OpenNebula.Network.release,
        callback: vnShow,
        error: onError,
        notify: false,
    },

    "Network.chown" : {
        type: "multiple",
        call: OpenNebula.Network.chown,
        callback: vnShow,
        elements: vnElements,
        error:onError,
        notify: true
    },

    "Network.chgrp" : {
        type: "multiple",
        call: OpenNebula.Network.chgrp,
        callback: vnShow,
        elements: vnElements,
        error:onError,
        notify: true
    },

    "Network.fetch_template" : {
        type: "single",
        call: OpenNebula.Network.fetch_template,
        callback: function (request,response) {
            $('#vnet_template_update_dialog #vnet_template_update_textarea').val(response.template);
        },
        error: onError
    },

    "Network.update_dialog" : {
        type: "custom",
        call: function() {
            popUpVNetTemplateUpdateDialog();
        }
    },

    "Network.update" : {
        type: "single",
        call: OpenNebula.Network.update,
        callback: function() {
            notifyMessage("Template updated correctly");
        },
        error: onError
    },

};


var vnet_buttons = {
    "Network.refresh" : {
        type: "image",
        text: "Refresh list",
        img: "images/Refresh-icon.png"
    },

    "Network.create_dialog" : {
        type: "create_dialog",
        text: "+ New"
    },

    "Network.update_dialog" : {
        type: "action",
        text: "Update a template",
        alwaysActive: true
    },

    "Network.publish" : {
        type: "action",
        text: "Publish"
    },

    "Network.unpublish" : {
        type: "action",
        text: "Unpublish"
    },

    "Network.chown" : {
        type: "confirm_with_select",
        text: "Change owner",
        select: users_sel,
        tip: "Select the new owner:",
        condition: mustBeAdmin
    },

    "Network.chgrp" : {
        type: "confirm_with_select",
        text: "Change group",
        select: groups_sel,
        tip: "Select the new group:",
        condition: mustBeAdmin,
    },

    "Network.delete" : {
        type: "action",
        text: "Delete"
    }
}

var vnet_info_panel = {
    "vnet_info_tab" : {
        title: "Virtual network information",
        content: ""
    },
    "vnet_leases_tab" : {
        title: "Lease management",
        content: ""
    },
}

var vnets_tab = {
    title: "Virtual Networks",
    content: vnets_tab_content,
    buttons: vnet_buttons
}

Sunstone.addActions(vnet_actions);
Sunstone.addMainTab('vnets_tab',vnets_tab);
Sunstone.addInfoPanel('vnet_info_panel',vnet_info_panel);


function vnElements(){
    return getSelectedNodes(dataTable_vNetworks);
}

function vnShow(req){
    Sunstone.runAction("Network.show",req.request.data[0]);
}

//returns an array with the VNET information fetched from the JSON object
function vNetworkElementArray(vn_json){
    var network = vn_json.VNET;

    return [
        '<input class="check_item" type="checkbox" id="vnetwork_'+network.ID+'" name="selected_items" value="'+network.ID+'"/>',
        network.ID,
        network.UNAME,
        network.GNAME,
        network.NAME,
        parseInt(network.TYPE) ? "FIXED" : "RANGED",
        network.BRIDGE,
        parseInt(network.PUBLIC) ? '<input class="action_cb" id="cb_public_vnet" type="checkbox" elem_id="'+network.ID+'" checked="checked"/>'
            : '<input class="action_cb" id="cb_public_vnet" type="checkbox" elem_id="'+network.ID+'"/>',
        network.TOTAL_LEASES ];
}


//Adds a listener to show the extended info when clicking on a row
function vNetworkInfoListener(){

    $('#tbodyvnetworks tr',dataTable_vNetworks).live("click", function(e){
        if ($(e.target).is('input')) {return true;}
        popDialogLoading();
        var aData = dataTable_vNetworks.fnGetData(this);
        var id = $(aData[0]).val();
        Sunstone.runAction("Network.showinfo",id);
        return false;
    });
}

//Callback to update a vnet element after an action on it
function updateVNetworkElement(request, vn_json){
    id = vn_json.VNET.ID;
    element = vNetworkElementArray(vn_json);
    updateSingleElement(element,dataTable_vNetworks,'#vnetwork_'+id);

    //we update this too, even if it's not shown.
    $('#leases_form').replaceWith(printLeases(vn_json.VNET));
}

//Callback to delete a vnet element from the table
function deleteVNetworkElement(req){
    deleteElement(dataTable_vNetworks,'#vnetwork_'+req.request.data);
}

//Callback to add a new element
function addVNetworkElement(request,vn_json){
    var element = vNetworkElementArray(vn_json);
    addElement(element,dataTable_vNetworks);
    //we update this too, even if it's not shown.
    $('#leases_form').replaceWith(printLeases(vn_json.VNET));
}

//updates the list of virtual networks
function updateVNetworksView(request, network_list){
    var network_list_array = [];

    $.each(network_list,function(){
        network_list_array.push(vNetworkElementArray(this));
    });

    updateView(network_list_array,dataTable_vNetworks);
    //dependency with dashboard
    updateDashboard("vnets",network_list);

}

//updates the information panel tabs and pops the panel up
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
            <tr>\
            <tr>\
              <td class="key_td">Name</td>\
              <td class="value_td">'+vn_info.NAME+'</td>\
            <tr>\
            <tr>\
              <td class="key_td">Owner</td>\
              <td class="value_td">'+vn_info.UNAME+'</td>\
            </tr>\
            <tr>\
              <td class="key_td">Group</td>\
              <td class="value_td">'+vn_info.GNAME+'</td>\
            </tr>\
            <tr>\
              <td class="key_td">Public</td>\
              <td class="value_td">'+(parseInt(vn_info.PUBLIC) ? "yes" : "no" )+'</td>\
            </tr>\
            <tr>\
              <td class="key_td">Physical device</td>\
              <td class="value_td">'+ (typeof(vn_info.PHYDEV) == "object" ? "--": vn_info.PHYDEV) +'</td>\
            </tr>\
            <tr>\
              <td class="key_td">VNET ID</td>\
              <td class="value_td">'+ (typeof(vn_info.VLAN_ID) == "object" ? "--": vn_info.VLAN_ID) +'</td>\
            </tr>\
        </table>';

    info_tab_content += '\
          <table id="vn_template_table" class="info_table">\
            <thead><tr><th colspan="2">Virtual Network template (attributes)</th></tr></thead>'+
            prettyPrintJSON(vn_info.TEMPLATE)+
         '</table>'


    var leases_tab_content = printLeases(vn_info);

    var info_tab = {
        title: "Virtual Network information",
        content: info_tab_content
    };

    var leases_tab = {
        title: "Lease management",
        content: leases_tab_content
    };

    Sunstone.updateInfoPanelTab("vnet_info_panel","vnet_info_tab",info_tab);
    Sunstone.updateInfoPanelTab("vnet_info_panel","vnet_leases_tab",leases_tab);

    Sunstone.popUpInfoPanel("vnet_info_panel");

}

function printLeases(vn_info){
    var html ='<form style="display:inline-block;width:80%" id="leases_form" vnid="'+vn_info.ID+'"><table id="vn_leases_info_table" class="info_table" style="width:100%;">\
               <thead>\
                  <tr><th colspan="2">Leases information</th></tr>\
               </thead><tbody>';

    if (vn_info.TYPE == "0"){
        html += '<tr>\
                   <td class="key_td">IP Start</td>\
                   <td class="value_td">'+vn_info.RANGE.IP_START+'</td>\
                 </tr>\
                 <tr>\
                   <td class="key_td">IP End</td>\
                   <td class="value_td">'+vn_info.RANGE.IP_END+'</td>\
                 </tr\>\
                 <tr>\
                   <td class="key_td">Network mask</td>\
                   <td class="value_td">'+( vn_info.TEMPLATE.NETWORK_MASK ? vn_info.TEMPLATE.NETWORK_MASK : "--" )+'</td>\
                 </tr\>\
                 <tr><td class="key_td">\
                   <label for="panel_hold_lease">Hold lease:</label></td><td class="value_td"><input type="text" id="panel_hold_lease" style="width:9em;"/>\
                  <button id="panel_hold_lease_button">Hold</button>\
             </td></tr>';
    } else {
        html += '<tr><td class="key_td">\
                 <label for="panel_add_lease">Add lease:</label></td><td class="value_td"><input type="text" id="panel_add_lease" style="width:9em;"/>\
                <button id="panel_add_lease_button">Add</button>\
             </td></tr>';
    };

    var leases = vn_info.LEASES.LEASE;

    if (!leases) //empty
    {
        html+='<tr id="no_leases_tr"><td class="key_td">\
                   No leases to show\
                   </td>\
               <td class="value_td">\
                   </td></tr>';
        return html;
    }
    else if (leases.constructor != Array) //>1 lease
    {
        leases = [leases];
    };

    var lease;
    var state=null;

    for (var i=0; i<leases.length; i++){
        lease = leases[i];

        if (lease.USED != "0" && lease.VID == "-1") { //hold
            state = 2;
        } else { //free
            state = parseInt(lease.USED,10);
        };


        html+='<tr ip="'+lease.IP+'"><td class="key_td">';
        html+='<img style="vertical-align:middle;margin-right:5px;" ';
        switch (state){
        case 0: //free
            html += 'src="images/green_bullet.png" />';
            break;
        case 1: //used
            html += 'src="images/red_bullet.png" />';
            break;
        case 2: //hold
            html += 'src="images/yellow_bullet.png" />';
            break;
        };

        html += lease.IP + '</td>';

        html += '<td class="value_td">\
                 '+lease.MAC+'&nbsp;&nbsp;&nbsp';

        switch (state){
        case 0:
            html += '<a class="hold_lease" href="#">hold</a> | <a class="delete_lease" href="#">delete</a>';
            break;
        case 1:
            html += 'Used by VM '+lease.VID;
            break;
        case 2:
            html += '<a class="release_lease" href="#">release</a>';
            break;
        };
        html += '</td></tr>';
    };

    html += '</tbody></table></form>';

    return html;
}

//Prepares the vnet creation dialog
function setupCreateVNetDialog() {
    dialogs_context.append('<div title="Create Virtual Network" id="create_vn_dialog"></div>');
    $create_vn_dialog = $('#create_vn_dialog',dialogs_context)
    var dialog = $create_vn_dialog;
    dialog.html(create_vn_tmpl);

    var height = Math.floor($(window).height()*0.8); //set height to a percentage of the window

    //Prepare the jquery-ui dialog. Set style options here.
    dialog.dialog({
        autoOpen: false,
        modal: true,
        width: 475,
        height: height
    });

    //Make the tabs look nice for the creation mode
    $('#vn_tabs',dialog).tabs();
    $('div#ranged',dialog).hide();
    $('#fixed_check',dialog).click(function(){
        $('div#fixed',$create_vn_dialog).show();
        $('div#ranged',$create_vn_dialog).hide();
    });
    $('#ranged_check',dialog).click(function(){
        $('div#fixed',$create_vn_dialog).hide();
        $('div#ranged',$create_vn_dialog).show();
    });
    $('button',dialog).button();


    //When we hit the add lease button...
    $('#add_lease',dialog).click(function(){
        var create_form = $('#create_vn_form_easy',$create_vn_dialog); //this is our scope

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
        $('select#leases',$create_vn_dialog).append(lease);
        return false;
    });

    $('#remove_lease', dialog).click(function(){
        $('select#leases :selected',$create_vn_dialog).remove();
        return false;
    });

    $('#custom_pool', dialog).change(function(){
        if ($(this).is(':checked')){
            $('#ip_start', $create_vn_dialog).removeAttr('disabled');
            $('#ip_end', $create_vn_dialog).removeAttr('disabled');
        }
        else {
            $('#ip_start', $create_vn_dialog).attr('disabled','disabled');
            $('#ip_end', $create_vn_dialog).attr('disabled','disabled');
        };
    });


    $('#add_custom_var_vnet_button', dialog).click(
        function(){
            var name = $('#custom_var_vnet_name',$create_vn_dialog).val();
            var value = $('#custom_var_vnet_value',$create_vn_dialog).val();
            if (!name.length || !value.length) {
                notifyError("Custom attribute name and value must be filled in");
                return false;
            }
            option= '<option value=\''+value+'\' name=\''+name+'\'>'+
                name+'='+value+
                '</option>';
            $('select#custom_var_vnet_box',$create_vn_dialog).append(option);
            return false;
        }
    );

    $('#remove_custom_var_vnet_button', dialog).click(
        function(){
            $('select#custom_var_vnet_box :selected',$create_vn_dialog).remove();
            return false;
        }
    );


    //Handle submission of the easy mode
    $('#create_vn_form_easy',dialog).submit(function(){
        //Fetch values
        var name = $('#name',this).val();
        if (!name.length){
            notifyError("Virtual Network name missing!");
            return false;
        }
        var bridge = $('#bridge',this).val();
        var type = $('input:checked',this).val();

        //TODO: Name and bridge provided?!

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
            var network_mask = $('#net_mask',this).val();
            var custom = $('#custom_pool',this).is(':checked');
            var ip_start = $('#ip_start',this).val();
            var ip_end = $('#ip_end',this).val();

            if (!network_addr.length){
                notifyError("Please provide a network address");
                return false;
            };

            //we form the object for the request
            network_json = {
                "vnet" : {
                    "type" : "RANGED",
                    "bridge" : bridge,
                    "network_mask" : network_mask,
                    "network_address" : network_addr,
                    "name" : name }
            };

            if (custom){
                if (ip_start.length)
                    network_json["vnet"]["ip_start"] = ip_start;
                if (ip_end.length)
                    network_json["vnet"]["ip_start"] = ip_end;
            };
        };

        //Time to add custom attributes
        $('#custom_var_vnet_box option',$create_vn_dialog).each(function(){
            var attr_name = $(this).attr("name");
            var attr_value = $(this).val();
            network_json["vnet"][attr_name] = attr_value;
        });

        //Create the VNetwork.

        Sunstone.runAction("Network.create",network_json);
        $create_vn_dialog.dialog('close');
        return false;
    });

    $('#create_vn_form_manual',dialog).submit(function(){
        var template=$('#template',this).val();
        var vnet_json = {vnet: {vnet_raw: template}};
        Sunstone.runAction("Network.create",vnet_json);
        $create_vn_dialog.dialog('close');
        return false;
    });
}

function popUpCreateVnetDialog() {
    $create_vn_dialog.dialog('open');
}


function setupVNetTemplateUpdateDialog(){
    //Append to DOM
    dialogs_context.append('<div id="vnet_template_update_dialog" title="Update network template"></div>');
    var dialog = $('#vnet_template_update_dialog',dialogs_context);

    //Put HTML in place
    dialog.html(update_vnet_tmpl);

    //Convert into jQuery
    dialog.dialog({
        autoOpen:false,
        width:700,
        modal:true,
        height:480,
        resizable:false,
    });

    $('button',dialog).button();

    $('#vnet_template_update_select',dialog).change(function(){
        var id = $(this).val();
        if (id && id.length){
            var dialog = $('#vnet_template_update_dialog');
            $('#vnet_template_update_textarea',dialog).val("Loading...");

            var vnet_public = is_public_vnet(id);

            if (vnet_public){
                $('#vnet_template_update_public',dialog).attr("checked","checked")
            } else {
                $('#vnet_template_update_public',dialog).removeAttr("checked")
            }

            Sunstone.runAction("Network.fetch_template",id);
        } else {
            $('#vnet_template_update_textarea',dialog).val("");
        };
    });

    $('#vnet_template_update_button',dialog).click(function(){
        var dialog = $('#vnet_template_update_dialog');
        var new_template = $('#vnet_template_update_textarea',dialog).val();
        var id = $('#vnet_template_update_select',dialog).val();
        if (!id || !id.length) {
            dialog.dialog('close');
            return false;
        };

        var old_public = is_public_vnet(id);

        var new_public = $('#vnet_template_update_public:checked',dialog).length;

        if (old_public != new_public){
            if (new_public) Sunstone.runAction("Network.publish",id);
            else Sunstone.runAction("Network.unpublish",id);
        };

        Sunstone.runAction("Network.update",id,new_template);
        dialog.dialog('close');
        return false;
    });
};

function popUpVNetTemplateUpdateDialog(){
    var select = makeSelectOptions(dataTable_vNetworks,
                                   1,//id_col
                                   4,//name_col
                                   [],
                                   []
                                  );
    var sel_elems = getSelectedNodes(dataTable_vNetworks);


    var dialog =  $('#vnet_template_update_dialog');
    $('#vnet_template_update_select',dialog).html(select);
    $('#vnet_template_update_textarea',dialog).val("");
    $('#vnet_template_update_public',dialog).removeAttr("checked")

    if (sel_elems.length >= 1){ //several items in the list are selected
        //grep them
        var new_select= sel_elems.length > 1? '<option value="">Please select</option>' : "";
        $('option','<select>'+select+'</select>').each(function(){
            var val = $(this).val();
            if ($.inArray(val,sel_elems) >= 0){
                new_select+='<option value="'+val+'">'+$(this).text()+'</option>';
            };
        });
        $('#vnet_template_update_select',dialog).html(new_select);
        if (sel_elems.length == 1) {
            $('#vnet_template_update_select option',dialog).attr("selected","selected");
            $('#vnet_template_update_select',dialog).trigger("change");
        }

    };

    dialog.dialog('open');
    return false;

}

function setupLeasesOps(){
    $('button#panel_add_lease_button').live("click",function(){
        var lease = $(this).prev().val();
        //var mac = $(this).previous().val();
        var id = $(this).parents('form').attr('vnid');
        if (lease.length){
            var obj = {ip: lease};
            Sunstone.runAction('Network.addleases',id,obj);
        }
        return false;
    });

    $('button#panel_hold_lease_button').live("click",function(){
        var lease = $(this).prev().val();
        //var mac = $(this).previous().val();
        var id = $(this).parents('form').attr('vnid');
        if (lease.length){
            var obj = {ip: lease};
            Sunstone.runAction('Network.hold',id,obj);
        }
        return false;
    });

    $('form#leases_form a.delete_lease').live("click",function(){
        var lease = $(this).parents('tr').attr('ip');
        var id = $(this).parents('form').attr('vnid');
        var obj = { ip: lease};
        Sunstone.runAction('Network.rmleases',id,obj);
        //Set spinner
        $(this).parents('tr').html('<td class="key_td">'+spinner+'</td><td class="value_td"></td>');
        return false;
    });

    $('a.hold_lease').live("click",function(){
        var lease = $(this).parents('tr').attr('ip');
        var id = $(this).parents('form').attr('vnid');
        var obj = { ip: lease};
        Sunstone.runAction('Network.hold',id,obj);
        //Set spinner
        $(this).parents('tr').html('<td class="key_td">'+spinner+'</td><td class="value_td"></td>');
        return false;
    });

    $('a.release_lease').live("click",function(){
        var lease = $(this).parents('tr').attr('ip');
        var id = $(this).parents('form').attr('vnid');
        var obj = { ip: lease};
        Sunstone.runAction('Network.release',id,obj);
        //Set spinner
        $(this).parents('tr').html('<td class="key_td">'+spinner+'</td><td class="value_td"></td>');
        return false;
    });
}

function setVNetAutorefresh() {
    setInterval(function(){
        var checked = $('input.check_item:checked',dataTable_vNetworks);
        var filter = $("#datatable_vnetworks_filter input",
                       dataTable_vNetworks.parents("#datatable_vnetworks_wrapper")).attr("value");
        if (!checked.length && !filter.length){
            Sunstone.runAction("Network.autorefresh");
        }
    },INTERVAL+someTime());
};

function is_public_vnet(id) {
    var data = getElementData(id,"#vnetwork",dataTable_vNetworks)[7];
    return $(data).is(":checked");
};

function setupVNetActionCheckboxes(){
    $('input.action_cb#cb_public_vnet',dataTable_vNetworks).live("click",function(){
        var $this = $(this)
        var id=$this.attr("elem_id");
        if ($this.attr("checked"))
                Sunstone.runAction("Network.publish",id);
        else Sunstone.runAction("Network.unpublish",id);

        return true;
    });
}

//The DOM is ready and the ready() from sunstone.js
//has been executed at this point.
$(document).ready(function(){

    dataTable_vNetworks = $("#datatable_vnetworks",main_tabs_context).dataTable({
        "bJQueryUI": true,
        "bSortClasses": false,
        "bAutoWidth":false,
        "sPaginationType": "full_numbers",
        "aoColumnDefs": [
            { "bSortable": false, "aTargets": ["check"] },
            { "sWidth": "60px", "aTargets": [0,5,6,7,8] },
            { "sWidth": "35px", "aTargets": [1] },
            { "sWidth": "100px", "aTargets": [2,3] }
        ]
    });

    dataTable_vNetworks.fnClearTable();
    addElement([
        spinner,
        '','','','','','','',''],dataTable_vNetworks);
    Sunstone.runAction("Network.list");

    setupCreateVNetDialog();
    setupVNetTemplateUpdateDialog();
    //setupAddRemoveLeaseDialog();
    setupLeasesOps();
    setupVNetActionCheckboxes();
    setVNetAutorefresh();

    initCheckAllBoxes(dataTable_vNetworks);
    tableCheckboxesListener(dataTable_vNetworks);
    vNetworkInfoListener();
});
