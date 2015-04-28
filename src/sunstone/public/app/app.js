define(function(require) {
  require('jquery');

  var Sunstone = require('sunstone');

  var _tabs = [
    require('tabs/infra-tab'),
    require('tabs/zones-tab'),
    require('tabs/datastores-tab'),
    require('tabs/vresources-tab'),
    require('tabs/images-tab')
  ];

  var DialogConfirm = require('utils/dialogs/confirm');
  var DialogConfirmWithSelect = require('utils/dialogs/confirm-with-select');

  var _commonDialogs = [
    DialogConfirm,
    DialogConfirmWithSelect
  ]

  Sunstone.addDialogs(_commonDialogs);

  $.each(_tabs, function(index, tab) {
    Sunstone.addMainTab(tab);
  });

  $(document).ready(function() {
    Sunstone.insertTabs();
    Sunstone.insertDialog(DialogConfirm);
    Sunstone.insertDialog(DialogConfirmWithSelect);
  });
});
