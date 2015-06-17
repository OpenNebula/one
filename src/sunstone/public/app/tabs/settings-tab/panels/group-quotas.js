define(function(require) {
  /*
    DEPENDENCIES
   */

  var Locale = require('utils/locale');
  var Config = require('sunstone-config');
  var QuotaDefaults = require('utils/quotas/quota-defaults');
  var QuotaWidgets = require('utils/quotas/quota-widgets');
  var OpenNebulaGroup = require('opennebula/group');
  var Sunstone = require('sunstone');

  /*
    CONSTANTS
   */

  var TAB_ID = require('../tabId');
  var PANEL_ID = require('./group-quotas/panelId');
  var RESOURCE = "User";
  var XML_ROOT = "USER";

  var GROUP_TAB_ID = require('tabs/groups-tab/tabId');

  /*
    CONSTRUCTOR
   */

  function Panel(info, tabId) {
    this.tabId = tabId || TAB_ID;
    this.title = Locale.tr("Group Quotas");
    this.icon = "fa-align-left";

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
    return '<div class="row">\
              <div class="large-6 columns">\
                <label>' + Locale.tr("Select group") + ':\
                  <select id="quota_group_sel">\
                  </select>\
                </label>\
              </div>\
            </div>\
            <div id="group_quotasTabBody" class="row">\
            </div>';
  }

  function _setup(context) {

    var groups = this.element.GROUPS.ID;

    if (!$.isArray(groups)){
      groups = [groups];
    }

    var groupDropdownOptions = "";
    $.each(groups, function(){
      groupDropdownOptions +=
      '<option elem_id="'+this+
      '" value="'+this+'">'+
      Sunstone.getDataTable(GROUP_TAB_ID).getName(this)+' (id:'+this+')</option>';
    });

    // TODO bug Sunstone.getDataTable(GROUP_TAB_ID) fails for user.yaml, groups-tab does not exist

    $('select#quota_group_sel', context).html(groupDropdownOptions);

    $("#quota_group_sel", context).off("change");
    $("#quota_group_sel", context).on("change", function() {
        var value_str = $('select#quota_group_sel').val();
        if(value_str!="")
        {
          fillGroupQuotas(value_str, context);
        }
    });

    fillGroupQuotas('-1', context);
    
    return false;
  }

  function fillGroupQuotas(group_id, context){
    OpenNebulaGroup.show({
      data : {
        id: group_id
      },
      success: function(request,group_json){
        var info = group_json.GROUP;

        var quotas_tab_html = QuotaWidgets.initQuotasPanel(
          info,
          QuotaDefaults.getDefaultQuotas("Group"),
          false);

        $("#group_quotasTabBody", context).html(quotas_tab_html);

        QuotaWidgets.setupQuotasPanel(
          info,
          $("#group_quotasTabBody", context),
          false,
          "Group");

        $("select#quota_group_sel", context).val(info.ID);
      }
    });
  }
});
