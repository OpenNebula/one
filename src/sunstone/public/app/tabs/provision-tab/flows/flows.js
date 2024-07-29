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
  var Config = require("sunstone-config");
  var LabelsUtils = require("utils/labels/utils");
  var Locale = require("utils/locale");
  var Notifier = require("utils/notifier");
  var OpenNebula = require("opennebula");
  var ProvisionFlowsList = require("./list");
  var RangeSlider = require("utils/range-slider");
  var ServiceUtils = require("utils/service-utils");
  var Sunstone = require("sunstone");
  var TemplateUtils = require("utils/template-utils");
  var UserInputs = require("utils/user-inputs");
  var WizardFields = require("utils/wizard-fields");

  // Templates
  var TemplateFlowCardinality = require("hbs!./html/cardinality");
  var TemplateFlowDatatable = require("hbs!./html/templates_datatable");
  var TemplateFlowRoleItem = require("hbs!./html/role_item");
  var TemplateFlowPricingTable = require("hbs!./html/pricing_table");
  var TemplateFlowCreateRole = require("hbs!./html/create_role");


  // Constants
  var TAB_ID = require("../tabId");
  var FLOW_TEMPLATE_LABELS_COLUMN = 2;

  var _actions = {
      "setup": _setup
  }

  /**************************************************************************/
  // Functions
  /**************************************************************************/

  function generate_cardinality_selector(context, role_template, template_json) {
    context.off();
    var min_vms = (role_template.min_vms||1);
    var max_vms = (role_template.max_vms||20);
    var cost = OpenNebula.Template.cost(template_json);
    var has_cost = (cost != 0) && Config.isFeatureEnabled("showback");
  
    context.html(TemplateFlowCardinality());
  
    if (has_cost) {
      $(".provision_create_service_cost_div", context).show();
      $(".provision_create_service_cost_div", context).data("cost", cost);
      var cost_value = cost*parseInt(role_template.cardinality);
      $(".cost_value", context).html(cost_value.toFixed(2));
      _calculateFlowCost();
    } else {
      $(".provision_create_service_cost_div", context).hide();
    }
  
    if (max_vms > min_vms) {
      $( ".cardinality_slider_div", context).html(
        RangeSlider.html({
          min: min_vms,
          max: max_vms,
          max_value: max_vms,
          initial: role_template.cardinality,
          label: Locale.tr("Number of VMs for Role")+" "+role_template.name,
          name: "cardinality"
        })
      );
      $( ".cardinality_slider_div", context).show();
      $( ".cardinality_no_slider_div", context).hide();
      $( ".cardinality_slider_div", context).off("input");

      if (has_cost) {
        $( ".cardinality_slider_div", context).on("input", "input", function() {
          var cost_value = $(".provision_create_service_cost_div", context).data("cost")*$(this).val();
          $(".cost_value", context).html(cost_value.toFixed(2));
          _calculateFlowCost();
        });
      }
    } else {
      $( ".cardinality_slider_div", context).hide();
      $( ".cardinality_no_slider_div", context).show();
    }      
  }
  
  function _calculateFlowCost(){
    var context = $("#provision_create_flow");
    var total = 0;
    $.each($(".provision_create_service_cost_div .cost_value", context), function(){
      total += parseFloat($(this).text());
    });
    if (total != 0 && Config.isFeatureEnabled("showback")) {
      $(".total_cost_div", context).show();
      $(".total_cost_div .cost_value", context).text( (total).toFixed(2) );
    }
  }
  
  function show_provision_create_flow(provision_flow_templates_datatable) {
        update_provision_flow_templates_datatable(provision_flow_templates_datatable);
        var context = $("#provision_create_flow");
        $("#provision_customize_flow_template", context).hide();
        $("#provision_customize_flow_template", context).html("");
        $(".provision_network_selector", context).html("");
        $(".provision_vmgroup_selector", context).html("");
        $(".provision_add_vmgroup", context).show();
        $(".provision_vmgroup", context).hide();
        $(".provision_custom_attributes_selector", context).html("");
        $(".provision_accordion_flow_template .selected_template", context).hide();
        $(".provision_accordion_flow_template .select_template", context).show();
        $("li:not(.is-active) a[href='#provision_dd_flow_template']", context).trigger("click");
        $(".total_cost_div", context).hide();
        $(".alert-box-error", context).hide();
        $(".section_content").hide();
        $("#provision_create_flow").fadeIn();
  }
  
  function update_provision_flow_templates_datatable(datatable, timeout) {
    datatable.html(TemplateFlowDatatable({empty:false}));
    setTimeout( function(){
      OpenNebula.ServiceTemplate.list({
        timeout: true,
        success: function (request, item_list){
          datatable.fnClearTable(true);
          if (item_list.length == 0) {
            datatable.html(TemplateFlowDatatable({empty:true}));
          } else {
            datatable.fnAddData(item_list);
          }
          LabelsUtils.clearLabelsFilter(datatable, FLOW_TEMPLATE_LABELS_COLUMN);
          var context = $(".labels-dropdown", datatable.closest("#provisionFlowInstantiateTemplatesRow"));
          context.html("");
          LabelsUtils.insertLabelsMenu({
            "context": context,
            "dataTable": datatable,
            "labelsColumn": FLOW_TEMPLATE_LABELS_COLUMN,
            "labelsPath": "DOCUMENT.TEMPLATE.LABELS",
            "placeholder": Locale.tr("No labels defined")
          });
        },
        error: Notifier.onError
      });
    }, timeout);
  }

  function _setup(){
    var provision_flow_templates_datatable = $("#provision_flow_templates_table").dataTable({
      "iDisplayLength": 6,
      "bAutoWidth": false,
      "sDom" : "<\"H\">t<\"F\"lp>",
      "aLengthMenu": Sunstone.getPaginate(),
      "aaSorting"  : [[1, "asc"]],
      "aoColumnDefs": [
          { "bVisible": false, "aTargets": ["all"]}
      ],
      "aoColumns": [
          { "mDataProp": "DOCUMENT.ID" },
          { "mDataProp": "DOCUMENT.NAME" },
          { "mDataProp": "DOCUMENT.TEMPLATE.LABELS", "sDefaultContent" : "-"  }
      ],
      "fnPreDrawCallback": function (oSettings) {
        // create a thumbs container if it doesn't exist. put it in the dataTables_scrollbody div
        if (this.$("tr", {"filter": "applied"} ).length == 0) {
          this.html(TemplateFlowDatatable({empty:true}));
        } else {
          $("#provision_flow_templates_table").html(
            "<div id=\"provision_flow_templates_ul\" class=\"row large-up-4 medium-up-3 small-up-1\"></div>");
        }
  
        return true;
      },
      "fnRowCallback": function( nRow, aData, iDisplayIndex, iDisplayIndexFull ) {
        var data = aData.DOCUMENT;
        var body = data.TEMPLATE.BODY;
        var roles_li = "";
  
        if (body.roles) {
          $.each(body.roles, function(index, role) {
            roles_li += TemplateFlowRoleItem({
              "name": role.name,
              "cardinality": role.cardinality
            });
          });
        }
  
        var li = $(TemplateFlowPricingTable({
          "id": data.ID,
          "roles_list": roles_li,
          "name": TemplateUtils.htmlEncode(data.NAME),
          "description": TemplateUtils.htmlEncode(data.TEMPLATE.DESCRIPTION) || ""
        })).appendTo($("#provision_flow_templates_ul"));
  
        $(".provision-pricing-table", li).data("opennebula", aData);
  
        return nRow;
      }
    });

    var tab = $("#"+TAB_ID);
    // TODO check if active
    ProvisionFlowsList.generate($(".provision_flows_list_section"), {active: true});

    $("#provision_create_flow_template_search").on("input",function(){
      provision_flow_templates_datatable.fnFilter( $(this).val() );
    });

    $("#provision_create_flow_template_refresh_button").click(function(){
      OpenNebula.Action.clear_cache("SERVICE_TEMPLATE");
      update_provision_flow_templates_datatable(provision_flow_templates_datatable);
    });

    tab.off("click", ".provision_select_flow_template .provision-pricing-table.only-one")
    .on("click", ".provision_select_flow_template .provision-pricing-table.only-one" , function(){
      var context = $("#provision_create_flow");

      if (!$(this).hasClass("selected")){
        $("#provision_customize_flow_template").show();
        $("#provision_customize_flow_template").html("");

        var data = $(this).data("opennebula");
        var body = data.DOCUMENT.TEMPLATE.BODY;

        $("#provision_create_flow .total_cost_div").hide();

        $(".provision_accordion_flow_template .selected_template").show();
        $(".provision_accordion_flow_template .select_template").hide();
        $(".provision_accordion_flow_template .selected_template_name").html(TemplateUtils.htmlEncode(data.DOCUMENT.NAME));
        $(".provision_accordion_flow_template .selected_template_logo").html("<i class=\"fas fa-cubes fa-lg\"/> ");
        $(".provision_accordion_flow_template a").first().trigger("click");

        var context = $("#provision_create_flow");

        if (body.custom_attrs || body.networks) {
          UserInputs.serviceTemplateInsert(
            $(".provision_network_selector", context),
            data,
            { select_networks: Config.isFeatureEnabled("show_vnet_instantiate_flow") }
          );
        } else {
          $(".provision_network_selector", context).html("");
          $(".provision_custom_attributes_selector", context).html("");
        }

        $.each(body.roles, function(index, role){
          var context = $(TemplateFlowCreateRole({
            "index": index,
            "name": TemplateUtils.htmlEncode(role.name)
          })).appendTo($("#provision_customize_flow_template"));

          context.data("opennebula", role);

          var template_id = role.vm_template;
          var role_html_id = "#provision_create_flow_role_"+index;

          OpenNebula.Template.show({
            data : {
                id: template_id,
                extended: true
            },
            success: function(request,template_json){
              var role_context = $(role_html_id);

              generate_cardinality_selector(
                $(".provision_cardinality_selector", context),
                role,
                template_json);

              if (template_json.VMTEMPLATE.TEMPLATE.USER_INPUTS) {
                UserInputs.vmTemplateInsert(
                    $(".provision_custom_attributes_selector", role_context),
                    template_json,
                    {text_header: "<i class=\"fas fa-gears\"></i> "+Locale.tr("Custom Attributes")});

              } else {
                $(".provision_custom_attributes_selector", role_context).html("");
              }
            }
          });
        });

        return false;
      }
    });

    tab.on("click", "#provision_create_flow .provision-pricing-table.only-one" , function(){
      if (!$(this).hasClass("selected")){
        $(".provision-pricing-table", $(this).parents(".dataTable")).removeClass("selected");
        $(this).addClass("selected");
      }

      return false;
    });

    $("#provision_create_flow").submit(function(){
      var context = $(this);
      var flow_name = $("#flow_name", context).val();
      var template_id = $(".provision_select_flow_template .selected", context).attr("opennebula_id");

      if (!template_id) {
        $(".alert-box-error", context).fadeIn().html(Locale.tr("You must select at least a template configuration"));
        return false;
      }

      var extra_info = ServiceUtils.getExtraInfo(context, Config.isFeatureEnabled("show_vnet_instantiate_flow"));

      $(".provision_create_flow_role", context).each(function(){
        var role_template = $(this).data("opennebula");
        var cardinality = WizardFields.retrieve( $(".provision_cardinality_selector", $(this)) )["cardinality"];
        var temp_inputs = WizardFields.retrieve($(".provision_custom_attributes_selector", $(this)));
        var vm_template_contents = TemplateUtils.stringToTemplate(role_template.vm_template_contents);

        $.each(temp_inputs, function(inputName, inputValue) {
          if (Array.isArray(inputValue)) {
            delete temp_inputs[inputName];
            temp_inputs[inputName] = inputValue.join(",");
          }

          // removes duplicated inputs in context
          delete vm_template_contents[inputName];
        });

        extra_info.merge_template.roles.push($.extend(role_template, {
          cardinality: cardinality,
          user_inputs_values: temp_inputs,
          vm_template_contents: TemplateUtils.templateToString(vm_template_contents),
        }));
      });

      if (flow_name) {
        extra_info.merge_template.name = flow_name;
      }

      Sunstone.runAction("Provision.Flow.instantiate", template_id, extra_info);
      return false;
    });

    $(".provision_create_flow_button").on("click", function(){
        show_provision_create_flow(provision_flow_templates_datatable);
    });

    Foundation.reflow($("#provision_create_flow"));
  }

  return _actions;
});