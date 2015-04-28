define(function(require) {
  var Locale = require('utils/locale');
  var TAB_ID = 'vresources-tab';

  var VResourcesTab = {
    tabId: TAB_ID,
    title: '<i class="fa fa-lg fa-fw fa-cloud"></i>&emsp;' + Locale.tr("Virtual Resources"),
    no_content: true
  }

  return VResourcesTab;
});
