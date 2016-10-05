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
  // Dependencies
  var Locale = require('utils/locale');
  var OpenNebulaTemplate = require('opennebula/template');
  var OpenNebulaError = require('opennebula/error');
  var DomDataTable = require('utils/dom-datatable');
  var UserInputs = require('utils/user-inputs');
  var Notifier = require('utils/notifier');
  var UniqueId = require('utils/unique-id');
  var VCenterCommon = require('./vcenter-common');

  var TemplateHTML = require('hbs!./common/html');
  var RowTemplate = require('hbs!./templates/row');
  var EmptyFieldsetHTML = require('hbs!./common/empty-fieldset');
  var FieldsetTableHTML = require('hbs!./common/fieldset-table');

  function VCenterTemplates() {
    return this;
  }

  VCenterTemplates.prototype = {
    'html': VCenterCommon.html,
    'insert': _fillVCenterTemplates,
    'import': _import
  };
  VCenterTemplates.prototype.constructor = VCenterTemplates;

  return VCenterTemplates;

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

    var context = $(".vcenter_import", opts.container);
    context.html(TemplateHTML());
    context.show();

    $.ajax({
      url: path,
      type: "GET",
      data: {timeout: false},
      dataType: "json",
      headers: {
        "X-VCENTER-USER": opts.vcenter_user,
        "X-VCENTER-PASSWORD": opts.vcenter_password,
        "X-VCENTER-HOST": opts.vcenter_host
      },
      success: function(response){
        $(".vcenter_datacenter_list", context).html("");

        $.each(response, function(datacenter_name, elements){
          var content;
          if (elements.length == 0) {
            content = EmptyFieldsetHTML({
              title : datacenter_name + ' ' + Locale.tr("DataCenter"),
              message : Locale.tr("No new templates found in this DataCenter")
            });

            $(".vcenter_datacenter_list", context).append(content);
          } else {
            var tableId = "vcenter_import_table_" + UniqueId.id();
            content = FieldsetTableHTML({
              tableId : tableId,
              title : datacenter_name + ' ' + Locale.tr("DataCenter"),
              clearImported : Locale.tr("Clear Imported Templates"),
              toggleAdvanced : true,
              columns : [
                '<input type="checkbox" class="check_all"/>',
                Locale.tr("Template")
              ]
            });

            var newdiv = $(content).appendTo($(".vcenter_datacenter_list", context));
            var tbody = $('#' + tableId + ' tbody', context);

            $.each(elements, function(id, element) {
              var opts = {};
              if (element.ds && element.ds !== '') {
                opts.datastore = UserInputs.unmarshall(element.ds);
              }

              if (element.rp && element.rp !== '') {
                opts.resourcePool = UserInputs.unmarshall(element.rp);
              }

              opts.data = element;

              var trow = $(RowTemplate(opts)).appendTo(tbody);

              $('.check_item', trow).data("import_data", element);
            });

            var elementsTable = new DomDataTable(
              tableId,
              {
                actions: false,
                info: false,
                dataTableOptions: {
                  "bAutoWidth": false,
                  "bSortClasses" : false,
                  "bDeferRender": false,
                  "ordering": false,
                  "aoColumnDefs": [
                  {"sWidth": "35px", "aTargets": [0]},
                  ],
                },
                "customTrListener": function(tableObj, tr){ return false; }
              });

            elementsTable.initialize();

            $("a.vcenter-table-select-all").text(Locale.tr("Select all %1$s Templates", elements.length));

            VCenterCommon.setupTable({
              context : newdiv,
              allSelected : Locale.tr("All %1$s Templates selected."),
              selected: Locale.tr("%1$s Templates selected.")
            });

            context.off('click', '.clear_imported');
            context.on('click', '.clear_imported', function() {
              _fillVCenterTemplates(opts);
              return false;
            });
          }
        });
      },
      error: function(response){
        context.hide();
        Notifier.onError({}, OpenNebulaError(response));
      }
    });
  }

  function _import(context) {
    $.each($(".vcenter_import_table", context), function() {
      $.each($(this).DataTable().$(".check_item:checked"), function() {
        var row_context = $(this).closest("tr");

        VCenterCommon.importLoading({context : row_context});

        var attrs = [];
        var userInputs = [];

        // Retrieve Datastore Attribute
        var dsInput = $(".vcenter_datastore_input", row_context);
        if (dsInput.length > 0) {
          var dsModify = $('.modify_datastore', dsInput).val();
          var dsInitial = $('.initial_datastore', dsInput).val();
          var dsParams = $('.available_datastores', dsInput).val();

          if (dsModify === 'fixed' && dsInitial !== '') {
            attrs.push('VCENTER_DATASTORE="' + dsInitial + '"')
          } else if (dsModify === 'list' && dsParams !== '') {
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
        var rpInput = $(".vcenter_rp_input", row_context);
        if (rpInput.length > 0) {
          var rpModify = $('.modify_rp', rpInput).val();
          var rpInitial = $('.initial_rp', rpInput).val();
          var rpParams = $('.available_rps', rpInput).val();

          if (rpModify === 'fixed' && rpInitial !== '') {
            attrs.push('RESOURCE_POOL="' + rpInitial + '"');
          } else if (rpModify === 'list' && rpParams !== '') {
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
        var template = $(this).data("import_data").one;

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
            VCenterCommon.importSuccess({
              context : row_context,
              message : Locale.tr("Template created successfully. ID: %1$s", response.VMTEMPLATE.ID)
            });
          },
          error: function (request, error_json) {
            VCenterCommon.importFailure({
              context : row_context,
              message : (error_json.error.message || Locale.tr("Cannot contact server: is it running and reachable?"))
            });
          }
        });
      });
    });
  }
});
