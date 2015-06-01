define(function(require) {

  var TemplateHTML = require('hbs!./resources-zone/html');

  var ClustersTable = require('tabs/clusters-tab/datatable');
  var HostsTable = require('tabs/hosts-tab/datatable');
  var VNetsTable = require('tabs/vnets-tab/datatable');
  var DatastoresTable = require('tabs/datastores-tab/datatable');
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
      if(that.resources != undefined){
        opts[res_name] = {
          info: true,
          select: true,
          selectOptions: {
            read_only: true,
            zone_id: that.zone_id
          }
        };

        if (!(that.resources[res_name].length == 1 &&
              that.resources[res_name][0] == VDC_ALL_RESOURCES) ){

          opts[res_name].selectOptions.fixed_ids = that.resources[res_name];
        }
      } else {
        opts[res_name] = {
          info: false,
          select: true,
          selectOptions: {
            multiple_choice: true,
            zone_id: that.zone_id
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

    context.foundation();

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
