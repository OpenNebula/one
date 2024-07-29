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
  // Dependencies
  var Tips = require('utils/tips');
  var TemplatesTable = require('tabs/templates-tab/datatable');
  var TemplateUtils = require('utils/template-utils');

  var TemplateHTML = require('hbs!./role-tab/html');
  var TemplateElasticityRowHTML = require('hbs!./role-tab/elasticity-row');
  var TemplateScheRowHTML = require('hbs!./role-tab/sche-row');

  function RoleTab(html_role_id) {
    this.html_role_id = html_role_id;
    this.global_template = {};
    this.nics_template = {};
    this.alias_template = {};
    this.rest_template = "";
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
      select: true,
      force_refresh: true
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

    $("#role_name", role_section).unbind("keyup");
    $("#role_name", role_section).bind("keyup", function(){
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

      if (this.checked) {
        that.nics_template[index] = { "NAME": "_NIC"+index, "NETWORK_ID": "$"+name };
        $("#alias_"+this.id, role_section).prop("disabled", false);
        $("td.parent_selector select:visible", role_section).each(function() {
          updateOptionsParents(this, that.nics_template, that.alias_template);
        });
      }
      else {
        delete that.nics_template[index];
        delete that.alias_template[index];
        $("#alias_"+this.id, role_section).prop("disabled", true).prop("checked", false).change();
      }

      updateOptionsRDP(role_section, $.extend({}, that.nics_template, that.alias_template));
      updateRemoveTabs(role_section, index);
    });

    role_section.on("change", ".alias_network_checkbox", role_section, function(){
      var index = $(this).data("index");
      var select = $('td.parent_selector select[data-index='+index+']', role_section);
      toogleNicUsedAsAlias(role_section, select, select.val(), null);
      select.prop("hidden", !this.checked).prop("required", this.checked);

      if (this.checked && that.nics_template[index]) {
        that.alias_template[index] = that.nics_template[index];
        delete that.nics_template[index];
      }
      else if (!this.checked && that.alias_template[index]) {
        that.nics_template[index] = that.alias_template[index];
        that.nics_template[index] && (delete that.nics_template[index]["PARENT"]);
        delete that.alias_template[index];
      }

      $("td.parent_selector select:visible", role_section).each(function() {
        updateOptionsParents(this, that.nics_template, that.alias_template);
      });
    });

    role_section.on('focusin', ".parent_selector select", function(){
      // save value after change
      $(this).data('prev', $(this).val());
    }).on("change", ".parent_selector select", function(){
      var index = $(this).data('index');
      var prevIndexParent = $(this).data('prev');
      var indexParent = $(this).val();

      toogleNicUsedAsAlias(role_section, this, prevIndexParent, indexParent)
      
      if (that.nics_template[indexParent] && that.alias_template[index]) {
        that.alias_template[index]["PARENT"] = "_NIC"+indexParent;
      }
    });

    role_section.on("change", ".networks_role_rdp select#rdp", role_section, function(){
      var valueSelected = this.value;
      var allTemplate = $.extend({}, that.nics_template, that.alias_template);

      // remove RDP option in all nics
      $.each(Object.entries(allTemplate), function(_, network) {
        var nicIndex = network[0];
        var nicTemplate = network[1];

        if (nicIndex !== valueSelected && nicTemplate["RDP"]) {
          (that.nics_template[nicIndex])
            ? delete that.nics_template[nicIndex]["RDP"]
            : delete that.alias_template[nicIndex]["RDP"];
        }
      });
      
      // then assign if exists
      if (valueSelected !== "") {
        if(that.nics_template[valueSelected]) {
          that.nics_template[valueSelected]["RDP"] = "YES";
        }
        else if(that.alias_template[valueSelected]) {
          that.alias_template[valueSelected]["RDP"] = "YES";
        }
      }
    });
  }

  function updateRemoveTabs(role_section, index) {
    var form = $(role_section).closest("#createServiceTemplateFormWizard");
    
    var networkIsUsed = $(".service_network_checkbox[data-index="+index+"]:checked", form);
    
    (networkIsUsed.length > 0)
      ? $("#network"+index+" i.remove-tab", form)
        .prop("style", "color:currentColor;cursor:not-allowed;opacity:0.5;")
      : $("#network"+index+" i.remove-tab", form).prop("style", "");
  }

  function toogleNicUsedAsAlias(context, currentSelector, prevIndex, index) {
    var prevNicCb = $(".service_network_checkbox[data-index='"+prevIndex+"']", context);
    var prevAliasCb = $(".alias_network_checkbox[data-index='"+prevIndex+"']", context);
    var nicCb = $(".service_network_checkbox[data-index='"+index+"']", context);
    var aliasCb = $(".alias_network_checkbox[data-index='"+index+"']", context);

    var prevOthers = $(".parent_selector select:visible", context).not(currentSelector)
        .children("option[value='"+prevIndex+"']:selected");
    var others = $(".parent_selector select", context).children("option[value='"+index+"']:selected");

    if (prevOthers.length === 0) {
      prevNicCb.prop("disabled", false);
      prevAliasCb.prop("disabled", false);
    }
    
    if (others.length === 0) {
      nicCb.prop("disabled", false);
      aliasCb.prop("disabled", false);
    }
    else {
      aliasCb.prop("disabled", true).prop("checked", false);
      nicCb.prop("disabled", true).prop("checked", true);
    }
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

    // if some nic has RDP, update selector value
    $.each(Object.entries(currentTemplate), function(_, nic) {
      var nicIndex = nic[0];
      var nicTemplate = nic[1];

      if (nicTemplate["RDP"] && String(nicTemplate["RDP"]).toLowerCase() === "yes") {
        selectRDP.val(nicIndex).change();
      }
    });
  }

  function updateOptionsParents(select, nicsTemplate, aliasTemplate) {
    select = $(select);
    var nicIndex = $(select).data('index');
    // empty all options in select alias parent
    select.empty();
    select.append("<option value=''></option>");

    // possible parents
    var possibleParents = filterByNicIndex(nicsTemplate, nicIndex);
    $.each(Object.entries(possibleParents), function (_, nic) {
      select.append("<option value='"+nic[0]+"'>"+nic[1].NETWORK_ID.substring(1)+"</option>")
    });

    // update selector parent value
    $.each(Object.entries(aliasTemplate), function(_, nic) {
      var nicTemplate = nic[1];

      if (nicTemplate["PARENT"]) {
        var indexParent = nicTemplate["PARENT"].replace("_NIC", "");
        select.val(indexParent).change();
      }
    });
  }

  function filterByNicIndex(object, index) {
    const obj = {};
    for (const key in object) {
      if (key !== String(index)) {
        obj[key] = object[key];
      }
    }
    return obj;
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
    role['vm_template_contents'] = TemplateUtils.templateToString({ NIC: Object.values(this.nics_template) });
    role['vm_template_contents'] += TemplateUtils.templateToString({ NIC_ALIAS: Object.values(this.alias_template) });
    role['vm_template_contents'] += this.rest_template;

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

    this.templatesTable.selectResourceTableSelect({ids : value.vm_template});

    if (value.vm_template_contents){
      var vmTemplate = TemplateUtils.stringToTemplate(value.vm_template_contents);
      // map nics with index checkbox
      var nics = vmTemplate["NIC"];
      if (nics) {
        nics = Array.isArray(nics) ? nics : [nics];

        $.each(network_names, function(index, name) {
          $.each(nics, function(_, nic) {
            if (nic["NETWORK_ID"] === "$"+name){
              nic["NAME"] = "_NIC"+index;

              $(".service_network_checkbox[data-index='"+index+"']", context).attr('checked', true).change();
              that.nics_template[String(index)] = nic;
            }
          });
        });
      }
      // map alias with index checkbox
      var alias = vmTemplate["NIC_ALIAS"];
      if (alias) {
        alias = Array.isArray(alias) ? alias : [alias];

        $.each(network_names, function(index, name) {
          $.each(alias, function(_, nic) {
            if (nic["NETWORK_ID"] === "$"+name){
              nic["NAME"] = "_NIC"+index;
            
              $(".service_network_checkbox[data-index='"+index+"']", context).attr('checked', true).change();
              $(".alias_network_checkbox[data-index='"+index+"']", context).attr('checked', true).change();
              that.alias_template[String(index)] = nic;
            }
          });
        });

        $.each(that.alias_template, function(index) {
          $("select[data-index="+index+"]", context).each(function() {
            updateOptionsParents(this, that.nics_template, that.alias_template);
          });
        });
      }      

      // copy rest of template
      delete vmTemplate["NIC"];
      delete vmTemplate["NIC_ALIAS"];
      this.rest_template = TemplateUtils.templateToString(vmTemplate);

      // update selector options for RDP
      updateOptionsRDP(context, $.extend({}, that.nics_template, that.alias_template));
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

  function _refreshVMTemplate(checkedNetworks, nicToDelete) {
    var that = this;

    if (that.role_section && that.nics_template) {
      if (nicToDelete) {
        delete that.nics_template[nicToDelete];
        delete that.alias_template[nicToDelete];
      }
      // update all NAMES and NETWORK IDs
      $.each(checkedNetworks, function(index, nic) {
        if (nic && that.nics_template[index]) {
          if (that.nics_template[index]) {
            that.nics_template[index]["NAME"] = "_NIC"+index;
            that.nics_template[index]["NETWORK_ID"] = "$"+nic.name;
          }
          else if (nic && that.alias_template[index]) {
            that.alias_template[index]["NAME"] = "_NIC"+index;
            that.alias_template[index]["NETWORK_ID"] = "$"+nic.name;
          }
        }
      });

      var allTemplate = $.extend({}, that.nics_template, that.alias_template);
      updateOptionsRDP(that.role_section, allTemplate);
      $.each(that.alias_template, function(index) {
        $("select[data-index="+index+"]", that.role_section).each(function() {
          updateOptionsParents(this, that.nics_template, that.alias_template);
        });
      });
      // Update remove-tabs state (unabled/disabled)
      var form = $(that.role_section).closest("#createServiceTemplateFormWizard");
      $("table.service_networks i.remove-tab", form).each(function() {
        updateRemoveTabs(that.role_section, $(this).data("index"));
      });
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
