define(function(require) {
  var Locale = require('utils/locale');
  var TAB_ID = 'infra-tab';

  var InfraTab = {
    tabId: TAB_ID,
    title: '<i class="fa fa-lg fa-fw fa-sitemap"></i>&emsp;' + Locale.tr("Infrastructure"),
    no_content: true
  }

  return InfraTab;
});
