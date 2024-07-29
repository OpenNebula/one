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

  var Helper = require("./opennebula/helper"),
      Action = require("./opennebula/action"),
      Auth   = require("./opennebula/auth"),
      Error  = require("./opennebula/error"),

      Acl             = require("./opennebula/acl"),
      BackupJob       = require("./opennebula/backupjob"),
      Cluster         = require("./opennebula/cluster"),
      Datastore       = require("./opennebula/datastore"),
      Group           = require("./opennebula/group"),
      Host            = require("./opennebula/host"),
      Image           = require("./opennebula/image"),
      Network         = require("./opennebula/network"),
      VNTemplate      = require("./opennebula/vntemplate"),
      Role            = require("./opennebula/role"),
      securitygroup   = require("./opennebula/securitygroup"),
      Service         = require("./opennebula/service"),
      ServiceTemplate = require("./opennebula/servicetemplate"),
      Support         = require("./opennebula/support"),
      Template        = require("./opennebula/template"),
      User            = require("./opennebula/user"),
      Vdc             = require("./opennebula/vdc"),
      Vm              = require("./opennebula/vm"),
      VMGroup         = require("./opennebula/vmgroup"),
      Zone            = require("./opennebula/zone"),
      VirtualRouter   = require("./opennebula/virtualrouter");
      MarketPlace     = require("./opennebula/marketplace");
      MarketPlaceApp  = require("./opennebula/marketplaceapp");

  if (typeof(csrftoken) !== "undefined") {
    $.ajaxPrefilter(function(options, originalOptions, jqXHR) {
      var params = originalOptions.data;

      if (typeof(params) === "string") {
        params = JSON.parse(params);
        params["csrftoken"] = csrftoken;
        options.data = JSON.stringify(params);
      } else {
        params = params || {};
        params["csrftoken"] = csrftoken;
        options.data = $.param(params);
      }
    });
  }

  var OpenNebula = {
    "Helper": Helper,
    "Action": Action,
    "Auth": Auth,
    "Error": Error,
    "Acl": Acl,
    "Cluster": Cluster,
    "Datastore": Datastore,
    "Group": Group,
    "Host": Host,
    "Image": Image,
    "File": Image,
    "Backup": Image,
    "BackupJob": BackupJob,
    "Network": Network,
    "VNTemplate": VNTemplate,
    "Role": Role,
    "SecurityGroup": securitygroup,
    "Service": Service,
    "ServiceTemplate": ServiceTemplate,
    "Support": Support,
    "Template": Template,
    "VirtualRouterTemplate": Template,
    "User": User,
    "Vdc": Vdc,
    "VM": Vm,
    "VMGroup": VMGroup,
    "Zone": Zone,
    "VirtualRouter": VirtualRouter,
    "MarketPlace": MarketPlace,
    "MarketPlaceApp": MarketPlaceApp
  };

  return OpenNebula;
});
