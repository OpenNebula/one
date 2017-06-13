/* -------------------------------------------------------------------------- */
/* Copyright 2002-2017, OpenNebula Project, OpenNebula Systems                */
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
  var OpenNebulaImage = require('opennebula/image');
  var OpenNebulaError = require('opennebula/error');
  var DomDataTable = require('utils/dom-datatable');
  var Notifier = require('utils/notifier');
  var UniqueId = require('utils/unique-id');
  var Humanize = require('utils/humanize');
  var VCenterCommon = require('./vcenter-common');

  var TemplateHTML = require('hbs!./common/html');
  var RowTemplate = require('hbs!./images/row');
  var EmptyFieldsetHTML = require('hbs!./common/empty-fieldset');
  var FieldsetTableHTML = require('hbs!./common/fieldset-table');

  function VCenterImages() {
    return this;
  }

  VCenterImages.prototype = {
    'html': VCenterCommon.html,
    'insert': _fillVCenterImages,
    'import': _import
  };
  VCenterImages.prototype.constructor = VCenterImages;

  return VCenterImages;

  /*
    Retrieve the list of images from a vCenter DS and fill
    the container with them

    opts = {
      datacenter: "Datacenter Name",
      cluster: "Cluster Name",
      container: Jquery div to inject the html,
      vcenter_user: vCenter Username,
      vcenter_password: vCenter Password,
      vcenter_host: vCenter Host,
      vcenter_datastore: vCenter datastore
    }
   */
  function _fillVCenterImages(opts) {
    var path = '/vcenter/images/' + opts.vcenter_datastore;

    var context = $(".vcenter_import", opts.container);
    context.html(TemplateHTML({}));
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
      success: function(response) {
        $(".vcenter_datacenter_list", context).html("");
        var content;
        if (response.length == 0) {
          content = EmptyFieldsetHTML({
            title : opts.vcenter_datastore + ' ' + Locale.tr("Datastore"),
            message : Locale.tr("No new images found in this datastore")
          });

          $(".vcenter_datacenter_list", context).append(content);
        } else {
          var tableId = "vcenter_import_table_" + UniqueId.id();
          content = FieldsetTableHTML({
            tableId : tableId,
            title : opts.vcenter_datastore + ' ' + Locale.tr("Datastore"),
            clearImported : Locale.tr("Clear Imported Images"),
            toggleAdvanced : false,
            columns : [
              '<input type="checkbox" class="check_all"/>',
              Locale.tr("Path"),
              Locale.tr("Size"),
              Locale.tr("Type"),
              ""
            ]
          });

          var newdiv = $(content).appendTo($(".vcenter_datacenter_list", context));
          var tbody = $('#' + tableId + ' tbody', context);

          $.each(response, function(id, element) {
            var opts = { name: element.path, size: element.size, type: element.type };
            var trow = $(RowTemplate(opts)).appendTo(tbody);

            $(".check_item", trow).data("datastore_id", element.dsid);
            $(".check_item", trow).data("one_template", element.one);
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
                  //"ordering": false,
                  "aoColumnDefs": [
                    {"bSortable": false, "aTargets": [0,2,3]},
                    {"bSortable": true, "aTargets": [1]},
                    {"sWidth": "35px", "aTargets": [0]},
                  ]
                }
              });

          elementsTable.initialize();

          $("a.vcenter-table-select-all").text(Locale.tr("Select all %1$s Images", response.length));

          VCenterCommon.setupTable({
            context : newdiv,
            allSelected : Locale.tr("All %1$s Images selected."),
            selected: Locale.tr("%1$s Images selected.")
          });

          context.off('click', '.clear_imported');
          context.on('click', '.clear_imported', function() {
              _fillVCenterImages(opts);
              return false;
            });
        }
      },
      error: function(response) {
        context.hide();
        Notifier.onError({}, OpenNebulaError(response));
      }
    });
  }

  function _import(context) {
    $.each($("table.vcenter_import_table", context), function() {
      $.each($(this).DataTable().$(".check_item:checked"), function() {
        var row_context = $(this).closest("tr");

        VCenterCommon.importLoading({context : row_context});

        var image_json = {
          "image": {
            "image_raw": $(this).data("one_template")
          },
          "ds_id" : $(this).data("datastore_id")
        };

        OpenNebulaImage.create({
          timeout: true,
          data: image_json,
          success: function(request, response) {
            VCenterCommon.importSuccess({
              context : row_context,
              message : Locale.tr("Image created successfully. ID: %1$s", response.IMAGE.ID)
            });
          },
          error: function (request, error_json) {
            var error_message_str = error_json.error.message

            if(error_message_str=="[ImageAllocate] Not enough space in datastore"){
              error_message_str =  error_message_str + ". "+
                Locale.tr("Please disable DATASTORE_CAPACITY_CHECK in /etc/one/oned.conf and restart OpenNebula");
            }

            VCenterCommon.importFailure({
              context : row_context,
              message : (error_message_str || Locale.tr("Cannot contact server: is it running and reachable?"))
            });
          }
        });
      });
    });
  }
});
