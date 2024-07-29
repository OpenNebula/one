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
  require("jquery");
  // Clone the local config object in a private var
  var _config = $.extend(true, {}, config);

  var inmutableTabs = ['official-support-tab', 'support-tab']

  function enabledTabs () {
    return _config["view"]["enabled_tabs"].concat(inmutableTabs)
  }

  function allTabs () {
    return Object.keys(_config["view"]["tabs"]).concat(inmutableTabs)
  }

  function isInmutableTab (tabName) {
    return inmutableTabs.indexOf(tabName) !== -1
  }

  var Config = {
    "isTabEnabled": function(tabName) {
      return enabledTabs().indexOf(tabName) !== -1
    },

    "changeFilter": function(bool) {
      _config["pool_filter"] = bool;
    },

    "isChangedFilter": function(){
      return _config["pool_filter"];
    },

    "isTabActionEnabled": function(tabName, actionName, panelName) {
      // exception with inmutable tabs
      if (isInmutableTab(tabName)) { return true }

      var enabled = false;
      var configTab = _config["view"]["tabs"][tabName];

      if (configTab != undefined) {
        if (panelName) {
          enabled = configTab["panel_tabs_actions"][panelName][actionName];
        } else {
          enabled = configTab["actions"][actionName];
        }
      }

      return enabled;
    },

    "isTabPanelEnabled": function(tabName, panelTabName) {
      // exception with inmutable tabs
      if (isInmutableTab(tabName)) { return true }

      if (_config["view"]["tabs"][tabName]) {
        var enabled = _config["view"]["tabs"][tabName]["panel_tabs"][panelTabName];
        return enabled;
      } else {
        return false;
      }
    },

    "isProvisionTabEnabled": function(tabName, panelTabName) {
      if (_config["view"]["tabs"][tabName]) {
        if (_config["view"]["tabs"][tabName]["provision_tabs"]) {
          return _config["view"]["tabs"][tabName]["provision_tabs"][panelTabName];
        } else {
          // if provision_tabs is not defined use panel_tabs.
          // This attribute was used in before 4.14, provision_tabs was include in 4.14.2
          return _config["view"]["tabs"][tabName]["panel_tabs"][panelTabName];
        }
      } else {
        return false;
      }
    },

    "isFeatureEnabled": function(featureName) {
      if (_config["view"]["features"] && _config["view"]["features"][featureName]) {
        return true;
      } else {
        return false;
      }
    },

    "isOneFeatureEnabled": function(feature1Name, feature2Name) {
      if (_config["view"]["features"]) {
        return _config["view"]["features"][feature1Name] || _config["view"]["features"][feature2Name];
      } else {
        return false;
      }
    },

    "isAdvancedEnabled": function(featureName) {
      if (_config["view"]["features"] && featureName in _config["view"]["features"]) {
        return _config["view"]["features"][featureName];
      } else {
        return true;
      }
    },

    "tabTableColumns": function(tabName) {
      if (!_config["view"]["tabs"][tabName]) {
        return [];
      }

      var columns = _config["view"]["tabs"][tabName]["table_columns"];

      if (columns) {
        return columns;
      } else {
        return [];
      }
    },

    "isTemplateCreationTabEnabled": function(tabName, wizardTabName) {
      var enabled = false;

      if (_config["view"]["tabs"][tabName] && _config["view"]["tabs"][tabName]["template_creation_tabs"]) {
        enabled = _config["view"]["tabs"][tabName]["template_creation_tabs"][wizardTabName];
      }

      return (enabled == true);
    },

    "dashboardWidgets": function(perRow) {
      if (!_config["view"]["tabs"]["dashboard-tab"]) {
        return [];
      }

      var widgets = _config["view"]["tabs"]["dashboard-tab"][perRow];

      if (widgets) {
        return widgets;
      } else {
        return [];
      }
    },

    "provision": {
      "dashboard": {
        "isEnabled": function(widget) {
          if (_config["view"]["tabs"]["provision-tab"]) {
            var enabled = _config["view"]["tabs"]["provision-tab"]["dashboard"][widget];
            return enabled;
          } else {
            return false;
          }
        }
      },
      "create_vm": {
        "isEnabled": function(widget) {
          if (_config["view"]["tabs"]["provision-tab"] && _config["view"]["tabs"]["provision-tab"]["create_vm"]) {
            return _config["view"]["tabs"]["provision-tab"]["create_vm"][widget];
          } else {
            return false;
          }
        }
      },
      "logo": (_config["view"]["provision_logo"] || "images/opennebula-5.0.png"),
    },

    "tableOrder": _config["user_config"]["table_order"],
    "vncProxyPort": _config["system_config"]["vnc_client_port"] || _config["system_config"]["vnc_proxy_port"].split(":")[1] || _config["system_config"]["vnc_proxy_port"],
    "vncWSS": _config["user_config"]["vnc_wss"],
    "requestVNCPassword": _config["system_config"]["vnc_request_password"],
    "logo": (_config["view"]["small_logo"] || "images/opennebula-5.0.png"),
    "link_logo": (_config["view"]["link_logo"] || false),
    "text_link_logo": (_config["view"]["text_link_logo"] || false),
    "vmLogos": (_config["vm_logos"]),
    "enabledTabs": enabledTabs(),
    "onedConf": _config["oned_conf"],
    "confirmVMActions": _config["view"]["confirm_vms"],
    "scaleFactor": _config["view"]["features"]["instantiate_cpu_factor"],
    "filterView": _config["view"]["filter-view"],
    "doCountAnimation": _config["view"]["do_count_animation"],

    "allTabs": allTabs,
    "thresholds":{
      "min":_config["user_config"]["threshold_min"],
      "low":_config["user_config"]["threshold_low"],
      "high":_config["user_config"]["threshold_high"]
    },
    "isExtendedVmInfo": _config["system_config"] && _config["system_config"]["get_extended_vm_info"] && _config["system_config"]["get_extended_vm_info"] === "true",
    "isExtendedVmMonitoring":
      _config["system_config"] &&
      _config["system_config"]["get_extended_vm_monitoring"] &&
      _config["system_config"]["get_extended_vm_monitoring"] === "true",
    "isLogEnabled": _config["zone_id"] === _config["id_own_federation"] ? true : false,
    "publicFireedgeEndpoint": _config["system_config"]["public_fireedge_endpoint"],
  };

  return Config;
});
