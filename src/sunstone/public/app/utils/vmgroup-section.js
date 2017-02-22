/* -------------------------------------------------------------------------- */
/* Copyright 2002-2016, OpenNebula Project, OpenNebula Systems                */
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

define(function(require) {
  var Locale = require('utils/locale');
  var Tips = require('utils/tips');
  var Notifier = require('utils/notifier');
  var OpenNebula = require('opennebula');
  var OpenNebulaTemplate = require('opennebula/template');
  var TemplateSection = require('hbs!./vmgroup-section/html');
  var VMGroupsTable = require('tabs/vmgroup-tab/datatable');
  //var RoleTable = require('./vmgroup-section/datatable');

  //var roleTable = undefined;

  return {
    'insert': _insert,
    'retrieve': _retrieve
  }

 
  function _insert(template_json, context) {
    var templateVmgroup = null;
    console.log(template_json);
    this.vmGroupTable = new VMGroupsTable('vmgroups_table', { 'select': true });

    var templateVmgroup = $(TemplateSection({
          vmGroupTableHTML: this.vmGroupTable.dataTableHTML,
    })).appendTo($(".provision_vmgroup_selector",context));

    this.vmGroupTable.initialize();
    this.vmGroupTable.refreshResourceTableSelect();
    $("#vmgroup_section_tables", context).hide();
    $(".provision_add_vmgroup",context).bind("click", function(){
      $("#vmgroup_section_tables", context).show();    
      $(".provision_add_vmgroup",context).hide();
    });

    this.vmGroupTable.idInput().on("change", function(){
      _generate_provision_role_table(context, $(this).val());
    });
    role_section
    $("#role_section",context).hide();
  }

  function _retrieve(context) {
    var role_selected = $('#role_table_section').val();
    var vmgroup_selected = this.vmGroupTable.retrieveResourceTableSelect();
    if(vmgroup_selected){
      if(role_selected){
        var vmgroup_json = {
          "VMGROUP_ID": vmgroup_selected,
          "ROLE": role_selected
        }
        return vmgroup_json;
      }else  {
        Notifier.notifyError(Locale.tr("Select a role."));
        return false;
      }
    }else return undefined;
  }

  function _generate_provision_role_table(context, idvmgroup) {
    console.log(idvmgroup);
    OpenNebula.VMGroup.show({
      data : {
        id: idvmgroup,
      },
      success: function (request, template_json) {
        console.log(template_json);
        $("#role_table_section",context).empty();
        var roles = template_json["VM_GROUP"].ROLES.ROLE;
        if(roles){
          if(Array.isArray(roles)){
            $.each(roles, function(){
              $("<option value='"+this.NAME+"'><label>"+ this.NAME + "</label></option><br/>").appendTo("#role_table_section",context);
            });
          }
          else{
            $("<option value='"+roles.NAME+"'><label>"+ roles.NAME + "</label></option>").appendTo("#role_table_section",context);
          }
          $("#role_section",context).show();
        }
      },
      error: function(request, error_json, container) {
        Notifier.notifyError(Locale.tr("Internal server error."));
      }
    });
  }
})
