define(function(require) {
  /*
    DEPENDENCIES
   */

  var BasePanel = require('tabs/oneflow-services-tab/panels/roles');

  /*
    CONSTANTS
   */

  var PANEL_ID = require('./roles/panelId');

  /*
    CONSTRUCTOR
   */

  function Panel(info) {
    BasePanel.call(this, info);

    this.servicePanel = false;
    this.panelId = PANEL_ID;

    return this;
  }

  Panel.PANEL_ID = PANEL_ID;
  Panel.prototype = Object.create(BasePanel.prototype);
  Panel.prototype.constructor = Panel;

  return Panel;
});
