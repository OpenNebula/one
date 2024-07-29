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
    TEMPLATES
   */

  var TemplateResourcePoolTable = require('hbs!./resource-pool-table/html');
  var TemplateResourcePoolCard = require('hbs!./resource-pool-cards/html');

  /*
    FUNCTION DEFINITIONS
   */

    var _html = function(element) {
        var vCenterResourcePoolInfo = element.TEMPLATE['VCENTER_RESOURCE_POOL_INFO']

        if (Array.isArray(vCenterResourcePoolInfo))
            this.resourcePoolItems = vCenterResourcePoolInfo;
        else if (!$.isEmptyObject(vCenterResourcePoolInfo))
            this.resourcePoolItems = [vCenterResourcePoolInfo];
        else
            return "";

        var resourcePoolCards = [];
        this.resourcePoolItems.forEach(function(value){
            var propertyArray = [];
            for (var key in value) {
                if (key !== "NAME" && value.hasOwnProperty(key)) {
                    propertyArray.push({
                        'key': key,
                        'value': value[key]
                    })
                }
            }

            resourcePoolCards.push({
                'resourcePoolName': value["NAME"],
                'resourcePoolTable': TemplateResourcePoolTable({
                    'resourcePool': propertyArray
                })
            });
        });
        return TemplateResourcePoolCard({'resourcePools': resourcePoolCards});
    }

    return {
        'html': _html
    }
})
