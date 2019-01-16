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

  var TemplateHTML = require("hbs!./info/html");
  var Locale = require("utils/locale");
  var RenameTr = require("utils/panel/rename-tr");
  var TemplateTable = require("utils/panel/template-table");
  var Sunstone = require("sunstone");
  var TemplateUtils = require("utils/template-utils");

  /*
    CONSTANTS
   */

  var TAB_ID = require("../tabId");
  var PANEL_ID = require("./info/panelId");
  var RESOURCE = "Cluster";
  var XML_ROOT = "CLUSTER";

  var OVERCOMMIT_DIALOG_ID = require("utils/dialogs/overcommit/dialogId");

  /*
    CONSTRUCTOR
   */

  function Panel(info) {
    var that = this;

    this.title = Locale.tr("Info");
    this.icon = "fa-info-circle";

    this.element = info[XML_ROOT];
    this.percent = false;

    // Hide information in the template table. Unshow values are stored
    // in the unshownTemplate object to be used when the element info is updated.
    that.unshownTemplate = {};
    that.strippedTemplate = {};
    var unshownKeys = ["HOST", "RESERVED_CPU", "RESERVED_MEM"];
    $.each(that.element.TEMPLATE, function(key, value) {
      if ($.inArray(key, unshownKeys) > -1) {
        that.unshownTemplate[key] = value;
      } else {
        that.strippedTemplate[key] = value;
      }
    });

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
    var renameTrHTML = RenameTr.html(TAB_ID, RESOURCE, this.element.NAME);
    var templateTableHTML = TemplateTable.html(
                                      this.strippedTemplate,
                                      RESOURCE,
                                      Locale.tr("Attributes"));
    var reservedMem;
    var reservedMemInput;
    if (this.element.TEMPLATE.RESERVED_MEM != "0%" && this.element.TEMPLATE.RESERVED_MEM != ""){
      reservedMem = parseInt(this.element.TEMPLATE.RESERVED_MEM);
      reservedMemInput = this.element.TEMPLATE.RESERVED_MEM;
    } else {
      reservedMem = 0;
      reservedMemInput = "0%";
    }

    var reservedCPU;
    var reservedCPUInput;
    if (this.element.TEMPLATE.RESERVED_CPU != "0%" && this.element.TEMPLATE.RESERVED_CPU != ""){
      reservedCPU = parseInt(this.element.TEMPLATE.RESERVED_CPU);
      reservedCPUInput = this.element.TEMPLATE.RESERVED_CPU;
    } else {
      reservedCPU = 0;
      reservedCPUInput = "0%";
    }

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
    if (cpuValue > 0){
      $("#textInput_reserved_cpu").css("background-color", "rgba(111, 220, 111, 0.5)");
    }

    if (cpuValue < 0){
      $("#textInput_reserved_cpu").css("background-color", "rgba(255, 80, 80,0.5)");
    }
  }

  function changeBarColorMEM(){
    var memValue = parseInt($("#change_bar_mem").val());
    if (memValue > 0){
      $("#textInput_reserved_mem").css("background-color", "rgba(111, 220, 111, 0.5)");
    }

    if (memValue < 0){
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

    TemplateTable.setup(this.strippedTemplate, RESOURCE, this.element.ID, context, this.unshownTemplate);

    changeBarColorCPU();
    changeBarColorMEM();

    document.getElementById("change_bar_cpu").addEventListener("input", changeBarCPU);
    document.getElementById("textInput_reserved_cpu").addEventListener("input", changeInputCPU);
    document.getElementById("change_bar_mem").addEventListener("input", changeBarMEM);
    document.getElementById("textInput_reserved_mem").addEventListener("input", changeInputMEM);

    $(document).off("click", ".update_reserved").on("click", ".update_reserved", function(){
        var reservedCPU = document.getElementById("textInput_reserved_cpu").value;
        var reservedMem = document.getElementById("textInput_reserved_mem").value;

        var obj = { RESERVED_CPU: reservedCPU, RESERVED_MEM: reservedMem };
        Sunstone.runAction("Cluster.append_template", that.element.ID, TemplateUtils.templateToString(obj));
    });
  }
});
