define(function(require) {
  /*
    DEPENDENCIES
   */

  var TabDataTable = require('utils/tab-datatable');
  var SunstoneConfig = require('sunstone-config');
  var Locale = require('utils/locale');

  /*
    CONSTANTS
   */

  var RESOURCE = "Marketplace";
  //var XML_ROOT = "";
  var TAB_NAME = require('./tabId');

  /*
    CONSTRUCTOR
   */

  function Table(dataTableId, conf) {
    this.conf = conf || {};
    this.tabId = TAB_NAME;
    this.dataTableId = dataTableId;
    this.resource = RESOURCE;
    //this.xmlRoot = XML_ROOT;

    this.dataTableOptions = {
      "bAutoWidth": false,
      "bSortClasses" : false,
      "bDeferRender": true,
      "aoColumnDefs": [
          {"bSortable": false, "aTargets": ["check"]},
          {"sWidth": "35px", "aTargets": [0]},
          {"bVisible": true, "aTargets": SunstoneConfig.tabTableColumns(TAB_NAME)},
          {"bVisible": false, "aTargets": ['_all']}
      ]
    };

    this.columns = [
      Locale.tr("ID"),
      Locale.tr("Name"),
      Locale.tr("Publisher"),
      Locale.tr("Hypervisor"),
      Locale.tr("Arch"),
      Locale.tr("Format"),
      Locale.tr("Tags")
    ];
    /*
    this.selectOptions = {
    };
    */
    TabDataTable.call(this);
  }

  Table.prototype = Object.create(TabDataTable.prototype);
  Table.prototype.constructor = Table;
  Table.prototype.elementArray = _elementArray;

  return Table;

  /*
    FUNCTION DEFINITIONS
   */

  function _elementArray(element) {
    var publisher   = '-';
    var hypervisor  = '-';
    var arch        = '-';
    var format      = '-';
    var tags        = '-';

    if(element.publisher != undefined){
      publisher = element.publisher;
    }

    if(element.files != undefined && element.files.length > 0){
      if(element.files[0]["hypervisor"] != undefined){
        hypervisor = element.files[0]["hypervisor"];
      }

      if(element.files[0]["os-arch"] != undefined){
        arch = element.files[0]["os-arch"];
      }

      if(element.files[0]["format"] != undefined){
        format = element.files[0]["format"];
      }
    }

    if(element.tags != undefined){
      tags = element.tags;
    }

    return [
        '<input class="check_item" type="checkbox" id="'+
                    RESOURCE.toLowerCase()+'_' +
                    element._id.$oid + '" name="selected_items" value="' +
                    element._id.$oid + '"/>',
        element._id.$oid,
        element.name,
        publisher,
        hypervisor,
        arch,
        format,
        tags
    ];
  }
});
