define(function(require) {
  var Locale = require('utils/locale');
  var TAB_ID = 'system-tab';

  var Tab = {
    tabId: TAB_ID,
    title: '<i class="fa fa-lg fa-fw fa-cogs"></i>&emsp;'+Locale.tr("System"),
    no_content: true
  }

  return Tab;
});
