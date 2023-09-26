/* -------------------------------------------------------------------------- */
/* Copyright 2002-2023, OpenNebula Project, OpenNebula Systems                */
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

  //  require('foundation.tab');
  var Config = require("sunstone-config");
  var Locale = require("utils/locale");
  var Tips = require("utils/tips");
  var WizardFields = require("utils/wizard-fields");
  var FilesTable = require("tabs/files-tab/datatable");
  var UniqueId = require("utils/unique-id");
  var OpenNebulaHost = require("opennebula/host");

  /*
    TEMPLATES
   */

  var TemplateHTML = require("hbs!./os/html");

  /*
    CONSTANTS
   */

  var WIZARD_TAB_ID = require("./os/wizardTabId");
  var GUESTOS = [
    "asianux3_64Guest",
    "asianux3Guest",
    "asianux4_64Guest",
    "asianux4Guest",
    "centos64Guest",
    "centosGuest",
    "darwin64Guest",
    "darwinGuest",
    "debian4_64Guest",
    "debian4Guest",
    "debian5_64Guest",
    "debian5Guest",
    "dosGuest",
    "eComStationGuest",
    "freebsd64Guest",
    "freebsdGuest",
    "mandriva64Guest",
    "mandrivaGuest",
    "netware4Guest",
    "netware5Guest",
    "netware6Guest",
    "nld9Guest",
    "oesGuest",
    "openServer5Guest",
    "openServer6Guest",
    "oracleLinux64Guest",
    "oracleLinuxGuest",
    "os2Guest",
    "other24xLinux64Guest",
    "other24xLinuxGuest",
    "other26xLinux64Guest",
    "other26xLinuxGuest",
    "otherGuest",
    "otherGuest64",
    "otherLinux64Guest",
    "otherLinuxGuest",
    "redhatGuest",
    "rhel2Guest",
    "rhel3_64Guest",
    "rhel3Guest",
    "rhel4_64Guest",
    "rhel4Guest",
    "rhel5_64Guest",
    "rhel5Guest",
    "rhel6_64Guest",
    "rhel6Guest",
    "sjdsGuest",
    "sles10_64Guest",
    "sles10Guest",
    "sles11_64Guest",
    "sles11Guest",
    "sles64Guest",
    "slesGuest",
    "solaris10_64Guest",
    "solaris10Guest",
    "solaris6Guest",
    "solaris7Guest",
    "solaris8Guest",
    "solaris9Guest",
    "suse64Guest",
    "suseGuest",
    "turboLinux64Guest",
    "turboLinuxGuest",
    "ubuntu64Guest",
    "ubuntuGuest",
    "unixWare7Guest",
    "win2000AdvServGuest",
    "win2000ProGuest",
    "win2000ServGuest",
    "win31Guest",
    "win95Guest",
    "win98Guest",
    "windows7_64Guest",
    "windows7Guest",
    "windows7Server64Guest",
    "winLonghorn64Guest",
    "winLonghornGuest",
    "winMeGuest",
    "winNetBusinessGuest",
    "winNetDatacenter64Guest",
    "winNetDatacenterGuest",
    "winNetEnterprise64Guest",
    "winNetEnterpriseGuest",
    "winNetStandard64Guest",
    "winNetStandardGuest",
    "winNetWebGuest",
    "winNTGuest",
    "winVista64Guest",
    "winVistaGuest",
    "winXPHomeGuest",
    "winXPPro64Guest",
    "winXPProGues"
  ];
  var FIRMWARE_VALUES = {
    "BIOS": false,
    "EFI": false,
    "/usr/share/OVMF/OVMF_CODE.fd": false,
    "/usr/share/OVMF/OVMF_CODE.secboot.fd": true,
    "custom": true
  };

  var distinct = function(value, index, self){
    return self.indexOf(value)===index;
  };

  var VCPU = ''
  var cache = {}

  /*
    CONSTRUCTOR
   */

  function WizardTab(opts) {
    if (!Config.isTemplateCreationTabEnabled(opts.tabId, "os_booting")) {
      throw "Wizard Tab not enabled";
    }

    this.wizardTabId = WIZARD_TAB_ID + UniqueId.id();
    this.icon = "fa-power-off";
    this.title = Locale.tr("OS & CPU");
    this.classes = "hypervisor";

    this.kernelFilesTable = new FilesTable(
      this.wizardTabId + UniqueId.id(),
      { "select": true,
        "selectOptions": {
          "filter_fn": function(file) { return file.TYPE == 3; } // KERNEL
      }
    });
    this.initrdFilesTable = new FilesTable(
      this.wizardTabId + UniqueId.id(),
      { "select": true,
        "selectOptions": {
          "filter_fn": function(file) { return file.TYPE == 4; } // RAMDISK
      }
    });
  }

  WizardTab.prototype.constructor = WizardTab;
  WizardTab.prototype.html = _html;
  WizardTab.prototype.setup = _setup;
  WizardTab.prototype.onShow = _onShow;
  WizardTab.prototype.retrieve = _retrieve;
  WizardTab.prototype.fill = _fill;
  WizardTab.prototype.notify = _notify;

  return WizardTab;

  /*
    FUNCTION DEFINITIONS
   */

  function _html() {
    return TemplateHTML({
      "uniqueId": UniqueId.id(),
      "guestOS": GUESTOS,
      "kernelFilesTableHTML": this.kernelFilesTable.dataTableHTML,
      "initrdFilesTableHTML": this.initrdFilesTable.dataTableHTML
    });
  }

  function _onShow(context, panelForm) {
    //fill Virtio Queues inputs
    getValueVPU(context)
  }

  function getValueVPU(context, defaultValues){
    var inputVcpu = $('#VCPU')

    if(defaultValues){
      cache = Object.assign({}, defaultValues)
    }

    fillInputsVirtioQueues(context, inputVcpu, defaultValues)
  
    inputVcpu.off("input").on("input", function(){
      fillInputsVirtioQueues(context, inputVcpu, defaultValues)
    })
  }

  function fillInputsVirtioQueues(context, vpu, defaultValues){
    var value = parseInt(vpu.val(), 10) * 2 || 4
    var scsi = $('[wizard_field="VIRTIO_SCSI_QUEUES"]', context)
    var blk = $('[wizard_field="VIRTIO_BLK_QUEUES"]', context)
    var defValueBlk = (defaultValues && defaultValues.VIRTIO_BLK_QUEUES) || (cache && cache.VIRTIO_BLK_QUEUES) || ""
    var defValueScsi = (defaultValues && defaultValues.VIRTIO_SCSI_QUEUES) || (cache && cache.VIRTIO_SCSI_QUEUES) || ""
    var optionEmpty = '<option value> - </option>'
    var optionAuto = '<option value="auto">Auto</option>'
    var restOptions = '';

    for(var i = 1; i <= value; i++){
      restOptions += '<option value="'+i+'">'+i+'</option>';
    }

    scsi.empty().append(optionEmpty+optionAuto+restOptions)
    scsi.val(defValueScsi)

    blk.empty().append(optionEmpty+optionAuto+restOptions)
    blk.val(defValueBlk)

  }

  function _setup(context) {
    var that = this;
    Foundation.reflow(context, "tabs");

    //fill Virtio Queues inputs
    getValueVPU(context)

    context.on("click", "button.boot-order-up", function(){
      var tr = $(this).closest("tr");
      tr.prev().before(tr);

      _refreshBootValue(context);

      return false;
    }); 

    context.on("click", "button.boot-order-down", function(){
      var tr = $(this).closest("tr");
      tr.next().after(tr);

      _refreshBootValue(context);

      return false;
    });

    $("table.boot-order tbody", context).on("change", "input", function(){
      _refreshBootValue(context);
    });

    var kernelDSContext = $(".kernel_ds",  context);
    var kernelDSInputsContext = $("#kernel_path_inputs",  context);
    $("input[name='kernel_type']", context).change(function() {
      if ($("input[name='kernel_type']:checked", context).val() === "kernel_ds") {
        kernelDSContext.toggle();
        kernelDSInputsContext.hide();
        $("[wizard_field]", kernelDSContext).prop("wizard_field_disabled", false);
        $("[wizard_field]", kernelDSInputsContext).prop("wizard_field_disabled", true);
      } else {
        kernelDSContext.hide();
        kernelDSInputsContext.toggle();
        $("[wizard_field]", kernelDSInputsContext).prop("wizard_field_disabled", false);
        $("[wizard_field]", kernelDSContext).prop("wizard_field_disabled", true);
      }
    });

    var initrdDSContext = $(".initrd_ds",  context);
    var initrdDSInputsContext = $("#initrd_path_inputs",  context);
    $("input[name='initrd_type']", context).change(function() {
      if ($("input[name='initrd_type']:checked", context).val() === "initrd_ds") {
        initrdDSContext.toggle();
        initrdDSInputsContext.hide();
        $("[wizard_field]", initrdDSContext).prop("wizard_field_disabled", false);
        $("[wizard_field]", initrdDSInputsContext).prop("wizard_field_disabled", true);
      } else {
        initrdDSContext.hide();
        initrdDSInputsContext.toggle();
        $("[wizard_field]", initrdDSInputsContext).prop("wizard_field_disabled", false);
        $("[wizard_field]", initrdDSContext).prop("wizard_field_disabled", true);
      }
    });

    that.kernelFilesTable.initialize({
      "selectOptions": {
        "select_callback": function(aData, options) {
          $("#KERNEL_DS", context).val("$FILE[IMAGE_ID="+ aData[options.id_index] +"]");
        }
      }
    });
    that.kernelFilesTable.refreshResourceTableSelect();


    that.initrdFilesTable.initialize({
      "selectOptions": {
        "select_callback": function(aData, options) {
          $("#INITRD_DS", context).val("$FILE[IMAGE_ID="+ aData[options.id_index] +"]");
        }
      }
    });
    that.initrdFilesTable.refreshResourceTableSelect();

    $("#firmwareType", context).change(function() {
      if (FIRMWARE_VALUES[$(this).val()]){
        $("#firmwareSecure", context).show();
      }
      else{
        $("#firmwareSecure", context).hide();
      }

      if ($("#firmwareType", context).val() === "custom") {
        $("#customFirmware", context).show();
      }
      else{
        $("#customFirmware", context).hide();
      }
    });

    fillMachineTypesAndCPUModel(context);
    fillCPUFeatures(context);
  }

  function fillCPUFeatures (context, cpuModel){
    OpenNebulaHost.list({
      data : {},
      timeout: true,
      success: function (request, infoHosts){
        var cpuFeatures = []
        infoHosts.forEach((host)=> {
          if(host && host.HOST && host.HOST.IM_MAD === 'kvm' && host.HOST.TEMPLATE && host.HOST.TEMPLATE.KVM_CPU_FEATURES){
            var arrayFeatures = host.HOST.TEMPLATE.KVM_CPU_FEATURES.split(",")
            for (var i = 0; i < arrayFeatures.length; i++) {
              var currentValue = arrayFeatures[i];
              if (cpuFeatures.indexOf(currentValue) === -1) {
                cpuFeatures.push(currentValue);
              }
            }
          }
        })

        var idSelector = 'feature-cpu'
        var html = '<select id="'+idSelector+'" wizard_field="FEATURES" multiple>';
        $.each(cpuFeatures, function(i, cpuFeature){
          html += '<option value="' + cpuFeature + '">' + cpuFeature + '</option>';
        });
        html += '</select>';
        var inputFeatures = $('#cpu-features', context)
        inputFeatures.find("#"+idSelector).remove()
        $('#cpu-features', context).append(html);
        if (cpuModel && cpuModel.FEATURES){ 
          var values = cpuModel.FEATURES.split(",")
          $('#'+idSelector+' option').each(function(){
            var option = $(this);
            var value = option.val();
            if ($.inArray(value, values) !== -1) {
              option.prop("selected", true);
          }
          })
        }
      }
    })
  }

  function fillMachineTypesAndCPUModel(context, cpuModel, machineType){
    OpenNebulaHost.kvmInfo({
      data : {},
      timeout: true,
      success: function (request, kvmInfo){
        if ($("#model-cpu", context).html() === undefined){
          machines = kvmInfo[0].set_kvm_machines;
          cpus = kvmInfo[0].set_cpu_models;

          var html = "<select id=\"machine-type\" wizard_field=\"MACHINE\">";
          html += "<option value=\"\">" + " " + "</option>";
          $.each(machines, function(i, machine){
            html += "<option value='" + machine + "'>" + machine + "</option>";
          });
          html += "</select>";
          $("#kvm-info", context).append(html);

          var html = "<select id=\"sd-disk-bus\" wizard_field=\"SD_DISK_BUS\">";
          html += "<option value=\"\">" + " " + "</option>";
          html += "<option value='scsi'>SCSI</option>";
          html += "<option value='sata'>SATA</option>";
          html += "</select>";
          $("#sd-disk-bus-info", context).append(html);

          var html = "<select id=\"model-cpu\" wizard_field=\"MODEL\">";
          html += "<option value=\"\">" + " " + "</option>";
          html += "<option value=\"host-passthrough\">host-passthrough</option>";
          $.each(cpus, function(i, cpu){
            html += "<option value='" + cpu + "'>" + cpu + "</option>";
          });
          html += "</select>";
          $("#cpu-model", context).append(html);
        }

        if (machineType && machineType.MACHINE){ $("#machine-type", context).val(machineType.MACHINE); }
        if (cpuModel){ $("#model-cpu", context).val(cpuModel.MODEL); }
      },
      error: function(request, error_json){
        console.error("There was an error requesting the KVM info: " +
                      error_json.error.message);
      }
    });
  }

  function _retrieve(context) {
    var templateJSON = {};
    var osJSON = {};
    $.extend(osJSON, WizardFields.retrieve(
      $(".bootTab", context)
    ));
    $.extend(osJSON, WizardFields.retrieve(
      $(".kernelTab", context)
    ));
    $.extend(osJSON, WizardFields.retrieve(
      $(".ramdiskTab", context)
    ));

    var boot = _retrieveBootValue(context);

    if (boot && boot.length > 0) {
      osJSON["BOOT"] = boot;
    }

    if (FIRMWARE_VALUES[osJSON["FIRMWARE"]]){
      osJSON["FIRMWARE_SECURE"] = $("#secureFirmwareValue", context).is(':checked') ? "YES" : "NO";
    }

    if (osJSON["FIRMWARE"]){
      switch (osJSON["FIRMWARE"]) {
        case "custom":
          osJSON["FIRMWARE"] = $("#customFirmwarePath", context).val();
          break;
        case "":
          delete osJSON["FIRMWARE"];
          break;
        default:
          break;
      }
    }

    if (!$.isEmptyObject(osJSON)) {
      templateJSON["OS"] = osJSON; 
    }

    var featuresJSON = WizardFields.retrieve(
      $(".featuresTab", context)
    );
    if (!$.isEmptyObject(featuresJSON)) { 
      templateJSON["FEATURES"] = featuresJSON; 
    }

    var cpuModelJSON = WizardFields.retrieve(
      $(".cpuTab", context)
    );

    if (!$.isEmptyObject(cpuModelJSON)) { 
      templateJSON["CPU_MODEL"] = cpuModelJSON; 
    }

    return templateJSON;
  }

  function _fill(context, templateJSON) {
    var featuresJSON = templateJSON["FEATURES"];
    var osJSON = templateJSON["OS"];
    var modelJSON = templateJSON["CPU_MODEL"];

    if (osJSON) {
      if (osJSON["KERNEL_DS"] === undefined && osJSON["KERNEL"] !== undefined){
        $("input[value=\"kernel_path\"]", context).click();
      }

      if (osJSON["INITRD_DS"] === undefined && osJSON["INITRD"] !== undefined){
        $("input[value=\"initrd_path\"]", context).click();
      }

      if (!Object.keys(FIRMWARE_VALUES).includes(osJSON["FIRMWARE"])){
        $("#firmwareType", context).val("custom");
        $("#customFirmware", context).show();
        $("#firmwareSecure", context).show();
        $("#customFirmwarePath", context).val(osJSON["FIRMWARE"]);
        delete osJSON["FIRMWARE"];
      }

      if (osJSON["FIRMWARE_SECURE"]){
        if (osJSON["FIRMWARE_SECURE"].toLowerCase() === "yes"){
          $("#secureFirmwareValue", context).attr("checked", "checked");
        }
        else{
          $("#secureFirmwareValue", context).removeAttr("checked");
        }
        delete osJSON["FIRMWARE_SECURE"];
      }
      
      WizardFields.fill(context, osJSON);

      if (osJSON["BOOT"]) {
        _fillBootValue(context, osJSON["BOOT"]);
      }
    }

    if (featuresJSON) {
      getValueVPU(context, featuresJSON);
      WizardFields.fill(context, featuresJSON);
      
      delete templateJSON["FEATURES"];
    }

    fillMachineTypesAndCPUModel(context, modelJSON, osJSON);
    fillCPUFeatures(context, modelJSON)
    
    delete templateJSON["OS"];
    delete templateJSON["CPU_MODEL"];
  }

  //----------------------------------------------------------------------------
  // Boot order
  //----------------------------------------------------------------------------

  function _retrieveBootValue(context) {
    return $("table.boot-order", context).attr("value");
  }

  function _fillBootValue(context, value) {
    return $("table.boot-order", context).attr("value", value);
  }

  function _refreshBootValue(context) {
    var table = $("table.boot-order", context);

    var devices = [];

    $.each($("tr", table), function(){
      if ($("input", this).is(":checked")){
        devices.push( $(this).attr("value") );
      }
    });

    table.attr("value", devices.join(","));
  }

  function _addBootRow(context, value, label) {
    $("table.boot-order tbody", context).append(
      "<tr value=\""+value+"\">"+
        "<td><input type=\"checkbox\"/></td>"+
        "<td>"+value+"</td>"+
        "<td><label>"+label+"</label></td>"+
        "<td>"+
          "<button class=\"boot-order-up button radius tiny secondary\"><i class=\"fas fa-lg fa-arrow-up\" aria-hidden=\"true\"></i></button>"+
          "<button class=\"boot-order-down button radius tiny secondary\"><i class=\"fas fa-lg fa-arrow-down\" aria-hidden=\"true\"></i></button>"+
        "</td>"+
      "</tr>");
  }

  function _notify(context, templateJSON) {
    var table = $("table.boot-order", context);
    var prev_value = $(table).attr("value");

    $("table.boot-order tbody", context).html("");

    if (templateJSON.DISK !== undefined){
      var disks = templateJSON.DISK;

      if (!Array.isArray(disks)){
        disks = [disks];
      }
      disks = disks.filter(distinct);

      $.each(disks, function(i,disk){
        var label = "<i class=\"fas fa-fw fa-lg fa-server\"></i> ";
		    var disk_name = "disk";

        if (disk.IMAGE !== undefined){
          label += disk.IMAGE;
        } else if (disk.IMAGE_ID !== undefined){
          label += Locale.tr("Image ID") + " " + disk.IMAGE_ID;
        } else {
          label += Locale.tr("Volatile");
        }

        if (disk.DISK_ID === undefined){
          disk_name += i;
        } else {
          disk_name += disk.DISK_ID;
        }

        _addBootRow(context, disk_name, label);
      });
    }

    if (templateJSON.NIC !== undefined){
      var nics = templateJSON.NIC;

      if (!Array.isArray(nics)){
        nics = [nics];
      }
      nics = nics.filter(distinct);
      nics.map(function(nic,i){
        var label = "<i class=\"fas fa-fw fa-lg fa-globe\"></i> ";
        if (nic && nic.NETWORK && nic.NETWORK !== undefined){
          label += nic.NETWORK;
        } else if (nic.NETWORK_ID !== undefined){
          label += Locale.tr("Network ID") + " " + nic.NETWORK_ID;
        } else {
          label += Locale.tr("Manual settings");
        }
        _addBootRow(context, "nic"+i, label);
      });
    }

    if (templateJSON.DISK === undefined && templateJSON.NIC === undefined){
      $("table.boot-order tbody", context).append(
        "<tr>\
          <td>" + Locale.tr("Disks and NICs will appear here") + "</td>\
        </tr>");
    }

    if (prev_value.length > 0){
      var pos = 0;

      $.each(prev_value.split(","), function(i,device){
        var tr = $("tr[value=\"" + device + "\"]", table);

        if(tr.length > 0){
          $($("tr", table)[pos]).before(tr);
          $("input", tr).click();

          pos += 1;
        }
      });

      _refreshBootValue(context);
    }
  }
});
