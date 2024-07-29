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

  require("foundation");
  var CanImportWilds = require("../utils/can-import-wilds");
  var CapacityTable = require("utils/custom-tags-table");
  var ClusterTr = require("utils/panel/cluster-tr");
  var CPUBars = require("../utils/cpu-bars");
  var DatastoresCapacityTable = require("../utils/datastores-capacity-table");
  var EC2Tr = require("utils/panel/ec2-tr");
  var Humanize = require("utils/humanize");
  var Locale = require("utils/locale");
  var MemoryBars = require("../utils/memory-bars");
  var Notifier = require("utils/notifier");
  var OpenNebulaAction = require("opennebula/action");
  var OpenNebulaHost = require("opennebula/host");
  var PermissionsTable = require("utils/panel/permissions-table");
  var RenameTr = require("utils/panel/rename-tr");
  var Reserved = require("../utils/reserved");
  var Sunstone = require("sunstone");
  var TemplateTable = require("utils/panel/template-table");
  var TemplateUtils = require("utils/template-utils");

  /*
    TEMPLATES
   */

  var TemplateInfo = require("hbs!./info/html");

  /*
    CONSTANTS
   */

  var TAB_ID = require("../tabId");
  var PANEL_ID = require("./info/panelId");
  var RESOURCE = "Host";
  var XML_ROOT = "HOST";
  var REGEX_VCENTER_ATTRS = /^VCENTER_(?!(RESOURCE_POOL)$)/
  var REGEX_NSX_ATTRS = /^NSX_/
  var REGEX_HIDDEN_ATTRS = /^(HOST|VM|WILDS|ZOMBIES|RESERVED_CPU|RESERVER_MEM|EC2_ACCESS|EC2_SECRET|CAPACITY|REGION_NAME)$/

  /*
    CONSTRUCTOR
   */

  function Panel(info) {
    this.title = Locale.tr("Info");
    this.icon = "fa-info-circle";

    this.element = info[XML_ROOT];
    this.canImportWilds = CanImportWilds(this.element);

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
    var cache = OpenNebulaAction.cache("CLUSTER");

    if (!cache) {
      Sunstone.runAction("Cluster.list");
      cache = OpenNebulaAction.cache("CLUSTER");
    }
    
    var elementAux = Reserved.updateHostTemplate(cache, this.element);
    var attributes = TemplateTable.getTemplatesAttributes(this.element.TEMPLATE, {
      regexVCenter: REGEX_VCENTER_ATTRS,
      regexNSX: REGEX_NSX_ATTRS,
      regexHidden: REGEX_HIDDEN_ATTRS,
    })

    var templateTableHTML = TemplateTable.html(attributes.general, RESOURCE, Locale.tr("Attributes"));
    var templateTableVcenterHTML = TemplateTable.html(attributes.vcenter, RESOURCE, Locale.tr("vCenter information"));

    var renameTrHTML = RenameTr.html(TAB_ID, RESOURCE, this.element.NAME);
    var clusterTrHTML = ClusterTr.html(this.element.CLUSTER);
    var permissionsTableHTML = PermissionsTable.html(TAB_ID, RESOURCE, this.element);

    var cpuBars = CPUBars.html(elementAux);
    var memoryBars = MemoryBars.html(elementAux);
    var datastoresCapacityTableHTML = DatastoresCapacityTable.html(this.element);

    var realCPU = parseInt(this.element.HOST_SHARE.TOTAL_CPU, 10);
    var realMEM = parseInt(this.element.HOST_SHARE.TOTAL_MEM, 10);

    return TemplateInfo({
      "element": this.element,
      "renameTrHTML": renameTrHTML,
      "clusterTrHTML": clusterTrHTML,
      "templateTableHTML": templateTableHTML,
      "templateTableVcenterHTML": templateTableVcenterHTML,
      "permissionsTableHTML": permissionsTableHTML,
      "cpuBars": cpuBars,
      "memoryBars": memoryBars,
      "stateStr": OpenNebulaHost.stateStr(this.element.STATE),
      "datastoresCapacityTableHTML": datastoresCapacityTableHTML,
      "maxReservedMEM": realMEM * 2,
      "maxReservedCPU": realCPU * 2,
      "realCPU": realCPU,
      "realMEM": Humanize.size(realMEM),
      "virtualMEMInput": Humanize.size(this.element.HOST_SHARE.MAX_MEM),
      "ec2_tr": EC2Tr.html(RESOURCE, this.element.TEMPLATE),
      "capacityTableHTML": CapacityTable.html()
    });
  }

  function changeInputCPU(maxCPU){
    if ($("#textInput_reserved_cpu_hosts").val() === "") {
      $("#change_bar_cpu_hosts").val(0);
      $("#textInput_reserved_cpu_hosts").val("");
    } else {
      $("#change_bar_cpu_hosts").val(parseInt($("#textInput_reserved_cpu_hosts").val()));
    }

    changeColorInputCPU(maxCPU);
  }

  function changeInputMEM(maxMEM){
    if ($("#textInput_reserved_mem_hosts").val() === "") {
      $("#change_bar_mem_hosts").val(0);
    } else {
      $("#change_bar_mem_hosts").val(Humanize.sizeToMB($("#textInput_reserved_mem_hosts").val()) * 1024);
    }

    changeColorInputMEM(maxMEM);
  }

  function changeColorInputCPU(maxCPU){
    if (parseInt($("#change_bar_cpu_hosts").val()) > parseInt(maxCPU)) {
      $("#textInput_reserved_cpu_hosts").css("background-color", "rgba(111, 220, 111, 0.5)");
    }
    else if (parseInt($("#change_bar_cpu_hosts").val()) < parseInt(maxCPU)) {
      $("#textInput_reserved_cpu_hosts").css("background-color", "rgba(255, 80, 80, 0.5)");
    } else {
      $("#textInput_reserved_cpu_hosts").css("background-color", "white");
    }
  }

  function changeColorInputMEM(maxMEM){
    if (parseInt($("#change_bar_mem_hosts").val()) > parseInt(maxMEM)) {
      $("#textInput_reserved_mem_hosts").css("background-color", "rgba(111, 220, 111, 0.5)");
    }
    else if (parseInt($("#change_bar_mem_hosts").val()) < parseInt(maxMEM)) {
      $("#textInput_reserved_mem_hosts").css("background-color", "rgba(255, 80, 80, 0.5)");
    } else {
      $("#textInput_reserved_mem_hosts").css("background-color", "white");
    }
  }

  function _setup(context) {
    var that = this;

    $(".ec2", context).show();

    RenameTr.setup(TAB_ID, RESOURCE, this.element.ID, context);
    ClusterTr.setup(RESOURCE, this.element.ID, this.element.CLUSTER_ID, context);
    PermissionsTable.setup(TAB_ID, RESOURCE, this.element, context);    

    var attributes = TemplateTable.getTemplatesAttributes(this.element.TEMPLATE, {
      regexVCenter: REGEX_VCENTER_ATTRS,
      regexNSX: REGEX_NSX_ATTRS,
      regexHidden: REGEX_HIDDEN_ATTRS
    });

    if ($.isEmptyObject(attributes.vcenter)) {
      $(".vcenter", context).hide();
    }

    // General Attributes section
    TemplateTable.setup(attributes.general, RESOURCE, this.element.ID, context, attributes.hidden, attributes.vcenter);
    // vCenter Attributes section
    TemplateTable.setup(attributes.vcenter, RESOURCE, this.element.ID, context, attributes.hidden, attributes.general);

    //.off and .on prevent multiple clicks events
    $(context).off("click", "#update_reserved_hosts")
    $(context).on("click", "#update_reserved_hosts", function() {
      var CPU = that && that.element && that.element.HOST_SHARE && that.element.HOST_SHARE.TOTAL_CPU;
      var MEMORY = that && that.element && that.element.HOST_SHARE && that.element.HOST_SHARE.TOTAL_MEM;

      if(CPU && MEMORY) {
        $("#update_reserved_hosts", context).prop("disabled", true);
        var reservedCPU = parseInt($("#textInput_reserved_cpu_hosts", context).val(),10);
        var inputNumber = Humanize.sizeToMB($("#textInput_reserved_mem_hosts").val());
        var reservedMem = parseInt(inputNumber * 1024, 10);
        var CPU = parseInt(CPU||0,10);
        var MEM = parseInt(MEMORY||0,10);
        reservedCPU = CPU - reservedCPU;
        reservedMem = MEM - reservedMem;
        var obj = { RESERVED_CPU: reservedCPU, RESERVED_MEM: reservedMem };
        Sunstone.runAction("Host.append_template", that.element.ID, TemplateUtils.templateToString(obj));
      }
    });

    $("#change_bar_cpu_hosts", context).on("input", function(){
      changeColorInputCPU(that.element.HOST_SHARE.TOTAL_CPU);
      $("#textInput_reserved_cpu_hosts", context).val($("#change_bar_cpu_hosts", context).val());
    });

    $("#textInput_reserved_cpu_hosts", context).on("keyup", function(){
      var element = $(this);
      var slider = $("#change_bar_cpu_hosts", context);
      var min = slider.attr("min");
      var max = slider.attr("max");

      if (parseInt(element.val(), 10) >= parseInt(min, 10) && parseInt(element.val(), 10) <= parseInt(max, 10)) {
        slider.prop("disabled", false);
        slider.attr("value", element.val());
      } else {
        if (parseInt(element.val(), 10) <= parseInt(min, 10)) {
          Notifier.notifyError(Locale.tr("it must not be a negative number"));
        }

        slider.attr("value", element.attr("mid"));
        slider.prop("disabled", true);
      }
      changeInputCPU(that.element.HOST_SHARE.TOTAL_CPU);
    });

    $("#change_bar_mem_hosts", context).on("input", function(){
      changeColorInputMEM(that.element.HOST_SHARE.TOTAL_MEM);
      $("#textInput_reserved_mem_hosts", context).val(Humanize.size(parseInt($("#change_bar_mem_hosts").val())));
    });

    $("#textInput_reserved_mem_hosts", context).on("input", function(){
      changeInputMEM(that.element.HOST_SHARE.TOTAL_MEM);
    });

    $("#update_reserved_hosts", context).prop("disabled", false);

    CapacityTable.setup(context, true, RESOURCE, this.element.TEMPLATE, this.element.ID);
    EC2Tr.setup(RESOURCE, this.element.ID, context);
    CapacityTable.fill(context, this.element.TEMPLATE.CAPACITY);

    $(".change_to_vector_attribute", context).hide();
    $(".custom_tag_value", context).focusout(function(){
      var key = $(".custom_tag_key", this.parentElement.parentElement).val();

      if (!that.element.TEMPLATE.CAPACITY) {
        that.element.TEMPLATE.CAPACITY = {};
      }

      that.element.TEMPLATE.CAPACITY[key] = this.value;
      Sunstone.runAction(RESOURCE + ".update_template", that.element.ID, TemplateUtils.templateToString(that.element.TEMPLATE));
    });

    if (this.element.TEMPLATE.IM_MAD !== "ec2") {
      $(".ec2", context).hide();
    }
  }
});
