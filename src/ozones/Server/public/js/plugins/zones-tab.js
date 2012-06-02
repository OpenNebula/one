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

var zones_tab_content =
'<form id="form_zones" action="javascript:alert(\'js errors?!\')">\
  <div class="action_blocks">\
  </div>\
<table id="datatable_zones" class="display">\
  <thead>\
    <tr>\
      <th class="check"><input type="checkbox" class="check_all" value="">All</input></th>\
      <th>ID</th>\
      <th>Name</th>\
      <th>End Point</th>\
    </tr>\
  </thead>\
  <tbody id="tbodyzones">\
  </tbody>\
</table>\
</form>';


var create_zone_tmpl =
'<form id="create_zone_form" action="">\
  <fieldset>\
     <div>\
        <label for="name">Name:</label>\
        <input type="text" name="name" id="name" /><br />\
        <label for="endpoint">End point (host,port):</label>\
        <input type="text" name="endpoint" id="endpoint" value="localhost"/> :\
        <input type="text" name="endpoint_port" id="endpoint_port" value="2633" style="width:3em;"/>\
        <br />\
        <label for="onename">Oneadmin user:</label>\
        <input type="text" name="onename" id="onename" value="oneadmin"/><br />\
        <label for="onepass">Password:</label>\
        <input type="password" name="onepass" id="onepass" /><br />\
        <label for="sunsendpoint">Sunstone end point:</label>\
        <input type="text" name="sunsendpoint_ptc" id="sunsendpoint_ptc" value="http" style="width:2em;"/> ://\
        <input type="text" name="sunsendpoint" id="sunsendpoint" style="width:7em;" value="localhost"/> :\
        <input type="text" name="sunsendpoint_port" id="sunsendpoint_port" value="9869" style="width:3em;"/> /\
        <input type="text" name="sunsendpoint_path" id="sunsendpoint_path" value="" style="width:4em;"/>\
        <br />\
        <label for="selfsendpoint">SelfService end point:</label>\
        <input type="text" name="selfsendpoint_ptc" id="selfsendpoint_ptc" value="http" style="width:2em;"/> ://\
        <input type="text" name="selfsendpoint" id="selfsendpoint" style="width:7em;" value="localhost"/> :\
        <input type="text" name="selfsendpoint_port" id="selfsendpoint_port" value="4567" style="width:3em;"/> /\
        <input type="text" name="selfsendpoint_path" id="selfsendpoint_path" value="ui" style="width:4em;"/>\
        <br />\
     </div>\
   </fieldset>\
   <fieldset>\
     <div class="form_buttons">\
        <button class="button" id="create_zone_submit" value="Zone.create">Create</button>\
        <button class="button" type="reset" value="reset">Reset</button>\
     </div>\
   </fieldset>\
</form>';

var zones_select="";
var dataTable_zones;

function zoneSelectedNodes() {
    return getSelectedNodes(dataTable_zones);
};

var zone_actions = {

    "Zone.create" : {
        type: "create",
        call: oZones.Zone.create,
        callback: addZoneElement,
        error: onError,
        notify: true
    },

    "Zone.create_dialog" : {
        type: "custom",
        call: openCreateZoneDialog
    },

    "Zone.list" : {
        type: "list",
        call: oZones.Zone.list,
        callback: updateZonesView,
        error: onError,
        notify: false
    },

    "Zone.refresh" : {
        type: "custom",
        call: function() {
            waitingNodes(dataTable_zones);
            Sunstone.runAction("Zone.list");
        },
        error: onError,
        notify: false
    },

    "Zone.autorefresh" : {
        type: "custom",
        call: function(){
            oZones.Zone.list({timeout: true, success: updateZonesView, error: onError});
        }
    },

    "Zone.delete" : {
        type: "multiple",
        call: oZones.Zone.del,
        callback: deleteZoneElement,
        elements: zoneSelectedNodes,
        error: onError,
        notify: true
    },

    "Zone.showinfo" : {
        type: "single",
        call: oZones.Zone.show,
        callback: updateZoneInfo,
        error: onError
    },
    "Zone.host" : {
        type: "single",
        call: oZones.Zone.host,
        callback: function(req,host_json) {
            updateHostsList(req,host_json,'#datatable_zone_hosts');
        },
        error: onError
    },
    "Zone.vms" : {
        type: "single",
        call: oZones.Zone.vm,
        callback: function(req,vms_json){
            updateVMsList(req,vms_json,'#datatable_zone_vms');
        },
        error: onError
    },
    "Zone.vnet" : {
        type: "single",
        call: oZones.Zone.vnet,
        callback: function(req, vn_json){
            updateVNsList(req,vn_json,'#datatable_zone_vnets');
        },
        error: onError
    },
    "Zone.image" : {
        type: "single",
        call: oZones.Zone.image,
        callback: function(req,image_json){
            updateImagesList(req,image_json,'#datatable_zone_images');
        },
        error: onError
    },
    "Zone.vmtemplate" : {
        type: "single",
        call: oZones.Zone.vmtemplate,
        callback: function(req,template_json){
            updateTemplatesList(req,template_json,'#datatable_zone_templates');
        },
        error: onError
    },
    "Zone.user" : {
        type: "single",
        call: oZones.Zone.user,
        callback: function(req,user_json){
            updateUsersList(req,user_json,'#datatable_zone_users');
        },
        error: onError
    },
    "Zone.cluster" : {
        type: "single",
        call: oZones.Zone.cluster,
        callback: function(req,json){
            updateClustersList(req,json,'#datatable_zone_clusters');
        },
        error: onError
    },
    "Zone.datastore" : {
        type: "single",
        call: oZones.Zone.datastore,
        callback: function(req,json){
            updateDatastoresList(req,json,'#datatable_zone_datastores');
        },
        error: onError
    },
}

var zone_buttons = {
    "Zone.refresh" : {
        type: "image",
        text: "Refresh list",
        img: "images/Refresh-icon.png"
    },
    "Zone.create_dialog" : {
        type: "action",
        text: "+ New",
        alwaysActive:true
    },
    "Zone.delete" : {
        type: "action",
        text: "Delete"
    }
};

var zones_tab = {
    title: '<i class="icon-th-large"></i>'+"Zones",
    content: zones_tab_content,
    buttons: zone_buttons
}

/*Info panel schema, to be updated*/
var zone_info_panel = {
    "zone_info_tab" : {
        title : "Zone Information",
        content : ""
    },
    "zone_users_tab" : {
        title : "Users",
        content : ""
    },
    "zone_vms_tab" : {
        title : "Virtual Machines",
        content : ""
    },
    "zone_templates_tab" : {
        title : "Templates",
        content : ""
    },
    "zone_images_tab" : {
        title : "Images",
        content : ""
    },
    "zone_clusters_tab" : {
        title : "Clusters",
        content : ""
    },
    "zone_hosts_tab" : {
        title : "Hosts",
        content : ""
    },
    "zone_datastores_tab" : {
        title : "Datastores",
        content : ""
    },
    "zone_vnets_tab" : {
        title : "Virtual Networks",
        content : ""
    },
};

Sunstone.addActions(zone_actions);
Sunstone.addMainTab("zones_tab",zones_tab);
Sunstone.addInfoPanel("zone_info_panel",zone_info_panel);

function zoneElementArray(zone_json){
    var zone = zone_json.ZONE;

    return [
        '<input class="check_item" type="checkbox" id="zone_'+zone.ID+'" name="selected_items" value="'+zone.ID+'"/>',
        zone.ID,
        zone.NAME,
        zone.ENDPOINT
    ];
}

function updateZoneSelect(){
    zones_select = makeSelectOptions(dataTable_zones,1,2,-1,"",-1);
}

function deleteZoneElement(req){
    deleteElement(dataTable_zones,'#zone_'+req.request.data);
    updateZoneSelect();
}

function addZoneElement(req,zone_json){
    var element = zoneElementArray(zone_json);
    addElement(element,dataTable_zones);
    updateZoneSelect();
}

function updateZonesView(req, zone_list){
    var zone_list_array = [];

    $.each(zone_list,function(){
        zone_list_array.push(zoneElementArray(this));
    });

    updateView(zone_list_array,dataTable_zones);
    updateZoneSelect();
    updateZonesDashboard("zones",zone_list);
}

function updateZoneInfo(req,zone_json){
    var zone = zone_json.ZONE;

    var info_tab = {
        title : "Zone information",
        content :
        '<table id="info_zone_table" class="info_table">\
            <thead>\
               <tr><th colspan="2">Zone information - '+zone.NAME+'</th></tr>\
            </thead>\
            <tbody>\
            <tr>\
                <td class="key_td">ID</td>\
                <td class="value_td">'+zone.ID+'</td>\
            </tr>\
            <tr>\
                <td class="key_td">Administrator</td>\
                <td class="value_td">'+zone.ONENAME+'</td>\
            </tr>\
            <tr>\
                <td class="key_td">Password</td>\
                <td class="value_td">'+zone.ONEPASS+'</td>\
            </tr>\
            <tr>\
                <td class="key_td">Endpoint</td>\
                <td class="value_td">'+zone.ENDPOINT+'</td>\
            </tr>\
            <tr>\
                <td class="key_td">Sunstone endpoint</td>\
                <td class="value_td">'+ (zone.SUNSENDPOINT.length? '<a href="'+zone.SUNSENDPOINT+'" target="_blank">'+zone.SUNSENDPOINT+'<span class="ui-icon ui-icon-extlink" style="display:inline-block;" /></a>' : "") +'</td>\
            </tr>\
            <tr>\
                <td class="key_td">SelfService endpoint</td>\
                <td class="value_td">'+ (zone.SELFENDPOINT.length? '<a href="'+zone.SELFENDPOINT+'" target="_blank">'+zone.SELFENDPOINT+'<span class="ui-icon ui-icon-extlink" style="display:inline-block;" /></a>' : "") +'</td>\
            </tr>\
            <tr>\
                <td class="key_td">#VDCs</td>\
                <td class="value_td">'+zone.VDCS.length+'</td>\
            </tr>\
            </tbody>\
         </table>'
    };
    var hosts_tab = {
        title : "Hosts",
        content :
'<div style="padding: 10px 10px;">\
<table id="datatable_zone_hosts" class="display">\
  <thead>\
    <tr>\
      <th>ID</th>\
      <th>Name</th>\
      <th>Cluster</th>\
      <th>Running VMs</th>\
      <th>CPU Use</th>\
      <th>Memory use</th>\
      <th>Status</th>\
    </tr>\
  </thead>\
  <tbody>\
  </tbody>\
</table></div>'
    };

    var templates_tab = {
        title: "Templates",
        content :
'<div style="padding: 10px 10px;">\
<table id="datatable_zone_templates" class="display">\
  <thead>\
    <tr>\
      <th>ID</th>\
      <th>Owner</th>\
      <th>Group</th>\
      <th>Name</th>\
      <th>Registration time</th>\
    </tr>\
  </thead>\
  <tbody>\
  </tbody>\
</table></div>'
    };

    var vms_tab = {
        title : "Virtual Machines",
        content :
'<div style="padding: 10px 10px;">\
<table id="datatable_zone_vms" class="display">\
  <thead>\
    <tr>\
      <th>ID</th>\
      <th>Owner</th>\
      <th>Group</th>\
      <th>Name</th>\
      <th>Status</th>\
      <th>CPU</th>\
      <th>Memory</th>\
      <th>Hostname</th>\
      <th>IPs</th>\
      <th>Start Time</th>\
    </tr>\
  </thead>\
  <tbody>\
  </tbody>\
</table></div>'
    };

    var vnets_tab = {
        title : "Virtual Networks",
        content :
'<div style="padding: 10px 10px;">\
<table id="datatable_zone_vnets" class="display">\
  <thead>\
    <tr>\
      <th>ID</th>\
      <th>Owner</th>\
      <th>Group</th>\
      <th>Name</th>\
      <th>Cluster</th>\
      <th>Type</th>\
      <th>Bridge</th>\
      <th>Total Leases</th>\
    </tr>\
  </thead>\
  <tbody>\
  </tbody>\
</table></div>'
    };

    var images_tab = {
        title : "Images",
        content :
'<div style="padding: 10px 10px;">\
<table id="datatable_zone_images" class="display">\
  <thead>\
    <tr>\
      <th>ID</th>\
      <th>Owner</th>\
      <th>Group</th>\
      <th>Name</th>\
      <th>Type</th>\
      <th>Registration time</th>\
      <th>Persistent</th>\
      <th>State</th>\
      <th>#VMS</th>\
    </tr>\
  </thead>\
  <tbody>\
  </tbody>\
</table></div>'
    };

    var users_tab = {
        title: "Users",
        content:
'<div style="padding: 10px 10px;">\
<table id="datatable_zone_users" class="display">\
  <thead>\
    <tr>\
      <th>ID</th>\
      <th>Name</th>\
    </tr>\
  </thead>\
  <tbody>\
  </tbody>\
</table>\
</div>'
    };

    var clusters_tab = {
        title: "Clusters",
        content:
'<div style="padding: 10px 10px;">\
<table id="datatable_zone_clusters" class="display">\
  <thead>\
    <tr>\
      <th>ID</th>\
      <th>Name</th>\
    </tr>\
  </thead>\
  <tbody>\
  </tbody>\
</table>\
</div>'
    };

    var datastores_tab = {
        title: "Datastores",
        content:
'<div style="padding: 10px 10px;">\
<table id="datatable_zone_datastores" class="display">\
  <thead>\
    <tr>\
      <th>ID</th>\
      <th>Owner</th>\
      <th>Group</th>\
      <th>Name</th>\
      <th>Cluster</th>\
    </tr>\
  </thead>\
  <tbody>\
  </tbody>\
</table>\
</div>'
    };

    Sunstone.updateInfoPanelTab("zone_info_panel","zone_info_tab",info_tab);
    Sunstone.updateInfoPanelTab("zone_info_panel","zone_hosts_tab",hosts_tab);
    Sunstone.updateInfoPanelTab("zone_info_panel","zone_templates_tab",templates_tab);
    Sunstone.updateInfoPanelTab("zone_info_panel","zone_vms_tab",vms_tab);
    Sunstone.updateInfoPanelTab("zone_info_panel","zone_vnets_tab",vnets_tab);
    Sunstone.updateInfoPanelTab("zone_info_panel","zone_images_tab",images_tab);
    Sunstone.updateInfoPanelTab("zone_info_panel","zone_users_tab",users_tab);
    Sunstone.updateInfoPanelTab("zone_info_panel","zone_clusters_tab",clusters_tab);
    Sunstone.updateInfoPanelTab("zone_info_panel","zone_datastores_tab",datastores_tab);

    //Pop up the info we have now.
    Sunstone.popUpInfoPanel("zone_info_panel");


   /*Init dataTables*/
    $('#datatable_zone_hosts').dataTable({
        "bJQueryUI": true,
        "bSortClasses": false,
        "bAutoWidth":false,
        "sPaginationType": "full_numbers",
        "aoColumnDefs": [
            { "sWidth": "60px", "aTargets": [3,6] },
            { "sWidth": "100px", "aTargets": [2] },
            { "sWidth": "35px", "aTargets": [0] },
            { "sWidth": "200px", "aTargets": [4,5] }
        ]
    });

    $('#datatable_zone_vms').dataTable({
        "bJQueryUI": true,
        "bSortClasses": false,
        "sPaginationType": "full_numbers",
        "bAutoWidth":false,
        "aoColumnDefs": [
            { "sWidth": "35px", "aTargets": [0] },
            { "sWidth": "60px", "aTargets": [5,6] },
            { "sWidth": "100px", "aTargets": [1,2,4,8] }
        ]
    });


    $('#datatable_zone_vnets').dataTable({
        "bJQueryUI": true,
        "bSortClasses": false,
        "bAutoWidth":false,
        "sPaginationType": "full_numbers",
        "aoColumnDefs": [
            { "sWidth": "60px", "aTargets": [5,6,7] },
            { "sWidth": "35px", "aTargets": [0] },
            { "sWidth": "100px", "aTargets": [1,2,4] }
        ]
    });

    $('#datatable_zone_images').dataTable({
        "bJQueryUI": true,
        "bSortClasses": false,
        "bAutoWidth":false,
        "sPaginationType": "full_numbers",
        "aoColumnDefs": [
            { "sWidth": "60px", "aTargets": [7] },
            { "sWidth": "35px", "aTargets": [0,6,8] },
            { "sWidth": "100px", "aTargets": [1,2,4,5] }
        ]
    });

    $('#datatable_zone_templates').dataTable({
        "bJQueryUI": true,
        "bSortClasses": false,
        "bAutoWidth":false,
        "sPaginationType": "full_numbers",
        "aoColumnDefs": [
            { "sWidth": "35px", "aTargets": [0] },
            { "sWidth": "100px", "aTargets": [1,2,4] }
        ]
    });

    $('#datatable_zone_users').dataTable({
        "bJQueryUI": true,
        "bSortClasses": false,
        "sPaginationType": "full_numbers",
        "bAutoWidth":false,
        "aoColumnDefs": [
            { "sWidth": "35px", "aTargets": [0] }
        ]
    });

    $('#datatable_zone_clusters').dataTable({
        "bJQueryUI": true,
        "bSortClasses": false,
        "bAutoWidth":false,
        "sPaginationType": "full_numbers",
        "aoColumnDefs": [
            { "sWidth": "35px", "aTargets": [0] },
        ]
    });

    $('#datatable_zone_datastores').dataTable({
        "bJQueryUI": true,
        "bSortClasses": false,
        "bAutoWidth":false,
        "sPaginationType": "full_numbers",
        "aoColumnDefs": [
            { "sWidth": "35px", "aTargets": [0] },
            { "sWidth": "100px", "aTargets": [1,2,4] }
        ]
    });

    /*End init dataTables*/

    //Retrieve pools in the meantime
    Sunstone.runAction("Zone.host",zone.ID);
    Sunstone.runAction("Zone.vmtemplate",zone.ID);
    Sunstone.runAction("Zone.vms",zone.ID);
    Sunstone.runAction("Zone.vnet",zone.ID);
    Sunstone.runAction("Zone.image",zone.ID);
    Sunstone.runAction("Zone.user",zone.ID);
    Sunstone.runAction("Zone.cluster",zone.ID);
    Sunstone.runAction("Zone.datastore",zone.ID);
}


function setupCreateZoneDialog(){
    $('div#dialogs').append('<div title="Create Zone" id="create_zone_dialog"></div>');
    $('div#create_zone_dialog').html(create_zone_tmpl);
    $('#create_zone_dialog').dialog({
        autoOpen: false,
        modal: true,
        width: 540
    });

    $('#create_zone_dialog button').button();

    //Handle the form submission
    $('#create_zone_form').submit(function(){
        var name = $('#name', this).val();
        var endpoint = $('#endpoint',this).val();
        var endpoint_port = $('#endpoint_port',this).val();
        var onename = $('#onename',this).val();
        var onepass = $('#onepass',this).val();

        var se = $('#sunsendpoint',this).val();
        var se_ptc = $('#sunsendpoint_ptc',this).val();
        var se_port = $('#sunsendpoint_port',this).val();
        var se_path = $('#sunsendpoint_path',this).val();

        var ss = $('#selfsendpoint',this).val();
        var ss_ptc = $('#selfsendpoint_ptc',this).val();
        var ss_port = $('#selfsendpoint_port',this).val();
        var ss_path = $('#selfsendpoint_path',this).val();

        if (!name.length || !endpoint.length ||
            !onename.length || !onepass.length){
            notifyError("Please fill in all fields");
            return false;
        }

        endpoint = "http://"+
            endpoint+":"+endpoint_port+"/RPC2"

        if (se.length)
            se = se_ptc + "://" + se + ":" + se_port +
            "/" + se_path;

        if (ss.length)
            ss = ss_ptc + "://" + ss + ":" + ss_port +
            "/" + ss_path;

        var zone_json = {
            "ZONE": {
                "NAME": name,
                "ENDPOINT": endpoint,
                "ONENAME": onename,
                "ONEPASS": onepass,
                "SUNSENDPOINT" : se,
                "SELFENDPOINT" : ss,
            }
        };

        Sunstone.runAction("Zone.create",zone_json);
        $('#create_zone_dialog').dialog('close');
        return false;
    });
}

function openCreateZoneDialog(){
    $('#create_zone_dialog').dialog('open');
}

function setZoneAutorefresh() {
    setInterval(function(){
        var checked = $('input.check_item:checked',dataTable_zones);
        var  filter = $("#datatable_zones_filter input").attr("value");
        if (!checked.length && !filter.length){
            Sunstone.runAction("Zone.autorefresh");
        }
    },INTERVAL+someTime());
}


$(document).ready(function(){
    dataTable_zones = $("#datatable_zones").dataTable({
        "bJQueryUI": true,
        "bSortClasses": false,
        "bAutoWidth":false,
        "sPaginationType": "full_numbers",
        "aoColumnDefs": [
            { "bSortable": false, "aTargets": ["check"] },
            { "sWidth": "60px", "aTargets": [0] },
            { "sWidth": "300px", "aTargets": [3] },
            { "sWidth": "35px", "aTargets": [1] }
        ]
    });

    dataTable_zones.fnClearTable();
    addElement([spinner,'','',''],dataTable_zones);
    Sunstone.runAction("Zone.list");

    setupCreateZoneDialog();

    setZoneAutorefresh();

    initCheckAllBoxes(dataTable_zones);
    tableCheckboxesListener(dataTable_zones);
    infoListener(dataTable_zones,'Zone.showinfo');
});