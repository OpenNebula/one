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

  var Locale = require("utils/locale");
  var Notifier = require('utils/notifier');
  var OpenNebula = require('opennebula');
  var Sunstone = require("sunstone");
  var TemplateTable = require("utils/panel/template-table");
  var UserCreation = require("tabs/users-tab/utils/user-creation");
  
  /*
    TEMPLATES
   */

  var TemplateInfo = require("hbs!./info/html");

  /*
    CONSTANTS
   */

  var RESOURCE = "User";
  var XML_ROOT = "USER";
  var REGEX_HIDDEN_ATTRS = /^(|SSH_PUBLIC_KEY|SSH_PRIVATE_KEY|SSH_PASSPHRASE|SUNSTONE|FIREEDGE)$/

  /*
    CONSTRUCTOR
   */

  function Panel(info) {
    this.title = Locale.tr("Info");
    this.icon = "fa-info-circle";

    this.element = info[XML_ROOT];
    this.userCreation = new UserCreation(
      this.tabId,
      { name: false, password: false, group_select: false }
    );

    return this;
  }

  Panel.prototype.html = _html;
  Panel.prototype.setup = _setup;

  return Panel;

  /*
    FUNCTION DEFINITIONS
   */

  function _html() {
    var attributes = TemplateTable.getTemplatesAttributes(this.element.TEMPLATE, {
      regexHidden: REGEX_HIDDEN_ATTRS
    })

    var templateTableHTML = TemplateTable.html(attributes.general, RESOURCE, Locale.tr("Attributes"));

    return TemplateInfo({
      "element": this.element,
      "enabled": this.element.ENABLED == 1 ? Locale.tr("Yes") : Locale.tr("No"),
      "sunstone_template": this.element.TEMPLATE.SUNSTONE || {},
      "templateTableHTML": templateTableHTML,
      "tabId": this.tabId,
      "userCreationHTML": this.userCreation.html()
    });
  }

  function _setup(context) {
    var that = this;

    this.userCreation.setup(context);

    var attributes = TemplateTable.getTemplatesAttributes(this.element.TEMPLATE, {
      regexHidden: REGEX_HIDDEN_ATTRS
    })

    TemplateTable.setup(attributes.general, RESOURCE, this.element.ID, context, attributes.hidden);

    // Change table Order
    context.off("click", "#div_edit_table_order");
    context.on("click", "#div_edit_table_order", function() {
      $(".value_td_table_order", context).html("<select id=\"table_order_select\">" +
         "<option> </option>" +
         "<option value=\"asc\">" + Locale.tr("ascending") + "</option>" +
         "<option value=\"desc\">" + Locale.tr("descending") + "</option>" +
       "</select>");

      if (that.element.TEMPLATE.SUNSTONE && that.element.TEMPLATE.SUNSTONE.TABLE_ORDER) {
        $("#table_order_select", context).val(that.element.TEMPLATE.SUNSTONE.TABLE_ORDER);
      }
    });

    context.off("change", "#table_order_select");
    context.on("change", "#table_order_select", function() {
      var sunstone_setting = {TABLE_ORDER : $(this).val()};
      if (sunstone_setting.TABLE_ORDER !== ""){
        Sunstone.runAction("User.append_sunstone_setting_refresh", that.element.ID, sunstone_setting);
      }
    });

    // Change language
    context.off("click", "#div_edit_language");
    context.on("click", "#div_edit_language", function() {
      $(".value_td_language", context).html("<select id=\"language_select\">" +
        "<option> </option>" +
        Locale.language_options +
       "</select>");

      if (that.element.TEMPLATE.SUNSTONE && that.element.TEMPLATE.SUNSTONE.LANG) {
        $("#language_select", context).val(that.element.TEMPLATE.SUNSTONE.LANG);
      }
    });

    context.off("change", "#language_select");
    context.on("change", "#language_select", function() {
      var sunstone_setting = {LANG : $(this).val()};
      if (sunstone_setting.LANG !== ""){
        Sunstone.runAction("User.append_sunstone_setting_refresh", that.element.ID, sunstone_setting);
      }
    });

    // Change view
    context.off("click", "#div_edit_view");
    context.on("click", "#div_edit_view", function() {
      var options = "<option> </option>";
      $.each( config["available_views"], function(id, view) {
        options += "<option value=\""+view+"\">"+view+"</option>";
      });

      $(".value_td_view", context).html("<select id=\"view_select\">" +
         options +
       "</select>");

      if (that.element.TEMPLATE.SUNSTONE && that.element.TEMPLATE.SUNSTONE.DEFAULT_VIEW) {
        $("#view_select", context).val(that.element.TEMPLATE.SUNSTONE.DEFAULT_VIEW);
      }
    });

    context.off("change", "#view_select");
    context.on("change", "#view_select", function() {
      var sunstone_setting = {DEFAULT_VIEW : $(this).val()};
      if (sunstone_setting.DEFAULT_VIEW !== ""){
        Sunstone.runAction("User.append_sunstone_setting_refresh", that.element.ID, sunstone_setting);
      }
    });

    // Change default zone
    var default_zone_input = "default_zone_input";
    context.off("click", "#div_edit_zone");
    context.on("click", "#div_edit_zone", function() {
      var options = "<option value=''> - </option>";
      OpenNebula.Zone.list({
        timeout: true,
        success: function (request, obj_list) {
          $.each(obj_list, function() {
            if(this && this.ZONE && this.ZONE.TEMPLATE && this.ZONE.TEMPLATE.ENDPOINT && this.ZONE.NAME){
              options += "<option value=\""+this.ZONE.TEMPLATE.ENDPOINT+"\">"+this.ZONE.NAME+"</option>";
            }
          });
         $(".value_td_zone", context).html("<select id='"+default_zone_input+"'>" +
           options +
         "</select>");

         if (that.element.TEMPLATE.SUNSTONE && that.element.TEMPLATE.SUNSTONE.DEFAULT_ZONE_ENDPOINT) {
           $("#"+default_zone_input, context).val(that.element.TEMPLATE.SUNSTONE.DEFAULT_ZONE_ENDPOINT)
         }
        },
        error: Notifier.onError
      });
    });

    context.off("change", "#"+default_zone_input);
    context.on("change", "#"+default_zone_input, function() {
      var sunstone_setting = {DEFAULT_ZONE_ENDPOINT : $(this).val()};
        Sunstone.runAction("User.append_sunstone_setting", that.element.ID, sunstone_setting);
    });

    return false;
  }
});
