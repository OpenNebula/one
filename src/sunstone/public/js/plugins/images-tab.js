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
      <th>User</th>\
      <th>Name</th>\
      <th>Type</th>\
      <th>Registration time</th>\
      <th>Public</th>\
      <th>Persistent</th>\
      <th>State</th>\
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
						<input type="text" name="img_desc" id="img_desc" />\
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

var images_select = "";
var image_list_json = {};
var dataTable_images;

var image_actions = {
    
    "Image.create" : {
        type: "create",
        call: OpenNebula.Image.create,
        callback: addImageElement,
        error: onError,
        notify: False,
    },
    
    "Image.create_dialog" : {
        type: "custom",
        call: popUpCreateImageDialog
    },
    
    "Image.list" : {
        type: "list",
        call: OpenNebula.Image.list,
        callback: updateImagesView,
        error: onError,
        notify: False
    },
    
    "Image.show" : {
        type : "single",
        call: OpenNebula.Image.show,
        callback: updateImageElement,
        error: onError,
        notify: False
    },
    
    "Image.showinfo" : {
        type: "single",
        call: OpenNebula.Image.show,
        callback: updateImageInfo,
        error: onError,
        notify : False
    },
    
    "Image.refresh" : {
        type: "custom",
        call: function () {
            waitingNodes(dataTable_images);
            Sunstone.runAction("Image.list");
        },
        notify: False
    },
    
    "Image.addattr" : {
        type: "multiple",
        call: OpenNebula.Image.addattr,
        callback: function (req) {
            Sunstone.runAction("Image.show",req.request.data[0]);
        },
        dataTable: function(){return dataTable_images},
        error: onError,
        notify:  False
        },
    
    "Image.addattr_dialog" : {
        type: "custom",
        call: popUpImageAddattrDialog
    },
    
    "Image.rmattr" : {
        type: "multiple",
        call: OpenNebula.Image.rmattr,
        callback: function (req) {
            Sunstone.runAction("Image.show",req.request.data[0]);
        },
        dataTable: function(){return dataTable_images},
        error: onError,
        notify:  False
    },
    
    "Image.rmattr_dialog" : {
        type: "custom"
        call: popUpImageRmattrDialog,
        notify: False
    },
    
    "Image.enable" : {
        type: "multiple",
        call: OpenNebula.Image.enable,
        callback: function (req) {
            Sunstone.runAction("Image.show",req.request.data[0]);
        },
        dataTable: function(){return dataTable_images},
        error: onError,
        notify:  False          
     },
            
     "Image.disable" : {
        type: "multiple",
        call: OpenNebula.Image.disable,
        callback: function (req) {
            Sunstone.runAction("Image.show",req.request.data[0]);
        },
        dataTable: function(){return dataTable_images},
        error: onError,
        notify:  False               
     },
            
     "Image.persistent" : {
        type: "multiple",
        call: OpenNebula.Image.persistent,
        callback: function (req) {
            Sunstone.runAction("Image.show",req.request.data[0]);
        },
        dataTable: function(){return dataTable_images},
        error: onError,
        notify:  False               
     },
            
     "Image.nonpersistent" : {
        type: "multiple",
        call: OpenNebula.Image.nonpersistent,
        callback: function (req) {
            Sunstone.runAction("Image.show",req.request.data[0]);
        },
        dataTable: function(){return dataTable_images},
        error: onError,
        notify:  False           
     },
            
     "Image.publish" : {
        type: "multiple",
        call: OpenNebula.Image.publish,
        callback: function (req) {
            Sunstone.runAction("Image.show",req.request.data[0]);
        },
        dataTable: function(){return dataTable_images},
        error: onError,
        notify:  False                 
     },
            
     "Image.unpublish" : {
        type: "multiple",
        call: OpenNebula.Image.unpublish,
        callback: function (req) {
            Sunstone.runAction("Image.show",req.request.data[0]);
        },
        dataTable: function(){return dataTable_images},
        error: onError,
        notify:  False               
     },
            
     "Image.delete" : {
        type: "multiple",
        call: OpenNebula.Image.delete,
        callback: function (req) {
            Sunstone.runAction("Image.show",req.request.data[0]);
        },
        dataTable: function(){return dataTable_images},
        error: onError,
        notify:  False                
     }
}


var image_buttons = {
    "Image.refresh" : {
        type: "image",
        text: "Refresh list",
        img: "/images/Refresh-icon.png",
        condition: True
    },
    "Image.create_dialog" : {
        type: "create_dialog",
        text: "+ New",
        condition: True
    },
    "Image.addattr_dialog" : {
        type: "action",
        text: "Add attribute",
        condition: True
    },
    "Image.addattr_dialog" : {
        type: "action",
        text: "Update attribute",
        condition: True
    },
    "Image.rmattr_dialog:" : {
        type: "action",
        text: "Remove attribute",
        condition: True
    },
    "action_list" : {
        type: "select",
        condition: True,
        actions: {
            "Image.enable" : {
                type: "action",
                text: "Enable",
                condition: True
            },
            "Image.disable" : {
                type: "action",
                text: "Disable",
                condition: True                
            },
            "Image.publish" : {
                type: "action",
                text: "Publish",
                condition: True                
            },
            "Image.unpublish" : {
                type: "action",
                text: "Unpublish",
                condition: True                
            },
            "Image.persistent" : {
                type: "action",
                text: "Make persistent",
                condition: True                
            },
            "Image.nonpersistent" : {
                type: "action",
                text: "Make non persistent",
                condition: True                
            }
        }
    },
    "Image.delete" : {
        type: "action",
        text: "Delete",
        condition: True
    }
}
