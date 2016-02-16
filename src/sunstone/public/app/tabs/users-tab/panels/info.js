/* -------------------------------------------------------------------------- */
/* Copyright 2002-2015, OpenNebula Project, OpenNebula Systems                */
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

  var TemplateInfo = require('hbs!./info/html');
  var TemplateChgrpTr = require('hbs!./info/chgrp-tr');
  var ResourceSelect = require('utils/resource-select');
  var TemplateUtils = require('utils/template-utils');
  var Locale = require('utils/locale');
  var OpenNebulaUser = require('opennebula/user');
  var Sunstone = require('sunstone');

  /*
    TEMPLATES
   */

  var TemplateTable = require('utils/panel/template-table');

  /*
    CONSTANTS
   */

  var TAB_ID = require('../tabId');
  var PANEL_ID = require('./info/panelId');
  var RESOURCE = "User";
  var XML_ROOT = "USER";
  var PASSWORD_DIALOG_ID = require('tabs/users-tab/dialogs/password/dialogId');

  /*
    CONSTRUCTOR
   */

  function Panel(info) {
    this.title = Locale.tr("Info");
    this.icon = "fa-info-circle";

    this.element = info[XML_ROOT];

    return this;
  }

  Panel.PANEL_ID = PANEL_ID;
  Panel.prototype.html = _html;
  Panel.prototype.setup = _setup;

  return Panel;

  /*
    FUNCTION DEFINITIONS
   */

  function _html() {
    var groupTrHTML = TemplateChgrpTr({'element': this.element});

    // TODO: simplify interface?
    var strippedTemplate = $.extend({}, this.element.TEMPLATE);
    delete strippedTemplate["SSH_PUBLIC_KEY"];
    delete strippedTemplate["SUNSTONE"];

    var templateTableHTML = TemplateTable.html(strippedTemplate, RESOURCE,
                                              Locale.tr("Attributes"));
    //====

    return TemplateInfo({
      'element': this.element,
      'sunstone_template': this.element.TEMPLATE.SUNSTONE||{},
      'groupTrHTML': groupTrHTML,
      'templateTableHTML': templateTableHTML
    });
  }

  function _setup(context) {
    var that = this;

    // Template update
    // TODO: simplify interface?
    var strippedTemplate = $.extend({}, this.element.TEMPLATE);
    delete strippedTemplate["SSH_PUBLIC_KEY"];
    delete strippedTemplate["SUNSTONE"];

    var hiddenValues = {};

    if (this.element.TEMPLATE.SSH_PUBLIC_KEY != undefined) {
      hiddenValues.SSH_PUBLIC_KEY = this.element.TEMPLATE.SSH_PUBLIC_KEY;
    }
    if (this.element.TEMPLATE.SUNSTONE != undefined) {
      hiddenValues.SUNSTONE = this.element.TEMPLATE.SUNSTONE;
    }

    TemplateTable.setup(strippedTemplate, RESOURCE, this.element.ID, context, hiddenValues);
    //===

    // Chgrp
    context.off("click", "#div_edit_chg_group_link");
    context.on("click", "#div_edit_chg_group_link", function() {
      ResourceSelect.insert({
        context: $('#value_td_group', context),
        resourceName: 'Group',
        initValue: that.element.GID
      });
    });

    context.off("change", "#value_td_group .resource_list_select");
    context.on("change", "#value_td_group .resource_list_select", function() {
      var newGroupId = $(this).val();
      if (newGroupId != "") {
        Sunstone.runAction(RESOURCE + ".chgrp", [that.element.ID], newGroupId);
      }
    });

    // SSH input

    context.off("click", ".user_ssh_public_key_edit");
    context.on("click", ".user_ssh_public_key_edit", function() {
      $("#user_ssh_public_key_text", context).hide();
      $("#user_ssh_public_key_textarea", context).show().focus();
    });

    // Password button
    context.off("click", "#update_password");
    context.on("click", "#update_password", function(){
      Sunstone.getDialog(PASSWORD_DIALOG_ID).setParams(
        {selectedElements: [that.element.ID]});
      Sunstone.getDialog(PASSWORD_DIALOG_ID).reset();
      Sunstone.getDialog(PASSWORD_DIALOG_ID).show();
    });

    context.off("change", "#user_ssh_public_key_textarea");
    context.on("change", "#user_ssh_public_key_textarea", function() {
      var template_str = 'SSH_PUBLIC_KEY = "'+TemplateUtils.escapeDoubleQuotes($(this).val())+'"';

      Sunstone.runAction("User.append_template", that.element.ID, template_str);
    });

    context.off("focusout", "#user_ssh_public_key_textarea");
    context.on("focusout", "#user_ssh_public_key_textarea", function() {
      $("#user_ssh_public_key_text", context).show();
      $("#user_ssh_public_key_textarea", context).hide();
    });

    // Change table Order
    context.off("click", "#div_edit_table_order")
    context.on("click", "#div_edit_table_order", function() {
      $(".value_td_table_order", context).html('<select id="table_order_select">' +
         '<option value="asc">' + Locale.tr("ascending") + '</option>' +
         '<option value="desc">' + Locale.tr("descending") + '</option>' +
       '</select>');

      if (that.element.TEMPLATE.SUNSTONE && that.element.TEMPLATE.SUNSTONE.TABLE_ORDER) {
        $('#table_order_select', context).val(that.element.TEMPLATE.SUNSTONE.TABLE_ORDER);
      }
    });

    context.off("change", "#table_order_select")
    context.on("change", "#table_order_select", function() {
      var sunstone_setting = {TABLE_ORDER : $(this).val()};
      Sunstone.runAction("User.append_sunstone_setting_refresh", that.element.ID, sunstone_setting);
    });

    // Change language
    context.off("click", "#div_edit_language")
    context.on("click", "#div_edit_language", function() {
      $(".value_td_language", context).html('<select id="language_select">' +
         Locale.language_options +
       '</select>');

      if (that.element.TEMPLATE.SUNSTONE && that.element.TEMPLATE.SUNSTONE.LANG) {
        $('#language_select', context).val(that.element.TEMPLATE.SUNSTONE.LANG);
      }
    });

    context.off("change", "#language_select")
    context.on("change", "#language_select", function() {
      var sunstone_setting = {LANG : $(this).val()};
      Sunstone.runAction("User.append_sunstone_setting_refresh", that.element.ID, sunstone_setting);
    });

    // Change view
    context.off("click", "#div_edit_view")
    context.on("click", "#div_edit_view", function() {
      var options = '';
      $.each( config['available_views'], function(id, view) {
        options += '<option value="'+view+'">'+view+'</option>';
      });

      $(".value_td_view", context).html('<select id="view_select">' +
         options +
       '</select>');

      if (that.element.TEMPLATE.SUNSTONE && that.element.TEMPLATE.SUNSTONE.DEFAULT_VIEW) {
        $('#view_select', context).val(that.element.TEMPLATE.SUNSTONE.DEFAULT_VIEW);
      }
    });

    context.off("change", "#view_select")
    context.on("change", "#view_select", function() {
      var sunstone_setting = {DEFAULT_VIEW : $(this).val()};
      Sunstone.runAction("User.append_sunstone_setting_refresh", that.element.ID, sunstone_setting);
    });

    return false;
  }
});
