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

/*Templates tab plugin*/

var templates_tab_content = '\
<h2><i class="icon-file"></i> '+tr("Templates")+'</h2>\
<form id="template_form" action="" action="javascript:alert(\'js error!\');">\
  <div class="action_blocks">\
  </div>\
<table id="datatable_templates" class="display">\
  <thead>\
    <tr>\
      <th class="check"><input type="checkbox" class="check_all" value=""></input></th>\
      <th>'+tr("ID")+'</th>\
      <th>'+tr("Owner")+'</th>\
      <th>'+tr("Group")+'</th>\
      <th>'+tr("Name")+'</th>\
      <th>'+tr("Registration time")+'</th>\
    </tr>\
  </thead>\
  <tbody id="tbodytemplates">\
  </tbody>\
</table>\
<div class="legend_div">\
  <span>?</span>\
  <p class="legend_p">\
'+tr("Clicking `instantiate` will instantly create new Virtual Machines from the selected templates and name one-id. If you want to assign a specific name to a new VM, or launch several instances at once, use Virtual Machines->New button.")+'\
  </p>\
  <p class="legend_p">\
'+tr("You can clone a template to obtain a copy from an existing template. This copy will be owned by you.")+'\
  </p>\
</div>\
</form>';





  
var create_template_tmpl = '<div id="template_create_tabs" class="row">'+
    '<ul class="main tabs vertical">'+
    '</ul>'+
  '</div>'+
  '<br>'+
  '<div class="row">'+
    '<div class="two columns">'+
      '<button class="success large button" id="create_template_form_easy" value="OpenNebula.Template.create">'+tr("Create")+'</button>'+
    '</div>'+
    '<div class="ten columns">'+
      '<button class="large button" id="wizard_next" type="reset" value="reset"  style="float: right">'+tr("Next")+'</button>'+
      '<button class="large button" id="wizard_previous" type="reset" value="reset"  style="float: right">'+tr("Previous")+'</button>'+
    '</div>'+
  '</div>';


var update_template_tmpl =
   '<form action="javascript:alert(\'js error!\');">\
         <h3 style="margin-bottom:10px;">'+tr("Please, choose and modify the template you want to update")+':</h3>\
            <fieldset style="border-top:none;">\
                 <label for="template_template_update_select">'+tr("Select a template")+':</label>\
                 <select id="template_template_update_select" name="template_template_update_select"></select>\
                 <div class="clear"></div>\
                 <div>\
                   <table class="permissions_table" style="padding:0 10px;">\
                     <thead><tr>\
                         <td style="width:130px">'+tr("Permissions")+':</td>\
                         <td style="width:40px;text-align:center;">'+tr("Use")+'</td>\
                         <td style="width:40px;text-align:center;">'+tr("Manage")+'</td>\
                         <td style="width:40px;text-align:center;">'+tr("Admin")+'</td></tr></thead>\
                     <tr>\
                         <td>'+tr("Owner")+'</td>\
                         <td style="text-align:center"><input type="checkbox" name="template_owner_u" class="owner_u" /></td>\
                         <td style="text-align:center"><input type="checkbox" name="template_owner_m" class="owner_m" /></td>\
                         <td style="text-align:center"><input type="checkbox" name="template_owner_a" class="owner_a" /></td>\
                     </tr>\
                     <tr>\
                         <td>'+tr("Group")+'</td>\
                         <td style="text-align:center"><input type="checkbox" name="template_group_u" class="group_u" /></td>\
                         <td style="text-align:center"><input type="checkbox" name="template_group_m" class="group_m" /></td>\
                         <td style="text-align:center"><input type="checkbox" name="template_group_a" class="group_a" /></td>\
                     </tr>\
                     <tr>\
                         <td>'+tr("Other")+'</td>\
                         <td style="text-align:center"><input type="checkbox" name="template_other_u" class="other_u" /></td>\
                         <td style="text-align:center"><input type="checkbox" name="template_other_m" class="other_m" /></td>\
                         <td style="text-align:center"><input type="checkbox" name="template_other_a" class="other_a" /></td>\
                     </tr>\
                   </table>\
                 </div>\
                 <label for="template_template_update_textarea">'+tr("Template")+':</label>\
                 <div class="clear"></div>\
                 <textarea id="template_template_update_textarea" style="width:100%; height:14em;"></textarea>\
            </fieldset>\
            <fieldset>\
                 <div class="form_buttons">\
                    <button class="button" id="template_template_update_button" value="Template.update_template">\
                       '+tr("Update")+'\
                    </button>\
                 </div>\
            </fieldset>\
</form>';

var dataTable_templates;
var $create_template_dialog;

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
        }
    },

    "Template.autorefresh" : {
        type: "custom",
        call: function() {
            OpenNebula.Template.list({timeout: true, success: updateTemplatesView, error: onError});
        }
    },

    "Template.show_to_update" : {
        type: "single",
        call: OpenNebula.Template.show,
        callback: fillTemplatePopUp,
        error: onError
    },

    "Template.update_dialog" : {
        type: "custom",
        call: popUpTemplateTemplateUpdateDialog
    },

    "Template.update" : {
        type: "single",
        call: OpenNebula.Template.update,
        callback: function() {
            notifyMessage(tr("Template updated correctly"));
        },
        error: onError
    },

    "Template.fetch_template" : {
        type: "single",
        call: OpenNebula.Template.fetch_template,
        callback: function (request,response) {
            $('#template_template_update_dialog #template_template_update_textarea').val(response.template);
        },
        error: onError
    },

    "Template.fetch_permissions" : {
        type: "single",
        call: OpenNebula.Template.show,
        callback: function(request,template_json){
            var dialog = $('#template_template_update_dialog form');
            var template = template_json.VMTEMPLATE;
            setPermissionsTable(template,dialog);
        },
        error: onError
    },

    "Template.delete" : {
        type: "multiple",
        call: OpenNebula.Template.del,
        callback: deleteTemplateElement,
        elements: templateElements,
        error: onError,
        notify: true
    },

    "Template.instantiate" : {
        type: "single",
        call: OpenNebula.Template.instantiate,
        error: onError,
        notify: true
    },

     "Template.instantiate_vms" : {
         type: "custom",
         call: function(){
             nodes = getSelectedNodes(dataTable_templates);
             $.each(nodes,function(){
                 Sunstone.runAction("Template.instantiate",this,"");
             });
             Sunstone.runAction("VM.refresh");
         }
     },
    "Template.chown" : {
        type: "multiple",
        call: OpenNebula.Template.chown,
        callback: templateShow,
        elements: templateElements,
        error:onError,
        notify: true
    },
    "Template.chgrp" : {
        type: "multiple",
        call: OpenNebula.Template.chgrp,
        callback:  templateShow,
        elements: templateElements,
        error:onError,
        notify: true
    },
    "Template.chmod" : {
        type: "single",
        call: OpenNebula.Template.chmod,
        error: onError,
        notify: true
    },
    "Template.clone_dialog" : {
        type: "custom",
        call: popUpTemplateCloneDialog
    },
    "Template.clone" : {
        type: "single",
        call: OpenNebula.Template.clone,
        error: onError,
        notify: true
    },
    "Template.help" : {
        type: "custom",
        call: function() {
            hideDialog();
            $('div#templates_tab div.legend_div').slideToggle();
        }
    }
}

var template_buttons = {
    "Template.refresh" : {
        type: "action",
        text: '<i class="icon-refresh icon-large">',
        alwaysActive: true
    },
    "Template.create_dialog" : {
        type: "create_dialog",
        text: tr("+ New")
    },
    "Template.update_dialog" : {
        type: "action",
        text: tr("Update properties"),
        alwaysActive: true
    },
    "Template.instantiate_vms" : {
        type: "action",
        text: tr("Instantiate")
    },
    "Template.chown" : {
        type: "confirm_with_select",
        text: tr("Change owner"),
        select: users_sel,
        tip: tr("Select the new owner")+":",
        condition: mustBeAdmin
    },
    "Template.chgrp" : {
        type: "confirm_with_select",
        text: tr("Change group"),
        select: groups_sel,
        tip: tr("Select the new group")+":",
        condition: mustBeAdmin
    },
    "Template.clone_dialog" : {
        type: "action",
        text: tr("Clone")
    },
    "Template.delete" : {
        type: "confirm",
        text: tr("Delete")
    },

    "Template.help" : {
        type: "action",
        text: '?',
        alwaysActive: true
    }
}

var template_info_panel = {
    "template_info_tab" : {
        title: tr("Template information"),
        content: ""
    }
}

var templates_tab = {
    title: tr("Templates"),
    content: templates_tab_content,
    buttons: template_buttons,
    tabClass: 'subTab',
    parentTab: 'vres_tab'
}

Sunstone.addActions(template_actions);
Sunstone.addMainTab('templates_tab',templates_tab);
Sunstone.addInfoPanel('template_info_panel',template_info_panel);

//Returns selected elements in the template table
function templateElements(){
    return getSelectedNodes(dataTable_templates);
}

//Runs a show action on the template with from a prev request
function templateShow(req){
    Sunstone.runAction("Template.show",req.request.data[0][0]);
}

// Returns an array containing the values of the template_json and ready
// to be inserted in the dataTable
function templateElementArray(template_json){
    var template = template_json.VMTEMPLATE;
    return [
        '<input class="check_item" type="checkbox" id="template_'+template.ID+'" name="selected_items" value="'+template.ID+'"/>',
        template.ID,
        template.UNAME,
        template.GNAME,
        template.NAME,
        pretty_time(template.REGTIME)
    ];
}

//Updates the select input field with an option for each template
function updateTemplateSelect(){
    var templates_select =
        makeSelectOptions(dataTable_templates,
                          1,//id_col
                          4,//name_col
                          [],//status_cols
                          []//bad status values
                         );

    //update static selectors:
    $('#template_id', $create_vm_dialog).html(templates_select);
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
    updateTemplateSelect();
}

// Callback to refresh the list of templates
function updateTemplatesView(request, templates_list){
    var template_list_array = [];

    $.each(templates_list,function(){
       template_list_array.push(templateElementArray(this));
    });

    updateView(template_list_array,dataTable_templates);
    updateTemplateSelect();
    updateVResDashboard("templates",templates_list);
}

// Callback to update the information panel tabs and pop it up
function updateTemplateInfo(request,template){
    var template_info = template.VMTEMPLATE;
    var info_tab = {
        title: tr("Information"),
        content:
        '<table id="info_template_table" class="info_table" style="width:80%">\
           <thead>\
             <tr><th colspan="2">'+tr("Template")+' \"'+template_info.NAME+'\" '+
            tr("information")+'</th></tr>\
           </thead>\
           <tr>\
             <td class="key_td">'+tr("ID")+'</td>\
             <td class="value_td">'+template_info.ID+'</td>\
           </tr>\
           <tr>\
             <td class="key_td">'+tr("Name")+'</td>\
             <td class="value_td">'+template_info.NAME+'</td>\
           </tr>\
           <tr>\
             <td class="key_td">'+tr("Owner")+'</td>\
             <td class="value_td">'+template_info.UNAME+'</td>\
           </tr>\
           <tr>\
             <td class="key_td">'+tr("Group")+'</td>\
             <td class="value_td">'+template_info.GNAME+'</td>\
           </tr>\
           <tr>\
             <td class="key_td">'+tr("Register time")+'</td>\
             <td class="value_td">'+pretty_time(template_info.REGTIME)+'</td>\
           </tr>\
           <tr><td class="key_td">'+tr("Permissions")+'</td><td></td></tr>\
           <tr>\
             <td class="key_td">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'+tr("Owner")+'</td>\
             <td class="value_td" style="font-family:monospace;">'+ownerPermStr(template_info)+'</td>\
           </tr>\
           <tr>\
             <td class="key_td">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'+tr("Group")+'</td>\
             <td class="value_td" style="font-family:monospace;">'+groupPermStr(template_info)+'</td>\
           </tr>\
           <tr>\
             <td class="key_td"> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'+tr("Other")+'</td>\
             <td class="value_td" style="font-family:monospace;">'+otherPermStr(template_info)+'</td>\
           </tr>\
         </table>'
    };
    var template_tab = {
        title: tr("Template"),
        content: '<table id="template_template_table" class="info_table" style="width:80%">\
        <thead><tr><th colspan="2">'+tr("Template")+'</th></tr></thead>'+
        prettyPrintJSON(template_info.TEMPLATE)+
        '</table>'
    };


    Sunstone.updateInfoPanelTab("template_info_panel","template_info_tab",info_tab);
    Sunstone.updateInfoPanelTab("template_info_panel","template_template_tab",template_tab);

    Sunstone.popUpInfoPanel("template_info_panel");
}

// Prepare the template creation dialog
function setupCreateTemplateDialog(){
 //Helper functions for the dialog operations

    //This function checks that all mandatory items within a section
    //have some value. Returns true if so, false if not.
    var mandatory_filter = function(context){
        var man_items = "."+man_class;

        //find enabled mandatory items in this context
        man_items = $(man_items+' input:visible, '+man_items+' select:visible',context);
        var r = true;

        //we fail it the item is enabled and has no value
        $.each(man_items,function(){
            var item = $(this);
            if (item.parents(".vm_param").attr('disabled') ||
                !(item.val().length)) {
                r = false;
                return false;
            };
        });
        return r;
    };

    //Adds an option element to a multiple select box. Before doing so,
    //it checks that the desired filter is passed
    var box_add_element = function(context,box_tag,filter){
        var value="";
        var params= $('.vm_param',context);
        var inputs= $('input:enabled',params);
        var selects = $('select:enabled',params);
        var fields = $.merge(inputs,selects);

        //are fields passing the filter?
        var result = filter();
        if (!result) {
            notifyError(tr("There are mandatory parameters missing in this section"));
            return false;
        }

        value={};

        //With each enabled field we form a JSON object
        var id = null;
        $.each(fields,function(){
            var field = $(this);
            if (!(field.parents(".vm_param").attr('disabled')) &&
                field.val().length){
                //Pick up parents ID if we do not have one
                id = field.attr('id').length ? field.attr('id') : field.parent().attr('id');
                value[id] = field.val();
            };
        });
        var value_string = JSON.stringify(value);
        var option=
            '<option value=\''+value_string+'\'>'+
            stringJSON(value)+
            '</option>';
        $('select'+box_tag,context).append(option);
        return false;
    };

    //Removes selected elements from a multiple select box
    var box_remove_element = function(section_tag,box_tag){
        var context = $(section_tag,dialog);
        $('select'+box_tag+' :selected',context).remove();
        return false;
    };

    //Given the JSON of a VM template (or of a section of it), it crawls
    //the fields of certain section (context) and add their name and
    //values to the template JSON.
    var addSectionJSON = function(template_json,context){
        var params= $('.vm_param',context);
        var inputs= $('input',params);
        var selects = $('select:enabled',params);
        var fields = $.merge(inputs,selects);

        fields.each(function(){
            var field=$(this);
            if (!(field.parents(".vm_param").attr('disabled'))){ //if ! disabled
                if (field.val().length){ //if has a length
                    template_json[field.attr('id')]=field.val();
                };
            };
        });
    };

    // Given a section (context) and a tag for
    // a multiple select in that section, it adds the
    // JSON values to an array parsed as objects.
    // Returns the array
    var addBoxJSON = function(context,box_tag){
        var array = [];
        $('select'+box_tag+' option',context).each(function(){
            array.push( JSON.parse($(this).val()) );
        });
        return array;
    }

    //Given an object, removes those elements which are empty
    //Used to clean up a template JSON before submitting
    //it to opennebula.js
    var removeEmptyObjects = function(obj){
        for (elem in obj){
            var remove = false;
            var value = obj[elem];
            if (value instanceof Array)
            {
                if (value.length == 0)
                    remove = true;
                else if (value.length > 0)
                {
                  value = jQuery.grep(value, function (n) { 
                    var obj_length = 0;
                    for (e in n)
                        obj_length += 1;

                    if (obj_length == 0)
                        return false;

                    return true;
                   });

                  if (value.length == 0)
                    remove = true;
                }
            }
            else if (value instanceof Object)
            {
                var obj_length = 0;
                for (e in value)
                    obj_length += 1;
                if (obj_length == 0)
                    remove = true;
            }
            else
            {
                value = String(value);
                if (value.length == 0)
                    remove = true;
            }
            if (remove)
                delete obj[elem];
        }
        return obj;
    }

    //Toggles the icon when a section is folded/unfolded
    var iconToggle = function(){
        $('.icon_left',$create_template_dialog).click(function(e){
            if ($('span',e.currentTarget).hasClass("ui-icon-plus")){
                $('span',e.currentTarget).removeClass("ui-icon-plus");
                $('span',e.currentTarget).addClass("ui-icon-minus");
            } else {
                $('span',e.currentTarget).removeClass("ui-icon-minus");
                $('span',e.currentTarget).addClass("ui-icon-plus");
            };
        });
    };

    //Fold/unfold all sections button
    var foldUnfoldToggle = function() {
        $('#fold_unfold_vm_params',$create_template_dialog).toggle(
            function(){
                $('.vm_section fieldset',$create_template_dialog).show();
                $('.icon_left span',$create_template_dialog).removeClass("ui-icon-plus");
                $('.icon_left span',$create_template_dialog).addClass("ui-icon-minus");
                return false;
            },
            function(){
                $('.vm_section fieldset',$create_template_dialog).hide();
                //Show capacity opts
                $('.vm_section fieldset',$create_template_dialog).first().show();
                $('.icon_left span',$create_template_dialog).removeClass("ui-icon-minus");
                $('.icon_left span',$create_template_dialog).addClass("ui-icon-plus");
                return false;
            });
    };


    /**************************************************************************
        CAPACITY TAB

    **************************************************************************/

    // Set ups the capacity section
    var add_capacity_tab = function(){
        var html_tab_content = '<div id="capacity_tab" class="wizard_tab">'+
          '<form>'+
            '<div class="row vm_param">'+
                '<div class="two columns">'+
                  '<label class="inline right" for="NAME">'+tr("NAME")+':</label>'+
                '</div>'+
                '<div class="nine columns">'+
                  '<input type="text" id="NAME" name="name"/>'+
                '</div>'+
                '<div class="one columns">'+
                  '<div class="tip">'+tr("Name that the VM will get for description purposes. If NAME is not supplied a name generated by one will be in the form of one-&lt;VID&gt;.")+'</div>'+
                '</div>'+
            '</div>'+
            '<hr>'+
            '<br>'+
            '<div class="row vm_param">'+
                '<div class="two columns">'+
                  '<label class="inline right" for="CPU">'+tr("CPU")+':</label>'+
                '</div>'+
                '<div class="seven columns">'+
                  '<div id="cpu_slider"></div>'+
                '</div>'+
                '<div class="two columns">'+
                  '<input type="text" id="CPU" name="cpu" size="2"/>'+
                '</div>'+
                '<div class="one columns">'+
                  '<div class="tip">'+tr("Percentage of CPU divided by 100 required for the Virtual Machine. Half a processor is written 0.5.")+'</div>'+
                '</div>'+
            '</div>'+ 
            '<div class="row vm_param">'+
                '<div class="two columns">'+
                  '<label class="inline right" for="MEMORY">'+tr("MEMORY")+':</label>'+
                '</div>'+
                '<div class="six columns">'+
                  '<div id="memory_slider"></div>'+
                '</div>'+
                '<div class="two columns">'+
                  '<input type="text" id="MEMORY" name="memory" size="4" />'+
                '</div>'+
                '<div class="one columns">'+
                  '<select id="memory_unit" name="MEMORY_UNIT">'+
                      '<option value="MB">'+tr("MB")+'</option>'+
                      '<option value="GB">'+tr("GB")+'</option>'+
                  '</select>'+
                '</div>'+
                '<div class="one columns">'+
                  '<div class="tip">'+tr("Amount of RAM required for the VM, in Megabytes.")+'</div>'+
                '</div>'+
            '</div>'+      
            '<div class="show_hide" id="advanced_capacity">'+
                 '<h4>'+tr("Advanced options")+'<a id="add_os_boot_opts" class="icon_left" href="#"><span class="ui-icon ui-icon-plus" /></a></h4>'+
            '</div>'+
            '<div class="advanced">'+
              '<div class="row vm_param">'+
                  '<div class="two columns">'+
                    '<label class="inline right" for="VCPU">'+tr("VCPU")+':</label>'+
                  '</div>'+
                  '<div class="seven columns">'+
                    '<div id="vcpu_slider"></div>'+
                  '</div>'+
                  '<div class="two columns">'+
                    '<input type="text" id="VCPU" name="vcpu" size="3" />'+
                  '</div>'+
                  '<div class="one columns">'+
                    '<div class="tip">'+tr("Number of virtual cpus. This value is optional, the default hypervisor behavior is used, usually one virtual CPU.")+'</div>'+
                  '</div>'+
              '</div>'+ 
            '</div>'+
          '</form>'+
        '</div>'

        tabs.append(html_tab_content).tabs('add', '#capacity_tab', 'General'); 

        // Enhace buttons
        $('button',dialog).button();

        // Change tab if the DISKs button is clicked
        //$(".tf_btn_nics", dialog).click(add_nic_tab);
        //$(".tf_btn_nics").live('click', add_nic_tab);

        // Hide advanced options
        $('.advanced',section_capacity).hide();

        $('#advanced_capacity',section_capacity).click(function(){
            $('.advanced',section_capacity).toggle();
            return false;
        });

        // Define memory slider
        var memory_input = $( "#MEMORY", section_capacity );
        var memory_unit  = $( "#memory_unit", section_capacity );
        var memory_slider = $( "#memory_slider", section_capacity ).slider({
            min: 0,
            max: 4096,
            range: "min",
            value: 0,
            step: 128,
            slide: function( event, ui ) {
                memory_input.val(ui.value);
            }
        });
        memory_input.change(function() {
            memory_slider.slider( "value", this.value );
        });
        memory_unit.change(function() {
            var memory_unit_val = $('#memory_unit :selected').val();
            if (memory_unit_val == 'GB') {
                memory_slider.slider( "option", "min", 0 );
                memory_slider.slider( "option", "max", 16 );
                memory_slider.slider( "option", "step", 0.5 );
                memory_slider.slider( "option", "value", 4 );
                memory_input.val(4);
            } 
            else if (memory_unit_val == 'MB') {
                memory_slider.slider( "option", "min", 0 );
                memory_slider.slider( "option", "max", 4096 );
                memory_slider.slider( "option", "step", 128 );
                memory_slider.slider( "option", "value", 512 );
                memory_input.val(512);
            }
            
        });

        // Define cpu slider
        var cpu_input = $( "#CPU", section_capacity );
        var cpu_slider = $( "#cpu_slider", section_capacity ).slider({
            min: 0,
            max: 8,
            range: "min",
            value: 0,
            step: 0.5,
            slide: function( event, ui ) {
                cpu_input.val(ui.value);
            }
        });
        cpu_input.change(function() {
            cpu_slider.slider( "value", this.value );
        });

        // Define vcpu slider
        var vcpu_input = $( "#VCPU", section_capacity );
        var vcpu_slider = $( "#vcpu_slider", section_capacity ).slider({
            min: 0,
            max: 8,
            range: "min",
            value: 0,
            step: 0.5,
            slide: function( event, ui ) {
                vcpu_input.val(ui.value);
            }
        });
        vcpu_input.change(function() {
            vcpu_slider.slider( "value", this.value );
        });
    }

    /**************************************************************************
        DISK TAB

    **************************************************************************/

    var number_of_disks = 0;
    var disks_index     = 0;

    var add_disks_tab = function() {
      var html_tab_content = '<div id="template_create_disks_tabs" class="wizard_tab">'+
          '<ul>'+
              '<button href="#" class="button" type="" value="" id="tf_btn_disks"> + </button>'+
          '</ul>'+
        '</div>';

      tabs.append(html_tab_content).tabs('add', '#template_create_disks_tabs', 'Storage'); 

      var disk_tabs = $( "#template_create_disks_tabs", dialog).tabs({
          tabTemplate: "<li><a href='#{href}'>#{label}</a><span class='ui-icon ui-icon-close'>Remove Tab</span></li>",
          add: function(event, ui) {
              disk_tabs.tabs('select', '#' + ui.panel.id);
          }
      });

      // close icon: removing the tab on click
      $( "#template_create_disks_tabs span.ui-icon-close" ).live( "click", function() {
          var parent = $( this ).parent();
          var index = $( "li", disk_tabs ).index( parent );
          
          $('div#'+$('a', parent).text()).remove();

          disks_index--;
          disk_tabs.tabs( "select", -1);
          
          disk_tabs.tabs( "remove", index );
      });

      add_disk_tab(disk_tabs);

      $("#tf_btn_disks").bind("click", function(){
        add_disk_tab(disk_tabs);
      });
    }

     var add_disk_tab = function(disk_tabs) {
        var str_disk_tab_id  = 'disk' + number_of_disks;
        var str_datatable_id = 'datatable_template_images' + number_of_disks;

        var html_tab_content = '<div id="'+str_disk_tab_id+'" class="disk">'+
            '<div class="row">'+
              '<div class="three columns push-three">'+
                '<input id="'+str_disk_tab_id+'radioImage" type="radio" name="'+str_disk_tab_id+'" value="image" checked> Image '+
              '</div>'+
              '<div class="three columns pull-three">'+
                '<input id="'+str_disk_tab_id+'radioVolatile" type="radio" name="'+str_disk_tab_id+'" value="volatile"> Volatile Disk '+
              '</div>'+
            '</div>'+     
            '<hr>'+    
              '<div id="disk_type" class="vm_param image">'+
                '<div class="vm_param kvm_opt xen_opt vmware_opt">'+
                  '<span id="select_image" class="radius secondary label">'+tr("Please select an image from the list")+'</span>'+
                  '<span id="image_selected" class="radius secondary label hidden">You selected the following image: '+
                  '</span>'+
                  '<span class="radius label" type="text" id="IMAGE" name="image"></span>'+
                  '<input type="hidden" id="IMAGE_ID" name="image_id" size="2"/>'+
                '</div>'+
                '<table id="'+str_datatable_id+'" class="display">'+
                  '<thead>'+
                    '<tr>'+
                      '<th class="check"><input type="checkbox" class="check_all" value=""></input></th>'+
                      '<th>'+tr("ID")+'</th>'+
                      '<th>'+tr("Owner")+'</th>'+
                      '<th>'+tr("Group")+'</th>'+
                      '<th>'+tr("Name")+'</th>'+
                      '<th>'+tr("Datastore")+'</th>'+
                      '<th>'+tr("Size")+'</th>'+
                      '<th>'+tr("Type")+'</th>'+
                      '<th>'+tr("Registration time")+'</th>'+
                      '<th>'+tr("Persistent")+'</th>'+
                      '<th>'+tr("Status")+'</th>'+
                      '<th>'+tr("#VMS")+'</th>'+
                      '<th>'+tr("Target")+'</th>'+
                    '</tr>'+
                  '</thead>'+
                  '<tbody id="tbodyimages">'+
                  '</tbody>'+
                '</table>'+
                '<br>'+
              '<div class="show_hide" id="advanced_image">'+
                '<h4>'+tr("Advanced options")+'<a id="add_os_boot_opts" class="icon_left" href="#"><span class="ui-icon ui-icon-plus" /></a></h4>'+
              '</div>'+
              '<div class="row advanced vm_param">'+
                '<div class="six columns">'+
                  '<div class="row">'+
                    '<div class="four columns">'+
                      '<label class="right inline" for="TARGET">'+tr("TARGET")+':</label>'+
                    '</div>'+
                    '<div class="six columns">'+
                      '<input type="text" id="TARGET" name="target"/>'+
                    '</div>'+
                    '<div class="two columns">'+
                      '<div class="tip">'+tr("Device to map image disk. If set, it will overwrite the default device mapping")+'</div>'+
                    '</div>'+
                  '</div>'+
                '</div>'+
                '<div class="six columns">'+
                  '<div class="row">'+
                    '<div class="four columns">'+
                        '<label class="right inline" for="DRIVER">'+tr("DRIVER")+':</label>'+
                    '</div>'+
                    '<div class="six columns">'+
                        '<input type="text" id="DRIVER" name="driver" />'+
                    '</div>'+
                    '<div class="two columns">'+
                        '<div class="tip">'+tr("Specific image mapping driver. KVM: raw, qcow2. Xen:tap:aio:, file:. VMware unsupported")+'</div>'+
                    '</div>'+
                  '</div>'+
                '</div>'+
              '</div>'+
            '</div>'+
            '<div id="disk_type" class="volatile hidden">'+
              '<br>'+
                '<form>'+
                  '<div class="row vm_param">'+
                    '<div class="six columns">'+
                      '<div class="row">'+
                        '<div class="four columns">'+
                          '<label class="right inline" for="TYPE">'+tr("TYPE")+':</label>'+
                        '</div>'+
                        '<div class="six columns">'+                    
                          '<select id="TYPE" name="type">'+
                            '<option value="fs">'+tr("FS")+'</option>'+
                            '<option value="swap">'+tr("Swap")+'</option>'+
                          '</select>'+
                        '</div>'+
                        '<div class="two columns">'+
                          '<div class="tip">'+tr("Disk type")+'</div>'+
                        '</div>'+
                      '</div>'+
                    '</div>'+
                    '<div class="six columns">'+
                      '<div class="row">'+
                        '<div class="four columns">'+
                          '<label class="right inline" for="FORMAT">'+tr("FORMAT")+':</label>'+
                        '</div>'+
                        '<div class="six columns">'+
                          '<input type="text" id="FORMAT" name="format" />'+
                        '</div>'+
                        '<div class="two columns">'+
                          '<div class="tip">'+tr("Filesystem type for the fs images")+'</div>'+
                        '</div>'+
                      '</div>'+
                    '</div>'+
                  '</div>'+        
                  '<div class="row vm_param">'+
                      '<div class="two columns">'+
                        '<label class="inline right" for="SIZE">'+tr("SIZE")+':</label>'+
                      '</div>'+
                      '<div class="six columns">'+
                        '<div id="size_slider"></div>'+
                      '</div>'+
                      '<div class="two columns">'+
                        '<input type="text" id="SIZE" name="size"/>'+
                      '</div>'+
                      '<div class="one columns">'+
                        '<select id="size_unit" name="SIZE_UNIT">'+
                            '<option value="MB">'+tr("MB")+'</option>'+
                            '<option value="GB">'+tr("GB")+'</option>'+
                        '</select>'+
                      '</div>'+
                      '<div class="one columns">'+
                        '<div class="tip">'+tr("Size of the new disk")+'</div>'+
                      '</div>'+
                  '</div>'+
              '<div class="show_hide" id="advanced_volatile">'+
                '<h4>'+tr("Advanced options")+'<a id="add_os_boot_opts" class="icon_left" href="#"><span class="ui-icon ui-icon-plus" /></a></h4>'+
              '</div>'+
              '<div class="row advanced vm_param">'+
                '<div class="six columns">'+
                  '<div class="row">'+
                    '<div class="four columns">'+
                      '<label class="right inline" for="TARGET">'+tr("TARGET")+':</label>'+
                    '</div>'+
                    '<div class="six columns">'+
                      '<input type="text" id="TARGET" name="target"/>'+
                    '</div>'+
                    '<div class="two columns">'+
                      '<div class="tip">'+tr("Device to map image disk. If set, it will overwrite the default device mapping")+'</div>'+
                    '</div>'+
                  '</div>'+
                '</div>'+
                '<div class="six columns">'+
                  '<div class="row">'+
                    '<div class="four columns">'+
                        '<label class="right inline" for="DRIVER">'+tr("DRIVER")+':</label>'+
                    '</div>'+
                    '<div class="six columns">'+
                        '<input type="text" id="DRIVER" name="driver" />'+
                    '</div>'+
                    '<div class="two columns">'+
                        '<div class="tip">'+tr("Specific image mapping driver. KVM: raw, qcow2. Xen:tap:aio:, file:. VMware unsupported")+'</div>'+
                    '</div>'+
                  '</div>'+
                '</div>'+
                '</form>'+
              '</div>'+
            '</div>'+
          '</div>'

        // Append the new div containing the tab and add the tab to the list
        disk_tabs.append(html_tab_content).tabs('add', '#'+str_disk_tab_id, str_disk_tab_id, disks_index); 
        //disk_tabs.tabs( "select", disks_index);
                
        var disk_section = $('div#' + str_disk_tab_id, dialog);

        // Select Image or Volatile disk. The div is hidden depending on the selection, and the 
        // vm_param class is included to be computed when the template is generated.
        $("input[name='"+str_disk_tab_id+"']", disk_section).change(function(){
          if ($("input[name='"+str_disk_tab_id+"']:checked", disk_section).val() == "image") {
              $("div.image",  disk_section).toggle();
              $("div.image",  disk_section).addClass('vm_param');
              $("div.volatile",  disk_section).hide();
              $("div.volatile",  disk_section).removeClass('vm_param');
          }
          else {
              $("div.image",  disk_section).hide();
              $("div.image",  disk_section).removeClass('vm_param');
              $("div.volatile",  disk_section).toggle();
              $("div.volatile",  disk_section).addClass('vm_param');
          }
        });

          // Define size slider
          var size_input = $( "#SIZE",  disk_section );
          var size_unit  = $( "#size_unit",  disk_section );
          var size_slider = $( "#size_slider",  disk_section ).slider({
              min: 0,
              max: 4096,
              range: "min",
              value: 0,
              step: 128,
              slide: function( event, ui ) {
                  size_input.val(ui.value);
              }
          });
          size_input.change(function() {
              size_slider.slider( "value", this.value );
          });
          size_unit.change(function() {
              var size_unit_val = $('#size_unit :selected').val();
              if (size_unit_val == 'GB') {
                  size_slider.slider( "option", "min", 0 );
                  size_slider.slider( "option", "max", 40 );
                  size_slider.slider( "option", "step", 0.5 );
                  size_slider.slider( "option", "value", 4 );
                  size_input.val(4);
              } 
              else if (size_unit_val == 'MB') {
                  size_slider.slider( "option", "min", 0 );
                  size_slider.slider( "option", "max", 4096 );
                  size_slider.slider( "option", "step", 128 );
                  size_slider.slider( "option", "value", 512 );
                  size_input.val(512);
              }
              
          });

        var dataTable_template_images = $('#'+str_datatable_id, dialog).dataTable({
            "bJQueryUI": true,
            "bSortClasses": false,
            "bAutoWidth":false,
            "iDisplayLength": 4,
            "sDom" : '<"H"fr>t<"F"ip>',
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
                { "bVisible": false, "aTargets": [0,2,3,6,7,9,8,12]}
            ],
            "oLanguage": (datatable_lang != "") ?
                {
                    sUrl: "locale/"+lang+"/"+datatable_lang
                } : ""
        });

        dataTable_template_images.fnClearTable();
        addElement([spinner,'','','','','','','','','','','',''],dataTable_template_images);

        // Retrieve the images to fill the datatable
        OpenNebula.Image.list({
          timeout: true, 
          success: function (request, images_list){
              var image_list_array = [];

              $.each(images_list,function(){
                 image_list_array.push(imageElementArray(this));
              });

              updateView(image_list_array, dataTable_template_images);
          }, 
          error: onError
        });

        // TBD Add refresh button for the datatable

        // When a row is selected the background color is updated. If a previous row
        // was selected (previous_row) the background color is removed.
        // #IMAGE and #IMAGE_ID inputs are updated using the row information
        if (typeof previous_row === 'undefined') {
            var previous_row = 0;
        }
        
        $('#'+str_datatable_id + '  tbody', dialog).delegate("tr", "click", function(e){
            if ($(e.target).is('input') ||
                $(e.target).is('select') ||
                $(e.target).is('option')) return true;

            var aData = dataTable_template_images.fnGetData(this);

            if (previous_row) {
                $("td:first", previous_row).parent().children().each(function(){$(this).removeClass('markrow');});
            }
            else {
                $('#image_selected', disk_section).toggle();
                $('#select_image', disk_section).hide();
            }   

            previous_row = this;
            $("td:first", this).parent().children().each(function(){$(this).addClass('markrow');});
            
            $('#IMAGE', disk_section).text(aData[4]);
            $('#IMAGE_ID', disk_section).val(aData[1]);
            return false;
        });

        // Hide image advanced options
        $('.image .advanced', disk_section).hide();

        $('#advanced_image', disk_section).click(function(){
            $('.image .advanced', disk_section).toggle();
            return false;
        });

        // Hide volatile advanced options
        $('.volatile .advanced', disk_section).hide();

        $('#advanced_volatile', disk_section).click(function(){
            $('.volatile .advanced', disk_section).toggle();
            return false;
        });

        setupTips(disk_section);
        $('button',disk_section).button();

        number_of_disks++;
        disks_index++;
      }

    /**************************************************************************
        NETWORK TAB
        
    **************************************************************************/

    var number_of_nics = 0;
    var nics_index     = 0;

    var add_nics_tab = function() {
      var html_tab_content = '<div id="template_create_nics_tabs" class="wizard_tab">'+
          '<ul>'+
              '<button href="#" class="button" type="" value="" id="tf_btn_nics"> + </button>'+
          '</ul>'+
        '</div>';

      tabs.append(html_tab_content).tabs('add', '#template_create_nics_tabs', 'Network'); 

      var nic_tabs = $( "#template_create_nics_tabs", dialog).tabs({
          tabTemplate: "<li><a href='#{href}'>#{label}</a><span class='ui-icon ui-icon-close'>Remove Tab</span></li>",
          add: function(event, ui) {
              nic_tabs.tabs('select', '#' + ui.panel.id);
          }
      });

      
        nic_tabs.tabs("refresh");

      // close icon: removing the tab on click
      $( "#template_create_nics_tabs span.ui-icon-close" ).live( "click", function() {
          var parent = $( this ).parent();
          var index = $( "li", nic_tabs ).index( parent );
          
          $('div#'+$('a', parent).text()).remove();

          if (nics_index > 0) {
            nics_index--;
          }
          
          nic_tabs.tabs( "select", -1);
          
          nic_tabs.tabs( "remove", index );
      });

      add_nic_tab(nic_tabs);

      $("#tf_btn_nics").bind("click", function(){
        add_nic_tab(nic_tabs);
        nic_tabs.tabs("refresh");
      });
    }

    var add_nic_tab = function(nic_tabs) {
      var str_nic_tab_id  = 'nic' + number_of_nics;
      var str_datatable_id = 'datatable_template_networks' + number_of_nics;

      var html_tab_content = '<div id="'+str_nic_tab_id+'" class="nic">'+
      '<form>'+
      '<fieldset>'+
        '<legend>'+tr("Please select a network from the list")+'</legend>'+
          '<table id="'+str_datatable_id+'" class="display">'+
            '<thead>'+
              '<tr>'+
                '<th class="check"><input type="checkbox" class="check_all" value=""></input></th>'+
                '<th>'+tr("ID")+'</th>'+
                '<th>'+tr("Owner")+'</th>'+
                '<th>'+tr("Group")+'</th>'+
                '<th>'+tr("Name")+'</th>'+
                '<th>'+tr("Cluster")+'</th>'+
                '<th>'+tr("Type")+'</th>'+
                '<th>'+tr("Bridge")+'</th>'+
                '<th>'+tr("Total Leases")+'</th>'+
              '</tr>'+
            '</thead>'+
            '<tbody id="tbodynetworks">'+
            '</tbody>'+
          '</table>'+
          '<div class="vm_param kvm_opt xen_opt vmware_opt">'+
            '<p>You selected the following image: '+
              '<span type="text" id="NETWORK" name="network"></span>'+
              '</p>'+
            '<input type="hidden" id="NETWORK_ID" name="network_id" size="2"/>'+
            '</div>'+
      '</fieldset>'+
          '<div class="show_hide" id="advanced">'+
            '<h4>'+tr("Advanced options")+'<a id="add_os_boot_opts" class="icon_left" href="#"><span class="ui-icon ui-icon-plus" /></a></h4>'+
          '</div>'+
          '<div class="advanced">'+          
          '<div class="row">'+
          '<div class="six columns">'+
            '<fieldset>'+
              '<legend>'+tr("TCP Firewall")+'</legend>'+
              '<div class="row">'+
                '<div class="four columns push-two">'+
                  '<input type="radio" name="tcp_type" id="tcp_type" value="WHITE_PORTS_TCP"> Whitelist '+
                '</div>'+
                '<div class="four columns pull-two">'+
                  '<input type="radio" name="tcp_type" id="tcp_type" value="BLACK_PORTS_TCP"> Blacklist'+
                '</div>'+
              '</div>'+
              '<br>'+
              '<div class="row">'+
                '<div class="four columns">'+
                  '<label class="right inline" for="TCP_PORTS">'+tr("PORTS")+':</label>'+
                '</div>'+
                '<div class="six columns">'+
                    '<input type="text" id="TCP_PORTS" name="ports" />'+
                '</div>'+
                '<div class="two columns">'+
                    '<div class="tip">'+tr("A list of ports separated by commas or a ranges separated by semilocolons, e.g.: 22,80,5900:6000")+'</div>'+
                '</div>'+
              '</div>'+
            '</fieldset>'+
          '</div>'+
          '<div class="six columns">'+
            '<fieldset>'+
              '<legend>'+tr("UDP Firewall")+'</legend>'+
              '<div class="row">'+
                '<div class="four columns push-two">'+
                  '<input type="radio" name="udp_type" id="udp_type" value="WHITE_PORTS_UDP"> Whitelist '+
                '</div>'+
                '<div class="four columns pull-two">'+
                  '<input type="radio" name="udp_type" id="udp_type" value="BLACK_PORTS_UDP"> Blacklist'+
                '</div>'+
              '</div>'+
              '<br>'+
              '<div class="row">'+
                '<div class="four columns">'+
                  '<label class="right inline" for="UDP_PORTS">'+tr("PORTS")+':</label>'+
                '</div>'+
                '<div class="six columns">'+
                    '<input type="text" id="UDP_PORTS" name="ports" />'+
                '</div>'+
                '<div class="two columns">'+
                    '<div class="tip">'+tr("A list of ports separated by commas or a ranges separated by semilocolons, e.g.: 22,80,5900:6000")+'</div>'+
                '</div>'+
              '</div>'+
            '</fieldset>'+
          '</div>'+
          '</div>'+
            '<div class="row">'+
              '<div class="six columns">'+
                '<div class="row">'+
                  '<div class="four columns">'+
                    '<label class="right inline" for="IP">'+tr("IP")+':</label>'+
                  '</div>'+
                  '<div class="six columns">'+
                    '<input type="text" id="IP" name="IP" size="3" />'+
                  '</div>'+
                  '<div class="two columns">'+
                    '<div class="tip">'+tr("Request an specific IP from the Network")+'</div>'+
                  '</div>'+
                '</div>'+
              '</div>'+
              '<div class="six columns">'+
                '<div class="row">'+
                  '<div class="four columns">'+
                      '<label class="right inline" for="MODEL">'+tr("MODEL")+':</label>'+
                  '</div>'+
                  '<div class="six columns">'+
                    '<input type="text" id="MODEL" name="MODEL" />'+
                  '</div>'+
                  '<div class="two columns">'+
                    '<div class="tip">'+tr("Hardware that will emulate this network interface. With Xen this is the type attribute of the vif.")+'</div>'+
                  '</div>'+
                '</div>'+
              '</div>'+
            '</div>'+
            '<div class="row">'+
              '<div class="six columns">'+
                '<div class="row">'+
                  '<div class="four columns">'+
                      '<label class="right inline" for="ICMP">'+tr("ICMP")+':</label>'+
                  '</div>'+
                  '<div class="six columns">'+
                    '<input type="checkbox" name="icmp_type" id="icmp_type" value="ICMP" class="right"> Drop '+
                  '</div>'+
                  '<div class="two columns">'+
                  '</div>'+
                '</div>'+
              '</div>'+
            '</div>'+
          '</div>'+
      '</form>'+
        '</div>'

      // Append the new div containing the tab and add the tab to the list
      nic_tabs.append(html_tab_content).tabs('add', '#'+str_nic_tab_id, str_nic_tab_id, nics_index); 

      // Add delete button for this tab
      $('li.'+str_nic_tab_id).append("<span class='ui-icon ui-icon-close'>Remove Tab</span>");
      
      var dataTable_template_networks = $('#'+str_datatable_id, dialog).dataTable({
        "bJQueryUI": true,
        "bSortClasses": false,
        "bAutoWidth":false,
        "iDisplayLength": 4,
        "sDom" : '<"H"frC>t<"F"ip>',
        "oColVis": {
            "aiExclude": [ 0 ]
        },
        "sPaginationType": "full_numbers",
        "aoColumnDefs": [
            { "bSortable": false, "aTargets": ["check"] },
            { "sWidth": "60px", "aTargets": [0,6,7,8] },
            { "sWidth": "35px", "aTargets": [1] },
            { "sWidth": "100px", "aTargets": [2,3,5] },
            { "bVisible": false, "aTargets": [7]}
        ],
        "oLanguage": (datatable_lang != "") ?
            {
                sUrl: "locale/"+lang+"/"+datatable_lang
            } : ""
      });

      dataTable_template_networks.fnClearTable();
      addElement([spinner,'','','','','','','',''],dataTable_template_networks);

      // Retrieve the networks to fill the datatable
      OpenNebula.Network.list({
        timeout: true, 
        success: function (request, networks_list){
            var network_list_array = [];

            $.each(networks_list,function(){
               network_list_array.push(vNetworkElementArray(this));
            });

            updateView(network_list_array, dataTable_template_networks);
        }, 
        error: onError
      });

      // TBD Add refresh button for the datatable

      // When a row is selected the background color is updated. If a previous row
      // was selected (previous_row) the background color is removed.
      // #IMAGE and #IMAGE_ID inputs are updated using the row information
      if (typeof previous_row === 'undefined') {
          var previous_row = 0;
      }
      
      $('#'+str_datatable_id + '  tbody', dialog).delegate("tr", "click", function(e){
          if ($(e.target).is('input') ||
              $(e.target).is('select') ||
              $(e.target).is('option')) return true;

          var aData = dataTable_template_networks.fnGetData(this);

          if (previous_row)
              $("td:first", previous_row).parent().children().each(function(){$(this).removeClass('markrow');});
          previous_row = this;
          $("td:first", this).parent().children().each(function(){$(this).addClass('markrow');});
          
          $('#NETWORK', $('div#' + str_nic_tab_id)).text(aData[4]);
          $('#NETWORK_ID', $('div#' + str_nic_tab_id)).val(aData[1]);
          return false;
      });


      $('.advanced', $('div#' + str_nic_tab_id)).hide();

      $('#advanced', $('div#' + str_nic_tab_id)).click(function(){
          $('.advanced', $('div#' + str_nic_tab_id)).toggle();
          return false;
      });

      setupTips($('div#' + str_nic_tab_id));

      number_of_nics++;
      nics_index++;
    }


    /**************************************************************************
        OS TAB
        
    **************************************************************************/

    var add_os_tab = function() {
      var html_tab_content = '<div id="os_tab" class="wizard_tab">'+     
      '<form>'+
        '<div class="row vm_param">'+
          '<div class="six columns">'+ 
              '<div class="row">'+
                '<div class="four columns">'+
                  '<label class="right inline" for="ARCH">'+tr("Arch")+':</label>'+
                '</div>'+
                '<div class="six columns">'+
                  '<select id="ARCH" name="arch">'+
                        '<option value="i686">i686</option>'+
                        '<option value="x86_64">x86_64</option>'+
                  '</select>'+
                '</div>'+
                '<div class="two columns">'+
                  '<div class="tip">'+tr("CPU architecture to virtualization")+'</div>'+
                '</div>'+
              '</div>'+
              '<div class="row">'+
                '<div class="four columns">'+
                  '<label class="right inline" for="BOOT">'+tr("Boot")+':</label>'+
                '</div>'+
                '<div class="six columns">'+
                  '<select id="BOOT" name="boot">'+
                    '<option id="no_boot" name="no_boot" value=""></option>'+
                    '<option value="hd">'+tr("HD")+'</option>'+
                    '<option value="fd">'+tr("FD")+'</option>'+
                    '<option value="cdrom">'+tr("CDROM")+'</option>'+
                    '<option value="network">'+tr("NETWORK")+'</option>'+
                  '</select>'+
                '</div>'+
                '<div class="two columns">'+
                  '<div class="tip">'+tr("Boot device type")+'</div>'+
                '</div>'+
              '</div>'+
              '<div class="row">'+
                '<div class="four columns">'+
                  '<label class="right inline" for="ROOT">'+tr("Root")+':</label>'+
                '</div>'+
                '<div class="six columns">'+
                  '<input type="text" id="ROOT" name="root"/>'+
                '</div>'+
                '<div class="two columns">'+
                  '<div class="tip">'+tr("Device to be mounted as root")+'</div>'+
                '</div>'+
              '</div>'+
          '</div>'+
          '<div class="six columns">'+ 
              '<div class="row">'+
                '<div class="four columns">'+
                  '<label class="right inline" for="KERNEL_CMD">'+tr("Kernel cmd")+':</label>'+
                '</div>'+
                '<div class="six columns">'+
                  '<input type="text" id="KERNEL_CMD" name="kernel_cmd" />'+
                '</div>'+
                '<div class="two columns">'+
                  '<div class="tip">'+tr("Arguments for the booting kernel")+'</div>'+
                '</div>'+
              '</div>'+
              '<div class="row">'+
                '<div class="four columns">'+
                  '<label class="right inline" for="BOOTLOADER">'+tr("Bootloader")+':</label>'+
                '</div>'+
                '<div class="six columns">'+
                  '<input type="text" id="BOOTLOADER" name="bootloader" />'+
                '</div>'+
                '<div class="two columns">'+
                  '<div class="tip">'+tr("Path to the bootloader executable")+'</div>'+
                '</div>'+
              '</div>'+
          '</div>'+
        '</div>'+
        '<div class="row">'+
          '<div class="six columns">'+
            '<fieldset>'+
              '<legend>'+tr("Kernel")+'</legend>'+
              '<div class="row">'+
                '<div class="six columns">'+
                  '<input id="radioKernelDs" type="radio" name="kernel_type" value="kernel_ds" checked> Registered Image'+
                '</div>'+
                '<div class="six columns">'+
                  '<input id="radioKernelPath" type="radio" name="kernel_type" value="kernel_path"> Remote PATH'+
                '</div>'+
              '</div>'+
              '<br>'+
              '<div class="row kernel_ds">'+
                '<table id="datatable_kernel" class="display">'+
                  '<thead>'+
                    '<tr>'+
                      '<th class="check"><input type="checkbox" class="check_all" value=""></input></th>'+
                      '<th>'+tr("ID")+'</th>'+
                      '<th>'+tr("Owner")+'</th>'+
                      '<th>'+tr("Group")+'</th>'+
                      '<th>'+tr("Name")+'</th>'+
                      '<th>'+tr("Datastore")+'</th>'+
                      '<th>'+tr("Size")+'</th>'+
                      '<th>'+tr("Type")+'</th>'+
                      '<th>'+tr("Registration time")+'</th>'+
                      '<th>'+tr("Persistent")+'</th>'+
                      '<th>'+tr("Status")+'</th>'+
                      '<th>'+tr("#VMS")+'</th>'+
                      '<th>'+tr("Target")+'</th>'+
                    '</tr>'+
                  '</thead>'+
                  '<tbody id="tbodyimages">'+
                  '</tbody>'+
                '</table>'+
                '<fieldset>'+
                  '<div id="kernel_ds_inputs" class="vm_param kvm_opt xen_opt vmware_opt">'+
                    '<p>You selected the following KERNEL: '+
                      '<span type="text" id="KERNEL" name="kernel"></span>'+
                      '</p>'+
                    '<input type="hidden" id="KERNEL_DS" name="kernel_ds" size="2"/>'+
                    '</div>'+
                '</fieldset>'+
              '</div>'+
            '<div id="kernel_path_inputs" class="kernel_path hidden row">'+
                '<div class="four columns">'+
                  '<label class="right inline" for="KERNEL">'+tr("PATH")+':</label>'+
                '</div>'+
                '<div class="six columns">'+
                  '<input type="text" id="KERNEL" name="kernel" />'+
                '</div>'+
                '<div class="two columns">'+
                  '<div class="tip">'+tr("Path to the OS kernel to boot the image")+'</div>'+
                '</div>'+
              '</div>'+
            '</fieldset>'+
          '</div>'+
          '<div class="six columns">'+
            '<fieldset>'+
              '<legend>'+tr("Ramdisk")+'</legend>'+
              '<div class="row">'+
                '<div class="six columns">'+
                  '<input id="radioInintrdDs" type="radio" name="initrd_type" value="initrd_ds" checked> Registered Image '+
                '</div>'+
                '<div class="six columns">'+
                  '<input id="radioInitrdPath" type="radio" name="initrd_type" value="initrd_path"> Remote PATH'+
                '</div>'+
              '</div>'+
              '<br>'+
              '<div class="row initrd_ds">'+
                '<table id="datatable_initrd" class="display">'+
                  '<thead>'+
                    '<tr>'+
                      '<th class="check"><input type="checkbox" class="check_all" value=""></input></th>'+
                      '<th>'+tr("ID")+'</th>'+
                      '<th>'+tr("Owner")+'</th>'+
                      '<th>'+tr("Group")+'</th>'+
                      '<th>'+tr("Name")+'</th>'+
                      '<th>'+tr("Datastore")+'</th>'+
                      '<th>'+tr("Size")+'</th>'+
                      '<th>'+tr("Type")+'</th>'+
                      '<th>'+tr("Registration time")+'</th>'+
                      '<th>'+tr("Persistent")+'</th>'+
                      '<th>'+tr("Status")+'</th>'+
                      '<th>'+tr("#VMS")+'</th>'+
                      '<th>'+tr("Target")+'</th>'+
                    '</tr>'+
                  '</thead>'+
                  '<tbody id="tbodyimages">'+
                  '</tbody>'+
                '</table>'+
                '<fieldset>'+
                  '<div id="initrd_ds_inputs" class="vm_param kvm_opt xen_opt vmware_opt">'+
                    '<p>You selected the following INITRD: '+
                      '<span type="text" id="INITRD" name="initrd"></span>'+
                      '</p>'+
                    '<input type="hidden" id="INITRD_DS" name="initrd_id" size="2"/>'+
                    '</div>'+
                '</fieldset>'+
              '</div>'+
            '<div id="initrd_path_inputs" class="initrd_path hidden row">'+
                '<div class="four columns">'+
                  '<label class="right inline" for="INITRD">'+tr("PATH")+':</label>'+
                '</div>'+
                '<div class="six columns">'+
                  '<input type="text" id="INITRD" name="initrd"/>'+
                '</div>'+
                '<div class="two columns">'+
                  '<div class="tip">'+tr("Path to the initrd image")+'</div>'+
                '</div>'+
              '</div>'+
            '</fieldset>'+
          '</div>'+  
        '</div>'+
      '</form>'+
        '</div>'

      // Append the new div containing the tab and add the tab to the list
      tabs.append(html_tab_content).tabs('add', '#os_tab', 'OS Booting'); 
      $( "#template_create_tabs a[href='#os_tab']").parent().remove("span")

        // Select Image or Volatile disk. The div is hidden depending on the selection, and the 
        // vm_param class is included to be computed when the template is generated.
        $("input[name='kernel_type']").change(function(){
          if ($("input[name='kernel_type']:checked").val() == "kernel_ds") {
              $("div.kernel_ds",  $('div#os_tab')).toggle();
              $("div#kernel_ds_inputs",  $('div#os_tab')).addClass('vm_param');
              $("div.kernel_path",  $('div#os_tab')).hide();
              $("div#kernel_path_inputs",  $('div#os_tab')).removeClass('vm_param');
          }
          else {
              $("div.kernel_ds",  $('div#os_tab')).hide();
              $("div#kernel_ds_inputs",  $('div#os_tab')).removeClass('vm_param');
              $("div.kernel_path",  $('div#os_tab')).toggle();
              $("div#kernel_path_inputs",  $('div#os_tab')).addClass('vm_param');
          }
        });

        $("input[name='initrd_type']").change(function(){
          if ($("input[name='initrd_type']:checked").val() == "initrd_ds") {
              $("div.initrd_ds",  $('div#os_tab')).toggle();
              $("div#initrd_ds_inputs",  $('div#os_tab')).addClass('vm_param');
              $("div.initrd_path",  $('div#os_tab')).hide();
              $("div#initrd_path_inputs",  $('div#os_tab')).removeClass('vm_param');
          }
          else {
              $("div.initrd_ds",  $('div#os_tab')).hide();
              $("div#initrd_ds_inputs",  $('div#os_tab')).removeClass('vm_param');
              $("div.initrd_path",  $('div#os_tab')).toggle();
              $("div#initrd_path_inputs",  $('div#os_tab')).addClass('vm_param');
          }
        });

        var dataTable_template_kernel = $('#datatable_kernel', dialog).dataTable({
            "bJQueryUI": true,
            "bSortClasses": false,
            "bAutoWidth":false,
            "sDom" : '<"H"fr>t<"F"p>',
            "iDisplayLength": 4,
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
                { "bVisible": false, "aTargets": [0,3,2,5,6,7,9,8,11,12,10]}
            ],
            "oLanguage": (datatable_lang != "") ?
                {
                    sUrl: "locale/"+lang+"/"+datatable_lang
                } : ""
        });

        dataTable_template_kernel.fnClearTable();
        addElement([spinner,'','','','','','','','','','','',''],dataTable_template_kernel);

        // Retrieve the images to fill the datatable
        OpenNebula.Image.list({
          timeout: true, 
          success: function (request, images_list){
              var image_list_array = [];

              $.each(images_list,function(){
                 image_list_array.push(imageElementArray(this));
              });

              updateView(image_list_array, dataTable_template_kernel);
              dataTable_template_kernel.fnFilter("KERNEL", 6)
          }, 
          error: onError
        });

        // TBD Add refresh button for the datatable

        // When a row is selected the background color is updated. If a previous row
        // was selected (previous_row) the background color is removed.
        // #IMAGE and #IMAGE_ID inputs are updated using the row information
        if (typeof previous_kernel_row === 'undefined') {
            var previous_kernel_row = 0;
        }
        
        $('#datatable_kernel tbody', dialog).delegate("tr", "click", function(e){
            if ($(e.target).is('input') ||
                $(e.target).is('select') ||
                $(e.target).is('option')) return true;

            var aData = dataTable_template_kernel.fnGetData(this);

            if (previous_kernel_row)
                $("td:first", previous_kernel_row).parent().children().each(function(){$(this).removeClass('markrow');});
            previous_kernel_row = this;
            $("td:first", this).parent().children().each(function(){$(this).addClass('markrow');});
            
            $('#KERNEL', $('div#os_tab')).text(aData[4]);
            $('#KERNEL_DS', $('div#os_tab')).val("$FILE[IMAGE_ID="+ aData[1] +"]");
            return false;
        });



          var datTable_template_initrd = $('#datatable_initrd', dialog).dataTable({
            "bJQueryUI": true,
            "bSortClasses": false,
            "bAutoWidth":false,
            "iDisplayLength": 4,
            "sDom" : '<"H"fr>t<"F"p>',
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
                { "bVisible": false, "aTargets": [0,2,3,5,6,7,9,8,10,11,12]}
            ],
            "oLanguage": (datatable_lang != "") ?
                {
                    sUrl: "locale/"+lang+"/"+datatable_lang
                } : ""
        });

        datTable_template_initrd.fnClearTable();
        addElement([spinner,'','','','','','','','','','','',''],datTable_template_initrd);

        // Retrieve the images to fill the datatable
        OpenNebula.Image.list({
          timeout: true, 
          success: function (request, images_list){
              var image_list_array = [];

              $.each(images_list,function(){
                 image_list_array.push(imageElementArray(this));
              });

              updateView(image_list_array, datTable_template_initrd);
              datTable_template_initrd.fnFilter("RAMDISK", 6)
          }, 
          error: onError
        });


        // TBD Add refresh button for the datatable

        // When a row is selected the background color is updated. If a previous row
        // was selected (previous_row) the background color is removed.
        // #IMAGE and #IMAGE_ID inputs are updated using the row information
        if (typeof previous_initrd_row === 'undefined') {
            var previous_initrd_row = 0;
        }
        
        $('#datatable_initrd tbody', dialog).delegate("tr", "click", function(e){
            if ($(e.target).is('input') ||
                $(e.target).is('select') ||
                $(e.target).is('option')) return true;

            var aData = datTable_template_initrd.fnGetData(this);

            if (previous_initrd_row)
                $("td:first", previous_initrd_row).parent().children().each(function(){$(this).removeClass('markrow');});
            previous_initrd_row = this;
            $("td:first", this).parent().children().each(function(){$(this).addClass('markrow');});
            
            $('#INITRD', $('div#os_tab')).text(aData[4]);
            $('#INITRD_DS', $('div#os_tab')).val("$FILE[IMAGE_ID="+ aData[1] +"]");
            return false;
        });

        // Hide image advanced options
        $('fieldset.advanced', $('div#advanced_os')).hide();

        $('#advanced_os', dialog).click(function(){
            $('fieldset.advanced', $('div##advanced_os')).toggle();
            return false;
        });

      setupTips($('div#os_tab'));
    }


    /**************************************************************************
        INPUT/OUTPUT TAB
        
    **************************************************************************/

    var add_io_tab = function() {
      var html_tab_content = '<div id="io_tab" class="wizard_tab">'+
        '<form>'+
          '<div class="row">'+
          '<div class="six columns graphics">'+
            '<fieldset>'+
              '<legend>'+tr("Graphics")+'</legend>'+
              '<div class="row">'+
                '<div class="eight columns push-two">'+
                    '<input type="radio" name="graphics_type" ID="radioVncType" value="VNC"> VNC '+
                    '<input type="radio" name="graphics_type" ID="radioSdlType" value="SDL"> SDL'+
                    '<input type="radio" name="graphics_type" ID="radioSpiceType" value="SPICE"> SPICE'+
                '</div>'+
              '</div>'+
              '<hr>'+
              '<div class="row vm_param">'+
                '<input type="hidden" name="graphics_type" ID="TYPE">'+
                '<div class="four columns">'+
                  '<label class="right inline" for="LISTEN">'+tr("Listen IP")+':</label>'+
                '</div>'+
                '<div class="six columns">'+
                  '<input type="text" id="LISTEN" name="graphics_ip" />'+
                '</div>'+
                '<div class="two columns">'+
                  '<div class="tip">'+tr("IP to listen on")+'</div>'+
                '</div>'+
              '</div>'+
              '<div class="row vm_param">'+
                '<div class="four columns">'+
                  '<label class="right inline" for="PORT">'+tr("Port")+':</label>'+
                '</div>'+
                '<div class="six columns">'+
                  '<input type="text" id="PORT" name="port" />'+
                '</div>'+
                '<div class="two columns">'+
                  '<div class="tip">'+tr("Port for the VNC/SPICE server")+'</div>'+
                '</div>'+
              '</div>'+
              '<div class="row vm_param">'+
                '<div class="four columns">'+
                  '<label class="right inline" for="PASSWD">'+tr("Password")+':</label>'+
                '</div>'+
                '<div class="six columns">'+
                  '<input type="text" id="PASSWD" name="graphics_pw" />'+
                '</div>'+
                '<div class="two columns">'+
                  '<div class="tip">'+tr("Password for the VNC/SPICE server")+'</div>'+
                '</div>'+
              '</div>'+
              '<div class="row vm_param">'+
                '<div class="four columns">'+
                  '<label class="right inline" for="KEYMAP">'+tr("Keymap")+'</label>'+
                '</div>'+
                '<div class="six columns">'+
                  '<input type="text" id="KEYMAP" name="keymap" />'+
                '</div>'+
                '<div class="two columns">'+
                  '<div class="tip">'+tr("Keyboard configuration locale to use in the VNC/SPICE display")+'</div>'+
                '</div>'+
              '</div>'+
            '</fieldset>'+
          '</div>'+
          '<div class="six columns inputs">'+
            '<fieldset>'+
              '<legend>'+tr("Inputs")+'</legend>'+
              '<div class="row">'+
                '<div class="four columns">'+
                  '<select id="TYPE" name="input_type">'+
                        '<option value="mouse">'+tr("Mouse")+'</option>'+
                        '<option value="tablet">'+tr("Tablet")+'</option>'+
                  '</select>'+
                '</div>'+
                '<div class="four columns">'+
                  '<select id="BUS" name="input_bus">'+
                      '<option value="usb">'+tr("USB")+'</option>'+
                      '<option value="ps2">'+tr("PS2")+'</option>'+
                      '<option value="xen">'+tr("XEN")+'</option>'+
                  '</select>'+
                '</div>'+
                '<div class="three columns">'+
                    '<button href="#" id="add_input" action="" onclick="return false">'+tr("Add")+'</button>'+
                '</div>'+
              '</div>'+
              '<hr>'+
              '<div class="row">'+
              '<table id="input_table" class="table display">'+
                 '<thead>'+
                   '<tr>'+
                     '<th>'+tr("TYPE")+'</th>'+
                     '<th>'+tr("BUS")+'</th>'+
                     '<th></th>'+
                   '</tr>'+
                 '</thead>'+
                 '<tbody id="tbodyinput">'+
                   '<tr>'+
                   '</tr>'+
                   '<tr>'+
                   '</tr>'+
                 '</tbody>'+
              '</table>'+
              '<br>'+
              '</div>'+
            '</fieldset>'+
          '</div>'+
          '</div>'+
        '</form>'+
      '</div>'

      // Append the new div containing the tab and add the tab to the list
      tabs.append(html_tab_content).tabs('add', '#io_tab', 'Input/Output'); 

      $("input[name='graphics_type']").change(function(){
        console.log(this)
        $("#TYPE", $('div#io_tab .graphics')).val($(this).attr("value"))
        $("#LISTEN", $('div#io_tab')).val("0.0.0.0")
      });

      $('#add_input', $('div#io_tab')).click(function() {
          var table = $('#input_table', $('div#io_tab'))[0];
          console.log(table)
          var rowCount = table.rows.length;
          var row = table.insertRow(-1);
          $(row).addClass("vm_param");

          var cell1 = row.insertCell(0);
          var element1 = document.createElement("input");
          element1.id = "TYPE"
          element1.type = "text";
          element1.value = $('select#TYPE', $('div#io_tab')).val()
          cell1.appendChild(element1);

          var cell2 = row.insertCell(1);
          var element2 = document.createElement("input");
          element2.id = "BUS"
          element2.type = "text";
          element2.value = $('select#BUS', $('div#io_tab')).val()
          cell2.appendChild(element2);


          var cell3 = row.insertCell(2);
          cell3.innerHTML = "<span class='ui-icon ui-icon-close'>Remove Tab</span>";
      });

      $( "#io_tab span.ui-icon-close" ).live( "click", function() {
          $(this).closest("tr").remove()
      });


      setupTips($('div#io_tab'));
    }

    /**************************************************************************
        CONTEXT TAB
        
    **************************************************************************/

    var add_context_tab = function() {
      var html_tab_content = '<div id="context_tab" class="wizard_tab">'+
        '<form>'+
          '<div class="row">'+
            '<div class="six columns">'+
                '<fieldset>'+
                  '<legend>'+tr("SSH")+'</legend>'+
                  '<div class="row">'+
                    '<input type="checkbox" name="ssh_context" id="ssh_context">'+ tr("Add SSH contextualization")+
                  '</div>'+
                  '<br>'+
                  '<div class="row">'+
                    '<div class="four columns">'+
                      '<label class="right inline" for="ssh_puclic_key">'+tr("Public Key")+':</label>'+
                    '</div>'+
                    '<div class="six columns">'+
                      '<input type="text" id="ssh_puclic_key" name="ssh_puclic_key" />'+
                    '</div>'+
                    '<div class="two columns">'+
                    '</div>'+
                  '</div>'+
                '</fieldset>'+
                '<fieldset>'+
                    '<legend>'+tr("Network")+'</legend>'+
                  '<div class="row">'+
                    '<input type="checkbox" name="network_context" id="network_context">'+ tr("Add Network contextualization")+
                  '</div>'+
                  '<br>'+
                '</fieldset>'+
            '</div>'+
            '<div class="six columns">'+
              '<fieldset>'+
                '<legend>'+tr("Context Files")+'</legend>'+
                '<div class="row">'+
                  '<table id="datatable_context" class="display">'+
                    '<thead>'+
                      '<tr>'+
                        '<th class="check"><input type="checkbox" class="check_all" value=""></input></th>'+
                        '<th>'+tr("ID")+'</th>'+
                        '<th>'+tr("Owner")+'</th>'+
                        '<th>'+tr("Group")+'</th>'+
                        '<th>'+tr("Name")+'</th>'+
                        '<th>'+tr("Datastore")+'</th>'+
                        '<th>'+tr("Size")+'</th>'+
                        '<th>'+tr("Type")+'</th>'+
                        '<th>'+tr("Registration time")+'</th>'+
                        '<th>'+tr("Persistent")+'</th>'+
                        '<th>'+tr("Status")+'</th>'+
                        '<th>'+tr("#VMS")+'</th>'+
                        '<th>'+tr("Target")+'</th>'+
                      '</tr>'+
                    '</thead>'+
                    '<tbody id="tbodyimages">'+
                    '</tbody>'+
                  '</table>'+
                    '<div id="files_ds_inputs" class="vm_param kvm_opt xen_opt vmware_opt">'+
                      '<div id="selected_files_template"></div>'+
                      '<input type="hidden" id="FILES_DS" name="context_files" size="2"/>'+
                      '</div>'+
                '</div>'+
              '</fieldset>'+
            '</div>'+  
          '</div>'+  
          '<div class="row">'+
            '<fieldset>'+
              '<legend>'+tr("Custom CONTEXT")+'</legend>'+
              '<div class="row">'+
                '<div class="three columns">'+
                  '<input type="text" id="KEY" name="key" />'+
                '</div>'+
                '<div class="seven columns">'+
                  '<input type="text" id="VALUE" name="value" />'+
                '</div>'+
                '<div class="two columns">'+
                    '<button id="add_context" class="push-four six" class="kvm_opt" onclick="return false">'+tr("Add")+'</button>'+
                '</div>'+
              '</div>'+
              '<hr>'+
              '<div class="row">'+
              '<table id="context_table" class="table display">'+
                 '<thead>'+
                   '<tr>'+
                     '<th>'+tr("KEY")+'</th>'+
                     '<th>'+tr("VALUE")+'</th>'+
                     '<th></th>'+
                   '</tr>'+
                 '</thead>'+
                 '<tbody id="tbodyinput">'+
                   '<tr>'+
                   '</tr>'+
                   '<tr>'+
                   '</tr>'+
                 '</tbody>'+
              '</table>'+
              '<br>'+
              '</div>'+
            '</fieldset>'+
          '</div>'+
        '</form>'+
      '</div>'

      // Append the new div containing the tab and add the tab to the list
      tabs.append(html_tab_content).tabs('add', '#context_tab', 'Context'); 

      $('#add_context', $('div#context_tab')).click(function() {
          var table = $('#context_table', $('div#context_tab'))[0];
          var rowCount = table.rows.length;
          var row = table.insertRow(rowCount);

          var cell1 = row.insertCell(0);
          var element1 = document.createElement("input");
          element1.id = "KEY";
          element1.type = "text";
          element1.value = $('input#KEY', $('div#context_tab')).val()
          cell1.appendChild(element1);

          var cell2 = row.insertCell(1);
          var element2 = document.createElement("input");
          element2.id = "VALUE";
          element2.type = "text";
          element2.value = $('input#VALUE', $('div#context_tab')).val()
          cell2.appendChild(element2);


          var cell3 = row.insertCell(2);
          cell3.innerHTML = "<span class='ui-icon ui-icon-close'>Remove Tab</span>";
      });

      $( "#context_tab span.ui-icon-close" ).live( "click", function() {
          $(this).closest("tr").remove()
      });


      var datTable_template_context = $('#datatable_context', dialog).dataTable({
          "bJQueryUI": true,
          "bSortClasses": false,
          "bAutoWidth":false,
          "iDisplayLength": 4,
          "sDom" : '<"H"fr>t<"F"p>',
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
              { "bVisible": false, "aTargets": [0,2,3,5,6,7,9,8,10,11,12]}
          ],
          "oLanguage": (datatable_lang != "") ?
              {
                  sUrl: "locale/"+lang+"/"+datatable_lang
              } : ""
      });   

      datTable_template_context.fnClearTable();
      addElement([spinner,'','','','','','','','','','','',''],datTable_template_context);   

      // Retrieve the images to fill the datatable
      OpenNebula.Image.list({
      timeout: true, 
      success: function (request, images_list){
          var image_list_array = [];    
          $.each(images_list,function(){
              image_list_array.push(imageElementArray(this));
          });   
          console.log(image_list_array);
          updateView(image_list_array, datTable_template_context);
          datTable_template_context.fnFilter("CONTEXT", 7)
      }, 
      error: onError
      });   

      // TBD More than one file
      
      // TBD Add refresh button for the datatable   
      // When a row is selected the background color is updated. If a previous row
      // was selected (previous_row) the background color is removed.
      // #IMAGE and #IMAGE_ID inputs are updated using the row information
      if (typeof previous_context_row === 'undefined') {
          var previous_context_row = 0;
      }         

      var selected_files = {};
      var file_row_hash = {};

      $('#datatable_context tbody', dialog).delegate("tr", "click", function(e){
          if ($(e.target).is('input') ||
              $(e.target).is('select') ||
              $(e.target).is('option')) return true;

          var aData   = datTable_template_context.fnGetData(this);
          var file_id = aData[1];

          if(!$("td:first", this).hasClass('markrow'))
          {
            selected_files[file_id]=1;
            file_row_hash[file_id]=this;
            console.log("asdfasdfasdf")
            console.log(aData)
            $(this).children().each(function(){$(this).addClass('markrow');});
            $('div#selected_files_template', dialog).append('<span id="tag_file_'+aData[1]+'"><span class="ui-icon ui-icon-close"></span>'+aData[4]+'</span>');
          }
          else
          {
            delete selected_files[file_id];
            $(this).children().each(function(){$(this).removeClass('markrow');});
            $('div#selected_files_template span#tag_file_'+file_id, dialog).remove();
          }

          generate_context_files();

          return false;
      });

      $( "#selected_files_template span.ui-icon-close" ).live( "click", function() {
         $(this).parent().remove();
         var id = $(this).parent().attr("ID");

         var file_id=id.substring(9,id.length);
         delete selected_files[file_id];
         $(file_row_hash[file_id]).children().each(function(){$(this).removeClass('markrow');});

         generate_context_files();
      });

      var generate_context_files = function() {
        var req_string=[];

        $.each(selected_files, function(key, value) { 
          req_string.push("$FILE[IMAGE_ID="+ key +"]");
        });


        $('#FILES_DS', dialog).val(req_string.join(" "));
      };
    }


    /**************************************************************************
        PLACEMENT TAB
        
    **************************************************************************/

    var add_placement_tab = function() {
      var html_tab_content = '<div id="placement_tab" class="wizard_tab">'+
      '<form>'+
       '<div class="requirements">'+
          '<fieldset>'+
            '<legend>'+tr("REQUIREMENTS")+'</legend>'+
            '<div class="row">'+
              '<div class="three columns push-three">'+
                '<input type="radio" id="hosts_req" name="req_select" value="host_select" checked> Select Hosts '+
              '</div>'+
              '<div class="three columns pull-three">'+
                '<input type="radio" id="clusters_req"  name="req_select" value="cluster_select"> Select Clusters '+
              '</div>'+
            '</div>'+    
            '<hr>'+     
          '<div id="req_type" class="host_select row">'+
              '<table id="datatable_template_hosts" class="display">'+
                '<thead>'+
                  '<tr>'+
                    '<th class="check"><input type="checkbox" class="check_all" value=""></input></th>'+
                    '<th>' + tr("ID") + '</th>'+
                    '<th>' + tr("Name") + '</th>'+
                    '<th>' + tr("Cluster") + '</th>'+
                    '<th>' + tr("Running VMs") + '</th>'+
                    '<th>' + tr("Real CPU") + '</th>'+
                    '<th>' + tr("Allocated CPU") + '</th>'+
                    '<th>' + tr("Real MEM") + '</th>'+
                    '<th>' + tr("Allocated MEM") + '</th>'+
                    '<th>' + tr("Status") + '</th>'+
                    '<th>' + tr("IM MAD") + '</th>'+
                    '<th>' + tr("VM MAD") + '</th>'+
                    '<th>' + tr("Last monitored on") + '</th>'+
                  '</tr>'+
                '</thead>'+
                '<tbody id="tbodyhosts">'+
                '</tbody>'+
              '</table>'+
              '<div id="selected_hosts_template"></div>'+
              '<br>'+
            '</div>'+
          '<div id="req_type" class="cluster_select hidden row">'+
              '<table id="datatable_template_clusters" class="display">'+
                '<thead>'+
                  '<tr>'+
                    '<th class="check"><input type="checkbox" class="check_all" value=""></input></th>'+
                    '<th>' + tr("ID") + '</th>'+
                    '<th>' + tr("Name") + '</th>'+
                    '<th>' + tr("Hosts") + '</th>'+
                    '<th>' + tr("Virtual Networks") + '</th>'+
                    '<th>' + tr("Datastores") + '</th>'+
                  '</tr>'+
                '</thead>'+
                '<tbody id="tbodyclusters">'+
                '</tbody>'+
              '</table>'+
              '<div id="selected_clusters_template"></div>'+
              '<br>'+
          '</div>'+
          '<div class="row vm_param">'+
            '<div class="two columns">'+
              '<label class="inline right" for="REQUIREMENTS">'+tr("Requirements")+':</label>'+
            '</div>'+
            '<div class="nine columns">'+
              '<input type="text" id="REQUIREMENTS" name="requirements" />'+
            '</div>'+
            '<div class="one columns">'+
              '<div class="tip"></div>'+
            '</div>'+
          '</div>'+
        '</fieldset>'+
        '<fieldset>'+
          '<legend>'+tr("Scheduling policy")+'</legend>'+
            '<div class="row">'+
              '<div class="four columns ">'+
                '<input type="radio" id="packingRadio" name="rank_select" value="RUNNING_VMS"> PACKING '+
                '<div class="tip">'+tr("Pack the VMs in the cluster nodes to reduce VM fragmentation")+'</div>'+
              '</div>'+
              '<div class="four columns ">'+
                '<input type="radio"  id="stripingRadio" name="rank_select" value="-RUNNING_VMS"> STRIPING '+
                '<div class="tip">'+tr("Spread the VMs in the cluster nodes")+'</div>'+
              '</div>'+
              '<div class="four columns ">'+
                '<input type="radio"  id="loadawareRadio" name="rank_select" value="FREECPU"> LOAD-AWARE'+
                '<div class="tip">'+tr("Maximize the resources available to VMs in a node")+'</div>'+
              '</div>'+
            '</div>'+  
            '<hr>'+
          '<div class="row vm_param">'+
            '<div class="two columns">'+
              '<label class="inline right" for="RANK">'+tr("Rank")+':</label>'+
            '</div>'+
            '<div class="nine columns">'+
              '<input type="text" id="RANK" name="RANK" />'+
            '</div>'+
            '<div class="one columns">'+
              '<div class="tip"></div>'+
            '</div>'+
          '</div>'+
        '</fieldset>'+
        '</div>'+
      '</form>'+
    '</div>'

      // Append the new div containing the tab and add the tab to the list
      tabs.append(html_tab_content).tabs('add', '#placement_tab', 'Placement'); 

      // hOSTS TABLE
      dataTable_template_hosts = $("#datatable_template_hosts",dialog).dataTable({
          "bJQueryUI": true,
          "bSortClasses": false,
          "iDisplayLength": 4,
          "sDom" : '<"H"fr>t<"F"ip>',
          "oColVis": { //exclude checkbox column
              "aiExclude": [ 0 ]
          },
          "bAutoWidth":false,
          "sPaginationType": "full_numbers",
          "aoColumnDefs": [
              { "bSortable": false, "aTargets": ["check"] },
              { "sWidth": "60px", "aTargets": [0,4] },
              { "sWidth": "35px", "aTargets": [1] },
              { "sWidth": "100px", "aTargets": [9,3,10,11,12] },
              { "sWidth": "150", "aTargets": [5,6,7,8] },
              { "bVisible": false, "aTargets": [0,3,5,7,10,11,12]}
          ],
          "oLanguage": (datatable_lang != "") ?
              {
                  sUrl: "locale/"+lang+"/"+datatable_lang
              } : ""
      });

      //preload it
      dataTable_template_hosts.fnClearTable();
      addElement([spinner,'','','','','','','','','','','',''],dataTable_template_hosts);

      OpenNebula.Host.list({
        timeout: true, 
        success: function (request, host_list){
            var host_list_array = [];

            $.each(host_list,function(){
                //Grab table data from the host_list
                host_list_array.push(hostElementArray(this));
            });

            updateView(host_list_array, dataTable_template_hosts);
        }, 
        error: onError
      });

      var selected_hosts = {};
      var host_row_hash = {};

      $('#datatable_template_hosts', dialog).delegate("tr", "click", function(e){
          if ($(e.target).is('input') ||
              $(e.target).is('select') ||
              $(e.target).is('option')) return true;

          var aData   = dataTable_template_hosts.fnGetData(this);
          var host_id = aData[1];

          if(!$("td:first", this).hasClass('markrow'))
          {
            selected_hosts[host_id]=1;
            host_row_hash[host_id]=this;
            $(this).children().each(function(){$(this).addClass('markrow');});
            $('div#selected_hosts_template', dialog).append('<span id="tag_host_'+aData[1]+'"><span class="ui-icon ui-icon-close"></span>'+aData[2]+'</span>');
          }
          else
          {
            delete selected_hosts[host_id];
            $(this).children().each(function(){$(this).removeClass('markrow');});
            $('div#selected_hosts_template span#tag_host_'+host_id, dialog).remove();
          }

          generate_requirements();

          return false;
      });

      $( "#selected_hosts_template span.ui-icon-close" ).live( "click", function() {
         $(this).parent().remove();
         var id = $(this).parent().attr("ID");

         var host_id=id.substring(9,id.length);
         delete selected_hosts[host_id];
         $(host_row_hash[host_id]).children().each(function(){$(this).removeClass('markrow');});

         generate_requirements();
      });

      // Clusters TABLE
      dataTable_template_clusters = $("#datatable_template_clusters", dialog).dataTable({
          "bJQueryUI": true,
          "bSortClasses": false,
          "iDisplayLength": 4,
          "sDom" : '<"H"fr>t<"F"ip>',
          "oColVis": {
              "aiExclude": [ 0 ]
          },
          "bAutoWidth":false,
          "sPaginationType": "full_numbers",
          "aoColumnDefs": [
              { "bSortable": false, "aTargets": ["check"] },
              { "sWidth": "60px", "aTargets": [0] },
              { "sWidth": "35px", "aTargets": [1,3,4,5] },
              { "bVisible": false, "aTargets": [0]}
          ],
          "oLanguage": (datatable_lang != "") ?
              {
                  sUrl: "locale/"+lang+"/"+datatable_lang
              } : ""
      });

      //preload it
      dataTable_template_clusters.fnClearTable();
      addElement([spinner,'','','','',''],dataTable_template_clusters);

      OpenNebula.Cluster.list({
        timeout: true, 
        success: function (request, cluster_list){
          var list_array = [];

          $.each(cluster_list,function(){
              //Grab table data from the list
              list_array.push(clusterElementArray(this));
          });

          updateView(list_array,dataTable_template_clusters);
        }, 
        error: onError
      });

      var selected_clusters = {};
      var cluster_row_hash = {};

      $('#datatable_template_clusters', dialog).delegate("tr", "click", function(e){
          if ($(e.target).is('input') ||
              $(e.target).is('select') ||
              $(e.target).is('option')) return true;

          var aData   = dataTable_template_clusters.fnGetData(this);
          var cluster_id = aData[1];

          if(!$("td:first", this).hasClass('markrow'))
          {
            selected_clusters[cluster_id]=1;
            cluster_row_hash[cluster_id]=this;
            $(this).children().each(function(){$(this).addClass('markrow');});
            $('div#selected_clusters_template', dialog).append('<span id="tag_cluster_'+aData[1]+'"><span class="ui-icon ui-icon-close"></span>'+aData[2]+'</span>');
          }
          else
          {
            delete selected_clusters[cluster_id];
            $(this).children().each(function(){$(this).removeClass('markrow');});
            $('div#selected_clusters_template span#tag_cluster_'+cluster_id, dialog).remove();
          }

          generate_requirements();

          return false;
      });

      $( "#selected_clusters_template span.ui-icon-close" ).live( "click", function() {
         $(this).parent().remove();
         var id = $(this).parent().attr("ID");

         var cluster_id=id.substring(12,id.length);
         delete selected_clusters[cluster_id];
         $(cluster_row_hash[cluster_id]).children().each(function(){$(this).removeClass('markrow');});

         generate_requirements();
      });

      // Select Image or Volatile disk. The div is hidden depending on the selection, and the 
      // vm_param class is included to be computed when the template is generated.
      $("input[name='req_select']").change(function(){
        if ($("input[name='req_select']:checked").val() == "host_select") {
            $("div.host_select",  $('div#placement_tab')).toggle();
            $("div.host_select",  $('div#placement_tab')).addClass('vm_param');
            $("div.cluster_select",  $('div#placement_tab')).hide();
            $("div.cluster_select",  $('div#placement_tab')).removeClass('vm_param');
        }
        else {
            $("div.host_select",  $('div#placement_tab')).hide();
            $("div.host_select",  $('div#placement_tab')).removeClass('vm_param');
            $("div.cluster_select",  $('div#placement_tab')).toggle();
            $("div.cluster_select",  $('div#placement_tab')).addClass('vm_param');
        }
      });

      $("input[name='rank_select']").change(function(){
        $("#RANK", dialog).val(this.value);
      });

      var generate_requirements = function() {
        var req_string=[];

        $.each(selected_hosts, function(key, value) { 
          req_string.push('ID=\\"'+key+'\\"');
        });

        $.each(selected_clusters, function(key, value) { 
          req_string.push('CLUSTER_ID=\\"'+key+'\\"');
        });

        $('#REQUIREMENTS', dialog).val(req_string.join(" | "));
      };
    }


    /**************************************************************************
        OTHER TAB
        
    **************************************************************************/

    var add_other_tab = function() {
      var html_tab_content = '<div id="other_tab" class="wizard_tab">'+
          '<fieldset>'+
            '<div class="vm_param kvm_opt xen_opt vmware_opt">'+
              '<p>You selected the following image: '+
                '<span type="text" id="NETWORK" name="network"></span>'+
                '</p>'+
              '<input type="hidden" id="NETWORK_ID" name="network_id" size="2"/>'+
              '</div>'+
          '</fieldset>'+
        '</div>'

      // Append the new div containing the tab and add the tab to the list
      tabs.append(html_tab_content).tabs('add', '#other_tab', 'Other'); 
    }


    //***CREATE VM DIALOG MAIN BODY***

    dialogs_context.append('<div title="'+tr("Create VM Template")+'" id="create_template_dialog"></div>');
    $create_template_dialog = $('#create_template_dialog',dialogs_context)
    var dialog = $create_template_dialog;

    //Insert HTML in place
    dialog.html(create_template_tmpl);



    //Prepare jquery dialog
    var height = Math.floor($(window).height()*0.9); //set height to a percentage of the window
    dialog.dialog({
        autoOpen: false,
        modal: true,
        width: 'auto',
        height: height
    });



    var tabs = $( "#template_create_tabs", dialog).tabs().addClass("ui-tabs-vertical");
    $(".ui-tabs-vertical .ui-tabs-nav", dialog).removeClass("ui-tabs-nav").addClass("ui-tabs-nav-vert")


    $('#wizard_next').click(function(){ 
      var selected = tabs.tabs('option', 'selected');
      tabs.tabs('select', selected+1);
    });

    $('#wizard_previous').click(function(){ 
      var selected = tabs.tabs('option', 'selected');
      tabs.tabs('select', selected-1);
    });

    add_capacity_tab();
    add_disks_tab();
    add_nics_tab();
    add_os_tab();
    add_io_tab();
    add_context_tab();
    add_placement_tab();
    add_other_tab();

    // Re-Setup tips
    setupTips(dialog);

    //Enable different icon for folded/unfolded categories
    iconToggle(); //toogle +/- buttons

    //Sections, used to stay within their scope
    var section_capacity = $('div#capacity_tab',dialog);
    var section_os_boot = $('div#os_boot_opts',dialog);
    var section_features = $('div#features',dialog);
    var section_disks = $('div#disk1',dialog);
    var section_networks = $('div#networks',dialog);
    var section_inputs = $('div#inputs',dialog);
    var section_graphics = $('div#graphics',dialog);
    var section_context = $('div#context',dialog);
    var section_placement = $('div#placement',dialog);
    var section_raw = $('div#raw',dialog);
    var section_custom_var = $('div#custom_var',dialog);

    //Different selector for items of kvm and xen (mandatory and optional)
    var items = '.vm_param input,.vm_param select';


    foldUnfoldToggle();

    // Enhace buttons
    $('button',dialog).button();

    //Process form
    $('button#create_template_form_easy',dialog).click(function(){
        //validate form

        var vm_json = {};
        var name,value,boot_method;

        //
        // CAPACITY
        //
//        var scope = section_capacity;
//
//        if (!mandatory_filter(scope)){
//            notifyError(tr("There are mandatory fields missing in the capacity section"));
//            return false;
//        };
        addSectionJSON(vm_json,$('div#capacity_tab',dialog));

        //
        // OS
        //

        vm_json["OS"] = {};
        addSectionJSON(vm_json["OS"],$('div#os_tab',dialog));

        //
        // DISK
        //

        vm_json["DISK"] = [];

        $('div.disk div#disk_type.vm_param ',dialog).each(function(){
          var hash  = {};
          addSectionJSON(hash, this);
          vm_json["DISK"].push(hash);
        });

        //
        // NIC
        //

        vm_json["NIC"] = [];

        $('div.nic',dialog).each(function(){
          var hash  = {};
          addSectionJSON(hash, this);

          var tcp = $("input[name='tcp_type']:checked").val();
          if (tcp) {
            hash[tcp] = $("#TCP_PORTS", this).val();
          }

          var udp = $("input[name='udp_type']:checked").val();
          if (udp) {
            hash[udp] = $("#UDP_PORTS", this).val();
          }

          if ($("#icmp_type", this).is(":checked")) {
            hash["ICMP"] = "drop"
          }

          console.log(hash)
          if (!$.isEmptyObject(hash)) {
              vm_json["NIC"].push(hash);
          }
        });

        //
        // GRAPHICS
        //

        vm_json["GRAPHICS"] = {};
        addSectionJSON(vm_json["GRAPHICS"],$('div#io_tab .graphics',dialog));

        //
        // INPUT
        //

        vm_json["INPUT"] = [];
        $('#input_table tr', $('div#io_tab')).each(function(){
          var hash  = {};
          if ($('#TYPE', $(this)).val()) {
            hash['TYPE'] = $('#TYPE', $(this)).val()
            hash['BUS'] = $('#BUS', $(this)).val()
            vm_json["INPUT"].push(hash);
          }
        });

        //
        // CONTEXT
        //

        vm_json["CONTEXT"] = {};
        $('#context_table tr', $('div#context_tab')).each(function(){
          if ($('#KEY', $(this)).val()) {
            vm_json["CONTEXT"][$('#KEY', $(this)).val()] = $('#VALUE', $(this)).val()
          }
        });

        if ($("#ssh_context", $('div#context_tab')).is(":checked")) {
          var public_key = $("#ssh_puclic_key", $('div#context_tab')).val();
          if (public_key){
            vm_json["CONTEXT"]["SSH_PUBLIC_KEY"] = public_key;
          }
          else {
            vm_json["CONTEXT"]["SSH_PUBLIC_KEY"] = '$USER[SSH_PUBLIC_KEY]';
          }
        };

        if ($("#network_context", $('div#context_tab')).is(":checked")) {
          var nic_id = 0;

          console.log("nic")
          console.log(vm_json["NIC"])
          $.each(vm_json["NIC"], function(){
            var vnet_id = this["NETWORK_ID"]
            var eth_str = "ETH"+nic_id+"_"
            var net_str = 'NETWORK_ID=\\"'+ vnet_id +'\\"'

            vm_json["CONTEXT"][eth_str+"IP"] = "$NIC[IP,"+ net_str +"]";
            vm_json["CONTEXT"][eth_str+"NETWORK"] = "$NETWORK[NETWORK_ADDRESS,"+ net_str +"]";
            vm_json["CONTEXT"][eth_str+"MASK"] = "$NETWORK[NETWORK_MASK,"+ net_str +"]";
            vm_json["CONTEXT"][eth_str+"GATEWAY"] = "$NETWORK[GATEWAY,"+ net_str +"]";
            vm_json["CONTEXT"][eth_str+"DNS"] = "$NETWORK[DNS,"+ net_str +"]";

            nic_id++;
          });
        };

        addSectionJSON(vm_json["CONTEXT"],$('div#context_tab',dialog));

        //
        // PLACEMENT
        //

        addSectionJSON(vm_json,$('div#placement_tab',dialog));

        // remove empty elements
        vm_json = removeEmptyObjects(vm_json);

        //wrap it in the "vmtemplate" object
        vm_json = {vmtemplate: vm_json};


        Sunstone.runAction("Template.create",vm_json);

        $create_template_dialog.dialog('close');
        $create_template_dialog.empty();
        setupCreateTemplateDialog();

        return false;
    });

    //Handle manual forms
    $('button#create_template_form_manual',$create_template_dialog).click(function(){
        var template = $('textarea#textarea_vm_template',$create_template_dialog).val();

        //wrap it in the "vm" object
        template = {"vmtemplate": {"template_raw": template}};

        Sunstone.runAction("Template.create",template);
        $create_template_dialog.dialog('close');
        return false;
    });

    //Reset form - empty boxes
    $('button#reset_vm_form',dialog).click(function(){
        $('select#disks_box option',section_disks).remove();
        $('select#nics_box option',section_networks).remove();
        $('select#inputs_box option',section_inputs).remove();
        $('select#custom_var_box option',section_custom_var).remove();
        return true;
    });
}

function popUpCreateTemplateDialog(){
    $create_template_dialog.dialog('open');
};

function setupTemplateTemplateUpdateDialog(){
    //Append to DOM
    dialogs_context.append('<div id="template_template_update_dialog" title="'+tr("Update template properties")+'"></div>');
    var dialog = $('#template_template_update_dialog',dialogs_context);

    //Put HTML in place
    dialog.html(update_template_tmpl);

    var height = Math.floor($(window).height()*0.8); //set height to a percentage of the window

    //Convert into jQuery
    dialog.dialog({
        autoOpen:false,
        width:700,
        modal:true,
        height:height,
        resizable:false
    });

    $('button',dialog).button();

    $('#template_template_update_select',dialog).change(function(){
        var id = $(this).val();
        $('.permissions_table input',dialog).removeAttr('checked')
        $('.permissions_table',dialog).removeAttr('update');
        if (id && id.length){
            var dialog = $('#template_template_update_dialog');
            $('#template_template_update_textarea',dialog).val(tr("Loading")+"...");

            Sunstone.runAction("Template.fetch_permissions",id);
            Sunstone.runAction("Template.fetch_template",id);
        } else {
            $('#template_template_update_textarea',dialog).val("");
        };
    });

    $('.permissions_table input',dialog).change(function(){
        $(this).parents('table').attr('update','update');
    });

    $('form',dialog).submit(function(){
        var dialog = $(this);
        var new_template = $('#template_template_update_textarea',dialog).val();
        var id = $('#template_template_update_select',dialog).val();
        if (!id || !id.length) {
            $(this).parents('#template_template_update_dialog').dialog('close');
            return false;
        };

        var permissions = $('.permissions_table',dialog);
        if (permissions.attr('update')){
            var perms = {
                octet : buildOctet(permissions)
            };
            Sunstone.runAction("Template.chmod",id,perms);
        };

        Sunstone.runAction("Template.update",id,new_template);
        $(this).parents('#template_template_update_dialog').dialog('close');
        return false;
    });
};

function popUpTemplateTemplateUpdateDialog(){
    var selected_nodes = getSelectedNodes(dataTable_templates);
 
    if ( selected_nodes.length != 1 )
    {
      notifyMessage("Please select one (and just one) template to update.");
      return false;
    }
 
    // Get proper cluster_id
    var template_id   = ""+selected_nodes[0];

    Sunstone.runAction("Template.show_to_update", template_id);
//    var select = makeSelectOptions(dataTable_templates,
//                                   1,//id_col
//                                   4,//name_col
//                                   [],
//                                   []
//                                  );
//    var sel_elems = getSelectedNodes(dataTable_templates);
//
//
//    var dialog =  $('#template_template_update_dialog');
//    $('#template_template_update_select',dialog).html(select);
//    $('#template_template_update_textarea',dialog).val("");
//    $('.permissions_table input',dialog).removeAttr('checked');
//    $('.permissions_table',dialog).removeAttr('update');
//
//    if (sel_elems.length >= 1){ //several items in the list are selected
//        //grep them
//        var new_select= sel_elems.length > 1? '<option value="">Please select</option>' : "";
//        $('option','<select>'+select+'</select>').each(function(){
//            var val = $(this).val();
//            if ($.inArray(val,sel_elems) >= 0){
//                new_select+='<option value="'+val+'">'+$(this).text()+'</option>';
//            };
//        });
//        $('#template_template_update_select',dialog).html(new_select);
//        if (sel_elems.length == 1) {
//            $('#template_template_update_select option',dialog).attr('selected','selected');
//            $('#template_template_update_select',dialog).trigger("change");
//        };
//    };
//
//    dialog.dialog('open');
//    return false;

};

function fillTemplatePopUp(request, response){
    $create_template_dialog.empty();
    setupCreateTemplateDialog();
    console.log(response.VMTEMPLATE)

    function autoFillInputs(template_json, context){
        console.log(context)
        var params = $('.vm_param',context);
        var inputs = $('input',params);
        var selects = $('select:enabled',params);
        var fields = $.merge(inputs,selects);

        fields.each(function(){
            var field = $(this);
                if (template_json[field.attr('id')]){ //if has a length
                    field.val(template_json[field.attr('id')]);
                    field.change();

                    if (field.parents(".advanced")) {
                        $('.advanced', context).toggle();
                    }
                };
        });
    };

    var template = response.VMTEMPLATE.TEMPLATE;


    //
    // GENERAL
    //
   
    var capacity_section = $('div#capacity_tab', $create_template_dialog);
    autoFillInputs(template, capacity_section);


    //
    // DISKS
    //
    
    var number_of_disks = 0;

    function fillDiskTab(disk) {
        var str_disk_tab_id = 'disk' + number_of_disks;
        var disk_section  = $('div#' + str_disk_tab_id, $create_template_dialog);

        if (disk.IMAGE_ID) {
            $('input#'+str_disk_tab_id+'radioImage', disk_section).click();

            var dataTable_template_images = $("#datatable_template_images" + number_of_disks).dataTable();

            // TODO updateView should not be required. Currently the dataTable
            //  is filled twice.
            OpenNebula.Image.list({
                timeout: true, 
                success: function (request, images_list){
                    var image_list_array = [];

                    $.each(images_list,function(){
                        image_list_array.push(imageElementArray(this));
                    });

                    updateView(image_list_array, dataTable_template_images);

                    var rows = dataTable_template_images.fnGetNodes();

                    for (var j=0;j<rows.length;j++) {
                        var current_row = $(rows[j]);
                        var row_image_id = $(rows[j]).find("td:eq(0)").html();

                        if (row_image_id == disk.IMAGE_ID) {
                            rows[j].click();
                        }
                    }
              }, 
              error: onError
            });

        }
        else {
            $('input#'+str_disk_tab_id+'radioVolatile', disk_section).click();
        }

        autoFillInputs(disk, $('div#disk_type.vm_param', disk_section));
    }

    if (template.DISK) {
        var disks = template.DISK

        if (disks instanceof Array) {
            $.each(disks, function(){
                if (number_of_disks > 0) {
                    $("#tf_btn_disks").click();
                }

                fillDiskTab(this);
                number_of_disks++;
            });
        }
        else if (disks instanceof Object) {
            fillDiskTab(disks);
        }
    }


    //
    // NICS
    //
    
    var number_of_nics = 0;

    function fillNicTab(nic) {
        var str_nic_tab_id = 'nic' + number_of_nics;
        var nic_section  = $('div#' + str_nic_tab_id, $create_template_dialog);

        var dataTable_template_networks = $("#datatable_template_networks" + number_of_nics).dataTable();

        // TODO updateView should not be required. Currently the dataTable
        //  is filled twice.
        OpenNebula.Network.list({
            timeout: true, 
            success: function (request, networks_list){
                var network_list_array = [];

                $.each(networks_list,function(){
                    network_list_array.push(vNetworkElementArray(this));
                });

                updateView(network_list_array, dataTable_template_networks);

                var rows = dataTable_template_networks.fnGetNodes();

                for (var j=0;j<rows.length;j++) {
                    var current_row = $(rows[j]);
                    var row_network_id = $(rows[j]).find("td:eq(1)").html();

                    if (row_network_id == nic.NETWORK_ID) {
                        rows[j].click();
                    }
                }
          }, 
          error: onError
        });

        autoFillInputs(nic, nic_section);
    }

    if (template.NIC) {
        var nics = template.NIC

        if (nics instanceof Array) {
            $.each(nics, function(){
                if (number_of_nics > 0) {
                    $("#tf_btn_nics").click();
                }

                fillNicTab(this);
                number_of_nics++;
            });
        }
        else if (nics instanceof Object) {
            fillNicTab(nics);
        }
    }


    //
    // OS
    //
    
    var os = template.OS;
    var os_section = $('div#os_tab', $create_template_dialog);

    if (os) {
        if (os.KERNEL_DS) {
            $('input#radioKernelDs', os_section).click();

            var dataTable_template = $("#datatable_kernel").dataTable();
            var regexp = /\$FILE\[IMAGE_ID=([(0-9)+])+/;

            // TODO updateView should not be required. Currently the dataTable
            //  is filled twice.
            OpenNebula.Image.list({
                timeout: true, 
                success: function (request, list){
                    var list_array = [];

                    $.each(list,function(){
                        list_array.push(imageElementArray(this));
                    });

                    updateView(list_array, dataTable_template);
                    dataTable_template.fnFilter("KERNEL", 6)

                    var rows = dataTable_template.fnGetNodes();

                    for (var j=0;j<rows.length;j++) {
                        var current_row = $(rows[j]);
                        var row_id = $(rows[j]).find("td:eq(0)").html();

                        match = regexp.exec(os.KERNEL_DS)
                        if (match && row_id == match[1]) {
                            rows[j].click();
                        }
                    }
              }, 
              error: onError
            });
        }
        else if (os.KERNEL) {
            $('input#radioKernelPath', os_section).click();
        };

        if (os.INITRD_DS) {
            $('input#radioInitrdDs', os_section).click();

            var dataTable_template = $("#datatable_initrd").dataTable();
            var regexp = /\$FILE\[IMAGE_ID=([(0-9)+])+/;

            // TODO updateView should not be required. Currently the dataTable
            //  is filled twice.
            OpenNebula.Image.list({
                timeout: true, 
                success: function (request, list){
                    var list_array = [];

                    $.each(list,function(){
                        list_array.push(imageElementArray(this));
                    });

                    updateView(list_array, dataTable_template);
                    dataTable_template.fnFilter("RAMDISK", 6)

                    var rows = dataTable_template.fnGetNodes();

                    for (var j=0;j<rows.length;j++) {
                        var current_row = $(rows[j]);
                        var row_id = $(rows[j]).find("td:eq(0)").html();

                        match = regexp.exec(os.INITRD_DS)
                        if (match && row_id == match[1]) {
                            rows[j].click();
                        }
                    }
              }, 
              error: onError
            });
        }
        else if (os.INITRD) {
            $('input#radioInitrdPath', os_section).click();
        };

        autoFillInputs(os, os_section);
    }

    //
    // INPUT/OUTPUT
    //

    var graphics = template.GRAPHICS;
    var graphics_section = $('div#io_tab .graphics', $create_template_dialog);

    if (graphics) {
        var type = graphics.TYPE;
        if (graphics.TYPE) {
            $("input[value='"+ type + "']").click();

            autoFillInputs(graphics, graphics_section);
        }
    }

    var inputs = template.INPUT;
    var inputs_section = $('div#io_tab .inputs', $create_template_dialog);

    if (inputs) {
        if (!(inputs instanceof Array)) {
            inputs = [inputs];
        }

        $.each(inputs, function(){ 
            var table = $('#input_table', inputs_section)[0];
            var rowCount = table.rows.length;
            var row = table.insertRow(rowCount);
            console.log(this)
            var cell1 = row.insertCell(0);
            var element1 = document.createElement("input");
            element1.id = "TYPE";
            element1.type = "text";
            element1.value = this.TYPE;
            cell1.appendChild(element1);

            var cell2 = row.insertCell(1);
            var element2 = document.createElement("input");
            element2.id = "BUS";
            element2.type = "text";
            element2.value = this.BUS;
            cell2.appendChild(element2);


            var cell3 = row.insertCell(2);
            cell3.innerHTML = "<span class='ui-icon ui-icon-close'></span>";
        });
    }


    //
    // CONTEXT
    //

    var context = template.CONTEXT;
    var context_section = $('div#context_tab', $create_template_dialog);

    if (context) {
        var file_ds_regexp = /\$FILE\[IMAGE_ID=([(0-9)+])+/g;
        var net_regexp = /^ETH[(0-9)+]_(MASK|GATEWAY|IP|NETWORK|DNS)$/;
        var ssh_regexp = /^SSH_PUBLIC_KEY$/;

        var net_flag = false;
        var files = [];

        $.each(context, function(key, value){ 
            if (ssh_regexp.test(key)) {
                $("#ssh_context", context_section).click();
                $("input#ssh_puclic_key").val(value);
            }
            else if (net_regexp.test(key)) {
                if (!net_flag) {
                    $("#network_context", context_section).click();
                    net_flag = true;
                }
            }
            else if ("FILES_DS" == key){
                var files = [];
                while (match = file_ds_regexp.exec(value)) {
                    files.push(match[1])
                }

                var dataTable_context = $("#datatable_context").dataTable();

                // TODO updateView should not be required. Currently the dataTable
                //  is filled twice.
                OpenNebula.Image.list({
                    timeout: true, 
                    success: function (request, list){
                        var list_array = [];

                        $.each(list,function(){
                            list_array.push(imageElementArray(this));
                        });

                        updateView(list_array, dataTable_context);
                        dataTable_context.fnFilter("CONTEXT", 7)

                        var rows = dataTable_context.fnGetNodes();

                        for (var j=0;j<rows.length;j++) {
                            var current_row = $(rows[j]);
                            var row_id = $(rows[j]).find("td:eq(0)").html();

                            if ($.inArray(row_id, files) != -1) {
                                // TBD check if all the files were clicked
                                rows[j].click();
                            }
                        }
                  }, 
                  error: onError
                });
            }
            else {
              var table = $('#context_table', context_section)[0];
              var rowCount = table.rows.length;
              var row = table.insertRow(rowCount);

              var cell1 = row.insertCell(0);
              var element1 = document.createElement("input");
              element1.id = "KEY";
              element1.type = "text";
              element1.value = key
              cell1.appendChild(element1);

              var cell2 = row.insertCell(1);
              var element2 = document.createElement("input");
              element2.id = "VALUE";
              element2.type = "text";
              element2.value = value
              cell2.appendChild(element2);


              var cell3 = row.insertCell(2);
              cell3.innerHTML = "<span class='ui-icon ui-icon-close'></span>";
            }
        });
    }

    //
    // REQUIREMENTS & RANK
    //

    var req = template.REQUIREMENTS;
    var req_section = $('div#placement_tab', $create_template_dialog);

    if (req) {
        req = escapeDoubleQuotes(req);

        var host_id_regexp = /ID=\\"([(0-9)+])\\"/g;
        var cluster_id_regexp = /CLUSTER_ID=\\"([(0-9)+])\\"/g;

        var hosts = [];
        while (match = host_id_regexp.exec(req)) {
            hosts.push(match[1])
        }

        var clusters = [];
        while (match = cluster_id_regexp.exec(req)) {
            clusters.push(match[1])
        }

        if (hosts.length != 0) {
            var dataTable_template_hosts = $("#datatable_template_hosts").dataTable();

            OpenNebula.Host.list({
                timeout: true, 
                success: function (request, host_list){
                    var host_list_array = [];

                    $.each(host_list,function(){
                        //Grab table data from the host_list
                        host_list_array.push(hostElementArray(this));
                    });

                    updateView(host_list_array, dataTable_template_hosts);

                    var rows = dataTable_template_hosts.fnGetNodes();

                    for (var j=0;j<rows.length;j++) {
                        var current_row = $(rows[j]);
                        var row_id = $(rows[j]).find("td:eq(0)").html();

                        if ($.inArray(row_id, hosts) != -1) {
                            // TBD check if all the hosts were clicked
                            rows[j].click();
                        }
                    }
                }, 
                error: onError
            });
        }

        if (clusters.length != 0) {
            $('input#clusters_req', req_section).click();

            var dataTable_template_clusters = $("#datatable_template_clusters").dataTable();

            OpenNebula.Host.list({
                timeout: true, 
                success: function (request, cluster_list){
                    var cluster_list_array = [];

                    $.each(cluster_list,function(){
                        //Grab table data from the cluster_list
                        cluster_list_array.push(clusterElementArray(this));
                    });

                    updateView(cluster_list_array, dataTable_template_clusters);

                    var rows = dataTable_template_clusters.fnGetNodes();

                    for (var j=0;j<rows.length;j++) {
                        var current_row = $(rows[j]);
                        var row_id = $(rows[j]).find("td:eq(0)").html();

                        if ($.inArray(row_id, clusters) != -1) {
                            // TBD check if all the clusters were clicked
                            rows[j].click();
                        }
                    }
                }, 
                error: onError
            });
        }

        $('input#REQUIREMENTS', req_section).val(req);
    }

    var rank = template.RANK;

    if (rank) {
        var striping_regexp = /-RUNNING_VMS/;
        var packing_regexp = /RUNNING_VMS/;
        var loadaware_regexp = /FREECPU/;

        if (striping_regexp.test(rank)) {
            $('input#stripingRadio', req_section).click()
        }
        else if (packing_regexp.test(rank)) {
            $('input#packingRadio', req_section).click()
        }
        else if (loadaware_regexp.test(rank)) {
            $('input#loadawareRadio', req_section).click()
        }

        $('input#RANK', req_section).val(rank);
    }

    popUpCreateTemplateDialog();
}

// Template clone dialog
function setupTemplateCloneDialog(){
    //Append to DOM
    dialogs_context.append('<div id="template_clone_dialog" title="'+tr("Clone a template")+'"></div>');
    var dialog = $('#template_clone_dialog',dialogs_context);

    //Put HTML in place

    var html = '<form><fieldset>\
<div class="clone_one">'+tr("Choose a new name for the template")+':</div>\
<div class="clone_several">'+tr("Several templates are selected, please choose prefix to name the new copies")+':</div>\
<br />\
<label class="clone_one">'+tr("Name")+':</label>\
<label class="clone_several">'+tr("Prefix")+':</label>\
<input type="text" name="name"></input>\
<div class="form_buttons">\
  <button class="button" id="template_clone_button" value="Template.clone">\
'+tr("Clone")+'\
  </button>\
</div></fieldset></form>\
';

    dialog.html(html);

    //Convert into jQuery
    dialog.dialog({
        autoOpen:false,
        width:375,
        modal:true,
        resizable:false
    });

    $('button',dialog).button();

    $('form',dialog).submit(function(){
        var name = $('input', this).val();
        var sel_elems = templateElements();
        if (!name || !sel_elems.length)
            notifyError('A name or prefix is needed!');
        if (sel_elems.length > 1){
            for (var i=0; i< sel_elems.length; i++)
                //use name as prefix if several items selected
                Sunstone.runAction('Template.clone',
                                   sel_elems[i],
                                   name+getTemplateName(sel_elems[i]));
        } else {
            Sunstone.runAction('Template.clone',sel_elems[0],name)
        };
        $(this).parents('#template_clone_dialog').dialog('close');
        setTimeout(function(){
            Sunstone.runAction('Template.refresh');
        }, 1500);
        return false;
    });
}

function popUpTemplateCloneDialog(){
    var dialog = $('#template_clone_dialog');
    var sel_elems = templateElements();
    //show different text depending on how many elements are selected
    if (sel_elems.length > 1){
        $('.clone_one',dialog).hide();
        $('.clone_several',dialog).show();
        $('input',dialog).val('Copy of ');
    }
    else {
        $('.clone_one',dialog).show();
        $('.clone_several',dialog).hide();
        $('input',dialog).val('Copy of '+getTemplateName(sel_elems[0]));
    };

    $(dialog).dialog('open');
}

// Set the autorefresh interval for the datatable
function setTemplateAutorefresh() {
    setInterval(function(){
        var checked = $('input.check_item:checked',dataTable_templates);
        var filter = $("#datatable_templates_filter input",
                       dataTable_templates.parents('#datatable_templates_wrapper')).attr('value');
        if (!checked.length && !filter.length){
            Sunstone.runAction("Template.autorefresh");
        }
    },INTERVAL+someTime());
};

//The DOM is ready at this point
$(document).ready(function(){

    dataTable_templates = $("#datatable_templates",main_tabs_context).dataTable({
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
            { "sWidth": "60px", "aTargets": [0] },
            { "sWidth": "35px", "aTargets": [1] },
            { "sWidth": "150px", "aTargets": [5] },
            { "sWidth": "100px", "aTargets": [2,3] }
        ],
        "oLanguage": (datatable_lang != "") ?
            {
                sUrl: "locale/"+lang+"/"+datatable_lang
            } : ""
    });

    dataTable_templates.fnClearTable();
    addElement([
        spinner,
        '','','','',''],dataTable_templates);
    Sunstone.runAction("Template.list");

    setupCreateTemplateDialog();
    setupTemplateTemplateUpdateDialog();
    setupTemplateCloneDialog();
    setTemplateAutorefresh();

    initCheckAllBoxes(dataTable_templates);
    tableCheckboxesListener(dataTable_templates);
    infoListener(dataTable_templates,'Template.showinfo');


    $('div#templates_tab div.legend_div').hide();
});
