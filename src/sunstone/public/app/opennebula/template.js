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
  var OpenNebulaAction = require("./action");
  var Config = require("sunstone-config");

  var RESOURCE = "VMTEMPLATE";
  window.lastInfoVmTemplate = {};

  var Template = {
    "resource": RESOURCE,
    "setLastResource": function(info={}){
      var data = {};
      if(info && info.data){
        data.data = info.data;
        window.lastInfoVmTemplate = data;
      }
    },
    "create" : function(params) {
      OpenNebulaAction.create(params, RESOURCE);
    },
    "del" : function(params) {
      var action_obj = params.data.extra_param;
      OpenNebulaAction.del(params, RESOURCE, action_obj);
    },
    "delete_recursive": function(params) {
      var action_obj = {"recursive": true};
      OpenNebulaAction.simple_action(params, RESOURCE, "delete_recursive", action_obj);
    },
    "list" : function(params) {
      OpenNebulaAction.list(params, RESOURCE);
    },
    "show" : function(params) {
      Template.setLastResource(params);
      OpenNebulaAction.show(params, RESOURCE);
    },
    "chown" : function(params) {
      OpenNebulaAction.chown(params, RESOURCE);
    },
    "chgrp" : function(params) {
      OpenNebulaAction.chgrp(params, RESOURCE);
    },
    "chmod" : function(params) {
      var action_obj = params.data.extra_param;
      OpenNebulaAction.simple_action(params, RESOURCE, "chmod", action_obj);
    },
    "append": function(params) {
      var action_obj = {"template_raw" : params.data.extra_param, append : true};
      OpenNebulaAction.simple_action(params, RESOURCE, "update", action_obj);
    },
    "update" : function(params) {
      var action_obj = {"template_raw" : params.data.extra_param};
      OpenNebulaAction.simple_action(params, RESOURCE, "update", action_obj);
    },
    "publish" : function(params) {
      OpenNebulaAction.simple_action(params, RESOURCE, "publish");
    },
    "unpublish" : function(params) {
      OpenNebulaAction.simple_action(params, RESOURCE, "unpublish");
    },
    "instantiate" : function(params) {
      var action_obj = params.data.extra_param ? params.data.extra_param : {};
      OpenNebulaAction.simple_action(params, RESOURCE, "instantiate", action_obj);
    },
    "instantiate_persistent" : function(params) {
      var action_obj = params.data.extra_param ? params.data.extra_param : {};
      action_obj["persistent"] = true;
      OpenNebulaAction.simple_action(params, RESOURCE, "instantiate", action_obj);
    },
    "clone" : function(params) {
      var name = params.data.extra_param ? params.data.extra_param : "";
      var action_obj = {"name" : name};
      OpenNebulaAction.simple_action(params, RESOURCE, "clone", action_obj);
    },
    "clone_recursive": function(params) {
      var name = params.data.extra_param ? params.data.extra_param : "";
      var action_obj = {"name" : name, "recursive" : true};
      OpenNebulaAction.simple_action(params, RESOURCE, "clone", action_obj);
    },
    "rename" : function(params) {
      var action_obj = params.data.extra_param;
      OpenNebulaAction.simple_action(params, RESOURCE, "rename", action_obj);
    },
    "getName": function(id){
      return OpenNebulaAction.getName(id, RESOURCE);
    },
    "isNetworkChangeEnabled": function(template) {
      if (template.VMTEMPLATE.TEMPLATE.SUNSTONE &&
          template.VMTEMPLATE.TEMPLATE.SUNSTONE.NETWORK_SELECT == "NO") {
        return false;
      } else {
        return true;
      }
    },
    "lock" : function(params) {
      OpenNebulaAction.lock(params, RESOURCE);
    },
    "unlock" : function(params) {
      OpenNebulaAction.simple_action(params, RESOURCE, "unlock");
    },
    "cost": function(template) {
      var cost = 0;
      var capacity = template.VMTEMPLATE.TEMPLATE;

      var cpuCost    = capacity.CPU_COST;
      var memoryCost = capacity.MEMORY_COST;
      var memoryUnitCost = capacity.MEMORY_UNIT_COST;
      var diskCost   = capacity.DISK_COST;

      if (cpuCost == undefined){
        cpuCost = Config.onedConf.DEFAULT_COST.CPU_COST;
      }

      if (memoryCost == undefined){
        memoryCost = Config.onedConf.DEFAULT_COST.MEMORY_COST;
      }

      if (diskCost == undefined){
        diskCost = Config.onedConf.DEFAULT_COST.DISK_COST;
      }

      if (capacity.CPU) {
        cost += capacity.CPU * cpuCost;
      }

      if (capacity.MEMORY) {
        if (memoryUnitCost === "GB"){
          cost += (capacity.MEMORY / 1024) * memoryCost;
        } else {
          cost += capacity.MEMORY * memoryCost;
        }
      }

      if (diskCost != 0) {
        var template_disk = capacity.DISK;
        var disks = [];
        if (Array.isArray(template_disk)) {
          disks = template_disk;
        } else if (!$.isEmptyObject(template_disk)) {
          disks = [template_disk];
        }

        $.each(disks, function(i, disk){
          if (disk.SIZE) {
            cost += diskCost * (disk.SIZE / 1024);
          }

          if (disk.DISK_SNAPSHOT_TOTAL_SIZE) {
            cost += diskCost * disk.DISK_SNAPSHOT_TOTAL_SIZE;
          }
        });
      }

      return cost;
    }
  };

  return Template;
});
