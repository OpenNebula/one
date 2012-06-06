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

/*Images tab plugin*/

var images_tab_content =
'<form id="image_form" action="" action="javascript:alert(\'js error!\');">\
  <div class="action_blocks">\
  </div>\
<table id="datatable_images" class="display">\
  <thead>\
    <tr>\
      <th class="check"><input type="checkbox" class="check_all" value="">'+tr("All")+'</input></th>\
      <th>'+tr("ID")+'</th>\
      <th>'+tr("Name")+'</th>\
    </tr>\
  </thead>\
  <tbody id="tbodyimages">\
  </tbody>\
</table>\
</form>';

var create_image_tmpl =
'<div id="img_tabs">\
        <div id="img_easy">\
           <form id="create_image_form_easy" method="POST" enctype="multipart/form-data" action="javascript:alert(\'js errors?!\')">\
             <p style="font-size:0.8em;text-align:right;"><i>'+
    tr("Fields marked with")+' <span style="display:inline-block;" class="ui-icon ui-icon-alert" /> '+
    tr("are mandatory")+'</i><br />\
             <fieldset>\
               <div class="img_param">\
               <label for="img_name">'+tr("Name")+':</label>\
               <input type="text" name="img_name" id="img_name" />\
               <div class="tip">'+tr("Name that the Image will get.")+'</div>\
               </div>\
               <div class="img_param">\
                 <label for="img_desc">'+tr("Description")+':</label>\
                 <textarea name="img_desc" id="img_desc" style="height:4em"></textarea>\
               <div class="tip">'+tr("Human readable description of the image.")+'</div>\
               </div>\
             </fieldset>\
             <fieldset>\
               <div class="img_param">\
                 <label for="img_type">'+tr("Type")+':</label>\
                 <select name="img_type" id="img_type">\
                      <option value="OS">'+tr("OS")+'</option>\
                      <option value="CDROM">'+tr("CD-ROM")+'</option>\
                      <option value="DATABLOCK">'+tr("Datablock")+'</option>\
                 </select>\
                 <div class="tip">'+tr("Type of the image")+'</div>\
               </div>\
               <div class="img_param">\
                    <label for="img_size">'+tr("Size")+':</label>\
                     <input type="text" name="img_size" id="img_size" />\
                      <div class="tip">'+tr("Size of the datablock in MB.")+'</div>\
               </div>\
               <div class="img_param">\
                    <label for="img_fstype">'+tr("FS type")+':</label>\
                    <input type="text" name="img_fstype" id="img_fstype" />\
                    <div class="tip">'+tr("Type of file system to be built. This can be any value understood by mkfs unix command.")+'</div>\
               </div>\
               <div class="img_param" id="upload_div">\
                 <label for="file-uploader" style="width:300px;height:2em;">'+tr("Select image to upload")+':</label><br /><div class="clear"/>\
                 <div id="file-uploader" style="padding:0 1em;">\
                 </div><div class="clear" />\
                 <div id="upload-progress" style="margin-left:1em;"></div>\
               </div>\
<!--\
               <div class="img_param">\
                 <label for="img_public">'+tr("Public")+':</label>\
                 <input type="checkbox" id="img_public" name="img_public" value="YES" />\
                 <div class="tip">'+tr("Public scope of the image")+'</div>\
               </div>\
               <div class="img_param">\
                 <label for="img_persistent">'+tr("Persistent")+':</label>\
                 <input type="checkbox" id="img_persistent" name="img_persistent" value="YES" />\
                 <div class="tip">'+tr("Persistence of the image")+'</div>\
               </div>\
               <div class="img_param">\
-->\
               <div class="form_buttons">\
                 <button type="button" class="image_close_dialog_link">'+tr("Close")+'</button>\
                 <button type="submit" class="button" id="create_image" value="Image.create">'+tr("Create")+'</button>\
                 <!--<button class="button" type="reset" id="reset_image" value="reset"-->\
               </div>\
           </form>\
        </div>\
</div>';

var image_dashboard = '<div class="dashboard_p">\
<img src="'+storage_dashboard_image+'" alt="one-storage" />'+
    storage_dashboard_html +
    '</div>';

var dataTable_images;
var $create_image_dialog;

var image_actions = {

    "Image.create" : {
        type: "create",
        call: OCCI.Image.create,
        callback: addImageElement,
        error: onError,
        notify:true
    },

    "Image.create_dialog" : {
        type: "custom",
        call: popUpCreateImageDialog
    },

    "Image.list" : {
        type: "list",
        call: OCCI.Image.list,
        callback: updateImagesView,
        error: onError
    },

    "Image.show" : {
        type : "single",
        call: OCCI.Image.show,
        callback: updateImageElement,
        error: onError
    },

    "Image.showinfo" : {
        type: "single",
        call: OCCI.Image.show,
        callback: updateImageInfo,
        error: onError
    },

    "Image.refresh" : {
        type: "custom",
        call: function () {
            waitingNodes(dataTable_images);
            Sunstone.runAction("Image.list");
        },
    },

    "Image.autorefresh" : {
        type: "custom",
        call: function() {
            OCCI.Image.list({timeout: true, success: updateImagesView, error: onError});
        }
    },

    "Image.persistent" : {
        type: "multiple",
        call: OCCI.Image.persistent,
        elements: imageElements,
        error: onError,
        notify: true
    },

    "Image.nonpersistent" : {
        type: "multiple",
        call: OCCI.Image.nonpersistent,
        elements: imageElements,
        error: onError,
        notify: true
    },

    // "Image.publish" : {
    //     type: "multiple",
    //     call: OCCI.Image.publish,
    //     callback: function (req) {
    //         //Sunstone.runAction("Image.show",req.request.data[0]);
    //     },
    //     elements: imageElements,
    //     error: onError,
    //     notify: true
    // },

    // "Image.unpublish" : {
    //     type: "multiple",
    //     call: OCCI.Image.unpublish,
    //     callback: function (req) {
    //         //Sunstone.runAction("Image.show",req.request.data[0]);
    //     },
    //     elements: imageElements,
    //     error: onError,
    //     notify: true
    // },

    "Image.delete" : {
        type: "multiple",
        call: OCCI.Image.del,
        callback: deleteImageElement,
        elements: imageElements,
        error: onError,
        notify: true
    },
}


var image_buttons = {
    "Image.refresh" : {
        type: "image",
        text: tr("Refresh list"),
        img: "images/Refresh-icon.png"
    },
    "Image.create_dialog" : {
        type: "create_dialog",
        text: tr('+ New')
    },
    "Image.persistent" : {
        type: "action",
        text: tr("Make persistent")
    },
    "Image.nonpersistent" : {
        type: "action",
        text: tr("Make non persistent")
    },
    // "action_list" : {
    //     type: "select",
    //     actions: {
    //         "Image.publish" : {
    //             type: "action",
    //             text: tr("Publish")
    //         },
    //         "Image.unpublish" : {
    //             type: "action",
    //             text: tr("Unpublish")
    //         },
    //     }
    //  },
    "Image.delete" : {
        type: "action",
        text: tr("Delete")
    }
}

var image_info_panel = {
    "image_info_tab" : {
        title: tr("Image information"),
        content: ""
    },

};

var image_create_panel = {
    "image_create_panel" : {
        title: tr("Add storage"),
        content: create_image_tmpl
    },
};

var images_tab = {
    title: '<i class="icon-folder-open"></i>'+tr("Storage"),
    content: images_tab_content,
    buttons: image_buttons
}

Sunstone.addActions(image_actions);
Sunstone.addMainTab('images_tab',images_tab);
Sunstone.addInfoPanel('image_info_panel',image_info_panel);
Sunstone.addInfoPanel('image_create_panel',image_create_panel);


function imageElements() {
    return getSelectedNodes(dataTable_images);
}

// Returns an array containing the values of the image_json and ready
// to be inserted in the dataTable
function imageElementArray(image_json){
    //Changing this? It may affect to the is_public() and is_persistent() functions.
    var image = image_json.STORAGE;
    var id,name;

    if (image.name){
        id = image.href.split("/");
        id = id[id.length-1];
        name = image.name;
    }
    else {
        id = image.ID;
        name = image.NAME;
    };

    return [
        '<input class="check_item" type="checkbox" id="image_'+id+'" name="selected_items" value="'+id+'"/>',
        id,
        name
    ];
}

// Callback to update an element in the dataTable
function updateImageElement(request, image_json){
    var id = image_json.STORAGE.ID;
    var element = imageElementArray(image_json);
    updateSingleElement(element,dataTable_images,'#image_'+id);
}

// Callback to remove an element from the dataTable
function deleteImageElement(req){
    deleteElement(dataTable_images,'#image_'+req.request.data);
}

// Callback to add an image element
function addImageElement(request, image_json){
    var element = imageElementArray(image_json);
    addElement(element,dataTable_images);
}

// Callback to refresh the list of images
function updateImagesView(request, images_list){
    var image_list_array = [];

    $.each(images_list,function(){
       image_list_array.push(imageElementArray(this));
    });

    updateView(image_list_array,dataTable_images);
    updateDashboard("images",images_list);
}

// Callback to update the information panel tabs and pop it up
function updateImageInfo(request,img){
    var img_info = img.STORAGE;
    var info_tab = {
        title: tr("Image information"),
        content:
        '<form><table id="info_img_table" class="info_table" style="width:80%;">\
           <thead>\
            <tr><th colspan="2">'+tr("Image")+' "'+img_info.NAME+'" '+
            tr("information")+'</th></tr>\
           </thead>\
           <tr>\
              <td class="key_td">'+tr("ID")+'</td>\
              <td class="value_td">'+img_info.ID+'</td>\
           </tr>\
           <tr>\
              <td class="key_td">'+tr("Name")+'</td>\
              <td class="value_td">'+img_info.NAME+'</td>\
           </tr>\
           <tr>\
              <td class="key_td">'+tr("Description")+'</td>\
              <td class="value_td">'+(img_info.DESCRIPTION ? img_info.DESCRIPTION : "--")+'</td>\
           </tr>\
           <tr>\
             <td class="key_td">'+tr("Type")+'</td>\
             <td class="value_td">'+img_info.TYPE+'</td>\
           </tr>\
           <tr>\
             <td class="key_td">'+tr("Persistent")+'</td>\
<td class="value_td"><input type="checkbox" '+(img_info.PERSISTENT == "YES" ? 'checked="checked"' : "")+' /></td>\
           </tr>\
           <tr>\
              <td class="key_td">'+tr("Filesystem type")+'</td>\
              <td class="value_td">'+(typeof img_info.FSTYPE === "string" ? img_info.FSTYPE : "--")+'</td>\
           </tr>\
           <tr>\
              <td class="key_td">'+tr("Size (Mb)")+'</td>\
              <td class="value_td">'+img_info.SIZE+'</td>\
           </tr>\
        </table></form>\
        <div class="form_buttons">\
           <button class="image_close_dialog_link"/></div>'
    };

    Sunstone.updateInfoPanelTab("image_info_panel","image_info_tab",info_tab);
    Sunstone.popUpInfoPanel("image_info_panel");
    $('#dialog .image_close_dialog_link').button({
        text:false,
        icons: { primary: "ui-icon-closethick" }
    });
    $('#dialog input').click(function(){
        if ($(this).is(':checked'))
            Sunstone.runAction("Image.persistent",[img_info.ID])
        else
            Sunstone.runAction("Image.nonpersistent",[img_info.ID])
    });
}

function popUpCreateImageDialog(){
    Sunstone.popUpInfoPanel("image_create_panel");
    var dialog = $('#dialog');
    $create_image_dialog = dialog;

    $('#create_image',dialog).button({
        icons: {
            primary: "ui-icon-check"
        },
        text: true
    });
/*
    $('#reset_image',dialog).button({
        icons: {
            primary: "ui-icon-scissors"
        },
        text: false
    });
*/
    $('.image_close_dialog_link',dialog).button({
        icons: {
            primary: "ui-icon-closethick"
        },
        text: true
    });

    setupTips(dialog);

    $('#img_fstype',dialog).parents('div.img_param').hide();
    $('#img_size',dialog).parents('div.img_param').hide();

/*
    $('#img_public',dialog).click(function(){
        $('#img_persistent',$create_image_dialog).removeAttr('checked');
    });

    $('#img_persistent',dialog).click(function(){
        $('#img_public',$create_image_dialog).removeAttr('checked');
    });
*/
    $('#img_type',dialog).change(function(){
        if ($(this).val() == "DATABLOCK"){
            $('#img_fstype',$create_image_dialog).parents('div.img_param').show();
            $('#img_size',$create_image_dialog).parents('div.img_param').show();
            $('#upload_div',$create_image_dialog).hide();
        } else {
            $('#img_fstype',$create_image_dialog).parents('div.img_param').hide();
            $('#img_size',$create_image_dialog).parents('div.img_param').hide();
            $('#upload_div',$create_image_dialog).show();
        };
    });

    $('#upload-progress',dialog).progressbar({value:0});
    $('#upload-progress',dialog).css({
        border: "1px solid #AAAAAA",
        position: "relative",
//        bottom: "29px",
        width: "258px",
//        left: "133px",
        height: "15px",
        display: "inline-block",
    });
    $('#upload-progress div',dialog).css("border","1px solid #AAAAAA");

    var img_obj;

    var uploader = new qq.FileUploaderBasic({
        button: $('#file-uploader',$create_image_dialog)[0],
        action: 'ui/upload',
        multiple: false,
        params: {},
        showMessage: function(message){
            //notifyMessage(message);
        },
        onSubmit: function(id, fileName){
            var xml = json2xml(img_obj,"STORAGE");

            uploader.setParams({
                occixml : xml,
                file: fileName
            });

            $('#upload-progress',dialog).show();
        },
        onProgress: function(id, fileName, loaded, total){
            $('#upload-progress',dialog).progressbar("option","value",Math.floor(loaded*100/total));
        },
        onComplete: function(id, fileName, responseJSON){
            popUpImageDashboard();
            notifyMessage("Image uploaded correctly");
            Sunstone.runAction("Image.list");
            return false;
        },
        onCancel: function(id, fileName){
        },
    });

    var file_input = false;
    uploader._button._options.onChange = function(input) {
        file_input = input;  return false;
    };

    $('#file-uploader input').removeAttr("style");
    $('#file-uploader input').attr('style','margin:0;width:256px!important');

    var processCreateImageForm = function(){
        var dialog = $create_image_dialog;

        var img_json = {};

        var name = $('#img_name',dialog).val();
        if (!name){
            notifyError(tr("You must specify a name"));
            return false;
        };
        img_json["NAME"] = name;


        var desc = $('#img_desc',dialog).val();
        if (desc){
            img_json["DESCRIPTION"] = desc;
        }

        var type = $('#img_type',dialog).val();
        img_json["TYPE"]= type;

        if (type == "DATABLOCK"){
            var fstype = $('#img_fstype',dialog).val();
            var im_size = $('#img_size',dialog).val();
            if (!fstype || !im_size){
                notifyError(tr("You must specify size and FS type"));
                return false;
            };
            img_json["FSTYPE"] = fstype;
            img_json["SIZE"] = im_size;
        } else {
            if (!$('#file-uploader input').val()){
                notifyError(tr("You must select a file to upload"));
                return false;
            };
        }


        //img_json["PUBLIC"] = $('#img_public:checked',this).length ? "YES" : "NO";

        //img_json["PERSISTENT"] = $('#img_persistent:checked',this).length ? "YES" : "NO";

        return img_json;
    };

    $('#create_image_form_easy',dialog).submit(function(){
        var type = $('#img_type',dialog).val();
        img_obj = processCreateImageForm();
        if (!img_obj) return false;
        if (type == "DATABLOCK"){
            Sunstone.runAction("Image.create",img_obj);
            popUpImageDashboard();
        } else {
            uploader._onInputChange(file_input);
        };
        return false;
    });
}

function popUpImageDashboard(){
    var count = dataTable_images.fnGetNodes().length;
    popDialog(image_dashboard);
    $('#dialog .storage_count').text(count);
};

// Set the autorefresh interval for the datatable
function setImageAutorefresh() {
    setInterval(function(){
        var checked = $('input.check_item:checked',dataTable_images);
        var filter = $("#datatable_images_filter input",
                       dataTable_images.parents("#datatable_images_wrapper")).attr('value');
        if (!checked.length && !filter.length){
            Sunstone.runAction("Image.autorefresh");
        }
    },INTERVAL+someTime());
};

/*
function is_public_image(id){
    var data = getElementData(id,"#image",dataTable_images)[7];
    return $(data).attr('checked');
};

function is_persistent_image(id){
    var data = getElementData(id,"#image",dataTable_images)[8];
    return $(data).attr('checked');
};
*/

//The DOM is ready at this point
$(document).ready(function(){

    dataTable_images = $("#datatable_images",main_tabs_context).dataTable({
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

    dataTable_images.fnClearTable();
    addElement([
        spinner,
        '',''],dataTable_images);
    Sunstone.runAction("Image.list");

    setImageAutorefresh();

    initCheckAllBoxes(dataTable_images);
    tableCheckboxesListener(dataTable_images);
    infoListener(dataTable_images, 'Image.showinfo');

    $('#li_images_tab').click(function(){
        popUpImageDashboard();
        //return false;
    });

    $('.image_close_dialog_link').live("click",function(){
        popUpImageDashboard();
        return false;
    });

})
