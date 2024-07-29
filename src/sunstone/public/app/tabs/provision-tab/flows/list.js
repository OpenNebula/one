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
  var Humanize = require("utils/humanize");
  var Locale = require("utils/locale");
  var Notifier = require("utils/notifier");
  var OpenNebula = require("opennebula");
  var ProvisionVmsList = require("tabs/provision-tab/vms/list");
  var RangeSlider = require("utils/range-slider");
  var ResourceSelect = require("utils/resource-select");
  var Sunstone = require("sunstone");
  var TemplateUtils = require("utils/template-utils");

  var TemplateFlowsList = require("hbs!./html/list");

  var _accordionId = 0;

  return {
    "generate": generate_provision_flows_list,
    "show": show_provision_flow_list
  };


  function show_provision_flow_list() {
    $(".section_content").hide();
    $(".provision_flows_list_section").fadeIn();

    $("dd:not(.active) .provision_back", $(".provision_flows_list_section")).trigger("click");
    $(".provision_flows_list_refresh_button", $(".provision_flows_list_section")).trigger("click");
  }

  function generate_provision_flows_list(context, opts) {
    context.off();
    context.html(html(opts));
    Foundation.reflow(context, "accordion");
    setup_provision_flows_list(context, opts);
    setup_info_flow(context);
  }

  function html(opts_arg){
    opts = $.extend({
        title: Locale.tr("Services"),
        active: true,
        refresh: true,
        create: true,
        filter: true
      },opts_arg);

    _accordionId += 1;
    return TemplateFlowsList({"accordionId": _accordionId, "opts": opts});
  }

  function update_provision_flows_datatable(datatable, timeout) {
    datatable.html("<div class=\"text-center\">"+
      "<span class=\"fa-stack fa-5x\">"+
        "<i class=\"fas fa-cloud fa-stack-2x\"></i>"+
        "<i class=\"fa  fa-spinner fa-spin fa-stack-1x fa-inverse\"></i>"+
      "</span>"+
      "<br>"+
      "<br>"+
      "<span>"+
      "</span>"+
      "</div>");

    setTimeout( function(){
      OpenNebula.Service.list({
        timeout: true,
        success: function (request, item_list){
          var undoneServices = OpenNebula.Service.filterDoneServices(item_list);
          $(".flow_error_message").hide();
          datatable.fnClearTable(true);
          if (undoneServices.length == 0) {
            datatable.html("<div class=\"text-center\">"+
              "<span class=\"fa-stack fa-5x\">"+
                "<i class=\"fas fa-cloud fa-stack-2x\"></i>"+
                "<i class=\"fas fa-info-circle fa-stack-1x fa-inverse\"></i>"+
              "</span>"+
              "<br>"+
              "<br>"+
              "<span>"+
                Locale.tr("There are no Services")+
              "</span>"+
              "<br>"+
              "<br>"+
              "</div>");
          } else {
            datatable.fnAddData(undoneServices);
          }
        },
        error: function(request, error_json) {
          datatable.html("<div class=\"text-center\">"+
            "<br>"+
            "<br>"+
            "<div class=\"row flow_error_message\" id=\"\" hidden>"+
              "<div class=\"small-6 columns small-centered text-center\">"+
                  "<div class=\"label alert radius\">"+Locale.tr("Cannot connect to OneFlow server")+"</div>"+
              "</div>"+
            "</div>"+
            "<br>"+
            "<br>"+
            "<span>"+
            "</span>"+
            "</div>");

            Notifier.onError(request, error_json, $(".flow_error_message"));
        }
      });
    }, timeout );
  }

  function setup_provision_flows_list(context, opts){
    //
    // List Flows
    //

    provision_flows_datatable = $(".provision_flows_table", context).dataTable({
      "iDisplayLength": 6,
      "sDom" : "<\"H\">t<\"F\"lp>",
      "aLengthMenu": Sunstone.getPaginate(),
      "aaSorting"  : [[0, "desc"]],
      "aoColumnDefs": [
          { "bVisible": false, "aTargets": ["all"]}
      ],
      "aoColumns": [
          { "mDataProp": "DOCUMENT.ID" },
          { "mDataProp": "DOCUMENT.NAME" },
          { "mDataProp": "DOCUMENT.UID" }
      ],
      "fnPreDrawCallback": function (oSettings) {
        // create a thumbs container if it doesn't exist. put it in the dataTables_scrollbody div
        if (this.$("tr", {"filter": "applied"} ).length == 0) {
          this.html("<div class=\"text-center\">"+
            "<span class=\"fa-stack fa-5x\">"+
              "<i class=\"fas fa-cloud fa-stack-2x\"></i>"+
              "<i class=\"fas fa-info-circle fa-stack-1x fa-inverse\"></i>"+
            "</span>"+
            "<br>"+
            "<br>"+
            "<span>"+
              Locale.tr("There are no Services")+
            "</span>"+
            "<br>"+
            "<br>"+
            "</div>");
        } else {
          $(".provision_flows_table", context).html("<div class=\"provision_flows_ul large-up-3 medium-up-3 small-up-1\"></div>");
        }

        return true;
      },
      "fnRowCallback": function( nRow, aData, _, iDisplayIndexFull ) {
        var data = aData.DOCUMENT;
        var body = data.TEMPLATE.BODY;
        var state = get_provision_flow_state(body);
        var start_time = get_provision_flow_start_time(body);

        var roles_li = "";
        if (body.roles) {
          $.each(body.roles, function(_, role) {
            var rvms = {
              str: (role.nodes ? role.nodes.length : 0) + " / " + role.cardinality,
              percentage: Math.floor((role.nodes ? role.nodes.length : 0) / role.cardinality) * 100
            };

            roles_li +=
              "<li class=\"provision-bullet-item\"\">"+
                "<i class=\"fas fa-fw fa-lg fa-cube\"/> "+
                TemplateUtils.htmlEncode(role.name)+
                "<span class=\"right\">"+TemplateUtils.htmlEncode(rvms.str)+" VMs</span>"+
              "</li>";
          });
        }

        $(".provision_flows_ul", context).append("<div class=\"column\">"+
            "<ul class=\"provision-pricing-table menu vertical\" opennebula_id=\""+data.ID+"\" datatable_index=\""+iDisplayIndexFull+"\">"+
              "<li class=\"provision-title\">"+
                "<a class=\"provision_info_flow_button\" href=\"#\">"+
                  "<span class=\""+ state.color +"-color right\" title=\""+ state.str +"\">"+
                    "<i class=\"fas fa-square\"/>"+
                  "</span>"+
                  TemplateUtils.htmlEncode(data.NAME) +
                "</a>"+
              "</li>"+
              roles_li +
              "<li class=\"provision-bullet-item-last\">"+
                "<span>"+
                  "<i class=\"fas fa-fw fa-lg fa-user\"/> "+
                  TemplateUtils.htmlEncode(data.UNAME)+
                "</span>"+
                "<span class=\"right\">"+
                  (start_time ? Humanize.prettyTimeAgo(start_time) : "-") +
                "</span>"+
              "</li>"+
            "</ul>"+
          "</div>");

        return nRow;
      }
    });

    $(".provision_list_flows_search", context).on("input",function(){
      provision_flows_datatable.fnFilter( $(this).val() );
    });

    context.on("click", ".provision_flows_list_refresh_button", function(){
      OpenNebula.Action.clear_cache("SERVICE");
      update_provision_flows_datatable(provision_flows_datatable, 0);
      return false;
    });

    context.on("click", ".provision_flows_list_search_button", function(){
      $(".provision_list_flows_search", context).fadeIn();
    });

    $(".provision_list_flows_filter", context).on("change", ".resource_list_select", function(){
      if ($(this).val() != "-2"){
        provision_flows_datatable.fnFilter("^" + $(this).val() + "$", 2, true, false);
      } else {
        provision_flows_datatable.fnFilter("", 2);
      }
    });

    ResourceSelect.insert({
        context: $(".provision_list_flows_filter", context),
        resourceName: "User",
        initValue: (opts.filter_expression ? opts.filter_expression : "-2"),
        extraOptions: "<option value=\"-2\">" + Locale.tr("ALL") + "</option>",
        triggerChange: true,
        onlyName: true
      });

    context.on("click", ".provision_flows_list_filter_button", function(){
      $(".provision_list_flows_filter", context).fadeIn();
      return false;
    });

    OpenNebula.Action.clear_cache("SERVICE");
    update_provision_flows_datatable(provision_flows_datatable, 0);
  }

  function setup_info_flow(context) {
    function update_provision_flow_info(flow_id, context, role_id) {
      $(".provision_info_flow_name", context).text("");
      $(".provision_info_flow", context).css("visibility", "hidden");
      $(".provision_info_flow_loading", context).fadeIn();
      $(".provision_role_vms_container").html("");

      OpenNebula.Service.show({
        data : {
          id: flow_id
        },
        error: Notifier.onError,
        success: function(_, response){
          var data = response.DOCUMENT;
          var body = data.TEMPLATE.BODY;
          var state = get_provision_flow_state(body);
          var start_time = get_provision_flow_start_time(body);

          switch (state.color) {
            case "deploying":
              $(".provision_recover_button", context).hide();
              $(".provision_delete_confirm_button", context).show();
              $(".provision_shutdown_confirm_button", context).show();
              break;
            case "running":
              $(".provision_recover_button", context).hide();
              $(".provision_delete_confirm_button", context).show();
              $(".provision_shutdown_confirm_button", context).show();
              break;
            case "off":
              $(".provision_recover_button", context).hide();
              $(".provision_delete_confirm_button", context).show();
              $(".provision_shutdown_confirm_button", context).hide();
              break;
            case "powering_off":
            case "error":
              $(".provision_recover_button", context).show();
              $(".provision_delete_confirm_button", context).show();
              $(".provision_shutdown_confirm_button", context).show();
              break;
            default:
              $(".provision_recover_button", context).show();
              $(".provision_delete_confirm_button", context).show();
              $(".provision_shutdown_confirm_button", context).show();
              break;
          }

          $(".provision_info_flow", context).attr("flow_id", data.ID);
          $(".provision_info_flow_name", context).text(data.NAME);

          $(".provision-pricing-table_flow_info", context).html(
              "<li class=\"provision-title\">"+
                "<span class=\"without-link "+ state.color +"-color\">"+
                  "<span class=\""+ state.color +"-color right\">"+
                    "<i class=\"fas fa-square\"/> "+
                  "</span>"+
                  state.str+
                "</span>"+
              "</li>"+
              "<li class=\"provision-bullet-item-last text-right\">"+
                "<span class=\"left\">"+
                  "<i class=\"fas fa-fw fa-lg fa-user\"/> "+
                  TemplateUtils.htmlEncode(data.UNAME)+
                "</span>"+
                "<span>"+
                  "<i class=\"fas fa-fw fa-lg fa-clock-o\"/> "+
                  (start_time ? Humanize.prettyTimeAgo(start_time) : "...") +
                  " - "+
                  "ID: "+
                  data.ID+
                "</span>"+
              "</li>"+
            "</ul>");

          $(".provision_roles_ul", context).html("");
          if (body.roles) {
            $.each(body.roles, function(index, role) {
              var role_state = get_provision_flow_state(role);
              var rvms = {
                str : (role.nodes ? role.nodes.length : 0) + " / " + role.cardinality ,
                percentage : Math.floor((role.nodes ? role.nodes.length : 0) / role.cardinality)*100
              };

              var li = $(
                "<div class=\"column\">"+
                  "<ul class=\"provision_role_ul provision-pricing-table menu vertical\">"+
                    "<li class=\"provision-title\">"+
                      "<span class=\"without-link\">" +
                        "<i class=\"fas fa-fw fa-cube\"/> "+
                        TemplateUtils.htmlEncode(role.name)+
                      "</span>" +
                    "</li>"+
                    "<li class=\"provision-bullet-item\">"+
                      "<meter id=\"" + TemplateUtils.htmlEncode(role.name) + "_meter\" min=\"0\" low=\"33\" high=\"66\" optimum=\"100\" max=\"100\" value=\"" + TemplateUtils.htmlEncode(rvms.percentage) + "\"></meter>" +
                    "</li>"+
                    "<li class=\"provision-bullet-item text-right\">"+
                      "<span class=\""+ role_state.color +"-color left\">"+
                        role_state.str+
                      "</span>"+
                      "<span>"+TemplateUtils.htmlEncode(rvms.str)+" VMs</span>"+
                    "</li>"+
                    "<li class=\"provision-bullet-item\">" +
                      "<hr>" +
                    "</li>" +
                    "<li class=\"provision-bullet-item-buttons\">"+
                      "<button class=\"provision_role_vms_button button medium radius\">"+
                        "<i class=\"fas fa-th fa-lg\"></i>"+
                      "</button>"+
                      "<button class=\"provision_role_cardinality_button button medium success radius\">"+
                        "<i class=\"fas fa-arrows-alt-h fa-lg\"></i>"+
                      "</button>"+
                    "</li>"+
                  "</ul>"+
                "</div>").appendTo($(".provision_roles_ul", context));

                $(".provision_role_ul", li).data("role", role);
                if (role_id && role_id == role.name) {
                  $(".provision_role_vms_button", li).trigger("click");
                }
            });
          }

          $(".provision_confirm_action:first", context).html("");

          $(".provision_info_flow_loading", context).hide();
          $(".provision_info_flow", context).css("visibility", "visible");
        }
      });
    }

    context.on("click", ".provision_role_vms_button", function(){
      $(".provision_role_vms_container", context).html("<div class=\"text-center\">"+
        "<span class=\"fa-stack fa-5x\">"+
          "<i class=\"fas fa-cloud fa-stack-2x\"></i>"+
          "<i class=\"fa  fa-spinner fa-spin fa-stack-1x fa-inverse\"></i>"+
        "</span>"+
        "<br>"+
        "<br>"+
        "<span>"+
        "</span>"+
        "</div>");

      var role = $(this).closest(".provision_role_ul").data("role");
      $(".provision_info_flow", context).data("role_id", role.name);

      var vms = [];
      var promises = [];
      
      if (role.nodes && role.nodes.length > 0) {
        $.each(role.nodes, function(_, node) {
          if (node.vm_info !== undefined) {
            function promiseVmInfo(id) {
              return $.ajax({
                url: "vm/" + id,
                type: "GET",
                dataType: "json",
                success: function (vm_json) {
                  vms.push(vm_json);
                }
              })
            }

            promises.push(promiseVmInfo(node.deploy_id))
          }
        });
      }

      $.when.apply($, promises).then(function() {
        ProvisionVmsList.generate(
          $(".provision_role_vms_container", context),
          {
            title: role.name + " " + Locale.tr("VMs"),
            active: true,
            refresh: true,
            create: false,
            filter: false,
            data: vms
          });
      });
    });

    

    context.on("click", ".provision_role_cardinality_button", function(){
      var role = $(this).closest(".provision_role_ul").data("role");
      var min_vms = (role.min_vms||0);
      var max_vms = (role.max_vms||100);


      $(".provision_confirm_action:first", context).html(
        "<div data-closable class=\"callout secondary large\">"+
          "<div class=\"row\">"+
            "<div class=\"large-12 large-centered columns\">"+
              "<div class=\"row\">"+
                "<div class=\"large-8 small-centered columns\">"+
                "<div class=\"cardinality_slider_div\">"+
                "</div>"+
                "<br>"+
                "<button href\"#\" class=\"provision_change_cardinality_button success button right\" role_id=\""+role.name+"\">"+
                  Locale.tr("Change Cardinality")+
                "</button>"+
                "<div class=\"cardinality_no_slider_div\">"+
                  "<span class=\"\">"+Locale.tr("The cardinality for this role cannot be changed")+"</span>"+
                "</div>"+
              "</div>"+
            "</div>"+
          "</div>"+
          "<button class=\"close-button\" aria-label=\"" + Locale.tr("Dismiss Alert") + " type=\"button\" data-close>" +
            "<span aria-hidden=\"true\">&times;</span>" +
          "</button>"+
        "</div>");

      if (max_vms > min_vms) {
        $( ".cardinality_slider_div", context).html(RangeSlider.html({
          min: min_vms,
          max: max_vms,
          max_value: max_vms,
          initial: role.cardinality,
          label: Locale.tr("Number of VMs for Role")+" "+role.name
        }));

        $(".cardinality_slider_div input.visor", context).off().on('input', function() {
          $("input[type=range]", $(this).closest('.uinput-slider-container')).val( this.value );
        });

        $(".cardinality_slider_div", context).show();
        $(".provision_change_cardinality_button").show();
        $(".cardinality_no_slider_div", context).hide();
      } else {
        $(".cardinality_slider_div", context).hide();
        $(".provision_change_cardinality_button").hide();
        $(".cardinality_no_slider_div", context).show();
      }

      return false;
    });

    context.on("click", ".provision_change_cardinality_button", function() {
      var flow_id = $(".provision_info_flow", context).attr("flow_id");
      var role_name = $(this).attr("role_id");
      var cardinality = $(".cardinality_slider_div input.visor", context).val();

      OpenNebula.Role.scale({
        data : {
          id: flow_id,
          extra_param: {
            force: false,
            cardinality: cardinality,
            role_name: role_name,
          }
        },
        success: function(){
          OpenNebula.Action.clear_cache("SERVICE");
          $(".provision_refresh_info", context).trigger("click");
        },
        error: Notifier.onError
      });
    });

    context.on("click", ".provision_delete_confirm_button", function(){
      $(".provision_confirm_action:first", context).html(
        "<div data-closable class=\"callout secondary large\">"+
          "<div class=\"row\">"+
          "<div class=\"large-9 columns\">"+
            "<span>"+
              Locale.tr("Be careful, this action will immediately destroy your Service")+
              "<br>"+
              Locale.tr("All the information will be lost!")+
            "</span>"+
          "</div>"+
          "<div class=\"large-3 columns\">"+
            "<button href\"#\" class=\"provision_delete_button alert button large-12 radius\">"+Locale.tr("Delete")+"</button>"+
          "</div>"+
          "</div>"+
          "<button class=\"close-button\" aria-label=\"" + Locale.tr("Dismiss Alert") + " type=\"button\" data-close>" +
            "<span aria-hidden=\"true\">&times;</span>" +
          "</button>"+
        "</div>");
    });

    context.on("click", ".provision_shutdown_confirm_button", function(){
      $(".provision_confirm_action:first", context).html(
        "<div data-closable class=\"callout secondary large\">"+
          "<div class=\"row\">"+
          "<div class=\"large-9 columns\">"+
            "<span>"+
              Locale.tr("Be careful, this action will immediately shutdown your Service")+
              "<br>"+
              Locale.tr("All the information will be lost!")+
            "</span>"+
          "</div>"+
          "<div class=\"large-3 columns\">"+
            "<button href\"#\" class=\"provision_shutdown_button alert button large-12 radius\">"+Locale.tr("Shutdown")+"</button>"+
          "</div>"+
          "</div>"+
          "<button class=\"close-button\" aria-label=\"" + Locale.tr("Dismiss Alert") + " type=\"button\" data-close>" +
            "<span aria-hidden=\"true\">&times;</span>" +
          "</button>"+
        "</div>");
    });

    context.on("click", ".provision_recover_button", function(){
      var flow_id = $(".provision_info_flow", context).attr("flow_id");

      OpenNebula.Service.recover({
        data : {
          id: flow_id
        },
        success: function() {
          update_provision_flow_info(flow_id, context);
        },
        error: Notifier.onError
      });
    });

    context.on("click", ".provision_shutdown_button", function(){
      var flow_id = $(".provision_info_flow", context).attr("flow_id");

      OpenNebula.Service.shutdown({
        data : {
          id: flow_id
        },
        success: function() {
          update_provision_flow_info(flow_id, context);
        },
        error: Notifier.onError
      });
    });

    context.on("click", ".provision_delete_button", function(){
      var button = $(this);
      button.attr("disabled", "disabled");
      var flow_id = $(".provision_info_flow", context).attr("flow_id");

      OpenNebula.Service.del({
        data : {
          id: flow_id
        },
        success: function() {
          $(".provision_back", context).click();
          $(".provision_flows_list_refresh_button", context).click();
          button.removeAttr("disabled");
        },
        error: function(request, response) {
          Notifier.onError(request, response);
          button.removeAttr("disabled");
        }
      });
    });

    context.on("click", ".provision_refresh_info", function(){
      var flow_id = $(".provision_info_flow", context).attr("flow_id");
      var role_id = $(".provision_info_flow", context).data("role_id");
      update_provision_flow_info(flow_id, context, role_id);
      return false;
    });

    //
    // Info Flow
    //

    $(".provision_list_flows", context).on("click", ".provision_info_flow_button", function(){
      $("a.provision_show_flow_accordion", context).trigger("click");

      var flow_id = $(this).parents(".provision-pricing-table").attr("opennebula_id");
      update_provision_flow_info(flow_id, context);
      return false;
    });
  }

  function get_provision_flow_start_time(data) {
    if (data.log) {
      return data.log[0].timestamp;
    } else {
      return null;
    }
  }

  // @params
  //    data: and BODY object of the Document representing the Service
  //      Example: data.ID
  // @returns and object containing the following properties
  //    color: css class for this state.
  //      color + '-color' font color class
  //      color + '-bg' background class
  //    str: user friendly state string
  function get_provision_flow_state(data) {
    var state_color;
    var state_str;

    switch (parseInt(data.state)) {
      case OpenNebula.Service.STATES.PENDING:
        state_color = "deploying";
        state_str = Locale.tr("PENDING");
        break;
      case OpenNebula.Service.STATES.DEPLOYING:
        state_color = "deploying";
        state_str = Locale.tr("DEPLOYING");
        break;
      case OpenNebula.Service.STATES.UNDEPLOYING:
        state_color = "powering_off";
        state_str = Locale.tr("UNDEPLOYING");
        break;
      case OpenNebula.Service.STATES.FAILED_UNDEPLOYING:
        state_color = "error";
        state_str = Locale.tr("FAILED UNDEPLOYING");
        break;
      case OpenNebula.Service.STATES.FAILED_DEPLOYING:
        state_color = "error";
        state_str = Locale.tr("FAILED DEPLOYING");
        break;
      case OpenNebula.Service.STATES.FAILED_SCALING:
        state_color = "error";
        state_str = Locale.tr("FAILED SCALING");
        break;
      case OpenNebula.Service.STATES.WARNING:
        state_color = "error";
        state_str = Locale.tr("WARNING");
        break;
      case OpenNebula.Service.STATES.RUNNING:
        state_color = "running";
        state_str = Locale.tr("RUNNING");
        break;
      case OpenNebula.Service.STATES.SCALING:
        state_color = "deploying";
        state_str = Locale.tr("SCALING");
        break;
      case OpenNebula.Service.STATES.COOLDOWN:
        state_color = "running";
        state_str = Locale.tr("COOLDOWN");
        break;
      case OpenNebula.Service.STATES.DONE:
        state_color = "off";
        state_str = Locale.tr("DONE");
        break;
      case OpenNebula.Service.STATES.DEPLOYING_NETS:
        state_color = "deploying";
        state_str = Locale.tr("DEPLOYING NETS");
        break;
      case OpenNebula.Service.STATES.UNDEPLOYING_NETS:
        state_color = "deploying";
        state_str = Locale.tr("UNDEPLOYING NETS");
        break;
      case OpenNebula.Service.STATES.FAILED_DEPLOYING_NETS:
        state_color = "error";
        state_str = Locale.tr("FAILED DEPLOYING NETS");
        break;
      case OpenNebula.Service.STATES.FAILED_UNDEPLOYING_NETS:
        state_color = "error";
        state_str = Locale.tr("FAILED UNDEPLOYING NETS");
        break;
      default:
        state_color = "powering_off";
        state_str = Locale.tr("UNKNOWN");
        break;
    }

    return {
      color: state_color,
      str: state_str
    };
  }
});
