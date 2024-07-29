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

  var Locale = require('utils/locale');
  var Config = require('sunstone-config');
  var QuotaDefaults = require('utils/quotas/quota-defaults');
  var QuotaWidgets = require('utils/quotas/quota-widgets');
  var OpenNebulaGroup = require('opennebula/group');

  /*
    CONSTANTS
   */

  var TAB_ID = require('../tabId');
  var PANEL_ID = require('./group-quotas/panelId');
  var RESOURCE = "User";
  var XML_ROOT = "USER";

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
                <label>' + Locale.tr("Select group") + '\
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

    if (!Array.isArray(groups)){
      groups = [groups];
    }

    var groupDropdownOptions = "";
    $.each(groups, function(){
      groupDropdownOptions +=
      '<option elem_id="'+this+
      '" value="'+this+'">'+
      OpenNebulaGroup.getName(this)+' (id:'+this+')</option>';
    });

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
