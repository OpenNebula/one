define(function(require) {
  var Locale = require('utils/locale');
  var Buttons = require('./zones-tab/buttons')
  var TableTemplate = require('hbs!./zones-tab/table')

  var zonesTab = {
    title: Locale.tr("Zones"),
    resource: 'Zone',
    buttons: Buttons,
    tabClass: "subTab",
    parentTab: "infra-tab",
    searchInput: '<input id="zone_search" type="search" placeholder="' + Locale.tr("Search") + '" />',
    listHeader: '<i class="fa fa-fw fa-files-o"></i>&emsp;' + Locale.tr("Zones"),
    infoHeader: '<i class="fa fa-fw fa-files-o"></i>&emsp;' + Locale.tr("Zone"),
    subheader: '<span/> <small></small>&emsp;',
    table: TableTemplate()
  };

  return {
    'definition': zonesTab
  }
});
