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

  var TemplateClusterTr = require('hbs!./cluster-tr/html');
  var ResourceSelect = require('utils/resource-select');
  var Sunstone = require('sunstone');

  /*
    Generate the tr HTML with the name of the resource and an edit icon
    @param {String} resourceType Resource type (i.e: Zone, Host, Image...)
    @param {String} resourceName Name of the resource
    @returns {String} HTML row
   */
  var _html = function(clusterName) {
    var renameTrHTML = TemplateClusterTr({
      'clusterName': (clusterName.length ? clusterName : '-')
    })

    return renameTrHTML;
  };

  /*
    Initialize the row, clicking the edit icon will add an input to edit the name
    @param {String} resourceType Resource type (i.e: Zone, Host, Image...)
    @param {String} resourceId ID of the resource
    @param {jQuery Object} context Selector including the tr
   */
  var _setup = function(resourceType, resourceId, clusterId, context) {
    context.off("click", "#div_edit_chg_cluster_link");
    context.on("click", "#div_edit_chg_cluster_link", function() {
      var tr_context = $(this).parents("tr");
      ResourceSelect.insert({
          context: $('.value_td_cluster', context),
          resourceName: 'Cluster',
          initValue: clusterId
        });
    });

    context.on("change", ".value_td_cluster .resource_list_select", function() {
      var newClusterId = $(this).val();
      if (newClusterId != "") {
        Sunstone.runAction(resourceType + ".addtocluster", [resourceId], newClusterId);
      }
    });

    return false;
  }

  return {
    'html': _html,
    'setup': _setup
  }
});
