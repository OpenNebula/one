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

/*Images tab plugin*/

size_images = 0;

var images_tab_content = '\
<form class="custom" id="image_form" action="">\
<div class="panel">\
<div class="row">\
  <div class="twelve columns">\
    <h4 class="subheader header">\
      <span class="header-resource">\
        <i class="icon-upload"></i> '+tr("Images")+'\
      </span>\
      <span class="header-info">\
        <span id="total_images"/> <small>'+tr("TOTAL")+'</small>&emsp;\
        <span id="size_images"/> <small>'+tr("USED")+'</small>\
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
    <input id="image_search" type="text" placeholder="'+tr("Search")+'" />\
  </div>\
</div>\
</div>\
  <div class="">\
    <div class="twelve columns">\
  <div id="upload_progress_bars"></div>\
</div>\
</div>\
  <div class="row">\
    <div class="twelve columns">\
<table id="datatable_images" class="datatable twelve">\
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
</table>\
</form>';

var create_image_tmpl =
  '<div class="panel">\
    <h3><small>'+tr("Create Image")+'</small></h4>\
  </div>\
  <div class="reveal-body">\
  <form id="create_image" action="" class="custom creation">\
        <dl class="tabs">\
        <dd class="active"><a href="#img_easy">'+tr("Wizard")+'</a></dd>\
          <dd><a href="#img_manual">'+tr("Advanced mode")+'</a></dd>\
        </dl>\
        <ul class="tabs-content">\
        <li id="img_easyTab" class="active">\
                  <div class="row vm_param">\
                    <div class="six columns">\
                      <div class="row">\
                        <div class="four columns">\
                          <label class="right inline" for="img_name">'+tr("Name")+':</label>\
                        </div>\
                        <div class="seven columns">\
                          <input type="text" name="img_name" id="img_name" />\
                        </div>\
                        <div class="one columns tip">'+tr("Name that the Image will get. Every image must have a unique name.")+'</div>\
                      </div>\
                      <div class="row">\
                        <div class="four columns">\
                          <label class="right inline" for="img_desc">'+tr("Description")+':</label>\
                        </div>\
                        <div class="seven columns">\
                          <textarea name="img_desc" id="img_desc" rows="4"></textarea>\
                        </div>\
                        <div class="one columns">\
                          <div class="tip">'+tr("Human readable description of the image for other users.")+'</div>\
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
                              <option value="OS">'+tr("OS")+'</option>\
                              <option value="CDROM">'+tr("CDROM")+'</option>\
                              <option value="DATABLOCK">'+tr("DATABLOCK")+'</option>\
                         </select>\
                        </div>\
                        <div class="one columns">\
                          <div class="tip">'+tr("Type of the image, explained in detail in the following section. If omitted, the default value is the one defined in oned.conf (install default is OS).")+'</div>\
                        </div>\
                      </div>\
                      <div class="row">\
                        <div class="four columns">\
                          <label class="right inline" for="img_datastore">'+tr("Datastore")+':</label>\
                        </div>\
                        <div class="seven columns">\
                         <select id="img_datastore" name="img_datastore">\
                         </select>\
                        </div>\
                        <div class="one columns">\
                          <div class="tip">'+tr("Select the datastore for this image")+'</div>\
                        </div>\
                      </div>\
                      <div class="row">\
                        <div class="four columns">\
                          <label class="right inline" for="img_persistent">'+tr("Persistent")+':</label>\
                        </div>\
                        <div class="seven columns">\
                         <input type="checkbox" id="img_persistent" name="img_persistent" value="YES" />\
                        </div>\
                        <div class="one columns">\
                          <div class="tip">'+tr("Persistence of the image")+'</div>\
                        </div>\
                      </div>\
                    </div>\
                  </div>\
                 <div class="row">\
                 <fieldset>\
                 <legend>'+tr("Image location")+':</legend>\
                 <div class="row centered" id="src_path_select" style="text-align:center">\
                         <input type="radio" name="src_path" id="path_img" value="path">'+ tr("Provide a path")+'&emsp;</input> \
                         <input type="radio" name="src_path" id="upload_img" value="upload"> '+tr("Upload")+'</input> &emsp;\
                         <input type="radio" name="src_path" id="datablock_img" value="datablock" disabled> '+tr("Empty datablock")+'</input> &emsp;\
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
                      <div class="tip">'+tr("Path to the original file that will be copied to the image repository. If not specified for a DATABLOCK type image, an empty image will be created.")+'</div>\
                    </div>\
                 </div>\
                 </div>\
                 <div class="row">\
                  <div class="columns eight centered">\
                    <div id="file-uploader"></div>\
                  </div>\
                 </div>\
                 <div class="img_size">\
                   <div class="six columns">\
                    <div class="row">\
                        <div class="four columns">\
                          <label class="right inline" for="img_size">'+tr("Size")+':</label>\
                        </div>\
                        <div class="seven columns">\
                         <input type="text" name="img_size" id="img_size" />\
                        </div>\
                        <div class="one columns">\
                          <div class="tip">'+tr("Size of the datablock in MB.")+'</div>\
                        </div>\
                    </div>\
                  </div>\
                   <div class="six columns">\
                    <div class="row">\
                        <div class="four columns">\
                          <label class="right inline" for="img_fstype">'+tr("FS type")+':</label>\
                        </div>\
                        <div class="seven columns">\
                         <input type="text" name="img_fstype" id="img_fstype" />\
                        </div>\
                        <div class="one columns">\
                          <div class="tip">'+tr("Type of file system to be built. This can be any value understood by mkfs unix command.")+'</div>\
                        </div>\
                    </div>\
                    </div>\
                  </div>\
                 </fieldset>\
                 </div>\
                <div class="show_hide" id="advanced_image_create">\
                     <h4><small><i class=" icon-caret-down"/> '+tr("Advanced options")+'<a id="add_os_boot_opts" class="icon_left" href="#"></a></small></h4>\
                </div>\
                <div class="advanced">\
                  <div class="row">\
                    <div class="six columns">\
                      <div class="row">\
                        <div class="six columns">\
                          <label class="right inline" for="img_dev_prefix">'+tr("Device prefix")+':</label>\
                        </div>\
                        <div class="five columns">\
                          <input type="text" name="img_dev_prefix" id="img_dev_prefix" />\
                        </div>\
                        <div class="one columns">\
                          <div class="tip">'+tr("Prefix for the emulated device this image will be mounted at. For instance, “hd”, “sd”. If omitted, the default value is the one defined in oned.conf (installation default is “hd”).")+'</div>\
                        </div>\
                      </div>\
                      <div class="row">\
                        <div class="six columns">\
                          <label class="right inline" for="img_driver">'+tr("Driver")+':</label>\
                        </div>\
                        <div class="five columns">\
                          <input type="text" name="img_driver" id="img_driver" />\
                        </div>\
                        <div class="one columns">\
                          <div class="tip">'+tr("Specific image mapping driver. KVM: raw, qcow2. XEN: tap:aio, file:")+'</div>\
                        </div>\
                      </div>\
                    </div>\
                    <div class="six columns">\
                      <div class="row">\
                        <div class="six columns">\
                          <label class="right inline" for="img_target">'+tr("Target")+':</label>\
                        </div>\
                        <div class="five columns">\
                          <input type="text" name="img_target" id="img_target" />\
                        </div>\
                        <div class="one columns">\
                          <div class="tip">'+tr("Target on which the image will be mounted at. For example: hda, sdb...")+'</div>\
                        </div>\
                      </div>\
                    </div>\
                  </div>\
                  <div class="row">\
                    <fieldset>\
                      <legend>' + tr("Custom attributes") + '</legend>\
                       <div class="row">\
                        <div class="six columns">\
                          <div class="row">\
                            <div class="four columns">\
                              <label class="right inline" for="custom_var_image_name">'+tr("Name")+':</label>\
                            </div>\
                            <div class="seven columns">\
                              <input type="text" id="custom_var_image_name" name="custom_var_image_name" />\
                            </div>\
                            <div class="one columns">\
                            </div>\
                          </div>\
                          <div class="row">\
                            <div class="four columns">\
                              <label class="right inline" for="custom_var_image_value">'+tr("Value")+':</label>\
                            </div>\
                            <div class="seven columns">\
                              <input type="text" id="custom_var_image_value" name="custom_var_image_value" />\
                            </div>\
                            <div class="one columns">\
                            </div>\
                          </div>\
                          <div class="row">\
                            <div class="six columns">\
                              <button class="add_remove_button add_button secondary button right small radius" id="add_custom_var_image_button" value="add_custom_image_var">\
                               '+tr("Add")+'\
                              </button>\
                            </div>\
                            <div class="six columns">\
                              <button class="add_remove_button secondary button small radius" id="remove_custom_var_image_button" value="remove_custom_image_var">\
                               '+tr("Remove selected")+'\
                              </button>\
                            </div>\
                          </div>\
                        </div>\
                        <div class="six columns">\
                          <div class="row">\
                            <div class="eight centered columns">\
                              <select id="custom_var_image_box" name="custom_var_image_box" style="height:10em; width:100%" multiple>\
                                <!-- insert leases -->\
                              </select>\
                            </div>\
                          </div>\
                        </div>\
                       </div>\
                    </fieldset>\
                  </div>\
                  </div>\
          <div class="reveal-footer">\
            <hr>\
            <div class="form_buttons">\
              <button class="button success radius right" id="create_image_submit" type="button" value="image/create">'+tr("Create")+'</button>\
              <button id="wizard_image_reset_button"  class="button secondary radius" type="reset" value="reset">'+tr("Reset")+'</button>\
              <button class="close-reveal-modal button secondary radius" type="button" value="close">' + tr("Close") + '</button>\
            </div>\
          </div>\
        </li>\
        <li id="img_manualTab">\
        <div class="reveal-body">\
                 <div class="columns three">\
                   <label class="inline left" for="img_datastores_raw">'+tr("Datastore")+':</label>\
                 </div>\
                 <div class="columns nine">\
                   <select id="img_datastore_raw" name="img_datastore_raw"></select>\
                 </div>\
                 <textarea id="template" rows="15" style="width:100%;"></textarea>\
                 </div>\
          <div class="reveal-footer">\
                 <hr>\
               <div class="form_buttons">\
                 <button class="button success radius right" id="create_image_submit_manual" value="image/create">'+tr("Create")+'</button>\
                 <button  id="advanced_image_reset_button" class="button secondary radius" type="reset" value="reset">'+tr("Reset")+'</button>\
                 <button class="close-reveal-modal button secondary radius" type="button" value="close">' + tr("Close") + '</button>\
               </div>\
          </div>\
        </li>\
        </ul>\
        <a class="close-reveal-modal">&#215;</a>\
           </form>\
</div>';

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
        }
    },

    "Image.autorefresh" : {
        type: "custom",
        call: function() {
            OpenNebula.Image.list({timeout: true, success: updateImagesView, error: onError});
        }
    },

    "Image.update_template" : {
        type: "single",
        call: OpenNebula.Image.update,
        callback: function(request) {
            notifyMessage("Template updated correctly");
            Sunstone.runAction('Image.showinfo',request.request.data[0]);
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
            Sunstone.runAction("Image.list");
        },
        elements: imageElements,
        error: function (req,error_json) {
            Sunstone.runAction("Image.showinfo",req.request.data[0]);
            onError(req,error_json);
        },
        notify: true
    },

    "Image.nonpersistent" : {
        type: "multiple",
        call: OpenNebula.Image.nonpersistent,
        callback: function (req) {
            Sunstone.runAction("Image.show",req.request.data[0]);
            Sunstone.runAction("Image.list");
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
            Sunstone.runAction('Image.showinfo',req.request.data[0]);
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
            Sunstone.runAction('Image.showinfo',req.request.data[0]);
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
            Sunstone.runAction("Image.list");
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
            notifyMessage("Image renamed correctly");
            Sunstone.runAction('Image.showinfo',request.request.data[0]);
            Sunstone.runAction('Image.list');
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
    "Image.create_dialog" : {
        type: "create_dialog",
        layout: "create"
    },
    "Image.chown" : {
        type: "confirm_with_select",
        text: tr("Change owner"),
        layout: "user_select",
        select: users_sel,
        tip: tr("Select the new owner")+":",
        condition: mustBeAdmin
    },
    "Image.chgrp" : {
        type: "confirm_with_select",
        text: tr("Change group"),
        layout: "user_select",
        select: groups_sel,
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
    //"Image.help" : {
    //    type: "action",
    //    text: '?',
    //    alwaysActive: true
    //}
}

var image_info_panel = {
    "image_info_tab" : {
        title: tr("Information"),
        content: ""
    }
}

var images_tab = {
    title: tr("Images"),
    content: images_tab_content,
    buttons: image_buttons,
    tabClass: 'subTab',
    parentTab: 'vresources-tab'
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

    $("#total_images", $dashboard).text(image_list_array.length);
    $("#size_images", $dashboard).text(size);

    var form = $("#image_form");

    $("#total_images", form).text(image_list_array.length);
    $("#size_images", form).text(size);
}

// Callback to update the information panel tabs and pop it up
function updateImageInfo(request,img){
    var img_info = img.IMAGE;
    var info_tab = {
        title: tr("Information"),
        content:
        '<form class="custom"><div class="">\
        <div class="six columns">\
        <table id="info_img_table" class="twelve datatable extended_table">\
           <thead>\
            <tr><th colspan="3">'+tr("Image")+' - '+img_info.NAME+'</th></tr>\
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
                   <a id="div_edit_rename_link" class="edit_e" href="#"><i class="icon-edit right"/></a>\
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
             <td><div id="div_edit_chg_type">\
                   <a id="div_edit_chg_type_link" class="edit_e" href="#"><i class="icon-edit right"/></a>\
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
                   <a id="div_edit_persistency_link" class="edit_e" href="#"><i class="icon-edit right"/></a>\
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
        <div class="six columns">'
           + insert_permissions_table('images-tab',
                                   "Image",
                                   img_info.ID,
                                   img_info.UNAME,
                                   img_info.GNAME,
                                   img_info.UID,
                                   img_info.GID) +
            insert_extended_template_table(img_info.TEMPLATE,
                                               "Image",
                                               img_info.ID,
                                               "Configuration & Tags") +
        '</div>\
      </div></form>'
    }

    $("#div_edit_rename_link").die();
    $(".input_edit_value_rename").die();
    $("#div_edit_chg_type_link").die();
    $("#chg_type_select").die();
    $("#div_edit_persistency").die();
    $("#persistency_select").die();


    // Listener for edit link for rename
    $("#div_edit_rename_link").live("click", function() {
        var value_str = $(".value_td_rename").text();
        $(".value_td_rename").html('<input class="input_edit_value_rename" id="input_edit_rename" type="text" value="'+value_str+'"/>');
    });

    $(".input_edit_value_rename").live("change", function() {
        var value_str = $(".input_edit_value_rename").val();
        if(value_str!="")
        {
            // Let OpenNebula know
            var name_template = {"name": value_str};
            Sunstone.runAction("Image.rename",img_info.ID,name_template);
        }
    });

    // Listener for edit link for type change
    $("#div_edit_chg_type_link").live("click", function() {
        var value_str = $(".value_td_type").text();
        $(".value_td_type").html(
                  '<select id="chg_type_select">\
                      <option value="OS">'+tr("OS")+'</option>\
                      <option value="CDROM">'+tr("CDROM")+'</option>\
                      <option value="DATABLOCK">'+tr("Datablock")+'</option>\
                  </select>');
       $('option[value="'+value_str+'"]').replaceWith('<option value="'+value_str+'" selected="selected">'+tr(value_str)+'</option>');
    });

    $("#chg_type_select").live("change", function() {
        var new_value=$("option:selected", this).text();
        Sunstone.runAction("Image.chtype", img_info.ID, new_value);
        Sunstone.runAction("Image.showinfo", img_info.ID);
    });

    // Listener for edit link for persistency change
    $("#div_edit_persistency").live("click", function() {
        var value_str = $(".value_td_persistency").text();
        $(".value_td_persistency").html(
                  '<select id="persistency_select">\
                      <option value="yes">'+tr("yes")+'</option>\
                      <option value="no">'+tr("no")+'</option>\
                  </select>');
       $('option[value="'+value_str+'"]').replaceWith('<option value="'+value_str+'" selected="selected">'+tr(value_str)+'</option>');
    });

    $("#persistency_select").live("change", function() {
        var new_value=$("option:selected", this).text();

        if (new_value=="yes")
            Sunstone.runAction("Image.persistent",[img_info.ID]);
        else
            Sunstone.runAction("Image.nonpersistent",[img_info.ID]);

    });

    Sunstone.updateInfoPanelTab("image_info_panel","image_info_tab",info_tab);
    Sunstone.popUpInfoPanel("image_info_panel", "images-tab");

    setPermissionsTable(img_info,'');

    $("#image_info_panel_refresh", $("#image_info_panel")).click(function(){
      $(this).html(spinner);
      Sunstone.runAction('Image.showinfo', img_info.ID);
    })

}

function enable_all_datastores()
{

    $('select#disk_type').children('option').each(function() {
      $(this).removeAttr('disabled');
    });
}

// Prepare the image creation dialog
function setupCreateImageDialog(){
    dialogs_context.append('<div id="create_image_dialog"></div>');
    $create_image_dialog =  $('#create_image_dialog',dialogs_context);

    var dialog = $create_image_dialog;
    dialog.html(create_image_tmpl);

    setupTips($create_image_dialog);

    var height = Math.floor($(window).height()*0.8); //set height to a percentage of the window

    //Prepare jquery dialog
    //dialog.dialog({
    //    autoOpen: false,
    //    modal:true,
    //    width: 520,
    //    height: height
    //});
    dialog.addClass("reveal-modal large max-height");

    $('.advanced',dialog).hide();

    $('#advanced_image_create',dialog).click(function(){
        $('.advanced',dialog).toggle();
        return false;
    });

    //$('#img_tabs',dialog).tabs();
    //$('button',dialog).button();
    //$('#datablock_img',dialog).attr('disabled','disabled');


    $('select#img_type',dialog).change(function(){
        var value = $(this).val();
        var context = $create_image_dialog;
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


    $('#img_path,#img_fstype,#img_size,#file-uploader',dialog).closest('.row').hide();

    $("input[name='src_path']", dialog).change(function(){
        var context = $create_image_dialog;
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


    $('#path_img',dialog).click();


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
        display: "inline-block"
    });
    $('#upload-progress div',dialog).css("border","1px solid #AAAAAA");

    var img_obj;

    // Upload is handled by FileUploader vendor plugin
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
            //set url params
            //since the body is the upload, we need the pass
            //the image info here
            uploader.setParams({
                img : JSON.stringify(img_obj),
                file: fileName
            });
            //we pop up an upload progress dialog
            //var pos_top = $(window).height() - 120;
            //var pos_left = 220;
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

            //var pb_dialog = $('<div id="pb_dialog" title="'+
            //                  tr("Uploading...")+'">'+
            //                  '<div id="upload-progress"></div>'+
            //                  '</div>').addClass("reveal-modal");

            //$('#upload-progress',pb_dialog).progressbar({value:0});
            $('#upload_progress_bars').append('<div id="'+id+'progressBar" class="row" style="margin-bottom:10px">\
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
        },
        onProgress: function(id, fileName, loaded, total){
            //update upload dialog with current progress
            //$('div#pb_dialog #upload-progress').progressbar("option","value",Math.floor(loaded*100/total));
            $('span.meter', $('#'+id+'progressBar')).css('width', Math.floor(loaded*100/total)+'%')
        },
        onComplete: function(id, fileName, responseJSON){

            if (uploader._handler._xhrs[id] &&
                uploader._handler._xhrs[id].status == 500) {

                onError({}, JSON.parse(uploader._handler._xhrs[id].response) )
                $('#'+id+'progressBar').remove();
            } else {
                notifyMessage("Image uploaded correctly");
                $('#'+id+'progressBar').remove();
                Sunstone.runAction("Image.list");
            }

            return false;
        },
        onCancel: function(id, fileName){
        }
    });

    var file_input = false;
    uploader._button._options.onChange = function(input) {
        file_input = input;  return false;
    };

    $('#img_type').change(function(){
        enable_all_datastores();
        var choice_str = $(this).val();
        switch(choice_str)
        {
          case 'OS':
          case 'CDROM':
          case 'DATABLOCK':
            $('select#img_datastore').children('option').each(function() {
              $(this).removeAttr('disabled');
              if ($(this).val() == "2")
              {
                $(this).attr('disabled', 'disabled');
              }
            });
            $('select#img_datastore').val("1");
            break;
          case 'KERNEL':
          case 'RAMDISK':
          case 'CONTEXT':
            $('select#img_datastore').children('option').each(function() {
              $(this).attr('disabled', 'disabled');
              if ($(this).val() == "2")
              {
                  $(this).removeAttr('disabled');
              }
            });
            $('select#img_datastore').val("2");
            break;
         }
    });

    $('#create_image_submit',dialog).click(function(){
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

        var ds_id = $('#img_datastore',dialog).val();
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
        $('#custom_var_image_box option',$create_image_dialog).each(function(){
            var attr_name = $(this).attr('name');
            var attr_value = $(this).val();
            img_json[attr_name] = attr_value;
        });

        img_obj = { "image" : img_json,
                    "ds_id" : ds_id};


        //we this is an image upload we trigger FileUploader
        //to start the upload
        if (upload){
            uploader._onInputChange(file_input);
        } else {
            Sunstone.runAction("Image.create", img_obj);
        };

        $create_image_dialog.trigger("reveal:close")

        return false;
    });


    $('#create_image_submit_manual',dialog).click(function(){
        var template=$('#template',dialog).val();
        var ds_id = $('#img_datastore_raw',dialog).val();

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
        $create_image_dialog.trigger("reveal:close")
        return false;
    });

    $('#wizard_image_reset_button').click(function(){
        $create_image_dialog.trigger('reveal:close');
        $create_image_dialog.remove();
        setupCreateImageDialog();

        popUpCreateImageDialog();
    });

    $('#advanced_image_reset_button').click(function(){
        $create_image_dialog.trigger('reveal:close');
        $create_image_dialog.remove();
        setupCreateImageDialog();

        popUpCreateImageDialog();
        $("a[href='#img_manual']").click();
    });
}

function popUpCreateImageDialog(){
    $('#file-uploader input',$create_image_dialog).removeAttr("style");
    $('#file-uploader input',$create_image_dialog).attr('style','margin:0;width:256px!important');

    datastores_str = makeSelectOptions(dataTable_datastores,
                                          1,
                                          4,
                                          [10,10],//system ds
                                          ['file','system'], //filter image & sys datastores
                                          true
                                         );

    $('#img_datastore',$create_image_dialog).html(datastores_str);
    $('#img_datastore_raw',$create_image_dialog).html(datastores_str);

    $create_image_dialog.reveal();

    $('select#img_datastore').children('option').each(function() {
      if ($(this).val() == "2")
      {
          $(this).attr('disabled', 'disabled');
      }
    });
}

// Set the autorefresh interval for the datatable
function setImageAutorefresh() {
    setInterval(function(){
        var checked = $('input.check_item:checked',dataTable_images);
        var filter = $("#image_search").attr('value');
        if ((checked.length==0) && !filter){
            Sunstone.runAction("Image.autorefresh");
        }
    },INTERVAL+someTime());
};

function is_persistent_image(id){
    var data = getElementData(id,"#image",dataTable_images)[8];
    return $(data).is(':checked');
};

function setupImageCloneDialog(){
    //Append to DOM
    dialogs_context.append('<div id="image_clone_dialog"></div>');
    var dialog = $('#image_clone_dialog',dialogs_context);

    //Put HTML in place

    var html = '<div class="panel">\
          <h3>\
            <small id="create_vnet_header">'+tr("Clone Image")+'</small>\
          </h3>\
        </div>\
        <form>\
<div class="row">\
<div class="clone_one"></div>\
<div class="clone_several">'+tr("Several image are selected, please choose prefix to name the new copies")+':</div>\
<br>\
</div>\
<div class="row">\
  <div class="columns two">\
    <label class="clone_one inline right">'+tr("Name")+':</label>\
    <label class="clone_several inline right">'+tr("Prefix")+':</label>\
  </div>\
  <div class="columns ten">\
    <input type="text" name="name"></input>\
  </div>\
</div>\
<hr>\
<div class="form_buttons row">\
  <button class="button radius right" id="image_clone_button" value="Image.clone">\
'+tr("Clone")+'\
  </button>\
           <button class="close-reveal-modal button secondary radius" type="button" value="close">' + tr("Close") + '</button>\
        </div>\
<a class="close-reveal-modal">&#215;</a>\
</form>\
';

    dialog.html(html);

    //Convert into jQuery
    //dialog.dialog({
    //    autoOpen:false,
    //    width:375,
    //    modal:true,
    //    resizable:false
    //});
    dialog.addClass("reveal-modal");

    //$('button',dialog).button();

    $('form',dialog).submit(function(){
        var name = $('input', this).val();
        var sel_elems = imageElements();
        if (!name || !sel_elems.length)
            notifyError('A name or prefix is needed!');
        if (sel_elems.length > 1){
            for (var i=0; i< sel_elems.length; i++)
                //If we are cloning several images we
                //use the name as prefix
                Sunstone.runAction('Image.clone',
                                   sel_elems[i],
                                   name+getImageName(sel_elems[i]));
        } else {
            Sunstone.runAction('Image.clone',sel_elems[0],name)
        };
        dialog.trigger("reveal:close")
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
        $('input',dialog).val('Copy of ');
    }
    else {
        $('.clone_one',dialog).show();
        $('.clone_several',dialog).hide();
        $('input',dialog).val('Copy of '+getImageName(sel_elems[0]));
    };

    $(dialog).reveal();
}

//The DOM is ready at this point
$(document).ready(function(){
    var tab_name = 'images-tab';

    if (Config.isTabEnabled(tab_name)) {
      dataTable_images = $("#datatable_images",main_tabs_context).dataTable({
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
      setImageAutorefresh();

      initCheckAllBoxes(dataTable_images);
      tableCheckboxesListener(dataTable_images);
      infoListener(dataTable_images,'Image.showinfo');

      $('div#images_tab div.legend_div').hide();
    }
});
