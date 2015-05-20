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

    if(typeof this.element.GROUPS.ID == "object"){
      secondaryGroups = this.element.GROUPS.ID.join(",");
    } else {
      secondaryGroups = "-";
    }

    // TODO: simplify interface?
    var strippedTemplate = $.extend({}, this.element.TEMPLATE);
    delete strippedTemplate["SSH_PUBLIC_KEY"];

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

    // Template update
    // TODO: simplify interface?
    var strippedTemplate = $.extend({}, this.element.TEMPLATE);
    delete strippedTemplate["SSH_PUBLIC_KEY"];

    var hiddenValues = {};

    if (this.element.TEMPLATE.SSH_PUBLIC_KEY != undefined){
        hiddenValues.SSH_PUBLIC_KEY = this.element.TEMPLATE.SSH_PUBLIC_KEY;
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
    context.on("click", ".user_ssh_public_key_edit", function(){
      $("#user_ssh_public_key_text", context).hide();
      $("#user_ssh_public_key_textarea", context).show().focus();
    });

    context.off("change", "#user_ssh_public_key_textarea");
    context.on("change", "#user_ssh_public_key_textarea", function(){
      var user_id = that.element.ID;

      // TODO: use update --append instead of a show + update

      OpenNebulaUser.show({
        data : {
          id: user_id
        },
        success: function(request,user_json){
          var template = that.element.TEMPLATE;

          template["SSH_PUBLIC_KEY"] = $("#user_ssh_public_key_textarea", context).val();

          template_str = "";
          $.each(template,function(key,value){
            template_str += (key + '=' + '"' + value + '"\n');
          });

          Sunstone.runAction("User.update_template", user_id, template_str);
        }
      });
    });

    context.off("focusout", "#user_ssh_public_key_textarea");
    context.on("focusout", "#user_ssh_public_key_textarea", function(){
      $("#user_ssh_public_key_text", context).show();
      $("#user_ssh_public_key_textarea", context).hide();
    });

    return false;
  }
});
