define(function(require) {
  var Locale = require('utils/locale');
  var Config = require('sunstone-config');
  var Sunstone = require('sunstone');
  var Notifier = require('utils/notifier');
  var OpenNebulaVM = require('opennebula/vm');
  var Accounting = require('utils/accounting');

  var TemplateDashboard = require('hbs!./dashboard-tab/html');

  var _activeWidgets = [];
  var _widgets = {
    'storage': {
      'html': require('hbs!./dashboard-tab/storage'),
      'onShow': function() {
        Sunstone.runAction("Image.list");
      }
    },
    'users': {
      'html': require('hbs!./dashboard-tab/users'),
      'onShow': function() {
        Sunstone.runAction("User.list");
        Sunstone.runAction("Group.list");

        var end_time = -1; // today
        var start_time =  Math.floor(new Date().getTime() / 1000);
        start_time = start_time - 604800; // 604800 = 7 days = 7*24*60*60

        var options = {
          "start_time": start_time,
          "end_time": end_time
        }

        var no_table = true;

        OpenNebulaVM.accounting({
          success: function(req, response) {
            Accounting.fillAccounting($("#dashboard_vdc_user_accounting"), req, response, no_table);
          },
          error: Notifier.onError,
          data: options
        });
      }
    },
    'network': {
      'html': require('hbs!./dashboard-tab/network'),
      'onShow': function() {
        Sunstone.runAction("Network.list");
      }
    },
    'hosts': {
      'html': require('hbs!./dashboard-tab/hosts'),
      'onShow': function() {
        Sunstone.runAction("Host.list");
      }
    },
    'vms': {
      'html': require('hbs!./dashboard-tab/vms'),
      'onShow': function() {
        Sunstone.runAction("VM.list");

        var end_time = -1; // today
        var start_time =  Math.floor(new Date().getTime() / 1000);
        start_time = start_time - 604800; // 604800 = 7 days = 7*24*60*60

        var options = {
          "start_time": start_time,
          "end_time": end_time
        }

        var no_table = true;

        OpenNebulaVM.accounting({
          success: function(req, response) {
            Accounting.fillAccounting($("#dashboard_vm_accounting"), req, response, no_table);
          },
          error: Notifier.onError,
          data: options
        });
      }
    },
    'user_quotas': {
      'html': require('hbs!./dashboard-tab/user-quotas'),
    },
    'group_quotas': {
      'html': require('hbs!./dashboard-tab/group-quotas'),
    },
    'accounting': {
      'html': require('hbs!./dashboard-tab/accounting'),
    }
  }

  var _buttons = {
    "Dashboard.refresh" : {
      type: "action",
      layout: "refresh",
      alwaysActive: true
    }
  };

  var _actions = {
    "Dashboard.refresh" : {
      type: "custom",
      call: _onShow
    },
  }

  var TAB_ID = require('./dashboard-tab/tabId');

  var Tab = {
    tabId: TAB_ID,
    resource: 'Dashboard',
    title: '<i class="fa fa-lg fa-fw fa-tachometer"></i>&emsp;' + Locale.tr("Dashboard"),
    showOnTopMenu: false,
    listHeader: '<i class="fa fa-lg fa-fw fa-tachometer"></i>&emsp;' + Locale.tr("Dashboard"),
    buttons: _buttons,
    actions: _actions,
    content: _html()
  };

  return Tab;

  function _html() {
    var widgetsTemplates = {
      'threePerRow': [],
      'twoPerRow': [],
      'onePerRow': [],
      'oneFooter': []
    }

    $.each(Config.dashboardWidgets('widgets_three_per_row'), function(id, widget) {
      _activeWidgets.push(widget);
      widgetsTemplates['threePerRow'].push(_widgets[widget].html());
    })

    $.each(Config.dashboardWidgets('widgets_two_per_row'), function(id, widget) {
      _activeWidgets.push(widget);
      widgetsTemplates['twoPerRow'].push(_widgets[widget].html());
    })

    $.each(Config.dashboardWidgets('widgets_one_per_row'), function(id, widget) {
      _activeWidgets.push(widget);
      widgetsTemplates['onePerRow'].push(_widgets[widget].html());
    })

    $.each(Config.dashboardWidgets('widgets_one_footer'), function(id, widget) {
      _activeWidgets.push(widget);
      widgetsTemplates['oneFooter'].push(_widgets[widget].html());
    });

    return TemplateDashboard(widgetsTemplates);
  }

  function _onShow() {
    $.each(_activeWidgets, function(id, widgetId) {
      if (_widgets[widgetId].onShow) {
        _widgets[widgetId].onShow();
      }
    });
  }
});
