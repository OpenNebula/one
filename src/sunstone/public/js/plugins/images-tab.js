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

/*Images tab plugin*/

size_images = 0;

var create_image_tmpl ='<div class="row create_image_header">\
    <div class="large-5 columns">\
      <h3 class="subheader">'+tr("Create Image")+'</h3>'+
    '</div>'+
    '<div class="large-7 columns">'+
      '<dl class="tabs right" data-tab>\
        <dd class="active"><a href="#img_easyTab">'+tr("Wizard")+'</a></dd>\
        <dd><a href="#img_manualTab">'+tr("Advanced mode")+'</a></dd>\
      </dl>\
    </div>\
  </div>\
  <form id="create_image" action="" class="custom creation">\
      <div class="tabs-content">\
        <div id="img_easyTab" class="content active">\
              <div class="row vm_param">\
                <div class="large-12 columns">\
                  <label for="img_name">'+tr("Name")+
                    '<span class="tip">'+tr("Name that the Image will get. Every image must have a unique name.")+'</span>\
                  </label>\
                  <input type="text" name="img_name" id="img_name" />\
                </div>\
              </div>\
              <div class="row">\
                <div class="large-12 columns">\
                  <label for="img_desc">'+tr("Description")+
                    '<span class="tip">'+tr("Human readable description of the image for other users.")+'</span>\
                  </label>\
                  <textarea name="img_desc" id="img_desc" rows="4"></textarea>\
                </div>\
              </div>\
              <div class="row">\
                <div class="large-6 columns">\
                  <label for="img_type">'+tr("Type")+
                    '<span class="tip">'+tr("Type of the image.")+'<br/><br/>'
                      + tr(" OS images contain a working operative system.")+'<br/><br/>'
                      + tr(" CDROM images are readonly data.")+'<br/><br/>'
                      + tr(" DATABLOCK images are a storage for data. They can be created from previous existing data, or as an empty drive.")+
                    '</span>'+
                  '</label>\
                   <select name="img_type" id="img_type">\
                        <option value="OS">'+tr("OS")+'</option>\
                        <option value="CDROM">'+tr("CDROM")+'</option>\
                        <option value="DATABLOCK">'+tr("DATABLOCK")+'</option>\
                   </select>\
                </div>\
                <div class="large-6 columns">\
                  <label for="img_datastore">'+tr("Datastore")+
                    '<span class="tip">'+tr("Select the datastore for this image")+'</span>'+
                  '</label>\
                   <div id="img_datastore" name="img_datastore">\
                   </div>\
                </div>\
                <div class="large-6 columns">\
                  <input type="checkbox" id="img_persistent" name="img_persistent" value="YES" />\
                  <label for="img_persistent">'+tr("Persistent")+
                    '<span class="tip">'+tr("Persistence of the image")+'</span>'+
                  '</label>\
                </div>\
              </div>\
              <br>\
             <fieldset>\
               <legend>'+tr("Image location")+':</legend>\
               <div class="row" id="src_path_select">\
                  <div class="large-12 columns text-center">\
                       <input type="radio" name="src_path" id="path_image" value="path"><label for="path_image">'+ tr("Provide a path")+'</label> \
                       <input type="radio" name="src_path" id="upload_image" value="upload"> <label for="upload_image">'+tr("Upload")+'</label> \
                       <input type="radio" name="src_path" id="datablock_img" value="datablock" disabled> <label for="datablock_img">'+tr("Empty datablock")+'</label> \
                  </div>\
               </div>\
               <br>\
               <div class="img_param row">\
                 <div class="large-12 columns">\
                    <label for="img_path">'+tr("Path")+
                      '<span class="tip">'+tr("Path to the original file that will be copied to the image repository. If not specified for a DATABLOCK type image, an empty image will be created.")+'</span>'+
                    '</label>\
                    <input type="text" name="img_path" id="img_path" />\
                  </div>\
               </div>\
               <div class="row">\
                  <div id="file-uploader" class="large-12 columns text-center">\
                    <input id="file-uploader-input" type="file"/>\
                  </div>\
               </div>\
               <div class="img_size row">\
                 <div class="large-6 columns">\
                    <label for="img_size">'+tr("Size")+
                      '<span class="tip">'+tr("Size of the datablock in MB.")+'</span>'+
                    '</label>\
                    <input type="text" name="img_size" id="img_size" />\
                  </div>\
                 <div class="large-6 columns">\
                    <label for="img_fstype">'+tr("FS type")+
                      '<span class="tip">'+tr("Type of file system to be built.")+'<br><br>'
                          + tr(" Plain. When the disk image is used directly by the hypervisor we can format the image, and so it is ready to be used by the guest OS. Values: ext2, ext3, ext4, ntfs, reiserfs, jfs, swap. Any other fs supported by mkfs will work if no special option is needed.")+'<br><br>'
                          + tr(" Formatted. The disk image is stored in a hypervisor specific format VMDK or Qcow2. Then we cannot really make a filesystem on the image, just create the device and let the guest OS format the disk. Use raw to not to format the new image. Values: raw, qcow2, vmdk_*.")+
                      '</span>'+
                    '</label>\
                    <input type="text" name="img_fstype" id="img_fstype" />\
                  </div>\
                </div>\
            </fieldset>\
            <div class="show_hide" id="advanced_image_create">\
                 <h4><small><i class=" fa fa-caret-down"/> '+tr("Advanced options")+'<a id="add_os_boot_opts" class="icon_left" href="#"></a></small></h4>\
            </div>\
            <div class="advanced">\
              <div class="row">\
                <div class="large-6 columns">\
                  <div class="row">\
                    <div class="large-12 columns">\
                      <label for="img_dev_prefix">'+tr("Device prefix")+
                        '<span class="tip">'+tr("Prefix for the emulated device this image will be mounted at. For instance, “hd”, “sd”. If omitted, the default value is the one defined in oned.conf (installation default is “hd”).")+'</span>'+
                      '</label>\
                      <input type="text" name="img_dev_prefix" id="img_dev_prefix" />\
                    </div>\
                  </div>\
                  <div class="row">\
                    <div class="large-12 columns">\
                      <label for="img_driver">'+tr("Driver")+
                        '<span class="tip">'+tr("Specific image mapping driver. KVM: raw, qcow2. XEN: tap:aio, file:")+'</span>'+
                      '</label>\
                      <input type="text" name="img_driver" id="img_driver" />\
                    </div>\
                  </div>\
                </div>\
                <div class="large-6 columns">\
                  <div class="row">\
                    <div class="large-12 columns">\
                      <label for="img_target">'+tr("Target")+
                        '<span class="tip">'+tr("Target on which the image will be mounted at. For example: hda, sdb...")+'</span>'+
                      '</label>\
                      <input type="text" name="img_target" id="img_target" />\
                    </div>\
                  </div>\
                </div>\
              </div>\
              <br>\
              <div class="row">\
                <fieldset>\
                  <legend>' + tr("Custom attributes") + '</legend>\
                   <div class="row">\
                    <div class="large-6 columns">\
                      <div class="row">\
                        <div class="large-12 columns">\
                          <label for="custom_var_image_name">'+tr("Name")+'</label>\
                          <input type="text" id="custom_var_image_name" name="custom_var_image_name" />\
                        </div>\
                      </div>\
                      <div class="row">\
                        <div class="large-12 columns">\
                          <label for="custom_var_image_value">'+tr("Value")+'</label>\
                          <input type="text" id="custom_var_image_value" name="custom_var_image_value" />\
                        </div>\
                      </div>\
                      <div class="row">\
                        <div class="large-12 columns">\
                          <button class="add_remove_button add_button secondary button small radius" id="add_custom_var_image_button" type="button" value="add_custom_image_var">\
                           '+tr("Add")+'\
                          </button>\
                          <button class="add_remove_button secondary button small radius" id="remove_custom_var_image_button" type="button" value="remove_custom_image_var">\
                           '+tr("Remove selected")+'\
                          </button>\
                        </div>\
                      </div>\
                    </div>\
                    <div class="large-6 columns">\
                      <div class="row">\
                        <div class="eight centered columns">\
                          <select id="custom_var_image_box" name="custom_var_image_box" style="height:180px !important; width:100%" multiple>\
                            <!-- insert leases -->\
                          </select>\
                        </div>\
                      </div>\
                    </div>\
                   </div>\
                </fieldset>\
              </div>\
          </div>\
            <div class="form_buttons">\
              <button class="button success radius right" id="create_image_submit" type="submit" value="image/create">'+tr("Create")+'</button>\
              <button id="wizard_image_reset_button"  class="button secondary radius" type="reset" value="reset">'+tr("Reset")+'</button>\
            </div>\
        </div>\
        <div id="img_manualTab" class="content">\
              <div class="row">\
                 <div class="columns large-12">\
                   <label for="img_datastores_raw">'+tr("Datastore")+':</label>\
                   <div id="img_datastore_raw" name="img_datastore_raw">\
                   </div>\
                 </div>\
              </div>\
              <div class="row">\
                <div class="columns large-12">\
                   <textarea id="template" rows="15" style="height:380px !important; width:100%;"></textarea>\
                </div>\
              </div>\
               <div class="form_buttons">\
                 <button class="button success radius right" id="create_image_submit_manual" value="image/create">'+tr("Create")+'</button>\
                 <button  id="advanced_image_reset_button" class="button secondary radius" type="reset" value="reset">'+tr("Reset")+'</button>\
               </div>\
          </div>\
        </div>\
        <a class="close-reveal-modal">&#215;</a>\
  </form>\
</div>';

var dataTable_images;
var $create_image_dialog;

var image_actions = {

    "Image.create" : {
        type: "create",
        call: OpenNebula.Image.create,
        callback: function(request, response){
          addImageElement(request, response);
          $create_image_dialog.foundation('reveal', 'close');
          $create_image_dialog.empty();
          setupCreateImageDialog();
          notifyCustom(tr("Image created"), " ID: " + response.IMAGE.ID, false)
        },
        error: onError
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
        callback: function(request, response){
            var tab = dataTable_images.parents(".tab");

            if (Sunstone.rightInfoVisible(tab)) {
                // individual view
                updateImageInfo(request, response);
            }

            // datatable row
            updateImageElement(request, response);
        },
        error: onError
    },

    "Image.refresh" : {
        type: "custom",
        call: function () {
          var tab = dataTable_images.parents(".tab");
          if (Sunstone.rightInfoVisible(tab)) {
            Sunstone.runAction("Image.show", Sunstone.rightInfoResourceId(tab))
          } else {
            waitingNodes(dataTable_images);
            Sunstone.runAction("Image.list", {force: true});
          }
        }
    },

    "Image.update_template" : {
        type: "single",
        call: OpenNebula.Image.update,
        callback: function(request) {
            notifyMessage("Template updated correctly");
            Sunstone.runAction('Image.show',request.request.data[0][0]);
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
        error: function (req,error_json) {
            Sunstone.runAction("Image.show",req.request.data[0]);
            onError(req,error_json);
        },
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
    "Image.clone_dialog" : {
        type: "custom",
        call: popUpImageCloneDialog
    },
    "Image.clone" : {
        type: "single",
        call: OpenNebula.Image.clone,
        error: onError,
        notify: true
    },
    "Image.help" : {
        type: "custom",
        call: function() {
            hideDialog();
            $('div#images_tab div.legend_div').slideToggle();
        }
    },
    "Image.rename" : {
        type: "single",
        call: OpenNebula.Image.rename,
        callback: function(request) {
            notifyMessage(tr("Image renamed correctly"));
            Sunstone.runAction('Image.show',request.request.data[0][0]);
        },
        error: onError,
        notify: true
    },
};


var image_buttons = {
    "Image.refresh" : {
        type: "action",
        layout: "refresh",
        alwaysActive: true
    },
//    "Sunstone.toggle_top" : {
//        type: "custom",
//        layout: "top",
//        alwaysActive: true
//    },
    "Image.create_dialog" : {
        type: "create_dialog",
        layout: "create"
    },
    "Image.chown" : {
        type: "confirm_with_select",
        text: tr("Change owner"),
        layout: "user_select",
        select: "User",
        tip: tr("Select the new owner")+":",
        condition: mustBeAdmin
    },
    "Image.chgrp" : {
        type: "confirm_with_select",
        text: tr("Change group"),
        layout: "user_select",
        select: "Group",
        tip: tr("Select the new group")+":",
        condition: mustBeAdmin
    },
    "Image.enable" : {
        type: "action",
        layout: "more_select",
        text: tr("Enable")
    },
    "Image.disable" : {
        type: "action",
        layout: "more_select",
        text: tr("Disable")
    },
    "Image.persistent" : {
        type: "action",
        layout: "more_select",
        text: tr("Make persistent")
    },
    "Image.nonpersistent" : {
        type: "action",
        layout: "more_select",
        text: tr("Make non persistent")
    },
    "Image.clone_dialog" : {
        type: "action",
        layout: "main",
        text: tr("Clone")
    },
    "Image.delete" : {
        type: "confirm",
        layout: "del",
        text: tr("Delete")
    },
}

var image_info_panel = {
    "image_info_tab" : {
        title: tr("Information"),
        content: ""
    }
}

var images_tab = {
    title: tr("Images"),
    resource: 'Image',
    buttons: image_buttons,
    tabClass: 'subTab',
    parentTab: 'vresources-tab',
    content: '<div class="large-12 columns">\
      <div id="upload_progress_bars"></div>\
    </div>',
    search_input: '<input id="image_search" type="text" placeholder="'+tr("Search")+'" />',
    list_header: '<i class="fa fa-fw fa-upload"></i>&emsp;'+tr("Images"),
    info_header: '<i class="fa fa-fw fa-upload"></i>&emsp;'+tr("Image"),
    subheader: '<span class="total_images"/> <small>'+tr("TOTAL")+'</small>&emsp;\
        <span class="size_images"/> <small>'+tr("USED")+'</small>',
    table: '<table id="datatable_images" class="datatable twelve">\
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
        <tbody id="tbodyimages">\
        </tbody>\
      </table>'
}

Sunstone.addActions(image_actions);
Sunstone.addMainTab('images-tab',images_tab);
Sunstone.addInfoPanel('image_info_panel',image_info_panel);


function imageElements() {
    return getSelectedNodes(dataTable_images);
}

// Returns an array containing the values of the image_json and ready
// to be inserted in the dataTable
function imageElementArray(image_json){
    //Changing this? It may affect to the is_persistent() functions.
    var image = image_json.IMAGE;

    // KERNEL || RAMDISK || CONTEXT
    if (image.TYPE == "3" ||  image.TYPE == "4" || image.TYPE == "5") {
      return false;
    }

    size_images = size_images + parseInt(image.SIZE);

    //add also persistent/non-persistent selects, type select.
    return [
        '<input class="check_item" type="checkbox" id="image_'+image.ID+'" name="selected_items" value="'+image.ID+'"/>',
        image.ID,
        image.UNAME,
        image.GNAME,
        image.NAME,
        image.DATASTORE,
        image.SIZE,
        OpenNebula.Helper.image_type(image.TYPE),
        pretty_time(image.REGTIME),
        parseInt(image.PERSISTENT) ? "yes" : "no",
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

    size_images = 0;

    $.each(images_list,function(){
      var image = imageElementArray(this);
      if (image)
        image_list_array.push(image);
    });

    updateView(image_list_array,dataTable_images);

    var size = humanize_size_from_mb(size_images)

    $(".total_images").text(image_list_array.length);
    $(".size_images").text(size);
}

// Callback to update the information panel tabs and pop it up
function updateImageInfo(request,img){
    var img_info = img.IMAGE;
    var info_tab = {
        title : tr("Info"),
        icon: "fa-info-circle",
        content:
        '<div class="row">\
        <div class="large-6 columns">\
        <table id="info_img_table" class="dataTable extended_table">\
           <thead>\
            <tr><th colspan="3">'+tr("Information")+'</th></tr>\
           </thead>\
           <tr>\
              <td class="key_td">'+tr("ID")+'</td>\
              <td class="value_td">'+img_info.ID+'</td>\
              <td></td>\
           </tr>'+
            insert_rename_tr(
                'images-tab',
                "Image",
                img_info.ID,
                img_info.NAME)+
           '<tr>\
              <td class="key_td">'+tr("Datastore")+'</td>\
              <td class="value_td">'+img_info.DATASTORE+'</td>\
              <td></td>\
           </tr>\
           <tr>\
             <td class="key_td">'+tr("Type")+'</td>\
             <td class="value_td_type">'+OpenNebula.Helper.image_type(img_info.TYPE)+'</td>\
             <td><div id="div_edit_chg_type">\
                   <a id="div_edit_chg_type_link" class="edit_e" href="#"><i class="fa fa-pencil-square-o right"/></a>\
                 </div>\
             </td>\
           </tr>\
           <tr>\
             <td class="key_td">'+tr("Register time")+'</td>\
             <td class="value_td">'+pretty_time(img_info.REGTIME)+'</td>\
              <td></td>\
           </tr>\
           <tr>\
             <td class="key_td">'+tr("Persistent")+'</td>\
             <td class="value_td_persistency">'+(parseInt(img_info.PERSISTENT) ? tr("yes") : tr("no"))+'</td>\
             <td><div id="div_edit_persistency">\
                   <a id="div_edit_persistency_link" class="edit_e" href="#"><i class="fa fa-pencil-square-o right"/></a>\
                 </div>\
             </td>\
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
              <td class="value_td">'+OpenNebula.Helper.resource_state("image",img_info.STATE)+'</td>\
              <td></td>\
           </tr>\
           <tr>\
              <td class="key_td">'+tr("Running VMS")+'</td>\
              <td class="value_td">'+img_info.RUNNING_VMS+'</td>\
              <td></td>\
           </tr>\
        </table>\
       </div>\
       <div class="large-6 columns">' +
         insert_permissions_table('images-tab',
                                     "Image",
                                     img_info.ID,
                                     img_info.UNAME,
                                     img_info.GNAME,
                                     img_info.UID,
                                     img_info.GID) +
       '</div>\
     </div>\
     <div class="row">\
          <div class="large-9 columns">'+
               insert_extended_template_table(img_info.TEMPLATE,
                                               "Image",
                                               img_info.ID,
                                               "Attributes") +
       '</div>\
     </div>'
    }

    $("#div_edit_chg_type_link").die();
    $("#chg_type_select").die();
    $("#div_edit_persistency").die();
    $("#persistency_select").die();

    // Listener for edit link for type change
    $("#div_edit_chg_type_link").live("click", function() {
        $(".value_td_type").html(
                  '<select id="chg_type_select">\
                      <option value="OS">OS</option>\
                      <option value="CDROM">CDROM</option>\
                      <option value="DATABLOCK">DATABLOCK</option>\
                  </select>');

        $('#chg_type_select').val(OpenNebula.Helper.image_type(img_info.TYPE));
    });

    $("#chg_type_select").live("change", function() {
        var new_value = $(this).val();

        Sunstone.runAction("Image.chtype", img_info.ID, new_value);
    });

    // Listener for edit link for persistency change
    $("#div_edit_persistency").live("click", function() {
        $(".value_td_persistency").html(
                  '<select id="persistency_select">\
                      <option value="yes">'+tr("yes")+'</option>\
                      <option value="no">'+tr("no")+'</option>\
                  </select>');

        $('#persistency_select').val(parseInt(img_info.PERSISTENT) ? "yes" : "no");
    });

    $("#persistency_select").live("change", function() {
        var new_value = $(this).val();

        if (new_value=="yes")
            Sunstone.runAction("Image.persistent",[img_info.ID]);
        else
            Sunstone.runAction("Image.nonpersistent",[img_info.ID]);

    });


    var vms_info_tab = {
        title: tr("VMs"),
        icon: "fa-cloud",
        content : '<div id="datatable_image_vms_info_div" class="row">\
          <div class="large-12 columns">\
            <table id="datatable_image_vms" class="datatable twelve">\
              <thead>\
                <tr>\
                  <th class="check"><input type="checkbox" class="check_all" value=""></input></th>\
                  <th>'+tr("ID")+'</th>\
                  <th>'+tr("Owner")+'</th>\
                  <th>'+tr("Group")+'</th>\
                  <th>'+tr("Name")+'</th>\
                  <th>'+tr("Status")+'</th>\
                  <th>'+tr("Used CPU")+'</th>\
                  <th>'+tr("Used Memory")+'</th>\
                  <th>'+tr("Host")+'</th>\
                  <th>'+tr("IPs")+'</th>\
                  <th>'+tr("Start Time")+'</th>\
                  <th>'+tr("VNC")+'</th>\
                </tr>\
              </thead>\
              <tbody id="tbody_image_vmachines">\
              </tbody>\
            </table>\
          </div>\
          </div>'
      }

    Sunstone.updateInfoPanelTab("image_info_panel","image_info_tab",info_tab);
    Sunstone.updateInfoPanelTab("image_info_panel","image_vms_tab",vms_info_tab);
    Sunstone.popUpInfoPanel("image_info_panel", "images-tab");


    dataTable_image_vMachines = $("#datatable_image_vms", $("#image_info_panel")).dataTable({
        "bSortClasses" : false,
        "bDeferRender": true,
        "aoColumnDefs": [
            { "bSortable": false, "aTargets": ["check",6,7,11] },
            { "sWidth": "35px", "aTargets": [0] },
            { "bVisible": false, "aTargets": [0]},
            { "bVisible": true, "aTargets": Config.tabTableColumns("vms-tab")},
            { "bVisible": false, "aTargets": ['_all']},
        ]
    });

    infoListener(dataTable_image_vMachines,'VM.show','vms-tab');

    if (img_info.VMS) {
        var vm_ids = img_info.VMS.ID;
        var vm_ids_map = {};

        if (!(vm_ids instanceof Array)) {
            vm_ids = [vm_ids];
        }

        $.each(vm_ids,function(){
            vm_ids_map[this] = true;
        });

        OpenNebula.VM.list({
            timeout: true,
            success: function (request, vm_list){
                var vm_list_array = [];

                $.each(vm_list,function(){
                    if (vm_ids_map[this.VM.ID]){
                        //Grab table data from the vm_list
                        vm_list_array.push(vMachineElementArray(this));
                    }
                });

                updateView(vm_list_array, dataTable_image_vMachines);
            },
            error: onError
        });
    }

    setPermissionsTable(img_info,'');
}

function enable_all_datastores()
{

    $('select#disk_type').children('option').each(function() {
      $(this).removeAttr('disabled');
    });
}

// Prepare the image creation dialog
function setupCreateImageDialog(dialog) {
    if ($('#create_image_dialog').length == 0) {
      dialogs_context.append('<div id="create_image_dialog"></div>');
    }

    $create_image_dialog =  $('#create_image_dialog');

    var dialog = $create_image_dialog;
    dialog.html(create_image_tmpl);

    dialog.addClass("reveal-modal medium").attr("data-reveal", "");

    initialize_create_image_dialog(dialog);
}

function initialize_create_image_dialog(dialog) {
    setupTips(dialog);
    $('.advanced',dialog).hide();

    $('#advanced_image_create',dialog).click(function(){
        $('.advanced',dialog).toggle();
        return false;
    });

    $('select#img_type',dialog).change(function(){
        var value = $(this).val();
        var context = dialog;
        switch (value){
        case "DATABLOCK":
            $('#datablock_img',context).removeAttr("disabled");
            break;
        default:
            $('#datablock_img',context).attr('disabled','disabled');
            $('#path_image',context).click();

        }
    });

    $('#img_path,#img_fstype,#img_size,#file-uploader',dialog).closest('.row').hide();

    $("input[name='src_path']", dialog).change(function(){
        var context = dialog;
        var value = $(this).val();
        switch (value){
        case "path":
            $('#img_fstype,#img_size,#file-uploader',context).closest('.row').hide();
            $('#img_path',context).closest('.row').show();
            break;
        case "datablock":
            $('#img_path,#file-uploader',context).closest('.row').hide();
            $('#img_fstype,#img_size',context).closest('.row').show();
            break;
        case "upload":
            $('#img_path,#img_fstype,#img_size',context).closest('.row').hide();
            $('#file-uploader',context).closest('.row').show();
            break;
        };
    });


    $('#path_image',dialog).click();

    $('#add_custom_var_image_button', dialog).click(
        function(){
            var name = $('#custom_var_image_name',dialog).val();
            var value = $('#custom_var_image_value',dialog).val();
            if (!name.length || !value.length) {
                notifyError(tr("Custom attribute name and value must be filled in"));
                return false;
            }
            option= '<option value=\''+value+'\' name=\''+name+'\'>'+
                name+'='+value+
                '</option>';
            $('select#custom_var_image_box',dialog).append(option);
            return false;
        }
    );

    $('#remove_custom_var_image_button', dialog).click(
        function(){
            $('select#custom_var_image_box :selected',dialog).remove();
            return false;
        }
    );

    $('#upload-progress',dialog).css({
        border: "1px solid #AAAAAA",
        position: "relative",
        width: "258px",
        height: "15px",
        display: "inline-block"
    });
    $('#upload-progress div',dialog).css("border","1px solid #AAAAAA");

    var img_obj;

    var uploader = new Resumable({
        target: '/upload_chunk',
        chunkSize: 10*1024*1024,
        maxFiles: 1,
        testChunks: false,
        query: {
            csrftoken: csrftoken
        }
    });

    uploader.assignBrowse($('#file-uploader-input',dialog)[0]);

    var fileName = '';
    var file_input = false;

    uploader.on('fileAdded', function(file){
        fileName = file.fileName;
        file_input = fileName;
    });

    uploader.on('uploadStart', function() {
        $('#upload_progress_bars').append('<div id="'+fileName+'progressBar" class="row" style="margin-bottom:10px">\
          <div id="'+fileName+'-info" class="large-2 columns dataTables_info">\
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
        $('span.meter', $('div[id="'+fileName+'progressBar"]')).css('width', uploader.progress()*100.0+'%')
    });

    uploader.on('fileSuccess', function(file) {
        $('div[id="'+fileName+'-info"]').text(tr('Registering in OpenNebula'));
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
                $('div[id="'+fileName+'progressBar"]').remove();
                Sunstone.runAction("Image.refresh");
            },
            error: function(response){
                onError({}, OpenNebula.Error(response));
                $('div[id="'+fileName+'progressBar"]').remove();
            }
        });
    });

    $('#create_image',dialog).submit(function(){
        $create_image_dialog = dialog;

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

        var ds_id = $('#img_datastore .resource_list_select',dialog).val();
        if (!ds_id){
            notifyError(tr("Please select a datastore for this image"));
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

        img_json["PERSISTENT"] = $('#img_persistent:checked',dialog).length ? "YES" : "NO";

        var dev_prefix = $('#img_dev_prefix',dialog).val();
        if (dev_prefix.length){
            img_json["DEV_PREFIX"] = dev_prefix;
        }

        var driver = $('#img_driver',dialog).val();
        if (driver.length)
            img_json["DRIVER"] = driver;

        var target = $('#img_target',dialog).val();
        if (target)
            img_json["TARGET"] = target;

        switch ($('#src_path_select input:checked',dialog).val()){
        case "path":
            path = $('#img_path',dialog).val();
            if (path) img_json["PATH"] = path;
            break;
        case "datablock":
            size = $('#img_size',dialog).val();
            fstype = $('#img_fstype',dialog).val();
            if (size) img_json["SIZE"] = size;
            if (fstype) img_json["FSTYPE"] = fstype;
            break;
        case "upload":
            upload=true;
            break;
        }

        //Time to add custom attributes
        $('#custom_var_image_box option',dialog).each(function(){
            var attr_name = $(this).attr('name');
            var attr_value = $(this).val();
            img_json[attr_name] = attr_value;
        });

        img_obj = { "image" : img_json,
                    "ds_id" : ds_id};


        //we this is an image upload we trigger FileUploader
        //to start the upload
        if (upload){
            dialog.foundation('reveal', 'close');
            dialog.empty();
            setupCreateImageDialog();

            //uploader._onInputChange(file_input);
            uploader.upload();
        } else {
            Sunstone.runAction("Image.create", img_obj);
        };

        return false;
    });


    $('#create_image_submit_manual',dialog).click(function(){
        var template=$('#template',dialog).val();
        var ds_id = $('#img_datastore_raw .resource_list_select',dialog).val();

        if (!ds_id){
            notifyError(tr("Please select a datastore for this image"));
            return false;
        };

        var img_obj = {
            "image" : {
                "image_raw" : template
            },
            "ds_id" : ds_id
        };
        Sunstone.runAction("Image.create",img_obj);

        return false;
    });

    $('#wizard_image_reset_button', dialog).click(function(){
        $('#create_image_dialog').html("");
        setupCreateImageDialog();

        popUpCreateImageDialog();
    });

    $('#advanced_image_reset_button', dialog).click(function(){
        $('#create_image_dialog').html("");
        setupCreateImageDialog();

        popUpCreateImageDialog();
        $("a[href='#img_manual']").click();
    });
}

function initialize_datastore_info_create_image_dialog(dialog) {
    var ds_id = $('#img_datastore .resource_list_select',dialog).val();
    var ds_id_raw = $('#img_datastore_raw .resource_list_select',dialog).val();

    // Filter out DS with type system (1) or file (2)
    var filter_att = ["TYPE", "TYPE"];
    var filter_val = ["1", "2"];

    insertSelectOptions('div#img_datastore', dialog, "Datastore",
                        ds_id, false, null, filter_att, filter_val);

    insertSelectOptions('div#img_datastore_raw', dialog, "Datastore",
                        ds_id_raw, false, null, filter_att, filter_val);

    $('#file-uploader input',dialog).removeAttr("style");
    $('#file-uploader input',dialog).attr('style','margin:0;width:256px!important');
}

function popUpCreateImageDialog(){
    $create_image_dialog =  $('#create_image_dialog');
    initialize_datastore_info_create_image_dialog($create_image_dialog);
    $create_image_dialog.foundation().foundation('reveal', 'open');
    $("input#img_name",$create_image_dialog).focus();
}

function is_persistent_image(id){
    var data = getElementData(id,"#image",dataTable_images)[8];
    return $(data).is(':checked');
};

function setupImageCloneDialog(){
    //Append to DOM
    dialogs_context.append('<div id="image_clone_dialog"></div>');
    var dialog = $('#image_clone_dialog',dialogs_context);

    //Put HTML in place

    var html =
'<div class="row">\
  <h3 class="subheader">'+tr("Clone Image")+'</h3>\
</div>\
<form>\
  <div class="row">\
    <div class="columns large-12">\
      <label class="clone_one">'+tr("Name")+':</label>\
      <label class="clone_several">'+tr("Several images are selected, please choose a prefix to name the new copies")+':</label>\
      <input type="text" name="image_clone_name"></input>\
    </div>\
  </div>\
  <div class="row">\
    <div class="large-12 columns">\
      <dl class="accordion" id="image_clone_advanced_toggle" data-accordion>\
        <dd><a href="#image_clone_advanced"> '+tr("Advanced options")+'</a></dd>\
      </dl>\
      <div id="image_clone_advanced" class="row collapse content">\
        <br>\
        <div class="large-12 columns">\
          <span>'+tr("You can select a different target datastore")+'</span>\
          <br/>\
          <br/>\
        </div>\
        '+generateDatastoreTableSelect("image_clone")+'\
      </div>\
    </div>\
  </div>\
  <div class="form_buttons row">\
    <button class="button radius right" id="image_clone_button" value="Image.clone">'+tr("Clone")+'</button>\
  </div>\
  <a class="close-reveal-modal">&#215;</a>\
</form>\
';

    dialog.html(html);
    dialog.addClass("reveal-modal large").attr("data-reveal", "");

    // TODO: Show DS with the same ds mad only
    setupDatastoreTableSelect(dialog, "image_clone",
        { filter_fn: function(ds){ return ds.TYPE == 0; } }
    );

    $('#image_clone_advanced_toggle',dialog).click(function(){
        $('#image_clone_advanced',dialog).toggle();
        return false;
    });

    $('form',dialog).submit(function(){
        var name = $('input[name="image_clone_name"]', this).val();
        var sel_elems = imageElements();

        if (!name || !sel_elems.length)
            notifyError('A name or prefix is needed!');

        var extra_info = {};

        if( $("#selected_resource_id_image_clone", dialog).val().length > 0 ){
            extra_info['target_ds'] =
                $("#selected_resource_id_image_clone", dialog).val();
        }

        if (sel_elems.length > 1){
            for (var i=0; i< sel_elems.length; i++){
                //If we are cloning several images we
                //use the name as prefix
                extra_info['name'] = name+getImageName(sel_elems[i]);
                Sunstone.runAction('Image.clone',
                                   sel_elems[i],
                                   extra_info);
            }
        } else {
            extra_info['name'] = name;
            Sunstone.runAction('Image.clone',sel_elems[0],extra_info)
        }

        dialog.foundation('reveal', 'close')
        setTimeout(function(){
            Sunstone.runAction('Image.refresh');
        }, 1500);
        return false;
    });
}

function popUpImageCloneDialog(){
    var dialog = $('#image_clone_dialog');
    var sel_elems = imageElements();
    //show different text depending on how many elements are selected
    if (sel_elems.length > 1){
        $('.clone_one',dialog).hide();
        $('.clone_several',dialog).show();
        $('input[name="image_clone_name"]',dialog).val('Copy of ');
    }
    else {
        $('.clone_one',dialog).show();
        $('.clone_several',dialog).hide();
        $('input[name="image_clone_name"]',dialog).val('Copy of '+getImageName(sel_elems[0]));
    };

    $('#image_clone_advanced', dialog).hide();
    resetResourceTableSelect(dialog, "image_clone");

    $(dialog).foundation().foundation('reveal', 'open');
    $("input[name='image_clone_name']",dialog).focus();
}

//The DOM is ready at this point
$(document).ready(function(){
    var tab_name = 'images-tab';

    if (Config.isTabEnabled(tab_name)) {
      dataTable_images = $("#datatable_images",main_tabs_context).dataTable({
            "bSortClasses" : false,
            "bDeferRender": true,
            "aoColumnDefs": [
              { "bSortable": false, "aTargets": ["check"] },
              { "sWidth": "35px", "aTargets": [0] },
              { "bVisible": true, "aTargets": Config.tabTableColumns(tab_name)},
              { "bVisible": false, "aTargets": ['_all']}
          ]
      });

      $('#image_search').keyup(function(){
        dataTable_images.fnFilter( $(this).val() );
      })

      dataTable_images.on('draw', function(){
        recountCheckboxes(dataTable_images);
      })

      Sunstone.runAction("Image.list");

      setupCreateImageDialog();
      setupImageCloneDialog();

      initCheckAllBoxes(dataTable_images);
      tableCheckboxesListener(dataTable_images);
      infoListener(dataTable_images,'Image.show');

      $('div#images_tab div.legend_div').hide();

      dataTable_images.fnSort( [ [1,config['user_config']['table_order']] ] );
    }
});
