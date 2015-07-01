define(function(require) {
  require('jquery');

  // Clone the local config object in a private var
  var _config = $.extend(true, {}, config);

  var Config = {
    'isTabEnabled': function(tabName) {
      var enabled = _config['view']['enabled_tabs'][tabName];
      return enabled;
    },

    "isTabActionEnabled": function(tabName, actionName, panelName) {
      var enabled = false;
      var configTab = _config['view']['tabs'][tabName];

      if (configTab != undefined) {
        if (panelName) {
          enabled = configTab['panel_tabs_actions'][panelName][actionName];
        } else {
          enabled = configTab['actions'][actionName];
        }
      }

      return enabled;
    },

    "isTabPanelEnabled": function(tabName, panelTabName) {
      if (_config['view']['tabs'][tabName]) {
        var enabled = _config['view']['tabs'][tabName]['panel_tabs'][panelTabName];
        return enabled;
      } else {
        return false;
      }
    },

    "isFeatureEnabled": function(featureName) {
      if (_config['view']['features'] && _config['view']['features'][featureName]) {
        return true;
      } else {
        return false;
      }
    },

    "tabTableColumns": function(tabName) {
      if (!_config['view']['tabs'][tabName]) {
        return [];
      }

      var columns = _config['view']['tabs'][tabName]['table_columns'];

      if (columns) {
        return columns;
      } else {
        return [];
      }
    },

    "isTemplateCreationTabEnabled": function(templateTabName) {
      if (_config['view']['tabs']['templates-tab']) {
        var enabled = _config['view']['tabs']['templates-tab']['template_creation_tabs'][templateTabName];
        return enabled;
      } else {
        return false;
      }
    },

    "dashboardWidgets": function(perRow) {
      if (!_config['view']['tabs']['dashboard-tab']) {
        return []
      }

      var widgets = _config['view']['tabs']['dashboard-tab'][perRow];

      if (widgets) {
        return widgets;
      } else {
        return [];
      }
    },

    "tableOrder": function() {
      return _config['user_config']["table_order"];
    },

    "provision": {
      "dashboard": {
        "isEnabled": function(widget) {
          if (_config['view']['tabs']['provision-tab']) {
            var enabled = _config['view']['tabs']['provision-tab']['dashboard'][widget];
            return enabled;
          } else {
            return false;
          }
        }
      },
      "create_vm": {
        "isEnabled": function(widget) {
          if (_config['view']['tabs']['provision-tab'] && _config['view']['tabs']['provision-tab']["create_vm"]) {
            return _config['view']['tabs']['provision-tab']['create_vm'][widget];
          } else {
            return false;
          }
        }
      },
      "logo": (_config['view']["provision_logo"] || "images/one_small_logo.png")
    },

    'autoRefresh' : _config['view']['autorefresh'],
    'tableOrder': _config['user_config']['table_order'],
    'vncProxyPort': _config['system_config']['vnc_proxy_port'],
    'vncWSS': _config['user_config']['vnc_wss']
  }

  return Config;
});
