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

var images_tab_content = '\
<h2>'+tr("Images")+'</h2>\
<form id="image_form" action="" action="javascript:alert(\'js error!\');">\
  <div class="action_blocks">\
  </div>\
<table id="datatable_images" class="display">\
  <thead>\
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
  </tbody>\
</table>\
<div class="legend_div">\
  <span>?</span>\
<p class="legend_p">\
'+tr("Size and registration time are hidden colums. Note that persistent images can only be used by 1 VM. To change image datastore, please re-register the image.")+'\
</p>\
</div>\
</form>';

var create_image_tmpl =
'<div id="img_tabs">\
        <ul><li><a href="#img_easy">'+tr("Wizard")+'</a></li>\
                <li><a href="#img_manual">'+tr("Advanced mode")+'</a></li>\
        </ul>\
        <div id="img_easy">\
           <form id="create_image_form_easy" action="">\
             <p style="font-size:0.8em;text-align:right;"><i>'+
    tr("Fields marked with")+' <span style="display:inline-block;" class="ui-icon ui-icon-alert" /> '+
    tr("are mandatory")+'</i><br />\
             <fieldset>\
               <div class="img_param img_man">\
               <label for="img_name">'+tr("Name")+':</label>\
               <input type="text" name="img_name" id="img_name" />\
               <div class="tip">'+tr("Name that the Image will get. Every image must have a unique name.")+'</div>\
               </div>\
               <div class="img_param">\
                 <label for="img_desc">'+tr("Description")+':</label>\
                 <textarea name="img_desc" id="img_desc" style="height:4em"></textarea>\
               <div class="tip">'+tr("Human readable description of the image for other users.")+'</div>\
               </div>\
               <div class="img_param">\
                 <label for="img_datastore">'+tr("Datastore")+':</label>\
                 <select id="img_datastore" name="img_datastore">\
                 </select>\
                 <div class="tip">'+tr("Select the datastore for this image")+'</div>\
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
                 <div class="tip">'+tr("Type of the image, explained in detail in the following section. If omitted, the default value is the one defined in oned.conf (install default is OS).")+'</div>\
               </div>\
               <div class="img_param">\
                 <label for="img_persistent">'+tr("Persistent")+':</label>\
                 <input type="checkbox" id="img_persistent" name="img_persistent" value="YES" />\
                 <div class="tip">'+tr("Persistence of the image")+'</div>\
               </div>\
               <div class="img_param">\
                  <label for="img_dev_prefix">'+tr("Device prefix")+':</label>\
                  <input type="text" name="img_dev_prefix" id="img_dev_prefix" />\
                  <div class="tip">'+tr("Prefix for the emulated device this image will be mounted at. For instance, “hd”, “sd”. If omitted, the default value is the one defined in oned.conf (installation default is “hd”).")+'</div>\
               </div>\
               <div class="img_param">\
                 <label for="img_bus">'+tr("Bus")+':</label>\
                 <select name="img_bus" id="img_bus">\
                    <option value="ide">'+tr("IDE")+'</option>\
                    <option value="scsi">'+tr("SCSI")+'</option>\
                    <option value="virtio">'+tr("Virtio (KVM)")+'</option>\
                 </select>\
                 <div class="tip">'+tr("Type of disk device to emulate.")+'</div>\
                 </div>\
               <div class="img_param">\
                  <label for="img_driver">'+tr("Driver")+':</label>\
                  <input type="text" name="img_driver" id="img_driver" />\
                  <div class="tip">'+tr("Specific image mapping driver. KVM: raw, qcow2. XEN: tap:aio, file:")+'</div>\
               </div>\
               <div class="img_param">\
                  <label for="img_target">'+tr("Target")+':</label>\
                  <input type="text" name="img_target" id="img_target" />\
                  <div class="tip">'+tr("Target on which the image will be mounted at. For example: hda, sdb...")+'</div>\
               </div>\
              </fieldset>\
              <fieldset>\
                 <div class="" id="src_path_select">\
                   <label style="height:5em;">'+tr("Image location")+':</label>\
\
                   <input type="radio" name="src_path" id="path_img" value="path" />\
                   <label style="float:none">'+tr("Provide a path")+'</label><br />\
\
                   <input type="radio" name="src_path" id="source_img" value="source" />\
                   <label style="float:none">'+tr("Provide a source")+'</label><br />\
\
                   <input type="radio" name="src_path" id="upload_img" value="upload" />\
                   <label style="float:none">'+tr("Upload")+'</label><br />\
\
                   <input type="radio" name="src_path" id="datablock_img" value="datablock" />\
                   <label style="float:none;vertical-align:top">'+tr("Create an empty datablock")+'</label>\
                   <div class="tip">'+tr("Please choose path if you have a file-based image. Choose source otherwise or create an empty datablock disk.")+'</div><br />\
\
                 </div>\
                 <div class="img_param">\
                    <label for="img_path">'+tr("Path")+':</label>\
                    <input type="text" name="img_path" id="img_path" />\
                    <div class="tip">'+tr("Path to the original file that will be copied to the image repository. If not specified for a DATABLOCK type image, an empty image will be created.")+'</div>\
                 </div>\
                 <div class="img_param">\
                    <label for="img_source">'+tr("Source")+':</label>\
                    <input type="text" name="img_source" id="img_source" />\
                    <div class="tip">'+tr("Source to be used in the DISK attribute. Useful for not file-based images.")+'</div>\
                 </div>\
                 <div class="img_size">\
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
                   <label for="file-uploader" >'+tr("Upload file")+':</label>\
                   <div id="file-uploader">\
                   </div><div class="clear" />\
                 </div>\
               </fieldset>\
               <fieldset>\
                  <div class="">\
                    <label for="custom_var_image_name">'+tr("Name")+':</label>\
                    <input type="text" id="custom_var_image_name" name="custom_var_image_name" />\
                    <label for="custom_var_image_value">'+tr("Value")+':</label>\
                    <input type="text" id="custom_var_image_value" name="custom_var_image_value" />\
                    <button class="add_remove_button add_button" id="add_custom_var_image_button" value="add_custom_image_var">'+tr("Add")+'</button>\
                    <button class="add_remove_button" id="remove_custom_var_image_button" value="remove_custom_image_var">'+tr("Remove selected")+'</button>\
                    <div class="clear"></div>\
                    <label for="custom_var_image_box">'+tr("Custom attributes")+':</label>\
                    <select id="custom_var_image_box" name="custom_var_image_box" style="height:100px;" multiple>\
                    </select>\
                 </div>\
               </fieldset>\
               <fieldset>\
                  <div class="form_buttons">\
                    <button class="button" id="create_image_submit" value="user/create">'+tr("Create")+'</button>\
                    <button class="button" type="reset" value="reset">'+tr("Reset")+'</button>\
                    </div>\
                    </fieldset>\
            </form>\
        </div>\
        <div id="img_manual">\
            <form id="create_image_form_manual" action="">\
               <fieldset style="border-top:none;">\
                 <h3 style="margin-bottom:10px;">'+tr("Write the image template here")+'</h3>\
                 <label for="img_datastores_raw">'+tr("Datastore")+':</label>\
                 <select id="img_datastore_raw" name="img_datastore_raw">\
                 </select>\
                 <textarea id="template" rows="15" style="width:100%;"></textarea>\
               </fieldset>\
               <fieldset>\
               <div class="form_buttons">\
                 <button class="button" id="create_vn_submit_manual" value="vn/create">\
                    '+tr("Create")+'\
                 </button>\
                 <button class="button" type="reset" value="reset">'+tr("Reset")+'</button>\
               </div>\
             </fieldset>\
           </form>\
        </div>\
</div>';

var update_image_tmpl =
   '<form action="javascript:alert(\'js error!\');">\
         <h3 style="margin-bottom:10px;">'+tr("Please, choose and modify the image you want to update")+':</h3>\
            <fieldset style="border-top:none;">\
                 <label for="image_template_update_select">'+tr("Select an image")+':</label>\
                 <select id="image_template_update_select" name="image_template_update_select"></select>\
                 <div class="clear"></div>\
                 <div>\
                   <label for="image_template_update_persistent">'+tr("Persistent")+':</label>\
                   <input type="checkbox" name="image_template_update_persistent" id="image_template_update_persistent" />\
                 </div>\
                 <div>\
                   <table class="permissions_table" style="padding:0 10px;">\
                     <thead><tr>\
                         <td style="width:130px">'+tr("Permissions")+':</td>\
                         <td style="width:40px;text-align:center;">'+tr("Use")+'</td>\
                         <td style="width:40px;text-align:center;">'+tr("Manage")+'</td>\
                         <td style="width:40px;text-align:center;">'+tr("Admin")+'</td></tr></thead>\
                     <tr>\
                         <td>'+tr("Owner")+'</td>\
                         <td style="text-align:center"><input type="checkbox" name="vnet_owner_u" class="owner_u" /></td>\
                         <td style="text-align:center"><input type="checkbox" name="vnet_owner_m" class="owner_m" /></td>\
                         <td style="text-align:center"><input type="checkbox" name="vnet_owner_a" class="owner_a" /></td>\
                     </tr>\
                     <tr>\
                         <td>'+tr("Group")+'</td>\
                         <td style="text-align:center"><input type="checkbox" name="vnet_group_u" class="group_u" /></td>\
                         <td style="text-align:center"><input type="checkbox" name="vnet_group_m" class="group_m" /></td>\
                         <td style="text-align:center"><input type="checkbox" name="vnet_group_a" class="group_a" /></td>\
                     </tr>\
                     <tr>\
                         <td>'+tr("Other")+'</td>\
                         <td style="text-align:center"><input type="checkbox" name="vnet_other_u" class="other_u" /></td>\
                         <td style="text-align:center"><input type="checkbox" name="vnet_other_m" class="other_m" /></td>\
                         <td style="text-align:center"><input type="checkbox" name="vnet_other_a" class="other_a" /></td>\
                     </tr>\
                   </table>\
                 </div>\
                 <label for="image_template_update_textarea">'+tr("Template")+':</label>\
                 <div class="clear"></div>\
                 <textarea id="image_template_update_textarea" style="width:100%; height:14em;"></textarea>\
            </fieldset>\
            <fieldset>\
                 <div class="form_buttons">\
                    <button class="button" id="image_template_update_button" value="Image.update_template">'+tr("Update")+'\
                    </button>\
                 </div>\
            </fieldset>\
</form>';

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

    "Image.fetch_permissions" : {
        type: "single",
        call: OpenNebula.Image.show,
        callback: function(request,image_json){
            var dialog = $('#image_template_update_dialog form');
            var image = image_json.IMAGE;
            setPermissionsTable(image,dialog);
        },
        error: onError
    },

    "Image.update_dialog" : {
        type: "custom",
        call: popUpImageTemplateUpdateDialog,
    },

    "Image.update" : {
        type: "single",
        call: OpenNebula.Image.update,
        callback: function() {
            notifyMessage(tr("Image updated correctly"));
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

    "Image.delete" : {
        type: "multiple",
        call: OpenNebula.Image.del,
        callback: deleteImageElement,
        elements: imageElements,
        error: onError,
        notify: true
    },

    "Image.chown" : {
        type: "multiple",
        call: OpenNebula.Image.chown,
        callback:  function (req) {
            Sunstone.runAction("Image.show",req.request.data[0][0]);
        },
        elements: imageElements,
        error: onError,
        notify: true
    },

    "Image.chgrp" : {
        type: "multiple",
        call: OpenNebula.Image.chgrp,
        callback: function (req) {
            Sunstone.runAction("Image.show",req.request.data[0][0]);
        },
        elements: imageElements,
        error: onError,
        notify: true
    },

    "Image.chmod" : {
        type: "single",
        call: OpenNebula.Image.chmod,
//        callback
        error: onError,
        notify: true
    },

    "Image.chtype" : {
        type: "single",
        call: OpenNebula.Image.chtype,
        callback: function (req) {
            Sunstone.runAction("Image.show",req.request.data[0][0]);
        },
        elements: imageElements,
        error: onError,
        notify: true
    },
    "Image.help" : {
        type: "custom",
        call: function() {
            hideDialog();
            $('div#images_tab div.legend_div').slideToggle();
        }
    }
};


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
    "Image.update_dialog" : {
        type: "action",
        text: tr("Update properties"),
        alwaysActive: true
    },
    "Image.chown" : {
        type: "confirm_with_select",
        text: tr("Change owner"),
        select: users_sel,
        tip: tr("Select the new owner")+":",
        condition: mustBeAdmin
    },
    "Image.chgrp" : {
        type: "confirm_with_select",
        text: tr("Change group"),
        select: groups_sel,
        tip: tr("Select the new group")+":",
        condition: mustBeAdmin
    },
    "action_list" : {
        type: "select",
        actions: {
            "Image.enable" : {
                type: "action",
                text: tr("Enable")
            },
            "Image.disable" : {
                type: "action",
                text: tr("Disable")
            },
            "Image.persistent" : {
                type: "action",
                text: tr("Make persistent")
            },
            "Image.nonpersistent" : {
                type: "action",
                text: tr("Make non persistent")
            }
        }
    },
    "Image.delete" : {
        type: "confirm",
        text: tr("Delete")
    },
    "Image.help" : {
        type: "action",
        text: '?',
        alwaysActive: true
    }
}

var image_info_panel = {
    "image_info_tab" : {
        title: tr("Image information"),
        content: ""
    },

    "image_template_tab" : {
        title: tr("Image template"),
        content: ""
    }

}

var images_tab = {
    title: tr("Images"),
    content: images_tab_content,
    buttons: image_buttons,
    tabClass: 'subTab',
    parentTab: 'vres_tab'
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
    //Changing this? It may affect to the is_persistent() functions.
    var image = image_json.IMAGE;

    var type = $('<select>\
                      <option value="OS">'+tr("OS")+'</option>\
                      <option value="CDROM">'+tr("CD-ROM")+'</option>\
                      <option value="DATABLOCK">'+tr("Datablock")+'</option>\
                 </select>');

    var value = OpenNebula.Helper.image_type(image.TYPE);
    $('option[value="'+value+'"]',type).replaceWith('<option value="'+value+'" selected="selected">'+tr(value)+'</option>');

    return [
        '<input class="check_item" type="checkbox" id="image_'+image.ID+'" name="selected_items" value="'+image.ID+'"/>',
        image.ID,
        image.UNAME,
        image.GNAME,
        image.NAME,
        image.DATASTORE,
        image.SIZE,
        '<select class="action_cb" id="select_chtype_image" elem_id="'+image.ID+'" style="width:100px">'+type.html()+'</select>',
        pretty_time(image.REGTIME),
        parseInt(image.PERSISTENT) ? '<input class="action_cb" id="cb_persistent_image" type="checkbox" elem_id="'+image.ID+'" checked="checked"/>'
            : '<input class="action_cb" id="cb_persistent_image" type="checkbox" elem_id="'+image.ID+'"/>',
        OpenNebula.Helper.resource_state("image",image.STATE),
        image.RUNNING_VMS,
        image.TEMPLATE.TARGET ? image.TEMPLATE.TARGET : '--'
        ];
}

// Callback to update an element in the dataTable
function updateImageElement(request, image_json){
    var id = image_json.IMAGE.ID;
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
    updateVResDashboard("images",images_list);
}

// Callback to update the information panel tabs and pop it up
function updateImageInfo(request,img){
    var img_info = img.IMAGE;
    var info_tab = {
        title: tr("Image information"),
        content:
        '<table id="info_img_table" class="info_table" style="width:80%;">\
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
              <td class="key_td">'+tr("Datastore")+'</td>\
              <td class="value_td">'+img_info.DATASTORE+'</td>\
           </tr>\
           <tr>\
              <td class="key_td">'+tr("Owner")+'</td>\
              <td class="value_td">'+img_info.UNAME+'</td>\
           </tr>\
           <tr>\
              <td class="key_td">'+tr("Group")+'</td>\
              <td class="value_td">'+img_info.GNAME+'</td>\
           </tr>\
           <tr>\
             <td class="key_td">'+tr("Type")+'</td>\
             <td class="value_td">'+OpenNebula.Helper.image_type(img_info.TYPE)+'</td>\
           </tr>\
           <tr>\
             <td class="key_td">'+tr("Register time")+'</td>\
             <td class="value_td">'+pretty_time(img_info.REGTIME)+'</td>\
           </tr>\
           <tr>\
             <td class="key_td">'+tr("Persistent")+'</td>\
             <td class="value_td">'+(parseInt(img_info.PERSISTENT) ? tr("yes") : tr("no"))+'</td>\
           </tr>\
           <tr>\
              <td class="key_td">'+tr("Source")+'</td>\
              <td class="value_td">'+(typeof img_info.SOURCE === "string" ? img_info.SOURCE : "--")+'</td>\
           </tr>\
           <tr>\
              <td class="key_td">'+tr("Path")+'</td>\
              <td class="value_td">'+(typeof img_info.PATH === "string" ? img_info.PATH : "--")+'</td>\
           </tr>\
           <tr>\
              <td class="key_td">'+tr("Filesystem type")+'</td>\
              <td class="value_td">'+(typeof img_info.FSTYPE === "string" ? img_info.FSTYPE : "--")+'</td>\
           </tr>\
           <tr>\
              <td class="key_td">'+tr("Size (Mb)")+'</td>\
              <td class="value_td">'+img_info.SIZE+'</td>\
           </tr>\
           <tr>\
              <td class="key_td">'+tr("State")+'</td>\
              <td class="value_td">'+OpenNebula.Helper.resource_state("image",img_info.STATE)+'</td>\
           </tr>\
           <tr>\
              <td class="key_td">'+tr("Running #VMS")+'</td>\
              <td class="value_td">'+img_info.RUNNING_VMS+'</td>\
           </tr>\
           <tr><td class="key_td">'+tr("Permissions")+'</td><td></td></tr>\
           <tr>\
             <td class="key_td">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'+tr("Owner")+'</td>\
             <td class="value_td" style="font-family:monospace;">'+ownerPermStr(img_info)+'</td>\
           </tr>\
           <tr>\
             <td class="key_td">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'+tr("Group")+'</td>\
             <td class="value_td" style="font-family:monospace;">'+groupPermStr(img_info)+'</td>\
           </tr>\
           <tr>\
             <td class="key_td"> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'+tr("Other")+'</td>\
             <td class="value_td" style="font-family:monospace;">'+otherPermStr(img_info)+'</td>\
           </tr>\
        </table>'
    }

    var template_tab = {
        title: tr("Image template"),
        content: '<table id="img_template_table" class="info_table" style="width:80%;">\
            <thead><tr><th colspan="2">'+tr("Image template")+'</th></tr></thead>'+
            prettyPrintJSON(img_info.TEMPLATE)+
            '</table>'
    }

    Sunstone.updateInfoPanelTab("image_info_panel","image_info_tab",info_tab);
    Sunstone.updateInfoPanelTab("image_info_panel","image_template_tab",template_tab);

    Sunstone.popUpInfoPanel("image_info_panel");

}

// Prepare the image creation dialog
function setupCreateImageDialog(){
    dialogs_context.append('<div title="'+tr("Create Image")+'" id="create_image_dialog"></div>');
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
    $('#img_type option',dialog).first().attr('selected','selected');
    $('#datablock_img',dialog).attr('disabled','disabled');

    $('select#img_type',dialog).change(function(){
        var value = $(this).val();
        var context = $create_image_dialog;
        switch (value){
        case "DATABLOCK":
            $('#datablock_img',context).removeAttr("disabled");
            break;
        default:
            $('#datablock_img',context).attr('disabled','disabled');
            $('#path_img',context).attr('checked','checked');
            $('#img_source,#img_fstype,#img_size,#file-uploader',context).parent().hide();
            $('#img_path',context).parent().show();
        }
    });

    $('#img_source,#img_fstype,#img_size,#file-uploader',dialog).parent().hide();
    $('#path_img',dialog).attr('checked','checked');
    $('#img_path',dialog).parent().addClass("img_man");

    $('#src_path_select input').click(function(){
        var context = $create_image_dialog;
        var value = $(this).val();
        switch (value){
        case "path":
            $('#img_source,#img_fstype,#img_size,#file-uploader',context).parent().hide();
            $('#img_source,#img_fstype,#img_size,#file-uploader',context).parent().removeClass("img_man");
            $('#img_path',context).parent().show();
            $('#img_path',context).parent().addClass("img_man");
            break;
        case "source":
            $('#img_path,#img_fstype,#img_size,#file-uploader',context).parent().hide();
            $('#img_path,#img_fstype,#img_size,#file-uploader',context).parent().removeClass("img_man");
            $('#img_source',context).parent().show();
            $('#img_source',context).parent().addClass("img_man");
            break;
        case "datablock":
            $('#img_source,#img_path,#file-uploader',context).parent().hide();
            $('#img_source,#img_path,#file-uploader',context).parent().removeClass("img_man");
            $('#img_fstype,#img_size',context).parent().show();
            $('#img_fstype,#img_size',context).parent().addClass("img_man");
            break;
        case "upload":
            $('#img_path,#img_source,#img_fstype,#img_size',context).parent().hide();
            $('#img_path,#img_source,#img_fstype,#img_size',context).parent().removeClass("img_man");
            $('#file-uploader',context).parent().show();
            $('#file-uploader',context).parent().addClass("img_man");
            break;
        };
    });


    $('#add_custom_var_image_button', dialog).click(
        function(){
            var name = $('#custom_var_image_name',$create_image_dialog).val();
            var value = $('#custom_var_image_value',$create_image_dialog).val();
            if (!name.length || !value.length) {
                notifyError(tr("Custom attribute name and value must be filled in"));
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
        action: 'upload',
        multiple: false,
        params: {},
        sizeLimit: 0,
        showMessage: function(message){
            //notifyMessage(message);
        },
        onSubmit: function(id, fileName){
            uploader.setParams({
                img : JSON.stringify(img_obj),
                file: fileName
            });
            var pos_top = $(window).height() - 120;
            var pos_left = 190;
            var pb_dialog = $('<div id="pb_dialog" title="'+
                              tr("Uploading...")+'">'+
                              '<div id="upload-progress"></div>'+
                              '</div>').dialog({
                                  draggable:true,
                                  modal:false,
                                  resizable:false,
                                  buttons:{},
                                  width: 460,
                                  minHeight: 50,
                                  position: [pos_left, pos_top]
                              });

            $('#upload-progress',pb_dialog).progressbar({value:0});
        },
        onProgress: function(id, fileName, loaded, total){
            $('div#pb_dialog #upload-progress').progressbar("option","value",Math.floor(loaded*100/total));
        },
        onComplete: function(id, fileName, responseJSON){
            notifyMessage("Image uploaded correctly");
            $('div#pb_dialog').dialog('destroy');
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

    $('#create_image_form_easy',dialog).submit(function(){
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

        var ds_id = $('#img_datastore',this).val();
        if (!ds_id){
            notifyError(tr("Please select a datastore for this image"));
            return false;
        };

        var img_json = {};

        var name = $('#img_name',this).val();
        img_json["NAME"] = name;

        var desc = $('#img_desc',this).val();
        if (desc.length){
            img_json["DESCRIPTION"] = desc;
        }

        var type = $('#img_type',this).val();
        img_json["TYPE"]= type;

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

        var target = $('#img_target',this).val();
        if (target)
            img_json["TARGET"] = target;

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
        case "upload":
            upload=true;
            break;
        }

        //Time to add custom attributes
        $('#custom_var_image_box option',$create_image_dialog).each(function(){
            var attr_name = $(this).attr('name');
            var attr_value = $(this).val();
            img_json[attr_name] = attr_value;
        });

        img_obj = { "image" : img_json,
                    "ds_id" : ds_id};

        if (upload){
            uploader._onInputChange(file_input);
        } else {
            Sunstone.runAction("Image.create", img_obj);
        };

        $create_image_dialog.dialog('close');
        return false;
    });

    $('#create_image_form_manual',dialog).submit(function(){
        var template=$('#template',this).val();
        var ds_id = $('#img_datastore_raw',this).val();

        if (!ds_id){
            notifyError(tr("Please select a datastore for this image"));
            return false;
        };

        var img_obj = {
            "image" : {
                "image_raw" : template
            },
            "ds_id" : ds_id,
        };
        Sunstone.runAction("Image.create",img_obj);
        $create_image_dialog.dialog('close');
        return false;
    });
}

function popUpCreateImageDialog(){
    $('#file-uploader input',$create_image_dialog).removeAttr("style");
    $('#file-uploader input',$create_image_dialog).attr('style','margin:0;width:256px!important');

    $('#img_datastore',$create_image_dialog).html(datastores_sel());
    $('#img_datastore_raw',$create_image_dialog).html(datastores_sel());

    $create_image_dialog.dialog('open');
}



function setupImageTemplateUpdateDialog(){

    //Append to DOM
    dialogs_context.append('<div id="image_template_update_dialog" title="'+tr("Update image properties")+'"></div>');
    var dialog = $('#image_template_update_dialog',dialogs_context);

    //Put HTML in place
    dialog.html(update_image_tmpl);

    var height = Math.floor($(window).height()*0.8); //set height to a percentage of the window
    //Convert into jQuery
    dialog.dialog({
        autoOpen:false,
        width:700,
        modal:true,
        height:height,
        resizable:false,
    });

    $('button',dialog).button();

    $('#image_template_update_select',dialog).change(function(){
        var id = $(this).val();
        $('.permissions_table input',dialog).removeAttr('checked')
        $('.permissions_table',dialog).removeAttr('update');
        if (id && id.length){
            var dialog = $('#image_template_update_dialog');
            $('#image_template_update_textarea',dialog).val(tr("Loading")+
                                                            "...");

            var img_persistent = is_persistent_image(id);

            if (img_persistent){
                $('#image_template_update_persistent',dialog).attr('checked','checked')
            } else {
                $('#image_template_update_persistent',dialog).removeAttr('checked')
            };

            Sunstone.runAction("Image.fetch_permissions",id);
            Sunstone.runAction("Image.fetch_template",id);
        } else {
            $('#image_template_update_textarea',dialog).val("");
        };
    });

    $('.permissions_table input',dialog).change(function(){
        $(this).parents('table').attr('update','update');
    });

    $('form',dialog).submit(function(){
        var dialog = $(this);
        var new_template = $('#image_template_update_textarea',dialog).val();
        var id = $('#image_template_update_select',dialog).val();
        if (!id || !id.length) {
            $(this).parents('#image_template_update_dialog').dialog('close');
            return false;
        };

        var old_persistent = is_persistent_image(id);
        var new_persistent = $('#image_template_update_persistent',dialog).is(':checked');
        if (old_persistent != new_persistent){
            if (new_persistent) Sunstone.runAction("Image.persistent",[id]);
            else Sunstone.runAction("Image.nonpersistent",[id]);
        };

        var permissions = $('.permissions_table',dialog);
        if (permissions.attr('update')){
            var perms = {
                octet : buildOctet(permissions)
            };
            Sunstone.runAction("Image.chmod",id,perms);
        };

        Sunstone.runAction("Image.update",id,new_template);
        $(this).parents('#image_template_update_dialog').dialog('close');
        return false;
    });
};


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
    $('#image_template_update_persistent',dialog).removeAttr('checked');
    $('.permissions_table input',dialog).removeAttr('checked');
    $('.permissions_table',dialog).removeAttr('update');


    if (sel_elems.length >= 1){ //several items in the list are selected
        //grep them
        var new_select= sel_elems.length > 1? '<option value="">'+tr("Please select")+'</option>' : "";
        $('option','<select>'+select+'</select>').each(function(){
            var val = $(this).val();
            if ($.inArray(val,sel_elems) >= 0){
                new_select+='<option value="'+val+'">'+$(this).text()+'</option>';
            };
        });
        $('#image_template_update_select',dialog).html(new_select);
        if (sel_elems.length == 1) {
            $('#image_template_update_select option',dialog).attr('selected','selected');
            $('#image_template_update_select',dialog).trigger("change");
        };
    };

    dialog.dialog('open');
    return false;
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

function is_persistent_image(id){
    var data = getElementData(id,"#image",dataTable_images)[8];
    return $(data).is(':checked');
};

function setupImageActionCheckboxes(){
    $('input.action_cb#cb_persistent_image',dataTable_images).live("click",function(){
        var $this = $(this)
        var id=$this.attr('elem_id');
        if ($this.attr('checked'))
            Sunstone.runAction("Image.persistent",[id]);
        else
            Sunstone.runAction("Image.nonpersistent",[id]);

        return true;
    });

    $('select.action_cb#select_chtype_image', dataTable_images).live("change",function(){
        var $this = $(this);
        var value = $this.val();
        var id = $this.attr('elem_id');

        Sunstone.runAction("Image.chtype", id, value);
    });

}

//The DOM is ready at this point
$(document).ready(function(){

    dataTable_images = $("#datatable_images",main_tabs_context).dataTable({
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

    dataTable_images.fnClearTable();
    addElement([
        spinner,
        '','','','','','','','','','','',''],dataTable_images);
    Sunstone.runAction("Image.list");

    setupCreateImageDialog();
    setupImageTemplateUpdateDialog();
    setupTips($create_image_dialog);
    setupImageActionCheckboxes();
    setImageAutorefresh();

    initCheckAllBoxes(dataTable_images);
    tableCheckboxesListener(dataTable_images);
    infoListener(dataTable_images,'Image.showinfo');

    $('div#images_tab div.legend_div').hide();
});
