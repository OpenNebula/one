/* -------------------------------------------------------------------------- */
/* Copyright 2002-2019, OpenNebula Project, OpenNebula Systems                */
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
  // Dependencies
  var Locale = require('utils/locale');
  var Tips = require('utils/tips');
  var TemplatesTable = require('tabs/templates-tab/datatable');
  var TemplateUtils = require('utils/template-utils');

  var TemplateHTML = require('hbs!./role-tab/html');
  var TemplateElasticityRowHTML = require('hbs!./role-tab/elasticity-row');
  var TemplateScheRowHTML = require('hbs!./role-tab/sche-row');

  function RoleTab(html_role_id) {
    this.html_role_id = html_role_id;
    this.global_template = {};
    this.refresh = _refreshVMTemplate;

    return this;
  }

  RoleTab.prototype = {
    'html': _role_tab_content,
    'setup': _setup_role_tab_content,
    'onShow': _onShow,
    'retrieve': _retrieve,
    'fill': _fill
  };
  RoleTab.prototype.constructor = RoleTab;

  return RoleTab;

  function _role_tab_content(){
    var opts = {
      info: false,
      select: true
    };

    this.templatesTable = new TemplatesTable("roleTabTemplates"+this.html_role_id, opts);

    return TemplateHTML({
      'templatesTableHTML': this.templatesTable.dataTableHTML
    });
  }

  function _setup_role_tab_content(role_section) {
    this.role_section = role_section;
    var that = this;

    Tips.setup(role_section);

    this.templatesTable.initialize();
    this.templatesTable.idInput().attr("required", "");

    role_section.on("keyup", "#role_name", function(){
      $("#" + that.html_role_id +" #role_name_text").html($(this).val());
    });

    role_section.on("change", "select#type", function(){
      var new_tr = $(this).closest('tr');
      if ($(this).val() == "PERCENTAGE_CHANGE") {
        $("#min_adjust_step_td", new_tr).html('<input type="text" id="min_adjust_step" name="min_adjust_step"/>');
      } else {
        $("#min_adjust_step_td", new_tr).empty();
      }
    });

    $("#tf_btn_elas_policies", role_section).bind("click", function(){
      $( TemplateElasticityRowHTML({}) ).appendTo($("#elasticity_policies_tbody", role_section));
    });

    role_section.on("click", "#elasticity_policies_table i.remove-tab", function() {
      var tr = $(this).closest('tr');
      tr.remove();
    });

    $("#tf_btn_sche_policies", role_section).bind("click", function(){
      $( TemplateScheRowHTML({}) ).appendTo($("#scheduled_policies_tbody", role_section));
    });

    role_section.on("click", "#scheduled_policies_table i.remove-tab", function() {
      var tr = $(this).closest('tr');
      tr.remove();
    });

    $("#tf_btn_elas_policies", role_section).trigger("click");
    $("#tf_btn_sche_policies", role_section).trigger("click");

    role_section.on("change", ".service_network_checkbox", role_section, function(){
      // Network values
      var index = $(this).data("index");
      var name = $(this).val();

      updateOptionsRDP(role_section, that.global_template);
      
      (this.checked)
        ? that.global_template[index] = { "NETWORK_ID": "$"+name }
        : delete that.global_template[index];
    });

    role_section.on("change", ".networks_role_rdp select#rdp", role_section, function(){
      var valueSelected = this.value;

      // delete RDP in global template when is 
      $.each(Object.entries(that.global_template), function(_, network) {
        var nicIndex = network[0];
        var nicTemplate = network[1];

        if (nicIndex !== valueSelected && nicTemplate["RDP"]) {
          delete that.global_template[nicIndex]["RDP"];
        }
      });
      
      if (valueSelected !== "" && that.global_template[valueSelected]) {
          that.global_template[valueSelected]["RDP"] = "yes";
      }
    });
  }

  function updateOptionsRDP(context, currentTemplate) {
    var selectRDP = $(".networks_role_rdp select#rdp", context);
    // empty all options in select rdp
    selectRDP.empty();
    selectRDP.append("<option value=''></option>")

    $(".service_network_checkbox:checked", context).each(function () {
      var index = $(this).data("index");
      var name = $(this).val();
      selectRDP.append("<option value='"+index+"'>"+name+"</option>")
    });

    // if some nic has RDP, update selector
    $.each(Object.entries(currentTemplate), function(_, nic) {
      var nicIndex = nic[0];
      var nicTemplate = nic[1];

      if (nicTemplate["RDP"] && nicTemplate["RDP"] === "yes") {
        selectRDP.val(nicIndex);
      }
    });
  }

  function _onShow(){
    this.templatesTable.refreshResourceTableSelect();
  }

  function _retrieve(context){
    var role = {};
    role['name'] = $('input[name="name"]', context).val();
    role['cardinality'] = $('input[name="cardinality"]', context).val();
    role['vm_template'] = this.templatesTable.retrieveResourceTableSelect();
    role['shutdown_action'] = $('select[name="shutdown_action_role"]', context).val();
    role['parents'] = [];
    role['vm_template_contents'] = TemplateUtils.templateToString({ NIC: Object.values(this.global_template) });

    $('.parent_roles_body input.check_item:checked', context).each(function(){
      role['parents'].push($(this).val());
    });

    var shutdown_action = $('select[name="shutdown_action_role"]', context).val();
    if (shutdown_action) {
      role['shutdown_action'] = shutdown_action;
    }

    var min_vms = $('input[name="min_vms"]', context).val();
    if (min_vms) {
      role['min_vms'] = min_vms;
    }

    var max_vms = $('input[name="max_vms"]', context).val();
    if (max_vms) {
      role['max_vms'] = max_vms;
    }

    var cooldown = $('input[name="cooldown"]', context).val();
    if (cooldown) {
      role['cooldown'] = cooldown;
    }

    role = _removeEmptyObjects(role);
    role['elasticity_policies'] = [];
    $("#elasticity_policies_tbody tr", context).each(function(){
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
        role['elasticity_policies'].push(_removeEmptyObjects(policy));
      }
    });

    role['scheduled_policies'] = [];
    $("#scheduled_policies_tbody tr", context).each(function(){
      if ($("#type" ,this).val()) {
        var policy = {};
        policy['type'] = $("#type" ,this).val();
        policy['adjust']  = $("#adjust" ,this).val();
        policy['min_adjust_step']  = $("#min_adjust_step" ,this).val();

        var time_format = $("#time_format" ,this).val();
        policy[time_format] = $("#time" ,this).val();

        // TODO remove empty policies
        role['scheduled_policies'].push(_removeEmptyObjects(policy));
      }
    });

    return role;
  }

  function _fill(context, value, network_names) {
    var that = this;
    $("#role_name", context).val(value.name).keyup();

    $("#cardinality", context).val(value.cardinality);

    that.templatesTable.selectResourceTableSelect({ids : value.vm_template});

    if (value.vm_template_contents){
      // check all networks appear in vm template
      $(network_names).each(function(){
        var reg = new RegExp("\\$"+this+"\\b");
        
        if(reg.exec(value.vm_template_contents) != null){
          $(".service_network_checkbox[value='"+this+"']", context).attr('checked', true).change();
        }
      });

      // map template with index checkbox
      var nics = TemplateUtils.stringToTemplate(value.vm_template_contents)["NIC"];
      if (nics) {
        // if not array, transform it
        nics = Array.isArray(nics) ? nics : [nics];

        $(network_names).each(function(index, name) {
          var nicTemplate = $.grep(nics, function(nic) {
            return (nic["NETWORK_ID"] === "$"+name) && nic;
          })
          
          if (nicTemplate && nicTemplate[0]) {
            that.global_template[String(index)] = nicTemplate[0];
          }
        });
      }

      // update options for RDP
      updateOptionsRDP(context, that.global_template);
    }

    $("select[name='shutdown_action_role']", context).val(value.shutdown_action);

    $("#min_vms", context).val(value.min_vms);
    $("#max_vms", context).val(value.max_vms);
    $("#cooldown", context).val(value.cooldown);

    if (value['elasticity_policies'].length > 0 ||
        value['scheduled_policies'].length > 0) {
      $("div.elasticity_accordion a.accordion_advanced_toggle", context).trigger("click");
    }

    $("#elasticity_policies_table i.remove-tab", context).trigger("click");
    $("#scheduled_policies_table i.remove-tab", context).trigger("click");

    if (value['elasticity_policies']) {
      $.each(value['elasticity_policies'], function(){
        $("#tf_btn_elas_policies", context).click();
        var td = $("#elasticity_policies_tbody tr", context).last();
        $("#type" ,td).val(this['type']);
        $("#type" ,td).change();
        $("#adjust" ,td).val(this['adjust'] );
        $("#min_adjust_step" ,td).val(this['min_adjust_step'] || "");
        $("#expression" ,td).val(this.expression);
        $("#period_number" ,td).val(this['period_number'] || "");
        $("#period" ,td).val(this['period'] || "" );
        $("#cooldown" ,td).val(this['cooldown'] || "" );
      });
    }

    if (value['scheduled_policies']) {
      $.each(value['scheduled_policies'], function(){
        $("#tf_btn_sche_policies", context).click();
        var td = $("#scheduled_policies_tbody tr", context).last();
        $("#type", td).val(this['type']);
        $("#type" ,td).change();
        $("#adjust", td).val(this['adjust'] );
        $("#min_adjust_step", td).val(this['min_adjust_step']  || "");

        if (this['start_time']) {
          $("#time_format", td).val('start_time');
          $("#time", td).val(this['start_time']);
        } else if (this['recurrence']) {
          $("#time_format", td).val('recurrence');
          $("#time", td).val(this['recurrence']);
        }
      });
    }
  }

  function _refreshVMTemplate(nicToDelete) {
    if (this.role_section && this.global_template && nicToDelete) {
      if (nicToDelete) {
        delete this.global_template[nicToDelete];
      }

      updateOptionsRDP(this.role_section, this.global_template);
    }
  }

  //----------------------------------------------------------------------------

  function _removeEmptyObjects(obj){
    for (var elem in obj){
      var remove = false;
      var value = obj[elem];
      if (value instanceof Array){
        if (value.length == 0)
          remove = true;
        else if (value.length > 0){
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
      else if (value instanceof Object){
        var obj_length = 0;
        for (e in value)
          obj_length += 1;
        if (obj_length == 0)
          remove = true;
      }else{
        value = String(value);
        if (value.length == 0)
          remove = true;
      }

      if (remove)
        delete obj[elem];
    }

    return obj;
  }
});
