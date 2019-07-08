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
  var ProgressBar = require('utils/progress-bar');
  var Humanize = require('utils/humanize')

  /*
    TEMPLATES
   */

  var TemplateNUMA = require('hbs!./numa/html');

  /*
    CONSTANTS
   */

  var PANEL_ID = require('./numa/panelId');
  var RESOURCE = "Host"

  /*
    CONSTRUCTOR
   */

  function Panel(info) {
    this.title = Locale.tr("Numa");
    this.icon = "fa-chart-pie";

    this.element = info[RESOURCE.toUpperCase()];

    // Do not create an instance of this panel if no vcenter hypervisor
    /*if (this.element.TEMPLATE.HYPERVISOR === "vcenter") {
      throw "Panel not available for this element";
    }*/

    return this;
  };

  Panel.PANEL_ID = PANEL_ID;
  Panel.prototype.html = _html;
  Panel.prototype.setup = _setup;

  return Panel;

  /*
    FUNCTION DEFINITIONS
   */

  function _html() {
    return TemplateNUMA();
  }

  function capitalize(string){
    if (typeof string !== 'string'){ 
      return '';
    }
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
  }

  function _setup(context) {
    var that = this;

    if (that && that.element && that.element.HOST_SHARE && that.element.HOST_SHARE.NUMA_NODES) {
      var numaNodes = that.element.HOST_SHARE.NUMA_NODES;
      if (!(numaNodes instanceof Array)) {
        numaNodes = [numaNodes];
      }
      
      numaNodes.map(function(node,i){
        var title = $("<h3/>");
        var coreTable = $("<table/>");
        var memory = $("<div/>",{'class':'memory'});
        var hugepage = $("<div/>",{'class':'hugepage'});
        if(node && node.NODE){
          var infoNode = node.NODE
          title.text(infoNode.NODE_ID? "Node #"+infoNode.NODE_ID : "")
          //CORES
          if(infoNode.CORE){
            var tBody = $("<tbody/>");
            var numaCores = infoNode.CORE
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
                $("<td/>",{"colspan":2,"class":"text-center"}).append(
                  $("<h5/>").text(core.ID? "Core #"+core.ID : "")
                )
              );
              if(core.CPUS){
                var cpus = core.CPUS.split(",");
                if(cpus instanceof Array){
                  cpus.map(function(cpu){
                    var cpuInfo = cpu.split(":");
                    var state = cpuInfo && cpuInfo[1] && cpuInfo[1]>=0? "busy" : "free";
                    placeBody.find("td:last").append(
                      $("<div/>",{"class":"small-6 columns cpu "+state}).append(
                        $("<div/>",{"class":""}).text("CPU #"+cpuInfo[0]).add(
                          cpuInfo && cpuInfo[1] && cpuInfo[1] >= 0? 
                            $("<a/>",{"class":"","href":"/#vms-tab/"+cpuInfo[1]}).text("VM #"+cpuInfo[1]) 
                              :
                            $("<div/>",{"class":"no-vm"}).text("FREE")
                        )
                      )
                    );
                  });
                }
              }
              count = count >= limit ? 0 : count+1;
            });
            coreTable.append(tBody)
          }
          //MEMORY
          if(infoNode.MEMORY){
            var infoMemory = infoNode.MEMORY;
            memory.append($("<h4/>").text("Memory"));
            var total = infoMemory && infoMemory.TOTAL? parseInt(infoMemory.TOTAL): 0;
            var used = infoMemory && infoMemory.TOTAL? parseInt(infoMemory.USED) : 0;
            var parser = Humanize.sizeFromKB;
            if (total > 0) {
              var ratio = Math.round((used / total) * 100);
              info_str = parser(used) + ' / ' + parser(total) + ' (' + ratio + '%)';
            } else {
              if (info.TYPE == 1) {
                info_str = '- / -';
              } else {
                info_str = Humanize.size(used) + ' / -';
              }
            }
            memory.append(ProgressBar.html(used, total, info_str, 'memory-used'));
          }
          //HUGEPAGE
          if(infoNode.HUGEPAGE){
            var infoHugepages = infoNode.HUGEPAGE;
            hugepage.append($("<h4/>").text("Hugepage"));
            var row = $("<div/>",{'class':'row'});
            infoHugepages.map(function(element,index){
              hugePlace = $("<div/>",{"class":"small-6 columns"});
              hugeTitle = hugePlace.append($("<h5/>").text("#"+index));
              hugepageTable = $("<table/>");
              for (var info in element){
                hugepageTable.append(
                  $("<tr/>").append(
                    $("<td/>").text(
                      capitalize(info)
                    ).add(
                      $("<td/>").text(element[info])
                    )
                  )
                )
              }
              row.append(hugePlace.append(hugepageTable));
            });
            hugepage.append(row);
          }
        }
        $("#placeNumaInfo").append(title.add(coreTable).add(memory).add(hugepage));
      });
    }
  }
})

