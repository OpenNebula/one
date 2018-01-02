/* -------------------------------------------------------------------------- */
/* Copyright 2002-2018, OpenNebula Project, OpenNebula Systems                */
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
  var NicTab = require('./network/nic-tab');
  var UniqueId = require('utils/unique-id');

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

  function WizardTab(opts) {
    if (!Config.isTemplateCreationTabEnabled(opts.tabId, 'network')) {
      throw "Wizard Tab not enabled";
    }

    this.wizardTabId = WIZARD_TAB_ID + UniqueId.id();
    this.icon = 'fa-globe';
    this.title = Locale.tr("Network");
    this.classes = "hypervisor only_kvm only_vcenter"

    if(opts.listener != undefined){
      this.listener = opts.listener;
    }
  }

  WizardTab.prototype.constructor = WizardTab;
  WizardTab.prototype.html = _html;
  WizardTab.prototype.setup = _setup;
  WizardTab.prototype.onShow = _onShow;
  WizardTab.prototype.retrieve = _retrieve;
  WizardTab.prototype.fill = _fill;
  WizardTab.prototype.renameTabLinks = _renameTabLinks;
  WizardTab.prototype.addNicTab = _addNicTab;
  WizardTab.prototype.notify = _notify;

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
    $.each(this.nicTabObjects, function(id, tab) {
      tab.onShow();
    })
  }

  function _setup(context) {
    var that = this;

    that.numberOfNics = 0;
    that.nicTabObjects = {};

    Foundation.reflow(context, 'tabs');

    context.on("click", "#tf_btn_nics", function() {
      that.addNicTab(context);
      return false;
    });

    that.addNicTab(context);

    if(that.listener != undefined){
      $(context).on("change", "input", function(){
        that.listener.notify();
      });
    }
  }

  function _retrieve(context) {
    var templateJSON = {}
    var nicsJSON = [];
    var pcisJSON = [];

    var tmpJSON;
    $.each(this.nicTabObjects, function(id, nicTab) {
      tmpJSON = nicTab.retrieve($('#' + nicTab.nicTabId, context))
      if (!$.isEmptyObject(tmpJSON)) {
        if (tmpJSON["NIC_PCI"] == true){
          delete tmpJSON["NIC_PCI"];
          tmpJSON["TYPE"] = "NIC";
          pcisJSON.push(tmpJSON);
        } else {
          nicsJSON.push(tmpJSON);
        }
      };
    })

    if (nicsJSON.length > 0) { templateJSON['NIC'] = nicsJSON; };
    if (pcisJSON.length > 0) { templateJSON['NIC_PCI'] = pcisJSON; };

    var nicDefault = WizardFields.retrieveInput($('#DEFAULT_MODEL', context));
    if (nicDefault) {
      templateJSON['NIC_DEFAULT'] = {
        'MODEL': nicDefault
      }
    }

    return templateJSON;
  }

  function _fill(context, templateJSON) {
    var that = this;
    var nics = [];

    if (templateJSON.NIC != undefined){
      nics = templateJSON.NIC;
    }

    if (!(nics instanceof Array)) {
      nics = [nics];
    }

    if (templateJSON.PCI != undefined){
      var pcis = templateJSON.PCI;

      if (!(pcis instanceof Array)) {
        pcis = [pcis];
      }

      $.each(pcis, function(){
        if (this["TYPE"] == "NIC"){
          nics.push(this);
        }
      });
    }

    $.each(nics, function(nicId, nicJSON) {
      if (nicId > 0) {
        that.addNicTab(context);
      }

      var nicTab = that.nicTabObjects[that.numberOfNics];
      var nicContext = $('#' + nicTab.nicTabId, context);
      nicTab.fill(nicContext, nicJSON);
    });

    if (templateJSON.NIC) {
      delete templateJSON.NIC;
    }

    if (templateJSON.PCI != undefined) {
      var pcis = templateJSON.PCI;

      if (!(pcis instanceof Array)) {
        pcis = [pcis];
      }

      pcis = pcis.filter(function(pci){
        return pci["TYPE"] != "NIC"
      });

      delete templateJSON.PCI;

      if (pcis.length == 1){
        templateJSON.PCI = pcis[0];
      } else if (pcis.length > 1) {
        templateJSON.PCI = pcis;
      }
    }

    var nicDefault = templateJSON.NIC_DEFAULT
    if (nicDefault != undefined) {
      if (nicDefault.MODEL) {
        WizardFields.fillInput($('#DEFAULT_MODEL', context), nicDefault.MODEL);
      }

      delete templateJSON.NIC_DEFAULT;
    }
  }

  function _addNicTab(context) {
    var that = this;
    that.numberOfNics++;
    var nicTab = new NicTab(that.numberOfNics);

    var content = $('<div id="' + nicTab.nicTabId + '" class="nic wizard_internal_tab tabs-panel">' +
        nicTab.html() +
      '</div>').appendTo($("#" + CONTENTS_CONTAINER_ID, context));

    var a = $("<li class='tabs-title'>" +
       "<a href='#" + nicTab.nicTabId + "'>" + Locale.tr("NIC") + "</a>" +
      "</li>").appendTo($("#" + LINKS_CONTAINER_ID, context));

    Foundation.reInit($("#" + LINKS_CONTAINER_ID, context));

    $("a", a).trigger("click");

    nicTab.setup(content);
    content.attr("nicId", that.numberOfNics);

    that.renameTabLinks(context);
    that.nicTabObjects[that.numberOfNics] = nicTab;

    // close icon: removing the tab on click
    a.on("click", "i.remove-tab", function() {
      var target = $(this).parent().attr("href");
      var li = $(this).closest('li');
      var ul = $(this).closest('ul');
      var content = $(target);

      li.remove();
      content.remove();

      var nicId = content.attr("nicId");
      delete that.nicTabObjects[nicId];

      if (li.hasClass('is-active')) {
        $('a', ul.children('li').last()).click();
      }

      that.renameTabLinks(context);
    });
  }

  function _renameTabLinks(context) {
    $("#" + LINKS_CONTAINER_ID + " li", context).each(function(index) {
      $("a", this).html(Locale.tr("NIC") + ' ' + index + " <i class='fa fa-times-circle remove-tab'></i>");
    })

    if(this.listener != undefined){
      this.listener.notify();
    }
  }

  function _notify(context, templateJSON) {
    if (templateJSON.VROUTER == "YES"){
      while($("i.remove-tab", context).length > 0){
        $("i.remove-tab", context).click();
      }

      $("#tf_btn_nics", context).hide();
      $(".vrouter_no_nics", context).show();
    } else {
      $("#tf_btn_nics", context).show();
      $(".vrouter_no_nics", context).hide();
    }
  }
});
