define(function(require) {
  require('jquery');

  var DASHBOARD_TAB_ID = require('tabs/dashboard-tab/tabId');
  var Sunstone = require('sunstone');

  var _tabs = [
    require('tabs/dashboard-tab'),
    require('tabs/system-tab'),
    require('tabs/users-tab'),
    require('tabs/groups-tab'),
    require('tabs/vdcs-tab'),
    require('tabs/acls-tab'),
    require('tabs/vresources-tab'),
    require('tabs/vms-tab'),
    require('tabs/templates-tab'),
    require('tabs/images-tab'),
    require('tabs/files-tab'),
    require('tabs/infra-tab'),
    require('tabs/clusters-tab'),
    require('tabs/hosts-tab'),
    require('tabs/datastores-tab'),
    require('tabs/vnets-tab'),
    require('tabs/secgroups-tab'),
    require('tabs/zones-tab'),
    require('tabs/marketplace-tab'),
    require('tabs/oneflow-dashboard'),
    require('tabs/oneflow-services-tab'),
    require('tabs/oneflow-templates-tab'),
    require('tabs/settings-tab')
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

    _setupAccordion();

    Sunstone.showTab(DASHBOARD_TAB_ID);
  });

  function _setupAccordion() {
    $(document).on("click", ".accordion_advanced > a", function() {
      if ($(this).hasClass("active")){
        $(this).removeClass("active");
      } else {
        $(this).addClass("active");
      }

      $(this).closest(".accordion_advanced").children(".content").toggle();

      return false;
    })
  }
});
