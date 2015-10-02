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
  // Dependencies
  var Locale = require('utils/locale');
  var OpenNebulaTemplate = require('opennebula/template');
  var OpenNebulaError = require('opennebula/error');
  var DomDataTable = require('utils/dom-datatable');
  var Notifier = require('utils/notifier');

  var TemplateHTML = require('hbs!./templates/html');

  function VCenterTemplates() {
    return this;
  }

  VCenterTemplates.prototype = {
    'html': _html,
    'insert': _fillVCenterTemplates,
    'import': _import
  };
  VCenterTemplates.prototype.constructor = VCenterTemplates;

  return VCenterTemplates;

  function _html() {
    return '<div class="vcenter_templates hidden"></div>';
  }

  /*
    Retrieve the list of templates from vCenter and fill the container with them

    opts = {
      datacenter: "Datacenter Name",
      cluster: "Cluster Name",
      container: Jquery div to inject the html,
      vcenter_user: vCenter Username,
      vcenter_password: vCenter Password,
      vcenter_host: vCenter Host
    }
   */
  function _fillVCenterTemplates(opts) {
    var path = '/vcenter/templates';

    var context = $(".vcenter_templates", opts.container);

    context.html( TemplateHTML({}) );

    context.show();

    $(".accordion_advanced_toggle", context).trigger("click");

    $.ajax({
      url: path,
      type: "GET",
      data: {timeout: false},
      dataType: "json",
      headers: {
        "X_VCENTER_USER": opts.vcenter_user,
        "X_VCENTER_PASSWORD": opts.vcenter_password,
        "X_VCENTER_HOST": opts.vcenter_host
      },
      success: function(response){
        $(".content", context).html("");

        $('<div class="row">' +
            '<div class="large-12 columns">' +
              '<p style="color: #999">' + Locale.tr("Please select the vCenter Templates to be imported to OpenNebula.") + '</p>' +
            '</div>' +
          '</div>').appendTo($(".content", context))

        $.each(response, function(datacenter_name, templates){
          $('<div class="row">' +
              '<div class="large-12 columns">' +
                '<h5>' +
                  datacenter_name + ' ' + Locale.tr("DataCenter") +
                '</h5>' +
              '</div>' +
            '</div>').appendTo($(".content", context))

          if (templates.length == 0) {
              $('<div class="row">' +
                  '<div class="large-12 columns">' +
                    '<label>' +
                      Locale.tr("No new templates found in this DataCenter") +
                    '</label>' +
                  '</div>' +
                '</div>').appendTo($(".content", context))
          } else {
            var newdiv = $(
                '<div class="row">' +
                  '<div class="large-12 columns">' +
                    '<table class="dataTable vcenter_template_table" id="vcenter_template_table_' + datacenter_name + '">' +
                      '<thead>' +
                        '<th/>' +
                        '<th>' + Locale.tr("Name") + '</th>' +
                        '<th>' + Locale.tr("Datacenter") + '</th>' +
                        '<th/>' +
                        '<th/>' +
                      '</thead>' +
                      '<tbody/>' +
                    '</table>' +
                  '</div>' +
                '</div>').appendTo($(".content", context));

            var tbody = $('tbody', newdiv);

            $.each(templates, function(id, template){
              var trow = $(
                '<tr class="vcenter_template">' +
                  '<td><input type="checkbox" class="template_name" checked/></td>' +
                  '<td>' + template.name + '</td>' +
                  '<td>' + template.host + '</td>' +
                  '<td><div class="vcenter_template_response"/></td>' +
                  '<td><div class="vcenter_template_result"/></td>' +
                '</tr>').appendTo(tbody);

              $(".template_name", trow).data("template_name", template.name)
              $(".template_name", trow).data("one_template", template.one)
            });

            var tmplDataTable = new DomDataTable(
              'vcenter_template_table_' + datacenter_name,
              {
                actions: false,
                info: false,
                dataTableOptions: {
                  "bAutoWidth": false,
                  "bSortClasses" : false,
                  "bDeferRender": false,
                  //"ordering": true,
                  "order": [],
                  "aoColumnDefs": [
                    {"bSortable": true, "aTargets": [1,2]},
                    {"sWidth": "35px", "aTargets": [0]},
                  ]
                },
                customTrListener: function(tableObj, tr){
                  $("input.template_name", tr).click();
                }
              });

            tmplDataTable.initialize();
          };
        });
      },
      error: function(response){
        context.hide();
        Notifier.onError({}, OpenNebulaError(response));
      }
    });
  }

  function _import(context) {
    $.each($("table.vcenter_template_table", context), function() {
      $.each($(this).DataTable().$(".template_name:checked"), function() {
        var template_context = $(this).closest(".vcenter_template");

        $(".vcenter_template_result:not(.success)", template_context).html(
            '<span class="fa-stack" style="color: #dfdfdf">' +
              '<i class="fa fa-cloud fa-stack-2x"></i>' +
              '<i class="fa  fa-spinner fa-spin fa-stack-1x fa-inverse"></i>' +
            '</span>');

        var template_json = {
          "vmtemplate": {
            "template_raw": $(this).data("one_template")
          }
        };

        OpenNebulaTemplate.create({
          timeout: true,
          data: template_json,
          success: function(request, response) {
            $(".vcenter_template_result", template_context).addClass("success").html(
                '<span class="fa-stack" style="color: #dfdfdf">' +
                  '<i class="fa fa-cloud fa-stack-2x"></i>' +
                  '<i class="fa  fa-check fa-stack-1x fa-inverse"></i>' +
                '</span>');

            $(".vcenter_template_response", template_context).html('<p style="font-size:12px" class="running-color">' +
                  Locale.tr("Template created successfully") + ' ID:' + response.VMTEMPLATE.ID +
                '</p>');
          },
          error: function (request, error_json) {
            $(".vcenter_template_result", template_context).html('<span class="fa-stack" style="color: #dfdfdf">' +
                  '<i class="fa fa-cloud fa-stack-2x"></i>' +
                  '<i class="fa  fa-warning fa-stack-1x fa-inverse"></i>' +
                '</span>');

            $(".vcenter_template_response", template_context).html('<p style="font-size:12px" class="error-color">' +
                  (error_json.error.message || Locale.tr("Cannot contact server: is it running and reachable?")) +
                '</p>');
          }
        });
      });
    });
  }
});
