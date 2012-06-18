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
<h2>'+tr("Datastores")+'</h2>\
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
  <label for="cluster">' + tr("Cluster") + ':</label>\
  <select id="cluster_id" name="cluster_id">\
  </select>\
  <label>' + tr("Datastore manager") + ':</label>\
  <select id="ds_mad" name="ds_mad">\
        <option value="fs">' + tr("Filesystem") + '</option>\
        <option value="vmware">' + tr("VMware") + '</option>\
        <option value="iscsi">' + tr("iSCSI") + '</option>\
        <option value="lvm">' + tr("LVM") + '</option>\
  </select>\
  <label>' + tr("Transfer manager") + ':</label>\
  <select id="tm_mad" name="tm_mad">\
        <option value="shared">' + tr("Shared") + '</option>\
        <option value="ssh">' + tr("SSH") + '</option>\
        <option value="iscsi">' + tr("iSCSI") + '</option>\
        <option value="dummy">' + tr("Dummy") + '</option>\
  </select>\
  <label>' + tr("Disk type") + ':</label>\
  <select id="disk_type" name="disk_type">\
        <option value="file">' + tr("File") + '</option>\
        <option value="block">' + tr("Block") + '</option>\
  </select>\
  </fieldset>\
  <fieldset>\
    <div class="form_buttons">\
        <div><button class="button" type="submit" id="create_datastore_submit" value="OpenNebula.Datastore.create">' + tr("Create") + '</button>\
        <button class="button" type="reset" value="reset">' + tr("Reset") + '</button></div>\
    </div>\
  </fieldset>\
</form></div>';

var update_datastore_tmpl =
   '<form action="javascript:alert(\'js error!\');">\
         <h3 style="margin-bottom:10px;">'+tr("Please, choose and modify the datastore you want to update")+':</h3>\
            <fieldset style="border-top:none;">\
                 <label for="datastore_template_update_select">'+tr("Select a datastore")+':</label>\
                 <select id="datastore_template_update_select" name="datastore_template_update_select"></select>\
                 <div class="clear"></div>\
                 <div>\
                   <table class="permissions_table" style="padding:0 10px;">\
                     <thead><tr>\
                         <td style="width:130px">'+tr("Permissions")+':</td>\
                         <td style="width:40px;text-align:center;">'+tr("Use")+'</td>\
                         <td style="width:40px;text-align:center;">'+tr("Manage")+'</td>\
                         <td style="width:40px;text-align:center;">'+tr("Admin")+'</td></tr></thead>\
                     <tr>\
                         <td>'+tr("Owner")+'</td>\
                         <td style="text-align:center"><input type="checkbox" name="datastore_owner_u" class="owner_u" /></td>\
                         <td style="text-align:center"><input type="checkbox" name="datastore_owner_m" class="owner_m" /></td>\
                         <td style="text-align:center"><input type="checkbox" name="datastore_owner_a" class="owner_a" /></td>\
                     </tr>\
                     <tr>\
                         <td>'+tr("Group")+'</td>\
                         <td style="text-align:center"><input type="checkbox" name="datastore_group_u" class="group_u" /></td>\
                         <td style="text-align:center"><input type="checkbox" name="datastore_group_m" class="group_m" /></td>\
                         <td style="text-align:center"><input type="checkbox" name="datastore_group_a" class="group_a" /></td>\
                     </tr>\
                     <tr>\
                         <td>'+tr("Other")+'</td>\
                         <td style="text-align:center"><input type="checkbox" name="datastore_other_u" class="other_u" /></td>\
                         <td style="text-align:center"><input type="checkbox" name="datastore_other_m" class="other_m" /></td>\
                         <td style="text-align:center"><input type="checkbox" name="datastore_other_a" class="other_a" /></td>\
                     </tr>\
                   </table>\
                 </div>\
                 <label for="datastore_template_update_textarea">'+tr("Datastore")+':</label>\
                 <div class="clear"></div>\
                 <textarea id="datastore_template_update_textarea" style="width:100%; height:14em;"></textarea>\
            </fieldset>\
            <fieldset>\
                 <div class="form_buttons">\
                    <button class="button" id="datastore_template_update_button" value="Datastore.update_template">\
                       '+tr("Update")+'\
                    </button>\
                 </div>\
            </fieldset>\
</form>';

var datastores_select="";
var dataTable_datastores;
var $create_datastore_dialog;

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

    "Datastore.fetch_template" : {
        type: "single",
        call: OpenNebula.Datastore.fetch_template,
        callback: function (request,response) {
            $('#datastore_template_update_dialog #datastore_template_update_textarea').val(response.template);
        },
        error: onError
    },

    "Datastore.fetch_permissions" : {
        type: "single",
        call: OpenNebula.Datastore.show,
        callback: function(request,element_json){
            var dialog = $('#datastore_template_update_dialog form');
            var ds = element_json.DATASTORE;
            setPermissionsTable(ds,dialog);
        },
        error: onError
    },

    "Datastore.update_dialog" : {
        type: "custom",
        call: popUpDatastoreTemplateUpdateDialog,
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
            Sunstone.runAction("Cluster.adddatastore",cluster,ds);
        },
        elements: datastoreElements,
        notify:true,
    },

    "Datastore.help" : {
        type: "custom",
        call: function() {
            hideDialog();
            $('div#datastores_tab div.legend_div').slideToggle();
        }
    },

};

var datastore_buttons = {
    "Datastore.refresh" : {
        type: "image",
        text: tr("Refresh list"),
        img: "images/Refresh-icon.png"
    },
    "Datastore.create_dialog" : {
        type: "create_dialog",
        text: tr("+ New"),
        condition: mustBeAdmin,
    },
    "Datastore.update_dialog" : {
        type: "action",
        text: tr("Update properties"),
        alwaysActive: true,
        condition: mustBeAdmin,
    },
    "Datastore.addtocluster" : {
        type: "confirm_with_select",
        text: tr("Select cluster"),
        select: clusters_sel,
        tip: tr("Select the destination cluster:"),
        condition: mustBeAdmin,
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
        title: tr("Datastore information"),
        content: ""
    },
    "datastore_template_tab" : {
        title: tr("Datastore template"),
        content: ""
    },
}

var datastores_tab = {
    title: tr("Datastores"),
    content: datastores_tab_content,
    buttons: datastore_buttons,
    tabClass: "subTab",
    parentTab: "infra_tab",
    showOnTopMenu: false,
}

Sunstone.addActions(datastore_actions);
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
        element.TEMPLATE.TM_MAD,
        element.TEMPLATE.DS_MAD
    ];
}

function updateDatastoreSelect(){
    datastores_select = makeSelectOptions(dataTable_datastores,
                                          1,
                                          4,
                                          [1],
                                          [0], //do not include sys datastores
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

    var info_tab = {
        title : tr("Datastore information"),
        content:
        '<table id="info_datastore_table" class="info_table" style="width:80%">\
            <thead>\
              <tr><th colspan="2">'+tr("Datastore information")+' - '+info.NAME+'</th></tr>\
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
              <tr>\
                 <td class="key_td">'+tr("Images")+'</td>\
                 <td class="value_td">'+images_str+'</td>\
              </tr>\
              <tr><td class="key_td">'+tr("Permissions")+'</td><td></td></tr>\
              <tr>\
                <td class="key_td">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'+tr("Owner")+'</td>\
                <td class="value_td" style="font-family:monospace;">'+ownerPermStr(info)+'</td>\
              </tr>\
              <tr>\
                <td class="key_td">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'+tr("Group")+'</td>\
                <td class="value_td" style="font-family:monospace;">'+groupPermStr(info)+'</td>\
              </tr>\
              <tr>\
                <td class="key_td"> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'+tr("Other")+'</td>\
                <td class="value_td" style="font-family:monospace;">'+otherPermStr(info)+'</td>\
              </tr>\
            </tbody>\
          </table>'
    }

    var template_tab = {
        title: tr("Datastore Template"),
        content:
        '<table id="datastore_template_table" class="info_table" style="width:80%">\
               <thead><tr><th colspan="2">'+tr("Datastore template")+'</th></tr></thead>'+
                prettyPrintJSON(info.TEMPLATE)+
            '</table>'
    }

    Sunstone.updateInfoPanelTab("datastore_info_panel","datastore_info_tab",info_tab);
    Sunstone.updateInfoPanelTab("datastore_info_panel","datastore_template_tab",template_tab);
    Sunstone.popUpInfoPanel("datastore_info_panel");
}

// Sets up the create-template dialog and all the processing associated to it,
// which is a lot.
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

    $('#create_datastore_form',dialog).submit(function(){
        var name = $('#name',this).val();
        var cluster_id = $('#cluster_id',this).val();
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
                "ds_mad" : ds_mad,
                "tm_mad" : tm_mad,
                "disk_type" : type
            },
            "cluster_id" : cluster_id
        };

        Sunstone.runAction("Datastore.create",ds_obj);

        $create_datastore_dialog.dialog('close');
        return false;
    });
}

function popUpCreateDatastoreDialog(){
    $('select#cluster_id',$create_datastore_dialog).html(clusters_sel());
    $create_datastore_dialog.dialog('open');
}

function setupDatastoreTemplateUpdateDialog(){
    //Append to DOM
    dialogs_context.append('<div id="datastore_template_update_dialog" title="'+tr("Update Datastore properties")+'"></div>');
    var dialog = $('#datastore_template_update_dialog',dialogs_context);

    //Put HTML in place
    dialog.html(update_datastore_tmpl);

    var height = Math.floor($(window).height()*0.8); //set height to a percentage of the window

    //Convert into jQuery
    dialog.dialog({
        autoOpen:false,
        width:500,
        modal:true,
        height:height,
        resizable:true,
    });

    $('button',dialog).button();

    $('#datastore_template_update_select',dialog).change(function(){
        var id = $(this).val();
        $('.permissions_table input',dialog).removeAttr('checked');
        $('.permissions_table',dialog).removeAttr('update');
        if (id && id.length){
            var dialog = $('#datastore_template_update_dialog');
            $('#template_template_update_textarea',dialog).val(tr("Loading")+"...");
            Sunstone.runAction("Datastore.fetch_template",id);
            Sunstone.runAction("Datastore.fetch_permissions",id);
        } else {
            $('#datastore_template_update_textarea',dialog).val("");
        };
    });

    $('.permissions_table input',dialog).change(function(){
        $(this).parents('table').attr('update','update');
    });

    $('form',dialog).submit(function(){
        var dialog = $(this);
        var new_template = $('#datastore_template_update_textarea',dialog).val();
        var id = $('#datastore_template_update_select',dialog).val();
        if (!id || !id.length) {
            $(this).parents('#datastore_template_update_dialog').dialog('close');
            return false;
        };

        var permissions = $('.permissions_table',dialog);
        if (permissions.attr('update')){
            var perms = {
                octet : buildOctet(permissions)
            };
            Sunstone.runAction("Datastore.chmod",id,perms);
        };

        Sunstone.runAction("Datastore.update",id,new_template);
        $(this).parents('#datastore_template_update_dialog').dialog('close');
        return false;
    });
};

function popUpDatastoreTemplateUpdateDialog(){
    var select = makeSelectOptions(dataTable_datastores,
                                   1,//id_col
                                   4,//name_col
                                   [],
                                   []
                                  );
    var sel_elems = getSelectedNodes(dataTable_datastores);


    var dialog =  $('#datastore_template_update_dialog');
    $('#datastore_template_update_select',dialog).html(select);
    $('#datastore_template_update_textarea',dialog).val("");
    $('.permissions_table input',dialog).removeAttr('checked');
    $('.permissions_table',dialog).removeAttr('update');

    if (sel_elems.length >= 1){ //several items in the list are selected
        //grep them
        var new_select= sel_elems.length > 1? '<option value="">Please select</option>' : "";
        $('option','<select>'+select+'</select>').each(function(){
            var val = $(this).val();
            if ($.inArray(val,sel_elems) >= 0){
                new_select+='<option value="'+val+'">'+$(this).text()+'</option>';
            };
        });
        $('#datastore_template_update_select',dialog).html(new_select);
        if (sel_elems.length == 1) {
            $('#datastore_template_update_select option',dialog).attr('selected','selected');
            $('#datastore_template_update_select',dialog).trigger("change");
        };
    };

    dialog.dialog('open');
    return false;
};

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
            { "sWidth": "35px", "aTargets": [1] },
            { "sWidth": "100px", "aTargets": [2,3,5,7,8] },
            { "bVisible": false, "aTargets": [6,7,8] }
        ],
        "oLanguage": (datatable_lang != "") ?
            {
                sUrl: "locale/"+lang+"/"+datatable_lang
            } : ""
    });

    dataTable_datastores.fnClearTable();
    addElement([
        spinner,
        '','','','','','','',''],dataTable_datastores);
    Sunstone.runAction("Datastore.list");

    setupCreateDatastoreDialog();
    setupDatastoreTemplateUpdateDialog();
    setDatastoreAutorefresh();

    initCheckAllBoxes(dataTable_datastores);
    tableCheckboxesListener(dataTable_datastores);
    infoListener(dataTable_datastores,'Datastore.showinfo');

    $('div#menu li#li_datastores_tab').live('click',function(){
        dataTable_datastores.fnFilter('',5);
    });

    $('div#datastores_tab div.legend_div').hide();
})