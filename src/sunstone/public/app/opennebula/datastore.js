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
  var OpenNebulaAction = require('./action');
  var Config = require('sunstone-config');
  var OpenNebulaHelper = require('./helper');
  var Locale = require('utils/locale');

  var RESOURCE = "DATASTORE";
  var STATES_STR = [
    Locale.tr("ON"),
    Locale.tr("OFF")];

  var TYPES_STR = [
    Locale.tr("IMAGE"),
    Locale.tr("SYSTEM"),
    Locale.tr("FILE"),
    Locale.tr("BACKUP")
  ];

  var STATES = {
    READY     : 0,
    DISABLED  : 1
  };

  var TYPES = {
    IMAGE_DS  : 0,
    SYSTEM_DS : 1,
    FILE_DS   : 2,
    BACKUP_DS : 3
  };

  var dsMadIndex = {};

  var Datastore = {
    "resource": RESOURCE,
    "stateStr": function(stateId) {
      return STATES_STR[stateId];
    },
    "STATES": STATES,
    "typeStr": function(typeId) {
      return TYPES_STR[typeId];
    },
    "TYPES": TYPES,
    "create" : function(params) {
      OpenNebulaAction.create(params, RESOURCE);
    },
    "del" : function(params) {
      OpenNebulaAction.del(params, RESOURCE);
    },
    "list" : function(params) {
      if (params.options === undefined){
        params.options = { force: true };
      }
      OpenNebulaAction.list(params, RESOURCE, null, function(response) {
        var list = OpenNebulaHelper.pool(RESOURCE, response);

        dsMadIndex = {};

        $.each(list, function(){
          dsMadIndex[ this[RESOURCE].ID ] = this[RESOURCE].DS_MAD;
        });

        return list;
      });
    },
    "list_in_zone" : function(params) {
      OpenNebulaAction.list_in_zone(params, RESOURCE);
    },
    "show" : function(params) {
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
    "update" : function(params) {
      var action_obj = {"template_raw" : params.data.extra_param};
      OpenNebulaAction.simple_action(params, RESOURCE, "update", action_obj);
    },
    "append": function(params) {
      var action_obj = {"template_raw" : params.data.extra_param, append : true};
      OpenNebulaAction.simple_action(params, RESOURCE, "update", action_obj);
    },
    "rename" : function(params) {
      var action_obj = params.data.extra_param;
      OpenNebulaAction.simple_action(params, RESOURCE, "rename", action_obj);
    },
    "enable": function(params) {
      OpenNebulaAction.simple_action(params, RESOURCE, "enable");
    },
    "disable": function(params) {
      OpenNebulaAction.simple_action(params, RESOURCE, "disable");
    },
    "getName": function(id){
      return OpenNebulaAction.getName(id, RESOURCE);
    },
    "isMarketExportSupported": function(id){
      var name = dsMadIndex[id];

      if(name == undefined){
        // When in doubt, allow the action and let oned return failure
        return true;
      }

      var support = false;

      $.each(Config.onedConf.DS_MAD_CONF, function(){
        if (this.NAME === name){
          support = (this.MARKETPLACE_ACTIONS != undefined &&
                     this.MARKETPLACE_ACTIONS.split(',').includes("export"));
          return false; //break
        }
      });

      return support;
    },
    "initMarketExportSupported": function(){
      var pool_filter = Config.isChangedFilter()? -4 : -2;

      this.list({
        data : { pool_filter : pool_filter },
        timeout: true,
        success: function() {}
      });
    }
  }

  return Datastore;
})
