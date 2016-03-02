/* -------------------------------------------------------------------------- */
/* Copyright 2002-2015, OpenNebula Project, OpenNebula Systems                */
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
//  require('foundation.alert');
  var OpenNebula = require('opennebula');
  var Locale = require('utils/locale');
  var Config = require('sunstone-config');
  var Notifier = require('utils/notifier');
  var Humanize = require('utils/humanize');
  var ResourceSelect = require('utils/resource-select');
  var LabelsUtils = require('utils/labels/utils');

  var TemplateTemplatesList = require('hbs!./list');

  var _accordionId = 0;
  var TEMPLATE_LABELS_COLUMN = 4;

  return {
    'generate': generate_provision_templates_list,
    'show': show_provision_template_list,
    'updateDatatable': update_provision_templates_datatable,
  };

  function show_provision_template_list(timeout) {
    $(".section_content").hide();
    $(".provision_templates_list_section").fadeIn();

    $(".provision_templates_list_refresh_button", $(".provision_templates_list_section")).trigger("click");
  }

  function generate_provision_templates_list(context, opts) {
    context.off();
    context.html(html(opts));
    setup_provision_templates_list(context, opts);
  }

  function html(opts_arg){
    opts = $.extend({
        title: Locale.tr("Templates"),
        refresh: true,
        create: true,
        active: true,
        filter: true
      },opts_arg)

    _accordionId += 1;
    return TemplateTemplatesList({'accordionId': _accordionId, 'opts': opts});
  }

  function update_provision_templates_datatable(datatable, timeout) {
    datatable.html('<div class="text-center">'+
      '<span class="fa-stack fa-5x" style="color: #dfdfdf">'+
        '<i class="fa fa-cloud fa-stack-2x"></i>'+
        '<i class="fa  fa-spinner fa-spin fa-stack-1x fa-inverse"></i>'+
      '</span>'+
      '<br>'+
      '<br>'+
      '<span style="font-size: 18px; color: #999">'+
      '</span>'+
      '</div>');

    setTimeout( function(){
      OpenNebula.Template.list({
        timeout: true,
        success: function (request, item_list){
          datatable.fnClearTable(true);
          if (item_list.length == 0) {
            datatable.html('<div class="text-center">'+
              '<span class="fa-stack fa-5x" style="color: #dfdfdf">'+
                '<i class="fa fa-cloud fa-stack-2x"></i>'+
                '<i class="fa fa-info-circle fa-stack-1x fa-inverse"></i>'+
              '</span>'+
              '<br>'+
              '<br>'+
              '<span style="font-size: 18px; color: #999">'+
                Locale.tr("There are no templates available")+
              '</span>'+
              '</div>');
          } else {
            datatable.fnAddData(item_list);
            LabelsUtils.clearLabelsFilter(datatable, TEMPLATE_LABELS_COLUMN);
            var context = $('.labels-dropdown', datatable.closest('.content'));
            LabelsUtils.insertLabelsMenu({
              'context': context,
              'dataTable': datatable,
              'labelsColumn': TEMPLATE_LABELS_COLUMN,
              'labelsPath': 'VMTEMPLATE.TEMPLATE.LABELS',
              'placeholder': Locale.tr("No labels defined")
            });
          }
        },
        error: Notifier.onError
      });
    }, timeout);
  }

  function setup_provision_templates_list(context, opts) {
    var provision_templates_datatable = $('.provision_templates_table', context).dataTable({
      "iDisplayLength": 8,
      "sDom" : '<"H">t<"F"lp>',
      "aLengthMenu": [[6, 12, 36, 72], [6, 12, 36, 72]],
      "aaSorting"  : [[0, "desc"]],
      "aoColumnDefs": [
          { "bVisible": false, "aTargets": ["all"]}
      ],
      "aoColumns": [
          { "mDataProp": "VMTEMPLATE.ID" },
          { "mDataProp": "VMTEMPLATE.NAME" },
          { "mDataProp": "VMTEMPLATE.UID" }
      ],
      "fnPreDrawCallback": function (oSettings) {
        // create a thumbs container if it doesn't exist. put it in the dataTables_scrollbody div
        if (this.$('tr', {"filter": "applied"} ).length == 0) {
          this.html('<div class="text-center">'+
            '<span class="fa-stack fa-5x" style="color: #dfdfdf">'+
              '<i class="fa fa-cloud fa-stack-2x"></i>'+
              '<i class="fa fa-info-circle fa-stack-1x fa-inverse"></i>'+
            '</span>'+
            '<br>'+
            '<br>'+
            '<span style="font-size: 18px; color: #999">'+
              Locale.tr("There are no templates available")+
              '<br>'+
              Locale.tr("Create a template by saving a running Virtual Machine")+
            '</span>'+
            '</div>');
        } else {
          $(".provision_templates_table", context).html('<ul class="provision_templates_ul large-block-grid-3 medium-block-grid-3 small-block-grid-1 text-center"></ul>');
        }
        return true;
      },
      "fnRowCallback": function( nRow, aData, iDisplayIndex, iDisplayIndexFull ) {
        var data = aData.VMTEMPLATE;
        var actions_html = "";
        if (Config.isTabActionEnabled("provision-tab", "Template.chmod")) {
          if (data.UID == config['user_id']) {

            if (data.PERMISSIONS.GROUP_U == "1") {
              actions_html += '<a class="provision_confirm_unshare_template_button left" title="'+ Locale.tr("Unshare")+'" style="color:#555" href="#"><i class="fa fa-fw fa-lg fa-ban only-on-hover"/></a>';
              actions_html += '<span style="font-size:12px; color: #777">' + Locale.tr("SHARED") + '</span>';
            } else {
              actions_html += '<a class="provision_confirm_chmod_template_button left" title="'+ Locale.tr("Share")+'" style="color:#555" href="#"><i class="fa fa-fw fa-lg fa-share-alt only-on-hover"/></a>';
            }
          }
        }

        if (Config.isTabActionEnabled("provision-tab", "Template.delete")) {
          actions_html += '<a class="provision_confirm_delete_template_button" title="'+ Locale.tr("Delete")+'"  style="color:#555" href="#"><i class="fa fa-fw fa-lg fa-trash-o right only-on-hover"/></a>';
        }

        var cpu_txt = "";
        var mem_txt = "";

        if(data.TEMPLATE.CPU){
          cpu_txt = 'x'+data.TEMPLATE.CPU;
        }

        if(data.TEMPLATE.MEMORY){
          if (data.TEMPLATE.MEMORY > 1000){
            mem_txt = Math.floor(data.TEMPLATE.MEMORY/1024)+'GB';
          } else {
            mem_txt = data.TEMPLATE.MEMORY+'MB';
          }
        }

        $(".provision_templates_ul", context).append('<li>'+
            '<ul class="provision-pricing-table" opennebula_id="'+data.ID+'" datatable_index="'+iDisplayIndexFull+'">'+
              '<li class="provision-title text-left" title="'+data.NAME+'">'+
                data.NAME +
              '</li>'+
              '<li class="provision-bullet-item text-left" >'+
                '<i class="fa fa-fw fa-lg fa-laptop"/> '+
                cpu_txt+' - '+
                mem_txt+' - '+
                get_provision_disk_image(data) +
              '</li>'+
              '<li class="provision-description text-left" style="padding-top:0px; padding-bottom: 5px">'+
                (data.TEMPLATE.DESCRIPTION || '')+
              '</li>'+
              '<li class="provision-bullet-item" style="padding-top:10px">'+
                actions_html+
              '</li>'+
              '<li class="provision-bullet-item-last text-left" >'+
                '<span class="">'+
                  '<i class="fa fa-fw fa-lg fa-user"/> '+
                  data.UNAME+
                '</span>'+
                '<span class="right">'+
                  Humanize.prettyTimeAgo(data.REGTIME)+
                '</span>'+
              '</li>'+
            '</ul>'+
          '</li>');

        return nRow;
      }
    });

    $('.provision_list_templates_search', context).on('input',function(){
      provision_templates_datatable.fnFilter( $(this).val() );
    })

    context.on("click", ".provision_templates_list_refresh_button", function(){
      OpenNebula.Action.clear_cache("VMTEMPLATE");
      $(".provision_confirm_delete_template_div", context).html("");
      update_provision_templates_datatable(provision_templates_datatable, 0);
      return false;
    });

    context.on("click", ".provision_templates_list_search_button", function(){
      $(".provision_list_templates_search", context).fadeIn();
    });

    $(".provision_list_templates_filter", context).on("change", ".resource_list_select", function(){
      if ($(this).val() != "-2"){
        provision_templates_datatable.fnFilter("^" + $(this).val() + "$", 2, true, false);
      } else {
        provision_templates_datatable.fnFilter("", 2);
      }
    })

    ResourceSelect.insert({
        context: $('.provision_list_templates_filter', context),
        resourceName: 'User',
        initValue: (opts.filter_expression ? opts.filter_expression : "-2"),
        extraOptions: '<option value="-2">' + Locale.tr("ALL") + '</option>',
        triggerChange: true,
        onlyName: true
      });

    context.on("click", ".provision_templates_list_filter_button", function(){
      $(".provision_list_templates_filter", context).fadeIn();
      return false;
    });

    if (Config.isTabActionEnabled("provision-tab", "Template.delete")) {
      context.on("click", ".provision_confirm_delete_template_button", function(){
        var ul_context = $(this).parents(".provision-pricing-table");
        var template_id = ul_context.attr("opennebula_id");
        var template_name = $(".provision-title", ul_context).text();

        $(".provision_confirm_delete_template_div", context).html(
          '<div data-alert class="alert-box secondary radius">'+
            '<div class="row">'+
            '<div class="large-9 columns">'+
              '<span style="font-size: 14px; line-height: 20px">'+
                Locale.tr("Handle with care! This action will immediately destroy the template")+
                ' "' + template_name + '" ' +
                Locale.tr("and the image associated.") +
              '</span>'+
            '</div>'+
            '<div class="large-3 columns">'+
              '<a href"#" class="provision_delete_template_button alert button large-12 radius right" style="margin-right: 15px" template_id="'+template_id+'">'+Locale.tr("Delete")+'</a>'+
            '</div>'+
            '</div>'+
            '<a href="#" class="close">&times;</a>'+
          '</div>');
      });

      context.on("click", ".provision_delete_template_button", function(){

        var button = $(this);
        button.attr("disabled", "disabled");

        var template_id = $(this).attr("template_id");

        OpenNebula.Template.delete_recursive({
          timeout: true,
          data : {
            id : template_id
          },
          success: function (){
            $(".provision_templates_list_refresh_button", context).trigger("click");
          },
          error: function (request,error_json, container) {
            Notifier.onError(request, error_json, container);
            $(".provision_templates_list_refresh_button", context).trigger("click");
          }
        })
      });
    }


    if (Config.isTabActionEnabled("provision-tab", "Template.chmod")) {
      context.on("click", ".provision_confirm_chmod_template_button", function(){
        var ul_context = $(this).parents(".provision-pricing-table");
        var template_id = ul_context.attr("opennebula_id");
        var template_name = $(".provision-title", ul_context).text();

        $(".provision_confirm_delete_template_div", context).html(
          '<div data-alert class="alert-box secondary radius">'+
            '<div class="row">'+
            '<div class="large-8 columns">'+
              '<span style="font-size: 14px; line-height: 20px">'+
                Locale.tr("The template")+
                ' "' + template_name + '" ' +
                Locale.tr("and the image associated will be shared and all the users will be able to instantiate new VMs using this template.") +
              '</span>'+
            '</div>'+
            '<div class="large-4 columns">'+
              '<a href"#" class="provision_chmod_template_button success button large-12 radius right" style="margin-right: 15px" template_id="'+template_id+'">'+Locale.tr("Share template")+'</a>'+
            '</div>'+
            '</div>'+
            '<a href="#" class="close">&times;</a>'+
          '</div>');
      });

      context.on("click", ".provision_chmod_template_button", function(){

        var button = $(this);
        button.attr("disabled", "disabled");

        var template_id = $(this).attr("template_id");

        OpenNebula.Template.chmod({
          timeout: true,
          data : {
            id : template_id,
            extra_param: {
              'group_u': 1,
              'recursive' : true
            }
          },
          success: function (){
            $(".provision_templates_list_refresh_button", context).trigger("click");
          },
          error: Notifier.onError
        })
      });

      context.on("click", ".provision_confirm_unshare_template_button", function(){
        var ul_context = $(this).parents(".provision-pricing-table");
        var template_id = ul_context.attr("opennebula_id");
        var template_name = $(".provision-title", ul_context).first().text();

        $(".provision_confirm_delete_template_div", context).html(
          '<div data-alert class="alert-box secondary radius">'+
            '<div class="row">'+
            '<div class="large-8 columns">'+
              '<span style="font-size: 14px; line-height: 20px">'+
                Locale.tr("The template")+
                ' "' + template_name + '" ' +
                Locale.tr("and the image associated will be unshared and the users will not be able to instantiate new VMs using this template.") +
              '</span>'+
            '</div>'+
            '<div class="large-4 columns">'+
              '<a href"#" class="provision_unshare_template_button success button large-12 radius right" style="margin-right: 15px" template_id="'+template_id+'">'+Locale.tr("Unshare template")+'</a>'+
            '</div>'+
            '</div>'+
            '<a href="#" class="close">&times;</a>'+
          '</div>');
      });

      context.on("click", ".provision_unshare_template_button", function(){
        var button = $(this);
        button.attr("disabled", "disabled");

        var template_id = $(this).attr("template_id");

        OpenNebula.Template.chmod({
          timeout: true,
          data : {
            id : template_id,
            extra_param: {
              'group_u': 0,
              'recursive' : true
            }
          },
          success: function (){
            $(".provision_templates_list_refresh_button", context).trigger("click");
          },
          error: Notifier.onError
        })
      });
    }

    OpenNebula.Action.clear_cache("VMTEMPLATE");
    update_provision_templates_datatable(provision_templates_datatable, 0);
    context.foundation();
  }

  function get_provision_disk_image(data) {
    var disks = []
    if ($.isArray(data.TEMPLATE.DISK))
        disks = data.TEMPLATE.DISK
    else if (!$.isEmptyObject(data.TEMPLATE.DISK))
        disks = [data.TEMPLATE.DISK]

    if (disks.length > 0 && disks[0].IMAGE) {
      return disks[0].IMAGE;
    } else {
      return '';
    }
  }
});
