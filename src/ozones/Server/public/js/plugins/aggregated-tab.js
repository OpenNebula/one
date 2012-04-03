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


var aggregated_hosts_tab_content =
'<div class="action_blocks">\
 </div>\
<table id="datatable_agg_hosts" class="display">\
  <thead>\
    <tr>\
      <th>Zone ID</th>\
      <th>Zone Name</th>\
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
</table>';
var aggregated_vms_tab_content =
'<div class="action_blocks">\
 </div>\
<table id="datatable_agg_vms" class="display">\
  <thead>\
    <tr>\
      <th>Zone ID</th>\
      <th>Zone Name</th>\
      <th>ID</th>\
      <th>Owner</th>\
      <th>Group</th>\
      <th>Name</th>\
      <th>Status</th>\
      <th>CPU</th>\
      <th>Memory</th>\
      <th>Hostname</th>\
      <th>Start Time</th>\
    </tr>\
  </thead>\
  <tbody>\
  </tbody>\
</table>';
var aggregated_vns_tab_content =
'<div class="action_blocks">\
 </div>\
<table id="datatable_agg_vnets" class="display">\
  <thead>\
    <tr>\
      <th>Zone ID</th>\
      <th>Zone Name</th>\
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
</table>';
var aggregated_images_tab_content =
'<div class="action_blocks">\
 </div>\
<table id="datatable_agg_images" class="display">\
  <thead>\
    <tr>\
      <th>Zone ID</th>\
      <th>Zone Name</th>\
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
</table>'
var aggregated_users_tab_content =
'<div class="action_blocks">\
 </div>\
<table id="datatable_agg_users" class="display">\
  <thead>\
    <tr>\
      <th>Zone ID</th>\
      <th>Zone Name</th>\
      <th>ID</th>\
      <th>Name</th>\
    </tr>\
  </thead>\
  <tbody>\
  </tbody>\
</table>';
var aggregated_templates_tab_content =
'<div class="action_blocks">\
 </div>\
<table id="datatable_agg_templates" class="display">\
  <thead>\
    <tr>\
      <th>Zone ID</th>\
      <th>Zone Name</th>\
      <th>ID</th>\
      <th>Owner</th>\
      <th>Group</th>\
      <th>Name</th>\
      <th>Registration time</th>\
    </tr>\
  </thead>\
  <tbody>\
  </tbody>\
</table>';

var aggregated_clusters_tab_content =
'<div class="action_blocks">\
 </div>\
<table id="datatable_agg_clusters" class="display">\
  <thead>\
    <tr>\
      <th>Zone ID</th>\
      <th>Zone Name</th>\
      <th>ID</th>\
      <th>Name</th>\
    </tr>\
  </thead>\
  <tbody>\
  </tbody>\
</table>';

var aggregated_datastores_tab_content =
'<div class="action_blocks">\
 </div>\
<table id="datatable_agg_datastores" class="display">\
  <thead>\
    <tr>\
      <th>Zone ID</th>\
      <th>Zone Name</th>\
      <th>ID</th>\
      <th>Owner</th>\
      <th>Group</th>\
      <th>Name</th>\
      <th>Cluster</th>\
    </tr>\
  </thead>\
  <tbody>\
  </tbody>\
</table>';

var dataTable_agg_hosts;
var dataTable_agg_vms;
var dataTable_agg_vns;
var dataTable_agg_images;
var dataTable_agg_users;
var dataTable_agg_templates;
var dataTable_agg_cluters;
var dataTable_agg_datastores;

var agg_actions = {
    "ZoneHosts.list" : {
        type: "single",
        call: oZones.ZoneHosts.list,
        callback: hostsListCB,
        error: onError
    },
    "ZoneVMs.list" : {
        type: "single",
        call: oZones.ZoneVMs.list,
        callback: vmsListCB,
        error: onError
    },
    "ZoneVNs.list" : {
        type: "single",
        call: oZones.ZoneVNs.list,
        callback: vnsListCB,
        error: onError
    },
    "ZoneImages.list" : {
        type: "single",
        call: oZones.ZoneImages.list,
        callback: imagesListCB,
        error: onError
    },
    "ZoneUsers.list" : {
        type: "single",
        call: oZones.ZoneUsers.list,
        callback: usersListCB,
        error: onError
    },
    "ZoneTemplates.list" : {
        type: "single",
        call: oZones.ZoneTemplates.list,
        callback: templatesListCB,
        error: onError
    },
    "ZoneClusters.list" : {
        type: "single",
        call: oZones.ZoneClusters.list,
        callback: clustersListCB,
        error: onError
    },
    "ZoneDatastores.list" : {
        type: "single",
        call: oZones.ZoneDatastores.list,
        callback: datastoresListCB,
        error: onError
    },
    "ZoneHosts.refresh" : {
        type: "custom",
        call: function() {
            waitingNodes(dataTable_agg_hosts);
            Sunstone.runAction("ZoneHosts.list");
        },
        error: onError,
        notify: false
    },

    "ZoneHosts.autorefresh" : {
        type: "custom",
        call: function() {
            oZones.ZoneHosts.list({
                timeout:true,
                success: hostsListCB,
                error: onError})
        }
    },

    "ZoneVMs.refresh" : {
        type: "custom",
        call: function() {
            waitingNodes(dataTable_agg_vms);
            Sunstone.runAction("ZoneVMs.list");
        },
        error: onError,
        notify: false
    },

    "ZoneVMs.autorefresh" : {
        type: "custom",
        call: function() {
            oZones.ZoneVMs.list({
                timeout:true,
                success: vmsListCB,
                error: onError})
        }
    },

    "ZoneVNs.refresh" : {
        type: "custom",
        call: function() {
            waitingNodes(dataTable_agg_vns);
            Sunstone.runAction("ZoneVNs.list");
        },
        error: onError,
        notify: false
    },

    "ZoneVNs.autorefresh" : {
        type: "custom",
        call: function() {
            oZones.ZoneVNs.list({
                timeout:true,
                success: vnsListCB,
                error: onError})
        }
    },

    "ZoneImages.refresh" : {
        type: "custom",
        call: function() {
            waitingNodes(dataTable_agg_images);
            Sunstone.runAction("ZoneImages.list");
        },
        error: onError,
        notify: false
    },

    "ZoneImages.autorefresh" : {
        type: "custom",
        call: function() {
            oZones.ZoneImages.list({
                timeout:true,
                success: imagesListCB,
                error: onError})
        }
    },

    "ZoneUsers.refresh" : {
        type: "custom",
        call: function() {
            waitingNodes(dataTable_agg_users);
            Sunstone.runAction("ZoneUsers.list");
        },
        error: onError,
        notify: false
    },

    "ZoneUsers.autorefresh" : {
        type: "custom",
        call: function() {
            oZones.ZoneUsers.list({
                timeout:true,
                success: usersListCB,
                error: onError})
        }
    },

    "ZoneTemplates.refresh" : {
        type: "custom",
        call: function() {
            waitingNodes(dataTable_agg_templates);
            Sunstone.runAction("ZoneTemplates.list");
        },
        error: onError,
        notify: false
    },

    "ZoneTemplates.autorefresh" : {
        type: "custom",
        call: function() {
            oZones.ZoneTemplates.list({
                timeout:true,
                success: templatesListCB,
                error: onError})
        }
    },

    "ZoneClusters.refresh" : {
        type: "custom",
        call: function() {
            waitingNodes(dataTable_agg_clusters);
            Sunstone.runAction("ZoneClusters.list");
        },
        error: onError,
        notify: false
    },

    "ZoneClusters.autorefresh" : {
        type: "custom",
        call: function() {
            oZones.ZoneClusters.list({
                timeout:true,
                success: clustersListCB,
                error: onError})
        }
    },

    "ZoneDatastores.refresh" : {
        type: "custom",
        call: function() {
            waitingNodes(dataTable_agg_datastores);
            Sunstone.runAction("ZoneDatastores.list");
        },
        error: onError,
        notify: false
    },

    "ZoneDatastores.autorefresh" : {
        type: "custom",
        call: function() {
            oZones.ZoneDatastores.list({
                timeout:true,
                success: datastoresListCB,
                error: onError})
        }
    },

};

var hosts_buttons = {
    "ZoneHosts.refresh" : {
        type: "image",
        text: "Refresh list",
        img: "images/Refresh-icon.png"
    }
};

var vms_buttons = {
    "ZoneVMs.refresh" : {
        type: "image",
        text: "Refresh list",
        img: "images/Refresh-icon.png"
    }
};

var vns_buttons = {
    "ZoneVNs.refresh" : {
        type: "image",
        text: "Refresh list",
        img: "images/Refresh-icon.png"
    }
};

var images_buttons = {
    "ZoneImages.refresh" : {
        type: "image",
        text: "Refresh list",
        img: "images/Refresh-icon.png"
    }
};

var users_buttons = {
    "ZoneUsers.refresh" : {
        type: "image",
        text: "Refresh list",
        img: "images/Refresh-icon.png"
    }
};

var templates_buttons = {
    "ZoneTemplates.refresh" : {
        type: "image",
        text: "Refresh list",
        img: "images/Refresh-icon.png"
    }
};

var clusters_buttons = {
    "ZoneClusters.refresh" : {
        type: "image",
        text: "Refresh list",
        img: "images/Refresh-icon.png"
    }
};

var datastores_buttons = {
    "ZoneDatastores.refresh" : {
        type: "image",
        text: "Refresh list",
        img: "images/Refresh-icon.png"
    }
};

var hosts_tab = {
    title: "Hosts",
    content: aggregated_hosts_tab_content,
    buttons: hosts_buttons,
    tabClass: "subTab",
    parentTab: "dashboard_tab"
};

var vms_tab = {
    title: "Virtual Machines",
    content: aggregated_vms_tab_content,
    buttons: vms_buttons,
    tabClass: "subTab",
    parentTab: "dashboard_tab"
};

var vns_tab = {
    title: "Virtual Networks",
    content: aggregated_vns_tab_content,
    buttons: vns_buttons,
    tabClass: "subTab",
    parentTab: "dashboard_tab"

};

var images_tab = {
    title: "Images",
    content: aggregated_images_tab_content,
    buttons: images_buttons,
    tabClass: "subTab",
    parentTab: "dashboard_tab"
};

var users_tab = {
    title: "Users",
    content: aggregated_users_tab_content,
    buttons: users_buttons,
    tabClass: "subTab",
    parentTab: "dashboard_tab"
};

var templates_tab = {
    title: "Templates",
    content: aggregated_templates_tab_content,
    buttons: templates_buttons,
    tabClass: "subTab",
    parentTab: "dashboard_tab"
};

var clusters_tab = {
    title: "Clusters",
    content: aggregated_clusters_tab_content,
    buttons: clusters_buttons,
    tabClass: "subTab",
    parentTab: "dashboard_tab"
};

var datastores_tab = {
    title: "Datastores",
    content: aggregated_datastores_tab_content,
    buttons: datastores_buttons,
    tabClass: "subTab",
    parentTab: "dashboard_tab"
};

Sunstone.addActions(agg_actions);
Sunstone.addMainTab("agg_users_tab",users_tab);
Sunstone.addMainTab("agg_vms_tab",vms_tab);
Sunstone.addMainTab("agg_templates_tab",templates_tab);
Sunstone.addMainTab("agg_images_tab",images_tab);
Sunstone.addMainTab("agg_clusters_tab",clusters_tab);
Sunstone.addMainTab("agg_hosts_tab",hosts_tab);
Sunstone.addMainTab("agg_datastores_tab",datastores_tab);
Sunstone.addMainTab("agg_vns_tab",vns_tab);



function hostsListCB(req,list){
    dataTable_agg_hosts.fnClearTable();
    var total_hosts = [];
    $.each(list,function(){
        if (this.ZONE.error){
            notifyError(this.ZONE.error.message);
            return;
        };
        var host_json = oZones.Helper.pool("HOST",this.ZONE);
        total_hosts = total_hosts.concat(host_json);
        updateHostsList(req, host_json,'#datatable_agg_hosts',this.ZONE.ID,this.ZONE.NAME);
    });

    updateZonesDashboard("hosts",total_hosts);
}

function vmsListCB(req,list){
    dataTable_agg_vms.fnClearTable();
    var total_vms = [];
    $.each(list,function(){
        if (this.ZONE.error){
            notifyError(this.ZONE.error.message);
            return;
        };
        var vms_json = oZones.Helper.pool("VM",this.ZONE);
        total_vms = total_vms.concat(vms_json);
        updateVMsList(req, vms_json,'#datatable_agg_vms',this.ZONE.ID,this.ZONE.NAME);
    });

    updateZonesDashboard("vms",total_vms);
}

function vnsListCB(req,list){
    dataTable_agg_vns.fnClearTable();
    var total_vns = [];
    $.each(list,function(){
        if (this.ZONE.error){
            notifyError(this.ZONE.error.message);
            return;
        };
        var vn_json = oZones.Helper.pool("VNET",this.ZONE);
        total_vns = total_vns.concat(vn_json);
        updateVNsList(req, vn_json,'#datatable_agg_vnets',this.ZONE.ID,this.ZONE.NAME);
    });

    updateZonesDashboard("vnets",total_vns);
}

function imagesListCB(req,list){
    dataTable_agg_images.fnClearTable();
    total_images = [];
    $.each(list,function(){
        if (this.ZONE.error){
            notifyError(this.ZONE.error.message);
            return;
        };
        var image_json = oZones.Helper.pool("IMAGE",this.ZONE);
        total_images = total_images.concat(image_json);
        updateImagesList(req,image_json,'#datatable_agg_images',this.ZONE.ID,this.ZONE.NAME);
    });

    updateZonesDashboard("images",total_images);
}

function usersListCB(req,list){
    dataTable_agg_users.fnClearTable();
    var total_users = [];
    $.each(list,function(){
        if (this.ZONE.error){
            notifyError(this.ZONE.error.message);
            return;
        };
        var user_json = oZones.Helper.pool("USER",this.ZONE);
        total_users = total_users.concat(user_json);
        updateUsersList(req,user_json,'#datatable_agg_users',this.ZONE.ID,this.ZONE.NAME);
    });

    updateZonesDashboard("users",total_users);
}

function templatesListCB(req,list){
    dataTable_agg_templates.fnClearTable();
    var total_templates = [];
    $.each(list,function(){
        if (this.ZONE.error){
            notifyError(this.ZONE.error.message);
            return;
        };
        var template_json = oZones.Helper.pool("VMTEMPLATE",this.ZONE);
        total_templates = total_templates.concat(template_json);
        updateTemplatesList(req,template_json,'#datatable_agg_templates',this.ZONE.ID,this.ZONE.NAME);
    });

    updateZonesDashboard("templates",total_templates);
};

function clustersListCB(req,list){
    dataTable_agg_clusters.fnClearTable();
    var total = [];
    $.each(list,function(){
        if (this.ZONE.error){
            notifyError(this.ZONE.error.message);
            return;
        };
        var json = oZones.Helper.pool("CLUSTER",this.ZONE);
        total = total.concat(json);
        updateClustersList(req,json,'#datatable_agg_clusters',this.ZONE.ID,this.ZONE.NAME);
    });

    updateZonesDashboard("clusters",total);
};

function datastoresListCB(req,list){
    dataTable_agg_datastores.fnClearTable();
    var total = [];
    $.each(list,function(){
        if (this.ZONE.error){
            notifyError(this.ZONE.error.message);
            return;
        };
        var json = oZones.Helper.pool("DATASTORE",this.ZONE);
        total = total.concat(json);
        updateDatastoresList(req,json,'#datatable_agg_datastores',this.ZONE.ID,this.ZONE.NAME);
    });

    updateZonesDashboard("datastores",total);
};

function setAutorefreshes(){
    setInterval(function(){
        var filter = $('#datatable_agg_hosts_filter input').attr("value");
        if (!filter.length){
            Sunstone.runAction("ZoneHosts.autorefresh");
        };
    },INTERVAL+someTime());

    setInterval(function(){
        var filter = $('#datatable_agg_vms_filter input').attr("value");
        if (!filter.length){
            Sunstone.runAction("ZoneVMs.autorefresh");
        };
    },INTERVAL+someTime());

    setInterval(function(){
        var filter = $('#datatable_agg_vnets_filter input').attr("value");
        if (!filter.length){
            Sunstone.runAction("ZoneVNs.autorefresh");
        };
    },INTERVAL+someTime());

    setInterval(function(){
        var filter = $('#datatable_agg_images_filter input').attr("value");
        if (!filter.length){
            Sunstone.runAction("ZoneImages.autorefresh");
        };
    },INTERVAL+someTime());

    setInterval(function(){
        var filter = $('#datatable_agg_users_filter input').attr("value");
        if (!filter.length){
            Sunstone.runAction("ZoneUsers.autorefresh");
        };
    },INTERVAL+someTime());

    setInterval(function(){
        var filter = $('#datatable_agg_templates_filter input').attr("value");
        if (!filter.length){
            Sunstone.runAction("ZoneTemplates.autorefresh");
        };
    },INTERVAL+someTime());

    setInterval(function(){
        var filter = $('#datatable_agg_clusters_filter input').attr("value");
        if (!filter.length){
            Sunstone.runAction("ZoneClusters.autorefresh");
        };
    },INTERVAL+someTime());

    setInterval(function(){
        var filter = $('#datatable_agg_datastores_filter input').attr("value");
        if (!filter.length){
            Sunstone.runAction("ZoneDatastores.autorefresh");
        };
    },INTERVAL+someTime());
}

$(document).ready(function(){



    /*Init dataTables*/
    dataTable_agg_hosts =  $('#datatable_agg_hosts').dataTable({
        "bJQueryUI": true,
        "bSortClasses": false,
        "bAutoWidth":false,
        "sPaginationType": "full_numbers",
        "aoColumnDefs": [
            { "sWidth": "60px", "aTargets": [5,8] },
            { "sWidth": "35px", "aTargets": [0,2] },
            { "sWidth": "160px", "aTargets": [6,7] },
            { "sWidth": "100px", "aTargets": [1,4] }
        ]
    });

    dataTable_agg_vms = $('#datatable_agg_vms').dataTable({
        "bJQueryUI": true,
        "bSortClasses": false,
        "sPaginationType": "full_numbers",
        "bAutoWidth":false,
        "aoColumnDefs": [
            { "sWidth": "35px", "aTargets": [0,2] },
            { "sWidth": "60px", "aTargets": [7,8] },
            { "sWidth": "100px", "aTargets": [1,3,4,6,10] }
        ]
    });

    dataTable_agg_vns = $('#datatable_agg_vnets').dataTable({
        "bJQueryUI": true,
        "bSortClasses": false,
        "bAutoWidth":false,
        "sPaginationType": "full_numbers",
        "aoColumnDefs": [
            { "sWidth": "60px", "aTargets": [7,8,9] },
            { "sWidth": "35px", "aTargets": [0,2] },
            { "sWidth": "100px", "aTargets": [1,3,4,6] }
        ]
    });

    dataTable_agg_images = $('#datatable_agg_images').dataTable({
        "bJQueryUI": true,
        "bSortClasses": false,
        "bAutoWidth":false,
        "sPaginationType": "full_numbers",
        "aoColumnDefs": [
            { "sWidth": "60px", "aTargets": [9] },
            { "sWidth": "35px", "aTargets": [0,2,8,10] },
            { "sWidth": "100px", "aTargets": [1,3,4,6,7] }
        ]
    });

    dataTable_agg_templates = $('#datatable_agg_templates').dataTable({
        "bJQueryUI": true,
        "bSortClasses": false,
        "bAutoWidth":false,
        "sPaginationType": "full_numbers",
        "aoColumnDefs": [
            { "sWidth": "35px", "aTargets": [0,2] },
            { "sWidth": "100px", "aTargets": [1,3,4,6] }
        ]
    });

    dataTable_agg_users = $('#datatable_agg_users').dataTable({
        "bJQueryUI": true,
        "bSortClasses": false,
        "sPaginationType": "full_numbers",
        "bAutoWidth":false,
        "aoColumnDefs": [
            { "sWidth": "35px", "aTargets": [0,2] },
            { "sWidth": "100px", "aTargets": [1] }
        ]
    });

    dataTable_agg_clusters = $('#datatable_agg_clusters').dataTable({
        "bJQueryUI": true,
        "bSortClasses": false,
        "sPaginationType": "full_numbers",
        "bAutoWidth":false,
        "aoColumnDefs": [
            { "sWidth": "35px", "aTargets": [0,2] },
            { "sWidth": "100px", "aTargets": [1] }
        ]
    });

    dataTable_agg_datastores = $('#datatable_agg_datastores').dataTable({
        "bJQueryUI": true,
        "bSortClasses": false,
        "sPaginationType": "full_numbers",
        "bAutoWidth":false,
        "aoColumnDefs": [
            { "sWidth": "35px", "aTargets": [0,2] },
            { "sWidth": "100px", "aTargets": [1,3,4,6] }
        ]
    });

    Sunstone.runAction("ZoneHosts.list");
    Sunstone.runAction("ZoneVMs.list");
    Sunstone.runAction("ZoneVNs.list");
    Sunstone.runAction("ZoneImages.list");
    Sunstone.runAction("ZoneUsers.list");
    Sunstone.runAction("ZoneTemplates.list");
    Sunstone.runAction("ZoneClusters.list");
    Sunstone.runAction("ZoneDatastores.list");

    setAutorefreshes();
});
