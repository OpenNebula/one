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

  var TemplateHTML = require('hbs!./resources-zone/html');

  var ClustersTable = require('tabs/clusters-tab/datatable');
  var HostsTable = require('tabs/hosts-tab/datatable');
  var VNetsTable = require('tabs/vnets-tab/datatable');
  var DatastoresTable = require('tabs/datastores-tab/datatable');
  var Sunstone = require('sunstone');
  var Tips = require('utils/tips');
  var Utils = require('./common');

  var VDC_ALL_RESOURCES = Utils.VDC_ALL_RESOURCES;

  function ResourcesZone(unique_id, zone_id, zone_name, context, indexed_resources) {
    this.unique_id = unique_id;
    this.zone_id = zone_id;

    this.resources = undefined;
    if(indexed_resources != undefined && indexed_resources[zone_id] != undefined){
      this.resources = indexed_resources[zone_id];
    }
  }

  ResourcesZone.prototype.constructor = ResourcesZone;
  ResourcesZone.prototype.html = _html;
  ResourcesZone.prototype.setup = _setup;
  ResourcesZone.prototype.onShow = _onShow;
  ResourcesZone.prototype.retrieve = _retrieve;
  ResourcesZone.prototype.fill = _fill;
  ResourcesZone.prototype.getZoneId = _getZoneId;

  return ResourcesZone;

  function _getZoneId() {
    return this.zone_id;
  }

  function _html() {
    var that = this;

    var opts = {};

    $.each(["clusters", "hosts", "vnets", "datastores"], function(i,res_name){
      var existElement = function(position, internalPosition, id){
        var rtn = false;
        if(position && 
          internalPosition && 
          id && 
          window && 
          window.VDCInfo && 
          window.VDCInfo[position] &&  
          window.VDCInfo[position][internalPosition]
        ){
          var info = window.VDCInfo[position][internalPosition];
          var retn = {};
          if(Array.isArray(info) && 
            info.find(function(element){
              return element[internalPosition+"_ID"] === id;
            }))
          {
            retn = info.filter(function(el) { return el[internalPosition+"_ID"] !== id});
            rtn = true;
          }else if(info && info[internalPosition] && info[internalPosition+"_ID"] === id){
            rtn = true;
          }
          window.VDCInfo[position][internalPosition] = retn;
        }
        return rtn;
      };
      var clickAction = function(e){
        var element = $(this);
        var action = "Vdc.del_";
        var dataAction = {zone_id: that.zone_id};
        var id = element.attr("row_id");
        var pass = false;
        var actionName = "datastore";
        switch (res_name) {
          case "clusters":
            actionName = "cluster";
            action = action+actionName;
            dataAction.cluster_id = id;
            pass = existElement(res_name.toUpperCase(),actionName.toUpperCase(),id);
          break;
          case "hosts":
            actionName = "host";
            action = action+actionName;
            dataAction.host_id = id;
            pass = existElement(res_name.toUpperCase(),actionName.toUpperCase(),id);
          break;
          case "vnets":
            actionName = "vnet";
            action = action+actionName;
            dataAction.vnet_id = id;
            pass = existElement(res_name.toUpperCase(),actionName.toUpperCase(),id);
          break;
          default:
            action = action+actionName;
            dataAction.ds_id = id;
            pass = existElement(res_name.toUpperCase(),actionName.toUpperCase(),id);
          break;
        }
        if(window && window.VDCId && window.VDCInfo && pass){
          Sunstone.runAction(
            action,
            window.window.VDCId,
            dataAction
          );
        }
        element.parent().parent().siblings().find("table").find("tr").each(
          function(i,row){
            var tds = $(row).find("td");
            if(tds && $(tds[0]).text() === id){
              tds.removeClass("markrowchecked");
              $(tds[0]).parent().click();
            }
          }
        );
        element.remove();
      }

      if(that.resources != undefined){
        opts[res_name] = {
          info: true,
          select: true,
          selectOptions: {
            read_only: false,
            zone_id: that.zone_id,
            click: clickAction
          }
        };

        if (!(that.resources[res_name].length == 1 && that.resources[res_name][0] == VDC_ALL_RESOURCES)){
          opts[res_name].selectOptions.fixed_ids = that.resources[res_name];
        }
      } else {
        opts[res_name] = {
          info: false,
          select: true,
          selectOptions: {
            multiple_choice: true,
            zone_id: that.zone_id,
            click: clickAction
          }
        };
      }
    });

    that.clustersTable = new ClustersTable("vdc_clusters_"+that.unique_id, opts["clusters"]);
    that.hostsTable = new HostsTable("vdc_hosts_"+that.unique_id, opts["hosts"]);
    that.vnetsTable = new VNetsTable("vdc_vnets_"+that.unique_id, opts["vnets"]);
    that.datastoresTable = new DatastoresTable("vdc_datastores_"+that.unique_id, opts["datastores"]);

    return TemplateHTML({
      'unique_id': that.unique_id,
      'clustersTableHTML': that.clustersTable.dataTableHTML,
      'hostsTableHTML': that.hostsTable.dataTableHTML,
      'vnetsTableHTML': that.vnetsTable.dataTableHTML,
      'datastoresTableHTML': that.datastoresTable.dataTableHTML
    });
  }

  function _onShow(context) {
    var that = this;

    $.each([that.clustersTable, that.hostsTable,
            that.vnetsTable, that.datastoresTable], function(){

      this.refreshResourceTableSelect();
    });
  }

  function _setup(context){
    var that = this;

    Foundation.reflow(context, 'tabs');
    
    $.each(["clusters", "hosts", "vnets", "datastores"], function(i,res_name){
      if(that.resources != undefined){
        if (that.resources[res_name].length == 1 &&
            that.resources[res_name][0] == VDC_ALL_RESOURCES){

          $("#all_"+res_name+"_"+that.unique_id, context).prop("checked", "checked");
        }

        $("#all_"+res_name+"_"+that.unique_id, context).prop("disabled", true);
      }

      $("input[name='all_"+res_name+"_"+that.unique_id+"']", context).change(function(){
        if ($(this).prop("checked")){
          $("div.vdc_"+res_name+"_select", context).hide();
        } else {
          $("div.vdc_"+res_name+"_select", context).show();
        }
      });
    });

    $.each([that.clustersTable, that.hostsTable,
            that.vnetsTable, that.datastoresTable], function(){

      this.initialize();
    });

    Tips.setup(context);
  }

  /*
  Return an object with the selected VDC resources in the zone tab
      {   clusters   : [],
          hosts      : [],
          vnets      : [],
          datastores : []
      }
  */
  function _retrieve(context) {
    var clusters;
    var hosts;
    var vnets;
    var datastores;

    if ( $("input[name='all_clusters_"+this.unique_id+"']", context).prop("checked") ){
      clusters = [VDC_ALL_RESOURCES];
    } else {
      clusters = this.clustersTable.retrieveResourceTableSelect();
    }

    if ( $("input[name='all_hosts_"+this.unique_id+"']", context).prop("checked") ){
      hosts = [VDC_ALL_RESOURCES];
    } else {
      hosts = this.hostsTable.retrieveResourceTableSelect();
    }

    if ( $("input[name='all_vnets_"+this.unique_id+"']", context).prop("checked") ){
      vnets = [VDC_ALL_RESOURCES];
    } else {
      vnets = this.vnetsTable.retrieveResourceTableSelect();
    }

    if ( $("input[name='all_datastores_"+this.unique_id+"']", context).prop("checked") ){
      datastores = [VDC_ALL_RESOURCES];
    } else {
      datastores = this.datastoresTable.retrieveResourceTableSelect();
    }

    var resources = {
      clusters   : clusters,
      hosts      : hosts,
      vnets      : vnets,
      datastores : datastores
    };

    return resources;
  }

  function _fill(context, selectedResources){

    if (selectedResources[this.zone_id] == undefined){
      selectedResources[this.zone_id] = {
        clusters   : [],
        hosts      : [],
        vnets      : [],
        datastores : []
      };
    }

    var resourcesZone = selectedResources[this.zone_id];

    if(resourcesZone.clusters.length == 1 &&
       resourcesZone.clusters[0] == VDC_ALL_RESOURCES){

      $("#all_clusters_"+this.unique_id, context).click();
    }else{
      this.clustersTable.selectResourceTableSelect(
            { ids : resourcesZone.clusters });
    }

    if(resourcesZone.hosts.length == 1 &&
       resourcesZone.hosts[0] == VDC_ALL_RESOURCES){

      $("#all_hosts_"+this.unique_id, context).click();
    }else{
      this.hostsTable.selectResourceTableSelect(
            { ids : resourcesZone.hosts });
    }

    if(resourcesZone.vnets.length == 1 &&
       resourcesZone.vnets[0] == VDC_ALL_RESOURCES){

      $("#all_vnets_"+this.unique_id, context).click();
    }else{
      this.vnetsTable.selectResourceTableSelect(
            { ids : resourcesZone.vnets });
    }

    if(resourcesZone.datastores.length == 1 &&
       resourcesZone.datastores[0] == VDC_ALL_RESOURCES){

      $("#all_datastores_"+this.unique_id, context).click();
    }else{
      this.datastoresTable.selectResourceTableSelect(
            { ids : resourcesZone.datastores });
    }
  }
});
