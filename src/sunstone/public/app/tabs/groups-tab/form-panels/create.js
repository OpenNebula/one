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
  var Locale = require('utils/locale');
  var Sunstone = require('sunstone');
  var TemplateUtils = require('utils/template-utils');
  var Tips = require('utils/tips');
  var UserCreation = require('tabs/users-tab/utils/user-creation');
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

    this.userCreation = new UserCreation(FORM_PANEL_ID, { group_select: false });

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
    this.filtered_views = filtered_views;

    return TemplateWizardHTML({
      'formPanelId': this.formPanelId,
      'userCreationHTML': this.userCreation.html(),
      'viewTypes': viewTypes
    });
  }

  function _setup(context) {
    var that = this;

    Foundation.reflow(context, 'tabs');

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

    $(context).off("change", ".admin_view_input");
    $(context).on("change", ".admin_view_input", function(){
      _generateViewsSelect(context, "admin");
    });

    $(context).off("change", ".user_view_input");
    $(context).on("change", ".user_view_input", function(){
      _generateViewsSelect(context, "user");
    });

    if (this.action == "create") {
      $("input#group_view_cloud").prop('checked', true).change();
      $("input#group_admin_view_cloud").prop('checked', true).change();
      $("input#group_admin_view_groupadmin").prop('checked', true).change();

      _generateViewsSelect(context, "admin", "groupadmin");
      _generateViewsSelect(context, "user", "cloud");
    }
  }

  function _submitWizard(context) {
    var views = [];
    $.each($('[id^="group_view"]:checked', context), function(){
      views.push($(this).val());
    });

    var admin_views = [];
    $.each($('[id^="group_admin_view"]:checked', context), function(){
      admin_views.push($(this).val());
    });

    var default_view = $('#user_view_default', context).val();
    var default_admin_view = $('#admin_view_default', context).val();

    if (this.action == "create") {
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

      group_json['group']['views'] = views;

      if (default_view != undefined){
        group_json['group']['default_view'] = default_view;
      }

      group_json['group']['admin_views'] = admin_views;

      if (default_admin_view != undefined){
        group_json['group']['default_admin_view'] = default_admin_view;
      }

      group_json['group']['opennebula'] = {};

      if ($('#default_image_persistent_new', context).val() !== ""){
        group_json['group']['opennebula']["default_image_persistent_new"] = $('#default_image_persistent_new', context).val();
      }

      if ($('#default_image_persistent', context).val() !== ""){
        group_json['group']['opennebula']["default_image_persistent"] = $('#default_image_persistent', context).val();
      }

      Sunstone.runAction("Group.create",group_json);
      return false;
    } else if (this.action == "update") {
      var template_json = this.element.TEMPLATE;

      delete template_json['SUNSTONE'];
      delete template_json['OPENNEBULA'];

      var sunstone_template = {};
      if (views.length != 0){
        sunstone_template["VIEWS"] = views.join(",");
      }

      if (default_view != undefined){
        sunstone_template["DEFAULT_VIEW"] = default_view;
      }

      if (admin_views.length != 0){
        sunstone_template["GROUP_ADMIN_VIEWS"] = admin_views.join(",");
      }

      if (default_admin_view != undefined){
        sunstone_template["GROUP_ADMIN_DEFAULT_VIEW"] = default_admin_view;
      }

      if (!$.isEmptyObject(sunstone_template)) {
        template_json['SUNSTONE'] = sunstone_template;
      }

      template_json['OPENNEBULA'] = {};

      if ($('#default_image_persistent_new', context).val() !== ""){
        template_json['OPENNEBULA']["default_image_persistent_new"] = $('#default_image_persistent_new', context).val();
      }

      if ($('#default_image_persistent', context).val() !== ""){
        template_json['OPENNEBULA']["default_image_persistent"] = $('#default_image_persistent', context).val();
      }

      var template_str = TemplateUtils.templateToString(template_json);
      Sunstone.runAction("Group.update", this.resourceId, template_str);
      return false;
    }
  }

  function _onShow() {}

  function _fill(context, element) {
    if (this.action != "update") {return;}

    this.setHeader(element);

    this.resourceId = element.ID;
    this.element = element;

    // Disable parts of the wizard
    $("input#name", context).attr("disabled", "disabled");
    $("#default_vdc_warning", context).hide();

    $("a[href='#administrators']", context).parents("dd").hide();
    $("a[href='#resource_creation']", context).parents("dd").hide();

    $("input#name", context).val(element.NAME);

    var views_str = "";

    $('input[id^="group_view"]', context).removeAttr('checked');

    var sunstone_template = element.TEMPLATE.SUNSTONE;
    var opennebula_template = element.TEMPLATE.OPENNEBULA;
    if (sunstone_template && sunstone_template.VIEWS){
      views_str = sunstone_template.VIEWS;

      var views = views_str.split(",");
      $.each(views, function(){
        $('input[id^="group_view"][value="'+this.trim()+'"]',
          context).prop('checked', true).change();
      });
    }

    $('input[id^="group_default_view"]', context).removeAttr('checked');

    if (sunstone_template && sunstone_template.DEFAULT_VIEW){
      $('#user_view_default', context).val(sunstone_template.DEFAULT_VIEW.trim()).change();
    } else {
      $('#user_view_default', context).val("").change();
    }

    $('input[id^="group_admin_view"]', context).removeAttr('checked');

    if (sunstone_template && sunstone_template.GROUP_ADMIN_VIEWS){
      views_str = sunstone_template.GROUP_ADMIN_VIEWS;

      var views = views_str.split(",");
      $.each(views, function(){
        $('input[id^="group_admin_view"][value="'+this.trim()+'"]',
          context).prop('checked', true).change();
      });
    }

    $('input[id^="group_default_admin_view"]', context).removeAttr('checked');

    if (sunstone_template && sunstone_template.GROUP_ADMIN_DEFAULT_VIEW){
      $('#admin_view_default', context).val(sunstone_template.GROUP_ADMIN_DEFAULT_VIEW.trim()).change();
    } else {
      $('#admin_view_default', context).val("").change();
    }

    if (opennebula_template && opennebula_template.DEFAULT_IMAGE_PERSISTENT_NEW){
      $('#default_image_persistent_new', context).val(opennebula_template.DEFAULT_IMAGE_PERSISTENT_NEW);
    }

    if (opennebula_template && opennebula_template.DEFAULT_IMAGE_PERSISTENT){
      $('#default_image_persistent', context).val(opennebula_template.DEFAULT_IMAGE_PERSISTENT);
    }
  }

  function _generateViewsSelect(context, idPrefix, value) {
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
