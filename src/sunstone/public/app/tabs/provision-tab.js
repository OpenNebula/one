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
    require("datatables.net");
    require("datatables.foundation");
    var Notifier = require("utils/notifier");
    var OpenNebula = require("opennebula");
    var ProvisionDashboard = require("./provision-tab/dashboard/dashboard");
    var ProvisionFlows = require("./provision-tab/flows/flows");
    var ProvisionFlowsList = require("./provision-tab/flows/list");
    var ProvisionTemplatesList = require("./provision-tab/templates/list");
    var ProvisionVms = require("./provision-tab/vms/vms");

    // Templates
    var TemplateContent = require("hbs!./provision-tab/content");

    // Constants
    var TAB_ID = require("./provision-tab/tabId");

    var povision_actions = {
      "Provision.Flow.instantiate" : {
        type: "single",
        call: OpenNebula.ServiceTemplate.instantiate,
        callback: function(){
          OpenNebula.Action.clear_cache("SERVICE");
          ProvisionFlowsList.show(0);
          var context = $("#provision_create_flow");
          $("#flow_name", context).val("");
          $(".total_cost_div", context).hide();
          $(".provision-pricing-table", context).removeClass("selected");
        },
        error: Notifier.onError
      },
      "Provision.instantiate" : {
        type: "single",
        call: OpenNebula.Template.instantiate,
        callback: function(){
          ProvisionVms.clearVMCreate();
        },
        error: Notifier.onError
      },
      "Provision.instantiate_persistent" : {
        type: "single",
        call: OpenNebula.Template.instantiate_persistent,
        callback: function(){
          ProvisionVms.clearVMCreate();
        },
        error: Notifier.onError
      }
    };

    var _panels = [
      require("./vms-tab/panels/info"),
      require("./vms-tab/panels/capacity"),
      require("./vms-tab/panels/storage"),
      require("./vms-tab/panels/network"),
      require("./vms-tab/panels/snapshots"),
      require("./vms-tab/panels/placement"),
      require("./vms-tab/panels/actions"),
      require("./vms-tab/panels/conf"),
      require("./vms-tab/panels/template"),
      require("./vms-tab/panels/log")
    ];
  
    var _dialogs = [
      require("./vms-tab/dialogs/resize"),
      require("./vms-tab/dialogs/disk-resize"),
      require("./vms-tab/dialogs/attach-disk"),
      require("./vms-tab/dialogs/disk-snapshot"),
      require("./vms-tab/dialogs/disk-saveas"),
      require("./vms-tab/dialogs/disk-snapshot-rename"),
      require("./vms-tab/dialogs/attach-nic"),
      require("./vms-tab/dialogs/attach-sg"),
      require("./vms-tab/dialogs/revert"),
      require("./vms-tab/dialogs/snapshot"),
      require("./users-tab/dialogs/login-token")
    ];

    var Actions = require("./vms-tab/actions");

    var Tab = {
      tabId: TAB_ID,
      list_header: "",
      actions: $.extend(povision_actions, Actions),
      content: TemplateContent(),
      setup: _setup,
      panels: _panels,
      dialogs: _dialogs
    };

    return Tab;

    function _setup() {
      $(document).ready(function() {
        if (Config.isTabEnabled(TAB_ID)) {
          $(".sunstone-content").addClass("large-centered small-centered");
          $("#footer").removeClass("right");
          $("#footer").addClass("large-centered small-centered");
          if (Config.isProvisionTabEnabled("provision-tab", "templates")) {
            ProvisionTemplatesList.generate($(".provision_templates_list_section"), {active: true});
          }
          // Dashboard
          ProvisionDashboard.setup();
          // Create VM
          ProvisionVms.setup();
          // Create FLOW
          ProvisionFlows.setup();
        }
      });
    }
});
