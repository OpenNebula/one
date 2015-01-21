// ------------------------------------------------------------------------ //
// Copyright 2010-2014, C12G Labs S.L.                                      //
//                                                                          //
// Licensed under the Apache License, Version 2.0 (the "License"); you may  //
// not use this file except in compliance with the License. You may obtain  //
// a copy of the License at                                                 //
//                                                                          //
// http://www.apache.org/licenses/LICENSE-2.0                               //
//                                                                          //
// Unless required by applicable law or agreed to in writing, software      //
// distributed under the License is distributed on an "AS IS" BASIS,        //
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. //
// See the License for the specific language governing permissions and      //
// limitations under the License.                                           //
//------------------------------------------------------------------------- //
var selected_row_template_role_id;
var last_selected_row_template_role;

var create_service_template_wizard_html = '\
  <form data-abide="ajax" id="create_service_template_form_wizard" action="">\
    <div class="row">\
        <div class="service_template_param st_man large-6 columns">\
            <label for="service_name">' + tr("Name") +
                '<span class="tip">'+ tr("Name for this template") +'</span>'+
            '</label>'+
            '<input type="text" id="service_name" name="service_name" required/>\
        </div>\
        <div class="service_template_param st_man large-6 columns">'+
        '</div>\
    </div>\
    <div class="row">\
        <div class="service_template_param st_man large-12 columns">'+
          '<label  for="description">'+tr("Description")+'\
            <span class="tip">'+tr("Description of the service")+'</span>\
          </label>'+
          '<textarea type="text" id="description" name="description"/>'+
        '</div>\
    </div>\
    <br>'+
    generateAdvancedSection({
        title: tr("Network Configuration"),
        html_id: "network_configuration_and_attributes",
        content: '<div class="row">\
                <div class="large-12 columns">\
                      <table class="service_networks policies_table dataTable">\
                            <thead>\
                              <tr>\
                                <th style="width:30%">'+tr("Name")+'\
                                </th>\
                                <th style="width:70%">'+tr("Description")+'\
                                </th>\
                                <th style="width:3%"></th>\
                              </tr>\
                            </thead>\
                            <tbody>\
                            </tbody>\
                            <tfoot>\
                              <tr>\
                                <td colspan="3">\
                                    <a type="button" class="add_service_network button small large-12 secondary radius"><i class="fa fa-plus"></i> '+tr("Add another Network")+'</a>\
                                </td>\
                              </tr>\
                            </tfoot>\
                      </table>\
                </div>\
            </div>'}) +
    generateAdvancedSection({
        title: tr("Advanced Service Parameters"),
        html_id: "advanced_service_params",
        content: '<div class="row">\
                <div class="service_template_param st_man large-6 columns">\
                    <label for="deployment">' + tr("Strategy") +
                        '<span class="tip">'+ tr("Straight strategy will instantiate each role in order: parents role will be deployed before their children. None strategy will instantiate the roles regardless of their relationships.") +'</span>'+
                    '</label>\
                    <select name="deployment">\
                        <option value="straight">'+ tr("Straight") + '</option>\
                        <option value="none">'+ tr("None") + '</option>\
                    </select>\
                </div>\
                <div class="service_template_param st_man large-6 columns">\
                    <label for="shutdown_action_service">' + tr("Shutdown action") +
                        '<span class="tip">'+ tr("VM shutdown action: 'shutdown' or 'shutdown-hard'.") +'</span>'+
                    '</label>\
                    <select name="shutdown_action_service">\
                        <option value=""></option>\
                        <option value="shutdown">'+tr("Shutdown")+'</option>\
                        <option value="shutdown-hard">'+tr("Shutdown hard")+'</option>\
                    </select>\
                </div>\
            </div>\
            <div class="row">\
                <div class="service_template_param st_man large-6 columns">\
                    <input type="checkbox" name="ready_status_gate" id="ready_status_gate"/>\
                    <label for="ready_status_gate">'+tr("Wait for VMs to report that they are READY")+'\
                      <span class="tip">' + tr("Before deploying any child roles, wait for all VMs of the parent roles to report via OneGate that they are READY=YES") +'</span>\
                    </label>\
                </div>\
            </div>'}) +
    '<br>\
    <div class="row">\
        <div class="large-12 columns">\
            <h4>'+tr("Roles")+'</h4>\
        </div>\
    </div>\
    <br>\
    <div class="row">\
        <div id="new_role" class="bordered-tabs large-12 columns">\
           <dl class="tabs" id="roles_tabs" data-tab>\
            <a class="button small right radius" id="tf_btn_roles"><span class="fa fa-plus"></span> '+tr("Add another role")+'</a>\
           </dl>\
           <div class="tabs-content" id="roles_tabs_content">\
           </div>\
        </div>\
    </div>\
  </form>';

var role_tab_content = '\
<div class="row">\
    <div class="service_template_param service_role st_man large-6 columns">\
              <label for="name">' + tr("Role Name") +
                '<span class="tip">'+ tr("Name of the role") +'</span>'+
              '</label>\
              <input type="text" id="role_name" name="name" required/>\
    </div>\
</div>\
<div class="row">\
    <div class="service_template_param service_role large-6 columns">\
        <label for="vm_template">' + tr("VM template") +
            '<span class="tip">'+ tr("Template associated to this role") +'</span>'+
        '</label>\
        <div id="vm_template">\
        </div>\
    </div>\
    <div class="service_template_param service_role large-2 columns">\
        <label for="cardinality">' + tr("VMs") +
            '<span class="tip">'+ tr("Number of VMs to instantiate with this role") +'</span>'+
        '</label>\
        <input type="text" id="cardinality" name="cardinality" value="1" />\
    </div>\
    <div class="large-2 columns">\
    </div>\
    <div class="large-2 columns">\
    </div>\
</div>\
<div class="row">\
    <div class="service_template_param service_role large-6 columns">\
        <table class="networks_role extended_table dataTable">\
            <thead>\
                <tr><th colspan="2"><i class="fa fa-lg fa-fw fa-globe off-color"/>'+tr("Network Interfaces")+'</th></tr>\
            </thead>\
            <tbody class="networks_role_body">\
            </tbody>\
        </table>\
    </div>\
    <div class="service_template_param service_role large-6 columns">\
        <table class="parent_roles extended_table dataTable">\
            <thead>\
                <tr><th colspan="2">'+tr("Parent roles")+'</th></tr>\
            </thead>\
            <tbody class="parent_roles_body">\
            </tbody>\
        </table>\
    </div>\
</div>\
<br>\
<div class="row">\
    <div class="large-12 columns elasticity_accordion">\
    </div>\
</div>\
<div class="row">\
    <div class="large-12 columns advanced_role_accordion">\
    </div>\
</div>';

var create_service_template_advanced_html =
 '<form data-abide="ajax" id="create_service_template_form_advanced" class="custom creation">' +
    '<div class="row">' +
      '<div class="large-12 columns">' +
        '<p>'+tr("Write the Service template here")+'</p>' +
      '</div>' +
    '</div>' +
    '<div class="row">' +
      '<div class="large-12 columns">' +
        '<textarea id="template" rows="15" required></textarea>' +
      '</div>' +
    '</div>' +
  '</form>';

function generate_advanced_role_accordion(role_id, context){
    context.html(generateAdvancedSection({
        title: tr("Advanced Role Parameters"),
        html_id: 'advanced_role'+role_id,
        content: '<div class="row">\
                <div class="service_template_param service_role large-6 columns">\
                    <label for="shutdown_action_role">' + tr("Shutdown action") +
                        '<span class="tip">'+ tr("VM shutdown action: 'shutdown' or 'shutdown-hard'. If it is not set, the one set for the Service will be used") +'</span>'+
                    '</label>\
                    <select name="shutdown_action_role">\
                        <option value=""></option>\
                        <option value="shutdown">'+tr("Shutdown")+'</option>\
                        <option value="shutdown-hard">'+tr("Shutdown hard")+'</option>\
                    </select>\
                </div>\
                <div class="large-6 columns">\
                </div>\
            </div>\
            <div class="row">\
                <div class="service_template_param st_man large-12 columns">'+
                  '<label  for="vm_template_contents">'+tr("VM Template Content")+'\
                    <span class="tip">'+tr("This information will be merged with the original Virtual Machine template. Configuration attributes and network interfaces will be replaced by those provided by the user when the template is instantiated")+'</span>\
                  </label>'+
                  '<textarea type="text" class="vm_template_contents" name="vm_template_contents"/>'+
                '</div>\
            </div>'}));
}

function generate_elasticity_accordion(role_id, context) {
    context.html(generateAdvancedSection({
        title: tr("Role Elasticity"),
        html_id: 'elasticity_accordion'+role_id,
        content: '<div class="row">\
                <div class="large-4 columns">\
                        <label for="min_vms">' + tr("Min VMs") +
                            '<span class="tip">'+ tr("Minimum number of VMs for elasticity adjustments") +'</span>'+
                        '</label>\
                        <input type="text" id="min_vms" name="min_vms" value="" />\
                </div>\
                <div class="large-4 columns">\
                        <label for="max_vms">' + tr("Max VMs") +
                            '<span class="tip">'+ tr("Maximum number of VMs for elasticity adjustments") +'</span>'+
                        '</label>\
                        <input type="text" id="max_vms" name="max_vms" value="" />\
                </div>\
                <div class="service_template_param service_role large-4 columns">\
                    <label for="cooldown">' + tr("Cooldown") +
                        '<span class="tip">'+ tr("Cooldown time after an elasticity operation (secs)") +'</span>'+
                    '</label>\
                    <input type="text" id="cooldown" name="cooldown" value="" />\
                </div>\
            </div>\
            <div class="row">\
                <div class="large-12 columns">\
                      <table id="elasticity_policies_table" class="policies_table dataTable">\
                            <thead style="background:#dfdfdf">\
                              <tr>\
                                <th colspan="8" style="font-size: 16px !important">\
                                    '+tr("Elasticity policies")+'\
                                </th>\
                              </tr>\
                            </thead>\
                            <thead>\
                              <tr>\
                                <th class="has-tip" data-tooltip title="'+tr("Type of adjustment.")+'<br><br>\
                                        '+tr("CHANGE: Add/substract the given number of VMs.")+'<br>\
                                        '+tr("CARDINALITY: Set the cardinality to the given number.")+'<br>\
                                        '+tr("PERCENTAGE_CHANGE: Add/substract the given percentage to the current cardinality.")+
                                    '" style="width:14%">'+tr("Type")+'\
                                </th>\
                                <th class="has-tip" data-tooltip title="'+tr("Positive or negative adjustment. Its meaning depends on 'type'")+'<br><br>\
                                        '+tr("CHANGE: -2, will substract 2 VMs from the role")+'<br>\
                                        '+tr("CARDINALITY: 8, will set carditanilty to 8")+'<br>\
                                        '+tr("PERCENTAGE_CHANGE: 20, will increment cardinality by 20%")+
                                    '" style="width:12%">'+tr("Adjust")+'\
                                </th>\
                                <th class="has-tip" data-tooltip title="'+tr("Optional parameter for PERCENTAGE_CHANGE adjustment type.")+'<br>'+
                                    tr(" If present, the policy will change the cardinality by at least the number of VMs set in this attribute.")+
                                    '" style="width:9%">'+tr("Min")+'\
                                </th>\
                                <th class="has-tip" data-tooltip title="'+tr("Expression to trigger the elasticity")+'<br><br>\
                                        '+tr("Example: ATT < 20")+
                                    '" style="width:30%">'+tr("Expression")+'\
                                </th>\
                                <th class="has-tip" data-tooltip title="'+tr("Number of periods that the expression must be true before the elasticity is triggered")+
                                    '" style="width:8%">#\
                                </th>\
                                <th class="has-tip" data-tooltip title="'+tr("Duration, in seconds, of each period in '# Periods'")+
                                    '" style="width:9%">'+tr("Period")+'\
                                </th>\
                                <th class="has-tip" data-tooltip title="'+tr("Cooldown period duration after a scale operation, in seconds")+
                                    '" style="width:15%">'+tr("Cooldown")+'\
                                </th>\
                                <th style="width:3%"></th>\
                              </tr>\
                            </thead>\
                            <tbody id="elasticity_policies_tbody">\
                            </tbody>\
                            <tfoot>\
                              <tr>\
                                <td colspan="8">\
                                    <a type="button" class="button small radius right" id="tf_btn_elas_policies"><i class="fa fa-plus"></i> '+tr("Add another policy")+'</a>\
                                </td>\
                              </tr>\
                            </tfoot>\
                      </table>\
                </div>\
            </div>\
            <br>\
            <div class="row">\
                <div class="large-12 columns">\
                     <table id="scheduled_policies_table" class="policies_table dataTable">\
                        <thead style="background:#dfdfdf">\
                          <tr>\
                            <th colspan="6" style="font-size: 16px !important">\
                                '+tr("Scheduled policies")+'\
                            </th>\
                          </tr>\
                        </thead>\
                        <thead>\
                          <tr>\
                            <th class="has-tip" data-tooltip title="'+tr("Type of adjustment.")+'<br><br>\
                                    '+tr("CHANGE: Add/substract the given number of VMs.")+'<br>\
                                    '+tr("CARDINALITY: Set the cardinality to the given number.")+'<br>\
                                    '+tr("PERCENTAGE_CHANGE: Add/substract the given percentage to the current cardinality.")+
                                '" style="width:14%">'+tr("Type")+'\
                            </th>\
                            <th class="has-tip" data-tooltip title="'+tr("Positive or negative adjustment. Its meaning depends on 'type'")+'<br><br>\
                                    '+tr("CHANGE: -2, will substract 2 VMs from the role")+'<br>\
                                    '+tr("CARDINALITY: 8, will set carditanilty to 8")+'<br>\
                                    '+tr("PERCENTAGE_CHANGE: 20, will increment cardinality by 20%")+
                                '" style="width:12%">'+tr("Adjust")+'\
                            </th>\
                            <th class="has-tip" data-tooltip title="'+tr("Optional parameter for PERCENTAGE_CHANGE adjustment type. If present, the policy will change the cardinality by at least the number of VMs set in this attribute.")+
                                '" style="width:9%">'+tr("Min")+'\
                            </th>\
                            <th class="has-tip" data-tooltip title="'+tr("Recurrence: Time for recurring adjustements. Time is specified with the Unix cron syntax")+'<br><br>\
                                    '+tr("Start time: Exact time for the adjustement")+
                                '" style="width:28%">'+tr("Time format")+'\
                            </th>\
                            <th class="has-tip" data-tooltip title="'+tr("Time expression depends on the the time formar selected")+'<br><br>\
                                    '+tr("Recurrence: Time for recurring adjustements. Time is specified with the Unix cron syntax")+'<br>\
                                    '+tr("Start time: Exact time for the adjustement")+
                                '" style="width:33%">'+tr("Time expression")+'\
                            </th>\
                            <th style="width:3%"></th>\
                          </tr>\
                        </thead>\
                        <tbody id="scheduled_policies_tbody">\
                        </tbody>\
                        <tfoot>\
                          <tr>\
                            <td colspan="6">\
                                <a type="button" class="button small radius right" id="tf_btn_sche_policies"><i class="fa fa-plus"></i> '+tr("Add another policy")+'</a>\
                            </td>\
                          </tr>\
                        </tfoot>\
                    </table>\
                </div>\
            </div>'}));
}

var instantiate_service_template_tmpl ='\
<div class="row">\
  <h3 class="subheader">'+tr("Instantiate Service Template")+'</h3>\
</div>\
<form data-abide="ajax" id="instantiate_service_template_form" action="">\
  <div class="row">\
    <div class="large-6 columns">\
        <label for="service_name">'+tr("Service Name")+
          '<span class="tip">'+tr("Defaults to template name when emtpy. You can use the wildcard &#37;i. When creating several Services, &#37;i will be replaced with a different number starting from 0 in each of them")+'.</span>'+
        '</label>\
        <input type="text" name="service_name" id="service_name" />\
    </div>\
    <div class="large-6 columns">\
        <label for="service_n_times">'+tr("Number of instances")+
          '<span class="tip">'+tr("Number of Services that will be created using this template")+'.</span>'+
        '</label>\
        <input type="text" name="service_n_times" id="service_n_times" value="1">\
    </div>\
  </div>\
  <div id="instantiate_service_user_inputs">\
    <i class="fa fa-spinner fa-spin"></i>\
  </div>\
  <div class="row" id="instantiate_service_role_user_inputs">\
  </div>\
  <div class="form_buttons">\
     <button class="button radius right success" id="instantiate_service_tenplate_proceed" value="ServiceTemplate.instantiate">'+tr("Instantiate")+'</button>\
  </div>\
  <a class="close-reveal-modal">&#215;</a>\
</form>';



var dataTable_service_templates;

var service_template_actions = {

    "ServiceTemplate.create" : {
        type: "create",
        call: OpenNebula.ServiceTemplate.create,
        callback: function(request, response){
            $("a[href=back]", $("#oneflow-templates")).trigger("click");
            popFormDialog("create_service_template_form", $("#oneflow-templates"));

            addServiceTemplateElement(request, response);
            notifyCustom(tr("Service Template created"), " ID: " + response.DOCUMENT.ID, false);
        },
        error: function(request, response){
            popFormDialog("create_service_template_form", $("#oneflow-templates"));
            onError(request, response);
        }
    },

    "ServiceTemplate.create_dialog" : {
        type : "custom",
        call: function(){
          Sunstone.popUpFormPanel("create_service_template_form", "oneflow-templates", "create", false);
        }
    },

    "ServiceTemplate.update_dialog" : {
        type : "single",
        call: function(){
          var selected_nodes = getSelectedNodes(dataTable_service_templates);
          if ( selected_nodes.length != 1 ) {
            notifyMessage("Please select one (and just one) template to update.");
            return false;
          }

          // Get proper cluster_id
          var template_id   = ""+selected_nodes[0];
          Sunstone.runAction("ServiceTemplate.show_to_update", template_id);
        },
        error: onError
    },

    "ServiceTemplate.show_to_update" : {
        type : "single",
        call: OpenNebula.ServiceTemplate.show,
        callback: function(request, response) {
          Sunstone.popUpFormPanel("create_service_template_form", "oneflow-templates", "update", true, function(context){
            fillUpUpdateServiceTemplateDialog(response, context)
          });
        },
        error: onError
    },

    "ServiceTemplate.update" : {  // Update template
        type: "single",
        call: OpenNebula.ServiceTemplate.update,
        callback: function(request,response){
            $("a[href=back]", $("#oneflow-templates")).trigger("click");
            popFormDialog("create_service_template_form", $("#oneflow-templates"));
            Sunstone.runAction("ServiceTemplate.show",request.request.data[0][0]);

            notifyMessage(tr("ServiceTemplate updated correctly"));
        },
        error: function(request, response){
          popFormDialog("create_service_template_form", $("#oneflow-templates"));
          onError(request, response);
        }
    },

    "ServiceTemplate.list" : {
        type: "list",
        call: OpenNebula.ServiceTemplate.list,
        callback: function(request, service_list) {
            $("#oneflow-templates #error_message").hide();
            updateServiceTemplatesView(request, service_list);
        },
        error: function(request, error_json) {
            onError(request, error_json, $("#oneflow-templates #error_message"))
        }
    },

    "ServiceTemplate.show" : {
        type : "single",
        call: OpenNebula.ServiceTemplate.show,
        callback: function(request, response){
            var tab = dataTable_service_templates.parents(".tab");

            if (Sunstone.rightInfoVisible(tab)) {
                // individual view
                updateServiceTemplateInfo(request, response);
            }

            // datatable row
            updateServiceTemplateElement(request, response);
        },
        error: onError
    },

    "ServiceTemplate.instantiate" : {
        type: "multiple",
        call: OpenNebula.ServiceTemplate.instantiate,
        callback: function(req){
            OpenNebula.Helper.clear_cache("SERVICE");
        },
        elements: serviceTemplateElements,
        error: onError,
        notify: true
    },

    "ServiceTemplate.instantiate_dialog" : {
        type: "custom",
        call: function(){
            popUpInstantiateServiceTemplateDialog();
        }
    },

    "ServiceTemplate.refresh" : {
        type: "custom",
        call: function () {
          var tab = dataTable_service_templates.parents(".tab");
          if (Sunstone.rightInfoVisible(tab)) {
            Sunstone.runAction("ServiceTemplate.show", Sunstone.rightInfoResourceId(tab))
          } else {
            waitingNodes(dataTable_service_templates);
            Sunstone.runAction("ServiceTemplate.list", {force: true});
          }
        }
    },

    "ServiceTemplate.delete" : {
        type: "multiple",
        call: OpenNebula.ServiceTemplate.del,
        callback: deleteServiceTemplateElement,
        elements: serviceTemplateElements,
        error: onError,
        notify: true
    },

    "ServiceTemplate.chown" : {
        type: "multiple",
        call: OpenNebula.ServiceTemplate.chown,
        callback:  function (req) {
            Sunstone.runAction("ServiceTemplate.show",req.request.data[0][0]);
        },
        elements: serviceTemplateElements,
        error: onError,
        notify: true
    },

    "ServiceTemplate.chgrp" : {
        type: "multiple",
        call: OpenNebula.ServiceTemplate.chgrp,
        callback: function (req) {
            Sunstone.runAction("ServiceTemplate.show",req.request.data[0][0]);
        },
        elements: serviceTemplateElements,
        error: onError,
        notify: true
    },

    "ServiceTemplate.chmod" : {
        type: "single",
        call: OpenNebula.ServiceTemplate.chmod,
        error: onError,
        notify: true
    },

    "ServiceTemplate.help" : {
        type: "custom",
        call: function() {
            hideDialog();
            $('div#service_templates_tab div.legend_div').slideToggle();
        }
    }
};


var service_template_buttons = {
    "ServiceTemplate.refresh" : {
        type: "action",
        layout: "refresh",
        alwaysActive: true
    },
//    "Sunstone.toggle_top" : {
//        type: "custom",
//        layout: "top",
//        alwaysActive: true
//    },
    "ServiceTemplate.create_dialog" : {
        type: "create_dialog",
        layout: "create"
    },
    "ServiceTemplate.instantiate_dialog" : {
        type: "action",
        layout: "main",
        text: tr("Instantiate")
    },
    "ServiceTemplate.update_dialog" : {
        type: "action",
        layout: "main",
        text: tr("Update")
    },
    "ServiceTemplate.chown" : {
        type: "confirm_with_select",
        text: tr("Change owner"),
        select: "User",
        layout: "user_select",
        tip: tr("Select the new owner")+":",
        condition: mustBeAdmin
    },
    "ServiceTemplate.chgrp" : {
        type: "confirm_with_select",
        text: tr("Change group"),
        select: "Group",
        layout: "user_select",
        tip: tr("Select the new group")+":",
        condition: mustBeAdmin
    },

    "ServiceTemplate.delete" : {
        type: "confirm",
        text: tr("Delete"),
        layout: "del",
        tip: tr("This will delete the selected templates")
    }
}

var service_template_info_panel = {
    "service_template_info_tab" : {
        title: tr("Service information"),
        content: ""
    }
}

var service_templates_tab = {
    title: "Templates",
    resource: 'ServiceTemplate',
    buttons: service_template_buttons,
    tabClass: 'subTab',
    parentTab: 'oneflow-dashboard',
    search_input: '<input id="service_templates_search" type="search" placeholder="'+tr("Search")+'" />',
    list_header: '<i class="fa fa-fw fa-file-o"></i>&emsp;'+tr("OneFlow - Templates"),
    info_header: '<i class="fa fa-fw fa-file-o"></i>&emsp;'+tr("OneFlow - Template"),
    subheader: '<span/> <small></small>&emsp;',
    content:   '<div class="row" id="error_message" hidden>\
        <div class="small-6 columns small-centered text-center">\
            <div class="alert-box alert radius">'+tr("Cannot connect to OneFlow server")+'</div>\
        </div>\
    </div>',
    table: '<table id="datatable_service_templates" class="datatable twelve">\
        <thead>\
          <tr>\
            <th class="check"><input type="checkbox" class="check_all" value=""></input></th>\
            <th>'+tr("ID")+'</th>\
            <th>'+tr("Owner")+'</th>\
            <th>'+tr("Group")+'</th>\
            <th>'+tr("Name")+'</th>\
          </tr>\
        </thead>\
        <tbody>\
        </tbody>\
      </table>',
    forms: {
      "create_service_template_form": {
        actions: {
          create: {
            title: tr("Create Service Template"),
            submit_text: tr("Create")
          },
          update: {
            title: tr("Update Service Template"),
            submit_text: tr("Update")
          }
        },
        wizard_html: create_service_template_wizard_html,
        advanced_html: create_service_template_advanced_html,
        setup: initialize_create_service_template_dialog
      }
    }
}

Sunstone.addActions(service_template_actions);
Sunstone.addMainTab('oneflow-templates',service_templates_tab);
Sunstone.addInfoPanel('service_template_info_panel',service_template_info_panel);


function serviceTemplateElements() {
    return getSelectedNodes(dataTable_service_templates);
}

// Returns an array containing the values of the service_template_json and ready
// to be inserted in the dataTable
function serviceTemplateElementArray(service_template_json){
    var service_template = service_template_json.DOCUMENT;

    return [
        '<input class="check_item" type="checkbox" id="service_template_'+service_template.ID+'" name="selected_items" value="'+service_template.ID+'"/>',
        service_template.ID,
        service_template.UNAME,
        service_template.GNAME,
        service_template.NAME
    ];
}

// Callback to update an element in the dataTable
function updateServiceTemplateElement(request, service_template_json){
    var id = service_template_json.DOCUMENT.ID;
    var element = serviceTemplateElementArray(service_template_json);
    updateSingleElement(element,dataTable_service_templates,'#service_template_'+id);
}

// Callback to remove an element from the dataTable
function deleteServiceTemplateElement(req){
    deleteElement(dataTable_service_templates,'#service_template_'+req.request.data);
}

// Callback to add an service_template element
function addServiceTemplateElement(request, service_template_json){
    var element = serviceTemplateElementArray(service_template_json);
    addElement(element,dataTable_service_templates);
}

// Callback to refresh the list
function updateServiceTemplatesView(request, service_templates_list){
    var service_template_list_array = [];

    $.each(service_templates_list,function(){
       service_template_list_array.push(serviceTemplateElementArray(this));
    });

    updateView(service_template_list_array,dataTable_service_templates);
}

// Callback to update the information panel tabs and pop it up
function updateServiceTemplateInfo(request,elem){
    var elem_info = elem.DOCUMENT;

    $(".resource-info-header", $("#oneflow-templates")).html(elem_info.NAME);

    var network_configuration = "";
    if (elem_info.TEMPLATE.BODY['custom_attrs']) {
        network_configuration +=
            '<table id="info_template_table" class="dataTable extended_table">\
                <thead>\
                <tr><th colspan="2">'+tr("Network Configuration")+'</th></tr>\
            </thead>'

        $.each(elem_info.TEMPLATE.BODY['custom_attrs'], function(key, attr){
            var parts = attr.split("|");
            // 0 mandatory; 1 type; 2 desc;
            var attrs = {
              "name": key,
              "mandatory": parts[0],
              "type": parts[1],
              "description": parts[2],
            }

            switch (parts[1]) {
              case "vnet_id":
                network_configuration +=
                   '<tr>\
                     <td class="key_td">'+attrs.name+'</td>\
                     <td class="value_td">'+attrs.description+'</td>\
                   </tr>'

                var roles_using_net = [];
                $.each(elem_info.TEMPLATE.BODY.roles, function(index, value){
                    if (value.vm_template_contents){
                        var reg = new RegExp("\\$"+htmlDecode(attrs.name)+"\\b");

                        if(reg.exec(value.vm_template_contents) != null){
                            roles_using_net.push(value.name);
                        }
                    }
                })

                network_configuration +=
                   '<tr>\
                     <td class="key_td"></td>\
                     <td class="value_td">'+tr("Roles") + ": " + roles_using_net.join(", ")+'</td>\
                   </tr>'

                break;
            }
        });

        network_configuration += '</table>';
    }

    var info_tab = {
        title : tr("Info"),
        icon: "fa-info-circle",
        content:
        '<div class="row">\
          <div class="large-6 columns">\
          <table id="info_template_table" class="dataTable extended_table">\
           <thead>\
             <tr><th colspan="2">'+tr("Information")+'</th></tr>\
           </thead>\
           <tr>\
             <td class="key_td">'+tr("ID")+'</td>\
             <td class="value_td">'+elem_info.ID+'</td>\
           </tr>\
           <tr>\
             <td class="key_td">'+tr("Name")+'</td>\
             <td class="value_td">'+elem_info.NAME+'</td>\
           </tr>\
           <tr>\
             <td class="key_td">'+tr("Description")+'</td>\
             <td class="value_td">'+(elem_info.TEMPLATE.BODY.description||"-")+'</td>\
           </tr>\
           <tr>\
             <td class="key_td">'+tr("Strategy")+'</td>\
             <td class="value_td">'+elem_info.TEMPLATE.BODY.deployment+'</td>\
           </tr>\
           <tr>\
             <td class="key_td">'+tr("Shutdown action")+'</td>\
             <td class="value_td">'+(elem_info.TEMPLATE.BODY.shutdown_action||"-")+'</td>\
           </tr>\
           <tr>\
             <td class="key_td">'+tr("Ready Status Gate")+'</td>\
             <td class="value_td">'+(elem_info.TEMPLATE.BODY.ready_status_gate ? "yes" : "no")+'</td>\
           </tr>\
         </table>' +
         network_configuration +
       '</div>\
        <div class="large-6 columns">' + insert_permissions_table('oneflow-templates',
                                                              "ServiceTemplate",
                                                              elem_info.ID,
                                                              elem_info.UNAME,
                                                              elem_info.GNAME,
                                                              elem_info.UID,
                                                              elem_info.GID) +
        '</div>\
     </div>'
    };

    Sunstone.updateInfoPanelTab("service_template_info_panel","service_template_info_tab",info_tab);

    var roles_tab = {
        title : "Roles",
        icon: "fa-wrench",
        content : '<form class="custom" id="roles_form" action="">\
          <div id="roles_info" class="row>\
            <div class="large-12 columns>\
                <table id="datatable_service_template_roles" class="table twelve">\
                  <thead>\
                    <tr>\
                      <th>'+tr("Name")+'</th>\
                      <th>'+tr("Cardinality")+'</th>\
                      <th>'+tr("VM Template")+'</th>\
                      <th>'+tr("Parents")+'</th>\
                    </tr>\
                  </thead>\
                  <tbody>\
                  </tbody>\
                </table>\
              <div id="roles_extended_info" class="columns twelve">\
                <span class="radius secondary label">'+tr("Select a role in the table for more information")+'</span>\
              </div>\
            </div>\
          </div>\
        </form>'
    };

    Sunstone.updateInfoPanelTab("service_template_info_panel", "service_template_roles_tab",roles_tab);

    Sunstone.popUpInfoPanel("service_template_info_panel", "oneflow-templates");

    setPermissionsTable(elem_info,'');

    var roles = elem_info.TEMPLATE.BODY.roles
    if (roles && roles.length) {
        serviceTemplaterolesDataTable = $('#datatable_service_template_roles').dataTable({
            "bSortClasses": false,
            "bDeferRender": true,
            "bAutoWidth":false,
            "aoColumnDefs": [
              { "bSortable": false, "aTargets": ["check"] }
            ],
            "sDom" : '<"H">t<"F"p>'
        });

        var context = $("#roles_extended_info", $("#service_template_info_panel"));
        var role_elements = [];
        $.each(roles, function(){
            role_elements.push([
                this.name,
                this.cardinality,
                this.vm_template,
                this.parents ? this.parents.join(', ') : '-'
            ])

            updateView(role_elements ,serviceTemplaterolesDataTable);

            $('tbody tr',serviceTemplaterolesDataTable).die();
            $('tbody tr',serviceTemplaterolesDataTable).live("click",function(e){
                var aData = serviceTemplaterolesDataTable.fnGetData(this);
                var role_name = $(aData[0]).val();

                var role_index = serviceTemplaterolesDataTable.fnGetPosition(this);

                generate_template_role_div(role_index);

                if(last_selected_row_template_role) {
                    last_selected_row_template_role.children().each(function(){
                        $(this).removeClass('markrowchecked');
                    });
                }

                last_selected_row_template_role = $(this);
                $(this).children().each(function(){
                    $(this).addClass('markrowchecked');
                });
            });
        });

        var generate_template_role_div = function(role_index) {
            var role = roles[role_index]
            var info_str = '<form>\
                <fieldset>\
                <legend>'+tr("Role")+' - '+role.name+'</legend>';

            info_str += "<div class='large-12 columns'>\
                <table class='dataTable extended_table policies_table'>\
                    <thead>\
                        <tr><th colspan='8'>"+tr("Information")+"</th></tr>\
                    </thead>\
                    <tbody>";

            info_str += "<tr>\
                 <td class='key_td'>"+tr("Shutdown action")+"</td>\
                 <td class='value_td'>"+(role.shutdown_action || "-")+"</td>\
                 <td class='key_td'>"+tr("Cooldown")+"</td>\
                 <td class='value_td'>"+(role.cooldown || "-")+"</td>\
                 <td class='key_td'>"+tr("Min VMs")+"</td>\
                 <td class='value_td'>"+(role.min_vms || "-")+"</td>\
                 <td class='key_td'>"+tr("Max VMs")+"</td>\
                 <td class='value_td'>"+(role.max_vms || "-")+"</td>\
               </tr>";

            info_str += "</tbody>\
                </table>";


            info_str += "</div>\
            <div class='large-12 columns'>";

            if (role.elasticity_policies && role.elasticity_policies.length > 0) {
                info_str += '<table class="dataTable extended_table policies_table">\
                    <thead style="background:#dfdfdf">\
                      <tr>\
                        <th colspan="7">'+tr("Elasticity policies")+'</th>\
                      </tr>\
                    </thead>\
                    <thead>\
                      <tr>\
                        <th style="width:14%">'+tr("Type")+'\
                            <span class="tip">'+tr("Type of adjustment.")+'<br><br>\
                                '+tr("CHANGE: Add/substract the given number of VMs.")+'<br>\
                                '+tr("CARDINALITY: Set the cardinality to the given number.")+'<br>\
                                '+tr("PERCENTAGE_CHANGE: Add/substract the given percentage to the current cardinality.")+'\
                            </span>\
                        </th>\
                        <th style="width:12%">'+tr("Adjust")+'\
                            <span class="tip">'+tr("Positive or negative adjustment. Its meaning depends on 'type'")+'<br><br>\
                                '+tr("CHANGE: -2, will substract 2 VMs from the role")+'<br>\
                                '+tr("CARDINALITY: 8, will set carditanilty to 8")+'<br>\
                                '+tr("PERCENTAGE_CHANGE: 20, will increment cardinality by 20%")+'\
                            </span>\
                        </th>\
                        <th style="width:9%">'+tr("Min")+'\
                            <span class="tip">'+tr("Optional parameter for PERCENTAGE_CHANGE adjustment type. If present, the policy will change the cardinality by at least the number of VMs set in this attribute.")+'\
                            </span>\
                        </th>\
                        <th style="width:20%">'+tr("Expression")+'\
                            <span class="tip">'+tr("Expression to trigger the elasticity")+'<br><br>\
                                '+tr("Example: ATT < 20")+'<br>\
                            </span>\
                        </th>\
                        <th style="width:15%">'+tr("# Periods")+'\
                            <span class="tip">'+tr("Number of periods that the expression must be true before the elasticity is triggered")+'\
                            </span>\
                        </th>\
                        <th style="width:12%">'+tr("Period")+'\
                            <span class="tip">'+tr("Duration, in seconds, of each period in '# Periods'")+'\
                            </span>\
                        </th>\
                        <th style="width:15%">'+tr("Cooldown")+'\
                            <span class="tip">'+tr("Cooldown period duration after a scale operation, in seconds")+'\
                            </span>\
                        </th>\
                      </tr>\
                    </thead>\
                    <tbody>';

                $.each(role.elasticity_policies, function(){
                    info_str += '<tr>\
                        <td>'+this.type+'</td>\
                        <td>'+this.adjust+'</td>\
                        <td>'+(this.min_adjust_step || "-")+'</td>\
                        <td>'+this.expression+'</td>\
                        <td>'+(this.period_number || "-")+'</td>\
                        <td>'+(this.period || "-")+'</td>\
                        <td>'+(this.cooldown || "-")+'</td>\
                    </tr>'
                });

                info_str += '</tbody>\
                    </table>';
            }

            if (role.scheduled_policies && role.scheduled_policies.length > 0) {
                info_str += '<table class="dataTable extended_table policies_table">\
                    <thead style="background:#dfdfdf">\
                      <tr>\
                        <th colspan="5">'+tr("Scheduled policies")+'</th>\
                      </tr>\
                    </thead>\
                    <thead>\
                      <tr>\
                        <th style="width:14%">'+tr("Type")+'\
                            <span class="tip">'+tr("Type of adjustment.")+'<br><br>\
                                '+tr("CHANGE: Add/substract the given number of VMs.")+'<br>\
                                '+tr("CARDINALITY: Set the cardinality to the given number.")+'<br>\
                                '+tr("PERCENTAGE_CHANGE: Add/substract the given percentage to the current cardinality.")+'\
                            </span>\
                        </th>\
                        <th style="width:12%">'+tr("Adjust")+'\
                            <span class="tip">'+tr("Positive or negative adjustment. Its meaning depends on 'type'")+'<br><br>\
                                '+tr("CHANGE: -2, will substract 2 VMs from the role")+'<br>\
                                '+tr("CARDINALITY: 8, will set carditanilty to 8")+'<br>\
                                '+tr("PERCENTAGE_CHANGE: 20, will increment cardinality by 20%")+'\
                            </span>\
                        </th>\
                        <th style="width:9%">'+tr("Min")+'\
                            <span class="tip">'+tr("Optional parameter for PERCENTAGE_CHANGE adjustment type. If present, the policy will change the cardinality by at least the number of VMs set in this attribute.")+'\
                            </span>\
                        </th>\
                        <th style="width:28%">'+tr("Time format")+'\
                            <span class="tip">'+tr("Recurrence: Time for recurring adjustements. Time is specified with the Unix cron syntax")+'<br><br>\
                                '+tr("Start time: Exact time for the adjustement")+'\
                            </span>\
                        </th>\
                        <th style="width:33%">'+tr("Time expression")+'\
                            <span class="tip">'+tr("Time expression depends on the the time formar selected")+'<br><br>\
                                '+tr("Recurrence: Time for recurring adjustements. Time is specified with the Unix cron syntax")+'<br>\
                                '+tr("Start time: Exact time for the adjustement")+'<br>\
                            </span>\
                        </th>\
                      </tr>\
                    </thead>\
                    <tbody>';

                $.each(role.scheduled_policies, function(){
                    info_str += '<tr>\
                        <td>'+this.type+'</td>\
                        <td>'+this.adjust+'</td>\
                        <td>'+(this.min_adjust_step || "-")+'</td>';

                    if (this['start_time']) {
                        info_str += '<td>start_time</td>';
                        info_str += '<td>'+this.start_time+'</td>';
                    } else if (this['recurrence']) {
                        info_str += '<td>recurrence</td>';
                        info_str += '<td>'+this.recurrence+'</td>';
                    }
                });

                info_str += '</tbody>\
                    </table>';
            }

            info_str += '</div>\
                </fieldset>\
                    </form>'

            context.html(info_str);
            setupTips(context, "tip-top");
        }

        if(selected_row_template_role_id) {
            $.each($(serviceTemplaterolesDataTable.fnGetNodes()),function(){
                if($($('td',this)[1]).html()==selected_row_template_role_id) {
                    $('td',this)[2].click();
                }
            });
        }
    }

    setupTips($("#roles_form"));
}

function setup_policy_tab_content(policy_section, html_policy_id) {
    setupTips(policy_section);

    return false;
}

function setup_role_tab_content(role_section, html_role_id) {
    setupTips(role_section);

    insertSelectOptions('div#vm_template', role_section, "Template", null, false);

    $("#role_name", role_section).change(function(){
        $("#" + html_role_id +" #role_name_text").html($(this).val());
        $("#role_name_text", role_section).html($(this).val());
    });

    $("select#type").live("change", function(){
        var new_tr = $(this).closest('tr');
        if ($(this).val() == "PERCENTAGE_CHANGE") {
            $("#min_adjust_step_td", new_tr).html('<input type="text" id="min_adjust_step" name="min_adjust_step"/>');
        } else {
            $("#min_adjust_step_td", new_tr).empty();
        }
    });

    var add_elas_policy_tab = function() {
        var new_tr = $('<tr>\
                <td>\
                    <select id="type" name="type">\
                        <option value=""></option>\
                        <option value="CHANGE">'+tr("Change")+'</option>\
                        <option value="CARDINALITY">'+tr("Cardinality")+'</option>\
                        <option value="PERCENTAGE_CHANGE">'+tr("Percentage")+'</option>\
                    </select>\
                </td>\
                <td>\
                    <input type="text" id="adjust" name="adjust"/>\
                </td>\
                <td id="min_adjust_step_td">\
                </td>\
                <td>\
                    <input type="text" id="expression" name="expression"/>\
                </td>\
                <td>\
                    <input type="text" id="period_number" name="period_number"/>\
                </td>\
                <td>\
                    <input type="text" id="period" name="period"/>\
                </td>\
                <td>\
                    <input type="text" id="cooldown" name="cooldown"/>\
                </td>\
                <td>\
                    <a href="#"><i class="fa fa-times-circle remove-tab"></i></a>\
                </td>\
            </tr>');
        new_tr.appendTo($("#elasticity_policies_tbody", role_section));
        //setup_policy_tab_content(policy_section, html_policy_id);
    }

    var add_sche_policy_tab = function() {
        var new_tr = $('<tr>\
                <td>\
                    <select id="type" name="type">\
                        <option value=""></option>\
                        <option value="CHANGE">'+tr("Change")+'</option>\
                        <option value="CARDINALITY">'+tr("Cardinality")+'</option>\
                        <option value="PERCENTAGE_CHANGE">'+tr("Percentage")+'</option>\
                    </select>\
                </td>\
                <td>\
                    <input type="text" id="adjust" name="adjust"/>\
                </td>\
                <td id="min_adjust_step_td">\
                </td>\
                <td>\
                    <select id="time_format" name="time_format">\
                        <option value="start_time">'+tr("Start time")+'</option>\
                        <option value="recurrence">'+tr("Recurrence")+'</option>\
                    </select>\
                </td>\
                <td>\
                    <input type="text" id="time" name="time"/>\
                </td>\
                <td>\
                    <a href="#"><i class="fa fa-times-circle remove-tab"></i></a>\
                </td>\
            </tr>')
        new_tr.appendTo($("#scheduled_policies_tbody", role_section))
        //setup_policy_tab_content(policy_section, html_policy_id);
    }

    // close icon: removing the tab on click
    $( "#scheduled_policies_table i.remove-tab").live( "click", function() {
        var tr = $(this).closest('tr');
        tr.remove();
    });

    $( "#elasticity_policies_table i.remove-tab").live( "click", function() {
        var tr = $(this).closest('tr');
        tr.remove();
    });

    $("#tf_btn_elas_policies", role_section).bind("click", function(){
        add_elas_policy_tab();
    });

    $("#tf_btn_sche_policies", role_section).bind("click", function(){
        add_sche_policy_tab();
    });

    add_elas_policy_tab();
    add_sche_policy_tab();

    role_section.on("change", ".service_network_checkbox", function(){
        var vm_template_contents = "";
        $(".service_network_checkbox:checked", role_section).each(function(){
            vm_template_contents += "NIC=[NETWORK_ID=\"$"+$(this).val()+"\"]\n"
        })

        $(".vm_template_contents", role_section).val(vm_template_contents);
    })

    return false;
}


// Prepare the creation dialog
function initialize_create_service_template_dialog(dialog){
    setupTips(dialog);

    $(".add_service_network", dialog).on("click", function(){
        $(".service_networks tbody").append(
            '<tr>\
                <td>\
                    <input class="service_network_name" type="text" pattern="[\\w]+"/>\
                    <small class="error">'+ tr("Only word characters are allowed") + '</small>\
                </td>\
                <td>\
                    <textarea class="service_network_description"/>\
                </td>\
                <td>\
                    <a href="#"><i class="fa fa-times-circle remove-tab"></i></a>\
                </td>\
            </tr>');
    })

    $(".add_service_network", dialog).trigger("click");

    var redo_service_networks_selector = function(dialog){
        $('#roles_tabs_content .role_content', dialog).each(function(){

            var role_section = this;

            redo_service_networks_selector_role(dialog, role_section);
        });
    };

    var redo_service_networks_selector_role = function(dialog, role_section){
        $('#roles_tabs_content .role_content', dialog).each(function(){

            var role_section = this;

            var selected_networks = [];
            $(".service_network_checkbox:checked", role_section).each(function(){
                selected_networks.push($(this).val());
            });

            $(".networks_role", role_section).hide();
            var service_networks = false;

            var role_tab_id = $(role_section).attr('id');

            var str = "";
            $(".service_networks .service_network_name", dialog).each(function(){
                if ($(this).val()) {
                    service_networks = true;
                    str += "<tr>\
                        <td style='width:10%'><input class='service_network_checkbox check_item' type='checkbox' value='"+$(this).val()+"' id='"+role_tab_id+"_"+$(this).val()+"'/></td>\
                        <td><label for='"+role_tab_id+"_"+$(this).val()+"'>"+$(this).val()+"</label></td><tr>\
                    </tr>";
                }
            });

            $(".networks_role_body", role_section).html(str);

            if (service_networks) {
                $(".networks_role", role_section).show();
            }

            $(".vm_template_contents", role_section).val("");

            $.each(selected_networks, function(){
                $(".service_network_checkbox[value='"+this+"']", role_section).attr('checked', true).change();
            });
        });
    }

    dialog.on("change", ".service_network_name", function(){
        redo_service_networks_selector(dialog);
    });

    dialog.on("click", ".service_networks i.remove-tab", function(){
        var tr = $(this).closest('tr');
        tr.remove();

        redo_service_networks_selector(dialog);
    });

    var add_role_tab = function(role_id) {
        var html_role_id  = 'role' + role_id;

        // Append the new div containing the tab and add the tab to the list
        var role_section = $('<div id="'+html_role_id+'Tab" class="content role_content wizard_internal_tab">'+
            role_tab_content +
        '</div>').appendTo($("#roles_tabs_content", dialog));

        generate_elasticity_accordion(role_id, $(".elasticity_accordion", role_section))
        generate_advanced_role_accordion(role_id, $(".advanced_role_accordion", role_section))

        redo_service_networks_selector_role(dialog, role_section);

        var a = $("<dd>\
            <a class='text-center' id='"+html_role_id+"' href='#"+html_role_id+"Tab'>\
            <span><i class='off-color fa fa-cube fa-3x'/><br><span id='role_name_text'>"+tr("Role ")+role_id+" </span></span>\
                <i class='fa fa-times-circle remove-tab'></i>\
            </a>\
        </dd>").appendTo($("dl#roles_tabs", dialog));

        $("a", a).trigger("click");

        setup_role_tab_content(role_section, html_role_id);

        roles_index++;
    }

    // close icon: removing the tab on click
    $("#roles_tabs").on("click", "i.remove-tab", function() {
        var target = $(this).parent().attr("href");
        var dd = $(this).closest('dd');
        var dl = $(this).closest('dl');
        var content = $(target);

        dd.remove();
        content.remove();

        if (dd.attr("class") == 'active') {
            $('a', dl.children('dd').last()).click();
            //TODOO dl.foundationTabs("set_tab", dl.children('dd').last());
        }
    });

    // Fill parents table
    // Each time a tab is clicked the table is filled with existing tabs (roles)
    // Selected roles are kept
    // TODO If the name of a role is changed and is selected, selection will be lost
    $("#roles_tabs").on("click", "a", function() {
        var tab_id = "#"+this.id+"Tab";
        var str = "";


        $(tab_id+" .parent_roles").hide();
        var parent_role_available = false;

        $("#roles_tabs_content #role_name").each(function(){
            if ($(this).val() && ($(this).val() != $(tab_id+" #role_name").val())) {
                parent_role_available = true;
                str += "<tr>\
                    <td style='width:10%'><input class='check_item' type='checkbox' value='"+$(this).val()+"' id='"+$(this).val()+"'/></td>\
                    <td>"+$(this).val()+"</td><tr>\
                </tr>";
            }
        });

        if (parent_role_available) {
            $(tab_id+" .parent_roles").show();
        }

        var selected_parents = [];
        $(tab_id+" .parent_roles_body input:checked").each(function(){
            selected_parents.push($(this).val());
        });

        $(tab_id+" .parent_roles_body").html(str);

        $.each(selected_parents, function(){
            $(tab_id+" .parent_roles_body #"+this).attr('checked', true);
        });
    })

    $("#tf_btn_roles", dialog).bind("click", function(){
        add_role_tab(roles_index);
    });

    $('#create_service_template_form_wizard',dialog).on('invalid', function () {
        notifyError(tr("One or more required fields are missing or malformed."));
        popFormDialog("create_service_template_form", $("#oneflow-templates"));
    }).on('valid', function() {
        if ($('#create_service_template_form_wizard',dialog).attr("action") == "create") {
            var json_template = generate_json_service_template_from_form(this);
            Sunstone.runAction("ServiceTemplate.create", json_template );
            return false;
        } else if ($('#create_service_template_form_wizard',dialog).attr("action") == "update") {
            var json_template = generate_json_service_template_from_form(this);
            Sunstone.runAction("ServiceTemplate.update",service_template_to_update_id, JSON.stringify(json_template));
            return false;
        }
    });


    $('#create_service_template_form_advanced',dialog).on('invalid', function () {
        notifyError(tr("One or more required fields are missing or malformed."));
        popFormDialog("create_service_template_form", $("#oneflow-templates"));
    }).on('valid', function() {
        if ($('#create_service_template_form_advanced',dialog).attr("action") == "create") {
            var json_template = $("#template", this).val();
            try {
                Sunstone.runAction("ServiceTemplate.create", JSON.parse(json_template) );
            } catch(e) {
                popFormDialog("create_service_template_form", $("#oneflow-templates"));
                notifyError(e);
            }
            return false;
        } else if ($('#create_service_template_form_advanced',dialog).attr("action") == "update") {
            var json_template = $("#template", this).val();
            Sunstone.runAction("ServiceTemplate.update",service_template_to_update_id, json_template);
            return false;
        }
    });

    // TODO advanced

    dialog.foundation();

    roles_index = 0;
    add_role_tab(roles_index);
}

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

function generate_json_service_template_from_form(dialog) {
    var name = $('input[name="service_name"]', dialog).val();
    var description = $('#description', dialog).val();
    var deployment = $('select[name="deployment"]', dialog).val();
    var shutdown_action_service = $('select[name="shutdown_action_service"]', dialog).val();
    var ready_status_gate = $('input[name="ready_status_gate"]', dialog).prop("checked");

    var custom_attrs =  {};

    $(".service_networks tbody tr").each(function(){
      if ($(".service_network_name", $(this)).val()) {
        var attr_name = $(".service_network_name", $(this)).val();
        var attr_type = "vnet_id"
        var attr_desc = $(".service_network_description", $(this)).val();
        custom_attrs[attr_name] = "M|" + attr_type + "|" + attr_desc;
      }
    });

    var roles = [];

    $('#roles_tabs_content .role_content', dialog).each(function(){
        var role = {};
        role['name'] = $('input[name="name"]', this).val();
        role['cardinality'] = $('input[name="cardinality"]', this).val();
        role['vm_template'] = $('#vm_template .resource_list_select', this).val();
        role['shutdown_action'] = $('select[name="shutdown_action_role"]', this).val();
        role['parents'] = [];
        role['vm_template_contents'] = $(".vm_template_contents", this).val();

        if (!name || !cardinality || !template){
            notifyError(tr("Please specify name, cardinality and template for this role"));
            return false;
        } else {
            $('.parent_roles_body input.check_item:checked', this).each(function(){
                role['parents'].push($(this).val())
            });

            var shutdown_action = $('select[name="shutdown_action_role"]', this).val();
            if (shutdown_action) {
                role['shutdown_action'] = shutdown_action
            }
            var min_vms = $('input[name="min_vms"]', this).val();
            if (min_vms) {
                role['min_vms'] = min_vms
            }
            var max_vms = $('input[name="max_vms"]', this).val();
            if (max_vms) {
                role['max_vms'] = max_vms
            }
            var cooldown = $('input[name="cooldown"]', this).val();
            if (cooldown) {
                role['cooldown'] = cooldown
            }

            role = removeEmptyObjects(role);
            role['elasticity_policies'] = [];
            $("#elasticity_policies_tbody tr", this).each(function(){
                if ($("#type" ,this).val()) {
                    var policy = {};
                    policy['type'] = $("#type" ,this).val();
                    policy['adjust']  = $("#adjust" ,this).val();
                    policy['min_adjust_step']  = $("#min_adjust_step" ,this).val();
                    policy['expression']  = $("#expression" ,this).val();
                    policy['period_number']  = $("#period_number" ,this).val();
                    policy['period']  = $("#period" ,this).val();
                    policy['cooldown']  = $("#cooldown" ,this).val();

                    // TODO remove empty policies
                    role['elasticity_policies'].push(removeEmptyObjects(policy));
                }
            });

            role['scheduled_policies'] = [];
            $("#scheduled_policies_tbody tr", this).each(function(){
                if ($("#type" ,this).val()) {
                    var policy = {};
                    policy['type'] = $("#type" ,this).val();
                    policy['adjust']  = $("#adjust" ,this).val();
                    policy['min_adjust_step']  = $("#min_adjust_step" ,this).val();

                    var time_format = $("#time_format" ,this).val();
                    policy[time_format] = $("#time" ,this).val();

                    // TODO remove empty policies
                    role['scheduled_policies'].push(removeEmptyObjects(policy));
                }
            });

            roles.push(role);
        }
    });

    var obj = {
        name: name,
        deployment: deployment,
        description: description,
        roles: roles,
        custom_attrs: custom_attrs
    }

    if (shutdown_action_service){
        obj['shutdown_action'] = shutdown_action_service
    }

    obj['ready_status_gate'] = ready_status_gate

    return obj;
}

function fillUpUpdateServiceTemplateDialog(response, dialog){
    var service_template = response[OpenNebula.ServiceTemplate.resource]

    $("#template", dialog).val(JSON.stringify(service_template.TEMPLATE.BODY));

    $("#service_name", dialog).attr("disabled", "disabled");
    $("#service_name", dialog).val(htmlDecode(service_template.NAME));

    $("#description", dialog).val(htmlDecode(service_template.TEMPLATE.BODY.description));

    // TODO Check if the template still exists
    $('select[name="deployment"]', dialog).val(service_template.TEMPLATE.BODY.deployment);
    $("select[name='shutdown_action_service']", dialog).val(service_template.TEMPLATE.BODY.shutdown_action);
    $("input[name='ready_status_gate']", dialog).prop("checked",service_template.TEMPLATE.BODY.ready_status_gate || false);

    if (service_template.TEMPLATE.BODY['custom_attrs']) {
        $("a[href='#network_configuration_and_attributes']", dialog).trigger("click");

        $(".service_networks i.remove-tab", dialog).trigger("click");

        $.each(service_template.TEMPLATE.BODY['custom_attrs'], function(key, attr){
            var parts = attr.split("|");
            // 0 mandatory; 1 type; 2 desc;
            var attrs = {
              "name": key,
              "mandatory": parts[0],
              "type": parts[1],
              "description": parts[2],
            }

            switch (parts[1]) {
              case "vnet_id":
                $(".add_service_network", dialog).trigger("click");

                var tr = $(".service_networks tbody tr", dialog).last();
                $(".service_network_name", tr).val(htmlDecode(attrs.name)).change();
                $(".service_network_description", tr).val(htmlDecode(attrs.description));

                break;
            }
        });
    }

    var more_than_one = false;
    var roles_names = [];
    $.each(service_template.TEMPLATE.BODY.roles, function(index, value){
        more_than_one ? $("#tf_btn_roles", dialog).click() : (more_than_one = true);

        var context = $('#roles_tabs_content .role_content', dialog).last();

        $("#role_name", context).val(htmlDecode(value.name));
        $("#role_name", context).change();
        roles_names.push(value.name);

        if (value.vm_template_contents){

            $(".service_networks .service_network_name", dialog).each(function(){
                if ($(this).val()) {
                    var reg = new RegExp("\\$"+$(this).val()+"\\b");

                    if(reg.exec(value.vm_template_contents) != null){
                        $(".service_network_checkbox[value='"+$(this).val()+"']", context).attr('checked', true).change();
                    }
                }
            });
        }

        $("#cardinality", context).val(htmlDecode(value.cardinality));

        // The vm_template select is already initialized, but we need to select
        // the template retrived from the service_template. Since the initialization
        // is async, we can't assume the .resource_list_select exists yet.
        // Calling the initialization again with the correct init_val should
        // use the cache anyway
        insertSelectOptions('div#vm_template', context, "Template", value.vm_template, false);

        $("select[name='shutdown_action_role']", context).val(value.shutdown_action);
        $("#min_vms", context).val(htmlDecode(value.min_vms));
        $("#max_vms", context).val(htmlDecode(value.max_vms));
        $("#cooldown", context).val(htmlDecode(value.cooldown));

        if (value['elasticity_policies']) {
            $.each(value['elasticity_policies'], function(){
                $("#tf_btn_elas_policies", context).click();
                var td = $("#elasticity_policies_tbody tr", context).last();
                $("#type" ,td).val(htmlDecode(this['type']));
                $("#type" ,td).change();
                $("#adjust" ,td).val(htmlDecode(this['adjust'] ));
                $("#min_adjust_step" ,td).val(htmlDecode(this['min_adjust_step'] || ""));
                $("#expression" ,td).val(htmlDecode(this.expression))
                $("#period_number" ,td).val(htmlDecode(this['period_number'] || ""));
                $("#period" ,td).val(htmlDecode(this['period'] || "" ));
                $("#cooldown" ,td).val(htmlDecode(this['cooldown'] || "" ));
            })
        }

        if (value['scheduled_policies']) {
            $.each(value['scheduled_policies'], function(){
                $("#tf_btn_sche_policies", context).click();
                var td = $("#scheduled_policies_tbody tr", context).last();
                $("#type", td).val(htmlDecode(this['type']));
                $("#type" ,td).change();
                $("#adjust", td).val(htmlDecode(this['adjust'] ));
                $("#min_adjust_step", td).val(htmlDecode(this['min_adjust_step']  || ""));

                if (this['start_time']) {
                    $("#time_format", td).val('start_time');
                    $("#time", td).val(htmlDecode(this['start_time']));
                } else if (this['recurrence']) {
                    $("#time_format", td).val('recurrence');
                    $("#time", td).val(htmlDecode(this['recurrence']));
                }
            })
        }
    })

    $.each(service_template.TEMPLATE.BODY.roles, function(index, value){
        var tab_id = "#role"+index+"Tab"
        var str = "";

        $.each(roles_names, function(){
            if (this != $(tab_id+" #role_name").val()) {
                str += "<tr>\
                    <td style='width:10%'><input class='check_item' type='checkbox' value='"+this+"' id='"+this+"'/></td>\
                    <td>"+this+"</td><tr>\
                </tr>";
            }
        });

        $(tab_id+" .parent_roles_body").html(str);

        var context = $('#roles_tabs_content .content#role'+index+'Tab', dialog);

        if (value.parents) {
            $.each(value.parents, function(index, value){
                $(".parent_roles_body #"+this, context).attr('checked', true);
            });
        }
    });

    service_template_to_update_id = service_template.ID;
}

function popUpInstantiateServiceTemplateDialog(){
    var selected_nodes = getSelectedNodes(dataTable_service_templates);

    if ( selected_nodes.length != 1 )
    {
        notifyMessage("Please select one (and just one) template to instantiate.");
        return false;
    }

    setupInstantiateServiceTemplateDialog();
    $instantiate_service_template_dialog.foundation().foundation('reveal', 'open');
    $("input#service_name",$instantiate_service_template_dialog).focus();
}

// Instantiate dialog
// Sets up the instiantiate template dialog and all the processing associated to it
function setupInstantiateServiceTemplateDialog(){

    dialogs_context.append('<div id="instantiate_service_template_dialog"></div>');
    //Insert HTML in place
    $instantiate_service_template_dialog = $('#instantiate_service_template_dialog')
    var dialog = $instantiate_service_template_dialog;

    dialog.html(instantiate_service_template_tmpl);
    dialog.addClass("reveal-modal medium").attr("data-reveal", "");
    dialog.removeClass("max-height");

    $("#instantiate_service_tenplate_proceed", dialog).attr("disabled", "disabled");

    var selected_nodes = getSelectedNodes(dataTable_service_templates);
    var template_id = ""+selected_nodes[0];

    var service_template_json;

    OpenNebula.ServiceTemplate.show({
        data : {
            id: template_id
        },
        timeout: true,
        success: function (request, template_json){

            service_template_json = template_json;

            $("#instantiate_service_user_inputs", dialog).empty();

            generateServiceTemplateUserInputs(
                $("#instantiate_service_user_inputs", dialog),
                template_json);

            n_roles = template_json.DOCUMENT.TEMPLATE.BODY.roles.length;
            n_roles_done = 0;

            $.each(template_json.DOCUMENT.TEMPLATE.BODY.roles, function(index, role){
                var div_id = "user_input_role_"+index;

                $("#instantiate_service_role_user_inputs", dialog).append(
                    '<div id="'+div_id+'" class="large-6 columns">\
                    </div>'
                );

                OpenNebula.Template.show({
                    data : {
                        id: role.vm_template
                    },
                    timeout: true,
                    success: function (request, vm_template_json){

                        $("#"+div_id, dialog).empty();

                        generateVMTemplateUserInputs(
                            $("#"+div_id, dialog),
                            vm_template_json,
                            {
                                text_header: tr("Role") + " " + role.name
                            }
                        );

                        n_roles_done += 1;

                        if(n_roles_done == n_roles){
                            $("#instantiate_service_tenplate_proceed", dialog).removeAttr("disabled");
                        }
                    },
                    error: function(request,error_json, container){
                        onError(request,error_json, container);
                        $("#instantiate_vm_user_inputs", dialog).empty();
                    }
                });
            });
        },
        error: function(request,error_json, container){
            onError(request,error_json, container);
            $("#instantiate_service_user_inputs", dialog).empty();
        }
    });

    setupTips(dialog);

    $('#instantiate_service_template_form',dialog).on('invalid', function () {
        notifyError(tr("One or more required fields are missing or malformed."));
    }).on('valid', function() {
        var service_name = $('#service_name',this).val();
        var n_times = $('#service_n_times',this).val();
        var n_times_int=1;

        var template_id
        if ($("#TEMPLATE_ID", this).val()) {
            template_id = $("#TEMPLATE_ID", this).val();
        } else {
            var selected_nodes = getSelectedNodes(dataTable_service_templates);
            template_id = ""+selected_nodes[0];
        }


        if (n_times.length){
            n_times_int=parseInt(n_times,10);
        };

        var extra_msg = "";
        if (n_times_int > 1) {
            extra_msg = n_times_int+" times";
        }

        var extra_info = {
            'merge_template': {}
        };

        var tmp_json = {};
        retrieveWizardFields($("#instantiate_service_user_inputs", dialog), tmp_json);

        extra_info.merge_template.custom_attrs_values = tmp_json;

        extra_info.merge_template.roles = [];

        $.each(service_template_json.DOCUMENT.TEMPLATE.BODY.roles, function(index, role){
            var div_id = "user_input_role_"+index;

            tmp_json = {};

            retrieveWizardFields($("#"+div_id, dialog), tmp_json);

            $.each(role.elasticity_policies, function(i, pol){
                pol.expression = htmlDecode(pol.expression);
            });

            role.user_inputs_values = tmp_json;

            extra_info.merge_template.roles.push(role);
        });

        if (!service_name.length){ //empty name
            for (var i=0; i< n_times_int; i++){
                Sunstone.runAction("ServiceTemplate.instantiate", [template_id], extra_info);
            }
        }
        else
        {
            if (service_name.indexOf("%i") == -1){//no wildcard, all with the same name
                extra_info['merge_template']['name'] = service_name;

                for (var i=0; i< n_times_int; i++){
                    Sunstone.runAction(
                        "ServiceTemplate.instantiate",
                        [template_id], extra_info);
                }
            } else { //wildcard present: replace wildcard
                for (var i=0; i< n_times_int; i++){
                    extra_info['merge_template']['name'] = service_name.replace(/%i/gi,i);

                    Sunstone.runAction(
                        "ServiceTemplate.instantiate",
                        [template_id], extra_info);
                }
            }
        }

        $instantiate_service_template_dialog.empty();
        $instantiate_service_template_dialog.foundation('reveal', 'close')
        return false;
    });
}

//The DOM is ready at this point
$(document).ready(function(){
    var tab_name = "oneflow-templates";

    if (Config.isTabEnabled(tab_name)) {
        dataTable_service_templates = $("#datatable_service_templates",main_tabs_context).dataTable({
            "bSortClasses": false,
            "bDeferRender": true,
            "aoColumnDefs": [
                { "bSortable": false, "aTargets": ["check"] },
                { "sWidth": "35px", "aTargets": [0] },
                { "bVisible": true, "aTargets": Config.tabTableColumns(tab_name)},
                { "bVisible": false, "aTargets": ['_all']}
            ]
        });

        $('#service_templates_search').keyup(function(){
          dataTable_service_templates.fnFilter( $(this).val() );
        })

        dataTable_service_templates.on('draw', function(){
          recountCheckboxes(dataTable_service_templates);
        })

        Sunstone.runAction("ServiceTemplate.list");

        initCheckAllBoxes(dataTable_service_templates);
        tableCheckboxesListener(dataTable_service_templates);
        infoListener(dataTable_service_templates,'ServiceTemplate.show');

        $('div#service_templates_tab div.legend_div').hide();

        dataTable_service_templates.fnSort( [ [1,config['user_config']['table_order']] ] );
    }
});
