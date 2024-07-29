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
  /*
    This module insert a row with the name of the resource.
    The row can be edited and a rename action will be sent
   */

  var TemplateChangePriorityTr = require('hbs!./changePriority-tr/html');
  var Sunstone = require('sunstone');
  var Config = require('sunstone-config');

  var action = 'priority'

  /*
    Generate the tr HTML with the name of the resource and an edit icon
    @param {String} tabName
    @param {String} resourceType Resource type (i.e: BackupJobs)
    @param {String} resourceName Name of the resource
    @returns {String} HTML row
   */
  var _html = function(tabName, resourceType, resourceName) {
    var changePriorityTrHTML = TemplateChangePriorityTr({
      'resourceType': resourceType.toLowerCase(),
      'resourceName': resourceName,
      'tabName': tabName,
      'action': resourceType + '.' + action,
    });

    return changePriorityTrHTML;
  };

  /*
    Initialize the row, clicking the edit icon will add an input to edit the priority
    @param {String} tabName
    @param {String} resourceType Resource type (i.e: BackupJobs)
    @param {String} resourceId ID of the resource
    @param {jQuery Object} context Selector including the tr
   */
  var _setup = function(tabName, resourceType, resourceId, context) {
    if (Config.isTabActionEnabled(tabName, resourceType + '.' + action)) {
      context.off("click", "#div_edit_priority_link");
      context.on("click", "#div_edit_priority_link", function() {
        var valueStr = $(".value_td_priority", context).text();
        $(".value_td_priority", context).html('<input class="input_edit_value_priority" id="input_edit_priority" type="number" value="' + valueStr + '"/>');
      });

      context.off("change", ".input_edit_value_priority");
      context.on("change", ".input_edit_value_priority", function() {
        var valueStr = $(".input_edit_value_priority", context).val();
        var valueNumber = +valueStr
        if (!Number.isNaN(valueNumber)) {
          Sunstone.runAction(resourceType + "." + action, resourceId, valueNumber);
        }
      });
    }

    return false;
  }

  return {
    'html': _html,
    'setup': _setup
  }
});
