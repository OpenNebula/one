/* -------------------------------------------------------------------------- */
/* Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                */
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
  require('jquery-ui');
  require('wickedpicker');
  require('foundation');

  Foundation.Dropdown.defaults.positionClass = 'left';
  Foundation.Dropdown.defaults.closeOnClick = true;
  Foundation.DropdownMenu.defaults.closeOnClick = true;
  Foundation.DropdownMenu.defaults.disableHover = true;
  Foundation.DropdownMenu.defaults.clickOpen = true;
  Foundation.Reveal.defaults.closeOnClick = false;

  _setupDataTableSearch();
  _setDataTableErrMode();

  var SETTINGS_TAB_ID = require('tabs/settings-tab/tabId');
  var PROVISION_TAB_ID = require('tabs/provision-tab/tabId');
  var Config = require('sunstone-config');
  var FireedgeValidator = require("utils/fireedge-validator");
  var Locale = require('utils/locale');
  var Menu = require('utils/menu');
  var Notifier = require('utils/notifier');
  var OpenNebula = require('opennebula');
  var Sunstone = require('sunstone');
  var Websocket = require("utils/websocket");

  var UserAndZoneTemplate = require('hbs!sunstone/user_and_zone');

  var _commonDialogs = [
    require('utils/dialogs/confirm'),
    require('utils/dialogs/confirm-with-select'),
    require('utils/dialogs/generic-confirm'),
    require('utils/dialogs/clusters'),
    require('utils/dialogs/overcommit'),
    require('utils/dialogs/leases')
  ];

  $(document).ready(function() {
    Sunstone.addDialogs(_commonDialogs);
    Sunstone.addMainTabs();
    Sunstone.insertTabs();

    if (Config.isTabEnabled(PROVISION_TAB_ID)){
      Menu.insertProvision();
    }else{
      Menu.insert();
    }

    Sunstone.setupNavigoRoutes();

    _setupAccordion();
    _setupCloseDropdownsOnClick();
    _insertUserAndZoneSelector();

    if (Config.isTabEnabled(PROVISION_TAB_ID)) {
      Sunstone.showTab(PROVISION_TAB_ID);
    }

    var create_socket = function(token) {
      if (Websocket.disconnected()){
        Websocket.start(token);
      }
    };

    FireedgeValidator.checkFireedgePublicURL(FireedgeValidator.validateFireedgeToken, create_socket);

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
        if ($(this).hasClass("importation")) {
          $(this).css("color", "").css("font-weight", "normal");
        }
      } else {
        $(this).addClass("active");
        if ($(this).hasClass("importation")) {
          $(this).css("color", "#555").css("font-weight", "bold");
        }
      }

      $(".content", $(this).closest(".accordion_advanced")).toggle();

      return false;
    })
  }

  function _insertUserAndZoneSelector() {

    this.idGroup = -2; /*All*/
    Config.changeFilter(false);

    $(".user-zone-info").html(UserAndZoneTemplate({
      filterView: Config['filterView'],
      displayName: config['display_name'],
      settingsTabEnabled: Config.isTabEnabled(SETTINGS_TAB_ID),
      mode : config["mode"],
      availableViews: config['available_views'],
      zoneName: config['zone_name']
    })).foundation();

    $('#filter-view').hide();
    groupsRefresh();

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

    function groupsRefresh() {
      OpenNebula.User.show({
        timeout: true,
        data : {
          id: config['user_id']
        },
        success: function (_, obj_user) {
          var groups = obj_user.USER.GROUPS.ID;
          this.primaryGroup = obj_user.USER.GID;
          var groupsHTML = "<li class='groups' value='-2'> <a href='#' value='-2' id='-2'> \
              <i class='fas fa-fw'></i>" + Locale.tr("All") + "</a></li>";
          if(this.idGroup == -2){
            var groupsHTML = "<li class='groups' value='-2'> <a href='#' value='-2' id='-2'> \
              <i class='fas fa-fw fa-check'></i>" + Locale.tr("All") + "</a></li>";
          }

          if (!Array.isArray(groups)){
            groups = groups.toString();
            groups = [groups];
          }
          that = this;
          OpenNebula.Group.list({
            timeout: true,
            success: function(_, group_list) {
              var group_list_aux = group_list;
              $.each(groups, function(_, value){
                var id = value;
                $.each(group_list_aux, function(key, value){
                  if(id == value.GROUP.ID){
                    if(id == that.idGroup){
                      groupsHTML += "<li class='groups' value='" + id + "'id='" + id + "'> \
                        <a href='#'><i class='fas fa-fw fa-check'></i>" + value.GROUP.NAME + "\
                        </a></li>";
                    } else {
                      groupsHTML += "<li class='groups' value='" + id + "'id='" + id + "'> \
                        <a href='#'><i class='fas fa-fw'></i>" + value.GROUP.NAME + "\
                        </a></li>";
                    }
                    return false;
                  }
                });
              });
            },
            error: Notifier.onError
          });

          $('#userselector').on('click', function(){
            $('.groups-menu').empty();
            $('.groups-menu').append(groupsHTML);
            var primaryGroupChar = '<span class="fas fa-asterisk fa-fw" id="primary-char" \
                                    style="float: right"></span>';
            $('#'+ that.primaryGroup + ' a').append(primaryGroupChar);
            $('.groups').on('click', function(){
              that.idGroup = $(this).attr('value');
              if(that.idGroup != -2){
                $('#primary-char').remove();
                Sunstone.runAction("User.chgrp", [parseInt(config['user_id'])], parseInt(that.idGroup));
                $('a', this).append(primaryGroupChar);
                Config.changeFilter(true);
                var filterName = $(this).text();
                $('#filter-view').show();
                $('.filter-name').html(filterName);
              } else {
                $('#filter-view').hide();
                Config.changeFilter(false);
              }
              $('.groups-menu a i').removeClass('fa-check');
              $('a i', this).addClass('fa-check');
              groupsRefresh();
              $('.refresh').click();
              $('.refresh-table').click();
            });
          });
        },
        error: Notifier.onError
      });
    }

    function zoneRefresh() {
      // Populate Zones dropdown
      OpenNebula.Zone.list({
        timeout: true,
        success: function (request, obj_list) {
          $('.zone-ul').empty();
          $.each(obj_list, function() {
            var icon;

            if(this.ZONE.NAME == config['zone_name']){
              icon = '<i class="fas fa-fw fa-check"></i>'
            } else {
              icon = '<i class="fas fa-fw"></i>'
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
           "ZONENAME" : this.id
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
      Sunstone.showTab(SETTINGS_TAB_ID);
    });
  }

  function _checkIP( sData )
  {
    if (/^\d{1,3}[\.]\d{1,3}[\.]\d{1,3}[\.]\d{1,3}$/.test(sData)) {
      return 'ip-address';
    }
    return null;
  }

  function _setDataTableErrMode(){
    $.fn.dataTable.ext.errMode = function(settings, techNote, message) {
      console.log('data table error: '+message);
    };
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

    jQuery.extend( jQuery.fn.dataTableExt.oSort, {
      "date-euro-pre": function ( a ) {
          var x;

          if ( $.trim(a) !== '' ) {
              var frDatea = $.trim(a).split(' ');
              var frTimea = (undefined != frDatea[1]) ? frDatea[1].split(':') : [00,00,00];
              var frDatea2 = frDatea[0].split('/');
              x = (frDatea2[2] + frDatea2[1] + frDatea2[0] + frTimea[0] + frTimea[1] + ((undefined != frTimea[2]) ? frTimea[2] : 0)) * 1;
          }
          else {
              x = Infinity;
          }

          return x;
      },

      "date-euro-asc": function ( a, b ) {
          return a - b;
      },

      "date-euro-desc": function ( a, b ) {
          return b - a;
      }

    });

    //source https://cdn.datatables.net/plug-ins/1.10.12/type-detection/ip-address.js (modified)
    jQuery.fn.dataTableExt.aTypes.unshift(
      function ( sData )
      {
        if (/^\d{1,3}[\.]\d{1,3}[\.]\d{1,3}[\.]\d{1,3}$/.test(sData)) {
          return 'ip-address';
        }
        return 'ip-address';
      }
    );

    //source https://datatables.net/plug-ins/sorting/ip-address (modified)
    jQuery.extend( jQuery.fn.dataTableExt.oSort, {
    "ip-address-pre": function ( a ) {
      if(a.split){
      var ip = a.split("<br>");
        var i, item;
        if(ip.length == 1){
          var m = a.split("."),
              n = a.split(":");
            }
        else if(ip.length > 1){
          var m = ip[0].split("."),
              n = ip[0].split(":");
        }
        var x = "",
            xa = "";

        if (m.length == 4) {
            // IPV4
            for(i = 0; i < m.length; i++) {
                item = m[i];

                if(item.length == 1) {
                    x += "00" + item;
                }
                else if(item.length == 2) {
                    x += "0" + item;
                }
                else {
                    x += item;
                }
            }
        }
        else if (n.length > 0) {
            // IPV6
            var count = 0;
            for(i = 0; i < n.length; i++) {
                item = n[i];

                if (i > 0) {
                    xa += ":";
                }

                if(item.length === 0) {
                    count += 0;
                }
                else if(item.length == 1) {
                    xa += "000" + item;
                    count += 4;
                }
                else if(item.length == 2) {
                    xa += "00" + item;
                    count += 4;
                }
                else if(item.length == 3) {
                    xa += "0" + item;
                    count += 4;
                }
                else {
                    xa += item;
                    count += 4;
                }
            }

            // Padding the ::
            n = xa.split(":");
            var paddDone = 0;

            for (i = 0; i < n.length; i++) {
                item = n[i];

                if (item.length === 0 && paddDone === 0) {
                    for (var padding = 0 ; padding < (32-count) ; padding++) {
                        x += "0";
                        paddDone = 1;
                    }
                }
                else {
                    x += item;
                }
            }
        }

        return x;
      }else return a;
    },

    "ip-address-asc": function ( a, b ) {
        return ((a < b) ? -1 : ((a > b) ? 1 : 0));
    },

    "ip-address-desc": function ( a, b ) {
        return ((a < b) ? 1 : ((a > b) ? -1 : 0));
    }
});
  }
});
