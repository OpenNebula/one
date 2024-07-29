/* -------------------------------------------------------------------------- */
/* Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                */
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
  var Locale = require("utils/locale");
  var Tips = require("utils/tips");
  var Notifier = require("utils/notifier");
  var OpenNebula = require("opennebula");
  var OpenNebulaTemplate = require("opennebula/template");
  var TemplateSection = require("hbs!./vmgroup-section/html");
  var VMGroupsTable = require("tabs/vmgroup-tab/datatable");
  var UniqueId = require("utils/unique-id");

  return {
    "onShow": _onShow,
    "setup": _setup,
    "html": _html,
    "fill": _fill,
    "insert": _insert,
    "retrieve": _retrieve
  };

  function _setup(context, vmGroupTable){
    var templateVmgroup = null;
    vmGroupTable.idInput().on("change", function(){
      _generate_provision_role_table(context, $(this).val());
    });
    $("#role_section",context).hide();
    $(".role_table_section", context).prop("required", false);
    $(".clear_vmgroup_select", context).bind("click", function(){
      vmGroupTable.initSelectResourceTableSelect();
      $("#role_section",context).hide();
      $(".role_table_section", context).prop("required", false);
      $(".role_table_section > option").removeAttr("selected");
    });
  }

  function _html(vmGroupTable){
    return TemplateSection({
      vmGroupTableHTML: vmGroupTable.dataTableHTML
    });
  }

  function _onShow(context, vmGroupTable){
    if(vmGroupTable)
      vmGroupTable.refreshResourceTableSelect();
    $("#role_section",context).hide();
    $(".role_table_section", context).prop("required", false);
  }

  function _insert(template_json, context) {
    var templateVmgroup = null;
    var that = this;
    this.vmGroupTable = new VMGroupsTable("vmgroups_table"+UniqueId.id(), { "select": true });
    var that = this;
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

    $(".clear_vmgroup_select",context).bind("click", function(){
      $("#vmgroup_section_tables",context).hide();
      $(".provision_add_vmgroup",context).show();
      that.vmGroupTable.initSelectResourceTableSelect();
      $(".role_table_section", context).prop("required", false);
      $(".role_table_section > option").removeAttr("selected");
    });
    this.vmGroupTable.idInput().on("change", function(){
      _generate_provision_role_table(context, $(this).val());
    });
    $("#role_section",context).hide();
    $(".role_table_section", context).prop("required", false);
    if(template_json.VMTEMPLATE.TEMPLATE.VMGROUP){
      this.vmGroupTable.selectResourceTableSelect({ids:template_json.VMTEMPLATE.TEMPLATE.VMGROUP.VMGROUP_ID});
      _generate_provision_role_table(context, template_json.VMTEMPLATE.TEMPLATE.VMGROUP.VMGROUP_ID, template_json.VMTEMPLATE.TEMPLATE.VMGROUP.ROLE);
    }
  }

  function _fill(context, templateJSON, vmGroupTable){
    if(templateJSON.VMGROUP){
      var element = templateJSON.VMGROUP;
      vmGroupTable.selectResourceTableSelect({ids:element.VMGROUP_ID});
      _generate_provision_role_table(context,element.VMGROUP_ID, element.ROLE);
    }
  }

  function _retrieve(context, vmGroupTable) {
    if (!vmGroupTable){
      $.each($(".role_table_section", context), function(){
        if (this.value === ""){
          this.remove();
        }
      });
    }
    var role_selected = $(".role_table_section", context).val();
    var vmgroup_selected = undefined;
    if (this.vmGroupTable){
      vmgroup_selected = this.vmGroupTable.retrieveResourceTableSelect();
    }
    if (vmGroupTable){
      vmgroup_selected = vmGroupTable.retrieveResourceTableSelect();
    }
    if (vmgroup_selected){
      if (role_selected){
        var vmgroup_json = {
          "VMGROUP_ID": vmgroup_selected,
          "ROLE": role_selected
        };
        vmgroup_json = {
          "VMGROUP" : vmgroup_json
        };
        return vmgroup_json;
      }
    }
    else {
     return undefined;
    }
    return false;
  }

  function _generate_provision_role_table(context, idvmgroup, fill) {
    OpenNebula.VMGroup.show({
      data : {
        id: idvmgroup,
      },
      success: function (request, template_json) {
        $(".role_table_section").empty();
        var roles = template_json["VM_GROUP"].ROLES.ROLE;
        $(".title_roles",context).text(Locale.tr("Roles")+" "+ template_json["VM_GROUP"].NAME);
        if (roles){
          if (Array.isArray(roles)){
            $.each(roles, function(){
              $("<option value='"+this.NAME+"'><label>"+ this.NAME + "</label></option><br/>").appendTo(".role_table_section",context);
            });
          }
          else {
            $("<option value='"+roles.NAME+"'><label>"+ roles.NAME + "</label></option>").appendTo(".role_table_section",context);
          }
          $("#role_section",context).show();
          $(".role_table_section", context).prop("required", true);
          if (fill){
            $(".role_table_section option[value=\""+fill+"\"]").attr("selected",true);
          }
        }
      },
      error: function(request, error_json, container) {
        Notifier.notifyError(Locale.tr("Internal server error."));
      }
    });
  }
});
