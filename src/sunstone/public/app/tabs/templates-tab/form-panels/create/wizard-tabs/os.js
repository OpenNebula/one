/* -------------------------------------------------------------------------- */
/* Copyright 2002-2015, OpenNebula Project, OpenNebula Systems                */
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
  var Config = require('sunstone-config');
  var Locale = require('utils/locale');
  var Tips = require('utils/tips');
  var WizardFields = require('utils/wizard-fields');
  var FilesTable = require('tabs/files-tab/datatable');

  /*
    TEMPLATES
   */

  var TemplateHTML = require('hbs!./os/html');

  /*
    CONSTANTS
   */

  var WIZARD_TAB_ID = require('./os/wizardTabId');
  var GUESTOS = [
    'asianux3_64Guest',
    'asianux3Guest',
    'asianux4_64Guest',
    'asianux4Guest',
    'centos64Guest',
    'centosGuest',
    'darwin64Guest',
    'darwinGuest',
    'debian4_64Guest',
    'debian4Guest',
    'debian5_64Guest',
    'debian5Guest',
    'dosGuest',
    'eComStationGuest',
    'freebsd64Guest',
    'freebsdGuest',
    'mandriva64Guest',
    'mandrivaGuest',
    'netware4Guest',
    'netware5Guest',
    'netware6Guest',
    'nld9Guest',
    'oesGuest',
    'openServer5Guest',
    'openServer6Guest',
    'oracleLinux64Guest',
    'oracleLinuxGuest',
    'os2Guest',
    'other24xLinux64Guest',
    'other24xLinuxGuest',
    'other26xLinux64Guest',
    'other26xLinuxGuest',
    'otherGuest',
    'otherGuest64',
    'otherLinux64Guest',
    'otherLinuxGuest',
    'redhatGuest',
    'rhel2Guest',
    'rhel3_64Guest',
    'rhel3Guest',
    'rhel4_64Guest',
    'rhel4Guest',
    'rhel5_64Guest',
    'rhel5Guest',
    'rhel6_64Guest',
    'rhel6Guest',
    'sjdsGuest',
    'sles10_64Guest',
    'sles10Guest',
    'sles11_64Guest',
    'sles11Guest',
    'sles64Guest',
    'slesGuest',
    'solaris10_64Guest',
    'solaris10Guest',
    'solaris6Guest',
    'solaris7Guest',
    'solaris8Guest',
    'solaris9Guest',
    'suse64Guest',
    'suseGuest',
    'turboLinux64Guest',
    'turboLinuxGuest',
    'ubuntu64Guest',
    'ubuntuGuest',
    'unixWare7Guest',
    'win2000AdvServGuest',
    'win2000ProGuest',
    'win2000ServGuest',
    'win31Guest',
    'win95Guest',
    'win98Guest',
    'windows7_64Guest',
    'windows7Guest',
    'windows7Server64Guest',
    'winLonghorn64Guest',
    'winLonghornGuest',
    'winMeGuest',
    'winNetBusinessGuest',
    'winNetDatacenter64Guest',
    'winNetDatacenterGuest',
    'winNetEnterprise64Guest',
    'winNetEnterpriseGuest',
    'winNetStandard64Guest',
    'winNetStandardGuest',
    'winNetWebGuest',
    'winNTGuest',
    'winVista64Guest',
    'winVistaGuest',
    'winXPHomeGuest',
    'winXPPro64Guest',
    'winXPProGues'
  ]

  /*
    CONSTRUCTOR
   */

  function WizardTab() {
    if (!Config.isTemplateCreationTabEnabled('os_booting')) {
      throw "Wizard Tab not enabled";
    }

    this.wizardTabId = WIZARD_TAB_ID;
    this.icon = 'fa-power-off';
    this.title = Locale.tr("OS Booting");
    this.classes = "hypervisor only_kvm only_vmware only_xen"

    this.kernelFilesTable = new FilesTable(this.wizardTabId + 'KernelTable', {
      'select': true,
      'selectOptions': {
        "filter_fn": function(file) { return file.TYPE == 3; } // KERNEL
      }
    });
    this.initrdFilesTable = new FilesTable(this.wizardTabId + 'InitrdTable', {
      'select': true,
      'selectOptions': {
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

  return WizardTab;

  /*
    FUNCTION DEFINITIONS
   */

  function _html() {
    return TemplateHTML({
      'guestOS': GUESTOS,
      'kernelFilesTableHTML': this.kernelFilesTable.dataTableHTML,
      'initrdFilesTableHTML': this.initrdFilesTable.dataTableHTML
    });
  }

  function _onShow(context, panelForm) {
  }

  function _setup(context) {
    var that = this;
    context.foundation('tab', 'reflow');

    var kernelDSContext = $(".kernel_ds",  context);
    var kernelDSInputsContext = $("#kernel_path_inputs",  context);
    $("input[name='kernel_type']", context).change(function() {
      if ($("input[name='kernel_type']:checked", context).val() == "kernel_ds") {
        kernelDSContext.toggle();
        kernelDSInputsContext.hide();
        $("[wizard_field]", kernelDSContext).prop('wizard_field_disabled', false);
        $("[wizard_field]", kernelDSInputsContext).prop('wizard_field_disabled', true);
      } else {
        kernelDSContext.hide();
        kernelDSInputsContext.toggle();
        $("[wizard_field]", kernelDSInputsContext).prop('wizard_field_disabled', false);
        $("[wizard_field]", kernelDSContext).prop('wizard_field_disabled', true);
      }
    });

    var initrdDSContext = $(".initrd_ds",  context);
    var initrdDSInputsContext = $("#initrd_path_inputs",  context);
    $("input[name='initrd_type']", context).change(function() {
      if ($("input[name='initrd_type']:checked", context).val() == "initrd_ds") {
        initrdDSContext.toggle();
        initrdDSInputsContext.hide();
        $("[wizard_field]", initrdDSContext).prop('wizard_field_disabled', false);
        $("[wizard_field]", initrdDSInputsContext).prop('wizard_field_disabled', true);
      } else {
        initrdDSContext.hide();
        initrdDSInputsContext.toggle();
        $("[wizard_field]", initrdDSInputsContext).prop('wizard_field_disabled', false);
        $("[wizard_field]", initrdDSContext).prop('wizard_field_disabled', true);
      }
    });

    that.kernelFilesTable.initialize({
      'selectOptions': {
        'select_callback': function(aData, options) {
          $('#KERNEL_DS', context).val("$FILE[IMAGE_ID="+ aData[options.id_index] +"]");
        }
      }
    });
    that.kernelFilesTable.refreshResourceTableSelect();


    that.initrdFilesTable.initialize({
      'selectOptions': {
        'select_callback': function(aData, options) {
          $('#INITRD_DS', context).val("$FILE[IMAGE_ID="+ aData[options.id_index] +"]");
        }
      }
    });
    that.initrdFilesTable.refreshResourceTableSelect();
  }

  function _retrieve(context) {
    var templateJSON = {};
    var osJSON = {}
    $.extend(osJSON, WizardFields.retrieve('#bootTab', context));
    $.extend(osJSON, WizardFields.retrieve('#kernelTab', context));
    $.extend(osJSON, WizardFields.retrieve('#ramdiskTab', context));

    var boot = "";
    var val;
    for (var i = 0; i < 3; i++) {
      val = $('#BOOT_' + i, context).val();
      if (val != undefined && val.length > 0) {
        if (boot.length > 0) {boot += ","}
        boot += val;
      }
    }

    if (boot.length > 0) {
      osJSON["BOOT"] = boot;
    }

    if (!$.isEmptyObject(osJSON)) { templateJSON['OS'] = osJSON; };

    var featuresJSON = WizardFields.retrieve('#featuresTab', context)
    if (!$.isEmptyObject(featuresJSON)) { templateJSON['FEATURES'] = featuresJSON; };

    return templateJSON;
  }

  function _fill(context, templateJSON) {
    var osJSON = templateJSON['OS'];
    if (osJSON) {
      WizardFields.fill(context, osJSON);

      if (osJSON && osJSON['BOOT']) {
        var boot_vals = osJSON['BOOT'].split(",");

        for (var i = 0; i < 3 && i < boot_vals.length; i++) {
          $('#BOOT_' + i, context).val(boot_vals[i]);
        }
      }

      delete templateJSON['OS'];
    }

    var featuresJSON = templateJSON['FEATURES'];
    if (featuresJSON) {
      WizardFields.fill(context, featuresJSON);
      delete templateJSON['FEATURES'];
    }
  }
});
