/* -------------------------------------------------------------------------- */
/* Copyright 2002-2011, OpenNebula Project Leads (OpenNebula.org)             */
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
      <th class="check"><input type="checkbox" class="check_all" value="">All</input></th>\
      <th>ID</th>\
      <th>Owner</th>\
      <th>Group</th>\
      <th>Name</th>\
      <th>Type</th>\
      <th>Registration time</th>\
      <th>Public</th>\
      <th>Persistent</th>\
      <th>Status</th>\
      <th>#VMS</th>\
    </tr>\
  </thead>\
  <tbody id="tbodyimages">\
  </tbody>\
</table>\
</form>';

var create_image_tmpl =
'<div id="img_tabs">\
        <ul><li><a href="#img_easy">Wizard</a></li>\
                <li><a href="#img_manual">Advanced mode</a></li>\
        </ul>\
        <div id="img_easy">\
           <form id="create_image_form_easy" action="">\
             <p style="font-size:0.8em;text-align:right;"><i>Fields marked with <span style="display:inline-block;" class="ui-icon ui-icon-alert" /> are mandatory</i><br />\
             <fieldset>\
               <div class="img_param img_man">\
               <label for="img_name">Name:</label>\
               <input type="text" name="img_name" id="img_name" />\
               <div class="tip">Name that the Image will get. Every image must have a unique name.</div>\
               </div>\
               <div class="img_param">\
                 <label for="img_desc">Description:</label>\
                 <textarea name="img_desc" id="img_desc" style="height:4em"></textarea>\
               <div class="tip">Human readable description of the image for other users.</div>\
               </div>\
             </fieldset>\
             <fieldset>\
               <div class="img_param">\
                 <label for="img_type">Type:</label>\
                 <select name="img_type" id="img_type">\
                      <option value="OS">OS</option>\
                      <option value="CDROM">CD-ROM</option>\
                      <option value="DATABLOCK">Datablock</option>\
                 </select>\
                 <div class="tip">Type of the image, explained in detail in the following section. If omitted, the default value is the one defined in oned.conf (install default is OS).</div>\
               </div>\
               <div class="img_param">\
                 <label for="img_public">Public:</label>\
                 <input type="checkbox" id="img_public" name="img_public" value="YES" />\
                 <div class="tip">Public scope of the image</div>\
               </div>\
               <div class="img_param">\
                 <label for="img_persistent">Persistent:</label>\
                 <input type="checkbox" id="img_persistent" name="img_persistent" value="YES" />\
                 <div class="tip">Persistence of the image</div>\
               </div>\
               <div class="img_param">\
                  <label for="img_dev_prefix">Device prefix:</label>\
                  <input type="text" name="img_dev_prefix" id="img_dev_prefix" />\
                  <div class="tip">Prefix for the emulated device this image will be mounted at. For instance, “hd”, “sd”. If omitted, the default value is the one defined in oned.conf (installation default is “hd”).</div>\
               </div>\
               <div class="img_param">\
                 <label for="img_bus">Bus:</label>\
                 <select name="img_bus" id="img_bus">\
                    <option value="IDE">IDE</option>\
                    <option value="SCSI">SCSI</option>\
                    <option value="virtio">Virtio (KVM)</option>\
                 </select>\
                 <div class="tip">Type of disk device to emulate.</div>\
                 </div>\
               <div class="img_param">\
                  <label for="img_driver">Driver:</label>\
                  <input type="text" name="img_driver" id="img_driver" />\
                  <div class="tip">Specific image mapping driver. KVM: raw, qcow2 and Xen:tap:aio:, file:</div>\
               </div>\
              </fieldset>\
              <fieldset>\
                 <div class="" id="src_path_select">\
                   <label style="height:3em;">Path vs. source:</label>\
                   <input type="radio" name="src_path" id="path_img" value="path" />\
                   <label style="float:none">Provide a path</label><br />\
                   <input type="radio" name="src_path" id="source_img" value="source" />\
                   <label style="float:none">Provide a source</label><br />\
                   <input type="radio" name="src_path" id="datablock_img" value="datablock" />\
                   <label style="float:none;vertical-align:top">Create an empty datablock</label>\
                   <div class="tip">Please choose path if you have a file-based image. Choose source otherwise or create an empty datablock disk.</div><br />\
                 </div>\
                 <div class="img_param">\
                    <label for="img_path">Path:</label>\
                    <input type="text" name="img_path" id="img_path" />\
                    <div class="tip">Path to the original file that will be copied to the image repository. If not specified for a DATABLOCK type image, an empty image will be created.</div>\
                 </div>\
                 <div class="img_param">\
                    <label for="img_source">Source:</label>\
                    <input type="text" name="img_source" id="img_source" />\
                    <div class="tip">Source to be used in the DISK attribute. Useful for not file-based images.</div>\
                 </div>\
                 <div class="img_size">\
                    <label for="img_size">Size:</label>\
                     <input type="text" name="img_size" id="img_size" />\
                      <div class="tip">Size of the datablock in MB.</div>\
                      </div>\
                 <div class="img_param">\
                    <label for="img_fstype">FS type:</label>\
                    <input type="text" name="img_fstype" id="img_fstype" />\
                    <div class="tip">Type of file system to be built. This can be any value understood by mkfs unix command.</div>\
                 </div>\
               </fieldset>\
               <fieldset>\
                  <div class="">\
                    <label for="custom_var_image_name">Name:</label>\
                    <input type="text" id="custom_var_image_name" name="custom_var_image_name" />\
                    <label for="custom_var_image_value">Value:</label>\
                    <input type="text" id="custom_var_image_value" name="custom_var_image_value" />\
                    <button class="add_remove_button add_button" id="add_custom_var_image_button" value="add_custom_image_var">Add</button>\
                    <button class="add_remove_button" id="remove_custom_var_image_button" value="remove_custom_image_var">Remove selected</button>\
                    <div class="clear"></div>\
                    <label for="custom_var_image_box">Custom attributes:</label>\
                    <select id="custom_var_image_box" name="custom_var_image_box" style="height:100px;" multiple>\
                    </select>\
                 </div>\
               </fieldset>\
               <fieldset>\
                  <div class="form_buttons">\
                    <button class="button" id="create_image_submit" value="user/create">Create</button>\
                    <button class="button" type="reset" value="reset">Reset</button>\
                    </div>\
                    </fieldset>\
            </form>\
        </div>\
        <div id="img_manual">\
            <form id="create_image_form_manual" action="">\
               <fieldset style="border-top:none;">\
                 <h3 style="margin-bottom:10px;">Write the image template here</h3>\
                 <textarea id="template" rows="15" style="width:100%;">\
                 </textarea>\
               </fieldset>\
               <fieldset>\
               <div class="form_buttons">\
                 <button class="button" id="create_vn_submit_manual" value="vn/create">\
                    Create\
                 </button>\
                 <button class="button" type="reset" value="reset">Reset</button>\
               </div>\
             </fieldset>\
           </form>\
        </div>\
</div>';

var update_image_tmpl =
   '<form action="javascript:alert(\'js error!\');">\
         <h3 style="margin-bottom:10px;">Please, choose and modify the image you want to update:</h3>\
            <fieldset style="border-top:none;">\
                 <label for="image_template_update_select">Select an image:</label>\
                 <select id="image_template_update_select" name="image_template_update_select"></select>\
                 <div class="clear"></div>\
                 <div>\
                   <label for="image_template_update_public">Public:</label>\
                   <input type="checkbox" name="image_template_update_public" id="image_template_update_public" />\
                 </div>\
                 <div>\
                   <label for="image_template_update_public">Persistent:</label>\
                   <input type="checkbox" name="image_template_update_persistent" id="image_template_update_persistent" />\
                 </div>\
                 <label for="image_template_update_textarea">Template:</label>\
                 <div class="clear"></div>\
                 <textarea id="image_template_update_textarea" style="width:100%; height:14em;"></textarea>\
            </fieldset>\
            <fieldset>\
                 <div class="form_buttons">\
                    <button class="button" id="image_template_update_button" value="Image.update_template">\
                       Update\
                    </button>\
                 </div>\
            </fieldset>\
</form>';

var images_select = "";
var dataTable_images;
var $create_image_dialog;

var image_actions = {

    "Image.create" : {
        type: "create",
        call: OpenNebula.Image.create,
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
        call: OpenNebula.Image.list,
        callback: updateImagesView,
        error: onError
    },

    "Image.show" : {
        type : "single",
        call: OpenNebula.Image.show,
        callback: updateImageElement,
        error: onError
    },

    "Image.showinfo" : {
        type: "single",
        call: OpenNebula.Image.show,
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
            OpenNebula.Image.list({timeout: true, success: updateImagesView, error: onError});
        }
    },

    "Image.fetch_template" : {
        type: "single",
        call: OpenNebula.Image.fetch_template,
        callback: function (request,response) {
            $('#image_template_update_dialog #image_template_update_textarea').val(response.template);
        },
        error: onError
    },

    "Image.update_dialog" : {
        type: "custom",
        call: function() {
            popUpImageTemplateUpdateDialog();
        }
    },

    "Image.update" : {
        type: "single",
        call: OpenNebula.Image.update,
        callback: function() {
            notifyMessage("Template updated correctly");
        },
        error: onError
    },

    "Image.enable" : {
        type: "multiple",
        call: OpenNebula.Image.enable,
        callback: function (req) {
            Sunstone.runAction("Image.show",req.request.data[0]);
        },
        elements: imageElements,
        error: onError,
        notify: true
    },

    "Image.disable" : {
        type: "multiple",
        call: OpenNebula.Image.disable,
        callback: function (req) {
            Sunstone.runAction("Image.show",req.request.data[0]);
        },
        elements: imageElements,
        error: onError,
        notify: true
    },

    "Image.persistent" : {
        type: "multiple",
        call: OpenNebula.Image.persistent,
        callback: function (req) {
            Sunstone.runAction("Image.show",req.request.data[0]);
        },
        elements: imageElements,
        error: onError,
        notify: true
    },

    "Image.nonpersistent" : {
        type: "multiple",
        call: OpenNebula.Image.nonpersistent,
        callback: function (req) {
            Sunstone.runAction("Image.show",req.request.data[0]);
        },
        elements: imageElements,
        error: onError,
        notify: true
    },

    "Image.publish" : {
        type: "multiple",
        call: OpenNebula.Image.publish,
        callback: function (req) {
            Sunstone.runAction("Image.show",req.request.data[0]);
        },
        elements: imageElements,
        error: onError,
        notify: true
    },

    "Image.unpublish" : {
        type: "multiple",
        call: OpenNebula.Image.unpublish,
        callback: function (req) {
            Sunstone.runAction("Image.show",req.request.data[0]);
        },
        elements: imageElements,
        error: onError,
        notify: true
    },

    "Image.delete" : {
        type: "multiple",
        call: OpenNebula.Image.delete,
        callback: deleteImageElement,
        elements: imageElements,
        error: onError,
        notify: true
    },

    "Image.chown" : {
        type: "multiple",
        call: OpenNebula.Image.chown,
        callback:  function (req) {
            Sunstone.runAction("Image.show",req.request.data[0]);
        },
        elements: imageElements,
        error: onError,
        notify: true
    },

    "Image.chgrp" : {
        type: "multiple",
        call: OpenNebula.Image.chgrp,
        callback: function (req) {
            Sunstone.runAction("Image.show",req.request.data[0]);
        },
        elements: imageElements,
        error: onError,
        notify: true
    },

    "Image.chtype" : {
        type: "single",
        call: OpenNebula.Image.chtype,
        callback: function (req) {
            Sunstone.runAction("Image.show",req.request.data[0]);
        },
        elements: imageElements,
        error: onError,
        notify: true
    }

}


var image_buttons = {
    "Image.refresh" : {
        type: "image",
        text: "Refresh list",
        img: "images/Refresh-icon.png"
    },
    "Image.create_dialog" : {
        type: "create_dialog",
        text: "+ New"
    },
    "Image.update_dialog" : {
        type: "action",
        text: "Update a template",
        alwaysActive: true
    },
    "Image.chown" : {
        type: "confirm_with_select",
        text: "Change owner",
        select: users_sel,
        tip: "Select the new owner:",
        condition: mustBeAdmin
    },
    "Image.chgrp" : {
        type: "confirm_with_select",
        text: "Change group",
        select: groups_sel,
        tip: "Select the new group:",
        condition: mustBeAdmin
    },
    "action_list" : {
        type: "select",
        actions: {
            "Image.enable" : {
                type: "action",
                text: "Enable"
            },
            "Image.disable" : {
                type: "action",
                text: "Disable"
            },
            "Image.publish" : {
                type: "action",
                text: "Publish"
            },
            "Image.unpublish" : {
                type: "action",
                text: "Unpublish"
            },
            "Image.persistent" : {
                type: "action",
                text: "Make persistent"
            },
            "Image.nonpersistent" : {
                type: "action",
                text: "Make non persistent"
            }
        }
    },
    "Image.delete" : {
        type: "action",
        text: "Delete"
    }
}

var image_info_panel = {
    "image_info_tab" : {
        title: "Image information",
        content: ""
    },

    "image_template_tab" : {
        title: "Image template",
        content: ""
    }

}

var images_tab = {
    title: "Images",
    content: images_tab_content,
    buttons: image_buttons
}

Sunstone.addActions(image_actions);
Sunstone.addMainTab('images_tab',images_tab);
Sunstone.addInfoPanel('image_info_panel',image_info_panel);


function imageElements() {
    return getSelectedNodes(dataTable_images);
}

// Returns an array containing the values of the image_json and ready
// to be inserted in the dataTable
function imageElementArray(image_json){
    //Changing this? It may affect to the is_public() and is_persistent() functions.
    var image = image_json.IMAGE;

    var type = $('<select>\
                      <option value="OS">OS</option>\
                      <option value="CDROM">CD-ROM</option>\
                      <option value="DATABLOCK">Datablock</option>\
                 </select>');

    var value = OpenNebula.Helper.image_type(image.TYPE);
    $('option[value="'+value+'"]',type).replaceWith('<option value="'+value+'" selected="selected">'+value+'</option>');



    return [
        '<input class="check_item" type="checkbox" id="image_'+image.ID+'" name="selected_items" value="'+image.ID+'"/>',
        image.ID,
        image.UNAME,
        image.GNAME,
        image.NAME,
        '<select class="action_cb" id="select_chtype_image" elem_id="'+image.ID+'" style="width:100px">'+type.html()+'</select>',
        pretty_time(image.REGTIME),
        parseInt(image.PUBLIC) ? '<input class="action_cb" id="cb_public_image" type="checkbox" elem_id="'+image.ID+'" checked="checked"/>'
            : '<input class="action_cb" id="cb_public_image" type="checkbox" elem_id="'+image.ID+'"/>',
        parseInt(image.PERSISTENT) ? '<input class="action_cb" id="cb_persistent_image" type="checkbox" elem_id="'+image.ID+'" checked="checked"/>'
            : '<input class="action_cb" id="cb_persistent_image" type="checkbox" elem_id="'+image.ID+'"/>',
        OpenNebula.Helper.resource_state("image",image.STATE),
        image.RUNNING_VMS
        ];
}

// Set up the listener on the table TDs to show the info panel
function imageInfoListener(){
    $('#tbodyimages tr',dataTable_images).live("click",function(e){
        var target = $(e.target);

        if (target.is('input') || target.is('select') || target.is('option'))
            return true;

        popDialogLoading();
        var aData = dataTable_images.fnGetData(this);
        var id = $(aData[0]).val();
        Sunstone.runAction("Image.showinfo",id);
        return false;
    });
}

//Updates the select input field with an option for each image
function updateImageSelect(){
    images_select =
        makeSelectOptions(dataTable_images,
                          1,
                          4,
                          [9,9,9],
                          ["DISABLED","LOCKED","ERROR"]
                         );

    //update static selectors:
    //in the VM section
    $('div.vm_section#disks select#IMAGE_ID', $create_template_dialog).html(images_select);
}

// Callback to update an element in the dataTable
function updateImageElement(request, image_json){
    var id = image_json.IMAGE.ID;
    var element = imageElementArray(image_json);
    updateSingleElement(element,dataTable_images,'#image_'+id);
    updateImageSelect();
}

// Callback to remove an element from the dataTable
function deleteImageElement(req){
    deleteElement(dataTable_images,'#image_'+req.request.data);
    updateImageSelect();
}

// Callback to add an image element
function addImageElement(request, image_json){
    var element = imageElementArray(image_json);
    addElement(element,dataTable_images);
    updateImageSelect();
}

// Callback to refresh the list of images
function updateImagesView(request, images_list){
    var image_list_array = [];

    $.each(images_list,function(){
       image_list_array.push(imageElementArray(this));
    });

    updateView(image_list_array,dataTable_images);
    updateImageSelect();
    updateDashboard("images",images_list);
}

// Callback to update the information panel tabs and pop it up
function updateImageInfo(request,img){
    var img_info = img.IMAGE;
    var info_tab = {
        title: "Image information",
        content:
        '<table id="info_img_table" class="info_table" style="width:80%;">\
           <thead>\
            <tr><th colspan="2">Image "'+img_info.NAME+'" information</th></tr>\
           </thead>\
           <tr>\
              <td class="key_td">ID</td>\
              <td class="value_td">'+img_info.ID+'</td>\
           </tr>\
           <tr>\
              <td class="key_td">Name</td>\
              <td class="value_td">'+img_info.NAME+'</td>\
           </tr>\
           <tr>\
              <td class="key_td">Owner</td>\
              <td class="value_td">'+img_info.UNAME+'</td>\
           </tr>\
           <tr>\
              <td class="key_td">Group</td>\
              <td class="value_td">'+img_info.GNAME+'</td>\
           </tr>\
           <tr>\
             <td class="key_td">Type</td>\
             <td class="value_td">'+OpenNebula.Helper.image_type(img_info.TYPE)+'</td>\
           </tr>\
           <tr>\
             <td class="key_td">Register time</td>\
             <td class="value_td">'+pretty_time(img_info.REGTIME)+'</td>\
           </tr>\
           <tr>\
             <td class="key_td">Public</td>\
             <td class="value_td">'+(parseInt(img_info.PUBLIC) ? "yes" : "no")+'</td>\
           </tr>\
           <tr>\
             <td class="key_td">Persistent</td>\
             <td class="value_td">'+(parseInt(img_info.PERSISTENT) ? "yes" : "no")+'</td>\
           </tr>\
           <tr>\
              <td class="key_td">Source</td>\
              <td class="value_td">'+img_info.SOURCE+'</td>\
           </tr>\
           <tr>\
              <td class="key_td">State</td>\
              <td class="value_td">'+OpenNebula.Helper.resource_state("image",img_info.STATE)+'</td>\
           </tr>\
        </table>'
    }

    var template_tab = {
        title: "Image template",
        content: '<table id="img_template_table" class="info_table" style="width:80%;">\
            <thead><tr><th colspan="2">Image template</th></tr></thead>'+
            prettyPrintJSON(img_info.TEMPLATE)+
            '</table>'
    }

    Sunstone.updateInfoPanelTab("image_info_panel","image_info_tab",info_tab);
    Sunstone.updateInfoPanelTab("image_info_panel","image_template_tab",template_tab);

    Sunstone.popUpInfoPanel("image_info_panel");

}

// Prepare the image creation dialog
function setupCreateImageDialog(){
    dialogs_context.append('<div title="Create Image" id="create_image_dialog"></div>');
    $create_image_dialog =  $('#create_image_dialog',dialogs_context);
    var dialog = $create_image_dialog;
    dialog.html(create_image_tmpl);

    var height = Math.floor($(window).height()*0.8); //set height to a percentage of the window

    //Prepare jquery dialog
    dialog.dialog({
        autoOpen: false,
        modal:true,
        width: 520,
        height: height
    });

    $('#img_tabs',dialog).tabs();
    $('button',dialog).button();
    $('#img_type option',dialog).first().attr("selected","selected");
    $('#datablock_img',dialog).attr("disabled","disabled");

    $('select#img_type',dialog).change(function(){
        var value = $(this).val();
        var context = $create_image_dialog;
        switch (value){
        case "DATABLOCK":
            $('#datablock_img',context).removeAttr("disabled");
            break;
        default:
            $('#datablock_img',context).attr("disabled","disabled");
            $('#path_img',context).attr("checked","checked");
            $('#img_source,#img_fstype,#img_size',context).parent().hide();
            $('#img_path',context).parent().show();
        }
    });

    $('#img_source,#img_fstype,#img_size',dialog).parent().hide();
    $('#path_img',dialog).attr("checked","checked");
    $('#img_path',dialog).parent().addClass("img_man");

    $('#img_public',dialog).click(function(){
        $('#img_persistent',$create_image_dialog).removeAttr("checked");
    });

    $('#img_persistent',dialog).click(function(){
        $('#img_public',$create_image_dialog).removeAttr("checked");
    });



    $('#src_path_select input').click(function(){
        var context = $create_image_dialog;
        var value = $(this).val();
        switch (value){
        case "path":
            $('#img_source,#img_fstype,#img_size',context).parent().hide();
            $('#img_source,#img_fstype,#img_size',context).parent().removeClass("img_man");
            $('#img_path',context).parent().show();
            $('#img_path',context).parent().addClass("img_man");
            break;
        case "source":
            $('#img_path,#img_fstype,#img_size',context).parent().hide();
            $('#img_path,#img_fstype,#img_size',context).parent().removeClass("img_man");
            $('#img_source',context).parent().show();
            $('#img_source',context).parent().addClass("img_man");
            break;
        case "datablock":
            $('#img_source,#img_path',context).parent().hide();
            $('#img_source,#img_path',context).parent().removeClass("img_man");
            $('#img_fstype,#img_size',context).parent().show();
            $('#img_fstype,#img_size',context).parent().addClass("img_man");
            break;
        }
    });


    $('#add_custom_var_image_button', dialog).click(
        function(){
            var name = $('#custom_var_image_name',$create_image_dialog).val();
            var value = $('#custom_var_image_value',$create_image_dialog).val();
            if (!name.length || !value.length) {
                notifyError("Custom attribute name and value must be filled in");
                return false;
            }
            option= '<option value=\''+value+'\' name=\''+name+'\'>'+
                name+'='+value+
                '</option>';
            $('select#custom_var_image_box',$create_image_dialog).append(option);
            return false;
        }
    );

    $('#remove_custom_var_image_button', dialog).click(
        function(){
            $('select#custom_var_image_box :selected',$create_image_dialog).remove();
            return false;
        }
    );


    $('#create_image_form_easy',dialog).submit(function(){
        var exit = false;
        $('.img_man',this).each(function(){
            if (!$('input',this).val().length){
                notifyError("There are mandatory parameters missing");
                exit = true;
                return false;
            }
        });
        if (exit) { return false; }
        var img_json = {};

        var name = $('#img_name',this).val();
        img_json["NAME"] = name;

        var desc = $('#img_desc',this).val();
        if (desc.length){
            img_json["DESCRIPTION"] = desc;
        }

        var type = $('#img_type',this).val();
        img_json["TYPE"]= type;

        img_json["PUBLIC"] = $('#img_public:checked',this).length ? "YES" : "NO";

        img_json["PERSISTENT"] = $('#img_persistent:checked',this).length ? "YES" : "NO";

        var dev_prefix = $('#img_dev_prefix',this).val();
        if (dev_prefix.length){
            img_json["DEV_PREFIX"] = dev_prefix;
        }

        var bus = $('#img_bus',this).val();
        img_json["BUS"] = bus;

        var driver = $('#img_driver',this).val();
        if (driver.length)
            img_json["DRIVER"] = driver;

        switch ($('#src_path_select input:checked',this).val()){
        case "path":
            path = $('#img_path',this).val();
            img_json["PATH"] = path;
            break;
        case "source":
            source = $('#img_source',this).val();
            img_json["SOURCE"] = source;
            break;
            case "datablock":
            size = $('#img_size',this).val();
            fstype = $('#img_fstype',this).val();
            img_json["SIZE"] = size;
            img_json["FSTYPE"] = fstype;
            break;
        }

        //Time to add custom attributes
        $('#custom_var_image_box option',$create_image_dialog).each(function(){
            var attr_name = $(this).attr("name");
            var attr_value = $(this).val();
            img_json[attr_name] = attr_value;
        });


        var obj = { "image" : img_json };
        Sunstone.runAction("Image.create", obj);

        $create_image_dialog.dialog('close');
        return false;
    });

    $('#create_image_form_manual',dialog).submit(function(){
        var template=$('#template',this).val();
        Sunstone.runAction("Image.create",template);
        $create_image_dialog.dialog('close');
        return false;
    });
}

function popUpCreateImageDialog(){
    $create_image_dialog.dialog('open');
}



function setupImageTemplateUpdateDialog(){

    //Append to DOM
    dialogs_context.append('<div id="image_template_update_dialog" title="Update image template"></div>');
    var dialog = $('#image_template_update_dialog',dialogs_context);

    //Put HTML in place
    dialog.html(update_image_tmpl);

    //Convert into jQuery
    dialog.dialog({
        autoOpen:false,
        width:700,
        modal:true,
        height:480,
        resizable:false,
    });

    $('button',dialog).button();

    $('#image_template_update_select',dialog).change(function(){
        var id = $(this).val();
        if (id && id.length){
            var dialog = $('#image_template_update_dialog');
            $('#image_template_update_textarea',dialog).val("Loading...");

            var img_public = is_public_image(id);
            var img_persistent = is_persistent_image(id)

            if (img_public){
                $('#image_template_update_public',dialog).attr("checked","checked")
            } else {
                $('#image_template_update_public',dialog).removeAttr("checked")
            }

            if (img_persistent){
                $('#image_template_update_persistent',dialog).attr("checked","checked")
            } else {
                $('#image_template_update_persistent',dialog).removeAttr("checked")
            }

            Sunstone.runAction("Image.fetch_template",id);
        } else {
            $('#image_template_update_textarea',dialog).val("");
        };
    });

    $('#image_template_update_button',dialog).click(function(){
        var dialog = $('#image_template_update_dialog');
        var new_template = $('#image_template_update_textarea',dialog).val();
        var id = $('#image_template_update_select',dialog).val();
        if (!id || !id.length) {
            dialog.dialog('close');
            return false;
        };

        var old_public = is_public_image(id)
        var old_persistent = is_persistent_image(id);

        var new_public = $('#image_template_update_public:checked',dialog).length;
        var new_persistent = $('#image_template_update_persistent:checked',dialog).length;

        if (old_public != new_public){
            if (new_public) Sunstone.runAction("Image.publish",id);
            else Sunstone.runAction("Image.unpublish",id);
        };

        if (old_persistent != new_persistent){
            if (new_persistent) Sunstone.runAction("Image.persistent",id);
            else Sunstone.runAction("Image.nonpersistent",id);
        };

        Sunstone.runAction("Image.update",id,new_template);
        dialog.dialog('close');
        return false;
    });
}


function popUpImageTemplateUpdateDialog(){
    var select = makeSelectOptions(dataTable_images,
                                   1,//id_col
                                   4,//name_col
                                   [],
                                   []
                                  );
    var sel_elems = getSelectedNodes(dataTable_images);


    var dialog =  $('#image_template_update_dialog');
    $('#image_template_update_select',dialog).html(select);
    $('#image_template_update_textarea',dialog).val("");
    $('#image_template_update_public',dialog).removeAttr("checked")
    $('#image_template_update_persistent',dialog).removeAttr("checked")

    if (sel_elems.length >= 1){ //several items in the list are selected
        //grep them
        var new_select= sel_elems.length > 1? '<option value="">Please select</option>' : "";
        $('option','<select>'+select+'</select>').each(function(){
            var val = $(this).val();
            if ($.inArray(val,sel_elems) >= 0){
                new_select+='<option value="'+val+'">'+$(this).text()+'</option>';
            };
        });
        $('#image_template_update_select',dialog).html(new_select);
        if (sel_elems.length == 1) {
            $('#image_template_update_select option',dialog).attr("selected","selected");
            $('#image_template_update_select',dialog).trigger("change");
        }

    };

    dialog.dialog('open');
    return false;

}

// Set the autorefresh interval for the datatable
function setImageAutorefresh() {
    setInterval(function(){
        var checked = $('input.check_item:checked',dataTable_images);
        var filter = $("#datatable_images_filter input",
                       dataTable_images.parents("#datatable_images_wrapper")).attr("value");
        if (!checked.length && !filter.length){
            Sunstone.runAction("Image.autorefresh");
        }
    },INTERVAL+someTime());
};

function is_public_image(id){
    var data = getElementData(id,"#image",dataTable_images)[7];
    return $(data).attr("checked");
};

function is_persistent_image(id){
    var data = getElementData(id,"#image",dataTable_images)[8];
    return $(data).attr("checked");
};

function setupImageActionCheckboxes(){
    $('input.action_cb#cb_public_image',dataTable_images).live("click",function(){
        var $this = $(this)
        var id=$this.attr("elem_id");
        if ($this.attr("checked")){
            if (!is_persistent_image(id))
                Sunstone.runAction("Image.publish",id);
            else {
                notifyError("Image cannot be public and persistent");
                return false;
            };
        } else Sunstone.runAction("Image.unpublish",id);

        return true;
    });

    $('input.action_cb#cb_persistent_image',dataTable_images).live("click",function(){
        var $this = $(this)
        var id=$this.attr("elem_id");
        if ($this.attr("checked")){
            if (!is_public_image(id))
                Sunstone.runAction("Image.persistent",id);
            else {
                notifyError("Image cannot be public and persistent");
                return false;
            };
        } else Sunstone.runAction("Image.nonpersistent",id);

        return true;
    });

    $('select.action_cb#select_chtype_image', dataTable_images).live("change",function(){
        var $this = $(this);
        var value = $this.val();
        var id = $this.attr("elem_id");

        Sunstone.runAction("Image.chtype", id, value);
    });

}

//The DOM is ready at this point
$(document).ready(function(){

    dataTable_images = $("#datatable_images",main_tabs_context).dataTable({
        "bJQueryUI": true,
        "bSortClasses": false,
        "bAutoWidth":false,
        "sPaginationType": "full_numbers",
        "aoColumnDefs": [
            { "bSortable": false, "aTargets": ["check"] },
            { "sWidth": "60px", "aTargets": [0,2,3,7,8,9] },
            { "sWidth": "35px", "aTargets": [1,10] },
            { "sWidth": "100px", "aTargets": [5,9] },
            { "sWidth": "150px", "aTargets": [6] }
        ]
    });

    dataTable_images.fnClearTable();
    addElement([
        spinner,
        '','','','','','','','','',''],dataTable_images);
    Sunstone.runAction("Image.list");

    setupCreateImageDialog();
    setupImageTemplateUpdateDialog();
    setupTips($create_image_dialog);
    setupImageActionCheckboxes();
    setImageAutorefresh();

    initCheckAllBoxes(dataTable_images);
    tableCheckboxesListener(dataTable_images);
    imageInfoListener();
})
