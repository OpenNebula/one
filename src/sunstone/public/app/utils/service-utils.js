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
  var WizardFields = require("utils/wizard-fields");

  return {
    "getExtraInfo": _getExtraInfo
  };

  function _getExtraInfo(context, show_vnet_instantiate_flow) {
    var custom_attrs_values = WizardFields.retrieve(
      $("#instantiate_service_user_inputs .custom_attr_class", context)
    );

    var networks_json = WizardFields.retrieve($(".network_attrs_class", context));
    var typePrefix = "type_";

    var networks_values = Object.keys(networks_json).filter(function(key) {
      return key.indexOf(typePrefix) == 0; // get all networks names with prefix 'type_'
    }).reduce(function(networks, typeKey) {
      var type = networks_json[typeKey];
      var name = typeKey.replace(typePrefix, '');
      var id = networks_json[name]
      var extra = networks_json['extra_' + name];

      networks.push($.extend(true, {},{
        [name]: {
          [type]: id, // type configuration: id network/template
          extra: (extra && extra !== "") ? extra : undefined,
        },
      }));

      return networks;
    }, []);

    return {
      "merge_template": Object.assign(
        { custom_attrs_values, "roles": [] },
        show_vnet_instantiate_flow ? { networks_values } : null
      )
    };
  }
});
