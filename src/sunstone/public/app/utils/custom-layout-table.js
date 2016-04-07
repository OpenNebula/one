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
  /*
    DEPENDENCIES
   */

  require('datatables.net');
  require('datatables.foundation');

  /*
    CONSTRUCTOR
   */

  /**
   * Create a new table with custom layout for each row
   * @param {Object} opts - Options
   * @param {string} opts.tableId - Unique identifier for the table
   * @param {Array}  opts.columns  - List of properties that will be selected from the JSON data.
   *                               Properties that need to be filtered or ordered must be included 
   *                               in this list.
   * @param {Object} opts.preDrawCallback
   * @param {Object} opts.rowCallback
   */
  function Table(opts) {
    // Initialize
    this.table = $(opts.tableId).DataTable({
        columns:  _generateDataTableColumns(opts.columns),
        preDrawCallback: opts.preDrawCallback,
        rowCallback: opts.rowCallback
      });

    var tableContext = $(opts.tableId).closest('fieldset');

    tableContext.on("change", '.check_all', function() {
      if ($(this).is(":checked")) { //check all
        $('.check_item', tableContext).prop('checked', true).change();
      } else { //uncheck all
        $('.check_item', tableContext).prop('checked', false).change();
      }
    });

    tableContext.on("change", '.expand_all', function() {
      if ($(this).is(":checked")) { //check all
        $('.accordion_advanced_toggle:not(.active)',  tableContext).click();
      } else { //uncheck all
        $('.accordion_advanced_toggle.active',  tableContext).click();
      }
    });
  }

  Table.prototype.addData = _addData;

  return Table;

  /**
   * Add data to the table, the rows will be generated
   * @param {Array} data - Array with the information for each row
   */
  function _addData(data) {
    this.table.rows.add(data).draw();
  }

  /**
   * Generate the datatable columns from the properties array
   * @param {Array} columns - List of properties
   * @returns {Array} Datatable columns
   */
  function _generateDataTableColumns(columns) {
    var dtColumns = [];
    var arrayLength = columns.length;
    for (var i = 0; i < arrayLength; i++) {
      dtColumns.push({"data": columns[i]})
    }

    return dtColumns
  }
});
