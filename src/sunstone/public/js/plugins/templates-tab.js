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

var create_template_tmpl = '\
<div class="row" id="create_template_header_row">'+
  '<div class="large-5 columns">'+
    '<h3 class="subheader" id="create_template_header">'+tr("Create VM Template")+'</h3><h3 class="subheader" id="update_template_header" class="hidden">'+tr("Update VM Template")+'</h3>'+
  '</div>'+
  '<div class="large-7 columns">'+
    '<dl class="tabs right wizard_tabs" data-tab>' +
      '<dd id="wizard_mode" class="active"><a href="#easy">'+tr("Wizard")+'</a></dd>' +
      '<dd id="advanced_mode"><a id="advanced_mode_a" href="#manual">'+tr("Advanced mode")+'</a></dd>' +
    '</dl>' +
  '</div>'+
'</div>'+
  '<div class="tabs-content">' +
    '<div class="content active" id="easy">' +
      '<form class="custom creation">'+
        '<div class="">'+
          '<dl id="template_create_tabs" class="tabs right-info-tabs text-center" data-tab>'+
          wizard_tab_dd()+
          '</dl>'+
          '<div id="template_create_tabs_content" class="tabs-content">'+
          wizard_tab_content()+
          '</div>'+
        '</div>'+
            '<button class="success button radius" id="create_template_form_easy" value="OpenNebula.Template.create" style="float: right">'+tr("Create")+'</button>'+
            '<button class="button hidden radius" id="template_template_update_button" value="Template.update_template" style="float: right">'+tr("Update")+'</button>'+
            '<button class="button secondary radius" id="template_template_reset_button" value="reset" type="reset">'+tr("Reset")+'</button>'+
      '</form>'+
    '</div>' +
    '<div class="content" id="manual">' +
     '<form id="create_template_form_manual" action="">' +
        '<div class="row">' +
          '<div class="large-12 columns">' +
            '<p>'+tr("Write the Virtual Machine template here")+'</p>' +
          '</div>' +
        '</div>' +
        '<div class="row">' +
          '<div class="large-12 columns">' +
            '<textarea id="template" rows="15"></textarea>' +
          '</div>' +
        '</div>' +
          '<div class="form_buttons">' +
            '<button class="button success right radius" id="create_template_submit_manual" value="template/create">'+tr("Create")+'</button>' +
            '<button class="button hidden radius" id="manual_template_update_button" value="Template.update_template" style="float: right">'+tr("Update")+'</button>'+
          '</div>' +
      '</form>' +
    '</div>' +
'</div>'+
'<a class="close-reveal-modal">&#215;</a>';

var instantiate_vm_template_tmpl ='\
<div class="row">\
  <h3 id="create_vnet_header" class="subheader">'+tr("Instantiate VM Template")+'</h3>\
</div>\
<form id="instantiate_vm_template_form" action="">\
  <div class="row">\
    <div class="large-12 columns">\
        <label for="vm_name">'+tr("VM Name")+
          '<span class="tip">'+tr("Defaults to template name when emtpy. You can use the wildcard &#37;i. When creating several VMs, &#37;i will be replaced with a different number starting from 0 in each of them")+'.</span>'+
        '</label>\
        <input type="text" name="vm_name" id="vm_name" />\
    </div>\
  </div>\
  <div class="row">\
    <div class="large-12 columns">\
        <label for="vm_n_times">'+tr("Number of instances")+
          '<span class="tip">'+tr("Number of Virtual Machines that will be created using this template")+'.</span>'+
        '</label>\
        <input type="text" name="vm_n_times" id="vm_n_times" value="1">\
    </div>\
  </div>\
  <div class="form_buttons">\
     <button class="button radius right success" id="instantiate_vm_tenplate_proceed" value="Template.instantiate_vms">'+tr("Instantiate")+'</button>\
  </div>\
  <a class="close-reveal-modal">&#215;</a>\
</form>';

var easy_provision_vm_template_tmpl ='\
<div class="row">\
  <h3 id="create_vnet_header" class="subheader">'+tr("Instantiate VM Template")+'</h3>\
</div>\
<div class="reveal-body">\
  <form id="instantiate_vm_template_form" action="">\
      <fieldset>\
        <legend>'+tr("Step 1: Specify a name and the number of instances")+'</legend>\
        <div class="row">\
          <div class="large-6 columns">\
              <label for="vm_name">'+tr("VM Name")+
                '<span class="tip">'+tr("Defaults to template name when emtpy. You can use the wildcard &#37;i. When creating several VMs, &#37;i will be replaced with a different number starting from 0 in each of them")+'.</span>'+
              '</label>\
              <input type="text" name="vm_name" id="vm_name" />\
          </div>\
          <div class="large-6 columns">\
              <label for="vm_n_times">'+tr("Number of instances")+
                '<span class="tip">'+tr("Number of Virtual Machines that will be created using this template")+'.</span>'+
              '</label>\
              <input type="text" name="vm_n_times" id="vm_n_times" value="1">\
          </div>\
        </div>\
      </fieldset>\
      <fieldset>\
        <legend>'+tr("Step 2: Select a template")+'</legend>\
        <div class="row">\
          <div class="large-8 columns">\
             <button id="refresh_template_templates_table_button_class" type="button" class="refresh button small radius secondary"><i class="fa fa-refresh" /></button>\
          </div>\
          <div class="large-4 columns">\
            <input id="template_templates_table_search" class="search" type="text" placeholder="'+tr("Search")+'"/>\
          </div>\
        </div>\
        <div class="row">\
          <div class="large-12 columns">\
            <table id="template_templates_table" class="datatable twelve">\
              <thead>\
                <tr>\
                  <th></th>\
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
        <div class="row hidden">\
          <div class="large-12 columns">\
            <label class="right inline" for="TEMPLATE_ID">'+tr("TEMPLATE_ID")+':</label>\
            <input type="text" id="TEMPLATE_ID" name="TEMPLATE_ID"/>\
          </div>\
        </div>\
        <div id="selected_template" class="vm_param row">\
          <div class="large-12 columns">\
            <span id="select_template" class="radius secondary label">'+tr("Please select a template from the list")+'</span>\
            <span id="template_selected" class="radius secondary label" style="display: none;">'+tr("You selected the following template:")+'</span>\
            <span class="radius label" type="text" id="TEMPLATE_NAME" name="template"></span>\
          </div>\
        </div>\
      </fieldset>\
      <fieldset>\
        <legend>'+tr("Step 3: Select an operating system")+'</legend>\
        <div class="row">\
          <div class="large-8 columns">\
             <button id="refresh_template_images_table_button_class" type="button" class="refresh button small radius secondary"><i class="fa fa-refresh" /></button>\
          </div>\
          <div class="large-4 columns">\
            <input id="template_images_table_search" type="text" class="search" placeholder="'+tr("Search")+'"/>\
          </div>\
        </div>\
        <div class="row">\
          <div class="large-8 columns">\
            <table id="template_images_table" class="datatable twelve">\
              <thead>\
                <tr>\
                  <th></th>\
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
          </div>\
        </div>\
        <div class="row hidden">\
          <div class="large-12 columns">\
            <label class="right inline" for="IMAGE_ID">'+tr("IMAGE_ID")+':</label>\
            <input type="text" id="IMAGE_ID" name="IMAGE_ID"/>\
          </div>\
        </div>\
        <div id="selected_image" class="vm_param row">\
          <div class="large-12 columns">\
            <span id="select_image" class="radius secondary label">'+tr("Please select an image from the list")+'</span>\
            <span id="image_selected" class="radius secondary label" style="display: none;">'+tr("You selected the following image:")+'</span>\
            <span class="radius label" type="text" id="IMAGE_NAME" name="image"></span>\
          </div>\
        </div>\
      </fieldset>\
    <div class="form_buttons reveal-footer">\
         <button class="button radius right success" id="instantiate_vm_tenplate_proceed" value="Template.instantiate_vms">'+tr("Instantiate")+'</button>\
    </div>\
    <a class="close-reveal-modal">&#215;</a>\
  </form>\
</div>';

var dataTable_templates;
var $create_template_dialog;

var template_actions = {

    "Template.create" : {
        type: "create",
        call: OpenNebula.Template.create,
        callback: function(request, response){
          $create_template_dialog.foundation('reveal', 'close');
          addTemplateElement(request, response);
          notifyCustom(tr("Template created"), " ID: " + response.VMTEMPLATE.ID, false)
        },
        error: onError
    },

    "Template.create_dialog" : {
        type: "custom",
        call: popUpCreateTemplateDialog
    },

    "Template.easy_provision" : {
        type: "custom",
        call: function() {
          popUpInstantiateVMTemplateDialog(true);
        }
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
        callback: function(request, response){
            var tab = dataTable_templates.parents(".tab");

            if (Sunstone.rightInfoVisible(tab)) {
                // individual view
                updateTemplateInfo(request, response);
            }

            // datatable row
            updateTemplateElement(request, response);
        },
        error: onError
    },

    "Template.refresh" : {
        type: "custom",
        call: function () {
          var tab = dataTable_templates.parents(".tab");
          if (Sunstone.rightInfoVisible(tab)) {
            Sunstone.runAction("Template.show", Sunstone.rightInfoResourceId(tab))
          } else {
            waitingNodes(dataTable_templates);
            Sunstone.runAction("Template.list", {force: true});
          }
        }
    },

    "Template.show_to_update" : {
        type: "single",
        call: OpenNebula.Template.show,
        callback: function(request, response) {
          template_to_update_id = response.VMTEMPLATE.ID;

          popUpUpdateTemplateDialog();
          fillTemplatePopUp(
            response.VMTEMPLATE.TEMPLATE,
            $create_template_dialog);
        },
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
            notifyMessage(tr("Template renamed correctly"));
            Sunstone.runAction("Template.show",request.request.data[0]);
        },
        error: onError,
        notify: true
    },

    "Template.update" : {
        type: "single",
        call: OpenNebula.Template.update,
        callback: function(request, response){
            $create_template_dialog.foundation('reveal', 'close');
            templateShow(request);
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
        callback: function(req){
            OpenNebula.Helper.clear_cache("VM");
        },
        elements: templateElements,
        error: onError,
        notify: true
    },

    "Template.instantiate_quiet" : {
        type: "single",
        call: OpenNebula.Template.instantiate,
        callback: function(req){
            OpenNebula.Helper.clear_cache("VM");
        },
        error: onError,
        notify: false
    },

     "Template.instantiate_vms" : {
         type: "custom",
         call: function(){
             nodes = getSelectedNodes(dataTable_templates);
             if (nodes.length == 1)
             {
               popUpInstantiateVMTemplateDialog(false);
             }
             else
             {
                Sunstone.runAction("Template.instantiate", nodes);
             }
         }
     },
/*
     "Template.instantiate_and_merge" : {
         type: "custom",
         call: function(){
             nodes = getSelectedNodes(dataTable_templates);
             if (nodes.length == 1)
             {
               popUpMergeVMTemplateDialog();
             }
             else
             {
                notifyError(tr("Please select only one template in the table"))
             }
         }
     },
*/
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
//    "Sunstone.toggle_top" : {
//        type: "custom",
//        layout: "top",
//        alwaysActive: true
//    },
    "Template.create_dialog" : {
        type: "create_dialog",
        layout: "create"
    },
    "Template.easy_provision" : {
        type: "create_dialog",
        text: "Launch",
        layout: "create"
    },
    "Template.update_dialog" : {
        type: "action",
        layout: "main",
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
        select: "User",
        tip: tr("Select the new owner")+":",
        condition: mustBeAdmin
    },
    "Template.chgrp" : {
        type: "confirm_with_select",
        text: tr("Change group"),
        layout: "user_select",
        select: "Group",
        tip: tr("Select the new group")+":",
        condition: mustBeAdmin
    },
    "Template.clone_dialog" : {
        type: "action",
        layout: "main",
        text: tr("Clone")
    },
    "Template.delete" : {
        type: "confirm",
        layout: "del"
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
    resource: 'Template',
    buttons: template_buttons,
    tabClass: 'subTab',
    parentTab: 'vresources-tab',
    search_input: '<input id="template_search" type="text" placeholder="'+tr("Search")+'" />',
    list_header: '<i class="fa fa-fw fa-file-o"></i>&emsp;'+tr("Templates"),
    info_header: '<i class="fa fa-fw fa-file-o"></i>&emsp;'+tr("Template"),
    subheader: '<span/> <small></small>&emsp;</span>',
    table: '<table id="datatable_templates" class="datatable twelve">\
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
      </table>'
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

// Callback to update an element in the dataTable
function updateTemplateElement(request, template_json){
    var id = template_json.VMTEMPLATE.ID;
    var element = templateElementArray(template_json);
    updateSingleElement(element,dataTable_templates,'#template_'+id);
}

// Callback to remove an element from the dataTable
function deleteTemplateElement(req){
    deleteElement(dataTable_templates,'#template_'+req.request.data);
}

// Callback to add a template element
function addTemplateElement(request, template_json){
    var element = templateElementArray(template_json);
    addElement(element,dataTable_templates);
}

// Callback to refresh the list of templates
function updateTemplatesView(request, templates_list){
    var template_list_array = [];

    $.each(templates_list,function(){
       template_list_array.push(templateElementArray(this));
    });

    updateView(template_list_array,dataTable_templates);
}

function generate_capacity_tab_content() {
    var html = '<div class="row vm_param">'+
        '<div class="large-8 columns">'+
          '<div class="row collapse">'+
            '<div id="template_name_form"  class="large-12 columns">'+
              '<label  for="NAME">'+tr("Name")+'\
                <span class="tip">'+tr("Name that the VM will get for description purposes.")+'</span>\
              </label>'+
              '<input type="text" id="NAME" name="name"/>'+
            '</div>'+
            '<div class="large-12 columns">'+
              '<label  for="DESCRIPTION">'+tr("Description")+'\
                <span class="tip">'+tr("Description of the template")+'</span>\
              </label>'+
              '<textarea type="text" id="DESCRIPTION" name="DESCRIPTION" style="height: 100px;"/>'+
            '</div>'+
          '</div>'+
        '</div>'+
        '<div class="large-4 columns">'+
          '<div class="row collapse">'+
            '<div class="large-12 columns">'+
              '<label  for="LOGO">'+tr("Logo")+'\
                <span class="tip">'+tr("Logo for the template.")+'</span>\
              </label>'+
              '<select id="LOGO" name="LOGO">'+
                  '<option value="">'+tr("")+'</option>'+
                  '<option value="images/logos/arch.png">'+tr("Arch Linux")+'</option>'+
                  '<option value="images/logos/centos.png">'+tr("CentOS")+'</option>'+
                  '<option value="images/logos/debian.png">'+tr("Debian")+'</option>'+
                  '<option value="images/logos/fedora.png">'+tr("Fedora")+'</option>'+
                  '<option value="images/logos/linux.png">'+tr("Linux")+'</option>'+
                  '<option value="images/logos/redhat.png">'+tr("Redhat")+'</option>'+
                  '<option value="images/logos/ubuntu.png">'+tr("Ubuntu")+'</option>'+
                  '<option value="images/logos/windowsxp.png">'+tr("Windows XP/2003")+'</option>'+
                  '<option value="images/logos/windows8.png">'+tr("Windows 8")+'</option>'+
              '</select>'+
            '</div>'+
            '<div id="template_create_logo" class="large-12 columns" style="margin-bottom: 15px">'+
            '</div>'+
            '<br>'+
          '</div>'+
        '</div>'+
    '</div>'+
    '<div class="vm_param">'+
        '<input type="hidden" id="MEMORY" name="memory" />'+
    '</div>'+
    '<div class="row">'+
        '<div class="large-2 columns">'+
          '<label class="inline" for="MEMORY">'+tr("Memory")+'\
            <span class="tip right">'+tr("Amount of RAM required for the VM, in Megabytes.")+'</span>\
          </label>'+
        '</div>'+
        '<div class="large-6 columns">'+
          '<div id="memory_slider" class="large-7 columns">'+
          '</div>'+
        '</div>'+
        '<div class="large-2 columns">'+
          '<input type="text" id="MEMORY_TMP" name="memory_tmp" size="4" />'+
        '</div>'+
        '<div class="large-2 columns">'+
          '<select id="memory_unit" name="MEMORY_UNIT">'+
              '<option value="MB">'+tr("MB")+'</option>'+
              '<option value="GB">'+tr("GB")+'</option>'+
          '</select>'+
        '</div>'+
    '</div>'+
    '<div class="row">'+
        '<div class="large-2 columns">'+
          '<label class="inline" for="CPU">'+tr("CPU")+'\
            <span class="tip right">'+tr("Percentage of CPU divided by 100 required for the Virtual Machine. Half a processor is written 0.5.")+'</span>\
          </label>'+
        '</div>'+
        '<div class="large-8 columns">'+
          '<div id="cpu_slider">'+
          '</div>'+
        '</div>'+
        '<div class="large-2 columns vm_param">'+
          '<input type="text" id="CPU" name="cpu"/>'+
        '</div>'+
    '</div>'+
    '<div class="row">'+
      '<div class="large-12 columns">'+
        '<dl class="tabs wizard_tabs" data-tab>' +
          '<dd><a href="#advanced_capacity">'+tr("Advanced options")+'</a></dd>' +
        '</dl>' +
      '</div>'+
    '</div>'+
    '<div class="tabs-content">' +
      '<div class="content row" id="advanced_capacity">' +
        '<div class="large-2 columns">'+
          '<label class="inline" for="VCPU">'+tr("VCPU")+'\
            <span class="tip right">'+tr("Number of virtual cpus. This value is optional, the default hypervisor behavior is used, usually one virtual CPU.")+'</span>\
          </label>'+
        '</div>'+
        '<div class="large-8 columns">'+
          '<div id="vcpu_slider">'+
          '</div>'+
        '</div>'+
        '<div class="large-2 columns vm_param">'+
          '<input type="text" id="VCPU" name="vcpu"/>'+
        '</div>'+
      '</div>'+
    '</div>'

    return html;
}

/**************************************************************************
    CAPACITY TAB

**************************************************************************/

function setup_capacity_tab_content(capacity_section) {
    setupTips(capacity_section);

    // Hide advanced options
    $('.advanced',capacity_section).hide();

    $('#advanced_capacity',capacity_section).click(function(){
        $('.advanced',capacity_section).toggle();
        return false;
    });

    capacity_section.on("change", "#LOGO", function(){
      $("#template_create_logo",capacity_section).show();
      $("#template_create_logo",capacity_section).html('<a  class="th radius" href="#">'+
          '<img src="' + $(this).val() + '">'+
        '</a>');
    });

    // Define the cpu slider

    var cpu_input = $( "#CPU", capacity_section);

    var cpu_slider = $( "#cpu_slider", capacity_section).noUiSlider({
        handles: 1,
        connect: "lower",
        range: [0,1600],
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
        start: 51200,
        value: 512,
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
                    value: 51200,
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
                    value: 51200,
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

    // init::start is ignored for some reason
    memory_input.val(512);


    // Define the vcpu slider

    var vcpu_input = $( "#VCPU", capacity_section );

    var vcpu_slider = $( "#vcpu_slider", capacity_section).noUiSlider({
        handles: 1,
        connect: "lower",
        range: [1,16],
        start: 1,
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
        '<div class="large-12 columns text-center">'+
          '<input id="'+str_disk_tab_id+'radioImage" type="radio" name="'+str_disk_tab_id+'" value="image" checked> <label for="'+str_disk_tab_id+'radioImage">'+tr("Image")+'</label>'+
          '<input id="'+str_disk_tab_id+'radioVolatile" type="radio" name="'+str_disk_tab_id+'" value="volatile"> <label for="'+str_disk_tab_id+'radioVolatile">'+tr("Volatile Disk")+'</label>'+
        '</div>'+
      '</div>'+
      '<br>'+
        '<div id="disk_type" class="vm_param image">'+
          '<div class="row collapse">'+
            '<div class="large-8 columns">' +
               '<button id="refresh_template_images_table_button_class'+str_disk_tab_id+'" type="button" class="refresh button small radius secondary"><i class="fa fa-refresh" /></button>' +
            '</div>' +
            '<div class="large-4 columns">'+
              '<input id="'+str_disk_tab_id+'_search" type="text" class="search" placeholder="'+tr("Search")+'"/>'+
            '</div>'+
          '</div>'+
          '<table id="'+str_datatable_id+'" class="datatable twelve">'+
            '<thead>'+
              '<tr>'+
                '<th></th>'+
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
          '<div id="selected_image" class="vm_param kvm_opt xen_opt vmware_opt">'+
            '<span id="select_image" class="radius secondary label">'+tr("Please select an image from the list")+'</span>'+
            '<span id="image_selected" class="radius secondary label " style="display: none;">'+tr("You selected the following image: ")+
            '</span>'+
            '<span class="radius label" type="text" id="IMAGE_NAME" name="image"></span>'+
            '<div class="alert-box alert" style="display: none;">'+
            tr("The image you specified cannot be selected in the table") +
            '</div>'+
          '</div>'+
        '<div class="show_hide" id="advanced_image">'+
          '<h4><small><i class=" fa fa-caret-down"/> '+tr("Advanced options")+'<a id="add_os_boot_opts" class="icon_left" href="#"></a></small></h4>'+
        '</div>'+
        '<div class="advanced">'+
          '<fieldset>'+
          '<legend>'+tr("Image")+'</legend>'+
          '<div class="row advanced vm_param">'+
            '<div class="large-6 columns">'+
              '<label for="IMAGE_ID">'+tr("ID")+
                '<span class="tip">'+tr("Image ID to be used in the Virtual Image disk.")+'</span>'+
              '</label>'+
              '<input type="text" id="IMAGE_ID" name="IMAGE_ID"/>'+
            '</div>'+
            '<div class="large-6 columns">'+
              '<label for="IMAGE">'+tr("Name")+
                '<span class="tip">'+tr("Name of the image to be used in the Virtual Image disk.")+'</span>'+
              '</label>'+
              '<input type="text" id="IMAGE" name="IMAGE"/>'+
            '</div>'+
          '</div>'+
          '<div class="row advanced vm_param">'+
            '<div class="large-6 columns">'+
              '<label for="IMAGE_UID">'+tr("User ID")+
                '<span class="tip">'+tr("Identifier of the user owner of the image to reduce ambiguity.")+'</span>'+
              '</label>'+
              '<input type="text" id="IMAGE_UID" name="IMAGE_UID"/>'+
            '</div>'+
            '<div class="large-6 columns">'+
              '<label for="IMAGE_UNAME">'+tr("User Name")+
                '<span class="tip">'+tr("Name of the user owner of the image to reduce ambiguity.")+'</span>'+
              '</label>'+
              '<input type="text" id="IMAGE_UNAME" name="IMAGE_UNAME"/>'+
            '</div>'+
          '</div>'+
          '</fieldset>'+
          '<div class="row advanced vm_param">'+
            '<div class="large-6 columns">'+
              '<label for="TARGET">'+tr("Target")+
                  '<span class="tip">'+tr("Device to map image disk. If set, it will overwrite the default device mapping")+'<br><br>\
                      '+tr("Xen: Optional")+'<br>\
                      '+tr("KVM: Optional")+'<br>\
                      '+tr("VMWare: Optional")+
                  '</span>'+
              '</label>'+
              '<input type="text"  id="TARGET" name="target"/>'+
            '</div>'+
            '<div class="large-6 columns">'+
              '<label for="DRIVER">'+tr("Driver")+
                  '<span class="tip">'+tr("Specific image mapping driver")+'<br><br>\
                    '+tr("Xen: Optional (tap:aio:, file:)")+'<br>\
                    '+tr("KVM: Optional (raw, qcow2)")+'<br>\
                    '+tr("VMWare: Not supported")+
                  '</span>'+
              '</label>'+
              '<input type="text" id="DRIVER" name="driver" />'+
            '</div>'+
          '</div>'+
          '<div class="row advanced vm_param">'+
            '<div class="large-6 columns">'+
              '<label for="DEV_PREFIX">'+tr("Device Prefix")+
                  '<span class="tip">'+tr("Prefix for the emulated device this image will be mounted at. For instance, “hd”, “sd”, or “vd” for KVM virtio. If omitted, the dev_prefix attribute of the Image will be used")+'<br><br>\
                      '+tr("Xen: Optional")+'<br>\
                      '+tr("KVM: Optional")+'<br>\
                      '+tr("VMWare: Optional")+
                  '</span>'+
              '</label>'+
              '<input type="text" id="DEV_PREFIX" name="DEV_PREFIX"/>'+
            '</div>'+
            '<div class="large-6 columns">'+
              '<label for="READONLY">'+tr("Read Only")+
                  '<span class="tip">'+tr("Set how the image is exposed by the hypervisor")+'<br><br>\
                    '+tr("Xen: Optional")+'<br>\
                    '+tr("KVM: Optional")+'<br>\
                    '+tr("VMWare: Optional")+
                  '</span>'+
              '</label>'+
              '<select id="READONLY" name="READONLY">'+
                '<option value=""></option>'+
                '<option value="yes">'+tr("yes")+'</option>'+
                '<option value="no">'+tr("no")+'</option>'+
              '</select>'+
            '</div>'+
          '</div>'+
          '<div class="row advanced vm_param">'+
            '<div class="large-6 columns">'+
              '<label for="CACHE">'+tr("Cache")+
                  '<span class="tip">'+tr("Selects the cache mechanism for the disk.")+'<br><br>\
                      '+tr("Xen: Not supported")+'<br>\
                      '+tr("KVM: Optional")+'<br>\
                      '+tr("VMWare: Not supported")+
                  '</span>'+
              '</label>'+
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
            '<div class="large-6 columns">'+
              '<label for="IO">'+tr("IO")+
                '<span class="tip">'+tr("Set IO policy.")+'<br><br>\
                  '+tr("Xen: Not supported")+'<br>\
                  '+tr("KVM: Optional")+'<br>\
                  '+tr("VMWare: Not supported")+
                '</span>'+
              '</label>'+
              '<select id="IO" name="IO">'+
                '<option value=""></option>'+
                '<option value="threads">'+tr("threads")+'</option>'+
                '<option value="native">'+tr("native")+'</option>'+
              '</select>'+
            '</div>'+
          '</div>'+
        '</div>'+
      '</div>'+
      '<div id="disk_type" class="volatile" style="display: none;">'+
        '<br>'+
        '<div class="vm_param">'+
            '<input type="hidden" id="SIZE" name="size" />'+
        '</div>'+
        '<div class="row">'+
          '<div class="large-2 columns">'+
            '<label class="inline" for="SIZE_TMP">'+tr("Size")+'\
              <span class="tip">'+tr("Size of the new disk")+'</span>\
            </label>'+
          '</div>'+
          '<div class="large-6 columns">'+
            '<div id="size_slider" class="large-7 columns">'+
            '</div>'+
          '</div>'+
          '<div class="large-2 columns">'+
            '<input type="text" id="SIZE_TMP" name="size_tmp" size="4" />'+
          '</div>'+
          '<div class="large-2 columns">'+
              '<select id="size_unit" name="SIZE_UNIT">'+
                  '<option value="GB">'+tr("GB")+'</option>'+
                  '<option value="MB">'+tr("MB")+'</option>'+
              '</select>'+
          '</div>'+
        '</div>'+
        '<div class="row vm_param">'+
          '<div class="large-6 columns">'+
              '<label for="TYPE">'+tr("Type")+
                '<span class="tip">'+tr("Disk type")+'</span>'+
              '</label>'+
              '<select id="TYPE" name="type">'+
                '<option value="fs">'+tr("FS")+'</option>'+
                '<option value="swap">'+tr("Swap")+'</option>'+
              '</select>'+
          '</div>'+
          '<div class="large-6 columns">'+
              '<label for="FORMAT">'+tr("Format")+
                '<span class="tip">'+tr("Filesystem type for the fs images")+'</span>'+
              '</label>'+
              '<input type="text" id="FORMAT" name="format" />'+
          '</div>'+
        '</div>'+
        '<div class="show_hide" id="advanced_volatile">'+
          '<h4><small><i class=" fa fa-caret-down"/> '+tr("Advanced options")+'<a id="add_os_boot_opts" class="icon_left" href="#"></a></small></h4>'+
        '</div>'+
        '<div class="advanced">'+
          '<div class="row advanced vm_param">'+
            '<div class="large-6 columns">'+
              '<label for="TARGET">'+tr("Target")+
                  '<span class="tip">'+tr("Device to map image disk. If set, it will overwrite the default device mapping")+'<br><br>\
                      '+tr("Xen: Optional")+'<br>\
                      '+tr("KVM: Optional")+'<br>\
                      '+tr("VMWare: Optional")+
                  '</span>'+
              '</label>'+
              '<input type="text"  id="TARGET" name="target"/>'+
            '</div>'+
            '<div class="large-6 columns">'+
              '<label for="DRIVER">'+tr("Driver")+
                  '<span class="tip">'+tr("Specific image mapping driver")+'<br><br>\
                    '+tr("Xen: Optional (tap:aio:, file:)")+'<br>\
                    '+tr("KVM: Optional (raw, qcow2)")+'<br>\
                    '+tr("VMWare: Not supported")+
                  '</span>'+
              '</label>'+
              '<input type="text" id="DRIVER" name="driver" />'+
            '</div>'+
          '</div>'+
          '<div class="row advanced vm_param">'+
            '<div class="large-6 columns">'+
              '<label for="DEV_PREFIX">'+tr("Device Prefix")+
                  '<span class="tip">'+tr("Prefix for the emulated device this image will be mounted at. For instance, “hd”, “sd”, or “vd” for KVM virtio. If omitted, the dev_prefix attribute of the Image will be used")+'<br><br>\
                      '+tr("Xen: Optional")+'<br>\
                      '+tr("KVM: Optional")+'<br>\
                      '+tr("VMWare: Optional")+
                  '</span>'+
              '</label>'+
              '<input type="text" id="DEV_PREFIX" name="DEV_PREFIX"/>'+
            '</div>'+
            '<div class="large-6 columns">'+
              '<label for="READONLY">'+tr("Read Only")+
                  '<span class="tip">'+tr("Set how the image is exposed by the hypervisor")+'<br><br>\
                    '+tr("Xen: Optional")+'<br>\
                    '+tr("KVM: Optional")+'<br>\
                    '+tr("VMWare: Optional")+
                  '</span>'+
              '</label>'+
              '<select id="READONLY" name="READONLY">'+
                '<option value=""></option>'+
                '<option value="yes">'+tr("yes")+'</option>'+
                '<option value="no">'+tr("no")+'</option>'+
              '</select>'+
            '</div>'+
          '</div>'+
          '<div class="row advanced vm_param">'+
            '<div class="large-6 columns">'+
              '<label for="CACHE">'+tr("Cache")+
                  '<span class="tip">'+tr("Selects the cache mechanism for the disk.")+'<br><br>\
                      '+tr("Xen: Not supported")+'<br>\
                      '+tr("KVM: Optional")+'<br>\
                      '+tr("VMWare: Not supported")+
                  '</span>'+
              '</label>'+
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
            '<div class="large-6 columns">'+
              '<label for="IO">'+tr("IO")+
                '<span class="tip">'+tr("Set IO policy.")+'<br><br>\
                  '+tr("Xen: Not supported")+'<br>\
                  '+tr("KVM: Optional")+'<br>\
                  '+tr("VMWare: Not supported")+
                '</span>'+
              '</label>'+
              '<select id="IO" name="IO">'+
                '<option value=""></option>'+
                '<option value="threads">'+tr("threads")+'</option>'+
                '<option value="native">'+tr("native")+'</option>'+
              '</select>'+
            '</div>'+
          '</div>'+
        '</div>'+
    '</div>';

    $("#refresh_template_images_table_button_class"+str_disk_tab_id).die();
    $("#refresh_template_images_table_button_class"+str_disk_tab_id).live('click', function(){
        update_datatable_template_images($('table[id='+str_datatable_id+']').dataTable());
    });

    return html;
}

function update_datatable_template_hosts(datatable, fnDrawCallback) {
    if (fnDrawCallback) {
        datatable.unbind('draw');
        datatable.on('draw', fnDrawCallback);
    }

    OpenNebula.Host.list({
    timeout: true,
    success: function (request, host_list){
        var host_list_array = [];

        $.each(host_list,function(){
            //Grab table data from the host_list
            host_list_array.push(hostElementArray(this));
        });

        updateView(host_list_array, datatable);
    },
    error: onError
  });
}

function update_datatable_template_datastores(datatable, fnDrawCallback) {
    if (fnDrawCallback) {
        datatable.unbind('draw');
        datatable.on('draw', fnDrawCallback);
    }

    OpenNebula.Datastore.list({
    timeout: true,
    success: function (request, datastore_list){
        var datastore_list_array = [];

        $.each(datastore_list,function(){
            //Grab table data from the datastore_list
            datastore_list_array.push(datastoreElementArray(this));
        });

        updateView(datastore_list_array, datatable);
    },
    error: onError
  });
}

function update_datatable_template_clusters(datatable, fnDrawCallback) {
    if (fnDrawCallback) {
        datatable.unbind('draw');
        datatable.on('draw', fnDrawCallback);
    }

    OpenNebula.Cluster.list({
    timeout: true,
    success: function (request, host_list){
        var host_list_array = [];

        $.each(host_list,function(){
            //Grab table data from the host_list
            host_list_array.push(clusterElementArray(this));
        });

        updateView(host_list_array, datatable);
    },
    error: onError
  });
}

function update_datatable_template_images(datatable, fnDrawCallback) {
    if (fnDrawCallback) {
        datatable.unbind('draw');
        datatable.on('draw', fnDrawCallback);
    }

    OpenNebula.Image.list({
        timeout: true,
        success: function (request, images_list){
            var image_list_array = [];

            $.each(images_list,function(){
              var image_element_array = imageElementArray(this);
              if (image_element_array)
                    image_list_array.push(image_element_array);
            });

            updateView(image_list_array, datatable);
        }
    });
}

function update_datatable_template_templates(datatable, fnDrawCallback) {
    if (fnDrawCallback) {
        datatable.unbind('draw');
        datatable.on('draw', fnDrawCallback);
    }

    OpenNebula.Template.list({
        timeout: true,
        success: function (request, templates_list){
            var template_list_array = [];

            $.each(templates_list,function(){
              var template_element_array = templateElementArray(this);
              if (template_element_array)
                    template_list_array.push(template_element_array);
            });

            updateView(template_list_array, datatable);
        }
    });
}

function update_datatable_template_files(datatable, fnDrawCallback) {
    if (fnDrawCallback) {
        datatable.unbind('draw');
        datatable.on('draw', fnDrawCallback);
    }

    OpenNebula.Image.list({
        timeout: true,
        success: function (request, images_list){
            var image_list_array = [];

            $.each(images_list,function(){
              var image_element_array = fileElementArray(this);
              if (image_element_array)
                    image_list_array.push(image_element_array);
            });

            updateView(image_list_array, datatable);
        }
    });
}

function update_datatable_template_networks(datatable, fnDrawCallback) {
    if (fnDrawCallback) {
        datatable.unbind('draw');
        datatable.on('draw', fnDrawCallback);
    }

    OpenNebula.Network.list({
      timeout: true,
      success: function (request, networks_list){
          var network_list_array = [];

          $.each(networks_list,function(){
             network_list_array.push(vNetworkElementArray(this));
          });

          updateView(network_list_array, datatable);
      },
      error: onError
    });
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
        "iDisplayLength": 4,
        "bAutoWidth":false,
        "sDom" : '<"H">t<"F"p>',
        "aoColumnDefs": [
            { "sWidth": "35px", "aTargets": [0,1] },
            { "bVisible": false, "aTargets": [0,2,3,6,9,8,12]}
        ],
        "bSortClasses" : false,
        "bDeferRender": true,
          "fnDrawCallback": function(oSettings) {
            var nodes = this.fnGetNodes();
            var datatable = this;
            $.each(nodes, function(){
                var data = datatable.fnGetData(this);
                if (data[1] == $('#IMAGE_ID', disk_section).val() ||
                     (data[4] == $('#IMAGE', disk_section).val() && data[2] == $('#IMAGE_UNAME', disk_section).val()) ) {
                    $("td", this).addClass('markrow');
                    $('input.check_item', this).attr('checked','checked');
                }
            })
          }
    });

    // Retrieve the images to fill the datatable
    update_datatable_template_images(dataTable_template_images);

    $('#'+str_disk_tab_id+'_search', disk_section).keyup(function(){
      dataTable_template_images.fnFilter( $(this).val() );
    })

    dataTable_template_images.fnSort( [ [1,config['user_config']['table_order']] ] );

    $('#'+str_datatable_id + '  tbody', disk_section).delegate("tr", "click", function(e){
        dataTable_template_images.unbind("draw");
        var aData = dataTable_template_images.fnGetData(this);

        $("td.markrow", disk_section).removeClass('markrow');
        $('tbody input.check_item', dataTable_template_images).removeAttr('checked');

        $('#image_selected', disk_section).show();
        $('#select_image', disk_section).hide();
        $('.alert-box', disk_section).hide();

        $("td", this).addClass('markrow');
        $('input.check_item', this).attr('checked','checked');

        $('#IMAGE_NAME', disk_section).text(aData[4]);
        $('#IMAGE_ID', disk_section).val("");
        $('#IMAGE', disk_section).val(aData[4]);
        $('#IMAGE_UNAME', disk_section).val(aData[2]);
        $('#IMAGE_UID', disk_section).val("");
        return true;
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
    '<div class="large-8 columns">' +
       '<button id="refresh_template_nic_table_button_class'+str_nic_tab_id+'" type="button" class="button small radius secondary"><i class="fa fa-refresh" /></button>' +
    '</div>' +
    '<div class="large-4 columns">'+
      '<input id="'+str_nic_tab_id+'_search" class="search" type="text" placeholder="'+tr("Search")+'"/>'+
    '</div>'+
  '</div>'+
  '<div class="row">'+
    '<div class="large-12 columns">'+
      '<table id="'+str_datatable_id+'" class="datatable twelve">'+
        '<thead>'+
          '<tr>'+
            '<th></th>'+
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
      '</div>'+
    '</div>'+
    '<div id="selected_network" class="vm_param kvm_opt xen_opt vmware_opt row">'+
      '<div class="large-12 columns">'+
        '<span id="select_network" class="radius secondary label">'+tr("Please select a network from the list")+'</span>'+
        '<span id="network_selected" class="radius secondary label" style="display: none;">'+tr("You selected the following network:")+'</span>'+
        '<span class="radius label" type="text" id="NETWORK_NAME" name="network"></span>'+
        '<div class="alert-box alert"  style="display: none;">'+
          tr("The network you specified cannot be selected in the table") +
        '</div>'+
      '</div>'+
    '</div>'+
    '<div class="show_hide row" id="advanced">'+
      '<div class="large-12 columns">'+
          '<h4><small><i class=" fa fa-caret-down"/> '+tr("Advanced options")+'<a id="add_os_boot_opts" class="icon_left" href="#"></a></small></h4>'+
      '</div>'+
    '</div>'+
    '<div class="advanced">'+
      '<fieldset>'+
        '<legend>'+tr("Network")+'</legend>'+
        '<div class="row advanced vm_param">'+
          '<div class="large-6 columns">'+
            '<label for="NETWORK_ID">'+tr("ID")+
              '<span class="tip">'+tr("Identifier of the virtual network from which to lease an IP and MAC address to this Virtual Machine network interface.")+'</span>'+
            '</label>'+
            '<input type="text" id="NETWORK_ID" name="NETWORK_ID"/>'+
          '</div>'+
          '<div class="large-6 columns">'+
            '<label for="NETWORK">'+tr("Name")+
              '<span class="tip">'+tr("Name of the virtual network from which to lease an IP and MAC address to this Virtual Machine network interface.")+'</span>'+
            '</label>'+
            '<input type="text" id="NETWORK" name="NETWORK" />'+
          '</div>'+
        '</div>'+
        '<div class="row advanced vm_param">'+
          '<div class="large-6 columns">'+
            '<label for="NETWORK_UID">'+tr("User ID")+
              '<span class="tip">'+tr("Identifier of the user owner of the virtual network from which to lease an IP and MAC address to this Virtual Machine network interface.")+'</span>'+
            '</label>'+
            '<input type="text" id="NETWORK_UID" name="NETWORK_UID"/>'+
          '</div>'+
          '<div class="large-6 columns">'+
            '<label for="NETWORK_UNAME">'+tr("User Name")+
              '<span class="tip">'+tr("Name of the user owner of the virtual network from which to lease an IP and MAC address to this Virtual Machine network interface.")+'</span>'+
            '</label>'+
            '<input type="text" id="NETWORK_UNAME" name="NETWORK_UNAME"/>'+
          '</div>'+
        '</div>'+
      '</fieldset>'+
      '<div class="row vm_param">'+
        '<div class="large-6 columns">'+
          '<label for="IP">'+tr("IP")+
            '<span class="tip">'+tr("Request an specific IP from the Network")+'</span>'+
          '</label>'+
          '<input type="text" id="IP" name="IP" size="3" />'+
        '</div>'+
        '<div class="large-6 columns">'+
          '<label for="MODEL">'+tr("Model")+
            '<span class="tip">'+tr("Hardware that will emulate this network interface. With Xen this is the type attribute of the vif.")+'</span>'+
          '</label>'+
          '<input type="text" id="MODEL" name="MODEL" />'+
        '</div>'+
      '</div>'+
      '<br>'+
      '<fieldset>'+
        '<legend>'+tr("TCP Firewall")+'</legend>'+
        '<div class="row">'+
          '<div class="large-12 columns text-center">'+
            '<input type="radio" class="tcp_type" name="tcp_type" id="'+str_nic_tab_id+'white_tcp_type" value="WHITE_PORTS_TCP"><label for="'+str_nic_tab_id+'white_tcp_type">' + tr("Whitelist") +'</label>'+
            '<input type="radio" class="tcp_type" name="tcp_type" id="'+str_nic_tab_id+'black_tcp_type" value="BLACK_PORTS_TCP"><label for="'+str_nic_tab_id+'black_tcp_type">' + tr("Blacklist") +'</label>'+
          '</div>'+
        '</div>'+
        '<div class="row">'+
          '<div class="large-12 columns">'+
            '<label for="TCP_PORTS">'+tr("PORTS")+
              '<span class="tip">'+tr("A list of ports separated by commas or a ranges separated by semicolons, e.g.: 22,80,5900:6000")+'</span>'+
            '</label>'+
            '<input type="text" id="TCP_PORTS" name="ports" />'+
          '</div>'+
        '</div>'+
      '</fieldset>'+
      '<fieldset>'+
        '<legend>'+tr("UDP Firewall")+'</legend>'+
        '<div class="row">'+
          '<div class="large-12 columns text-center">'+
            '<input type="radio" class="udp_type" name="udp_type" id="'+str_nic_tab_id+'white_udp_type" value="WHITE_PORTS_UDP"><label for="'+str_nic_tab_id+'white_udp_type">' + tr("Whitelist") +'</label>'+
            '<input type="radio" class="udp_type" name="udp_type" id="'+str_nic_tab_id+'black_udp_type" value="BLACK_PORTS_UDP"><label for="'+str_nic_tab_id+'black_udp_type">' + tr("Blacklist") +'</label>'+
          '</div>'+
        '</div>'+
        '<div class="row">'+
          '<div class="large-12 columns">'+
            '<label for="UDP_PORTS">'+tr("PORTS")+
              '<span class="tip">'+tr("A list of ports separated by commas or a ranges separated by semicolons, e.g.: 22,80,5900:6000")+'</span>'+
            '</label>'+
            '<input type="text" id="UDP_PORTS" name="ports" />'+
          '</div>'+
        '</div>'+
      '</fieldset>'+
      '<fieldset>'+
        '<legend>'+tr("ICMP")+'</legend>'+
        '<div class="row">'+
          '<div class="large-12 columns">'+
            '<label>'+
                '<input type="checkbox" name="icmp_type" value="ICMP" id="icmp_type"> '+
                tr("Drop")+
            '</label>'+
          '</div>'+
        '</div>'+
      '</fieldset>'+
    '</div>';

    $("#refresh_template_nic_table_button_class"+str_nic_tab_id).die();

    $("#refresh_template_nic_table_button_class"+str_nic_tab_id).live('click', function(){
        update_datatable_template_networks($('table[id='+str_datatable_id+']').dataTable());
    });

    return html;
}

function retrieve_nic_tab_data(context){
    var data  = {};
    addSectionJSON(data, context);

    var tcp = $("input.tcp_type:checked", context).val();
    if (tcp) {
        data[tcp] = $("#TCP_PORTS", context).val();
    }

    var udp = $("input.udp_type:checked", context).val();
    if (udp) {
        data[udp] = $("#UDP_PORTS", context).val();
    }

    if ($("#icmp_type", context).is(":checked")) {
        data["ICMP"] = "drop"
    }

    return data
}

function fill_nic_tab_data(template_json, context){

    if (template_json["WHITE_PORTS_TCP"]){
        var field = $("input.tcp_type[value='WHITE_PORTS_TCP']", context);
        field.click();

        $("#TCP_PORTS", context).val(htmlDecode(template_json["WHITE_PORTS_TCP"]));
    } else if (template_json["BLACK_PORTS_TCP"]){
        var field = $("input.tcp_type[value='BLACK_PORTS_TCP']", context);
        field.click();

        $("#TCP_PORTS", context).val(htmlDecode(template_json["BLACK_PORTS_TCP"]));
    }

    if (template_json["WHITE_PORTS_UDP"]){
        var field = $("input.udp_type[value='WHITE_PORTS_UDP']", context);
        field.click();

        $("#UDP_PORTS", context).val(htmlDecode(template_json["WHITE_PORTS_UDP"]));
    } else if (template_json["BLACK_PORTS_UDP"]){
        var field = $("input.udp_type[value='BLACK_PORTS_UDP']", context);
        field.click();

        $("#UDP_PORTS", context).val(htmlDecode(template_json["BLACK_PORTS_UDP"]));
    }

    if (template_json["ICMP"]){
        var field = $("#icmp_type", context);
        $("#icmp_type", context).attr('checked','checked');
    }
}

function setup_nic_tab_content(nic_section, str_nic_tab_id, str_datatable_id) {
    var dataTable_template_networks = $('#'+str_datatable_id, nic_section).dataTable({
      "bAutoWidth":false,
      "iDisplayLength": 4,
      "sDom" : '<"H">t<"F"p>',
      "bRetrieve": true,
      "bSortClasses" : false,
      "bDeferRender": true,
      "aoColumnDefs": [
          { "sWidth": "35px", "aTargets": [0,1] },
          { "bVisible": false, "aTargets": [0,7]}
        ],
          "fnDrawCallback": function(oSettings) {
            var datatable = this;
            var nodes = this.fnGetNodes();
            $.each(nodes, function(){
                var data = datatable.fnGetData(this);
                if (data[1] == $('#NETWORK_ID', nic_section).val() ||
                     (data[4] == $('#NETWORK', nic_section).val() && data[2] == $('#NETWORK_UNAME', nic_section).val()) ) {
                    $("td", this).addClass('markrow');
                    $('input.check_item', this).attr('checked','checked');
                }
            })
          }
    });

    // Retrieve the networks to fill the datatable
    update_datatable_template_networks(dataTable_template_networks);

    $('#'+str_nic_tab_id+'_search', nic_section).keyup(function(){
      dataTable_template_networks.fnFilter( $(this).val() );
    })

    dataTable_template_networks.fnSort( [ [1,config['user_config']['table_order']] ] );

    $('#'+str_datatable_id + '  tbody', nic_section).delegate("tr", "click", function(e){
        dataTable_template_networks.unbind("draw");
        var aData = dataTable_template_networks.fnGetData(this);

        $("td.markrow", nic_section).removeClass('markrow');
        $('tbody input.check_item', dataTable_template_networks).removeAttr('checked');

        $('#image_selected', nic_section).show();
        $('#select_image', nic_section).hide();
        $('.alert-box', nic_section).hide();

        $("td", this).addClass('markrow');
        $('input.check_item', this).attr('checked','checked');

        $('#NETWORK_NAME', nic_section).text(aData[4]);
        $('#NETWORK_ID', nic_section).val("");
        $('#NETWORK', nic_section).val(aData[4]);
        $('#NETWORK_UNAME', nic_section).val(aData[2]);
        $('#NETWORK_UID', nic_section).val("");
        return true;
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
        title : tr("Info"),
        icon: "fa-info-circle",
        content:
        '<div class="row">\
         <div class="large-6 columns">\
         <table id="info_template_table" class="dataTable extended_table">\
             <thead>\
               <tr><th colspan="2">'+tr("Information")+'</th><th></th></tr>\
             </thead>\
             <tr>\
               <td class="key_td">'+tr("ID")+'</td>\
               <td class="value_td">'+template_info.ID+'</td>\
               <td>\
             </tr>'+
            insert_rename_tr(
                'templates-tab',
                "Template",
                template_info.ID,
                template_info.NAME)+
            '<tr>\
               <td class="key_td">'+tr("Register time")+'</td>\
               <td class="value_td">'+pretty_time(template_info.REGTIME)+'</td>\
               <td></td>\
             </tr>\
            </table>\
        </div>\
        <div class="large-6 columns">' + insert_permissions_table('templates-tab',
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
        icon: "fa-file-o",
        content: '<div class="row">\
          <div class="large-12 columns">\
            <table id="template_template_table" class="info_table dataTable" style="width:80%">'+
            prettyPrintJSON(template_info.TEMPLATE)+'\
            </table>\
          </div>\
        </div>'
    };

    Sunstone.updateInfoPanelTab("template_info_panel","template_info_tab",info_tab);
    Sunstone.updateInfoPanelTab("template_info_panel","template_template_tab",template_tab);

    Sunstone.popUpInfoPanel("template_info_panel", "templates-tab");

    // Populate permissions grid
    setPermissionsTable(template_info,'');
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
            if (field.val() != null && field.val().length){ //if has a length
                template_json[field.attr('id')]=field.val();
            };
        };
    });
};

//Given an object, removes those elements which are empty
//Used to clean up a template JSON before submitting
//it to opennebula.js
function removeEmptyObjects(obj){
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

function wizard_tab_dd(){
    var str = "";

    if (Config.isTemplateCreationTabEnabled('general')){
        str += "<dd class='active'><a href='#capacityTab'><i class='fa fa-laptop'></i><br>"+tr("General")+"</a></dd>";
    }

    if (Config.isTemplateCreationTabEnabled('storage')){
        str += "<dd><a href='#storageTab'><i class='fa fa-tasks'></i><br>"+tr("Storage")+"</a></dd>";
    }

    if (Config.isTemplateCreationTabEnabled('network')){
        str += "<dd><a href='#networkTab'><i class='fa fa-globe'></i><br>"+tr("Network")+"</a></dd>";
    }

    if (Config.isTemplateCreationTabEnabled('os_booting')){
        str += "<dd><a href='#osTab'><i class='fa fa-power-off'></i><br>OS Booting</a></dd>";
    }

    if (Config.isTemplateCreationTabEnabled('input_output')){
        str += "<dd><a href='#ioTab'><i class='fa fa-exchange'></i><br>Input/Output</a></dd>";
    }

    if (Config.isTemplateCreationTabEnabled('context')){
        str += "<dd><a href='#contextTab'><i class='fa fa-folder'></i><br>Context</a></dd>";
    }

    if (Config.isTemplateCreationTabEnabled('scheduling')){
        str += "<dd><a href='#schedulingTab'><i class='fa fa-sitemap'></i><br>Scheduling</a></dd>";
    }

    if (Config.isTemplateCreationTabEnabled('other')){
        str += "<dd><a href='#rawTab'><i class='fa fa-ellipsis-h'></i><br>"+tr("Other")+"</a></dd>";
    }

    return str;
}

function wizard_tab_content(){

    var str = ""

    if (Config.isTemplateCreationTabEnabled('general')){
        str += '<div id="capacityTab" class="active wizard_tab content">'+
                generate_capacity_tab_content() +
                '</div>';
    }

    if (Config.isTemplateCreationTabEnabled('storage')){
        str +=
        '<div id="storageTab" class="wizard_tab content">'+
          '<dl class="tabs vertical" id="template_create_storage_tabs" data-tab>'+
            '<dt class="text-center"><button type="button" class="button tiny radius" id="tf_btn_disks"><span class="fa fa-plus"></span>'+tr("Add another disk")+'</button></dt>'+
          '</dl>'+
          '<div class="tabs-content vertical" id="template_create_storage_tabs_content">'+
          '</div>'+
        '</div>';
    }

    if (Config.isTemplateCreationTabEnabled('network')){
        str +=
        '<div id="networkTab" class="content wizard_tab">'+
          '<dl class="tabs vertical" id="template_create_network_tabs" data-tab>'+
            '<dt class="text-center"><button type="button" class="button tiny radius" id="tf_btn_nics"><span class="fa fa-plus"></span> '+tr("Add another nic")+'</button></dt>'+
          '</dl>'+
          '<div class="tabs-content vertical" id="template_create_network_tabs_content">'+
          '</div>'+
        '</div>';
    }
    if (Config.isTemplateCreationTabEnabled('os_booting')){
        str +=
'<div id="osTab" class="wizard_tab content">'+
  '<div id="tabs-bootos">'+
    '<dl class="tabs vertical" data-tab>'+
      '<dd class="active"><a href="#bootTab">'+tr("Boot")+'</a></dd>'+
      '<dd><a href="#kernelTab">'+tr("Kernel")+'</a></dd>'+
      '<dd><a href="#ramdiskTab">'+tr("Ramdisk")+'</a></dd>'+
      '<dd><a href="#featuresTab">'+tr("Features")+'</a></dd>'+
    '</dl>'+
    '<div class="tabs-content vertical">'+
      '<div class="wizard_internal_tab active content" id="bootTab">'+
        '<div class="row vm_param">'+
          '<div class="large-3 columns">'+
            '<label for="ARCH">'+tr("Arch")+
              '<span class="tip">'+tr("CPU architecture to virtualization")+'</span>'+
            '</label>'+
            '<select id="ARCH" name="arch">'+
              '<option id="no_arch" name="no_arch" value=""></option>'+
              '<option value="i686">i686</option>'+
              '<option value="x86_64">x86_64</option>'+
            '</select>'+
          '</div>'+
          '<div class="large-4 columns">'+
            '<label for="MACHINE">'+tr("Machine type")+
              '<span class="tip">'+tr("libvirt machine type, only for KVM")+'</span>'+
            '</label>'+
            '<input type="text" id="MACHINE" name="machine" />'+
          '</div>'+
          '<div class="large-5 columns">'+
            '<label for="GUESTOS">'+tr("Guest OS")+
              '<span class="tip">'+tr("Set the OS of the VM, only for VMware")+'</span>'+
            '</label>'+
            '<select id="GUESTOS" name="GUESTOS">'+
              '<option id="no_guestos" name="no_guestos" value=""></option>'+
              '<option value="asianux3_64Guest">asianux3_64Guest</option>'+
              '<option value="asianux3Guest">asianux3Guest</option>'+
              '<option value="asianux4_64Guest">asianux4_64Guest</option>'+
              '<option value="asianux4Guest">asianux4Guest</option>'+
              '<option value="centos64Guest">centos64Guest</option>'+
              '<option value="centosGuest">centosGuest</option>'+
              '<option value="darwin64Guest">darwin64Guest</option>'+
              '<option value="darwinGuest">darwinGuest</option>'+
              '<option value="debian4_64Guest">debian4_64Guest</option>'+
              '<option value="debian4Guest">debian4Guest</option>'+
              '<option value="debian5_64Guest">debian5_64Guest</option>'+
              '<option value="debian5Guest">debian5Guest</option>'+
              '<option value="dosGuest">dosGuest</option>'+
              '<option value="eComStationGuest">eComStationGuest</option>'+
              '<option value="freebsd64Guest">freebsd64Guest</option>'+
              '<option value="freebsdGuest">freebsdGuest</option>'+
              '<option value="mandriva64Guest">mandriva64Guest</option>'+
              '<option value="mandrivaGuest">mandrivaGuest</option>'+
              '<option value="netware4Guest">netware4Guest</option>'+
              '<option value="netware5Guest">netware5Guest</option>'+
              '<option value="netware6Guest">netware6Guest</option>'+
              '<option value="nld9Guest">nld9Guest</option>'+
              '<option value="oesGuest">oesGuest</option>'+
              '<option value="openServer5Guest">openServer5Guest</option>'+
              '<option value="openServer6Guest">openServer6Guest</option>'+
              '<option value="oracleLinux64Guest">oracleLinux64Guest</option>'+
              '<option value="oracleLinuxGuest">oracleLinuxGuest</option>'+
              '<option value="os2Guest">os2Guest</option>'+
              '<option value="other24xLinux64Guest">other24xLinux64Guest</option>'+
              '<option value="other24xLinuxGuest">other24xLinuxGuest</option>'+
              '<option value="other26xLinux64Guest">other26xLinux64Guest</option>'+
              '<option value="other26xLinuxGuest">other26xLinuxGuest</option>'+
              '<option value="otherGuest">otherGuest</option>'+
              '<option value="otherGuest64">otherGuest64</option>'+
              '<option value="otherLinux64Guest">otherLinux64Guest</option>'+
              '<option value="otherLinuxGuest">otherLinuxGuest</option>'+
              '<option value="redhatGuest">redhatGuest</option>'+
              '<option value="rhel2Guest">rhel2Guest</option>'+
              '<option value="rhel3_64Guest">rhel3_64Guest</option>'+
              '<option value="rhel3Guest">rhel3Guest</option>'+
              '<option value="rhel4_64Guest">rhel4_64Guest</option>'+
              '<option value="rhel4Guest">rhel4Guest</option>'+
              '<option value="rhel5_64Guest">rhel5_64Guest</option>'+
              '<option value="rhel5Guest">rhel5Guest</option>'+
              '<option value="rhel6_64Guest">rhel6_64Guest</option>'+
              '<option value="rhel6Guest">rhel6Guest</option>'+
              '<option value="sjdsGuest">sjdsGuest</option>'+
              '<option value="sles10_64Guest">sles10_64Guest</option>'+
              '<option value="sles10Guest">sles10Guest</option>'+
              '<option value="sles11_64Guest">sles11_64Guest</option>'+
              '<option value="sles11Guest">sles11Guest</option>'+
              '<option value="sles64Guest">sles64Guest</option>'+
              '<option value="slesGuest">slesGuest</option>'+
              '<option value="solaris10_64Guest">solaris10_64Guest</option>'+
              '<option value="solaris10Guest">solaris10Guest</option>'+
              '<option value="solaris6Guest">solaris6Guest</option>'+
              '<option value="solaris7Guest">solaris7Guest</option>'+
              '<option value="solaris8Guest">solaris8Guest</option>'+
              '<option value="solaris9Guest">solaris9Guest</option>'+
              '<option value="suse64Guest">suse64Guest</option>'+
              '<option value="suseGuest">suseGuest</option>'+
              '<option value="turboLinux64Guest">turboLinux64Guest</option>'+
              '<option value="turboLinuxGuest">turboLinuxGuest</option>'+
              '<option value="ubuntu64Guest">ubuntu64Guest</option>'+
              '<option value="ubuntuGuest">ubuntuGuest</option>'+
              '<option value="unixWare7Guest">unixWare7Guest</option>'+
              '<option value="win2000AdvServGuest">win2000AdvServGuest</option>'+
              '<option value="win2000ProGuest">win2000ProGuest</option>'+
              '<option value="win2000ServGuest">win2000ServGuest</option>'+
              '<option value="win31Guest">win31Guest</option>'+
              '<option value="win95Guest">win95Guest</option>'+
              '<option value="win98Guest">win98Guest</option>'+
              '<option value="windows7_64Guest">windows7_64Guest</option>'+
              '<option value="windows7Guest">windows7Guest</option>'+
              '<option value="windows7Server64Guest">windows7Server64Guest</option>'+
              '<option value="winLonghorn64Guest">winLonghorn64Guest</option>'+
              '<option value="winLonghornGuest">winLonghornGuest</option>'+
              '<option value="winMeGuest">winMeGuest</option>'+
              '<option value="winNetBusinessGuest">winNetBusinessGuest</option>'+
              '<option value="winNetDatacenter64Guest">winNetDatacenter64Guest</option>'+
              '<option value="winNetDatacenterGuest">winNetDatacenterGuest</option>'+
              '<option value="winNetEnterprise64Guest">winNetEnterprise64Guest</option>'+
              '<option value="winNetEnterpriseGuest">winNetEnterpriseGuest</option>'+
              '<option value="winNetStandard64Guest">winNetStandard64Guest</option>'+
              '<option value="winNetStandardGuest">winNetStandardGuest</option>'+
              '<option value="winNetWebGuest">winNetWebGuest</option>'+
              '<option value="winNTGuest">winNTGuest</option>'+
              '<option value="winVista64Guest">winVista64Guest</option>'+
              '<option value="winVistaGuest">winVistaGuest</option>'+
              '<option value="winXPHomeGuest">winXPHomeGuest</option>'+
              '<option value="winXPPro64Guest">winXPPro64Guest</option>'+
              '<option value="winXPProGuest">winXPProGuest</option>'+
            '</select>'+
          '</div>'+
        '</div>'+
        '<br>'+
        '<div class="row vm_param">'+
          '<div class="large-6 columns">'+
            '<label for="ROOT">'+tr("Root")+
              '<span class="tip">'+tr("Device to be mounted as root")+'</span>'+
            '</label>'+
            '<input type="text" id="ROOT" name="root"/>'+
          '</div>'+
          '<div class="large-6 columns">'+
            '<label for="BOOT">'+tr("Boot")+
              '<span class="tip">'+tr("Boot device type")+'</span>'+
            '</label>'+
            '<select id="BOOT" name="boot">'+
              '<option id="no_boot" name="no_boot" value=""></option>'+
              '<option value="hd">'+tr("HD")+'</option>'+
              '<option value="fd">'+tr("FD")+'</option>'+
              '<option value="cdrom">'+tr("CDROM")+'</option>'+
              '<option value="network">'+tr("NETWORK")+'</option>'+
            '</select>'+
          '</div>'+
        '</div>'+
        '<div class="row vm_param">'+
          '<div class="large-12 columns">'+
            '<label for="KERNEL_CMD">'+tr("Kernel cmd")+
              '<span class="tip">'+tr("Arguments for the booting kernel")+'</span>'+
            '</label>'+
            '<input type="text" id="KERNEL_CMD" name="kernel_cmd" />'+
          '</div>'+
        '</div>'+
        '<div class="row vm_param">'+
          '<div class="large-12 columns">'+
            '<label for="BOOTLOADER">'+tr("Bootloader")+
              '<span class="tip">'+tr("Path to the bootloader executable")+'</span>'+
            '</label>'+
            '<input type="text" id="BOOTLOADER" name="bootloader" />'+
          '</div>'+
        '</div>'+
      '</div>'+
      '<div id="kernelTab" class="wizard_internal_tab content">'+
        '<div class="row">'+
          '<div class="large-12 columns text-center">'+
            '<input id="radioKernelDs" type="radio" name="kernel_type" value="kernel_ds" checked/><label for="radioKernelDs">'+tr("Registered Image")+'</label>'+
            '<input id="radioKernelPath" type="radio" name="kernel_type" value="kernel_path"/><label for="radioKernelPath">'+tr("Remote PATH")+'</label>'+
          '</div>'+
        '</div>'+
        '<br>'+
        '<div class="kernel_ds">'+
          '<div class="row">'+
            '<div class="large-8 columns">' +
              '<button id="refresh_kernel_table" type="button" class="refresh button small radius secondary"><i class="fa fa-refresh" /></button>' +
            '</div>' +
            '<div class="large-4 columns">'+
              '<input id="kernel_search" type="text" class="search" placeholder="'+tr("Search")+'"/>'+
            '</div>'+
          '</div>'+
          '<div class="row">'+
            '<div class="large-12 columns">' +
              '<table id="datatable_kernel" class="datatable twelve">'+
                '<thead>'+
                  '<tr>'+
                  '<th></th>'+
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
            '</div>'+
          '</div>'+
          '<div class="row">'+
            '<div class="large-12 columns">' +
              '<span id="select_image" class="radius secondary label">'+tr("Please select a Kernel from the list")+'</span>'+
              '<span id="image_selected" class="radius secondary label" style="display: none;">'+tr("You selected the following Kernel: ")+'</span>'+
              '<span class="radius label" type="text"  id="KERNEL" name="kernel""></span>'+
            '</div>'+
          '</div>'+
          '<br>'+
          '<div id="kernel_ds_inputs" class="vm_param row">'+
            '<div class="large-12 columns">'+
              '<label for="KERNEL_DS">'+tr("KERNEL_DS")+
              '</label>'+
              '<input type="text" id="KERNEL_DS" name="KERNEL_DS"/>'+
            '</div>'+
          '</div>'+
        '</div>'+
        '<div id="kernel_path_inputs" class="kernel_path hidden row">'+
          '<div class="large-12 columns">'+
            '<label for="KERNEL">'+tr("PATH")+
              '<span class="tip">'+tr("Path to the OS kernel to boot the image")+'</span>'+
            '</label>'+
            '<input type="text" id="KERNEL" name="kernel" />'+
          '</div>'+
        '</div>'+
      '</div>'+
      '<div id="ramdiskTab" class="wizard_internal_tab content">'+
        '<div class="row">'+
          '<div class="large-12 columns text-center">'+
            '<input id="radioInintrdDs" type="radio" name="initrd_type" value="initrd_ds" checked><label for="radioInintrdDs">'+tr("Registered Image ") +"</label>"+
            '<input id="radioInitrdPath" type="radio" name="initrd_type" value="initrd_path"><label for="radioInitrdPath">'+tr("Remote PATH")+"</label>"+
          '</div>'+
        '</div>'+
        '<br>'+
        '<div class="initrd_ds">'+
          '<div class="row">'+
            '<div class="large-8 columns">' +
              '<button id="refresh_ramdisk_table" type="button" class="refresh button small radius secondary"><i class="fa fa-refresh" /></button>' +
            '</div>' +
            '<div class="large-4 columns">'+
              '<input id="initrd_search" type="text" class="search" placeholder="'+tr("Search")+'"/>'+
            '</div>'+
          '</div>'+
          '<div class="row">'+
            '<div class="large-12 columns">' +
              '<table id="datatable_initrd" class="datatable twelve">'+
                '<thead>'+
                  '<tr>'+
                  '<th></th>'+
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
            '</div>'+
          '</div>'+
          '<div id="selected_image" class="row">'+
            '<div class="large-12 columns">' +
              '<span id="select_image" class="radius secondary label">'+tr("Please select a Ramdisk from the list")+'</span>'+
              '<span id="image_selected" class="radius secondary label" style="display: none;">'+tr("You selected the following Ramdisk: ")+'</span>'+
              '<span class="radius label" type="text" id="INITRD" name="initrd"></span>'+
            '</div>'+
          '</div>'+
          '<br>'+
          '<div class="row vm_param">'+
            '<div class="large-12 columns">'+
              '<label for="INITRD_DS">'+tr("INITRD_DS")+
              '</label>'+
              '<input type="text" id="INITRD_DS" name="initrd_id"/>'+
            '</div>'+
          '</div>'+
        '</div>'+
        '<div id="initrd_path_inputs" class="initrd_path hidden">'+
          '<div class="row">'+
            '<div class="large-12 columns">'+
              '<label class="inline" for="INITRD">'+tr("PATH")+
                '<span class="tip">'+tr("Path to the initrd image")+'</span>'+
              '</label>'+
              '<input type="text" id="INITRD" name="initrd"/>'+
            '</div>'+
          '</div>'+
        '</div>'+
      '</div>'+
      '<div class="wizard_internal_tab content" id="featuresTab">'+
        '<div class="row vm_param">'+
          '<div class="large-6 columns">'+
            '<label for="ACPI">'+tr("ACPI")+
              '<span class="tip">'+tr("Add support in the VM for Advanced Configuration and Power Interface (ACPI)")+'</span>'+
            '</label>'+
            '<select id="ACPI" name="acpi">'+
              '<option id="no_apci" name="no_apci" value=""></option>'+
              '<option value="yes">'+tr("Yes")+'</option>'+
              '<option value="no">'+tr("No")+'</option>'+
            '</select>'+
          '</div>'+
          '<div class="large-6 columns">'+
            '<label for="PAE">'+tr("PAE")+
              '<span class="tip">'+tr("Add support in the VM for Physical Address Extension (PAE)")+'</span>'+
            '</label>'+
            '<select id="PAE" name="pae">'+
              '<option id="no_pae" name="no_pae" value=""></option>'+
              '<option value="yes">'+tr("Yes")+'</option>'+
              '<option value="no">'+tr("No")+'</option>'+
            '</select>'+
          '</div>'+
        '</div>'+
        '<div class="row vm_param">'+
          '<div class="large-6 columns">'+
            '<label for="APIC">'+tr("APIC")+
              '<span class="tip">'+tr("Enables the advanced programmable IRQ management.")+'</span>'+
            '</label>'+
            '<select id="APIC" name="apic">'+
              '<option id="no_apic" name="no_apic" value=""></option>'+
              '<option value="yes">'+tr("Yes")+'</option>'+
              '<option value="no">'+tr("No")+'</option>'+
            '</select>'+
          '</div>'+
          '<div class="large-6 columns">'+
            '<label for="HYPERV">'+tr("HYPERV")+
              '<span class="tip">'+tr("Add support in the VM for hyper-v features (HYPERV)")+'</span>'+
            '</label>'+
            '<select id="HYPERV" name="hyperv">'+
              '<option id="no_hyperv" name="no_hyperv" value=""></option>'+
              '<option value="yes">'+tr("Yes")+'</option>'+
              '<option value="no">'+tr("No")+'</option>'+
            '</select>'+
          '</div>'+
        '</div>'+
        '<div class="row vm_param">'+
          '<div class="large-6 columns">'+
            '<label for="LOCALTIME">'+tr("Localtime")+
              '<span class="tip">'+tr("The guest clock will be synchronized to the host's configured timezone when booted.")+'</span>'+
            '</label>'+
            '<select id="LOCALTIME" name="localtime">'+
              '<option id="no_localtime" name="no_localtime" value=""></option>'+
              '<option value="yes">'+tr("Yes")+'</option>'+
              '<option value="no">'+tr("No")+'</option>'+
            '</select>'+
          '</div>'+
          '<div class="large-6 columns">'+
            '<label for="DEVICE_MODEL">'+tr("Device model")+
              '<span class="tip">'+tr("Used to change the IO emulator in Xen HVM. Only XEN.")+'</span>'+
            '</label>'+
            '<input type="text" id="DEVICE_MODEL" name="device_model"/>'+
          '</div>'+
        '</div>'+
        '<div class="row vm_param">'+
          '<div class="large-6 columns">'+
            '<label for="PCIBRIDGE">'+tr("PCI BRIDGE")+
              '<span class="tip">'+tr(" Adds a PCI Controller that provides bridge-to-bridge capability, only for VMware.")+'</span>'+
            '</label>'+
            '<select id="PCIBRIDGE" name="PCIBRIDGE">'+
              '<option id="no_pcibridge" name="no_pcibridge" value=""></option>'+
              '<option value="0">0</option>'+
              '<option value="1">1</option>'+
              '<option value="2">2</option>'+
              '<option value="3">3</option>'+
              '<option value="4">4</option>'+
              '<option value="5">5</option>'+
              '<option value="6">6</option>'+
              '<option value="7">7</option>'+
              '<option value="8">8</option>'+
              '<option value="9">9</option>'+
              '<option value="10">10</option>'+
            '</select>'+
          '</div>'+
        '</div>'+
      '</div>'+
    '</div>'+
  '</div>'+
'</div>';

    }

    if (Config.isTemplateCreationTabEnabled('input_output')){
        str +=
    '<div id="ioTab" class="wizard_tab content">'+
      '<div class="row">'+
      '<div class="large-6 columns graphics">'+
        '<fieldset>'+
          '<legend>'+tr("Graphics")+'</legend>'+
          '<div class="row">'+
            '<div class="large-12 columns text-center">'+
                '<input type="radio" name="graphics_type" ID="radioVncType" value="VNC"><label for="radioVncType"> VNC  </label>'+
                '<input type="radio" name="graphics_type" ID="radioSdlType" value="SDL"><label for="radioSdlType"> SDL </label>'+
                '<input type="radio" name="graphics_type" ID="radioSpiceType" value="SPICE"><label for="radioSpiceType"> SPICE </label>'+
            '</div>'+
          '</div>'+
          '<br>'+
          '<div class="row vm_param">'+
            '<input type="hidden" name="graphics_type" ID="TYPE">'+
            '<div class="large-12 columns">'+
              '<label for="LISTEN">'+tr("Listen IP")+
                '<span class="tip">'+tr("IP to listen on")+'</span>'+
              '</label>'+
              '<input type="text" id="LISTEN" name="graphics_ip" />'+
            '</div>'+
          '</div>'+
          '<div class="row vm_param">'+
            '<div class="large-6 columns">'+
              '<label for="PORT">'+tr("Port")+
                '<span class="tip">'+tr("Port for the VNC/SPICE server")+'</span>'+
              '</label>'+
              '<input type="text" id="PORT" name="port" />'+
            '</div>'+
            '<div class="large-6 columns">'+
              '<label for="KEYMAP">'+tr("Keymap")+
                '<span class="tip">'+tr("Keyboard configuration locale to use in the VNC/SPICE display")+'</span>'+
              '</label>'+
              '<input type="text" id="KEYMAP" name="keymap" />'+
            '</div>'+
          '</div>'+
          '<div class="row vm_param">'+
            '<div class="large-12 columns">'+
              '<label for="PASSWD">'+tr("Password")+
                '<span class="tip">'+tr("Password for the VNC/SPICE server")+'</span>'+
              '</label>'+
              '<input type="text" id="PASSWD" name="graphics_pw" />'+
            '</div>'+
          '</div>'+
        '</fieldset>'+
      '</div>'+
      '<div class="large-6 columns inputs">'+
        '<fieldset>'+
          '<legend>'+tr("Inputs")+'</legend>'+
          '<div class="row">'+
            '<div class="large-5 columns">'+
              '<select id="TYPE" name="input_type">'+
                  '<option id="no_type" name="no_type" value=""></option>'+
                    '<option value="mouse">'+tr("Mouse")+'</option>'+
                    '<option value="tablet">'+tr("Tablet")+'</option>'+
              '</select>'+
            '</div>'+
            '<div class="large-4 columns">'+
              '<select id="BUS" name="input_bus">'+
                  '<option id="no_input" name="no_input" value=""></option>'+
                  '<option value="usb">'+tr("USB")+'</option>'+
                  '<option value="ps2">'+tr("PS2")+'</option>'+
                  '<option value="xen">'+tr("XEN")+'</option>'+
              '</select>'+
            '</div>'+
            '<div class="large-3 columns">'+
                '<button type="button" class="button small radius secondary" id="add_input">'+tr("Add")+'</button>'+
            '</div>'+
          '</div>'+
          '<div class="row">'+
            '<div class="large-12 columns">'+
              '<table id="input_table" class="dataTable policies_table">'+
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
            '</div>'+
          '</div>'+
        '</fieldset>'+
      '</div>'+
      '</div>'+
    '</div>';
    }

    if (Config.isTemplateCreationTabEnabled('context')){
        str +=
    '<div id="contextTab" class="wizard_tab content">'+
      '<dl id="context_tabs" class="tabs vertical" data-tab>'+
        '<dd class="active"><a href="#netsshTab">'+tr("Network & SSH")+'</a></dd>'+
        '<dd><a href="#filesTab">'+tr("Files")+'</a></dd>'+
        '<dd><a href="#zcustomTab">'+tr("Custom vars")+'</a></dd>'+
      '</dl>'+
      '<div class="tabs-content vertical">'+
          '<div class="wizard_internal_tab active content" id="netsshTab">'+
            '<div class="row">'+
              '<div class="columns large-12">'+
                  '<input type="checkbox" name="ssh_context" id="ssh_context" checked>'+
                  '<label for="ssh_context">'+ tr("  Add SSH contextualization")+
                    '<span class="tip">'+tr("Add an ssh public key to the context. If the Public Key textarea is empty then the user variable SSH_PUBLIC_KEY will be used.")+'</span>'+
                  '</label>'+
              '</div>'+
            '</div>'+
            '<div class="row">'+
              '<div class="large-12 columns">'+
                  '<label for="ssh_public_key"> '+tr("Public Key")+':</label>'+
                  '<textarea rows="4" type="text" id="ssh_public_key" name="ssh_public_key" />'+
              '</div>'+
            '</div>'+
            '<br>'+
            '<div class="row">'+
              '<div class="columns large-12">'+
                  '<input type="checkbox" name="network_context" id="network_context" checked>'+
                  '<label class="inline" for="network_context">'+ tr("  Add Network contextualization")+
                    '<span class="tip">'+tr("Add network contextualization parameters. For each NIC defined in the NETWORK section, ETH$i_IP, ETH$i_NETWORK... parameters will be included in the CONTEXT section and will be available in the Virtual Machine")+'</span>'+
                  '</label>'+
              '</div>'+
            '</div>'+
            '<div class="row">'+
              '<div class="columns large-12">'+
                  '<input type="checkbox" name="token_context" id="token_context">'+
                  '<label class="inline" for="token_context">'+ tr("  Add OneGate token")+
                    '<span class="tip">'+tr("Add a file (token.txt) to the context contaning the token to push custom metrics to the VirtualMachine through OneGate")+'</span>'+
                  '</label>'+
              '</div>'+
            '</div>'+
          '</div>'+
          '<div class="wizard_internal_tab content" id="filesTab">'+
            '<div class="row">'+
              '<div class="large-8 columns">' +
                 '<button id="refresh_context_table" type="button" class="refresh button small radius secondary"><i class="fa fa-refresh" /></button>' +
              '</div>' +
              '<div class="large-4 columns">'+
                '<input id="files_search" type="text" class="search" placeholder="'+tr("Search")+'"/>'+
              '</div>'+
            '</div>'+
            '<div class="row">'+
              '<div class="large-12 columns">' +
                '<table id="datatable_context" class="datatable twelve">'+
                  '<thead>'+
                    '<tr>'+
                      '<th></th>'+
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
              '</div>'+
            '</div>'+
            '<div class="vm_param row">'+
                '<div class="large-12 columns" id="selected_files_spans">' +
                  '<span id="select_files" class="radius secondary label">'+tr("Please select files from the list")+'</span> '+
                  '<span id="files_selected" class="radius secondary label"  style="display: none;">'+tr("You selected the following files:")+'</span> '+
                '</div>'+
            '</div>'+
            '<br>'+
            '<div class="row vm_param">'+
              '<div class="large-12 columns">'+
                '<label for="FILES_DS">'+tr("FILES_DS")+
                  '<span class="tip">'+tr("Raw String for the FILE_DS attribute of the VM template, representing files that will be included in the contextualization image. Each file must be stored in a FILE_DS Datastore and must be of type CONTEXT")+'</span>'+
                '</label>'+
                '<input type="text" id="FILES_DS" name="FILES_DS" />'+
              '</div>'+
            '</div>'+
            '<div class="row vm_param">'+
              '<div class="large-12 columns">'+
                '<label for="INIT_SCRIPTS">'+tr("Init scripts")+
                  '<span class="tip">'+tr("If the VM uses the OpenNebula contextualization package the init.sh file is executed by default. When the init script added is not called init.sh or more than one init script is added, this list contains the scripts to run and the order. Ex. “init.sh users.sh mysql.sh”")+'</span>'+
                '</label>'+
                '<input type="text" id="INIT_SCRIPTS" name="INIT_SCRIPTS" />'+
              '</div>'+
            '</div>'+
          '</div>'+
          '<div class="wizard_internal_tab content" id="zcustomTab">'+
            '<div class="row">'+
              '<div class="large-4 columns">'+
                '<input type="text" id="KEY" name="key" />'+
              '</div>'+
              '<div class="large-6 columns">'+
                '<input type="text" id="VALUE" name="value" />'+
              '</div>'+
              '<div class="large-2 columns">'+
                  '<button type="button" class="button secondary radius small" id="add_context">'+tr("Add")+'</button>'+
              '</div>'+
            '</div>'+
            '<div class="row">'+
              '<div class="large-12 columns">'+
                '<table id="context_table" class="dataTable policies_table">'+
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
              '</div>'+
            '</div>'+
          '</div>'+
        '</div>'+
    '</div>';
    }

    if (Config.isTemplateCreationTabEnabled('scheduling')){
        str +=
      '<div id="schedulingTab" class="wizard_tab content">'+
        '<dl class="tabs vertical" data-tab>'+
          '<dd class="active"><a href="#placementTab">'+tr("Placement")+'</a></dd>'+
          '<dd><a href="#policyTab">'+tr("Policy")+'</a></dd>'+
        '</dl>'+
        '<div class="tabs-content vertical">'+
            '<div class="requirements wizard_internal_tab active content" id="placementTab">'+
              '<fieldset>'+
                '<legend>'+tr("Host Requirements")+'</legend>'+
                '<div class="row">'+
                  '<div class="large-12 columns text-center">'+
                      '<input type="radio" id="hosts_req" name="req_select" value="host_select"><label for="hosts_req">'+tr("Select Hosts ")+"</label>"+
                      '<input type="radio" id="clusters_req"  name="req_select" value="cluster_select"><label for="clusters_req">'+tr("Select Clusters ")+"</label>"+
                  '</div>'+
                '</div>'+
                '<br>'+
                '<div id="req_type" class="host_select" hidden>'+
                    '<div class="row">'+
                      '<div class="large-8 columns">' +
                         '<button id="refresh_hosts_placement" type="button" class="refresh button small radius secondary"><i class="fa fa-refresh" /></button>' +
                      '</div>' +
                      '<div class="large-4 columns">'+
                        '<input id="hosts_search" type="text" class="search" placeholder="'+tr("Search")+'"/>'+
                      '</div>'+
                    '</div>'+
                    '<div class="row">'+
                      '<div class="large-12 columns">' +
                        '<table id="datatable_template_hosts" class="datatable twelve">'+
                            '<thead>'+
                            '<tr>'+
                                '<th></th>'+
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
                      '</div>'+
                    '</div>'+
                    '<div class="row">'+
                      '<div class="large-12 columns" id="selected_hosts_template">' +
                        '<span id="select_hosts" class="radius secondary label">'+tr("Please select one or more hosts from the list")+'</span> '+
                        '<span id="hosts_selected" class="radius secondary label" style="display: none;">'+tr("You selected the following hosts:")+'</span> '+
                      '</div>'+
                    '</div>'+
                '</div>'+
                '<div id="req_type" class="cluster_select hidden">'+
                    '<div class="row">'+
                      '<div class="large-8 columns">' +
                         '<button id="refresh_clusters_placement" type="button" class="refresh button small radius secondary"><i class="fa fa-refresh" /></button>' +
                      '</div>' +
                      '<div class="large-4 columns">'+
                        '<input id="clusters_search" type="text" class="search" placeholder="'+tr("Search")+'"/>'+
                      '</div>'+
                    '</div>'+
                    '<div class="row">'+
                      '<div class="large-12 columns">' +
                        '<table id="datatable_template_clusters" class="datatable twelve">'+
                            '<thead>'+
                            '<tr>'+
                                '<th></th>'+
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
                      '</div>'+
                    '</div>'+
                    '<div class="row">'+
                      '<div class="large-12 columns" id="selected_clusters_template">' +
                        '<span id="select_clusters" class="radius secondary label">'+tr("Please select one or more clusters from the list")+'</span> '+
                        '<span id="clusters_selected" class="radius secondary label" style="display: none;">'+tr("You selected the following clusters:")+'</span> '+
                      '</div>'+
                    '</div>'+
                '</div>'+
                '<br>'+
                '<div class="row vm_param">'+
                    '<div class="large-12 columns">'+
                        '<label for="SCHED_REQUIREMENTS">'+tr("Expression")+
                          '<span class="tip">'+tr("Boolean expression that rules out provisioning hosts from list of machines suitable to run this VM")+'.</span>'+
                        '</label>'+
                        '<input type="text" id="SCHED_REQUIREMENTS" name="requirements" />'+
                    '</div>'+
                '</div>'+
              '</fieldset>'+
              '<fieldset>'+
                '<legend>'+tr("Datastore Requirements")+'</legend>'+
                '<div class="row vm_param">'+
                    '<div class="large-12 columns">'+
                        '<label for="SCHED_DS_REQUIREMENTS">'+tr("Expression")+
                          '<span class="tip">'+tr("Boolean expression that rules out entries from the pool of datastores suitable to run this VM.")+'.</span>'+
                        '</label>'+
                        '<input type="text" id="SCHED_DS_REQUIREMENTS" name="requirements" />'+
                    '</div>'+
                '</div>'+
              '</fieldset>'+
            '</div>'+
            '<div id="policyTab" class="wizard_internal_tab content">'+
              '<fieldset class="host_rank">'+
                '<legend>'+tr("Host Rank")+'</legend>'+
                '<div class="row">'+
                  '<div class="large-12 columns text-center">'+
                      '<input type="radio" id="packingRadio" name="rank_select" value="RUNNING_VMS"><label for="packingRadio">'+tr("Packing")+
                        '<span class="tip">'+tr("Pack the VMs in the cluster nodes to reduce VM fragmentation")+'</span>'+
                      "</label>"+
                      '<input type="radio"  id="stripingRadio" name="rank_select" value="-RUNNING_VMS"><label for="stripingRadio">'+tr("Stripping")+
                        '<span class="tip">'+tr("Spread the VMs in the cluster nodes")+'</span>'+
                      "</label>"+
                      '<input type="radio"  id="loadawareRadio" name="rank_select" value="FREE_CPU"><label for="loadawareRadio">'+tr("Load-aware")+
                        '<span class="tip">'+tr("Maximize the resources available to VMs in a node")+'</span>'+
                      "</label>"+
                  '</div>'+
                '</div>'+
                '<br>'+
                '<div class="row vm_param">'+
                  '<div class="large-12 columns">'+
                    '<label for="SCHED_RANK">'+tr("Expression")+
                      '<span class="tip">'+tr("This field sets which attribute will be used to sort the suitable hosts for this VM")+'.</span>'+
                    '</label>'+
                    '<input type="text" id="SCHED_RANK" name="RANK" />'+
                  '</div>'+
                '</div>'+
              '</fieldset>'+
              '<fieldset class="ds_rank">'+
                '<legend>'+tr("Datastore Rank")+'</legend>'+
                '<div class="row">'+
                  '<div class="large-12 columns text-center">'+
                    '<input type="radio" id="packingDSRadio" name="ds_rank_select" value="-FREE_MB"><label for="packingDSRadio">'+tr("Packing")+
                      '<span class="tip">'+tr("Tries to optimize storage usage by selecting the DS with less free space")+'</span>'+
                    '</label>'+
                    '<input type="radio"  id="stripingDSRadio" name="ds_rank_select" value="FREE_MB"><label for="stripingDSRadio">'+tr("Stripping")+
                      '<span class="tip">'+tr("Striping. Tries to optimize I/O by distributing the VMs across datastores.")+'</span>'+
                    '</label>'+
                  '</div>'+
                '</div>'+
                '<br>'+
                '<div class="row vm_param">'+
                  '<div class="large-12 columns">'+
                    '<label for="SCHED_DS_RANK">'+tr("Expression")+
                      '<span class="tip">'+tr("This field sets which attribute will be used to sort the suitable datastores for this VM")+'.</span>'+
                    '</label>'+
                    '<input type="text" id="SCHED_DS_RANK" name="RANK" />'+
                  '</div>'+
                '</div>'+
              '</fieldset>'+
            '</div>'+
        '</div>'+
      '</div>';
    }

    if (Config.isTemplateCreationTabEnabled('other')){
        str +=
    '<div id="rawTab" class="wizard_tab content">'+
      '<div class="row">'+
        '<div class="large-12 columns">'+
        '<fieldset>'+
          '<legend>'+tr("RAW data")+'</legend>'+
          '<div class="row">'+
            '<div class="large-4 columns">'+
              '<label for="raw_type">'+tr("TYPE")+
              '</label>'+
              '<select id="raw_type" name="raw_type">'+
                '<option value=""></option>'+
                '<option value="kvm">'+tr("kvm")+'</option>'+
                '<option value="xen">'+tr("xen")+'</option>'+
                '<option value="vmware">'+tr("vmware")+'</option>'+
              '</select>'+
            '</div>'+
            '<div class="large-8 columns">'+
                '<label class="" for="raw_data">'+tr("DATA")+
                  '<span class="tip">'+tr("Raw data to be passed directly to the hypervisor")+'.</span>'+
                '</label>'+
                '<textarea rows="2" type="text" id="raw_data" name="raw_data" />'+
            '</div>'+
          '</div>'+
          '<div id="data_vmx_div" class="row hidden">'+
            '<div class="large-4 columns">'+
            '</div>'+
            '<div class="large-8 columns">'+
                '<label class="" for="raw_data_vmx">'+tr("DATA_VMX")+
                  '<span class="tip">'+tr("Raw data to be added directly to the .vmx file.")+'.</span>'+
                '</label>'+
                '<textarea rows="2" type="text" id="raw_data_vmx" name="raw_data_vmx" />'+
            '</div>'+
          '</div>'+
        '</fieldset>'+
        '<fieldset>'+
          '<legend>'+tr("Custom Tags")+'</legend>'+
          '<div class="row">'+
            '<div class="large-4 columns">'+
              '<input type="text" id="KEY" name="key" />'+
            '</div>'+
            '<div class="large-6 columns">'+
              '<input type="text" id="VALUE" name="value" />'+
            '</div>'+
            '<div class="large-2 columns">'+
                '<button type="button" class="button secondary small radius" id="add_context">'+tr("Add")+'</button>'+
            '</div>'+
          '</div>'+
          '<div class="row">'+
            '<div class="large-12 columns">'+
              '<table id="custom_tags" class="dataTable policies_table">'+
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
            '</div>'+
          '</div>'+
        '</fieldset>'+
        '</div>'+
      '</div>'+
    '</div>'
    }

    return str;
}

/**************************************************************************
    DISK TAB

**************************************************************************/

function setup_storage_tab_content(storage_section) {
    var number_of_disks = 0;

    // close icon: removing the tab on click
    $(storage_section).on("click", "i.remove-tab", function() {
        var target = $(this).parent().attr("href");
        var dd = $(this).closest('dd');
        var dl = $(this).closest('dl');
        var content = $(target);

        dd.remove();
        content.remove();

        if (dd.attr("class") == 'active') {
            $('a', dl.children('dd').last()).click();
        }
    });

    $("#tf_btn_disks", storage_section).bind("click", function(){
      add_disk_tab(number_of_disks, storage_section);
      number_of_disks++;
    });
}

function add_disk_tab(disk_id, dialog) {
    var str_disk_tab_id  = 'disk' + disk_id;
    var str_datatable_id = 'datatable_template_images' + disk_id;

    // Append the new div containing the tab and add the tab to the list
    var html_tab_content = '<div id="'+str_disk_tab_id+'Tab" class="disk wizard_internal_tab content">'+
      generate_disk_tab_content(str_disk_tab_id, str_datatable_id) +
    '</div>'
    $(html_tab_content).appendTo($("#template_create_storage_tabs_content", dialog));

    var a = $("<dd>\
      <a id='disk_tab"+str_disk_tab_id+"' href='#"+str_disk_tab_id+"Tab'>"+tr("DISK")+" <i class='fa fa-times-circle remove-tab'></i></a>\
    </dd>").appendTo($("dl#template_create_storage_tabs", dialog));

    $("a", a).trigger("click");

    var disk_section = $('#' +str_disk_tab_id+'Tab', dialog);
    setup_disk_tab_content(disk_section, str_disk_tab_id, str_datatable_id)
}

/**************************************************************************
    NETWORK TAB

**************************************************************************/

function setup_network_tab_content(network_section) {
    var number_of_nics = 0;

    // close icon: removing the tab on click
    $(network_section).on("click", "i.remove-tab", function() {
        var target = $(this).parent().attr("href");
        var dd = $(this).closest('dd');
        var dl = $(this).closest('dl');
        var content = $(target);

        dd.remove();
        content.remove();

        if (dd.attr("class") == 'active') {
            $('a', dl.children('dd').last()).click();
        }
    });

    $("#tf_btn_nics").bind("click", function(){
        add_nic_tab(number_of_nics, network_section);
        number_of_nics++;
    });
}

function add_nic_tab(nic_id, dialog) {
  var str_nic_tab_id  = 'nic' + nic_id;
  var str_datatable_id = 'datatable_template_networks' + nic_id;

  var html_tab_content = '<div id="'+str_nic_tab_id+'Tab" class="nic wizard_internal_tab content">'+
      generate_nic_tab_content(str_nic_tab_id, str_datatable_id) +
    '</div>'

  // Append the new div containing the tab and add the tab to the list
  var a = $("<dd><a id='nic_tab"+str_nic_tab_id+"' href='#"+str_nic_tab_id+"Tab'>"+tr("NIC")+" <i class='fa fa-times-circle remove-tab'></i></a></dd>").appendTo($("dl#template_create_network_tabs", dialog));

  $(html_tab_content).appendTo($("#template_create_network_tabs_content", dialog));

  $("a", a).trigger("click");

  var nic_section = $('#' + str_nic_tab_id + 'Tab', dialog);
  setup_nic_tab_content(nic_section, str_nic_tab_id, str_datatable_id)
}

/**************************************************************************
    OS TAB

**************************************************************************/

function setup_os_tab_content(os_section) {
    var kernel_section = $('#kernelTab', os_section);
    var initrd_section = $('#ramdiskTab', os_section);


    // Select Kernel Image or Path. The div is hidden depending on the selection, and the
    // vm_param class is included to be computed when the template is generated.
    $("input[name='kernel_type']", os_section).change(function(){
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

    $("input[name='initrd_type']", os_section).change(function(){
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

    var dataTable_template_kernel = $('#datatable_kernel', os_section).dataTable({
        "bAutoWidth":false,
        "sDom" : '<"H">t<"F"p>',
        "iDisplayLength": 4,
        "bSortClasses" : false,
        "bDeferRender": true,
        "aoColumnDefs": [
            { "sWidth": "35px", "aTargets": [0,1] },
            { "bVisible": false, "aTargets": [3,2,5,6,7,9,8,11,12,10]}
        ],
      //"fnDrawCallback": function(oSettings) {
      //  var nodes = this.fnGetNodes();
      //  $.each(nodes, function(){
      //      if ($(this).find("td:eq(1)").html() == $('#KERNEL', kernel_section).text()) {
      //          $("td", this).addClass('markrow');
      //          $('input.check_item', this).attr('checked','checked');
      //      }
      //  })
      //},
      "fnInitComplete": function(oSettings) {
        this.fnFilter("KERNEL", 7)
      }
    });

    $("#refresh_kernel_table", $("#osTab")).die();
    $("#refresh_kernel_table", $("#osTab")).live('click', function(){
        update_datatable_template_files(dataTable_template_kernel)
    });

    // Retrieve the images to fill the datatable
    update_datatable_template_files(dataTable_template_kernel);

    $('#kernel_search', os_section).keyup(function(){
        dataTable_template_kernel.fnFilter( $(this).val() );
    })

    dataTable_template_kernel.fnSort( [ [1,config['user_config']['table_order']] ] );

    $('#datatable_kernel tbody', os_section).delegate("tr", "click", function(e){
        var aData = dataTable_template_kernel.fnGetData(this);

        $("td.markrowchecked", kernel_section).removeClass('markrowchecked');
        $('tbody input.check_item', kernel_section).removeAttr('checked');

        $('#image_selected', kernel_section).show();
        $('#select_image', kernel_section).hide();
        $('.alert-box', kernel_section).hide();

        $("td", this).addClass('markrowchecked');
        $('input.check_item', this).attr('checked','checked');

        $('#KERNEL', kernel_section).text(aData[4]);
        $('#KERNEL_DS', kernel_section).val("$FILE[IMAGE_ID="+ aData[1] +"]");
        return true;
    });


    var datTable_template_initrd = $('#datatable_initrd', os_section).dataTable({
        "bAutoWidth":false,
        "iDisplayLength": 4,
        "sDom" : '<"H">t<"F"p>',
        "aoColumnDefs": [
            { "sWidth": "35px", "aTargets": [0,1] },
            { "bVisible": false, "aTargets": [2,3,5,6,7,9,8,10,11,12]}
        ],
        "bSortClasses" : false,
        "bDeferRender": true,
       "fnInitComplete": function(oSettings) {
          this.fnFilter("RAMDISK", 7)
       // var nodes = this.fnGetNodes();
       // $.each(nodes, function(){
       //     if ($(this).find("td:eq(1)").html() == $('#INITRD', kernel_section).text()) {
       //         $("td", this).addClass('markrowchecked');
       //         $('input.check_item', this).attr('checked','checked');
       //     }
       // })
       }
    });



    $("#refresh_ramdisk_table", $("#osTab")).die();
    $("#refresh_ramdisk_table", $("#osTab")).live('click', function(){
        update_datatable_template_files(datTable_template_initrd)
    });

    update_datatable_template_files(datTable_template_initrd);

    $('#initrd_search', os_section).keyup(function(){
        datTable_template_initrd.fnFilter( $(this).val() );
    })

    datTable_template_initrd.fnSort( [ [1,config['user_config']['table_order']] ] );

    $('#datatable_initrd tbody', os_section).delegate("tr", "click", function(e){
        var aData = datTable_template_initrd.fnGetData(this);

        $("td.markrowchecked", initrd_section).removeClass('markrowchecked');
        $('tbody input.check_item', initrd_section).removeAttr('checked');

        $('#image_selected', initrd_section).show();
        $('#select_image', initrd_section).hide();
        $('.alert-box', initrd_section).hide();

        $("td", this).addClass('markrowchecked');
        $('input.check_item', this).attr('checked','checked');

        $('#INITRD', os_section).text(aData[4]);
        $('#INITRD_DS', os_section).val("$FILE[IMAGE_ID="+ aData[1] +"]");
        return true;
    });

    // Hide image advanced options
    $('fieldset.advanced', $('div#advanced_os')).hide();

    $('#advanced_os', os_section).click(function(){
        $('fieldset.advanced', $('div##advanced_os')).toggle();
        return false;
    });
}

/**************************************************************************
    INPUT/OUTPUT TAB

**************************************************************************/

function setup_io_tab_content(io_section) {
    $("input[name='graphics_type']", io_section).change(function(){
        $("#TYPE", $('#ioTab .graphics')).val($(this).attr("value"))
        $("#LISTEN", $('#ioTab')).val("0.0.0.0")
    });

    $('#add_input', $('#ioTab')).click(function() {
        var table = $('#input_table', $('#ioTab'))[0];
        var rowCount = table.rows.length;
        var row = table.insertRow(-1);
        $(row).addClass("vm_param");

        var cell1 = row.insertCell(0);
        var element1 = document.createElement("input");
        element1.id = "TYPE"
        element1.type = "text";
        element1.value = $('select#TYPE', $('#ioTab')).val()
        cell1.appendChild(element1);

        var cell2 = row.insertCell(1);
        var element2 = document.createElement("input");
        element2.id = "BUS"
        element2.type = "text";
        element2.value = $('select#BUS', $('#ioTab')).val()
        cell2.appendChild(element2);

        var cell3 = row.insertCell(2);
        cell3.innerHTML = "<i class='fa fa-times-circle fa fa-lg remove-tab'></i>";
    });

    $(document).off('click', "#ioTab i.remove-tab");
    $(document).on('click', "#ioTab i.remove-tab", function(){
        $(this).closest("tr").remove()
    });
}

/**************************************************************************
    CONTEXT TAB

**************************************************************************/

function setup_context_tab_content(context_section) {
    $('#add_context', $('#contextTab')).click(function() {
        var table = $('#context_table', $('#contextTab'))[0];
        var rowCount = table.rows.length;
        var row = table.insertRow(rowCount);

        var cell1 = row.insertCell(0);
        var element1 = document.createElement("input");
        element1.id = "KEY";
        element1.type = "text";
        element1.value = $('input#KEY', $('#contextTab')).val()
        cell1.appendChild(element1);

        var cell2 = row.insertCell(1);
        var element2 = document.createElement("input");
        element2.id = "VALUE";
        element2.type = "text";
        element2.value = $('input#VALUE', $('#contextTab')).val()
        cell2.appendChild(element2);

        var cell3 = row.insertCell(2);
        cell3.innerHTML = "<i class='fa fa-times-circle fa fa-lg remove-tab'></i>";
    });

    $( "#contextTab i.remove-tab" ).live( "click", function() {
        $(this).closest("tr").remove()
    });


    var datTable_template_context = $('#datatable_context', context_section).dataTable({
        "bAutoWidth":false,
        "iDisplayLength": 4,
        "bSortClasses" : false,
        "bDeferRender": true,
        "sDom" : '<"H">t<"F"p>',
        "aoColumnDefs": [
            { "bSortable": false, "aTargets": ["check"] },
            { "sWidth": "35px", "aTargets": [0,1] },
            { "bVisible": false, "aTargets": [2,3,5,6,7,9,8,10,11,12]}
        ],
        "fnInitComplete": function(oSettings) {
          this.fnFilter("CONTEXT", 7)
        //  var images = []
        //  $.each($( "span.image", $("#selected_files_spans")), function() {
        //    images.push($(this).attr("image_id"));
        //  });

        //  var nodes = this.fnGetNodes();
        //  $.each(nodes, function(){
        //      var in_array = $.inArray($(this).find("td:eq(1)").html(), images)
        //      if (in_array != -1) {
        //          $("td", this).addClass('markrow');
        //          $('input.check_item', this).attr('checked','checked');
        //      }
        //  })
        }
    });

    $("#refresh_context_table", $('#contextTab')).die();
    $("#refresh_context_table", $('#contextTab')).live('click', function(){
        update_datatable_template_files(datTable_template_context)
    });

    // Retrieve the images to fill the datatable
    update_datatable_template_files(datTable_template_context);

    $('#files_search', context_section).keyup(function(){
        datTable_template_context.fnFilter( $(this).val() );
    })

    datTable_template_context.fnSort( [ [1,config['user_config']['table_order']] ] );

    var selected_files = {};
    var file_row_hash = {};

    $('#datatable_context tbody', context_section).delegate("tr", "click", function(e){
        var aData   = datTable_template_context.fnGetData(this);
        var file_id = aData[1];

        if ($.isEmptyObject(selected_files)) {
            $('#files_selected',  context_section).show();
            $('#select_files', context_section).hide();
        }

        if (!$("td:first", this).hasClass('markrowchecked')) {
            $('input.check_item', this).attr('checked','checked');
            selected_files[file_id]=1;
            file_row_hash[file_id]=this;
            $(this).children().each(function(){$(this).addClass('markrowchecked');});
            if ($('#tag_file_'+aData[1], $('div#selected_files_spans', context_section)).length == 0 ) {
                $('#selected_files_spans', context_section).append('<span image_id="'+aData[1]+'" id="tag_file_'+aData[1]+'" class="image radius label">'+aData[4]+' <span class="fa fa-times blue"></span></span> ');
            }
        } else {
            $('input.check_item', this).removeAttr('checked');
            delete selected_files[file_id];
            $("td", this).removeClass('markrowchecked');
            $('div#selected_files_spans span#tag_file_'+file_id, context_section).remove();
        }

        if ($.isEmptyObject(selected_files)) {
          $('#files_selected',  context_section).hide();
          $('#select_files', context_section).show();
        }

        $('.alert-box', $('#contextTab')).hide();

        generate_context_files();

        return true;
    });

    $( "span.fa.fa-times", $("#selected_files_spans") ).die()
    $( "span.fa.fa-times", $("#selected_files_spans") ).live( "click", function() {
        $(this).parent().remove();
        var file_id = $(this).parent().attr("image_id");

        delete selected_files[file_id];

        var nodes = datTable_template_context.fnGetNodes();
        $.each(nodes, function(){
            if ($(this).find("td:eq(1)").html() == file_id) {
                $("td", this).removeClass('markrowchecked');
                $('input.check_item', this).removeAttr('checked');
            }
        })

        generate_context_files();
    });

    var generate_context_files = function() {
        var req_string=[];

        $.each($( "span.image", $("#selected_files_spans")), function() {
            req_string.push("$FILE[IMAGE_ID="+ $(this).attr("image_id") +"]");
        });


        $('#FILES_DS', context_section).val(req_string.join(" "));
    };
}


/**************************************************************************
    PLACEMENT TAB

**************************************************************************/

function setup_scheduling_tab_content(scheduling_section) {
    var dataTable_template_hosts = $("#datatable_template_hosts",scheduling_section).dataTable({
        "iDisplayLength": 4,
        "sDom" : '<"H">t<"F"p>',
        "bAutoWidth":false,
        "bSortClasses" : false,
        "bDeferRender": true,
        "aoColumnDefs": [
            { "sWidth": "35px", "aTargets": [0,1] },
            { "bVisible": false, "aTargets": [3,5,7,10,11,12]}
        ]
    });

    $("#refresh_hosts_placement", $("#placementTab")).die();
    $("#refresh_hosts_placement", $("#placementTab")).live('click', function(){
        update_datatable_template_hosts(dataTable_template_hosts)
    });

    update_datatable_template_hosts(dataTable_template_hosts);

    $('#hosts_search', scheduling_section).keyup(function(){
        dataTable_template_hosts.fnFilter( $(this).val() );
    })

    dataTable_template_hosts.fnSort( [ [1,config['user_config']['table_order']] ] );

    var selected_hosts = {};
    var host_row_hash = {};

    $('#datatable_template_hosts', scheduling_section).delegate("tr", "click", function(e){
        var aData   = dataTable_template_hosts.fnGetData(this);
        var host_id = aData[1];

        if ($.isEmptyObject(selected_hosts)) {
            $('#hosts_selected',  scheduling_section).show();
            $('#select_hosts', scheduling_section).hide();
        }

        if(!$("td:first", this).hasClass('markrowchecked')) {
            $('input.check_item', this).attr('checked','checked');
            selected_hosts[host_id]=1;
            host_row_hash[host_id]=this;
            $(this).children().each(function(){$(this).addClass('markrowchecked');});
            if ($('#tag_host_'+aData[1], $('div#selected_hosts_template', scheduling_section)).length == 0 ) {
                $('div#selected_hosts_template', scheduling_section).append('<span id="tag_host_'+aData[1]+'" class="radius label">'+aData[2]+' <span class="fa fa-times blue"></span></span> ');
            }
        } else {
            $('input.check_item', this).removeAttr('checked');
            delete selected_hosts[host_id];
            $(this).children().each(function(){$(this).removeClass('markrowchecked');});
            $('div#selected_hosts_template span#tag_host_'+host_id, scheduling_section).remove();
        }

        if ($.isEmptyObject(selected_hosts)) {
            $('#hosts_selected',  scheduling_section).hide();
            $('#select_hosts', scheduling_section).show();
        }

        $('.alert-box', $('.host_select', scheduling_section)).hide();

        generate_requirements();

        return true;
    });

    $(document).off("click", 'div#selected_hosts_template span.fa.fa-times');
    $(document).on("click",  'div#selected_hosts_template span.fa.fa-times', function() {
        $(this).parent().remove();
        var id = $(this).parent().attr("ID");

        var host_id=id.substring(9,id.length);
        delete selected_hosts[host_id];
        $('td', host_row_hash[host_id]).removeClass('markrowchecked');
        $('input.check_item', host_row_hash[host_id]).removeAttr('checked');

        if ($.isEmptyObject(selected_hosts)) {
            $('#hosts_selected',  scheduling_section).hide();
            $('#select_hosts', scheduling_section).show();
        }

        generate_requirements();
    });

    // Clusters TABLE
    var dataTable_template_clusters = $("#datatable_template_clusters", scheduling_section).dataTable({
        "iDisplayLength": 4,
        "sDom" : '<"H">t<"F"p>',
        "bAutoWidth":false,
        "bSortClasses" : false,
        "bDeferRender": true,
        "aoColumnDefs": [
            { "sWidth": "35px", "aTargets": [0,1] },
            { "bVisible": false, "aTargets": []}
        ]
    });

    $("#refresh_clusters_placement", $("#placementTab")).die();
    $("#refresh_clusters_placement", $("#placementTab")).live('click', function(){
        update_datatable_template_clusters(dataTable_template_clusters);
    });

    update_datatable_template_clusters(dataTable_template_clusters);

    $('#clusters_search', scheduling_section).keyup(function(){
        dataTable_template_clusters.fnFilter( $(this).val() );
    })

    dataTable_template_clusters.fnSort( [ [1,config['user_config']['table_order']] ] );

    var selected_clusters = {};
    var cluster_row_hash = {};

    $('#datatable_template_clusters', scheduling_section).delegate("tr", "click", function(e){
        var aData   = dataTable_template_clusters.fnGetData(this);
        var cluster_id = aData[1];

        if ($.isEmptyObject(selected_clusters)) {
            $('#clusters_selected',  scheduling_section).show();
            $('#select_clusters', scheduling_section).hide();
        }

        if(!$("td:first", this).hasClass('markrowchecked'))
        {
            $('input.check_item', this).attr('checked','checked');
            selected_clusters[cluster_id]=1;
            cluster_row_hash[cluster_id]=this;
            $(this).children().each(function(){$(this).addClass('markrowchecked');});
            if ($('#tag_cluster_'+aData[1], $('div#selected_clusters_template', scheduling_section)).length == 0 ) {
                $('div#selected_clusters_template', scheduling_section).append('<span id="tag_cluster_'+aData[1]+'" class="radius label">'+aData[2]+' <span class="fa fa-times blue"></span></span> ');
            }
        }
        else
        {
            $('input.check_item', this).removeAttr('checked');
            delete selected_clusters[cluster_id];
            $(this).children().each(function(){$(this).removeClass('markrowchecked');});
            $('div#selected_clusters_template span#tag_cluster_'+cluster_id, scheduling_section).remove();
        }


        if ($.isEmptyObject(selected_clusters)) {
            $('#clusters_selected',  scheduling_section).hide();
            $('#select_clusters', scheduling_section).show();
        }

        $('.alert-box', $('.cluster_select', scheduling_section)).hide();

        generate_requirements();

        return true;
    });

    $(document).off("click", 'div#selected_clusters_template span.fa.fa-times');
    $(document).on("click",  'div#selected_clusters_template span.fa.fa-times', function() {
        $(this).parent().remove();
        var id = $(this).parent().attr("ID");

        var cluster_id=id.substring(12,id.length);
        delete selected_clusters[cluster_id];
        $('td', cluster_row_hash[cluster_id]).removeClass('markrowchecked');
        $('input.check_item', cluster_row_hash[cluster_id]).removeAttr('checked');

        if ($.isEmptyObject(selected_clusters)) {
            $('#clusters_selected',  scheduling_section).hide();
            $('#select_clusters', scheduling_section).show();
        }

        generate_requirements();
    });

    // Select Image or Volatile disk. The div is hidden depending on the selection, and the
    // vm_param class is included to be computed when the template is generated.
    $("input[name='req_select']").change(function(){
        if ($("input[name='req_select']:checked").val() == "host_select") {
            $("div.host_select",    scheduling_section).toggle();
            $("div.cluster_select", scheduling_section).hide();
        }
        else {
            $("div.host_select",    scheduling_section).hide();
            $("div.cluster_select", scheduling_section).toggle();
        }
    });

    $("input[name='rank_select']", $(".host_rank", scheduling_section)).change(function(){
        $("#SCHED_RANK", scheduling_section).val(this.value);
    });

    $("input[name='ds_rank_select']", $(".ds_rank", scheduling_section)).change(function(){
        $("#SCHED_DS_RANK", scheduling_section).val(this.value);
    });

    var generate_requirements = function() {
        var req_string=[];

        $.each(selected_hosts, function(key, value) {
        req_string.push('ID=\\"'+key+'\\"');
        });

        $.each(selected_clusters, function(key, value) {
        req_string.push('CLUSTER_ID=\\"'+key+'\\"');
        });

        $('#SCHED_REQUIREMENTS', scheduling_section).val(req_string.join(" | "));
    };
}


    /**************************************************************************
        OTHER TAB

    **************************************************************************/

function setup_other_tab_content(other_tab){
    $('#add_context', other_tab).click(function() {
        var table = $('#custom_tags', other_tab)[0];
        var rowCount = table.rows.length;
        var row = table.insertRow(rowCount);

        var cell1 = row.insertCell(0);
        var element1 = document.createElement("input");
        element1.id = "KEY";
        element1.type = "text";
        element1.value = $('input#KEY', other_tab).val()
        cell1.appendChild(element1);

        var cell2 = row.insertCell(1);
        var element2 = document.createElement("input");
        element2.id = "VALUE";
        element2.type = "text";
        element2.value = $('input#VALUE', other_tab).val()
        cell2.appendChild(element2);


        var cell3 = row.insertCell(2);
        cell3.innerHTML = "<i class='fa fa-times-circle fa fa-lg remove-tab'></i>";
    });

    $( "#rawTab i.remove-tab" ).live( "click", function() {
        $(this).closest("tr").remove()
    });

    $('#raw_type').change(function(){
        var choice_str = $(this).val();
        switch(choice_str) {
        case 'vmware':
            $("#data_vmx_div", other_tab).show();
            break;
        default:
            $("#data_vmx_div", other_tab).hide();
        }
    });
}



// Prepare the template creation dialog
function setupCreateTemplateDialog(){

    //***CREATE VM DIALOG MAIN BODY***

    dialogs_context.append('<div id="create_template_dialog" class="reveal-modal large" data-reveal></div>');
    $create_template_dialog = $('#create_template_dialog',dialogs_context);
    var dialog = $create_template_dialog;

    //Insert HTML in place
    dialog.html(create_template_tmpl);
    //$(document).foundation();
    initialize_create_template_dialog(dialog);
}

function initialize_create_template_dialog(dialog) {
    var tabs = $( "#template_create_tabs", dialog)//.tabs().addClass("ui-tabs-vertical");

    $('#template_template_reset_button', dialog).click(function(){
        dialog.html("");
        setupCreateTemplateDialog();
        popUpCreateTemplateDialog();
    });

    if (Config.isTemplateCreationTabEnabled('general')){
        var tab = $('#capacityTab', dialog);
        setup_capacity_tab_content(tab);
    }

    if (Config.isTemplateCreationTabEnabled('storage')){
        var tab = $('#storageTab', dialog);
        setup_storage_tab_content(tab);
    }

    if (Config.isTemplateCreationTabEnabled('network')){
        var tab = $('#networkTab', dialog);
        setup_network_tab_content(tab);
    }

    if (Config.isTemplateCreationTabEnabled('os_booting')){
        var tab = $('#osTab', dialog);
        setup_os_tab_content(tab);
    }

    if (Config.isTemplateCreationTabEnabled('input_output')){
        var tab = $('#ioTab', dialog);
        setup_io_tab_content(tab);
    }

    if (Config.isTemplateCreationTabEnabled('context')){
        var tab = $('#contextTab', dialog);
        setup_context_tab_content(tab);
    }

    if (Config.isTemplateCreationTabEnabled('scheduling')){
        var tab = $('#schedulingTab', dialog);
        setup_scheduling_tab_content(tab);
    }

    if (Config.isTemplateCreationTabEnabled('other')){
        var tab = $('#rawTab', dialog);
        setup_other_tab_content(tab);
    }

    dialog.foundation();
    // Add first disk and network
    setupTips(dialog);
    $("#tf_btn_disks", dialog).trigger("click");
    $("#tf_btn_nics", dialog).trigger("click");


    //Different selector for items of kvm and xen (mandatory and optional)
    var items = '.vm_param input,.vm_param select';

    // Enhace buttons
    //$('button',dialog).button();

    var build_template = function(){
        var vm_json = {};
        var name,value,boot_method;
        //
        // CAPACITY
        //

        if (!$('input#MEMORY',$('#capacityTab',dialog)).val())
        {
          // Put default memory value
          $('input#MEMORY',$('#capacityTab',dialog)).val("512")
        }

        addSectionJSON(vm_json,$('#capacityTab',dialog));
        vm_json["DESCRIPTION"] = $('#DESCRIPTION',$('#capacityTab',dialog)).val();
        vm_json["LOGO"] = $('#LOGO',$('#capacityTab',dialog)).val();

        //
        // OS
        //

        vm_json["OS"] = {};
        addSectionJSON(vm_json["OS"],$('#osTab #bootTab',dialog));
        addSectionJSON(vm_json["OS"],$('#osTab #kernelTab',dialog));
        addSectionJSON(vm_json["OS"],$('#osTab #ramdiskTab',dialog));

        //
        // FEATURES
        //

        vm_json['FEATURES'] = {};
        addSectionJSON(vm_json["FEATURES"],$('#osTab #featuresTab',dialog));

        //
        // DISK
        //

        vm_json["DISK"] = [];

        $('.disk div#disk_type.vm_param ',dialog).each(function(){
          var hash  = {};
          addSectionJSON(hash, this);
          if (!$.isEmptyObject(hash)) {
            vm_json["DISK"].push(hash);
          };
        });


        //
        // NIC
        //

        vm_json["NIC"] = [];

        $('.nic',dialog).each(function(){
          hash = retrieve_nic_tab_data(this);

          if (!$.isEmptyObject(hash)) {
              vm_json["NIC"].push(hash);
          }
        });

        //
        // GRAPHICS
        //

        vm_json["GRAPHICS"] = {};
        addSectionJSON(vm_json["GRAPHICS"],$('#ioTab .graphics',dialog));

        //
        // INPUT
        //

        vm_json["INPUT"] = [];
        $('#input_table tr', $('#ioTab')).each(function(){
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
        $('#context_table tr', $('#contextTab')).each(function(){
          if ($('#KEY', $(this)).val()) {
            vm_json["CONTEXT"][$('#KEY', $(this)).val()] = $('#VALUE', $(this)).val()
          }
        });

        if ($("#ssh_context", $('#contextTab')).is(":checked")) {
          var public_key = $("#ssh_public_key", $('#contextTab')).val();
          if (public_key){
            vm_json["CONTEXT"]["SSH_PUBLIC_KEY"] = public_key;
          }
          else {
            vm_json["CONTEXT"]["SSH_PUBLIC_KEY"] = '$USER[SSH_PUBLIC_KEY]';
          }
        };

        if ($("#network_context", $('#contextTab')).is(":checked")) {
          vm_json["CONTEXT"]["NETWORK"] = "YES";
        };

        if ($("#token_context", $('#contextTab')).is(":checked")) {
          vm_json["CONTEXT"]["TOKEN"] = "YES";
        };

        addSectionJSON(vm_json["CONTEXT"],$('#contextTab',dialog));

        //
        // PLACEMENT
        //

        addSectionJSON(vm_json,$('#schedulingTab',dialog));

        //
        // RAW
        //
        vm_json["RAW"] = {}
        t = $('#raw_type', dialog).val();
        if (t) { vm_json["RAW"]['TYPE'] = t; }
        t = escapeDoubleQuotes($('#raw_data', dialog).val());
        if (t) { vm_json["RAW"]['DATA'] = t; }
        t = escapeDoubleQuotes($('#raw_data_vmx', dialog).val());
        if (t) { vm_json["RAW"]['DATA_VMX'] = t; }

        $('#custom_tags tr', $('#rawTab')).each(function(){
          if ($('#KEY', $(this)).val()) {
            vm_json[$('#KEY', $(this)).val()] = escapeDoubleQuotes($('#VALUE', $(this)).val());
          }
        });

        // remove empty elements
        vm_json = removeEmptyObjects(vm_json);
        return vm_json;
    }

    //Process form
    $('button#create_template_form_easy',dialog).click(function(){
        $create_template_dialog = dialog;
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
        return false;
    });

    $('button#template_template_update_button',dialog).click(function(){
        var vm_json = build_template();
        vm_json = {vmtemplate: vm_json};
        vm_json =JSON.stringify(vm_json);

        Sunstone.runAction("Template.update",template_to_update_id,vm_json);
        return false;
    });

    $('button#manual_template_update_button',dialog).click(function(){
        var template = $('textarea#template',dialog).val();

        //wrap it in the "vm" object
        template = {"vmtemplate": {"template_raw": template}};
        var vm_json = JSON.stringify(template);

        Sunstone.runAction("Template.update",template_to_update_id,vm_json);
        return false;
    });

    //Handle manual forms
    $('button#create_template_submit_manual',dialog).click(function(){
        var template = $('textarea#template',dialog).val();

        //wrap it in the "vm" object
        template = {"vmtemplate": {"template_raw": template}};

        Sunstone.runAction("Template.create",template);
        return false;
    });
}

function popUpUpdateTemplateDialog(){
    if ($create_template_dialog) {
      $create_template_dialog.html("");
    }

    setupCreateTemplateDialog();

    $('button#create_template_form_easy', $create_template_dialog).hide();
    $('button#template_template_update_button', $create_template_dialog).show();
    $('button#template_template_reset_button', $create_template_dialog).hide();
    $('button#manual_template_update_button', $create_template_dialog).show();
    $('button#create_template_submit_manual', $create_template_dialog).hide();

    $('#create_template_header', $create_template_dialog).hide();
    $('#update_template_header', $create_template_dialog).show();

    $('#template_name_form', $create_template_dialog).hide();
    $('#NAME').attr("disabled", "disabled");;

    $create_template_dialog.die();
    $create_template_dialog.live('closed', function () {
        $create_template_dialog.html("");
    });

    $create_template_dialog.foundation().foundation('reveal', 'open');
};

function popUpCreateTemplateDialog(){
    if (!$create_template_dialog || $create_template_dialog.html() == "") {
        setupCreateTemplateDialog();
    }

    $create_template_dialog.die();

    $('button#create_template_form_easy', $create_template_dialog).show();
    $('button#template_template_update_button', $create_template_dialog).hide();
    $('button#template_template_reset_button', $create_template_dialog).show();
    $('button#manual_template_update_button', $create_template_dialog).hide();
    $('button#create_template_submit_manual', $create_template_dialog).show();

    $('#create_template_header', $create_template_dialog).show();
    $('#update_template_header', $create_template_dialog).hide();

    $('#template_name_form', $create_template_dialog).show();
    $('#NAME').removeAttr('disabled');

    $('#wizard_mode', $create_template_dialog).show();

    $create_template_dialog.foundation('reveal', 'open');

    $("input#NAME",$create_template_dialog).focus();

    $('button.refresh', $(create_template_dialog)).each(function(){
        this.click();
    })
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
};

function fillTemplatePopUp(template, dialog){
    var use_advanced_template = false;

    function autoFillInputs(template_json, context){
        var params = $('.vm_param',context);
        var inputs = $('input',params);
        var selects = $('select:enabled',params);
        var fields = $.merge(inputs,selects);

        fields.each(function(){
            var field = $(this);
                if (template_json[field.attr('id')]){ //if has a length
                    field.val(escapeDoubleQuotes(htmlDecode(template_json[field.attr('id')])));
                    field.change();

                    delete template_json[field.attr('id')]

                    if (field.parents(".advanced")) {
                        $('.advanced', context).show();
                    }
                };
        });
    };

    $('#template',dialog).val(convert_template_to_string(template).replace(/^[\r\n]+$/g, ""));

    //
    // GENERAL
    //

    var capacity_section = $('#capacityTab', dialog);
    autoFillInputs(template, capacity_section);
    $("#DESCRIPTION", capacity_section).val(template["DESCRIPTION"]);
    delete template["DESCRIPTION"];

    //
    // DISKS
    //

    var number_of_disks = 0;

    function fillDiskTab(disk) {
        var str_disk_tab_id = 'disk' + number_of_disks;
        var disk_section  = $('#' + str_disk_tab_id + 'Tab', dialog);

        if (disk.IMAGE_ID || disk.IMAGE) {
            $('input#'+str_disk_tab_id+'radioImage', disk_section).click();

            var dataTable_template_images = $("#datatable_template_images" + number_of_disks).dataTable();

            var disk_image_id = disk.IMAGE_ID
            var disk_image = disk.IMAGE
            var disk_image_uname = disk.IMAGE_UNAME
            // TODO updateView should not be required. Currently the dataTable
            //  is filled twice.
            update_datatable_template_images(dataTable_template_images, function(){
                //dataTable_template_images.unbind('draw');

                if (disk_image_id || (disk_image && disk_image_uname)) {
                    var clicked = false
                    var data = dataTable_template_images.fnGetData();
                    $.each(data, function(){
                        if (this[1] == disk_image_id || (this[2] == disk_image_uname && this[4] == disk_image)) {
                            clicked = true;
                            $(".alert-box", disk_section).hide();
                            $('#image_selected', disk_section).show();
                            $('#select_image', disk_section).hide();
                            $('#IMAGE_NAME', disk_section).text(this[4]);
                            if(disk_image_id) $('#IMAGE_ID', disk_section).val(this[1]);
                            if(disk_image_uname) $('#IMAGE_UNAME', disk_section).val(this[2]);
                            if(disk_image) $('#IMAGE', disk_section).val(this[4]);
                        }
                    })

                    if (!clicked) {
                        $(".alert-box", disk_section).show();
                    }
                } else {
                    $(".alert-box", disk_section).show();
                }

            })

        }
        else {
            $('input#'+str_disk_tab_id+'radioVolatile', disk_section).click();
            if (disk.SIZE) {
              $('#SIZE_TMP', disk_section).val(disk.SIZE / 1024)
            }

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

        delete template.DISK
    }


    //
    // NICS
    //

    var number_of_nics = 0;

    function fillNicTab(nic) {
        var str_nic_tab_id = 'nic' + number_of_nics;
        var nic_section  = $('#' + str_nic_tab_id + 'Tab', dialog);

        var dataTable_template_networks = $("#datatable_template_networks" + number_of_nics).dataTable();

        var nic_network_id = nic.NETWORK_ID
        var nic_network = nic.NETWORK
        var nic_network_uname = nic.NETWORK_UNAME
        // TODO updateView should not be required. Currently the dataTable
        //  is filled twice.
        update_datatable_template_networks(dataTable_template_networks, function(){

            if (nic_network_id || (nic_network && nic_network_uname)) {
                var clicked = false
                var data = dataTable_template_networks.fnGetData();
                $.each(data, function(){
                    if (this[1] == nic_network_id || (this[4] == nic_network && this[2] == nic_network_uname)) {
                        clicked = true;
                        $('.alert-box', nic_section).hide();
                        $('#network_selected', nic_section).show();
                        $('#select_network', nic_section).hide();
                        $('#NETWORK_NAME', nic_section).text(this[4]);
                        if (nic_network_id) $('#NETWORK_ID', nic_section).val(this[1]);
                        if (nic_network) $('#NETWORK', nic_section).val(this[4]);
                        if (nic_network_uname) $('#NETWORK_UNAME', nic_section).val(this[2]);
                    }
                })

                if (!clicked) {
                    $('.alert-box', nic_section).show();
                }
            } else {
                $('.alert-box', nic_section).show();
            }
        })

        autoFillInputs(nic, nic_section);

        fill_nic_tab_data(nic, nic_section);
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

        delete template.NIC
    }


    //
    // OS
    //

    var os = template.OS;
    var os_section = $('#osTab', dialog);
    var kernel_section = $('#kernelTab', dialog);
    var initrd_section = $('#ramdiskTab', dialog);

    if (os) {
        if (os.KERNEL_DS) {
            $('input#radioKernelDs', kernel_section).click();

            var dataTable_template_kernel = $("#datatable_kernel").dataTable();

            var os_kernel_ds = os.KERNEL_DS;
            // TODO updateView should not be required. Currently the dataTable
            //  is filled twice.
            update_datatable_template_files(dataTable_template_kernel, function(){
//                dataTable_template_kernel.unbind('draw');
//
//                var regexp = /\$FILE\[IMAGE_ID=([0-9]+)+/;
//                var match = regexp.exec(os_kernel_ds)
//                var clicked = false;
//                var data = dataTable_template_kernel.fnGetData();
//                if (match) {
//                    $.each(data, function(){
//                         if (this[1] == match[1]) {
//                            clicked = true;
//                            $("#KERNEL", kernel_section).val(this[1])
//                         }
//                    })
//
//                    if (!clicked) {
//                        var alert = '<div class="alert-box alert">'+
//    'RAMDISK: '+ os_initrd_ds + tr(" does not exists any more") +
//    '  <a href="" class="close">&times;</a>'+
//    '</div>';
//
//                        $("#kernel_ds_inputs", kernel_section).append(alert);
//                    }
//                } else {
//                    var alert = '<div class="alert-box alert">'+
//    tr("The image you specified cannot be selected in the table") +
//    '</div>';
//                    $("#kernel_ds_inputs", kernel_section).append(alert);
//                }
            })
        }
        else if (os.KERNEL) {
            $('input#radioKernelPath', os_section).click();
        };

        if (os.INITRD_DS) {
            $('input#radioInitrdDs', os_section).click();

            var dataTable_template_initrd = $("#datatable_initrd").dataTable();
            var os_initrd_ds = os.INITRD_DS;

            // TODO updateView should not be required. Currently the dataTable
            //  is filled twice.
            update_datatable_template_files(dataTable_template_initrd, function(){
 //               dataTable_template_initrd.unbind('draw');

 //               var regexp = /\$FILE\[IMAGE_ID=([0-9]+)+/;
 //               var match = regexp.exec(os_initrd_ds)
 //               var clicked = false;
 //               var data = dataTable_template_initrd.fnGetData();
 //               if (match) {
 //                   $.each(data, function(){
 //                        if (this[1] == match[1]) {
 //                           clicked = true;
 //                           $("#INITRD", initrd_section).text(this[1])
 //                        }
 //                   })

 //                   if (!clicked) {
 //                       var alert = '<div class="alert-box alert">'+
 //   'RAMDISK: '+ os_initrd_ds + tr(" does not exists any more") +
 //   '  <a href="" class="close">&times;</a>'+
 //   '</div>';

 //                       $("#selected_image", initrd_section).append(alert);
 //                   }
 //               } else {
 //                   var alert = '<div class="alert-box alert">'+
 //   tr("The image you specified cannot be selected in the table") +
 //   '</div>';
 //                   $("#selected_image", initrd_section).append(alert);
 //               }
            })
        }
        else if (os.INITRD) {
            $('input#radioInitrdPath', os_section).click();
        };

        autoFillInputs(os, os_section);


        delete template.OS
    }

    //
    // FEATURES
    //

    var features = template.FEATURES;
    var features_section = $('#featuresTab', dialog);

    if (features) {
        autoFillInputs(features, features_section);
        delete template.FEATURES
    }

    //
    // INPUT/OUTPUT
    //

    var graphics = template.GRAPHICS;
    var graphics_section = $('#ioTab .graphics', dialog);

    if (graphics) {
        var type = graphics.TYPE;
        if (graphics.TYPE) {
            $("input[value='"+ type + "']").click();

            autoFillInputs(graphics, graphics_section);
        }

        delete template.GRAPHICS
    }

    var inputs = template.INPUT;
    var inputs_section = $('#ioTab .inputs', dialog);

    if (inputs) {
        if (!(inputs instanceof Array)) {
            inputs = [inputs];
        }

        $.each(inputs, function(){
            var table = $('#input_table', inputs_section)[0];
            var rowCount = table.rows.length;
            var row = table.insertRow(rowCount);

            var cell1 = row.insertCell(0);
            var element1 = document.createElement("input");
            element1.id = "TYPE";
            element1.type = "text";
            element1.value = htmlDecode(this.TYPE);
            cell1.appendChild(element1);

            var cell2 = row.insertCell(1);
            var element2 = document.createElement("input");
            element2.id = "BUS";
            element2.type = "text";
            element2.value = htmlDecode(this.BUS);
            cell2.appendChild(element2);


            var cell3 = row.insertCell(2);
            cell3.innerHTML = "<i class='fa fa-times-circle fa fa-lg remove-tab'></i>";
        });


        delete template.INPUT
    }


    //
    // CONTEXT
    //

    var context = template.CONTEXT;
    var context_section = $('#contextTab', dialog);

    $("#ssh_context", context_section).removeAttr('checked');
    $("#network_context", context_section).removeAttr('checked');

    if (context) {
        var file_ds_regexp = /\$FILE\[IMAGE_ID=([0-9]+)+/g;
        var net_regexp = /^NETWORK$/;;
        var ssh_regexp = /^SSH_PUBLIC_KEY$/;
        var token_regexp = /^TOKEN$/;
        var publickey_regexp = /\$USER\[SSH_PUBLIC_KEY\]/;

        var net_flag = false;
        var files = [];

        $.each(context, function(key, value){
            if (ssh_regexp.test(key)) {
                $("#ssh_context", context_section).attr('checked','checked');

                if (!publickey_regexp.test(value)) {
                    $("#ssh_public_key", context_section).val(htmlDecode(value));
                }
            }
            else if (token_regexp.test(key)) {
                $("#token_context", context_section).attr('checked','checked');
            }
            else if (net_regexp.test(key)) {
                $("#network_context", context_section).attr('checked','checked');
            }
            else if ("INIT_SCRIPTS" == key){
                $("input#INIT_SCRIPTS").val(htmlDecode(value));
            }
            else if ("FILES_DS" == key){
                $('#FILES_DS', context_section).val(htmlDecode(context["FILES_DS"]))
                var files = [];
                while (match = file_ds_regexp.exec(value)) {
                    files.push(match[1])
                }

                var dataTable_context = $("#datatable_context").dataTable();

                // TODO updateView should not be required. Currently the dataTable
                //  is filled twice.
                update_datatable_template_files(dataTable_context, function(){
//                    dataTable_context.unbind('draw');
//
//                    var data = dataTable_context.fnGetData();
//                    $.each(data, function(){
//                        var in_array = $.inArray(this[1], files)
//                        if (in_array != -1) {
//                            $('#files_selected',  context_section).show();
//                            $('#select_files', context_section).hide();
//                            files.splice(in_array, 1);
//                            $('#selected_files_spans', context_section).append('<span image_id="'+this[1]+'" id="tag_file_'+this[1]+'" class="image radius label">'+this[4]+' <span class="fa fa-times blue"></span></span> ');
//                        }
//                    })
//
//                    if (files.length != 0) {
//                        var alert = '<div class="alert-box alert">'+
//tr('The following FILES: ') + files.join(', ') + tr(" do not exist any more") +
//'  <a href="" class="close">&times;</a>'+
//'</div>';
//
//                        $(".dataTables_wrapper", context_section).append(alert);
//                    }
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
              element1.value = htmlDecode(key);
              cell1.appendChild(element1);

              var cell2 = row.insertCell(1);
              var element2 = document.createElement("input");
              element2.id = "VALUE";
              element2.type = "text";
              element2.value = htmlDecode(value);
              cell2.appendChild(element2);


              var cell3 = row.insertCell(2);
              cell3.innerHTML = "<i class='fa fa-times-circle fa fa-lg remove-tab'></i>";
            }
        });

        delete template.CONTEXT
    }

    //
    // REQUIREMENTS & RANK
    //

    var req = template.SCHED_REQUIREMENTS;
    var req_section = $('#schedulingTab', dialog);

    if (req) {
        req = escapeDoubleQuotes(req);

        var host_id_regexp = /(\s|\||\b)ID=\\"([0-9]+)\\"/g;
        var cluster_id_regexp = /CLUSTER_ID=\\"([0-9]+)\\"/g;

        var hosts = [];
        while (match = host_id_regexp.exec(req)) {
            hosts.push(match[2])
        }

        var clusters = [];
        while (match = cluster_id_regexp.exec(req)) {
            clusters.push(match[1])
        }

        if (hosts.length != 0) {
            var dataTable_template_hosts = $("#datatable_template_hosts").dataTable();

            update_datatable_template_hosts(dataTable_template_hosts, function(){
//                dataTable_template_hosts.unbind('draw');
//
//                var rows = dataTable_template_hosts.fnGetNodes();
//
//                for (var j=0;j<rows.length;j++) {
//                    var current_row = $(rows[j]);
//                    var row_id = $(rows[j]).find("td:eq(1)").html();
//
//                    var in_array = $.inArray(row_id, hosts)
//                    if (in_array != -1) {
//                        hosts.splice(in_array, 1);
//                        // TBD check if all the hosts were clicked
//                        rows[j].click();
//                    }
//                }
//
//                if (hosts.length != 0) {
//                    var alert = '<div class="alert-box alert">'+
//tr('The following HOSTs: [') + hosts.join(', ') + '] ' + tr(" do not exist any more") +
//'  <a href="" class="close">&times;</a>'+
//'</div>';
//
//                    $("#datatable_template_hosts_wrapper", req_section).append(alert);
//                }
            });
        }

        if (clusters.length != 0) {
            $('input#clusters_req', req_section).click();

            var dataTable_template_clusters = $("#datatable_template_clusters").dataTable();

            update_datatable_template_clusters(dataTable_template_clusters, function(){
//               dataTable_template_clusters.unbind('draw');

//               var rows = dataTable_template_clusters.fnGetNodes();

//               for (var j=0;j<rows.length;j++) {
//                   var current_row = $(rows[j]);
//                   var row_id = $(rows[j]).find("td:eq(1)").html();

//                   var in_array = $.inArray(row_id, clusters)
//                   if (in_array != -1) {
//                       clusters.splice(in_array, 1);
//                       // TBD check if all the clusters were clicked
//                       rows[j].click();
//                   }
//               }

//               if (clusters.length != 0) {
//                   var alert = '<div class="alert-box alert">'+
//r('The following CLUSTERs: [') + clusters.join(', ') + '] ' + tr("do not exist any more") +
//  <a href="" class="close">&times;</a>'+
//</div>';

//                   $("#datatable_template_clusters_wrapper", req_section).append(alert);
//               }
            });
        }

        $('input#SCHED_REQUIREMENTS', req_section).val(htmlDecode(req));

        delete template.SCHED_REQUIREMENTS;
    }

    var ds_req = template.SCHED_DS_REQUIREMENTS;
    var ds_req_section = $('#schedulingTab', dialog);

    if (ds_req) {
        ds_req = escapeDoubleQuotes(ds_req);
        $('input#SCHED_DS_REQUIREMENTS', req_section).val(htmlDecode(ds_req));

        delete template.SCHED_DS_REQUIREMENTS;
    }

    var rank = template.SCHED_RANK;

    if (rank) {
        var striping_regexp = /^-RUNNING_VMS$/;
        var packing_regexp = /^RUNNING_VMS$/;
        var loadaware_regexp = /^FREE_CPU$/;

        if (striping_regexp.test(rank)) {
            $('input[name="rank_select"]#stripingRadio', req_section).click()
        }
        else if (packing_regexp.test(rank)) {
            $('input[name="rank_select"]#packingRadio', req_section).click()
        }
        else if (loadaware_regexp.test(rank)) {
            $('input[name="rank_select"]#loadawareRadio', req_section).click()
        }

        $('input#SCHED_RANK', req_section).val(htmlDecode(rank));

        delete template.SCHED_RANK;
    }

    var ds_rank = template.SCHED_DS_RANK;

    if (ds_rank) {
        var striping_regexp = /^FREE_MB$/;
        var packing_regexp = /^-FREE_MB$/;

        if (striping_regexp.test(ds_rank)) {
            $('input[name="ds_rank_select"]#stripingDSRadio', req_section).click()
        }
        else if (packing_regexp.test(ds_rank)) {
            $('input[name="ds_rank_select"]#packingDSRadio', req_section).click()
        }

        $('input#SCHED_DS_RANK', req_section).val(htmlDecode(ds_rank));

        delete template.SCHED_DS_RANK;
    }

    //
    // RAW
    //

    var raw = template.RAW;
    var raw_section = $('#rawTab', dialog);


    if (raw) {
        $('#raw_type', raw_section).val(raw['TYPE']);
        $('#raw_type', raw_section).change();
        $('#raw_data', raw_section).val(htmlDecode(raw['DATA']));
        $('#raw_data_vmx', raw_section).val(htmlDecode(raw['DATA_VMX']));

        delete template.RAW
    }

    $.each(template, function(key, value){
        var table = $('#custom_tags', raw_section)[0];
        var rowCount = table.rows.length;
        var row = table.insertRow(rowCount);

        var cell1 = row.insertCell(0);
        var element1 = document.createElement("input");
        element1.id = "KEY";
        element1.type = "text";
        element1.value = htmlDecode(key);
        cell1.appendChild(element1);

        var cell2 = row.insertCell(1);
        var element2 = document.createElement("input");
        element2.id = "VALUE";
        element2.type = "text";
        element2.value = htmlDecode(value);
        cell2.appendChild(element2);


        var cell3 = row.insertCell(2);
        cell3.innerHTML = "<i class='fa fa-times-circle fa fa-lg remove-tab'></i>";
    });
}

// Template clone dialog
function setupTemplateCloneDialog(){
    //Append to DOM
    dialogs_context.append('<div id="template_clone_dialog""></div>');
    var dialog = $('#template_clone_dialog',dialogs_context);

    //Put HTML in place

    var html = '<div class="row">\
  <h3 id="create_vnet_header" class="subheader">'+tr("Clone Template")+'</h3>\
</div>\
<form>\
<div class="row">\
  <div class="large-12 columns">\
    <div class="clone_one"></div>\
    <div class="clone_several">'+tr("Several templates are selected, please choose prefix to name the new copies")+'<br></div>\
  </div>\
</div>\
<div class="row">\
  <div class="large-12 columns">\
    <label class="clone_one">'+tr("Name")+'</label>\
    <label class="clone_several">'+tr("Prefix")+'</label>\
    <input type="text" name="name"></input>\
  </div>\
</div>\
<div class="form_buttons row">\
  <button class="button radius right" id="template_clone_button" value="Template.clone">\
'+tr("Clone")+'\
  </button>\
        </div>\
<a class="close-reveal-modal">&#215;</a>\
</form>\
';


    dialog.html(html);
    dialog.addClass("reveal-modal").attr("data-reveal", "");

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
        $(this).parents('#template_clone_dialog').foundation('reveal', 'close')
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

    $(dialog).foundation().foundation('reveal', 'open');
    $("input[name='name']",dialog).focus();
}

// Instantiate dialog
// Sets up the instiantiate template dialog and all the processing associated to it
function setupInstantiateTemplateDialog(easy_provision){

    dialogs_context.append('<div title=\"'+tr("Instantiate VM Template")+'\" id="instantiate_vm_template_dialog"></div>');
    //Insert HTML in place
    $instantiate_vm_template_dialog = $('#instantiate_vm_template_dialog')
    var dialog = $instantiate_vm_template_dialog;

    if (easy_provision) {
      dialog.html(easy_provision_vm_template_tmpl);
      dialog.addClass("reveal-modal large max-height").attr("data-reveal", "");

      var dataTable_template_images = $('#template_images_table', dialog).dataTable({
          "iDisplayLength": 4,
          "bAutoWidth":false,
          "sDom" : '<"H">t<"F"p>',
          "aoColumnDefs": [
              { "sWidth": "35px", "aTargets": [0,1] },
              { "bVisible": false, "aTargets": [2,3,7,8,5,9,12]}
          ],
            "bSortClasses" : false,
            "bDeferRender": true,
            "fnDrawCallback": function(oSettings) {
              var nodes = this.fnGetNodes();
              $.each(nodes, function(){
                  if ($(this).find("td:eq(1)").html() == $('#IMAGE_ID', dialog).val()) {
                      $("td", this).addClass('markrow');
                      $('input.check_item', this).attr('checked','checked');
                  }
              })
            }
      });

      // Retrieve the images to fill the datatable
      update_datatable_template_images(dataTable_template_images);

      $('#template_images_table_search', dialog).keyup(function(){
        dataTable_template_images.fnFilter( $(this).val() );
      })

      dataTable_template_images.fnSort( [ [1,config['user_config']['table_order']] ] );

      $('#template_images_table tbody', dialog).delegate("tr", "click", function(e){
          var aData = dataTable_template_images.fnGetData(this);

          $("td.markrow", dataTable_template_images).removeClass('markrow');
          $('tbody input.check_item', dataTable_template_images).removeAttr('checked');

          $('#image_selected', dialog).show();
          $('#select_image', dialog).hide();
          $('.alert-box', dialog).hide();

          $("td", this).addClass('markrow');
          $('input.check_item', this).attr('checked','checked');

          $('#IMAGE_NAME', dialog).text(aData[4]);
          $('#IMAGE_ID', dialog).val(aData[1]);
          return true;
      });

      $("#refresh_template_images_table_button_class").die();
      $("#refresh_template_images_table_button_class").live('click', function(){
          update_datatable_template_images($('#template_images_table').dataTable());
      });

      var dataTable_template_templates = $('#template_templates_table', dialog).dataTable({
          "iDisplayLength": 4,
          "bAutoWidth":false,
          "sDom" : '<"H">t<"F"p>',
          "aoColumnDefs": [
              { "sWidth": "35px", "aTargets": [0,1] },
              { "bVisible": false, "aTargets": [1,2,3,5]}
          ],
            "bSortClasses" : false,
            "bDeferRender": true,
            "fnDrawCallback": function(oSettings) {
              var nodes = this.fnGetNodes();
              $.each(nodes, function(){
                  if ($(this).find("td:eq(1)").html() == $('#TEMPLATE_ID', dialog).val()) {
                      $("td", this).addClass('markrow');
                      $('input.check_item', this).attr('checked','checked');
                  }
              })
            }
      });

      // Retrieve the images to fill the datatable
      update_datatable_template_templates(dataTable_template_templates);

      $('#template_templates_table_search', dialog).keyup(function(){
        dataTable_template_templates.fnFilter( $(this).val() );
      })

      dataTable_template_templates.fnSort( [ [1,config['user_config']['table_order']] ] );

      $('#template_templates_table tbody', dialog).delegate("tr", "click", function(e){
          var aData = dataTable_template_templates.fnGetData(this);

          $("td.markrow", dataTable_template_templates).removeClass('markrow');
          $('tbody input.check_item', dataTable_template_templates).removeAttr('checked');

          $('#template_selected', dialog).show();
          $('#select_template', dialog).hide();
          $('.alert-box', dialog).hide();

          $("td", this).addClass('markrow');
          $('input.check_item', this).attr('checked','checked');

          $('#TEMPLATE_NAME', dialog).text(aData[4]);
          $('#TEMPLATE_ID', dialog).val(aData[1]);
          return true;
      });

      $("#refresh_template_templates_table_button_class").die();
      $("#refresh_template_templates_table_button_class").live('click', function(){
          update_datatable_template_templates($('#template_templates_table').dataTable());
      });
    } else {
      dialog.html(instantiate_vm_template_tmpl);
      dialog.addClass("reveal-modal").attr("data-reveal", "");
      dialog.removeClass("max-height")
    }


    setupTips(dialog);

    $('#instantiate_vm_template_form',dialog).submit(function(){
        var vm_name = $('#vm_name',this).val();
        var n_times = $('#vm_n_times',this).val();
        var n_times_int=1;

        var template_id
        if ($("#TEMPLATE_ID", this).val()) {
          template_id = $("#TEMPLATE_ID", this).val();
        } else {
          var selected_nodes = getSelectedNodes(dataTable_templates);
          template_id = ""+selected_nodes[0];
        }


        if (n_times.length){
            n_times_int=parseInt(n_times,10);
        };

        var extra_msg = "";
        if (n_times_int > 1) {
            extra_msg = n_times_int+" times";
        }

        notifySubmit("Template.instantiate",template_id, extra_msg);

        var extra_info = {};
        if ($("#IMAGE_ID", this).val()) {
          image_id = $("#IMAGE_ID", this).val();
          extra_info['template'] = {
            'disk': {
              'image_id': image_id
            }
          }
        }

        if (!vm_name.length){ //empty name use OpenNebula core default
            for (var i=0; i< n_times_int; i++){
                extra_info['vm_name'] = "";
                Sunstone.runAction("Template.instantiate_quiet", template_id, extra_info);
            };
        }
        else
        {
          if (vm_name.indexOf("%i") == -1){//no wildcard, all with the same name
              for (var i=0; i< n_times_int; i++){
                extra_info['vm_name'] = vm_name;
                Sunstone.runAction("Template.instantiate_quiet", template_id, extra_info);
              };
          } else { //wildcard present: replace wildcard
              for (var i=0; i< n_times_int; i++){
                  extra_info['vm_name'] = vm_name.replace(/%i/gi,i);
                  Sunstone.runAction("Template.instantiate_quiet", template_id, extra_info);
              };
          };
        }

        $instantiate_vm_template_dialog.foundation('reveal', 'close')
        return false;
    });
}

// Open creation dialog
function popUpInstantiateVMTemplateDialog(easy_provision){
    setupInstantiateTemplateDialog(easy_provision);
    $instantiate_vm_template_dialog.foundation().foundation('reveal', 'open');
    $("input#vm_name",$instantiate_vm_template_dialog).focus();
}

//The DOM is ready at this point
$(document).ready(function(){
    var tab_name = 'templates-tab';

    if (Config.isTabEnabled(tab_name)) {
      dataTable_templates = $("#datatable_templates",main_tabs_context).dataTable({
          "aoColumnDefs": [
              { "bSortable": false, "aTargets": ["check"] },
              { "sWidth": "35px", "aTargets": [0] },
              { "bVisible": true, "aTargets": Config.tabTableColumns(tab_name)},
              { "bVisible": false, "aTargets": ['_all']}
          ],
          "bSortClasses" : false,
          "bDeferRender": true
      });


      $('#template_search').keyup(function(){
        dataTable_templates.fnFilter( $(this).val() );
      })

      dataTable_templates.on('draw', function(){
        recountCheckboxes(dataTable_templates);
      })

      Sunstone.runAction("Template.list");
      setupTemplateCloneDialog();

      initCheckAllBoxes(dataTable_templates);
      tableCheckboxesListener(dataTable_templates);
      infoListener(dataTable_templates,'Template.show');

      $('div#templates_tab div.legend_div').hide();

      dataTable_templates.fnSort( [ [1,config['user_config']['table_order']] ] );
    }
});
