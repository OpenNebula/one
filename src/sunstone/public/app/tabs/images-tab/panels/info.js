define(function(require) {
  /*
    DEPENDENCIES
   */
  
  var Locale = require('utils/locale');
  var Humanize = require('utils/humanize');
  var RenameTr = require('utils/panel/rename-tr');
  var TemplateTable = require('utils/panel/template-table');
  var PermissionsTable = require('utils/panel/permissions-table');
  var OpenNebulaImage = require('opennebula/image');
  var Config = require('sunstone-config');
  var Sunstone = require('sunstone');

  /*
    TEMPLATES
   */
  
  var TemplateInfo = require('hbs!./info/html');

  /*
    CONSTANTS
   */
  
  var TAB_ID = require('../tabId');
  var PANEL_ID = require('./info/panelId');
  var RESOURCE = "Image"

  /*
    CONSTRUCTOR
   */

  function Panel(info) {
    this.title = Locale.tr("Info");
    this.icon = "fa-info-circle";

    this.element = info[RESOURCE.toUpperCase()];

    return this;
  };

  Panel.PANEL_ID = PANEL_ID;
  Panel.prototype.html = _html;
  Panel.prototype.setup = _setup;

  return Panel;

  /*
    FUNCTION DEFINITIONS
   */

  function _html() {
    var renameTrHTML = RenameTr.html(RESOURCE, this.element.NAME);
    var templateTableHTML = TemplateTable.html(this.element.TEMPLATE, RESOURCE, Locale.tr("Attributes"));
    var permissionsTableHTML = PermissionsTable.html(TAB_ID, RESOURCE, this.element);
    var stateStr = Locale.tr(OpenNebulaImage.stateStr(this.element.STATE));
    var prettyRegTime = Humanize.prettyTime(this.element.REGTIME);
    var fsTypeStr = this.element.FS_TYPE != undefined ? this.element.FS_TYPE : '-';
    var sizeStr = Humanize.sizeFromMB(this.element.SIZE);
    var persistentStr = parseInt(this.element.PERSISTENT) ? Locale.tr("yes") : Locale.tr("no");
    var typeStr = Locale.tr(OpenNebulaImage.typeStr(this.element.TYPE));

    return TemplateInfo({
      'element': this.element,
      'renameTrHTML': renameTrHTML,
      'templateTableHTML': templateTableHTML,
      'permissionsTableHTML': permissionsTableHTML,
      'stateStr': stateStr,
      'prettyRegTime': prettyRegTime,
      'fsTypeStr': fsTypeStr,
      'persistentActionEnabled': Config.isTabActionEnabled('images-tab', "Image.persistent"),
      'persistentStr': persistentStr,
      'typeStr': typeStr,
      'sizeStr': sizeStr
    });
  }

  function _setup(context) {
    RenameTr.setup(RESOURCE, this.element.ID, context);
    TemplateTable.setup(this.element.TEMPLATE, RESOURCE, this.element.ID, context);
    PermissionsTable.setup(TAB_ID, RESOURCE, this.element, context);

    // Listener for edit link for type change
    var that = this;
    context.off("click", "#div_edit_chg_type_link")
    context.on("click", "#div_edit_chg_type_link", function() {
      $(".value_td_type", context).html(
                '<select id="chg_type_select">\
                      <option value="OS">OS</option>\
                      <option value="CDROM">CDROM</option>\
                      <option value="DATABLOCK">DATABLOCK</option>\
                  </select>');

      $('#chg_type_select', context).val(OpenNebulaImage.typeStr(that.element.TYPE));
    });

    context.off("change", "#chg_type_select");
    context.on("change", "#chg_type_select", function() {
      var new_value = $(this).val();
      Sunstone.runAction("Image.chtype", that.element.ID, new_value);
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
          Sunstone.runAction("Image.persistent", [that.element.ID]);
      else
          Sunstone.runAction("Image.nonpersistent", [that.element.ID]);

    });

    return false;
  }
});
