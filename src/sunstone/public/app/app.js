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
  require('foundation.dropdown');

  var DASHBOARD_TAB_ID = require('tabs/dashboard-tab/tabId');
  var SETTINGS_TAB_ID = require('tabs/settings-tab/tabId');
  var PROVISION_TAB_ID = require('tabs/provision-tab/tabId');
  var Sunstone = require('sunstone');
  var Config = require('sunstone-config');
  var OpenNebula = require('opennebula');
  var Notifier = require('utils/notifier');
  var Menu = require('utils/menu');

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
    require('utils/dialogs/confirm-with-select'),
    require('utils/dialogs/generic-confirm')
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
    var user_login_content =  '<button href="#" data-dropdown="userSelectDropdown" class="button small radius secondary dropdown" id="logout">\
      <i class="fa fa-user fa-lg fa-fw header-icon"></i> ' + config['display_name'] + '</button>\
      <ul id="userSelectDropdown" data-dropdown-content class="f-dropdown">\
        <li><a href="#" class="configuration"><i class="fa fa-cog"></i> Settings</a></li>\
        <li><a href="#" class="logout"><i class="fa fa-power-off"></i> Sign Out</a></li>\
      </ul>\
    <button href="#" data-dropdown="drop2" class="button small radius secondary dropdown" id="zonelector">\
      <i class="fa fa-home fa-lg fa-fw header-icon"></i> ' + config['zone_name'] + '</button>\
      <ul id="drop2" data-dropdown-content class="zone-ul f-dropdown"></ul>';

    $(".user-zone-info").html(user_login_content);

    if (!Config.isTabEnabled(SETTINGS_TAB_ID)){
      $(".user-zone-info a.configuration").parent('li').remove();
    }

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
      $(document).foundation('dropdown', 'closeall');
      Sunstone.showTab(SETTINGS_TAB_ID);
    });
  }
});
