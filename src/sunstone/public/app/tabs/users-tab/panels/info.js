define(function(require) {
  /*
    DEPENDENCIES
   */

  var TemplateInfo = require('hbs!./info/html');
  var TemplateChgrpTr = require('hbs!./info/chgrp-tr');
  var ResourceSelect = require('utils/resource-select');
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

    // TODO
    //$(".resource-info-header", $("#users-tab")).html(this.element.NAME);

    var secondaryGroups;

    if (typeof this.element.GROUPS.ID == "object") {
      secondaryGroups = this.element.GROUPS.ID.join(",");
    } else {
      secondaryGroups = "-";
    }

    // TODO: simplify interface?
    var strippedTemplate = $.extend({}, this.element.TEMPLATE);
    delete strippedTemplate["SSH_PUBLIC_KEY"];
    delete strippedTemplate["LANG"];
    delete strippedTemplate["TABLE_ORDER"];
    delete strippedTemplate["DEFAULT_VIEW"];

    var templateTableHTML = TemplateTable.html(strippedTemplate, RESOURCE,
                                              Locale.tr("Attributes"));
    //====

    return TemplateInfo({
      'element': this.element,
      'groupTrHTML': groupTrHTML,
      'secondaryGroups': secondaryGroups,
      'templateTableHTML': templateTableHTML
    });
  }

  function _setup(context) {
    var that = this;

    $('.resource-info-header', '#' + TAB_ID).text(that.element.NAME);

    // Template update
    // TODO: simplify interface?
    var strippedTemplate = $.extend({}, this.element.TEMPLATE);
    delete strippedTemplate["SSH_PUBLIC_KEY"];
    delete strippedTemplate["LANG"];
    delete strippedTemplate["TABLE_ORDER"];
    delete strippedTemplate["DEFAULT_VIEW"];

    var hiddenValues = {};

    if (this.element.TEMPLATE.SSH_PUBLIC_KEY != undefined) {
      hiddenValues.SSH_PUBLIC_KEY = this.element.TEMPLATE.SSH_PUBLIC_KEY;
    }
    if (this.element.TEMPLATE.LANG != undefined) {
      hiddenValues.LANG = this.element.TEMPLATE.LANG;
    }
    if (this.element.TEMPLATE.TABLE_ORDER != undefined) {
      hiddenValues.TABLE_ORDER = this.element.TEMPLATE.TABLE_ORDER;
    }
    if (this.element.TEMPLATE.DEFAULT_VIEW != undefined) {
      hiddenValues.DEFAULT_VIEW = this.element.TEMPLATE.DEFAULT_VIEW;
    }

    TemplateTable.setup(strippedTemplate, RESOURCE, this.element.ID, context, hiddenValues);
    //===

    // Chgrp
    context.off("click", "#div_edit_chg_group_link");
    context.on("click", "#div_edit_chg_group_link", function() {
      ResourceSelect.insert("#value_td_group", context, "Group", that.element.GID, false);
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
      var template_str = 'SSH_PUBLIC_KEY = "'+$(this).val()+'"';

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

      if (that.element.TEMPLATE.TABLE_ORDER) {
        $('#table_order_select', context).val(that.element.TEMPLATE.TABLE_ORDER);
      }
    });

    context.off("change", "#table_order_select")
    context.on("change", "#table_order_select", function() {
      var template_str = 'TABLE_ORDER = "'+$(this).val()+'"';

      Sunstone.runAction("User.append_template", that.element.ID, template_str);
    });

    // Change language
    context.off("click", "#div_edit_language")
    context.on("click", "#div_edit_language", function() {
      $(".value_td_language", context).html('<select id="language_select">' +
         Locale.language_options +
       '</select>');

      if (that.element.TEMPLATE.LANG) {
        $('#language_select', context).val(that.element.TEMPLATE.LANG);
      }
    });

    context.off("change", "#language_select")
    context.on("change", "#language_select", function() {
      var template_str = 'LANG = "'+$(this).val()+'"';

      Sunstone.runAction("User.append_template_refresh", that.element.ID, template_str);
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

      if (that.element.TEMPLATE.DEFAULT_VIEW) {
        $('#view_select', context).val(that.element.TEMPLATE.DEFAULT_VIEW);
      }
    });

    context.off("change", "#view_select")
    context.on("change", "#view_select", function() {
      var template_str = 'DEFAULT_VIEW = "'+$(this).val()+'"';

      Sunstone.runAction("User.append_template_refresh", that.element.ID, template_str);
    });

    return false;
  }
});
