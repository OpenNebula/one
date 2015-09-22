/* -------------------------------------------------------------------------- */
/* Copyright 2002-2015, OpenNebula Project (OpenNebula.org), C12G Labs        */
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
  var Sunstone = require('sunstone');
  var Notifier = require('utils/notifier');
  var Locale = require('utils/locale');

  /*
    CONSTRUCTOR
   */

  function CommonActions(openNebulaResource, resourceStr, tabId, xmlRoot) {
    this.openNebulaResource = openNebulaResource;
    this.tabId = tabId;
    this.resourceStr = resourceStr;
    this.xmlRoot = xmlRoot;
  }

  CommonActions.prototype.list = _list;
  CommonActions.prototype.show = _show;
  CommonActions.prototype.refresh = _refresh;
  CommonActions.prototype.del = _del;
  CommonActions.prototype.multipleAction = _multipleAction;
  CommonActions.prototype.singleAction = _singleAction;
  CommonActions.prototype.create = _create;
  CommonActions.prototype.showCreate = _showCreate;
  CommonActions.prototype.showUpdate = _showUpdate;
  CommonActions.prototype.checkAndShowUpdate = _checkAndShowUpdate;
  CommonActions.prototype.update = _update;
  CommonActions.prototype.updateTemplate = _updateTemplate;

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

  function _del() {
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

  function _multipleAction(actionStr) {
    var that = this;
    return {
      type: "multiple",
      call: that.openNebulaResource[actionStr],
      callback: function (req) {
        Sunstone.runAction(that.resourceStr + ".show", req.request.data[0]);
      },
      elements: function() {
        return Sunstone.getDataTable(that.tabId).elements();
      },
      error: Notifier.onError,
      notify: true
    }
  }

  function _singleAction(actionStr) {
    var that = this;
    return {
      type: "single",
      call: that.openNebulaResource[actionStr],
      callback: function (req) {
        Sunstone.runAction(that.resourceStr + ".show", req.request.data[0][0]);
      },
      elements: function() {
        return Sunstone.getDataTable(that.tabId).elements();
      },
      error: Notifier.onError,
      notify: true
    }
  }

  function _create(formPanelId) {
    var that = this;
    return {
      type: "create",
      call: that.openNebulaResource.create,
      callback : function(request, response) {
        Sunstone.resetFormPanel(that.tabId, formPanelId);
        Sunstone.hideFormPanel(that.tabId);
        Sunstone.getDataTable(that.tabId).addElement(request, response);
      },
      error: function(request, response) {
        Sunstone.hideFormPanelLoading(that.tabId);
        Notifier.onError(request, response);
      },
      notify: true
    }
  }

  function _showCreate(formPanelId) {
    var that = this;
    return {
      type: "custom",
      call: function() {
        Sunstone.showFormPanel(that.tabId, formPanelId, "create");
      }
    }
  }

  function _showUpdate(formPanelId) {
    var that = this;
    return {
      type: "single",
      call: that.openNebulaResource.show,
      callback: function(request, response) {
        Sunstone.showFormPanel(that.tabId, formPanelId, "update",
          function(formPanelInstance, context) {
            formPanelInstance.fill(context, response[that.xmlRoot]);
          });
      },
      error: Notifier.onError
    }
  }

  function _checkAndShowUpdate() {
    var that = this;
    return {
      type: "single",
      call: function() {
        var selected_nodes = Sunstone.getDataTable(that.tabId).elements();
        if (selected_nodes.length != 1) {
          Notifier.notifyMessage("Please select one (and just one) resource to update.");
          return false;
        }

        var resource_id = "" + selected_nodes[0];
        Sunstone.runAction(that.resourceStr + ".show_to_update", resource_id);
      }
    }
  }

  function _update() {
    var that = this;
    return {
      type: "single",
      call: that.openNebulaResource.update,
      callback: function(request, response){
        Sunstone.hideFormPanel(that.tabId);
      },
      error: function(request, response){
        Sunstone.hideFormPanelLoading(that.tabId);
        Notifier.onError(request, response);
      }
    }
  }

  function _updateTemplate() {
    var that = this;
    return {
      type: "single",
      call: that.openNebulaResource.update,
      callback: function(request) {
        Sunstone.runAction(that.resourceStr + '.show', request.request.data[0][0]);
      },
      error: Notifier.onError
    }
  }
});
