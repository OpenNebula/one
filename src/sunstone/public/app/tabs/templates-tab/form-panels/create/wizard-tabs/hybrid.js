/* -------------------------------------------------------------------------- */
/* Copyright 2002-2016, OpenNebula Project, OpenNebula Systems                */
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
  var UniqueId = require('utils/unique-id');

  /*
    TEMPLATES
   */

  var TemplateHTML = require('hbs!./hybrid/html');
  var EC2HTML = require('hbs!./hybrid/ec2');
  var AzureHTML = require('hbs!./hybrid/azure');

  /*
    CONSTANTS
   */

  var WIZARD_TAB_ID = require('./hybrid/wizardTabId');

  /*
    CONSTRUCTOR
   */

  function WizardTab() {
    if (!Config.isTemplateCreationTabEnabled('hybrid')) {
      throw "Wizard Tab not enabled";
    }

    this.wizardTabId = WIZARD_TAB_ID + UniqueId.id();
    this.icon = 'fa-cloud';
    this.title = Locale.tr("Hybrid");
  }

  WizardTab.prototype.constructor = WizardTab;
  WizardTab.prototype.html = _html;
  WizardTab.prototype.setup = _setup;
  WizardTab.prototype.onShow = _onShow;
  WizardTab.prototype.retrieve = _retrieve;
  WizardTab.prototype.fill = _fill;
  WizardTab.prototype.addProviderTab = _addProviderTab;
  WizardTab.prototype.fillProviderTab = _fillProviderTab;

  return WizardTab;

  /*
    FUNCTION DEFINITIONS
   */

  function _html() {
    return TemplateHTML();
  }

  function _onShow(context, panelForm) {
  }

  function _setup(context) {
    var that = this;
    Foundation.reflow(context, 'tabs');
    that.numberOfProviders = 0;

    context.on("click", "#tf_btn_hybrid", function() {
      that.addProviderTab(that.numberOfProviders, context);
      that.numberOfProviders++;
      return false;
    });

    $("#tf_btn_hybrid", context).trigger("click");
  }

  function _retrieve(context) {
    var templateJSON = {};
    var publicCloudJSON = [];

    $('.provider', context).each(function() {
      var hash  = WizardFields.retrieve(this);
      if (!$.isEmptyObject(hash)) {
        var hybrid = $("input.hybridRadio:checked", this).val();
        switch (hybrid) {
          case 'ec2':
            hash["TYPE"] = "ec2";
            publicCloudJSON.push(hash);
            break;
          case 'azure':
            hash["TYPE"] = hybrid.toUpperCase();
            publicCloudJSON.push(hash);
            break;
        }
      };
    });

    if (!$.isEmptyObject(publicCloudJSON)) { templateJSON['PUBLIC_CLOUD'] = publicCloudJSON; };

    return templateJSON;
  }

  function _fill(context, templateJSON) {
    var that = this;
    var clickButton = false;
    if (templateJSON.PUBLIC_CLOUD) {
      var providers = templateJSON.PUBLIC_CLOUD

      if (providers instanceof Array) {
        $.each(providers, function(index, provider) {
          clickButton = index > 0;
          that.fillProviderTab(context, provider, provider.TYPE.toLowerCase(), clickButton);
        });
      } else if (providers instanceof Object) {
        that.fillProviderTab(context, providers, providers.TYPE.toLowerCase(), clickButton);
        clickButton = true;
      }

      delete templateJSON.PUBLIC_CLOUD
    }
  }

  function _addProviderTab(provider_id, context) {
    var htmlId  = 'provider' + provider_id + UniqueId.id();

    // Append the new div containing the tab and add the tab to the list
    var html_tab_content = '<div id="' + htmlId + 'Tab" class="provider wizard_internal_tab tabs-panel">' +
      '<div class="row">' +
        '<div class="large-12 columns">' +
          '<input type="radio" class="hybridRadio" name="hybrid' + htmlId + '" value="ec2" id="amazonRadio' + htmlId + '"><label for="amazonRadio' + htmlId + '">Amazon EC2</label>' +
          '<input type="radio" class="hybridRadio" name="hybrid' + htmlId + '" value="azure" id="azureRadio' + htmlId + '"><label for="azureRadio' + htmlId + '">Microsoft Azure</label>' +
        '</div>' +
      '</div>' +
      '<div class="row hybrid_inputs vm_param">' +
      '</div>' +
    '</div>'
    $(html_tab_content).appendTo($("#template_create_hybrid_tabs_content", context));

    var a = $("<li class='tabs-title'>\
        <a id='provider_tab" + htmlId + "' href='#" + htmlId + "Tab'>" + Locale.tr("PROVIDER") + "</a>\
      </li>").appendTo($("ul#template_create_hybrid_tabs", context));

    $("ul#template_create_hybrid_tabs li", context).each(function(index) {
        $("a", this).html(Locale.tr("Provider") + ' ' + index + " <i class='fa fa-times-circle remove-tab'></i>");
      })

    Foundation.reInit($("ul#template_create_hybrid_tabs", context));

    $("a", a).trigger("click");

    // close icon: removing the tab on click
    a.on("click", "i.remove-tab", function() {
      var target = $(this).parent().attr("href");
      var li = $(this).closest('li');
      var ul = $(this).closest('ul');
      var content = $(target);

      li.remove();
      content.remove();

      if (li.hasClass('is-active')) {
        $('a', ul.children('li').last()).click();
      }

      $("ul#template_create_hybrid_tabs li", context).each(function(index) {
          $("a", this).html(Locale.tr("Provider") + ' ' + index + " <i class='fa fa-times-circle remove-tab'></i>");
        })
    });

    var providerSection = $('#' + htmlId + 'Tab', context);

    providerSection.on("change", "input.hybridRadio", function() {
      $(".hybrid_inputs", providerSection).html("");

      if (this.value == "ec2"){
        $(".hybrid_inputs", providerSection).append(EC2HTML());
      } else {
        $(".hybrid_inputs", providerSection).append(AzureHTML());
      }

      Tips.setup(providerSection);
    })
  }

  function _fillProviderTab(context, provider, providerType, clickButton) {
    var that = this;
    if (providerType == "vcenter") {
      return false;
    }

    if (clickButton) {
      $("#tf_btn_hybrid", context).trigger("click");
    }

    var providerContext = $(".provider", context).last();
    $("input.hybridRadio[value='" + providerType + "']", providerContext).trigger("click");
    WizardFields.fill(providerContext, provider);
  }
});
