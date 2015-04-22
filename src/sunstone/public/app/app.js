define(function(require) {
  require('jquery');

  var Sunstone = require('sunstone');

  var _tabs = [
    require('tabs/infra-tab'),
    require('tabs/zones-tab')
  ];

  $.each(_tabs, function(index, tab) {
    Sunstone.addMainTab(tab);
  });

  $(document).ready(function() {
    Sunstone.insertTabs();
  });
});
