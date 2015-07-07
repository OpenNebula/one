define(function(require) {
  /*
    DEPENDENCIES
   */

  var Locale = require('utils/locale');
  var Humanize = require('utils/humanize');

  /*
    CONSTANTS
   */

  var TAB_ID = require('../tabId');
  var PANEL_ID = require('./template/panelId');
  var RESOURCE = "VM"
  var XML_ROOT = "VM"

  /*
    CONSTRUCTOR
   */

  function Panel(info) {
    this.title = Locale.tr("Template");
    this.icon = "fa-file-o";

    this.element = info[XML_ROOT];

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
    return '<div class="row">'+
      '<div class="large-12 columns">'+
        '<table class="dataTable extended_table">'+
          '<thead>'+
            '<tr>'+
              '<th colspan="2">' + Locale.tr("Template") + '</th>'+
            '</tr>'+
          '</thead>'+
          '<tbody>'+
            Humanize.prettyPrintJSON(this.element.TEMPLATE) +
          '</tbody>'+
        '</table>'+
      '</div>'+
    '</div>'
  }

  function _setup(context) {
  }
});
