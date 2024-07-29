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

  var TemplateHTML = require('hbs!./resources-tab/html');
  var ResourcesZone = require('./resources-zone');
  var Utils = require('./common');

  function ResourcesTab(unique_id_prefix) {
    this.unique_id_prefix = unique_id_prefix;
    this.zones = [];
  }

  ResourcesTab.prototype.constructor = ResourcesTab;
  ResourcesTab.prototype.html = _html;
  ResourcesTab.prototype.setup = _setup;
  ResourcesTab.prototype.onShow = _onShow;
  ResourcesTab.prototype.retrieve = _retrieve;
  ResourcesTab.prototype.retrieveIndexed = _retrieveIndexed;
  ResourcesTab.prototype.fill = _fill;
  ResourcesTab.prototype.addResourcesZone = _addResourcesZone;

  return ResourcesTab;

  function _html() {
    return TemplateHTML({});
  }

  function _onShow(context) {
    $.each(this.zones,function(i,resourcesZone){
      resourcesZone.onShow(context);
    });
  }

  function _setup(context) {
    var that = this;

    $("select.vdc_zones_select", context).change(function(){
      context.find(".vdc_zone_content").hide();
      $('div#'+that.unique_id_prefix+'_'+$(this).val()+'Tab', context).show();
    });

    $("select.vdc_zones_select", context)[0].selectedIndex = 0;
    $("select.vdc_zones_select", context).change();
  }

  /**
   * Returns the selected resources as needed by the Vdc.create call
   * @param  {objec} context jquery selector
   * @return {object}        Resources as:
   *                   {
   *                   "clusters" : {zone_id: zone_id, cluster_id: cluster_id},
   *                   "hosts" : {zone_id: zone_id, host_id: host_id}
   *                   "vnets" : {zone_id: zone_id, vnet_id: vnet_id}
   *                   "datastores" : {zone_id: zone_id, ds_id: ds_id}
   *                   }
   */
  function _retrieve(context) {
    var clusters    = [];
    var hosts       = [];
    var vnets       = [];
    var datastores  = [];

    $.each(this.zones,function(i,resourcesZone){
      var resources = resourcesZone.retrieve(context);
      var zone_id = resourcesZone.getZoneId();

      $.each(resources.clusters,function(j,cluster_id){
        clusters.push({zone_id: zone_id, cluster_id: cluster_id});
      });

      $.each(resources.hosts,function(j,host_id){
        hosts.push({zone_id: zone_id, host_id: host_id});
      });
      $.each(resources.vnets,function(j,vnet_id){
        vnets.push({zone_id: zone_id, vnet_id: vnet_id});
      });
      $.each(resources.datastores,function(j,ds_id){
        datastores.push({zone_id: zone_id, ds_id: ds_id});
      });
    });

    return {
      "clusters" : clusters,
      "hosts" : hosts,
      "vnets" : vnets,
      "datastores" : datastores
    };
  }

  function _retrieveIndexed(context) {
    var resources = {};

    $.each(this.zones,function(i,resourcesZone){
      resources[resourcesZone.getZoneId()] = resourcesZone.retrieve(context);
    });

    return resources;
  }

  function _fill(context, selectedResources){
    $.each(this.zones,function(i,resourcesZone){
      resourcesZone.fill(context, selectedResources);
    });
  }

  function _addResourcesZone(zone_id, zone_name, context, indexed_resources) {
    var unique_id = this.unique_id_prefix+'_'+zone_id;

    var resourcesZone = new ResourcesZone(unique_id, zone_id, zone_name, context, indexed_resources);

    // Append the new div containing the tab and add the tab to the list
    var html_tab_content =
      '<div id="'+unique_id+'Tab" class="vdc_zone_content">'+
        resourcesZone.html()+
      '</div>';

    $(html_tab_content).appendTo($(".vdc_zones_tabs_content", context));

    $("select.vdc_zones_select", context).append(
      '<option value="'+zone_id+'">'+zone_name+'</option>'
    );

    var zoneSection = $('#' +unique_id+'Tab', context);

    resourcesZone.setup(zoneSection);
    resourcesZone.onShow(zoneSection);

    this.zones.push(resourcesZone);
  }

});
