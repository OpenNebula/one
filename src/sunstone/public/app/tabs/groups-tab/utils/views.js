/* -------------------------------------------------------------------------- */
/* Copyright 2002-2016, OpenNebula Project, OpenNebula Systems                */
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
  var Locale = require('utils/locale');

  var _view_types = {
    advanced : {
      name: 'Advanced Layout',
      description : Locale.tr("This layout exposes a complete view of the cloud, allowing administrators and advanced users to have full control of any physical or virtual resource of the cloud."),
      preview: "advanced_layout.png"
    },
    cloud : {
      name: 'Cloud Layout',
      description : Locale.tr("This layout exposes a simplified version of the cloud where group administrators and cloud end-users will be able to manage any virtual resource of the cloud, without taking care of the physical resources management."),
      preview: "cloud_layout.png"
    },
    vcenter : {
      name: 'vCenter Layout',
      description : Locale.tr("Set of views to present the valid operation against a vCenter infrastructure"),
      preview: "vcenter_layout.png"
    },
    other : {
      name: 'Other Layouts',
      description : '',
      preview: null
    }
  };

  var _views_info = {
    admin : {
      id: 'admin',
      name: "Admin",
      description: Locale.tr("This view provides full control of the cloud"),
      type: "advanced"
    },
    user : {
      id: 'user',
      name: "User",
      description: Locale.tr("In this view users will not be able to manage nor retrieve the hosts and clusters of the cloud. They will be able to see Datastores and Virtual Networks in order to use them when creating a new Image or Virtual Machine, but they will not be able to create new ones."),
      type: "advanced"
    },
    groupadmin : {
      id: 'groupadmin',
      name: "Group Admin",
      description: Locale.tr("This view provides control of all the resources belonging to a group, but with no access to resources outside that group, that is, restricted to the physical and virtual resources of the group. This view features the ability to create new users within the group as well as set and keep track of user quotas."),
      type: "cloud"
    },
    cloud : {
      id: 'cloud',
      name: "Cloud",
      description: Locale.tr("This is a simplified view mainly intended for user that just require a portal where they can provision new virtual machines easily from pre-defined Templates."),
      type: "cloud"
    },
    admin_vcenter : {
      id: 'admin_vcenter',
      name: "Admin vCenter",
      description: Locale.tr("View designed to present the valid operations against a vCenter infrastructure to a cloud administrator"),
      type: "vcenter"
    },
    groupadmin_vcenter : {
      id: 'groupadmin_vcenter',
      name: "Group Admin vCenter",
      description: Locale.tr("View designed to present the valid operations agaist a vCenter infrastructure to a group administrator"),
      type: "vcenter"
    },
    cloud_vcenter : {
      id: 'cloud_vcenter',
      name: "Cloud vCenter",
      description: Locale.tr("View designed to present the valid operations against a vCenter infrastructure to a cloud consumer"),
      type: "vcenter"
    }
  };

  return {
    'info': _views_info,
    'types': _view_types
  };

});
