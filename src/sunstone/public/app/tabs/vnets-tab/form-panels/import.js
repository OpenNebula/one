define(function(require) {
  /*
    DEPENDENCIES
   */

  require('foundation.tab');
  var BaseFormPanel = require('utils/form-panels/form-panel');
  var Sunstone = require('sunstone');
  var Locale = require('utils/locale');
  var VCenterNetworks = require('utils/vcenter/networks');

  /*
    TEMPLATES
   */

  var TemplateHTML = require('hbs!./import/html');

  /*
    CONSTANTS
   */

  var FORM_PANEL_ID = require('./import/formPanelId');
  var TAB_ID = require('../tabId');

  /*
    CONSTRUCTOR
   */

  function FormPanel() {
    this.formPanelId = FORM_PANEL_ID;
    this.tabId = TAB_ID;
    this.actions = {
      'import': {
        'title': Locale.tr("Import vCenter Networks"),
        'buttonText': Locale.tr("Import"),
        'resetButton': true
      }
    };

    this.vCenterNetworks = new VCenterNetworks();

    BaseFormPanel.call(this);
  }

  FormPanel.FORM_PANEL_ID = FORM_PANEL_ID;
  FormPanel.prototype = Object.create(BaseFormPanel.prototype);
  FormPanel.prototype.constructor = FormPanel;
  FormPanel.prototype.htmlWizard = _htmlWizard;
  FormPanel.prototype.submitWizard = _submitWizard;
  FormPanel.prototype.onShow = _onShow;
  FormPanel.prototype.setup = _setup;

  return FormPanel;

  /*
    FUNCTION DEFINITIONS
   */

  function _htmlWizard() {
    return TemplateHTML({
      'formPanelId': this.formPanelId,
      'vCenterNetworksHTML': this.vCenterNetworks.html()
    });
  }

  function _setup(context) {
    var that = this;

    Sunstone.disableFormPanelSubmit(TAB_ID);

    $("#get_vcenter_networks", context).on("click", function(){
      Sunstone.enableFormPanelSubmit(TAB_ID);

      var vcenter_user = $("#vcenter_user", context).val();
      var vcenter_password = $("#vcenter_password", context).val();
      var vcenter_host = $("#vcenter_host", context).val();

      that.vCenterNetworks.insert({
        container: context,
        vcenter_user: vcenter_user,
        vcenter_password: vcenter_password,
        vcenter_host: vcenter_host
      });

      return false;
    });

    return false;
  }

  function _submitWizard(context) {
    var that = this;

    Sunstone.hideFormPanelLoading(TAB_ID);
    Sunstone.disableFormPanelSubmit(TAB_ID);

    this.vCenterNetworks.import();

    return false;
  }

  function _onShow(context) {
  }
});
