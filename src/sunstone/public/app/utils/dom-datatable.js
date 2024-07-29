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
  /*
    DEPENDENCIES
   */

  var TabDataTable = require('utils/tab-datatable');

  /*
    CONSTRUCTOR
   */

  /**
   * Generic datatable that uses the columns and row data from the html dom,
   * instead of .list and elementArray methods. Offers the same row check
   * and row info mechanism as TabDataTable
   * @param {string} dataTableId dataTable ID
   * @param {object} conf        Same as tab-datatable.js, plus:
   *                             - dataTableOptions: replaces the default dataTableOptions
   */
  function Table(dataTableId, conf) {
    this.conf = conf || {};
    this.dataTableId = dataTableId;

    this.dataTableOptions = conf.dataTableOptions || {
      "bAutoWidth": false,
      "bSortClasses" : false,
      "bDeferRender": true,
      "aoColumnDefs": [
          {"bSortable": false, "aTargets": ["check"]}
      ]
    };

    TabDataTable.call(this);
  }

  Table.prototype = Object.create(TabDataTable.prototype);
  Table.prototype.constructor = Table;

  return Table;
});
