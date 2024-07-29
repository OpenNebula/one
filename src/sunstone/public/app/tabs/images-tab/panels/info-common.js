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

  var Config = require('sunstone-config');
  var Humanize = require('utils/humanize');
  var Locale = require('utils/locale');
  var OpenNebulaImage = require('opennebula/image');
  var PermissionsTable = require('utils/panel/permissions-table');
  var RenameTr = require('utils/panel/rename-tr');
  var Sunstone = require('sunstone');
  var TemplateTable = require('utils/panel/template-table');

  /*
    TEMPLATES
   */

  var TemplateInfo = require('hbs!./info/html');

  /*
    CONSTRUCTOR
   */

  function Panel(info) {
    this.title = Locale.tr("Info");
    this.icon = "fa-info-circle";

    this.element = info[this.xmlRoot];

    return this;
  };

  Panel.prototype.html = _html;
  Panel.prototype.setup = _setup;

  return Panel;

  /*
    FUNCTION DEFINITIONS
   */

  function _html() {
    var renameTrHTML = RenameTr.html(this.tabId, this.resource, this.element.NAME);
    var templateTableHTML = TemplateTable.html(this.element.TEMPLATE, this.resource, Locale.tr("Attributes"));
    var permissionsTableHTML = PermissionsTable.html(this.tabId, this.resource, this.element);
    var prettyRegTime = Humanize.prettyTime(this.element.REGTIME);
    var fsTypeStr = this.element.FS != undefined ? this.element.FS : '-';
    var sizeStr = Humanize.sizeFromMB(this.element.SIZE);
    var persistentStr = parseInt(this.element.PERSISTENT) ? Locale.tr("yes") : Locale.tr("no");

    return TemplateInfo({
      'element': this.element,
      'renameTrHTML': renameTrHTML,
      'templateTableHTML': templateTableHTML,
      'permissionsTableHTML': permissionsTableHTML,
      'stateStr': OpenNebulaImage.stateStr(this.element.STATE),
      'prettyRegTime': prettyRegTime,
      'fsTypeStr': fsTypeStr,
      'persistentActionEnabled': Config.isTabActionEnabled('images-tab', "Image.persistent"),
      'persistentStr': persistentStr,
      'typeStr': OpenNebulaImage.typeStr(this.element.TYPE),
      'sizeStr': sizeStr,
      'images': (this.resource == "Image")
    });
  }

  function _setup(context) {
    RenameTr.setup(this.tabId, this.resource, this.element.ID, context);
    TemplateTable.setup(this.element.TEMPLATE, this.resource, this.element.ID, context);
    PermissionsTable.setup(this.tabId, this.resource, this.element, context);

    // Listener for edit link for type change
    var that = this;
    context.off("click", "#div_edit_chg_type_link")
    context.on("click", "#div_edit_chg_type_link", function() {
      if (that.resource == "Image"){
        $(".value_td_type", context).html(
                  '<select id="chg_type_select">\
                        <option value="OS">'+Locale.tr("OS")+'</option>\
                        <option value="CDROM">'+Locale.tr("CDROM")+'</option>\
                        <option value="DATABLOCK">'+Locale.tr("DATABLOCK")+'</option>\
                    </select>');
      } else {
        $(".value_td_type", context).html(
                  '<select id="chg_type_select">\
                        <option value="KERNEL">'+Locale.tr("KERNEL")+'</option>\
                        <option value="RAMDISK">'+Locale.tr("RAMDISK")+'</option>\
                        <option value="CONTEXT">'+Locale.tr("CONTEXT")+'</option>\
                    </select>');
      }

      var currentVal = "";
      switch(parseInt(that.element.TYPE)){
        case OpenNebulaImage.TYPES.OS:
          currentVal = "OS";
          break;
        case OpenNebulaImage.TYPES.CDROM:
          currentVal = "CDROM";
          break;
        case OpenNebulaImage.TYPES.DATABLOCK:
          currentVal = "DATABLOCK";
          break;
        case OpenNebulaImage.TYPES.KERNEL:
          currentVal = "KERNEL";
          break;
        case OpenNebulaImage.TYPES.RAMDISK:
          currentVal = "RAMDISK";
          break;
        case OpenNebulaImage.TYPES.CONTEXT:
          currentVal = "CONTEXT";
          break;
      }

      $('#chg_type_select', context).val(currentVal);
    });

    context.off("change", "#chg_type_select");
    context.on("change", "#chg_type_select", function() {
      var new_value = $(this).val();
      Sunstone.runAction(that.resource+".chtype", that.element.ID, new_value);
    });

    // Listener for edit link for persistency change
    context.off("click", "#div_edit_persistency")
    context.on("click", "#div_edit_persistency", function() {
      $(".value_td_persistency", context).html(
                '<select id="persistency_select">\
                      <option value="yes">' + Locale.tr("yes") + '</option>\
                      <option value="no">' + Locale.tr("no") + '</option>\
                  </select>');

      $('#persistency_select', context).val(parseInt(that.element.PERSISTENT) ? "yes" : "no");
    });

    context.off("change", "#persistency_select")
    context.on("change", "#persistency_select", function() {
      var new_value = $(this).val();

      if (new_value == "yes")
          Sunstone.runAction(that.resource+".persistent", [that.element.ID]);
      else
          Sunstone.runAction(that.resource+".nonpersistent", [that.element.ID]);

    });

    return false;
  }
});
