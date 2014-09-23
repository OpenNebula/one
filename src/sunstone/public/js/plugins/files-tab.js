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

var create_file_tmpl ='<div class="row">\
    <div class="large-5 columns">\
      <h3 class="subheader">'+tr("Create File")+'</h3>'+
    '</div>'+
    '<div class="large-7 columns">'+
      '<dl class="tabs right" data-tab>\
        <dd class="active"><a href="#file_easyTab">'+tr("Wizard")+'</a></dd>\
        <dd><a href="#file_manualTab">'+tr("Advanced mode")+'</a></dd>\
      </dl>\
    </div>\
  </div>\
  <form id="create_file_form_easy" action="" class="custom creation">\
      <div class="tabs-content">\
        <div id="file_easyTab" class="content active">\
              <div class="row vm_param">\
                <div class="large-6 columns">\
                  <div class="row">\
                    <div class="large-12 columns">\
                      <label for="file_name">'+tr("Name")+
                        '<span class="tip">'+tr("Name that the File will get. Every file must have a unique name.")+'</span>\
                      </label>\
                      <input type="text" name="file_name" id="file_name" />\
                    </div>\
                  </div>\
                  <div class="row">\
                    <div class="large-12 columns">\
                      <label for="file_desc">'+tr("Description")+
                        '<span class="tip">'+tr("Human readable description of the file for other users.")+'</span>\
                      </label>\
                      <textarea name="file_desc" id="file_desc" rows="4"></textarea>\
                    </div>\
                  </div>\
                </div>\
                <div class="large-6 columns">\
                  <div class="row">\
                    <div class="large-12 columns">\
                      <label for="file_type">'+tr("Type")+
                        '<span class="tip">'+tr("Type of the file.")+'<br/><br/>'
                          + tr(" KERNEL & RAMDISK files can be used in the OS Booting section of the Template wizard.")+'<br/><br/>'
                          + tr(" CONTEXT files can be included in the context CD-ROM, from the Context/Files section of the Template wizard.")+
                        '</span>'+
                      '</label>\
                       <select name="file_type" id="file_type">\
                            <option value="CONTEXT">'+tr("Context")+'</option>\
                            <option value="KERNEL">'+tr("Kernel")+'</option>\
                            <option value="RAMDISK">'+tr("Ramdisk")+'</option>\
                       </select>\
                    </div>\
                  </div>\
                  <div class="row">\
                    <div class="large-12 columns">\
                      <label for="file_datastore">'+tr("Datastore")+
                        '<span class="tip">'+tr("Select the datastore for this file")+'</span>'+
                      '</label>\
                       <div id="file_datastore" name="file_datastore">\
                       </div>\
                    </div>\
                  </div>\
                </div>\
              </div>\
             <fieldset>\
               <legend>'+tr("Image location")+':</legend>\
               <div class="row" id="src_path_select">\
                  <div class="large-12 columns text-center">\
                       <input type="radio" name="src_path" id="path_file" value="path"><label for="path_file">'+ tr("Provide a path")+'</label> \
                       <input type="radio" name="src_path" id="upload_file" value="upload"> <label for="upload_file">'+tr("Upload")+'</label> \
                  </div>\
               </div>\
               <br>\
               <div class="file_param row">\
                 <div class="large-12 columns">\
                    <label for="file_path">'+tr("Path")+
                      '<span class="tip">'+tr("Path to the original file that will be copied to the file repository.")+'</span>'+
                    '</label>\
                    <input type="text" name="file_path" id="file_path" />\
                  </div>\
               </div>\
               <div class="row">\
                  <div id="files_file-uploader" class="large-12 columns text-center">\
                    <input id="files_file-uploader-input" type="file"/>\
                  </div>\
               </div>\
            </fieldset>\
            <div class="form_buttons">\
              <button class="button success radius right" id="create_file_submit" type="submit" value="file/create">'+tr("Create")+'</button>\
              <button id="wizard_file_reset_button"  class="button secondary radius" type="reset" value="reset">'+tr("Reset")+'</button>\
            </div>\
        </div>\
        <div id="file_manualTab" class="content">\
              <div class="row">\
                 <div class="columns large-12">\
                   <label for="file_datastores_raw">'+tr("Datastore")+':</label>\
                   <div id="file_datastore_raw" name="file_datastore_raw">\
                   </div>\
                 </div>\
              </div>\
              <div class="row">\
                <div class="columns large-12">\
                   <textarea id="template" rows="15" style="height:180px !important; width:100%;"></textarea>\
                </div>\
              </div>\
               <div class="form_buttons">\
                 <button class="button success radius right" id="create_file_submit_manual" value="file/create">'+tr("Create")+'</button>\
                 <button  id="advanced_file_reset_button" class="button secondary radius" type="reset" value="reset">'+tr("Reset")+'</button>\
               </div>\
          </div>\
        </div>\
        <a class="close-reveal-modal">&#215;</a>\
  </form>\
</div>';

var dataTable_files;
var $create_file_dialog;
var size_files = 0;

var file_actions = {

    "File.create" : {
        type: "create",
        call: OpenNebula.Image.create,
        callback: function(request, response) {
            // Reset the create wizard
            $create_file_dialog.foundation('reveal', 'close');
            $create_file_dialog.empty();
            setupCreateFileDialog();

            addFileElement(request, response);
            notifyCustom(tr("File created"), " ID: " + response.IMAGE.ID, false);
        },
        error: onError
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
        callback: function(request, response){
            var tab = dataTable_files.parents(".tab");

            if (Sunstone.rightInfoVisible(tab)) {
                // individual view
                updateFileInfo(request, response);
            }

            // datatable row
            updateFileElement(request, response);
        },
        error: onError
    },

    "File.refresh" : {
        type: "custom",
        call: function () {
          var tab = dataTable_files.parents(".tab");
          if (Sunstone.rightInfoVisible(tab)) {
            Sunstone.runAction("File.show", Sunstone.rightInfoResourceId(tab))
          } else {
            waitingNodes(dataTable_files);
            Sunstone.runAction("File.list", {force: true});
          }
        }
    },

    "File.update_template" : {
        type: "single",
        call: OpenNebula.Image.update,
        callback: function(request) {
            notifyMessage("Template updated correctly");
            Sunstone.runAction('File.show',request.request.data[0][0]);
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
            notifyMessage(tr("File renamed correctly"));
            Sunstone.runAction('File.show',request.request.data[0]);
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
//    "Sunstone.toggle_top" : {
//        type: "custom",
//        layout: "top",
//        alwaysActive: true
//    },
    "File.create_dialog" : {
        type: "create_dialog",
        layout: "create"
    },
    "File.chown" : {
        type: "confirm_with_select",
        text: tr("Change owner"),
        layout: "user_select",
        select: "User",
        tip: tr("Select the new owner")+":",
        condition: mustBeAdmin
    },
    "File.chgrp" : {
        type: "confirm_with_select",
        text: tr("Change group"),
        layout: "user_select",
        select: "Group",
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
    }
}

var file_info_panel = {
    "file_info_tab" : {
        title: tr("Information"),
        content: ""
    }
}

var files_tab = {
    title: tr("Files & Kernels"),
    resource: 'File',
    buttons: file_buttons,
    tabClass: 'subTab',
    parentTab: 'vresources-tab',
    content: '<div class="large-12 columns">\
      <div id="files_upload_progress_bars"></div>\
    </div>',
    search_input: '<input id="file_search" type="text" placeholder="'+tr("Search")+'" />',
    list_header: '<i class="fa fa-fw fa-folder-open"></i>&emsp;'+tr("Files & Kernels"),
    info_header: '<i class="fa fa-fw fa-folder-open"></i>&emsp;'+tr("File"),
    subheader: '<span class="total_files"/> <small>'+tr("TOTAL")+'</small>&emsp;\
        <span class="size_files"/> <small>'+tr("SIZE")+'</small>',
    table: '<table id="datatable_files" class="datatable twelve">\
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
    </table>'
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

    $(".total_files").text(file_list_array.length);
    $(".size_files").text(size);
}

// Callback to update the information panel tabs and pop it up
function updateFileInfo(request,file){
    var file_info = file.IMAGE;
    var info_tab = {
        title : tr("Info"),
        icon: "fa-info-circle",
        content:
        '<div class="row">\
        <div class="large-6 columns">\
        <table id="info_file_table" class="dataTable extended_table">\
           <thead>\
            <tr><th colspan="3">'+tr("File")+' - '+file_info.NAME+'</th></tr>\
           </thead>\
           <tr>\
              <td class="key_td">'+tr("ID")+'</td>\
              <td class="value_td">'+file_info.ID+'</td>\
              <td></td>\
           </tr>'+
            insert_rename_tr(
                'files-tab',
                "File",
                file_info.ID,
                file_info.NAME)+
           '<tr>\
              <td class="key_td">'+tr("Datastore")+'</td>\
              <td class="value_td">'+file_info.DATASTORE+'</td>\
              <td></td>\
           </tr>\
           <tr>\
             <td class="key_td">'+tr("Type")+'</td>\
             <td class="value_td_type_files">'+OpenNebula.Helper.image_type(file_info.TYPE)+'</td>\
             <td><div id="div_edit_chg_type_files">\
                   <a id="div_edit_chg_type_files_link" class="edit_e" href="#"><i class="fa fa-pencil-square-o right"/></a>\
                 </div>\
             </td>\
           </tr>\
           <tr>\
             <td class="key_td">'+tr("Register time")+'</td>\
             <td class="value_td">'+pretty_time(file_info.REGTIME)+'</td>\
              <td></td>\
           </tr>\
           <tr>\
              <td class="key_td">'+tr("Filesystem type")+'</td>\
              <td class="value_td">'+(typeof file_info.FSTYPE === "string" ? file_info.FSTYPE : "--")+'</td>\
              <td></td>\
           </tr>\
           <tr>\
              <td class="key_td">'+tr("Size")+'</td>\
              <td class="value_td">'+humanize_size_from_mb(file_info.SIZE)+'</td>\
              <td></td>\
           </tr>\
           <tr>\
              <td class="key_td">'+tr("State")+'</td>\
              <td class="value_td">'+OpenNebula.Helper.resource_state("file",file_info.STATE)+'</td>\
              <td></td>\
           </tr>\
           <tr>\
              <td class="key_td">'+tr("Running VMS")+'</td>\
              <td class="value_td">'+file_info.RUNNING_VMS+'</td>\
              <td></td>\
           </tr>\
        </table>\
       </div>\
       <div class="large-6 columns">' +
         insert_permissions_table('files-tab',
                                   "File",
                                   file_info.ID,
                                   file_info.UNAME,
                                   file_info.GNAME,
                                   file_info.UID,
                                   file_info.GID) +
       '</div>\
     </div>\
     <div class="row">\
          <div class="large-9 columns">'+
               insert_extended_template_table(file_info.TEMPLATE,
                                               "File",
                                               file_info.ID,
                                               "Attributes") +
       '</div>\
     </div>'
    }

    $("#div_edit_chg_type_files_link").die();
    $("#chg_type_select_files").die();
    $("#div_edit_persistency_files").die();
    $("#persistency_select_files").die();


    // Listener for edit link for type change
    $("#div_edit_chg_type_files_link").live("click", function() {
        $(".value_td_type_files").html(
                  '<select id="chg_type_select_files">\
                      <option value="KERNEL">KERNEL</option>\
                      <option value="RAMDISK">RAMDISK</option>\
                      <option value="CONTEXT">CONTEXT</option>\
                  </select>');

        $('#chg_type_select_files').val(OpenNebula.Helper.image_type(file_info.TYPE));
    });

    $("#chg_type_select_files").live("change", function() {
        var new_value = $(this).val();
        Sunstone.runAction("File.chtype", file_info.ID, new_value);
    });


    Sunstone.updateInfoPanelTab("file_info_panel","file_info_tab",info_tab);
    Sunstone.popUpInfoPanel("file_info_panel", "files-tab");

    setPermissionsTable(file_info,'');
}

function enable_all_datastores()
{

    $('select#disk_type').children('option').each(function() {
      $(this).removeAttr('disabled');
    });
}

// Prepare the file creation dialog
function setupCreateFileDialog(){
    dialogs_context.append('<div id="create_file_dialog"></div>');
    $create_file_dialog =  $('#create_file_dialog',dialogs_context);

    var dialog = $create_file_dialog;
    dialog.html(create_file_tmpl);

    dialog.addClass("reveal-modal medium").attr("data-reveal", "");

    $('#files_file-uploader',dialog).closest('.row').hide();

    $("input[name='src_path']", dialog).change(function(){
        var context = $create_file_dialog;
        var value = $(this).val();
        switch (value){
        case "path":
            $('#files_file-uploader',context).closest('.row').hide();
            $('#file_path',context).closest('.row').show();
            break;
        case "upload":
            $('#file_path',context).closest('.row').hide();
            $('#files_file-uploader',context).closest('.row').show();
            break;
        };
    });


    $('#path_file',dialog).click();

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

    var file_obj;

    var uploader = new Resumable({
        target: '/upload_chunk',
        chunkSize: 10*1024*1024,
        maxFiles: 1,
        testChunks: false,
        query: {
            csrftoken: csrftoken
        }
    });

    uploader.assignBrowse($('#files_file-uploader-input',dialog)[0]);

    var fileName = '';
    var file_input = false;

    uploader.on('fileAdded', function(file){
        fileName = file.fileName;
        file_input = fileName;
    });

    uploader.on('uploadStart', function() {
        $('#files_upload_progress_bars').append('<div id="files-'+fileName+'-progressBar" class="row" style="margin-bottom:10px">\
          <div id="files-'+fileName+'-info" class="large-2 columns dataTables_info">\
            '+tr("Uploading...")+'\
          </div>\
          <div class="large-10 columns">\
            <div id="upload_progress_container" class="progress nine radius" style="height:25px !important">\
              <span class="meter" style="width:0%"></span>\
            </div>\
            <div class="progress-text" style="margin-left:15px">'+fileName+'</div>\
          </div>\
        </div>');
    });

    uploader.on('progress', function() {
        $('span.meter', $('div[id="files-'+fileName+'-progressBar"]')).css('width', uploader.progress()*100.0+'%')
    });

    uploader.on('fileSuccess', function(file) {
        $('div[id="files-'+fileName+'-info"]').text(tr('Registering in OpenNebula'));
        $.ajax({
            url: '/upload',
            type: "POST",
            data: {
                csrftoken: csrftoken,
                img : JSON.stringify(img_obj),
                file: fileName,
                tempfile: file.uniqueIdentifier
            },
            success: function(){
                notifyMessage("Image uploaded correctly");
                $('div[id="file-'+fileName+'-progressBar"]').remove();
                Sunstone.runAction("Image.refresh");
            },
            error: function(response){
                //onError({}, JSON.parse(response) );
                notifyMessage(response);
                $('div[id="file-'+fileName+'-progressBar"]').remove();
            }
        });
    });
/*
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
                csrftoken: csrftoken,
                img : JSON.stringify(file_obj),
                file: fileName
            });
            //we pop up an upload progress dialog
            var pos_top = $(window).height() - 120;
            var pos_left = 220;

            $('#files_upload_progress_bars').append('<div id="files'+id+'progressBar" class="row" style="margin-bottom:10px">\
              <div class="large-2 columns dataTables_info">\
                '+tr("Uploading...")+'\
              </div>\
              <div class="large-10 columns">\
                <div id="upload_progress_container" class="progress nine radius" style="height:25px !important">\
                  <span class="meter" style="width:0%"></span>\
                </div>\
                <div class="progress-text" style="margin-left:15px">'+id+' '+fileName+'</div>\
              </div>\
            </div>');

            $('#files'+id+'cancel_upload').click(function(){
              uploader.cancel();
            })
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
                Sunstone.runAction("File.refresh");
                $('#files'+id+'progressBar').remove();
            }

            //Inform complete upload, destroy upload dialog, refresh file list

            $('div#pb_dialog').foundation('reveal', 'close')
            return false;
        },
        onCancel: function(id, fileName){
        }
    });
*/




    $('#create_file_form_easy',dialog).submit(function(){
        var upload = false;

        var ds_id = $('#file_datastore .resource_list_select',dialog).val();
        if (!ds_id){
            notifyError(tr("Please select a datastore for this file"));
            return false;
        };

        var file_json = {};

        var name = $('#file_name',dialog).val();
        file_json["NAME"] = name;

        var desc = $('#file_desc',dialog).val();
        if (desc.length){
            file_json["DESCRIPTION"] = desc;
        }

        var type = $('#file_type',dialog).val();
        file_json["TYPE"]= type;


        switch ($('#src_path_select input:checked',dialog).val()){
        case "path":
            path = $('#file_path',dialog).val();
            if (path) file_json["PATH"] = path;
            break;
        case "upload":
            upload=true;
            break;
        }

        file_obj = { "image" : file_json,
                    "ds_id" : ds_id};

        //we this is an file upload we trigger FileUploader
        //to start the upload
        if (upload){
            $create_file_dialog.foundation('reveal', 'close');
            $create_file_dialog.empty();
            setupCreateFileDialog();

            uploader._onInputChange(file_input);
        } else {
            Sunstone.runAction("File.create", file_obj);
        };

        return false;
    });

    $('#create_file_submit_manual',dialog).click(function(){
        var template=$('#template',dialog).val();
        var ds_id = $('#file_datastore_raw .resource_list_select',dialog).val();

        if (!ds_id){
            notifyError(tr("Please select a datastore for this file"));
            return false;
        };

        var file_obj = {
            "image" : {
                "image_raw" : template
            },
            "ds_id" : ds_id
        };
        Sunstone.runAction("File.create",file_obj);
        return false;
    });

    setupTips(dialog);

    $('#wizard_file_reset_button', dialog).click(function(){
        $('#create_file_dialog').html("");
        setupCreateFileDialog();

        popUpCreateFileDialog();
    });

    $('#advanced_file_reset_button', dialog).click(function(){
        $('#create_file_dialog').html("");
        setupCreateFileDialog();

        popUpCreateFileDialog();
        $("a[href='#file_manual']").click();
    });
}

function popUpCreateFileDialog(){
    $('#files_file-uploader input',$create_file_dialog).removeAttr("style");
    $('#files_file-uploader input',$create_file_dialog).attr('style','margin:0;width:256px!important');

    var ds_id = $("div#file_datastore .resource_list_select",
                    $create_file_dialog).val();

    var ds_id_raw = $("div#file_datastore_raw .resource_list_select",
                        $create_file_dialog).val();

    // Filter out DS with type image (0) or system (1)
    var filter_att = ["TYPE", "TYPE"];
    var filter_val = ["0", "1"];

    insertSelectOptions('div#file_datastore', $create_file_dialog, "Datastore",
                        ds_id, false, null, filter_att, filter_val);

    insertSelectOptions('div#file_datastore_raw', $create_file_dialog, "Datastore",
                        ds_id_raw, false, null, filter_att, filter_val);

    $create_file_dialog.foundation().foundation('reveal', 'open');
    $("input#file_name",$create_file_dialog).focus();
}

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
          ],
          "bSortClasses" : false,
          "bDeferRender": true,
      });

      $('#file_search').keyup(function(){
        dataTable_files.fnFilter( $(this).val() );
      })

      dataTable_files.on('draw', function(){
        recountCheckboxes(dataTable_files);
      })

      Sunstone.runAction("File.list");

      setupCreateFileDialog();

      initCheckAllBoxes(dataTable_files);
      tableCheckboxesListener(dataTable_files);
      infoListener(dataTable_files,'File.show');

      $('div#files_tab div.legend_div').hide();
      dataTable_files.fnSort( [ [1,config['user_config']['table_order']] ] );
    }
});
