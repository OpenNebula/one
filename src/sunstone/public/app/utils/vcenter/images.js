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
  var OpenNebulaImage = require('opennebula/image');
  var OpenNebulaError = require('opennebula/error');
  var DomDataTable = require('utils/dom-datatable');
  var Notifier = require('utils/notifier');

  var TemplateHTML = require('hbs!./images/html');

  function VCenterImages() {
    return this;
  }

  VCenterImages.prototype = {
    'html': _html,
    'insert': _fillVCenterImages,
    'import': _import
  };
  VCenterImages.prototype.constructor = VCenterImages;

  return VCenterImages;

  function _html() {
    return '<div class="vcenter_images hidden"></div>';
  }

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

    var context = $(".vcenter_images", opts.container);
    context.html(TemplateHTML({}));
    context.show();

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
      success: function(response) {
        $(".content", context).html("");

        if (response.length == 0) {
          content = 
            '<fieldset>' +
              '<legend>' +
                '<ul class="menu simple">' +
                  '<li> ' +
                    opts.vcenter_datastore + ' ' + Locale.tr("Datastore") +
                  '</li>' +
                  '<li>' +
                    '<span>' +
                      Locale.tr("No new images found in this datastore") +
                    '</span>' +
                  '</li>' +
                '</ul>' +
              '</legend>' +
            '</fieldset>';

          $(".content", context).append(content);
        } else {
          var tableId = "vcenter_image_table_" + opts.vcenter_datastore;
          content = 
            '<fieldset>' +
              '<legend>' +
                '<ul class="menu simple">' +
                  '<li> ' +
                    opts.vcenter_datastore + ' ' + Locale.tr("Datastore") +
                  '</li>' +
                  '<li> ' +
                    '<label class="inline">' +
                      '<input type="checkbox" class="check_all" checked/>' +
                      Locale.tr("Select All") +
                    '</label>' +
                  '</li>' +
                  '<li> ' +
                    '<button class="button small success import_selected">' +
                       Locale.tr("Import Selected Images") +
                    '</button>' +
                  '</li>' +
                  '<li> ' +
                    '<button class="button small secondary clear_imported">' +
                       Locale.tr("Clear Imported Images") +
                    '</button>' +
                  '</li>' +
                '</ul>' +
              '</legend>' +
              '<div class="row">' +
                '<div class="large-12 columns">' +
                  '<table class="dataTable vcenter_image_table" id="' + tableId + '">' +
                    '<thead>' +
                      '<th class="check">' +
                        '<input type="checkbox" class="check_all"/>' +
                      '</th>' +
                      '<th>' + Locale.tr("Name") + '</th>' +
                      '<th>' + Locale.tr("Size") + '</th>' +
                      '<th/>' +
                      '<th/>' +
                    '</thead>' +
                    '<tbody/>' +
                  '</table>' +
                '</div>' +
              '</div>';
          '</fieldset>';

          var newdiv = $(content).appendTo($(".content", context));
          var tbody = $('#' + tableId + ' tbody', context);

          $.each(response, function(id, image) {
              var trow = $(
                '<tr class="vcenter_image">' +
                  '<td><input type="checkbox" class="check_item" checked/></td>' +
                  '<td>' + image.name + '</td>' +
                  '<td>' + image.size + ' MB</td>' +
                  '<td><div class="vcenter_image_response"/></td>' +
                  '<td><div class="vcenter_image_result"/></td>' +
                '</tr>').appendTo(tbody);

              $(".check_item", trow).data("datastore_id", image.dsid)
              $(".check_item", trow).data("one_template", image.one)
            
            });

          var imageDataTable = new DomDataTable(
            'vcenter_image_table_' + opts.vcenter_datastore,
              {
                actions: false,
                info: false,
                dataTableOptions: {
                  "bAutoWidth": false,
                  "bSortClasses" : false,
                  "bDeferRender": false,
                  "ordering": false,
                  "aoColumnDefs": [
                  ]
                }
              });

          imageDataTable.initialize();

          newdiv.on("change", '.check_all', function() {
              var table = $(this).closest('table');
              if ($(this).is(":checked")) { //check all
                $('tbody input.check_item', table).prop('checked', true).change();
              } else { //uncheck all
                $('tbody input.check_item', table).prop('checked', false).change();
              }
            });

          $('table', newdiv).on('draw.dt', function() {
              _recountCheckboxes(this);
            });

          $(".check_item", newdiv).on('change', function() {
              _recountCheckboxes($('table', newdiv));
            });

          context.off('click', '.import_selected');
          context.on('click', '.import_selected', function() {
              tableContext = $(this).closest('fieldset');
              _import(tableContext);
              return false;
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

  function _recountCheckboxes(table) {
    var total_length = $('input.check_item', table).length;
    var checked_length = $('input.check_item:checked', table).length;
    $('.check_all', table).prop('checked', (total_length == checked_length));
  }

  function _import(context) {
    $.each($("table.vcenter_image_table", context), function() {
      $.each($(this).DataTable().$(".check_item:checked"), function() {
        var image_context = $(this).closest(".vcenter_image");

        $(".vcenter_image_result:not(.success)", image_context).html(
            '<span class="fa-stack" style="color: #dfdfdf">' +
              '<i class="fa fa-cloud fa-stack-2x"></i>' +
              '<i class="fa  fa-spinner fa-spin fa-stack-1x fa-inverse"></i>' +
            '</span>');

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
            $(".vcenter_image_result", image_context).addClass("success").html(
                '<span class="fa-stack" style="color: #dfdfdf">' +
                  '<i class="fa fa-cloud fa-stack-2x"></i>' +
                  '<i class="fa  fa-check fa-stack-1x fa-inverse"></i>' +
                '</span>');

            $(".vcenter_image_result", image_context).html('<p style="font-size:12px" class="running-color">' +
                  Locale.tr("Image created successfully") + ' ID:' + response.IMAGE.ID +
                '</p>');
          },
          error: function (request, error_json) {
            $(".vcenter_image_result", image_context).html('<span class="fa-stack" style="color: #dfdfdf">' +
                  '<i class="fa fa-cloud fa-stack-2x"></i>' +
                  '<i class="fa  fa-warning fa-stack-1x fa-inverse"></i>' +
                '</span>');

            $(".vcenter_image_result", image_context).html('<p style="font-size:12px" class="error-color">' +
                  (error_json.error.message || Locale.tr("Cannot contact server: is it running and reachable?")) +
                '</p>');
          }
        });
      });
    });
  }
});
