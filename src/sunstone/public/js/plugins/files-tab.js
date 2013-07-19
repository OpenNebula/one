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

/*Files tab plugin*/

var files_tab_content = '\
<form class="custom" id="file_form" action="">\
<div class="panel">\
<div class="row">\
  <div class="twelve columns">\
    <h4 class="subheader header">\
      <span class="header-resource">\
        <i class="icon-folder-open"></i> '+tr("Files & Kernels")+'\
      </span>\
      <span class="header-info">\
        <span id="total_files"/> <small>'+tr("TOTAL")+'</small>&emsp;\
        <span id="size_files"/> <small>'+tr("SIZE")+'</small>\
      </span>\
      <span class="user-login">\
      </span>\
    </h4>\
  </div>\
</div>\
<div class="row">\
  <div class="ten columns">\
    <div class="action_blocks">\
    </div>\
  </div>\
  <div class="two columns">\
    <input id="file_search" type="text" placeholder="'+tr("Search")+'" />\
  </div>\
</div>\
</div>\
  <div class="">\
    <div class="twelve columns">\
  <div id="files_upload_progress_bars"></div>\
</div>\
</div>\
  <div class="row">\
    <div class="twelve columns">\
<table id="datatable_files" class="datatable twelve">\
  <thead>\
    <tr>\
      <th class="check"><input type="checkbox" class="check_all" value=""></input></th>\
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
  <tbody id="tbodyfiles">\
  </tbody>\
</table>\
</form>';

var create_file_tmpl =
  '<div class="panel">\
    <h3><small>'+tr("Create File")+'</small></h3>\
   </div>\
   <div class="reveal-body">\
   <form id="create_file_form_easy" action="" class="custom creation">\
      <dl class="tabs">\
          <dd class="active"><a href="#file_easy">'+tr("Wizard")+'</a></dd>\
          <dd><a href="#file_manual">'+tr("Advanced mode")+'</a></dd>\
      </dl>\
      <ul class="tabs-content">\
        <li id="file_easyTab" class="active">\
            <div class="row vm_param">\
              <div class="six columns">\
                <div class="row">\
                  <div class="four columns">\
                    <label class="right inline" for="img_name">'+tr("Name")+':</label>\
                  </div>\
                  <div class="seven columns">\
                    <input type="text" name="img_name" id="img_name" />\
                  </div>\
                  <div class="one columns tip">'+tr("Name that the File will get. Every file must have a unique name.")+'</div>\
                </div>\
                <div class="row">\
                  <div class="four columns">\
                    <label class="right inline" for="img_desc">'+tr("Description")+':</label>\
                  </div>\
                  <div class="seven columns">\
                    <textarea name="img_desc" id="img_desc" rows="4"></textarea>\
                  </div>\
                  <div class="one columns">\
                    <div class="tip">'+tr("Human readable description of the file for other users.")+'</div>\
                  </div>\
                </div>\
              </div>\
              <div class="six columns">\
                <div class="row">\
                  <div class="four columns">\
                    <label class="right inline" for="img_type">'+tr("Type")+':</label>\
                  </div>\
                  <div class="seven columns">\
                   <select name="img_type" id="img_type">\
                        <option value="KERNEL">'+tr("Kernel")+'</option>\
                        <option value="RAMDISK">'+tr("Ramdisk")+'</option>\
                        <option value="CONTEXT">'+tr("Context")+'</option>\
                   </select>\
                  </div>\
                  <div class="one columns">\
                    <div class="tip">'+tr("Type of the file, explained in detail in the following section. If omitted, the default value is the one defined in oned.conf (install default is OS).")+'</div>\
                  </div>\
                </div>\
                <div class="row">\
                  <div class="four columns">\
                    <label class="right inline" for="file_datastore">'+tr("Datastore")+':</label>\
                  </div>\
                  <div class="seven columns">\
                   <select id="file_datastore" name="file_datastore">\
                   </select>\
                  </div>\
                  <div class="one columns">\
                    <div class="tip">'+tr("Select the datastore for this file")+'</div>\
                  </div>\
                </div>\
              </div>\
            </div>\
           <div class="row">\
           <fieldset>\
           <legend>'+tr("File location")+':</legend>\
           <div class="row" id="src_path_select">\
                  <div class="five columns centered">\
                   <input type="radio" name="src_path" id="path_img" value="path">'+ tr("Provide a path")+'&emsp;</input> \
                   <input type="radio" name="src_path" id="upload_img" value="upload"> '+tr("Upload")+'</input> &emsp;\
                  </div>\
           </div>\
           <hr>\
           <div class="img_param row">\
             <div class="eight columns centered">\
              <div class="two columns">\
                <label class="right inline" for="img_path">'+tr("Path")+':</label>\
              </div>\
              <div class="nine columns">\
               <input type="text" name="img_path" id="img_path" />\
              </div>\
              <div class="one columns">\
                <div class="tip">'+tr("Path to the original file that will be copied to the file repository. If not specified for a DATABLOCK type file, an empty file will be created.")+'</div>\
              </div>\
           </div>\
           </div>\
           <div class="img_param" id="files_upload_div">\
             <div class="row">\
                <div class="columns eight centered">\
                  <div id="files_file-uploader"></div>\
                </div>\
             </div>\
            </div>\
           </fieldset>\
           </div>\
      <div class="reveal-footer">\
            <hr>\
      <div class="form_buttons">\
        <button class="button success radius right" id="create_file_submit" value="file/create">'+tr("Create")+'</button>\
        <button class="button secondary radius" type="reset" value="reset">'+tr("Reset")+'</button>\
        <button class="close-reveal-modal button secondary radius" type="button" value="close">' + tr("Close") + '</button>\
          </div>\
      </div>\
        </li>\
        <li id="file_manualTab">\
        <div class="reveal-body">\
                 <div class="columns three">\
                   <label class="inline left" for="file_datastores_raw">'+tr("Datastore")+':</label>\
                 </div>\
                 <div class="columns nine">\
                   <select id="file_datastore_raw" name="file_datastore_raw"></select>\
                 </div>\
                 <textarea id="template" rows="15" style="width:100%;"></textarea>\
          </div>\
          <div class="reveal-footer">\
               <hr>\
               <div class="form_buttons">\
                 <button class="button success radius right" id="create_file_submit_manual" value="file/create">'+tr("Create")+'</button>\
                 <button class="button secondary radius" type="reset" value="reset">'+tr("Reset")+'</button>\
                 <button class="close-reveal-modal button secondary radius" type="button" value="close">' + tr("Close") + '</button>\
               </div>\
          </div>\
        </li>\
        </ul>\
   <a class="close-reveal-modal">&#215;</a>\
   </form>\
  </div>';

var dataTable_files;
var $create_file_dialog;

var file_actions = {

    "File.create" : {
        type: "create",
        call: OpenNebula.Image.create,
        callback: addFileElement,
        error: onError,
        notify:true
    },

    "File.create_dialog" : {
        type: "custom",
        call: popUpCreateFileDialog
    },

    "File.list" : {
        type: "list",
        call: OpenNebula.Image.list,
        callback: updateFilesView,
        error: onError
    },

    "File.show" : {
        type : "single",
        call: OpenNebula.Image.show,
        callback: updateFileElement,
        error: onError
    },

    "File.showinfo" : {
        type: "single",
        call: OpenNebula.Image.show,
        callback: updateFileInfo,
        error: onError
    },

    "File.refresh" : {
        type: "custom",
        call: function () {
            waitingNodes(dataTable_files);
            Sunstone.runAction("File.list");
        }
    },

    "File.autorefresh" : {
        type: "custom",
        call: function() {
            OpenNebula.Image.list({timeout: true, success: updateFilesView, error: onError});
        }
    },

    "File.update_template" : {
        type: "single",
        call: OpenNebula.Image.update,
        callback: function(request) {
            notifyMessage("Template updated correctly");
            Sunstone.runAction('Image.showinfo',request.request.data[0]);
        },
        error: onError
    },

    "File.enable" : {
        type: "multiple",
        call: OpenNebula.Image.enable,
        callback: function (req) {
            Sunstone.runAction("File.show",req.request.data[0]);
        },
        elements: fileElements,
        error: onError,
        notify: true
    },

    "File.disable" : {
        type: "multiple",
        call: OpenNebula.Image.disable,
        callback: function (req) {
            Sunstone.runAction("File.show",req.request.data[0]);
        },
        elements: fileElements,
        error: onError,
        notify: true
    },

    "File.delete" : {
        type: "multiple",
        call: OpenNebula.Image.del,
        callback: deleteFileElement,
        elements: fileElements,
        error: onError,
        notify: true
    },

    "File.chown" : {
        type: "multiple",
        call: OpenNebula.Image.chown,
        callback:  function (req) {
            Sunstone.runAction("File.show",req.request.data[0][0]);
            Sunstone.runAction('Image.showinfo',req.request.data[0]);
        },
        elements: fileElements,
        error: onError,
        notify: true
    },

    "File.chgrp" : {
        type: "multiple",
        call: OpenNebula.Image.chgrp,
        callback: function (req) {
            Sunstone.runAction("File.show",req.request.data[0][0]);
            Sunstone.runAction('Image.showinfo',req.request.data[0]);
        },
        elements: fileElements,
        error: onError,
        notify: true
    },

    "File.chmod" : {
        type: "single",
        call: OpenNebula.Image.chmod,
//        callback
        error: onError,
        notify: true
    },

    "File.chtype" : {
        type: "single",
        call: OpenNebula.Image.chtype,
        callback: function (req) {
            Sunstone.runAction("File.show",req.request.data[0][0]);
            Sunstone.runAction("File.list");
        },
        elements: fileElements,
        error: onError,
        notify: true
    },
    "File.help" : {
        type: "custom",
        call: function() {
            hideDialog();
            $('div#files_tab div.legend_div').slideToggle();
        }
    },
    "File.rename" : {
        type: "single",
        call: OpenNebula.Image.rename,
        callback: function(request) {
            notifyMessage("File renamed correctly");
            Sunstone.runAction('Image.showinfo',request.request.data[0]);
            Sunstone.runAction('Image.list');
        },
        error: onError,
        notify: true
    },
};


var file_buttons = {
    "File.refresh" : {
        type: "action",
        layout: "refresh",
        alwaysActive: true
    },
    "File.create_dialog" : {
        type: "create_dialog",
        layout: "create"
    },
    "File.chown" : {
        type: "confirm_with_select",
        text: tr("Change owner"),
        layout: "user_select",
        select: users_sel,
        tip: tr("Select the new owner")+":",
        condition: mustBeAdmin
    },
    "File.chgrp" : {
        type: "confirm_with_select",
        text: tr("Change group"),
        layout: "user_select",
        select: groups_sel,
        tip: tr("Select the new group")+":",
        condition: mustBeAdmin
    },
    "File.enable" : {
        type: "action",
        layout: "more_select",
        text: tr("Enable")
    },
    "File.disable" : {
        type: "action",
        layout: "more_select",
        text: tr("Disable")
    },
    "File.delete" : {
        type: "confirm",
        layout: "del",
        text: tr("Delete")
    },
    //"File.help" : {
    //    type: "action",
    //    text: '?',
    //    alwaysActive: true
    //}
}

var file_info_panel = {
    "file_info_tab" : {
        title: tr("Information"),
        content: ""
    }
}

var files_tab = {
    title: tr("Files & Kernels"),
    content: files_tab_content,
    buttons: file_buttons,
    tabClass: 'subTab',
    parentTab: 'vresources-tab'
}

Sunstone.addActions(file_actions);
Sunstone.addMainTab('files-tab',files_tab);
Sunstone.addInfoPanel('file_info_panel',file_info_panel);


function fileElements() {
    return getSelectedNodes(dataTable_files);
}

// Returns an array containing the values of the file_json and ready
// to be inserted in the dataTable
function fileElementArray(file_json){
    //Changing this? It may affect to the is_persistent() functions.
    var file = file_json.IMAGE;

    // OS || CDROM || DATABLOCK
    if (file.TYPE == "0" ||  file.TYPE == "1" || file.TYPE == "2") {
      return false;
    }


    size_files = size_files + parseInt(file.SIZE);

    //add also persistent/non-persistent selects, type select.
    return [
        '<input class="check_item" type="checkbox" id="file_'+file.ID+'" name="selected_items" value="'+file.ID+'"/>',
        file.ID,
        file.UNAME,
        file.GNAME,
        file.NAME,
        file.DATASTORE,
        file.SIZE,
        OpenNebula.Helper.image_type(file.TYPE),
        pretty_time(file.REGTIME),
        parseInt(file.PERSISTENT) ? "yes" : "no",
        OpenNebula.Helper.resource_state("image",file.STATE),
        file.RUNNING_VMS,
        file.TEMPLATE.TARGET ? file.TEMPLATE.TARGET : '--'
        ];
}

// Callback to update an element in the dataTable
function updateFileElement(request, file_json){
    var id = file_json.IMAGE.ID;
    var element = fileElementArray(file_json);
    updateSingleElement(element,dataTable_files,'#file_'+id);
}

// Callback to remove an element from the dataTable
function deleteFileElement(req){
    deleteElement(dataTable_files,'#file_'+req.request.data);
}

// Callback to add an file element
function addFileElement(request, file_json){
    var element = fileElementArray(file_json);
    addElement(element,dataTable_files);
}

// Callback to refresh the list of files
function updateFilesView(request, files_list){
    var file_list_array = [];

    size_files = 0;

    $.each(files_list,function(){
      var file = fileElementArray(this);
      if (file)
        file_list_array.push(file);
    });

    updateView(file_list_array,dataTable_files);

    var size = humanize_size_from_mb(size_files)

    $("#total_files", $dashboard).text(file_list_array.length);
    $("#size_files", $dashboard).text(size);

    var form = $("#file_form");

    $("#total_files", form).text(file_list_array.length);
    $("#size_files", form).text(size);
}

// Callback to update the information panel tabs and pop it up
function updateFileInfo(request,img){
    var img_info = img.IMAGE;
    var info_tab = {
        title: tr("Information"),
        content:
        '<form class="custom"><div class="">\
        <div class="six columns">\
        <table id="info_img_table" class="twelve datatable extended_table">\
           <thead>\
            <tr><th colspan="3">'+tr("File")+' - '+img_info.NAME+'</th></tr>\
           </thead>\
           <tr>\
              <td class="key_td">'+tr("ID")+'</td>\
              <td class="value_td">'+img_info.ID+'</td>\
              <td></td>\
           </tr>\
           <tr>\
            <td class="key_td">'+tr("Name")+'</td>\
            <td class="value_td_rename">'+img_info.NAME+'</td>\
            <td><div id="div_edit_rename">\
                   <a id="div_edit_rename_link_files" class="edit_e" href="#"><i class="icon-edit right"/></a>\
                </div>\
            </td>\
          </tr>\
           <tr>\
              <td class="key_td">'+tr("Datastore")+'</td>\
              <td class="value_td">'+img_info.DATASTORE+'</td>\
              <td></td>\
           </tr>\
           <tr>\
             <td class="key_td">'+tr("Type")+'</td>\
             <td class="value_td_type">'+OpenNebula.Helper.image_type(img_info.TYPE)+'</td>\
             <td><div id="div_edit_chg_type_files">\
                   <a id="div_edit_chg_type_files_link" class="edit_e" href="#"><i class="icon-edit right"/></a>\
                 </div>\
             </td>\
           </tr>\
           <tr>\
             <td class="key_td">'+tr("Register time")+'</td>\
             <td class="value_td">'+pretty_time(img_info.REGTIME)+'</td>\
              <td></td>\
           </tr>\
           <tr>\
              <td class="key_td">'+tr("Filesystem type")+'</td>\
              <td class="value_td">'+(typeof img_info.FSTYPE === "string" ? img_info.FSTYPE : "--")+'</td>\
              <td></td>\
           </tr>\
           <tr>\
              <td class="key_td">'+tr("Size")+'</td>\
              <td class="value_td">'+humanize_size_from_mb(img_info.SIZE)+'</td>\
              <td></td>\
           </tr>\
           <tr>\
              <td class="key_td">'+tr("State")+'</td>\
              <td class="value_td">'+OpenNebula.Helper.resource_state("file",img_info.STATE)+'</td>\
              <td></td>\
           </tr>\
           <tr>\
              <td class="key_td">'+tr("Running VMS")+'</td>\
              <td class="value_td">'+img_info.RUNNING_VMS+'</td>\
              <td></td>\
           </tr>\
        </table>\
        </div>\
        <div class="six columns">'
           + insert_permissions_table('files-tab',
                                   "File",
                                   img_info.ID,
                                   img_info.UNAME,
                                   img_info.GNAME,
                                   img_info.UID,
                                   img_info.GID) +
            insert_extended_template_table(img_info.TEMPLATE,
                                               "File",
                                               img_info.ID,
                                               "Configuration & Tags") +
        '</div>\
      </div></form>'
    }

    $("#div_edit_rename_link_files").die();
    $(".input_edit_value_rename_files").die();
    $("#div_edit_chg_type_files_link").die();
    $("#chg_type_select_files").die();
    $("#div_edit_persistency_files").die();
    $("#persistency_select_files").die();


    // Listener for edit link for rename
    $("#div_edit_rename_link_files").live("click", function() {
        var value_str = $(".value_td_rename").text();
        $(".value_td_rename").html('<input class="input_edit_value_rename_files" id="input_edit_rename" type="text" value="'+value_str+'"/>');
    });

    $(".input_edit_value_rename_files").live("change", function() {
        var value_str = $(".input_edit_value_rename_files").val();
        if(value_str!="")
        {
            // Let OpenNebula know
            var name_template = {"name": value_str};
            Sunstone.runAction("File.rename",img_info.ID,name_template);
        }
    });

    // Listener for edit link for type change
    $("#div_edit_chg_type_files_link").live("click", function() {
        var value_str = $(".value_td_type").text();
        $(".value_td_type").html(
                  '<select id="chg_type_select_files">\
                      <option value="KERNEL">'+tr("Kernel")+'</option>\
                      <option value="RAMDISK">'+tr("Ramdisk")+'</option>\
                      <option value="CONTEXT">'+tr("Context")+'</option>\
                  </select>');
       $('option[value="'+value_str+'"]').replaceWith('<option value="'+value_str+'" selected="selected">'+tr(value_str)+'</option>');
    });

    $("#chg_type_select_files").live("change", function() {
        var new_value=$("option:selected", this).text();
        Sunstone.runAction("File.chtype", img_info.ID, new_value);
        Sunstone.runAction("File.showinfo", img_info.ID);
    });


    Sunstone.updateInfoPanelTab("file_info_panel","file_info_tab",info_tab);
    Sunstone.popUpInfoPanel("file_info_panel", "files-tab");

    $("#file_info_panel_refresh", $("#file_info_panel")).click(function(){
      $(this).html(spinner);
      Sunstone.runAction('File.showinfo', img_info.ID);
    })

    setPermissionsTable(img_info,'');

}

function enable_all_datastores()
{

    $('select#disk_type').children('option').each(function() {
      $(this).removeAttr('disabled');
    });
}

// Prepare the file creation dialog
function setupCreateFileDialog(){
    dialogs_context.append('<div title="'+tr("Create File")+'" id="create_file_dialog"></div>');
    $create_file_dialog =  $('#create_file_dialog',dialogs_context);

    var dialog = $create_file_dialog;
    dialog.html(create_file_tmpl);

    var height = Math.floor($(window).height()*0.8); //set height to a percentage of the window

    //Prepare jquery dialog
    //dialog.dialog({
    //    autoOpen: false,
    //    modal:true,
    //    width: 520,
    //    height: height
    //});
    dialog.addClass("reveal-modal large max-height");


    //$('#img_tabs',dialog).tabs();
    //$('button',dialog).button();
    //$('#datablock_img',dialogs_contextog).attr('disabled','disabled');


    $('select#img_type',dialog).change(function(){
        var value = $(this).val();
        var context = $create_file_dialog;
        switch (value){
        case "DATABLOCK":
            $('#datablock_img',context).removeAttr("disabled");
            //$('#empty_datablock', context).show();
            break;
        default:
            $('#datablock_img',context).attr('disabled','disabled');
            //$('#empty_datablock', context).hide();
            $('#path_img',context).click();

        }
    });


    $('#img_path,#img_fstype,#img_size,#files_file-uploader',dialog).closest('.row').hide();

    $("input[name='src_path']", dialog).change(function(){
        var context = $create_file_dialog;
        var value = $(this).val();
        switch (value){
        case "path":
            $('#img_fstype,#img_size,#files_file-uploader',context).closest('.row').hide();
            $('#img_path',context).closest('.row').show();
            break;
        case "datablock":
            $('#img_path,#files_file-uploader',context).closest('.row').hide();
            $('#img_fstype,#img_size',context).closest('.row').show();
            break;
        case "upload":
            $('#img_path,#img_fstype,#img_size',context).closest('.row').hide();
            $('#files_file-uploader',context).closest('.row').show();
            break;
        };
    });


    $('#path_img',dialog).click();


    $('#add_custom_var_file_button', dialog).click(
        function(){
            var name = $('#custom_var_file_name',$create_file_dialog).val();
            var value = $('#custom_var_file_value',$create_file_dialog).val();
            if (!name.length || !value.length) {
                notifyError(tr("Custom attribute name and value must be filled in"));
                return false;
            }
            option= '<option value=\''+value+'\' name=\''+name+'\'>'+
                name+'='+value+
                '</option>';
            $('select#custom_var_file_box',$create_file_dialog).append(option);
            return false;
        }
    );

    $('#remove_custom_var_file_button', dialog).click(
        function(){
            $('select#custom_var_file_box :selected',$create_file_dialog).remove();
            return false;
        }
    );

    $('#upload-progress',dialog).css({
        border: "1px solid #AAAAAA",
        position: "relative",
//        bottom: "29px",
        width: "258px",
//        left: "133px",
        height: "15px",
        display: "inline-block"
    });
    $('#upload-progress div',dialog).css("border","1px solid #AAAAAA");

    var img_obj;

    // Upload is handled by FileUploader vendor plugin
    var uploader = new qq.FileUploaderBasic({
        button: $('#files_file-uploader',$create_file_dialog)[0],
        action: 'upload',
        multiple: false,
        params: {},
        sizeLimit: 0,
        showMessage: function(message){
            //notifyMessage(message);
        },
        onSubmit: function(id, fileName){
            //set url params
            //since the body is the upload, we need the pass
            //the file info here
            uploader.setParams({
                img : JSON.stringify(img_obj),
                file: fileName
            });
            //we pop up an upload progress dialog
            var pos_top = $(window).height() - 120;
            var pos_left = 220;
            //var pb_dialog = $('<div id="pb_dialog" title="'+
            //                  tr("Uploading...")+'">'+
            //                  '<div id="upload-progress"></div>'+
            //                  '</div>').dialog({
            //                      draggable:true,
            //                      modal:false,
            //                      resizable:false,
            //                      buttons:{},
            //                      width: 460,
            //                      minHeight: 50,
            //                      position: [pos_left, pos_top]
            //                  });


            $('#files_upload_progress_bars').append('<div id="files'+id+'progressBar" class="row" style="margin-bottom:10px">\
              <div class="two columns dataTables_info">\
                '+tr("Uploading...")+'\
              </div>\
              <div class="ten columns">\
                <div id="upload_progress_container" class="progress nine radius" style="height:25px !important">\
                  <span class="meter" style="width:0%"></span>\
                </div>\
                <div class="progress-text" style="margin-left:15px">'+id+' '+fileName+'</div>\
              </div>\
            </div>');

            $('#files'+id+'cancel_upload').click(function(){
              uploader.cancel();
            })

            //$('#upload-progress',pb_dialog).progressbar({value:0});
        },
        onProgress: function(id, fileName, loaded, total){
            //update upload dialog with current progress
            $('span.meter', $('#files'+id+'progressBar')).css('width', Math.floor(loaded*100/total)+'%')
        },
        onComplete: function(id, fileName, responseJSON){

            if (uploader._handler._xhrs[id] &&
                uploader._handler._xhrs[id].status == 500) {

                onError({}, JSON.parse(uploader._handler._xhrs[id].response) )
                $('#files'+id+'progressBar').remove();
            } else {
                notifyMessage("File uploaded correctly");
                Sunstone.runAction("File.list");
                $('#files'+id+'progressBar').remove();
            }

            //Inform complete upload, destroy upload dialog, refresh img list

            //$('div#pb_dialog').dialog('destroy');
            $('div#pb_dialog').trigger("reveal:close")
            return false;
        },
        onCancel: function(id, fileName){
        }
    });

    var file_input = false;
    uploader._button._options.onChange = function(input) {
        file_input = input;  return false;
    };



    $('#create_file_submit',dialog).click(function(){
        var exit = false;
        var upload = false;
        $('.img_man',this).each(function(){
            if (!$('input',this).val().length){
                notifyError(tr("There are mandatory parameters missing"));
                exit = true;
                return false;
            }
        });
        if (exit) { return false; }

        var ds_id = $('#file_datastore',dialog).val();
        if (!ds_id){
            notifyError(tr("Please select a datastore for this file"));
            return false;
        };

        var img_json = {};

        var name = $('#img_name',dialog).val();
        img_json["NAME"] = name;

        var desc = $('#img_desc',dialog).val();
        if (desc.length){
            img_json["DESCRIPTION"] = desc;
        }

        var type = $('#img_type',dialog).val();
        img_json["TYPE"]= type;


        switch ($('#src_path_select input:checked',dialog).val()){
        case "path":
            path = $('#img_path',dialog).val();
            if (path) img_json["PATH"] = path;
            break;
        case "upload":
            upload=true;
            break;
        }

        //Time to add custom attributes
        $('#custom_var_file_box option',$create_file_dialog).each(function(){
            var attr_name = $(this).attr('name');
            var attr_value = $(this).val();
            img_json[attr_name] = attr_value;
        });

        img_obj = { "image" : img_json,
                    "ds_id" : ds_id};


        //we this is an file upload we trigger FileUploader
        //to start the upload
        if (upload){
            uploader._onInputChange(file_input);
        } else {
            Sunstone.runAction("File.create", img_obj);
        };

        $create_file_dialog.trigger("reveal:close")
        return false;
    });

    $('#create_file_submit_manual',dialog).click(function(){
        var template=$('#template',dialog).val();
        var ds_id = $('#file_datastore_raw',dialog).val();

        if (!ds_id){
            notifyError(tr("Please select a datastore for this file"));
            return false;
        };

        var img_obj = {
            "image" : {
                "image_raw" : template
            },
            "ds_id" : ds_id
        };
        Sunstone.runAction("File.create",img_obj);
        $create_file_dialog.trigger("reveal:close")
        return false;
    });

}

function popUpCreateFileDialog(){
    $('#files_file-uploader input',$create_file_dialog).removeAttr("style");
    $('#files_file-uploader input',$create_file_dialog).attr('style','margin:0;width:256px!important');

    datastores_str = makeSelectOptions(dataTable_datastores,
                                          1,
                                          4,
                                          [10,10],//system ds
                                          ['image','system'], //filter image & sys datastores
                                          true
                                         );

    $('#file_datastore',$create_file_dialog).html(datastores_str);
    $('#file_datastore_raw',$create_file_dialog).html(datastores_str);

    $create_file_dialog.reveal();
}

// Set the autorefresh interval for the datatable
function setFileAutorefresh() {
    setInterval(function(){
        var checked = $('input.check_item:checked',dataTable_files);
        var filter = $("#file_search").attr('value');
        if ((checked.length==0) && !filter){
            Sunstone.runAction("File.autorefresh");
        }
    },INTERVAL+someTime());
};

function is_persistent_file(id){
    var data = getElementData(id,"#file",dataTable_files)[8];
    return $(data).is(':checked');
};

//The DOM is ready at this point
$(document).ready(function(){
    var tab_name = 'files-tab';

    if (Config.isTabEnabled(tab_name)) {
      dataTable_files = $("#datatable_files",main_tabs_context).dataTable({
          "aoColumnDefs": [
              { "bSortable": false, "aTargets": ["check"] },
              { "sWidth": "35px", "aTargets": [0] },
              { "bVisible": true, "aTargets": Config.tabTableColumns(tab_name)},
              { "bVisible": false, "aTargets": ['_all']}
          ]
      });

      $('#file_search').keyup(function(){
        dataTable_files.fnFilter( $(this).val() );
      })

      dataTable_files.on('draw', function(){
        recountCheckboxes(dataTable_files);
      })

      Sunstone.runAction("File.list");

      setupCreateFileDialog();
      setupTips($create_file_dialog);
      setFileAutorefresh();

      initCheckAllBoxes(dataTable_files);
      tableCheckboxesListener(dataTable_files);
      infoListener(dataTable_files,'File.showinfo');

      $('div#files_tab div.legend_div').hide();
    }
});
