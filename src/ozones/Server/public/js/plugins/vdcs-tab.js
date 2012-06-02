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

var vdcs_tab_content =
'<form id="form_vdcs" action="javascript:alert(\'js errors?!\')">\
  <div class="action_blocks">\
  </div>\
<table id="datatable_vdcs" class="display">\
  <thead>\
    <tr>\
      <th class="check"><input type="checkbox" class="check_all" value="">All</input></th>\
      <th>ID</th>\
      <th>Name</th>\
      <th>Zone ID</th>\
      <th>Cluster ID</th>\
      <th>Hosts</th>\
      <th>Virtual Networks</th>\
      <th>Datastores</th>\
    </tr>\
  </thead>\
  <tbody id="tbodyvdcs">\
  </tbody>\
</table>\
</form>';

var create_vdc_tmpl =
'<form id="create_vdc_form" action="">\
  <fieldset>\
     <div>\
        <label for="name">Name:</label>\
        <input type="text" name="name" id="name" /><br />\
        <label for="vdcadminname">Admin name:</label>\
        <input type="text" name="vdcadminname" id="vdcadminname" /><br />\
        <label for="vdcadminpass">Admin pass:</label>\
        <input type="password" name="vdcadminpass" id="vdcadminpass" /><br />\
        <label for="zone">Zone:</label>\
        <select id="zoneid" name="zone">\
        </select><br />\
        <div class="clear"></div>\
        <label for="clusterid">Cluster:</label>\
        <select id="clusterid">\
        </select><br />\
        <label for="vdc_force_hosts">VDC resource sharing:</label>\
        <input type="checkbox" name="vdc_force" id="vdc_force" />\
        <div class="tip">Allows hosts, Vnets, datastores belonging to other VDCs to be re-added to this one. They will appear greyed-out in the lists.</div>\
        <div class="clear"></div>\
        <label>Add resources:</label>\
        <label style="margin-left:265px;font-size:0.8em;color:#bbbbbb">Drag & Drop</label>\
        <label style="margin-left:243px;font-size:0.8em;color:#bbbbbb">Available / Selected</label><br />\
        <div class="clear"></div>\
        <label><a href="#" class="vdc_show_hide">Hosts<span class="inline_icon ui-icon ui-icon-triangle-1-s" /></a></label>\
        <div id="vdc_hosts_lists" class="dd_lists">\
          <ul id="vdc_available_hosts_list" class="dd_list dd_left"></ul>\
          <ul id="vdc_selected_hosts_list" class="dd_list dd_right"></ul>\
        </div>\
        <div class="clear"></div>\
        <label><a href="#" class="vdc_show_hide">Virtual Networks<span class="inline_icon ui-icon ui-icon-triangle-1-s" /></a></label>\
        <div id="vdc_vnets_lists" class="dd_lists">\
          <ul id="vdc_available_vnets_list" class="dd_list dd_left"></ul>\
          <ul id="vdc_selected_vnets_list" class="dd_list dd_right"></ul>\
        </div>\
        <div class="clear"></div>\
        <label><a href="#" class="vdc_show_hide">Datastores<span class="inline_icon ui-icon ui-icon-triangle-1-s" /></a></label>\
        <div id="vdc_datastores_lists" class="dd_lists">\
          <ul id="vdc_available_datastores_list" class="dd_list dd_left"></ul>\
          <ul id="vdc_selected_datastores_list" class="dd_list dd_right"></ul>\
        </div>\
     </div>\
   </fieldset>\
   <fieldset>\
     <div class="form_buttons">\
        <button class="button" id="create_vdc_submit" value="VDC.create">Create</button>\
        <button class="button" type="reset" value="reset">Reset</button>\
     </div>\
   </fieldset>\
</form>';

var update_vdc_tmpl =
'<form id="update_vdc_form" action="">\
  <fieldset>\
     <div>\
        <label for="vdc_update_id">Update resources in:</label>\
        <select name="vdc_update_id" id="vdc_update_id">\
        </select>\
        <div class="clear"></div>\
        <label for="vdc_update_force">VDC resource sharing:</label>\
        <input type="checkbox" name="vdc_update_force" id="vdc_update_force" />\
        <div class="tip">Allows hosts, Vnets belonging to other VDCs to be re-added to this one. They will appear greyed-out in the list.</div>\
        <div class="clear"></div>\
        <label style="margin-left:265px;font-size:0.8em;color:#bbbbbb">Drag & Drop</label>\
        <label style="margin-left:243px;font-size:0.8em;color:#bbbbbb">Available / Current</label>\
        <label><a href="#" class="vdc_show_hide">Hosts<span class="inline_icon ui-icon ui-icon-triangle-1-s" /></a></label>\
        <div id="vdc_update_hosts_lists" class="dd_lists">\
          <ul id="vdc_update_available_hosts_list" class="dd_list dd_left"></ul>\
          <ul id="vdc_update_selected_hosts_list" class="dd_list dd_right"></ul>\
        </div>\
        <div class="clear"></div>\
        <label><a href="#" class="vdc_show_hide">Virtual Networks<span class="inline_icon ui-icon ui-icon-triangle-1-s" /></a></label>\
        <div id="vdc_update_vnets_lists" class="dd_lists">\
          <ul id="vdc_update_available_vnets_list" class="dd_list dd_left"></ul>\
          <ul id="vdc_update_selected_vnets_list" class="dd_list dd_right"></ul>\
        </div>\
        <div class="clear"></div>\
        <label><a href="#" class="vdc_show_hide">Datastores<span class="inline_icon ui-icon ui-icon-triangle-1-s" /></a></label>\
        <div id="vdc_update_datastores_lists" class="dd_lists">\
          <ul id="vdc_update_available_datastores_list" class="dd_list dd_left"></ul>\
          <ul id="vdc_update_selected_datastores_list" class="dd_list dd_right"></ul>\
        </div>\
     </div>\
   </fieldset>\
   <fieldset>\
     <div class="form_buttons">\
        <button class="button" id="update_vdc_submit" value="VDC.update">Update</button>\
        <button class="button" type="reset" value="reset">Reset</button>\
     </div>\
   </fieldset>\
</form>';

var dataTable_vdcs;
var $update_vdc_dialog;

function vdcSelectedNodes() {
    return getSelectedNodes(dataTable_vdcs);
};

var vdc_actions = {
    "VDC.create" : {
        type: "create",
        call: oZones.VDC.create,
        callback: addVDCElement,
        error: onError,
        notify: true
    },

    "VDC.create_dialog" : {
        type: "custom",
        call: openCreateVDCDialog
    },

    "VDC.update" : {
        type: "single",
        call: oZones.VDC.update,
        callback: updateVDCElement,
        error: onError,
        notify: true
    },

    "VDC.update_dialog" : {
        type: "custom",
        call: openUpdateVDCDialog
    },

    "VDC.list" : {
        type: "list",
        call: oZones.VDC.list,
        callback: updateVDCsView,
        error: onError,
    },

    "VDC.refresh" : {
        type: "custom",
        call: function() {
            waitingNodes(dataTable_vdcs);
            Sunstone.runAction("VDC.list");
        },
        error: onError
    },

    "VDC.autorefresh" : {
        type: "custom",
        call: function(){
            oZones.VDC.list({timeout: true, success: updateVDCsView, error: onError});
        },
    },

    "VDC.delete" : {
        type: "multiple",
        call: oZones.VDC.del,
        callback: deleteVDCElement,
        elements: vdcSelectedNodes,
        error: onError,
        notify: true
    },
    "VDC.showinfo" : {
        type: "single",
        call: oZones.VDC.show,
        callback: updateVDCInfo,
        error: onError
    },
    "VDC.zone_hosts" : {
        type: "single",
        call: oZones.Zone.host,
        callback: fillHostList,
        error: onError
    },
    "VDC.update_zone_hosts" : {
        type: "single",
        call: oZones.Zone.host,
        callback: fillUpdateHostList,
        error: onError
    },
    "VDC.zone_vnets" : {
        type: "single",
        call: oZones.Zone.vnet,
        callback: fillVNetList,
        error: onError
    },
    "VDC.update_zone_vnets" : {
        type: "single",
        call: oZones.Zone.vnet,
        callback: fillUpdateVNetList,
        error: onError
    },
    "VDC.zone_datastores" : {
        type: "single",
        call: oZones.Zone.datastore,
        callback: fillDatastoreList,
        error: onError
    },
    "VDC.update_zone_datastores" : {
        type: "single",
        call: oZones.Zone.datastore,
        callback: fillUpdateDatastoreList,
        error: onError
    },
    "VDC.zone_clusters" : {
        type: "single",
        call: oZones.Zone.cluster,
        callback: function(req, list_json){
            var options='<option value="">Please select</option>';
            $.each(list_json,function(){
                options += '<option value="'+this.CLUSTER.ID+'">'+this.CLUSTER.NAME+'</option>';
            });
            if (options)
            $('div#create_vdc_dialog select#clusterid').html(options);
        },
        error: onError
    },

};

var vdc_buttons = {
    "VDC.refresh" : {
        type: "image",
        text: "Refresh list",
        img: "images/Refresh-icon.png"
    },
    "VDC.create_dialog" : {
        type: "action",
        text: "+ New",
        alwaysActive:true
    },
    "VDC.update_dialog" : {
        type: "action",
        text: "Update VDC resources",
    },
    "VDC.delete" : {
        type: "action",
        text: "Delete",
        type : "confirm",
        tip: "Careful! This will delete the selected VDCs"
    }
};

var vdcs_tab = {
    title: '<i class="icon-th"></i>'+"VDCs",
    content: vdcs_tab_content,
    buttons: vdc_buttons
}

var vdc_info_panel = {
    "vdc_info_tab" : {
        title: "VDC Information",
        content: ""
    }
};

Sunstone.addActions(vdc_actions);
Sunstone.addMainTab("vdcs_tab",vdcs_tab);
Sunstone.addInfoPanel("vdc_info_panel",vdc_info_panel);

function vdcElementArray(vdc_json){
    var vdc = vdc_json.VDC;

    return [
        '<input class="check_item" type="checkbox" id="vdc_'+vdc.ID+'" name="selected_items" value="'+vdc.ID+'"/>',
        vdc.ID,
        vdc.NAME,
        vdc.ZONES_ID,
        vdc.CLUSTER_ID,
        vdc.RESOURCES.HOSTS.length ? vdc.RESOURCES.HOSTS.join() : "none",
        vdc.RESOURCES.NETWORKS.length ? vdc.RESOURCES.NETWORKS.join() : "none",
        vdc.RESOURCES.DATASTORES.length ? vdc.RESOURCES.DATASTORES.join() : "none",
    ];
}

function deleteVDCElement(req){
    deleteElement(dataTable_vdcs,'#vdc_'+req.request.data);
}

function addVDCElement(req,vdc_json){
    var element = vdcElementArray(vdc_json);
    addElement(element,dataTable_vdcs);
}

function updateVDCElement(request, vdc_json){
    var id = vdc_json.VDC.ID;
    var element = vdcElementArray(vdc_json);
    updateSingleElement(element,dataTable_vdcs,'#vdc_'+id);
}

function updateVDCsView(req,vdc_list){
    var vdc_list_array = [];

    $.each(vdc_list,function(){
        vdc_list_array.push(vdcElementArray(this));
    });

    updateView(vdc_list_array,dataTable_vdcs);
    updateZonesDashboard("vdcs",vdc_list);
}

function updateVDCInfo(req,vdc_json){
    var vdc = vdc_json.VDC;

    var zone_endpoint = getElementData(vdc.ZONES_ID,
                                       "#zone",
                                       dataTable_zones)[3];
    var zone_host = "";
    var zone_port = "";
    var sun_link = "";
    var self_link = "";
    var zone_match = zone_endpoint.match(/^https?:\/\/([\w.-]+):(\d+)\/([\W\w]+)$/);

    if (zone_match){
        zone_host = zone_match[1];
        zone_port = zone_match[2];
        sun_link = "http://" + zone_host +"/sunstone_"+ vdc.NAME+"/";
        self_link = "http://" + zone_host +"/self_"+ vdc.NAME+"/";
    };

    var info_tab = {
        title: "VDC Information",
        content :
           '<table id="info_vdc_table" class="info_table">\
            <thead>\
               <tr><th colspan="2">Virtual Data Center - '+vdc.NAME+'</th></tr>\
            </thead>\
            <tbody>\
            <tr>\
                <td class="key_td">ID</td>\
                <td class="value_td">'+vdc.ID+'</td>\
            </tr>\
            <tr>\
                <td class="key_td">Name</td>\
                <td class="value_td">'+vdc.NAME+'</td>\
            </tr>\
            <tr>\
                <td class="key_td">Zone ID</td>\
                <td class="value_td">'+vdc.ZONES_ID+'</td>\
            </tr>\
            <tr>\
                <td class="key_td">Cluster ID</td>\
                <td class="value_td">'+vdc.CLUSTER_ID+'</td>\
            </tr>\
            <tr>\
                <td class="key_td">Hosts</td>\
                <td class="value_td">'+(vdc.RESOURCES.HOSTS.length? vdc.RESOURCES.HOSTS.join() : "none")+'</td>\
            </tr>\
            <tr>\
                <td class="key_td">Virtual Networks</td>\
                <td class="value_td">'+(vdc.RESOURCES.NETWORKS.length? vdc.RESOURCES.NETWORKS.join() : "none")+'</td>\
            </tr>\
            <tr>\
                <td class="key_td">Datastores</td>\
                <td class="value_td">'+(vdc.RESOURCES.DATASTORES.length? vdc.RESOURCES.DATASTORES.join() : "none")+'</td>\
            </tr>\
            <tr>\
                <td class="key_td">Admin name</td>\
                <td class="value_td">'+vdc.VDCADMINNAME+'</td>\
            </tr>\
            <tr>\
                <td class="key_td">Group ID</td>\
                <td class="value_td">'+vdc.GROUP_ID+'</td>\
            </tr>\
            <tr>\
                <td class="key_td">ACLs</td>\
                <td class="value_td">'+(vdc.RESOURCES.ACLS.length ? vdc.RESOURCES.ACLS.join() : "none") +'</td>\
            </tr>\
            <tr>\
                <td class="key_td">Sunstone public link</td>\
                <td class="value_td">'+(sun_link.length? '<a href="'+sun_link+'" target="_blank">'+sun_link+'<span class="ui-icon ui-icon-extlink" style="display:inline-block;" /></a>' : "")+'</td>\
            </tr>\
            <tr>\
                <td class="key_td">SelfService public link</td>\
                <td class="value_td">'+(self_link.length? '<a href="'+self_link+'" target="_blank">'+self_link+'<span class="ui-icon ui-icon-extlink" style="display:inline-block;" /></a>' : "")+'</td>\
            </tr>\
            <tr>\
                <td class="key_td">ONE_XMLPRC (to export for CLI access)</td>\
                <td class="value_td"><input type="text" id="one_xmlrpc" value="'+(zone_host.length? "http://" + zone_host +"/"+ vdc.NAME: "--")+'" style="width:100%;"/></td>\
            </tr>\
            </tbody>\
         </table>'
    };

    Sunstone.updateInfoPanelTab("vdc_info_panel","vdc_info_tab",info_tab);
    Sunstone.popUpInfoPanel("vdc_info_panel");
    $('#vdc_info_panel input#one_xmlrpc').select();
    setTimeout(function(){
        $('#vdc_info_panel input#one_xmlrpc').select();
    }, 700);
};

function inCluster(resCluster, selCluster){
    if (selCluster == "-")//cluster none, unused
        return resCluster == "-1";
    else return resCluster == selCluster;
};

function fillList(res, req, list_json){
    var list = "";
    var dialog = $('div#create_vdc_dialog');
    var force =  $('#vdc_force',dialog).is(':checked');
    var cluster = $('select#clusterid',dialog).val();
    var zone_id = req.request.data[0];
    var free;

    $.each(list_json,function(){
        var id = this[res.toUpperCase()].ID;
        var name = this[res.toUpperCase()].NAME;
        if (!inCluster(this[res.toUpperCase()].CLUSTER_ID,cluster))
            return true; //continue
        free = isResourceFree(res,id,zone_id);

        if (force || free){
            list+='<li '+res+'_id="'+id+'">'+(free ? name : '<span style="color:Grey;">'+name+'</span>')+'</li>';
        };
    });
    $('#vdc_available_'+res+'s_list',dialog).html(list);
};

function fillHostList(req, list_json){
    fillList("host",req,list_json);
};

function fillVNetList(req, list_json){
    fillList("vnet",req,list_json);
};

function fillDatastoreList(req, list_json){
    fillList("datastore",req,list_json);
};

//returns if resource with id is from a certain VDC
function isResourceMine(resource,id,vdc_id){
    var column;
    switch (resource){
        case "host": column = 5; break;
        case "vnet" : column = 6; break;
        case "datastore" : column = 7; break;
        default: return false;
    };

    //locate myself
    var vdcs = dataTable_vdcs.fnGetData();
    var my_resources=[];
    for (var i=0; i < vdcs.length; i++){
        if (vdcs[i][1]==vdc_id){
            if (vdcs[i][column] != "none")
                my_resources = vdcs[i][column].split(',');
            break;
        };
    };
    return $.inArray(id,my_resources) >= 0;
};

function fillUpdateList(res, req, list_json){
    var list = "";
    var list_mine = "";
    var vdc_id = $('#vdc_update_id',$update_vdc_dialog).val();
    var force = $('#vdc_update_force',$update_vdc_dialog).is(':checked');
    var cluster = dataTable_vdcs.fnGetData($('#vdc_'+vdc_id, dataTable_vdcs.fnGetNodes()).parents('tr')[0])[4];

    var zone_id = req.request.data[0];
    var free,li;

    $.each(list_json,function(){
        //if mine, put in mine_list
        var id = this[res.toUpperCase()].ID;
        var name = this[res.toUpperCase()].NAME;
        if (!inCluster(this[res.toUpperCase()].CLUSTER_ID,cluster))
            return true; //continue

        if (isResourceMine(res,id,vdc_id)){
            list_mine+='<li '+res+'_id="'+id+'">'+name+'</li>';
            return true; //continue
        };
        //otherwise, check if its free etc...
        free = isResourceFree(res,id,zone_id);

        if (force || free){
            list+='<li '+res+'_id="'+id+'">'+(free? name : '<span style="color:Grey;">'+name+'</span>')+'</li>';
        }
    });

    $('#vdc_update_available_'+res+'s_list', $update_vdc_dialog).html(list);
    $('#vdc_update_selected_'+res+'s_list', $update_vdc_dialog).html(list_mine);
};

function fillUpdateHostList(req, list_json){
    fillUpdateList("host", req, list_json);
};
function fillUpdateVNetList(req, list_json){
    fillUpdateList("vnet", req, list_json);
};
function fillUpdateDatastoreList(req, list_json){
    fillUpdateList("datastore", req, list_json);
};

function isResourceFree(res, id, zone_id){//id, zone_id strings
    var column;
    switch (res){
        case "host": column = 5; break;
        case "vnet": column = 6; break;
        case "datastore": column = 7; break;
    };
    var data = dataTable_vdcs.fnGetData();
    var result = true;
    var resources;
    for (var i=0; i<data.length; i++){
        //this vdc is not in the interesting zone:
        if (data[i][3] != zone_id) continue;

        //note it is an array of strings
        resources = [];
        if (data[i][column] != "none")
            resources = data[i][column].split(',');

        if ($.inArray(id,resources) >= 0){
            result = false;
            break;
        };
    };
    return result;
};

function setupCreateVDCDialog(){
    $('div#dialogs').append('<div title="Create VDC" id="create_vdc_dialog"></div>');
    var dialog = $('div#create_vdc_dialog');
    dialog.html(create_vdc_tmpl);

    var height = Math.floor($(window).height()*0.8);

    dialog.dialog({
        autoOpen: false,
        modal: true,
        height: height,
        width: 500
    });

    $('div#vdc_hosts_lists,div#vdc_vnets_lists,div#vdc_datastores_lists',dialog).hide();
    $('.vdc_show_hide',dialog).click(function(){
        $('span',this).toggleClass('ui-icon-triangle-1-s ui-icon-triangle-1-n');
        $(this).parent().next().toggle();
    });

    $('button',dialog).button();
    $('#vdc_available_hosts_list',dialog).sortable({
        connectWith : '#vdc_selected_hosts_list',
        containment: dialog
    });
    $('#vdc_selected_hosts_list',dialog).sortable({
        connectWith : '#vdc_available_hosts_list',
        containment: dialog
    });
    $('#vdc_available_vnets_list',dialog).sortable({
        connectWith : '#vdc_selected_vnets_list',
        containment: dialog
    });
    $('#vdc_selected_vnets_list',dialog).sortable({
        connectWith : '#vdc_available_vnets_list',
        containment: dialog
    });
    $('#vdc_available_datastores_list',dialog).sortable({
        connectWith : '#vdc_selected_datastores_list',
        containment: dialog
    });
    $('#vdc_selected_datastores_list',dialog).sortable({
        connectWith : '#vdc_available_datastores_list',
        containment: dialog
    });

    $('input#vdc_force',dialog).change(function(){
        select = $('div#create_vdc_dialog select#clusterid');
        if (select.val().length){
            select.trigger("change");
        };
    });

    //load zone hosts
    $('select#zoneid',dialog).change(function(){
        var id=$(this).val();
        if (!id) {
            $('select#clusterid').html('<option value="">Select zone</option>');
            $('select#clusterid').trigger('change');
            return true;
        };
        $('select#clusterid').html('<option value="">Loading...</option>');
        $('select#clusterid').trigger('change');
        Sunstone.runAction("VDC.zone_clusters",id);
    });

    $('select#clusterid',dialog).change(function(){
        var context = $('div#create_vdc_dialog');
        var id=$('select#zoneid',context).val();
        var clusterid=$(this).val();
        var av_hosts=
            $('#vdc_available_hosts_list', context);
        var sel_hosts=
            $('#vdc_selected_hosts_list', context);
        var av_vnets=
            $('#vdc_available_vnets_list', context);
        var sel_vnets=
            $('#vdc_selected_vnets_list', context);
        var av_datastores=
            $('#vdc_available_datastores_list', context);
        var sel_datastores=
            $('#vdc_selected_datastores_list', context);

        if (!clusterid){
            av_hosts.empty();
            sel_hosts.empty();
            av_vnets.empty();
            sel_vnets.empty();
            av_datastores.empty();
            sel_datastores.empty();
            return true;
        }
        av_hosts.html('<li>'+spinner+'</li>');
        av_vnets.html('<li>'+spinner+'</li>');
        av_datastores.html('<li>'+spinner+'</li>');
        sel_hosts.empty();
        sel_vnets.empty();
        sel_datastores.empty();
        Sunstone.runAction("VDC.zone_hosts",id);
        Sunstone.runAction("VDC.zone_vnets",id);
        Sunstone.runAction("VDC.zone_datastores",id);
    });

    $('#create_vdc_form', dialog).submit(function(){
        var name = $('#name',this).val();
        var vdcadminname = $('#vdcadminname',this).val();
        var vdcadminpass = $('#vdcadminpass',this).val();
        var zoneid = $('select#zoneid',this).val();
        var clusterid = $('select#clusterid',this).val();
        var force = $('#vdc_force',this).is(':checked') ? "yes" : "please no";
        if (!name || !vdcadminname
            || !vdcadminpass || !zoneid || !clusterid){
            notifyError("Name, administrator, credentials, zone and cluster are mandatory parameters");
            return false;
        }
        var hosts=[];
        $('#vdc_selected_hosts_list li',$(this)).each(function(){
            hosts.push($(this).attr("host_id"));
        });
        var vnets=[];
        $('#vdc_selected_vnets_list li',$(this)).each(function(){
            vnets.push($(this).attr("vnet_id"));
        });
        var datastores=[];
        $('#vdc_selected_datastores_list li',$(this)).each(function(){
            datastores.push($(this).attr("datastore_id"));
        });

        var vdc_json = {
            "VDC" : {
                "NAME" : name,
                "ZONE_ID" : zoneid,
                "VDCADMINNAME" : vdcadminname,
                "VDCADMINPASS" : vdcadminpass,
                "FORCE" : force,
                "CLUSTER_ID" : clusterid,
                "RESOURCES" : {
                    "HOSTS" : hosts,
                    "DATASTORES" : datastores,
                    "NETWORKS" : vnets,
                },
            }
        };

        Sunstone.runAction("VDC.create",vdc_json);
        dialog.dialog('close');
        return false;
    });
};

function openCreateVDCDialog(){
    var dialog = $('div#create_vdc_dialog')
    if (!zones_select){
        notifyError(tr("No zones defined: You need to create at least 1 zone before creating an VDC"));
        return false;
    };
    $('select#zoneid',dialog).html(zones_select);
    $('select#zoneid',dialog).trigger("change");
    dialog.dialog('open');
}

function setupUpdateVDCDialog(){
    $('div#dialogs').append('<div title="Update VDC" id="update_vdc_dialog"></div>');
    $update_vdc_dialog=$('div#update_vdc_dialog',dialogs_context);
    var dialog = $update_vdc_dialog;
    dialog.html(update_vdc_tmpl);
    dialog.dialog({
        autoOpen: false,
        modal: true,
        width: 500
    });

    $('div#vdc_update_hosts_lists,div#vdc_update_vnets_lists,div#vdc_update_datastores_lists',dialog).hide();
    $('.vdc_show_hide',dialog).click(function(){
        $('span',this).toggleClass('ui-icon-triangle-1-s ui-icon-triangle-1-n');
        $(this).parent().next().toggle();
    });

    $('button',dialog).button();
    $('#vdc_update_available_hosts_list',dialog).sortable({
        connectWith : '#vdc_update_selected_hosts_list',
        containment: dialog
    });
    $('#vdc_update_selected_hosts_list',dialog).sortable({
        connectWith : '#vdc_update_available_hosts_list',
        containment: dialog
    });
    $('#vdc_update_available_vnets_list',dialog).sortable({
        connectWith : '#vdc_update_selected_vnets_list',
        containment: dialog
    });
    $('#vdc_update_selected_vnets_list',dialog).sortable({
        connectWith : '#vdc_update_available_vnets_list',
        containment: dialog
    });
    $('#vdc_update_available_datastores_list',dialog).sortable({
        connectWith : '#vdc_update_selected_datastores_list',
        containment: dialog
    });
    $('#vdc_update_selected_datastores_list',dialog).sortable({
        connectWith : '#vdc_update_available_datastores_list',
        containment: dialog
    });

    $('#vdc_update_force',dialog).change(function(){
        select = $('select#vdc_update_id',$update_vdc_dialog);
        if (select.val().length){
            select.trigger("change");
        }
    });

    $('select#vdc_update_id').change(function(){
        var id = $(this).val();
        var zone_id = $('option:selected',this).attr("zone_id");
        var av_hosts=
            $('#vdc_update_available_hosts_list',$update_vdc_dialog);
        var sel_hosts=
            $('#vdc_update_selected_hosts_list',$update_vdc_dialog);
        var av_vnets=
            $('#vdc_update_available_vnets_list',$update_vdc_dialog);
        var sel_vnets=
            $('#vdc_update_selected_vnets_list',$update_vdc_dialog);
        var av_datastores=
            $('#vdc_update_available_datastores_list',$update_vdc_dialog);
        var sel_datastores=
            $('#vdc_update_selected_datastores_list',$update_vdc_dialog);

        if (!id) {
            av_hosts.empty();
            sel_hosts.empty();
            av_vnets.empty();
            sel_vnets.empty();
            av_datastores.empty();
            sel_datastores.empty();
            return true;
        };
        //A VDC has been selected
        //Fill in available hosts column
        //move current hosts to current
        av_hosts.html('<li>'+spinner+'</li>');
        sel_hosts.empty();
        av_vnets.html('<li>'+spinner+'</li>');
        sel_vnets.empty();
        av_datastores.html('<li>'+spinner+'</li>');
        sel_datastores.empty();
        Sunstone.runAction("VDC.update_zone_hosts",zone_id);
        Sunstone.runAction("VDC.update_zone_vnets",zone_id);
        Sunstone.runAction("VDC.update_zone_datastores",zone_id);
    });

    $('#update_vdc_form').submit(function(){
        var force = $('#vdc_update_force',this).length ? "yes" : "nein";
        var id =  $('#vdc_update_id',this).val();

        var hosts=[];
        $('#vdc_update_selected_hosts_list li',this).each(function(){
            hosts.push($(this).attr("host_id"));
        });
        var vnets=[];
        $('#vdc_update_selected_vnets_list li',this).each(function(){
            vnets.push($(this).attr("vnet_id"));
        });
        var datastores=[];
        $('#vdc_update_selected_datastores_list li',this).each(function(){
            datastores.push($(this).attr("datastore_id"));
        });

        var vdc_json = {
            "VDC" : {
                "ID": id,
                "FORCE": force,
                "RESOURCES": {
                    "HOSTS": hosts,
                    "NETWORKS": vnets,
                    "DATASTORES": datastores,
                }
            },
        };

        Sunstone.runAction("VDC.update",id,vdc_json);
        dialog.dialog('close');
        return false;
    });

}

function openUpdateVDCDialog(){
    var selected_elems = getSelectedNodes(dataTable_vdcs);
    //populate select
    var dialog = $update_vdc_dialog;
    var options = "";
    var vdcs = dataTable_vdcs.fnGetData();
    for (var i = 0; i < vdcs.length; i++){
        //if this VDC is among the selected
        if ($.inArray(vdcs[i][1].toString(),selected_elems) >= 0){
            options += '<option zone_id="'+
                vdcs[i][3]+
                '" value="'+
                vdcs[i][1]+'">'+
                vdcs[i][2]+
                '</option>';
        };
    };

    $('#vdc_update_available_hosts_list',dialog).empty();
    $('#vdc_update_selected_hosts_list',dialog).empty();
    $('#vdc_update_available_vnets_list',dialog).empty();
    $('#vdc_update_selected_vnets_list',dialog).empty();
    $('#vdc_update_available_datastores_list',dialog).empty();
    $('#vdc_update_selected_datastores_list',dialog).empty();

    $('select#vdc_update_id',dialog).html(options);
    if (selected_elems.length == 1){
        $('select#vdc_update_id',dialog).html(options);
        $('select#vdc_update_id option',dialog).attr("checked","checked");
        $('select#vdc_update_id').trigger("change");
    } else {
        $('select#vdc_update_id',dialog).html('<option value="">Please select</option>'+
                                              options);
    };

    dialog.dialog('open');
}

function setVDCAutorefresh() {
    setInterval(function(){
        var checked = $('input.check_item:checked',dataTable_vdcs);
        var  filter = $("#datatable_vdcs_filter input").attr("value");
        if (!checked.length && !filter.length){
            Sunstone.runAction("VDC.autorefresh");
        }
    },INTERVAL+someTime());
}

$(document).ready(function(){
    dataTable_vdcs = $("#datatable_vdcs").dataTable({
        "bJQueryUI": true,
        "bSortClasses": false,
        "bAutoWidth":false,
        "sPaginationType": "full_numbers",
        "aoColumnDefs": [
            { "bSortable": false, "aTargets": ["check"] },
            { "sWidth": "60px", "aTargets": [0] },
            { "sWidth": "150px", "aTargets": [5,6,7] },
            { "sWidth": "35px", "aTargets": [1,3,4] }
        ]
    });

    dataTable_vdcs.fnClearTable();
    addElement([spinner,'','','','','','',''],dataTable_vdcs);
    Sunstone.runAction("VDC.list");

    setupCreateVDCDialog();
    setupTips($('#create_vdc_dialog'));
    setupUpdateVDCDialog();
    setupTips($('#update_vdc_dialog'));
    setVDCAutorefresh();
    initCheckAllBoxes(dataTable_vdcs);
    tableCheckboxesListener(dataTable_vdcs);
    infoListener(dataTable_vdcs,'VDC.showinfo');
});