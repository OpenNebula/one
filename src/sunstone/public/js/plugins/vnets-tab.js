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
var last_selected_row_ar;

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
      <div>\
        <dl id="vnet_create_tabs" class="tabs right-info-tabs text-center" data-tab>\
          <dd class="active"><a href="#vnetCreateGeneralTab"><i class="fa fa-globe"></i><br>'+tr("General")+'</a></dd>\
          <dd><a href="#vnetCreateBridgeTab"><i class="fa fa-cog"></i><br>'+tr("Configuration")+'</a></dd>\
          <dd><a href="#vnetCreateARTab"><i class="fa fa-align-justify"></i><br>'+tr("Addresses")+'</a></dd>\
          <dd><a href="#vnetCreateContextTab"><i class="fa fa-ellipsis-h"></i><br>'+tr("Other")+'</a></dd>\
        </dl>\
        <div id="vnet_create_tabs_content" class="tabs-content">\
          <div class="content active" id="vnetCreateGeneralTab">\
            <div class="row">\
              <div class="large-6 columns">\
                <label for="name" >' + tr("Name") + ':</label>\
                <input type="text" name="name" id="name"/>\
              </div>\
            </div>\
            <div class="row">\
              <div class="large-6 columns">\
                <label for="DESCRIPTION" >' + tr("Description") + ':</label>\
                <textarea type="text" id="DESCRIPTION" name="DESCRIPTION"/>\
              </div>\
            </div>\
            <br>\
            <div class="row">\
              <div class="large-6 columns">\
                  <label for="net_address">'+tr("N. Address")+':</label>\
                  <input type="text" name="net_address" id="net_address" />\
              </div>\
              <div class="large-6 columns">\
                  <label for="net_mask">'+tr("N. Mask")+':</label>\
                  <input type="text" name="net_mask" id="net_mask" />\
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
          </div>\
          <div class="content" id="vnetCreateBridgeTab">\
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
                  <div class="large-6 columns">\
                    <label for="vlan">'+tr("VLAN")+':</label>\
                    <select name="vlan" id="vlan">\
                        <option value="YES" selected="selected">'+tr("Yes")+'</option>\
                        <option value="NO">'+tr("No")+'</option>\
                     </select>\
                  </div>\
                  <div class="large-6 columns">\
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
          </div>\
          <div class="content" id="vnetCreateARTab">\
            <div class="row">\
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
          </div>\
          <div class="content" id="vnetCreateContextTab">\
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
          Sunstone.runAction("Network.show",req.request.data[0][0]);
        },
        error: onError
    },

    "Network.rm_ar" : {
        type: "single",
        call: OpenNebula.Network.rm_ar,
        callback: function(req) {
          Sunstone.runAction("Network.show",req.request.data[0][0]);
        },
        error: onError
    },

    "Network.update_ar" : {
        type: "single",
        call: OpenNebula.Network.update_ar,
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

    addresses_vnets = addresses_vnets + parseInt(network.USED_LEASES);

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

    var ar_tab = {
        title : tr("Addresses"),
        icon: "fa-align-justify",
        content: ar_list_tab_content(vn_info)
    };

    var leases_tab = {
        title: tr("Leases"),
        icon: "fa-list-ul",
        content: printLeases(vn_info)
    };


    Sunstone.updateInfoPanelTab("vnet_info_panel","vnet_info_tab",info_tab);
    Sunstone.updateInfoPanelTab("vnet_info_panel","vnet_ar_list_tab",ar_tab);
    Sunstone.updateInfoPanelTab("vnet_info_panel","vnet_leases_tab",leases_tab);

    Sunstone.popUpInfoPanel("vnet_info_panel", "vnets-tab");


    var ar_list_dataTable = $("#ar_list_datatable",$("#vnet_info_panel")).dataTable({
        "bSortClasses" : false,
        "bDeferRender": true,
        "aoColumnDefs": [
//            { "bSortable": false, "aTargets": [3,4] },
        ]
    });

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

        $("#ar_show_info", $("#vnet_info_panel")).html(ar_show_info(vn_info, id));

        return false;
    });

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

function ar_list_tab_content(vn_info){

    var ar_list = vn_info.AR_POOL.AR;

    if (!ar_list) //empty
    {
        // TODO: message there are no address ranges
        ar_list = [];
    }
    else if (ar_list.constructor != Array) //>1 lease
    {
        ar_list = [ar_list];
    };

    var html =
    '<form id="ar_list_form" vnid="'+vn_info.ID+'">';

    if (Config.isTabActionEnabled("vnets-tab", "Network.add_ar")) {
        html +=
        '<div class="row collapse">\
          <div class="large-4 columns">\
            <button class="button success small radius" id="add_ar_button">'+'\
              <span class="fa fa-plus"></span> '+tr("Add another Address Range")+'\
            </button>\
          </div>\
        </div>';
    }

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

        html += '<td  style="white-space: nowrap" class="value_td">'+ ar.USED_LEASES +"/"+ ar.SIZE +'</td>';


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

    var ar_list = vn_info.AR_POOL.AR;

    if (!ar_list) //empty
    {
        ar_list = [];
    }
    else if (ar_list.constructor != Array) //>1 lease
    {
        ar_list = [ar_list];
    };

    var found = false;
    var ar;

    for (var i=0; i<ar_list.length; i++){
        if (ar_id == ar_list[i].AR_ID){
            ar = ar_list[i];
            found = true;
            break;
        }
    }

    if(!found){
        return "";
    }

    function ar_attr(val, txt){
        if(val){
            return '<tr>\
                       <td colspan="3" class="key_td">'+txt+'</td>\
                       <td colspan="4" class="value_td">'+val+'</td>\
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
            <tr><th colspan="5">'+tr("Address Range")+' '+ar_id+'</th></tr>\
          </thead>\
          <tbody>';

    // TODO: translate ar.TYPE values?
    html += ar_attr(ar.TYPE, tr("Type"));
    html += ar_attr(ar.MAC, tr("MAC"));
    html += ar_attr(ar.IP, tr("IP"));
    html += ar_attr(ar.GLOBAL_PREFIX, tr("Global prefix"));
    html += ar_attr(ar.ULA_PREFIX, tr("ULA prefix"));
    html += ar_attr(ar.SIZE, tr("Size"));
    html += ar_attr(ar.USED_LEASES, tr("Used leases"));

    html +=
          '</tbody>\
        </table>';

    if (Config.isTabActionEnabled("vnets-tab", "Network.remove_ar")) {
        html +=
        '<div class="large-12 columns text-center">\
          <button class="button small radius" id="rm_ar_button" ar_id="'+ar_id+'">'+tr("Remove Address Range")+'</button>\
        </div>';
    }

    // TODO: extra ar config attributes

    html +=
      '</div>\
    </div>';

    return html;
}

// Prints the lis of leases depending on the Vnet TYPE
// It adds the "add lease", "hold lease" fields, and each lease comes with
// hold, release buttons etc. Listeners in setupLeasesOps()
function printLeases(vn_info){
    var ar_list = vn_info.AR_POOL.AR;

    if (!ar_list) //empty
    {
        ar_list = [];
    }
    else if (ar_list.constructor != Array) //>1 lease
    {
        ar_list = [ar_list];
    };

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

//Prepares the vnet creation dialog
function setupCreateVNetDialog() {
    dialogs_context.append('<div id="create_vn_dialog"></div>');
    $create_vn_dialog = $('#create_vn_dialog',dialogs_context)
    var dialog = $create_vn_dialog;
    dialog.html(create_vn_tmpl);

    dialog.addClass("reveal-modal medium").attr("data-reveal", "");

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

        return false;
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

    setupCustomTags($("#vnetCreateContextTab", dialog));

    //Handle submission of the easy mode
    $('#create_vn_submit_easy',dialog).click(function(){
        //Fetch values
        var name = $('#name',dialog).val();
        if (!name.length){
            notifyError(tr("Virtual Network name missing!"));
            return false;
        }

        var network_json = {"name" : name};

        var description = $('#DESCRIPTION',dialog).val();
        if (description.length)
            network_json['description'] = description;

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

        var network_addr    = $('#net_address',dialog).val();
        var network_mask    = $('#net_mask',dialog).val();
        var network_dns     = $('#net_dns',dialog).val();
        var network_gateway = $('#net_gateway',dialog).val();

        if (network_addr.length)
            network_json["network_address"] = network_addr;

        if (network_mask.length)
            network_json["network_mask"] = network_mask;

        if (network_dns.length)
            network_json["dns"] = network_dns;

        if (network_gateway.length)
            network_json["gateway"] = network_gateway;

        // TODO: gateway 6 in separate input
//        if (network_gateway.length)
//            network_json["gateway6"] = network_gateway;

/*
Attribute   Description
NETWORK_ADDRESS Base network address
NETWORK_MASK    Network mask
GATEWAY Router for this network, do not set when the network is not routable
DNS Specific DNS for this network
GATEWAY6    IPv6 router for this network
CONTEXT_FORCE_IPV4  When a vnet is IPv6 the IPv4 is not configured unless this attribute is set
*/

        $('.ar_tab',dialog).each(function(){
            hash = retrieve_ar_tab_data(this);

            if (!$.isEmptyObject(hash)) {
                if(!network_json["AR"])
                    network_json["AR"] = [];

                network_json["AR"].push(hash);
            }
        });

        //Time to add custom attributes
        retrieveCustomTags($('#vnetCreateContextTab', $create_vn_dialog), network_json);

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

    // Add first AR
    $("#vnet_wizard_ar_btn", $create_vn_dialog).trigger("click");

    $("input#name",$create_vn_dialog).focus();
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
    '<div class="row">\
      <div class="large-12 columns">\
        <input type="radio" name="'+str_ar_tab_id+'_ar_type" id="'+str_ar_tab_id+'_ar_type_ip4" value="IP4" checked="checked"/><label for="'+str_ar_tab_id+'_ar_type_ip4">'+tr("IPv4")+'</label>\
        <input type="radio" name="'+str_ar_tab_id+'_ar_type" id="'+str_ar_tab_id+'_ar_type_ip4_6" value="IP4_6"/><label for="'+str_ar_tab_id+'_ar_type_ip4_6">'+tr("IPv4/6")+'</label>\
        <input type="radio" name="'+str_ar_tab_id+'_ar_type" id="'+str_ar_tab_id+'_ar_type_ip6" value="IP6"/><label for="'+str_ar_tab_id+'_ar_type_ip6">'+tr("IPv6")+'</label>\
        <input type="radio" name="'+str_ar_tab_id+'_ar_type" id="'+str_ar_tab_id+'_ar_type_ether" value="ETHER"/><label for="'+str_ar_tab_id+'_ar_type_ether">'+tr("Ethernet")+'</label>\
      </div>\
    </div>\
    <div class="row">\
      <div class="large-6 columns">\
        <div class="row collapse ar_input type_ip4 type_ip4_6">\
          <label for="'+str_ar_tab_id+'_ip_start">'+tr("IP Start")+':</label>\
          <input type="text" name="IP" id="'+str_ar_tab_id+'_ip_start"/>\
        </div>\
        <div class="row collapse ar_input type_ip4 type_ip4_6 type_ip6 type_ether">\
          <label for="'+str_ar_tab_id+'_mac_start">'+tr("MAC Start")+':</label>\
          <input type="text" name="MAC" id="'+str_ar_tab_id+'_mac_start" />\
        </div>\
      </div>\
      <div class="large-6 columns ar_input type_ip4 type_ip4_6 type_ip6 type_ether">\
        <label for="'+str_ar_tab_id+'_size">'+tr("Size")+':</label>\
        <input type="text" name="SIZE" id="'+str_ar_tab_id+'_size" />\
      </div>\
    </div>\
    <div class="row">\
      <div class="large-6 columns ar_input type_ip4_6 type_ip6">\
        <label for="'+str_ar_tab_id+'_global_prefix">'+tr("Global prefix")+':</label>\
        <input type="text" name="GLOBAL_PREFIX" id="'+str_ar_tab_id+'_global_prefix"/>\
      </div>\
      <div class="large-6 columns ar_input type_ip4_6 type_ip6">\
        <label for="'+str_ar_tab_id+'_ula_prefix">'+tr("ULA prefix")+':</label>\
        <input type="text" name="ULA_PREFIX" id="'+str_ar_tab_id+'_ula_prefix"/>\
      </div>\
    </div>\
    <div class="row">\
      <hr>\
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
    </div>';

    return html;
}

function setup_ar_tab_content(ar_section, str_ar_tab_id) {

    $('input[name$="ar_type"]',ar_section).change(function(){
        $('div.ar_input', ar_section).hide();

        switch($(this).val()){
        case "IP4":
            $('div.type_ip4', ar_section).show();
            break;
        case "IP4_6":
            $('div.type_ip4_6', ar_section).show();
            break;
        case "IP6":
            $('div.type_ip6', ar_section).show();
            break;
        case "ETHER":
            $('div.type_ether', ar_section).show();
            break;
        }
    });

    $('input#'+str_ar_tab_id+'_ar_type_ip4',ar_section).attr('checked', true);
    $('input#'+str_ar_tab_id+'_ar_type_ip4',ar_section).change();

    setupCustomTags($('#'+str_ar_tab_id+'_custom_tags',ar_section));

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

    // TODO MANDATORY INPUTS
    /*
    if (!(ip_start.length && ip_end.length) && !network_addr.length){
        notifyError(tr("There are missing network parameters"));
        return false;
    };
    */

    return data
}

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
        var lease = $(this).parents('tr').attr('ip');
        var id = $(this).parents('form').attr('vnid');
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
}

function popUpAddAR(id){
    $('#vnet_id',$add_ar_dialog).text(id);
    $add_ar_dialog.foundation().foundation('reveal', 'open');
}

function setupAddARDialog(){
    dialogs_context.append('<div id="add_ar_dialog"></div>');
    $add_ar_dialog = $('#add_ar_dialog',dialogs_context);
    var dialog = $add_ar_dialog;

    dialog.html(
    '<div class="reveal-body">\
      <form id="add_ar_form" action="">\
        <div class="row">\
          <div class="large-12 columns">\
            <h3 class="subheader" id="">'+tr("New Address Range for Virtual Network")+' <span id="vnet_id"/></h3>\
          </div>\
        </div>'+
        generate_ar_tab_content("add_ar") +
        '<div class="reveal-footer">\
          <div class="form_buttons">\
            <button class="button radius right success" id="submit_ar_button" type="submit" value="Network.add_ar">'+tr("Add")+'</button>\
          </div>\
        </div>\
        <a class="close-reveal-modal">&#215;</a>\
      </form>\
    </div>')

    //  TODO: max-height?

    dialog.addClass("reveal-modal large max-height").attr("data-reveal", "");
    setupTips(dialog);

    setup_ar_tab_content(dialog, "add_ar")

    $('#add_ar_form',dialog).submit(function(){
        var vnet_id = $('#vnet_id', this).text();
        var data = retrieve_ar_tab_data(this);

        var obj = {AR: data}
        Sunstone.runAction('Network.add_ar', vnet_id, obj);

        $add_ar_dialog.foundation('reveal', 'close')
        return false;
    });
};

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

      setupAddARDialog();

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
