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

  var BaseFormPanel = require('utils/form-panels/form-panel');
  var Sunstone = require('sunstone');
  var Locale = require('utils/locale');
  var Notifier = require('utils/notifier');
  var Tips = require('utils/tips');
  var ImagesTable = require('tabs/images-tab/datatable');
  var MarketPlacesTable = require('tabs/marketplaces-tab/datatable');
  var Config = require('sunstone-config');
  var WizardFields = require('utils/wizard-fields');
  var OpenNebula = require('opennebula');

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

  /*
    CONSTRUCTOR
   */

  function FormPanel() {
    this.formPanelId = FORM_PANEL_ID;
    this.tabId = TAB_ID;
    this.actions = {
      'create': {
        'title': Locale.tr("Create MarketPlace App"),
        'buttonText': Locale.tr("Create"),
        'resetButton': true
      },
      'export': {
        'title': Locale.tr("Create MarketPlace App from Image"),
        'buttonText': Locale.tr("Create"),
        'resetButton': true
      }
    };

    this.imagesTable = new ImagesTable(
      FORM_PANEL_ID + 'imagesTable',
      { 'select': true,
        'selectOptions': {
          'filter_fn': function(image) {
            return OpenNebula.Datastore.isMarketExportSupported(image.DATASTORE_ID);
          }
        }
      });

    this.marketPlacesTable = new MarketPlacesTable(
      FORM_PANEL_ID + 'marketPlacesTable',
      { 'select': true,
        'selectOptions': {
          'filter_fn': function(market) {
            var valid = market.ZONE_ID == config.zone_id;

            if (valid){
              var create_support = false;

              $.each(config.oned_conf.MARKET_MAD_CONF, function(){
                if (this.NAME == market.MARKET_MAD){
                  create_support = this.APP_ACTIONS.split(',').includes("create");
                  return false; //break
                }
              });

              valid = create_support;
            }

            return valid;
          }
        }
      });

    this.marketPlacesTableAdvanced = new MarketPlacesTable(
      FORM_PANEL_ID + 'marketPlacesTableAdvanced',
      { 'select': true,
        'selectOptions': {
          'filter_fn': function(market) {
            return market.ZONE_ID == config.zone_id;
          }
        }
      });

    BaseFormPanel.call(this);
  }

  FormPanel.FORM_PANEL_ID = FORM_PANEL_ID;
  FormPanel.prototype = Object.create(BaseFormPanel.prototype);
  FormPanel.prototype.constructor = FormPanel;
  FormPanel.prototype.htmlWizard = _htmlWizard;
  FormPanel.prototype.htmlAdvanced = _htmlAdvanced;
  FormPanel.prototype.submitWizard = _submitWizard;
  FormPanel.prototype.submitAdvanced = _submitAdvanced;
  FormPanel.prototype.setImageId = _setImageId;
  FormPanel.prototype.onShow = _onShow;
  FormPanel.prototype.setup = _setup;

  return FormPanel;

  /*
    FUNCTION DEFINITIONS
   */

  function _htmlWizard() {
    return TemplateWizardHTML({
      'formPanelId': this.formPanelId,
      'imagesTableHTML': this.imagesTable.dataTableHTML,
      'marketPlacesTableHTML': this.marketPlacesTable.dataTableHTML
    });
  }

  function _htmlAdvanced() {
    return TemplateAdvancedHTML({
      'formPanelId': this.formPanelId,
      'marketPlacesTableAdvancedHTML': this.marketPlacesTableAdvanced.dataTableHTML
    });
  }

  function _onShow(context) {
    this.imagesTable.resetResourceTableSelect();
    this.marketPlacesTable.resetResourceTableSelect();
    this.marketPlacesTableAdvanced.resetResourceTableSelect();

    $("#NAME", context).focus();

    return false;
  }

  function _setImageId(imageId) {
    var selectedResources = {
      ids : imageId
    }
    
    this.imagesTable.selectResourceTableSelect(selectedResources);
  }

  // Set up the create datastore context
  function _setup(context) {
    Tips.setup(context);

    this.imagesTable.initialize();
    this.marketPlacesTable.initialize();
    this.marketPlacesTableAdvanced.initialize();

    this.imagesTable.idInput().
      attr('required', '').
      attr('wizard_field', 'ORIGIN_ID');

    this.marketPlacesTable.idInput().attr('required', '');
    this.marketPlacesTableAdvanced.idInput().attr('required', '');
  }


  function _submitWizard(context) {
    var marketPlaceJSON = {};
    $.extend(marketPlaceJSON, WizardFields.retrieve(context));

    var marketPlaceAppObj = {
      "marketplaceapp" : marketPlaceJSON,
      "mp_id" : this.marketPlacesTable.idInput().val()
    };

    Sunstone.runAction("MarketPlaceApp.create", marketPlaceAppObj);
    return false;
  }

  function _submitAdvanced(context) {
    var template = $('#template', context).val();
    var marketPlaceAppObj = {
      "marketplaceapp" : {
        "marketplaceapp_raw" : template
      },
      "mp_id" : this.marketPlacesTableAdvanced.idInput().val()
    };

    Sunstone.runAction("MarketPlaceApp.create", marketPlaceAppObj);

    return false;
  }
});

