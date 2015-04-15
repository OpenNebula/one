define(function(require) {
  var Locale = require('utils/locale');

  var infraTab = {
    title: '<i class="fa fa-lg fa-fw fa-sitemap"></i>&emsp;' + Locale.tr("Infrastructure"),
    no_content: true
  }

  return {
    'definition': infraTab
  }
});
