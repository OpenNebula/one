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
    
    "Image.register" : {
        type: "create",
        call: OpenNebula.Image.register,
        callback: addImageElement,
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
    
    "Image.addattr" : {
        type: "multiple",
        call: function(obj){
            var id_attr = obj.data.id;
            var name = $('#img_attr_name').val();
            var value = $('#img_attr_value').val();
            OpenNebula.Image.addattr(
                {data: {
                    id: id_attr,
                    name: name,
                    value: value
                    },
                success: obj.success,
                error: obj.error
            });
        },
        callback : function (req) {
            Sunstone.runAction("Image.show",req.request.data[0]);
        },
        dataTable: function(){return dataTable_images},
        error: onError
    },
    
    "Image.addattr_dialog" : {
        type: "custom",
        call: popUpImageAddattrDialog
    },
    
    "Image.updateattr_dialog" : {
        type: "custom",
        call: popUpImageAddattrDialog
    },
    
    "Image.rmattr" : {
        type: "multiple",
        call: function(obj){
            var id_attr = obj.data.id;
            var name = $('#img_attr_name').val();
            OpenNebula.Image.rmattr(
                {data: {
                    id: id_attr,
                    name: name
                    },
                success: obj.success,
                error: obj.error
            });
        },
        callback: function (req) {
            Sunstone.runAction("Image.show",req.request.data[0]);
        },
        dataTable: function(){return dataTable_images},
        error: onError,
    },
    
    "Image.rmattr_dialog" : {
        type: "custom",
        call: popUpImageRmattrDialog,
    },
    
    "Image.enable" : {
        type: "multiple",
        call: OpenNebula.Image.enable,
        callback: function (req) {
            Sunstone.runAction("Image.show",req.request.data[0]);
        },
        dataTable: function(){return dataTable_images},
        error: onError
     },
            
     "Image.disable" : {
        type: "multiple",
        call: OpenNebula.Image.disable,
        callback: function (req) {
            Sunstone.runAction("Image.show",req.request.data[0]);
        },
        dataTable: function(){return dataTable_images},
        error: onError
     },
            
     "Image.persistent" : {
        type: "multiple",
        call: OpenNebula.Image.persistent,
        callback: function (req) {
            Sunstone.runAction("Image.show",req.request.data[0]);
        },
        dataTable: function(){return dataTable_images},
        error: onError
     },
            
     "Image.nonpersistent" : {
        type: "multiple",
        call: OpenNebula.Image.nonpersistent,
        callback: function (req) {
            Sunstone.runAction("Image.show",req.request.data[0]);
        },
        dataTable: function(){return dataTable_images},
        error: onError           
     },
            
     "Image.publish" : {
        type: "multiple",
        call: OpenNebula.Image.publish,
        callback: function (req) {
            Sunstone.runAction("Image.show",req.request.data[0]);
        },
        dataTable: function(){return dataTable_images},
        error: onError                 
     },
            
     "Image.unpublish" : {
        type: "multiple",
        call: OpenNebula.Image.unpublish,
        callback: function (req) {
            Sunstone.runAction("Image.show",req.request.data[0]);
        },
        dataTable: function(){return dataTable_images},
        error: onError               
     },
            
     "Image.delete" : {
        type: "multiple",
        call: OpenNebula.Image.delete,
        callback: function (req) {
            Sunstone.runAction("Image.show",req.request.data[0]);
        },
        dataTable: function(){return dataTable_images},
        error: onError                
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
    "Image.updateattr_dialog" : {
        type: "action",
        text: "Update attribute",
        condition: True
    },
    "Image.rmattr_dialog" : {
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
    buttons: image_buttons,
    condition: True
}

Sunstone.addActions(image_actions);
Sunstone.addMainTab('images_tab',images_tab);
Sunstone.addInfoPanel('image_info_panel',image_info_panel);

// Returns an array containing the values of the image_json and ready
// to be inserted in the dataTable
function imageElementArray(image_json){
    var image = image_json.IMAGE;
    return [
        '<input type="checkbox" id="image_'+image.ID+'" name="selected_items" value="'+image.ID+'"/>',
        image.ID,
        image.USERNAME ? image.USERNAME : getUserName(image.ID),
        image.NAME,
        OpenNebula.Helper.image_type(image.TYPE),
        pretty_time(image.REGTIME),
        parseInt(image.PUBLIC) ? "yes" : "no",
        parseInt(image.PERSISTENT) ? "yes" : "no",
        OpenNebula.Helper.resource_state("image",image.STATE),
        image.RUNNING_VMS
        ];
}

// Set up the listener on the table TDs to show the info panel
function imageInfoListener(){

    $('#tbodyimages tr').live("click",function(e){
        if ($(e.target).is('input')) {return true;}
        popDialogLoading();
        var aData = dataTable_images.fnGetData(this);
        var id = $(aData[0]).val();
        Sunstone.runAction("Image.showinfo",id);
        return false;
    });
}

//Updates the select input field with an option for each image
function updateImageSelect(image_list){
    images_select="";
    images_select += "<option value=\"\">Select an image</option>";
    $.each(image_list, function(){
        //Only add if the state says the image is usable
        if ((this.IMAGE.STATE < 3) && (this.IMAGE.STATE > 0)){
            images_select += '<option id="img_sel_'+this.IMAGE.ID+'" value="'+this.IMAGE.NAME+'">'+this.IMAGE.NAME+'</option>';
        }
    });

    //update static selectors:
    //in the VM section
    $('div.vm_section#disks select#IMAGE').html(images_select);
}

// Callback to update an element in the dataTable
function updateImageElement(request, image_json){
    var id = image_json.IMAGE.ID;
    var element = imageElementArray(image_json);
    updateSingleElement(element,dataTable_images,'#image_'+id);
    //Update the image select but only if the image is enabled...
    if ((image_json.IMAGE.STATE < 3) && 
        (image_json.IMAGE.STATE > 0) &&
        ($('#img_sel_'+id,images_select).length == 0)){
            images_select += '<option id="img_sel_'+id+'" value="'+image_json.IMAGE.NAME+'">'+image_json.IMAGE.NAME+'</option>';
        }   
    else { //delete the element if it is in the list
        var tag = 'option#img_sel_'+id;
        var select = $('<select>'+images_select+'</select>');
        $(tag,select).remove();
        images_select = $(select).html();
    }
    $('div.vm_section#disks select#IMAGE').html(images_select);
}

// Callback to remove an element from the dataTable
function deleteImageElement(req){
    deleteElement(dataTable_images,'#image_'+req.request.data);
    var tag = 'option#img_sel_'+req.request.data;
    var select = $('<select>'+images_select+'</select>');
    $(tag,select).remove();
    images_select = $(select).html();
    $('div.vm_section#disks select#IMAGE').html(images_select);    
}

// Callback to add an image element
function addImageElement(request, image_json){
    var element = imageElementArray(image_json);
    addElement(element,dataTable_images);
    //NOTE that the select is not updated because newly added images
    //are disabled by default
}

// Callback to refresh the list of images
function updateImagesView(request, images_list){
    image_list_json = images_list;
    var image_list_array = [];
    $.each(image_list_json,function(){
       image_list_array.push(imageElementArray(this));
    });

    updateView(image_list_array,dataTable_images);
    updateImageSelect(images_list);
    updateDashboard("images",image_list_json);

}

// Prepare the dialog to add/remove/update image attributes
function setupImageAttributesDialogs(){
    
    //Append to DOM
    $('div#dialogs').append('<div id="image_attributes_dialog" title="Image attributes"></div>');

    //Put HTML in place
    $('#image_attributes_dialog').html(
        '<form action="javascript:alert(\'js error!\');">\
            <fieldset>\
            <div id="img_attr_action_desc">\
            </div>\
            <div>\
                <label for="img_attr_name">Name:</label>\
                <input type="text" id="img_attr_name" name="img_attr_name" value="" />\
            </div>\
            <div>\
                <label for="img_attr_value">Value:</label>\
               <input type="text" id="img_attr_value" name="img_attr_value" value="" />\
            </div>\
			<div class="form_buttons">\
			  <button class="action_button" id="img_attr_proceed" value="">OK</button>\
			  <button id="img_attr_cancel" value="">Cancel</button>\
			</div>\
            </fieldset>\
        </form>');

    $('#image_attributes_dialog').dialog({
        autoOpen:false,
        width:400,
        modal:true,
        height:220,
        resizable:false,
    });

    $('#image_attributes_dialog button').button();

    //Upcase variable names
    $('#img_attr_name').keyup(function(){
       $(this).val($(this).val().toUpperCase());
    });

    $('#image_attributes_dialog #img_attr_cancel').click(function(){
        $('#image_attributes_dialog').dialog('close');
        return false;
    });

}

// Popup a dialog to add/update an attribute
function popUpImageAddattrDialog(){

        //Show value field and label
        $('#img_attr_value').show();
        $('#img_attr_value').prev().show();
        var desc = "Please write the name and value of the attribute. It will be added or updated in all selected images:";
        $('#img_attr_proceed').val("Image.addattr");
        $('#img_attr_action_desc').html(desc);
        $('#image_attributes_dialog').dialog('open');
        return false;
}

// Popup a dialog to remove an attribute
function popUpImageRmattrDialog(){
    
        //Hide value field and label
        $('#img_attr_value').hide();
        $('#img_attr_value').prev().hide();
        var desc = "Please type the attribute you want to remove:";
        $('#img_attr_proceed').val("Image.rmattr");
        $('#img_attr_action_desc').html(desc);
        $('#image_attributes_dialog').dialog('open');
        return false;
}

// Callback to update the information panel tabs and pop it up
function updateImageInfo(request,img){
    var img_info = img.IMAGE;
    var info_tab = {
        title: "Image information",
        content:        
        '<table id="info_img_table" class="info_table">\
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
        content: '<table id="img_template_table" class="info_table">\
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
     $('div#dialogs').append('<div title="Create Image" id="create_image_dialog"></div>');
     
      //Insert HTML in place
    $('#create_image_dialog').html(create_image_tmpl);

    //Prepare jquery dialog
    $('#create_image_dialog').dialog({
		autoOpen: false,
		modal:true,
		width: 520
	});
    
    $('#img_tabs').tabs();
    $('#create_image_dialog button').button();
    $('#img_type option').first().attr("selected","selected");
    $('#datablock_img').attr("disabled","disabled");

   //Chrome workaround
    $('select#img_type').change(function(){
        $(this).trigger("click");
    });

    $('select#img_type').click(function(){
        var value = $(this).val();
        switch (value){
            case "DATABLOCK":
                $('#datablock_img').removeAttr("disabled");
                break;
            default:
                $('#datablock_img').attr("disabled","disabled");
                $('#path_img').attr("checked","checked");
                $('#img_source,#img_fstype,#img_size').parent().hide();
                $('#img_path').parent().show();
        }
    });

    $('#img_source,#img_fstype,#img_size').parent().hide();
    $('#path_img').attr("checked","checked");
    $('#img_path').parent().addClass("img_man");

    $('#img_public').click(function(){
       $('#img_persistent').removeAttr("checked");
    });

    $('#img_persistent').click(function(){
       $('#img_public').removeAttr("checked");
    });



    $('#src_path_select input').click(function(){
        var value = $(this).val();
        switch (value){
            case "path":
                $('#img_source,#img_fstype,#img_size').parent().hide();
                $('#img_source,#img_fstype,#img_size').parent().removeClass("img_man");
                $('#img_path').parent().show();
                $('#img_path').parent().addClass("img_man");
                break;
            case "source":
                $('#img_path,#img_fstype,#img_size').parent().hide();
                $('#img_path,#img_fstype,#img_size').parent().removeClass("img_man");
                $('#img_source').parent().show();
                 $('#img_source').parent().addClass("img_man");
                break;
            case "datablock":
                $('#img_source,#img_path').parent().hide();
                $('#img_source,#img_path').parent().removeClass("img_man");
                $('#img_fstype,#img_size').parent().show();
                $('#img_fstype,#img_size').parent().addClass("img_man");
                break;
        }
    });


    $('#create_image_form_easy').submit(function(){
        var exit = false;
        $('.img_man',this).each(function(){
           if (!$('input',this).val().length){
               notifyError("There are mandatory missing parameters");
               exit = true;
               return false;
           }
        });
        if (exit) { return false; }
        var img_json = {};

        var name = $('#img_name').val();
        img_json["NAME"] = name;

        var desc = $('#img_desc').val();
        if (desc.length){
            img_json["DESCRIPTION"] = desc;
        }

        var type = $('#img_type').val();
        img_json["TYPE"]= type;

        img_json["PUBLIC"] = $('#img_public:checked').length ? "YES" : "NO";

        img_json["PERSISTENT"] = $('#img_persistent:checked').length ? "YES" : "NO";

        var dev_prefix = $('#img_dev_prefix').val();
        if (dev_prefix.length){
            img_json["DEV_PREFIX"] = dev_prefix;
        }

        var bus = $('#img_bus').val();
        img_json["BUS"] = bus;

        switch ($('#src_path_select input:checked').val()){
            case "path":
                path = $('#img_path').val();
                img_json["PATH"] = path;
                break;
            case "source":
                source = $('#img_source').val();
                img_json["SOURCE"] = source;
                break;
            case "datablock":
                size = $('#img_size').val();
                fstype = $('#img_fstype').val();
                img_json["SIZE"] = size;
                img_json["FSTYPE"] = fstype;
                break;
        }
        var obj = { "image" : img_json };
        Sunstone.runAction("Image.register", obj);

        $('#create_image_dialog').dialog('close');
       return false;
    });

    $('#create_image_form_manual').submit(function(){
		var template=$('#template',this).val();
        Sunstone.runAction("Image.register",template);
		$('#create_image_dialog').dialog('close');
       return false;
    });

}

function popUpCreateImageDialog(){
    $('#create_image_dialog').dialog('open');
}

// Set the autorefresh interval for the datatable
function setImageAutorefresh() {
     setInterval(function(){
		var checked = $('input:checked',dataTable_images.fnGetNodes());
        var filter = $("#datatable_images_filter input").attr("value");
		if (!checked.length && !filter.length){
            Sunstone.runAction("Image.autorefresh");
		}
	},INTERVAL+someTime());
}

//The DOM is ready at this point
$(document).ready(function(){
    
   dataTable_images = $("#datatable_images").dataTable({
        "bJQueryUI": true,
        "bSortClasses": false,
        "bAutoWidth":false,
        "sPaginationType": "full_numbers",
        "aoColumnDefs": [
                        { "bSortable": false, "aTargets": ["check"] },
                        { "sWidth": "60px", "aTargets": [0,3] },
                        { "sWidth": "35px", "aTargets": [1] },
                        { "sWidth": "100px", "aTargets": [2,3] }
                       ]
    });
    
    dataTable_images.fnClearTable();
    addElement([
        spinner,
        '','','','','','','','',''],dataTable_images);
    Sunstone.runAction("Image.list");
    
    setupCreateImageDialog();
    setupImageAttributesDialogs();
    setupTips($('#create_image_dialog'));
    setImageAutorefresh();
    
    initCheckAllBoxes(dataTable_images);
    tableCheckboxesListener(dataTable_images);
    imageInfoListener();
    
})
