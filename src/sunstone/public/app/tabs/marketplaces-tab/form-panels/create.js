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

  var BaseFormPanel = require('utils/form-panels/form-panel');
  var Sunstone = require('sunstone');
  var Locale = require('utils/locale');
  var Tips = require('utils/tips');
  var Config = require('sunstone-config');
  var WizardFields = require('utils/wizard-fields');
  var TemplateUtils = require('utils/template-utils');

  /*
    TEMPLATES
   */

  var TemplateWizardHTML = require('hbs!./create/wizard');
  var TemplateAdvancedHTML = require('hbs!./create/advanced');

  /*
    CONSTANTS
   */

  var FORM_PANEL_ID = require('./create/formPanelId');
  var TAB_ID = require('../tabId');
  var MARKET_MAD_ATTRS = [
    {
      name: 'BASE_URL',
      label: Locale.tr("Base URL"),
      tooltip: Locale.tr("URL base to generate app end points"),
      driver: 'http'
    },
    {
      name: 'PUBLIC_DIR',
      label: Locale.tr("Public Directory"),
      tooltip: Locale.tr("Directory path to place images, the document root for http server"),
      driver: 'http'
    },
    {
      name: 'BRIDGE_LIST',
      label: Locale.tr("Bridge List"),
      tooltip: Locale.tr("Separated list of servers to access the public directory. If not defined, public directory will be local"),
      driver: 'http'
    },
    {
      name: 'ACCESS_KEY_ID',
      label: Locale.tr("Access Key Id"),
      tooltip: Locale.tr("Access Key Id"),
      driver: 's3'
    },
    {
      name: 'SECRET_ACCESS_KEY',
      label: Locale.tr("Secret Access Key"),
      tooltip: Locale.tr("Secret Access Key"),
      driver: 's3'
    },
    {
      name: 'BUCKET',
      label: Locale.tr("Bucket"),
      tooltip: Locale.tr("Bucket"),
      driver: 's3'
    },
    {
      name: 'REGION',
      label: Locale.tr("Region"),
      tooltip: Locale.tr("Region"),
      driver: 's3'
    },
    {
      name: 'TOTAL_MB',
      label: Locale.tr("Total MB"),
      tooltip: Locale.tr("Total MB"),
      driver: 's3'
    },
    {
      name: 'SIGNATURE_VERSION',
      label: Locale.tr("Signature Version"),
      tooltip: Locale.tr("Signature Version"),
      driver: 's3'
    },
    {
      name: 'ENDPOINT',
      label: Locale.tr("Endpoint"),
      tooltip: Locale.tr("Endpoint"),
      driver: 's3'
    },
    {
      name: 'FORCE_PATH_STYLE',
      label: Locale.tr("Force Path Style"),
      tooltip: Locale.tr("Force Path Style"),
      driver: 's3'
    }
  ]
  /*
    CONSTRUCTOR
   */

  function FormPanel() {
    var that = this;

    that.formPanelId = FORM_PANEL_ID;
    that.tabId = TAB_ID;
    that.actions = {
      'create': {
        'title': Locale.tr("Create MarketPlace"),
        'buttonText': Locale.tr("Create"),
        'resetButton': true
      },
      'update': {
        'title': Locale.tr("Update MarketPlace"),
        'buttonText': Locale.tr("Update"),
        'resetButton': false
      }
    };

    that.marketMadNameList = [];
    if (Config.marketMadConf !== undefined) {
      $.each(Config.marketMadConf, function(index, marketMad) {
        that.marketMadNameList.push(marketMad["NAME"]);
      });
    }

    BaseFormPanel.call(this);
  }

  FormPanel.FORM_PANEL_ID = FORM_PANEL_ID;
  FormPanel.prototype = Object.create(BaseFormPanel.prototype);
  FormPanel.prototype.constructor = FormPanel;
  FormPanel.prototype.htmlWizard = _htmlWizard;
  FormPanel.prototype.htmlAdvanced = _htmlAdvanced;
  FormPanel.prototype.submitWizard = _submitWizard;
  FormPanel.prototype.submitAdvanced = _submitAdvanced;
  FormPanel.prototype.onShow = _onShow;
  FormPanel.prototype.fill = _fill;
  FormPanel.prototype.setup = _setup;

  return FormPanel;

  /*
    FUNCTION DEFINITIONS
   */

  function _htmlWizard() {
    return TemplateWizardHTML({
      'formPanelId': this.formPanelId,
      'marketMadNameList': this.marketMadNameList,
      'marketMadAttrs': MARKET_MAD_ATTRS
    });
  }

  function _htmlAdvanced() {
    return TemplateAdvancedHTML({formPanelId: this.formPanelId});
  }

  function _onShow(dialog) {
    $("#NAME", dialog).focus();
    $('#MARKET_MAD', dialog).change();

    return false;
  }

  function _fill(context, element) {
    if (this.action != "update") {
      return false;
    }

    this.resourceId = element.ID;

    WizardFields.fill(context, element.TEMPLATE);
    $('#NAME', context).val(element.NAME).
        prop("disabled", true).
        prop('wizard_field_disabled', true);;
    $('#MARKET_MAD', context).val(element.MARKET_MAD).change();
  }

  // Set up the create datastore dialog
  function _setup(dialog) {
    Tips.setup(dialog);

    dialog.on('change', '#MARKET_MAD', function() {
      _setRequiredFields(dialog, this.value);
    });
  }


  function _submitWizard(dialog) {
    var that = this;
    var marketObj = {};

    $.extend(marketObj, WizardFields.retrieve(dialog));

    if (this.action == "create") {
      marketObj = {
        "marketplace" : marketObj
      };

      Sunstone.runAction("MarketPlace.create", marketObj);
      return false;
    } else if (this.action == "update") {
      Sunstone.runAction("MarketPlace.update", this.resourceId, TemplateUtils.templateToString(marketObj));
      return false;
    }
  }

  function _submitAdvanced(dialog) {
    var template = $('#template', dialog).val();

    if (this.action == "create") {
      var marketObj = {
        "marketplace" : {
          "marketplace_raw" : template
        }
      };
      Sunstone.runAction("MarketPlace.create", marketObj);
    } else if (this.action == "update") {
      Sunstone.runAction("Network.update", this.resourceId, template);
      return false;
    }

    return false;
  }

  function _setRequiredFields(dialog, marketMADName) {
    // Hide all market mad attributes and remove required
    $('.market-mad-attr-container', dialog).hide();
    $('.market-mad-attr-container input', dialog).removeAttr('required');

    // Show attributes for the selected market mad and set the required ones
    $('.market-mad-attr-container.' + marketMADName).show();
    $.each(Config.marketMadConf, function(i, e){
        if (e["NAME"] == marketMADName) {
          if (!$.isEmptyObject(e["REQUIRED_ATTRS"])) {
            $.each(e["REQUIRED_ATTRS"].split(","), function(i, attrName){
              $('#' + attrName, dialog).attr('required', true);
            });
          }
          return false;
        }
      }
    );
  }
});

