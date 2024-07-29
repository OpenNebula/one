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
  var Locale = require('utils/locale');
  var Config = require('sunstone-config');
  var Sunstone = require('sunstone');
  var Notifier = require('utils/notifier');
  var OpenNebula = require('opennebula');
  var VNetUtils = require('tabs/vnets-tab/utils/common');

  var Vis = require('vis');

  var TemplateDashboard = require('hbs!./vnets-topology-tab/html');
  var TemplateEmptyTable = require('hbs!utils/tab-datatable/empty-table');

  var _network;
  var _vnetList;
  var _vrList;
  var _indexedVRs;
  var _vrouterVMs;
  var _vnetLevel;

  var _buttons = {
    "NetworkTopology.refresh" : {
      type: "action",
      layout: "refresh",
      alwaysActive: true
    },
    "NetworkTopology.fit" : {
      type: "action",
      layout: "main",
      text: '<i class="fas fa-arrows-alt"/>',
      alwaysActive: true
    },
    "NetworkTopology.collapseVMs" : {
      type: "action",
      layout: "main",
      text:  Locale.tr("Collapse VMs"),
      alwaysActive: true
    },
    "NetworkTopology.openVMs" : {
      type: "action",
      layout: "main",
      text:  Locale.tr("Open VMs"),
      alwaysActive: true
    }
  };

  var _actions = {
    "NetworkTopology.refresh" : {
      type: "custom",
      call: _refresh
    },
    "NetworkTopology.fit" : {
      type: "custom",
      call: _fit
    },
    "NetworkTopology.collapseVMs" : {
      type: "custom",
      call: _collapseVMs
    },
    "NetworkTopology.openVMs" : {
      type: "custom",
      call: _openVMs
    }
  };

  var TAB_ID = require('./vnets-topology-tab/tabId');

  var Tab = {
    tabId: TAB_ID,
    resource: 'NetworkTopology',
    tabClass: "subTab",
    parentTab: "network-top-tab",
    title: Locale.tr("Network Topology"),
    icon: 'fa-sitemap',
    listHeader: Locale.tr("Network Topology"),
    buttons: _buttons,
    actions: _actions,
    content: _html()
  };

  return Tab;

  function _html() {
    return TemplateDashboard();
  }

  function _onShow() {
  }

  function _refresh() {

    OpenNebula.VirtualRouter.list({
      error: Notifier.onError,
      force: true,
      success: function(request, item_list) {
        _vrList = item_list;

        OpenNebula.Network.list({
          timeout: true,
          force: true,
          success: function (request, item_list) {

            // TODO: naive way to request all the individual networks info. It might
            // be better to use promises, or a Network.list with an 'extended' option

            var vnetList = [];

            var i = 0;

            function _getVNet(index){
              var element = item_list[index];
              if (element !== undefined) {
                var vnetId = element.VNET.ID;

                OpenNebula.Network.show({
                  data : {
                    id: vnetId
                  },
                  timeout:true,
                  success: function(request,info){
                    vnetList.push(info);

                    i += 1;
                    if (i == item_list.length){
                      _vnetList = vnetList;
                      _doTopology();
                    } else {
                      _getVNet(i);
                    }
                  },
                  error: Notifier.onError
                });
              } else {
                _vnetList = vnetList;
                $('#visgraph').html(TemplateEmptyTable());
              }
            }

            _getVNet(i);
          },
          error: Notifier.onError
        });
      }
    });
  }

  function _doTopology(){
    _vnetLevel = {};

    var nodes = [];
    var edges = [];

    // Aux object to keep track of duplicated nodes (vms/vr attached to 2 vnets)
    var nodeIndex = {};

    var level = 0;

    _indexedVRs = {};
    _vrouterVMs = {};

    $.each(_vrList, function(i, element){
      var vr = element.VROUTER;
      _indexedVRs[vr.ID] = vr;

      var vms = [];

      if (vr.VMS.ID != undefined){
        vms = vr.VMS.ID;

        if (!Array.isArray(vms)){
          vms = [vms];
        }
      }

      $.each(vms, function(n, vm){
        _vrouterVMs[vm] = {
          vmid: vm,
          vrid: vr.ID,
          leases: {}
        };
      });
    });

    $.each(_vnetList, function(i,element){
      var vnet = element.VNET;
      var vnetId = vnet.ID;

      // VNet node
      // ----------------

      if (vnet.PARENT_NETWORK_ID.length > 0){
        vnetId = vnet.PARENT_NETWORK_ID;
      }

      var vnetNodeId = "vnet"+vnetId;

      if (!nodeIndex[vnetNodeId]){
        level += 2;

        _vnetLevel[vnetId] = level;

        nodeIndex[vnetNodeId] = true;
        nodes.push({
          id: vnetNodeId,
          level: level,
          label: "  VNet "+vnet.NAME + "  ", // Spaces for padding, no other reason
          group: "vnet"});
      }

      // VRouter nodes
      // ----------------

      var vrs = [];

      if (vnet.VROUTERS.ID != undefined){
        vrs = vnet.VROUTERS.ID;

        if (!Array.isArray(vrs)){
          vrs = [vrs];
        }
      }

      $.each(vrs, function(j,vr){
        if(_indexedVRs[vr] == undefined){
          return true; //continue
        }

        var nodeId = "vr"+vr;

        if (!nodeIndex[nodeId]){
          nodeIndex[nodeId] = true;
          nodes.push({
            id: nodeId,
            level: level+1,
            title: '',
            label: "VR "+vr,
            group: "vr"});
        }

        edges.push({from: vnetNodeId, to: nodeId});
      });

      // VM nodes
      // ----------------

      var arList = VNetUtils.getARList(vnet);

      for (var i=0; i<arList.length; i++){
        var ar = arList[i];
        var id = ar.AR_ID;

        var leases = ar.LEASES.LEASE;

        if (!leases) { //empty
          continue;
        } else if (leases.constructor != Array) { //>1 lease
          leases = [leases];
        }

        if (leases.length < 10){
          for (var j=0; j<leases.length; j++){
            var lease = leases[j];

            if (lease.VM != undefined) { //used by a VM

              // Skip leases on hold
              if (lease.VM == "-1"){
                continue;
              }
              var nodeId = "vm"+lease.VM;

              var edgeLabel = undefined;

              if (lease.IP != undefined){
                edgeLabel = lease.IP;
              } else if (lease.IP6_GLOBAL != undefined){
                edgeLabel = lease.IP6_GLOBAL;
              } else if (lease.IP6_ULA != undefined){
                edgeLabel = lease.IP6_ULA;
              } else if (lease.IP6_LINK != undefined){
                edgeLabel = lease.IP6_LINK;
              }

              // Skip VRouter VMs
              var vrouterVMobj = _vrouterVMs[lease.VM];
              if (vrouterVMobj != undefined){
                if (vrouterVMobj.leases[vnetId] == undefined){
                  vrouterVMobj.leases[vnetId] = [];
                }

                vrouterVMobj.leases[vnetId].push(edgeLabel);

                continue;
              }

              if (!nodeIndex[nodeId]){
                nodeIndex[nodeId] = true;
                nodes.push({
                  id: nodeId,
                  level: level+1,
                  label: "VM "+lease.VM,
                  group: "vm",
                  vnet: vnetId});

                // vnetId is only set the first time a VM node is created,
                // but we only use it to cluster VMs that belong to one VNet.
                // So it doesn't matter if we don't store the rest of VNet IDs
              }

              edges.push({from: vnetNodeId, to: nodeId, label: edgeLabel});

            } else if (lease.VROUTER != undefined){
              var nodeId = "vr"+lease.VROUTER;

              if (!nodeIndex[nodeId]){
                nodeIndex[nodeId] = true;
                nodes.push({
                  id: nodeId,
                  level: level+1,
                  label: "VR "+vr,
                  group: "vr"});
              }

              var label = undefined;

              if (lease.IP != undefined){
                label = lease.IP;
              } else if (lease.IP6_GLOBAL != undefined){
                label = lease.IP6_GLOBAL;
              } else if (lease.IP6_ULA != undefined){
                label = lease.IP6_ULA;
              } else if (lease.IP6_LINK != undefined){
                label = lease.IP6_LINK;
              }

              edges.push({from: vnetNodeId, to: nodeId, label: label});
            }
            /*
            else if (lease.VNET != undefined) { //used by a VNET Reservation
            */
          }
        } else {
          var lease = leases[0];
          var nodeId = "vm"+lease.VM;

          var edgeLabel = undefined;

          if (lease.IP != undefined){
            edgeLabel = lease.IP;
          } else if (lease.IP6_GLOBAL != undefined){
            edgeLabel = lease.IP6_GLOBAL;
          } else if (lease.IP6_ULA != undefined){
            edgeLabel = lease.IP6_ULA;
          } else if (lease.IP6_LINK != undefined){
            edgeLabel = lease.IP6_LINK;
          }

          if (!nodeIndex[nodeId]){
            nodeIndex[nodeId] = true;
            nodes.push({
              id: nodeId,
              level: level+1,
              label: "VMset "+lease.VM,
              group: "vm",
              vnet: vnetId});
          }

          edges.push({from: vnetNodeId, to: nodeId, label: edgeLabel + " / ..."});
        }
      }
    });

    // Fill VR nodes tooltips
    $.each(nodes, function(i, node){
      var parts = node.id.split("vr");

      if (parts.length == 1){
        return true;
      }

      node.title = _tableVR(parts[1]);
    });

    // create a network
    var container = document.getElementById('visgraph');

    // provide the data in the vis format
    var data = {
        nodes: nodes,
        edges: edges
    };

    var options = {
      groups: {
        vnet: {
          shape: 'box',
          value: 2,
          scaling: {
            label: {
              enabled: true,
              max: 40
            },
            max: 30
          },
          color: {
            border: "#007a9c",
            background: "#0098c3",
            hover: "#007a9c",
            highlight: "#007a9c"
          },
          font: {
            color: "#fff"
          }
        },
        vr: {
          shape: 'circle',
          borderWidth: 2,
          color: {
            border: "#43AC6A",
            background: "#fff",
            hover: {
              border: "#43AC6A",
              background: "#f7f7f7"
            },
            highlight: {
              border: "#43AC6A",
              background: "#f7f7f7"
            }
          }
        },
        vm: {
          shape: 'circle',
          borderWidth: 2,
          color: {
            border: "#007a9c",
            background: "#fff",
            hover: {
              border: "#007a9c",
              background: "#f7f7f7"
            },
            highlight: {
              border: "#007a9c",
              background: "#f7f7f7"
            }
          }
        },
        vmCluster: {
          shape: 'circle',
          borderWidth: 2,
          shapeProperties: {
            borderDashes: [5,5]
          },
          color: {
            border: "#007a9c",
            background: "#f7f7f7",
            hover: {
              border: "#007a9c",
              background: "#c6c6c6"
            },
            highlight: {
              border: "#007a9c",
              background: "#f7f7f7"
            }
          }
        }
      },

      edges: {
        font: {
          align: 'middle'
        },
        color: '#cfcfcf',
        length: 300
      },

      interaction: {
        hover: true
      },

      layout: {
        //randomSeed: 2,  // A fixed seed gives predictability to the layout

        hierarchical: true
      }
    };

    // Create the vis network
    _network = new Vis.Network(container, data, options);

    // Open a cluster on selection
    _network.on("selectNode", function(params) {
      if (params.nodes.length == 1 && _network.isCluster(params.nodes[0]) == true) {
        _network.openCluster(params.nodes[0]);
      }
    });

    // Open node resource on double click
    _network.on("doubleClick", function(params) {
      if (params.nodes.length == 1 && _network.isCluster(params.nodes[0]) == false) {
        if ( params.nodes[0].match(/vm\d+/) ){
          Sunstone.showElement("vms-tab", params.nodes[0].split("vm")[1]);
        } else if ( params.nodes[0].match(/vnet\d+/) ){
          Sunstone.showElement("vnets-tab", params.nodes[0].split("vnet")[1]);
        } else if ( params.nodes[0].match(/vr\d+/) ){
          Sunstone.showElement("vrouters-tab", params.nodes[0].split("vr")[1]);
        }
      }
    });
  }

  function _tableVR(vrid){
    var vr = _indexedVRs[vrid];
    var vms = [];

    if (vr == undefined){
      return "";
    }

    if (vr.VMS.ID != undefined){
      vms = vr.VMS.ID;

      if (!Array.isArray(vms)){
        vms = [vms];
      }
    }

    var headers = undefined;
    var trs = [];

    $.each(vms, function(i, vmid){
      var vm = _vrouterVMs[vmid];

      if (vm == undefined){
        return true; // continue
      }

      if (headers == undefined){
        headers =
          "<thead>"+
            "<th>"+Locale.tr("VM")+"</th>";

        $.each(vm.leases, function(vnetId,ip){
          headers += "<th>"+Locale.tr("VNet")+" " +vnetId+"</th>";
        });

        headers += "</thead>";
      }

      var tr = "<tr><td>"+vmid+"</td>";

      $.each(vm.leases, function(vnetId,ips){
        tr += "<td>" + ips.join("</br>") + "</td>";
      });

      tr += "</tr>";

      trs.push(tr);
    });

    var html =
      "<table class='dataTable'>"+
        headers+
        "<tbody>"+
          trs.join("")+
        "</tbody>"+
      "</table>";

    return html;
  }

  function _collapseVMs(){

    // Clusters all VMs for each vnet, except those attached to more than one vnet
    $.each(_vnetList, function(i,element){
      var vnet = element.VNET;
      var vnetId = vnet.ID;

      if (vnet.PARENT_NETWORK_ID.length > 0){
        vnetId = vnet.PARENT_NETWORK_ID;
      }

      var clusterOptionsByData = {
        joinCondition:function(childOptions) {
          return (childOptions.group == "vm" &&
            childOptions.vnet == vnetId &&
            childOptions.amountOfConnections == 1);
        },
        clusterNodeProperties: {
          id:"vmCluster"+vnetId,
          level: _vnetLevel[vnetId]+1,
          label: "VMs",
          group: "vmCluster"
        },
        clusterEdgeProperties: {
          label: ''
        }
      };

      _network.cluster(clusterOptionsByData);
    });

    if(_network){
      _network.stabilize();
    }
  }

  function _openVMs(){

    // Opens all VMs Clusters
    $.each(_vnetList, function(i,element){
      var vnet = element.VNET;
      var clusterId = "vmCluster"+vnet.ID;

      try{
        _network.openCluster(clusterId);
      }catch(err){
      }
    });

    if(_network){
      _network.stabilize();
    }
  }

  function _fit(){

    if(_network){
      _network.fit();
    }
  }
});
