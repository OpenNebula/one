/* -------------------------------------------------------------------------- */
/* Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                */
/*                                                                            */
/* Licensed under the Apache License, Version 2.0 (the "License"); you may    */
/* not use this file except in compliance with the License. You may obtain    */
/* a copy of the License at                                                   */
/*                                                                            */
/* http://www.apache.org/licenses/LICENSE-2.0                                 */
/*                                                                            */
/* Unless required by applicable law or agreed to in writing, software        */
/* distributed under the License is distributed on an "AS IS" BASIS,          */
/* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.   */
/* See the License for the specific language governing permissions and        */
/* limitations under the License.                                             */
/* -------------------------------------------------------------------------- */

define(function(require) {
  var Sunstone = require("sunstone");
  var Navigation = require("utils/navigation");
  var Notifier = require("utils/notifier");

  /*
    CONSTRUCTOR
   */

  function CommonActions(openNebulaResource, resourceStr, tabId, xmlRoot, createdStr) {
    this.openNebulaResource = openNebulaResource;
    this.tabId = tabId;
    this.resourceStr = resourceStr;
    this.xmlRoot = xmlRoot;
    this.createdStr = createdStr;
  }

  CommonActions.prototype.list = _list;
  CommonActions.prototype.show = _show;
  CommonActions.prototype.refresh = _refresh;
  CommonActions.prototype.delWithoutRedirect = _delWithoutRedirect;
  CommonActions.prototype.del = _del;
  CommonActions.prototype.multipleAction = _multipleAction;
  CommonActions.prototype.singleAction = _singleAction;
  CommonActions.prototype.create = _create;
  CommonActions.prototype.showCreate = _showCreate;
  CommonActions.prototype.showUpdate = _showUpdate;
  CommonActions.prototype.checkAndShow = _checkAndShow;
  CommonActions.prototype.checkAndShowUpdate = _checkAndShowUpdate;
  CommonActions.prototype.update = _update;
  CommonActions.prototype.updateTemplate = _updateTemplate;
  CommonActions.prototype.appendTemplate = _appendTemplate;

  return CommonActions;

  function _list() {
    var that = this;
    return {
      type: "list",
      call: that.openNebulaResource.list,
      callback: function(request, response) {
        var datatable = Sunstone.getDataTable(that.tabId);
        if (datatable){
          datatable.updateView(request, response);
        }
      },
      error: Notifier.onError
    };
  }

  function _show() {
    var that = this;
    return {
      type: "single",
      call: that.openNebulaResource.show,
      callback: function(request, response) {
        if(that && that.tabId && Sunstone && Sunstone.getDataTable && Sunstone.getDataTable(that.tabId)){
          Sunstone.getDataTable(that.tabId).updateElement(request, response);
          if (Sunstone.rightInfoVisible($("#" + that.tabId))) {
            Sunstone.insertPanels(that.tabId, response);
          }
        }
      },
      error: Notifier.onError
    };
  }

  function _refresh() {
    var that = this;
    return {
      type: "custom",
      call: function() {
        var tab = $("#" + that.tabId);
        if (Sunstone.rightInfoVisible(tab)) {
          Sunstone.runAction(that.resourceStr + ".show", Sunstone.rightInfoResourceId(tab));
        } else {
          Sunstone.getDataTable(that.tabId).waitingNodes();
          Sunstone.runAction(that.resourceStr + ".list", {force: true});
        }
      },
      error: Notifier.onError
    };
  }

  function _del() {
    var that = this;
    return {
      type: "multiple",
      call : that.openNebulaResource.del,
      callback : function() {
        if (Sunstone.getTab() == that.tabId) {
          Sunstone.showTab(that.tabId);
        }
      },
      elements: function(opts) {
        return Sunstone.getDataTable(that.tabId).elements(opts);
      },
      error: Notifier.onError,
      notify: true
    };
  }

  function _delWithoutRedirect() {
    var that = this;
    return {
      type: "multiple",
      call : that.openNebulaResource.del,
      callback : function(request, response) {
        var tab = $("#" + that.tabId);
        if (Sunstone.getTab() == that.tabId) {
          Sunstone.showTab(that.tabId);
        }
      },
      elements: function(opts) {
        return Sunstone.getDataTable(that.tabId).elements(opts);
      },
      error: function(req, res){
        Notifier.notifyError(res && res.error && res.error.message);
      },
      notify: true
    };
  }

  function _multipleAction(actionStr, notify) {
    notify_bool = true;
    if(notify != undefined){
      notify_bool = notify;
    }
    var that = this;
    return {
      type: "multiple",
      call: that.openNebulaResource[actionStr],
      callback: function (req) {
        Sunstone.runAction(that.resourceStr + ".show", req.request.data[0]);
      },
      elements: function(opts) {
        return Sunstone.getDataTable(that.tabId).elements(opts);
      },
      error: Notifier.onError,
      notify: notify_bool
    };
  }

  function _singleAction(actionStr) {
    var that = this;
    return {
      type: "single",
      call: that.openNebulaResource[actionStr],
      callback: function (req) {
        Sunstone.runAction(that.resourceStr + ".show", req.request.data[0]);
      },
      elements: function(opts) {
        return Sunstone.getDataTable(that.tabId).elements(opts);
      },
      error: Notifier.onError,
      notify: true
    };
  }

  function _create(formPanelId) {
    var that = this;
    return {
      type: "create",
      call: that.openNebulaResource.create,
      callback : function(_, response) {
        Sunstone.resetFormPanel(that.tabId, formPanelId);
        Sunstone.hideFormPanel(that.tabId);
        that.refresh();

        if (response[that.xmlRoot].ID != undefined){
          Notifier.notifyCustom(that.createdStr,
            Navigation.link(" ID: " + response[that.xmlRoot].ID, that.tabId, response[that.xmlRoot].ID),
            false);
        }else{
          Notifier.notifyCustom(that.createdStr, "", false);
        }
      },
      error: function(request, response) {
        Sunstone.hideFormPanelLoading(that.tabId);
        Notifier.onError(request, response);
      },
      notify: false
    };
  }

  function _showCreate(formPanelId) {
    var that = this;
    return {
      type: "custom",
      call: function() {
        Sunstone.showFormPanel(that.tabId, formPanelId, "create");
      }
    };
  }

  function _showUpdate(formPanelId) {
    var that = this;
    return {
      type: "single",
      call: that.openNebulaResource.show,
      callback: function(_, response) {
        Sunstone.showFormPanel(that.tabId, formPanelId, "update",
          function(formPanelInstance, context) {
            if (that.xmlRoot) {
              formPanelInstance.fill(context, response[that.xmlRoot]);

            } else {
              formPanelInstance.fill(context, response);
            }
          });
      },
      error: Notifier.onError
    };
  }

  function _checkAndShowUpdate() {
    var that = this;
    return {
      type: "single",
      call: function() {
        var selectedNodes = Sunstone.getDataTable(that.tabId).elements();
        if (selectedNodes.length != 1) {
          Notifier.notifyMessage(Locale.tr("Please select one (and just one) resource to update."));
          return false;
        }

        var resourceId = "" + selectedNodes[0];
        window.ServiceId = resourceId;
        Sunstone.runAction(that.resourceStr + ".show_to_update", resourceId);
      }
    };
  }

  function _checkAndShow(action) {
    var that = this;
    return {
      type: "single",
      call: function() {
        var selectedNodes = Sunstone.getDataTable(that.tabId).elements();
        if (selectedNodes.length != 1) {
          Notifier.notifyMessage(Locale.tr("Please select one (and just one) resource to update."));
          return false;
        }

        var resourceId = "" + selectedNodes[0];
        Sunstone.runAction(that.resourceStr + "." + action, resourceId);
      }
    };
  }

  function _update() {
    var that = this;
    return {
      type: "single",
      call: that.openNebulaResource.update,
      callback: function() {
        Sunstone.hideFormPanel(that.tabId);
      },
      error: function(request, response){
        Sunstone.hideFormPanelLoading(that.tabId);
        Notifier.onError(request, response);
      }
    };
  }

  function _updateTemplate() {
    var that = this;
    return {
      type: "single",
      call: that.openNebulaResource.update,
      callback: function(request) {
        Sunstone.runAction(that.resourceStr + ".show", request.request.data[0]);
      },
      error: Notifier.onError
    };
  }

  function _appendTemplate() {
    var that = this;
    return {
      type: "single",
      call: that.openNebulaResource.append,
      callback: function(request) {
        Sunstone.runAction(that.resourceStr + ".show", request.request.data[0]);
      },
      error: Notifier.onError
    };
  }
});
