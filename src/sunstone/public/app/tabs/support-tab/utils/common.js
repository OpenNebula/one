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