define(function(require) {
  /*
    DEPENDENCIES
   */

  var Locale = require('utils/locale');
  var DomDataTable = require('utils/dom-datatable');

  /*
    TEMPLATES
   */

  var TemplateHTML = require('hbs!./pci/html');

  /*
    CONSTANTS
   */

  var TAB_ID = require('../tabId');
  var PANEL_ID = require('./pci/panelId');
  var RESOURCE = "Host"
  var XML_ROOT = "HOST"

  /*
    CONSTRUCTOR
   */

  function Panel(info) {
    this.title = Locale.tr("PCI");
    this.icon = "fa-list-ul";

    this.element = info[XML_ROOT];

    this.panelId = PANEL_ID;

    // Do not create an instance of this panel if no pci devices are found
    if (this.element.HOST_SHARE.PCI_DEVICES.PCI == undefined) {
      throw "Panel not available for this element";
    }

    return this;
  }

  Panel.PANEL_ID = PANEL_ID;
  Panel.prototype.html = _html;
  Panel.prototype.setup = _setup;

  return Panel;

  /*
    FUNCTION DEFINITIONS
   */

  function _html() {
    if(this.element.HOST_SHARE &&
       this.element.HOST_SHARE.PCI_DEVICES &&
       this.element.HOST_SHARE.PCI_DEVICES.PCI){

      $.each(this.element.HOST_SHARE.PCI_DEVICES.PCI, function(){
        if(this.VMID == "-1"){
          this.VMID = "";
        }
      });
    }

    return TemplateHTML({
      'element': this.element,
      'panelId': this.panelId
    });
  }

  function _setup(context) {
    this.pciDataTable = new DomDataTable(
      'datatable_pci_'+this.panelId,
      {
        actions: false,
        info: false,
        dataTableOptions: {
          "bAutoWidth": false,
          "bSortClasses" : false,
          "bDeferRender": true,
          "ordering": false,
          "aoColumnDefs": [
          ]
        }
      });

    this.pciDataTable.initialize();

    return false;
  }
});
