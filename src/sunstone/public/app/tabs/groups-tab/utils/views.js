/* -------------------------------------------------------------------------- */
/* Copyright 2002-2018, OpenNebula Project, OpenNebula Systems                */
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
      description : Locale.tr("Exposes a complete view of the cloud, allowing administrators and advanced users full control of any physical or virtual resource."),
      preview: "advanced_layout.png"
    },
    cloud : {
      name: 'Cloud Layout',
      description : Locale.tr("Simplified version of the cloud allowing group admins and cloud end-users to manage any virtual resource."),
      preview: "cloud_layout.png"
    },
    vcenter : {
      name: 'vCenter Layout',
      description : Locale.tr("Set of views to present valid operations over a vCenter infrastructure"),
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
      description: Locale.tr("Full control of the cloud, including virtual and physical resources."),
      type: "advanced"
    },
    user : {
      id: 'user',
      name: "User",
      description: Locale.tr("Users are not able to manage hosts and clusters, although they will be able to create new Images or Virtual Machines."),
      type: "advanced"
    },
    groupadmin : {
      id: 'groupadmin',
      name: "Group Admin",
      description: Locale.tr("Control of all the resources belonging to a group, with the ability to create new users within the group."),
      type: "cloud"
    },
    cloud : {
      id: 'cloud',
      name: "Cloud",
      description: Locale.tr("Simplified view mainly where users can provision new Virtual Machines easily from pre-defined Templates."),
      type: "cloud"
    },
    admin_vcenter : {
      id: 'admin_vcenter',
      name: "Admin vCenter",
      description: Locale.tr("View designed to present the valid operations over a vCenter infrastructure to a cloud administrator"),
      type: "vcenter"
    },
    groupadmin_vcenter : {
      id: 'groupadmin_vcenter',
      name: "Group Admin vCenter",
      description: Locale.tr("View designed to present the valid operations over a vCenter infrastructure to a group administrator"),
      type: "vcenter"
    },
    cloud_vcenter : {
      id: 'cloud_vcenter',
      name: "Cloud vCenter",
      description: Locale.tr("View designed to present the valid operations over a vCenter infrastructure to a cloud consumer"),
      type: "vcenter"
    }
  };

  return {
    'info': _views_info,
    'types': _view_types
  };

});
