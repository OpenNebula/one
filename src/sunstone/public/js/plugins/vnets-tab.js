/* -------------------------------------------------------------------------- */
/* Copyright 2002-2015, OpenNebula Project (OpenNebula.org), C12G Labs        */
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
var last_selected_row_ar;

var create_vnet_wizard_html =
    '<form data-abide="ajax" id="create_vnet_form_wizard" class="custom creation">\
      <div>\
        <dl id="vnet_create_tabs" class="tabs right-info-tabs text-center" data-tab>\
          <dd class="active"><a href="#vnetCreateGeneralTab"><i class="fa fa-globe"></i><br>'+tr("General")+'</a></dd>\
          <dd><a href="#vnetCreateBridgeTab"><i class="fa fa-cog"></i><br>'+tr("Conf")+'</a></dd>\
          <dd><a href="#vnetCreateARTab"><i class="fa fa-align-justify"></i><br>'+tr("Addresses")+'</a></dd>\
          <dd><a href="#vnetCreateSecurityTab"><i class="fa fa-shield"></i><br>'+tr("Security")+'</a></dd>\
          <dd><a href="#vnetCreateContextTab"><i class="fa fa-folder"></i><br>'+tr("Context")+'</a></dd>\
        </dl>\
        <div id="vnet_create_tabs_content" class="tabs-content">\
          <div class="content active" id="vnetCreateGeneralTab">\
            <div class="row">\
              <div class="large-6 columns">\
                <label for="name" >' + tr("Name") + ':\
                  <span class="tip">'+tr("Name that the Virtual Network will get for description purposes.")+'</span>\
                </label>\
                <input type="text" wizard_field="NAME" required name="name" id="name"/>\
              </div>\
            </div>\
            <div class="row">\
              <div class="large-6 columns">\
                <label for="DESCRIPTION" >' + tr("Description") + ':\
                  <span class="tip">'+tr("Description of the Virtual Network")+'</span>\
                </label>\
                <textarea type="text" wizard_field="DESCRIPTION" id="DESCRIPTION" name="DESCRIPTION"/>\
              </div>\
            </div>\
          </div>\
          <div class="content" id="vnetCreateBridgeTab">\
            <div class="row">\
              <div class="large-6 columns">\
                  <label for="bridge">'+tr("Bridge")+':\
                    <span class="tip">'+tr("Name of the physical bridge in the physical host where the VM should connect its network interface")+'</span>\
                  </label>\
                  <input type="text" wizard_field="BRIDGE" name="bridge" id="bridge" />\
              </div>\
            </div>\
            <div class="row">\
              <div class="large-6 columns">\
                <label for="network_mode">'+tr("Network model")+':\
                  <span class="tip">'+tr("Choose the same networking model you chose for the hosts that will use this newtork")+'</span>\
                </label>\
                <select name="network_mode" id="network_mode">\
                  <option value="default">'+tr("Default")+'</option>\
                  <option value="802.1Q">'+tr("802.1Q")+'</option>\
                  <option value="vxlan">'+tr("VXLAN")+'</option>\
                  <option value="ebtables">'+tr("ebtables")+'</option>\
                  <option value="openvswitch">'+tr("Open vSwitch")+'</option>\
                  <option value="vmware">'+tr("VMware")+'</option>\
                </select>\
              </div>\
              <div class="large-12 columns">\
                <div class="network_mode_description" value="default">'+tr("Default: dummy driver that doesn’t perform any network operation. Firewalling rules are also ignored.")+'</div>\
                <div class="network_mode_description" value="802.1Q">'+tr("802.1Q: restrict network access through VLAN tagging, which also requires support from the hardware switches.")+'</div>\
                <div class="network_mode_description" value="vxlan">'+tr("VXLAN: creates a L2 network overlay based on the VXLAN protocol, each VLAN has associated a multicast address in the 239.0.0.0/8 range.")+'</div>\
                <div class="network_mode_description" value="ebtables">'+tr("ebtables: restrict network access through Ebtables rules. No special hardware configuration required.")+'</div>\
                <div class="network_mode_description" value="openvswitch">'+tr("Open vSwitch: restrict network access with Open vSwitch Virtual Switch.")+'</div>\
                <div class="network_mode_description" value="vmware">'+tr("VMware: uses the VMware networking infrastructure to provide an isolated and 802.1Q compatible network for VMs launched with the VMware hypervisor.")+'</div>\
              </div>\
            </div>\
            <br>\
            <div class="row">\
              <div class="large-6 columns">\
                <label for="mac_spoofing">\
                  <input type="checkbox" wizard_field="FILTER_MAC_SPOOFING" value="YES" name="mac_spoofing" id="mac_spoofing" />\
                  '+tr("Filter MAC spoofing")+'\
                  <span class="tip">'+tr("Activate the filter to prevent mac spoofing. Only works with FW, 802.1Q, VXLAN and Ebtables network drivers.")+'</span>\
                </label>\
              </div>\
            </div>\
            <div class="row">\
              <div class="large-6 columns">\
                <label for="ip_spoofing">\
                  <input type="checkbox" wizard_field="FILTER_IP_SPOOFING" value="YES" name="ip_spoofing" id="ip_spoofing" />\
                  '+tr("Filter IP spoofing")+'\
                  <span class="tip">'+tr("Activate the filter to prevent IP spoofing. Only works with FW, 802.1Q, VXLAN and Ebtables network drivers.")+'</span>\
                </label>\
              </div>\
            </div>\
            <div class="row">\
              <div class="large-6 columns">\
                <div class="row">\
                  <div class="large-6 columns">\
                    <label for="vlan">'+tr("VLAN")+':\
                      <span class="tip">'+tr("Whether or not to isolate this virtual network using the Virtual Network Manager drivers")+'</span>\
                    </label>\
                    <select wizard_field="VLAN" name="vlan" id="vlan">\
                        <option value="YES" selected="selected">'+tr("Yes")+'</option>\
                        <option value="NO">'+tr("No")+'</option>\
                     </select>\
                  </div>\
                  <div class="large-6 columns">\
                    <label for="vlan_id">'+tr("VLAN ID")+':\
                      <span class="tip">'+tr("Optional: Set a specific VLAN id")+'</span>\
                    </label>\
                    <input type="text" wizard_field="VLAN_ID" name="vlan_id" id="vlan_id" />\
                  </div>\
                </div>\
              </div>\
              <div class="large-6 columns">\
                <div class="row">\
                  <div class="large-12 columns">\
                    <label for="phydev">'+tr("Physical device")+':\
                      <span class="tip">'+tr("Name of the physical network device that will be attached to the bridge")+'</span>\
                    </label>\
                    <input type="text" wizard_field="PHYDEV" name="phydev" id="phydev" />\
                  </div>\
                </div>\
              </div>\
            </div>\
            <div class="row">\
              <div class="large-3 columns">\
                <label for="mtu">'+tr("MTU")+':\
                  <span class="tip">'+tr("Set the MTU for the tagged interface. This MTU will be then inherited by the bridge and by the tagged interface.")+'</span>\
                </label>\
                <input type="text" wizard_field="MTU" name="mtu" id="mtu" />\
              </div>\
            </div>\
          </div>\
          <div class="content" id="vnetCreateARTab">\
            <div class="row" id="vnetCreateARTabCreate">\
              <div class="large-12 columns">\
                <div class="row">\
                  <dl class="tabs vertical" id="vnet_wizard_ar_tabs" data-tab>\
                    <dt class="text-center">\
                      <button type="button" class="button tiny radius" id="vnet_wizard_ar_btn">\
                        <span class="fa fa-plus"></span> '+tr("Add another Address Range")+'\
                      </button>\
                    </dt>\
                  </dl>\
                  <div class="tabs-content vertical" id="vnet_wizard_ar_tabs_content">\
                  </div>\
                </div>\
              </div>\
            </div>\
            <div class="row" id="vnetCreateARTabUpdate">\
              <div class="large-12 columns">\
                <p>'+tr("Address Ranges need to be managed in the individual Virtual Network panel")+'</p>\
              </div>\
            </div>\
          </div>\
          <div class="content" id="vnetCreateSecurityTab">\
            '+generateSecurityGroupTableSelect("vnet_create")+'\
            <div class="row" id="default_sg_warning">\
              <div class="large-12 columns">\
                <span class="radius secondary label"><i class="fa fa-warning"/> '+tr("The default Security Group 0 is automatically added to new Virtual Networks")+'</span>\
              </div>\
            </div>\
          </div>\
          <div class="content" id="vnetCreateContextTab">\
            <div class="row">\
              <div class="large-6 columns">\
                  <label for="net_address">'+tr("Network address")+':\
                    <span class="tip">'+tr("Base network address. For example, 192.168.1.0")+'</span>\
                  </label>\
                  <input type="text" wizard_field="NETWORK_ADDRESS" name="net_address" id="net_address" />\
              </div>\
              <div class="large-6 columns">\
                  <label for="net_mask">'+tr("Network mask")+':\
                    <span class="tip">'+tr("Network mask. For example, 255.255.255.0")+'</span>\
                  </label>\
                  <input type="text" wizard_field="NETWORK_MASK" name="net_mask" id="net_mask" />\
              </div>\
            </div>\
            <div class="row">\
              <div class="large-6 columns">\
                  <label for="net_gateway">'+tr("Gateway")+':\
                    <span class="tip">'+tr("Router for this network. Leave empty if the network is not routable")+'</span>\
                  </label>\
                  <input type="text" wizard_field="GATEWAY" name="net_gateway" id="net_gateway" />\
              </div>\
              <div class="large-6 columns">\
                  <label for="net_gateway6">'+tr("IPv6 Gateway")+':\
                    <span class="tip">'+tr("IPv6 Router for this network")+'</span>\
                  </label>\
                  <input type="text" wizard_field="GATEWAY6" name="net_gateway6" id="net_gateway6" />\
              </div>\
            </div>\
            <div class="row">\
              <div class="large-6 columns">\
                  <label for="net_dns">'+tr("DNS")+':\
                    <span class="tip">'+tr("Specific DNS for this network")+'</span>\
                  </label>\
                  <input type="text" wizard_field="DNS" name="net_dns" id="net_dns" />\
              </div>\
            </div>\
            <br>\
            <div class="row">\
              <div class="large-12 columns">\
                <span>' + tr("Custom attributes") + '</span>\
                <br>\
                <br>\
              </div>\
            </div>'+
            customTagsHtml()+'\
          </div>\
        </div>\
      </div>\
    </form>';


var create_vnet_advanced_html =
 '<form data-abide="ajax" id="create_vnet_form_advanced" class="custom creation">' +
    '<div class="row">' +
      '<div class="large-12 columns">' +
        '<p>'+tr("Write the Virtual Network template here")+'</p>' +
      '</div>' +
    '</div>' +
    '<div class="row">' +
      '<div class="large-12 columns">' +
        '<textarea id="template" rows="15" required></textarea>' +
      '</div>' +
    '</div>' +
  '</form>';

var dataTable_vNetworks;
var $lease_vn_dialog;

//Setup actions

var vnet_actions = {
    "Network.create" : {
        type: "create",
        call: OpenNebula.Network.create,
        callback: function(request, response) {
            $("a[href=back]", $("#vnets-tab")).trigger("click");
            popFormDialog("create_vnet_form", $("#vnets-tab"));

            addVNetworkElement(request, response);
            notifyCustom(tr("Virtual Network created"), " ID: " + response.VNET.ID, false);
        },
        error: onError
    },

    "Network.create_dialog" : {
        type: "custom",
        call: function(){
            Sunstone.popUpFormPanel("create_vnet_form", "vnets-tab", "create", true, function(context){
                refreshSecurityGroupTableSelect(context, "vnet_create");

                $("#default_sg_warning").show();
                $("input#name",context).focus();
            });
        }
    },

    "Network.import_dialog" : {
        type: "create",
        call: function(){
          popUpNetworkImportDialog();
        }
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

    "Network.add_ar" : {
        type: "single",
        call: OpenNebula.Network.add_ar,
        callback: function(req) {
            // Reset the wizard
            $add_ar_dialog.foundation('reveal', 'close');
            $add_ar_dialog.empty();
            setupAddARDialog();

            Sunstone.runAction("Network.show",req.request.data[0][0]);
        },
        error: onError
    },

    "Network.rm_ar" : {
        type: "single",
        call: OpenNebula.Network.rm_ar,
        callback: function(req) {
            OpenNebula.Helper.clear_cache("VNET");
            Sunstone.runAction("Network.show",req.request.data[0][0]);
        },
        error: onError
    },

    "Network.update_ar" : {
        type: "single",
        call: OpenNebula.Network.update_ar,
        callback: function(req) {
            // Reset the wizard
            $update_ar_dialog.foundation('reveal', 'close');
            $update_ar_dialog.empty();
            setupUpdateARDialog();

            Sunstone.runAction("Network.show",req.request.data[0][0]);
        },
        error: onError
    },

    "Network.reserve_dialog" : {
        type: "custom",
        call: popUpReserveDialog
    },

    "Network.reserve" : {
        type: "single",
        call: OpenNebula.Network.reserve,
        callback: function(req) {
            // Reset the wizard
            $reserve_dialog.foundation('reveal', 'close');
            $reserve_dialog.empty();
            setupReserveDialog();

            OpenNebula.Helper.clear_cache("VNET");
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

    "Network.update_dialog" : {
        type: "custom",
        call: function(){
            var selected_nodes = getSelectedNodes(dataTable_vNetworks);
            if ( selected_nodes.length != 1 ) {
                notifyMessage("Please select one (and just one) Virtual Network to update.");
                return false;
            }

            var resource_id = ""+selected_nodes[0];
            Sunstone.runAction("Network.show_to_update", resource_id);
        }
    },

    "Network.show_to_update" : {
        type: "single",
        call: OpenNebula.Network.show,
        callback: function(request, response) {
            // TODO: global var, better use jquery .data
            vnet_to_update_id = response.VNET.ID;

            Sunstone.popUpFormPanel("create_vnet_form", "vnets-tab", "update", true, function(context){
                fillVNetUpdateFormPanel(response.VNET, context);

                $("#default_sg_warning").hide();
            });
        },
        error: onError
    },

    "Network.update" : {
        type: "single",
        call: OpenNebula.Network.update,
        callback: function(request, response){
            $("a[href=back]", $("#vnets-tab")).trigger("click");
            popFormDialog("create_vnet_form", $("#vnets-tab"));

            notifyMessage(tr("Virtual Network updated correctly"));
        },
        error: function(request, response){
            popFormDialog("create_vnet_form", $("#vnets-tab"));

            onError(request, response);
        }
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
                OpenNebula.Network.show({
                    data : {
                        id: vnet
                    },
                    success: function (request, vn){
                        var vn_info = vn.VNET;

                        var current_cluster = vn_info.CLUSTER_ID;

                        if(current_cluster != -1){
                            OpenNebula.Cluster.delvnet({
                                data: {
                                    id: current_cluster,
                                    extra_param: vnet
                                },
                                success: function(){
                                    OpenNebula.Helper.clear_cache("VNET");
                                    Sunstone.runAction('Network.show',vnet);
                                },
                                error: onError
                            });
                        } else {
                            OpenNebula.Helper.clear_cache("VNET");
                            Sunstone.runAction('Network.show',vnet);
                        }
                    },
                    error: onError
                });
            } else {
                OpenNebula.Cluster.addvnet({
                    data: {
                        id: cluster,
                        extra_param: vnet
                    },
                    success: function(){
                        OpenNebula.Helper.clear_cache("VNET");
                        Sunstone.runAction('Network.show',vnet);
                    },
                    error: onError
                });
            }
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
    "Network.import_dialog" : {
        type: "create_dialog",
        layout: "create",
        text:  tr("Import"),
        icon: '<i class="fa fa-download">',
        alwaysActive: true
    },
    "Network.update_dialog" : {
        type: "action",
        layout: "main",
        text: tr("Update")
    },
    "Network.reserve_dialog" : {
        type: "action",
        layout: "main",
        text: tr("Reserve"),
        custom_classes: "only-right-info reserve-right-info",
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
    "vnet_ar_list_tab" : {
        title: tr("Address Range management"),
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
    search_input: '<input id="vnet_search" type="search" placeholder="'+tr("Search")+'" />',
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
          <th>'+tr("Reservation")+'</th>\
          <th>'+tr("Cluster")+'</th>\
          <th>'+tr("Bridge")+'</th>\
          <th>'+tr("Leases")+'</th>\
          <th>'+tr("VLAN ID")+'</th>\
        </tr>\
      </thead>\
      <tbody id="tbodyvnetworks">\
      </tbody>\
    </table>',
    forms: {
        "create_vnet_form": {
            actions: {
                create: {
                    title: tr("Create Virtual Network"),
                    submit_text: tr("Create")
                },
                update: {
                    title: tr("Update Virtual Network"),
                    submit_text: tr("Update"),
                    reset_button: false
                }
            },
            wizard_html: create_vnet_wizard_html,
            advanced_html: create_vnet_advanced_html,
            setup: initialize_create_vnet_dialog
        }
    }
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

    addresses_vnets = addresses_vnets + parseInt(network.USED_LEASES);

    var total_size = 0;

    var ar_list = get_ar_list(network);

    $.each(ar_list, function(){
        total_size += parseInt(this.SIZE);
    });

    return [
        '<input class="check_item" type="checkbox" id="vnetwork_'+network.ID+'" name="selected_items" value="'+network.ID+'"/>',
        network.ID,
        network.UNAME,
        network.GNAME,
        network.NAME,
        network.PARENT_NETWORK_ID.length ? tr("Yes") : tr("No"),
        network.CLUSTER.length ? network.CLUSTER : "-",
        network.BRIDGE,
        quotaBarHtml(network.USED_LEASES, total_size),
        network.VLAN_ID.length ? network.VLAN_ID : "-"
    ];
}

//Callback to update a vnet element after an action on it
function updateVNetworkElement(request, vn_json){
    id = vn_json.VNET.ID;
    element = vNetworkElementArray(vn_json);
    updateSingleElement(element,dataTable_vNetworks,'#vnetwork_'+id);
}

//Callback to delete a vnet element from the table
function deleteVNetworkElement(req){
    deleteElement(dataTable_vNetworks,'#vnetwork_'+req.request.data);
}

//Callback to add a new element
function addVNetworkElement(request,vn_json){
    var element = vNetworkElementArray(vn_json);
    addElement(element,dataTable_vNetworks);
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

    stripped_vn_template = $.extend({}, vn_info.TEMPLATE);
    delete stripped_vn_template["SECURITY_GROUPS"];

    var hidden_values = {};

    if (vn_info.TEMPLATE.SECURITY_GROUPS != undefined){
        hidden_values.SECURITY_GROUPS = vn_info.TEMPLATE.SECURITY_GROUPS;
    }

    $(".resource-info-header", $("#vnets-tab")).html(vn_info.NAME);

    var reservation_row = '';

    if(vn_info.PARENT_NETWORK_ID.length > 0){
        reservation_row =
            '<tr>\
              <td class="key_td">'+tr("Reservation parent")+'</td>\
              <td class="value_td">'+vn_info.PARENT_NETWORK_ID+'</td>\
              <td></td>\
            </tr>';

        $(".reserve-right-info").prop("disabled", true);
        $(".reserve-right-info").addClass("has-tip");
        $(".reserve-right-info").attr("title", tr("This Network is already a reservation"));
    } else{
        $(".reserve-right-info").prop("disabled", false);
        $(".reserve-right-info").removeClass("has-tip");
        $(".reserve-right-info").removeAttr("title");
    }

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
            '</tr>'+
            reservation_row+
        '</table>\
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
            insert_extended_template_table(stripped_vn_template,
                                                       "Network",
                                                       vn_info.ID,
                                                       tr("Attributes"),
                                                       hidden_values) +
        '</div>\
      </div>';

    var info_tab = {
        title : tr("Info"),
        icon: "fa-info-circle",
        content: info_tab_content
    };

    var ar_tab = {
        title : tr("Addresses"),
        icon: "fa-align-justify",
        content: ar_list_tab_content(vn_info)
    };

    var sg_tab = {
        title : tr("Security"),
        icon: "fa-shield",
        content: sg_list_tab_content(vn_info)
    };

    var leases_tab = {
        title: tr("Leases"),
        icon: "fa-list-ul",
        content: printLeases(vn_info)
    };


    Sunstone.updateInfoPanelTab("vnet_info_panel","vnet_info_tab",info_tab);
    Sunstone.updateInfoPanelTab("vnet_info_panel","vnet_ar_list_tab",ar_tab);
    Sunstone.updateInfoPanelTab("vnet_info_panel","vnet_sg_list_tab",sg_tab);
    Sunstone.updateInfoPanelTab("vnet_info_panel","vnet_leases_tab",leases_tab);

    Sunstone.popUpInfoPanel("vnet_info_panel", "vnets-tab");


    var ar_list_dataTable = $("#ar_list_datatable",$("#vnet_info_panel")).dataTable({
        "bSortClasses" : false,
        "bDeferRender": true,
        "aoColumnDefs": [
//            { "bSortable": false, "aTargets": [3,4] },
        ]
    });

    ar_list_dataTable.fnSort( [ [0,config['user_config']['table_order']] ] );

    $('tbody tr',ar_list_dataTable).die("click");
    $('tbody tr',ar_list_dataTable).live("click",function(e){
        var aData = ar_list_dataTable.fnGetData(this);
        if (!aData) return true;
        var id = aData[0];
        if (!id) return true;

        if(last_selected_row_ar) {
            last_selected_row_ar.children().each(function(){
                $(this).removeClass('markrowchecked');
            });
        }

        last_selected_row_ar = $(this);
        $(this).children().each(function(){
            $(this).addClass('markrowchecked');
        });

        $("#update_ar_button", $("#vnet_info_panel")).attr("ar_id", id);
        $("#update_ar_button", $("#vnet_info_panel")).prop("disabled", false);

        $("#rm_ar_button", $("#vnet_info_panel")).attr("ar_id", id).removeAttr('disabled');

        $("#ar_show_info", $("#vnet_info_panel")).html(ar_show_info(vn_info, id));

        setup_ar_show_info($("#ar_show_info", $("#vnet_info_panel")), vn_info, id);

        return false;
    });

    setup_sg_list_tab_content(vn_info);

    var leases_dataTable = $("#leases_datatable",$("#vnet_info_panel")).dataTable({
        "bSortClasses" : false,
        "bDeferRender": true,
//        "sScrollX": "100%",
        "aoColumnDefs": [
            { "bSortable": false, "aTargets": [0,1] },
        ]
    });

    setPermissionsTable(vn_info,'');
}

function get_ar_list(vn_info){
    var ar_list = vn_info.AR_POOL.AR;

    if (!ar_list) //empty
    {
        ar_list = [];
    }
    else if (ar_list.constructor != Array) //>1 lease
    {
        ar_list = [ar_list];
    }

    return ar_list;
}

function get_ar(vn_info, ar_id){
    var ar_list = get_ar_list(vn_info);
    var ar = undefined;

    for (var i=0; i<ar_list.length; i++){
        if (ar_id == ar_list[i].AR_ID){
            ar = $.extend({}, ar_list[i]);
            break;
        }
    }

    return ar;
}

function ar_list_tab_content(vn_info){

    var ar_list = get_ar_list(vn_info);

    // TODO: message there are no address ranges

    var html =
    '<form id="ar_list_form" vnid="'+vn_info.ID+'">';

    html +=
        '<div class="row collapse">\
          <div class="large-12 columns">';

    if (Config.isTabActionEnabled("vnets-tab", "Network.add_ar")) {
        html +=
            '<button class="button success small radius" id="add_ar_button">\
              <span class="fa fa-plus"></span> '+tr("Add")+'\
            </button>';
    }

    html += '<span class="right">';

    if (Config.isTabActionEnabled("vnets-tab", "Network.update_ar")) {
        html +=
        '<button class="button secondary small radius" id="update_ar_button" ar_id="" disabled="disabled">\
          <span class="fa fa-pencil-square-o"></span> '+tr("Update")+'\
        </button>';
    }

    if (Config.isTabActionEnabled("vnets-tab", "Network.remove_ar")) {
        html +=
        '<button class="button secondary small radius" id="rm_ar_button" ar_id="" disabled="disabled">\
          <span class="fa fa-trash-o"></span> '+tr("Remove")+'\
        </button>';
    }

    html += '</span></div></div>';

    html +=
    '<div class="row collapse">\
      <div class="large-12 columns" style="overflow:auto">\
        <table id="ar_list_datatable" class="datatable twelve">\
          <thead>\
            <tr>\
              <th>'+tr("Address Range")+'</th>\
              <th>'+tr("Type")+'</th>\
              <th>'+tr("Start")+'</th>\
              <th>'+tr("IPv6 Prefix")+'</th>\
              <th>'+tr("Leases")+'</th>\
            </tr>\
          </thead>\
          <tbody>';

    for (var i=0; i<ar_list.length; i++){
        var ar = ar_list[i];
        var id = ar.AR_ID;

        html += '<tr ar="'+id+'">';

        html += '<td  style="white-space: nowrap" class="value_td">'+ id +'</td>';
        html += '<td  style="white-space: nowrap" class="value_td">'+ (ar.TYPE ? ar.TYPE : "--") +'</td>';

        if(ar.TYPE == "IP4" || ar.TYPE == "IP4_6"){
            html += '<td  style="white-space: nowrap" class="value_td">'+ (ar.IP ? ar.IP : "--") +'</td>';
        } else {
            html += '<td  style="white-space: nowrap" class="value_td">'+ (ar.MAC ? ar.MAC : "--") +'</td>';
        }

        var prefix = "";

        if(ar.GLOBAL_PREFIX && ar.ULA_PREFIX){
            prefix += ar.GLOBAL_PREFIX + "<br>" + ar.ULA_PREFIX;
        } else if (ar.GLOBAL_PREFIX){
            prefix += ar.GLOBAL_PREFIX;
        } else if (ar.ULA_PREFIX){
            prefix += ar.ULA_PREFIX;
        } else {
            prefix = "--";
        }

        html += '<td  style="white-space: nowrap" class="value_td">'+ prefix +'</td>';

        html += '<td  style="white-space: nowrap" class="value_td">'+ quotaBarHtml(ar.USED_LEASES, ar.SIZE) +'</td>';

        html += '</tr>';
    }

    html += '</tbody></table></div></div>';

    html +=
    '<div id="ar_show_info">';

    if(ar_list.length > 0){
        html +=
      '<div class="text-center">\
        <span class="fa-stack fa-5x" style="color: #dfdfdf">\
          <i class="fa fa-cloud fa-stack-2x"></i>\
          <i class="fa fa-info-circle fa-stack-1x fa-inverse"></i>\
        </span>\
        <br>\
        <br>\
        <span style="font-size: 18px; color: #999">'+
          tr("Select an Address Range to see more information")+
        '</span>\
      </div>';
    }

    html +=
      '</div>\
    </form>';

    return html;
}

function ar_show_info(vn_info, ar_id){

    var ar = get_ar(vn_info, ar_id);

    if(ar == undefined){
        return "";
    }

    function ar_attr(txt, val){
        if(val){
            return '<tr>\
                       <td class="key_td">'+htmlDecode(txt)+'</td>\
                       <td class="value_td">'+htmlDecode(val)+'</td>\
                     </tr>'
        }

        return '';
    }

    var html = "";

    html +=
    '<div class="row collapse">\
      <div class="large-6 columns">\
        <table class="dataTable extended_table">\
          <thead>\
            <tr><th colspan="2">'+tr("Address Range")+' '+ar_id+'</th></tr>\
          </thead>\
          <tbody>';

    first_mac = ar.MAC;
    last_mac = ar.MAC_END;

    first_ip = ar.IP;
    last_ip = ar.IP_END;

    first_ip6_global = ar.IP6_GLOBAL;
    last_ip6_global = ar.IP6_GLOBAL_END;

    first_ip6_ula = ar.IP6_ULA;
    last_ip6_ula = ar.IP6_ULA_END;

    // TODO: translate ar.TYPE values?
    html += ar_attr(tr("Type"),         ar.TYPE);
    html += ar_attr(tr("MAC Start"),    ar.MAC);
    html += ar_attr(tr("IP Start"),     ar.IP);
    html += ar_attr(tr("Global prefix"),ar.GLOBAL_PREFIX);
    html += ar_attr(tr("ULA prefix"),   ar.ULA_PREFIX);
    html += ar_attr(tr("Size"),         ar.SIZE);
    html += ar_attr(tr("Used leases"),  ar.USED_LEASES);
    html += ar_attr(tr("Reservation parent AR"),  ar.PARENT_NETWORK_AR_ID);

    delete ar["MAC_END"];
    delete ar["IP_END"];
    delete ar["IP6_ULA"];
    delete ar["IP6_ULA_END"];
    delete ar["IP6_GLOBAL"];
    delete ar["IP6_GLOBAL_END"];
    delete ar["AR_ID"];
    delete ar["TYPE"];
    delete ar["MAC"];
    delete ar["IP"];
    delete ar["GLOBAL_PREFIX"];
    delete ar["ULA_PREFIX"];
    delete ar["SIZE"];
    delete ar["USED_LEASES"];
    delete ar["LEASES"];
    delete ar["PARENT_NETWORK_AR_ID"];

    var do_secgroups = (ar.SECURITY_GROUPS != undefined &&
                        ar.SECURITY_GROUPS.length != 0);

    delete ar["SECURITY_GROUPS"];

    html +=
          '</tbody>\
        </table>';

    html +=
      '</div>\
      <div class="large-6 columns">\
        <table class="dataTable extended_table">\
          <thead>\
            <tr><th colspan="2">&nbsp;</th></tr>\
          </thead>\
          <tbody>';

    $.each(ar, function(key, value){
        html += ar_attr(key, value);
    });

    html +=
          '</tbody>\
        </table>\
      </div>\
    </div>';

    html +=
    '<div class="row collapse">\
      <div class="large-12 columns">\
        <table class="dataTable extended_table">\
          <thead>\
            <tr>\
              <th>'+tr("Range")+'</th>\
              <th>'+tr("First")+'</th>\
              <th>'+tr("Last")+'</th>\
            </tr>\
          </thead>\
          <tbody>\
            <tr>\
              <td class="key_td">'+tr("MAC")+'</td>\
              <td class="value_td">'+first_mac+'</td>\
              <td class="value_td">'+last_mac+'</td>\
            </tr>';

    if (first_ip != undefined){
        html+=
            '<tr>\
              <td class="key_td">'+tr("IP")+'</td>\
              <td class="value_td">'+first_ip+'</td>\
              <td class="value_td">'+last_ip+'</td>\
            </tr>';
    }

    if (first_ip6_global != undefined){
        html +=
            '<tr>\
              <td class="key_td">'+tr("IP6_GLOBAL")+'</td>\
              <td class="value_td">'+first_ip6_global+'</td>\
              <td class="value_td">'+last_ip6_global+'</td>\
            </tr>';
    }

    if (first_ip6_ula != undefined){
        html +=
            '<tr>\
              <td class="key_td">'+tr("IP6_ULA")+'</td>\
              <td class="value_td">'+first_ip6_ula+'</td>\
              <td class="value_td">'+last_ip6_ula+'</td>\
            </tr>';
    }

    html +=
          '</tbody>\
        </table>\
      </div>\
    </div>';

    if (do_secgroups){
        html +=
        '<div class="row collapse">\
          <div class="large-12 columns">\
            <table class="dataTable extended_table">\
              <thead>\
                <tr><th>'+tr("Security Groups")+'</th></tr>\
              </thead>\
              <tbody/>\
            </table>\
          </div>\
          <div class="large-12 columns">'+
            generateSecurityGroupTableSelect("ar_show_info")+
          '</div>\
        </div>';
    }

    return html;
}

function setup_ar_show_info(section, vn_info, ar_id){
    var ar = get_ar(vn_info, ar_id);

    if(ar == undefined){
        return "";
    }

    if (ar.SECURITY_GROUPS != undefined &&
        ar.SECURITY_GROUPS.length != 0){

        var secgroups = ar.SECURITY_GROUPS.split(",");

        var opts = {
            read_only: true,
            fixed_ids: secgroups
        }

        setupSecurityGroupTableSelect(section, "ar_show_info", opts);

        refreshSecurityGroupTableSelect(section, "ar_show_info");
    }
}

function sg_list_tab_content(vn_info){

    var html =
    '<form id="sg_list_form" vnid="'+vn_info.ID+'">';

    html +=
        '<div class="row collapse">\
          <div class="large-12 columns">';

    html += '<span class="right">';

    html += '</span></div></div>';

    html += '<div class="row collapse">\
        '+generateSecurityGroupTableSelect("sg_list")+'\
      </div>\
    </form>';

    return html;
}

function setup_sg_list_tab_content(vn_info){

    var secgroups = [];

    if (vn_info.TEMPLATE.SECURITY_GROUPS != undefined &&
        vn_info.TEMPLATE.SECURITY_GROUPS.length != 0){

        secgroups = vn_info.TEMPLATE.SECURITY_GROUPS.split(",");
    }

    var opts = {
        read_only: true,
        fixed_ids: secgroups
    }

    setupSecurityGroupTableSelect($("#vnet_info_panel"), "sg_list", opts);

    refreshSecurityGroupTableSelect($("#vnet_info_panel"), "sg_list");
}

// Prints the list of leases depending on the Vnet TYPE
// It adds the "add lease", "hold lease" fields, and each lease comes with
// hold, release buttons etc. Listeners in setupLeasesOps()
function printLeases(vn_info){
    var ar_list = get_ar_list(vn_info);

    var html =
    '<form id="leases_form" vnid="'+vn_info.ID+'">';

    if (Config.isTabActionEnabled("vnets-tab", "Network.hold_lease")) {
        html +=
        '<div class="row collapse">\
          <div class="large-4 columns">\
            <input type="text" id="panel_hold_lease"/>\
          </div>\
          <div class="large-2 columns end">\
            <button class="button small secondary radius" id="panel_hold_lease_button">'+tr("Hold IP")+'</button>\
          </div>\
        </div>';
    }

    html +=
    '<div class="row collapse">\
      <div class="large-12 columns" style="overflow:auto">\
        <table id="leases_datatable" class="datatable twelve">\
          <thead>\
            <tr>\
              <th></th>\
              <th></th>\
              <th>'+tr("IP")+'</th>\
              <th>'+tr("MAC")+'</th>\
              <th>'+tr("IPv6 Link")+'</th>\
              <th>'+tr("IPv6 ULA")+'</th>\
              <th>'+tr("IPv6 Global")+'</th>\
              <th>'+tr("Address Range")+'</th>\
            </tr>\
          </thead>\
          <tbody>';

    for (var i=0; i<ar_list.length; i++){
        var ar = ar_list[i];
        var id = ar.AR_ID;

        var leases = ar.LEASES.LEASE;

        if (!leases) //empty
        {
            continue;
        }
        else if (leases.constructor != Array) //>1 lease
        {
            leases = [leases];
        }

        var lease;

        for (var j=0; j<leases.length; j++){
            lease = leases[j];

            html+='<tr ip="'+lease.IP+'" mac="'+lease.MAC+'">';

            html += '<td class="key_td">';

            if (lease.VM == "-1") { //hold
                html += '<span type="text" class="alert radius label"></span></td>';

                html += '<td>';
                if (Config.isTabActionEnabled("vnets-tab", "Network.release_lease")) {
                  html += '<a class="release_lease" href="#"><i class="fa fa-play"/></a>';
                }
                html += '</td>';
            } else if (lease.VM != undefined) { //used by a VM
                html += '<span type="text" class="radius label "></span></td>\
                        <td>' + tr("VM:") + lease.VM+'</td>';
            } else if (lease.VNET != undefined) { //used by a VNET
                html += '<span type="text" class="radius label "></span></td>\
                        <td>' + tr("NET:") + lease.VNET+'</td>';
            } else {
                html += '<span type="text" class="radius label "></span></td>\
                        <td>--</td>';
            }

            html += '<td  style="white-space: nowrap" class="value_td">'+ (lease.IP ? lease.IP : "--") +'</td>';
            html += '<td  style="white-space: nowrap" class="value_td">'+ (lease.MAC ? lease.MAC : "--") +'</td>';
            html += '<td  style="white-space: nowrap" class="value_td">'+ (lease.IP6_LINK ? lease.IP6_LINK : "--") +'</td>';
            html += '<td  style="white-space: nowrap" class="value_td">'+ (lease.IP6_ULA ? lease.IP6_ULA : "--") +'</td>';
            html += '<td  style="white-space: nowrap" class="value_td">'+ (lease.IP6_GLOBAL ? lease.IP6_GLOBAL : "--") +'</td>';
            html += '<td  style="white-space: nowrap" class="value_td">'+ id +'</td>';

            html += '</tr>';
        }
    }

    html += '</tbody></table></div></div></form>';

    return html;
}

function initialize_create_vnet_dialog(dialog) {

    var number_of_ar = 0;

    // close icon: removing the tab on click
    $("#vnetCreateARTab", dialog).on("click", "i.remove-tab", function() {
        var target = $(this).parent().attr("href");
        var dd = $(this).closest('dd');
        var dl = $(this).closest('dl');
        var content = $(target);

        dd.remove();
        content.remove();

        if (dd.attr("class") == 'active') {
            $('a', dl.children('dd').last()).click();
        }

        return false;
    });

    $("#vnet_wizard_ar_btn", dialog).bind("click", function(){
        add_ar_tab(number_of_ar, dialog);
        number_of_ar++;

        dialog.foundation();

        return false;
    });

    $("#vnetCreateARTab #vnetCreateARTabUpdate", dialog).hide();

    $('#network_mode',dialog).change(function(){
        $('input,select#vlan,label[for!="network_mode"]', $(this).parent()).hide();
        $('input', $(this).parent()).val("");
        switch ($(this).val()) {
        case "default":
            $('input#bridge,label[for="bridge"]',dialog).show().prop('wizard_field_disabled', false);
            $('input#phydev,label[for="phydev"]',dialog).hide().prop('wizard_field_disabled', true);
            $('select#vlan,label[for="vlan"]',dialog).hide().prop('wizard_field_disabled', true);
            $('input#vlan_id,label[for="vlan_id"]',dialog).hide().prop('wizard_field_disabled', true);
            $('input#ip_spoofing,label[for="ip_spoofing"]',dialog).show().prop('wizard_field_disabled', false);
            $('input#mac_spoofing,label[for="mac_spoofing"]',dialog).show().prop('wizard_field_disabled', false);
            $('input#mtu,label[for="mtu"]',dialog).hide().prop('wizard_field_disabled', false);

            $('input#phydev',dialog).removeAttr('required');
            $('input#bridge',dialog).attr('required', '');
            break;
        case "802.1Q":
            $('input#bridge,label[for="bridge"]',dialog).show().prop('wizard_field_disabled', false);
            $('input#phydev,label[for="phydev"]',dialog).show().prop('wizard_field_disabled', false);
            $('select#vlan,label[for="vlan"]',dialog).show().prop('wizard_field_disabled', false);
            $('input#vlan_id,label[for="vlan_id"]',dialog).show().prop('wizard_field_disabled', false);
            $('input#ip_spoofing,label[for="ip_spoofing"]',dialog).show().prop('wizard_field_disabled', false);
            $('input#mac_spoofing,label[for="mac_spoofing"]',dialog).show().prop('wizard_field_disabled', false);
            $('input#mtu,label[for="mtu"]',dialog).show().prop('wizard_field_disabled', false);

            $('input#phydev',dialog).removeAttr('required');
            $('input#bridge',dialog).removeAttr('required');
            break;
        case "vxlan":
            $('input#bridge,label[for="bridge"]',dialog).show().prop('wizard_field_disabled', false);
            $('input#phydev,label[for="phydev"]',dialog).show().prop('wizard_field_disabled', false);
            $('select#vlan,label[for="vlan"]',dialog).show().prop('wizard_field_disabled', false);
            $('input#vlan_id,label[for="vlan_id"]',dialog).show().prop('wizard_field_disabled', false);
            $('input#ip_spoofing,label[for="ip_spoofing"]',dialog).show().prop('wizard_field_disabled', false);
            $('input#mac_spoofing,label[for="mac_spoofing"]',dialog).show().prop('wizard_field_disabled', false);
            $('input#mtu,label[for="mtu"]',dialog).show().prop('wizard_field_disabled', false);

            $('input#phydev',dialog).removeAttr('required');
            $('input#bridge',dialog).removeAttr('required');
            break;
        case "ebtables":
            $('input#bridge,label[for="bridge"]',dialog).show().prop('wizard_field_disabled', false);
            $('input#phydev,label[for="phydev"]',dialog).hide().prop('wizard_field_disabled', true);
            $('select#vlan,label[for="vlan"]',dialog).show().prop('wizard_field_disabled', false);
            $('input#vlan_id,label[for="vlan_id"]',dialog).hide().prop('wizard_field_disabled', true);
            $('input#ip_spoofing,label[for="ip_spoofing"]',dialog).show().prop('wizard_field_disabled', false);
            $('input#mac_spoofing,label[for="mac_spoofing"]',dialog).show().prop('wizard_field_disabled', false);
            $('input#mtu,label[for="mtu"]',dialog).hide().prop('wizard_field_disabled', false);

            $('input#phydev',dialog).removeAttr('required');
            $('input#bridge',dialog).attr('required', '');
            break;
        case "openvswitch":
            $('input#bridge,label[for="bridge"]',dialog).show().prop('wizard_field_disabled', false);
            $('input#phydev,label[for="phydev"]',dialog).hide().prop('wizard_field_disabled', true);
            $('select#vlan,label[for="vlan"]',dialog).show().prop('wizard_field_disabled', false);
            $('input#vlan_id,label[for="vlan_id"]',dialog).show().prop('wizard_field_disabled', false);
            $('input#ip_spoofing,label[for="ip_spoofing"]',dialog).hide().prop('wizard_field_disabled', true);
            $('input#mac_spoofing,label[for="mac_spoofing"]',dialog).show().prop('wizard_field_disabled', false);
            $('input#mtu,label[for="mtu"]',dialog).hide().prop('wizard_field_disabled', false);

            $('input#phydev',dialog).removeAttr('required');
            $('input#bridge',dialog).attr('required', '');
            break;
        case "vmware":
            $('input#bridge,label[for="bridge"]',dialog).show();
            $('input#phydev,label[for="phydev"]',dialog).hide();
            $('select#vlan,label[for="vlan"]',dialog).show();
            $('input#vlan_id,label[for="vlan_id"]',dialog).show();
            $('input#ip_spoofing,label[for="ip_spoofing"]',dialog).hide().prop('wizard_field_disabled', true);
            $('input#mac_spoofing,label[for="mac_spoofing"]',dialog).hide().prop('wizard_field_disabled', true);
            $('input#mtu,label[for="mtu"]',dialog).hide().prop('wizard_field_disabled', false);

            $('input#phydev',dialog).removeAttr('required');
            $('input#bridge',dialog).attr('required', '');
            break;
        };

        $("div.network_mode_description").hide();
        $('div.network_mode_description[value="'+$(this).val()+'"]').show();
    });

    //Initialize shown options
    $('#network_mode',dialog).trigger("change");

    setupSecurityGroupTableSelect(dialog, "vnet_create", {"multiple_choice": true});

    setupCustomTags($("#vnetCreateContextTab", dialog));

    dialog.foundation();

    //Process form
    $('#create_vnet_form_wizard',dialog).on('invalid.fndtn.abide', function(e) {
        // Fix for valid event firing twice
        if(e.namespace != 'abide.fndtn') {
            return;
        }

        notifyError(tr("One or more required fields are missing or malformed."));
        popFormDialog("create_vnet_form", $("#vnets-tab"));
    }).on('valid.fndtn.abide', function(e) {
        // Fix for valid event firing twice
        if(e.namespace != 'abide.fndtn') {
            return;
        }

        //Fetch values
        var network_json = {};

        retrieveWizardFields($("#vnetCreateGeneralTab", dialog), network_json);
        retrieveWizardFields($("#vnetCreateBridgeTab", dialog), network_json);
        retrieveWizardFields($("#vnetCreateContextTab", dialog), network_json);

        var secgroups = retrieveSecurityGroupTableSelect(dialog, "vnet_create");
        if (secgroups != undefined && secgroups.length != 0){
            network_json["SECURITY_GROUPS"] = secgroups.join(",");
        }

        retrieveCustomTags($("#vnetCreateContextTab", dialog), network_json);

        $('.ar_tab',dialog).each(function(){
            hash = retrieve_ar_tab_data(this);

            if (!$.isEmptyObject(hash)) {
                if(!network_json["AR"])
                    network_json["AR"] = [];

                network_json["AR"].push(hash);
            }
        });

        if ($('#create_vnet_form_wizard',dialog).attr("action") == "create") {
            network_json = {
                "vnet" : network_json
            };

            Sunstone.runAction("Network.create",network_json);
            return false;
        } else if ($('#create_vnet_form_wizard',dialog).attr("action") == "update") {
            Sunstone.runAction("Network.update", vnet_to_update_id, convert_template_to_string(network_json));
            return false;
        }
    });

    $('#create_vnet_form_advanced',dialog).on('invalid.fndtn.abide', function(e) {
        // Fix for valid event firing twice
        if(e.namespace != 'abide.fndtn') {
            return;
        }

        notifyError(tr("One or more required fields are missing or malformed."));
        popFormDialog("create_vnet_form", $("#vnets-tab"));
    }).on('valid.fndtn.abide', function(e) {
        // Fix for valid event firing twice
        if(e.namespace != 'abide.fndtn') {
            return;
        }

        if ($('#create_vnet_form_advanced',dialog).attr("action") == "create") {

            var template = $('textarea#template',dialog).val();
            var vnet_json = {vnet: {vnet_raw: template}};
            Sunstone.runAction("Network.create",vnet_json);
            return false;

        } else if ($('#create_vnet_form_advanced',dialog).attr("action") == "update") {
            var template_raw = $('textarea#template',dialog).val();

            Sunstone.runAction("Network.update",vnet_to_update_id,template_raw);
            return false;
          }
    });

    setupTips(dialog);

    // Add first AR
    $("#vnet_wizard_ar_btn", dialog).trigger("click");
}

function fillVNetUpdateFormPanel(vnet, dialog){

    // Populates the Avanced mode Tab
    $('#template',dialog).val(convert_template_to_string(vnet.TEMPLATE).replace(/^[\r\n]+$/g, ""));

    $('[wizard_field="NAME"]',dialog).val(
        escapeDoubleQuotes(htmlDecode( vnet.NAME ))).
        prop("disabled", true).
        prop('wizard_field_disabled', true);

    fillWizardFields($("#vnetCreateGeneralTab", dialog), vnet.TEMPLATE);
    fillWizardFields($("#vnetCreateBridgeTab", dialog), vnet.TEMPLATE);
    fillWizardFields($("#vnetCreateContextTab", dialog), vnet.TEMPLATE);

    // Show all network mode inputs, and make them not required. This will change
    // if a different network model is selected
    $('input#bridge,label[for="bridge"]',dialog).show().prop('wizard_field_disabled', false).removeAttr('required');
    $('input#phydev,label[for="phydev"]',dialog).show().prop('wizard_field_disabled', false).removeAttr('required');
    $('select#vlan,label[for="vlan"]',dialog).show().prop('wizard_field_disabled', false).removeAttr('required');
    $('input#vlan_id,label[for="vlan_id"]',dialog).show().prop('wizard_field_disabled', false).removeAttr('required');
    $('input#ip_spoofing,label[for="ip_spoofing"]',dialog).show().prop('wizard_field_disabled', false);
    $('input#mac_spoofing,label[for="mac_spoofing"]',dialog).show().prop('wizard_field_disabled', false);

    if (vnet.TEMPLATE["SECURITY_GROUPS"] != undefined &&
        vnet.TEMPLATE["SECURITY_GROUPS"].length != 0){

        var secgroups = vnet.TEMPLATE["SECURITY_GROUPS"].split(",");

        selectSecurityGroupTableSelect(
                $("#vnetCreateSecurityTab", dialog),
                "vnet_create",
                { ids: secgroups });

    } else {
        refreshSecurityGroupTableSelect(dialog, "vnet_create");
    }

    // Delete so these attributes don't end in the custom tags table also
    delete vnet.TEMPLATE["SECURITY_GROUPS"];

    var fields = $('[wizard_field]', dialog);

    fields.each(function(){
        var field = $(this);
        var field_name = field.attr('wizard_field');

        delete vnet.TEMPLATE[field_name];
    });

    fillCustomTags($("#vnetCreateContextTab", dialog), vnet.TEMPLATE);

    // Remove the first AR added in initialize_
    $("#vnetCreateARTab i.remove-tab", dialog).trigger("click");
    $("#vnetCreateARTab #vnetCreateARTabUpdate", dialog).show();
    $("#vnetCreateARTab #vnetCreateARTabCreate", dialog).hide();
}

function add_ar_tab(ar_id, dialog) {
    var str_ar_tab_id  = 'ar' + ar_id;

    var html_tab_content = '<div id="'+str_ar_tab_id+'Tab" class="ar_tab content">'+
        generate_ar_tab_content(str_ar_tab_id) +
      '</div>'

    // Append the new div containing the tab and add the tab to the list
    var a = $("<dd><a id='ar_tab"+str_ar_tab_id+"' href='#"+str_ar_tab_id+"Tab'>"+
            tr("Address Range")+" <i class='fa fa-times-circle remove-tab'></i></a></dd>"
            ).appendTo($("dl#vnet_wizard_ar_tabs", dialog));

    $(html_tab_content).appendTo($("#vnet_wizard_ar_tabs_content", dialog));

    $("a", a).trigger("click");

    var ar_section = $('#' + str_ar_tab_id + 'Tab', dialog);
    setup_ar_tab_content(ar_section, str_ar_tab_id);
}

function generate_ar_tab_content(str_ar_tab_id){
    var html =
    '<div class="row" name="str_ar_tab_id" str_ar_tab_id="'+str_ar_tab_id+'">\
      <div class="large-12 columns">\
        <input wizard_field="TYPE" type="radio" name="'+str_ar_tab_id+'_ar_type" id="'+str_ar_tab_id+'_ar_type_ip4" value="IP4"/><label for="'+str_ar_tab_id+'_ar_type_ip4">'+tr("IPv4")+'</label>\
        <input wizard_field="TYPE" type="radio" name="'+str_ar_tab_id+'_ar_type" id="'+str_ar_tab_id+'_ar_type_ip4_6" value="IP4_6"/><label for="'+str_ar_tab_id+'_ar_type_ip4_6">'+tr("IPv4/6")+'</label>\
        <input wizard_field="TYPE" type="radio" name="'+str_ar_tab_id+'_ar_type" id="'+str_ar_tab_id+'_ar_type_ip6" value="IP6"/><label for="'+str_ar_tab_id+'_ar_type_ip6">'+tr("IPv6")+'</label>\
        <input wizard_field="TYPE" type="radio" name="'+str_ar_tab_id+'_ar_type" id="'+str_ar_tab_id+'_ar_type_ether" value="ETHER"/><label for="'+str_ar_tab_id+'_ar_type_ether">'+tr("Ethernet")+'</label>\
      </div>\
    </div>\
    <div class="row">\
      <div class="large-6 columns">\
        <div class="row collapse ar_input type_ip4 type_ip4_6">\
          <label for="'+str_ar_tab_id+'_ip_start">'+tr("IP Start")+':\
            <span class="tip">'+tr("First IP address")+'</span>\
          </label>\
          <input wizard_field="IP" type="text" name="IP" id="'+str_ar_tab_id+'_ip_start"/>\
        </div>\
        <div class="row collapse ar_input type_ip4 type_ip4_6 type_ip6 type_ether">\
          <label for="'+str_ar_tab_id+'_mac_start">'+tr("MAC Start")+':\
            <span class="tip">'+tr("First MAC address")+'</span>\
          </label>\
          <input wizard_field="MAC" type="text" name="MAC" id="'+str_ar_tab_id+'_mac_start" />\
        </div>\
      </div>\
      <div class="large-6 columns ar_input type_ip4 type_ip4_6 type_ip6 type_ether">\
        <label for="'+str_ar_tab_id+'_size">'+tr("Size")+':\
          <span class="tip">'+tr("Number of addresses in the range")+'</span>\
        </label>\
        <input wizard_field="SIZE" required type="text" name="SIZE" id="'+str_ar_tab_id+'_size" />\
      </div>\
    </div>\
    <div class="row">\
      <div class="large-6 columns ar_input type_ip4_6 type_ip6">\
        <label for="'+str_ar_tab_id+'_global_prefix">'+tr("Global prefix")+':\
          <span class="tip">'+tr("IPv6 global address prefix to create leases")+'</span>\
        </label>\
        <input wizard_field="GLOBAL_PREFIX" type="text" name="GLOBAL_PREFIX" id="'+str_ar_tab_id+'_global_prefix"/>\
      </div>\
      <div class="large-6 columns ar_input type_ip4_6 type_ip6">\
        <label for="'+str_ar_tab_id+'_ula_prefix">'+tr("ULA prefix")+':\
          <span class="tip">'+tr("IPv6 unique local address (ULA) prefix to create leases")+'</span>\
        </label>\
        <input wizard_field="ULA_PREFIX" type="text" name="ULA_PREFIX" id="'+str_ar_tab_id+'_ula_prefix"/>\
      </div>\
    </div>'+
    generateAdvancedSection({
      title: tr("Advanced Options"),
      html_id: 'advanced_vnet_create_ar',
      content:'<div class="row">\
        <div class="large-12 columns">\
          <span>' + tr("Custom attributes") + '</span>\
          <br>\
          <br>\
        </div>\
      </div>\
      <div class="row" id="'+str_ar_tab_id+'_custom_tags">\
        <div class="12 columns">'+
          customTagsHtml()+
        '</div>\
      </div>\
      <div class="row">\
        <br>\
        <br>\
        <hr>\
        <div class="large-12 columns">\
          <span>' + tr("Security Groups") + '</span>\
          <br>\
          <br>\
        </div>\
      </div>\
      <div class="row" id="'+str_ar_tab_id+'_security_groups">\
        '+generateSecurityGroupTableSelect(str_ar_tab_id)+'\
      </div>'});

    return html;
}

function setup_ar_tab_content(ar_section, str_ar_tab_id) {

    $('input[name$="ar_type"]',ar_section).change(function(){
        $('div.ar_input', ar_section).hide();

        $('input[wizard_field="IP"]',ar_section).removeAttr('required');

        switch($(this).val()){
        case "IP4":
            $('div.type_ip4', ar_section).show();
            $('input[wizard_field="IP"]',ar_section).attr('required', '');

            break;
        case "IP4_6":
            $('div.type_ip4_6', ar_section).show();
            $('input[wizard_field="IP"]',ar_section).attr('required', '');

            break;
        case "IP6":
            $('div.type_ip6', ar_section).show();
            break;
        case "ETHER":
            $('div.type_ether', ar_section).show();
            break;
        }
    });

    $('input#'+str_ar_tab_id+'_ar_type_ip4',ar_section).prop('checked', true);
    $('input#'+str_ar_tab_id+'_ar_type_ip4',ar_section).change();

    setupCustomTags($('#'+str_ar_tab_id+'_custom_tags',ar_section));

    setupSecurityGroupTableSelect(ar_section, str_ar_tab_id,
        {"multiple_choice": true});

    refreshSecurityGroupTableSelect(ar_section, str_ar_tab_id);

    setupTips(ar_section);
}

function retrieve_ar_tab_data(ar_section){
    var data  = {};

    var ar_type = $('input[name$="ar_type"]:checked',ar_section).val();

    var fields = [];

    switch(ar_type){
    case "IP4":
        fields = $('div.type_ip4', ar_section).children("input");
        break;
    case "IP4_6":
        fields = $('div.type_ip4_6', ar_section).children("input");
        break;
    case "IP6":
        fields = $('div.type_ip6', ar_section).children("input");
        break;
    case "ETHER":
        fields = $('div.type_ether', ar_section).children("input");
        break;
    }

    fields.each(function(){
        var field=$(this);

        if (field.val() != null && field.val().length){ //if has a length
            data[field.attr('name')] = field.val();
        }

    });

    if (!$.isEmptyObject(data)) {
        data["TYPE"] = ar_type;
    }

    retrieveCustomTags(ar_section, data);

    var str_ar_tab_id = $('div[name="str_ar_tab_id"]', ar_section).attr("str_ar_tab_id");

    var secgroups = retrieveSecurityGroupTableSelect(ar_section, str_ar_tab_id);
    if (secgroups != undefined && secgroups.length != 0){
        data["SECURITY_GROUPS"] = secgroups.join(",");
    }

    return data
}

function fill_ar_tab_data(ar_json, ar_section){
    fillWizardFields(ar_section, ar_json);

    var fields = $('[wizard_field]',ar_section);

    fields.each(function(){
        var field = $(this);
        var field_name = field.attr('wizard_field');

        // Delete so these attributes don't end in the custom tags table also
        delete ar_json[field_name];
    });

    delete ar_json["AR_ID"];
    delete ar_json["USED_LEASES"];
    delete ar_json["LEASES"];
    delete ar_json["MAC_END"];
    delete ar_json["IP_END"];
    delete ar_json["IP6_ULA"];
    delete ar_json["IP6_ULA_END"];
    delete ar_json["IP6_GLOBAL"];
    delete ar_json["IP6_GLOBAL_END"];

    if (ar_json["SECURITY_GROUPS"] != undefined &&
        ar_json["SECURITY_GROUPS"].length != 0){

        var secgroups = ar_json["SECURITY_GROUPS"].split(",");

        selectSecurityGroupTableSelect(ar_section, "update_ar", {ids: secgroups});
    }

    delete ar_json["SECURITY_GROUPS"];

    fillCustomTags(ar_section, ar_json);

    $('input[name$="ar_type"]',ar_section).prop("disabled", true);
    $('input[wizard_field="IP"]',ar_section).prop("disabled", true);
    $('input[wizard_field="MAC"]',ar_section).prop("disabled", true);
};

// Listeners to the add, hold, release, delete leases operations in the
// extended information panel.
function setupLeasesOps(){
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

  if (Config.isTabActionEnabled("vnets-tab", "Network.release_lease")) {
    $('a.release_lease').live("click",function(){
        var id = $(this).parents('form').attr('vnid');

        var lease = $(this).parents('tr').attr('ip');
        if (lease == "undefined"){
            lease = $(this).parents('tr').attr('mac');
        }

        var obj = { ip: lease};
        Sunstone.runAction('Network.release',id,obj);
        //Set spinner
        $(this).parents('tr').html('<td class="key_td">'+spinner+'</td><td class="value_td"></td>');
        return false;
    });
  }

  if (Config.isTabActionEnabled("vnets-tab", "Network.remove_ar")) {
    $('button#rm_ar_button').live("click",function(){
        // TODO: confirm?
        var id = $(this).parents('form').attr('vnid');
        var ar_id = $(this).attr('ar_id');

        var obj = {ar_id: ar_id};
        Sunstone.runAction('Network.rm_ar',id,obj);

        return false;
    });
  }

  if (Config.isTabActionEnabled("vnets-tab", "Network.add_ar")) {
    $('button#add_ar_button').live("click",function(){
        var id = $(this).parents('form').attr('vnid');

        popUpAddAR(id);

        return false;
    });
  }

  if (Config.isTabActionEnabled("vnets-tab", "Network.update_ar")) {
    $('button#update_ar_button').live("click",function(){

        var id = $(this).parents('form').attr('vnid');
        var ar_id = $(this).attr('ar_id');

        OpenNebula.Network.show({
            data : {
                id: id
            },
            timeout: true,
            success: function (request, vn){
                var vn_info = vn.VNET;

                var ar = get_ar(vn_info, ar_id);

                if(ar != undefined){
                    popUpUpdateAR(id, ar);
                } else {
                    notifyError(tr("The Adress Range was not found"));
                    Sunstone.runAction("Network.show", id);
                }
            },
            error: onError
        });

        return false;
    });
  }
}

function popUpAddAR(id){
    $('#vnet_id',$add_ar_dialog).text(id);

    refreshSecurityGroupTableSelect($add_ar_dialog, "add_ar");

    $add_ar_dialog.foundation().foundation('reveal', 'open');
}

function setupAddARDialog(){
    dialogs_context.append('<div id="add_ar_dialog"></div>');
    $add_ar_dialog = $('#add_ar_dialog',dialogs_context);
    var dialog = $add_ar_dialog;

    dialog.html(
    '<div class="reveal-body">\
      <form data-abide="ajax" id="add_ar_form" action="">\
        <div class="row">\
          <div class="large-12 columns">\
            <h3 class="subheader" id="">\
              '+tr("Virtual Network")+' <span id="vnet_id"/>\
              <br>'+tr("New Address Range")+'\
            </h3>\
          </div>\
        </div>'+
        generate_ar_tab_content("add_ar") +
        '<div class="reveal-footer">\
          <div class="form_buttons">\
            <button class="button radius right success" id="submit_ar_button" type="submit" value="Network.add_ar">'+tr("Add")+'</button>\
            <button id="submit_ar_reset_button" class="button secondary radius" type="reset" value="reset">'+tr("Reset")+'</button>\
          </div>\
        </div>\
        <a class="close-reveal-modal">&#215;</a>\
      </form>\
    </div>')

    //  TODO: max-height?

    dialog.addClass("reveal-modal large max-height").attr("data-reveal", "");
    setupTips(dialog);

    setup_ar_tab_content(dialog, "add_ar")

    $('#submit_ar_reset_button').click(function(){
        var vnet_id = $('#vnet_id', $add_ar_dialog).text();

        $add_ar_dialog.html("");
        setupAddARDialog();

        popUpAddAR(vnet_id);
    });

    $('#add_ar_form',dialog).on('invalid', function () {
        notifyError(tr("One or more required fields are missing."));
    }).on('valid', function () {
        var vnet_id = $('#vnet_id', this).text();
        var data = retrieve_ar_tab_data(this);

        var obj = {AR: data}
        Sunstone.runAction('Network.add_ar', vnet_id, obj);

        return false;
    });
};

function popUpUpdateAR(id, ar){
    $('#vnet_id',$update_ar_dialog).text(id);
    $('#ar_id',$update_ar_dialog).text(ar.AR_ID);

    refreshSecurityGroupTableSelect($update_ar_dialog, "update_ar");

    fill_ar_tab_data($.extend({}, ar), $update_ar_dialog);

    $update_ar_dialog.foundation().foundation('reveal', 'open');
}

function setupUpdateARDialog(){
    dialogs_context.append('<div id="update_ar_dialog"></div>');
    $update_ar_dialog = $('#update_ar_dialog',dialogs_context);
    var dialog = $update_ar_dialog;

    dialog.html(
    '<div class="reveal-body">\
      <form data-abide="ajax" id="update_ar_form" action="">\
        <div class="row">\
          <div class="large-12 columns">\
            <h3 class="subheader" id="">\
              '+tr("Virtual Network")+' <span id="vnet_id"/>\
              <br>'+tr("Edit Address Range")+' <span id="ar_id"/>\
            </h3>\
          </div>\
        </div>'+
        generate_ar_tab_content("update_ar") +
        '<div class="reveal-footer">\
          <div class="form_buttons">\
            <button class="button radius right success" id="submit_ar_button" type="submit" value="Network.update_ar">'+tr("Update")+'</button>\
          </div>\
        </div>\
        <a class="close-reveal-modal">&#215;</a>\
      </form>\
    </div>');

    //  TODO: max-height?

    dialog.addClass("reveal-modal large max-height").attr("data-reveal", "");
    setupTips(dialog);

    setup_ar_tab_content(dialog, "update_ar")

    dialog.die();
    dialog.live('closed', function () {
        $update_ar_dialog.html("");
        setupUpdateARDialog();
    });

    $('#update_ar_form',dialog).on('invalid', function () {
        notifyError(tr("One or more required fields are missing."));
    }).on('valid', function () {
        var vnet_id = $('#vnet_id', this).text();
        var ar_id = $('#ar_id', this).text();
        var data = retrieve_ar_tab_data(this);

        data['AR_ID'] = ar_id;

        var obj = {AR: data}
        Sunstone.runAction('Network.update_ar', vnet_id, obj);

        return false;
    });
}

function popUpReserveDialog(){
    var selected_nodes = getSelectedNodes(dataTable_vNetworks);

    if ( selected_nodes.length != 1 )
    {
        notifyMessage("Please select one (and just one) Virtual Network.");
        return false;
    }

    // Get proper id
    var id = ""+selected_nodes[0];

    $('#vnet_id',$reserve_dialog).text(id);

    $('#refresh_button_reserve').click();
    $('#refresh_button_ar_reserve').click();

    $reserve_dialog.foundation().foundation('reveal', 'open');
}

function setupReserveDialog(){
    dialogs_context.append('<div id="reserve_dialog"></div>');
    $reserve_dialog = $('#reserve_dialog',dialogs_context);
    var dialog = $reserve_dialog;

    dialog.html(
    '<div class="reveal-body">\
      <form id="reserve_form" action="">\
        <div class="row">\
          <div class="large-12 columns">\
            <h3 class="subheader" id="">\
              '+tr("Reservation from Virtual Network")+' <span id="vnet_id"/>\
            </h3>\
          </div>\
        </div>\
        <div class="row">\
          <div class="large-6 columns">\
            <label for="reserve_size">'+tr("Number of addresses")+':</label>\
            <input wizard_field="size" type="text" id="reserve_size"/>\
          </div>\
        </div>\
        <div class="row">\
          <div class="large-12 columns">\
            <input type="radio" name="reserve_target" id="reserve_new" value="NEW"/><label for="reserve_new">'+tr("Add to a new Virtual Network")+'</label>\
            <input type="radio" name="reserve_target" id="reserve_add" value="ADD"/><label for="reserve_add">'+tr("Add to an existing Reservation")+'</label>\
          </div>\
        </div>\
        <div id="reserve_new_body">\
          <div class="row">\
            <div class="large-6 columns">\
              <label for="reserve_name">'+tr("Virtual Network Name")+':</label>\
              <input wizard_field="name" type="text" id="reserve_name"/>\
            </div>\
          </div>\
        </div>\
        <div id="reserve_add_body">\
          '+generateVNetTableSelect("reserve")+'\
        </div>\
        <br>\
        <div class="row">\
          <div class="large-12 columns">\
            <dl class="tabs wizard_tabs" data-tab>\
              <dd><a href="#advanced_reserve">'+tr("Advanced options")+'</a></dd>\
            </dl>\
          </div>\
        </div>\
        <div class="tabs-content">\
          <div class="content" id="advanced_reserve">\
            <div class="row">\
              <div class="large-12 columns">\
                <p>'+tr("You can select the addresses from an specific Address Range")+'</p>\
              </div>\
            </div>\
            <div class="row">\
              <div class="large-12 columns">\
                '+generateARTableSelect("ar_reserve")+'\
              </div>\
            </div>\
            <br>\
            <div class="row">\
              <div class="large-6 columns">\
                <label for="reserve_addr">'+tr("First address")+':</label>\
                <input wizard_field="addr" type="text" id="reserve_addr" placeholder="'+tr("IPv4 or MAC")+'"/>\
              </div>\
            </div>\
          </div>\
        </div\
        <div class="reveal-footer">\
          <div class="form_buttons">\
            <button class="button radius right success" id="submit_reserve_button" type="submit" value="Network.reserve">'+tr("Reserve")+'</button>\
          </div>\
        </div>\
        <a class="close-reveal-modal">&#215;</a>\
      </form>\
    </div>');

    //  TODO: max-height?


    $('input[name="reserve_target"]',dialog).change(function(){
        $('div#reserve_new_body', dialog).hide();
        $('div#reserve_add_body', dialog).hide();

        $('input', $('div#reserve_new_body', dialog)).prop('wizard_field_disabled', true);
        $('input', $('div#reserve_add_body', dialog)).prop('wizard_field_disabled', true);

        switch($(this).val()){
        case "NEW":
            $('div#reserve_new_body', dialog).show();
            $('input', $('div#reserve_new_body', dialog)).prop('wizard_field_disabled', false);
            break;
        case "ADD":
            $('div#reserve_add_body', dialog).show();
            $('input', $('div#reserve_add_body', dialog)).prop('wizard_field_disabled', false);
            break;
        }
    });

    $('input#reserve_new', dialog).prop('checked', true);
    $('input#reserve_new', dialog).change();

    var options = {
        filter_fn: function(vnet){
            return (vnet['PARENT_NETWORK_ID'] == $('#vnet_id',dialog).text());
        }
    };

    setupVNetTableSelect(dialog, "reserve", options);

    $("input#selected_resource_id_reserve", dialog).attr("wizard_field", "vnet");

    setupARTableSelect(dialog, "ar_reserve", function(section){
        return $('#vnet_id',section).text();
    });

    $("input#selected_resource_id_ar_reserve", dialog).attr("wizard_field", "ar_id");

    dialog.addClass("reveal-modal large max-height").attr("data-reveal", "");
    setupTips(dialog);

    dialog.die();
    dialog.live('closed', function () {
        $reserve_dialog.html("");
        setupReserveDialog();
    });

    $('#reserve_form',dialog).submit(function(){
        var vnet_id = $('#vnet_id', this).text();
        var data = {};

        retrieveWizardFields(dialog, data);

        Sunstone.runAction('Network.reserve', vnet_id, data);

        return false;
    });
}

function generateARTableSelect(context_id){
    var columns = [
        tr("Address Range"),
        tr("Type"),
        tr("Start"),
        tr("IPv6 Prefix"),
        tr("Leases")
    ];

    var options = {
        "id_index": 0,
        "name_index": 0,
        "select_resource": tr("Please select an Address Range from the list"),
        "you_selected": tr("You selected the following Address Range:")
    }

    return generateResourceTableSelect(context_id, columns, options);
}

function setupARTableSelect(section, context_id, vnet_id_fn){

    var options = {
        "dataTable_options": {
            "bSortClasses" : false,
            "bDeferRender": true,
            "aoColumnDefs": [
            //{ "bSortable": false, "aTargets": [3,4] },
            ]
        },

        "id_index": 0,
        "name_index": 0,

        "update_fn": function(datatable){

            var vn_id = vnet_id_fn(section);

            OpenNebula.Network.show({
                data : {
                    id: vn_id
                },
                timeout: true,
                success: function (request, vn){
                    var ar_list_array = [];

                    var ar_list = get_ar_list(vn.VNET);

                    $.each(ar_list, function(){
                        var ar = this;
                        var id = ar.AR_ID;

                        var start;

                        if(ar.TYPE == "IP4" || ar.TYPE == "IP4_6"){
                            start = (ar.IP ? ar.IP : "--");
                        } else {
                            start = (ar.MAC ? ar.MAC : "--");
                        }

                        var prefix = "";

                        if(ar.GLOBAL_PREFIX && ar.ULA_PREFIX){
                            prefix += ar.GLOBAL_PREFIX + "<br>" + ar.ULA_PREFIX;
                        } else if (ar.GLOBAL_PREFIX){
                            prefix += ar.GLOBAL_PREFIX;
                        } else if (ar.ULA_PREFIX){
                            prefix += ar.ULA_PREFIX;
                        } else {
                            prefix = "--";
                        }

                        ar_list_array.push([
                            id,
                            (ar.TYPE ? ar.TYPE : "--"),
                            start,
                            prefix,
                            quotaBarHtml(ar.USED_LEASES, ar.SIZE)
                        ]);
                    });


                    updateView(ar_list_array, datatable);
                },
                error: onError
            });
        }
    };

    return setupResourceTableSelect(section, context_id, options);
}

function popUpNetworkImportDialog(){
    setupNetworkImportDialog();
    var dialog = $('#network_import_dialog');
    $(dialog).foundation().foundation('reveal', 'open');
}

// Netowrk import dialog
function setupNetworkImportDialog(){
    //Append to DOM
    dialogs_context.append('<div id="network_import_dialog"></div>');
    var dialog = $('#network_import_dialog',dialogs_context);

    //Put HTML in place

    var html = '<div class="row">\
        <h3 id="import_network_header" class="subheader">'+tr("Import vCenter Networks")+'</h3>\
      </div>\
      <div class="row vcenter_credentials">\
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
              <a class="button radius small right" id="get_vcenter_networks">'+tr("Get Networks")+'</a>\
            </div>\
          </div>\
          <div class="vcenter_networks">\
          </div>\
          <br>\
          <div class="row">\
            <div class="large-12 columns">\
              <br>\
              <a class="button radius small right success" id="import_vcenter_networks">'+tr("Import")+'</a>\
            </div>\
          </div>\
        </fieldset>\
        <a class="close-reveal-modal">&#215;</a>\
      </div>\
      ';


    dialog.html(html);
    dialog.addClass("reveal-modal medium").attr("data-reveal", "");

    $("#get_vcenter_networks", dialog).on("click", function(){
      var networks_container = $(".vcenter_networks", dialog);

      var vcenter_user = $("#vcenter_user", dialog).val();
      var vcenter_password = $("#vcenter_password", dialog).val();
      var vcenter_host = $("#vcenter_host", dialog).val();


      fillVCenterNetworks({
        container: networks_container,
        vcenter_user: vcenter_user,
        vcenter_password: vcenter_password,
        vcenter_host: vcenter_host
      });

      return false;
    })

    $("#import_vcenter_networks", dialog).on("click", function(){
      $(this).hide();

      $.each($(".network_name:checked", dialog), function(){
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

        if($(".vlaninfo", network_context))
        {
           network_tmpl += "VLAN=\"YES\"\n";
           network_tmpl += "VLAN_ID="+$(".vlaninfo", network_context).val()+"\n";
        }

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
              Sunstone.runAction("Network.refresh");
            },
            error: function (request, error_json){
                $(".vcenter_network_result", network_context).html('<span class="fa-stack fa-2x" style="color: #dfdfdf">'+
                      '<i class="fa fa-cloud fa-stack-2x"></i>'+
                      '<i class="fa  fa-warning fa-stack-1x fa-inverse"></i>'+
                    '</span>');

                $(".vcenter_network_response", network_context).html('<p style="font-size:12px" class="error-color">'+
                      (error_json.error.message || tr("Cannot contact server: is it running and reachable?"))+
                    '</p>');
                Sunstone.runAction("Network.refresh");
            }
        });
      });
   });
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
              var netname   = network.name.replace(" ","_");
              var vlan_info = ""

              if (network.vlan)
              {
                   var vlan_info = '<div class="vlan_info">' +
                        '<div class="large-4 columns">'+
                          '<label>' + tr("VLAN") + 
                             '<input type="text" class="vlaninfo" value="'+network.vlan+'" disabled/>' +
                          '</label>'+
                        '</div>'+
                      '</div>';
              }

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
                      vlan_info +
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

      setupLeasesOps();

      setupAddARDialog();
      setupUpdateARDialog();
      setupReserveDialog();

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
