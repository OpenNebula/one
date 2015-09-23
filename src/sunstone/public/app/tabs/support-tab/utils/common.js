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
    Common functions for the support tab
   */

  var Sunstone = require('sunstone');

  var TAB_ID = require('../tabId');

  var support_interval_function;

  function _show_support_connect() {
    $(".support_info").hide();
    $("#"+Sunstone.getDataTable(TAB_ID).dataTableId+"Container", "#"+TAB_ID).hide();
    $(".support_connect").show();
    $(".actions_row", "#"+TAB_ID).hide();
  }

  function _show_support_list() {
    $(".support_info").show();
    $(".support_connect").hide();
    $(".actions_row", "#"+TAB_ID).show();
    $("#"+Sunstone.getDataTable(TAB_ID).dataTableId+"Container", "#"+TAB_ID).show();
  }

  function _startIntervalRefresh() {
    Sunstone.runAction('Support.list');

    support_interval_function = setInterval(function(){
      Sunstone.runAction('Support.list');
    }, Sunstone.TOP_INTERVAL);
  }

  function _stopIntervalRefresh() {
    clearInterval(support_interval_function);
  }

  return {
    'showSupportConnect': _show_support_connect,
    'showSupportList': _show_support_list,
    'startIntervalRefresh': _startIntervalRefresh,
    'stopIntervalRefresh': _stopIntervalRefresh,
  };
});
