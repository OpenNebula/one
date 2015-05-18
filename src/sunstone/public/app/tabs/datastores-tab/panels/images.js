define(function(require){
  /*
    DEPENDENCIES
   */
  
  var Locale = require('utils/locale');
  var ImagesTable = require('tabs/images-tab/datatable');
  
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
    this.imagesDataTable = new ImagesTable(IMAGES_TABLE_ID, {info: true});

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
    return this.imagesDataTable.dataTableHTML;
  }

  function _setup(context) {
    this.imagesDataTable.initialize();
    this.imagesDataTable.filter(this.element.NAME, ImagesTable.COLUMN_IDS.DATASTORE);
    this.imagesDataTable.list();

    return false;
  }
})