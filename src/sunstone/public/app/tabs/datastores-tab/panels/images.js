define(function(require){
  /*
    DEPENDENCIES
   */

  var Locale = require('utils/locale');
  var OpenNebulaDatastore = require('opennebula/datastore');
  var ImagesTable = require('tabs/images-tab/datatable');
  var FilesTable = require('tabs/files-tab/datatable');

  /*
    CONSTANTS
   */

  var PANEL_ID = require('./images/panelId');
  var IMAGES_TABLE_ID = PANEL_ID + "ImagesTable"
  var RESOURCE = "Datastore"

  /*
    CONSTRUCTOR
   */

  function Panel(info) {
    this.title = Locale.tr("Images");
    this.icon = "fa-upload";

    this.element = info[RESOURCE.toUpperCase()];

    return this;
  };

  Panel.PANEL_ID = PANEL_ID;
  Panel.prototype.html = _html;
  Panel.prototype.setup = _setup;

  return Panel;

  /*
    FUNCTION DEFINITIONS
   */

  function _html() {
    var imgs = [];

    if (this.element.IMAGES.ID != undefined){
      imgs = this.element.IMAGES.ID;

      if (!$.isArray(imgs)){
        imgs = [imgs];
      }
    }

    var opts = {
      info: true,
      select: true,
      selectOptions: {
        read_only: true,
        fixed_ids: imgs
      }
    };

    if (this.element.TYPE == OpenNebulaDatastore.TYPES.FILE_DS){
      this.imagesDataTable = new FilesTable(IMAGES_TABLE_ID, opts);
    } else {
      this.imagesDataTable = new ImagesTable(IMAGES_TABLE_ID, opts);
    }

    return this.imagesDataTable.dataTableHTML;
  }

  function _setup(context) {
    this.imagesDataTable.initialize();
    this.imagesDataTable.refreshResourceTableSelect();

    return false;
  }
})