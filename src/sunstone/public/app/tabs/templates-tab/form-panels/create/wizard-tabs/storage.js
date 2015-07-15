define(function(require) {
  /*
    DEPENDENCIES
   */

  require('foundation.tab');
  var Config = require('sunstone-config');
  var Locale = require('utils/locale');
  var Tips = require('utils/tips');
  var WizardFields = require('utils/wizard-fields');
  var DiskTab = require('./storage/disk-tab');

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

    that.numberOfDisks = 0;
    that.diskTabObjects = {};

    context.foundation('tab', 'reflow');

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

    that.addDiskTab(context);
  }

  function _retrieve(context) {
    var templateJSON = {};
    var disksJSON = [];
    var diskJSON;
    $.each(this.diskTabObjects, function(id, diskTab) {
      diskJSON = diskTab.retrieve($('#' + diskTab.diskTabId, context))
      if (!$.isEmptyObject(diskJSON)) {disksJSON.push(diskJSON)};
    })

    if (disksJSON.length > 0) { templateJSON['DISK'] = disksJSON; };

    return templateJSON;
  }

  function _fill(context, templateJSON) {
    var that = this;
    var disks = templateJSON.DISK
    if (disks instanceof Array) {
      $.each(disks, function(diskId, diskJSON) {
        if (diskId > 0) {
          that.addDiskTab(context);
        }

        var diskTab = that.diskTabObjects[that.numberOfDisks];
        var diskContext = $('#' + diskTab.diskTabId, context);
        diskTab.fill(diskContext, diskJSON);
      });
    } else if (disks instanceof Object) {
      var diskTab = that.diskTabObjects[that.numberOfDisks];
      var diskContext = $('#' + diskTab.diskTabId, context);
      diskTab.fill(diskContext, disks);
    }

    if (templateJSON.DISK) {
      delete templateJSON.DISK;
    }
  }

  function _addDiskTab(context) {
    this.numberOfDisks++;
    var diskTab = new DiskTab(this.numberOfDisks);

    var content = $('<div id="' + diskTab.diskTabId + '" class="active disk wizard_internal_tab content">' +
        diskTab.html() +
      '</div>').appendTo($("#" + CONTENTS_CONTAINER_ID, context));

    var a = $("<dd class='active'>" +
       "<a href='#" + diskTab.diskTabId + "'>" + Locale.tr("DISK") + "</a>" +
      "</dd>").appendTo($("#" + LINKS_CONTAINER_ID, context));

    $("a", a).trigger("click");

    diskTab.setup(content);
    content.attr("diskId", this.numberOfDisks);

    this.renameTabLinks(context);
    this.diskTabObjects[this.numberOfDisks] = diskTab;
  }

  function _renameTabLinks(context) {
    $("#" + LINKS_CONTAINER_ID + " dd", context).each(function(index) {
      $("a", this).html(Locale.tr("Disk") + ' ' + index + " <i class='fa fa-times-circle remove-tab'></i>");
    })
  }
});
