define(function(require) {
  var Locale = require('utils/locale');
  var OpenNebulaUser = require('opennebula/user');
  var Sunstone = require('sunstone');

  var TAB_ID = require('./settings-tab/tabId');
  var USERS_TAB_ID = require('tabs/users-tab/tabId');

  var _buttons = {
    "Settings.refresh" : {
      type: "action",
      layout: "refresh",
      alwaysActive: true
    }
  };

  var _actions = {
    "Settings.refresh" : {
      type: "custom",
      call: _onShow
    },
  };

  var _dialogs = [
  ];

  var _panels = [
    require('tabs/users-tab/panels/info'),
    require('tabs/users-tab/panels/quotas'),
    require('tabs/settings-tab/panels/group-quotas'),
    require('tabs/users-tab/panels/accounting'),
    require('tabs/users-tab/panels/showback')
  ];

  var _formPanels = [
    require('./acls-tab/form-panels/create')
  ];

  var Tab = {
    tabId: TAB_ID,
    title: '<i class="fa fa-lg fa-fw fa-cog"></i>&emsp;' + Locale.tr("Settings"),
    listHeader: '<i class="fa fa-cog"></i>&emsp;' + Locale.tr("Settings"),
    resource: 'Settings',
    actions: _actions,
    content: '<span class="fa-stack fa-2x" style="color: #dfdfdf">' +
      '<i class="fa fa-cloud fa-stack-2x"></i>' +
      '<i class="fa  fa-spinner fa-spin fa-stack-1x fa-inverse"></i>' +
    '</span>',
    dialogs: _dialogs,
    panels: _panels,
  };

  return Tab;

  function _onShow() {
    OpenNebulaUser.show({
      data : {
        id: -1
      },
      success: function(request, user_json) {
        Sunstone.insertPanels(TAB_ID, user_json, TAB_ID, $(".right-list", $("#" + TAB_ID)))
      }
    });
  }
});
