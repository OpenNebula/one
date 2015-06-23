define(function(require) {
  require('jquery');

  var DASHBOARD_TAB_ID = require('tabs/dashboard-tab/tabId');
  var SETTINGS_TAB_ID = require('tabs/settings-tab/tabId');
  var PROVISION_TAB_ID = require('tabs/provision-tab/tabId');
  var Sunstone = require('sunstone');
  var Config = require('sunstone-config');
  var OpenNebula = require('opennebula');
  var Notifier = require('utils/notifier');

  var _tabs;
  if (Config.isTabEnabled(PROVISION_TAB_ID)) {
    _tabs = [
      require('tabs/provision-tab'),
      require('tabs/users-tab'),
      require('tabs/settings-tab')
    ];
  } else {
    _tabs = [
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
      require('tabs/settings-tab'),
      require('tabs/support-tab')
    ];
  }

  var _commonDialogs = [
    require('utils/dialogs/confirm'),
    require('utils/dialogs/confirm-with-select')
  ]

  Sunstone.addDialogs(_commonDialogs);

  $.each(_tabs, function(index, tab) {
    Sunstone.addMainTab(tab);
  });

  //$(window).load(function() {
  //   $('#loading').hide();
  //});

  $(document).ready(function() {
    Sunstone.insertTabs();

    _setupAccordion();
    _insertUserAndZoneSelector();

    if (Config.isTabEnabled(PROVISION_TAB_ID)) {
      Sunstone.showTab(PROVISION_TAB_ID);
      $('#loading').hide();
    } else if (Config.isTabEnabled(DASHBOARD_TAB_ID)) {
      Sunstone.showTab(DASHBOARD_TAB_ID);
      $('#loading').hide();
    }
  });

  function _setupAccordion() {
    $(document).on("click", ".accordion_advanced > a", function() {
      if ($(this).hasClass("active")) {
        $(this).removeClass("active");
      } else {
        $(this).addClass("active");
      }

      $(this).closest(".accordion_advanced").children(".content").toggle();

      return false;
    })
  }

  function _insertUserAndZoneSelector() {
    var user_login_content =  '<a href="#" data-dropdown="drop1" class="button small radius secondary dropdown" id="logout">\
      <i class="fa fa-user fa-lg fa-fw header-icon"></i> ' + config['display_name'] + '</a>\
      <ul id="drop1" data-dropdown-content class="f-dropdown">\
        <li><a href="#" class="configuration"><i class="fa fa-cog"></i> Settings</a></li>\
        <li><a href="#" class="logout"><i class="fa fa-power-off"></i> Sign Out</a></li>\
      </ul>\
    <a href="#" data-dropdown="drop2" class="button small radius secondary dropdown" id="zonelector">\
      <i class="fa fa-home fa-lg fa-fw header-icon"></i> ' + config['zone_name'] + '</a>\
      <ul id="drop2" data-dropdown-content class="zone-ul f-dropdown"></ul>';

    $(".user-zone-info").html(user_login_content);

    function zoneRefresh() {
      // Populate Zones dropdown
      OpenNebula.Zone.list({
        timeout: true,
        success: function (request, obj_list) {
          $('.zone-ul').empty();
          $.each(obj_list, function() {
            $('.zone-ul').append('<li><a id="' + this.ZONE.NAME + '" class="zone-choice">' + this.ZONE.NAME + '</a></li>');
          });
        },
        error: Notifier.onError
      });
    }

    $('#zonelector').on("click", function() {
      zoneRefresh();
    });

    $('a.zone-choice').on("click", function() {
       $.ajax({
         url: 'config',
         type: "GET",
         headers: {
           "ZONE_NAME" : this.id
         },
         dataType: "json",
         success: function() {
           window.location.href = ".";
         },
         error: function(response) {
           Notifier.onError(null, OpenNebula.Error(response))
         }
       });
     });

    $(".user-zone-info").foundation('reflow', 'dropdown');

    $("a.logout", $(".user-zone-info ")).click(function() {
      OpenNebula.Auth.logout({
          success: function() {
            window.location.href = "login";
          },
          error: Notifier.onError
        });

      return false;
    });

    $(".user-zone-info a.configuration").click(function() {
      $(document).foundation('dropdown', 'closeall');
      Sunstone.showTab(SETTINGS_TAB_ID);
    });
  }
});
