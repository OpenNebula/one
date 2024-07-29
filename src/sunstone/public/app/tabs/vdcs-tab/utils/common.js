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
    Common functions for VDCs
   */

  var VDC_ALL_RESOURCES = "-10";

  /**
    Return an object with the VDC resources indexed by zone_id.

       {   zone_id :
           {   clusters   : [],
               hosts      : [],
               vnets      : [],
               datastores : []
           }
       }
  */
  function _indexedVdcResources(vdc){
    var resources = {};

    var clusters_array = [];
    var hosts_array = [];
    var vnets_array = [];
    var datastores_array = [];

    if (vdc.CLUSTERS.CLUSTER){
      clusters_array = vdc.CLUSTERS.CLUSTER;

      if (!Array.isArray(clusters_array)){
        clusters_array = [clusters_array];
      }
    }

    if (vdc.HOSTS.HOST){
      hosts_array = vdc.HOSTS.HOST;

      if (!Array.isArray(hosts_array)){
        hosts_array = [hosts_array];
      }
    }

    if (vdc.VNETS.VNET){
      vnets_array = vdc.VNETS.VNET;

      if (!Array.isArray(vnets_array)){
        vnets_array = [vnets_array];
      }
    }

    if (vdc.DATASTORES.DATASTORE){
      datastores_array = vdc.DATASTORES.DATASTORE;

      if (!Array.isArray(datastores_array)){
        datastores_array = [datastores_array];
      }
    }

    function init_resources_zone(zone_id){
      if (resources[zone_id] == undefined){
        resources[zone_id] = {
          clusters   : [],
          hosts      : [],
          vnets      : [],
          datastores : []
        }
      }
    }

    $.each(clusters_array, function(i,e){
      init_resources_zone(e.ZONE_ID);
      resources[e.ZONE_ID].clusters.push(e.CLUSTER_ID);
    });

    $.each(hosts_array, function(i,e){
      init_resources_zone(e.ZONE_ID);
      resources[e.ZONE_ID].hosts.push(e.HOST_ID);
    });

    $.each(vnets_array, function(i,e){
      init_resources_zone(e.ZONE_ID);
      resources[e.ZONE_ID].vnets.push(e.VNET_ID);
    });

    $.each(datastores_array, function(i,e){
      init_resources_zone(e.ZONE_ID);
      resources[e.ZONE_ID].datastores.push(e.DATASTORE_ID);
    });

    return resources;
  }

  return {
    'indexedVdcResources': _indexedVdcResources,
    'VDC_ALL_RESOURCES': VDC_ALL_RESOURCES
  };
});
