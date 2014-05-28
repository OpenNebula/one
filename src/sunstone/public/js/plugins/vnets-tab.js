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

var addresses_vnets = 0;

var create_vn_tmpl =
'<div class="row">'+
  '<div class="large-6 columns">'+
    '<h3 id="create_vnet_header" class="subheader">'+tr("Create Virtual Network")+'</h3>'+
  '</div>'+
  '<div class="large-6 columns">'+
     '<dl class="tabs right wizard_tabs" data-tab>\
        <dd class="active"><a href="#vnet_wizard">'+tr("Wizard")+'</a></dd>\
        <dd><a href="#vnet_advanced">'+tr("Advanced mode")+'</a></dd>\
      </dl>\
  </div>\
</div>\
      <div class="tabs-content">\
        <div class="content active" id="vnet_wizard">\
           <form id="create_vn_form_easy" action="" class="creation">\
            <div class="row">\
              <div class="large-12 columns">\
                <label for="name" >' + tr("Name") + ':</label>\
                <input type="text" name="name" id="name"/>\
              </div>\
            </div>\
            <div class="row">\
              <div class="large-12 columns">\
                <label for="DESCRIPTION" >' + tr("Description") + ':</label>\
                <textarea type="text" id="DESCRIPTION" name="DESCRIPTION"/>\
              </div>\
            </div>\
            <br>\
            <div class="row">\
              <div class="large-12 columns">\
              <fieldset>\
                <legend>' + tr("Type") + '</legend>\
                  <div class="row">\
                    <div class="large-12 columns">\
                      <input type="radio" name="ip_version" id="ipv4_check" value="ipv4" checked="checked"/><label for="ipv4_check">'+tr("IPv4")+'</label>\
                      <input type="radio" name="ip_version" id="ipv6_check" value="ipv6"/><label for="ipv6_check">'+tr("IPv6")+'</label>\
                    </div>\
                  </div>\
                  <div class="row">\
                    <div class="large-6 columns">\
                        <label for="net_address">'+tr("N. Address")+'</label>\
                        <input type="text" name="net_address" id="net_address" />\
                    </div>\
                    <div class="large-6 columns">\
                        <label for="net_mask">'+tr("N. Mask")+':</label>\
                        <input type="text" name="net_mask" id="net_mask" />\
                    </div>\
                  </div>\
                  <div class="row">\
                    <div class="large-6 columns">\
                        <label for="site_prefix">'+tr("Site prefix")+':</label>\
                        <input type="text" name="site_prefix" id="site_prefix" />\
                    </div>\
                    <div class="large-6 columns">\
                        <label for="global_prefix">'+tr("Global prefix")+':</label>\
                        <input type="text" name="global_prefix" id="global_prefix" />\
                    </div>\
                  </div>\
                  <div class="row">\
                    <div class="large-6 columns">\
                        <label for="net_dns">'+tr("DNS")+':</label>\
                        <input type="text" name="net_dns" id="net_dns" />\
                    </div>\
                    <div class="large-6 columns">\
                        <label for="net_gateway">'+tr("Gateway")+':</label>\
                        <input type="text" name="net_gateway" id="net_gateway" />\
                    </div>\
                  </div>\
                  <hr>\
                  <div class="row">\
                    <div class="large-12 columns">\
                      <input type="radio" name="fixed_ranged" id="fixed_check" value="fixed" checked="checked"/><label for="fixed_check">'+tr("Fixed network")+'</label>\
                      <input type="radio" name="fixed_ranged" id="ranged_check" value="ranged"/><label for="ranged_check">'+tr("Ranged network")+'</label>\
                    </div>\
                  </div>\
                  <div id="fixed">\
                     <div class="row">\
                      <div class="large-6 columns">\
                        <div class="row">\
                          <div class="large-12 columns">\
                            <label for="leaseip">'+tr("IP")+':</label>\
                            <input type="text" name="leaseip" id="leaseip" />\
                          </div>\
                        </div>\
                        <div class="row">\
                          <div class="large-12 columns">\
                            <label for="leasemac">'+tr("MAC")+':</label>\
                            <input type="text" name="leasemac" id="leasemac" />\
                          </div>\
                        </div>\
                        <div class="row">\
                          <div class="large-12 columns">\
                            <button class="add_remove_button add_button secondary button small radius" id="add_lease" value="add/lease">'+tr("Add")+'</button>\
                            <button class="add_remove_button secondary button small radius" id="remove_lease" value="remove/lease">'+tr("Remove selected")+'</button>\
                          </div>\
                        </div>\
                      </div>\
                      <div class="large-6 columns">\
                        <div class="row">\
                          <div class="large-12 columns">\
                            <select id="leases" name="leases" style="height:10em !important; width:100%" multiple>\
                              <!-- insert leases -->\
                            </select>\
                          </div>\
                        </div>\
                      </div>\
                     </div>\
                  </div>\
                  <div id="ranged">\
                    <div class="row">\
                      <div class="large-6 columns">\
                        <input type="checkbox" id="custom_pool"/><label for="custom_pool" class="inline">'+tr("Define a subnet by IP range")+'</label>\
                      </div>\
                    </div>\
                    <div class="row">\
                      <div class="large-6 columns">\
                            <label for="ip_start">'+tr("IP Start")+':</label>\
                            <input type="text" name="ip_start" id="ip_start" disabled="disabled" />\
                      </div>\
                      <div class="large-6 columns">\
                            <label for="ip_end">'+tr("IP End")+':</label>\
                            <input type="text" name="ip_end" id="ip_end" disabled="disabled" />\
                      </div>\
                    </div>\
                  </div>\
                  <div id="ranged_ipv6">\
                    <div class="row">\
                      <div class="large-6 columns">\
                            <label for="mac_start">'+tr("MAC Start")+':</label>\
                            <input type="text" name="net_address" id="mac_start" />\
                      </div>\
                      <div class="large-6 columns">\
                            <label for="net_size">'+tr("N. Size")+':</label>\
                            <input type="text" name="net_size" id="net_size" />\
                      </div>\
                    </div>\
                  </div>\
              </fieldset>\
              </div>\
            </div>\
            <div class="row">\
              <div class="large-6 columns">\
                  <label for="bridge">'+tr("Bridge")+':</label>\
                  <input type="text" name="bridge" id="bridge" />\
              </div>\
              <div class="large-6 columns">\
                <label for="network_mode">'+tr("Network model")+':</label>\
                <select name="network_mode" id="network_mode">\
                  <option value="default">'+tr("Default")+'</option>\
                  <option value="802.1Q">'+tr("802.1Q")+'</option>\
                  <option value="ebtables">'+tr("ebtables")+'</option>\
                  <option value="openvswitch">'+tr("Open vSwitch")+'</option>\
                  <option value="vmware">'+tr("VMware")+'</option>\
                </select>\
              </div>\
            </div>\
            <div class="row">\
              <div class="large-6 columns">\
                <div class="row">\
                  <div class="large-12 columns">\
                    <label for="vlan">'+tr("VLAN")+':</label>\
                    <select name="vlan" id="vlan">\
                        <option value="YES" selected="selected">'+tr("Yes")+'</option>\
                        <option value="NO">'+tr("No")+'</option>\
                     </select>\
                  </div>\
                </div>\
                <div class="row">\
                  <div class="large-12 columns">\
                    <label for="vlan_id">'+tr("VLAN ID")+':</label>\
                    <input type="text" name="vlan_id" id="vlan_id" />\
                  </div>\
                </div>\
              </div>\
              <div class="large-6 columns">\
                <div class="row">\
                  <div class="large-12 columns">\
                    <label for="phydev">'+tr("Physical device")+':</label>\
                    <input type="text" name="phydev" id="phydev" />\
                  </div>\
                </div>\
              </div>\
            </div>\
            <br>\
            <div class="row">\
              <div class="large-12 columns">\
                <fieldset>\
                  <legend>' + tr("Custom attributes") + '</legend>\
                   <div class="row">\
                    <div class="large-6 columns">\
                      <div class="row">\
                        <div class="large-12 columns">\
                          <label for="custom_var_vnet_name">'+tr("Name")+':</label>\
                          <input type="text" id="custom_var_vnet_name" name="custom_var_vnet_name" />\
                        </div>\
                      </div>\
                      <div class="row">\
                        <div class="large-12 columns">\
                          <label for="custom_var_vnet_value">'+tr("Value")+':</label>\
                          <input type="text" id="custom_var_vnet_value" name="custom_var_vnet_value" />\
                        </div>\
                      </div>\
                      <div class="row">\
                        <div class="large-12 columns">\
                          <button class="add_remove_button add_button secondary button small radius" id="add_custom_var_vnet_button" value="add_custom_vnet_var">'+tr("Add")+'\</button>\
                          <button class="add_remove_button secondary button small radius" id="remove_custom_var_vnet_button" value="remove_custom_vnet_var">'+tr("Remove selected")+'</button>\
                        </div>\
                      </div>\
                    </div>\
                    <div class="large-6 columns">\
                      <div class="row">\
                        <div class="large-12 columns">\
                          <select id="custom_var_vnet_box" name="custom_var_vnet_box" style="height:10em !important; width:100%" multiple>\
                            <!-- insert leases -->\
                          </select>\
                        </div>\
                      </div>\
                    </div>\
                   </div>\
                </fieldset>\
              </div>\
            </div>\
        <div class="form_buttons">\
          <button class="button success radius right" id="create_vn_submit_easy" value="vn/create">\
             '+tr("Create")+'\
          </button>\
          <button id="wizard_vnet_reset_button" class="button secondary radius" type="reset" value="reset">'+tr("Reset")+'</button>\
        </div>\
        </form>\
      </div>\
      <div id="vnet_advanced" class="content">\
        <form id="create_vn_form_manual" action="">\
          <div class="row">\
            <div class="columns large-12">\
              <h4><small>'+tr("Write the Virtual Network template here")+'</small></h4>\
            </div>\
          </div>\
          <div class="row">\
            <div class="columns large-12">\
              <textarea id="template" rows="15" style="width:100%; height:300px;"></textarea>\
            </div>\
          </div>\
            <div class="form_buttons">\
              <button class="button success right radius" id="create_vn_submit_manual" value="vn/create">'+tr("Create")+'</button>\
              <button id="advanced_vnet_reset_button" class="button secondary radius" type="reset" value="reset">'+tr("Reset")+'</button>\
            </div>\
        </form>\
      </div>\
    </div>\
  <a class="close-reveal-modal">&#215;</a>';

var update_vnet_tmpl =
   '<form action="javascript:alert(\'js error!\');">\
         <h3 style="margin-bottom:10px;">'+tr("Please, choose and modify the virtual network you want to update")+':</h3>\
            <fieldset style="border-top:none;">\
                 <label for="vnet_template_update_select">'+tr("Select a network")+':</label>\
                 <select id="vnet_template_update_select" name="vnet_template_update_select"></select>\
                 <div class="clear"></div>\
                 <div>\
                   <table class="permissions_table" style="padding:0 10px;">\
                     <thead><tr>\
                         <td style="width:130px">'+tr("Permissions")+':</td>\
                         <td style="width:40px;text-align:center;">'+tr("Use")+'</td>\
                         <td style="width:40px;text-align:center;">'+tr("Manage")+'</td>\
                         <td style="width:40px;text-align:center;">'+tr("Admin")+'</td></tr></thead>\
                     <tr>\
                         <td>'+tr("Owner")+'</td>\
                         <td style="text-align:center"><input type="checkbox" name="vnet_owner_u" class="owner_u" /></td>\
                         <td style="text-align:center"><input type="checkbox" name="vnet_owner_m" class="owner_m" /></td>\
                         <td style="text-align:center"><input type="checkbox" name="vnet_owner_a" class="owner_a" /></td>\
                     </tr>\
                     <tr>\
                         <td>'+tr("Group")+'</td>\
                         <td style="text-align:center"><input type="checkbox" name="vnet_owner_u" class="group_u" /></td>\
                         <td style="text-align:center"><input type="checkbox" name="vnet_group_m" class="group_m" /></td>\
                         <td style="text-align:center"><input type="checkbox" name="vnet_group_a" class="group_a" /></td>\
                     </tr>\
                     <tr>\
                         <td>'+tr("Other")+'</td>\
                         <td style="text-align:center"><input type="checkbox" name="vnet_other_u" class="other_u" /></td>\
                         <td style="text-align:center"><input type="checkbox" name="vnet_other_m" class="other_m" /></td>\
                         <td style="text-align:center"><input type="checkbox" name="vnet_other_a" class="other_a" /></td>\
                     </tr>\
                   </table>\
                 </div>\
                 <label for="vnet_template_update_textarea">'+tr("Template")+':</label>\
                 <div class="clear"></div>\
                 <textarea id="vnet_template_update_textarea" style="width:100%; height:14em;"></textarea>\
            </fieldset>\
            <fieldset>\
                 <div class="form_buttons">\
                    <button class="button" id="vnet_template_update_button" value="Network.update_template">\
                       '+tr("Update")+'\
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
        callback: function(request, response) {
            // Reset the create wizard
            $create_vn_dialog.foundation('reveal', 'close');
            $create_vn_dialog.empty();
            setupCreateVNetDialog();

            addVNetworkElement(request, response);
            notifyCustom(tr("Virtual Network created"), " ID: " + response.VNET.ID, false);
        },
        error: onError
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
        callback: function(request, response) {
            updateVNetworkElement(request, response);
            if (Sunstone.rightInfoVisible($("#vnets-tab"))) {
                updateVNetworkInfo(request, response);
            }
        },
        error: onError
    },

    "Network.refresh" : {
        type: "custom",
        call: function(){
          var tab = dataTable_vNetworks.parents(".tab");
          if (Sunstone.rightInfoVisible(tab)) {
            Sunstone.runAction("Network.show", Sunstone.rightInfoResourceId(tab))
          } else {
            waitingNodes(dataTable_vNetworks);
            Sunstone.runAction("Network.list", {force: true});
          }
        }
    },

    "Network.publish" : {
        type: "multiple",
        call: OpenNebula.Network.publish,
        callback: function(req) {
          Sunstone.runAction("Network.show",req.request.data[0][0]);
        },
        elements: vnElements,
        error: onError
    },

    "Network.unpublish" : {
        type: "multiple",
        call: OpenNebula.Network.unpublish,
        callback: function(req) {
          Sunstone.runAction("Network.show",req.request.data[0][0]);
        },
        elements: vnElements,
        error: onError
    },

    "Network.delete" : {
        type: "multiple",
        call: OpenNebula.Network.del,
        callback: deleteVNetworkElement,
        elements: vnElements,
        error: onError
    },

    "Network.addleases" : {
        type: "single",
        call: OpenNebula.Network.addleases,
        callback: function(req) {
          Sunstone.runAction("Network.show",req.request.data[0][0]);
        },
        error: onError
    },

    "Network.rmleases" : {
        type: "single",
        call: OpenNebula.Network.rmleases,
        callback: function(req) {
          Sunstone.runAction("Network.show",req.request.data[0][0]);
        },
        error: onError
    },

    "Network.hold" : {
        type: "single",
        call: OpenNebula.Network.hold,
        callback: function(req) {
          Sunstone.runAction("Network.show",req.request.data[0][0]);
        },
        error: onError
    },

    "Network.release" : {
        type: "single",
        call: OpenNebula.Network.release,
        callback: function(req) {
          Sunstone.runAction("Network.show",req.request.data[0][0]);
        },
        error: onError
    },

    "Network.chown" : {
        type: "multiple",
        call: OpenNebula.Network.chown,
        callback: function(req) {
          Sunstone.runAction("Network.show",req.request.data[0]);
        },
        elements: vnElements,
        error:onError
    },

    "Network.chgrp" : {
        type: "multiple",
        call: OpenNebula.Network.chgrp,
        callback: function(req) {
          Sunstone.runAction("Network.show",req.request.data[0]);
        },
        elements: vnElements,
        error:onError
    },

    "Network.chmod" : {
        type: "single",
        call: OpenNebula.Network.chmod,
        callback: function(req) {
          Sunstone.runAction("Network.show",req.request.data[0][0]);
        },
        error: onError
    },

    "Network.rename" : {
        type: "single",
        call: OpenNebula.Network.rename,
        callback: function(request) {
            Sunstone.runAction('Network.show',request.request.data[0][0]);
        },
        error: onError
    },

    "Network.update_template" : {
        type: "single",
        call: OpenNebula.Network.update,
        callback: function(request) {
            Sunstone.runAction('Network.show',request.request.data[0][0]);
        },
        error: onError
    },

    "Network.addtocluster" : {
        type: "multiple",
        call: function(params){
            var cluster = params.data.extra_param;
            var vnet = params.data.id;

            if (cluster == -1){
                //get cluster name
                var current_cluster = getValue(vnet,1,5,dataTable_vNetworks);
                //get cluster id
                current_cluster = getValue(current_cluster,
                                           2,1,dataTable_clusters);
                if (!current_cluster) return;
                Sunstone.runAction("Cluster.delvnet",current_cluster,vnet)
            }
            else
                Sunstone.runAction("Cluster.addvnet",cluster,vnet);
        },
        callback: function(request) {
            Sunstone.runAction('Network.show',request.request.data[0]);
        },
        elements: vnElements
    }
};


var vnet_buttons = {
    "Network.refresh" : {
        type: "action",
        layout: "refresh",
        alwaysActive: true
    },

//    "Sunstone.toggle_top" : {
//        type: "custom",
//        layout: "top",
//        alwaysActive: true
//    },

    "Network.create_dialog" : {
        type: "create_dialog",
        layout: "create"
    },

    "Network.addtocluster" : {
        type: "confirm_with_select",
        text: tr("Select cluster"),
        layout: "main",
        select: "Cluster",
        tip: tr("Select the destination cluster:"),
        condition: mustBeAdmin
    },
    "Network.chown" : {
        type: "confirm_with_select",
        text: tr("Change owner"),
        layout: "user_select",
        select: "User",
        tip: tr("Select the new owner")+":",
        condition: mustBeAdmin
    },

    "Network.chgrp" : {
        type: "confirm_with_select",
        text: tr("Change group"),
        layout: "user_select",
        select: "Group",
        tip: tr("Select the new group")+":",
        condition: mustBeAdmin
    },

    "Network.delete" : {
        type: "confirm",
        layout: "del",
        text: tr("Delete")
    }
}

var vnet_info_panel = {
    "vnet_info_tab" : {
        title: tr("Virtual network information"),
        content: ""
    },
    "vnet_leases_tab" : {
        title: tr("Lease management"),
        content: ""
    }
}

var vnets_tab = {
    title: tr("Virtual Networks"),
    resource: 'Network',
    buttons: vnet_buttons,
    tabClass: "subTab",
    parentTab: "infra-tab",
    search_input: '<input id="vnet_search" type="text" placeholder="'+tr("Search")+'" />',
    list_header: '<i class="fa fa-fw fa-globe"></i>&emsp;'+tr("Virtual Networks"),
    info_header: '<i class="fa fa-fw fa-globe"></i>&emsp;'+tr("Virtual Network"),
    subheader: '<span class="total_vnets"/> <small>'+tr("TOTAL")+'</small>&emsp;\
        <span class="addresses_vnets"/> <small>'+tr("USED IPs")+'</small>',
    table: '<table id="datatable_vnetworks" class="datatable twelve">\
      <thead>\
        <tr>\
          <th class="check"><input type="checkbox" class="check_all" value=""></input></th>\
          <th>'+tr("ID")+'</th>\
          <th>'+tr("Owner")+'</th>\
          <th>'+tr("Group")+'</th>\
          <th>'+tr("Name")+'</th>\
          <th>'+tr("Cluster")+'</th>\
          <th>'+tr("Type")+'</th>\
          <th>'+tr("Bridge")+'</th>\
          <th>'+tr("Leases")+'</th>\
        </tr>\
      </thead>\
      <tbody id="tbodyvnetworks">\
      </tbody>\
    </table>'
}

Sunstone.addActions(vnet_actions);
Sunstone.addMainTab('vnets-tab',vnets_tab);
Sunstone.addInfoPanel('vnet_info_panel',vnet_info_panel);

// return list of selected elements in list
function vnElements(){
    return getSelectedNodes(dataTable_vNetworks);
}

//returns an array with the VNET information fetched from the JSON object
function vNetworkElementArray(vn_json){
    var network = vn_json.VNET;

    addresses_vnets = addresses_vnets + parseInt(network.TOTAL_LEASES);

    return [
        '<input class="check_item" type="checkbox" id="vnetwork_'+network.ID+'" name="selected_items" value="'+network.ID+'"/>',
        network.ID,
        network.UNAME,
        network.GNAME,
        network.NAME,
        network.CLUSTER.length ? network.CLUSTER : "-",
        "--",
        network.BRIDGE,
        network.USED_LEASES ];
}

//Callback to update a vnet element after an action on it
function updateVNetworkElement(request, vn_json){
    id = vn_json.VNET.ID;
    element = vNetworkElementArray(vn_json);
    updateSingleElement(element,dataTable_vNetworks,'#vnetwork_'+id);

    //we update this too, even if it is not shown.
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
    //we update this too, even if it is not shown.
    $('#leases_form').replaceWith(printLeases(vn_json.VNET));
}

//updates the list of virtual networks
function updateVNetworksView(request, network_list){
    var network_list_array = [];

    addresses_vnets = 0;

    $.each(network_list,function(){
        network_list_array.push(vNetworkElementArray(this));
    });

    updateView(network_list_array,dataTable_vNetworks);

    $(".total_vnets").text(network_list.length);
    $(".addresses_vnets").text(addresses_vnets);
}

//updates the information panel tabs and pops the panel up
function updateVNetworkInfo(request,vn){
    var vn_info = vn.VNET;
    var info_tab_content =
        '<div class="row">\
        <div class="large-6 columns">\
        <table id="info_vn_table" class="dataTable extended_table">\
            <thead>\
               <tr><th colspan="3">'+tr("Information")+'</th></tr>\
            </thead>\
            <tr>\
              <td class="key_td">'+tr("ID")+'</td>\
              <td class="value_td">'+vn_info.ID+'</td>\
              <td></td>\
            </tr>'+
            insert_rename_tr(
                'vnets-tab',
                "Network",
                vn_info.ID,
                vn_info.NAME)+
            '<tr>' +
        insert_cluster_dropdown("Network",vn_info.ID,vn_info.CLUSTER,vn_info.CLUSTER_ID,"#info_vn_table") +
            '</tr>\
        </table>\
        </div>\
        <div class="large-6 columns">' +
            insert_permissions_table('vnets-tab',
                                       "Network",
                                       vn_info.ID,
                                       vn_info.UNAME,
                                       vn_info.GNAME,
                                       vn_info.UID,
                                       vn_info.GID) +
        '</div>\
      </div>\
      <div class="row">\
        <div class="large-9 columns">' +
            insert_extended_template_table(vn_info.TEMPLATE,
                                                       "Network",
                                                       vn_info.ID,
                                                       "Attributes") +
        '</div>\
      </div>';

    var info_tab = {
        title : tr("Info"),
        icon: "fa-info-circle",
        content: info_tab_content
    };

    var leases_tab = {
        title: tr("Leases"),
        icon: "fa-list-ul",
        content: printLeases(vn_info)
    };


    Sunstone.updateInfoPanelTab("vnet_info_panel","vnet_info_tab",info_tab);
    Sunstone.updateInfoPanelTab("vnet_info_panel","vnet_leases_tab",leases_tab);

    Sunstone.popUpInfoPanel("vnet_info_panel", "vnets-tab");

    setPermissionsTable(vn_info,'');
}

// Prints the lis of leases depending on the Vnet TYPE
// It adds the "add lease", "hold lease" fields, and each lease comes with
// hold, release buttons etc. Listeners in setupLeasesOps()
function printLeases(vn_info){
    var html ='<form id="leases_form" vnid="'+vn_info.ID+'"><div class="row">';

    html += '<div class="large-6 columns"><table id="vn_leases_info_table" class="dataTable extended_table">\
             <thead>\
                <tr><th colspan="5">'+tr("Network information")+'</th></tr>\
             </thead>\
             <tbody>\
             <tr>\
               <td  colspan="2" class="key_td">'+tr("Network mask")+'</td>\
               <td class="value_td">'+( vn_info.TEMPLATE.NETWORK_MASK ? vn_info.TEMPLATE.NETWORK_MASK : "--" )+'</td>\
              <td></td>\
              <td></td>\
             </tr>\
            </tbody></table></div>';

    // TODO: Add other well known attributes, like DNS, GATEWAY...
    html += '</div>';

    var ar_list = vn_info.AR_POOL.AR;

    if (!ar_list) //empty
    {
        // TODO: message there are no address ranges
        html += '</form>';
        return html;
    }
    else if (ar_list.constructor != Array) //>1 lease
    {
        ar_list = [ar_list];
    };

    var ar;

    for (var i=0; i<ar_list.length; i++){
        ar = ar_list[i];

        html += printAR(ar);
    }

    html += '</form>';

    return html;
}

function printAR(ar){

    var html = '';
    html += '<div class="row">';

    html += '<div class="large-6 columns"><table id="vn_leases_table" class="dataTable extended_table">\
      <thead>\
        <tr><th colspan="7">'+tr("Address Range information")+'</th></tr>\
      </thead>\
      <tbody>';

    function ar_attr(val, txt){
        if(val){
            return '<tr>\
                       <td colspan="3" class="key_td">'+txt+'</td>\
                       <td colspan="4" class="value_td">'+val+'</td>\
                     </tr>'
        }

        return '';
    }

    html += ar_attr(ar.AR_ID, "ID");

    // TODO: translate ar.TYPE values?
    html += ar_attr(ar.TYPE, tr("Type"));
    html += ar_attr(ar.MAC, tr("MAC"));
    html += ar_attr(ar.IP, tr("IP"));
    html += ar_attr(ar.GLOBAL_PREFIX, tr("Global prefix"));
    html += ar_attr(ar.ULA_PREFIX, tr("ULA prefix"));
    html += ar_attr(ar.SIZE, tr("Size"));
    html += ar_attr(ar.USED_LEASES, tr("Used leases"));

    // TODO: add, remove AR

    if (Config.isTabActionEnabled("vnets-tab", "Network.hold_lease")) {
        html += '<tr>\
                   <td colspan="4" class="value_td"><input type="text" id="panel_hold_lease"/></td>\
                   <td colspan="3"><button class="button small secondary radius" id="panel_hold_lease_button">'+tr("Hold IP")+'</button></td>\
                 </tr>';
    }

    // TODO: extra ar config attributes


    html +='</tbody>\
      </table></div></div>\
      <div class="large-12 columns"><table class="dataTable extended_table">\
      <thead>\
        <tr>\
        <th></th>\
        <th></th>\
        <th>'+tr("IP")+'</th>\
        <th>'+tr("MAC")+'</th>\
        <th>'+tr("IPv6 Link")+'</th>\
        <th>'+tr("IPv6 ULA")+'</th>\
        <th>'+tr("IPv6 Global")+'</th>\
        </tr>\
      </thead>\
      <tbody>';

    var leases = ar.LEASES.LEASE;

    if (!leases) //empty
    {
        html+='<tr id="no_leases_tr"><td colspan="7" class="key_td">\
                   '+tr("No leases to show")+'\
                   </td></tr>';

        html += '</tbody></table></div>';

        return html;
    }
    else if (leases.constructor != Array) //>1 lease
    {
        leases = [leases];
    };

    var lease;

    for (var i=0; i<leases.length; i++){
        lease = leases[i];


        // TODO: LEASE.VNET


        html+='<tr ip="'+lease.IP+'">';

        html += '<td class="key_td">';

        if (lease.VM == "-1") { //hold
            html += '<span type="text" class="alert radius label"></span></td>';

            html += '<td>';
            if (Config.isTabActionEnabled("vnets-tab", "Network.release_lease")) {
              html += '<a class="release_lease" href="#"><i class="fa fa-play"/></a>';
            }
            html += '</td>';
        } else { //used
            html += '<span type="text" class="radius label "></span></td>\
                    <td>' + tr("VM:") + lease.VM+'</td>';
        }

        html += '<td class="value_td">'+ (lease.IP ? lease.IP : "--") +'</td>';
        html += '<td class="value_td">'+ (lease.MAC ? lease.MAC : "--") +'</td>';
        html += '<td class="value_td">'+ (lease.IP6_LINK ? lease.IP6_LINK : "--") +'</td>';
        html += '<td class="value_td">'+ (lease.IP6_ULA ? lease.IP6_ULA : "--") +'</td>';
        html += '<td class="value_td">'+ (lease.IP6_GLOBAL ? lease.IP6_GLOBAL : "--") +'</td>';

        html += '</tr>';
    };

    html += '</tbody></table>';

    return html;
}

//Prepares the vnet creation dialog
function setupCreateVNetDialog() {
    dialogs_context.append('<div id="create_vn_dialog"></div>');
    $create_vn_dialog = $('#create_vn_dialog',dialogs_context)
    var dialog = $create_vn_dialog;
    dialog.html(create_vn_tmpl);

    dialog.addClass("reveal-modal medium").attr("data-reveal", "");

    //Make the tabs look nice for the creation mode
    //$('#vn_tabs',dialog).tabs();
    $('div#ranged',dialog).hide();
    $('div#ranged_ipv6',dialog).hide();

    $('input#site_prefix,label[for="site_prefix"]',$create_vn_dialog).hide();
    $('input#global_prefix,label[for="global_prefix"]',$create_vn_dialog).hide();

    $('input[name="ip_version"]',dialog).change(function(){
      var fixed_ranged = $('input[name="fixed_ranged"]:checked',dialog).val();

      if (this.id == 'ipv4_check') {
        $('input#net_mask,label[for="net_mask"]',$create_vn_dialog).show();
        $('input#net_address,label[for="net_address"]',$create_vn_dialog).show();

        $('input#site_prefix,label[for="site_prefix"]',$create_vn_dialog).hide();
        $('input#global_prefix,label[for="global_prefix"]',$create_vn_dialog).hide();

        if ( fixed_ranged == "fixed" ){
          $('input#leaseip,label[for="leaseip"]',$create_vn_dialog).show();
        } else {
          $('div#ranged',$create_vn_dialog).show();
          $('div#ranged_ipv6',$create_vn_dialog).hide();
        }
      } else {
        $('input#net_mask,label[for="net_mask"]',$create_vn_dialog).hide();
        $('input#net_address,label[for="net_address"]',$create_vn_dialog).hide();

        $('input#site_prefix,label[for="site_prefix"]',$create_vn_dialog).show();
        $('input#global_prefix,label[for="global_prefix"]',$create_vn_dialog).show();

        if ( fixed_ranged == "fixed" ){
          $('input#leaseip,label[for="leaseip"]',$create_vn_dialog).hide();
        } else {
          $('div#ranged',$create_vn_dialog).hide();
          $('div#ranged_ipv6',$create_vn_dialog).show();
        }
      }
    });

    $('input[name="fixed_ranged"]',dialog).change(function(){
      if (this.id == 'fixed_check') {
        $('div#fixed',$create_vn_dialog).show();
        $('div#ranged',$create_vn_dialog).hide();
        $('div#ranged_ipv6',$create_vn_dialog).hide();
      }
      else {
          $('div#fixed',$create_vn_dialog).hide();

          if ( $('input[name="ip_version"]:checked',dialog).val() == "ipv4" ){
            $('div#ranged',$create_vn_dialog).show();
          } else {
            $('div#ranged_ipv6',$create_vn_dialog).show();
          }
      }
    });

    $('#network_mode',dialog).change(function(){
        $('input,select#vlan,label[for!="network_mode"]', $(this).parent()).hide();
        $('input', $(this).parent()).val("");
        switch ($(this).val()) {
        case "default":
            $('input#bridge,label[for="bridge"]',$create_vn_dialog).show();
            $('input#phydev,label[for="phydev"]',$create_vn_dialog).hide();
            $('select#vlan,label[for="vlan"]',$create_vn_dialog).hide();
            $('input#vlan_id,label[for="vlan_id"]',$create_vn_dialog).hide();
            break;
        case "802.1Q":
            // TODO add warning use PHY_DEV unless... BRIDGE
            $('input#bridge,label[for="bridge"]',$create_vn_dialog).show();
            $('input#phydev,label[for="phydev"]',$create_vn_dialog).show();
            $('select#vlan,label[for="vlan"]',$create_vn_dialog).show();
            $('input#vlan_id,label[for="vlan_id"]',$create_vn_dialog).show();
            break;
        case "ebtables":
            $('input#bridge,label[for="bridge"]',$create_vn_dialog).show();
            $('input#phydev,label[for="phydev"]',$create_vn_dialog).show();
            $('select#vlan,label[for="vlan"]',$create_vn_dialog).show();
            $('input#vlan_id,label[for="vlan_id"]',$create_vn_dialog).hide();
            break;
        case "openvswitch":
            $('input#bridge,label[for="bridge"]',$create_vn_dialog).show();
            $('input#phydev,label[for="phydev"]',$create_vn_dialog).hide();
            $('select#vlan,label[for="vlan"]',$create_vn_dialog).show();
            $('input#vlan_id,label[for="vlan_id"]',$create_vn_dialog).show();
            break;
        case "vmware":
            $('input#bridge,label[for="bridge"]',$create_vn_dialog).show();
            $('input#phydev,label[for="phydev"]',$create_vn_dialog).hide();
            $('select#vlan,label[for="vlan"]',$create_vn_dialog).show();
            $('input#vlan_id,label[for="vlan_id"]',$create_vn_dialog).show();
            break;
        };
    });

    //Initialize shown options
    $('#network_mode',dialog).trigger("change");

    //$('button',dialog).button();


    //When we hit the add lease button...
    $('#add_lease',dialog).click(function(){
        var create_form = $('#create_vn_form_easy',$create_vn_dialog); //this is our scope

        //Fetch the interesting values
        var lease_ip = "";

        if ( $('input[name="ip_version"]:checked',dialog).val() == "ipv4" ) {
            lease_ip = $('#leaseip',create_form).val();
        }

        var lease_mac = $('#leasemac',create_form).val();

        //We do not add anything to the list if there is nothing to add
        if (!lease_ip.length && !lease_mac.length) {
            notifyError(tr("Please provide a lease IP or MAC"));
            return false;
        };

        //contains the HTML to be included in the select box.
        // The space is used later to parse ip and mac
        var lease = '<option value="' + lease_ip + ' ' + lease_mac + '">' +
                    lease_ip + ' ' + lease_mac + '</option>';

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
    $('#create_vn_submit_easy',dialog).click(function(){
        //Fetch values
        var name = $('#name',dialog).val();
        if (!name.length){
            notifyError(tr("Virtual Network name missing!"));
            return false;
        }

        var description = $('#DESCRIPTION',dialog).val();
        var network_json = {"name" : name, "description" : description};

        var network_mode = $('select#network_mode',dialog).val();
        var bridge = $('#bridge',dialog).val();
        var phydev = $('#phydev',dialog).val();
        var vlan = $('#vlan',dialog).val();
        var vlan_id = $('#vlan_id',dialog).val();

        //Depending on network mode we include certain params in the
        //template
        switch (network_mode) {
        case "default":
            if (!bridge && !phydev){
                notifyError("Bridge or physical device must be specified");
                return false;
            };
            if (bridge) network_json['bridge']=bridge;
            if (phydev) network_json['phydev']=phydev;
            break;
        case "802.1Q":
            if (!phydev){
                notifyError("Physical device must be specified");
                return false;
            };
            network_json['phydev']=phydev;
            if (bridge) network_json['bridge']=bridge;
            network_json['vlan']=vlan;
            if (vlan_id) {
                network_json['vlan_id']=vlan_id;
            };
            break;
        case "ebtables":
            if (!bridge){
                notifyError("Bridge must be specified");
                return false;
            };
            network_json['bridge']=bridge;
            network_json['vlan']=vlan;
            break;
        case "openvswitch":
        case "vmware":
            if (!bridge){
                notifyError("Bridge must be specified");
                return false;
            };
            network_json['bridge']=bridge;
            network_json['vlan']=vlan;
            if (vlan_id) {
                network_json['vlan_id']=vlan_id;
            };
            break;
        };

        var ip_version = $('input[name="ip_version"]:checked',dialog).val();

        var type = $('input[name="fixed_ranged"]:checked',dialog).val();
        network_json['type']=type;
        //TODO: Name and bridge provided?!

        var network_addr    = $('#net_address',dialog).val();
        var network_mask    = $('#net_mask',dialog).val();
        var network_dns     = $('#net_dns',dialog).val();
        var network_gateway = $('#net_gateway',dialog).val();

        if (network_dns.length)
            network_json["dns"] = network_dns;

        if (ip_version == "ipv6") {
            var site_prefix = $('#site_prefix',dialog).val();
            var global_prefix = $('#global_prefix',dialog).val();

            if (site_prefix.length)
                network_json["site_prefix"] = site_prefix;

            if (global_prefix.length)
                network_json["global_prefix"] = global_prefix;

            if (network_gateway.length)
                network_json["gateway6"] = network_gateway;

        } else {
          if (network_addr.length)
              network_json["network_address"]=network_addr;

          if (network_mask.length)
              network_json["network_mask"]=network_mask;

          if (network_gateway.length)
              network_json["gateway"] = network_gateway;
        }

        if (type == "fixed") {
            var leases = $('#leases option', dialog);
            var leases_obj=[];

            //for each specified lease we prepare the JSON object
            $.each(leases,function(){
                var lease_str = $(this).val().split(" ");

                if (lease_str[0].length && lease_str[1].length) {
                    leases_obj.push({"ip": lease_str[0],
                                     "mac": lease_str[1]});
                } else if (lease_str[0].length) {
                    leases_obj.push({"ip": lease_str[0] });
                } else {
                    leases_obj.push({"mac": lease_str[1] });
                }
            });

            //and construct the final data for the request
            network_json["leases"] = leases_obj;
        }
        else { //type ranged

            if (ip_version == "ipv4") {
                var custom = $('#custom_pool',dialog).is(':checked');
                var ip_start = $('#ip_start',dialog).val();
                var ip_end = $('#ip_end',dialog).val();

                if (!(ip_start.length && ip_end.length) && !network_addr.length){
                    notifyError(tr("There are missing network parameters"));
                    return false;
                };

                if (custom){
                    if (ip_start.length)
                        network_json["ip_start"] = ip_start;
                    if (ip_end.length)
                        network_json["ip_end"] = ip_end;
                };
            } else {
                var mac_start = $('#mac_start',dialog).val();
                var network_size = $('#net_size',dialog).val();

                if (! mac_start.length){
                    notifyError(tr("MAC Start must be specified"));
                    return false;
                };

                network_json["mac_start"] = mac_start;

                if (network_size.length)
                    network_json["network_size"] = network_size;
            }
        };

        //Time to add custom attributes
        $('#custom_var_vnet_box option',$create_vn_dialog).each(function(){
            var attr_name = $(this).attr('name');
            var attr_value = $(this).val();
            network_json[attr_name] = attr_value;
        });

        //Create the VNetwork.

        network_json = {
            "vnet" : network_json
        };

        Sunstone.runAction("Network.create",network_json);
        return false;
    });

    $('#create_vn_submit_manual',dialog).click(function(){
        var template=$('#template',dialog).val();
        var vnet_json = {vnet: {vnet_raw: template}};
        Sunstone.runAction("Network.create",vnet_json);
        return false;
    });

    $('#wizard_vnet_reset_button').click(function(){
        $create_vn_dialog.html("");
        setupCreateVNetDialog();

        popUpCreateVnetDialog();
    });

    $('#advanced_vnet_reset_button').click(function(){
        $create_vn_dialog.html("");
        setupCreateVNetDialog();

        popUpCreateVnetDialog();
        $("a[href='#vnet_advanced']").click();
    });
}

function popUpCreateVnetDialog() {
    $create_vn_dialog.foundation().foundation('reveal', 'open');
    $("input#name",$create_vn_dialog).focus();
}


// Listeners to the add, hold, release, delete leases operations in the
// extended information panel.
function setupLeasesOps(){
  if (Config.isTabActionEnabled("vnets-tab", "Network.addleases")) {
    $('button#panel_add_lease_button').live("click",function(){
        var lease = $('input#panel_add_lease').val();
        //var mac = $(this).previous().val();
        var id = $(this).parents('form').attr('vnid');
        if (lease.length){
            var obj = {ip: lease};
            Sunstone.runAction('Network.addleases',id,obj);
        }
        return false;
    });
  }

  if (Config.isTabActionEnabled("vnets-tab", "Network.hold_lease")) {
    //ranged networks hold lease
    $('button#panel_hold_lease_button').live("click",function(){
        var lease = $('input#panel_hold_lease').val();
        //var mac = $(this).previous().val();
        var id = $(this).parents('form').attr('vnid');
        if (lease.length){
            var obj = {ip: lease};
            Sunstone.runAction('Network.hold',id,obj);
        }
        return false;
    });

    //fixed networks hold lease
    $('a.hold_lease').live("click",function(){
        var lease = $(this).parents('tr').attr('ip');
        var id = $(this).parents('form').attr('vnid');
        var obj = { ip: lease};
        Sunstone.runAction('Network.hold',id,obj);
        //Set spinner
        $(this).parents('tr').html('<td class="key_td">'+spinner+'</td><td class="value_td"></td>');
        return false;
    });
  }

  if (Config.isTabActionEnabled("vnets-tab", "Network.remove_lease")) {
    $('form#leases_form a.delete_lease').live("click",function(){
        var lease = $(this).parents('tr').attr('ip');
        var id = $(this).parents('form').attr('vnid');
        var obj = { ip: lease};
        Sunstone.runAction('Network.rmleases',id,obj);
        //Set spinner
        $(this).parents('tr').html('<td class="key_td">'+spinner+'</td><td class="value_td"></td>');
        return false;
    });
  }



  if (Config.isTabActionEnabled("vnets-tab", "Network.release_lease")) {
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
}

//The DOM is ready and the ready() from sunstone.js
//has been executed at this point.
$(document).ready(function(){
    var tab_name = 'vnets-tab';

    if (Config.isTabEnabled(tab_name)) {
      dataTable_vNetworks = $("#datatable_vnetworks",main_tabs_context).dataTable({
            "bSortClasses": false,
            "bDeferRender": true,
            "aoColumnDefs": [
              { "bSortable": false, "aTargets": ["check"] },
              { "sWidth": "35px", "aTargets": [0] },
              { "bVisible": true, "aTargets": Config.tabTableColumns(tab_name)},
              { "bVisible": false, "aTargets": ['_all']}
          ]
      });

      $('#vnet_search').keyup(function(){
        dataTable_vNetworks.fnFilter( $(this).val() );
      })

      dataTable_vNetworks.on('draw', function(){
        recountCheckboxes(dataTable_vNetworks);
      })

      Sunstone.runAction("Network.list");

      setupCreateVNetDialog();
      setupLeasesOps();

      initCheckAllBoxes(dataTable_vNetworks);
      tableCheckboxesListener(dataTable_vNetworks);
      infoListener(dataTable_vNetworks,'Network.show');

      // Reset list filter in case it was set because we were lookin
      // at a single cluster view
      $('div#menu li#li_vnets_tab').live('click',function(){
          dataTable_vNetworks.fnFilter('',5);
      });

      $('div#vnets_tab div.legend_div').hide();

      dataTable_vNetworks.fnSort( [ [1,config['user_config']['table_order']] ] );
    }
});
