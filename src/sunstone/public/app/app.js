/* -------------------------------------------------------------------------- */
/* Copyright 2002-2015, OpenNebula Project, OpenNebula Systems                */
/*                                                                            */
/* Licensed under the Apache License, Version 2.0 (the "License"); you may    */
/* not use this file except in compliance with the License. You may obtain    */
/* a copy of the License at                                                   */
/*                                                                            */
/* http://www.apache.org/licenses/LICENSE-2.0                                 */
/*                                                                            */
/* Unless required by applicable law or agreed to in writing, software        */
/* distributed under the License is distributed on an "AS IS" BASIS,          */
/* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.   */
/* See the License for the specific language governing permissions and        */
/* limitations under the License.                                             */
/* -------------------------------------------------------------------------- */

define(function(require) {
  require('jquery');
  require('foundation');

  Foundation.Dropdown.defaults.positionClass = 'left';
  Foundation.Dropdown.defaults.closeOnClick = true;
  Foundation.DropdownMenu.defaults.closeOnClick = true;
  Foundation.DropdownMenu.defaults.disableHover = true;
  Foundation.DropdownMenu.defaults.clickOpen = true;

  var DASHBOARD_TAB_ID = require('tabs/dashboard-tab/tabId');
  var SETTINGS_TAB_ID = require('tabs/settings-tab/tabId');
  var PROVISION_TAB_ID = require('tabs/provision-tab/tabId');
  var Sunstone = require('sunstone');
  var Config = require('sunstone-config');
  var OpenNebula = require('opennebula');
  var Notifier = require('utils/notifier');
  var Menu = require('utils/menu');
  var Locale = require('utils/locale');

  var UserAndZoneTemplate = require('hbs!sunstone/user_and_zone');

  var ZONE_TAB_ID = require('tabs/zones-tab/tabId');

  var _commonDialogs = [
    require('utils/dialogs/confirm'),
    require('utils/dialogs/confirm-with-select'),
    require('utils/dialogs/generic-confirm'),
    require('utils/dialogs/clusters')
  ]


  //$(window).load(function() {
  //   $('#loading').hide();
  //});

  $(document).ready(function() {
    Sunstone.addDialogs(_commonDialogs);
    Sunstone.addMainTabs();
    Sunstone.insertTabs();

    if (Config.isTabEnabled(PROVISION_TAB_ID)){
      Menu.insertProvision();
    }else{
      Menu.insert();
    }

    _setupAccordion();
    _setupCloseDropdownsOnClick();
    _insertUserAndZoneSelector();

    if (Config.isTabEnabled(PROVISION_TAB_ID)) {
      Sunstone.showTab(PROVISION_TAB_ID);
      $('#loading').hide();
    } else if (Config.isTabEnabled(DASHBOARD_TAB_ID)) {
      Sunstone.showTab(DASHBOARD_TAB_ID);
      $('#loading').hide();
    }

    // init the zone list, needed for market & apps zone columns
    if (Config.isTabActionEnabled(ZONE_TAB_ID, "Zone.list")) {
      Sunstone.runAction("Zone.list");
    }
  });

  function _setupCloseDropdownsOnClick() {
    $(document).on("click", '[data-dropdown-content] a', function() {
      var id = $(this).closest('ul').attr('id');
      $('[data-dropdown=' + id + ']').trigger('click');
    });
  }

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
    $(".user-zone-info").html(UserAndZoneTemplate({
      displayName: config['display_name'],
      settingsTabEnabled: Config.isTabEnabled(SETTINGS_TAB_ID),
      availableViews: config['available_views'],
      zoneName: config['zone_name']
    })).foundation();

    $('.quickconf_view[view="' + config['user_config']["default_view"] + '"] i').addClass('fa-check');
    $(".user-zone-info a.quickconf_view_header").click(function() {
      var context = $(this).closest('ul');
      $(".quickconf_view", context).toggle();

      return false;
    });

    $(".user-zone-info a.quickconf_view").click(function() {
      var sunstone_setting = {DEFAULT_VIEW : $(this).attr("view")};
      Sunstone.runAction("User.append_sunstone_setting_refresh", -1, sunstone_setting);
    });

    function zoneRefresh() {
      // Populate Zones dropdown
      OpenNebula.Zone.list({
        timeout: true,
        success: function (request, obj_list) {
          $('.zone-ul').empty();
          $.each(obj_list, function() {
            $('.zone-ul').append('<li>' +
              '<a href="#" id="' + this.ZONE.NAME + '" class="zone-choice">' + this.ZONE.NAME + '</a></li>');
          });
        },
        error: Notifier.onError
      });
    }

    $('#zonelector').on("click", function() {
      zoneRefresh();
    });

    $(".user-zone-info").on("click", 'a.zone-choice', function() {
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
      //$(document).foundation('dropdown', 'closeall');
      Sunstone.showTab(SETTINGS_TAB_ID);
    });
  }
});
