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
  /*
    This module insert a row with the name of the resource.
    The row can be edited and a rename action will be sent
   */

  var Config = require('sunstone-config');
  var Humanize = require("utils/humanize");
  var ResourceSelect = require('utils/resource-select');
  var Sunstone = require('sunstone');
  var TemplateBackup = require('hbs!./permissions-table/backup');

  var TemplateGroup = require('hbs!./permissions-table/group');
  var TemplateOwner = require('hbs!./permissions-table/owner');
  var TemplatePermissions = require('hbs!./permissions-table/permissions');
  var TemplatePermissionsTable = require('hbs!./permissions-table/html');
  var BACKUPS_TAB_ID = require('tabs/backups-tab/tabId');


  /**
   * Generate the tr HTML with the name of the resource and an edit icon
   * @param {String} tabName
   * @param {String} resourceType Resource type (i.e: Zone, Host, Image...)
   * @param {Object} element OpenNebula object (i.e: element.ID, element.GNAME)
   * @returns {String} HTML row
   */
  var _html = function(tabName, resourceType, element) {
    var permissionsHTML = '';
    if (Config.isTabActionEnabled(tabName, resourceType + '.chmod')) {
      permissionsHTML = TemplatePermissions({'element': element})
    }

    var ownerHTML = TemplateOwner({
      'tabName': tabName,
      'action': resourceType + '.chown',
      'element': element
    });

    var groupHTML = TemplateGroup({
      'tabName': tabName,
      'action': resourceType + '.chgrp',
      'element': element
    })

    var backupHTML = '';
    // The backup information is only available for VMs 
    // but it could be extended to another resources
    if (resourceType == "VM" && 
      element.USER_TEMPLATE && 
      element.BACKUPS &&
      element.BACKUPS.BACKUP_IDS &&
      (!element.USER_TEMPLATE.HYPERVISOR ||
      element.USER_TEMPLATE.HYPERVISOR && 
      element.USER_TEMPLATE.HYPERVISOR === "kvm")) {
        var backupsIDs = ""
        ids = Array.isArray(element.BACKUPS.BACKUP_IDS.ID) ? 
          element.BACKUPS.BACKUP_IDS.ID :
          [element.BACKUPS.BACKUP_IDS.ID]
        if (ids && ids.length > 0){
          ids.forEach( id => {
            backupsIDs += Navigation.link(id, BACKUPS_TAB_ID, id) 
            backupsIDs += (id === ids[ids.length - 1] ? "" : ", ")
          });
        }
        else {
          backupsIDs = "-"
        }

        backupHTML = TemplateBackup({'ids': backupsIDs})
    }

    var permissionsTableHTML = TemplatePermissionsTable({
      'resourceType': resourceType.toLowerCase(),
      'permissionsHTML': permissionsHTML,
      'ownerHTML': ownerHTML,
      'groupHTML': groupHTML,
      'backupHTML': backupHTML
    })

    return permissionsTableHTML;
  };

  /**
   * Initialize the row, clicking the edit icon will add an input to edit the name
   * @param {String} tabName
   * @param {String} resourceType Resource type (i.e: Zone, Host, Image...)
   * @param {Object} element OpenNebula object (i.e: element.ID, element.GNAME)
   * @param {jQuery Object} context Selector including the tr
   */
  var _setup = function(tabName, resourceType, element, context) {
    var resourceId = element.ID;

    if (Config.isTabActionEnabled(tabName, resourceType + '.chmod')) {
      _setPermissionsTable(element, context);

      context.off('change', ".permission_check");
      context.on('change', ".permission_check", function() {
        var permissionsOctet = {octet : _buildOctet(context)};
        Sunstone.runAction(resourceType + ".chmod", resourceId, permissionsOctet);
      });
    }

    if (Config.isTabActionEnabled(tabName, resourceType + '.chown')) {
      context.off("click", "#div_edit_chg_owner_link");
      context.on("click", "#div_edit_chg_owner_link", function() {
          ResourceSelect.insert({
              context: $('#value_td_owner', context),
              resourceName: 'User',
              initValue: element.UID
            });
        });

      context.off("change", "#value_td_owner .resource_list_select");
      context.on("change", "#value_td_owner .resource_list_select", function() {
          var newOwnerId = $(this).val();
          if (newOwnerId != "") {
            Sunstone.runAction(resourceType + ".chown", [resourceId], newOwnerId);
          }
        });
    }

    if (Config.isTabActionEnabled(tabName, resourceType + '.chgrp')) {
      context.off("click", "#div_edit_chg_group_link");
      context.on("click", "#div_edit_chg_group_link", function() {
          ResourceSelect.insert({
              context: $('#value_td_group', context),
              resourceName: 'Group',
              initValue: element.GID
            });
        });

      context.off("change", "#value_td_group .resource_list_select");
      context.on("change", "#value_td_group .resource_list_select", function() {
          var newGroupId = $(this).val();
          if (newGroupId != "") {
            Sunstone.runAction(resourceType + ".chgrp", [resourceId], newGroupId);
          }
        });
    }

    return false;
  };

  //Returns an octet given a permission table with checkboxes
  var _buildOctet = function(context) {
    var owner = 0;
    var group = 0;
    var other = 0;

    if ($('.owner_u', context).is(':checked'))
        owner += 4;
    if ($('.owner_m', context).is(':checked'))
        owner += 2;
    if ($('.owner_a', context).is(':checked'))
        owner += 1;

    if ($('.group_u', context).is(':checked'))
        group += 4;
    if ($('.group_m', context).is(':checked'))
        group += 2;
    if ($('.group_a', context).is(':checked'))
        group += 1;

    if ($('.other_u', context).is(':checked'))
        other += 4;
    if ($('.other_m', context).is(':checked'))
        other += 2;
    if ($('.other_a', context).is(':checked'))
        other += 1;

    return "" + owner + group + other;
  };

  var _ownerUse = function(element) {
    return parseInt(element.PERMISSIONS.OWNER_U);
  };
  var _ownerManage = function(element) {
    return parseInt(element.PERMISSIONS.OWNER_M);
  };
  var _ownerAdmin = function(element) {
    return parseInt(element.PERMISSIONS.OWNER_A);
  };

  var _groupUse = function(element) {
    return parseInt(element.PERMISSIONS.GROUP_U);
  };
  var _groupManage = function(element) {
    return parseInt(element.PERMISSIONS.GROUP_M);
  };
  var _groupAdmin = function(element) {
    return parseInt(element.PERMISSIONS.GROUP_A);
  };

  var _otherUse = function(element) {
    return parseInt(element.PERMISSIONS.OTHER_U);
  };
  var _otherManage = function(element) {
    return parseInt(element.PERMISSIONS.OTHER_M);
  };
  var _otherAdmin = function(element) {
    return parseInt(element.PERMISSIONS.OTHER_A);
  };

  var _setPermissionsTable = function(element, context) {
    if (_ownerUse(element))
        $('.owner_u', context).attr('checked', 'checked');
    if (_ownerManage(element))
        $('.owner_m', context).attr('checked', 'checked');
    if (_ownerAdmin(element))
        $('.owner_a', context).attr('checked', 'checked');
    if (_groupUse(element))
        $('.group_u', context).attr('checked', 'checked');
    if (_groupManage(element))
        $('.group_m', context).attr('checked', 'checked');
    if (_groupAdmin(element))
        $('.group_a', context).attr('checked', 'checked');
    if (_otherUse(element))
        $('.other_u', context).attr('checked', 'checked');
    if (_otherManage(element))
        $('.other_m', context).attr('checked', 'checked');
    if (_otherAdmin(element))
        $('.other_a', context).attr('checked', 'checked');
  };

  return {
    'html': _html,
    'setup': _setup
  };
});
