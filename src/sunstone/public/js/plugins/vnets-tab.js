/* -------------------------------------------------------------------------- */
/* Copyright 2002-2013, OpenNebula Project (OpenNebula.org), C12G Labs        */
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

var vnets_tab_content = '\
<form class="custom" id="virtualNetworks_form" action="">\
<div class="panel">\
<div class="row">\
  <div class="twelve columns">\
    <h4 class="subheader header">\
      <span class="header-resource">\
        <i class="icon-sitemap"></i> '+tr("Virtual Networks")+'\
      </span>\
      <span class="header-info">\
        <span id="total_vnets"/> <small>'+tr("TOTAL")+'</small>&emsp;\
        <span id="addresses_vnets"/> <small>'+tr("USED IPs")+'</small>\
      </span>\
      <span class="user-login">\
      </span>\
    </h4>\
  </div>\
</div>\
<div class="row">\
  <div class="ten columns">\
    <div class="action_blocks">\
    </div>\
  </div>\
  <div class="two columns">\
    <input id="vnet_search" type="text" placeholder="'+tr("Search")+'" />\
  </div>\
</div>\
</div>\
  <div class="row">\
    <div class="twelve columns">\
<table id="datatable_vnetworks" class="datatable twelve">\
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
</table>\
</form>';

var create_vn_tmpl =
'<div class="panel">\
  <h3>\
    <small id="create_vnet_header">'+tr("Create Virtual Network")+'</small>\
  </h3>\
</div>\
<div class="reveal-body">\
      <dl class="tabs">\
        <dd class="active"><a href="#vnet_wizard">'+tr("Wizard")+'</a></dd>\
        <dd><a href="#vnet_advanced">'+tr("Advanced mode")+'</a></dd>\
      </dl>\
      <ul class="tabs-content">\
        <li class="active" id="vnet_wizardTab">\
           <form id="create_vn_form_easy" action="" class="creation">\
            <div class="row">\
              <div class="three columns">\
                <label class="right inline" for="name" >' + tr("Name") + ':</label>\
              </div>\
              <div class="eight columns">\
                <input type="text" name="name" id="name"/>\
              </div>\
              <div class="one columns ">\
              </div>\
            </div>\
            <div class="row">\
              <fieldset>\
                <legend>' + tr("Type") + '</legend>\
                  <div class="row">\
                    <div class="six columns">\
                      <label for="ipv4_check" class="right"><input type="radio" name="ip_version" id="ipv4_check" value="ipv4" checked="checked"/>'+tr("IPv4")+'</label>\
                    </div>\
                    <div class="six columns">\
                      <label for="ipv6_check"><input type="radio" name="ip_version" id="ipv6_check" value="ipv6"/>'+tr("IPv6")+'</label>\
                    </div>\
                  </div>\
                  <div class="row">\
                    <div class="six columns">\
                        <div class="four columns">\
                          <label class="right inline" for="net_address">'+tr("N. Address")+':</label>\
                        </div>\
                        <div class="seven columns">\
                          <input type="text" name="net_address" id="net_address" />\
                        </div>\
                        <div class="one columns">\
                        </div>\
                    </div>\
                    <div class="six columns">\
                        <div class="four columns">\
                          <label class="right inline" for="net_mask">'+tr("N. Mask")+':</label>\
                        </div>\
                        <div class="seven columns">\
                          <input type="text" name="net_mask" id="net_mask" />\
                        </div>\
                        <div class="one columns">\
                        </div>\
                    </div>\
                  </div>\
                  <div class="row">\
                    <div class="six columns">\
                        <div class="four columns">\
                          <label class="right inline" for="site_prefix">'+tr("Site prefix")+':</label>\
                        </div>\
                        <div class="seven columns">\
                          <input type="text" name="site_prefix" id="site_prefix" />\
                        </div>\
                        <div class="one columns">\
                        </div>\
                    </div>\
                    <div class="six columns">\
                        <div class="four columns">\
                          <label class="right inline" for="global_prefix">'+tr("Global prefix")+':</label>\
                        </div>\
                        <div class="seven columns">\
                          <input type="text" name="global_prefix" id="global_prefix" />\
                        </div>\
                        <div class="one columns">\
                        </div>\
                    </div>\
                  </div>\
                  <div class="row">\
                    <div class="six columns">\
                        <div class="four columns">\
                          <label class="right inline" for="net_dns">'+tr("DNS")+':</label>\
                        </div>\
                        <div class="seven columns">\
                          <input type="text" name="net_dns" id="net_dns" />\
                        </div>\
                        <div class="one columns">\
                        </div>\
                    </div>\
                    <div class="six columns">\
                        <div class="four columns">\
                          <label class="right inline" for="net_gateway">'+tr("Gateway")+':</label>\
                        </div>\
                        <div class="seven columns">\
                          <input type="text" name="net_gateway" id="net_gateway" />\
                        </div>\
                        <div class="one columns">\
                        </div>\
                    </div>\
                  </div>\
                  <hr>\
                  <div class="row">\
                    <div class="six columns">\
                      <label for="fixed_check" class="right"><input type="radio" name="fixed_ranged" id="fixed_check" value="fixed" checked="checked"/>'+tr("Fixed network")+'</label>\
                    </div>\
                    <div class="six columns">\
                      <label for="ranged_check"><input type="radio" name="fixed_ranged" id="ranged_check" value="ranged"/>'+tr("Ranged network")+'</label>\
                    </div>\
                  </div>\
                  <div id="fixed">\
                     <div class="row">\
                      <div class="six columns">\
                        <div class="row">\
                          <div class="four columns">\
                            <label class="right inline" for="leaseip">'+tr("IP")+':</label>\
                          </div>\
                          <div class="seven columns">\
                            <input type="text" name="leaseip" id="leaseip" />\
                          </div>\
                          <div class="one columns">\
                          </div>\
                        </div>\
                        <div class="row">\
                          <div class="four columns">\
                            <label class="right inline" for="leasemac">'+tr("MAC")+':</label>\
                          </div>\
                          <div class="seven columns">\
                            <input type="text" name="leasemac" id="leasemac" />\
                          </div>\
                          <div class="one columns">\
                          </div>\
                        </div>\
                        <div class="row">\
                          <div class="six columns">\
                            <button class="add_remove_button add_button secondary button right small radius" id="add_lease" value="add/lease">\
                             '+tr("Add")+'\
                            </button>\
                          </div>\
                          <div class="six columns">\
                            <button class="add_remove_button secondary button small radius" id="remove_lease" value="remove/lease">\
                             '+tr("Remove selected")+'\
                            </button>\
                          </div>\
                        </div>\
                      </div>\
                      <div class="six columns">\
                        <div class="row">\
                          <div class="eight centered columns">\
                            <select id="leases" name="leases" style="height:10em; width:100%" multiple>\
                              <!-- insert leases -->\
                            </select>\
                          </div>\
                        </div>\
                      </div>\
                     </div>\
                  </div>\
                  <div id="ranged">\
                    <div class="row">\
                      <div class="four columns centered">\
                        <label for="custom_pool" class="inline"><input type="checkbox" id="custom_pool"/>'+tr("Define a subnet by IP range")+'</label>\
                      </div>\
                    </div>\
                    <div class="row">\
                      <div class="six columns">\
                          <div class="four columns">\
                            <label class="right inline" for="ip_start">'+tr("IP Start")+':</label>\
                          </div>\
                          <div class="seven columns">\
                            <input type="text" name="ip_start" id="ip_start" disabled="disabled" />\
                          </div>\
                          <div class="one columns">\
                          </div>\
                      </div>\
                      <div class="six columns">\
                          <div class="four columns">\
                            <label class="right inline" for="ip_end">'+tr("IP End")+':</label>\
                          </div>\
                          <div class="seven columns">\
                            <input type="text" name="ip_end" id="ip_end" disabled="disabled" />\
                          </div>\
                          <div class="one columns">\
                          </div>\
                      </div>\
                    </div>\
                  </div>\
                  <div id="ranged_ipv6">\
                    <div class="row">\
                      <div class="six columns">\
                          <div class="four columns">\
                            <label class="right inline" for="mac_start">'+tr("MAC Start")+':</label>\
                          </div>\
                          <div class="seven columns">\
                            <input type="text" name="net_address" id="mac_start" />\
                          </div>\
                          <div class="one columns">\
                          </div>\
                      </div>\
                      <div class="six columns">\
                          <div class="four columns">\
                            <label class="right inline" for="net_size">'+tr("N. Size")+':</label>\
                          </div>\
                          <div class="seven columns">\
                            <input type="text" name="net_size" id="net_size" />\
                          </div>\
                          <div class="one columns">\
                          </div>\
                      </div>\
                    </div>\
                  </div>\
              </fieldset>\
            </div>\
            <div class="row centered">\
              <div class="six columns">\
                <label class="right inline" for="network_mode">'+tr("Network model")+':</label>\
              </div>\
              <div class="five columns">\
                <select name="network_mode" id="network_mode">\
                  <option value="default">'+tr("Default")+'</option>\
                  <option value="802.1Q">'+tr("802.1Q")+'</option>\
                  <option value="ebtables">'+tr("ebtables")+'</option>\
                  <option value="openvswitch">'+tr("Open vSwitch")+'</option>\
                  <option value="vmware">'+tr("VMware")+'</option>\
               </select>\
              </div>\
              <div class="one columns">\
              </div>\
            </div>\
            <div class="row">\
              <div class="six columns">\
                <div class="row">\
                  <div class="four columns">\
                    <label class="right inline" for="bridge">'+tr("Bridge")+':</label>\
                  </div>\
                  <div class="seven columns">\
                    <input type="text" name="bridge" id="bridge" />\
                  </div>\
                  <div class="one columns">\
                  </div>\
                </div>\
                <div class="row">\
                  <div class="four columns">\
                    <label class="right inline" for="phydev">'+tr("Physical device")+':</label>\
                  </div>\
                  <div class="seven columns">\
                    <input type="text" name="phydev" id="phydev" />\
                  </div>\
                  <div class="one columns">\
                  </div>\
                </div>\
              </div>\
              <div class="six columns">\
                <div class="row">\
                  <div class="four columns">\
                    <label class="right inline" for="vlan">'+tr("VLAN")+':</label>\
                  </div>\
                  <div class="seven columns">\
                    <select name="vlan" id="vlan">\
                        <option value="YES" selected="selected">'+tr("Yes")+'</option>\
                        <option value="NO">'+tr("No")+'</option>\
                     </select>\
                  </div>\
                  <div class="one columns ">\
                  </div>\
                </div>\
                <div class="row">\
                  <div class="four columns">\
                    <label class="right inline" for="vlan_id">'+tr("VLAN ID")+':</label>\
                  </div>\
                  <div class="seven columns">\
                    <input type="text" name="vlan_id" id="vlan_id" />\
                  </div>\
                  <div class="one columns ">\
                  </div>\
                </div>\
              </div>\
            </div>\
            <div class="row">\
              <fieldset>\
                <legend>' + tr("Custom attributes") + '</legend>\
                 <div class="row">\
                  <div class="six columns">\
                    <div class="row">\
                      <div class="four columns">\
                        <label class="right inline" for="custom_var_vnet_name">'+tr("Name")+':</label>\
                      </div>\
                      <div class="seven columns">\
                        <input type="text" id="custom_var_vnet_name" name="custom_var_vnet_name" />\
                      </div>\
                      <div class="one columns">\
                      </div>\
                    </div>\
                    <div class="row">\
                      <div class="four columns">\
                        <label class="right inline" for="custom_var_vnet_value">'+tr("Value")+':</label>\
                      </div>\
                      <div class="seven columns">\
                        <input type="text" id="custom_var_vnet_value" name="custom_var_vnet_value" />\
                      </div>\
                      <div class="one columns">\
                      </div>\
                    </div>\
                    <div class="row">\
                      <div class="six columns">\
                        <button class="add_remove_button add_button secondary button right small radius" id="add_custom_var_vnet_button" value="add_custom_vnet_var">\
                         '+tr("Add")+'\
                        </button>\
                      </div>\
                      <div class="six columns">\
                        <button class="add_remove_button secondary button small radius" id="remove_custom_var_vnet_button" value="remove_custom_vnet_var">\
                         '+tr("Remove selected")+'\
                        </button>\
                      </div>\
                    </div>\
                  </div>\
                  <div class="six columns">\
                    <div class="row">\
                      <div class="eight centered columns">\
                        <select id="custom_var_vnet_box" name="custom_var_vnet_box" style="height:10em; width:100%" multiple>\
                          <!-- insert leases -->\
                        </select>\
                      </div>\
                    </div>\
                  </div>\
                 </div>\
              </fieldset>\
            </div>\
        <div class="reveal-footer">\
        <hr>\
        <div class="form_buttons">\
          <button class="button success radius right" id="create_vn_submit_easy" value="vn/create">\
             '+tr("Create")+'\
          </button>\
          <button id="wizard_vnet_reset_button" class="button secondary radius" type="reset" value="reset">'+tr("Reset")+'</button>\
          <button class="close-reveal-modal button secondary radius" type="button" value="close">' + tr("Close") + '</button>\
        </div>\
         </div>\
        </form>\
      </li>\
      <li id="vnet_advancedTab">\
        <form id="create_vn_form_manual" action="">\
            <h4><small>'+tr("Write the Virtual Network template here")+'</small></h4>\
            <textarea id="template" rows="15" style="width:100%;"></textarea>\
            <div class="reveal-footer">\
              <hr>\
              <div class="form_buttons">\
                <button class="button success right radius" id="create_vn_submit_manual" value="vn/create">\
                   '+tr("Create")+'\
                </button>\
                <button id="advanced_vnet_reset_button" class="button secondary radius" type="reset" value="reset">'+tr("Reset")+'</button>\
                <button class="close-reveal-modal button secondary radius" type="button" value="close">' + tr("Close") + '</button>\
              </div>\
            </div>\
        </form>\
      </li>\
    </ul>\
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
        call: OpenNebula.Network.del,
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
        notify: false
    },

    "Network.rmleases" : {
        type: "single",
        call: OpenNebula.Network.rmleases,
        callback: vnShow,
        error: onError,
        notify: false
    },

    "Network.hold" : {
        type: "single",
        call: OpenNebula.Network.hold,
        callback: vnShow,
        error: onError,
        notify: false
    },

    "Network.release" : {
        type: "single",
        call: OpenNebula.Network.release,
        callback: vnShow,
        error: onError,
        notify: false
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

    "Network.chmod" : {
        type: "single",
        call: OpenNebula.Network.chmod,
//        callback
        error: onError,
        notify: true
    },

    "Network.rename" : {
        type: "single",
        call: OpenNebula.Network.rename,
        callback: function(request) {
            notifyMessage("VirtualNetwork renamed correctly");
            Sunstone.runAction('Network.showinfo',request.request.data[0]);
            Sunstone.runAction("Network.list");
        },
        error: onError,
        notify: true
    },

    "Network.update_template" : {
        type: "single",
        call: OpenNebula.Network.update,
        callback: function(request) {
            notifyMessage("Template updated correctly");
            Sunstone.runAction('Network.showinfo',request.request.data[0]);
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
            Sunstone.runAction('Network.showinfo',request.request.data[0]);
        },
        elements: vnElements,
        notify: true
    },

    "Network.help" : {
        type: "custom",
        call: function() {
            hideDialog();
            $('div#vnets_tab div.legend_div').slideToggle();
        }
    }
};


var vnet_buttons = {
    "Network.refresh" : {
        type: "action",
        layout: "refresh",
        alwaysActive: true
    },

    "Network.create_dialog" : {
        type: "create_dialog",
        layout: "create"
    },

    "Network.addtocluster" : {
        type: "confirm_with_select",
        text: tr("Select cluster"),
        layout: "more_select",
        select: clusters_sel,
        tip: tr("Select the destination cluster:"),
        condition: mustBeAdmin
    },
    "Network.chown" : {
        type: "confirm_with_select",
        text: tr("Change owner"),
        layout: "user_select",
        select: users_sel,
        tip: tr("Select the new owner")+":",
        condition: mustBeAdmin
    },

    "Network.chgrp" : {
        type: "confirm_with_select",
        text: tr("Change group"),
        layout: "user_select",
        select: groups_sel,
        tip: tr("Select the new group")+":",
        condition: mustBeAdmin
    },

    "Network.delete" : {
        type: "confirm",
        layout: "del",
        text: tr("Delete")
    },

    //"Network.help" : {
    //    type: "action",
    //    text: '?',
    //    alwaysActive: true
    //}
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
    content: vnets_tab_content,
    buttons: vnet_buttons,
    tabClass: "subTab",
    parentTab: "infra-tab",
    showOnTopMenu: false
}

Sunstone.addActions(vnet_actions);
Sunstone.addMainTab('vnets-tab',vnets_tab);
Sunstone.addInfoPanel('vnet_info_panel',vnet_info_panel);

// return list of selected elements in list
function vnElements(){
    return getSelectedNodes(dataTable_vNetworks);
}

function vnShow(req){
    Sunstone.runAction("Network.show",req.request.data[0][0]);
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
        parseInt(network.TYPE) ? "FIXED" : "RANGED",
        network.BRIDGE,
        network.TOTAL_LEASES ];
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

    $("#total_vnets", $dashboard).text(network_list.length);
    $("#addresses_vnets", $dashboard).text(addresses_vnets);

    var form = $("#virtualNetworks_form");

    $("#total_vnets", form).text(network_list.length);
    $("#addresses_vnets", form).text(addresses_vnets);
}

//updates the information panel tabs and pops the panel up
function updateVNetworkInfo(request,vn){
    var vn_info = vn.VNET;
    var info_tab_content =
        '<div class="">\
        <div class="six columns">\
        <table id="info_vn_table" class="twelve datatable extended_table">\
            <thead>\
               <tr><th colspan="3">'+tr("Virtual Network")+' - '+vn_info.NAME+' '+
                   '</th></tr>\
            </thead>\
            <tr>\
              <td class="key_td">'+tr("ID")+'</td>\
              <td class="value_td">'+vn_info.ID+'</td>\
              <td></td>\
            </tr>\
            <tr>\
              <td class="key_td">'+tr("Name")+'</td>\
              <td class="value_td_rename">'+vn_info.NAME+'</td>\
              <td><div id="div_edit_rename">\
                     <a id="div_edit_rename_link" class="edit_e" href="#"><i class="icon-edit right"/></a>\
                  </div>\
              </td>\
            </tr>\
            <tr>' +
        insert_cluster_dropdown("Network",vn_info.ID,vn_info.CLUSTER,vn_info.CLUSTER_ID) +
            '</tr>\
            <tr>\
              <td class="key_td">'+tr("Bridge")+'</td>\
              <td class="value_td">'+ (typeof(vn_info.BRIDGE) == "object" ? "--": vn_info.BRIDGE) +'</td>\
              <td></td>\
            </tr>\
            <tr>\
              <td class="key_td">'+tr("VLAN")+'</td>\
              <td class="value_td">'+ (vn_info.VLAN == "0" ? "no" : "yes") +'</td>\
              <td></td>\
            </tr>\
            <tr>\
              <td class="key_td">'+tr("Physical device")+'</td>\
              <td class="value_td">'+ (typeof(vn_info.PHYDEV) == "object" ? "--": vn_info.PHYDEV) +'</td>\
              <td></td>\
            </tr>\
            <tr>\
              <td class="key_td">'+tr("VLAN ID")+'</td>\
              <td class="value_td">'+ (typeof(vn_info.VLAN_ID) == "object" ? "--": vn_info.VLAN_ID) +'</td>\
              <td></td>\
            </tr>\
        </table>\
        </div>\
        <div class="six columns">'
            + insert_permissions_table('vnets-tab',
                                       "Network",
                                       vn_info.ID,
                                       vn_info.UNAME,
                                       vn_info.GNAME,
                                       vn_info.UID,
                                       vn_info.GID)
            + insert_extended_template_table(vn_info.TEMPLATE,
                                                       "Network",
                                                       vn_info.ID,
                                                       "Configuration Attributes") +
        '</div>\
      </div>';

    var info_tab = {
        title: tr("Information"),
        content: info_tab_content
    };

    var leases_tab = {
        title: tr("Lease management"),
        content: printLeases(vn_info)
    };

    $("#div_edit_rename_link").die();
    $(".input_edit_value_rename").die();

    // Listener for key,value pair edit action
    $("#div_edit_rename_link").live("click", function() {
        var value_str = $(".value_td_rename").text();
        $(".value_td_rename").html('<input class="input_edit_value_rename" id="input_edit_rename" type="text" value="'+value_str+'"/>');
    });

    $(".input_edit_value_rename").live("change", function() {
        var value_str = $(".input_edit_value_rename").val();
        if(value_str!="")
        {
            // Let OpenNebula know
            var name_template = {"name": value_str};
            Sunstone.runAction("Network.rename",vn_info.ID,name_template);
        }
    });


    Sunstone.updateInfoPanelTab("vnet_info_panel","vnet_info_tab",info_tab);
    Sunstone.updateInfoPanelTab("vnet_info_panel","vnet_leases_tab",leases_tab);

    Sunstone.popUpInfoPanel("vnet_info_panel", "vnets-tab");

    setPermissionsTable(vn_info,'');

    $("#vnet_info_panel_refresh", $("#vnet_info_panel")).click(function(){
      $(this).html(spinner);
      Sunstone.runAction('Network.showinfo', vn_info.ID);
    })
}

// Prints the lis of leases depending on the Vnet TYPE
// It adds the "add lease", "hold lease" fields, and each lease comes with
// hold, release buttons etc. Listeners in setupLeasesOps()
function printLeases(vn_info){
    var html ='<form id="leases_form" vnid="'+vn_info.ID+'"><div class="twelve columns">';
    html +='';

    html += '<table id="vn_leases_info_table" class="six datatable extended_table">\
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
              <tr>\
                <td colspan="2" class="key_td">'+tr("IPv6 Global prefix")+'</td>\
                <td class="value_td">'+ (typeof(vn_info.GLOBAL_PREFIX) == "object" ? "--": vn_info.GLOBAL_PREFIX) +'</td>\
                <td></td>\
                <td></td>\
              </tr>\
              <tr>\
                <td colspan="2" class="key_td">'+tr("IPv6 Site prefix")+'</td>\
                <td class="value_td">'+ (typeof(vn_info.SITE_PREFIX) == "object" ? "--": vn_info.SITE_PREFIX) +'</td>\
                <td></td>\
                <td></td>\
              </tr>\
            </tbody></table>';

    html += '<table id="vn_leases_table" class="six datatable extended_table">\
      <thead>\
        <tr><th colspan="7">'+tr("Leases information")+'</th></tr>\
      </thead>\
      <tbody>';

    if (vn_info.TYPE == "0"){
        html += '<tr>\
                   <td colspan="3" class="key_td">'+tr("IP Start")+'</td>\
                   <td colspan="4" class="value_td">'+vn_info.RANGE.IP_START+'</td>\
                 </tr>\
                 <tr>\
                   <td colspan="3" class="key_td">'+tr("IP End")+'</td>\
                   <td colspan="4" class="value_td">'+vn_info.RANGE.IP_END+'</td>\
                 </tr>';

        if (Config.isTabActionEnabled("vnets-tab", "Network.hold_lease")) {
            html +=
            '<tr>\
              <td colspan="4" class="value_td"><input type="text" id="panel_hold_lease"/></td>\
              <td colspan="3"><button class="button small secondary radius" id="panel_hold_lease_button">'+tr("Hold IP")+'</button></td>\
            </tr>';
          }
    } else {
      if (Config.isTabActionEnabled("vnets-tab", "Network.addleases")) {
        html +=
        '<tr>\
          <td colspan="4" class="value_td"><input type="text" id="panel_add_lease"/></td>\
          <td colspan="3"><button id="panel_add_lease_button" class="button small secondary radius">'+tr("Add IP")+'</button></td>\
        </tr>';
      }
    };

    html +='</tbody>\
      </table>\
      <table class="twelve datatable extended_table">\
      <thead>\
        <tr>\
        <th></th>\
        <th></th>\
        <th></th>\
        <th>'+tr("IP")+'</th>\
        <th>'+tr("MAC")+'</th>\
        <th>'+tr("IPv6 Site")+'</th>\
        <th>'+tr("IPv6 Global")+'</th>\
        </tr>\
      </thead>\
      <tbody>';

    var leases = vn_info.LEASES.LEASE;

    if (!leases) //empty
    {
        html+='<tr id="no_leases_tr"><td colspan="7" class="key_td">\
                   '+tr("No leases to show")+'\
                   </td></tr>';
        html += '</tbody></table></div></form>';
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

        html+='<tr ip="'+lease.IP+'">';

        html += '<td class="key_td">';
        switch (state){
        case 0: //free
            html += '<span type="text" class="success radius label"></span> '
            break;
        case 1: //used
            html += '<span type="text" class="radius label "></span> '
            break;
        case 2: //hold
            html += '<span type="text" class="alert radius label"></span> '
            break;
        };
        html += '</td>'

        switch (state){
        case 0:
            html += '<td>';
            if (Config.isTabActionEnabled("vnets-tab", "Network.hold_lease")) {
              html += '<a class="hold_lease" href="#"><i class="icon-pause"/></a>';
            }
            html += '</td>'
            html += '<td>'
            if (Config.isTabActionEnabled("vnets-tab", "Network.remove_lease")) {
              html += '<a class="delete_lease" href="#"><i class="icon-trash"/></a>';
            }
            break;
        case 1:
            html += '<td colspan="2">' + tr("VM:") + lease.VID+''
            break;
        case 2:
            html += '<td>';
            if (Config.isTabActionEnabled("vnets-tab", "Network.release_lease")) {
              html += '<a class="release_lease" href="#"><i class="icon-play"/></a>';
            }
            html += '</td>'
            html += '<td>'
            break;
        };
        html += '</td>'

        html += '<td>'+ lease.IP + '</td>';

        html += '<td class="value_td">\
                 '+lease.MAC+'</td>';

        html += '<td class="value_td">'+ (lease.IP6_SITE ? lease.IP6_SITE : "--") +'</td>';
        html += '<td class="value_td">'+ (lease.IP6_GLOBAL ? lease.IP6_GLOBAL : "--") +'</td>';

        html += '</tr>';
    };

    html += '</tbody></table></div></form>';

    return html;
}

//Prepares the vnet creation dialog
function setupCreateVNetDialog() {
    dialogs_context.append('<div id="create_vn_dialog"></div>');
    $create_vn_dialog = $('#create_vn_dialog',dialogs_context)
    var dialog = $create_vn_dialog;
    dialog.html(create_vn_tmpl);

    var height = Math.floor($(window).height()*0.8); //set height to a percentage of the window

    //Prepare the jquery-ui dialog. Set style options here.
    //dialog.dialog({
    //    autoOpen: false,
    //    modal: true,
    //    width: 475,
    //    height: height
    //});
    dialog.addClass("reveal-modal xlarge max-height");

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

        var network_json = {"name" : name};

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
        $create_vn_dialog.trigger("reveal:close")
        return false;
    });

    $('#create_vn_submit_manual',dialog).click(function(){
        var template=$('#template',dialog).val();
        var vnet_json = {vnet: {vnet_raw: template}};
        Sunstone.runAction("Network.create",vnet_json);
        $create_vn_dialog.trigger("reveal:close")
        return false;
    });

    $('#wizard_vnet_reset_button').click(function(){
        $create_vn_dialog.trigger('reveal:close');
        $create_vn_dialog.remove();
        setupCreateVNetDialog();

        popUpCreateVnetDialog();
    });

    $('#advanced_vnet_reset_button').click(function(){
        $create_vn_dialog.trigger('reveal:close');
        $create_vn_dialog.remove();
        setupCreateVNetDialog();

        popUpCreateVnetDialog();
        $("a[href='#vnet_advanced']").click();
    });
}

function popUpCreateVnetDialog() {
    $create_vn_dialog.reveal();
}


// Listeners to the add, hold, release, delete leases operations in the
// extended information panel.
function setupLeasesOps(){
  if (Config.isTabActionEnabled("vnets-tab", "Network.addleases")) {
    $('button#panel_add_lease_button').live("click",function(){
        var lease = $('input#panel_add_lease', dialog).val();
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
        var lease = $('input#panel_hold_lease', dialog).val();
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

function setVNetAutorefresh() {
    setInterval(function(){
        var checked = $('input.check_item:checked',dataTable_vNetworks);
        var filter = $("#vnet_search").attr('value');
        if ((checked.length==0) && !filter){
            Sunstone.runAction("Network.autorefresh");
        }
    },INTERVAL+someTime());
};

//The DOM is ready and the ready() from sunstone.js
//has been executed at this point.
$(document).ready(function(){
    var tab_name = 'vnets-tab';

    if (Config.isTabEnabled(tab_name)) {
      dataTable_vNetworks = $("#datatable_vnetworks",main_tabs_context).dataTable({
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
      setVNetAutorefresh();

      initCheckAllBoxes(dataTable_vNetworks);
      tableCheckboxesListener(dataTable_vNetworks);
      infoListener(dataTable_vNetworks,'Network.showinfo');

      // Reset list filter in case it was set because we were lookin
      // at a single cluster view
      $('div#menu li#li_vnets_tab').live('click',function(){
          dataTable_vNetworks.fnFilter('',5);
      });

      $('div#vnets_tab div.legend_div').hide();
    }
});
