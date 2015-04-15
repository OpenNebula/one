define(function(require) {
  require('jquery');

  var Sunstone = require('sunstone');
  require('tabs/infra-tab');
  require('tabs/zones-tab');

  var tabs = [
    'infra-tab',
    'zones-tab'
  ];

  var tab;
  $.each(tabs, function(index, tabName) {
    tab = require('tabs/' + tabName);
    Sunstone.addMainTab(tabName, tab.definition);
  });

  $(document).ready(function() {
    Sunstone.insertTabs();
  });
});
