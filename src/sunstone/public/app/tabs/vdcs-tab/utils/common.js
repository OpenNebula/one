define(function(require) {
  /*
    Common functions for VDCs
   */

  var VDC_ALL_RESOURCES = "-10";

  var ResourceTabHTML = require('hbs!./resourceTab');

  var ClustersTable = require('tabs/clusters-tab/datatable');
  var HostsTable = require('tabs/hosts-tab/datatable');
  var VNetsTable = require('tabs/vnets-tab/datatable');
  var DatastoresTable = require('tabs/datastores-tab/datatable');
  var Tips = require('utils/tips');

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

      if (!$.isArray(clusters_array)){
        clusters_array = [clusters_array];
      }
    }

    if (vdc.HOSTS.HOST){
      hosts_array = vdc.HOSTS.HOST;

      if (!$.isArray(hosts_array)){
        hosts_array = [hosts_array];
      }
    }

    if (vdc.VNETS.VNET){
      vnets_array = vdc.VNETS.VNET;

      if (!$.isArray(vnets_array)){
        vnets_array = [vnets_array];
      }
    }

    if (vdc.DATASTORES.DATASTORE){
      datastores_array = vdc.DATASTORES.DATASTORE;

      if (!$.isArray(datastores_array)){
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

  function _addVdcResourceTab(unique_id_prefix, zone_id, zone_name, context, indexed_resources) {
    var unique_id = unique_id_prefix+'_'+zone_id;

    var resources = undefined;
    if(indexed_resources != undefined && indexed_resources[zone_id] != undefined){
      resources = indexed_resources[zone_id];
    }

    var opts = {};
    
    $.each(["clusters", "hosts", "vnets", "datastores"], function(i,res_name){
      if(resources != undefined){
        opts[res_name] = {
          info: true,
          select: true,
          selectOptions: {
            read_only: true,
            zone_id: zone_id
          }
        };

        if (!(resources[res_name].length == 1 && resources[res_name][0] == VDC_ALL_RESOURCES)){
          opts[res_name].selectOptions.fixed_ids = resources[res_name];
        }
      } else {
        opts[res_name] = {
          info: true,
          select: true,
          selectOptions: {
            multiple_choice: true,
            zone_id: zone_id
          }
        };
      }
    });

    var clustersTable = new ClustersTable("vdc_clusters_"+unique_id, opts["clusters"]);
    var hostsTable = new HostsTable("vdc_hosts_"+unique_id, opts["hosts"]);
    var vnetsTable = new VNetsTable("vdc_vnets_"+unique_id, opts["vnets"]);
    var datastoresTable = new DatastoresTable("vdc_datastores_"+unique_id, opts["datastores"]);

    // Append the new div containing the tab and add the tab to the list
    var html_tab_content =
      '<div id="'+unique_id+'Tab" class="vdc_zone_content">'+
        ResourceTabHTML({
              'unique_id': unique_id,
              'clustersTableHTML': clustersTable.dataTableHTML,
              'hostsTableHTML': hostsTable.dataTableHTML,
              'vnetsTableHTML': vnetsTable.dataTableHTML,
              'datastoresTableHTML': datastoresTable.dataTableHTML
            })+
      '</div>';

    $(html_tab_content).appendTo($(".vdc_zones_tabs_content", context));

    var zone_section = $('#' +unique_id+'Tab', context);

    $("select.vdc_zones_select", context).append(
                        '<option value="'+zone_id+'">'+zone_name+'</option>');

    zone_section.foundation();

    $.each(["clusters", "hosts", "vnets", "datastores"], function(i,res_name){
      if(resources != undefined){
        if (resources[res_name].length == 1 && resources[res_name][0] == VDC_ALL_RESOURCES){
          $("#all_"+res_name+"_"+unique_id, zone_section).prop("checked", "checked");
        }

        $("#all_"+res_name+"_"+unique_id, zone_section).prop("disabled", true);
      }

      $("input[name='all_"+res_name+"_"+unique_id+"']", zone_section).change(function(){
        if ($(this).prop("checked")){
          $("div.vdc_"+res_name+"_select", zone_section).hide();
        } else {
          $("div.vdc_"+res_name+"_select", zone_section).show();
        }
      });
    });

    $.each([clustersTable, hostsTable, vnetsTable, datastoresTable], function(){
      this.initialize();
      this.refreshResourceTableSelect();
    });

    Tips.setup(zone_section);
  }

  function _setupVdcResourceTab(unique_id_prefix, context){
    $("select.vdc_zones_select", context).change(function(){
      context.find(".vdc_zone_content").hide();
      $('div#'+unique_id_prefix+'_'+$(this).val()+'Tab', context).show();
    });

    $("select.vdc_zones_select", context)[0].selectedIndex = 0;
    $("select.vdc_zones_select", context).change();
  }

  return {
    'indexedVdcResources': _indexedVdcResources,
    'addVdcResourceTab': _addVdcResourceTab,
    'setupVdcResourceTab': _setupVdcResourceTab
  };
});
