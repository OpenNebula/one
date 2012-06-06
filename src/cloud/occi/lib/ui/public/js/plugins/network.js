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

/*Virtual networks tab plugin*/

var vnets_tab_content =
'<form id="virtualNetworks_form" action="javascript:alert(\'js error!\');">\
  <div class="action_blocks">\
  </div>\
<table id="datatable_vnetworks" class="display">\
  <thead>\
    <tr>\
      <th class="check"><input type="checkbox" class="check_all" value="">'+tr("All")+'</input></th>\
      <th>'+tr("ID")+'</th>\
      <th>'+tr("Name")+'</th>\
    </tr>\
  </thead>\
  <tbody id="tbodyvnetworks">\
  </tbody>\
</table>\
</form>';

var create_vn_tmpl =
'<div id="vn_tabs">\
        <div id="easy">\
           <form id="create_vn_form_easy" action="">\
              <fieldset>\
                 <label for="name">'+tr("Name")+':</label>\
                 <input type="text" name="name" id="name" /><br />\
              </fieldset>\
              <div class="clear"></div>\
              <div id="ranged">\
                 <fieldset>\
                    <label for="net_address">'+tr("Network Address")+':</label>\
                    <input type="text" name="net_address" id="net_address" /><div class="clear" />\
                    <label for="net_size">'+tr("Network Size")+':</label>\
                    <input type="text" name="net_size" id="net_size" /><br />\
                 </fieldset>\
              </div>\
            <div class="clear"></div>\
          </fieldset>\
          <div class="form_buttons">\
            <button type="button" class="vnet_close_dialog_link">'+tr("Close")+'</button>\
            <button type="submit" class="button" id="create_vn" value="Network.create">'+tr("Create")+'</button>\
            <!--<button class="button" type="reset" id="reset_vn" value="reset" />-->\
          </div>\
        </form>\
      </div>\
</div>';


var vnet_dashboard = '<div class="dashboard_p">\
<img src="images/one-network.png" alt="one-network" />' +
network_dashboard_html +
'</div>';

var dataTable_vNetworks;
var $create_vn_dialog;

//Setup actions

var vnet_actions = {
    "Network.create" : {
        type: "create",
        call: OCCI.Network.create,
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
        call: OCCI.Network.list,
        callback: updateVNetworksView,
        error: onError
    },

    "Network.show" : {
        type: "single",
        call: OCCI.Network.show,
        callback: updateVNetworkElement,
        error: onError
    },

    "Network.showinfo" : {
        type: "single",
        call: OCCI.Network.show,
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
            OCCI.Network.list({timeout: true, success: updateVNetworksView, error: onError});
        }
    },

    // "Network.publish" : {
    //     type: "multiple",
    //     call: OCCI.Network.publish,
    //     //callback: vnShow,
    //     elements: vnElements,
    //     error: onError,
    //     notify: true
    // },

    // "Network.unpublish" : {
    //     type: "multiple",
    //     call: OCCI.Network.unpublish,
    //     //callback: vnShow,
    //     elements: vnElements,
    //     error: onError,
    //     notify: true
    // },

    "Network.delete" : {
        type: "multiple",
        call: OCCI.Network.del,
        callback: deleteVNetworkElement,
        elements: vnElements,
        error: onError,
        notify: true
    },
};


var vnet_buttons = {
    "Network.refresh" : {
        type: "image",
        text: tr("Refresh list"),
        img: "images/Refresh-icon.png"
    },

    "Network.create_dialog" : {
        type: "create_dialog",
        text: tr("+ New")
    },

    // "Network.publish" : {
    //     type: "action",
    //     text: tr("Publish")
    // },

    // "Network.unpublish" : {
    //     type: "action",
    //     text: tr("Unpublish")
    // },

    "Network.delete" : {
        type: "action",
        text: tr("Delete")
    }
}

var vnet_info_panel = {
    "vnet_info_tab" : {
        title: tr("Network information"),
        content: ""
    },
}


var vnet_create_panel = {
    "vnet_create_panel" : {
        title: tr("Create network"),
        content: create_vn_tmpl
    },
}

var vnets_tab = {
    title: '<i class="icon-resize-small"></i>'+tr("Networks"),
    content: vnets_tab_content,
    buttons: vnet_buttons
}

Sunstone.addActions(vnet_actions);
Sunstone.addMainTab('vnets_tab',vnets_tab);
Sunstone.addInfoPanel('vnet_info_panel',vnet_info_panel);
Sunstone.addInfoPanel('vnet_create_panel',vnet_create_panel);


function vnElements(){
    return getSelectedNodes(dataTable_vNetworks);
}

//returns an array with the VNET information fetched from the JSON object
function vNetworkElementArray(vn_json){
    var network = vn_json.NETWORK;

    if (network.name){
        id = network.href.split("/");
        id = id[id.length-1];
        name = network.name;
    }
    else {
        id = network.ID;
        name = network.NAME;
    };

    return [
        '<input class="check_item" type="checkbox" id="vnetwork_'+id+'" name="selected_items" value="'+id+'"/>',
        id,
        name
    ];
};


//Callback to update a vnet element after an action on it
function updateVNetworkElement(request, vn_json){
    id = vn_json.NETWORK.ID;
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

    $.each(network_list,function(){
        network_list_array.push(vNetworkElementArray(this));
    });

    updateView(network_list_array,dataTable_vNetworks);
    //dependency with dashboard
    updateDashboard("vnets",network_list);

}

//updates the information panel tabs and pops the panel up
function updateVNetworkInfo(request,vn){
    var vn_info = vn.NETWORK;
    var info_tab_content =
        '<table id="info_vn_table" class="info_table">\
            <thead>\
               <tr><th colspan="2">'+tr("Virtual Network")+' '+vn_info.ID+' '+
        tr("information")+'</th></tr>\
            </thead>\
            <tr>\
              <td class="key_td">'+tr("ID")+'</td>\
              <td class="value_td">'+vn_info.ID+'</td>\
            </tr>\
            <tr>\
              <td class="key_td">'+tr("Name")+'</td>\
              <td class="value_td">'+vn_info.NAME+'</td>\
            </tr>\
            <tr>\
              <td class="key_td">'+tr("Used leases")+'</td>\
              <td class="value_td">'+vn_info.USED_LEASES+'</td>\
            </tr>';

    if (vn_info.ADDRESS){
        info_tab_content += '\
            <tr>\
              <td class="key_td">'+tr("Address")+'</td>\
              <td class="value_td">'+vn_info.ADDRESS+'</td>\
            </tr>\
            <tr>\
              <td class="key_td">'+tr("Size")+'</td>\
              <td class="value_td">'+vn_info.SIZE+'</td>\
            </tr>';
    };
    info_tab_content += '\
        </table>\
        <div class="form_buttons">\
           <button class="vnet_close_dialog_link"/></div>';

    var info_tab = {
        title: tr("Virtual Network information"),
        content: info_tab_content
    };

    Sunstone.updateInfoPanelTab("vnet_info_panel","vnet_info_tab",info_tab);

    Sunstone.popUpInfoPanel("vnet_info_panel");
    $('#dialog .vnet_close_dialog_link').button({
        text:false,
        icons: { primary: "ui-icon-closethick" }
    });

}

function popUpCreateVnetDialog() {
    //$create_vn_dialog.dialog('open');
    //Handle submission of the easy mode
    Sunstone.popUpInfoPanel("vnet_create_panel");
    var dialog=$('#dialog');
    $create_vn_dialog = dialog;

    $('#create_vn',dialog).button({
        icons: {
            primary: "ui-icon-check"
        },
        text: true
    });
/*
    $('#reset_vn',dialog).button({
        icons: {
            primary: "ui-icon-scissors"
        },
        text: false
    });
*/
    $('.vnet_close_dialog_link',dialog).button({
        icons: {
            primary: "ui-icon-closethick"
        },
        text: true
    });

    $('#create_vn_form_easy',dialog).submit(function(){
        //Fetch values
        var name = $('#name',this).val();
        if (!name.length){
            notifyError(tr("Virtual Network name missing!"));
            return false;
        }
        var bridge = $('#bridge',this).val();

        //TODO: Name and bridge provided?!

        var network_json = null;
        var network_addr = $('#net_address',this).val();
        var network_size = $('#net_size',this).val();

        if (!network_addr.length){
            notifyError(tr("Please provide a network address"));
            return false;
        };

        //we form the object for the request
        network_json = {
                "SIZE" : network_size,
                "ADDRESS" : network_addr,
                "NAME" : name
        };

        Sunstone.runAction("Network.create",network_json);
        popUpVNetDashboard();
        return false;
    });

}

function popUpVNetDashboard(){
    var count = dataTable_vNetworks.fnGetNodes().length;
    popDialog(vnet_dashboard);
    $('#dialog .network_count').text(count);
}

function setVNetAutorefresh() {
    setInterval(function(){
        var checked = $('input.check_item:checked',dataTable_vNetworks);
        var filter = $("#datatable_vnetworks_filter input",
                       dataTable_vNetworks.parents("#datatable_vnetworks_wrapper")).attr('value');
        if (!checked.length && !filter.length){
            Sunstone.runAction("Network.autorefresh");
        }
    },INTERVAL+someTime());
};

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
            { "sWidth": "60px", "aTargets": [0] },
            { "sWidth": "35px", "aTargets": [1] },
        ],
        "oLanguage": (datatable_lang != "") ?
            {
                sUrl: "locale/"+lang+"/"+datatable_lang
            } : ""
    });

    dataTable_vNetworks.fnClearTable();
    addElement([
        spinner,
        '',''],dataTable_vNetworks);
    Sunstone.runAction("Network.list");

    setVNetAutorefresh();

    initCheckAllBoxes(dataTable_vNetworks);
    tableCheckboxesListener(dataTable_vNetworks);
    infoListener(dataTable_vNetworks,'Network.showinfo');

    $('#li_vnets_tab').click(function(){
        popUpVNetDashboard();
        //return false;
    });

    $('.vnet_close_dialog_link').live("click",function(){
        popUpVNetDashboard();
        return false;
    });

});
