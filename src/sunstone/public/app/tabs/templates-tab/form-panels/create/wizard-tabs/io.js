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

  var Config = require('sunstone-config');
  var Locale = require('utils/locale');
  var Tips = require('utils/tips');
  var WizardFields = require('utils/wizard-fields');
  var UniqueId = require('utils/unique-id');
  var CreateUtils = require('./utils');

  /*
    TEMPLATES
   */

  var TemplateHTML = require('hbs!./io/html');

  /*
    CONSTANTS
   */

  var WIZARD_TAB_ID = require('./io/wizardTabId');

  /*
    CONSTRUCTOR
   */

  function WizardTab(opts) {
    if (!Config.isTemplateCreationTabEnabled(opts.tabId, 'input_output')) {
      throw "Wizard Tab not enabled";
    }

    this.wizardTabId = WIZARD_TAB_ID + UniqueId.id();
    this.icon = 'fa-exchange-alt';
    this.title = Locale.tr("Input/Output");
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
    return TemplateHTML({'uniqueId': UniqueId.id()});
  }

  function _onShow(context, panelForm) {
  }

  function _setup(context) {
    $("input[name='graphics_type']", context).change(function() {

      if ($(this).attr("value") !== '') {
        if($('input[wizard_field="LISTEN"]', context).val() == ""){
          $('input[wizard_field="LISTEN"]', context).val("0.0.0.0");
        }

        $('.graphics-setting', context).removeAttr('disabled').prop('wizard_field_disabled', false);
      } else {
        $('.graphics-setting', context).attr('disabled', 'disabled').prop('wizard_field_disabled', true);
      }
    });

    $("input[name='graphics_type']", context).change();

    context.off("click", '#add_input');
    context.on("click", '#add_input', function() {
      var table = $('#input_table', context)[0];
      var rowCount = table.rows.length;
      var row = table.insertRow(-1);
      $(row).addClass("vm_param");

      var cell1 = row.insertCell(0);
      var element1 = document.createElement("input");
      element1.id = "INPUT_TYPE"
      element1.type = "text";
      element1.value = WizardFields.retrieveInput($('select#INPUT_TYPE', context));
      cell1.appendChild(element1);

      var cell2 = row.insertCell(1);
      var element2 = document.createElement("input");
      element2.id = "INPUT_BUS"
      element2.type = "text";
      element2.value = WizardFields.retrieveInput($('select#INPUT_BUS', context));
      cell2.appendChild(element2);

      var cell3 = row.insertCell(2);
      cell3.innerHTML = "<i class='fa fa-times-circle fa fa-lg remove-tab'></i>";
    });

    context.off('click', "i.remove-tab");
    context.on('click', "i.remove-tab", function() {
      $(this).closest("tr").remove()
    });

    context.off("click", ".add_pci");
    context.on("click", ".add_pci", function(){
      var tr = $(CreateUtils.pciRowHTML()).appendTo( $(".pci_devices tbody", context) );

      CreateUtils.fillPCIRow({tr: tr, remove: true});
    });

    CreateUtils.setupPCIRows($(".pci_devices", context));

    // Hide video section if the hypervisor it's kvm (Done here because there is a bug if we used the css classes)
    $("input[name='hypervisor']").change(function() {
      if (this.value === "kvm") {
        $(".video").show()
      }
      else {
        $(".video").hide()
      }
    })

    // Event on change video type attribute
    $("input[name='video_type']", context).change(function() {

      /**
       * - Only if the hypervisor it's kvm.
       * - If the user select VIDEO_TYPE auto, the rest of the fields will be hidden and the request has not any VIDEO section.
       * - If the user select VIDEO_TYPE none, the rest of the fields will be hidden and the request has VIDEO section but only with type=none.
       * - If the user select VIDEO_TYPE cirrus, ATS, IOMMU and resolution will be hidden.
       * - If the user select VIDEO_TYPE vga, ATS and IOMMU will be hidden.
       * - If the user select VIDEO_TYPE virtio, all attributes will be show to the user.
       * - Resolution will be one of the values of the COMMON_RESOLUTIONS or a custom resolution.
       */
      if ($(this).attr("value") === 'auto' || $(this).attr("value") === 'none') {

        $('.video-settings', context).css('display', 'none');
      } 
      else if ($(this).attr("value") === 'cirrus') {

        $('.video-settings', context).css('display', '');
        $('.video-settings-iommu', context).css('display', 'none');
        $('.video-settings-iommu-label', context).css('display', 'none');
        $('.video-settings-ats', context).css('display', 'none');
        $('.video-settings-ats-label', context).css('display', 'none');
        $('.video-settings-vram', context).css('display', '');
        $('.video-settings-resolution', context).css('display', 'none');
        $('.video-settings-resolution-label', context).css('display', 'none');
        $('.video-settings-resolution-width', context).css('display', 'none');
        $('.video-settings-resolution-height', context).css('display', 'none');
      }
      else if ($(this).attr("value") === 'vga') {

        $('.video-settings', context).css('display', '');
        $('.video-settings-iommu', context).css('display', 'none');
        $('.video-settings-iommu-label', context).css('display', 'none');
        $('.video-settings-ats', context).css('display', 'none');
        $('.video-settings-ats-label', context).css('display', 'none');
        $('.video-settings-vram', context).css('display', '');
        $('.video-settings-resolution', context).css('display', '');
        $('.video-settings-resolution-label', context).css('display', '');
        $('.video-settings-resolution-width', context).css('display', '');
        $('.video-settings-resolution-height', context).css('display', '');
        $("select[name='resolution']", context).change()
      }
      else if ($(this).attr("value") === 'virtio') {

        $('.video-settings', context).css('display', '');
        $('.video-settings-iommu', context).css('display', '');
        $('.video-settings-iommu-label', context).css('display', '');
        $('.video-settings-ats', context).css('display', '');
        $('.video-settings-ats-label', context).css('display', '');
        $('.video-settings-vram', context).css('display', '');
        $('.video-settings-resolution', context).css('display', '');
        $('.video-settings-resolution-label', context).css('display', '');
        $('.video-settings-resolution-width', context).css('display', '');
        $('.video-settings-resolution-height', context).css('display', '');
        $("select[name='resolution']", context).change()
      }
    });

    // Manage custom resolution
    $("select[name='resolution']", context).change(function() {

      if ($(this).val() === "custom") {

        $('.video-settings-resolution-width', context).css('display', '');
        $('.video-settings-resolution-height', context).css('display', '');
      }
      else {
        $('.video-settings-resolution-width', context).css('display', 'none');
        $('.video-settings-resolution-height', context).css('display', 'none');
      }

    })

  }

  function _retrieve(context) {
    var templateJSON = {};
    var graphicsJSON = WizardFields.retrieve(context.find("div.graphics"));

    if (!$.isEmptyObject(graphicsJSON) && $(".RANDOM_PASSWD:checked", context).length > 0) {
      graphicsJSON["RANDOM_PASSWD"] = "YES";
    }

    if (!$.isEmptyObject(graphicsJSON)) { templateJSON['GRAPHICS'] = graphicsJSON; };

    var inputsJSON = [];
    $('#input_table tr', context).each(function() {
      if ($('#INPUT_TYPE', $(this)).val()) {
        inputsJSON.push({
          'TYPE': WizardFields.retrieveInput($('#INPUT_TYPE', $(this))),
          'BUS': WizardFields.retrieveInput($('#INPUT_BUS', $(this)))
        });
      }
    });

    if (!$.isEmptyObject(inputsJSON)) { templateJSON['INPUT'] = inputsJSON; };

    $('.pci_devices tbody tr', context).each(function(i,row){
      var pci = WizardFields.retrieve(row);

      if (!$.isEmptyObject(pci)){
        if (templateJSON['PCI'] == undefined){
          templateJSON['PCI'] = [];
        }

        templateJSON['PCI'].push(pci);
      }
    });

    // Add video section to the request
    // - If video type is auto, don't send any video section
    // - If video type is none, send only video type
    // - Checkbox attributes will be YES/NO
    var videoJSON = WizardFields.retrieve(context.find("div.video"));

    videoJSON.TYPE = videoJSON.VIDEO_TYPE
    delete videoJSON.VIDEO_TYPE

    if (videoJSON.TYPE === "auto") {
      videoJSON = {}
    }

    if (videoJSON.TYPE === "none") {
      videoJSON = {
        "TYPE": "none"
      }
    }

    if (!$.isEmptyObject(videoJSON) && $(".video-settings-iommu:checked", context).length > 0) {
      videoJSON["IOMMU"] = "YES";
    }

    if (!$.isEmptyObject(videoJSON) && $(".video-settings-ats:checked", context).length > 0) {
      videoJSON["ATS"] = "YES";
    }

    if (!$.isEmptyObject(videoJSON) && videoJSON.RESOLUTION == "custom") {
      videoJSON.RESOLUTION = videoJSON.RESOLUTION_WIDTH + "x" + videoJSON.RESOLUTION_HEIGHT
    }

    delete videoJSON.RESOLUTION_WIDTH
    delete videoJSON.RESOLUTION_HEIGHT


    if (!$.isEmptyObject(videoJSON)) { templateJSON['VIDEO'] = videoJSON; };

    return templateJSON;
  }

  function _fill(context, templateJSON) {
    var graphicsJSON = templateJSON['GRAPHICS'];
    if (graphicsJSON) {
      var type = graphicsJSON.TYPE;
      if (type) {
        $(".graphics input[wizard_field='TYPE'][value='" + type.toUpperCase() + "']", context).click();
      } else {
        $(".graphics input[wizard_field='TYPE'][value='']", context).click();
      }

      if (graphicsJSON["RANDOM_PASSWD"] == "YES") {
        $(".RANDOM_PASSWD", context).attr("checked", "checked");
      }

      WizardFields.fill(context, graphicsJSON);
      delete templateJSON['GRAPHICS']
    } else {
      $(".graphics input[wizard_field='TYPE'][value='']", context).click();
    }

    var inputsJSON = templateJSON['INPUT'];
    if (inputsJSON) {
      if (!(inputsJSON instanceof Array)) {
        inputsJSON = [inputsJSON];
      }

      $.each(inputsJSON, function() {
        var table = $('#input_table', context)[0];
        var rowCount = table.rows.length;
        var row = table.insertRow(rowCount);

        var cell1 = row.insertCell(0);
        var element1 = document.createElement("input");
        element1.id = "INPUT_TYPE";
        element1.type = "text";
        element1.value = this.TYPE;
        cell1.appendChild(element1);

        var cell2 = row.insertCell(1);
        var element2 = document.createElement("input");
        element2.id = "INPUT_BUS";
        element2.type = "text";
        element2.value = this.BUS;
        cell2.appendChild(element2);

        var cell3 = row.insertCell(2);
        cell3.innerHTML = "<i class='fa fa-times-circle fa fa-lg remove-tab'></i>";
      });

      delete templateJSON['INPUT'];
    }

    $(".pci_devices i.remove-tab", context).trigger("click");

    var pcis = templateJSON['PCI'];

    if (pcis == undefined){
      pcis = [];
    }

    if (!Array.isArray(pcis)){ // If only 1 convert to array
      pcis = [pcis];
    }

    $.each(pcis, function(i, pci){
      $(".add_pci", context).trigger("click");
      var tr = $('.pci_devices tbody tr', context).last();

      WizardFields.fill(tr, pci);
    });

    delete templateJSON.PCI;

    // Video section
    var videoJSON = templateJSON['VIDEO'];

    if (videoJSON) {

      var type = videoJSON.TYPE;
      if (type) {
        $(".video input[wizard_field='VIDEO_TYPE'][value='" + type + "']", context).click();
      } else {
        $(".video input[wizard_field='VIDEO_TYPE'][value='']", context).click();
      }

      videoJSON.VIDEO_TYPE = type
      delete videoJSON.TYPE

      if (videoJSON["IOMMU"] == "YES") {
        $(".video-settings-iommu", context).attr("checked", "checked");
        delete videoJSON["IOMMU"]
      }
  
      if (videoJSON["ATS"] == "YES") {
        $(".video-settings-ats", context).attr("checked", "checked");
        delete videoJSON["ATS"]
      }

      // Manage resolution if it's a custom value
      let resolutions = $("select[name='resolution'] option").map(function() { return this.value; }).get();
      let resolution = videoJSON.RESOLUTION
      if (resolutions && resolution && (resolution!== "") && !resolutions.includes(resolution)) {
        let storeResolutions = resolution.split("x")
        videoJSON.RESOLUTION_WIDTH = storeResolutions[0]
        videoJSON.RESOLUTION_HEIGHT = storeResolutions[1]
        videoJSON.RESOLUTION = "custom"
      }

      WizardFields.fill(context, videoJSON);

      delete templateJSON['VIDEO']

    } else {
      $(".video input[wizard_field='TYPE'][value='']", context).click();
    }

  }
});
