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

/*Cluster tab plugin*/


var clusters_tab_content =
'<form id="form_cluters" action="javascript:alert(\'js errors?!\')">\
  <div class="action_blocks">\
  </div>\
<table id="datatable_clusters" class="display">\
  <thead>\
    <tr>\
      <th class="check"><input type="checkbox" class="check_all" value="">' + tr("All") + '</input></th>\
      <th>' + tr("id") + '</th>\
      <th>' + tr("Name") + '</th>\
    </tr>\
  </thead>\
  <tbody id="tbodyclusters">\
  </tbody>\
</table>\
</form>';

var create_cluster_tmpl =
'<div class="create_form"><form id="create_cluster_form" action="">\
  <fieldset>\
  <label for="name">' + tr("Name") + ':</label><input type="text" name="name" id="name" />\
  </fieldset>\
  <fieldset>\
    <div class="form_buttons">\
        <div><button class="button" type="submit" id="create_cluster_submit" value="OpenNebula.Cluster.create">' + tr("Create") + '</button>\
        <button class="button" type="reset" value="reset">' + tr("Reset") + '</button></div>\
    </div>\
  </fieldset>\
</form></div>';

var clusters_select="";
var dataTable_clusters;
var $create_cluster_dialog;

//Setup actions
var cluster_actions = {

    "Cluster.create" : {
        type: "create",
        call : OpenNebula.Cluster.create,
        callback : addClusterElement,
        error : onError,
        notify: true
    },

    "Cluster.create_dialog" : {
        type: "custom",
        call: popUpCreateClusterDialog
    },

    "Cluster.list" : {
        type: "list",
        call: OpenNebula.Cluster.list,
        callback: updateClustersView,
        error: onError
    },

    "Cluster.show" : {
        type: "single",
        call: OpenNebula.Cluster.show,
        callback: updateClusterElement,
        error: onError
    },

/*

    "Cluster.showinfo" : {
        type: "single",
        call: OpenNebula.Cluster.show,
        callback: updateClusterInfo,
        error: onError
    },
*/

    "Cluster.refresh" : {
        type: "custom",
        call: function(){
            waitingNodes(dataTable_clusters);
            Sunstone.runAction("Cluster.list");
        },
        error: onError
    },

    "Cluster.autorefresh" : {
        type: "custom",
        call : function() {
            OpenNebula.Cluster.list({timeout: true, success: updateClustersView,error: onError});
        }
    },

    "Cluster.addhost" : {
        type: "single",
        call : OpenNebula.Cluster.addhost,
        callback : function (req) {
            Sunstone.runAction("Host.show",req.request.data[0][1].host_id);
        },
        error : onError,
    },

    "Cluster.delhost" : {
        type: "single",
        call : OpenNebula.Cluster.delhost,
        callback : function (req) {
            //Sunstone.runAction("Cluster.show",req.request.data[0]);
        },
        error : onError,
        notify: true
    },

    "Cluster.adddatastore" : {
        type: "single",
        call : OpenNebula.Cluster.addhost,
        callback : function (req) {
            Sunstone.runAction("Datastore.show",req.request.data[0][1].ds_id);
            //Sunstone.runAction("Cluster.show",req.request.data[0]);
        },
        error : onError,
    },

    "Cluster.deldatastore" : {
        type: "single",
        call : OpenNebula.Cluster.addhost,
        callback : function (req) {
            //Sunstone.runAction("Cluster.show",req.request.data[0]);
        },
        error : onError,
    },

    "Cluster.addvnet" : {
        type: "single",
        call : OpenNebula.Cluster.addvnet,
        callback : function (req) {
            Sunstone.runAction("Network.show",req.request.data[0][1].vnet_id);
        },
        error : onError,
    },

    "Cluster.delvnet" : {
        type: "single",
        call : OpenNebula.Cluster.delvnet,
        callback : function (req) {
            //Sunstone.runAction("Cluster.show",req.request.data[0]);
        },
        error : onError,
        notify: true
    },

    "Cluster.delete" : {
        type: "multiple",
        call : OpenNebula.Cluster.delete,
        callback : deleteClusterElement,
        elements: clusterElements,
        error : onError,
        notify:true
    },
};

var cluster_buttons = {
    "Cluster.refresh" : {
        type: "image",
        text: tr("Refresh list"),
        img: "images/Refresh-icon.png"
        },
    "Cluster.create_dialog" : {
        type: "create_dialog",
        text: tr("+ New")
    },
    "Cluster.delete" : {
        type: "confirm",
        text: tr("Delete")
    }
};

/*
var host_info_panel = {
    "host_info_tab" : {
        title: tr("Host information"),
        content:""
    },

    "host_template_tab" : {
        title: tr("Host template"),
        content: ""
    },
    "host_monitoring_tab": {
        title: tr("Monitoring information"),
        content: ""
    }
};
*/


var clusters_tab = {
    title: tr("Clusters"),
    content: clusters_tab_content,
    buttons: cluster_buttons
}

Sunstone.addActions(cluster_actions);
Sunstone.addMainTab('clusters_tab',clusters_tab);
//Sunstone.addInfoPanel("host_info_panel",host_info_panel);


function clusterElements(){
    return getSelectedNodes(dataTable_clusters);
}

function clusterElementArray(element_json){

    var element = element_json.CLUSTER;

    return [
        '<input class="check_item" type="checkbox" id="cluster_'+element.ID+'" name="selected_items" value="'+element.ID+'"/>',
        element.ID,
        element.NAME,
    ];
}

/*
//Listen to clicks on the tds of the tables and shows the info dialogs.
function hostInfoListener(){
    $('#tbodyhosts tr',dataTable_hosts).live("click",function(e){
        //do nothing if we are clicking a checkbox!
        if ($(e.target).is('input')) {return true;}

        var aData = dataTable_hosts.fnGetData(this);
        var id = $(aData[0]).val();
        if (!id) return true;

        popDialogLoading();
        Sunstone.runAction("Host.showinfo",id);
        return false;
    });
}
*/

//updates the host select by refreshing the options in it
function updateClusterSelect(){
    clusters_select = '<option value="-1">Default (none)</option>';
    clusters_select += makeSelectOptions(dataTable_clusters,
                                         1,//id_col
                                         2,//name_col
                                         [],//status_cols
                                         [],//bad_st
                                         true
                                        );
}

//callback for an action affecting a host element
function updateClusterElement(request, element_json){
    var id = element_json.CLUSTER.ID;
    var element = clusterElementArray(element_json);
    updateSingleElement(element,dataTable_clusters,'#cluster_'+id);
    updateClusterSelect();
}

//callback for actions deleting a host element
function deleteClusterElement(req){
    deleteElement(dataTable_clusters,'#cluster_'+req.request.data);
    updateClusterSelect();
}

//call back for actions creating a host element
function addClusterElement(request,element_json){
    var id = element_json.CLUSTER.ID;
    var element = clusterElementArray(element_json);
    addElement(element,dataTable_clusters);
    updateClusterSelect();
}

//callback to update the list of hosts.
function updateClustersView (request,list){
    var list_array = [];

    $.each(list,function(){
        //Grab table data from the host_list
        list_array.push(clusterElementArray(this));
    });

    updateView(list_array,dataTable_clusters);
    updateClusterSelect();
    //dependency with the dashboard plugin
    updateDashboard("clusters",list);
}

/*
//Updates the host info panel tab's content and pops it up
function updateHostInfo(request,host){
    var host_info = host.HOST;

    //Information tab
    var info_tab = {
        title : tr("Host information"),
        content :
        '<table id="info_host_table" class="info_table">\
            <thead>\
               <tr><th colspan="2">' + tr("Host information") + ' - '+host_info.NAME+'</th></tr>\
            </thead>\
            <tbody>\
            <tr>\
                <td class="key_td">' + tr("id") + '</td>\
                <td class="value_td">'+host_info.ID+'</td>\
            </tr>\
            <tr>\
                <td class="key_td">' + tr("Name") + '</td>\
                <td class="value_td">'+host_info.NAME+'</td>\
            </tr>\
            <tr>\
                <td class="key_td">' + tr("Cluster") + '</td>\
                <td class="value_td">'+host_info.CLUSTER+'</td>\
            </tr>\
            <tr>\
                <td class="key_td">' + tr("State") + '</td>\
                <td class="value_td">'+tr(OpenNebula.Helper.resource_state("host",host_info.STATE))+'</td>\
            </tr>\
            <tr>\
                <td class="key_td">' + tr("IM MAD") + '</td>\
                <td class="value_td">'+host_info.IM_MAD+'</td>\
            </tr>\
            <tr>\
                <td class="key_td">' + tr("VM MAD") + '</td>\
                <td class="value_td">'+host_info.VM_MAD+'</td>\
            </tr>\
            <tr>\
                <td class="key_td">'+ tr("VN MAD") +'</td>\
                <td class="value_td">'+host_info.VN_MAD+'</td>\
            </tr>\
            <tr>\
                <td class="key_td">'+ tr("TM MAD") +'</td>\
                <td class="value_td">'+host_info.TM_MAD+'</td>\
            </tr>\
            </tbody>\
         </table>\
         <table id="host_shares_table" class="info_table">\
            <thead>\
               <tr><th colspan="2">' + tr("Host shares") + '</th></tr>\
            </thead>\
            <tbody>\
               <tr>\
                  <td class="key_td">' + tr("Max Mem") + '</td>\
                  <td class="value_td">'+humanize_size(host_info.HOST_SHARE.MAX_MEM)+'</td>\
               </tr>\
               <tr>\
                  <td class="key_td">' + tr("Used Mem (real)") + '</td>\
                  <td class="value_td">'+humanize_size(host_info.HOST_SHARE.USED_MEM)+'</td>\
               </tr>\
               <tr>\
                  <td class="key_td">' + tr("Used Mem (allocated)") + '</td>\
                  <td class="value_td">'+humanize_size(host_info.HOST_SHARE.MAX_USAGE)+'</td>\
               </tr>\
               <tr>\
                  <td class="key_td">' + tr("Used CPU (real)") + '</td>\
                  <td class="value_td">'+host_info.HOST_SHARE.USED_CPU+'</td>\
               </tr>\
               <tr>\
                  <td class="key_td">' + tr("Used CPU (allocated)") + '</td>\
                  <td class="value_td">'+host_info.HOST_SHARE.CPU_USAGE+'</td>\
               </tr>\
               <tr>\
                  <td class="key_td">' + tr("Running VMs") + '</td>\
                  <td class="value_td">'+host_info.HOST_SHARE.RUNNING_VMS+'</td>\
               </tr>\
            </tbody>\
          </table>'
    }

    //Template tab
    var template_tab = {
        title : tr("Host template"),
        content :
        '<table id="host_template_table" class="info_table" style="width:80%">\
                <thead><tr><th colspan="2">' + tr("Host template") + '</th></tr></thead>'+
                prettyPrintJSON(host_info.TEMPLATE)+
                '</table>'
    }

    var monitor_tab = {
        title: tr("Monitoring information"),
        content : generateMonitoringDivs(host_graphs,"host_monitor_")
    }

    //Sunstone.updateInfoPanelTab(info_panel_name,tab_name, new tab object);
    Sunstone.updateInfoPanelTab("host_info_panel","host_info_tab",info_tab);
    Sunstone.updateInfoPanelTab("host_info_panel","host_template_tab",template_tab);
    Sunstone.updateInfoPanelTab("host_info_panel","host_monitoring_tab",monitor_tab);

    Sunstone.popUpInfoPanel("host_info_panel");
    //pop up panel while we retrieve the graphs
    for (var i=0; i<host_graphs.length; i++){
        Sunstone.runAction("Host.monitor",host_info.ID,host_graphs[i]);
    };


}

*/

//Prepares the host creation dialog
function setupCreateClusterDialog(){
    dialogs_context.append('<div title=\"'+tr("Create cluster")+'\" id="create_cluster_dialog"></div>');
    $create_cluster_dialog = $('div#create_cluster_dialog');
    var dialog = $create_cluster_dialog;

    dialog.html(create_cluster_tmpl);
    dialog.dialog({
        autoOpen: false,
        modal: true,
        width: 500
    });

    $('button',dialog).button();

    //Handle the form submission
    $('#create_cluster_form',dialog).submit(function(){
        if (!($('#name',this).val().length)){
            notifyError(tr("Cluster name missing!"));
            return false;
        }

        var cluster_json = {
            "cluster": {
                "name": $('#name',this).val(),
            }
        };

        //Create the OpenNebula.Host.
        //If it's successfull we refresh the list.
        Sunstone.runAction("Cluster.create",cluster_json);
        $create_cluster_dialog.dialog('close');
        return false;
    });
}

//Open creation dialogs
function popUpCreateClusterDialog(){
    $create_cluster_dialog.dialog('open');
    return false;
}

//Prepares the autorefresh for hosts
function setClusterAutorefresh() {
    setInterval(function(){
        var checked = $('input.check_item:checked',dataTable_clusters);
        var  filter = $("#datatable_clusters_filter input",dataTable_clusters.parents('#datatable_clusters_wrapper')).attr('value');
        if (!checked.length && !filter.length){
            Sunstone.runAction("Cluster.autorefresh");
        }
    },INTERVAL+someTime());
}


function clusters_sel() {
    return clusters_select;
}

//This is executed after the sunstone.js ready() is run.
//Here we can basicly init the host datatable, preload it
//and add specific listeners
$(document).ready(function(){

    //prepare host datatable
    dataTable_clusters = $("#datatable_clusters",main_tabs_context).dataTable({
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

    //preload it
    dataTable_clusters.fnClearTable();
    addElement([
        spinner,
        '','',''],dataTable_clusters);
    Sunstone.runAction("Cluster.list");

    setupCreateClusterDialog();

    setClusterAutorefresh();

    initCheckAllBoxes(dataTable_clusters);
    tableCheckboxesListener(dataTable_clusters);
//    clusterInfoListener();
});
