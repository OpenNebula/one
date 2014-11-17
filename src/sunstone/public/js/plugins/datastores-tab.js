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

var create_datastore_tmpl =
'<div class="row">'+
  '<div class="large-5 columns">'+
    '<h3 id="create_cluster_header" class="subheader">'+tr("Create Datastore")+'</h3>'+
  '</div>'+
  '<div class="large-7 columns">'+
    '<dl class="tabs right wizard_tabs" data-tab>\
        <dd class="active"><a href="#datastore_easyTab">'+tr("Wizard")+'</a></dd>\
        <dd><a href="#datastore_manualTab">'+tr("Advanced mode")+'</a></dd>\
    </dl>\
  </div>\
</div>\
<div class="reveal-body">\
  <form id="create_datastore_form" action="" class="creation">\
    <div class="tabs-content">\
      <div id="datastore_easyTab" class="active content">\
        <div class="row">\
          <div class="large-6 columns">\
            <label for="name" >' + tr("Name") + ':</label>\
            <input type="text" name="name" id="name"/>\
          </div>\
        </div>\
        <div class="row">\
          <div class="large-6 columns">\
            <label for="presets">' + tr("Presets") + '</label>\
            <select id="presets" name="presets">\
              <option value="fs">' + tr("Filesystem") + '</option>\
              <option value="vmware_vmfs">' + tr("VMware VMFS") + '</option>\
              <option value="block_lvm">' + tr("Block LVM") + '</option>\
              <option value="fs_lvm">' + tr("FS LVM") + '</option>\
              <option value="ceph">' + tr("Ceph") + '</option>\
              <option value="gluster">' + tr("Gluster") + '</option>\
              <option value="dev">' + tr("Devices") + '</option>\
              <option value="custom">' + tr("Custom") + '</option>\
            </select>\
          </div>\
          <div class="large-6 columns">\
            <label for="cluster">' + tr("Cluster") + '</label>\
            <div id="cluster_id" name="cluster_id">\
            </div>\
          </div>\
        </div>\
        <div class="row">\
          <div class="large-12 columns">\
              <fieldset>\
                <legend>' + tr("Type") + '</legend>\
                  <div class="large-12 columns text-center">\
                    <input id="image_ds_type" type="radio" name="ds_type" value="IMAGE_DS" checked/><label for="image_ds_type">' + tr("Images") + '</label>\
                    <input id="system_ds_type" type="radio" name="ds_type" value="SYSTEM_DS" /><label for="system_ds_type">' + tr("System") + '</label>\
                    <input id="file_ds_type" type="radio" name="ds_type" value="FILE_DS" /><label for="file_ds_type">' + tr("Files") + '</label>\
                  </div>\
              </fieldset>\
          </div>\
        </div>\
        <div class="row">\
          <div class="large-12 columns">\
            <fieldset>\
              <legend>' + tr("Managers") + '</legend>\
              <div class="large-6 columns">\
                <label for="ds_mad">' + tr("Datastore") + '</label>\
                <select id="ds_mad" name="ds_mad">\
                  <option value="fs">' + tr("Filesystem") + '</option>\
                  <option value="vmware">' + tr("VMware") + '</option>\
                  <option value="lvm">' + tr("LVM") + '</option>\
                  <option value="vmfs">' + tr("VMFS") + '</option>\
                  <option value="ceph">' + tr("Ceph") + '</option>\
                  <option value="dev">' + tr("Devices") + '</option>\
                  <option value="custom">' + tr("Custom") + '</option>\
                </select>\
                <div>\
                  <label>' + tr("Custom DS_MAD") + ':</label>\
                  <input type="text" name="ds_tab_custom_ds_mad" />\
                </div>\
              </div>\
              <div class="large-6 columns">\
                <label for="tm_mad">' + tr("Transfer") + ':</label>\
                <select id="tm_mad" name="tm_mad">\
                  <option value="shared">' + tr("Shared") + '</option>\
                  <option value="ssh">' + tr("SSH") + '</option>\
                  <option value="qcow2">' + tr("qcow2") + '</option>\
                  <option value="lvm">' + tr("LVM") + '</option>\
                  <option value="fs_lvm">' + tr("FS LVM") + '</option>\
                  <option value="vmfs">' + tr("VMFS") + '</option>\
                  <option value="ceph">' + tr("Ceph") + '</option>\
                  <option value="dev">' + tr("Devices") + '</option>\
                  <option value="custom">' + tr("Custom") + '</option>\
                </select>\
                <div>\
                  <label>' + tr("Custom TM_MAD") + ':</label>\
                  <input type="text" name="ds_tab_custom_tm_mad" />\
                </div>\
              </div>\
            </fieldset>\
          </div>\
        </div>\
        <div class="row">\
          <div class="large-6 columns">\
            <label for="disk_type">' + tr("Disk type") + ':</label>\
            <select id="disk_type" name="disk_type">\
              <option value="file">' + tr("File") + '</option>\
              <option value="block">' + tr("Block") + '</option>\
              <option value="RBD">' + tr("RBD") + '</option>\
              <option value="gluster">' + tr("Gluster") + '</option>\
            </select>\
          </div>\
        </div>\
        <div class="row">\
          <div class="large-12 columns">\
            <label for="safe_dirs">' + tr("Safe Directories") +
              '<span class="tip">'+tr("If you need to un-block a directory under one of the RESTRICTED_DIRS")+'</span>'+
            '</label>\
            <input type="text" name="safe_dirs" id="safe_dirs" />\
          </div>\
        </div>\
        <div class="row">\
          <div class="large-12 columns">\
            <label for="restricted_dirs">' + tr("Restricted Directories") +
              '<span class="tip">'+tr("Paths that can not be used to register images. A space separated list of paths. This will prevent users registering important files as VM images and accessing them thourgh their VMs. OpenNebula will automatically add its configuration directories: /var/lib/one, /etc/one and oneadmin's home ($HOME).")+'</span>'+
            '</label>\
            <input type="text" name="restricted_dirs" id="restricted_dirs" />\
          </div>\
        </div>\
        <div class="row">\
          <div class="large-12 columns">\
            <label for="bridge_list">' + tr("Host Bridge List") +
              '<span class="tip">'+tr("Space separated list of Server names or IPs where OpenNebula will be staging the new images into. This server will act as the entry point for new inmages in the datastore.")+'</span>'+
            '</label>\
            <input type="text" name="bridge_list" id="bridge_list" />\
          </div>\
        </div>\
        <div class="row">\
          <div class="large-6 columns">\
            <label for="base_path">' + tr("Base Path") +
              '<span class="tip">'+tr("When needed, the front-end will access the datastores using BASE_PATH (defaults to /var/lib/one/datastores).")+'</span>'+
            '</label>\
            <input type="text" name="base_path" id="base_path" />\
          </div>\
          <div class="large-6 columns">\
            <input id="ds_use_ssh" type="checkbox" name="ds_use_ssh" value="YES" /><label for="ds_use_ssh">' + tr("Use SSH for Datastore Manager") + '</label>\
          </div>\
          <div class="large-6 columns">\
            <input id="tm_use_ssh" type="checkbox" name="tm_use_ssh" value="YES" /><label class="inline" for="tm_use_ssh">' + tr("Use SSH for Transfer Manager") + '</label>\
          </div>\
          <div class="large-6 columns">\
            <label for="base_iqn">' + tr("Base IQN") + '</label>\
            <input type="text" name="base_iqn" id="base_iqn" />\
          </div>\
          <div class="large-6 columns">\
            <label for="vg_name">' + tr("Volume Group Name") + '</label>\
            <input type="text" name="vg_name" id="vg_name" />\
          </div>\
          <div class="large-6 columns">\
            <label for="limit_mb">' + tr("Limit") +
              '<span class="tip">'+tr("Optional limit, in MB. If set, OpenNebula will only use this amount of storage, instead of the whole free disk.")+'</span>'+
            '</label>\
            <input type="text" name="limit_mb" id="limit_mb" />\
          </div>\
        </div>\
        <div class="row">\
          <div class="large-6 columns">\
              <label for="gluster_host">' + tr("Gluster Host") +
                '<span class="tip">'+tr("Host and port of one (and only one) Gluster server (host:port)")+'</span>'+
              '</label>\
              <input type="text" name="gluster_host" id="gluster_host" />\
          </div>\
          <div class="large-6 columns">\
              <label for="gluster_volume">' + tr("Gluster Volume") +
                '<span class="tip">'+tr("Gluster volume to use for the datastore")+'</span>'+
              '</label>\
              <input type="text" name="gluster_volume" id="gluster_volume" />\
          </div>\
          <div class="large-6 columns">\
              <label for="pool_name">' + tr("Pool Name") +
                '<span class="tip">'+tr("The OpenNebula Ceph pool name. Defaults to 'one' (this pool must exist before using the drivers).")+'</span>'+
              '</label>\
              <input type="text" name="pool_name" id="pool_name" />\
          </div>\
          <div class="large-6 columns">\
              <label for="ceph_host">' + tr("Ceph Host") +
                '<span class="tip">'+tr("Space-separated list of Ceph monitors. Example: host1 host2:port2 host3 host4:port4 (if no port is specified, the default one is chosen) (Required for Libvirt 1.x when cephx is enabled).")+'</span>'+
              '</label>\
              <input type="text" name="ceph_host" id="ceph_host" />\
          </div>\
          <div class="large-6 columns">\
              <label for="ceph_secret">' + tr("Ceph Secret") +
                '<span class="tip">'+tr("A generated UUID for a LibVirt secret (to hold the CephX authentication key in Libvirt on each hypervisor). This should be generated when creating the Ceph datastore in OpenNebula. (Required for Libvirt 1.x when cephx is enabled).")+'</span>'+
              '</label>\
              <input type="text" name="ceph_secret" id="ceph_secret" />\
          </div>\
        </div>\
        <div class="reveal-footer">\
          <div class="form_buttons">\
              <button class="button radius right success" type="submit" id="create_datastore_submit" value="OpenNebula.Datastore.create">' + tr("Create") + '</button>\
              <button id="wizard_ds_reset_button" class="button radius secondary" type="reset" value="reset">' + tr("Reset") + '</button>\
          </div>\
        </div>\
      </div>\
      <div id="datastore_manualTab" class="content">\
        <div class="row">\
          <div class="columns large-6">\
             <label for="datastore_cluster_raw">'+tr("Cluster")+'</label>\
             <div id="datastore_cluster_raw" name="datastore_cluster_raw">\
             </div>\
          </div>\
        </div>\
        <div class="row">\
          <div class="columns large-12">\
               <textarea id="template" rows="15"></textarea>\
          </div>\
        </div>\
        <div class="reveal-footer">\
             <div class="form_buttons">\
               <button class="button success radius right" id="create_datastore_submit_manual" value="datastore/create">'+tr("Create")+'</button>\
               <button  id="advanced_ds_reset_button" class="button secondary radius" type="reset" value="reset">'+tr("Reset")+'</button>\
             </div>\
        </div>\
      </div>\
    </div>\
  </form>\
  <a class="close-reveal-modal">&#215;</a>\
</div>';

var datastore_image_table_tmpl='<thead>\
    <tr>\
      <th class="check"><input type="checkbox" class="check_all" value="">'+tr("All")+'</input></th>\
      <th>'+tr("ID")+'</th>\
      <th>'+tr("Owner")+'</th>\
      <th>'+tr("Group")+'</th>\
      <th>'+tr("Name")+'</th>\
      <th>'+tr("Datastore")+'</th>\
      <th>'+tr("Size")+'</th>\
      <th>'+tr("Type")+'</th>\
      <th>'+tr("Registration time")+'</th>\
      <th>'+tr("Persistent")+'</th>\
      <th>'+tr("Status")+'</th>\
      <th>'+tr("#VMS")+'</th>\
      <th>'+tr("Target")+'</th>\
    </tr>\
  </thead>\
  <tbody id="tbodyimages">\
  </tbody>'

var dataTable_datastores;
var $create_datastore_dialog;


/* -------- Image datatable -------- */

//Setup actions
var datastore_image_actions = {

    "DatastoreImageInfo.list" : {
        type:     "list",
        call:     OpenNebula.Image.list,
        callback: updateDatastoreImagesInfoView,
        error:    onError
    }
}

//callback to update the list of images for Create dialog
function updateDatastoreImagesInfoView (request,image_list){
    var image_list_array = [];

    $.each(image_list,function(){
      if (this.IMAGE.DATASTORE==datastore_name)
      {
        if(datastore_type=="IMAGE_DS"||datastore_type=="SYSTEM_DS")
          image_list_array.push(imageElementArray(this));
        else
          image_list_array.push(fileElementArray(this));
      }
    });

    updateView(image_list_array,dataTable_datastore_images_panel);
}

//Setup actions
var datastore_actions = {

    "Datastore.create" : {
        type: "create",
        call : OpenNebula.Datastore.create,
        callback : function(request, response) {
            // Reset the create wizard
            $create_datastore_dialog.foundation('reveal', 'close');
            $create_datastore_dialog.empty();
            setupCreateDatastoreDialog();

            addDatastoreElement(request, response);
            notifyCustom(tr("Datastore created"), " ID: " + response.DATASTORE.ID, false);
        },
        error : onError
    },

    "Datastore.create_dialog" : {
        type: "custom",
        call: popUpCreateDatastoreDialog
    },

    "Datastore.list" : {
        type: "list",
        call: OpenNebula.Datastore.list,
        callback: updateDatastoresView,
        error: onError
    },

    "Datastore.show" : {
        type: "single",
        call: OpenNebula.Datastore.show,
        callback: function(request, response) {
            updateDatastoreElement(request, response);
            if (Sunstone.rightInfoVisible($("#datastores-tab"))) {
                updateDatastoreInfo(request, response);
            }
        },
        error: onError
    },

    "Datastore.refresh" : {
        type: "custom",
        call: function(){
          var tab = dataTable_datastores.parents(".tab");
          if (Sunstone.rightInfoVisible(tab)) {
            Sunstone.runAction("Datastore.show", Sunstone.rightInfoResourceId(tab))
          } else {
            waitingNodes(dataTable_datastores);
            Sunstone.runAction("Datastore.list", {force: true});
          }
        },
        error: onError
    },


    "Datastore.fetch_permissions" : {
        type: "single",
        call: OpenNebula.Datastore.show,
        callback: function(request,element_json){
            var ds = element_json.DATASTORE;
            setPermissionsTable(ds,$(".datastore_permissions_table"));
        },
        error: onError
    },

    "Datastore.update_template" : {
        type: "single",
        call: OpenNebula.Datastore.update,
        callback: function(request) {
            Sunstone.runAction('Datastore.show',request.request.data[0][0]);
        },
        error: onError
    },

    "Datastore.update" : {
        type: "single",
        call: OpenNebula.Datastore.update,
        callback: function() {
            Sunstone.runAction('Datastore.show',request.request.data[0][0]);
        },
        error: onError
    },

    "Datastore.delete" : {
        type: "multiple",
        call : OpenNebula.Datastore.del,
        callback : deleteDatastoreElement,
        elements: datastoreElements,
        error : onError,
        notify:true
    },

    "Datastore.chown" : {
        type: "multiple",
        call: OpenNebula.Datastore.chown,
        callback:  function (req) {
            Sunstone.runAction("Datastore.show",req.request.data[0][0]);
        },
        elements: datastoreElements,
        error: onError
    },

    "Datastore.chgrp" : {
        type: "multiple",
        call: OpenNebula.Datastore.chgrp,
        callback: function (req) {
            Sunstone.runAction("Datastore.show",req.request.data[0][0]);
        },
        elements: datastoreElements,
        error: onError
    },

    "Datastore.chmod" : {
        type: "single",
        call: OpenNebula.Datastore.chmod,
        callback: function (req) {
            Sunstone.runAction("Datastore.show",req.request.data[0]);
        },
        error: onError
    },

    "Datastore.addtocluster" : {
        type: "multiple",
        call: function(params, success){
            var cluster = params.data.extra_param;
            var ds = params.data.id;

            if (cluster == -1){
                OpenNebula.Datastore.show({
                    data : {
                        id: ds
                    },
                    success: function (request, ds_info){
                        var current_cluster = ds_info.DATASTORE.CLUSTER_ID;

                        if(current_cluster != -1){
                            OpenNebula.Cluster.deldatastore({
                                data: {
                                    id: current_cluster,
                                    extra_param: ds
                                },
                                success: function(){
                                    OpenNebula.Helper.clear_cache("DATASTORE");
                                    Sunstone.runAction('Datastore.show',ds);
                                },
                                error: onError
                            });
                        } else {
                            OpenNebula.Helper.clear_cache("DATASTORE");
                            Sunstone.runAction('Datastore.show',ds);
                        }
                    },
                    error: onError
                });
            } else {
                OpenNebula.Cluster.adddatastore({
                    data: {
                        id: cluster,
                        extra_param: ds
                    },
                    success: function(){
                        OpenNebula.Helper.clear_cache("DATASTORE");
                        Sunstone.runAction('Datastore.show',ds);
                    },
                    error: onError
                });
            }
        },
        elements: datastoreElements
    },

    "Datastore.rename" : {
        type: "single",
        call: OpenNebula.Datastore.rename,
        callback: function(request) {
            Sunstone.runAction('Datastore.show',request.request.data[0][0]);
        },
        error: onError,
        notify: true
    }
};

var datastore_buttons = {
    "Datastore.refresh" : {
        type: "action",
        layout: "refresh",
        alwaysActive: true
    },
//    "Sunstone.toggle_top" : {
//        type: "custom",
//        layout: "top",
//        alwaysActive: true
//    },
    "Datastore.create_dialog" : {
        type: "create_dialog",
        layout: "create",
        condition: mustBeAdmin
    },
    "Datastore.addtocluster" : {
        type: "confirm_with_select",
        text: tr("Select cluster"),
        select: "Cluster",
        layout: "main",
        tip: tr("Select the destination cluster:"),
        condition: mustBeAdmin
    },
    "Datastore.chown" : {
        type: "confirm_with_select",
        text: tr("Change owner"),
        select: "User",
        layout: "user_select",
        tip: tr("Select the new owner")+":",
        condition: mustBeAdmin
    },
    "Datastore.chgrp" : {
        type: "confirm_with_select",
        text: tr("Change group"),
        select: "Group",
        layout: "user_select",
        tip: tr("Select the new group")+":",
        condition: mustBeAdmin
    },
    "Datastore.delete" : {
        type: "confirm",
        text: tr("Delete"),
        layout: "del",
        condition: mustBeAdmin
    },
}

var datastore_info_panel = {
    "datastore_info_tab" : {
        title: tr("Information"),
        content: ""
    }
}

var datastores_tab = {
    title: tr("Datastores"),
    resource: 'Datastore',
    buttons: datastore_buttons,
    tabClass: "subTab",
    parentTab: "infra-tab",
    search_input: '<input id="datastore_search" type="text" placeholder="'+tr("Search")+'" />',
    list_header: '<i class="fa fa-fw fa-folder-open"></i>&emsp;'+tr("Datastores"),
    info_header: '<i class="fa fa-fw fa-folder-open"></i>&emsp;'+tr("Datastore"),
    subheader: '<span/> <small></small>&emsp;',
    table: '<table id="datatable_datastores" class="datatable twelve">\
      <thead>\
        <tr>\
          <th class="check"><input type="checkbox" class="check_all" value=""></input></th>\
          <th>'+tr("ID")+'</th>\
          <th>'+tr("Owner")+'</th>\
          <th>'+tr("Group")+'</th>\
          <th>'+tr("Name")+'</th>\
          <th>'+tr("Capacity")+'</th>\
          <th>'+tr("Cluster")+'</th>\
          <th>'+tr("Basepath")+'</th>\
          <th>'+tr("TM MAD")+'</th>\
          <th>'+tr("DS MAD")+'</th>\
          <th>'+tr("Type")+'</th>\
        </tr>\
      </thead>\
      <tbody id="tbodydatastores">\
      </tbody>\
    </table>'
}

Sunstone.addActions(datastore_actions);
Sunstone.addActions(datastore_image_actions);
Sunstone.addMainTab('datastores-tab',datastores_tab);
Sunstone.addInfoPanel('datastore_info_panel',datastore_info_panel);


function generate_datastore_capacity_bar(ds, ds_type) {
    var total = parseInt(ds.TOTAL_MB);

    var used = total - parseInt(ds.FREE_MB);

    if (total > 0) {
        var ratio = Math.round((used / total) * 100);
        info_str = humanize_size_from_mb(used) + ' / ' + humanize_size_from_mb(total) + ' (' + ratio + '%)';
    } else {
        if(ds_type == 1) {
            info_str = '- / -';
        } else {
            info_str = humanize_size(used) + ' / -';
        }
    }

    return quotaBarHtml(used, total, info_str);
}

function datastoreElements() {
    return getSelectedNodes(dataTable_datastores);
}

function datastoreElementArray(element_json){
    var element = element_json.DATASTORE;

    var ds_type_str = "IMAGE_DS";

    if (typeof element.TEMPLATE.TYPE != "undefined")
    {
      ds_type_str = element.TEMPLATE.TYPE;
    }

    var pb_capacity = generate_datastore_capacity_bar(element, element.TYPE);

    return [
        '<input class="check_item" type="checkbox" id="datastore_'+
                             element.ID+'" name="selected_items" value="'+
                             element.ID+'"/>',
        element.ID,
        element.UNAME,
        element.GNAME,
        element.NAME,
        pb_capacity,
        element.CLUSTER.length ? element.CLUSTER : "-",
        element.BASE_PATH,
        element.TM_MAD,
        element.DS_MAD,
        ds_type_str.toLowerCase().split('_')[0]
    ];
}

function updateDatastoreElement(request, element_json){
    var id = element_json.DATASTORE.ID;
    var element = datastoreElementArray(element_json);
    updateSingleElement(element,dataTable_datastores,'#datastore_'+id)
}

function deleteDatastoreElement(request){
    deleteElement(dataTable_datastores,'#datastore_'+request.request.data);
}

function addDatastoreElement(request,element_json){
    var id = element_json.DATASTORE.ID;
    var element = datastoreElementArray(element_json);
    addElement(element,dataTable_datastores);
}


function updateDatastoresView(request, list){
    var list_array = [];

    $.each(list,function(){
        list_array.push( datastoreElementArray(this));
    });

    updateView(list_array,dataTable_datastores);
}


function updateDatastoreInfo(request,ds){
    var info = ds.DATASTORE;

    datastore_name = info.NAME;
    datastore_type = info.TYPE;

    $(".resource-info-header", $("#datastores-tab")).html(info.NAME);

    switch(info.TYPE)
        {
          case '0':
            datastore_type = "SYSTEM_DS";
            break;
          case '1':
            datastore_type = "IMAGE_DS";
            break;
          case '2':
            datastore_type = "FILE_DS";
            break;
    }

    var images_str = "";
    if (info.IMAGES.ID &&
        info.IMAGES.ID.constructor == Array){
        for (var i=0; i<info.IMAGES.ID.length;i++){
            images_str+=getImageName(info.IMAGES.ID[i])+', ';
        };
        images_str=images_str.slice(0,-2);
    } else if (info.IMAGES.ID){
        images_str=getImageName(info.IMAGES.ID);
    };

    var cluster_str = insert_cluster_dropdown("Datastore",info.ID,info.CLUSTER,info.CLUSTER_ID,"#info_datastore_table");

    var is_system_ssh = (info.TEMPLATE.SHARED == "NO")

    var info_tab_content = '<div class="row">\
        <div class="large-6 columns">\
        <table id="info_datastore_table" class="dataTable extended_table">\
            <thead>\
              <tr><th colspan="3">'+tr("Information")+'</th></tr>\
            </thead>\
            <tbody>\
              <tr>\
                 <td class="key_td">'+tr("ID")+'</td>\
                 <td class="value_td">'+info.ID+'</td>\
                 <td></td>\
              </tr>'+
              insert_rename_tr(
                'datastores-tab',
                "Datastore",
                info.ID,
                info.NAME)+
              '<tr>'+
              cluster_str  +
              '</tr>\
              <tr>\
                 <td class="key_td">'+tr("Base path")+'</td>\
                 <td class="value_td">'+info.BASE_PATH+'</td>\
                 <td></td>\
              </tr>\
              <tr>\
                <td class="key_td">'+tr("Capacity")+'</td>\
                <td class="value_td" colspan="2">' + generate_datastore_capacity_bar(info, info.TYPE) + '</td>\
              </tr>\
              <tr>\
                <td class="key_td">' + tr("Limit") + '</td>\
                <td class="value_td" colspan="2">'+(is_system_ssh || (typeof info.TEMPLATE.LIMIT_MB == "undefined") ? '-' : humanize_size_from_mb(info.TEMPLATE.LIMIT_MB))+'</td>\
              </tr>\
            </tbody>\
          </table>\
        </div>\
        <div class="large-6 columns">'
            + insert_permissions_table('datastores-tab',
                                     "Datastore",
                                     info.ID,
                                     info.UNAME,
                                     info.GNAME,
                                     info.UID,
                                     info.GID)+
        '</div>\
      </div>\
      <div class="row">\
        <div class="large-9 columns">' +
            insert_extended_template_table(info.TEMPLATE,
                                         "Datastore",
                                         info.ID,
                                         "Attributes") +
        '</div>\
      </div>';


    var info_tab = {
        title : tr("Info"),
        icon: "fa-info-circle",
        content: info_tab_content
    }

    var datastore_info_tab = {
        title: tr("Images"),
        icon: "fa-upload",
        content : '<div id="datatable_datastore_images_info_div" class="row">\
          <div class="large-12 columns">\
            <table id="datatable_datastore_images_info_panel" class="table twelve">' +
              datastore_image_table_tmpl +
            '</table>\
            </div>\
          </div>'
    }

    // Add tabs
    Sunstone.updateInfoPanelTab("datastore_info_panel","datastore_info_tab",info_tab);
    Sunstone.updateInfoPanelTab("datastore_info_panel","datastore_image_tab",datastore_info_tab);
    Sunstone.popUpInfoPanel("datastore_info_panel", "datastores-tab");

    // Define datatables
    // Images datatable

    dataTable_datastore_images_panel = $("#datatable_datastore_images_info_panel").dataTable({
        "bAutoWidth":false,
        "sDom" : '<"H">t<"F"p>',
        "oColVis": {
            "aiExclude": [ 0 ]
        },
        "bSortClasses" : false,
        "bDeferRender": true,
        "aoColumnDefs": [
            { "sWidth": "35px", "aTargets": [1] },
            { "bVisible": false, "aTargets": [0,5,6,8,12]}
        ]
    });

    infoListener(dataTable_datastore_images_panel,'Image.show','images-tab');

    // initialize datatables values
    Sunstone.runAction("DatastoreImageInfo.list");
    Sunstone.runAction("Datastore.fetch_permissions",info.ID);

}

function hide_all(context)
{
    // Hide all the options that depends on datastore type
    // and reset the selects
    $('label[for="ds_use_ssh"],input#ds_use_ssh',context).hide();
    $('label[for="tm_use_ssh"],input#tm_use_ssh',context).hide();

    $('input#image_ds_type').attr('checked', 'true');
    $('input[name=ds_type]').removeAttr('disabled', 'disabled');

    $('label[for="bridge_list"],input#bridge_list',context).parent().parent().hide();
    $('label[for="base_iqn"],input#base_iqn',context).hide();
    $('label[for="vg_name"],input#vg_name',context).hide();
    $('label[for="gluster_host"],input#gluster_host',context).parent().hide();
    $('label[for="gluster_volume"],input#gluster_volume',context).parent().hide();
    $('label[for="pool_name"],input#pool_name',context).parent().hide();
    $('label[for="ceph_host"],input#ceph_host',context).parent().hide();
    $('label[for="ceph_secret"],input#ceph_secret',context).parent().hide();
    $('select#ds_mad').removeAttr('disabled');
    $('select#tm_mad').removeAttr('disabled');
    $('select#tm_mad').children('option').each(function() {
      $(this).removeAttr('disabled');
    });
    $('select#disk_type').removeAttr('disabled');
    $('select#disk_type').children('option').each(function() {
      $(this).removeAttr('disabled');
    });

    $('input[name="ds_tab_custom_ds_mad"]', context).parent().hide();
    $('input[name="ds_tab_custom_tm_mad"]', context).parent().hide();
}

// Set up the create datastore dialog
function setupCreateDatastoreDialog(){

    dialogs_context.append('<div id="create_datastore_dialog"></div>');
    //Insert HTML in place
    $create_datastore_dialog = $('#create_datastore_dialog')
    var dialog = $create_datastore_dialog;
    dialog.html(create_datastore_tmpl);

    dialog.addClass("reveal-modal medium max-height").attr("data-reveal", "");

    setupTips(dialog);

    // Show custom driver input only when custom is selected in selects
    $('input[name="ds_tab_custom_ds_mad"],'+
      'input[name="ds_tab_custom_tm_mad"]',dialog).parent().hide();

    $('select#ds_mad',dialog).change(function(){
        if ($(this).val()=="custom")
            $('input[name="ds_tab_custom_ds_mad"]').parent().show();
        else
            $('input[name="ds_tab_custom_ds_mad"]').parent().hide();
    });

    $('select#tm_mad',dialog).change(function(){
        if ($(this).val()=="custom")
            $('input[name="ds_tab_custom_tm_mad"]').parent().show();
        else
            $('input[name="ds_tab_custom_tm_mad"]').parent().hide();
    });

    $('#presets').change(function(){
        hide_all(dialog);
        var choice_str = $(this).val();
        switch(choice_str)
        {
          case 'fs':
            select_filesystem();
            break;
          case 'vmware_vmfs':
            select_vmware_vmfs();
            break;
          case 'block_lvm':
            select_block_lvm();
            break;
          case 'fs_lvm':
            select_fs_lvm();
            break;
          case 'ceph':
            select_ceph();
            break;
          case 'gluster':
            select_gluster();
            break;
          case 'dev':
            select_devices();
            break;
          case 'custom':
            select_custom();
            break;
        }
    });


    $('#create_datastore_submit',dialog).click(function(){
        var context         = $( "#create_datastore_form", dialog);
        var name            = $('#name',context).val();
        var cluster_id      = $(".resource_list_select", $('#cluster_id',dialog)).val();
        var ds_type         = $('input[name=ds_type]:checked',context).val();
        var ds_mad          = $('#ds_mad',context).val();
        ds_mad              = ds_mad == "custom" ? $('input[name="ds_tab_custom_ds_mad"]').val() : ds_mad;
        var tm_mad          = $('#tm_mad',context).val();
        tm_mad              = tm_mad == "custom" ? $('input[name="ds_tab_custom_tm_mad"]').val() : tm_mad;
        var type            = $('#disk_type',context).val();
        var safe_dirs       = $('#safe_dirs',context).val();
        var base_path       = $('#base_path',context).val();
        var restricted_dirs = $('#restricted_dirs',context).val();
        var bridge_list     = $('#bridge_list',context).val();
        var ds_use_ssh      = $('#ds_use_ssh',context).is(':checked');
        var tm_use_ssh      = $('#tm_use_ssh',context).is(':checked');
        var base_iqn        = $('#base_iqn',context).val();
        var vg_name         = $('#vg_name',context).val();
        var limit_mb        = $('#limit_mb',context).val();
        var gluster_host    = $('#gluster_host',context).val();
        var gluster_volume  = $('#gluster_volume',context).val();
        var pool_name       = $('#pool_name',context).val();
        var ceph_host       = $('#ceph_host',context).val();
        var ceph_secret     = $('#ceph_secret',context).val();


        if (!name){
            notifyError("Please provide a name");
            return false;
        };

        var ds_obj = {
            "datastore" : {
                "name" : name,
                "tm_mad" : tm_mad,
                "disk_type" : type,
                "type" : ds_type
            },
            "cluster_id" : cluster_id
        };

        // If we are adding a system datastore then
        // we do not use ds_mad
        if (ds_type != "SYSTEM_DS")
            ds_obj.datastore.ds_mad = ds_mad;

        if (base_path)
            ds_obj.datastore.base_path = base_path;

        if (safe_dirs)
            ds_obj.datastore.safe_dirs = safe_dirs;

        if (restricted_dirs)
            ds_obj.datastore.restricted_dirs = restricted_dirs;

        if (bridge_list)
            ds_obj.datastore.bridge_list = bridge_list;

        if (ds_use_ssh)
            ds_obj.datastore.ds_use_ssh = "YES";

        if (tm_use_ssh)
            ds_obj.datastore.tm_use_ssh = "YES";

        if (base_iqn)
            ds_obj.datastore.base_iqn = base_iqn;

        if (vg_name)
            ds_obj.datastore.vg_name = vg_name;

        if (limit_mb)
            ds_obj.datastore.limit_mb = limit_mb;

        if (gluster_host)
            ds_obj.datastore.gluster_host = gluster_host;

        if (gluster_volume)
            ds_obj.datastore.gluster_volume = gluster_volume;

        if (pool_name)
            ds_obj.datastore.pool_name = pool_name;

        if (ceph_host)
            ds_obj.datastore.ceph_host = ceph_host;

        if (ceph_secret)
            ds_obj.datastore.ceph_secret = ceph_secret;

        // Sanitize dialog
        $('#ds_use_ssh').prop('checked', false);
        $('#tm_use_ssh').prop('checked', false);

        Sunstone.runAction("Datastore.create",ds_obj);
        return false;
    });

    $('#create_datastore_submit_manual',dialog).click(function(){
        var template   = $('#template',dialog).val();
        var cluster_id = $(".resource_list_select", $('#datastore_cluster_raw',dialog)).val();

        if (!cluster_id){
            notifyError(tr("Please select a cluster for this datastore"));
            return false;
        };

        var ds_obj = {
            "datastore" : {
                "datastore_raw" : template
            },
            "cluster_id" : cluster_id
        };
        Sunstone.runAction("Datastore.create",ds_obj);
        return false;
    });

    $('#wizard_ds_reset_button').click(function(){
        $create_datastore_dialog.html("");
        setupCreateDatastoreDialog();

        popUpCreateDatastoreDialog();
    });

    $('#advanced_ds_reset_button').click(function(){
        $create_datastore_dialog.html("");
        setupCreateDatastoreDialog();

        popUpCreateDatastoreDialog();
        $("a[href='#datastore_manual']").click();
    });

    // Hide disk_type
    $('select#disk_type').parent().hide();

    hide_all($create_datastore_dialog);
    select_filesystem();
}

function select_filesystem(){
    $('select#ds_mad').val('fs');
    $('select#tm_mad').val('shared');
    $('select#ds_mad').attr('disabled', 'disabled');
    $('select#tm_mad').children('option').each(function() {
      var value_str = $(this).val();
      $(this).attr('disabled', 'disabled');
      if (value_str == "qcow2"  ||
          value_str == "shared" ||
          value_str == "ssh")
      {
           $(this).removeAttr('disabled');
      }
    });
    $('select#disk_type').val('file');
    $('select#disk_type').attr('disabled', 'disabled');
    $('input#safe_dirs').removeAttr('disabled');
    $('select#disk_type').removeAttr('disabled');
    $('input#base_path').removeAttr('disabled');
    $('input#limit_mb').removeAttr('disabled');
    $('input#restricted_dirs').removeAttr('disabled');
}

function select_vmware_vmfs(){
    $('label[for="bridge_list"],input#bridge_list').parent().parent().fadeIn();
    $('label[for="ds_use_ssh"],input#ds_use_ssh').fadeIn();
    $('label[for="tm_use_ssh"],input#tm_use_ssh').fadeIn();
    $('select#ds_mad').val('vmfs');
    $('select#ds_mad').attr('disabled', 'disabled');
    $('select#tm_mad').val('vmfs');
    $('select#tm_mad').attr('disabled', 'disabled');
    $('select#disk_type').val('file');
    $('select#disk_type').attr('disabled', 'disabled');
    $('input#safe_dirs').removeAttr('disabled');
    $('input#base_path').removeAttr('disabled');
    $('input#limit_mb').removeAttr('disabled');
    $('input#restricted_dirs').removeAttr('disabled');
}

function select_ceph(){
    $('input#image_ds_type').attr('checked', 'true');
    $('input[name=ds_type]').attr('disabled', 'disabled');
    $('select#ds_mad').val('ceph');
    $('select#ds_mad').attr('disabled', 'disabled');
    $('select#tm_mad').val('ceph');
    $('select#tm_mad').attr('disabled', 'disabled');
    $('label[for="bridge_list"],input#bridge_list').parent().parent().fadeIn();
    $('label[for="pool_name"],input#pool_name').parent().fadeIn();
    $('label[for="ceph_host"],input#ceph_host').parent().fadeIn();
    $('label[for="ceph_secret"],input#ceph_secret').parent().fadeIn();
    $('select#disk_type').val('RBD');
    $('select#disk_type').attr('disabled', 'disabled');
    $('input#safe_dirs').removeAttr('disabled');
    $('input#base_path').removeAttr('disabled');
    $('input#limit_mb').removeAttr('disabled');
    $('input#restricted_dirs').removeAttr('disabled');
}

function select_block_lvm(){
    $('select#ds_mad').val('lvm');
    $('select#ds_mad').attr('disabled', 'disabled');
    $('select#tm_mad').val('lvm');
    $('select#tm_mad').attr('disabled', 'disabled');
    $('input#image_ds_type').attr('checked', 'true');
    $('input[name=ds_type]').attr('disabled', 'disabled');
    $('label[for="bridge_list"],input#bridge_list').parent().parent().fadeIn();
    $('label[for="vg_name"],input#vg_name').fadeIn();
    $('select#disk_type').val('block');
    $('select#disk_type').attr('disabled', 'disabled');
    $('input#safe_dirs').removeAttr('disabled');
    $('input#base_path').removeAttr('disabled');
    $('input#limit_mb').removeAttr('disabled');
    $('input#restricted_dirs').removeAttr('disabled');
}

function select_fs_lvm(){
    $('select#ds_mad').val('fs');
    $('select#ds_mad').attr('disabled', 'disabled');
    $('select#tm_mad').val('fs_lvm');
    $('select#tm_mad').attr('disabled', 'disabled');
    $('input#image_ds_type').attr('checked', 'true');
    $('input[name=ds_type]').attr('disabled', 'disabled');
    $('select#disk_type').val('block');
    $('select#disk_type').attr('disabled', 'disabled');
    $('input#safe_dirs').removeAttr('disabled');
    $('input#base_path').removeAttr('disabled');
    $('input#limit_mb').removeAttr('disabled');
    $('input#restricted_dirs').removeAttr('disabled');
}

function select_gluster(){
    $('select#ds_mad').val('fs');
    $('select#ds_mad').attr('disabled', 'disabled');
    $('select#tm_mad').val('shared');
    $('select#tm_mad').children('option').each(function() {
      var value_str = $(this).val();
      $(this).attr('disabled', 'disabled');
      if (value_str == "shared"  ||
          value_str == "ssh")
      {
           $(this).removeAttr('disabled');
      }
    });
    $('input#image_ds_type').attr('checked', 'true');
    $('input[name=ds_type]').attr('disabled', 'disabled');
    $('select#disk_type').val('gluster');
    $('select#disk_type').attr('disabled', 'disabled');
    $('label[for="gluster_host"],input#gluster_host').parent().fadeIn();
    $('label[for="gluster_volume"],input#gluster_volume').parent().fadeIn();
    $('input#safe_dirs').removeAttr('disabled');
    $('input#base_path').removeAttr('disabled');
    $('input#limit_mb').removeAttr('disabled');
    $('input#restricted_dirs').removeAttr('disabled');
}

function select_devices(){
    $('select#ds_mad').val('dev');
    $('select#ds_mad').attr('disabled', 'disabled');
    $('select#tm_mad').val('dev');
    $('select#tm_mad').attr('disabled', 'disabled');
    $('input#image_ds_type').attr('checked', 'true');
    $('input[name=ds_type]').attr('disabled', 'disabled');
    $('select#disk_type').val('block');
    $('select#disk_type').attr('disabled', 'disabled');
    $('input#safe_dirs').attr('disabled', 'disabled');
    $('input#base_path').attr('disabled', 'disabled');
    $('input#limit_mb').attr('disabled', 'disabled');
    $('input#restricted_dirs').attr('disabled', 'disabled');
}

function select_custom(){
    hide_all($create_datastore_dialog);
    $('select#ds_mad').val('fs');
    $('select#tm_mad').val('shared');
    $('input#safe_dirs').removeAttr('disabled');
    $('select#disk_type').removeAttr('disabled');
    $('input#base_path').removeAttr('disabled');
    $('input#limit_mb').removeAttr('disabled');
    $('input#restricted_dirs').removeAttr('disabled');
}

function popUpCreateDatastoreDialog(){
    var cluster_id = $("div#cluster_id .resource_list_select", $create_datastore_dialog).val();
    if (!cluster_id) cluster_id = "-1";

    var cluster_id_raw = $("div#datastore_cluster_raw .resource_list_select", $create_datastore_dialog).val();
    if (!cluster_id_raw) cluster_id_raw = "-1";


    insertSelectOptions('div#cluster_id', $create_datastore_dialog, "Cluster", cluster_id, false);
    insertSelectOptions('div#datastore_cluster_raw', $create_datastore_dialog, "Cluster", cluster_id_raw, false);
    $create_datastore_dialog.foundation().foundation('reveal', 'open');
    $("input#name",$create_datastore_dialog).focus();
}


$(document).ready(function(){
    var tab_name = 'datastores-tab';

    if (Config.isTabEnabled(tab_name)) {
      dataTable_datastores = $("#datatable_datastores",main_tabs_context).dataTable({
            "bAutoWidth": false,
          "aoColumnDefs": [
              { "bSortable": false, "aTargets": ["check"] },
              { "sWidth": "35px", "aTargets": [0] },
              { "sWidth": "250px", "aTargets": [5] },
              { "bVisible": true, "aTargets": Config.tabTableColumns(tab_name)},
              { "bVisible": false, "aTargets": ['_all']}
          ],
          "bSortClasses" : false,
          "bDeferRender": true,
      });

      $('#datastore_search').keyup(function(){
        dataTable_datastores.fnFilter( $(this).val() );
      })

      dataTable_datastores.on('draw', function(){
        recountCheckboxes(dataTable_datastores);
      })

      Sunstone.runAction("Datastore.list");

      setupCreateDatastoreDialog();

      initCheckAllBoxes(dataTable_datastores);
      tableCheckboxesListener(dataTable_datastores);
      infoListener(dataTable_datastores,'Datastore.show');

      // Reset filter in case the view was filtered because it was accessed
      // from a single cluster.
      $('div#menu li#li_datastores_tab').live('click',function(){
          dataTable_datastores.fnFilter('',5);
      });

      $('div#datastores_tab div.legend_div').hide();
      dataTable_datastores.fnSort( [ [1,config['user_config']['table_order']] ] );
    }
})
