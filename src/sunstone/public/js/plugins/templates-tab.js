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
<form class="custom" id="template_form" action="">\
<div class="panel">\
<div class="row">\
  <div class="twelve columns">\
    <h4 class="subheader header">\
      <span class="header-resource">\
        <i class="icon-file-alt"></i> '+tr("Templates")+'\
      </span>\
      <span class="header-info">\
        <span/> <small></small>&emsp;\
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
    <input id="template_search" type="text" placeholder="'+tr("Search")+'" />\
  </div>\
  <br>\
  <br>\
</div>\
</div>\
  <div class="row">\
    <div class="twelve columns">\
<table id="datatable_templates" class="datatable twelve">\
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
  </div>\
  </div>\
</form>';


var create_template_tmpl = '<div class="panel">'+
    '<h3><small id="create_template_header">'+tr("Create VM Template")+'</small><small id="update_template_header" class="hidden">'+tr("Update VM Template")+'</small></h3>'+
  '</div>'+
  '<div class="reveal-body">'+
    '<dl class="tabs">' +
      '<dd id="wizard_mode" class="active"><a href="#easy">'+tr("Wizard")+'</a></dd>' +
      '<dd id="advanced_mode"><a id="advanced_mode_a" href="#manual">'+tr("Advanced mode")+'</a></dd>' +
    '</dl>' +
    '<ul class="tabs-content">' +
      '<li class="active" id="easyTab">' +
        '<form class="custom creation">'+
          '<div class="">'+
            '<div class="columns three">'+
                '<dl id="template_create_tabs" class="tabs vertical">'+
                '</dl>'+
            '</div>'+
            '<div class="columns nine">'+
                    '<ul id="template_create_tabs_content" class="tabs-content">'+
                    '</ul>'+
            '</div>'+
          '</div>'+
          '<div class="reveal-footer">'+
              '<hr>'+
              '<button class="success button radius" id="create_template_form_easy" value="OpenNebula.Template.create" style="float: right">'+tr("Create")+'</button>'+
              '<button class="button hidden radius" id="template_template_update_button" value="Template.update_template" style="float: right">'+tr("Update")+'</button>'+
              '<button class="button secondary radius" id="template_template_reset_button" value="reset" type="reset">'+tr("Reset")+'</button>'+
              '<button class="button secondary hidden radius" id="template_template_reset_button_update" value="reset" type="reset">'+tr("Reset")+'</button>'+
              '<button class="close-reveal-modal button secondary radius" type="button" value="close">' + tr("Close") + '</button>'+
          '</div>'+
        '</form>'+
      '</li>' +
      '<li id="manualTab">' +
       '<form id="create_template_form_manual" action="">' +
          '<h4><small>'+tr("Write the Virtual Machine template here")+'</small></h4>' +
          '<textarea id="template" rows="15" style="width:100%;"></textarea>' +
          '<div class="reveal-footer">' +
            '<hr>' +
            '<div class="form_buttons">' +
              '<button class="button success right radius" id="create_template_submit_manual" value="template/create">'+tr("Create")+'</button>' +
              '<button class="button hidden radius" id="manual_template_update_button" value="Template.update_template" style="float: right">'+tr("Update")+'</button>'+
              '<button class="button secondary radius" id="manual_template_reset_button_update" value="reset" type="reset">'+tr("Reset")+'</button>'+
              '<button class="close-reveal-modal button secondary radius" type="button" value="close">' + tr("Close") + '</button>' +
            '</div>' +
          '</div>' +
        '</form>' +
      '</li>' +
    '</ul>' +
  '</div>'+
  '<a class="close-reveal-modal">&#215;</a>';


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

var instantiate_vm_template_tmpl ='\
        <div class="panel">\
          <h3>\
            <small id="create_vnet_header">'+tr("Instantiate VM Template")+'</small>\
          </h3>\
        </div>\
        <form id="instantiate_vm_template_form" action="">\
          <div class="row centered">\
              <div class="four columns">\
                  <label class="inline right" for="vm_name">'+tr("VM Name")+':</label>\
              </div>\
              <div class="seven columns">\
                  <input type="text" name="vm_name" id="vm_name" />\
              </div>\
              <div class="one columns">\
                  <div class="tip">'+tr("Defaults to template name when emtpy")+'.</div>\
              </div>\
          </div>\
          <div class="row centered">\
              <div class="four columns">\
                  <label class="inline right" for="vm_n_times">'+tr("Deploy # VMs")+':</label>\
              </div>\
              <div class="seven columns">\
                  <input type="text" name="vm_n_times" id="vm_n_times" value="1">\
              </div>\
              <div class="one columns">\
                  <div class="tip">'+tr("You can use the wildcard &#37;i. When creating several VMs, &#37;i will be replaced with a different number starting from 0 in each of them")+'.</div>\
              </div>\
          </div>\
          <hr>\
        <div class="form_buttons">\
           <button class="button radius right success" id="instantiate_vm_tenplate_proceed" value="Template.instantiate_vms">'+tr("Instantiate")+'</button>\
           <button class="close-reveal-modal button secondary radius" type="button" value="close">' + tr("Close") + '</button>\
        </div>\
<a class="close-reveal-modal">&#215;</a>\
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

    "Template.rename" : {
        type: "single",
        call: OpenNebula.Template.rename,
        callback: function(request) {
            Sunstone.runAction('Template.showinfo',request.request.data[0]);
            Sunstone.runAction("Template.show",request.request.data[0]);
        },
        error: onError,
        notify: true
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
        type: "multiple",
        call: OpenNebula.Template.instantiate,
        elements: templateElements,
        error: onError,
        notify: true
    },

    "Template.instantiate_quiet" : {
        type: "single",
        call: OpenNebula.Template.instantiate,
        error: onError,
        notify: false
    },

     "Template.instantiate_vms" : {
         type: "custom",
         call: function(){
             nodes = getSelectedNodes(dataTable_templates);
             if (nodes.length == 1)
             {
               popUpInstantiateVMTemplateDialog();
             }
             else
             {
                Sunstone.runAction("Template.instantiate", nodes);
             }

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
        layout: "refresh",
        alwaysActive: true
    },
    "Template.create_dialog" : {
        type: "create_dialog",
        layout: "create"
    },
    "Template.update_dialog" : {
        type: "action",
        layout: "more_select",
        text: tr("Update")
    },
    "Template.instantiate_vms" : {
        type: "action",
        layout: "main",
        text: tr("Instantiate")
    },
    "Template.chown" : {
        type: "confirm_with_select",
        text: tr("Change owner"),
        layout: "user_select",
        select: users_sel,
        tip: tr("Select the new owner")+":",
        condition: mustBeAdmin
    },
    "Template.chgrp" : {
        type: "confirm_with_select",
        text: tr("Change group"),
        layout: "user_select",
        select: groups_sel,
        tip: tr("Select the new group")+":",
        condition: mustBeAdmin
    },
    "Template.clone_dialog" : {
        type: "action",
        layout: "more_select",
        text: tr("Clone")
    },
    "Template.delete" : {
        type: "confirm",
        layout: "del",
        text: tr("Delete")
    },

    //"Template.help" : {
    //    type: "action",
    //    layout: "help",
    //    alwaysActive: true
    //}
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
    parentTab: 'vresources-tab'
}

Sunstone.addActions(template_actions);
Sunstone.addMainTab('templates-tab',templates_tab);
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
}

function generate_capacity_tab_content() {
    var html = '<div id="template_name_form" class="row vm_param">'+
        '<div class="two columns">'+
          '<label class="inline right" for="NAME">'+tr("NAME")+':</label>'+
        '</div>'+
        '<div class="six columns">'+
          '<input type="text" id="NAME" name="name"/>'+
        '</div>'+
        '<div class="one columns">'+
          '<div class="tip">'+tr("Name that the VM will get for description purposes.")+'</div>'+
        '</div>'+
    '</div>'+
    '<div class="row">'+
        '<div class="two columns">'+
          '<label class="inline right" for="CPU">'+tr("CPU")+':</label>'+
        '</div>'+
        '<div id="cpu_slider" class="seven columns">'+
        '</div>'+
        '<div class="one columns vm_param">'+
          '<input type="text" id="CPU" name="cpu" size="2"/>'+
        '</div>'+
        '<div class="one right columns">'+
          '<div class="tip">'+tr("Percentage of CPU divided by 100 required for the Virtual Machine. Half a processor is written 0.5.")+'</div>'+
        '</div>'+
    '</div>'+
    '<div class="vm_param">'+
        '<input type="hidden" id="MEMORY" name="memory" />'+
    '</div>'+
    '<div class="row">'+
        '<div class="two columns">'+
          '<label class="inline right" for="MEMORY">'+tr("MEMORY")+':</label>'+
        '</div>'+
        '<div id="memory_slider" class="five columns">'+
        '</div>'+
        '<div class="two columns">'+
          '<input type="text" id="MEMORY_TMP" name="memory_tmp" size="4" />'+
        '</div>'+
        '<div class="one columns">'+
          '<select id="memory_unit" name="MEMORY_UNIT">'+
              '<option value="MB">'+tr("MB")+'</option>'+
              '<option value="GB">'+tr("GB")+'</option>'+
          '</select>'+
        '</div>'+
        '<div class="one right columns">'+
          '<div class="tip">'+tr("Amount of RAM required for the VM, in Megabytes.")+'</div>'+
        '</div>'+
    '</div>'+
    '<div class="show_hide" id="advanced_capacity">'+
         '<h4><small><i class=" icon-caret-down"/> '+tr("Advanced options")+'<a id="add_os_boot_opts" class="icon_left" href="#"></a></small></h4>'+
    '</div>'+
    '<div class="advanced">'+
      '<div class="row">'+
          '<div class="two columns">'+
            '<label class="inline right" for="VCPU">'+tr("VCPU")+':</label>'+
          '</div>'+
          '<div id="vcpu_slider" class="seven columns">'+
          '</div>'+
          '<div class="one  columns vm_param">'+
            '<input type="text" id="VCPU" name="vcpu" size="3" />'+
          '</div>'+
          '<div class="one right columns">'+
            '<div class="tip">'+tr("Number of virtual cpus. This value is optional, the default hypervisor behavior is used, usually one virtual CPU.")+'</div>'+
          '</div>'+
      '</div>'+
    '</div>'

    return html;
}

function setup_capacity_tab_content(capacity_section) {
    setupTips(capacity_section);

    // Hide advanced options
    $('.advanced',capacity_section).hide();

    $('#advanced_capacity',capacity_section).click(function(){
        $('.advanced',capacity_section).toggle();
        return false;
    });

    // Define the cpu slider

    var cpu_input = $( "#CPU", capacity_section);

    var cpu_slider = $( "#cpu_slider", capacity_section).noUiSlider({
        handles: 1,
        connect: "lower",
        range: [0,800],
//            start: 100,
        step: 50,
        start: 1,
        slide: function(type) {
            if ( type != "move")
            {
                var values = $(this).val();

                cpu_input.val(values / 100);
            }
        },
    });

    cpu_slider.addClass("noUiSlider");

    cpu_input.change(function() {
        cpu_slider.val(this.value * 100)
    });

    cpu_input.val(1);

    // init::start is ignored for some reason
    cpu_slider.val(100);


    // Define the memory slider

    var final_memory_input = $( "#MEMORY", capacity_section );
    var memory_input = $( "#MEMORY_TMP", capacity_section );
    var memory_unit  = $( "#memory_unit", capacity_section );

    var current_memory_unit = memory_unit.val();

    var update_final_memory_input = function() {
        if (current_memory_unit == 'MB') {
            final_memory_input.val( Math.floor(memory_input.val()) );
        }
        else {
            final_memory_input.val( Math.floor(memory_input.val() * 1024) );
        }
    }

    var memory_slider_change = function(type) {
        if ( type != "move")
        {
            var values = $(this).val();

            memory_input.val(values / 100);

            update_final_memory_input();
        }
    };

    var memory_slider = $( "#memory_slider", capacity_section).noUiSlider({
        handles: 1,
        connect: "lower",
        range: [0,409600],
        step: 12800,
        start: 1,
        slide: memory_slider_change,
    });

    memory_slider.addClass("noUiSlider");

    memory_input.change(function() {
        memory_slider.val(this.value * 100)

        update_final_memory_input();
    });

    final_memory_input.change(function() {
      memory_slider.val(this.value * 100);
      memory_input.val( Math.floor(final_memory_input.val()) );
    })

    // init::start is ignored for some reason
    memory_slider.val(0);

    memory_unit.change(function() {
        var memory_unit_val = $('#memory_unit :selected', capacity_section).val();

        if (current_memory_unit != memory_unit_val)
        {
            current_memory_unit = memory_unit_val

            if (memory_unit_val == 'GB') {

                memory_slider.empty().noUiSlider({
                    handles: 1,
                    connect: "lower",
                    range: [0,1600],
                    start: 1,
                    step: 50,
                    slide: memory_slider_change,
                });

                var new_val = memory_input.val() / 1024;

                memory_input.val( new_val );
                memory_slider.val(new_val * 100);
            }
            else if (memory_unit_val == 'MB') {

                memory_slider.empty().noUiSlider({
                    handles: 1,
                    connect: "lower",
                    range: [0,409600],
                    start: 1,
                    step: 12800,
                    slide: memory_slider_change,
                });

                var new_val = Math.floor( memory_input.val() * 1024 );

                memory_input.val( new_val );
                memory_slider.val(new_val * 100);
            }

            update_final_memory_input();
        }
    });


    // Define the vcpu slider

    var vcpu_input = $( "#VCPU", capacity_section );

    var vcpu_slider = $( "#vcpu_slider", capacity_section).noUiSlider({
        handles: 1,
        connect: "lower",
        range: [0,8],
        start: 0,
        step: 1,
        slide: function(type) {
            if ( type != "move")
            {
                var values = $(this).val();

                vcpu_input.val(values);
            }
        },
    });

    vcpu_slider.addClass("noUiSlider");

    vcpu_input.change(function() {
        vcpu_slider.val(this.value)
    });

    // init::start is ignored for some reason
    vcpu_slider.val(0);
}

function generate_disk_tab_content(str_disk_tab_id, str_datatable_id){
  var html = '<div class="row">'+
        '<div class="three columns push-three">'+
          '<input id="'+str_disk_tab_id+'radioImage" type="radio" name="'+str_disk_tab_id+'" value="image" checked> '+tr("Image")+
        '</div>'+
        '<div class="three columns pull-three">'+
          '<input id="'+str_disk_tab_id+'radioVolatile" type="radio" name="'+str_disk_tab_id+'" value="volatile"> '+tr("Volatile Disk")+
        '</div>'+
      '</div>'+
      '<hr>'+
        '<div id="disk_type" class="vm_param image">'+
          '<div class="row collapse">'+
            '<div class="seven columns">' +
               '<button id="refresh_template_images_table_button_class'+str_disk_tab_id+'" type="button" class="button small radius secondary"><i class="icon-refresh" /></button>' +
            '</div>' +
            '<div class="five columns">'+
              '<input id="'+str_disk_tab_id+'_search" type="text" placeholder="'+tr("Search")+'"/>'+
            '</div>'+
          '</div>'+
          '<table id="'+str_datatable_id+'" class="datatable twelve">'+
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
          '<div class="vm_param kvm_opt xen_opt vmware_opt">'+
            '<span id="select_image" class="radius secondary label">'+tr("Please select an image from the list")+'</span>'+
            '<span id="image_selected" class="radius secondary label hidden">'+tr("You selected the following image: ")+
            '</span>'+
            '<span class="radius label" type="text" id="IMAGE" name="image"></span>'+
            '<input type="hidden" id="IMAGE_ID" name="image_id" size="2"/>'+
          '</div>'+
          '<hr>'+
        '<div class="show_hide" id="advanced_image">'+
          '<h4><small><i class=" icon-caret-down"/> '+tr("Advanced options")+'<a id="add_os_boot_opts" class="icon_left" href="#"></a></small></h4>'+
        '</div>'+
        '<div class="advanced">'+
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
                  '<div class="tip">'+tr("Device to map image disk. If set, it will overwrite the default device mapping")+'<br><br>\
                      '+tr("Xen: Optional")+'<br>\
                      '+tr("KVM: Optional")+'<br>\
                      '+tr("VMWare: Optional")+
                  '</div>'+
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
                    '<div class="tip">'+tr("Specific image mapping driver")+'<br><br>\
                      '+tr("Xen: Optional (tap:aio:, file:)")+'<br>\
                      '+tr("KVM: Optional (raw, qcow2)")+'<br>\
                      '+tr("VMWare: Not supported")+
                    '</div>'+
                '</div>'+
              '</div>'+
            '</div>'+
          '</div>'+
          '<div class="row advanced vm_param">'+
            '<div class="six columns">'+
              '<div class="row">'+
                '<div class="four columns">'+
                  '<label class="right inline" for="DEV_PREFIX">'+tr("DEV_PREFIX")+':</label>'+
                '</div>'+
                '<div class="six columns">'+
                  '<input type="text" id="DEV_PREFIX" name="DEV_PREFIX"/>'+
                '</div>'+
                '<div class="two columns">'+
                  '<div class="tip">'+tr("Prefix for the emulated device this image will be mounted at. For instance, “hd”, “sd”, or “vd” for KVM virtio. If omitted, the dev_prefix attribute of the Image will be used")+'<br><br>\
                      '+tr("Xen: Optional")+'<br>\
                      '+tr("KVM: Optional")+'<br>\
                      '+tr("VMWare: Optional")+
                  '</div>'+
                '</div>'+
              '</div>'+
            '</div>'+
            '<div class="six columns">'+
              '<div class="row">'+
                '<div class="four columns">'+
                    '<label class="right inline" for="READONLY">'+tr("READONLY")+':</label>'+
                '</div>'+
                '<div class="six columns">'+
                    '<select id="READONLY" name="READONLY">'+
                      '<option value=""></option>'+
                      '<option value="yes">'+tr("yes")+'</option>'+
                      '<option value="no">'+tr("no")+'</option>'+
                    '</select>'+
                '</div>'+
                '<div class="two columns">'+
                    '<div class="tip">'+tr("Set how the image is exposed by the hypervisor")+'<br><br>\
                      '+tr("Xen: Optional")+'<br>\
                      '+tr("KVM: Optional")+'<br>\
                      '+tr("VMWare: Optional")+
                    '</div>'+
                '</div>'+
              '</div>'+
            '</div>'+
          '</div>'+
          '<div class="row advanced vm_param">'+
            '<div class="six columns">'+
              '<div class="row">'+
                '<div class="four columns">'+
                  '<label class="right inline" for="CACHE">'+tr("CACHE")+':</label>'+
                '</div>'+
                '<div class="six columns">'+
                    '<select id="CACHE" name="CACHE">'+
                      '<option value=""></option>'+
                      '<option value="default">'+tr("default")+'</option>'+
                      '<option value="none">'+tr("none")+'</option>'+
                      '<option value="writethrough">'+tr("writethrough")+'</option>'+
                      '<option value="writeback">'+tr("writeback")+'</option>'+
                      '<option value="directsync">'+tr("directsync")+'</option>'+
                      '<option value="unsafe">'+tr("unsafe")+'</option>'+
                    '</select>'+
                '</div>'+
                '<div class="two columns">'+
                  '<div class="tip">'+tr("Selects the cache mechanism for the disk.")+'<br><br>\
                      '+tr("Xen: Not supported")+'<br>\
                      '+tr("KVM: Optional")+'<br>\
                      '+tr("VMWare: Not supported")+
                  '</div>'+
                '</div>'+
              '</div>'+
            '</div>'+
            '<div class="six columns">'+
              '<div class="row">'+
                '<div class="four columns">'+
                    '<label class="right inline" for="IO">'+tr("IO")+':</label>'+
                '</div>'+
                '<div class="six columns">'+
                    '<select id="IO" name="IO">'+
                      '<option value=""></option>'+
                      '<option value="threads">'+tr("threads")+'</option>'+
                      '<option value="native">'+tr("native")+'</option>'+
                    '</select>'+
                '</div>'+
                '<div class="two columns">'+
                    '<div class="tip">'+tr("Set IO policy.")+'<br><br>\
                      '+tr("Xen: Not supported")+'<br>\
                      '+tr("KVM: Optional")+'<br>\
                      '+tr("VMWare: Not supported")+
                    '</div>'+
                '</div>'+
              '</div>'+
            '</div>'+
          '</div>'+
        '</div>'+
      '</div>'+
      '<div id="disk_type" class="volatile hidden">'+
        '<br>'+
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
            '<div class="vm_param">'+
                '<input type="hidden" id="SIZE" name="size" />'+
            '</div>'+
            '<div class="row">'+
                '<div class="two columns">'+
                  '<label class="inline right" for="SIZE_TMP">'+tr("SIZE")+':</label>'+
                '</div>'+
                '<div id="size_slider" class="five columns">'+
                '</div>'+
                '<div class="two columns">'+
                  '<input type="text" id="SIZE_TMP" name="size_tmp"/>'+
                '</div>'+
                '<div class="two columns">'+
                  '<select id="size_unit" name="SIZE_UNIT">'+
                      '<option value="GB">'+tr("GB")+'</option>'+
                      '<option value="MB">'+tr("MB")+'</option>'+
                  '</select>'+
                '</div>'+
                '<div class="one columns">'+
                  '<div class="tip">'+tr("Size of the new disk")+'</div>'+
                '</div>'+
            '</div>'+
        '<div class="show_hide" id="advanced_volatile">'+
          '<h4><small><i class=" icon-caret-down"/> '+tr("Advanced options")+'<a id="add_os_boot_opts" class="icon_left" href="#"></a></small></h4>'+
        '</div>'+
        '<div class="advanced">'+
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
                  '<div class="tip">'+tr("Device to map image disk. If set, it will overwrite the default device mapping")+'<br><br>\
                      '+tr("Xen: Optional")+'<br>\
                      '+tr("KVM: Optional")+'<br>\
                      '+tr("VMWare: Optional")+
                  '</div>'+
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
                    '<div class="tip">'+tr("Specific image mapping driver")+'<br><br>\
                      '+tr("Xen: Optional (tap:aio:, file:)")+'<br>\
                      '+tr("KVM: Optional (raw, qcow2)")+'<br>\
                      '+tr("VMWare: Not supported")+
                    '</div>'+
                '</div>'+
              '</div>'+
            '</div>'+
          '</div>'+
          '<div class="row advanced vm_param">'+
            '<div class="six columns">'+
              '<div class="row">'+
                '<div class="four columns">'+
                  '<label class="right inline" for="DEV_PREFIX">'+tr("DEV_PREFIX")+':</label>'+
                '</div>'+
                '<div class="six columns">'+
                  '<input type="text" id="DEV_PREFIX" name="DEV_PREFIX"/>'+
                '</div>'+
                '<div class="two columns">'+
                  '<div class="tip">'+tr("Prefix for the emulated device this image will be mounted at. For instance, “hd”, “sd”, or “vd” for KVM virtio. If omitted, the dev_prefix attribute of the Image will be used")+'<br><br>\
                      '+tr("Xen: Optional")+'<br>\
                      '+tr("KVM: Optional")+'<br>\
                      '+tr("VMWare: Optional")+
                  '</div>'+
                '</div>'+
              '</div>'+
            '</div>'+
            '<div class="six columns">'+
              '<div class="row">'+
                '<div class="four columns">'+
                    '<label class="right inline" for="READONLY">'+tr("READONLY")+':</label>'+
                '</div>'+
                '<div class="six columns">'+
                    '<select id="READONLY" name="READONLY">'+
                      '<option value=""></option>'+
                      '<option value="yes">'+tr("yes")+'</option>'+
                      '<option value="no">'+tr("no")+'</option>'+
                    '</select>'+
                '</div>'+
                '<div class="two columns">'+
                    '<div class="tip">'+tr("Set how the image is exposed by the hypervisor")+'<br><br>\
                      '+tr("Xen: Optional")+'<br>\
                      '+tr("KVM: Optional")+'<br>\
                      '+tr("VMWare: Optional")+
                    '</div>'+
                '</div>'+
              '</div>'+
            '</div>'+
          '</div>'+
          '<div class="row advanced vm_param">'+
            '<div class="six columns">'+
              '<div class="row">'+
                '<div class="four columns">'+
                  '<label class="right inline" for="CACHE">'+tr("CACHE")+':</label>'+
                '</div>'+
                '<div class="six columns">'+
                    '<select id="CACHE" name="CACHE">'+
                      '<option value=""></option>'+
                      '<option value="default">'+tr("default")+'</option>'+
                      '<option value="none">'+tr("none")+'</option>'+
                      '<option value="writethrough">'+tr("writethrough")+'</option>'+
                      '<option value="writeback">'+tr("writeback")+'</option>'+
                      '<option value="directsync">'+tr("directsync")+'</option>'+
                      '<option value="unsafe">'+tr("unsafe")+'</option>'+
                    '</select>'+
                '</div>'+
                '<div class="two columns">'+
                  '<div class="tip">'+tr("Selects the cache mechanism for the disk.")+'<br><br>\
                      '+tr("Xen: Not supported")+'<br>\
                      '+tr("KVM: Optional")+'<br>\
                      '+tr("VMWare: Not supported")+
                  '</div>'+
                '</div>'+
              '</div>'+
            '</div>'+
            '<div class="six columns">'+
              '<div class="row">'+
                '<div class="four columns">'+
                    '<label class="right inline" for="IO">'+tr("IO")+':</label>'+
                '</div>'+
                '<div class="six columns">'+
                    '<select id="IO" name="IO">'+
                      '<option value=""></option>'+
                      '<option value="threads">'+tr("threads")+'</option>'+
                      '<option value="native">'+tr("native")+'</option>'+
                    '</select>'+
                '</div>'+
                '<div class="two columns">'+
                    '<div class="tip">'+tr("Set IO policy.")+'<br><br>\
                      '+tr("Xen: Not supported")+'<br>\
                      '+tr("KVM: Optional")+'<br>\
                      '+tr("VMWare: Not supported")+
                    '</div>'+
                '</div>'+
              '</div>'+
            '</div>'+
          '</div>'+
        '</div>'+
    '</div>';

    $("#refresh_template_images_table_button_class"+str_disk_tab_id).die();

    $("#refresh_template_images_table_button_class"+str_disk_tab_id).live('click', function(){
        // Retrieve the images to fill the datatable
        OpenNebula.Image.list({
          timeout: true,
          success: function (request, images_list){
            var image_list_array = [];

            $.each(images_list,function(){
              var image_element_array = imageElementArray(this);
              if (image_element_array)
                    image_list_array.push(image_element_array);
            });

            var dataTable_template_images = $('table[id='+str_datatable_id+']').dataTable();
            updateView(image_list_array, dataTable_template_images);
            }
        });
      }
    );

    return html;
}

function setup_disk_tab_content(disk_section, str_disk_tab_id, str_datatable_id) {
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


    // Define the size slider

    var final_size_input = $( "#SIZE", disk_section );
    var size_input = $( "#SIZE_TMP", disk_section );
    var size_unit  = $( "#size_unit", disk_section );

    var current_size_unit = size_unit.val();

    var update_final_size_input = function() {
        if (current_size_unit == 'MB') {
            final_size_input.val( Math.floor(size_input.val()) );
        }
        else {
            final_size_input.val( Math.floor(size_input.val() * 1024) );
        }
    }

    var size_slider_change = function(type) {
        if ( type != "move")
        {
            var values = $(this).val();

            size_input.val(values / 100);

            update_final_size_input();
        }
    };

    var size_slider = $( "#size_slider", disk_section).noUiSlider({
        handles: 1,
        connect: "lower",
        range: [0,5000],
        start: 1,
        step: 50,
        slide: size_slider_change,
    });

    size_slider.addClass("noUiSlider");

    size_input.change(function() {
        size_slider.val(this.value * 100)

        update_final_size_input();
    });

    size_input.val(10);
    update_final_size_input();

    // init::start is ignored for some reason
    size_slider.val(1000);

    size_unit.change(function() {
        var size_unit_val = $('#size_unit :selected', disk_section).val();

        if (current_size_unit != size_unit_val)
        {
            current_size_unit = size_unit_val

            if (size_unit_val == 'GB') {

                size_slider.empty().noUiSlider({
                    handles: 1,
                    connect: "lower",
                    range: [0,5000],
                    start: 1,
                    step: 50,
                    slide: size_slider_change,
                });

                var new_val = size_input.val() / 1024;

                size_input.val( new_val );
                size_slider.val(new_val * 100);
            }
            else if (size_unit_val == 'MB') {

                size_slider.empty().noUiSlider({
                    handles: 1,
                    connect: "lower",
                    range: [0,204800],
                    start: 1,
                    step: 12800,
                    slide: size_slider_change,
                });

                var new_val = Math.round( size_input.val() * 1024 );

                size_input.val( new_val );
                size_slider.val(new_val * 100);
            }

            update_final_size_input();
        }
    });


    var dataTable_template_images = $('#'+str_datatable_id, disk_section).dataTable({
        "bSortClasses": false,
        "bAutoWidth":false,
        "iDisplayLength": 4,
        "sDom" : '<"H">t<"F"p>',
        "oColVis": {
            "aiExclude": [ 0 ]
        },
        "aoColumnDefs": [
            { "sWidth": "35px", "aTargets": [0] },
            { "bVisible": false, "aTargets": [0,2,3,6,9,8,12]}
        ],
        "oLanguage": (datatable_lang != "") ?
            {
                sUrl: "locale/"+lang+"/"+datatable_lang
            } : ""
    });

    //addElement([spinner,'','','','','','','','','','','',''],dataTable_template_images);

    // Retrieve the images to fill the datatable
    OpenNebula.Image.list({
      timeout: true,
      success: function (request, images_list){
          var image_list_array = [];

          $.each(images_list,function(){
            var image = imageElementArray(this);
            if (image)
              image_list_array.push(image);
          });

          updateView(image_list_array, dataTable_template_images);
      },
      error: onError
    });

    $('#'+str_disk_tab_id+'_search', disk_section).keyup(function(){
      dataTable_template_images.fnFilter( $(this).val() );
    })

    // TBD Add refresh button for the datatable

    // When a row is selected the background color is updated. If a previous row
    // was selected (previous_row) the background color is removed.
    // #IMAGE and #IMAGE_ID inputs are updated using the row information
    if (typeof previous_row === 'undefined') {
        var previous_row = 0;
    }

    $('#'+str_datatable_id + '  tbody', disk_section).delegate("tr", "click", function(e){
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

        $('.alert-box', disk_section).hide();

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
}


function generate_nic_tab_content(str_nic_tab_id, str_datatable_id){
  var html = '<div class="row">'+
    '<div class="seven columns">' +
       '<button id="refresh_template_nic_table_button_class'+str_nic_tab_id+'" type="button" class="button small radius secondary"><i class="icon-refresh" /></button>' +
    '</div>' +
    '<div class="five columns">'+
      '<input id="'+str_nic_tab_id+'_search" type="text" placeholder="'+tr("Search")+'"/>'+
    '</div>'+
  '</div>'+
    '<table id="'+str_datatable_id+'" class="datatable twelve">'+
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
          '<th>'+tr("Leases")+'</th>'+
        '</tr>'+
      '</thead>'+
      '<tbody id="tbodynetworks">'+
      '</tbody>'+
    '</table>'+
    '<br>'+
    '<div class="vm_param kvm_opt xen_opt vmware_opt">'+
      '<span id="select_network" class="radius secondary label">'+tr("Please select a network from the list")+'</span>'+
      '<span id="network_selected" class="radius secondary label hidden">'+tr("You selected the following network:")+
      '</span>'+
      '<span class="radius label" type="text" id="NETWORK" name="network"></span>'+
      '<input type="hidden" id="NETWORK_ID" name="network_id" size="2"/>'+
    '</div>'+
  '<hr>'+
    '<div class="show_hide" id="advanced">'+
          '<h4><small><i class=" icon-caret-down"/> '+tr("Advanced options")+'<a id="add_os_boot_opts" class="icon_left" href="#"></a></small></h4>'+
    '</div>'+
    '<div class="advanced">'+
      '<div class="row">'+
        '<div class="six columns">'+
          '<div class="row">'+
            '<div class="four columns">'+
              '<label class="right inline" for="IP">'+tr("IP")+':</label>'+
            '</div>'+
            '<div class="six columns vm_param">'+
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
            '<div class="six columns vm_param">'+
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
              '<div class="tip">'+tr("A list of ports separated by commas or a ranges separated by semicolons, e.g.: 22,80,5900:6000")+'</div>'+
          '</div>'+
        '</div>'+
      '</fieldset>'+
    '</div>'+
    '<div class="six columns">'+
      '<fieldset>'+
        '<legend>'+tr("UDP Firewall")+'</legend>'+
        '<div class="row">'+
          '<div class="four columns push-two">'+
            '<input type="radio" name="udp_type" id="udp_type" value="WHITE_PORTS_UDP"> '+tr("Whitelist")+
          '</div>'+
          '<div class="four columns pull-two">'+
            '<input type="radio" name="udp_type" id="udp_type" value="BLACK_PORTS_UDP"> '+tr("Blacklist")+
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
              '<div class="tip">'+tr("A list of ports separated by commas or a ranges separated by semicolons, e.g.: 22,80,5900:6000")+'</div>'+
          '</div>'+
        '</div>'+
      '</fieldset>'+
    '</div>'+
    '</div>'+
      '<div class="row">'+
        '<div class="six columns">'+
      '<fieldset>'+
        '<legend>'+tr("ICMP")+'</legend>'+
          '<div class="row">'+
            '<div class="one columns">'+
              '<input type="checkbox" name="icmp_type" value="ICMP" id="icmp_type">'+
            '</div>'+
            '<div class="nine columns">'+
              '<label for="icmp_type">'+ tr("Drop")+'</label>'+
            '</div>'+
            '<div class="two columns">'+
            '</div>'+
          '</div>'+
      '</fieldset>'+
        '</div>'+
      '</div>'+
    '</div>';

    $("#refresh_template_nic_table_button_class"+str_nic_tab_id).die();

    $("#refresh_template_nic_table_button_class"+str_nic_tab_id).live('click', function(){
        // Retrieve the nics to fill the datatable
        OpenNebula.Network.list({
          timeout: true,
          success: function (request, networks_list){
          var network_list_array = [];

          $.each(networks_list,function(){
             network_list_array.push(vNetworkElementArray(this));
          });
          var dataTable_template_networks = $('table[id='+str_datatable_id+']').dataTable();
          updateView(network_list_array, dataTable_template_networks);
          }
        });
      }
    );

    return html;
}

function setup_nic_tab_content(nic_section, str_nic_tab_id, str_datatable_id) {
    var dataTable_template_networks = $('#'+str_datatable_id, nic_section).dataTable({
              "bSortClasses": false,
              "bAutoWidth":false,
              "iDisplayLength": 4,
              "sDom" : '<"H">t<"F"p>',
              "oColVis": {
                  "aiExclude": [ 0 ]
              },
              "aoColumnDefs": [
                  { "sWidth": "35px", "aTargets": [0,1] },
                  { "bVisible": false, "aTargets": [0, 7]}
              ],
              "oLanguage": (datatable_lang != "") ?
                  {
                      sUrl: "locale/"+lang+"/"+datatable_lang
                  } : ""
            });

    //addElement([spinner,'','','','','','','',''],dataTable_template_networks);

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


    $('#'+str_nic_tab_id+'_search', nic_section).keyup(function(){
      dataTable_template_networks.fnFilter( $(this).val() );
    })

  // TBD Add refresh button for the datatable

  // When a row is selected the background color is updated. If a previous row
  // was selected (previous_row) the background color is removed.
  // #IMAGE and #IMAGE_ID inputs are updated using the row information
  if (typeof previous_row === 'undefined') {
      var previous_row = 0;
  }

  $('#'+str_datatable_id + '  tbody', nic_section).delegate("tr", "click", function(e){
      if ($(e.target).is('input') ||
          $(e.target).is('select') ||
          $(e.target).is('option')) return true;

      var aData = dataTable_template_networks.fnGetData(this);

    if (previous_row) {
        $("td:first", previous_row).parent().children().each(function(){$(this).removeClass('markrow');});
    }
    else {
        $('#network_selected',  nic_section).toggle();
        $('#select_network',  nic_section).hide();
    }

        $('.alert-box', nic_section).hide();

      previous_row = this;
      $("td:first", this).parent().children().each(function(){$(this).addClass('markrow');});

      $('#NETWORK', nic_section).text(aData[4]);
      $('#NETWORK_ID', nic_section).val(aData[1]);
      return false;
  });


  $('.advanced', nic_section).hide();

  $('#advanced', nic_section).click(function(){
      $('.advanced', nic_section).toggle();
      return false;
  });

  setupTips(nic_section);
}






// Callback to update the information panel tabs and pop it up
function updateTemplateInfo(request,template){
    var template_info = template.VMTEMPLATE;
    var info_tab = {
        title: tr("Information"),
        content:
        '<div class="">\
         <div class="six columns">\
         <table id="info_template_table" class="twelve datatable extended_table">\
             <thead>\
               <tr><th colspan="2">'+tr("Template")+" - "+template_info.NAME+'</th><th></th></tr>\
             </thead>\
             <tr>\
               <td class="key_td">'+tr("ID")+'</td>\
               <td class="value_td">'+template_info.ID+'</td>\
               <td>\
             </tr>\
             <tr>\
               <td class="key_td">'+tr("Name")+'</td>\
               <td class="value_td_rename">'+template_info.NAME+'</td>\
               <td><div id="div_edit_rename">\
                      <a id="div_edit_rename_link" class="edit_e" href="#"><i class="icon-edit right"/></a>\
                   </div>\
               </td>\
             </tr>\
             <tr>\
               <td class="key_td">'+tr("Register time")+'</td>\
               <td class="value_td">'+pretty_time(template_info.REGTIME)+'</td>\
               <td></td>\
             </tr>\
            </table>\
        </div>\
        <div class="six columns">' + insert_permissions_table('templates-tab',
                                                              "Template",
                                                              template_info.ID,
                                                              template_info.UNAME,
                                                              template_info.GNAME,
                                                              template_info.UID,
                                                              template_info.GID) +
        '</div>\
      </div>'
    };
    var template_tab = {
        title: tr("Template"),
        content: '<div class="twelve columns">\
            <table id="template_template_table" class="info_table transparent_table" style="width:80%">'+
            prettyPrintJSON(template_info.TEMPLATE)+'\
            </table>\
        </div>'
    };

    $("#div_edit_rename_link").die();
    $(".input_edit_value_rename").die();

    // Listener for key,value pair edit action
    $("#div_edit_rename_link").live("click", function() {
        var value_str = $(".value_td_rename").text();
        $(".value_td_rename").html('<input class="input_edit_value_rename" type="text" value="'+value_str+'"/>');
    });

    $(".input_edit_value_rename").live("change", function() {
        var value_str = $(".input_edit_value_rename").val();
        if(value_str!="")
        {
            // Let OpenNebula know
            var name_template = {"name": value_str};
            Sunstone.runAction("Template.rename",template_info.ID,name_template);
        }
    });


    Sunstone.updateInfoPanelTab("template_info_panel","template_info_tab",info_tab);
    Sunstone.updateInfoPanelTab("template_info_panel","template_template_tab",template_tab);

    Sunstone.popUpInfoPanel("template_info_panel", "templates-tab");

    // Populate permissions grid
    setPermissionsTable(template_info,'');

    $("#template_info_panel_refresh", $("#template_info_panel")).click(function(){
      $(this).html(spinner);
      Sunstone.runAction('Template.showinfo', template_info.ID);
    })
}

//Given the JSON of a VM template (or of a section of it), it crawls
//the fields of certain section (context) and add their name and
//values to the template JSON.
function addSectionJSON(template_json,context){
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
    var add_capacityTab = function(){
        var html_tab_content = '<li id="capacityTab" class="active wizard_tab">'+
          generate_capacity_tab_content() +
        '</li>'


        $("<dd class='active'><a href='#capacity'>General</a></dd>").appendTo($("dl#template_create_tabs"));
        $(html_tab_content).appendTo($("ul#template_create_tabs_content"));

        var capacity_section = $('li#capacityTab', dialog);
        setup_capacity_tab_content(capacity_section);
    }

    /**************************************************************************
        DISK TAB

    **************************************************************************/


    var number_of_disks = 0;
    var disks_index     = 0;

    var add_disks_tab = function() {
        var html_tab_content = '<li id="storageTab" class="wizard_tab">'+
          '<dl class="tabs" id="template_create_storage_tabs">'+
            '<dt><button type="button" class="button tiny radius" id="tf_btn_disks"><span class="icon-plus"></span>'+tr("Add another disk")+'</button></dt>'+
          '</dl>'+
          '<ul class="tabs-content" id="template_create_storage_tabs_content">'+
          '</ul>'+
        '</li>';

        $("<dd><a href='#storage'>"+tr("Storage")+"</a></dd>").appendTo($("dl#template_create_tabs"));
        $(html_tab_content).appendTo($("ul#template_create_tabs_content"));


        // close icon: removing the tab on click
        $( "#storageTab i.remove-tab" ).live( "click", function() {
            var target = $(this).parent().attr("href");
            var dd = $(this).closest('dd');
            var dl = $(this).closest('dl');
            var content = $(target + 'Tab');

            dd.remove();
            content.remove();

            if (dd.attr("class") == 'active') {
                dl.foundationTabs("set_tab", dl.children('dd').last());
            }

            disks_index--;
        });

        add_disk_tab(number_of_disks);

        $("#tf_btn_disks").bind("click", function(){
        add_disk_tab(number_of_disks);
        });
    }

     var add_disk_tab = function(disk_id) {
        var str_disk_tab_id  = 'disk' + disk_id;
        var str_datatable_id = 'datatable_template_images' + disk_id;

        // Append the new div containing the tab and add the tab to the list
        var html_tab_content = '<li id="'+str_disk_tab_id+'Tab" class="disk wizard_internal_tab">'+
          generate_disk_tab_content(str_disk_tab_id, str_datatable_id) +
        '</li>'
        $(html_tab_content).appendTo($("ul#template_create_storage_tabs_content"));

        var a = $("<dd>\
          <a id='disk_tab"+str_disk_tab_id+"' href='#"+str_disk_tab_id+"'>"+tr("DISK")+" <i class='icon-remove-sign remove-tab'></i></a>\
        </dd>").appendTo($("dl#template_create_storage_tabs"));

        $(document).foundationTabs("set_tab", a);

        $("#disk_tab"+str_disk_tab_id).live('click', function(){
          $("#refresh_template_images_table_button_class"+str_disk_tab_id).click();
        });


        var disk_section = $('li#' +str_disk_tab_id+'Tab', dialog);
        setup_disk_tab_content(disk_section, str_disk_tab_id, str_datatable_id)

        number_of_disks++;
        disks_index++;
      }

    /**************************************************************************
        NETWORK TAB

    **************************************************************************/

    var number_of_nics = 0;
    var nics_index     = 0;

    var add_nics_tab = function() {
        var html_tab_content = '<li id="networkTab" class="wizard_tab">'+
          '<dl class="tabs" id="template_create_network_tabs">'+
            '<dt><button type="button" class="button tiny radius" id="tf_btn_nics"><span class="icon-plus"></span> '+tr("Add another nic")+'</button></dt>'+
          '</dl>'+
          '<ul class="tabs-content" id="template_create_network_tabs_content">'+
          '</ul>'+
        '</li>';

        $("<dd><a href='#network'>"+tr("Network")+"</a></dd>").appendTo($("dl#template_create_tabs"));
        $(html_tab_content).appendTo($("ul#template_create_tabs_content"));

        // close icon: removing the tab on click
        $( "#networkTab i.remove-tab" ).live( "click", function() {
            var target = $(this).parent().attr("href");
            var dd = $(this).closest('dd');
            var dl = $(this).closest('dl');
            var content = $(target + 'Tab');

            dd.remove();
            content.remove();

            if (dd.attr("class") == 'active') {
                dl.foundationTabs("set_tab", dl.children('dd').last());
            }

            disks_index--;
        });

        add_nic_tab();

        $("#tf_btn_nics").bind("click", function(){
            add_nic_tab();
        });
    }

    var add_nic_tab = function() {
      var str_nic_tab_id  = 'nic' + number_of_nics;
      var str_datatable_id = 'datatable_template_networks' + number_of_nics;

      var html_tab_content = '<li id="'+str_nic_tab_id+'Tab" class="nic wizard_internal_tab">'+
          generate_nic_tab_content(str_nic_tab_id, str_datatable_id) +
        '</li>'

      // Append the new div containing the tab and add the tab to the list
      var a = $("<dd><a id='nic_tab"+str_nic_tab_id+"' href='#"+str_nic_tab_id+"'>"+tr("NIC")+" <i class='icon-remove-sign remove-tab'></i></a></dd>").appendTo($("dl#template_create_network_tabs"));

      $(html_tab_content).appendTo($("ul#template_create_network_tabs_content"));

      $(document).foundationTabs("set_tab", a);

      $('#nic_tab'+str_nic_tab_id).live('click', function(){
           $("#refresh_template_nic_table_button_class"+str_nic_tab_id).click();
      });

      var nic_section = $('li#' + str_nic_tab_id + 'Tab', dialog);
      setup_nic_tab_content(nic_section, str_nic_tab_id, str_datatable_id)

      number_of_nics++;
      nics_index++;
    }

    /**************************************************************************
        OS TAB

    **************************************************************************/

    var add_osTab = function() {
      var html_tab_content = '<li id="osTab" class="wizard_tab">'+
      '<form>'+
        '<div id="tabs-bootos">'+
          '<dl class="tabs">'+
            '<dd class="active"><a href="#boot">'+tr("Boot")+'</a></dd>'+
            '<dd><a href="#kernel">'+tr("Kernel")+'</a></dd>'+
            '<dd><a href="#ramdisk">'+tr("Ramdisk")+'</a></dd>'+
            '<dd><a href="#features">'+tr("Features")+'</a></dd>'+
          '</dl>'+
          '<ul class="tabs-content">'+
          '<li class="wizard_internal_tab active" id="bootTab">'+
            '<div class="six columns vm_param">'+
                '<div class="row">'+
                  '<div class="four columns">'+
                    '<label class="right inline" for="ARCH">'+tr("Arch")+':</label>'+
                  '</div>'+
                  '<div class="six columns">'+
                    '<select id="ARCH" name="arch">'+
                        '<option id="no_arch" name="no_arch" value=""></option>'+
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
            '<div class="six columns vm_param">'+
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
          '</li>'+
          '<li id="kernelTab" class="wizard_internal_tab">'+
                '<div class="row">'+
                  '<div class="three columns push-three">'+
                    '<input id="radioKernelDs" type="radio" name="kernel_type" value="kernel_ds" checked> '+tr("Registered Image")+
                  '</div>'+
                  '<div class="three columns pull-three">'+
                    '<input id="radioKernelPath" type="radio" name="kernel_type" value="kernel_path"> '+tr("Remote PATH")+
                  '</div>'+
                '</div>'+
                '<hr>'+
                '<div class="row kernel_ds">'+
                  '<div class="row collapse ">'+
                      '<div class="seven columns">' +
                         '<button id="refresh_kernel_table" type="button" class="button small radius secondary"><i class="icon-refresh" /></button>' +
                      '</div>' +
                    '<div class="five columns">'+
                      '<input id="kernel_search" type="text" placeholder="'+tr("Search")+'"/>'+
                    '</div>'+
                  '</div>'+
                  '<table id="datatable_kernel" class="datatable twelve">'+
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
                  '<div id="kernel_ds_inputs"  class="vm_param kvm_opt xen_opt vmware_opt">'+
                    '<span id="select_image" class="radius secondary label">'+tr("Please select a Kernel from the list")+'</span>'+
                    '<span id="image_selected" class="radius secondary label hidden">'+tr("You selected the following Kernel: ")+
                    '</span>'+
                    '<span class="radius label" type="text"  id="KERNEL" name="kernel""></span>'+
                    '<input type="hidden" id="KERNEL_DS" name="kernel_ds" s size="2"/>'+
                  '</div>'+
                '</div>'+
              '<div id="kernel_path_inputs" class="kernel_path hidden row">'+
                  '<div class="two columns">'+
                    '<label class="right inline" for="KERNEL">'+tr("PATH")+':</label>'+
                  '</div>'+
                  '<div class="eight columns">'+
                    '<input type="text" id="KERNEL" name="kernel" />'+
                  '</div>'+
                  '<div class="two columns">'+
                    '<div class="tip">'+tr("Path to the OS kernel to boot the image")+'</div>'+
                  '</div>'+
                '</div>'+
            '</li>'+
            '<li id="ramdiskTab" class="wizard_internal_tab">'+
                '<div class="row">'+
                  '<div class="three columns push-three">'+
                    '<input id="radioInintrdDs" type="radio" name="initrd_type" value="initrd_ds" checked> '+tr("Registered Image ") +
                  '</div>'+
                  '<div class="three columns pull-three">'+
                    '<input id="radioInitrdPath" type="radio" name="initrd_type" value="initrd_path"> '+tr("Remote PATH")+
                  '</div>'+
                '</div>'+
                '<hr>'+
                '<div class="row initrd_ds">'+
                  '<div class="row collapse ">'+
                      '<div class="seven columns">' +
                         '<button id="refresh_ramdisk_table" type="button" class="button small radius secondary"><i class="icon-refresh" /></button>' +
                      '</div>' +
                    '<div class="five columns">'+
                      '<input id="initrd_search" type="text" placeholder="'+tr("Search")+'"/>'+
                    '</div>'+
                  '</div>'+
                  '<table id="datatable_initrd" class="datatable twelve">'+
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
                  '<div class="vm_param kvm_opt xen_opt vmware_opt">'+
                    '<span id="select_image" class="radius secondary label">'+tr("Please select a Ramdisk from the list")+'</span>'+
                    '<span id="image_selected" class="radius secondary label hidden">'+tr("You selected the following Ramdisk: ")+
                    '</span>'+
                    '<span class="radius label" type="text" id="INITRD" name="initrd"></span>'+
                    '<input type="hidden"id="INITRD_DS" name="initrd_id" size="2"/>'+
                  '</div>'+
                '</div>'+
              '<div id="initrd_path_inputs" class="initrd_path hidden row">'+
                  '<div class="two columns">'+
                    '<label class="right inline" for="INITRD">'+tr("PATH")+':</label>'+
                  '</div>'+
                  '<div class="eight columns">'+
                    '<input type="text" id="INITRD" name="initrd"/>'+
                  '</div>'+
                  '<div class="two columns">'+
                    '<div class="tip">'+tr("Path to the initrd image")+'</div>'+
                  '</div>'+
                '</div>'+
            '</li>'+
          '<li class="wizard_internal_tab active" id="featuresTab">'+
            '<div class="six columns vm_param">'+
                '<div class="row">'+
                  '<div class="four columns">'+
                    '<label class="right inline" for="ACPI">'+tr("ACPI")+':</label>'+
                  '</div>'+
                  '<div class="six columns">'+
                    '<select id="ACPI" name="acpi">'+
                        '<option id="no_apci" name="no_apci" value=""></option>'+
                        '<option value="yes">'+tr("Yes")+'</option>'+
                        '<option value="no">'+tr("No")+'</option>'+
                    '</select>'+
                  '</div>'+
                  '<div class="two columns">'+
                    '<div class="tip">'+tr("Add support in the VM for Advanced Configuration and Power Interface (ACPI)")+'</div>'+
                  '</div>'+
                '</div>'+
                '<div class="row">'+
                  '<div class="four columns">'+
                    '<label class="right inline" for="PAE">'+tr("PAE")+':</label>'+
                  '</div>'+
                  '<div class="six columns">'+
                    '<select id="PAE" name="pae">'+
                      '<option id="no_pae" name="no_pae" value=""></option>'+
                        '<option value="yes">'+tr("Yes")+'</option>'+
                        '<option value="no">'+tr("No")+'</option>'+
                    '</select>'+
                  '</div>'+
                  '<div class="two columns">'+
                    '<div class="tip">'+tr("Add support in the VM for Physical Address Extension (PAE)")+'</div>'+
                  '</div>'+
                '</div>'+
          '</li>'+
            '</ul>'+
      '</form>'+
        '</li>'

      $("#refresh_kernel_table").die();

      $("#refresh_kernel_table").live('click', function(){

          OpenNebula.Image.list({
          timeout: true,
          success: function (request, images_list){
              var image_list_array = [];

              $.each(images_list,function(){
                var file = fileElementArray(this);
                if (file)
                  image_list_array.push(file);
              });

              var dataTable_template_kernel = $('#datatable_kernel').dataTable();
              updateView(image_list_array, dataTable_template_kernel);
              dataTable_template_kernel.fnFilter("KERNEL", 7)
          },
          error: onError
        });
        });

      $("#refresh_ramdisk_table").die();

      $("#refresh_ramdisk_table").live('click', function(){

           OpenNebula.Image.list({
            timeout: true,
            success: function (request, images_list){
                var image_list_array = [];

                $.each(images_list,function(){
                  var file = fileElementArray(this);
                  if (file)
                    image_list_array.push(file);
                });

                var datTable_template_initrd = $('#datatable_initrd').dataTable();
                updateView(image_list_array, datTable_template_initrd);
                datTable_template_initrd.fnFilter("RAMDISK", 7)
            },
            error: onError
           });
        });


        $("<dd><a href='#os'>OS Booting</a></dd>").appendTo($("dl#template_create_tabs"));
        $(html_tab_content).appendTo($("ul#template_create_tabs_content"));

      var os_section = $('li#osTab', dialog);

      //$('#tabs-bootos', os_section).tabs();

        // Select Image or Volatile disk. The div is hidden depending on the selection, and the
        // vm_param class is included to be computed when the template is generated.
        $("input[name='kernel_type']").change(function(){
          if ($("input[name='kernel_type']:checked").val() == "kernel_ds") {
              $("div.kernel_ds",  os_section).toggle();
              $("div#kernel_ds_inputs",  os_section).addClass('vm_param');
              $("div.kernel_path",  os_section).hide();
              $("div#kernel_path_inputs",  os_section).removeClass('vm_param');
          }
          else {
              $("div.kernel_ds",  os_section).hide();
              $("div#kernel_ds_inputs",  os_section).removeClass('vm_param');
              $("div.kernel_path",  os_section).toggle();
              $("div#kernel_path_inputs",  os_section).addClass('vm_param');
          }
        });

        $("input[name='initrd_type']").change(function(){
          if ($("input[name='initrd_type']:checked").val() == "initrd_ds") {
              $("div.initrd_ds",  os_section).toggle();
              $("div#initrd_ds_inputs",  os_section).addClass('vm_param');
              $("div.initrd_path",  os_section).hide();
              $("div#initrd_path_inputs",  os_section).removeClass('vm_param');
          }
          else {
              $("div.initrd_ds",  os_section).hide();
              $("div#initrd_ds_inputs",  os_section).removeClass('vm_param');
              $("div.initrd_path",  os_section).toggle();
              $("div#initrd_path_inputs",  os_section).addClass('vm_param');
          }
        });

        var dataTable_template_kernel = $('#datatable_kernel', dialog).dataTable({
            "bSortClasses": false,
            "bAutoWidth":false,
            "sDom" : '<"H">t<"F"p>',
            "iDisplayLength": 4,
            "oColVis": {
                "aiExclude": [ 0 ]
            },
            "aoColumnDefs": [
                { "sWidth": "35px", "aTargets": [0,1] },
                { "bVisible": false, "aTargets": [0,3,2,5,6,7,9,8,11,12,10]}
            ],
            "oLanguage": (datatable_lang != "") ?
                {
                    sUrl: "locale/"+lang+"/"+datatable_lang
                } : ""
        });


        //addElement([spinner,'','','','','','','','','','','',''],dataTable_template_kernel);

        // Retrieve the images to fill the datatable
        OpenNebula.Image.list({
          timeout: true,
          success: function (request, images_list){
              var image_list_array = [];

              $.each(images_list,function(){
                var file = fileElementArray(this);
                if (file)
                  image_list_array.push(file);
              });

              updateView(image_list_array, dataTable_template_kernel);
              dataTable_template_kernel.fnFilter("KERNEL", 7)
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

            $('.kernel_ds .alert-box', os_section).hide();

            $('#KERNEL', os_section).text(aData[4]);
            $('#KERNEL_DS', os_section).val("$FILE[IMAGE_ID="+ aData[1] +"]");
            return false;
        });

        $('#kernel_search', dialog).keyup(function(){
          dataTable_template_kernel.fnFilter( $(this).val() );
        })

          var datTable_template_initrd = $('#datatable_initrd', dialog).dataTable({
            "bSortClasses": false,
            "bAutoWidth":false,
            "iDisplayLength": 4,
            "sDom" : '<"H">t<"F"p>',
            "oColVis": {
                "aiExclude": [ 0 ]
            },
            "aoColumnDefs": [
                { "sWidth": "35px", "aTargets": [0,1] },
                { "bVisible": false, "aTargets": [0,2,3,5,6,7,9,8,10,11,12]}
            ],
            "oLanguage": (datatable_lang != "") ?
                {
                    sUrl: "locale/"+lang+"/"+datatable_lang
                } : ""
        });

        //addElement([spinner,'','','','','','','','','','','',''],datTable_template_initrd);

        // Retrieve the images to fill the datatable
        OpenNebula.Image.list({
          timeout: true,
          success: function (request, images_list){
              var image_list_array = [];

              $.each(images_list,function(){
                var file = fileElementArray(this);
                if (file)
                  image_list_array.push(file);
              });

              updateView(image_list_array, datTable_template_initrd);
              datTable_template_initrd.fnFilter("RAMDISK", 7)
          },
          error: onError
        });

        $('#initrd_search', dialog).keyup(function(){
          datTable_template_initrd.fnFilter( $(this).val() );
        })

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

            $('.initrd_ds .alert-box', os_section).hide();

            $('#INITRD', os_section).text(aData[4]);
            $('#INITRD_DS', os_section).val("$FILE[IMAGE_ID="+ aData[1] +"]");
            return false;
        });

        // Hide image advanced options
        $('fieldset.advanced', $('div#advanced_os')).hide();

        $('#advanced_os', dialog).click(function(){
            $('fieldset.advanced', $('div##advanced_os')).toggle();
            return false;
        });
    }


    /**************************************************************************
        INPUT/OUTPUT TAB

    **************************************************************************/

    var add_ioTab = function() {
      var html_tab_content = '<li id="ioTab" class="wizard_tab">'+
        '<form>'+
          '<div class="row">'+
          '<div class="six columns graphics">'+
            '<fieldset>'+
              '<legend>'+tr("Graphics")+'</legend>'+
              '<div class="row">'+
              '<div class="eleven columns centered">'+
              '<div class="row">'+
                '<div class="four columns">'+
                    '<input type="radio" name="graphics_type" ID="radioVncType" value="VNC"> VNC '+
                '</div>'+
                '<div class="four columns">'+
                    '<input type="radio" name="graphics_type" ID="radioSdlType" value="SDL"> SDL'+
                '</div>'+
                '<div class="four columns">'+
                    '<input type="radio" name="graphics_type" ID="radioSpiceType" value="SPICE"> SPICE'+
                '</div>'+
                '</div>'+
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
                '<div class="five columns">'+
                  '<select id="TYPE" name="input_type">'+
                      '<option id="no_type" name="no_type" value=""></option>'+
                        '<option value="mouse">'+tr("Mouse")+'</option>'+
                        '<option value="tablet">'+tr("Tablet")+'</option>'+
                  '</select>'+
                '</div>'+
                '<div class="four columns">'+
                  '<select id="BUS" name="input_bus">'+
                      '<option id="no_input" name="no_input" value=""></option>'+
                      '<option value="usb">'+tr("USB")+'</option>'+
                      '<option value="ps2">'+tr("PS2")+'</option>'+
                      '<option value="xen">'+tr("XEN")+'</option>'+
                  '</select>'+
                '</div>'+
                '<div class="three columns">'+
                    '<button type="button" class="button tiny radius" id="add_input">'+tr("Add")+'</button>'+
                '</div>'+
              '</div>'+
              '<hr>'+
              '<div class="">'+
              '<table id="input_table" class="twelve">'+
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
      '</li>'


        $("<dd><a href='#io'>Input/Output</a></dd>").appendTo($("dl#template_create_tabs"));
        $(html_tab_content).appendTo($("ul#template_create_tabs_content"));

      $("input[name='graphics_type']").change(function(){
        $("#TYPE", $('li#ioTab .graphics')).val($(this).attr("value"))
        $("#LISTEN", $('li#ioTab')).val("0.0.0.0")
      });

      $('#add_input', $('li#ioTab')).click(function() {
          var table = $('#input_table', $('li#ioTab'))[0];
          var rowCount = table.rows.length;
          var row = table.insertRow(-1);
          $(row).addClass("vm_param");

          var cell1 = row.insertCell(0);
          var element1 = document.createElement("input");
          element1.id = "TYPE"
          element1.type = "text";
          element1.value = $('select#TYPE', $('li#ioTab')).val()
          cell1.appendChild(element1);

          var cell2 = row.insertCell(1);
          var element2 = document.createElement("input");
          element2.id = "BUS"
          element2.type = "text";
          element2.value = $('select#BUS', $('li#ioTab')).val()
          cell2.appendChild(element2);


          var cell3 = row.insertCell(2);
          cell3.innerHTML = "<i class='icon-remove-sign icon-large remove-tab'></i>";
      });

      $( "#ioTab i.remove-tab" ).live( "click", function() {
          $(this).closest("tr").remove()
      });
    }

    /**************************************************************************
        CONTEXT TAB

    **************************************************************************/

    var add_contextTab = function() {
      var html_tab_content = '<li id="contextTab" class="wizard_tab">'+
        '<form>'+
            '<dl class="tabs">'+
              '<dd class="active"><a href="#netssh">'+tr("Network & SSH")+'</a></dd>'+
              '<dd><a href="#files">'+tr("Files")+'</a></dd>'+
              '<dd><a href="#zcustom">'+tr("Custom variables")+'</a></dd>'+
            '</dl>'+
            '<ul class="tabs-content">'+
                '<li class="wizard_internal_tab active" id="netsshTab">'+
                  '<div class="row">'+
                    '<div class="six columns">'+
                        '<fieldset>'+
                          '<legend>'+tr("SSH")+'</legend>'+
                          '<div class="">'+
                            '<div class="columns one">'+
                                '<input type="checkbox" name="ssh_context" id="ssh_context"  checked>'+
                            '</div>'+
                            '<div class="columns ten">'+
                                '<label class="inline" for="ssh_context">'+ tr("  Add SSH contextualization")+'</label>'+
                            '</div>'+
                            '<div class="columns one">'+
                                '<div class="tip">'+tr("Add an ssh public key to the context. If the Public Key textarea is empty then the user variable SSH_PUBLIC_KEY will be used.")+'</div>'+
                            '</div>'+
                          '</div>'+
                          '<div class="">'+
                            '<div class="twelve columns">'+
                                '<label for="ssh_puclic_key"> '+tr("Public Key")+':</label>'+
                            '</div>'+
                          '</div>'+
                          '<div class="">'+
                            '<div class="twelve columns">'+
                            '<textarea rows="4" type="text" id="ssh_puclic_key" name="ssh_puclic_key" />'+
                            '</div>'+
                          '</div>'+
                        '</fieldset>'+
                    '</div>'+
                    '<div class="six columns">'+
                        '<fieldset>'+
                            '<legend>'+tr("Network")+'</legend>'+
                            '<div class="">'+
                              '<div class="columns one">'+
                                  '<input type="checkbox" name="network_context" id="network_context" checked>'+
                              '</div>'+
                              '<div class="columns ten">'+
                                  '<label class="inline" for="network_context">'+ tr("  Add Network contextualization")+'</label>'+
                              '</div>'+
                              '<div class="columns one">'+
                                  '<div class="tip">'+tr("Add network contextualization parameters. For each NIC defined in the NETWORK section, ETH$i_IP, ETH$i_NETWORK... parameters will be included in the CONTEXT section and will be available in the Virtual Machine")+'</div>'+
                              '</div>'+
                            '</div>'+
                        '</fieldset>'+
                    '</div>'+
                  '</div>'+
                    '</li>'+
                '<li class="wizard_internal_tab" id="filesTab">'+
                        '<div class="row collapse ">'+
                          '<div class="seven columns">' +
                             '<button id="refresh_context_table" type="button" class="button small radius secondary"><i class="icon-refresh" /></button>' +
                          '</div>' +
                          '<div class="five columns">'+
                            '<input id="files_search" type="text" placeholder="'+tr("Search")+'"/>'+
                          '</div>'+
                        '</div>'+
                          '<table id="datatable_context" class="datatable twelve">'+
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
                      '<div class="vm_param kvm_opt xen_opt vmware_opt row" id="selected_files_spans">'+
                        '<span id="select_files" class="radius secondary label">'+tr("Please select files from the list")+'</span> '+
                        '<span id="files_selected" class="radius secondary label hidden">'+tr("You selected the following files:")+'</span> '+
                        '<input type="hidden" id="FILES_DS" name="files_ds" size="2"/>'+
                      '</div>'+
                    '</li>'+
                '<li class="wizard_internal_tab" id="zcustomTab">'+
                  '<div class="row">'+
                    '<div class="three columns">'+
                      '<input type="text" id="KEY" name="key" />'+
                    '</div>'+
                    '<div class="seven columns">'+
                      '<input type="text" id="VALUE" name="value" />'+
                    '</div>'+
                    '<div class="two columns">'+
                        '<button type="button" class="button tiny radius" id="add_context">'+tr("Add")+'</button>'+
                    '</div>'+
                  '</div>'+
                  '<hr>'+
                  '<div class="row">'+
                      '<table id="context_table" class="twelve">'+
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
                '</li>'+
          '</ul>'+
        '</form>'+
      '</li>'

      $("#refresh_context_table").die();

      $("#refresh_context_table").live('click', function(){
          // Retrieve the nics to fill the datatable
          OpenNebula.Image.list({
            timeout: true,
            success: function (request, files_list){
              var files_list_array = [];

              $.each(files_list,function(){
                var image = fileElementArray(this);
                if (image)
                  files_list_array.push(image);
              });
              var datTable_template_context = $('table[id="datatable_context"]').dataTable();
              updateView(files_list_array, datTable_template_context);
            },
            error: onError
          });
        });

        $("<dd><a href='#context'>Context</a></dd>").appendTo($("dl#template_create_tabs"));
        $(html_tab_content).appendTo($("ul#template_create_tabs_content"));

      //$('#tabs-context', dialog).tabs();

      $('#add_context', $('li#contextTab')).click(function() {
          var table = $('#context_table', $('li#contextTab'))[0];
          var rowCount = table.rows.length;
          var row = table.insertRow(rowCount);

          var cell1 = row.insertCell(0);
          var element1 = document.createElement("input");
          element1.id = "KEY";
          element1.type = "text";
          element1.value = $('input#KEY', $('li#contextTab')).val()
          cell1.appendChild(element1);

          var cell2 = row.insertCell(1);
          var element2 = document.createElement("input");
          element2.id = "VALUE";
          element2.type = "text";
          element2.value = $('input#VALUE', $('li#contextTab')).val()
          cell2.appendChild(element2);


          var cell3 = row.insertCell(2);
          cell3.innerHTML = "<i class='icon-remove-sign icon-large remove-tab'></i>";
      });

      $( "#contextTab i.remove-tab" ).live( "click", function() {
          $(this).closest("tr").remove()
      });


      var datTable_template_context = $('#datatable_context', dialog).dataTable({
          "bSortClasses": false,
          "bAutoWidth":false,
          "iDisplayLength": 4,
          "sDom" : '<"H">t<"F"p>',
          "oColVis": {
              "aiExclude": [ 0 ]
          },
          "aoColumnDefs": [
              { "bSortable": false, "aTargets": ["check"] },
              { "sWidth": "35px", "aTargets": [0,1] },
              { "bVisible": false, "aTargets": [0,2,3,5,6,7,9,8,10,11,12]}
          ],
          "oLanguage": (datatable_lang != "") ?
              {
                  sUrl: "locale/"+lang+"/"+datatable_lang
              } : ""
      });

      //addElement([spinner,'','','','','','','','','','','',''],datTable_template_context);

      // Retrieve the images to fill the datatable
      OpenNebula.Image.list({
      timeout: true,
      success: function (request, images_list){
          var image_list_array = [];
          $.each(images_list,function(){
            var image = fileElementArray(this);
            if (image)
              image_list_array.push(image);
          });

          updateView(image_list_array, datTable_template_context);
          datTable_template_context.fnFilter("CONTEXT", 7)
      },
      error: onError
      });

      $('#files_search', dialog).keyup(function(){
        datTable_template_context.fnFilter( $(this).val() );
      })

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

          if ($.isEmptyObject(selected_files)) {
            $('#files_selected',  dialog).show();
            $('#select_files', dialog).hide();
          }

          if(!$("td:first", this).hasClass('markrow'))
          {
            selected_files[file_id]=1;
            file_row_hash[file_id]=this;
            $(this).children().each(function(){$(this).addClass('markrow');});
            $('#selected_files_spans', dialog).append('<span id="tag_file_'+aData[1]+'" class="radius label">'+aData[4]+' <span class="icon-remove blue"></span></span> ');
          }
          else
          {
            delete selected_files[file_id];
            $(this).children().each(function(){$(this).removeClass('markrow');});
            $('div#selected_files_spans span#tag_file_'+file_id, dialog).remove();
          }

          if ($.isEmptyObject(selected_files)) {
            $('#files_selected',  dialog).hide();
            $('#select_files', dialog).show();
          }

          $('.alert-box', $('li#contextTab')).hide();

          generate_context_files();

          return false;
      });

      $( "#selected_files_spans span.icon-remove" ).live( "click", function() {
         $(this).parent().remove();
         var id = $(this).parent().attr("ID");

         var file_id=id.substring(9,id.length);
         delete selected_files[file_id];
         $(file_row_hash[file_id]).children().each(function(){$(this).removeClass('markrow');});

          if ($.isEmptyObject(selected_files)) {
            $('#files_selected',  dialog).hide();
            $('#select_files', dialog).show();
          }

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

    var add_schedulingTab = function() {
      var html_tab_content = '<li id="schedulingTab" class="wizard_tab">'+
      '<form>'+
        '<dl class="tabs">'+
          '<dd class="active"><a href="#placement">'+tr("Placement")+'</a></dd>'+
          '<dd><a href="#policy">'+tr("Policy")+'</a></dd>'+
        '</dl>'+
        '<ul class="tabs-content">'+
            '<li class="requirements wizard_internal_tab active" id="placementTab">'+
                '<div class="row">'+
                  '<div class="three columns push-three">'+
                      '<input type="radio" id="hosts_req" name="req_select" value="host_select" checked> '+tr("Select Hosts ")+
                  '</div>'+
                  '<div class="three columns pull-three">'+
                      '<input type="radio" id="clusters_req"  name="req_select" value="cluster_select"> '+tr("Select Clusters ")+
                  '</div>'+
                '</div>'+
                '<hr>'+
                '<div id="req_type" class="host_select row">'+
                    '<div class="row collapse ">'+
                      '<div class="seven columns">' +
                         '<button id="refresh_hosts_placement" type="button" class="button small radius secondary"><i class="icon-refresh" /></button>' +
                      '</div>' +
                      '<div class="five columns">'+
                        '<input id="hosts_search" type="text" placeholder="'+tr("Search")+'"/>'+
                      '</div>'+
                    '</div>'+
                    '<table id="datatable_template_hosts" class="datatable twelve">'+
                        '<thead>'+
                        '<tr>'+
                            '<th class="check"><input type="checkbox" class="check_all" value=""></input></th>'+
                            '<th>' + tr("ID") + '</th>'+
                            '<th>' + tr("Name") + '</th>'+
                            '<th>' + tr("Cluster") + '</th>'+
                            '<th>' + tr("RVMs") + '</th>'+
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
                    '<br>'+
                    '<div class="kvm_opt xen_opt vmware_opt" id="selected_hosts_template">'+
                      '<span id="select_hosts" class="radius secondary label">'+tr("Please select one or more hosts from the list")+'</span> '+
                      '<span id="hosts_selected" class="radius secondary label hidden">'+tr("You selected the following hosts:")+'</span> '+
                    '</div>'+
                    '<br>'+
                '</div>'+
                '<div id="req_type" class="cluster_select hidden row">'+
                    '<div class="row collapse ">'+
                      '<div class="seven columns">' +
                         '<button id="refresh_clusters_placement" type="button" class="button small radius secondary"><i class="icon-refresh" /></button>' +
                      '</div>' +
                      '<div class="five columns">'+
                        '<input id="clusters_search" type="text" placeholder="'+tr("Search")+'"/>'+
                      '</div>'+
                    '</div>'+
                    '<table id="datatable_template_clusters" class="datatable twelve">'+
                        '<thead>'+
                        '<tr>'+
                            '<th class="check"><input type="checkbox" class="check_all" value=""></input></th>'+
                            '<th>' + tr("ID") + '</th>'+
                            '<th>' + tr("Name") + '</th>'+
                            '<th>' + tr("Hosts") + '</th>'+
                            '<th>' + tr("VNets") + '</th>'+
                            '<th>' + tr("Datastores") + '</th>'+
                        '</tr>'+
                        '</thead>'+
                        '<tbody id="tbodyclusters">'+
                        '</tbody>'+
                    '</table>'+
                    '<br>'+
                    '<div class="kvm_opt xen_opt vmware_opt" id="selected_clusters_template">'+
                      '<span id="select_clusters" class="radius secondary label">'+tr("Please select one or more clusters from the list")+'</span> '+
                      '<span id="clusters_selected" class="radius secondary label hidden">'+tr("You selected the following clusters:")+'</span> '+
                    '</div>'+
                    '<br>'+
                '</div>'+
                '<hr>'+
                '<div class="row vm_param">'+
                    '<div class="two columns">'+
                        '<label class="inline right" for="REQUIREMENTS">'+tr("Requirements")+':</label>'+
                    '</div>'+
                    '<div class="nine columns">'+
                        '<input type="text" id="REQUIREMENTS" name="requirements" />'+
                    '</div>'+
                    '<div class="one columns">'+
                        '<div class="tip">'+tr("Boolean expression that rules out provisioning hosts from list of machines suitable to run this VM")+'.</div>'+
                    '</div>'+
                '</div>'+
            '</li>'+
            '<li id="policyTab" class="wizard_internal_tab">'+
                  '<div class="row">'+
                    '<div class="two columns push-two">'+
                      '<input type="radio" id="packingRadio" name="rank_select" value="RUNNING_VMS"> '+tr("Packing")+
                    '</div>'+
                    '<div class="one columns push-two">'+
                      '<div class="tip">'+tr("Pack the VMs in the cluster nodes to reduce VM fragmentation")+'</div>'+
                    '</div>'+
                    '<div class="two columns push-two">'+
                      '<input type="radio"  id="stripingRadio" name="rank_select" value="-RUNNING_VMS"> '+tr("Stripping")+
                    '</div>'+
                    '<div class="one columns push-two">'+
                      '<div class="tip">'+tr("Spread the VMs in the cluster nodes")+'</div>'+
                    '</div>'+
                    '<div class="two columns push-two">'+
                      '<input type="radio"  id="loadawareRadio" name="rank_select" value="FREECPU"> '+tr("Load-aware")+
                    '</div>'+
                    '<div class="two columns">'+
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
                    '<div class="tip">'+tr("This field sets which attribute will be used to sort the suitable hosts for this VM")+'.</div>'+
                  '</div>'+
                '</div>'+
            '</li>'+
          '</ul>'+
      '</form>'+
    '</li>'

    $("#refresh_hosts_placement").die();

    $("#refresh_hosts_placement").live('click', function(){
        // Retrieve the hosts to fill the datatable
        OpenNebula.Host.list({
        timeout: true,
        success: function (request, host_list){
            var host_list_array = [];

            $.each(host_list,function(){
                //Grab table data from the host_list
                host_list_array.push(hostElementArray(this));
            });

            var dataTable_template_hosts = $("#datatable_template_hosts",dialog).dataTable();
            updateView(host_list_array, dataTable_template_hosts);
        },
        error: onError
      });
      }
    );


        $("<dd><a href='#scheduling'>Scheduling</a></dd>").appendTo($("dl#template_create_tabs"));
        $(html_tab_content).appendTo($("ul#template_create_tabs_content"));

      //$('#tabs-scheduling', dialog).tabs();

      // hOSTS TABLE
      dataTable_template_hosts = $("#datatable_template_hosts",dialog).dataTable({
          "bSortClasses": false,
          "iDisplayLength": 4,
          "sDom" : '<"H">t<"F"p>',
          "oColVis": { //exclude checkbox column
              "aiExclude": [ 0 ]
          },
          "bAutoWidth":false,
          "aoColumnDefs": [
              { "sWidth": "35px", "aTargets": [0,1] },
              { "bVisible": false, "aTargets": [0,3,5,7,10,11,12]}
          ],
          "oLanguage": (datatable_lang != "") ?
              {
                  sUrl: "locale/"+lang+"/"+datatable_lang
              } : ""
      });


      //preload it
      //addElement([spinner,'','','','','','','','','','','',''],dataTable_template_hosts);

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

      $('#hosts_search', dialog).keyup(function(){
        dataTable_template_hosts.fnFilter( $(this).val() );
      })

      var selected_hosts = {};
      var host_row_hash = {};

      $('#datatable_template_hosts', dialog).delegate("tr", "click", function(e){
          if ($(e.target).is('input') ||
              $(e.target).is('select') ||
              $(e.target).is('option')) return true;

          var aData   = dataTable_template_hosts.fnGetData(this);
          var host_id = aData[1];

          if ($.isEmptyObject(selected_hosts)) {
            $('#hosts_selected',  dialog).show();
            $('#select_hosts', dialog).hide();
          }

          if(!$("td:first", this).hasClass('markrow'))
          {
            selected_hosts[host_id]=1;
            host_row_hash[host_id]=this;
            $(this).children().each(function(){$(this).addClass('markrow');});
            $('div#selected_hosts_template', dialog).append('<span id="tag_host_'+aData[1]+'" class="radius label">'+aData[2]+' <span class="icon-remove blue"></span></span> ');
          }
          else
          {
            delete selected_hosts[host_id];
            $(this).children().each(function(){$(this).removeClass('markrow');});
            $('div#selected_hosts_template span#tag_host_'+host_id, dialog).remove();
          }

          if ($.isEmptyObject(selected_hosts)) {
            $('#hosts_selected',  dialog).hide();
            $('#select_hosts', dialog).show();
          }

          $('.alert-box', $('li#schedulingTab .host_select')).hide();

          generate_requirements();

          return false;
      });

      $( "#selected_hosts_template span.icon-remove" ).live( "click", function() {
         $(this).parent().remove();
         var id = $(this).parent().attr("ID");

         var host_id=id.substring(9,id.length);
         delete selected_hosts[host_id];
         $(host_row_hash[host_id]).children().each(function(){$(this).removeClass('markrow');});

          if ($.isEmptyObject(selected_hosts)) {
            $('#hosts_selected',  dialog).hide();
            $('#select_hosts', dialog).show();
          }

         generate_requirements();
      });

    $("#refresh_clusters_placement").die();

    $("#refresh_clusters_placement").live('click', function(){
        // Retrieve the clusters to fill the datatable

        OpenNebula.Cluster.list({
          timeout: true,
          success: function (request, cluster_list){
            var list_array = [];

            $.each(cluster_list,function(){
                //Grab table data from the list
                list_array.push(clusterElementArray(this));
            });

            var dataTable_template_clusters = $("#datatable_template_clusters",dialog).dataTable();
            updateView(list_array,dataTable_template_clusters);
          },
          error: onError
        });
      }
    );

      // Clusters TABLE
      dataTable_template_clusters = $("#datatable_template_clusters", dialog).dataTable({
          "bSortClasses": false,
          "iDisplayLength": 4,
          "sDom" : '<"H">t<"F"p>',
          "oColVis": {
              "aiExclude": [ 0 ]
          },
          "bAutoWidth":false,
          "aoColumnDefs": [
              { "sWidth": "35px", "aTargets": [0,1] },
              { "bVisible": false, "aTargets": [0]}
          ],
          "oLanguage": (datatable_lang != "") ?
              {
                  sUrl: "locale/"+lang+"/"+datatable_lang
              } : ""
      });

      //preload it

      //addElement([spinner,'','','','',''],dataTable_template_clusters);

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


      $('#clusters_search', dialog).keyup(function(){
        dataTable_template_clusters.fnFilter( $(this).val() );
      })

      var selected_clusters = {};
      var cluster_row_hash = {};

      $('#datatable_template_clusters', dialog).delegate("tr", "click", function(e){
          if ($(e.target).is('input') ||
              $(e.target).is('select') ||
              $(e.target).is('option')) return true;

          var aData   = dataTable_template_clusters.fnGetData(this);
          var cluster_id = aData[1];

          if ($.isEmptyObject(selected_clusters)) {
            $('#clusters_selected',  dialog).show();
            $('#select_clusters', dialog).hide();
          }

          if(!$("td:first", this).hasClass('markrow'))
          {
            selected_clusters[cluster_id]=1;
            cluster_row_hash[cluster_id]=this;
            $(this).children().each(function(){$(this).addClass('markrow');});
            $('div#selected_clusters_template', dialog).append('<span id="tag_cluster_'+aData[1]+'" class="radius label">'+aData[2]+' <span class="icon-remove blue"></span></span> ');
          }
          else
          {
            delete selected_clusters[cluster_id];
            $(this).children().each(function(){$(this).removeClass('markrow');});
            $('div#selected_clusters_template span#tag_cluster_'+cluster_id, dialog).remove();
          }


          if ($.isEmptyObject(selected_clusters)) {
            $('#clusters_selected',  dialog).hide();
            $('#select_clusters', dialog).show();
          }

          $('.alert-box', $('li#schedulingTab .cluster_select')).hide();

          generate_requirements();

          return false;
      });

      $( "#selected_clusters_template span.icon-remove" ).live( "click", function() {
         $(this).parent().remove();
         var id = $(this).parent().attr("ID");

         var cluster_id=id.substring(12,id.length);
         delete selected_clusters[cluster_id];
         $(cluster_row_hash[cluster_id]).children().each(function(){$(this).removeClass('markrow');});

          if ($.isEmptyObject(selected_clusters)) {
            $('#clusters_selected',  dialog).hide();
            $('#select_clusters', dialog).show();
          }

         generate_requirements();
      });

      // Select Image or Volatile disk. The div is hidden depending on the selection, and the
      // vm_param class is included to be computed when the template is generated.
      $("input[name='req_select']").change(function(){
        if ($("input[name='req_select']:checked").val() == "host_select") {
            $("div.host_select",  $('li#schedulingTab')).toggle();
            $("div.host_select",  $('li#schedulingTab')).addClass('vm_param');
            $("div.cluster_select",  $('li#schedulingTab')).hide();
            $("div.cluster_select",  $('li#schedulingTab')).removeClass('vm_param');
        }
        else {
            $("div.host_select",  $('li#schedulingTab')).hide();
            $("div.host_select",  $('li#schedulingTab')).removeClass('vm_param');
            $("div.cluster_select",  $('li#schedulingTab')).toggle();
            $("div.cluster_select",  $('li#schedulingTab')).addClass('vm_param');
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


    //***CREATE VM DIALOG MAIN BODY***

    dialogs_context.append('<div id="create_template_dialog"></div>');
    $create_template_dialog = $('#create_template_dialog',dialogs_context)
    var dialog = $create_template_dialog;

    //Insert HTML in place
    dialog.html(create_template_tmpl);



    //Prepare jquery dialog
    var height = Math.floor($(window).height()*0.9); //set height to a percentage of the window
    //dialog.dialog({
    //    autoOpen: false,
    //    modal: true,
    //    width: 'auto',
    //    height: height
    //});
    dialog.addClass("reveal-modal xlarge max-height")


    var tabs = $( "#template_create_tabs", dialog)//.tabs().addClass("ui-tabs-vertical");


    //$('#wizard_next').click(function(){
    //  var selected = tabs.tabs('option', 'active');
    //  tabs.tabs("option", "active", selected+1);
    //});
//
    //$('#wizard_previous').click(function(){
    //  var selected = tabs.tabs('option', 'active');
    //  tabs.tabs("option", "active", selected-1);
    //});


    $('#template_template_reset_button').click(function(){
        $create_template_dialog.trigger('reveal:close');
        $create_template_dialog.remove();
        setupCreateTemplateDialog();

        popUpCreateTemplateDialog();
    });

    $('#template_template_reset_button_update').click(function(){
        $create_template_dialog.trigger('reveal:close');
        $create_template_dialog.remove();
        setupCreateTemplateDialog();

        popUpUpdateTemplateDialog();
    });

    if (Config.isTemplateCreationTabEnabled('general')){
      add_capacityTab();
    }

    if (Config.isTemplateCreationTabEnabled('storage')){
      add_disks_tab();
    }

    if (Config.isTemplateCreationTabEnabled('network')){
      add_nics_tab();
    }

    if (Config.isTemplateCreationTabEnabled('os_booting')){
      add_osTab();
    }

    if (Config.isTemplateCreationTabEnabled('input_output')){
      add_ioTab();
    }

    if (Config.isTemplateCreationTabEnabled('context')){
      add_contextTab();
    }

    if (Config.isTemplateCreationTabEnabled('scheduling')){
      add_schedulingTab();
    }

    //tabs.tabs("option", "active", 0);
    $(".ui-tabs-vertical .ui-tabs-nav", dialog).first().removeClass("ui-tabs-nav").addClass("ui-tabs-nav-vert")
    // Re-Setup tips
    setupTips(dialog);

    //Enable different icon for folded/unfolded categories
    iconToggle(); //toogle +/- buttons

    //Sections, used to stay within their scope
    var section_capacity = $('li#capacityTab',dialog);
    var section_os_boot = $('div#os_boot_opts',dialog);
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
    //$('button',dialog).button();

    var build_template = function(){
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
        addSectionJSON(vm_json,$('li#capacityTab',dialog));
        //
        // OS
        //

        vm_json["OS"] = {};
        addSectionJSON(vm_json["OS"],$('li#osTab li#bootTab',dialog));
        addSectionJSON(vm_json["OS"],$('li#osTab li#kernelTab',dialog));
        addSectionJSON(vm_json["OS"],$('li#osTab li#ramdiskTab',dialog));

        //
        // FEATURES
        //

        vm_json['FEATURES'] = {};
        addSectionJSON(vm_json["FEATURES"],$('li#osTab li#featuresTab',dialog));

        //
        // DISK
        //

        vm_json["DISK"] = [];

        $('.disk div#disk_type.vm_param ',dialog).each(function(){
          var hash  = {};
          addSectionJSON(hash, this);
          vm_json["DISK"].push(hash);
        });

        //
        // NIC
        //

        vm_json["NIC"] = [];

        $('.nic',dialog).each(function(){
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

          if (!$.isEmptyObject(hash)) {
              vm_json["NIC"].push(hash);
          }
        });

        //
        // GRAPHICS
        //

        vm_json["GRAPHICS"] = {};
        addSectionJSON(vm_json["GRAPHICS"],$('li#ioTab .graphics',dialog));

        //
        // INPUT
        //

        vm_json["INPUT"] = [];
        $('#input_table tr', $('li#ioTab')).each(function(){
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
        $('#context_table tr', $('li#contextTab')).each(function(){
          if ($('#KEY', $(this)).val()) {
            vm_json["CONTEXT"][$('#KEY', $(this)).val()] = $('#VALUE', $(this)).val()
          }
        });

        if ($("#ssh_context", $('li#contextTab')).is(":checked")) {
          var public_key = $("#ssh_puclic_key", $('li#contextTab')).val();
          if (public_key){
            vm_json["CONTEXT"]["SSH_PUBLIC_KEY"] = public_key;
          }
          else {
            vm_json["CONTEXT"]["SSH_PUBLIC_KEY"] = '$USER[SSH_PUBLIC_KEY]';
          }
        };

        if ($("#network_context", $('li#contextTab')).is(":checked")) {
          var nic_id = 0;

          $.each(vm_json["NIC"], function(){
            var vnet_id = this["NETWORK_ID"]
            var eth_str = "ETH"+nic_id+"_"
            var net_str = 'NETWORK_ID=\\"'+ vnet_id +'\\"'

            vm_json["CONTEXT"][eth_str+"IP"]      = "$NIC[IP,"+ net_str +"]";
            vm_json["CONTEXT"][eth_str+"NETWORK"] = "$NETWORK[NETWORK_ADDRESS,"+ net_str +"]";
            vm_json["CONTEXT"][eth_str+"MASK"]    = "$NETWORK[NETWORK_MASK,"+ net_str +"]";
            vm_json["CONTEXT"][eth_str+"GATEWAY"] = "$NETWORK[GATEWAY,"+ net_str +"]";
            vm_json["CONTEXT"][eth_str+"DNS"]     = "$NETWORK[DNS,"+ net_str +"]";
            vm_json["CONTEXT"][eth_str+"IPV6"]    = "$NIC[IP6_GLOBAL,"+ net_str +"]";
            vm_json["CONTEXT"][eth_str+"GATEWAY6"]= "$NETWORK[GATEWAY6,"+ net_str +"]";
            vm_json["CONTEXT"][eth_str+"CONTEXT_FORCE_IPV4"] = "$NETWORK[CONTEXT_FORCE_IPV4,"+ net_str +"]";

            nic_id++;
          });
        };

        addSectionJSON(vm_json["CONTEXT"],$('li#contextTab',dialog));

        //
        // PLACEMENT
        //

        addSectionJSON(vm_json,$('li#schedulingTab',dialog));

        // remove empty elements
        vm_json = removeEmptyObjects(vm_json);
        return vm_json;

    }

    //Process form
    $('button#create_template_form_easy',dialog).click(function(){
         //wrap it in the "vmtemplate" object
        var vm_json = build_template();
        vm_json = {vmtemplate: vm_json};

        if (vm_json.vmtemplate.NAME == undefined ||
            vm_json.vmtemplate.NAME.length == 0 ) {

            notifyError(tr("Virtual Machine name missing!"));
            return false;
        }

        //validate form
        Sunstone.runAction("Template.create",vm_json);

        $create_template_dialog.trigger("reveal:close")
        $create_template_dialog.empty();
        setupCreateTemplateDialog();

        return false;
    });

    $('button#template_template_update_button',dialog).click(function(){
        var vm_json = build_template();
        vm_json = {vmtemplate: vm_json};
        vm_json =JSON.stringify(vm_json);

        Sunstone.runAction("Template.update",template_to_update_id,vm_json);

        $create_template_dialog.trigger("reveal:close")

        return false;
    });

    $('button#manual_template_update_button',dialog).click(function(){
        var template = $('textarea#template',$create_template_dialog).val();

        //wrap it in the "vm" object
        template = {"vmtemplate": {"template_raw": template}};
        var vm_json = JSON.stringify(template);
        Sunstone.runAction("Template.update",template_to_update_id,vm_json);

        $create_template_dialog.trigger("reveal:close")

        return false;
    });

    //Handle manual forms
    $('button#create_template_submit_manual',$create_template_dialog).click(function(){
        var template = $('textarea#template',$create_template_dialog).val();

        //wrap it in the "vm" object
        template = {"vmtemplate": {"template_raw": template}};

        Sunstone.runAction("Template.create",template);
        $create_template_dialog.trigger("reveal:close")
        return false;
    });

    //Reset form - empty boxes
    //$('button#reset_vm_form',dialog).click(function(){
    //    $('select#disks_box option',section_disks).remove();
    //   $('select#nics_box option',section_networks).remove();
    //    $('select#inputs_box option',section_inputs).remove();
    //    $('select#custom_var_box option',section_custom_var).remove();
    //    return true;
    //});
}

function popUpUpdateTemplateDialog(){
    $('button#create_template_form_easy', $create_template_dialog).hide();
    $('button#template_template_update_button', $create_template_dialog).show();
    $('button#template_template_reset_button', $create_template_dialog).hide();
    $('button#template_template_reset_button_update', $create_template_dialog).show();
    $('button#manual_template_update_button', $create_template_dialog).show();
    $('button#create_template_submit_manual', $create_template_dialog).hide();

    $('#create_template_header', $create_template_dialog).hide();
    $('#update_template_header', $create_template_dialog).show();

    $('#template_name_form', $create_template_dialog).hide();
    $('#NAME').attr("disabled", "disabled");;

    $('#wizard_mode', $create_template_dialog).hide();
    $('#advanced_mode_a', $create_template_dialog).click();

    $create_template_dialog.reveal();
};

function popUpCreateTemplateDialog(){
    $('button#create_template_form_easy', $create_template_dialog).show();
    $('button#template_template_update_button', $create_template_dialog).hide();
    $('button#template_template_reset_button', $create_template_dialog).show();
    $('button#template_template_reset_button_update', $create_template_dialog).hide();
    $('button#manual_template_update_button', $create_template_dialog).hide();
    $('button#create_template_submit_manual', $create_template_dialog).show();

    $('#create_template_header', $create_template_dialog).show();
    $('#update_template_header', $create_template_dialog).hide();

    $('#template_name_form', $create_template_dialog).show();
    $('#NAME').removeAttr('disabled');

    $('#wizard_mode', $create_template_dialog).show();

    $create_template_dialog.reveal();
};

function setupTemplateTemplateUpdateDialog(){
    //Append to DOM
    dialogs_context.append('<div id="template_template_update_dialog" title="'+tr("Update template properties")+'"></div>');
    var dialog = $('#template_template_update_dialog',dialogs_context);

    //Put HTML in place
    dialog.html(update_template_tmpl);

    var height = Math.floor($(window).height()*0.8); //set height to a percentage of the window

    //Convert into jQuery
    //dialog.dialog({
    //    autoOpen:false,
    //    width:700,
    //    modal:true,
    //    height:height,
    //    resizable:false
    //});
    dialog.addClass("reveal-modal");

    //$('button',dialog).button();

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
            $(this).parents('#template_template_update_dialog').trigger("reveal:close")
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
        $(this).parents('#template_template_update_dialog').trigger("reveal:close")
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
    $create_template_dialog.remove();
    setupCreateTemplateDialog();

    var use_advanced_template = false;

    function autoFillInputs(template_json, context){
        var params = $('.vm_param',context);
        var inputs = $('input',params);
        var selects = $('select:enabled',params);
        var fields = $.merge(inputs,selects);

        fields.each(function(){
            var field = $(this);
                if (template_json[field.attr('id')]){ //if has a length
                    field.val(template_json[field.attr('id')]);
                    field.change();

                    delete template_json[field.attr('id')]

                    if (field.parents(".advanced")) {
                        $('.advanced', context).toggle();
                    }
                };
        });
    };

    var template = response.VMTEMPLATE.TEMPLATE;

    $('#template',$create_template_dialog).val(convert_template_to_string(template).replace(/^[\r\n]+$/g, ""));

    template_to_update_id = response.VMTEMPLATE.ID

//    //
//    // GENERAL
//    //
//
//    var capacity_section = $('li#capacityTab', $create_template_dialog);
//    autoFillInputs(template, capacity_section);
//
//
//    //
//    // DISKS
//    //
//
//    var number_of_disks = 0;
//
//    function fillDiskTab(disk) {
//        var str_disk_tab_id = 'disk' + number_of_disks;
//        var disk_section  = $('li#' + str_disk_tab_id + 'Tab', $create_template_dialog);
//
//        if (disk.IMAGE_ID) {
//            $('input#'+str_disk_tab_id+'radioImage', disk_section).click();
//
//            var dataTable_template_images = $("#datatable_template_images" + number_of_disks).dataTable();
//
//            // TODO updateView should not be required. Currently the dataTable
//            //  is filled twice.
//            OpenNebula.Image.list({
//                timeout: true,
//                success: function (request, images_list){
//                    var image_list_array = [];
//
//                    $.each(images_list,function(){
//                        image_list_array.push(imageElementArray(this));
//                    });
//
//                    updateView(image_list_array, dataTable_template_images);
//
//                    var rows = dataTable_template_images.fnGetNodes();
//
//                    var clicked = false
//                    for (var j=0;j<rows.length;j++) {
//                        var current_row = $(rows[j]);
//                        var row_image_id = $(rows[j]).find("td:eq(0)").html();
//
//                        if (row_image_id == disk.IMAGE_ID) {
//                            rows[j].click();
//                            clicked = true;
//                        }
//                    }
//
//                    if (!clicked) {
//                        var alert = '<div class="alert-box alert">'+
//'IMAGE: '+ disk.IMAGE_ID + tr(" does not exists any more") +
//'  <a href="" class="close">&times;</a>'+
//'</div>';
//
//                        $(".dataTables_wrapper", disk_section).append(alert);
//                    }
//              },
//              error: onError
//            });
//
//        }
//        else {
//            $('input#'+str_disk_tab_id+'radioVolatile', disk_section).click();
//        }
//
//        autoFillInputs(disk, $('div#disk_type.vm_param', disk_section));
//    }
//
//    if (template.DISK) {
//        var disks = template.DISK
//
//        if (disks instanceof Array) {
//            $.each(disks, function(){
//                if (number_of_disks > 0) {
//                    $("#tf_btn_disks").click();
//                }
//
//                fillDiskTab(this);
//                number_of_disks++;
//            });
//        }
//        else if (disks instanceof Object) {
//            fillDiskTab(disks);
//        }
//    }
//
//
//    //
//    // NICS
//    //
//
//    var number_of_nics = 0;
//
//    function fillNicTab(nic) {
//        var str_nic_tab_id = 'nic' + number_of_nics;
//        var nic_section  = $('li#' + str_nic_tab_id + 'Tab', $create_template_dialog);
//
//        var dataTable_template_networks = $("#datatable_template_networks" + number_of_nics).dataTable();
//
//        // TODO updateView should not be required. Currently the dataTable
//        //  is filled twice.
//        OpenNebula.Network.list({
//            timeout: true,
//            success: function (request, networks_list){
//                var network_list_array = [];
//
//                $.each(networks_list,function(){
//                    network_list_array.push(vNetworkElementArray(this));
//                });
//
//                updateView(network_list_array, dataTable_template_networks);
//
//                var rows = dataTable_template_networks.fnGetNodes();
//
//                var clicked = false;
//                for (var j=0;j<rows.length;j++) {
//                    var current_row = $(rows[j]);
//                    var row_network_id = $(rows[j]).find("td:eq(0)").html();
//
//                    if (row_network_id == nic.NETWORK_ID) {
//                        rows[j].click();
//                        clicked = true;
//                    }
//                }
//
//                if (!clicked) {
//                        var alert = '<div class="alert-box alert">'+
//'NETWORK: '+ nic.NETWORK_ID + tr(" does not exists any more") +
//'  <a href="" class="close">&times;</a>'+
//'</div>';
//
//                        $(".dataTables_wrapper", nic_section).append(alert);
//                }
//          },
//          error: onError
//        });
//
//        autoFillInputs(nic, nic_section);
//    }
//
//    if (template.NIC) {
//        var nics = template.NIC
//
//        if (nics instanceof Array) {
//            $.each(nics, function(){
//                if (number_of_nics > 0) {
//                    $("#tf_btn_nics").click();
//                }
//
//                fillNicTab(this);
//                number_of_nics++;
//            });
//        }
//        else if (nics instanceof Object) {
//            fillNicTab(nics);
//        }
//    }
//
//
//    //
//    // OS
//    //
//
//    var os = template.OS;
//    var os_section = $('li#osTab', $create_template_dialog);
//
//    if (os) {
//        if (os.KERNEL_DS) {
//            $('input#radioKernelDs', os_section).click();
//
//            var dataTable_template = $("#datatable_kernel").dataTable();
//            var regexp = /\$FILE\[IMAGE_ID=([0-9]+)+/;
//
//            // TODO updateView should not be required. Currently the dataTable
//            //  is filled twice.
//            OpenNebula.Image.list({
//                timeout: true,
//                success: function (request, list){
//                    var list_array = [];
//
//                    $.each(list,function(){
//                        list_array.push(imageElementArray(this));
//                    });
//
//                    updateView(list_array, dataTable_template);
//                    dataTable_template.fnFilter("KERNEL", 6)
//
//                    var rows = dataTable_template.fnGetNodes();
//
//                    var match = regexp.exec(os.KERNEL_DS)
//                    var clicked = false;
//                    for (var j=0;j<rows.length;j++) {
//                        var current_row = $(rows[j]);
//                        var row_id = $(rows[j]).find("td:eq(0)").html();
//
//                        if (match && row_id == match[1]) {
//                            rows[j].click();
//                            clicked = true;
//                        }
//                    }
//                    if (!clicked) {
//                        var alert = '<div class="alert-box alert">'+
//'KERNEL: '+ match[1] + tr(" does not exists any more") +
//'  <a href="" class="close">&times;</a>'+
//'</div>';
//
//                        $("#tabs-kernel .dataTables_wrapper", os_section).append(alert);
//                    }
//              },
//              error: onError
//            });
//        }
//        else if (os.KERNEL) {
//            $('input#radioKernelPath', os_section).click();
//        };
//
//        if (os.INITRD_DS) {
//            $('input#radioInitrdDs', os_section).click();
//
//            var dataTable_template = $("#datatable_initrd").dataTable();
//            var regexp = /\$FILE\[IMAGE_ID=([0-9]+)+/;
//
//            // TODO updateView should not be required. Currently the dataTable
//            //  is filled twice.
//            OpenNebula.Image.list({
//                timeout: true,
//                success: function (request, list){
//                    var list_array = [];
//
//                    $.each(list,function(){
//                        list_array.push(imageElementArray(this));
//                    });
//
//                    updateView(list_array, dataTable_template);
//                    dataTable_template.fnFilter("RAMDISK", 6)
//
//                    var rows = dataTable_template.fnGetNodes();
//                    var match = regexp.exec(os.INITRD_DS);
//                    var clicked = false;
//                    for (var j=0;j<rows.length;j++) {
//                        var current_row = $(rows[j]);
//                        var row_id = $(rows[j]).find("td:eq(0)").html();
//
//                        if (match && row_id == match[1]) {
//                            rows[j].click();
//                            clicked = true;
//                        }
//                    }
//
//                    if (!clicked) {
//                        var alert = '<div class="alert-box alert">'+
//'RAMDISK: '+ match[1] + tr(" does not exists any more") +
//'  <a href="" class="close">&times;</a>'+
//'</div>';
//
//                        $("#tabs-ramdisk .dataTables_wrapper", os_section).append(alert);
//                    }
//              },
//              error: onError
//            });
//        }
//        else if (os.INITRD) {
//            $('input#radioInitrdPath', os_section).click();
//        };
//
//        autoFillInputs(os, os_section);
//    }
//
//    //
//    // INPUT/OUTPUT
//    //
//
//    var graphics = template.GRAPHICS;
//    var graphics_section = $('li#ioTab .graphics', $create_template_dialog);
//
//    if (graphics) {
//        var type = graphics.TYPE;
//        if (graphics.TYPE) {
//            $("input[value='"+ type + "']").click();
//
//            autoFillInputs(graphics, graphics_section);
//        }
//    }
//
//    var inputs = template.INPUT;
//    var inputs_section = $('li#ioTab .inputs', $create_template_dialog);
//
//    if (inputs) {
//        if (!(inputs instanceof Array)) {
//            inputs = [inputs];
//        }
//
//        $.each(inputs, function(){
//            var table = $('#input_table', inputs_section)[0];
//            var rowCount = table.rows.length;
//            var row = table.insertRow(rowCount);
//
//            var cell1 = row.insertCell(0);
//            var element1 = document.createElement("input");
//            element1.id = "TYPE";
//            element1.type = "text";
//            element1.value = this.TYPE;
//            cell1.appendChild(element1);
//
//            var cell2 = row.insertCell(1);
//            var element2 = document.createElement("input");
//            element2.id = "BUS";
//            element2.type = "text";
//            element2.value = this.BUS;
//            cell2.appendChild(element2);
//
//
//            var cell3 = row.insertCell(2);
//            cell3.innerHTML = "<span class='ui-icon ui-icon-close'></span>";
//        });
//    }
//
//
//    //
//    // CONTEXT
//    //
//
//    var context = template.CONTEXT;
//    var context_section = $('li#contextTab', $create_template_dialog);
//
//    if (context) {
//        var file_ds_regexp = /\$FILE\[IMAGE_ID=([0-9]+)+/g;
//        var net_regexp = /^ETH[0-9]+_(MASK|GATEWAY|IP|NETWORK|DNS)$/;
//        var ssh_regexp = /^SSH_PUBLIC_KEY$/;
//        var publickey_regexp = /\$USER\[SSH_PUBLIC_KEY\]/;
//
//        var net_flag = false;
//        var files = [];
//
//        $.each(context, function(key, value){
//            if (ssh_regexp.test(key)) {
//                $("#ssh_context", context_section).click();
//
//                if (!publickey_regexp.test(value)) {
//                    $("input#ssh_puclic_key").val(value);
//                }
//
//            }
//            else if (net_regexp.test(key)) {
//                if (!net_flag) {
//                    $("#network_context", context_section).click();
//                    net_flag = true;
//                }
//            }
//            else if ("FILES_DS" == key){
//                var files = [];
//                while (match = file_ds_regexp.exec(value)) {
//                    files.push(match[1])
//                }
//
//                var dataTable_context = $("#datatable_context").dataTable();
//
//                // TODO updateView should not be required. Currently the dataTable
//                //  is filled twice.
//                OpenNebula.Image.list({
//                    timeout: true,
//                    success: function (request, list){
//                        var list_array = [];
//
//                        $.each(list,function(){
//                            list_array.push(imageElementArray(this));
//                        });
//
//                        updateView(list_array, dataTable_context);
//                        dataTable_context.fnFilter("CONTEXT", 7)
//
//                        var rows = dataTable_context.fnGetNodes();
//
//                        for (var j=0;j<rows.length;j++) {
//                            var current_row = $(rows[j]);
//                            var row_id = $(rows[j]).find("td:eq(0)").html();
//
//                            var in_array = $.inArray(row_id, files)
//                            if (in_array != -1) {
//                                files.splice(in_array, 1);
//                                // TBD check if all the files were clicked
//                                rows[j].click();
//                            }
//                        }
//
//                        if (files.length != 0) {
//                            var alert = '<div class="alert-box alert">'+
//    tr('The following FILES: ') + files.join(', ') + tr(" do not exist any more") +
//    '  <a href="" class="close">&times;</a>'+
//    '</div>';
//
//                            $(".dataTables_wrapper", context_section).append(alert);
//                        }
//
//                  },
//                  error: onError
//                });
//            }
//            else {
//              var table = $('#context_table', context_section)[0];
//              var rowCount = table.rows.length;
//              var row = table.insertRow(rowCount);
//
//              var cell1 = row.insertCell(0);
//              var element1 = document.createElement("input");
//              element1.id = "KEY";
//              element1.type = "text";
//              element1.value = key
//              cell1.appendChild(element1);
//
//              var cell2 = row.insertCell(1);
//              var element2 = document.createElement("input");
//              element2.id = "VALUE";
//              element2.type = "text";
//              element2.value = value
//              cell2.appendChild(element2);
//
//
//              var cell3 = row.insertCell(2);
//              cell3.innerHTML = "<span class='ui-icon ui-icon-close'></span>";
//            }
//        });
//    }
//
//    //
//    // REQUIREMENTS & RANK
//    //
//
//    var req = template.REQUIREMENTS;
//    var req_section = $('li#schedulingTab', $create_template_dialog);
//
//    if (req) {
//        req = escapeDoubleQuotes(req);
//
//        var host_id_regexp = /(\s|\||\b)ID=\\"([0-9]+)\\"/g;
//        var cluster_id_regexp = /CLUSTER_ID=\\"([0-9]+)\\"/g;
//
//        var hosts = [];
//        while (match = host_id_regexp.exec(req)) {
//            hosts.push(match[2])
//        }
//
//        var clusters = [];
//        while (match = cluster_id_regexp.exec(req)) {
//            clusters.push(match[1])
//        }
//
//        if (hosts.length != 0) {
//            var dataTable_template_hosts = $("#datatable_template_hosts").dataTable();
//
//            OpenNebula.Host.list({
//                timeout: true,
//                success: function (request, host_list){
//                    var host_list_array = [];
//
//                    $.each(host_list,function(){
//                        //Grab table data from the host_list
//                        host_list_array.push(hostElementArray(this));
//                    });
//
//                    updateView(host_list_array, dataTable_template_hosts);
//
//                    var rows = dataTable_template_hosts.fnGetNodes();
//
//                    for (var j=0;j<rows.length;j++) {
//                        var current_row = $(rows[j]);
//                        var row_id = $(rows[j]).find("td:eq(0)").html();
//
//                        var in_array = $.inArray(row_id, hosts)
//                        if (in_array != -1) {
//                            hosts.splice(in_array, 1);
//                            // TBD check if all the hosts were clicked
//                            rows[j].click();
//                        }
//                    }
//
//                    if (hosts.length != 0) {
//                        var alert = '<div class="alert-box alert">'+
//tr('The following HOSTs: [') + hosts.join(', ') + '] ' + tr(" do not exist any more") +
//'  <a href="" class="close">&times;</a>'+
//'</div>';
//
//                        $("#datatable_template_hosts_wrapper", req_section).append(alert);
//                    }
//                },
//                error: onError
//            });
//        }
//
//        if (clusters.length != 0) {
//            $('input#clusters_req', req_section).click();
//
//            var dataTable_template_clusters = $("#datatable_template_clusters").dataTable();
//
//            OpenNebula.Cluster.list({
//                timeout: true,
//                success: function (request, cluster_list){
//                    var cluster_list_array = [];
//
//                    $.each(cluster_list,function(){
//                        //Grab table data from the cluster_list
//                        cluster_list_array.push(clusterElementArray(this));
//                    });
//
//                    updateView(cluster_list_array, dataTable_template_clusters);
//
//                    var rows = dataTable_template_clusters.fnGetNodes();
//
//                    for (var j=0;j<rows.length;j++) {
//                        var current_row = $(rows[j]);
//                        var row_id = $(rows[j]).find("td:eq(0)").html();
//
//                        var in_array = $.inArray(row_id, clusters)
//                        if (in_array != -1) {
//                            clusters.splice(in_array, 1);
//                            // TBD check if all the clusters were clicked
//                            rows[j].click();
//                        }
//                    }
//
//                    if (clusters.length != 0) {
//                        var alert = '<div class="alert-box alert">'+
//tr('The following CLUSTERs: [') + clusters.join(', ') + '] ' + tr("do not exist any more") +
//'  <a href="" class="close">&times;</a>'+
//'</div>';
//
//                        $("#datatable_template_clusters_wrapper", req_section).append(alert);
//                    }
//                },
//                error: onError
//            });
//        }
//
//        $('input#REQUIREMENTS', req_section).val(req);
//    }
//
//    var rank = template.RANK;
//
//    if (rank) {
//        var striping_regexp = /-RUNNING_VMS/;
//        var packing_regexp = /RUNNING_VMS/;
//        var loadaware_regexp = /FREECPU/;
//
//        if (striping_regexp.test(rank)) {
//            $('input#stripingRadio', req_section).click()
//        }
//        else if (packing_regexp.test(rank)) {
//            $('input#packingRadio', req_section).click()
//        }
//        else if (loadaware_regexp.test(rank)) {
//            $('input#loadawareRadio', req_section).click()
//        }
//
//        $('input#RANK', req_section).val(rank);
//    }

    popUpUpdateTemplateDialog();
}

// Template clone dialog
function setupTemplateCloneDialog(){
    //Append to DOM
    dialogs_context.append('<div id="template_clone_dialog" title="'+tr("Clone a template")+'"></div>');
    var dialog = $('#template_clone_dialog',dialogs_context);

    //Put HTML in place

    var html = '<div class="panel">\
          <h3>\
            <small id="create_vnet_header">'+tr("Clone Template")+'</small>\
          </h3>\
        </div>\
        <form>\
<div class="row">\
<div class="clone_one"></div>\
<div class="clone_several">'+tr("Several templates are selected, please choose prefix to name the new copies")+':</div>\
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
  <button class="button radius right" id="template_clone_button" value="Template.clone">\
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
    //})
    dialog.addClass("reveal-modal");

    //$('button',dialog).button();

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
        $(this).parents('#template_clone_dialog').trigger("reveal:close")
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

    $(dialog).reveal();
}

// Set the autorefresh interval for the datatable
function setTemplateAutorefresh() {
    setInterval(function(){
        var checked = $('input.check_item:checked',dataTable_templates);
        var filter = $("#template_search").attr('value');
        if ((checked.length==0) && !filter){
            Sunstone.runAction("Template.autorefresh");
        }
    },INTERVAL+someTime());
};

// Instantiate dialog
// Sets up the instiantiate template dialog and all the processing associated to it
function setupInstantiateTemplateDialog(){

    dialogs_context.append('<div title=\"'+tr("Instantiate VM Template")+'\" id="instantiate_vm_template_dialog"></div>');
    //Insert HTML in place
    $instantiate_vm_template_dialog = $('#instantiate_vm_template_dialog')
    var dialog = $instantiate_vm_template_dialog;
    dialog.html(instantiate_vm_template_tmpl);

    dialog.addClass("reveal-modal");

    setupTips(dialog);

    $('#instantiate_vm_template_form',dialog).submit(function(){
        var vm_name = $('#vm_name',this).val();
        var n_times = $('#vm_n_times',this).val();
        var n_times_int=1;

        var selected_nodes = getSelectedNodes(dataTable_templates);
        var template_id    = ""+selected_nodes[0];

        if (n_times.length){
            n_times_int=parseInt(n_times,10);
        };

        var extra_info = "";
        if (n_times_int > 1) {
            extra_info = n_times_int+" times";
        }

        notifySubmit("Template.instantiate",template_id, extra_info);

        if (!vm_name.length){ //empty name use OpenNebula core default
            for (var i=0; i< n_times_int; i++){
                Sunstone.runAction("Template.instantiate_quiet", template_id, "");
            };
        }
        else
        {
          if (vm_name.indexOf("%i") == -1){//no wildcard, all with the same name
              for (var i=0; i< n_times_int; i++){
                Sunstone.runAction("Template.instantiate_quiet", template_id, vm_name);
              };
          } else { //wildcard present: replace wildcard
              var name = "";
              for (var i=0; i< n_times_int; i++){
                  name = vm_name.replace(/%i/gi,i);
                  Sunstone.runAction("Template.instantiate_quiet", template_id, name);
              };
          };
        }

        $instantiate_vm_template_dialog.trigger("reveal:close")
        return false;
    });
}

// Open creation dialog
function popUpInstantiateVMTemplateDialog(){
    $instantiate_vm_template_dialog.reveal();
}

//The DOM is ready at this point
$(document).ready(function(){
    var tab_name = 'templates-tab';

    dataTable_templates = $("#datatable_templates",main_tabs_context).dataTable({
        "aoColumnDefs": [
            { "bSortable": false, "aTargets": ["check"] },
            { "sWidth": "35px", "aTargets": [0] },
            { "bVisible": true, "aTargets": Config.tabTableColumns(tab_name)},
            { "bVisible": false, "aTargets": ['_all']}
        ]
    });


    $('#template_search').keyup(function(){
      dataTable_templates.fnFilter( $(this).val() );
    })

    dataTable_templates.on('draw', function(){
      recountCheckboxes(dataTable_templates);
    })

    Sunstone.runAction("Template.list");
    setupInstantiateTemplateDialog();
    setupCreateTemplateDialog();
    setupTemplateTemplateUpdateDialog();
    setupTemplateCloneDialog();
    setTemplateAutorefresh();

    initCheckAllBoxes(dataTable_templates);
    tableCheckboxesListener(dataTable_templates);
    infoListener(dataTable_templates,'Template.showinfo');

    $('div#templates_tab div.legend_div').hide();

});
