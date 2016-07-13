/* -------------------------------------------------------------------------- */
/* Copyright 2002-2016, OpenNebula Project, OpenNebula Systems                */
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
  Foundation.Reveal.defaults.closeOnClick = false;

  _setupDataTableSearch();

  var SETTINGS_TAB_ID = require('tabs/settings-tab/tabId');
  var PROVISION_TAB_ID = require('tabs/provision-tab/tabId');
  var Sunstone = require('sunstone');
  var Config = require('sunstone-config');
  var OpenNebula = require('opennebula');
  var Notifier = require('utils/notifier');
  var Menu = require('utils/menu');
  var Locale = require('utils/locale');

  var UserAndZoneTemplate = require('hbs!sunstone/user_and_zone');

  var _commonDialogs = [
    require('utils/dialogs/confirm'),
    require('utils/dialogs/confirm-with-select'),
    require('utils/dialogs/generic-confirm'),
    require('utils/dialogs/clusters'),
    require('utils/dialogs/overcommit')
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
      Sunstone.setupNavigoRoutes();
    }

    _setupAccordion();
    _setupCloseDropdownsOnClick();
    _insertUserAndZoneSelector();

    if (Config.isTabEnabled(PROVISION_TAB_ID)) {
      Sunstone.showTab(PROVISION_TAB_ID);
    }

    $('#loading').hide();
  });

  function _setupCloseDropdownsOnClick() {
    $(document).on("click", '.is-dropdown-submenu-item > a', function() {
      $('.is-active > a', $(this).closest('.dropdown')).trigger('click');
    });
  }

  function _setupAccordion() {
    $(document).on("click", ".accordion_advanced_toggle", function() {
      if ($(this).hasClass("active")) {
        $(this).removeClass("active");
      } else {
        $(this).addClass("active");
      }

      $(".content", $(this).closest(".accordion_advanced")).toggle();

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
            var icon;

            if(this.ZONE.NAME == config['zone_name']){
              icon = '<i class="fa fa-fw fa-check"></i>'
            } else {
              icon = '<i class="fa fa-fw"></i>'
            }

            $('.zone-ul').append('<li>' +
              '<a href="#" id="' + this.ZONE.NAME + '" class="zone-choice">' + icon + ' ' + this.ZONE.NAME + '</a></li>');
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

  function _setupDataTableSearch() {
    $.fn.dataTable.ext.type.order['file-size-pre'] = function ( data ) {
      var matches = data.match( /^(\d+(?:\.\d+)?)\s*([a-z]+)/i );
      var multipliers = {
        B:  1,
        KB: 1024,
        MB: 1048576,
        GB: 1073741824,
        TB: 1099511627776,
        PB: 1125899906842624
      };

      if (matches) {
        var multiplier = multipliers[matches[2]];
        return parseFloat( matches[1] ) * multiplier;
      } else {
        return -1;
      }
    }
  }
});
