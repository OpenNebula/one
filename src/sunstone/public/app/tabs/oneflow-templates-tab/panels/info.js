define(function(require) {
  /*
    DEPENDENCIES
   */

  var Locale = require('utils/locale');
  var PermissionsTable = require('utils/panel/permissions-table');
  var TemplateUtils = require('utils/template-utils');

  /*
    TEMPLATES
   */

  var TemplateHTML = require('hbs!./info/html');

  /*
    CONSTANTS
   */

  var TAB_ID = require('../tabId');
  var PANEL_ID = require('./info/panelId');
  var XML_ROOT = "DOCUMENT";
  var RESOURCE = "ServiceTemplate";

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
    var that = this;

    var permissionsTableHTML = PermissionsTable.html(TAB_ID, RESOURCE, this.element);

    var customAttrs = [];

    if ( ! $.isEmptyObject( this.element.TEMPLATE.BODY['custom_attrs'] ) ) {
      $.each(this.element.TEMPLATE.BODY['custom_attrs'], function(key, attr){
        var parts = attr.split("|");
        // 0 mandatory; 1 type; 2 desc;

        var roles_using_net = [];

        switch (parts[1]) {
          case "vnet_id":
            $.each(that.element.TEMPLATE.BODY.roles, function(index, value){
              if (value.vm_template_contents){
                var reg = new RegExp("\\$"+TemplateUtils.htmlDecode(key)+"\\b");

                if(reg.exec(value.vm_template_contents) != null){
                  roles_using_net.push(value.name);
                }
              }
            });

            break;
        }

        customAttrs.push({
          "name": key,
          "mandatory": parts[0],
          "type": parts[1],
          "description": parts[2],
          "roles": roles_using_net.join(", ")
        });
      });
    }

    return TemplateHTML({
      'element': this.element,
      'permissionsTableHTML': permissionsTableHTML,
      'customAttrs': customAttrs
    });
  }

  function _setup(context) {
    $('.resource-info-header', '#' + TAB_ID).text(this.element.NAME);
    PermissionsTable.setup(TAB_ID, RESOURCE, this.element, context);
  }
});
