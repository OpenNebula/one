define(function(require) {
  /*
    DEPENDENCIES
   */

  var Config = require('sunstone-config');
  var Locale = require('utils/locale');
  var Tips = require('utils/tips');
  var WizardFields = require('utils/wizard-fields');

  /*
    TEMPLATES
   */

  var TemplateHTML = require('hbs!./storage/html');
  
  /*
    CONSTANTS
   */

  var WIZARD_TAB_ID = require('./storage/wizardTabId');
  var LINKS_CONTAINER_ID = 'template_create_storage_tabs';
  var CONTENTS_CONTAINER_ID = 'template_create_storage_tabs_content';

  /*
    CONSTRUCTOR
   */
  
  function WizardTab() {
    if (!Config.isTemplateCreationTabEnabled('storage')) {
      throw "Wizard Tab not enabled";
    }

    this.wizardTabId = WIZARD_TAB_ID;
    this.icon = 'fa-tasks';
    this.title = Locale.tr("Storage");
    this.classes = "hypervisor only_kvm only_vmware only_xen"

    this.numberOfDisks = 0;
    this.diskTabObjects = {};
  }

  WizardTab.prototype.constructor = WizardTab;
  WizardTab.prototype.html = _html;
  WizardTab.prototype.setup = _setup;
  WizardTab.prototype.onShow = _onShow;
  WizardTab.prototype.retrieve = _retrieve;
  WizardTab.prototype.fill = _fill;
  WizardTab.prototype.renameTabLinks = _renameTabLinks;
  WizardTab.prototype.addDiskTab = _addDiskTab;

  return WizardTab;
  
  /*
    FUNCTION DEFINITIONS
   */
  
  function _html() {
    return TemplateHTML({
      'linksContainerId': LINKS_CONTAINER_ID,
      'contentsContainerId': CONTENTS_CONTAINER_ID
    });
  }

  function _onShow(context, panelForm) {
  }

  function _setup(context) {
    var that = this;
    Tips.setup(context);

    // close icon: removing the tab on click
    context.on("click", "i.remove-tab", function() {
      var target = $(this).parent().attr("href");
      var dd = $(this).closest('dd');
      var dl = $(this).closest('dl');
      var content = $(target);

      dd.remove();
      content.remove();

      var diskId = content.attr("diskId");
      delete that.diskTabObjects[diskId];

      if (dd.attr("class") == 'active') {
        $('a', dl.children('dd').last()).click();
      }

      that.renameTabLinks(context);
    });

    context.on("click", "#tf_btn_disks", function() {
      that.addDiskTab(context);
      return false;
    });
  }

  function _retrieve(context) {

  }

  function _fill(context, templateJSON) {
  }

  function _addDiskTab(context) {
    var diskTab = new DiskTab(this.numberOfDisks);

    var a = $("<dd>" +
       "<a href='#" + diskTab.diskTabId + "'>" + Locale.tr("DISK") + "</a>" +
      "</dd>").appendTo($("#" + LINKS_CONTAINER_ID, context));

    var content = $('<div id="' + diskTab.diskTabId + '" class="disk wizard_internal_tab content">' +
        diskTab.html() +
      '</div>').appendTo($("#" + CONTENTS_CONTAINER_ID, context));

    $("a", a).trigger("click");

    diskTab.setup($('#' + diskTab.diskTabId, context));

    this.renameTabLinks(context);
    this.numberOfDisks++;
  }

  function _renameTabLinks(context) {
    $("dl#template_create_storage_tabs dd", context).each(function(index) {
      $("a", this).html(tr("Disk") + ' ' + index + " <i class='fa fa-times-circle remove-tab'></i>");
    })
  }
});
