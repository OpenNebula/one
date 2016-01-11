/* -------------------------------------------------------------------------- */
/* Copyright 2002-2015, OpenNebula Project, OpenNebula Systems                */
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
  require('jquery');
  var OpenNebulaSystem = require('opennebula/system');

  // Clone the local config object in a private var
  var _config = $.extend(true, {}, config);

  var _defaultCost = {
    cpuCost    : 0,
    memoryCost : 0,
    diskCost   : 0
  };

  var _dsMadConf = {};

  var Config = {
    'isTabEnabled': function(tabName) {
      var enabled = _config['view']['enabled_tabs'].indexOf(tabName) != -1;
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

    "isProvisionTabEnabled": function(tabName, panelTabName) {
      if (_config['view']['tabs'][tabName]) {
        if (_config['view']['tabs'][tabName]['provision_tabs']) {
          return _config['view']['tabs'][tabName]['provision_tabs'][panelTabName];
        } else {
          // if provision_tabs is not defined use panel_tabs.
          // This attribute was used in before 4.14, provision_tabs was include in 4.14.2
          return _config['view']['tabs'][tabName]['panel_tabs'][panelTabName];
        }
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
    'vncWSS': _config['user_config']['vnc_wss'],
    'requestVNCPassword': _config['system_config']['vnc_request_password'],
    'logo': (_config['view']["small_logo"] || "images/one_small_logo.png"),
    'vmLogos': (_config['vm_logos']),
    'enabledTabs': _config['view']['enabled_tabs'],
    "defaultCost" : _defaultCost,
    'dsMadConf' : _dsMadConf,
    "initOnedConf" : function() {
      OpenNebulaSystem.onedconf({
        data : {},
        timeout: true,
        success: function (request, onedconf){
          if (onedconf.DEFAULT_COST != undefined){
            if (onedconf.DEFAULT_COST.CPU_COST != undefined){
              _defaultCost.cpuCost = parseInt(onedconf.DEFAULT_COST.CPU_COST);
            }
            if (onedconf.DEFAULT_COST.MEMORY_COST != undefined){
              _defaultCost.memoryCost = parseInt(onedconf.DEFAULT_COST.MEMORY_COST);
            }
            if (onedconf.DEFAULT_COST.DISK_COST != undefined){
              _defaultCost.diskCost = parseInt(onedconf.DEFAULT_COST.DISK_COST);
            }
          }

          if (onedconf.DS_MAD_CONF != undefined){
            $.extend(true, _dsMadConf, onedconf.DS_MAD_CONF);
          }
        },
        error: function(request, error_json){
          console.error("There was an error requesting oned.conf: "+
                        error_json.error.message);
        }
      });
    }
  }

  return Config;
});
