define(function(require) {
  var TemplateInfo = require('hbs!./info/html');
  var Locale = require('utils/locale');
  var Humanize = require('utils/humanize');
  var RenameTr = require('utils/panel/rename-tr');
  var TemplateTable = require('utils/panel/template-table');
  var PermissionsTable = require('utils/panel/permissions-table');
  var ClusterTr = require('utils/panel/cluster-tr');
  var OpenNebulaDatastore = require('opennebula/datastore');
  var DatastoreCapacityBar = require('../utils/datastore-capacity-bar');

  var TAB_ID = require('../tabId');
  var PANEL_ID = require('./info/panelId');
  var RESOURCE = "Datastore"

  var _html = function(info) {
    var element = _element(info);
    var renameTrHTML = RenameTr.html(RESOURCE, element.NAME);
    var clusterTrHTML = ClusterTr.html(element.CLUSTER);
    var templateTableHTML = TemplateTable.html(
                                      element.TEMPLATE, RESOURCE, 
                                      Locale.tr("Attributes"));
    var permissionsTableHTML = PermissionsTable.html(TAB_ID, RESOURCE, element);
    var capacityBar = DatastoreCapacityBar.html(element);
    var stateStr = Locale.tr(OpenNebulaDatastore.stateStr(element.STATE));

    var limitStr = '-';
    if (element.TEMPLATE.SHARED == "NO" || element.TEMPLATE.LIMIT_MB != undefined) {
      limitStr = Humanize.sizeFromMB(element.TEMPLATE.LIMIT_MB)
    }

    return TemplateInfo({
      'element': element,
      'renameTrHTML': renameTrHTML,
      'clusterTrHTML': clusterTrHTML,
      'templateTableHTML': templateTableHTML,
      'permissionsTableHTML': permissionsTableHTML,
      'capacityBar': capacityBar,
      'stateStr': stateStr,
      'limitStr': limitStr
    });
  }

  var _setup = function(info, context) {
    var element = _element(info);
    RenameTr.setup(RESOURCE, element.ID, context);
    ClusterTr.setup(RESOURCE, element.ID, element.CLUSTER_ID, context);
    TemplateTable.setup(element.TEMPLATE, RESOURCE, element.ID, context);
    PermissionsTable.setup(TAB_ID, RESOURCE, element, context);
    return false;
  }

  /*
    Returns the object representing the resource, access the root element
   */
  var _element = function(info) {
    return info[RESOURCE.toUpperCase()]
  }

  var InfoPanel = {
    title : Locale.tr("Info"),
    icon: "fa-info-circle",
    panelId: PANEL_ID,
    html : _html,
    setup: _setup
  }

  return InfoPanel;
});
