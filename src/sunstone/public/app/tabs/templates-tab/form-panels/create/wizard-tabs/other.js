define(function(require) {
  /*
    DEPENDENCIES
   */

  var Config = require('sunstone-config');
  var Locale = require('utils/locale');
  var Tips = require('utils/tips');
  var WizardFields = require('utils/wizard-fields');
  var TemplateUtils = require('utils/template-utils');
  var CustomTagsTable = require('utils/custom-tags-table');
  var OpenNebulaHost = require('opennebula/host');

  /*
    TEMPLATES
   */

  var TemplateHTML = require('hbs!./other/html');
  var RowTemplateHTML = require('hbs!./other/pciRow');

  /*
    CONSTANTS
   */

  var WIZARD_TAB_ID = require('./other/wizardTabId');

  /*
    CONSTRUCTOR
   */

  function WizardTab() {
    if (!Config.isTemplateCreationTabEnabled('other')) {
      throw "Wizard Tab not enabled";
    }

    this.wizardTabId = WIZARD_TAB_ID;
    this.icon = 'fa-ellipsis-h';
    this.title = Locale.tr("Other");
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
      'customTagsTableHTML': CustomTagsTable.html()
    });
  }

  function _onShow(context, panelForm) {
  }

  function _setup(context) {
    CustomTagsTable.setup(context);

    context.on("change", "#raw_type", function() {
      var choice_str = $(this).val();
      switch (choice_str) {
      case 'vmware':
        $("#data_vmx_div", context).show();
        break;
      default:
        $("#data_vmx_div", context).hide();
      }
    });

    context.off("click", ".add_pci");
    context.on("click", ".add_pci", function(){
      var tr = $(RowTemplateHTML()).appendTo( $(".pci_devices tbody", context) );

      OpenNebulaHost.pciDevices({
        data : {},
        timeout: true,
        success: function (request, pciDevices){
          var html = "<select>";

          html += '<option device="" class="" vendor="">'+Locale.tr("Please select")+'</option>';

          $.each(pciDevices, function(i,pci){
            html += '<option device="'+pci['device']+'" '+
                            'class="'+pci['class']+'" '+
                            'vendor="'+pci['vendor']+'">'+
                                pci.device_name+
                    '</option>';
          });

          html += '</select>';

          $(".device_name", tr).html(html);

          $("input", tr).trigger("change");
        },
        error: function(request, error_json){
          console.error("There was an error requesting the PCI devices: "+
                        error_json.error.message);

          $(".device_name", tr).html("");
        }
      });
    });

    context.on("change", ".pci_devices td.device_name select", function(){
      var tr = $(this).closest('tr');

      var option = $("option:selected", this);

      $('input[wizard_field="DEVICE"]', tr).val( option.attr("device") );
      $('input[wizard_field="CLASS"]',  tr).val( option.attr("class") );
      $('input[wizard_field="VENDOR"]', tr).val( option.attr("vendor") );
    });

    context.on("change", ".pci_devices tbody input", function(){
      var tr = $(this).closest('tr');

      var opt =
        $('option'+
          '[device="'+$('input[wizard_field="DEVICE"]', tr).val()+'"]'+
          '[class="'+$('input[wizard_field="CLASS"]',  tr).val()+'"]'+
          '[vendor="'+$('input[wizard_field="VENDOR"]', tr).val()+'"]', tr);

        opt.attr('selected', 'selected');
    });

    context.on("click", ".pci_devices i.remove-tab", function(){
      var tr = $(this).closest('tr');
      tr.remove();
    });
  }

  function _retrieve(context) {
    var templateJSON = CustomTagsTable.retrieve(context);

    var rawJSON = {}
    t = $('#raw_type', context).val();
    if (t) { rawJSON['TYPE'] = t; }
    t = TemplateUtils.escapeDoubleQuotes($('#raw_data', context).val());
    if (t) { rawJSON['DATA'] = t; }
    t = TemplateUtils.escapeDoubleQuotes($('#raw_data_vmx', context).val());
    if (t) { rawJSON['DATA_VMX'] = t; }

    if (!$.isEmptyObject(rawJSON)) { templateJSON['RAW'] = rawJSON; };

    $('.pci_devices tbody tr', context).each(function(i,row){
      var pci = WizardFields.retrieve(row);

      if (!$.isEmptyObject(pci)){
        if (templateJSON['PCI'] == undefined){
          templateJSON['PCI'] = [];
        }

        templateJSON['PCI'].push(pci);
      }
    });

    return templateJSON;
  }

  function _fill(context, templateJSON) {
    var rawJSON = templateJSON.RAW;
    if (rawJSON) {
      $('#raw_type', context).val(rawJSON['TYPE']);
      $('#raw_type', context).change();
      $('#raw_data', context).val(TemplateUtils.htmlDecode(rawJSON['DATA']));
      $('#raw_data_vmx', context).val(TemplateUtils.htmlDecode(rawJSON['DATA_VMX']));

      delete templateJSON.RAW
    }

    $(".pci_devices i.remove-tab", context).trigger("click");

    var pcis = templateJSON['PCI'];

    if (pcis == undefined){
      pcis = [];
    }

    if (!$.isArray(pcis)){ // If only 1 convert to array
      pcis = [pcis];
    }

    $.each(pcis, function(i, pci){
      $(".add_pci", context).trigger("click");
      var tr = $('.pci_devices tbody tr', context).last();

      WizardFields.fill(tr, pci);
    });

    delete templateJSON.PCI;

    CustomTagsTable.fill(context, templateJSON);
  }
});
