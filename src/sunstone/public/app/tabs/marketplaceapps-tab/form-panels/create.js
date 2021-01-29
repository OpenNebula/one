/* -------------------------------------------------------------------------- */
/* Copyright 2002-2021, OpenNebula Project, OpenNebula Systems                */
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

  var BaseFormPanel = require("utils/form-panels/form-panel");
  var Sunstone = require("sunstone");
  var Locale = require("utils/locale");
  var Notifier = require("utils/notifier");
  var Tips = require("utils/tips");
  var ImagesTable = require("tabs/images-tab/datatable");
  var TemplatesTable = require("tabs/templates-tab/datatable");
  var ServicesTable = require("tabs/oneflow-templates-tab/datatable");
  var MarketPlacesTable = require("tabs/marketplaces-tab/datatable");
  var Config = require("sunstone-config");
  var WizardFields = require("utils/wizard-fields");
  var OpenNebula = require("opennebula");

  /*
    TEMPLATES
   */

  var TemplateWizardHTML = require("hbs!./create/wizard");
  var TemplateAdvancedHTML = require("hbs!./create/advanced");

  /*
    CONSTANTS
   */

  var FORM_PANEL_ID = require("./create/formPanelId");
  var TAB_ID = require("../tabId");

  /*
    CONSTRUCTOR
   */

  function FormPanel() {
    this.formPanelId = FORM_PANEL_ID;
    this.tabId = TAB_ID;
    this.actions = {
      "create": {
        "title": Locale.tr("Create MarketPlace App"),
        "buttonText": Locale.tr("Create"),
        "resetButton": true
      },
      "export": {
        "title": Locale.tr("Create MarketPlace App from Image"),
        "buttonText": Locale.tr("Create"),
        "resetButton": true
      },
      "export_template": {
        "title": Locale.tr("Create MarketPlace App from VM Template"),
        "buttonText": Locale.tr("Create"),
        "resetButton": true
      },
      "export_service": {
        "title": Locale.tr("Create MarketPlace App from Service"),
        "buttonText": Locale.tr("Create"),
        "resetButton": true
      }
    };

    this.imagesTable = new ImagesTable(
      FORM_PANEL_ID + "imagesTable",
      { "select": true,
        "selectOptions": {
          "filter_fn": function(image) {
            return OpenNebula.Datastore.isMarketExportSupported(image.DATASTORE_ID);
          }
        }
      });
    
    this.templatesTable = new TemplatesTable(
      FORM_PANEL_ID + "templatesTable",
      { "select": true });

    this.servicesTable = new ServicesTable(
      FORM_PANEL_ID + "servicesTable",
      { "select": true });

    this.marketPlacesTable = new MarketPlacesTable(
      FORM_PANEL_ID + "marketPlacesTable",
      { "select": true,
        "selectOptions": {
          "filter_fn": function(market) {
            var valid = market.ZONE_ID == config.zone_id;
            valid = $(config.oned_conf.MARKET_MAD_CONF)
                .filter(function(_, marketMad){
                  return marketMad.NAME == market.MARKET_MAD && marketMad.APP_ACTIONS.indexOf("create") !== -1;
                }).length > 0;
            return valid;
          }
        }
      });

      this.marketPlacesServiceTable = new MarketPlacesTable(
        FORM_PANEL_ID + "marketPlacesServiceTable",
        { "select": true,
          "selectOptions": {
            "filter_fn": function(market) {
              var valid = market.ZONE_ID == config.zone_id;
              valid = $(config.oned_conf.MARKET_MAD_CONF)
                  .filter(function(_, marketMad){
                    return marketMad.NAME == market.MARKET_MAD && marketMad.APP_ACTIONS.indexOf("create") !== -1;
                  }).length > 0;
              return valid;
            }
          }
        });

    this.marketPlacesTableAdvanced = new MarketPlacesTable(
      FORM_PANEL_ID + "marketPlacesTableAdvanced",
      { "select": true,
        "selectOptions": {
          "filter_fn": function(market) {
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
  FormPanel.prototype.setTemplateId = _setTemplateId;
  FormPanel.prototype.setServiceId = _setServiceId;
  FormPanel.prototype.onShow = _onShow;
  FormPanel.prototype.setup = _setup;

  return FormPanel;

  /*
    FUNCTION DEFINITIONS
   */

  function _htmlWizard() {
    return TemplateWizardHTML({
      "formPanelId": this.formPanelId,
      "imagesTableHTML": this.imagesTable.dataTableHTML,
      "templatesTableHTML": this.templatesTable.dataTableHTML,
      "servicesTableHTML": this.servicesTable.dataTableHTML,
      "marketPlacesImagesTableHTML": this.marketPlacesTable.dataTableHTML,
      "marketPlacesServicesTableHTML": this.marketPlacesServiceTable.dataTableHTML
    });
  }

  function _htmlAdvanced() {
    return TemplateAdvancedHTML({
      "formPanelId": this.formPanelId,
      "marketPlacesTableAdvancedHTML": this.marketPlacesTableAdvanced.dataTableHTML
    });
  }

  function _onShow(context) {
    this.imagesTable.resetResourceTableSelect();
    this.servicesTable.resetResourceTableSelect();
    this.templatesTable.resetResourceTableSelect();
    this.marketPlacesTable.resetResourceTableSelect();
    this.marketPlacesServiceTable.resetResourceTableSelect();
    this.marketPlacesTableAdvanced.resetResourceTableSelect();

    $("#NAME", context).focus();
    $('#TYPE',context).trigger("change");

    return false;
  }

  function _setImageId(imageId) {
    var selectedResources = {
      ids : imageId
    };

    this.imagesTable.selectResourceTableSelect(selectedResources);
  }

  function _setTemplateId(templateId) {
    var selectedResources = {
      ids : templateId
    };

    this.templatesTable.selectResourceTableSelect(selectedResources);
  }

  function _setServiceId(serviceId) {
    var selectedResources = {
      ids : serviceId
    };

    this.servicesTable.selectResourceTableSelect(selectedResources);
  }


  // Set up the create datastore context
  function _setup(context) {
    var that = this;
    Tips.setup(context);

    this.imagesTable.initialize();
    this.templatesTable.initialize();
    this.servicesTable.initialize();
    this.marketPlacesServiceTable.initialize();
    this.marketPlacesTable.initialize();
    this.marketPlacesTableAdvanced.initialize();

    this.marketPlacesTable.idInput().attr("required", "");
    this.marketPlacesTableAdvanced.idInput().attr("required", "");
    this.servicesTable.idInput().attr("required", "");
    // this.templatesTable.idInput().attr("required", "");
    
    // this.marketPlacesServiceTable.idInput().attr("required", "");

    $('#IMPORT_ALL', context).on('change', function(){
      if (
        $('#IMPORT_ALL', context).is(':checked') &&
        $('#TYPE',context).val() == 'service_template'
      ){
        $('#serviceMarketPlaceHTML', context).show();
        $('#selected_resource_id_createMarketPlaceAppFormmarketPlacesServiceTable', context).attr('required','');
      }
      else{
        $('#serviceMarketPlaceHTML', context).hide();
        $('#selected_resource_id_createMarketPlaceAppFormmarketPlacesServiceTable', context).removeAttr('required');
      }
    });
    
    $('#TYPE',context).on('change', function(){
      switch (this.value) {
        case 'image':
          that.imagesTable.idInput().
            attr("required", "").
            attr("wizard_field", "ORIGIN_ID");
          that.templatesTable.idInput().
            removeAttr("required").
            removeAttr("wizard_field");
          that.servicesTable.idInput().
            removeAttr("required").
            removeAttr("wizard_field");
          
          $('#importAllCheckBox',context).hide();

          $('#servicesTableHTML', context).hide();
          $('#templatesTableHTML', context).hide();
          $('#imagesTableHTML', context).show();

          $('#serviceMarketPlaceHTML', context).hide();
          $('#appMarketPlaceHTML', context).show();
          $('#templatesForApp',context).show();
          break;
        case 'vmtemplate':
          that.templatesTable.idInput().
            attr("required", "").
            attr("wizard_field", "ORIGIN_ID");
          that.imagesTable.idInput().
            removeAttr("required").
            removeAttr("wizard_field");
          that.servicesTable.idInput().
            removeAttr("required").
            removeAttr("wizard_field");

          $('#importAllCheckBox',context).show();
          
          $('#servicesTableHTML', context).hide();
          $('#templatesTableHTML', context).show();
          $('#imagesTableHTML', context).hide();

          $('#serviceMarketPlaceHTML', context).hide();
          $('#appMarketPlaceHTML', context).show();
          $('#templatesForApp',context).hide();
          break;
        case 'service_template':
          that.servicesTable.idInput().
            attr("required", "").
            attr("wizard_field", "ORIGIN_ID");
          that.templatesTable.idInput().
            removeAttr("required").
            removeAttr("wizard_field");
          that.imagesTable.idInput().
            removeAttr("required").
            removeAttr("wizard_field");

          $('#importAllCheckBox',context).show();

          $('#servicesTableHTML', context).show();
          $('#templatesTableHTML', context).hide();
          $('#imagesTableHTML', context).hide();

          $('#serviceMarketPlaceHTML', context).hide();
          $('#appMarketPlaceHTML', context).show();
          $('#templatesForApp',context).hide();
          break;
        default:
          break;
      }

    });
  }

  function _submitWizard(context) {

    var type = $('#TYPE', context)[0].value;

    switch (type) {
      case 'image':
        var marketPlaceJSON = {};
        $.extend(marketPlaceJSON, WizardFields.retrieve(context));
    
        var marketPlaceAppObj = {
          "marketplaceapp" : marketPlaceJSON,
          "mp_id" : this.marketPlacesTable.idInput().val()
        };
    
        Sunstone.runAction("MarketPlaceApp.create", marketPlaceAppObj);
        break;
      case 'vmtemplate':
        var marketPlaceJSON = {};
        $.extend(marketPlaceJSON, WizardFields.retrieve(context));

        if (marketPlaceJSON['IMPORT_ALL'] && marketPlaceJSON['IMPORT_ALL'] == "on" ){
          marketPlaceJSON['IMPORT_ALL'] = 'yes';
        }
        else{
          marketPlaceJSON['IMPORT_ALL'] = 'no';
        }
        marketPlaceJSON['MARKETPLACE_ID'] = this.marketPlacesTable.idInput().val();
    
        Sunstone.runAction(
          "MarketPlaceApp.import_vm_template",
          this.marketPlacesTable.idInput().val(),
          marketPlaceJSON
        );

        break;
      
      case 'service_template':
        var marketPlaceJSON = {};
        $.extend(marketPlaceJSON, WizardFields.retrieve(context));

        if (marketPlaceJSON['IMPORT_ALL'] && marketPlaceJSON['IMPORT_ALL'] == "on" ){
          marketPlaceJSON['IMPORT_ALL'] = 'yes';
        }
        else{
          marketPlaceJSON['IMPORT_ALL'] = 'no';
        }

        marketPlaceJSON['MARKETPLACE_ID'] = this.marketPlacesTable.idInput().val();
        marketPlaceJSON['MARKETPLACE_SERVICE_ID'] = this.marketPlacesServiceTable.idInput().val();
    
        Sunstone.runAction(
          "MarketPlaceApp.import_service_template",
          this.marketPlacesTable.idInput().val(),
          marketPlaceJSON
        );
        
        break;
    
      default:
        break;
    }
    return false;
  }

  function _submitAdvanced(context) {
    var template = $("#template", context).val();
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
