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
    DEPENDENCIES
   */

  var Config = require("sunstone-config");
  var CoresPerSocket = require("tabs/templates-tab/form-panels/create/wizard-tabs/utils/cores-per-socket");
  var Locale = require("utils/locale");
  var OpenNebulaAction = require('opennebula/action');
  var UniqueId = require("utils/unique-id");

  /*
    TEMPLATES
   */

  var TemplateHTML = require("hbs!./numa/html");

  /*
    CONSTANTS
   */

  var WIZARD_TAB_ID = require("./numa/wizardTabId");
  var RESOURCE = "HOST";
  var BUTTON_NUMA_TOPOLOGY = "#numa-topology";
  var HUGEPAGE_SELECTED_VALUE = "";
  var idsElements = {
    numaAffinity: '#node-affinity',
    cores: "#numa-cores",
    threads: "#numa-threads",
    hugepages: "#numa-hugepages",
    sockets: "#numa-sockets",
    memory: "#numa-memory",
    pin: "#numa-pin-policy"
  }

  var NODE_AFFINITY = 'NODE_AFFINITY';
  var numaStatus = null;
  var VCPU_SELECTOR = '#VCPU';
  /*
    CONSTRUCTOR
   */

  function WizardTab(opts) {
    if (!Config.isTemplateCreationTabEnabled(opts.tabId, "numa")) {
      throw "Wizard Tab not enabled";
    }
    this.wizardTabId = WIZARD_TAB_ID + UniqueId.id();
    this.icon = "fa-microchip";
    this.title = Locale.tr("NUMA");
  }

  WizardTab.prototype.constructor = WizardTab;
  WizardTab.prototype.html = _html;
  WizardTab.prototype.setup = _setup;
  WizardTab.prototype.onShow = _onShow;
  WizardTab.prototype.retrieve = _retrieve;
  WizardTab.prototype.fill = _fill;

  return WizardTab;

  /*
    FUNCTION DEFINITIONS
   */

  function _html() {
    return TemplateHTML();
  }

  function parseToMB(bytes=0){
    return bytes / 1024;
  }

  function successCallback(_, _, infohost){
    var selector = $(idsElements.hugepages);
    selector.empty();

    if (infohost && infohost.HOST_POOL && infohost.HOST_POOL.HOST) {
      var hosts = infohost.HOST_POOL.HOST;
      var hugepages = [];

      if (!(hosts instanceof Array)) {
        hosts = [hosts];
      }

      hosts.map(function(host){
        if(
          host && 
          host.HOST_SHARE && 
          host.NAME && 
          host.HOST_SHARE.NUMA_NODES && 
          host.HOST_SHARE.NUMA_NODES.NODE
        ){
          var numaNodes = host.HOST_SHARE.NUMA_NODES.NODE;
          if (!(numaNodes instanceof Array)) {
            numaNodes = [numaNodes];
          }
          numaNodes.map(function(node){
            if(node && node.HUGEPAGE && node.NODE_ID){
              node.HUGEPAGE.map(function(hugepage){
                if(!hugepages.includes(hugepage.SIZE)){
                  hugepages.push(hugepage.SIZE);
                }
              });
            }
          });
        }
      });

      selector.append($("<option/>",{"value":""}).text("-"));

      hugepages.map(function(hugepage){
        var parsedHugepage = parseToMB(hugepage);
        var selected = parseInt(parsedHugepage,10) === parseInt(HUGEPAGE_SELECTED_VALUE,10);
        selector.append(
          $("<option/>",{"value": parsedHugepage}).text(parsedHugepage+"M").prop('selected', selected)
        );
        if(selected){
          selector.val(parsedHugepage);
        }
      });
    }
  }

  function getStatusNuma(){
    return numaStatus;
  }

  function errorCallback(error){
    console.log(error);
  }

  function _onShow(context) {
    // this if for display the node-affinity input
    context.on("change", "#numa-pin-policy", function(){
      if (this.value === NODE_AFFINITY){
        $(idsElements.numaAffinity, context).attr("required", "");
        $(idsElements.numaAffinity, context).closest(".columns").removeClass("hidden");
      }else{
        $(idsElements.numaAffinity, context).removeAttr("required");
        $(idsElements.numaAffinity, context).closest(".columns").addClass("hidden");
      }
    })
    $(BUTTON_NUMA_TOPOLOGY, context).on( 'click', function() {
      var form = $(".numa-form",context);
      if( $(this).is(':checked') ){
        form.removeClass("hide");
        OpenNebulaAction.clear_cache(RESOURCE);
        OpenNebulaAction.list(
          {
            data: {pool_filter: -2},
            success: successCallback, 
            error: errorCallback
          }, 
          RESOURCE
        );
        numaStatus = true;
      }else{
        form.addClass("hide");
        numaStatus = false;
      }
    });
  }

  function _setup(context) {
    Foundation.reflow(context, "tabs");

    $("#CORES_PER_SOCKET", context).on("change", function (){
      CoresPerSocket.calculateSockets(VCPU_SELECTOR);
      $('#numa-cores').val(this.value);
    });

    $('#selectedVCPU',context).on('change', function (){
      $('#VCPU').val(this.value).change();
    });
  }

  function _retrieve(context) {
    var templateJSON = { TOPOLOGY : {DELETE:"DELETE"} };

    if(getStatusNuma()){
      delete templateJSON["TOPOLOGY"]["DELETE"];
      var temp = {};
      var policy = _getValue(idsElements.pin, context);
      if(policy && policy.length){
        temp.PIN_POLICY = policy;
      }
      var nodeAffinity = _getValue(idsElements.numaAffinity, context);
      if(nodeAffinity && nodeAffinity.length){
        temp.NODE_AFFINITY = nodeAffinity;
      }
      var sockets = _getValue(idsElements.sockets, context);
      if(sockets && sockets.length){
        temp.SOCKETS = sockets;
      }
      var cores = _getValue(idsElements.cores, context);
      if(cores && cores.length){
        temp.CORES = cores;
      }
      var threads = _getValue(idsElements.threads, context);
      if(threads && threads.length){
        temp.THREADS = threads;
      }
      temp.HUGEPAGE_SIZE = _getValue(idsElements.hugepages, context);
      
      temp.MEMORY_ACCESS = _getValue(idsElements.memory, context);
      
      templateJSON.TOPOLOGY = temp;
    }
    return templateJSON;
  }

  function _getValue(id = "", context = null) {
    return (id.length && context) ? $(String(id), context).val() : null;
  }

  function _fillBootValue(id = "", context = null, value = "") {
    if (id.length && context && value.length) {
      $(String(id), context).val(value);
    }
  }

  function _fill(context, templateJSON) {
    if(templateJSON && templateJSON.TOPOLOGY){
      var topology = templateJSON.TOPOLOGY;
      $(BUTTON_NUMA_TOPOLOGY).click();
      if(topology && topology.CORES){
        _fillBootValue(idsElements.cores, context, topology.CORES);
      }
      HUGEPAGE_SELECTED_VALUE = "";
      if(topology && topology.HUGEPAGE_SIZE){
        HUGEPAGE_SELECTED_VALUE = topology.HUGEPAGE_SIZE;
      }
      if(topology && topology.MEMORY_ACCESS){
        _fillBootValue(idsElements.memory, context, topology.MEMORY_ACCESS);
      }
      if(topology && topology.PIN_POLICY){
        _fillBootValue(idsElements.pin, context, topology.PIN_POLICY);
      }else if(topology && topology.NODE_AFFINITY){
        _fillBootValue(idsElements.pin, context, NODE_AFFINITY);
      }
      if(topology && topology.SOCKETS){
        _fillBootValue(idsElements.sockets, context, topology.SOCKETS);
      }
      if(topology && topology.THREADS){
        _fillBootValue(idsElements.threads, context, topology.THREADS);
      }
      if(topology && topology.NODE_AFFINITY){
        $(idsElements.numaAffinity, context).closest(".columns").removeClass("hidden");
        $(idsElements.numaAffinity, context).attr("required", "");
        _fillBootValue(idsElements.numaAffinity, context, topology.NODE_AFFINITY);
      }
    }
  }
});
