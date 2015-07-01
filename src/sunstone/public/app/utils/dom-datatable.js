define(function(require) {
  /*
    DEPENDENCIES
   */

  var TabDataTable = require('utils/tab-datatable');
  var SunstoneConfig = require('sunstone-config');
  var Locale = require('utils/locale');

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
