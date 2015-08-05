define(function(require) {
  /*
    DEPENDENCIES
   */

  var Locale = require('utils/locale');
  var Tips = require('utils/tips');
  var CapacityInputs = require('./general/capacity-inputs');
  var WizardFields = require('utils/wizard-fields');

  /*
    TEMPLATES
   */

  var TemplateHTML = require('hbs!./general/html');

  /*
    CONSTANTS
   */

  var WIZARD_TAB_ID = require('./general/wizardTabId');
  var LOGOS = [
    {'path': "images/logos/arch.png",       'title': Locale.tr("Arch Linux")},
    {'path': "images/logos/centos.png",     'title': Locale.tr("CentOS")},
    {'path': "images/logos/debian.png",     'title': Locale.tr("Debian")},
    {'path': "images/logos/fedora.png",     'title': Locale.tr("Fedora")},
    {'path': "images/logos/linux.png",      'title': Locale.tr("Linux")},
    {'path': "images/logos/redhat.png",     'title': Locale.tr("Redhat")},
    {'path': "images/logos/ubuntu.png",     'title': Locale.tr("Ubuntu")},
    {'path': "images/logos/windowsxp.png",  'title': Locale.tr("Windows XP/2003")},
    {'path': "images/logos/windows8.png",   'title': Locale.tr("Windows 8")}
  ]

  /*
    CONSTRUCTOR
   */

  function WizardTab() {
    this.wizardTabId = WIZARD_TAB_ID;
    this.icon = 'fa-laptop';
    this.title = Locale.tr("General");
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
      'capacityInputsHTML': CapacityInputs.html(),
      'logos': LOGOS
    });
  }

  function _onShow(context, panelForm) {
    if (panelForm.action == 'create') {
      $('#template_name_form', context).show();
      $('#template_hypervisor_form', context).removeClass("left");
      $('#NAME', context).removeAttr('disabled');
      $('#NAME', context).attr("required", "");
    } else if (panelForm.action == 'update') {
      $('#template_name_form', context).hide();
      $('#template_hypervisor_form', context).addClass("left");
      $('#NAME', context).attr("disabled", "disabled");
      $('#NAME', context).removeAttr("required");
    }

    context.foundation('slider', 'reflow');
  }

  function _setup(context) {
    $(document).on('click', "[href='#" + this.wizardTabId + "']", function(){
      context.foundation('slider', 'reflow');
    });

    context.on("change", "#LOGO", function() {
      $("#template_create_logo", context).show();
      $("#template_create_logo", context).html('<span  class="">' +
          '<img src="' + $(this).val() + '">' +
        '</span>');
    });

    context.on("change", "input[name='hypervisor']", function() {
      // TODO define context (for example: this.closest('form'))
      $(".hypervisor").hide();
      $(".only_" + this.value).show();
    });

    CapacityInputs.setup(context);
  }

  function _retrieve(context) {
    var templateJSON = WizardFields.retrieve(context);

    if (templateJSON["HYPERVISOR"] == 'vcenter') {
      templateJSON["PUBLIC_CLOUD"] = {
        'TYPE': 'vcenter',
        'VM_TEMPLATE': $("#vcenter_template_uuid", context).val()
      }
    }

    if ($('#sunstone_capacity_select:checked', context).length > 0) {
      templateJSON["SUNSTONE_CAPACITY_SELECT"] = "NO"
    }

    if ($('#sunstone_network_select:checked', context).length > 0) {
      templateJSON["SUNSTONE_NETWORK_SELECT"] = "NO"
    }

    return templateJSON;
  }

  function _fill(context, templateJSON) {
    if (templateJSON["SUNSTONE_CAPACITY_SELECT"] &&
          (templateJSON["SUNSTONE_CAPACITY_SELECT"].toUpperCase() == "NO")) {
      $("#sunstone_capacity_select", context).attr("checked", "checked");
      delete templateJSON["SUNSTONE_CAPACITY_SELECT"]
    }

    if (templateJSON["SUNSTONE_NETWORK_SELECT"] &&
          (templateJSON["SUNSTONE_NETWORK_SELECT"].toUpperCase() == "NO")) {
      $("#sunstone_network_select", context).attr("checked", "checked");
      delete templateJSON["SUNSTONE_NETWORK_SELECT"]
    }

    if (templateJSON["HYPERVISOR"]) {
      $("input[name='hypervisor'][value='"+templateJSON["HYPERVISOR"]+"']", context).trigger("click")
      delete templateJSON["HYPERVISOR"];
    }

    WizardFields.fill(context, templateJSON);
  }
});
