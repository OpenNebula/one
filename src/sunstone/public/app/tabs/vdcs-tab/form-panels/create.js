define(function(require) {
  /*
    DEPENDENCIES
   */
  
  require('foundation.tab');
  var BaseFormPanel = require('utils/form-panels/form-panel');
  var Sunstone = require('sunstone');
  var Locale = require('utils/locale');
  var Tips = require('utils/tips');
  var CustomTagsTable = require('utils/custom-tags-table');
  var WizardFields = require('utils/wizard-fields');
  var GroupsTable = require('tabs/groups-tab/datatable');
  var OpenNebulaZone = require('opennebula/zone');
  var Utils = require('../utils/common');
  var Notifier = require('utils/notifier');
  var ResourcesTab = require('../utils/resources-tab');

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
        'title': Locale.tr("Create Virtual Data Center"),
        'buttonText': Locale.tr("Create"),
        'resetButton': true
      },
      'update': {
        'title': Locale.tr("Update Virtual Data Center"),
        'buttonText': Locale.tr("Update"),
        'resetButton': false
      }
    };

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
    var opts = {
      info: false,
      select: true,
      selectOptions: {"multiple_choice": true}
    };

    this.groupsTable = new GroupsTable("vdc_wizard_groups", opts);

    this.resourcesTab = new ResourcesTab("vdc_create_wizard");

    return TemplateWizardHTML({
      'formPanelId': this.formPanelId,
      'customTagsHTML': CustomTagsTable.html(),
      'groupsTableHTML': this.groupsTable.dataTableHTML,
      'resourcesTabHTML': this.resourcesTab.html()
    });
  }

  function _htmlAdvanced() {
    return TemplateAdvancedHTML({formPanelId: this.formPanelId});
  }

  function _setup(context) {
    var that = this;

    CustomTagsTable.setup($("#vdcCreateGeneralTab", context));
    this.groupsTable.initialize();

    var zone_ids = [];

    OpenNebulaZone.list({
      timeout: true,
      success: function (request, obj_list){
        var zoneSection = $("#vdcCreateResourcesTab",context);

        $.each(obj_list,function(){
          zone_ids.push(this.ZONE.ID);

          that.resourcesTab.addResourcesZone(
            this.ZONE.ID,
            this.ZONE.NAME,
            zoneSection);
        });

        that.resourcesTab.setup(zoneSection);

        that.zone_ids = zone_ids;
      },
      error: Notifier.onError
    });

    context.foundation();
    Tips.setup();
  }

  function _submitWizard(context) {

    //Fetch values
    var vdc_json = {};

    $.extend(vdc_json, WizardFields.retrieve($("#vdcCreateGeneralTab", context)));

    $.extend(vdc_json, CustomTagsTable.retrieve($("#vdcCreateGeneralTab", context)));

    var group_ids = this.groupsTable.retrieveResourceTableSelect();

    if (this.action == "create") {
      var resources = this.resourcesTab.retrieve(context);

      vdc_json = {
        "vdc" : vdc_json,
        "group_ids" : group_ids,
        "clusters" : resources.clusters,
        "hosts" : resources.hosts,
        "vnets" : resources.vnets,
        "datastores" : resources.datastores
      };

      Sunstone.runAction("Vdc.create",vdc_json);
      return false;
    } else if (this.action == "update") {
      // TODO
    }

  }

  function _submitAdvanced(context) {
    if (this.action == "create") {
      var template = $('textarea#template',context).val();
      var vdc_json = {vdc: {vdc_raw: template}};
      Sunstone.runAction("Vdc.create",vdc_json);
      return false;
    } else if (this.action == "update") {
      // TODO
    }
  }

  function _onShow(context) {
    // TODO bug, does not work until the input is visible
    //$("input#name", context).focus();

    this.groupsTable.refreshResourceTableSelect();
    this.resourcesTab.onShow(context);
  }

  function _fill(context, element) {
    // TODO
  }
});
