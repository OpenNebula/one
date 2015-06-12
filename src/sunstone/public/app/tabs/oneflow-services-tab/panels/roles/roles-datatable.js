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
  
  function Table(dataTableId, conf) {
    this.conf = conf || {};
    //this.tabId = TAB_NAME;
    this.dataTableId = dataTableId;
    //this.resource = RESOURCE;
    //this.xmlRoot = XML_ROOT;

    // TODO: hide checkbox column


    this.dataTableOptions = {
      "bAutoWidth": false,
      "bSortClasses" : false,
      "bDeferRender": true,
      "aoColumnDefs": [
          {"bSortable": false, "aTargets": ["check"]},
          //{"bVisible": false, "aTargets": [0]}
          //{"bVisible": true, "aTargets": [1,2,3,4,5]},
          //{"bVisible": false, "aTargets": ['_all']}
      ]
    };

    //this.columns = [];
    //this.selectOptions = {};

    TabDataTable.call(this);
  }

  Table.prototype = Object.create(TabDataTable.prototype);
  Table.prototype.constructor = Table;
  //Table.prototype.elementArray = _elementArray;

  return Table;

  /*
    FUNCTION DEFINITIONS
   */

  //function _elementArray(element_json) {}
});
