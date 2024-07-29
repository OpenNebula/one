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
      name: 'ENDPOINT',
      id: 'ENDPOINTONE',
      label: Locale.tr("Endpoint URL for marketplace"),
      driver: 'one'
    },
    {
      name: 'BASE_URL',
      label: Locale.tr("Base URL for marketapp"),
      driver: 'http'
    },
    {
      name: 'PUBLIC_DIR',
      label: Locale.tr("Marketapp directory path"),
      tooltip: Locale.tr("This is the document root for http server"),
      driver: 'http'
    },
    {
      name: 'BRIDGE_LIST',
      label: Locale.tr("Storage bridge list"),
      tooltip: Locale.tr("Comma separated list of servers to access the image directory if not local"),
      driver: 'http'
    },
    {
      name: 'ACCESS_KEY_ID',
      label: Locale.tr("Access Key Id"),
      driver: 's3'
    },
    {
      name: 'SECRET_ACCESS_KEY',
      label: Locale.tr("Secret Access Key"),
      driver: 's3'
    },
    {
      name: 'BUCKET',
      label: Locale.tr("S3 bucket to store marketapps"),
      driver: 's3'
    },
    {
      name: 'REGION',
      label: Locale.tr("Amazon Region"),
      tooltip: Locale.tr("Only if using public Amazon S3 service."),
      driver: 's3'
    },
    {
      name: 'TOTAL_MB',
      label: Locale.tr("Total Marketplace size in MB"),
      driver: 's3'
    },
    {
      name: 'SIGNATURE_VERSION',
      label: Locale.tr("Signature Version"),
      tooltip: Locale.tr("Leave blank for Amazon AWS S3 service. If connecting to Ceph S3 it **must** be 's3'."),
      driver: 's3'
    },
    {
      name: 'ENDPOINT',
      id: 'ENDPOINTS3',
      label: Locale.tr("Endpoint URL for marketplace"),
      driver: 's3'
    },
    {
      name: 'FORCE_PATH_STYLE',
      label: Locale.tr("Force Path Style"),
      tooltip: Locale.tr("Leave blank for Amazon AWS S3 service. If connecting to Ceph S3 it **must** be 'YES'."),
      driver: 's3'
    },
    {
      name: 'READ_LENGTH',
      label: Locale.tr("Read block length in MB"),
      tooltip: Locale.tr("Split marketapps into chunks of this size (in MB). You should **never** user a quantity larger than 100. Defaults to 32 (MB)."),
      driver: 's3'
    },
    {
      name: 'ENDPOINT',
      id: 'ENDPOINTLXD',
      label: Locale.tr("Endpoint URL for marketplace"),
      driver: 'linuxcontainers'
    },
    {
      name: 'IMAGE_SIZE_MB',
      label: Locale.tr("Size for the image holding the rootfs in MB"),
      driver: 'linuxcontainers'
    },
    {
      name: 'FILESYSTEM',
      label: Locale.tr("Filesystem used for the image"),
      driver: 'linuxcontainers'
    },
    {
      name: 'FORMAT',
      label: Locale.tr("Image block file format"),
      driver: 'linuxcontainers'
    },
    {
      name: 'SKIP_UNTESTED',
      label: Locale.tr("Show only auto-contextualized apps"),
      driver: 'linuxcontainers'
    },
    {
      name: 'MEMORY',
      label: Locale.tr("Memory"),
      driver: 'linuxcontainers'
    },
    {
      name: 'CPU',
      label: Locale.tr("CPU"),
      driver: 'linuxcontainers'
    },
    {
      name: 'VCPU',
      label: Locale.tr("VCPU"),
      driver: 'linuxcontainers'
    },
    {
      name: 'PRIVILEGED',
      label: Locale.tr("Container security mode"),
      driver: 'linuxcontainers'
    },
    {
      name: 'BASE_URL',
      id: 'DOCKER_REGISTRY_BASE_URL',
      label: Locale.tr("DockerHub marketplace url"),
      driver: 'docker_registry'
    },
    {
      name: 'SSL',
      label: Locale.tr("SSL"),
      driver: 'docker_registry',
      checkbox: true,
      checkboxLabel: Locale.tr("SSL connection")
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
    if (Config.onedConf.MARKET_MAD_CONF !== undefined) {
      $.each(Config.onedConf.MARKET_MAD_CONF, function(index, marketMad) {
        that.marketMadNameList.push({
            "mad" : marketMad["NAME"],
            "name": marketMad["SUNSTONE_NAME"]
        });
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

    this.setHeader(element);

    this.resourceId = element.ID;

    // Populates the Avanced mode Tab
    $('#template', context).val(TemplateUtils.templateToString(element.TEMPLATE));

    WizardFields.fill(context, element.TEMPLATE);

    WizardFields.fillInput($('#NAME', context), element.NAME);
    $('#NAME', context).prop("disabled", true).prop('wizard_field_disabled', true);

    WizardFields.fillInput($('#MARKET_MAD', context), element.MARKET_MAD);
    $('#MARKET_MAD', context).change();
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

    var checkboxAttr = MARKET_MAD_ATTRS.filter(function(e) {
      return e.checkbox;
    }).map(function(e){
      return e.name;
    });

    $.each(marketObj, function(key, value){
      if (checkboxAttr.includes(key)) marketObj[key] = (value === "on") ? "true" : "false";
    });


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
      Sunstone.runAction("MarketPlace.update", this.resourceId, template);
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
    if (Config.onedConf.MARKET_MAD_CONF !== undefined) {
      $.each(Config.onedConf.MARKET_MAD_CONF, function(i, e){
          if (e["NAME"] == marketMADName) {
            if (!$.isEmptyObject(e["REQUIRED_ATTRS"])) {
              $.each(e["REQUIRED_ATTRS"].split(","), function(i, attrName){
                $.each(MARKET_MAD_ATTRS, function(i, mktAttr){
                  if (mktAttr.name == attrName && mktAttr.driver == marketMADName){
                    if (mktAttr.id){
                      $('#' + mktAttr.id, dialog).attr('required', true);
                    }
                    else{
                      $('#' + attrName, dialog).attr('required', true);
                    }
                  }
                });
              });
            }
            return false;
          }
        }
      );
    }
  }
});
