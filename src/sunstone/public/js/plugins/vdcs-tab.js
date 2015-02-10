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

var VDC_ALL_RESOURCES = "-10";

var create_vdc_wizard_html =
    '<form data-abide="ajax" id="create_vdc_form_wizard" class="custom creation">\
      <div>\
        <dl id="vdc_create_tabs" class="tabs right-info-tabs text-center" data-tab>\
          <dd class="active"><a href="#vdcCreateGeneralTab"><i class="fa fa-th"></i><br>'+tr("General")+'</a></dd>\
          <dd><a href="#vdcCreateGroupsTab"><i class="fa fa-users"></i><br>'+tr("Groups")+'</a></dd>\
          <dd><a href="#vdcCreateResourcesTab"><i class="fa fa-hdd-o"></i><br>'+tr("Resources")+'</a></dd>\
        </dl>\
        <div id="vdc_create_tabs_content" class="tabs-content">\
          <div class="content active" id="vdcCreateGeneralTab">\
            <div class="row">\
              <div class="large-6 columns">\
                <label for="name" >' + tr("Name") + ':\
                  <span class="tip">'+tr("Name that the VDC will get for description purposes.")+'</span>\
                </label>\
                <input type="text" wizard_field="NAME" required name="name" id="name"/>\
              </div>\
            </div>\
            <div class="row">\
              <div class="large-6 columns">\
                <label for="DESCRIPTION" >' + tr("Description") + ':\
                  <span class="tip">'+tr("Description of the VDC")+'</span>\
                </label>\
                <textarea type="text" wizard_field="DESCRIPTION" id="DESCRIPTION" name="DESCRIPTION"/>\
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
          <div id="vdcCreateGroupsTab" class="content">\
            '+generateGroupTableSelect("vdc_wizard_groups")+'\
          </div>\
          <div id="vdcCreateResourcesTab" class="content">\
            '+vdcResourceTabHeader()+'\
          </div>\
        </div>\
      </div>\
    </form>';


var create_vdc_advanced_html =
 '<form data-abide="ajax" id="create_vdc_form_advanced" class="custom creation">' +
    '<div class="row">' +
      '<div class="large-12 columns">' +
        '<p>'+tr("Write the VDC template here")+'</p>' +
      '</div>' +
    '</div>' +
    '<div class="row">' +
      '<div class="large-12 columns">' +
        '<textarea id="template" rows="15" required></textarea>' +
      '</div>' +
    '</div>' +
  '</form>';

var dataTable_vdcs;

//Setup actions

var vdc_actions = {
    "Vdc.create" : {
        type: "create",
        call: OpenNebula.Vdc.create,
        callback: function(request, response) {
            $("a[href=back]", $("#vdcs-tab")).trigger("click");
            popFormDialog("create_vdc_form", $("#vdcs-tab"));

            var group_ids = request.request.data[0].group_ids;
            $.each(group_ids,function(){
                Sunstone.runAction("Vdc.add_group",
                    response.VDC.ID,
                    { group_id : parseInt(this)});
            });

            var clusters = request.request.data[0].clusters;
            $.each(clusters,function(){
                Sunstone.runAction("Vdc.add_cluster",
                    response.VDC.ID,
                    this);
            });

            var hosts = request.request.data[0].hosts;
            $.each(hosts,function(){
                Sunstone.runAction("Vdc.add_host",
                    response.VDC.ID,
                    this);
            });

            var vnets = request.request.data[0].vnets;
            $.each(vnets,function(){
                Sunstone.runAction("Vdc.add_vnet",
                    response.VDC.ID,
                    this);
            });

            var datastores = request.request.data[0].datastores;
            $.each(datastores,function(){
                Sunstone.runAction("Vdc.add_datastore",
                    response.VDC.ID,
                    this);
            });

            // TODO: this vdc.show may get the information before the add/del
            // actions end, showing "outdated" information

            Sunstone.runAction('Vdc.show',request.request.data[0][0]);

            addVdcElement(request, response);
            notifyCustom(tr("VDC created"), " ID: " + response.VDC.ID, false);
        },
        error: onError
    },

    "Vdc.create_dialog" : {
        type: "custom",
        call: function(){
            Sunstone.popUpFormPanel("create_vdc_form", "vdcs-tab", "create", true, function(context){
                refreshGroupTableSelect(context, "vdc_wizard_groups");

                var zone_ids = [];

                OpenNebula.Zone.list({
                    timeout: true,
                    success: function (request, obj_list){
                        $.each(obj_list,function(){
                            zone_ids.push(this.ZONE.ID);

                            addVdcResourceTab(
                                "vdc_create_wizard",
                                this.ZONE.ID,
                                this.ZONE.NAME,
                                $("#vdcCreateResourcesTab",context));
                        });

                        setupVdcResourceTab("vdc_create_wizard",
                            $("#vdcCreateResourcesTab",context));

                        context.data("zone_ids", zone_ids);
                    },
                    error: onError
                });

                $("input#name",context).focus();
            });
        }
    },

    "Vdc.list" : {
        type: "list",
        call: OpenNebula.Vdc.list,
        callback: updateVdcsView,
        error: onError
    },

    "Vdc.show" : {
        type: "single",
        call: OpenNebula.Vdc.show,
        callback: function(request, response) {
            updateVdcElement(request, response);
            if (Sunstone.rightInfoVisible($("#vdcs-tab"))) {
                updateVdcInfo(request, response);
            }
        },
        error: onError
    },

    "Vdc.refresh" : {
        type: "custom",
        call: function(){
          var tab = dataTable_vdcs.parents(".tab");
          if (Sunstone.rightInfoVisible(tab)) {
            Sunstone.runAction("Vdc.show", Sunstone.rightInfoResourceId(tab))
          } else {
            waitingNodes(dataTable_vdcs);
            Sunstone.runAction("Vdc.list", {force: true});
          }
        }
    },

    "Vdc.delete" : {
        type: "multiple",
        call: OpenNebula.Vdc.del,
        callback: deleteVdcElement,
        elements: vdcElements,
        error: onError
    },

    "Vdc.rename" : {
        type: "single",
        call: OpenNebula.Vdc.rename,
        callback: function(request) {
            Sunstone.runAction('Vdc.show',request.request.data[0][0]);
        },
        error: onError
    },

    "Vdc.update_dialog" : {
        type: "custom",
        call: function(){
            var selected_nodes = getSelectedNodes(dataTable_vdcs);
            if ( selected_nodes.length != 1 ) {
                notifyMessage("Please select one (and just one) VDC to update.");
                return false;
            }

            var resource_id = ""+selected_nodes[0];
            Sunstone.runAction("Vdc.show_to_update", resource_id);
        }
    },

    "Vdc.show_to_update" : {
        type: "single",
        call: OpenNebula.Vdc.show,
        callback: function(request, response) {
            // TODO: global var, better use jquery .data
            vdc_to_update_id = response.VDC.ID;

            Sunstone.popUpFormPanel("create_vdc_form", "vdcs-tab", "update", true, function(context){
                fillVdcUpdateFormPanel(response.VDC, context);
            });
        },
        error: onError
    },

    "Vdc.update" : {
        type: "single",
        call: OpenNebula.Vdc.update,
        callback: function(request, response){
            $("a[href=back]", $("#vdcs-tab")).trigger("click");
            popFormDialog("create_vdc_form", $("#vdcs-tab"));

            notifyMessage(tr("VDC updated correctly"));
        },
        error: function(request, response){
            popFormDialog("create_vdc_form", $("#vdcs-tab"));

            onError(request, response);
        }
    },

    "Vdc.update_template" : {
        type: "single",
        call: OpenNebula.Vdc.update,
        callback: function(request) {
            Sunstone.runAction('Vdc.show',request.request.data[0][0]);
        },
        error: onError
    },

    "Vdc.add_group" : {
        type: "single",
        call : OpenNebula.Vdc.add_group,
        callback : function (req) {
            //Sunstone.runAction('Vdc.show',req.request.data[0][0]);
        },
        error : onError
    },

    "Vdc.del_group" : {
        type: "single",
        call : OpenNebula.Vdc.del_group,
        callback : function (req) {
            //Sunstone.runAction('Vdc.show',req.request.data[0][0]);
        },
        error : onError
    },

    "Vdc.add_cluster" : {
        type: "single",
        call : OpenNebula.Vdc.add_cluster,
        callback : function (req) {
            //Sunstone.runAction('Vdc.show',req.request.data[0][0]);
        },
        error : onError
    },

    "Vdc.del_cluster" : {
        type: "single",
        call : OpenNebula.Vdc.del_cluster,
        callback : function (req) {
            //Sunstone.runAction('Vdc.show',req.request.data[0][0]);
        },
        error : onError
    },

    "Vdc.add_host" : {
        type: "single",
        call : OpenNebula.Vdc.add_host,
        callback : function (req) {
            //Sunstone.runAction('Vdc.show',req.request.data[0][0]);
        },
        error : onError
    },

    "Vdc.del_host" : {
        type: "single",
        call : OpenNebula.Vdc.del_host,
        callback : function (req) {
            //Sunstone.runAction('Vdc.show',req.request.data[0][0]);
        },
        error : onError
    },

    "Vdc.add_vnet" : {
        type: "single",
        call : OpenNebula.Vdc.add_vnet,
        callback : function (req) {
            //Sunstone.runAction('Vdc.show',req.request.data[0][0]);
        },
        error : onError
    },

    "Vdc.del_vnet" : {
        type: "single",
        call : OpenNebula.Vdc.del_vnet,
        callback : function (req) {
            //Sunstone.runAction('Vdc.show',req.request.data[0][0]);
        },
        error : onError
    },

    "Vdc.add_datastore" : {
        type: "single",
        call : OpenNebula.Vdc.add_datastore,
        callback : function (req) {
            //Sunstone.runAction('Vdc.show',req.request.data[0][0]);
        },
        error : onError
    },

    "Vdc.del_datastore" : {
        type: "single",
        call : OpenNebula.Vdc.del_datastore,
        callback : function (req) {
            //Sunstone.runAction('Vdc.show',req.request.data[0][0]);
        },
        error : onError
    }
};


var vdc_buttons = {
    "Vdc.refresh" : {
        type: "action",
        layout: "refresh",
        alwaysActive: true
    },

//    "Sunstone.toggle_top" : {
//        type: "custom",
//        layout: "top",
//        alwaysActive: true
//    },

    "Vdc.create_dialog" : {
        type: "create_dialog",
        layout: "create"
    },
    "Vdc.update_dialog" : {
        type: "action",
        layout: "main",
        text: tr("Update")
    },

    "Vdc.delete" : {
        type: "confirm",
        layout: "del",
        text: tr("Delete")
    }
}

var vdc_info_panel = {
    "vdc_info_tab" : {
        title: tr("VDC information"),
        content: ""
    },
    "vdc_groups_tab" : {
        title: tr("Groups"),
        content: ""
    },
    "vdc_resources_tab" : {
        title: tr("Resources"),
        content: ""
    }
}

var vdcs_tab = {
    title: tr("VDCs"),
    resource: 'Vdc',
    buttons: vdc_buttons,
    tabClass: "subTab",
    parentTab: "system-tab",
    search_input: '<input id="vdc_search" type="text" placeholder="'+tr("Search")+'" />',
    list_header: '<i class="fa fa-fw fa-th"></i>&emsp;'+tr("Virtual Data Centers"),
    info_header: '<i class="fa fa-fw fa-th"></i>&emsp;'+tr("Virtual Data Center"),
    subheader: '<span class="total_vdcs"/> <small>'+tr("TOTAL")+'</small>',
    table: '<table id="datatable_vdcs" class="datatable twelve">\
      <thead>\
        <tr>\
          <th class="check"><input type="checkbox" class="check_all" value=""></input></th>\
          <th>'+tr("ID")+'</th>\
          <th>'+tr("Name")+'</th>\
          <th>'+tr("Groups")+'</th>\
          <th>'+tr("Clusters")+'</th>\
          <th>'+tr("Hosts")+'</th>\
          <th>'+tr("VNets")+'</th>\
          <th>'+tr("Datastores")+'</th>\
        </tr>\
      </thead>\
      <tbody id="tbodyvdcs">\
      </tbody>\
    </table>',
    forms: {
        "create_vdc_form": {
            actions: {
                create: {
                    title: tr("Create Virtual Data Center"),
                    submit_text: tr("Create")
                },
                update: {
                    title: tr("Update Virtual Data Center"),
                    submit_text: tr("Update"),
                    reset_button: false
                }
            },
            wizard_html: create_vdc_wizard_html,
            advanced_html: create_vdc_advanced_html,
            setup: initialize_create_vdc_dialog
        }
    }
}

Sunstone.addActions(vdc_actions);
Sunstone.addMainTab('vdcs-tab',vdcs_tab);
Sunstone.addInfoPanel('vdc_info_panel',vdc_info_panel);

// return list of selected elements in list
function vdcElements(){
    return getSelectedNodes(dataTable_vdcs);
}

//returns an array with the VDC information fetched from the JSON object
function vdcElementArray(vdc_json){
    var vdc = vdc_json.VDC;

    var groups = 0;
    if ($.isArray(vdc.GROUPS.ID))
        groups = vdc.GROUPS.ID.length;
    else if (!$.isEmptyObject(vdc.GROUPS.ID))
        groups = 1;

    var clusters = 0;
    if ($.isArray(vdc.CLUSTERS.CLUSTER))
        clusters = vdc.CLUSTERS.CLUSTER.length;
    else if (!$.isEmptyObject(vdc.CLUSTERS.CLUSTER))
        clusters = 1;

    var hosts = 0;
    if ($.isArray(vdc.HOSTS.HOST))
        hosts = vdc.HOSTS.HOST.length;
    else if (!$.isEmptyObject(vdc.HOSTS.HOST))
        hosts = 1;

    var vnets = 0;
    if ($.isArray(vdc.VNETS.VNET))
        vnets = vdc.VNETS.VNET.length;
    else if (!$.isEmptyObject(vdc.VNETS.VNET))
        vnets = 1;

    var dss = 0;
    if ($.isArray(vdc.DATASTORES.DATASTORE))
        dss = vdc.DATASTORES.DATASTORE.length;
    else if (!$.isEmptyObject(vdc.DATASTORES.DATASTORE))
        dss = 1;

    return [
        '<input class="check_item" type="checkbox" id="vdc_'+vdc.ID+'" name="selected_items" value="'+vdc.ID+'"/>',
        vdc.ID,
        vdc.NAME,
        groups,
        clusters,
        hosts,
        vnets,
        dss
    ];
}

//Callback to update a vdc element after an action on it
function updateVdcElement(request, vdc_json){
    id = vdc_json.VDC.ID;
    element = vdcElementArray(vdc_json);
    updateSingleElement(element,dataTable_vdcs,'#vdc_'+id);
}

//Callback to delete a vdc element from the table
function deleteVdcElement(req){
    deleteElement(dataTable_vdcs,'#vdc_'+req.request.data);
}

//Callback to add a new element
function addVdcElement(request,vdc_json){
    var element = vdcElementArray(vdc_json);
    addElement(element,dataTable_vdcs);
}

//updates the list of vdcs
function updateVdcsView(request, vdc_list){
    var vdc_list_array = [];

    $.each(vdc_list,function(){
        vdc_list_array.push(vdcElementArray(this));
    });

    updateView(vdc_list_array,dataTable_vdcs);

    $(".total_vdcs").text(vdc_list.length);
}

//updates the information panel tabs and pops the panel up
function updateVdcInfo(request,vdc){
    var vdc_info = vdc.VDC;

    $(".resource-info-header", $("#vdcs-tab")).html(vdc_info.NAME);

    var info_tab_content =
        '<div class="row">\
        <div class="large-6 columns">\
        <table id="info_vdc_table" class="dataTable extended_table">\
            <thead>\
               <tr><th colspan="3">'+tr("Information")+'</th></tr>\
            </thead>\
            <tr>\
              <td class="key_td">'+tr("ID")+'</td>\
              <td class="value_td">'+vdc_info.ID+'</td>\
              <td></td>\
            </tr>'+
            insert_rename_tr(
                'vdcs-tab',
                "Vdc",
                vdc_info.ID,
                vdc_info.NAME)+
        '</table>\
        </div>\
      </div>\
      <div class="row">\
        <div class="large-9 columns">' +
            insert_extended_template_table(vdc_info.TEMPLATE,
                                                       "Vdc",
                                                       vdc_info.ID,
                                                       tr("Attributes")) +
        '</div>\
      </div>';

    var info_tab = {
        title : tr("Info"),
        icon: "fa-info-circle",
        content: info_tab_content
    };

    var groups_tab = {
        title : tr("Groups"),
        icon: "fa-users",
        content: vdc_group_tab_content(vdc_info)
    };

    var resources_tab = {
        title : tr("Resources"),
        icon: "fa-th",
        content : vdc_resources_tab_content(vdc_info)
    };

    Sunstone.updateInfoPanelTab("vdc_info_panel","vdc_info_tab",info_tab);
    Sunstone.updateInfoPanelTab("vdc_info_panel","vdc_groups_tab",groups_tab);
    Sunstone.updateInfoPanelTab("vdc_info_panel","vdc_resources_tab",resources_tab);

    Sunstone.popUpInfoPanel("vdc_info_panel", "vdcs-tab");

    setup_vdc_group_tab_content(vdc_info);
    setup_vdc_resources_tab_content(vdc_info);
}

function vdc_group_tab_content(vdc_info){
    var html = '<div class="row collapse">\
        '+generateGroupTableSelect("vdc_group_list")+'\
      </div>';

    return html;
}

function setup_vdc_group_tab_content(vdc_info){

    var groups = [];

    if (vdc_info.GROUPS.ID != undefined){
        var groups = vdc_info.GROUPS.ID;

        if (!$.isArray(groups)){
            groups = [groups];
        }
    }

    var opts = {
        read_only: true,
        fixed_ids: groups
    }

    setupGroupTableSelect($("#vdc_info_panel"), "vdc_group_list", opts);

    refreshGroupTableSelect($("#vdc_info_panel"), "vdc_group_list");
}

function vdc_resources_tab_content(vdc_info){
    return vdcResourceTabHeader();
}

function setup_vdc_resources_tab_content(vdc_info){
    var indexed_resources = indexedVdcResources(vdc_info);

    var context = $("#vdc_info_panel #vdc_resources_tab");

    $.each(indexed_resources, function(zone_id,objects){
        addVdcResourceTab(
            "vdc_info_panel",
            zone_id,
            getZoneName(zone_id),
            context,
            indexed_resources);
    });

    setupVdcResourceTab("vdc_info_panel", context);
}

function initialize_create_vdc_dialog(dialog) {

    setupCustomTags($("#vdcCreateGeneralTab", dialog));

    setupGroupTableSelect(dialog, "vdc_wizard_groups", {multiple_choice: true});

    dialog.foundation();

    //Process form
    $('#create_vdc_form_wizard',dialog).on('invalid.fndtn.abide', function (e) {
        // Fix for valid event firing twice
        if(e.namespace != 'abide.fndtn') {
            return;
        }

        notifyError(tr("One or more required fields are missing or malformed."));
        popFormDialog("create_vdc_form", $("#vdcs-tab"));
    }).on('valid.fndtn.abide', function(e) {
        // Fix for valid event firing twice
        if(e.namespace != 'abide.fndtn') {
            return;
        }

        //Fetch values
        var vdc_json = {};

        retrieveWizardFields($("#vdcCreateGeneralTab", dialog), vdc_json);

        retrieveCustomTags($("#vdcCreateGeneralTab", dialog), vdc_json);

        var group_ids = retrieveGroupTableSelect(dialog, "vdc_wizard_groups");

        if ($('#create_vdc_form_wizard',dialog).attr("action") == "create") {
            var zone_ids = dialog.data("zone_ids");

            var clusters    = [];
            var hosts       = [];
            var vnets       = [];
            var datastores  = [];

            $.each(zone_ids,function(i,zone_id){

                var resources = retrieveVdcResourceTab('vdc_create_wizard', zone_id, dialog);

                $.each(resources.clusters,function(j,cluster_id){
                    clusters.push({zone_id: zone_id, cluster_id: cluster_id});
                });

                $.each(resources.hosts,function(j,host_id){
                    hosts.push({zone_id: zone_id, host_id: host_id});
                });
                $.each(resources.vnets,function(j,vnet_id){
                    vnets.push({zone_id: zone_id, vnet_id: vnet_id});
                });
                $.each(resources.datastores,function(j,ds_id){
                    datastores.push({zone_id: zone_id, ds_id: ds_id});
                });
            });

            vdc_json = {
                "vdc" : vdc_json,
                "group_ids" : group_ids,
                "clusters" : clusters,
                "hosts" : hosts,
                "vnets" : vnets,
                "datastores" : datastores
            };

            Sunstone.runAction("Vdc.create",vdc_json);
            return false;
        } else if ($('#create_vdc_form_wizard',dialog).attr("action") == "update") {

            // Add/delete groups

            var selected_groups_list = retrieveGroupTableSelect(dialog, "vdc_wizard_groups");

            var original_groups_list = dialog.data("original_groups_list");

            $.each(selected_groups_list, function(i,group_id){
                if (original_groups_list.indexOf(group_id) == -1){
                    Sunstone.runAction("Vdc.add_group",
                        vdc_to_update_id, {group_id : group_id});
                }
            });

            $.each(original_groups_list, function(i,group_id){
                if (selected_groups_list.indexOf(group_id) == -1){
                    Sunstone.runAction("Vdc.del_group",
                        vdc_to_update_id, {group_id : group_id});
                }
            });

            // Add/delete resources

            original_resources = dialog.data("original_resources")

            for (var zone_id in original_resources){
                var original_clusters   = original_resources[zone_id].clusters;
                var original_hosts      = original_resources[zone_id].hosts;
                var original_vnets      = original_resources[zone_id].vnets;
                var original_datastores = original_resources[zone_id].datastores;

                var selected_resources = retrieveVdcResourceTab(
                                        'vdc_update_wizard', zone_id, dialog);

                $.each(selected_resources.clusters, function(i,cluster_id){
                    if (original_clusters.indexOf(cluster_id) == -1){
                        Sunstone.runAction(
                            "Vdc.add_cluster",
                            vdc_to_update_id,
                            {zone_id: zone_id, cluster_id: cluster_id});
                    }
                });

                $.each(original_clusters, function(i,cluster_id){
                    if (selected_resources.clusters.indexOf(cluster_id) == -1){
                        Sunstone.runAction(
                            "Vdc.del_cluster",
                            vdc_to_update_id,
                            {zone_id: zone_id, cluster_id: cluster_id});
                    }
                });

                $.each(selected_resources.hosts, function(i,host_id){
                    if (original_hosts.indexOf(host_id) == -1){
                        Sunstone.runAction(
                            "Vdc.add_host",
                            vdc_to_update_id,
                            {zone_id: zone_id, host_id: host_id});
                    }
                });

                $.each(original_hosts, function(i,host_id){
                    if (selected_resources.hosts.indexOf(host_id) == -1){
                        Sunstone.runAction(
                            "Vdc.del_host",
                            vdc_to_update_id,
                            {zone_id: zone_id, host_id: host_id});
                    }
                });

                $.each(selected_resources.vnets, function(i,vnet_id){
                    if (original_vnets.indexOf(vnet_id) == -1){
                        Sunstone.runAction(
                            "Vdc.add_vnet",
                            vdc_to_update_id,
                            {zone_id: zone_id, vnet_id: vnet_id});
                    }
                });

                $.each(original_vnets, function(i,vnet_id){
                    if (selected_resources.vnets.indexOf(vnet_id) == -1){
                        Sunstone.runAction(
                            "Vdc.del_vnet",
                            vdc_to_update_id,
                            {zone_id: zone_id, vnet_id: vnet_id});
                    }
                });

                $.each(selected_resources.datastores, function(i,ds_id){
                    if (original_datastores.indexOf(ds_id) == -1){
                        Sunstone.runAction(
                            "Vdc.add_datastore",
                            vdc_to_update_id,
                            {zone_id: zone_id, ds_id: ds_id});
                    }
                });

                $.each(original_datastores, function(i,ds_id){
                    if (selected_resources.datastores.indexOf(ds_id) == -1){
                        Sunstone.runAction(
                            "Vdc.del_datastore",
                            vdc_to_update_id,
                            {zone_id: zone_id, ds_id: ds_id});
                    }
                });
            }

            // TODO: this method ends now, but the add/del actions may still
            // be pending. A vdc.show now will get outdated information

            Sunstone.runAction("Vdc.update", vdc_to_update_id, convert_template_to_string(vdc_json));
            return false;
        }
    });

    $('#create_vdc_form_advanced',dialog).on('invalid.fndtn.abide', function (e) {
        // Fix for valid event firing twice
        if(e.namespace != 'abide.fndtn') {
            return;
        }

        notifyError(tr("One or more required fields are missing or malformed."));
        popFormDialog("create_vdc_form", $("#vdcs-tab"));
    }).on('valid.fndtn.abide', function(e) {
        // Fix for valid event firing twice
        if(e.namespace != 'abide.fndtn') {
            return;
        }

        if ($('#create_vdc_form_advanced',dialog).attr("action") == "create") {

            var template = $('textarea#template',dialog).val();
            var vdc_json = {vdc: {vdc_raw: template}};
            Sunstone.runAction("Vdc.create",vdc_json);
            return false;

        } else if ($('#create_vdc_form_advanced',dialog).attr("action") == "update") {
            var template_raw = $('textarea#template',dialog).val();

            Sunstone.runAction("Vdc.update",vdc_to_update_id,template_raw);
            return false;
          }
    });

    setupTips(dialog);
}

function fillVdcUpdateFormPanel(vdc, dialog){

    // Populates the Avanced mode Tab
    $('#template',dialog).val(convert_template_to_string(vdc.TEMPLATE).replace(/^[\r\n]+$/g, ""));

    $('[wizard_field="NAME"]',dialog).val(
        escapeDoubleQuotes(htmlDecode( vdc.NAME ))).
        prop("disabled", true).
        prop('wizard_field_disabled', true);

    fillWizardFields($("#vdcCreateGeneralTab", dialog), vdc.TEMPLATE);

    // Delete so these attributes don't end in the custom tags table also
    var fields = $('[wizard_field]', dialog);

    fields.each(function(){
        var field = $(this);
        var field_name = field.attr('wizard_field');

        delete vdc.TEMPLATE[field_name];
    });

    fillCustomTags($("#vdcCreateGeneralTab", dialog), vdc.TEMPLATE);

    // Fill groups table

    var group_ids = vdc.GROUPS.ID;

    if (typeof group_ids == 'string')
    {
        group_ids = [group_ids];
    }

    var original_groups_list = [];

    if (group_ids)
    {
        original_groups_list = group_ids;
        selectGroupTableSelect(dialog, "vdc_wizard_groups", { ids : group_ids });
    }

    dialog.data("original_groups_list", original_groups_list);

    // Fill resource tables

    var resources = indexedVdcResources(vdc);

    var zone_ids = [];

    OpenNebula.Zone.list({
        timeout: true,
        success: function (request, obj_list){
            $.each(obj_list,function(){
                var zone_id = this.ZONE.ID;

                zone_ids.push(zone_id);

                addVdcResourceTab(
                    "vdc_update_wizard",
                    zone_id,
                    this.ZONE.NAME,
                    $("#vdcCreateResourcesTab",dialog));

                var unique_id = 'vdc_update_wizard_' + zone_id;
                var zone_section = $('#vdcCreateResourcesTab', dialog);

                if (resources[zone_id] == undefined){
                    resources[zone_id] = {
                        clusters   : [],
                        hosts      : [],
                        vnets      : [],
                        datastores : []
                    }
                }

                var resources_zone = resources[zone_id];

                if(resources_zone.clusters.length == 1 && resources_zone.clusters[0] == VDC_ALL_RESOURCES){
                    $("#all_clusters_"+unique_id, zone_section).click();
                }else{
                    selectClusterTableSelect(
                        zone_section, "vdc_clusters_"+unique_id,
                        { ids : resources_zone.clusters });
                }

                if(resources_zone.hosts.length == 1 && resources_zone.hosts[0] == VDC_ALL_RESOURCES){
                    $("#all_hosts_"+unique_id, zone_section).click();
                }else{
                    selectHostTableSelect(
                        zone_section, "vdc_hosts_"+unique_id,
                        { ids : resources_zone.hosts });
                }

                if(resources_zone.vnets.length == 1 && resources_zone.vnets[0] == VDC_ALL_RESOURCES){
                    $("#all_vnets_"+unique_id, zone_section).click();
                }else{
                    selectVNetTableSelect(
                        zone_section, "vdc_vnets_"+unique_id,
                        { ids : resources_zone.vnets });
                }

                if(resources_zone.datastores.length == 1 && resources_zone.datastores[0] == VDC_ALL_RESOURCES){
                    $("#all_datastores_"+unique_id, zone_section).click();
                }else{
                    selectDatastoreTableSelect(
                        zone_section, "vdc_datastores_"+unique_id,
                        { ids : resources_zone.datastores });
                }
            });

            setupVdcResourceTab("vdc_update_wizard",
                            $("#vdcCreateResourcesTab",dialog));

            dialog.data("original_resources", resources);
            dialog.data("zone_ids", zone_ids);

        },
        error: onError
    });
}

function vdcResourceTabHeader(){
    var html =
      '<div class="row">\
        <div class="medium-4 columns">\
          <h5>' + tr("Zone") +'</h5>\
        </div>\
        <div class="medium-4 columns end">\
          <select class="vdc_zones_select">\
          </select>\
        </div>\
      </div>\
      <div class="row">\
        <div class="large-12 columns">\
          <div class="tabs-content vdc_zones_tabs_content"></div>\
        </div>\
      </div>';

    return html;
}

/*
Return an object with the VDC resources indexed by zone_id.

    {   zone_id :
        {   clusters   : [],
            hosts      : [],
            vnets      : [],
            datastores : []
        }
    }
*/
function indexedVdcResources(vdc){
    var resources = {};

    var clusters_array = [];
    var hosts_array = [];
    var vnets_array = [];
    var datastores_array = [];

    if (vdc.CLUSTERS.CLUSTER){
        clusters_array = vdc.CLUSTERS.CLUSTER;

        if (!$.isArray(clusters_array)){
            clusters_array = [clusters_array];
        }
    }

    if (vdc.HOSTS.HOST){
        hosts_array = vdc.HOSTS.HOST;

        if (!$.isArray(hosts_array)){
            hosts_array = [hosts_array];
        }
    }

    if (vdc.VNETS.VNET){
        vnets_array = vdc.VNETS.VNET;

        if (!$.isArray(vnets_array)){
            vnets_array = [vnets_array];
        }
    }

    if (vdc.DATASTORES.DATASTORE){
        datastores_array = vdc.DATASTORES.DATASTORE;

        if (!$.isArray(datastores_array)){
            datastores_array = [datastores_array];
        }
    }

    function init_resources_zone(zone_id){
        if (resources[zone_id] == undefined){
            resources[zone_id] = {
                clusters   : [],
                hosts      : [],
                vnets      : [],
                datastores : []
            }
        }
    }

    $.each(clusters_array, function(i,e){
        init_resources_zone(e.ZONE_ID);
        resources[e.ZONE_ID].clusters.push(e.CLUSTER_ID);
    });

    $.each(hosts_array, function(i,e){
        init_resources_zone(e.ZONE_ID);
        resources[e.ZONE_ID].hosts.push(e.HOST_ID);
    });

    $.each(vnets_array, function(i,e){
        init_resources_zone(e.ZONE_ID);
        resources[e.ZONE_ID].vnets.push(e.VNET_ID);
    });

    $.each(datastores_array, function(i,e){
        init_resources_zone(e.ZONE_ID);
        resources[e.ZONE_ID].datastores.push(e.DATASTORE_ID);
    });

    return resources;
}

function addVdcResourceTab(unique_id_prefix, zone_id, zone_name, context, indexed_resources) {

    var unique_id = unique_id_prefix+'_'+zone_id;

    // Append the new div containing the tab and add the tab to the list
    var html_tab_content = '<div id="'+unique_id+'Tab" class="vdc_zone_content">'+
        generateVdcResourceTabContent(unique_id, zone_id) +
        '</div>'
    $(html_tab_content).appendTo($(".vdc_zones_tabs_content", context));

    $("select.vdc_zones_select", context).append('<option value="'+zone_id+'">'+zone_name+'</option>');

    var zone_section = $('#' +unique_id+'Tab', context);

    zone_section.foundation();

    $.each(["clusters", "hosts", "vnets", "datastores"], function(i,res_name){
        $("input[name='all_"+res_name+"_"+unique_id+"']", zone_section).change(function(){
            if ($(this).prop("checked")){
                $("div.vdc_"+res_name+"_select", zone_section).hide();
            } else {
                $("div.vdc_"+res_name+"_select", zone_section).show();
            }
        });
    });

    var opts = {};

    if(indexed_resources != undefined && indexed_resources[zone_id] != undefined){
        var resources = indexed_resources[zone_id];

        $.each(["clusters", "hosts", "vnets", "datastores"], function(i,res_name){
            opts[res_name] = { read_only: true, zone_id: zone_id };

            if (resources[res_name].length == 1 && resources[res_name][0] == VDC_ALL_RESOURCES){
                $("#all_"+res_name+"_"+unique_id).prop("checked", "checked");
            } else {
                opts[res_name].fixed_ids = resources[res_name];
            }

            $("#all_"+res_name+"_"+unique_id).prop("disabled", true);
        });

    } else {
        $.each(["clusters", "hosts", "vnets", "datastores"], function(i,res_name){
            opts[res_name] = {multiple_choice: true, zone_id: zone_id};
        });
    }

    setupClusterTableSelect(zone_section, "vdc_clusters_"+unique_id, opts["clusters"]);
    setupHostTableSelect(zone_section, "vdc_hosts_"+unique_id, opts["hosts"]);
    setupVNetTableSelect(zone_section, "vdc_vnets_"+unique_id, opts["vnets"]);
    setupDatastoreTableSelect(zone_section, "vdc_datastores_"+unique_id, opts["datastores"]);

    refreshClusterTableSelect(zone_section, "vdc_clusters_"+unique_id);
    refreshHostTableSelect(zone_section, "vdc_hosts_"+unique_id);
    refreshVNetTableSelect(zone_section, "vdc_vnets_"+unique_id);
    refreshDatastoreTableSelect(zone_section, "vdc_datastores_"+unique_id);
}

function setupVdcResourceTab(unique_id_prefix, context){
    $("select.vdc_zones_select", context).change(function(){
        context.find(".vdc_zone_content").hide();
        $('div#'+unique_id_prefix+'_'+$(this).val()+'Tab', context).show();
    });

    $("select.vdc_zones_select", context)[0].selectedIndex = 0;
    $("select.vdc_zones_select", context).change();
}

function generateVdcResourceTabContent(unique_id, zone_id){
     var html =
    '<div class="row">\
      <div class="large-12 columns">\
        <dl class="tabs right-info-tabs text-center" data-tab>\
          <dd class="active"><a href="#vdcClustersTab_'+unique_id+'"><i class="fa fa-th"></i><br>'+tr("Clusters")+'</a></dd>\
          <dd><a href="#vdcHostsTab_'+unique_id+'"><i class="fa fa-hdd-o"></i><br>'+tr("Hosts")+'</a></dd>\
          <dd><a href="#vdcVnetsTab_'+unique_id+'"><i class="fa fa-globe"></i><br>'+tr("VNets")+'</a></dd>\
          <dd><a href="#vdcDatastoresTab_'+unique_id+'"><i class="fa fa-folder-open"></i><br>'+tr("Datastores")+'</a></dd>\
        </dl>\
        <div class="tabs-content">\
          <div class="content active" id="vdcClustersTab_'+unique_id+'" class="content">\
            <div class="row">\
              <div class="large-12 columns">\
                <label for="all_clusters_'+unique_id+'">\
                  <input type="checkbox" name="all_clusters_'+unique_id+'" id="all_clusters_'+unique_id+'" />\
                  '+tr("All")+'\
                  <span class="tip">'+tr("Selects all current and future clusters")+'</span>\
                </label>\
              </div>\
            </div>\
            <div class="vdc_clusters_select">\
              '+generateClusterTableSelect("vdc_clusters_"+unique_id)+'\
            </div>\
          </div>\
          <div id="vdcHostsTab_'+unique_id+'" class="content">\
            <div class="row">\
              <div class="large-12 columns">\
                <label for="all_hosts_'+unique_id+'">\
                  <input type="checkbox" name="all_hosts_'+unique_id+'" id="all_hosts_'+unique_id+'" />\
                  '+tr("All")+'\
                  <span class="tip">'+tr("Selects all current and future hosts")+'</span>\
                </label>\
              </div>\
            </div>\
            <div class="vdc_hosts_select">\
              '+generateHostTableSelect("vdc_hosts_"+unique_id)+'\
            </div>\
          </div>\
          <div id="vdcVnetsTab_'+unique_id+'" class="content">\
            <div class="row">\
              <div class="large-12 columns">\
                <label for="all_vnets_'+unique_id+'">\
                  <input type="checkbox" name="all_vnets_'+unique_id+'" id="all_vnets_'+unique_id+'" />\
                  '+tr("All")+'\
                  <span class="tip">'+tr("Selects all current and future vnets")+'</span>\
                </label>\
              </div>\
            </div>\
            <div class="vdc_vnets_select">\
              '+generateVNetTableSelect("vdc_vnets_"+unique_id)+'\
            </div>\
          </div>\
          <div id="vdcDatastoresTab_'+unique_id+'" class="content">\
            <div class="row">\
              <div class="large-12 columns">\
                <label for="all_datastores_'+unique_id+'">\
                  <input type="checkbox" name="all_datastores_'+unique_id+'" id="all_datastores_'+unique_id+'" />\
                  '+tr("All")+'\
                  <span class="tip">'+tr("Selects all current and future datastores")+'</span>\
                </label>\
              </div>\
            </div>\
            <div class="vdc_datastores_select">\
              '+generateDatastoreTableSelect("vdc_datastores_"+unique_id)+'\
            </div>\
          </div>\
        </div>\
      </div>\
    </div>';

    return html;
}

/*
Return an object with the selected VDC resources in the zone tab
    {   clusters   : [],
        hosts      : [],
        vnets      : [],
        datastores : []
    }
*/
function retrieveVdcResourceTab(unique_id_prefix, zone_id, context) {
    var clusters;
    var hosts;
    var vnets;
    var datastores;

    var unique_id = unique_id_prefix+'_'+zone_id;

    if ( $("input[name='all_clusters_"+unique_id+"']", context).prop("checked") ){
        clusters = [VDC_ALL_RESOURCES];
    } else {
        clusters = retrieveClusterTableSelect(
                        $("#vdcCreateResourcesTab",context),
                        "vdc_clusters_"+unique_id);
    }

    if ( $("input[name='all_hosts_"+unique_id+"']", context).prop("checked") ){
        hosts = [VDC_ALL_RESOURCES];
    } else {
        hosts = retrieveHostTableSelect(
                        $("#vdcCreateResourcesTab",context),
                        "vdc_hosts_"+unique_id);
    }

    if ( $("input[name='all_vnets_"+unique_id+"']", context).prop("checked") ){
        vnets = [VDC_ALL_RESOURCES];
    } else {
        vnets = retrieveVNetTableSelect(
                        $("#vdcCreateResourcesTab",context),
                        "vdc_vnets_"+unique_id);
    }

    if ( $("input[name='all_datastores_"+unique_id+"']", context).prop("checked") ){
        datastores = [VDC_ALL_RESOURCES];
    } else {
        datastores = retrieveDatastoreTableSelect(
                        $("#vdcCreateResourcesTab",context),
                        "vdc_datastores_"+unique_id);
    }

    var resources = {
        clusters   : clusters,
        hosts      : hosts,
        vnets      : vnets,
        datastores : datastores
    }

    return resources;
}

//The DOM is ready and the ready() from sunstone.js
//has been executed at this point.
$(document).ready(function(){
    var tab_name = 'vdcs-tab';

    if (Config.isTabEnabled(tab_name)) {
      dataTable_vdcs = $("#datatable_vdcs",main_tabs_context).dataTable({
            "bSortClasses": false,
            "bDeferRender": true,
            "aoColumnDefs": [
              { "bSortable": false, "aTargets": ["check"] },
              { "sWidth": "35px", "aTargets": [0] },
              { "bVisible": true, "aTargets": Config.tabTableColumns(tab_name)},
              { "bVisible": false, "aTargets": ['_all']}
          ]
      });

      $('#vdc_search').keyup(function(){
        dataTable_vdcs.fnFilter( $(this).val() );
      })

      dataTable_vdcs.on('draw', function(){
        recountCheckboxes(dataTable_vdcs);
      })

      Sunstone.runAction("Vdc.list");

      initCheckAllBoxes(dataTable_vdcs);
      tableCheckboxesListener(dataTable_vdcs);
      infoListener(dataTable_vdcs,'Vdc.show');

      $('div#vdcs_tab div.legend_div').hide();

      dataTable_vdcs.fnSort( [ [1,config['user_config']['table_order']] ] );
    }
});
