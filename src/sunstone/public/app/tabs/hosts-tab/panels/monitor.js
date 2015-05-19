define(function(require) {
  /*
    DEPENDENCIES
   */
  
  var OpenNebulaHost = require('opennebula/host');
  var Notifier = require('utils/notifier');
  var Locale = require('utils/locale');
  var Graphs = require('utils/graphs');

  /*
    TEMPLATES
   */
  
  var TemplateInfo = require('hbs!./monitor/html');

  /*
    CONSTANTS
   */
  
  var TAB_ID = require('../tabId');
  var PANEL_ID = require('./monitor/panelId');
  var RESOURCE = "Host"
  var XML_ROOT = "HOST"

  /*
    CONSTRUCTOR
   */

  function Panel(info) {
    var that = this;
    that.title = Locale.tr("Graphs");
    that.icon = "fa-bar-chart-o";
    that.element = info[XML_ROOT];

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
    return TemplateInfo();
  }

  function _setup(context) {
    OpenNebulaHost.monitor({
      data: {
        id: this.element.ID, 
        monitor: {
          monitor_resources : "HOST_SHARE/CPU_USAGE,HOST_SHARE/USED_CPU,HOST_SHARE/MAX_CPU,HOST_SHARE/MEM_USAGE,HOST_SHARE/USED_MEM,HOST_SHARE/MAX_MEM"
        }
      },
      success: function(req, response) {
        var host_graphs = [
            {
              monitor_resources : "HOST_SHARE/CPU_USAGE,HOST_SHARE/USED_CPU,HOST_SHARE/MAX_CPU",
              labels : Locale.tr("Allocated") + "," + Locale.tr("Real") + "," + Locale.tr("Total"),
              humanize_figures : false,
              div_graph : $("#host_cpu_graph"),
              div_legend : $("#host_cpu_legend")
            },
            {
              monitor_resources : "HOST_SHARE/MEM_USAGE,HOST_SHARE/USED_MEM,HOST_SHARE/MAX_MEM",
              labels : Locale.tr("Allocated") + "," + Locale.tr("Real") + "," + Locale.tr("Total"),
              humanize_figures : true,
              div_graph : $("#host_mem_graph"),
              div_legend : $("#host_mem_legend")
            }
            ];

        for (var i = 0; i < host_graphs.length; i++) {
          Graphs.plot(response, host_graphs[i]);
        }
      },
      error: Notifier.onError
    });

    return false;
  }
});
