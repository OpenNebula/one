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
  var sprintf = require("sprintf").sprintf
  var Notifier = require("utils/notifier");
  var Navigation = require('utils/navigation');

  function _html() {
    return '<div class="vcenter_import"></div>';
  }

  function _setupTable(opts){
    var table = $("table.vcenter_import_table", opts.context);
    opts.table = table;

    _recountCheckboxes(opts);

    opts.table.on("change", '.check_all', function() {
      if ($(this).is(":checked")) { //check all
        $('tbody input.check_item', opts.table).prop('checked', true).change();
      } else { //uncheck all
        $('tbody input.check_item', opts.table).prop('checked', false).change();
      }
    });

    opts.table.on('draw.dt', function() {
      _recountCheckboxes(opts);
    });

    opts.table.on('change', ".check_item", function() {
      _recountCheckboxes(opts);
    });

    $(".vcenter-table-select-all", opts.context).on("click", function(){
      table.DataTable().$(".check_item").prop("checked", true).change();
    });

    $(".vcenter-table-deselect-all", opts.context).on("click", function(){
      table.DataTable().$(".check_item").prop("checked", false).change();
    });

    $(".vcenter-table-toggle-advanced", opts.context).on("click", function(){
      var unactive_n = $(".accordion_advanced_toggle:not(.active)", opts.context).length;

      if (unactive_n > 0){
        $(".accordion_advanced_toggle:not(.active)", opts.context).click();
      } else {
        $(".accordion_advanced_toggle", opts.context).click();
      }
    });

    $(".vcenter-table-search", opts.context).on("input", function() {
      opts.table.dataTable().fnFilter($(this).val());
      return false;
    });
  }

  function _recountCheckboxes(opts) {
    // Counters for the whole table, all pages
    var dt = $(opts.table).DataTable();
    var total = dt.$(".check_item").length;
    var selected = dt.$(".check_item:checked").length;

    if (selected == total){
      $(".vcenter-table-header-text").text(sprintf(opts.allSelected, selected));

      $(".vcenter-table-header-text").show();
      $("a.vcenter-table-select-all").hide();
      $("a.vcenter-table-deselect-all").show();
    } else if (selected == 0){
      $(".vcenter-table-header-text").hide();
      $("a.vcenter-table-select-all").show();
      $("a.vcenter-table-deselect-all").hide();
    } else {
      $(".vcenter-table-header-text").text(sprintf(opts.selected, selected));

      $(".vcenter-table-header-text").show();
      $("a.vcenter-table-select-all").show();
      $("a.vcenter-table-deselect-all").hide();
    }

    // Counters for the current visible page
    var total_length = $('input.check_item', opts.table).length;
    var checked_length = $('input.check_item:checked', opts.table).length;
    $('.check_all', opts.table).prop('checked', (total_length == checked_length));
  }

  function _importLoading(opts) {
    $(".vcenter_import_result:not(.success)", opts.context).html(
      '<span class="fa-stack" style="color: #dfdfdf">' +
        '<i class="fas fa-cloud fa-stack-2x"></i>' +
        '<i class="fas fa-spinner fa-spin fa-stack-1x fa-inverse"></i>' +
      '</span>');

    $(".vcenter_import_result_row", opts.context).show();

    if(opts.message){
      $(".vcenter_import_response", opts.context).html(opts.message);
    }
  }

  function _importSuccess(opts) {
    $(".vcenter_import_result", opts.context).addClass("success").html(
      '<span class="fa-stack" style="color: #dfdfdf">' +
        '<i class="fas fa-cloud fa-stack-2x running-color"></i>' +
        '<i class="fas fa-check fa-stack-1x fa-inverse"></i>' +
      '</span>&nbsp&nbsp');

    $(".vcenter_import_response", opts.context).html(opts.message);
  }

  function _importFailure(opts) {
    $(".vcenter_import_result", opts.context).html(
      '<span class="fa-stack" style="color: #dfdfdf">' +
        '<i class="fas fa-cloud fa-stack-2x error-color"></i>' +
        '<i class="fas fa-exclamation fa-stack-1x fa-inverse"></i>' +
      '</span>&nbsp&nbsp');

    $(".vcenter_import_response", opts.context).addClass("error-color").html(
      opts.message);
  }

  function _jGrowlSuccess(opts){
    var success = opts.success;
    $.each(success, function(key, value){
      var rs1 = Navigation.link(value.id[0], opts.link_tab, value.id[0]);
      var rs2 = Navigation.link(value.id[1], opts.link_tab, value.id[1]);
      Notifier.notifyMessage(opts.resource + " " + value.name + " imported as " + rs1 + " " + rs2 + " successfully");
    });
  }

  function _jGrowlFailure(opts){
    var error = opts.error;
    $.each(error, function(key, value){
      id = Object.keys(value)[0];
      Notifier.notifyError(opts.resource + " with ref " + id + " could not be imported.\n"+ value[id]);
    });
  }

  return {
    'html': _html,
    'setupTable': _setupTable,
    'importLoading': _importLoading,
    'importSuccess': _importSuccess,
    'importFailure': _importFailure,
    'jGrowlSuccess': _jGrowlSuccess,
    'jGrowlFailure': _jGrowlFailure
  };
});
