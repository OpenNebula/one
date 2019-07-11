/* -------------------------------------------------------------------------- */
/* Copyright 2002-2019, OpenNebula Project, OpenNebula Systems                */
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
  var Locale = require("utils/locale");
  var Tips = require("utils/tips");
  var WizardFields = require("utils/wizard-fields");
  var FilesTable = require("tabs/files-tab/datatable");
  var UniqueId = require("utils/unique-id");
  var OpenNebulaAction = require('opennebula/action');

  /*
    TEMPLATES
   */

  var TemplateHTML = require("hbs!./numa/html");

  /*
    CONSTANTS
   */

  var WIZARD_TAB_ID = require("./numa/wizardTabId");
  var RESOURCE = "HOST";
  var SELECTOR_HUGEPAGE = "#numa-hugepages";
  var numaStatus = null;
  /*
    CONSTRUCTOR
   */

  function WizardTab(opts) {
    if (!Config.isTemplateCreationTabEnabled(opts.tabId, "os_booting")) {
      throw "Wizard Tab not enabled";
    }
    this.wizardTabId = WIZARD_TAB_ID + UniqueId.id();
    this.icon = "fa-chart-pie";
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
    var that = this;
    return TemplateHTML();
  }

  function successCallback(request, opts, infohost){
    //console.log("CACHE ", OpenNebulaAction.get_all_cache());
    var selector = $(SELECTOR_HUGEPAGE);
    selector.empty();
    if(infohost && infohost.HOST_POOL && infohost.HOST_POOL.HOST){
      infohost.HOST_POOL.HOST.map(function(host){
        if(host && host.HOST_SHARE && host.NAME && host.HOST_SHARE.NUMA_NODES && host.HOST_SHARE.NUMA_NODES.NODE){
          var name = host.NAME
          var numaNodes = host.HOST_SHARE.NUMA_NODES.NODE;
          if (!(numaNodes instanceof Array)) {
            numaNodes = [numaNodes];
          }
          numaNodes.map(function(node){
            if(node && node.HUGEPAGE && node.NODE_ID){
              node.HUGEPAGE.map(function(hugepage){
                selector.append($("<option/>",{"value": hugepage.SIZE}).text(name+" ("+node.NODE_ID+") - "+hugepage.SIZE));
              });
            }
          });
        }
      });
    }
  }

  function getStatusNuma(){
    return numaStatus;
  }

  function errorCallback(error, error1){
    console.log("error->", error, error1);
  }

  function _onShow(context, panelForm) {
    var that = this;
    console.log(that);
    $('#numa-topology', context).on( 'click', function() {
      var form = $(".numa-form",context);
      if( $(this).is(':checked') ){
        form.removeClass("hide");
        //aca se tiene que llamar a los hugepages
        OpenNebulaAction.clear_cache("HOST");
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
    console.log("3", this)
    var that = this;
    Foundation.reflow(context, "tabs");
    if(that && that.action){
      
    }
  }

  function _retrieve(context) {
    var templateJSON = {};
    if(getStatusNuma()){
      var temp = {}
      var policy = _getValue("#numa-pin-policy", context);
      if(policy && policy.length){
        temp.PIN_POLICY = policy;
      }
      var sockets = _getValue("#numa-sockets", context);
      if(sockets && sockets.length){
        temp.SOCKETS = sockets;
      }
      var cores = _getValue("#numa-cores", context);
      if(cores && cores.length){
        temp.CORES = cores;
      }
      var threads = _getValue("#numa-threads", context);
      if(threads && threads.length){
        temp.THREADS = threads;
      }
      var hugepage = _getValue("#numa-hugepages", context);
      if(hugepage && hugepage.length){
        temp.HUGEPAGE_SIZE = sockets;
      }
      var memory = _getValue("#numa-memory", context);
      if(memory && memory.length){
        temp.MEMORY_ACCESS = memory;
      }
      templateJSON.TOPOLOGY = temp;
    }
    console.log("-->", templateJSON);
    return templateJSON;
  }

  function _getValue(id="", context=null){
    rtn = null;
    if(id.length && context){
      rtn = $(String(id), context).val();
    }
    return rtn;
  }

  function _fillBootValue(id="", context=null, value="") {
    if(id.length && context && value.length){
      $(String(id), context).attr("value", value);
    }
  }

  function _fill(context, templateJSON) {
    console.log("5", templateJSON);
    /*var topology = templateJSON["TOPOLOGY"];
    if (topology) {
      WizardFields.fill(context, pinPolicy);

      if (pinPolicy && pinPolicy["PIN_POLICY"]) {
        _fillBootValue("", context, pinPolicy["BOOT"]);
      }
    }

    var topologyJSON = templateJSON["TOPOLOGY"];
    if (topologyJSON) {
      WizardFields.fill(context, topologyJSON);
      delete topologyJSON["TOPOLOGY"];
    }*/
  }
});
