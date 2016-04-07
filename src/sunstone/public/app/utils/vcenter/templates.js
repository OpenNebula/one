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
  var CustomLayoutDataTable = require('utils/custom-layout-table');
  var UserInputs = require('utils/user-inputs');
  var Notifier = require('utils/notifier');

  var TemplateHTML = require('hbs!./templates/html');
  var EmptyTableTemplate = require('hbs!./templates/empty-table');
  var RowTemplate = require('hbs!./templates/row');

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
    return '<div class="vcenter_templates" hidden></div>';
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

        $.each(response, function(datacenter_name, templates){
          var content;
          if (templates.length == 0) {
            content = 
              '<fieldset>' +
                '<legend>' +
                  '<ul class="menu simple">' +
                    '<li> ' +
                      datacenter_name + ' ' + Locale.tr("DataCenter") +
                    '</li>' +
                    '<li>' +
                      '<span>' +
                        Locale.tr("No new templates found in this DataCenter") +
                      '</span>' +
                    '</li>' +
                  '</ul>' +
                '</legend>' +
              '</fieldset>';

            $(".content", context).append(content);
          } else {
            var tableId = "vcenter_template_table_" + datacenter_name;
            content = 
              '<fieldset>' +
                '<legend>' +
                  '<ul class="menu simple">' +
                    '<li> ' +
                      datacenter_name + ' ' + Locale.tr("DataCenter") +
                    '</li>' +
                    '<li> ' +
                      '<label class="inline">' +
                        '<input type="checkbox" class="check_all" checked/>' +
                        Locale.tr("Select All") +
                      '</label>' +
                    '</li>' +
                    '<li> ' +
                      '<label class="inline">' +
                        '<input type="checkbox" class="expand_all"/>' +
                         Locale.tr("Expand Advanced Sections") +
                      '</label>' +
                    '</li>' +
                    '<li> ' +
                      '<button class="button small success import_selected">' +
                         Locale.tr("Import Selected Templates") +
                      '</button>' +
                    '</li>' +
                    '<li> ' +
                      '<button class="button small secondary clear_imported">' +
                         Locale.tr("Clear Imported Templates") +
                      '</button>' +
                    '</li>' +
                  '</ul>' +
                '</legend>' +
                '<div class="row">' +
                  '<div class="large-12 columns">' +
                    '<table class="dataTable vcenter_template_table" id="' + tableId + '">' +
                      '<thead>' +
                        '<th>' + Locale.tr("Name") + '</th>' +
                      '</thead>' +
                      '<tbody/>' +
                    '</table>' +
                  '</div>' +
                '</div>';
              '</fieldset>';

            $(".content", context).append(content);

            var preDrawCallback = function (settings) {
                $('#' + tableId).html(EmptyTableTemplate());
              }
            var rowCallback = function(row, data, index) {
                var opts = {};
                if (data.ds && data.ds !== '') {
                  opts.datastore = UserInputs.unmarshall(data.ds);
                }

                if (data.rp && data.rp !== '') {
                  opts.resourcePool = UserInputs.unmarshall(data.rp);
                }

                opts.data = data;

                var templateRow = $(RowTemplate(opts)).appendTo($('#' + tableId));
                $('.check_item', templateRow).data("template_name", data.name)
                $('.check_item', templateRow).data("one_template", data.one);

                return row;
              }

            var templatesTable = new CustomLayoutDataTable({
                tableId: '#' + tableId,
                columns: ['name'],
                preDrawCallback: preDrawCallback,
                rowCallback: rowCallback
              });

            templatesTable.addData(templates);

            context.off('click', '.import_selected');
            context.on('click', '.import_selected', function() {
              tableContext = $(this).closest('fieldset');
              _import(tableContext);
              return false;
            });

            context.off('click', '.clear_imported');
            context.on('click', '.clear_imported', function() {
              _fillVCenterTemplates(opts);
              return false;
            });

//            var tbody = $('tbody', newdiv);
//
//            $.each(templates, function(id, template){
//              var trow = $(
//                '<tr class="vcenter_template">' +
//                  '<td><input type="checkbox" class="check_item" checked/></td>' +
//                  '<td>' + template.name + '</td>' +
//                  '<td>' + template.host + '</td>' +
//                  '<td><div class="vcenter_template_response"/></td>' +
//                  '<td><div class="vcenter_template_result"/></td>' +
//                '</tr>').appendTo(tbody);
//
//              $(".check_item", trow).data("template_name", template.name)
//              $(".check_item", trow).data("one_template", template.one)
//            });

//            var tmplDataTable = new DomDataTable(
//              'vcenter_template_table_' + datacenter_name,
//              {
//                actions: false,
//                info: false,
//                dataTableOptions: {
//                  "bAutoWidth": false,
//                  "bSortClasses" : false,
//                  "bDeferRender": false,
//                  //"ordering": true,
//                  "order": [],
//                  "aoColumnDefs": [
//                    {"bSortable": false, "aTargets": [0]},
//                    {"bSortable": true, "aTargets": [1,2]},
//                    {"sWidth": "35px", "aTargets": [0]},
//                  ]
//                },
//                customTrListener: function(tableObj, tr){
//                  $("input.check_item", tr).click();
//                }
//              });
//
//            tmplDataTable.initialize();
//
//            newdiv.on("change", '.check_all', function() {
//              var table = $(this).closest('table');
//              if ($(this).is(":checked")) { //check all
//                $('tbody input.check_item', table).prop('checked', true).change();
//              } else { //uncheck all
//                $('tbody input.check_item', table).prop('checked', false).change();
//              }
//            });
//
//            $('table', newdiv).on('draw.dt', function(){
//              _recountCheckboxes(this);
//            });
//
//            $(".check_item", newdiv).on('change', function(){
//              _recountCheckboxes($('table', newdiv));
//            });
          }
        });
      },
      error: function(response){
        context.hide();
        Notifier.onError({}, OpenNebulaError(response));
      }
    });
  }

  function _recountCheckboxes(table) {
    var total_length = $('input.check_item', table).length;
    var checked_length = $('input.check_item:checked', table).length;
    $('.check_all', table).prop('checked', (total_length == checked_length));
  }

  function _import(context) {
    $.each($(".vcenter_template_table", context), function() {
      $.each($(".check_item:checked", this), function() {
        var template_context = $(this).closest(".vcenter_row");

        $(".vcenter_template_result:not(.success)", template_context).html(
            '<span class="fa-stack" style="color: #dfdfdf">' +
              '<i class="fa fa-cloud fa-stack-2x"></i>' +
              '<i class="fa  fa-spinner fa-spin fa-stack-1x fa-inverse"></i>' +
            '</span>');


        var attrs = [];
        var userInputs = [];

        // Retrieve Datastore Attribute
        var dsInput = $(".vcenter_datastore_input", template_context);
        if (dsInput.length > 0) {
          var dsModify = $('.modify_datastore', dsInput).val();
          var dsInitial = $('.initial_datastore', dsInput).val();
          var dsParams = $('.available_datastores', dsInput).val();

          if (dsModify === 'fixed' && dsInitial !== '') {
            attrs.push('VCENTER_DATASTORE="' + dsInitial + '"')
          } else if (dsModify === 'fixed' && dsParams !== '') {
            var dsUserInputsStr = UserInputs.marshall({
                type: 'list',
                description: Locale.tr("Which datastore you want this VM to run on?"),
                initial: dsInitial,
                params: dsParams
              });

            userInputs.push('VCENTER_DATASTORE="' + dsUserInputsStr + '"');
          }
        }

        // Retrieve Resource Pool Attribute
        var rpInput = $(".vcenter_rp_input", template_context);
        if (rpInput.length > 0) {
          var rpModify = $('.modify_rp', rpInput).val();
          var rpInitial = $('.initial_rp', rpInput).val();
          var rpParams = $('.available_rps', rpInput).val();

          if (rpModify === 'fixed' && rpInitial !== '') {
            attrs.push('RESOURCE_POOL="' + rpInitial + '"');
          } else if (rpModify === 'fixed' && rpParams !== '') {
            var rpUserInputs = UserInputs.marshall({
                type: 'list',
                description: Locale.tr("Which resource pool you want this VM to run in?"),
                initial: rpInitial,
                params: $('.available_rps', rpInput).val()
              });

            userInputs.push('RESOURCE_POOL="' + rpUserInputs + '"');
          }
        }
        
        // Append new attrs and user inputs if necessary
        var template = $(this).data("one_template");

        if (attrs.length > 0) {
          template += "\n" + attrs.join("\n");
        }

        if (userInputs.length > 0) {
          template += "\nUSER_INPUTS=[\n" + userInputs.join(",\n") + "]";
        }

        var template_json = {
          "vmtemplate": {
            "template_raw": template
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
