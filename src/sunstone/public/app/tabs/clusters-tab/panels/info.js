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

  var Locale = require("utils/locale");
  var RenameTr = require("utils/panel/rename-tr");
  var Sunstone = require("sunstone");
  var TemplateTable = require("utils/panel/template-table");
  var TemplateUtils = require("utils/template-utils");

  /*
    TEMPLATES
   */

  var TemplateHTML = require("hbs!./info/html");

  /*
    CONSTANTS
   */

  var TAB_ID = require("../tabId");
  var PANEL_ID = require("./info/panelId");
  var RESOURCE = "Cluster";
  var XML_ROOT = "CLUSTER";
  var REGEX_HIDDEN_ATTRS = /^(HOST|RESERVED_CPU|RESERVED_MEM)$/

  /*
    CONSTRUCTOR
   */

  function Panel(info) {
    this.title = Locale.tr("Info");
    this.icon = "fa-info-circle";
    this.element = info[XML_ROOT];
    this.percent = false; 

    return this;
  }

  Panel.PANEL_ID = PANEL_ID;
  Panel.prototype.html = _html;
  Panel.prototype.setup = _setup;

  return Panel;

  /*
    FUNCTION DEFINITIONS
   */

  function _html() {
    var TEMPLATE = this.element.TEMPLATE

    var renameTrHTML = RenameTr.html(TAB_ID, RESOURCE, this.element.NAME);

    var attributes = TemplateTable.getTemplatesAttributes(TEMPLATE, {
      regexHidden: REGEX_HIDDEN_ATTRS
    })

    var templateTableHTML = TemplateTable.html(attributes.general, RESOURCE, Locale.tr('Attributes'));    

    var hasReservedMem = TEMPLATE.RESERVED_MEM !== '0%' && TEMPLATE.RESERVED_MEM !== '';
    var reservedMem = hasReservedMem ? parseInt(TEMPLATE.RESERVED_MEM) : 0;
    var reservedMemInput = hasReservedMem ? TEMPLATE.RESERVED_MEM : '0%';

    var hasReservedCpu = TEMPLATE.RESERVED_CPU !== '0%' && TEMPLATE.RESERVED_CPU !== '';
    var reservedCPU = hasReservedCpu ? parseInt(TEMPLATE.RESERVED_CPU) : 0;
    var reservedCPUInput = hasReservedCpu ? TEMPLATE.RESERVED_CPU : '0%';

    return TemplateHTML({
      "element": this.element,
      "renameTrHTML": renameTrHTML,
      "templateTableHTML": templateTableHTML,
      "percentCPU": reservedCPU,
      "percentCPUinput": reservedCPUInput,
      "percentMEM": reservedMem,
      "percentMEMinput": reservedMemInput
    });
  }

  function changeBarColorCPU(){
    var cpuValue = parseInt($("#change_bar_cpu").val());

    if (cpuValue > 0) {
      $("#textInput_reserved_cpu").css("background-color", "rgba(111, 220, 111, 0.5)");
    } else if (cpuValue < 0) {
      $("#textInput_reserved_cpu").css("background-color", "rgba(255, 80, 80,0.5)");
    }
  }

  function changeBarColorMEM(){
    var memValue = parseInt($("#change_bar_mem").val());

    if (memValue > 0) {
      $("#textInput_reserved_mem").css("background-color", "rgba(111, 220, 111, 0.5)");
    } else if (memValue < 0) {
      $("#textInput_reserved_mem").css("background-color", "rgba(255, 80, 80,0.5)");
    }
  }

  function changeBarCPU(){
    changeBarColorCPU();
    document.getElementById("textInput_reserved_cpu").value = document.getElementById("change_bar_cpu").value + "%";
  }

  function changeInputCPU(){
    document.getElementById("change_bar_cpu").value = parseInt(document.getElementById("textInput_reserved_cpu").value);
    changeBarColorCPU();
  }

  function changeBarMEM(){
    changeBarColorMEM();
    document.getElementById("textInput_reserved_mem").value = document.getElementById("change_bar_mem").value + "%";
  }

  function changeInputMEM(){
    document.getElementById("change_bar_mem").value = parseInt(document.getElementById("textInput_reserved_mem").value);
    changeBarColorMEM();
  }

  function _setup(context) {
    var that = this;

    RenameTr.setup(TAB_ID, RESOURCE, this.element.ID, context);

    var attributes = TemplateTable.getTemplatesAttributes(this.element.TEMPLATE, {
      regexHidden: REGEX_HIDDEN_ATTRS
    })

    TemplateTable.setup(attributes.general, RESOURCE, this.element.ID, context, attributes.hidden);

    changeBarColorCPU();
    changeBarColorMEM();

    document.getElementById("change_bar_cpu").addEventListener("input", changeBarCPU);
    document.getElementById("textInput_reserved_cpu").addEventListener("input", changeInputCPU);
    document.getElementById("change_bar_mem").addEventListener("input", changeBarMEM);
    document.getElementById("textInput_reserved_mem").addEventListener("input", changeInputMEM);

    $(document)
      .off("click", ".update_reserved")
      .on("click", ".update_reserved", function() {
        var reservedCPU = document.getElementById("textInput_reserved_cpu").value;
        var reservedMem = document.getElementById("textInput_reserved_mem").value;

        var obj = { RESERVED_CPU: reservedCPU, RESERVED_MEM: reservedMem };
        Sunstone.runAction("Cluster.append_template", that.element.ID, TemplateUtils.templateToString(obj));
    });
  }
});
