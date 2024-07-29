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

  var BaseFormPanel = require("utils/form-panels/form-panel");
  var ImagesTable = require("tabs/images-tab/datatable");
  var Locale = require("utils/locale");
  var MarketPlacesTable = require("tabs/marketplaces-tab/datatable");
  var Notifier = require("utils/notifier");
  var OpenNebula = require("opennebula");
  var OpenNebulaAction = require("opennebula/action");
  var ServicesTable = require("tabs/oneflow-templates-tab/datatable");
  var Sunstone = require("sunstone");
  var TemplatesTable = require("tabs/templates-tab/datatable");
  var Tips = require("utils/tips");
  var VMsTable = require("tabs/vms-tab/datatable");
  var WizardFields = require("utils/wizard-fields");

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
      },
      "export_vm": {
        "title": Locale.tr("Create MarketPlace App from VM"),
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

    this.vmsTable = new VMsTable(
      FORM_PANEL_ID + "vmsTable",
      { "select": true,
        "selectOptions": {
          "filter_fn": function(vm) {
            return String(OpenNebula.VM.STATES.POWEROFF) === vm.STATE;
          }
        } 
      });

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
  FormPanel.prototype.setVMId = _setVMId;
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
      "vmsTableHTML": this.vmsTable.dataTableHTML,
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
    this.templatesTable.resetResourceTableSelect();
    this.vmsTable.resetResourceTableSelect();
    // Only try to refresh the servicesTable when oneflow running
    if ($('#serviceMarketPlaceError').attr("oneflow_running") === "true"){
      this.servicesTable.resetResourceTableSelect();
    }
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

  function _setVMId(serviceId) {
    var selectedResources = {
      ids : serviceId
    };

    this.vmsTable.selectResourceTableSelect(selectedResources);
  }

  // Set up the create datastore context
  function _setup(context) {
    var that = this;
    Tips.setup(context);

    this.imagesTable.initialize();
    this.templatesTable.initialize();
    this.servicesTable.initialize();
    this.vmsTable.initialize();
    this.marketPlacesServiceTable.initialize();
    this.marketPlacesTable.initialize();
    this.marketPlacesTableAdvanced.initialize();

    this.marketPlacesTable.idInput().attr("required", "");
    this.marketPlacesTableAdvanced.idInput().attr("required", "");

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
          that.vmsTable.idInput().
            removeAttr("required").
            removeAttr("wizard_field");
          
          $('#importAllCheckBox',context).hide();

          $('#servicesTableHTML', context).hide();
          $('#templatesTableHTML', context).hide();
          $('#imagesTableHTML', context).show();
          $('#vmsTableHTML', context).hide();

          $('#serviceMarketPlaceHTML', context).hide();
          $('#appMarketPlaceHTML', context).show();
          $('#templatesForApp',context).show();
          break;
        case 'vm':
          that.imagesTable.idInput().
            removeAttr("required").
            removeAttr("wizard_field");
          that.templatesTable.idInput().
            removeAttr("required").
            removeAttr("wizard_field");
          that.servicesTable.idInput().
            removeAttr("required").
            removeAttr("wizard_field");
          that.vmsTable.idInput().
            attr("required", "").
            attr("wizard_field", "ORIGIN_ID");
          
          $('#importAllCheckBox',context).show();

          $('#servicesTableHTML', context).hide();
          $('#templatesTableHTML', context).hide();
          $('#imagesTableHTML', context).hide();
          $('#vmsTableHTML', context).show();

          $('#serviceMarketPlaceHTML', context).hide();
          $('#appMarketPlaceHTML', context).show();
          $('#templatesForApp',context).hide();
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
          that.vmsTable.idInput().
            removeAttr("required").
            removeAttr("wizard_field");

          $('#importAllCheckBox',context).show();
          
          $('#servicesTableHTML', context).hide();
          $('#templatesTableHTML', context).show();
          $('#imagesTableHTML', context).hide();
          $('#vmsTableHTML', context).hide();

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

          var success_func = function (){
            $("#serviceMarketPlaceError").hide();
            $("#serviceMarketPlaceError").attr("oneflow_running", true);
            that.servicesTable.resetResourceTableSelect();
          };

          var error_func = function (){
            $("#serviceMarketPlaceError").show();
            $("#serviceMarketPlaceError").attr("oneflow_running", false);
          };

          OpenNebulaAction.list({options: undefined, success: success_func, error: error_func}, "DOCUMENT", "service_template");

          $('#importAllCheckBox',context).show();

          $('#servicesTableHTML', context).show();
          $('#templatesTableHTML', context).hide();
          $('#imagesTableHTML', context).hide();
          $('#vmsTableHTML', context).hide();

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
    var marketplaceIdSelected = this.marketPlacesTable.idInput().val()

    switch (type) {
      case 'image':
        var marketPlaceJSON = $.extend({}, WizardFields.retrieve(context));
    
        var data = {
          "marketplaceapp" : marketPlaceJSON,
          "mp_id" : marketplaceIdSelected
        };
    
        Sunstone.runAction("MarketPlaceApp.create", data);
        break;
      case 'vm':
        var marketPlaceJSON = $.extend({}, WizardFields.retrieve(context));

        marketPlaceJSON['IMPORT_ALL'] = marketPlaceJSON['IMPORT_ALL'] === 'on'
        marketPlaceJSON['MARKETPLACE_ID'] = marketplaceIdSelected;

        var template = {
          id: marketPlaceJSON['ORIGIN_ID'],
          extra_param: { name : marketPlaceJSON.NAME }
        }

        OpenNebula.VM.show({
          data : {
            id: marketPlaceJSON['ORIGIN_ID']
          },
          timeout: true,
          success: function (_, vmTemplate) {
            if ( OpenNebula.VM.isvCenterVM(vmTemplate.VM)){
                Notifier.notifyError(
                  Locale.tr("Import error: Can't import vCenter VMs to a marketplace, only vCenter VM templates.")
                  );           
            }
            else{
              OpenNebula.VM.save_as_template({
                data: template,
                success: function(_, templateId) {
                  Notifier.notifyMessage(Locale.tr("VM Template") + ' ' + marketPlaceJSON.NAME + ' ' + Locale.tr("saved successfully"));
      
                  var newTemplate = $.extend(marketPlaceJSON, { ORIGIN_ID: String(templateId) });
      
                  Sunstone.runAction("MarketPlaceApp.import_vm_template", 'vm', newTemplate);
                },
                error: function(request, response) {
                  Sunstone.hideFormPanelLoading(TAB_ID);
                  Notifier.onError(request, response);
                }
              });
            }

          },
          error: function(request, response) {
            Sunstone.hideFormPanelLoading(TAB_ID);
            Notifier.onError(request, response);
          }
        });

        break;

      case 'vmtemplate':
        var marketPlaceJSON = $.extend({}, WizardFields.retrieve(context));

        marketPlaceJSON['IMPORT_ALL'] = marketPlaceJSON['IMPORT_ALL'] === 'on'
        marketPlaceJSON['MARKETPLACE_ID'] = marketplaceIdSelected;
    
        Sunstone.runAction("MarketPlaceApp.import_vm_template", 'vmtemplate', marketPlaceJSON);

        break;
      
      case 'service_template':
        var marketPlaceJSON = $.extend({}, WizardFields.retrieve(context));

        marketPlaceJSON['IMPORT_ALL'] = marketPlaceJSON['IMPORT_ALL'] === 'on'
        marketPlaceJSON['MARKETPLACE_ID'] = marketplaceIdSelected;
        marketPlaceJSON['MARKETPLACE_SERVICE_ID'] = this.marketPlacesServiceTable.idInput().val();
    
        Sunstone.runAction("MarketPlaceApp.import_service_template", 'service', marketPlaceJSON);
        
        break;
    
      default: break;
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
