define(function(require) {
  /*
    DEPENDENCIES
   */
  
  var Locale = require('utils/locale');
  var Config = require('sunstone-config');
  var Sunstone = require('sunstone');
  var OpenNebulaVM = require('opennebula/vm');
  var Notifier = require('utils/notifier');
  var Graphs = require('utils/graphs');

  /*
    TEMPLATES
   */
  
  var TemplateInfo = require('hbs!./capacity/html');

  /*
    CONSTANTS
   */
  
  var TAB_ID = require('../tabId');
  var PANEL_ID = require('./capacity/panelId');
  var RESIZE_DIALOG_ID = require('../dialogs/resize/dialogId');
  var RESOURCE = "VM"
  var XML_ROOT = "VM"
  // If VM is not INIT, PENDING, HOLD, FAILED, POWEROFF, UNDEPLOYED,
  var RESIZE_STATES = ["0", "1", "2", "7", "8", "9"];

  /*
    CONSTRUCTOR
   */

  function Panel(info) {
    this.panelId = PANEL_ID;
    this.title = Locale.tr("Capacity");
    this.icon = "fa-laptop";

    this.element = info[XML_ROOT];

    return this;
  };

  Panel.PANEL_ID = PANEL_ID;
  Panel.prototype.html = _html;
  Panel.prototype.setup = _setup;
  Panel.prototype.onShow = _onShow;

  return Panel;

  /*
    FUNCTION DEFINITIONS
   */

  function _html() {
    var resizeStateEnabled = (RESIZE_STATES.indexOf(this.element.STATE) > -1)

    return TemplateInfo({
      'element': this.element,
      'resizeStateEnabled': resizeStateEnabled
    });
  }

  function _setup(context) {
    var that = this;
    if (Config.isTabActionEnabled("vms-tab", "VM.resize")) {
      context.off('click', '#resize_capacity');
      context.on('click', '#resize_capacity', function() {
        var dialog = Sunstone.getDialog(RESIZE_DIALOG_ID);
        dialog.setElement(that.element);
        dialog.show();
        return false;
      });
    }
  }

  function _onShow(context) {
    OpenNebulaVM.monitor({
      data: {
        id: this.element.ID, 
        monitor: {
          monitor_resources : "CPU,MEMORY"
        }
      },
      success: function(req, response) {
        var vmGraphs = [
          {
            monitor_resources : "CPU",
            labels : Locale.tr("Real CPU"),
            humanize_figures : false,
            div_graph : $(".vm_cpu_graph")
          },
          {
            monitor_resources : "MEMORY",
            labels : Locale.tr("Real MEM"),
            humanize_figures : true,
            div_graph : $(".vm_memory_graph")
          }
        ];

        for (var i = 0; i < vmGraphs.length; i++) {
          Graphs.plot(response, vmGraphs[i]);
        }
      },
      error: Notifier.onError
    });
  }
});
