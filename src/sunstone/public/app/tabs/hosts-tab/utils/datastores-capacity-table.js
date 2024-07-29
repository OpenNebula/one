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

define(function(require){
  /*
    DEPENDENCIES
   */

  var DatastoreCapacityBar = require('tabs/datastores-tab/utils/datastore-capacity-bar');

  /*
    TEMPLATES
   */

  var TemplateDatastoresCapacityTable = require('hbs!./datastore-capacity-table/html');

  /*
    CONSTRUCTOR
   */

  return {
    'html': _html
  }

  /*
    FUNCTION DEFINITIONS
   */

  function _html(element) {
    var hostShare = element.HOST_SHARE;

    var datastores = []
    if (Array.isArray(hostShare.DATASTORES.DS))
      datastores = hostShare.DATASTORES.DS
    else if (!$.isEmptyObject(hostShare.DATASTORES.DS))
      datastores = [hostShare.DATASTORES.DS]
    else
      return "";

    var datastoreBars = [];
    $.each(datastores, function(index, value){
      datastoreBars.push({
        'datastoreId': value.ID,
        'datastoreBar': DatastoreCapacityBar.html(value)
      })
    });

    return TemplateDatastoresCapacityTable({'datastoreBars': datastoreBars});
  }
});
