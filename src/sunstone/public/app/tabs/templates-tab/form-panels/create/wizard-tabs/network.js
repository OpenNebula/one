define(function(require) {
  /*
    DEPENDENCIES
   */

  require('foundation.tab');
  var Config = require('sunstone-config');
  var Locale = require('utils/locale');
  var Tips = require('utils/tips');
  var WizardFields = require('utils/wizard-fields');
  var NicTab = require('./network/nic-tab');

  /*
    TEMPLATES
   */

  var TemplateHTML = require('hbs!./network/html');

  /*
    CONSTANTS
   */

  var WIZARD_TAB_ID = require('./network/wizardTabId');
  var LINKS_CONTAINER_ID = 'template_create_network_tabs';
  var CONTENTS_CONTAINER_ID = 'template_create_network_tabs_content';

  /*
    CONSTRUCTOR
   */

  function WizardTab() {
    if (!Config.isTemplateCreationTabEnabled('network')) {
      throw "Wizard Tab not enabled";
    }

    this.wizardTabId = WIZARD_TAB_ID;
    this.icon = 'fa-globe';
    this.title = Locale.tr("Network");
    this.classes = "hypervisor only_kvm only_vmware only_xen only_vcenter"
  }

  WizardTab.prototype.constructor = WizardTab;
  WizardTab.prototype.html = _html;
  WizardTab.prototype.setup = _setup;
  WizardTab.prototype.onShow = _onShow;
  WizardTab.prototype.retrieve = _retrieve;
  WizardTab.prototype.fill = _fill;
  WizardTab.prototype.renameTabLinks = _renameTabLinks;
  WizardTab.prototype.addNicTab = _addNicTab;

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

    that.numberOfNics = 0;
    that.nicTabObjects = {};

    context.foundation('tab', 'reflow');

    // close icon: removing the tab on click
    context.on("click", "i.remove-tab", function() {
      var target = $(this).parent().attr("href");
      var dd = $(this).closest('dd');
      var dl = $(this).closest('dl');
      var content = $(target);

      dd.remove();
      content.remove();

      var nicId = content.attr("nicId");
      delete that.nicTabObjects[nicId];

      if (dd.attr("class") == 'active') {
        $('a', dl.children('dd').last()).click();
      }

      that.renameTabLinks(context);
    });

    context.on("click", "#tf_btn_nics", function() {
      that.addNicTab(context);
      return false;
    });

    that.addNicTab(context);
  }

  function _retrieve(context) {
    var templateJSON = {}
    var nicsJSON = [];
    var nicJSON;
    $.each(this.nicTabObjects, function(id, nicTab) {
      nicJSON = nicTab.retrieve($('#' + nicTab.nicTabId, context))
      if (!$.isEmptyObject(nicJSON)) {nicsJSON.push(nicJSON)};
    })

    if (nicsJSON.length > 0) { templateJSON['NIC'] = nicsJSON; };

    var nicDefault = $('#DEFAULT_MODEL', context).val();
    if (nicDefault) {
      templateJSON['NIC_DEFAULT'] = {
        'MODEL': nicDefault
      }
    }

    return templateJSON;
  }

  function _fill(context, templateJSON) {
    var that = this;
    var nics = templateJSON.NIC;
    if (nics instanceof Array) {
      $.each(nics, function(nicId, nicJSON) {
        if (nicId > 0) {
          that.addNicTab(context);
        }

        var nicTab = that.nicTabObjects[that.numberOfNics];
        var nicContext = $('#' + nicTab.nicTabId, context);
        nicTab.fill(nicContext, nicJSON);
      });
    } else if (nics instanceof Object) {
      var nicTab = that.nicTabObjects[that.numberOfNics];
      var nicContext = $('#' + nicTab.nicTabId, context);
      nicTab.fill(nicContext, nics);
    }

    if (templateJSON.NIC) {
      delete templateJSON.NIC;
    }

    var nicDefault = templateJSON.NIC_DEFAULT
    if (nicDefault != undefined) {
      if (nicDefault.MODEL) {
        $('#DEFAULT_MODEL', context).val(nicDefault.MODEL);
      }

      delete templateJSON.NIC_DEFAULT;
    }
  }

  function _addNicTab(context) {
    this.numberOfNics++;
    var nicTab = new NicTab(this.numberOfNics);

    var content = $('<div id="' + nicTab.nicTabId + '" class="active nic wizard_internal_tab content">' +
        nicTab.html() +
      '</div>').appendTo($("#" + CONTENTS_CONTAINER_ID, context));

    var a = $("<dd class='active'>" +
       "<a href='#" + nicTab.nicTabId + "'>" + Locale.tr("NIC") + "</a>" +
      "</dd>").appendTo($("#" + LINKS_CONTAINER_ID, context));

    $("a", a).trigger("click");

    nicTab.setup(content);
    content.attr("nicId", this.numberOfNics);

    this.renameTabLinks(context);
    this.nicTabObjects[this.numberOfNics] = nicTab;
  }

  function _renameTabLinks(context) {
    $("#" + LINKS_CONTAINER_ID + " dd", context).each(function(index) {
      $("a", this).html(Locale.tr("NIC") + ' ' + index + " <i class='fa fa-times-circle remove-tab'></i>");
    })
  }
});
