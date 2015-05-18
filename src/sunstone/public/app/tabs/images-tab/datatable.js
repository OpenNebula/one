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
  var XML_ROOT = "Image"
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
          {"sWidth": "250px", "aTargets": [5]},
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
      "you_selected": Locale.tr("You selected the following image:")
    };

    TabDataTable.call(this);
  };

  Table.prototype = Object.create(TabDataTable.prototype);
  Table.prototype.constructor = Table;
  Table.prototype.elementArray = _elementArray;
  Table.COLUMN_IDS = COLUMN_IDS;

  return Table;

  // TODO Check if update_fn must be overwritten
  /*
    "update_fn": function(datatable){
        OpenNebula.Image.list({
            timeout: true,
            success: function (request, resource_list){
                var list_array = [];

                $.each(resource_list,function(){
                    var image = this.IMAGE;

                    // KERNEL || RAMDISK || CONTEXT
                    var add = ( image.TYPE != "3" &&
                                image.TYPE != "4" &&
                                image.TYPE != "5" )

                    if(add && opts.filter_fn){
                        add = opts.filter_fn(this.IMAGE);
                    }

                    if(add){
                        list_array.push(imageElementArray(this));
                    }
                });

                updateView(list_array, datatable);
            },
            error: onError
        });
    },
   */

  /*
    FUNCTION DEFINITIONS
   */
  
  function _elementArray(element_json) {
    var element = element_json.IMAGE;

    // KERNEL || RAMDISK || CONTEXT
    if (element.TYPE == "3" ||  element.TYPE == "4" || element.TYPE == "5") {
      return false;
    }

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
});
