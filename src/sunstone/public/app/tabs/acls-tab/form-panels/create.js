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

  //require('foundation.tab');
  var BaseFormPanel = require('utils/form-panels/form-panel');
  var Sunstone = require('sunstone');
  var Locale = require('utils/locale');
  var Notifier = require('utils/notifier');
  var ResourceSelect = require('utils/resource-select');

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
        'title': Locale.tr("Create ACL"),
        'buttonText': Locale.tr("Create"),
        'resetButton': true
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
  FormPanel.prototype.setup = _setup;

  return FormPanel;

  /*
    FUNCTION DEFINITIONS
   */

  function _htmlWizard() {
    return TemplateWizardHTML({
      'formPanelId': this.formPanelId
    });
  }

  function _setup(context) {
    //Default selected options
    $('#applies_all',context).attr('checked','checked');
    $('.applies_to_user',context).hide();
    $('.applies_to_group',context).hide();

    $('#res_subgroup_all',context).attr('checked','checked');
    $('.res_id',context).hide();
    $('.belonging_to',context).hide();
    $('.in_cluster',context).hide();

    //Applies to subset radio buttons
    $('.applies',context).click(function(){
      var value = $(this).val();
      switch (value) {
      case "*":
        $('.applies_to_user',context).hide();
        $('.applies_to_group',context).hide();
        break;
      case "applies_to_user":
        $('.applies_to_user',context).show();
        $('.applies_to_group',context).hide();
        break;
      case "applies_to_group":
        $('.applies_to_user',context).hide();
        $('.applies_to_group',context).show();
        break;
      }
    });

    //Resource subset radio buttons
    $('.res_subgroup',context).click(function(){
      var value = $(this).val();
      switch (value) {
      case "*":
        $('.res_id',context).hide();
        $('.belonging_to',context).hide();
        $('.in_cluster',context).hide();
        break;
      case "res_id":
        $('.res_id',context).show();
        $('.belonging_to').hide();
        $('.in_cluster',context).hide();
        break;
      case "belonging_to":
        $('.res_id',context).hide();
        $('.belonging_to',context).show();
        $('.in_cluster',context).hide();
        break;
      case "in_cluster":
        $('.res_id',context).hide();
        $('.belonging_to',context).hide();
        $('.in_cluster',context).show();
        break;
      }
    });

    //trigger ACL string preview on keyup
    $('input#res_id',context).keyup(function(){
      $(this).trigger("change");
    });

    //update the rule preview every time some field changes
    context.off('change', 'input,select');
    context.on('change', 'input,select', function(){
      var user="";
      var mode = $('.applies:checked',context).val();
      switch (mode) {
        case "*":
          user="*";
          break;
        case "applies_to_user":
          user="#"+$('div#applies_to_user .resource_list_select',context).val();
          break;
        case "applies_to_group":
          user="@"+$('div#applies_to_group .resource_list_select',context).val();
          break;
      }

      var resources = "";
      $('.resource_cb:checked',context).each(function(){
        resources+=$(this).val()+'+';
      });

      if (resources.length) {
        resources = resources.substring(0,resources.length-1);
      }

      var belonging="";
      var mode = $('.res_subgroup:checked',context).val();
      switch (mode) {
        case "*":
          belonging="*";
          break;
        case "res_id":
          belonging="#"+$('#res_id',context).val();
          break;
        case "belonging_to":
          belonging="@"+$('div#belonging_to .resource_list_select',context).val();
          break;
        case "in_cluster":
          belonging="%"+$('#in_cluster .resource_list_select',context).val();
          break;
      }

      var rights = "";
      $('.right_cb:checked',context).each(function(){
        rights+=$(this).val()+'+';
      });
      if (rights.length) {
        rights = rights.substring(0,rights.length-1);
      }

      var zone = $('#zones_applies .resource_list_select',context).val();

      if (zone != "*"){
        zone = '#'+zone;
      }

      var acl_string = user + ' ' + resources + '/' + belonging + ' ' +
                       rights + ' ' + zone;
      $('#acl_preview',context).val(acl_string);
    });
  }

  function _submitWizard(context) {
    var mode = $('.applies:checked',context).val();
    switch (mode) {
      case "applies_to_user":
        var l=$('#applies_to_user .resource_list_select',context).val().length;
        if (!l){
          Sunstone.hideFormPanelLoading(this.tabId);
          Notifier.notifyError(Locale.tr("Please select a user to whom the acl applies"));
          return false;
        }
        break;
      case "applies_to_group":
        var l=$('#applies_to_group .resource_list_select',context).val().length;
        if (!l){
          Sunstone.hideFormPanelLoading(this.tabId);
          Notifier.notifyError(Locale.tr("Please select a group to whom the acl applies"));
          return false;
        }
        break;
    }

    var resources = $('.resource_cb:checked',context).length;
    if (!resources) {
      Sunstone.hideFormPanelLoading(this.tabId);
      Notifier.notifyError(Locale.tr("Please select at least one resource"));
      return false;
    }

    var mode = $('.res_subgroup:checked',context).val();
    switch (mode) {
      case "res_id":
        var l=$('#res_id',context).val().length;
        if (!l){
          Sunstone.hideFormPanelLoading(this.tabId);
          Notifier.notifyError(Locale.tr("Please provide a resource ID for the resource(s) in this rule"));
          return false;
        }
        break;
      case "belonging_to":
        var l=$('#belonging_to .resource_list_select',context).val().length;
        if (!l){
          Sunstone.hideFormPanelLoading(this.tabId);
          Notifier.notifyError("Please select a group to which the selected resources belong to");
          return false;
        }
        break;
      case "in_cluster":
        var l=$('#in_cluster .resource_list_select',context).val().length;
        if (!l){
          Sunstone.hideFormPanelLoading(this.tabId);
          Notifier.notifyError("Please select a cluster to which the selected resources belong to");
          return false;
        }
        break;
    }

    var rights = $('.right_cb:checked',context).length;
    if (!rights) {
      Sunstone.hideFormPanelLoading(this.tabId);
      Notifier.notifyError("Please select at least one operation");
      return false;
    }

    var acl_string = $('#acl_preview',context).val();

    var acl_json = { "acl" : acl_string };
    Sunstone.runAction("Acl.create",acl_json);
    return false;
  }

  function _onShow(context) {
    ResourceSelect.insert({
        context: $('#applies_to_user', context),
        resourceName: 'User',
        emptyValue: true
      });

    ResourceSelect.insert({
        context: $('#applies_to_group', context),
        resourceName: 'Group',
        emptyValue: true
      });

    ResourceSelect.insert({
        context: $('#belonging_to', context),
        resourceName: 'Group',
        emptyValue: true
      });

    ResourceSelect.insert({
        context: $('#in_cluster', context),
        resourceName: 'Cluster',
        emptyValue: true
      });

    ResourceSelect.insert({
        context: $('#zones_applies', context),
        resourceName: 'Zone',
        initValue: '*',
        extraOptions: '<option value="*">' + Locale.tr("All") + '</option>'
      });
  }
});
