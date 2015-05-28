define(function(require) {
  /*
    DEPENDENCIES
   */
  
  require('foundation.tab');
  var BaseFormPanel = require('utils/form-panels/form-panel');
  var Sunstone = require('sunstone');
  var Locale = require('utils/locale');
  var UserCreation = require('tabs/users-tab/utils/user-creation');
  var Tips = require('utils/tips');

  /*
    TEMPLATES
   */

  var TemplateWizardHTML = require('hbs!./create/wizard');

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
        'title': Locale.tr("Create Group"),
        'buttonText': Locale.tr("Create"),
        'resetButton': true
      },
      'update': {
        'title': Locale.tr("Update Group"),
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
  FormPanel.prototype.submitWizard = _submitWizard;
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
      'userCreationHTML': UserCreation.html()
    });
  }

  function _setup(context) {
    UserCreation.setup( $("#admin_user_wrapper",context) );
    Tips.setup(context);

    $('input#name', context).change(function(){
      var val = $(this).val();

      $('#username',context).val(val + "-admin");
    });

    $('input#admin_user', context).change(function(){
      if ($(this).prop('checked')) {
        UserCreation.enable( $("#admin_user_wrapper",context) );
      } else {
        UserCreation.disable( $("#admin_user_wrapper",context) );
      }
    });

    UserCreation.disable( $("#admin_user_wrapper",context) );

    $.each($('[id^="group_res"]', context), function(){
      $(this).prop("checked", true);
    });

    $("#group_res_net", context).prop("checked", false);

    /* TODO

    generateAdminViewsSelect(context, "groupadmin");
    $(context).off("change", ".admin_view_input");
    $(context).on("change", ".admin_view_input", function(){
      generateAdminViewsSelect(context);
    })

    generateUserViewsSelect(context, "cloud")
    $(context).off("change", ".user_view_input")
    $(context).on("change", ".user_view_input", function(){
      generateUserViewsSelect(context)
    })
    */
  }

  function _submitWizard(context) {
    var name = $('#name',context).val();

    var user_json = null;

    if ( $('#admin_user', context).prop('checked') ){
      user_json = UserCreation.retrieve($("#admin_user_wrapper",context));
    }

    var group_json = {
      "group" : {
        "name" : name
      }
    };

    if (user_json){
      group_json["group"]["group_admin"] = user_json["user"];
    }

    var resources = "";
    var separator = "";

    $.each($('[id^="group_res"]:checked', context), function(){
      resources += (separator + $(this).val());
      separator = "+";
    });

    group_json['group']['resources'] = resources;

    if ( $('#shared_resources', context).prop('checked') ){
      group_json['group']['shared_resources'] = "VM+DOCUMENT";
    }
/*
    group_json['group']['views'] = [];

    $.each($('[id^="group_view"]:checked', context), function(){
      group_json['group']['views'].push($(this).val());
    });

    var default_view = $('#user_view_default', context).val();
    if (default_view != undefined){
      group_json['group']['default_view'] = default_view;
    }

    group_json['group']['admin_views'] = [];

    $.each($('[id^="group_admin_view"]:checked', context), function(){
      group_json['group']['admin_views'].push($(this).val());
    });

    var default_view = $('#admin_view_default', context).val();
    if (default_view != undefined){
      group_json['group']['default_admin_view'] = default_view;
    }
*/
    Sunstone.runAction("Group.create",group_json);
    return false;
  }

  function _onShow(context) {

  }

  function _fill(context, element) {

  }
});
