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
  var Views = require('tabs/groups-tab/utils/views');

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

    this.userCreation = new UserCreation(FORM_PANEL_ID);

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
    var filtered_views = {
      cloud : [],
      advanced : [],
      vcenter : [],
      other : []
    };

    var view_info;
    $.each(config['all_views'], function(index, view_id) {
      view_info = Views.info[view_id];
      if (view_info) {
        switch (view_info.type) {
          case 'advanced':
            filtered_views.advanced.push(view_info);
            break;
          case 'cloud':
            filtered_views.cloud.push(view_info);
            break;
          case 'vcenter':
            filtered_views.vcenter.push(view_info);
            break;
          default:
            filtered_views.other.push({
              id: view_id,
              name: view_id,
              description: null,
              type: "other"
            });
            break;
        }
      } else {
        filtered_views.other.push({
          id: view_id,
          name: view_id,
          description: null,
          type: "other"
        });
      }
    });

    var viewTypes = [];

    $.each(filtered_views, function(view_type, views){
      if (views.length > 0) {
        viewTypes.push(
          {
            'name': Views.types[view_type].name,
            'description': Views.types[view_type].description,
            'preview': Views.types[view_type].preview,
            'views': views
          });
      }
    });

    return TemplateWizardHTML({
      'formPanelId': this.formPanelId,
      'userCreationHTML': this.userCreation.html(),
      'viewTypes': viewTypes
    });
  }

  function _setup(context) {
    var that = this;

    this.userCreation.setup( $("#admin_user_wrapper",context) );
    Tips.setup(context);

    $('input#name', context).change(function(){
      var val = $(this).val();

      that.userCreation.setName(context, val + "-admin");
    });

    $('input#admin_user', context).change(function(){
      if ($(this).prop('checked')) {
        that.userCreation.enable( $("#admin_user_wrapper",context) );
      } else {
        that.userCreation.disable( $("#admin_user_wrapper",context) );
      }
    });

    this.userCreation.disable( $("#admin_user_wrapper",context) );

    $.each($('[id^="group_res"]', context), function(){
      $(this).prop("checked", true);
    });

    $("#group_res_net", context).prop("checked", false);

    _generateViewsSelect(context, "admin", "groupadmin");
    $(context).off("change", ".admin_view_input");
    $(context).on("change", ".admin_view_input", function(){
      _generateViewsSelect(context, "admin");
    });

    _generateViewsSelect(context, "user", "cloud");
    $(context).off("change", ".user_view_input");
    $(context).on("change", ".user_view_input", function(){
      _generateViewsSelect(context, "user");
    });

    $("input#group_view_cloud").attr('checked','checked').change();
    $("input#group_admin_view_groupadmin").attr('checked','checked').change();
  }

  function _submitWizard(context) {
    var name = $('#name',context).val();

    var user_json = null;

    if ( $('#admin_user', context).prop('checked') ){
      user_json = this.userCreation.retrieve($("#admin_user_wrapper",context));
    }

    var group_json = {
      "group" : {
        "name" : name
      }
    };

    if (user_json){
      group_json["group"]["group_admin"] = user_json;
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

    Sunstone.runAction("Group.create",group_json);
    return false;
  }

  function _onShow(context) {

  }

  function _fill(context, element) {

  }

  function _generateViewsSelect(context, idPrefix, value) {
    var views = [];
    var old_value = value || $("#"+idPrefix+"_view_default", context).val();

    var html = '<option id="" name="" value=""></option>';

    $("."+idPrefix+"_view_input:checked", context).each(function(){
      var name = (Views.info[this.value] ? Views.info[this.value].name : this.value);

      html += '<option value="'+this.value+'">'+name+'</option>';
    });

    $("select#"+idPrefix+"_view_default", context).html(html);

    if (old_value) {
      $("#"+idPrefix+"_view_default", context).val(old_value).change();
    }
  }

});
