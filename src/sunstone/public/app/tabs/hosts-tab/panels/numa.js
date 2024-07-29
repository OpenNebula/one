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

  var Humanize = require('utils/humanize');
  var ProgressBar = require('utils/progress-bar');
  var Sunstone = require('sunstone');
  var TemplateUtils = require('utils/template-utils');
  var Tips = require('utils/tips');

  /*
    TEMPLATES
   */

  var TemplateNUMA = require('hbs!./numa/html');

  /*
    CONSTANTS
   */

  var PANEL_ID = require('./numa/panelId');
  var RESOURCE = "Host";
  var SELECT_ID = "numa-pinned-host";
  var ISOLCPUSINPUT = "numa-isolcpus";
  var ISOLCPUS = "isolcpus";
  var EMULATORCPUSINPUT = "numa-emulatorcpus";
  var EMULATORCPUS = "emulatorcpus";

  /*
    CONSTRUCTOR
   */

  function Panel(info) {
    this.title = Locale.tr("Numa");
    this.icon = "fa-microchip";
    this.element = info[RESOURCE.toUpperCase()];
    this.class = "not_vcenter";

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
    return TemplateNUMA();
  }

  function _onShow(){
    var that = this;
    $("#"+SELECT_ID).change(function(e){
      if(that.element && that.element.ID && that.element.TEMPLATE){
        var template = $.extend({}, that.element.TEMPLATE);
        template.PIN_POLICY = $(this).val();
        template_str  = TemplateUtils.templateToString(template);
        Sunstone.runAction(RESOURCE + ".update_template", that.element.ID, template_str);
      }
    });

    $("#"+ISOLCPUSINPUT).click(function(e){
      if(that.element && that.element.ID && that.element.TEMPLATE){
        var template = $.extend({}, that.element.TEMPLATE);
        template.ISOLCPUS = $("#"+ISOLCPUS).val();
        template_str  = TemplateUtils.templateToString(template);
        Sunstone.runAction(RESOURCE + ".update_template", that.element.ID, template_str);
      }
    });

    $("#"+EMULATORCPUSINPUT).click(function(e){
      if(that.element && that.element.ID && that.element.TEMPLATE){
        var template = $.extend({}, that.element.TEMPLATE);
        template.EMULATOR_CPUS = $("#"+EMULATORCPUS).val();
        template_str  = TemplateUtils.templateToString(template);
        Sunstone.runAction(RESOURCE + ".update_template", that.element.ID, template_str);
      }
    });
  }

  function capitalize(string){
    return typeof string !== 'string'? "" : string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
  }

  function get_numa_information(nodes, monitoring){
    var numa_nodes = Object.assign([], nodes);

    if (!monitoring || !monitoring.NUMA_NODE) return numa_nodes;
    var monitoring_nodes = Array.isArray(monitoring.NUMA_NODE) ? monitoring.NUMA_NODE : [monitoring.NUMA_NODE];

    numa_nodes.forEach(function(node) {
      monitoring_node = monitoring_nodes.find(function (m_node) {return m_node.NODE_ID === node.NODE_ID});
      node['MEMORY']['FREE'] = monitoring_node['MEMORY']['FREE'];
      node['MEMORY']['USED'] = monitoring_node['MEMORY']['USED'];

      node.HUGEPAGE.forEach(function(page){
        monitoring_page = monitoring_node.HUGEPAGE.find(function (m_page) {return m_page.SIZE === page.SIZE});
        page['FREE'] = monitoring_page['FREE'];
      })
    })

    return numa_nodes;
  }

  function _setup() {
    var that = this;

    // Hide NUMA tab if hypervisor is vcenter
    if( that.element &&
        that.element.VM_MAD &&
        that.element.VM_MAD == "vcenter"){
      $("li.not_vcenter").addClass("hide");
    }
    
    if (
      that && 
      that.element && 
      that.element.HOST_SHARE && 
      that.element.HOST_SHARE.NUMA_NODES
    ) {
      var numaNodes = get_numa_information(
        Array.isArray(that.element.HOST_SHARE.NUMA_NODES.NODE) 
          ? that.element.HOST_SHARE.NUMA_NODES.NODE
          : [that.element.HOST_SHARE.NUMA_NODES.NODE],
        that.element.MONITORING
      );
      var options = [{'value':'NONE'},{'value':'PINNED'}];
      var select = $("<select/>",{'id': SELECT_ID});
      options.map(function(element){
        if(element && element.value){
          var selected = that && 
            that.element && 
            that.element.TEMPLATE && 
            that.element.TEMPLATE.PIN_POLICY && 
            that.element.TEMPLATE.PIN_POLICY === element.value;
          select.append($("<option/>",{'value':element.value}).text(capitalize(element.value)).prop('selected', selected));
        }
      });
      var selectTable = $("<table/>");
      selectTable.append($("<thead/>").append($("<tr>").append($("<th/>").text("Pin Policy"))));
      selectTable.append($("<tbody>").append($("<tr>").append($("<td/>"))));
      selectTable.find("td").append(select);

      var isolcpusTable = $("<table/>");
      isolcpusTable.append(
        $("<thead/>").append(
          $("<tr>").append(
            $("<th/>").text("Isolated CPUS").append(
              $("<span>",{"class":"tip"}).text("Comma separated list of CPU IDs that will be isolated from the NUMA scheduler").css({"margin-left":".5rem"})
            )
          )
        )
      );
      isolcpusTable.append($("<tbody>").append($("<tr>").append($("<td/>"))));
      var valueIsolCpus = (that && that.element && that.element.TEMPLATE && that.element.TEMPLATE.ISOLCPUS) || "";
      var isolcpusInfo = $("<div>",{"class":"row"}).append(
        $("<div/>",{"class":'columns small-10'}).append(
          $("<input/>",{'id': ISOLCPUS, 'type': 'text'}).val(valueIsolCpus)
        )
        .add(
          $("<div/>",{"class":'columns small-2 text-center'}).append(
            $("<button/>",{"class": "button", "id": ISOLCPUSINPUT }).text("Update")
          )
        )
      );
      isolcpusTable.find("td").append(isolcpusInfo);

      var emulatorCpusTable = $("<table/>");
      emulatorCpusTable.append(
        $("<thead/>").append(
          $("<tr>").append(
            $("<th/>").text("Emulator CPUS").append(
              $("<span>",{"class":"tip"}).text("Pin emulator threads to specific host CPUs. It does not require VM CPU pinning").css({"margin-left":".5rem"})
            )
          )
        )
      );
      emulatorCpusTable.append($("<tbody>").append($("<tr>").append($("<td/>"))));
      var valueEmulatorCpus = (that && that.element && that.element.TEMPLATE && that.element.TEMPLATE.EMULATOR_CPUS) || "";
      var emulatorCpusInfo = $("<div>",{"class":"row"}).append(
        $("<div/>",{"class":'columns small-10'}).append(
          $("<input/>",{'id': EMULATORCPUS, 'type': 'text'}).val(valueEmulatorCpus)
        )
        .add(
          $("<div/>",{"class":'columns small-2 text-center'}).append(
            $("<button/>",{"class": "button", "id": EMULATORCPUSINPUT }).text("Update")
          )
        )
      );
      emulatorCpusTable.find("td").append(emulatorCpusInfo);

      $("#placeNumaInfo").append(selectTable);
      $("#placeNumaInfo").append(isolcpusTable);
      $("#placeNumaInfo").append(emulatorCpusTable);

      numaNodes.map(function(node,i){
        var displaySubtitle = true;
        var title = $("<h4/>");
        var subtitle = $("<h6/>");
        var coreTable = $("<table/>");
        var memory = $("<div/>",{'class':'memory small-12 large-6 columns'});
        var hugepage = $("<div/>",{'class':'hugepage small-12 large-6 columns'});
        if(node){
          var infoNode = node;
          title.text(infoNode.NODE_ID? "Node #"+infoNode.NODE_ID : "");
          //CORES
          if(infoNode.CORE){
            if(displaySubtitle){
              subtitle.text("Cores & CPUS");
              displaySubtitle = false;
            }
            var tBody = $("<tbody/>");
            var numaCores = infoNode.CORE;
            if (!(infoNode.CORE instanceof Array)) {
              numaCores = [numaCores];
            }
            var limit = 3; //start in 0 is index of array
            var count = 0;
            numaCores.map(function(core,i){
              var placeBody = tBody.find("tr:last");
              if(count === 0){
                placeBody = tBody.append($("<tr/>")).find("tr:last");
              }
              placeBody.append(
                $("<td/>",{"colspan":2,"class":"text-center"}).css({'vertical-align':'top'}).append(
                  $("<h6/>").text(core.ID? "Core "+core.ID : "")
                )
              );
              if(core.CPUS){
                var cpus = core.CPUS.split(",");
                if(cpus instanceof Array){
                  cpus.map(function(cpu){
                    var cpuInfo = cpu.split(":");

                    var state = (cpuInfo && cpuInfo[1] && Number(cpuInfo[1])>=0? "busy" : (Number(cpuInfo[1]) === -1? "free" : "isolated"));

                    placeBody.find("td:last").append(
                      $("<div/>",{"class":"small-6 columns cpu "+state}).append(
                        $("<div/>",{"class":""}).text("CPU #"+cpuInfo[0]).add(
                          cpuInfo && cpuInfo[1] && cpuInfo[1] >= 0? 
                            $("<a/>",{"class":"","href":"/#vms-tab/"+cpuInfo[1]}).text("VM #"+cpuInfo[1]) 
                              :
                            $("<div/>",{"class":"no-vm"}).text(Number(cpuInfo[1]) === -1?"FREE":"ISOLATED")
                        )
                      )
                    );
                  });
                }
              }
              count = count >= limit ? 0 : count+1;
            });
            coreTable.append(tBody);
          }
          //MEMORY
          if(infoNode.MEMORY){
            var infoMemory = infoNode.MEMORY;
            memory.append($("<h6/>").text("Memory"));
            var total = infoMemory && infoMemory.TOTAL? parseInt(infoMemory.TOTAL || 0): 0;
            var used = infoMemory && infoMemory.TOTAL? parseInt(infoMemory.USED || 0) : 0;
            var parser = Humanize.sizeFromKB;
            if (total > 0) {
              var ratio = Math.round((used / total) * 100);
              info_str = parser(used) + ' / ' + parser(total) + ' (' + ratio + '%)';
            } else {
              info_str = (infoMemory.USED? Humanize.size(used): '-') + ' / -'
            }
            memory.append(ProgressBar.html(used, total, info_str, 'memory-used'));
          }

          if(infoNode.HUGEPAGE){
            var infoHugepages = infoNode.HUGEPAGE;

            if (!(infoHugepages instanceof Array)) {
              infoHugepages = [infoHugepages];
            }

            hugepage.append($("<h6/>").text("Hugepage"));
            var hugepageTable = $("<table/>");
            hugepageTable.append(
              $("<thead/>").append(
                $("<tr/>").append(
                  $("<th/>").text("SIZE")
                  .add($("<th/>").text("FREE"))
                  .add($("<th/>").text("PAGES"))
                  .add($("<th/>").text("USAGE"))
                )
              )
            );
            var body = $("<tbody/>");
            infoHugepages.map(function(element,index){
              body.append(
                $("<tr/>").append(
                  $("<td/>").text(
                    element["SIZE"]
                  ).add(
                    $("<td/>").text(element["FREE"])
                  ).add(
                    $("<td/>").text(element["PAGES"])
                  ).add(
                    $("<td/>").text(element["USAGE"])
                  )
                )
              )
            });
            hugepage.append(hugepageTable.append(body));
          }
        }

        $("#placeNumaInfo").append(title.add(subtitle).add(coreTable).add($("<div/>",{"class":"row"}).append(memory.add(hugepage))));

        Tips.setup();
      });
    }
  }
})
