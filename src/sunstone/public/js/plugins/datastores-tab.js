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

/*Datastore tab plugin*/


var datastores_tab_content = '\
<h2><i class="icon-folder-open"></i> '+tr("Datastores")+'</h2>\
<form id="form_datastores" action="javascript:alert(\'js errors?!\')">\
  <div class="action_blocks">\
  </div>\
<table id="datatable_datastores" class="display">\
  <thead>\
    <tr>\
      <th class="check"><input type="checkbox" class="check_all" value="">' + tr("All") + '</input></th>\
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
'<div class="create_form"><form id="create_datastore_form" action="">\
  <fieldset>\
  <label for="name">' + tr("Name") + ':</label>\
  <input type="text" name="name" id="name" />\
  <div class="clear"></div>\
  <label for="system">' + tr("System datastore") + ':</label>\
  <input id="sys_ds" type="checkbox" name="system" value="YES" />\
  <div class="clear"></div>\
  <label for="cluster">' + tr("Cluster") + ':</label>\
  <select id="cluster_id" name="cluster_id">\
  </select><br />\
  <label for="ds_mad">' + tr("Datastore manager") + ':</label>\
  <select id="ds_mad" name="ds_mad">\
        <option value="fs">' + tr("Filesystem") + '</option>\
        <option value="vmware">' + tr("VMware") + '</option>\
        <option value="iscsi">' + tr("iSCSI") + '</option>\
        <option value="lvm">' + tr("LVM") + '</option>\
        <option value="vmfs">' + tr("VMFS") + '</option>\
  </select><br name="ds_mad" />\
  <label>' + tr("Transfer manager") + ':</label>\
  <select id="tm_mad" name="tm_mad">\
        <option value="shared">' + tr("Shared") + '</option>\
        <option value="ssh">' + tr("SSH") + '</option>\
        <option value="iscsi">' + tr("iSCSI") + '</option>\
        <option value="dummy">' + tr("Dummy") + '</option>\
        <option value="vmfs">' + tr("VMFS") + '</option>\
  </select><div class="clear">\
  <label for="disk_type">' + tr("Disk type") + ':</label>\
  <select id="disk_type" name="disk_type">\
        <option value="file">' + tr("File") + '</option>\
        <option value="block">' + tr("Block") + '</option>\
  </select><br />\
  </fieldset>\
  <fieldset>\
    <div class="form_buttons">\
        <div><button class="button" type="submit" id="create_datastore_submit" value="OpenNebula.Datastore.create">' + tr("Create") + '</button>\
        <button class="button" type="reset" value="reset">' + tr("Reset") + '</button></div>\
    </div>\
  </fieldset>\
</form></div>';

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
        call: OpenNebula.Network.update,
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
//        callback
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
        text: '<i class="icon-refresh icon-large">',
        alwaysActive: true
    },
    "Datastore.create_dialog" : {
        type: "create_dialog",
        text: tr("+ New"),
        condition: mustBeAdmin
    },
    "Datastore.addtocluster" : {
        type: "confirm_with_select",
        text: tr("Select cluster"),
        select: clusters_sel,
        tip: tr("Select the destination cluster:"),
        condition: mustBeAdmin
    },
    "Datastore.chown" : {
        type: "confirm_with_select",
        text: tr("Change owner"),
        select: users_sel,
        tip: tr("Select the new owner")+":",
        condition: mustBeAdmin
    },
    "Datastore.chgrp" : {
        type: "confirm_with_select",
        text: tr("Change group"),
        select: groups_sel,
        tip: tr("Select the new group")+":",
        condition: mustBeAdmin
    },
    "Datastore.delete" : {
        type: "confirm",
        text: tr("Delete"),
        condition: mustBeAdmin
    },

    "Datastore.help" : {
        type: "action",
        text: '?',
        alwaysActive: true
    }
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

    var info_tab_content = '<table id="info_datastore_table" class="info_table">\
            <thead>\
              <tr><th colspan="2">'+tr("Information for Datastore")+' - '+info.NAME+'</th></tr>\
            </thead>\
            <tbody>\
              <tr>\
                 <td class="key_td">'+tr("ID")+'</td>\
                 <td class="value_td">'+info.ID+'</td>\
              </tr>\
              <tr>\
                 <td class="key_td">'+tr("Name")+'</td>\
                 <td class="value_td">'+info.NAME+'</td>\
              </tr>\
              <tr>\
                 <td class="key_td">'+tr("Owner")+'</td>\
                 <td class="value_td">'+info.UNAME+'</td>\
              </tr>\
              <tr>\
                 <td class="key_td">'+tr("Group")+'</td>\
                 <td class="value_td">'+info.GNAME+'</td>\
              </tr>\
              <tr>\
                 <td class="key_td">'+tr("Cluster")+'</td>\
                 <td class="value_td">'+(info.CLUSTER.length ? info.CLUSTER : "-")+'</td>\
              </tr>\
              <tr>\
                 <td class="key_td">'+tr("DS Mad")+'</td>\
                 <td class="value_td">'+info.DS_MAD+'</td>\
              </tr>\
              <tr>\
                 <td class="key_td">'+tr("TM Mad")+'</td>\
              <td class="value_td">'+ info.TM_MAD +'</td>\
              </tr>\
              <tr>\
                 <td class="key_td">'+tr("Base path")+'</td>\
                 <td class="value_td">'+info.BASE_PATH+'</td>\
              </tr>\
            </tbody>\
          </table>';


    // Inserts the extended template table to the show info tab (down tab)
    info_tab_content += insert_extended_template_table(info.TEMPLATE,
                                         "Datastore",
                                         info.ID)

    // Inserts the change permissions table
    info_tab_content += insert_permissions_table("Datastore",info.ID);


    var info_tab = {
        title : tr("Information"),
        content: info_tab_content
    }

    var datastore_info_tab = {
        title: tr("Images"),
        content : '<div id="datatable_datastore_images_info_div"><table id="datatable_datastore_images_info_panel" class="display">' + datastore_image_table_tmpl + '</table></div>'
    }


    // Add tabs
    Sunstone.updateInfoPanelTab("datastore_info_panel","datastore_info_tab",info_tab);
    Sunstone.updateInfoPanelTab("datastore_info_panel","datastore_image_tab",datastore_info_tab);
    Sunstone.popUpInfoPanel("datastore_info_panel");

    // Define datatables
    // Images datatable

    dataTable_datastore_images_panel = $("#datatable_datastore_images_info_panel").dataTable({
        "bJQueryUI": true,
        "bSortClasses": false,
        "bAutoWidth":false,
        "sDom" : '<"H"lfrC>t<"F"ip>',
        "oColVis": {
            "aiExclude": [ 0 ]
        },
        "sPaginationType": "full_numbers",
        "aoColumnDefs": [
            { "bSortable": false, "aTargets": ["check"] },
            { "sWidth": "60px", "aTargets": [0,2,3,9,10] },
            { "sWidth": "35px", "aTargets": [1,6,11,12] },
            { "sWidth": "100px", "aTargets": [5,7] },
            { "sWidth": "150px", "aTargets": [8] },
            { "bVisible": false, "aTargets": [6,8,12]}
        ],
        "oLanguage": (datatable_lang != "") ?
            {
                sUrl: "locale/"+lang+"/"+datatable_lang
            } : ""
    });

    //preload it
    dataTable_datastore_images_panel.fnClearTable();

    addElement([
        spinner,
        '','','','','','','','','','','',''],dataTable_datastore_images_panel);


    // initialize datatables values
    Sunstone.runAction("DatastoreImageInfo.list");

    Sunstone.runAction("Datastore.fetch_permissions",info.ID);

}

// Set up the create datastore dialog
function setupCreateDatastoreDialog(){

    dialogs_context.append('<div title=\"'+tr("Create Datastore")+'\" id="create_datastore_dialog"></div>');
    //Insert HTML in place
    $create_datastore_dialog = $('#create_datastore_dialog')
    var dialog = $create_datastore_dialog;
    dialog.html(create_datastore_tmpl);

    //Prepare jquery dialog
    dialog.dialog({
        autoOpen: false,
        modal: true,
        width: 400
    });

    $('button',dialog).button();
    setupTips(dialog);

    $('#sys_ds').click(function(){
        if ($(this).is(':checked'))
            $('label[for="ds_mad"],select#ds_mad,br[name="ds_mad"]',$(this).parent()).fadeOut();
        else
            $('label[for="ds_mad"],select#ds_mad,br[name="ds_mad"]',$(this).parent()).fadeIn();
    });

    $('#create_datastore_form',dialog).submit(function(){
        var name = $('#name',this).val();
        var cluster_id = $('#cluster_id',this).val();
        var system = $('#sys_ds',this).is(':checked');
        var ds_mad = $('#ds_mad',this).val();
        var tm_mad = $('#tm_mad',this).val();
        var type = $('#disk_type',this).val();

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

        Sunstone.runAction("Datastore.create",ds_obj);

        $create_datastore_dialog.dialog('close');
        return false;
    });
}

function popUpCreateDatastoreDialog(){
    $('select#cluster_id',$create_datastore_dialog).html(clusters_sel());
    $create_datastore_dialog.dialog('open');
}

//Prepares autorefresh
function setDatastoreAutorefresh(){
     setInterval(function(){
         var checked = $('input.check_item:checked',dataTable_datastores);
         var filter = $("#datatable_datastores_filter input",
                        dataTable_datastores.parents('#datatable_datastores_wrapper')).attr('value');
         if (!checked.length && !filter.length){
             Sunstone.runAction("Datastore.autorefresh");
         };
     },INTERVAL+someTime());
}


$(document).ready(function(){

    dataTable_datastores = $("#datatable_datastores",main_tabs_context).dataTable({
        "bJQueryUI": true,
        "bSortClasses": false,
        "sDom" : '<"H"lfrC>t<"F"ip>',
        "oColVis": {
            "aiExclude": [ 0 ]
        },
        "sPaginationType": "full_numbers",
        "bAutoWidth":false,
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

    dataTable_datastores.fnClearTable();
    addElement([
        spinner,
        '','','','','','','','',''],dataTable_datastores);
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