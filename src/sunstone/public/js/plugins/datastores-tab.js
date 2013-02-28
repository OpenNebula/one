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

/*Datastore tab plugin*/


var datastores_tab_content = '\
<form class="custom" id="form_datastores" action="">\
<div class="panel">\
<div class="row">\
  <div class="twelve columns">\
    <h4 class="subheader"><i class="icon-folder-open"></i> '+tr("Datastores")+'</h4>\
  </div>\
</div>\
<div class="row">\
  <div class="nine columns">\
    <div class="action_blocks">\
    </div>\
  </div>\
  <div class="three columns">\
    <input id="datastore_search" type="text" placeholder="Search" />\
  </div>\
  <br>\
  <br>\
</div>\
</div>\
  <div class="row">\
    <div class="twelve columns">\
<table id="datatable_datastores" class="datatable twelve">\
  <thead>\
    <tr>\
      <th class="check"><input type="checkbox" class="check_all" value=""></input></th>\
      <th>'+tr("ID")+'</th>\
      <th>'+tr("Owner")+'</th>\
      <th>'+tr("Group")+'</th>\
      <th>'+tr("Name")+'</th>\
      <th>'+tr("Cluster")+'</th>\
      <th>'+tr("Basepath")+'</th>\
      <th>'+tr("TM MAD")+'</th>\
      <th>'+tr("DS MAD")+'</th>\
      <th>'+tr("System")+'</th>\
    </tr>\
  </thead>\
  <tbody id="tbodydatastores">\
  </tbody>\
</table>\
<div class="legend_div">\
  <span>?</span>\
  <p class="legend_p">\
'+tr("Datatables are sets of images which share a common transfer driver. i.e. Images in a SSH datastore will be copied to the hosts using SSH when deploying a Virtual Machine.")+'\
  </p>\
</div>\
</form>';

var create_datastore_tmpl =
'<div class="create_form">\
  <div class="panel">\
    <h3>\
      <small id="create_cluster_header">'+tr("Create Datastore")+'</small>\
    </h3>\
  </div>\
  <form id="create_datastore_form" action="" class="creation">\
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
      <div class="six columns">\
        <div class="four columns">\
          <label class="right inline" for="ds_type">' + tr("Presets") + ':</label>\
        </div>\
        <div class="seven columns">\
          <select id="ds_type" name="ds_type">\
            <option value="fs">' + tr("Filesystem") + '</option>\
            <option value="vmware_fs">' + tr("VMware (FS Based)") + '</option>\
            <option value="vmware_vmfs">' + tr("VMware (VMFS Based)") + '</option>\
            <option value="iscsi">' + tr("iSCSI") + '</option>\
            <option value="lvm">' + tr("LVM") + '</option>\
            <option value="ceph">' + tr("Ceph") + '</option>\
          </select>\
        </div>\
        <div class="one columns ">\
        </div>\
      </div>\
      <div class="six columns">\
        <div class="four columns">\
          <label class="right inline" for="cluster">' + tr("Cluster") + ':</label>\
        </div>\
        <div class="seven columns">\
          <select id="cluster_id" name="cluster_id">\
          </select>\
        </div>\
        <div class="one columns ">\
        </div>\
      </div>\
    </div>\
    <div class="row">\
      <div class="six columns">\
        <div class="row">\
          <fieldset>\
            <legend>' + tr("Type") + '</legend>\
              <div class="four columns">\
                <label for="images_ds"><input id="images_ds" type="radio" name="type" value="YES" />' + tr("Images") + '</label>\
              </div>\
              <div class="four columns">\
                <label for="sys_ds"><input id="sys_ds" type="radio" name="type" value="YES" />' + tr("System") + '</label>\
              </div>\
              <div class="four columns">\
                <label for="files_ds"><input id="files_ds" type="radio" name="type" value="YES" />' + tr("Files") + '</label>\
              </div>\
          </fieldset>\
        </div>\
        <br>\
        <div class="row">\
          <div class="four columns">\
            <label class="right inline" for="disk_type">' + tr("Disk type") + ':</label>\
          </div>\
          <div class="seven columns">\
            <select id="disk_type" name="disk_type">\
              <option value="file">' + tr("File") + '</option>\
              <option value="block">' + tr("Block") + '</option>\
              <option value="rbd">' + tr("RBD") + '</option>\
            </select>\
          </div>\
          <div class="one columns">\
          </div>\
        </div>\
      </div>\
      <div class="six columns">\
        <div class="row">\
          <fieldset>\
            <legend>' + tr("Managers") + '</legend>\
            <div class="row">\
              <div class="four columns">\
                <label class="right inline" for="ds_mad">' + tr("Datastore") + ':</label>\
              </div>\
              <div class="seven columns">\
                <select id="ds_mad" name="ds_mad">\
                  <option value="fs">' + tr("Filesystem") + '</option>\
                  <option value="vmware">' + tr("VMware") + '</option>\
                  <option value="iscsi">' + tr("iSCSI") + '</option>\
                  <option value="lvm">' + tr("LVM") + '</option>\
                  <option value="vmfs">' + tr("VMFS") + '</option>\
                  <option value="ceph">' + tr("Ceph") + '</option>\
                </select>\
              </div>\
              <div class="one columns ">\
              </div>\
            </div>\
            <div class="row">\
              <div class="four columns">\
                <label class="right inline" for="tm_mad">' + tr("Transfer") + ':</label>\
              </div>\
              <div class="seven columns">\
                <select id="tm_mad" name="tm_mad">\
                  <option value="shared">' + tr("Shared") + '</option>\
                  <option value="ssh">' + tr("SSH") + '</option>\
                  <option value="qcow2">' + tr("qcow2") + '</option>\
                  <option value="iscsi">' + tr("iSCSI") + '</option>\
                  <option value="dummy">' + tr("Dummy") + '</option>\
                  <option value="lvm">' + tr("LVM") + '</option>\
                  <option value="vmfs">' + tr("VMFS") + '</option>\
                  <option value="ceph">' + tr("Ceph") + '</option>\
                </select>\
              </div>\
              <div class="one columns ">\
              </div>\
            </div>\
          </fieldset>\
        </div>\
      </div>\
    </div>\
    <div class="twelve columns">\
      <div class="three columns">\
        <label class="right inline" for="safe_dirs">' + tr("Safe Directories") + ':</label>\
      </div>\
      <div class="eight columns">\
        <input type="text" name="safe_dirs" id="safe_dirs" />\
      </div>\
      <div class="one columns">\
      </div>\
    </div>\
    <div class="twelve columns">\
      <div class="three columns">\
        <label class="right inline" for="restricted_dirs">' + tr("Restricted Directories") + ':</label>\
      </div>\
      <div class="eight columns">\
        <input type="text" name="restricted_dirs" id="restricted_dirs" />\
      </div>\
      <div class="one columns">\
      </div>\
    </div>\
    <div class="twelve columns">\
      <div class="three columns">\
        <label class="right inline" for="bridge_list">' + tr("Host Bridge List") + ':</label>\
      </div>\
      <div class="eight columns">\
        <input type="text" name="bridge_list" id="bridge_list" />\
      </div>\
      <div class="one columns">\
      </div>\
    </div>\
    <div class="row">\
      <div class="six columns">\
        <label class="right inline" for="ds_use_ssh"><input id="ds_use_ssh" type="checkbox" name="ds_use_ssh" value="YES" />' + tr("Use SSH for Datastore Manager") + ':</label>\
      </div>\
      <div class="six columns">\
        <label class="inline" for="tm_use_ssh"><input id="tm_use_ssh" type="checkbox" name="tm_use_ssh" value="YES" />' + tr("Use SSH for Transfer Manager") + ':</label>\
      </div>\
    </div>\
    <div class="twelve columns">\
      <div class="three columns">\
        <label class="right inline" for="host">' + tr("Storage Server") + ':</label>\
      </div>\
      <div class="eight columns">\
        <input type="text" name="host" id="host" />\
      </div>\
      <div class="one columns">\
      </div>\
    </div>\
    <div class="twelve columns">\
      <div class="three columns">\
        <label class="right inline" for="base_iqn">' + tr("Base IQN") + ':</label>\
      </div>\
      <div class="eight columns">\
        <input type="text" name="base_iqn" id="base_iqn" />\
      </div>\
      <div class="one columns">\
      </div>\
    </div>\
    <div class="twelve columns">\
      <div class="three columns">\
        <label class="right inline" for="vg_name">' + tr("Volume Group Name") + ':</label>\
      </div>\
      <div class="eight columns">\
        <input type="text" name="vg_name" id="vg_name" />\
      </div>\
      <div class="one columns">\
      </div>\
    </div>\
  </form>\
    <hr>\
  <div class="form_buttons">\
      <button class="button radius right success" type="submit" id="create_datastore_submit" value="OpenNebula.Datastore.create">' + tr("Create") + '</button>\
      <button class="button radius secondary" type="reset" value="reset">' + tr("Reset") + '</button>\
      <button class="close-reveal-modal button secondary radius" type="close" value="close">' + tr("Close") + '</button>\
  </div>\
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

var datastores_select="";
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
        //Grab table data from the image_list
        image_list_array.push(imageElementArray(this));
    });

    updateView(image_list_array,dataTable_datastore_images_panel);
}

//callback to update the list of images for info panel
function updateDatastoreimagesInfoView (request,image_list){
    var image_list_array = [];

    $.each(image_list,function(){
        if(this.IMAGE.DATASTORE_ID == datastore_info.ID)
          image_list_array.push(imageElementArray(this));
    });

    updateView(image_list_array,dataTable_datastore_images_panel);
}


//Setup actions
var datastore_actions = {

    "Datastore.create" : {
        type: "create",
        call : OpenNebula.Datastore.create,
        callback : addDatastoreElement,
        error : onError,
        notify: true
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
        callback: updateDatastoreElement,
        error: onError
    },

    "Datastore.showinfo" : {
        type: "single",
        call: OpenNebula.Datastore.show,
        callback: updateDatastoreInfo,
        error: onError
    },

    "Datastore.refresh" : {
        type: "custom",
        call: function(){
            waitingNodes(dataTable_datastores);
            Sunstone.runAction("Datastore.list");
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
            notifyMessage("Template updated correctly");
            Sunstone.runAction('Datastore.showinfo',request.request.data[0]);
        },
        error: onError
    },

    "Datastore.update" : {
        type: "single",
        call: OpenNebula.Datastore.update,
        callback: function() {
            notifyMessage(tr("Datastore updated correctly"));
        },
        error: onError
    },

    "Datastore.autorefresh" : {
        type: "custom",
        call : function() {
            OpenNebula.Datastore.list({timeout: true, success: updateDatastoresView,error: onError});
        }
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
        error: onError,
        notify: true
    },

    "Datastore.chgrp" : {
        type: "multiple",
        call: OpenNebula.Datastore.chgrp,
        callback: function (req) {
            Sunstone.runAction("Datastore.show",req.request.data[0][0]);
        },
        elements: datastoreElements,
        error: onError,
        notify: true
    },

    "Datastore.chmod" : {
        type: "single",
        call: OpenNebula.Datastore.chmod,
        error: onError,
        notify: true
    },

    "Datastore.addtocluster" : {
        type: "multiple",
        call: function(params){
            var cluster = params.data.extra_param;
            var ds = params.data.id;

            if (cluster == -1){
                //get cluster name
                var current_cluster = getValue(ds,1,5,dataTable_datastores);
                //get cluster id
                current_cluster = getValue(current_cluster,
                                           2,1,dataTable_clusters);
                if (!current_cluster) return;
                Sunstone.runAction("Cluster.deldatastore",current_cluster,ds)
            }
            else
                Sunstone.runAction("Cluster.adddatastore",cluster,ds);
        },
        elements: datastoreElements,
        notify:true
    },

    "Datastore.help" : {
        type: "custom",
        call: function() {
            hideDialog();
            $('div#datastores_tab div.legend_div').slideToggle();
        }
    }
};

var datastore_buttons = {
    "Datastore.refresh" : {
        type: "action",
        layout: "refresh",
        alwaysActive: true
    },
    "Datastore.create_dialog" : {
        type: "create_dialog",
        text: tr("+ New"),
        layout: "create",
        condition: mustBeAdmin
    },
    "Datastore.addtocluster" : {
        type: "confirm_with_select",
        text: tr("Select cluster"),
        select: clusters_sel,
        layout: "more_select",
        tip: tr("Select the destination cluster:"),
        condition: mustBeAdmin
    },
    "Datastore.chown" : {
        type: "confirm_with_select",
        text: tr("Change owner"),
        select: users_sel,
        layout: "user_select",
        tip: tr("Select the new owner")+":",
        condition: mustBeAdmin
    },
    "Datastore.chgrp" : {
        type: "confirm_with_select",
        text: tr("Change group"),
        select: groups_sel,
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

    //"Datastore.help" : {
    //    type: "action",
    //    text: '?',
    //    alwaysActive: true
    //}
}

var datastore_info_panel = {
    "datastore_info_tab" : {
        title: tr("Information"),
        content: ""
    }
}

var datastores_tab = {
    title: tr("Datastores"),
    content: datastores_tab_content,
    buttons: datastore_buttons,
    tabClass: "subTab",
    parentTab: "infra_tab",
    showOnTopMenu: false
}

Sunstone.addActions(datastore_actions);
Sunstone.addActions(datastore_image_actions);
Sunstone.addMainTab('datastores_tab',datastores_tab);
Sunstone.addInfoPanel('datastore_info_panel',datastore_info_panel);


function datastoreElements() {
    return getSelectedNodes(dataTable_datastores);
}

function datastoreElementArray(element_json){
    var element = element_json.DATASTORE;

    return [
        '<input class="check_item" type="checkbox" id="datastore_'+element.ID+'" name="selected_items" value="'+element.ID+'"/>',
        element.ID,
        element.UNAME,
        element.GNAME,
        element.NAME,
        element.CLUSTER.length ? element.CLUSTER : "-",
        element.BASE_PATH,
        element.TM_MAD,
        element.DS_MAD,
        element.SYSTEM == '1' ? 'Yes' : 'No'
    ];
}

function updateDatastoreSelect(){
    datastores_select = makeSelectOptions(dataTable_datastores,
                                          1,
                                          4,
                                          [9],//system ds
                                          ['Yes'], //filter sys datastores
                                          true
                                         );
};

function updateDatastoreElement(request, element_json){
    var id = element_json.DATASTORE.ID;
    var element = datastoreElementArray(element_json);
    updateSingleElement(element,dataTable_datastores,'#datastore_'+id)
    updateDatastoreSelect();
}

function deleteDatastoreElement(request){
    deleteElement(dataTable_datastores,'#datastore_'+request.request.data);
    updateDatastoreSelect();
}

function addDatastoreElement(request,element_json){
    var id = element_json.DATASTORE.ID;
    var element = datastoreElementArray(element_json);
    addElement(element,dataTable_datastores);
    updateDatastoreSelect();
}


function updateDatastoresView(request, list){
    var list_array = [];

    $.each(list,function(){
        list_array.push( datastoreElementArray(this));
    });

    updateView(list_array,dataTable_datastores);
    updateDatastoreSelect();
    updateInfraDashboard("datastores",list);
}


function updateDatastoreInfo(request,ds){
    var info = ds.DATASTORE;
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

    var info_tab_content = '<div class="">\
        <div class="six columns">\
        <table id="info_datastore_table" class="twelve datatable extended_table">\
            <thead>\
              <tr><th colspan="3">'+tr("Datastore")+' "'+info.NAME+'"</th></tr>\
            </thead>\
            <tbody>\
              <tr>\
                 <td class="key_td">'+tr("ID")+'</td>\
                 <td class="value_td">'+info.ID+'</td>\
                <td></td>\
              </tr>\
              <tr>\
                 <td class="key_td">'+tr("Name")+'</td>\
                 <td class="value_td">'+info.NAME+'</td>\
                <td></td>\
              </tr>\
              <tr>\
                 <td class="key_td">'+tr("Cluster")+'</td>\
                 <td class="value_td">'+(info.CLUSTER.length ? info.CLUSTER : "-")+'</td>\
              </tr>\
              <tr>\
                 <td class="key_td">'+tr("Base path")+'</td>\
                 <td class="value_td">'+info.BASE_PATH+'</td>\
              </tr>\
            </tbody>\
          </table>'
            + insert_extended_template_table(info.TEMPLATE,
                                         "Datastore",
                                         info.ID) + 
        '</div>\
        <div class="six columns">'
            + insert_permissions_table("Datastore",
                                     info.ID,
                                     info.UNAME,
                                     info.GNAME,
                                     info.UID,
                                     info.GID)
        '</div>\
      </div>'


    var info_tab = {
        title : tr("Information"),
        content: info_tab_content
    }

    var datastore_info_tab = {
        title: tr("Images"),
        content : '<div id="datatable_datastore_images_info_div"><table id="datatable_datastore_images_info_panel" class="table twelve">' + datastore_image_table_tmpl + '</table></div>'
    }


    // Add tabs
    Sunstone.updateInfoPanelTab("datastore_info_panel","datastore_info_tab",info_tab);
    Sunstone.updateInfoPanelTab("datastore_info_panel","datastore_image_tab",datastore_info_tab);
    Sunstone.popUpInfoPanel("datastore_info_panel");

    // Define datatables
    // Images datatable

    dataTable_datastore_images_panel = $("#datatable_datastore_images_info_panel").dataTable({
        "bAutoWidth":false,
        "sDom" : '<"H">t<"F"p>',
        "oColVis": {
            "aiExclude": [ 0 ]
        },
        "aoColumnDefs": [
            { "bSortable": false, "aTargets": ["check"] },
            { "sWidth": "60px", "aTargets": [0,2,3,9,10] },
            { "sWidth": "35px", "aTargets": [1,6,11,12] },
            { "sWidth": "100px", "aTargets": [5,7] },
            { "sWidth": "150px", "aTargets": [8] },
            { "bVisible": false, "aTargets": [0,6,8,12]}
        ],
        "oLanguage": (datatable_lang != "") ?
            {
                sUrl: "locale/"+lang+"/"+datatable_lang
            } : ""
    });

    //preload it

    //addElement([
    //    spinner,
    //    '','','','','','','','','','','',''],dataTable_datastore_images_panel);


    // initialize datatables values
    Sunstone.runAction("DatastoreImageInfo.list");

    Sunstone.runAction("Datastore.fetch_permissions",info.ID);

}

function hide_all(context)
{
    // Hide all the options that depends on datastore type
    // and reset the selects
    $('label[for="bridge_list"],input#bridge_list',context).hide();
    $('label[for="ds_use_ssh"],input#ds_use_ssh',context).hide();
    $('label[for="tm_use_ssh"],input#tm_use_ssh',context).hide();
    $('label[for="host"],input#host',context).hide();
    $('label[for="base_iqn"],input#base_iqn',context).hide();
    $('label[for="vg_name"],input#vg_name',context).hide();
    $('select#ds_mad').removeAttr('disabled');
    $('select#tm_mad').removeAttr('disabled');
    $('select#tm_mad').children('option').each(function() {
      $(this).removeAttr('disabled');
    });
    $('select#disk_type').removeAttr('disabled');
    $('select#disk_type').children('option').each(function() {
      $(this).removeAttr('disabled');
    });
}

// Set up the create datastore dialog
function setupCreateDatastoreDialog(){

    dialogs_context.append('<div title=\"'+tr("Create Datastore")+'\" id="create_datastore_dialog"></div>');
    //Insert HTML in place
    $create_datastore_dialog = $('#create_datastore_dialog')
    var dialog = $create_datastore_dialog;
    dialog.html(create_datastore_tmpl);

    //Prepare jquery dialog
    //dialog.dialog({
    //    autoOpen: false,
    //    modal: true,
    //    width: 400
    //});
    dialog.addClass("reveal-modal large");

    //$('button',dialog).button();
    setupTips(dialog);

    $('#ds_type').change(function(){
        hide_all($(this).parent());
        var choice_str = $(this).val();
        switch(choice_str)
        {
          case 'fs':
            select_filesystem();
            break;
          case 'vmware_fs':
            select_vmware_fs();
            break;
          case 'vmware_vmfs':
            select_vmware_vmfs();
            break;
          case 'lvm':
            select_lvm();
            break;
          case 'iscsi':
            select_iscsi();
            break;
          case 'ceph':
            select_ceph();
            break;
        }
    });


    $('#create_datastore_submit',dialog).click(function(){
        var context = $( "#create_datastore_form", dialog);
        var name            = $('#name',context).val();
        var cluster_id      = $('#cluster_id',context).val();
        var system          = $('#sys_ds',context).is(':checked');
        var ds_mad          = $('#ds_mad',context).val();
        var tm_mad          = $('#tm_mad',context).val();
        var type            = $('#disk_type',context).val();
        var safe_dirs       = $('#safe_dirs',context).val();
        var restricted_dirs = $('#restricted_dirs',context).val();
        var bridge_list     = $('#bridge_list',context).val();
        var ds_use_ssh      = $('#ds_use_ssh',context).is(':checked');
        var tm_use_ssh      = $('#tm_use_ssh',context).is(':checked');
        var host            = $('#host',context).val();
        var base_iqn        = $('#base_iqn',context).val();
        var vg_name         = $('#vg_name',context).val();



        if (!name){
            notifyError("Please provide a name");
            return false;
        };

        var ds_obj = {
            "datastore" : {
                "name" : name,
                "tm_mad" : tm_mad,
                "disk_type" : type
            },
            "cluster_id" : cluster_id
        };

        // If we are adding a system datastore then
        // we do not use ds_mad
        if (system)
            ds_obj.datastore.system = "YES";
        else
            ds_obj.datastore.ds_mad = ds_mad;

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

        if (host)
            ds_obj.datastore.host = host;

        if (base_iqn)
            ds_obj.datastore.base_iqn = base_iqn;

        if (vg_name)
            ds_obj.vg_name.bridge_list = vg_name;

        Sunstone.runAction("Datastore.create",ds_obj);

        $create_datastore_dialog.trigger("reveal:close")
        return false;
    });
}

function select_filesystem(){
    $('select#ds_mad').val('fs');
    $('select#ds_mad').attr('disabled', 'disabled');
    $('select#tm_mad').children('option').each(function() {
      var value_str = $(this).val();
      $(this).attr('disabled', 'disabled');
      if (value_str == "qcow2"  ||
          value_str == "shared" ||
          value_str == "ssh"    ||
          value_str == "dummy")
      {
           $(this).removeAttr('disabled');
      }
    });
    $('select#disk_type').val('file');
    $('select#disk_type').attr('disabled', 'disabled');
}

function select_vmware_fs(){
    $('select#ds_mad').val('vmware');
    $('select#ds_mad').attr('disabled', 'disabled');
    $('select#tm_mad').children('option').each(function() {
      var value_str = $(this).val();
      $(this).attr('disabled', 'disabled');
      if (value_str == "shared"  ||
          value_str == "ssh")
      {
           $(this).removeAttr('disabled');
      }
    });
    $('select#disk_type').val('file');
    $('select#disk_type').attr('disabled', 'disabled');
}

function select_vmware_vmfs(){
    $('label[for="bridge_list"],input#bridge_list').fadeIn();
    $('label[for="ds_use_ssh"],input#ds_use_ssh').fadeIn();
    $('label[for="tm_use_ssh"],input#tm_use_ssh').fadeIn();
    $('select#ds_mad').val('vmfs');
    $('select#ds_mad').attr('disabled', 'disabled');
    $('select#tm_mad').val('vmfs');
    $('select#tm_mad').attr('disabled', 'disabled');
    $('select#disk_type').val('file');
    $('select#disk_type').attr('disabled', 'disabled');
}

function select_iscsi(){
    $('label[for="host"],input#host').fadeIn();
    $('label[for="base_iqn"],input#base_iqn').fadeIn();
    $('label[for="vg_name"],input#vg_name').fadeIn();
    $('select#disk_type').children('option').each(function() {
      var value_str = $(this).val();
      $(this).attr('disabled', 'disabled');
      if (value_str == "file"  ||
          value_str == "block")
      {
           $(this).removeAttr('disabled');
      }
    });
}

function select_ceph(){
    $('select#ds_mad').val('ceph');
    $('select#ds_mad').attr('disabled', 'disabled');
    $('select#tm_mad').val('ceph');
    $('select#tm_mad').attr('disabled', 'disabled');
    $('select#ds_type').val('rbd');
}

function select_lvm(){
    $('select#ds_mad').val('lvm');
    $('select#ds_mad').attr('disabled', 'disabled');
    $('select#tm_mad').val('lvm');
    $('select#tm_mad').attr('disabled', 'disabled');
    $('label[for="host"],input#host').fadeIn();
    $('label[for="vg_name"],input#vg_name').fadeIn();
    $('select#disk_type').children('option').each(function() {
      var value_str = $(this).val();
      $(this).attr('disabled', 'disabled');
      if (value_str == "file"  ||
          value_str == "block")
      {
           $(this).removeAttr('disabled');
      }
    });
}

function popUpCreateDatastoreDialog(){
    $('select#cluster_id',$create_datastore_dialog).html(clusters_sel());
    $create_datastore_dialog.reveal();
    hide_all($create_datastore_dialog);
    select_filesystem();
}

//Prepares autorefresh
function setDatastoreAutorefresh(){
     setInterval(function(){
         var checked = $('input.check_item:checked',dataTable_datastores);
         var filter = $("#datastore_search").attr('value');
         if (!checked.length && !filter.length){
             Sunstone.runAction("Datastore.autorefresh");
         };
     },INTERVAL+someTime());
}

$(document).ready(function(){

    dataTable_datastores = $("#datatable_datastores",main_tabs_context).dataTable({
        "sDom" : "<'H'>t<'row'<'six columns'i><'six columns'p>>",
        "oColVis": {
            "aiExclude": [ 0 ]
        },
        "aoColumnDefs": [
            { "bSortable": false, "aTargets": ["check"] },
            { "sWidth": "60px", "aTargets": [0] },
            { "sWidth": "35px", "aTargets": [1,9] },
            { "sWidth": "100px", "aTargets": [2,3,5,7,8] },
            { "bVisible": false, "aTargets": [6,7,8,9] }
        ],
        "oLanguage": (datatable_lang != "") ?
            {
                sUrl: "locale/"+lang+"/"+datatable_lang
            } : ""
    });

    $('#datastore_search').keyup(function(){
      dataTable_datastores.fnFilter( $(this).val() );
    })

    //dataTable_datastores.fnClearTable();
    //addElement([
    //    spinner,
    //    '','','','','','','','',''],dataTable_datastores);
    Sunstone.runAction("Datastore.list");

    setupCreateDatastoreDialog();
    setDatastoreAutorefresh();

    initCheckAllBoxes(dataTable_datastores);
    tableCheckboxesListener(dataTable_datastores);
    infoListener(dataTable_datastores,'Datastore.showinfo');

    // Reset filter in case the view was filtered because it was accessed
    // from a single cluster.
    $('div#menu li#li_datastores_tab').live('click',function(){
        dataTable_datastores.fnFilter('',5);
    });

    $('div#datastores_tab div.legend_div').hide();
})