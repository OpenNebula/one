/* -------------------------------------------------------------------------- */
/* Copyright 2002-2020, OpenNebula Project, OpenNebula Systems                */
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

  var Locale = require("utils/locale");
  var Config = require("sunstone-config");
  var Sunstone = require("sunstone");
  var OpenNebulaVM = require("opennebula/vm");
  var Notifier = require("utils/notifier");
  var Graphs = require("utils/graphs");
  var StateActions = require("tabs/vms-tab/utils/state-actions");
  var OpenNebulaAction = require("opennebula/action");
  var Humanize = require("utils/humanize");
  var ProgressBar = require("utils/progress-bar");
  /*
    TEMPLATES
   */

  var TemplateInfo = require("hbs!./capacity/html");

  /*
    CONSTANTS
   */

  var TAB_ID = require("../tabId");
  var PANEL_ID = require("./capacity/panelId");
  var RESIZE_DIALOG_ID = require("../dialogs/resize/dialogId");
  var RESOURCE = "VM";
  var XML_ROOT = "VM";

  /*
    CONSTRUCTOR
   */

  function Panel(info) {
    this.panelId = PANEL_ID;
    this.title = Locale.tr("Capacity");
    this.icon = "fa-laptop";

    this.element = info[XML_ROOT];

    return this;
  };

  Panel.PANEL_ID = PANEL_ID;
  Panel.prototype.html = _html;
  Panel.prototype.setup = _setup;
  Panel.prototype.onShow = _onShow;

  return Panel;

  /*
    FUNCTION DEFINITIONS
   */

  function _html() {
    var resizeStateEnabled = StateActions.enabledStateAction("VM.resize",
                                    this.element.STATE, this.element.LCM_STATE);

    var cpuCost    = this.element.TEMPLATE.CPU_COST;
    var memoryCost = this.element.TEMPLATE.MEMORY_COST;

    if (cpuCost == undefined){
      cpuCost = Config.onedConf.DEFAULT_COST.CPU_COST;
    }

    if (memoryCost == undefined){
      memoryCost = Config.onedConf.DEFAULT_COST.MEMORY_COST;
    }
    return TemplateInfo({
      "element": this.element,
      "resizeStateEnabled": resizeStateEnabled,
      "cpuCost": cpuCost,
      "memoryCost": memoryCost
    });
  }

  function _calculateSockets(context){
    var vcpu = $("div.vcpu_input input", context).val();
    var cores_per_socket = $("#CORES_PER_SOCKET").val();

    if ((vcpu != "") && (cores_per_socket != "")){
      $("div.socket_info").show();
      $("#number_sockets").text(vcpu/cores_per_socket);
    }
    else{
      $("div.socket_info").hide();
    }

  }

  function _generateCores(context){
    $("#CORES_PER_SOCKET", context).find("option").remove();
    $("#CORES_PER_SOCKET", context).append($("<option>").val("").text(""));
    var vcpuValue = $("div.vcpu_input input").val();
    for (var i = 1; i <= vcpuValue; i++){
      if (vcpuValue%i === 0){
        $("#CORES_PER_SOCKET", context).append($("<option>").val(i).text((i).toString()));
      }
    }
    $("#CORES_PER_SOCKET option[value=\"\"]").prop("selected", true);
  }

  function _setup(context) {
    var that = this;
    if (Config.isTabActionEnabled("vms-tab", "VM.resize")) {
      context.off("click", "#resize_capacity");
      context.on("click", "#resize_capacity", function() {
        var dialog = Sunstone.getDialog(RESIZE_DIALOG_ID);
        dialog.setElement(that.element);
        dialog.show();
        dialogContext = dialog.dialogElement;
        if (that.element.USER_TEMPLATE.HYPERVISOR == "vcenter"){
          $("div.cores_per_socket_select_wrapper", dialogContext).attr("style", "");
          $("div.socket_info", dialogContext).show();

          var vcpuValue = $("div.vcpu_input input").val();
          if (vcpuValue !== "" && that && that.element && that.element.TEMPLATE && that.element.TEMPLATE.TOPOLOGY && that.element.TEMPLATE.TOPOLOGY.CORES) {
            _generateCores(dialogContext);
            $("#CORES_PER_SOCKET option[value=\"" + that.element.TEMPLATE.TOPOLOGY.CORES + "\"]").prop("selected", true);
          }

          $("div.vcpu_input input", dialogContext).on("change", function(){
            _generateCores(dialogContext);
            _calculateSockets(dialogContext);
          });

          $("#CORES_PER_SOCKET", dialogContext).on("change", function(){
            _calculateSockets(dialogContext);
          });

          _calculateSockets(dialogContext);
        }
        else{
          $("div.cores_per_socket_select_wrapper", dialogContext).hide();
          $("div.socket_info", dialogContext).hide();
        }
        return false;
      });
    }
  }

  function _onShow(context) {
    var that = this;
    OpenNebulaVM.monitor({
      data: {
        id: that.element.ID,
        monitor: {
          monitor_resources : "CPU,MEMORY"
        }
      },
      success: function(req, response) {
        var vmGraphs = [
          {
            monitor_resources : "CPU",
            labels : Locale.tr("CPU usage"),
            humanize_figures : false,
            div_graph : $(".vm_cpu_graph", context),
            div_legend : $(".vm_cpu_legend", context)
          },
          {
            monitor_resources : "MEMORY",
            labels : ("Memory usage"),
            humanize_figures : true,
            div_graph : $(".vm_memory_graph", context),
            div_legend : $(".vm_memory_legend", context)
          }
        ];

        for (var i = 0; i < vmGraphs.length; i++) {
          Graphs.plot(response, vmGraphs[i]);
        }
      },
      error: Notifier.onError
    });

    //NUMA DATA
    var element = this.element;
    var displaySubtitle = true;
    var coreTable = $("<table/>");
    if(element && element.TEMPLATE && element.TEMPLATE.NUMA_NODE){
      var info = element.TEMPLATE.NUMA_NODE;
      if (!(info instanceof Array)) {
        info = [info];
      }
      var limit = 3; //start in 0 is index of array
      var count = 0;
      var subtitle = $("<h6/>");
      var description = $("<small>").css({"margin-left":"1rem","font-size": "0.9rem"});
      var descriptionText = [];
      var space = false;
      var tBody = $("<tbody/>");
      var progress = "";
      //description info
      if(element.TEMPLATE && element.TEMPLATE.TOPOLOGY ){
        for (var prop in  element.TEMPLATE.TOPOLOGY){
          var styles = "display: inline-block;font-weight: bold;color: #5f5d5d;";
          if(space){
            styles += "margin-left: 0.3rem;";
          }
          space = true;
          descriptionText.push("<div style='"+styles+"'>"+prop.toLocaleLowerCase()+":</div> "+element.TEMPLATE.TOPOLOGY[prop]);
        }
        description.append("("+descriptionText.join("  ").trim()+")");
      }
      info.map(function(core, index){
        if(displaySubtitle){
          subtitle.text("Cores & CPUS");
          displaySubtitle = false;
        }

        var placeBody = tBody.find("tr:last");
        if(count === 0){
          placeBody = tBody.append($("<tr/>")).find("tr:last");
        }
        placeBody.append(
          $("<td/>",{"colspan":2,"class":"text-center"}).append(
            $("<h6/>").text("Node "+index)
          )
        );
        if(core.CPUS){
          var cpus = core.CPUS.split(",");
          if(cpus instanceof Array){
            cpus.map(function(cpu){
              if(core.MEMORY){
                var infoMemory = core.MEMORY;
                var total = infoMemory ? parseInt(infoMemory): 0;
                var used = infoMemory ? parseInt(infoMemory) : 0;
                var parser = Humanize.sizeFromKB;
                if (total > 0) {
                  var ratio = Math.round((used / total) * 100);
                  info_str = parser(used) + " / " + parser(total) + " (" + ratio + "%)";
                } else {
                  if (info.TYPE == 1) {
                    info_str = "- / -";
                  } else {
                    info_str = Humanize.size(used) + " / -";
                  }
                }
                progress = ProgressBar.html(used, total, info_str, "memory-used");
              }

              placeBody.find("td:last").append(
                $("<div/>",{"class":"small-6 columns cpu busy"}).append(
                  $("<div/>",{"class":""}).text("CPU #"+cpu)
                )
              );

            });
          }
          placeBody.find("td:last").append($("<div/>",{"class":"small-12 columns"}).css({"padding": "0px",
            "margin-top": "2rem"}).append($("<h6/>",{"class":"text-left"}).text("Memory").css({"padding-bottom":"0px"}).add(progress)));
        }
        count = count >= limit ? 0 : count+1;
      });
      coreTable.append(tBody);
      $("#numaPlaceVM").empty().append(subtitle.append(description).add(coreTable));
    }
  }
});
