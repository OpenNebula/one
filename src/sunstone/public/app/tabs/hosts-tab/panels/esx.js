define(function(require) {
  /*
    DEPENDENCIES
   */
  
  require('foundation-datatables');
  var Locale = require('utils/locale');
  var CPUBars = require('../utils/cpu-bars');
  var MemoryBars = require('../utils/memory-bars');

  /*
    TEMPLATES
   */
  
  var TemplateESX = require('hbs!./esx/html');
  
  /*
    CONSTANTS
   */

  var PANEL_ID = require('./esx/panelId');
  var RESOURCE = "Host"

  /*
    CONSTRUCTOR
   */

  function Panel(info) {
    this.title = Locale.tr("ESX");
    this.icon = "fa-hdd-o";

    this.element = info[RESOURCE.toUpperCase()];

    // Do not create an instance of this panel if no vcenter hypervisor
    if (this.element.TEMPLATE.HYPERVISOR != "vcenter") {
      throw "Panel not available for this element";
    }

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
    return TemplateESX();
  }

  function _setup(context) {
    var that = this;
    var dataTableESX = $("#datatable_host_esx", context).dataTable({
          "bSortClasses" : false,
          "bDeferRender": true
    });

    var hostListArray = [];

    if (that.element.TEMPLATE.HOST) {
      if (!(that.element.TEMPLATE.HOST instanceof Array)) {
        that.element.TEMPLATE.HOST = [that.element.TEMPLATE.HOST];
      }

      if (that.element.TEMPLATE.HOST instanceof Array) {
        $.each(that.element.TEMPLATE.HOST, function(){
          var cpuBars = CPUBars.html(this.element);
          var memoryBars = MemoryBars.html(this.element);

          hostListArray.push([
              this.HOSTNAME,
              this.STATE,
              cpuBars.real,
              memoryBars.real
          ]);
        });
      }

      dataTableESX.fnAddData(hostListArray);
      delete that.element.TEMPLATE.HOST;
    }
  }
})
