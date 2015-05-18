define(function(require) {
  require('jquery');

  var Sunstone = require('sunstone');

  var _tabs = [
    require('tabs/infra-tab'),
    require('tabs/zones-tab'),
    require('tabs/datastores-tab'),
    require('tabs/hosts-tab'),
    require('tabs/vresources-tab'),
    require('tabs/images-tab'),
    require('tabs/vnets-tab')
  ];

  var _commonDialogs = [
    require('utils/dialogs/confirm'),
    require('utils/dialogs/confirm-with-select')
  ]

  Sunstone.addDialogs(_commonDialogs);

  $.each(_tabs, function(index, tab) {
    Sunstone.addMainTab(tab);
  });

  $(document).ready(function() {
    Sunstone.insertTabs();
  });
});
