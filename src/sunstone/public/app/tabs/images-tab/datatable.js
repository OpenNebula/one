define(function(require) {
  /*
    DEPENDENCIES
   */

  var TabDataTable = require('utils/tab-datatable');
  var SunstoneConfig = require('sunstone-config');
  var Locale = require('utils/locale');
  var Humanize = require('utils/humanize');
  var Notifier = require('utils/notifier');
  var OpenNebulaImage = require('opennebula/image');

  /*
    CONSTANTS
   */

  var RESOURCE = "Image"
  var XML_ROOT = "IMAGE"
  var TAB_NAME = require('./tabId');
  var COLUMN_IDS = {
    "DATASTORE": 5
  }
  /*
    CONSTRUCTOR
   */

  function Table(dataTableId, conf) {
    this.conf = conf || {};
    this.tabId = TAB_NAME;
    this.dataTableId = dataTableId;
    this.resource = RESOURCE;
    this.xmlRoot = XML_ROOT;

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
    }

    this.columns = [
      Locale.tr("ID"),
      Locale.tr("Owner"),
      Locale.tr("Group"),
      Locale.tr("Name"),
      Locale.tr("Datastore"),
      Locale.tr("Size"),
      Locale.tr("Type"),
      Locale.tr("Registration time"),
      Locale.tr("Persistent"),
      Locale.tr("Status"),
      Locale.tr("#VMS"),
      Locale.tr("Target"),
    ]

    this.selectOptions = {
      "id_index": 1,
      "name_index": 4,
      "uname_index": 2,
      "select_resource": Locale.tr("Please select an image from the list"),
      "you_selected": Locale.tr("You selected the following image:"),
      "select_resource_multiple": Locale.tr("Please select one or more images from the list"),
      "you_selected_multiple": Locale.tr("You selected the following images:")
    };

    this.totalImages = 0;
    this.sizeImages = 0;

    TabDataTable.call(this);
  };

  Table.prototype = Object.create(TabDataTable.prototype);
  Table.prototype.constructor = Table;
  Table.prototype.elementArray = _elementArray;
  Table.prototype.preUpdateView = _preUpdateView;
  Table.prototype.postUpdateView = _postUpdateView;
  Table.COLUMN_IDS = COLUMN_IDS;

  return Table;

  /*
    FUNCTION DEFINITIONS
   */

  function _elementArray(element_json) {
    var element = element_json.IMAGE;

    if (element.TYPE == OpenNebulaImage.TYPES.KERNEL ||
        element.TYPE == OpenNebulaImage.TYPES.RAMDISK ||
        element.TYPE == OpenNebulaImage.TYPES.CONTEXT) {
      return false;
    }

    this.sizeImages = this.sizeImages + parseInt(element.SIZE);
    this.totalImages++;

    return [
      '<input class="check_item" type="checkbox" id="image_' + element.ID + '" name="selected_items" value="' + element.ID + '"/>',
      element.ID,
      element.UNAME,
      element.GNAME,
      element.NAME,
      element.DATASTORE,
      element.SIZE,
      OpenNebulaImage.typeStr(element.TYPE),
      Humanize.prettyTime(element.REGTIME),
      parseInt(element.PERSISTENT) ? "yes" : "no",
      OpenNebulaImage.stateStr(element.STATE),
      element.RUNNING_VMS,
      element.TEMPLATE.TARGET ? element.TEMPLATE.TARGET : '--'
    ];
  }

  function _preUpdateView() {
    this.totalImages = 0;
    this.sizeImages = 0;
  }

  function _postUpdateView() {
    var size = Humanize.sizeFromMB(this.sizeImages);

    $(".total_images").text(this.totalImages);
    $(".size_images").text(size);
  }
});
