define(function(require) {
  var Sunstone = require('sunstone');
  var Notifier = require('utils/notifier');
  var Locale = require('utils/locale');

  /*
    CONSTRUCTOR
   */

  function CommonActions(openNebulaResource, resourceStr, tabId) {
    this.openNebulaResource = openNebulaResource;
    this.tabId = tabId;
    this.resourceStr = resourceStr;
  }

  CommonActions.prototype.list = _list;
  CommonActions.prototype.show = _show;
  CommonActions.prototype.refresh = _refresh;
  CommonActions.prototype.delete = _delete;

  return CommonActions;

  function _list() {
    var that = this;
    return {
      type: "list",
      call: that.openNebulaResource.list,
      callback: function(request, response) {
        Sunstone.getDataTable(that.tabId).updateView(request, response);
      },
      error: Notifier.onError
    }
  }

  function _show() {
    var that = this;
    return {
      type: "single",
      call: that.openNebulaResource.show,
      callback: function(request, response) {
        Sunstone.getDataTable(that.tabId).updateElement(request, response);
        if (Sunstone.rightInfoVisible($('#' + that.tabId))) {
          Sunstone.insertPanels(that.tabId, response);
        }
      },
      error: Notifier.onError
    }
  }

  function _refresh() {
    var that = this;
    return {
      type: "custom",
      call: function() {
        var tab = $('#' + that.tabId);
        if (Sunstone.rightInfoVisible(tab)) {
          Sunstone.runAction(that.resourceStr + ".show", Sunstone.rightInfoResourceId(tab));
        } else {
          Sunstone.getDataTable(that.tabId).waitingNodes();
          Sunstone.runAction(that.resourceStr + ".list", {force: true});
        }
      },
      error: Notifier.onError
    }
  }

  function _delete() {
    var that = this;
    return {
      type: "multiple",
      call : that.openNebulaResource.del,
      callback : function(request, response) {
        Sunstone.getDataTable(that.tabId).deleteElement(request, response);
      },
      elements: function() {
        return Sunstone.getDataTable(that.tabId).elements();
      },
      error: Notifier.onError,
      notify: true
    }
  }
});
