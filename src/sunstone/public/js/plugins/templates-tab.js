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

/*Templates tab plugin*/

var templates_tab_content = 
'<form id="template_form" action="" action="javascript:alert(\'js error!\');">\
  <div class="action_blocks">\
  </div>\
<table id="datatable_templates" class="display">\
  <thead>\
    <tr>\
      <th class="check"><input type="checkbox" class="check_all" value="">All</input></th>\
      <th>ID</th>\
      <th>User</th>\
      <th>Name</th>\
      <th>Registration time</th>\
      <th>Public</th>\
    </tr>\
  </thead>\
  <tbody id="tbodytemplates">\
  </tbody>\
</table>\
</form>';

var create_template_tmpl = "";

var templates_select = "";
var template_list_json = {};
var dataTable_templates;

var template_actions = {
    
    "Template.create" : {
        type: "create",
        call: OpenNebula.Template.create,
        callback: addTemplateElement,
        error: onError,
        notify:true
    },
    
    "Template.create_dialog" : {
        type: "custom",
        call: popUpCreateTemplateDialog
    },
    
    "Template.list" : {
        type: "list",
        call: OpenNebula.Template.list,
        callback: updateTemplatesView,
        error: onError
    },
    
    "Template.show" : {
        type : "single",
        call: OpenNebula.Template.show,
        callback: updateTemplateElement,
        error: onError
    },
    
    "Template.showinfo" : {
        type: "single",
        call: OpenNebula.Template.show,
        callback: updateTemplateInfo,
        error: onError
    },
    
    "Template.refresh" : {
        type: "custom",
        call: function () {
            waitingNodes(dataTable_templates);
            Sunstone.runAction("Template.list");
        },
    },
    
    "Template.autorefresh" : {
        type: "custom",
        call: function() {
            OpenNebula.Template.list({timeout: true, success: updateTemplatesView, error: onError});
        }
    },
    
    "Template.addattr" : {
        type: "multiple",
        call: function(obj){
            var id_attr = obj.data.id;
            var name = $('#template_attr_name').val();
            var value = $('#template_attr_value').val();
            OpenNebula.Template.addattr(
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
            Sunstone.runAction("Template.show",req.request.data[0]);
        },
        elements: function() { return getSelectedNodes(dataTable_templates); },
        error: onError,
        notify: true
    },
    
    "Template.addattr_dialog" : {
        type: "custom",
        call: popUpTemplateAddattrDialog
    },
    
    "Template.updateattr_dialog" : {
        type: "custom",
        call: popUpTemplateAddattrDialog
    },
    
    "Template.rmattr" : {
        type: "multiple",
        call: function(obj){
            var id_attr = obj.data.id;
            var name = $('#template_attr_name').val();
            OpenNebula.Template.rmattr(
                {data: {
                    id: id_attr,
                    name: name
                    },
                success: obj.success,
                error: obj.error
            });
        },
        callback: function (req) {
            Sunstone.runAction("Template.show",req.request.data[0]);
        },
        elements: function() { return getSelectedNodes(dataTable_templates); },
        error: onError,
        notify: true
    },
    
    "Template.rmattr_dialog" : {
        type: "custom",
        call: popUpTemplateRmattrDialog,
    },
            
    "Template.publish" : {
        type: "multiple",
        call: OpenNebula.Template.publish,
        callback: function (req) {
            Sunstone.runAction("Template.show",req.request.data[0]);
        },
        elements: function() { return getSelectedNodes(dataTable_templates); },
        error: onError,
        notify: true
     },
            
     "Template.unpublish" : {
        type: "multiple",
        call: OpenNebula.Template.unpublish,
        callback: function (req) {
            Sunstone.runAction("Template.show",req.request.data[0]);
        },
        elements: function() { return getSelectedNodes(dataTable_templates); },
        error: onError,
        notify: true
     },
            
     "Template.delete" : {
        type: "multiple",
        call: OpenNebula.Template.delete,
        callback: deleteTemplateElement,
        elements: function() { return getSelectedNodes(dataTable_templates); },
        error: onError,
        notify: true
     }
}


var template_buttons = {
    "Template.refresh" : {
        type: "image",
        text: "Refresh list",
        img: "/images/Refresh-icon.png",
        condition: True
    },
    "Template.create_dialog" : {
        type: "create_dialog",
        text: "+ New",
        condition: True
    },
    "Template.addattr_dialog" : {
        type: "action",
        text: "Add attribute",
        condition: True
    },
    "Template.updateattr_dialog" : {
        type: "action",
        text: "Update attribute",
        condition: True
    },
    "Template.rmattr_dialog" : {
        type: "action",
        text: "Remove attribute",
        condition: True
    },
    "action_list" : {
        type: "select",
        condition: True,
        actions: {
            "Template.publish" : {
                type: "action",
                text: "Publish",
                condition: True                
            },
            "Template.unpublish" : {
                type: "action",
                text: "Unpublish",
                condition: True                
            },
        }
    },
    "Template.delete" : {
        type: "action",
        text: "Delete",
        condition: True
    }
}

var template_info_panel = {
    "template_info_tab" : {
        title: "Template information",
        content: ""
    }    
}

var templates_tab = {
    title: "Templates",
    content: templates_tab_content,
    buttons: template_buttons,
    condition: True
}

Sunstone.addActions(template_actions);
Sunstone.addMainTab('templates_tab',templates_tab);
Sunstone.addInfoPanel('template_info_panel',template_info_panel);

// Returns an array containing the values of the template_json and ready
// to be inserted in the dataTable
function templateElementArray(template_json){
    var template = template_json.VMTEMPLATE;
    return [
        '<input type="checkbox" id="template_'+template.ID+'" name="selected_items" value="'+template.ID+'"/>',
        template.ID,
        template.USERNAME ? template.USERNAME : getUserName(template.UID),
        template.NAME,
        pretty_time(template.REGTIME),
        parseInt(template.PUBLIC) ? "yes" : "no"
        ];
}

// Set up the listener on the table TDs to show the info panel
function templateInfoListener(){

    $('#tbodytemplates tr').live("click",function(e){
        if ($(e.target).is('input')) {return true;}
        popDialogLoading();
        var aData = dataTable_templates.fnGetData(this);
        var id = $(aData[0]).val();
        Sunstone.runAction("Template.showinfo",id);
        return false;
    });
}

//Updates the select input field with an option for each template
function updateTemplateSelect(){
    templates_select = makeSelectOptions(dataTable_templates,1,3,5,"No");
   
    //update static selectors:
    
}

// Callback to update an element in the dataTable
function updateTemplateElement(request, template_json){
    var id = template_json.VMTEMPLATE.ID;
    var element = templateElementArray(template_json);
    updateSingleElement(element,dataTable_templates,'#template_'+id);
    updateTemplateSelect();
}

// Callback to remove an element from the dataTable
function deleteTemplateElement(req){
    deleteElement(dataTable_templates,'#template_'+req.request.data);
    updateTemplateSelect();
}

// Callback to add a template element
function addTemplateElement(request, template_json){
    var element = templateElementArray(template_json);
    addElement(element,dataTable_templates);
    //NOTE that the select is not updated because newly added templates
    //are not public
}

// Callback to refresh the list of templates
function updateTemplatesView(request, templates_list){
    template_list_json = templates_list;
    var template_list_array = [];
    $.each(template_list_json,function(){
       template_list_array.push(templateElementArray(this));
    });

    updateView(template_list_array,dataTable_templates);
    updateTemplateSelect();
    updateDashboard("templates",template_list_json);

}

// Prepare the dialog to add/remove/update template attributes
function setupTemplateAttributesDialogs(){
    
    //Append to DOM
    $('div#dialogs').append('<div id="template_attributes_dialog" title="Template attributes"></div>');

    //Put HTML in place
    $('#template_attributes_dialog').html(
        '<form action="javascript:alert(\'js error!\');">\
            <fieldset>\
            <div id="template_attr_action_desc">\
            </div>\
            <div>\
                <label for="template_attr_name">Name:</label>\
                <input type="text" id="template_attr_name" name="template_attr_name" value="" />\
            </div>\
            <div>\
                <label for="template_attr_value">Value:</label>\
               <input type="text" id="template_attr_value" name="template_attr_value" value="" />\
            </div>\
			<div class="form_buttons">\
			  <button class="action_button" id="template_attr_proceed" value="">OK</button>\
			  <button id="template_attr_cancel" value="">Cancel</button>\
			</div>\
            </fieldset>\
        </form>');

    $('#template_attributes_dialog').dialog({
        autoOpen:false,
        width:400,
        modal:true,
        height:220,
        resizable:false,
    });

    $('#template_attributes_dialog button').button();

    //Upcase variable names
    $('#template_attr_name').keyup(function(){
       $(this).val($(this).val().toUpperCase());
    });
    
    $('#template_attributes_dialog #template_attr_proceed').click(function(){
        $('#template_attributes_dialog').dialog('close');
    });
    
    $('#template_attributes_dialog #template_attr_cancel').click(function(){
        $('#template_attributes_dialog').dialog('close');
        return false;
    });

}

// Popup a dialog to add/update an attribute
function popUpTemplateAddattrDialog(){

        //Show value field and label
        $('#template_attr_value').show();
        $('#template_attr_value').prev().show();
        var desc = "Please write the name and value of the attribute. It will be added or updated in all selected templates:";
        $('#template_attr_proceed').val("Template.addattr");
        $('#template_attr_action_desc').html(desc);
        $('#template_attributes_dialog').dialog('open');
        return false;
}

// Popup a dialog to remove an attribute
function popUpTemplateRmattrDialog(){
    
        //Hide value field and label
        $('#template_attr_value').hide();
        $('#template_attr_value').prev().hide();
        var desc = "Please type the attribute you want to remove:";
        $('#template_attr_proceed').val("Template.rmattr");
        $('#template_attr_action_desc').html(desc);
        $('#template_attributes_dialog').dialog('open');
        return false;
}

// Callback to update the information panel tabs and pop it up
function updateTemplateInfo(request,template){
    var template_info = template.VMTEMPLATE;
    var info_tab = {
        title: "Template information",
        content:        
        '<table id="info_template_table" class="info_table">\
			<thead>\
				<tr><th colspan="2">Template "'+template_info.NAME+'" information</th></tr>\
			</thead>\
			<tr>\
				<td class="key_td">ID</td>\
				<td class="value_td">'+template_info.ID+'</td>\
			</tr>\
			<tr>\
				<td class="key_td">Name</td>\
				<td class="value_td">'+template_info.NAME+'</td>\
			</tr>\
			<tr>\
				<td class="key_td">Register time</td>\
				<td class="value_td">'+pretty_time(template_info.REGTIME)+'</td>\
			</tr>\
			<tr>\
				<td class="key_td">Public</td>\
				<td class="value_td">'+(parseInt(template_info.PUBLIC) ? "yes" : "no")+'</td>\
			</tr>\
		</table>\
        <table id="template_template_table" class="info_table">\
		<thead><tr><th colspan="2">Template</th></tr></thead>'+
		prettyPrintJSON(template_info.TEMPLATE)+
		'</table>'
    }
    
    
    Sunstone.updateInfoPanelTab("template_info_panel","template_info_tab",info_tab);
        
    Sunstone.popUpInfoPanel("template_info_panel");

}

// Prepare the template creation dialog
function setupCreateTemplateDialog(){
 

}

function popUpCreateTemplateDialog(){
    $('#create_template_dialog').dialog('open');
}

// Set the autorefresh interval for the datatable
function setTemplateAutorefresh() {
     setInterval(function(){
		var checked = $('input:checked',dataTable_templates.fnGetNodes());
        var filter = $("#datatable_templates_filter input").attr("value");
		if (!checked.length && !filter.length){
            Sunstone.runAction("Template.autorefresh");
		}
	},INTERVAL+someTime());
}

//The DOM is ready at this point
$(document).ready(function(){
    
   dataTable_templates = $("#datatable_templates").dataTable({
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
    
    dataTable_templates.fnClearTable();
    addElement([
        spinner,
        '','','','',''],dataTable_templates);
    Sunstone.runAction("Template.list");
    
    setupCreateTemplateDialog();
    setupTemplateAttributesDialogs();
    setTemplateAutorefresh();
    
    initCheckAllBoxes(dataTable_templates);
    tableCheckboxesListener(dataTable_templates);
    templateInfoListener();
    
})
