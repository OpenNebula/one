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
                  <span class="tip">'+tr("Name that the Virtual Data Center will get for description purposes.")+'</span>\
                </label>\
                <input type="text" wizard_field="NAME" required name="name" id="name"/>\
              </div>\
            </div>\
            <div class="row">\
              <div class="large-6 columns">\
                <label for="DESCRIPTION" >' + tr("Description") + ':\
                  <span class="tip">'+tr("Description of the Virtual Data Center")+'</span>\
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
            <div class="row">\
              <div class="large-12 columns">\
                <h5>' + tr("Zones") +'</h5>\
              </div>\
            </div>\
            <div class="row">\
              <div class="large-12 columns">\
                <dl class="tabs" id="vdc_zones_tabs" data-tab></dl>\
                <div class="tabs-content vdc_zones_tabs_content"></div>\
              </div>\
            </div>\
          </div>\
        </div>\
      </div>\
    </form>';


var create_vdc_advanced_html =
 '<form data-abide="ajax" id="create_vdc_form_advanced" class="custom creation">' +
    '<div class="row">' +
      '<div class="large-12 columns">' +
        '<p>'+tr("Write the Virtual Data Center template here")+'</p>' +
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

            Sunstone.runAction('Vdc.show',request.request.data[0][0]);

            addVdcElement(request, response);
            notifyCustom(tr("Virtual Data Center created"), " ID: " + response.VDC.ID, false);
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

                            addVdcResourceTab(this.ZONE.ID,
                                this.ZONE.NAME,
                                context);
                        });

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
                notifyMessage("Please select one (and just one) Virtual Data Center to update.");
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

            notifyMessage(tr("Virtual Data Center updated correctly"));
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
        title: tr("Virtual Data Center information"),
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
    title: tr("Virtual Data Centers"),
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

    return [
        '<input class="check_item" type="checkbox" id="vdc_'+vdc.ID+'" name="selected_items" value="'+vdc.ID+'"/>',
        vdc.ID,
        vdc.NAME
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

    var html =
    '<form id="vdc_group_list_form" vdcid="'+vdc_info.ID+'">';

    html +=
        '<div class="row collapse">\
          <div class="large-12 columns">';

    html += '<span class="right">';

    html += '</span></div></div>';

    html += '<div class="row collapse">\
        '+generateGroupTableSelect("vdc_group_list")+'\
      </div>\
    </form>';

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

    var clusters_array = [];
    var hosts_array = [];
    var vnets_array = [];
    var datastores_array = [];

    if (vdc_info.CLUSTERS.CLUSTER){
        clusters_array = vdc_info.CLUSTERS.CLUSTER;

        if (!$.isArray(clusters_array)){
            clusters_array = [clusters_array];
        }
    }

    if (vdc_info.HOSTS.HOST){
        hosts_array = vdc_info.HOSTS.HOST;

        if (!$.isArray(hosts_array)){
            hosts_array = [hosts_array];
        }
    }

    if (vdc_info.VNETS.VNET){
        vnets_array = vdc_info.VNETS.VNET;

        if (!$.isArray(vnets_array)){
            vnets_array = [vnets_array];
        }
    }

    if (vdc_info.DATASTORES.DATASTORE){
        datastores_array = vdc_info.DATASTORES.DATASTORE;

        if (!$.isArray(datastores_array)){
            datastores_array = [datastores_array];
        }
    }

    var html =
        '<div class="row">\
          <div class="large-6 columns">\
            <table class="dataTable extended_table">\
              <thead>\
                <tr>\
                  <th>' + tr("Zone ID") + '</th>\
                  <th>' + tr("Cluster ID") + '</th>\
                </tr>\
              </thead>\
              <tbody>';

    $.each(clusters_array, function(i,e){
        html +=
            '<tr>\
              <td>' + e.ZONE_ID + '</td>\
              <td>' + e.CLUSTER_ID + '</td>\
            </tr>';
    });

    html +=
              '</tbody>\
            </table>\
          </div>\
        </div>\
        <div class="row">\
          <div class="large-6 columns">\
            <table class="dataTable extended_table">\
              <thead>\
                <tr>\
                  <th>' + tr("Zone ID") + '</th>\
                  <th>' + tr("Host ID") + '</th>\
                </tr>\
              </thead>\
              <tbody>';

    $.each(hosts_array, function(i,e){
        html +=
            '<tr>\
              <td>' + e.ZONE_ID + '</td>\
              <td>' + e.HOST_ID + '</td>\
            </tr>';
    });

    html +=
              '</tbody>\
            </table>\
          </div>\
        </div>\
        <div class="row">\
          <div class="large-6 columns">\
            <table class="dataTable extended_table">\
              <thead>\
                <tr>\
                  <th>' + tr("Zone ID") + '</th>\
                  <th>' + tr("VNet ID") + '</th>\
                </tr>\
              </thead>\
              <tbody>';

    $.each(vnets_array, function(i,e){
        html +=
            '<tr>\
              <td>' + e.ZONE_ID + '</td>\
              <td>' + e.VNET_ID + '</td>\
            </tr>';
    });

    html +=
              '</tbody>\
            </table>\
          </div>\
        </div>\
        <div class="row">\
          <div class="large-6 columns">\
            <table class="dataTable extended_table">\
              <thead>\
                <tr>\
                  <th>' + tr("Zone ID") + '</th>\
                  <th>' + tr("Datastore ID") + '</th>\
                </tr>\
              </thead>\
              <tbody>';

    $.each(datastores_array, function(i,e){
        html +=
            '<tr>\
              <td>' + e.ZONE_ID + '</td>\
              <td>' + e.DATASTORE_ID + '</td>\
            </tr>';
    });

    html +=
              '</tbody>\
            </table>\
          </div>\
        </div>'

    return html;
}

function setup_vdc_resources_tab_content(vdc_info){
}

function initialize_create_vdc_dialog(dialog) {

    setupCustomTags($("#vdcCreateGeneralTab", dialog));

    setupGroupTableSelect(dialog, "vdc_wizard_groups", {multiple_choice: true});

    dialog.foundation();

    //Process form
    $('#create_vdc_form_wizard',dialog).on('invalid.fndtn.abide', function () {
        notifyError(tr("One or more required fields are missing or malformed."));
        popFormDialog("create_vdc_form", $("#vdcs-tab"));
    }).on('valid.fndtn.abide', function() {
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
                var selected_clusters = retrieveClusterTableSelect(dialog, "vdc_wizard_clusters_zone_"+this);
                $.each(selected_clusters,function(j,cluster_id){
                    clusters.push({zone_id: zone_id, cluster_id: cluster_id});
                });

                var selected_hosts = retrieveHostTableSelect(dialog, "vdc_wizard_hosts_zone_"+this);
                $.each(selected_hosts,function(j,host_id){
                    hosts.push({zone_id: zone_id, host_id: host_id});
                });

                var selected_vnets = retrieveVNetTableSelect(dialog, "vdc_wizard_vnets_zone_"+this);
                $.each(selected_vnets,function(j,vnet_id){
                    vnets.push({zone_id: zone_id, vnet_id: vnet_id});
                });

                var selected_datastores = retrieveDatastoreTableSelect(dialog, "vdc_wizard_datastores_zone_"+this);
                $.each(selected_datastores,function(j,ds_id){
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
                var selected_clusters   = retrieveClusterTableSelect(dialog, "vdc_wizard_clusters_zone_"+zone_id);
                var selected_hosts      = retrieveHostTableSelect(dialog, "vdc_wizard_hosts_zone_"+zone_id);
                var selected_vnets      = retrieveVNetTableSelect(dialog, "vdc_wizard_vnets_zone_"+zone_id);
                var selected_datastores = retrieveDatastoreTableSelect(dialog, "vdc_wizard_datastores_zone_"+zone_id);

                var original_clusters   = original_resources[zone_id].clusters_list;
                var original_hosts      = original_resources[zone_id].hosts_list;
                var original_vnets      = original_resources[zone_id].vnets_list;
                var original_datastores = original_resources[zone_id].datastores_list;

                $.each(selected_clusters, function(i,cluster_id){
                    if (original_clusters.indexOf(cluster_id) == -1){
                        Sunstone.runAction(
                            "Vdc.add_cluster",
                            vdc_to_update_id,
                            {zone_id: zone_id, cluster_id: cluster_id});
                    }
                });

                $.each(original_clusters, function(i,cluster_id){
                    if (selected_clusters.indexOf(cluster_id) == -1){
                        Sunstone.runAction(
                            "Vdc.del_cluster",
                            vdc_to_update_id,
                            {zone_id: zone_id, cluster_id: cluster_id});
                    }
                });

                $.each(selected_hosts, function(i,host_id){
                    if (original_hosts.indexOf(host_id) == -1){
                        Sunstone.runAction(
                            "Vdc.add_host",
                            vdc_to_update_id,
                            {zone_id: zone_id, host_id: host_id});
                    }
                });

                $.each(original_hosts, function(i,host_id){
                    if (selected_hosts.indexOf(host_id) == -1){
                        Sunstone.runAction(
                            "Vdc.del_host",
                            vdc_to_update_id,
                            {zone_id: zone_id, host_id: host_id});
                    }
                });

                $.each(selected_vnets, function(i,vnet_id){
                    if (original_vnets.indexOf(vnet_id) == -1){
                        Sunstone.runAction(
                            "Vdc.add_vnet",
                            vdc_to_update_id,
                            {zone_id: zone_id, vnet_id: vnet_id});
                    }
                });

                $.each(original_vnets, function(i,vnet_id){
                    if (selected_vnets.indexOf(vnet_id) == -1){
                        Sunstone.runAction(
                            "Vdc.del_vnet",
                            vdc_to_update_id,
                            {zone_id: zone_id, vnet_id: vnet_id});
                    }
                });

                $.each(selected_datastores, function(i,ds_id){
                    if (original_datastores.indexOf(ds_id) == -1){
                        Sunstone.runAction(
                            "Vdc.add_datastore",
                            vdc_to_update_id,
                            {zone_id: zone_id, ds_id: ds_id});
                    }
                });

                $.each(original_datastores, function(i,ds_id){
                    if (selected_datastores.indexOf(ds_id) == -1){
                        Sunstone.runAction(
                            "Vdc.del_datastore",
                            vdc_to_update_id,
                            {zone_id: zone_id, ds_id: ds_id});
                    }
                });
            }

            Sunstone.runAction("Vdc.update", vdc_to_update_id, convert_template_to_string(vdc_json));
            return false;
        }
    });

    $('#create_vdc_form_advanced',dialog).on('invalid.fndtn.abide', function () {
        notifyError(tr("One or more required fields are missing or malformed."));
        popFormDialog("create_vdc_form", $("#vdcs-tab"));
    }).on('valid.fndtn.abide', function() {
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

    var clusters_array = [];
    var hosts_array = [];
    var vnets_array = [];
    var datastores_array = [];

    if (vdc != undefined){
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
    }

    var zone_ids = [];

    OpenNebula.Zone.list({
        timeout: true,
        success: function (request, obj_list){
            var resources = {};

            $.each(obj_list,function(){
                var zone_id = this.ZONE.ID;

                zone_ids.push(zone_id);

                addVdcResourceTab(zone_id,
                    this.ZONE.NAME,
                    dialog);

                // Filter the resources for this zone only

                var cluster_ids = [];
                $.each(clusters_array, function(i,e){
                    if(e.ZONE_ID == zone_id){
                        cluster_ids.push(e.CLUSTER_ID);
                    }
                });

                var host_ids = [];
                $.each(hosts_array, function(i,e){
                    if(e.ZONE_ID == zone_id){
                        host_ids.push(e.HOST_ID);
                    }
                });

                var vnet_ids = [];
                $.each(vnets_array, function(i,e){
                    if(e.ZONE_ID == zone_id){
                        vnet_ids.push(e.VNET_ID);
                    }
                });

                var datastore_ids = [];
                $.each(datastores_array, function(i,e){
                    if(e.ZONE_ID == zone_id){
                        datastore_ids.push(e.DATASTORE_ID);
                    }
                });

                resources[zone_id] = {
                    clusters_list   : cluster_ids,
                    hosts_list      : host_ids,
                    vnets_list      : vnet_ids,
                    datastores_list : datastore_ids
                };

                selectClusterTableSelect(dialog, "vdc_wizard_clusters_zone_"+zone_id, { ids : cluster_ids });
                selectHostTableSelect(dialog, "vdc_wizard_hosts_zone_"+zone_id, { ids : host_ids });
                selectVNetTableSelect(dialog, "vdc_wizard_vnets_zone_"+zone_id, { ids : vnet_ids });
                selectDatastoreTableSelect(dialog, "vdc_wizard_datastores_zone_"+zone_id, { ids : datastore_ids });
            });

            dialog.data("original_resources", resources);
            dialog.data("zone_ids", zone_ids);

        },
        error: onError
    });
}

function addVdcResourceTab(zone_id, zone_name, dialog, vdc) {
    var str_zone_tab_id  = dialog.attr('id') + '_zone' + zone_id;

    // Append the new div containing the tab and add the tab to the list
    var html_tab_content = '<div id="'+str_zone_tab_id+'Tab" class="content">'+
        generateVdcResourceTabContent(str_zone_tab_id, zone_id) +
        '</div>'
    $(html_tab_content).appendTo($(".vdc_zones_tabs_content", dialog));

    var a = $("<dd>\
        <a id='zone_tab"+str_zone_tab_id+"' href='#"+str_zone_tab_id+"Tab'>"+zone_name+"</a>\
        </dd>").appendTo($("dl#vdc_zones_tabs", dialog));

    var zone_section = $('#' +str_zone_tab_id+'Tab', dialog);

    zone_section.foundation();

    $("dl#vdc_zones_tabs", dialog).children("dd").first().children("a").click();

    setupClusterTableSelect(zone_section, "vdc_wizard_clusters_zone_"+zone_id, {multiple_choice: true, zone_id: zone_id});
    setupHostTableSelect(zone_section, "vdc_wizard_hosts_zone_"+zone_id, {multiple_choice: true, zone_id: zone_id});
    setupVNetTableSelect(zone_section, "vdc_wizard_vnets_zone_"+zone_id, {multiple_choice: true, zone_id: zone_id});
    setupDatastoreTableSelect(zone_section, "vdc_wizard_datastores_zone_"+zone_id, {multiple_choice: true, zone_id: zone_id});

    refreshClusterTableSelect(zone_section, "vdc_wizard_clusters_zone_"+zone_id);
    refreshHostTableSelect(zone_section, "vdc_wizard_hosts_zone_"+zone_id);
    refreshVNetTableSelect(zone_section, "vdc_wizard_vnets_zone_"+zone_id);
    refreshDatastoreTableSelect(zone_section, "vdc_wizard_datastores_zone_"+zone_id);
}

function generateVdcResourceTabContent(str_zone_tab_id, zone_id){
    var html =
    '<div class="row">\
      <div class="large-12 columns">\
        <dl class="tabs right-info-tabs text-center" data-tab>\
          <dd class="active"><a href="#vdcCreateClustersTab_'+zone_id+'"><i class="fa fa-th"></i><br>'+tr("Clusters")+'</a></dd>\
          <dd><a href="#vdcCreateHostsTab_'+zone_id+'"><i class="fa fa-hdd-o"></i><br>'+tr("Hosts")+'</a></dd>\
          <dd><a href="#vdcCreateVnetsTab_'+zone_id+'"><i class="fa fa-globe"></i><br>'+tr("VNets")+'</a></dd>\
          <dd><a href="#vdcCreateDatastoresTab_'+zone_id+'"><i class="fa fa-folder-open"></i><br>'+tr("Datastores")+'</a></dd>\
        </dl>\
        <div class="tabs-content">\
          <div class="content active" id="vdcCreateClustersTab_'+zone_id+'" class="content">\
            '+generateClusterTableSelect("vdc_wizard_clusters_zone_"+zone_id)+'\
          </div>\
          <div id="vdcCreateHostsTab_'+zone_id+'" class="content">\
            '+generateHostTableSelect("vdc_wizard_hosts_zone_"+zone_id)+'\
          </div>\
          <div id="vdcCreateVnetsTab_'+zone_id+'" class="content">\
            '+generateVNetTableSelect("vdc_wizard_vnets_zone_"+zone_id)+'\
          </div>\
          <div id="vdcCreateDatastoresTab_'+zone_id+'" class="content">\
            '+generateDatastoreTableSelect("vdc_wizard_datastores_zone_"+zone_id)+'\
          </div>\
        </div>\
      </div>\
    </div>';

    return html;
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
