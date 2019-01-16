/* -------------------------------------------------------------------------- */
/* Copyright 2002-2019, OpenNebula Project, OpenNebula Systems                */
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

  var Locale = require("utils/locale");
  var TemplateUtils = require("utils/template-utils");
  var Humanize = require("utils/humanize");

  function _fromJSONtoActionsTable(actions_array) {
    var str = "";

    if (!actions_array) {
        return "";
    }

    if (!$.isArray(actions_array)) {
        var tmp_array = new Array();
        tmp_array[0]  = actions_array;
        actions_array = tmp_array;
    }

    if (!actions_array.length) {
        return "";
    }

    $.each(actions_array, function(index, scheduling_action) {
        str += fromJSONtoActionRow(scheduling_action);
    });

    return str;
  }

  function fromJSONtoActionRow(scheduling_action) {
    var time_str = Humanize.prettyTime(scheduling_action.TIME);

    var str = "";
    str += "<tr class=\"tr_action\">\
        <td class=\"action_row\">" + TemplateUtils.htmlEncode(scheduling_action.ACTION) + "</td>\
        <td nowrap class=\"time_row\">" + time_str + "</td>\
        <td>\
          <div>\
            <a id=\"minus\" class=\"remove_action_x\" href=\"#\"><i class=\"fas fa-trash-alt\"/></a>\
          </div>\
        </td>\
      </tr>";

    return str;
  }

  function _convertDate(date_string){
    date_string = date_string.split("/");
    return date_string[2] + "-" + date_string[1] + "-" + date_string[0];
  }

  return {
    "fromJSONtoActionsTable": _fromJSONtoActionsTable,
    "convertDate": _convertDate
  };
});
