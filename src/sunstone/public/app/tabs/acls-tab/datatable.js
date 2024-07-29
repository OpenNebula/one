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
    DEPENDENCIES
   */

  var TabDataTable = require('utils/tab-datatable');
  var SunstoneConfig = require('sunstone-config');
  var Locale = require('utils/locale');
  var Status = require('utils/status');

  var OpenNebulaUser = require('opennebula/user');
  var OpenNebulaGroup = require('opennebula/group');
  var OpenNebulaZone = require('opennebula/zone');

  /*
    CONSTANTS
   */

  var RESOURCE = "Acl";
  var XML_ROOT = "ACL";
  var TAB_NAME = require('./tabId');

  /*
    CONSTRUCTOR
   */

  function Table(dataTableId, conf) {
    this.conf = conf || {};
    this.tabId = TAB_NAME;
    this.dataTableId = dataTableId;
    this.resource = RESOURCE;
    this.xmlRoot = XML_ROOT;

    this.dataTableOptions = {
      "bSortClasses" : false,
      "bDeferRender": true,
      "aoColumnDefs": [
          { "bSortable": false, "aTargets": ["check",2,3,4,5,6,7] },
          {"sWidth": "35px", "aTargets": [0]},
          {"bVisible": true, "aTargets": SunstoneConfig.tabTableColumns(TAB_NAME)},
          {"bVisible": false, "aTargets": ['_all']},
          {"sType": "num", "aTargets": [1]}
      ]
    };

    this.totalACLs = 0;

    this.columns = [
      Locale.tr("ID"),
      Locale.tr("Applies to"),
      Locale.tr("Affected resources"),
      Locale.tr("Resource ID / Owned by"),
      Locale.tr("Allowed operations"),
      Locale.tr("Zone"),
      Locale.tr("ACL String")
    ];

    this.selectOptions = {
      "id_index": 1,
      "name_index": 1,
      "select_resource": Locale.tr("Please select an ACL rule from the list"),
      "you_selected": Locale.tr("You selected the following ACL rule:"),
      "select_resource_multiple": Locale.tr("Please select one or more ACL rules from the list"),
      "you_selected_multiple": Locale.tr("You selected the following ACL rules:")
    };

    TabDataTable.call(this);
  }

  Table.prototype = Object.create(TabDataTable.prototype);
  Table.prototype.constructor = Table;
  Table.prototype.elementArray = _elementArray;
  Table.prototype.preUpdateView = _preUpdateView;
  Table.prototype.postUpdateView = _postUpdateView;

  return Table;

  /*
    FUNCTION DEFINITIONS
   */

  function _elementArray(element_json) {
    var element = element_json[XML_ROOT];

    var acl_string = element.STRING;

    var acl_array = _parseAclString(acl_string);

    this.totalACLs++;

    var color_html = Status.state_lock_to_color("ACL",false, element_json[XML_ROOT]["LOCK"]);

    return [
      '<input class="check_item" type="checkbox" '+
                          'style="vertical-align: inherit;" id="'+this.resource.toLowerCase()+'_' +
                           element.ID + '" name="selected_items" value="' +
                           element.ID + '"/>'+color_html,
      element.ID,
      acl_array[0],
      acl_array[1],
      acl_array[2],
      acl_array[3],
      Locale.tr(acl_array[4].charAt(0).toUpperCase()+acl_array[4].substring(1)), //capitalize 1st letter for translation
      element.STRING
    ];
  }


  //Parses a full ACL string, and translates it into
  //a legible array
  //to be put in the datatable fields.
  function _parseAclString(string) {
    var space_split = string.split(' ');
    var user = space_split[0];
    var resources = space_split[1];
    var rights = space_split[2];
    var zone = space_split[3];

    //User
    var user_str = _parseUserAcl(user);


    //Resources
    var resources_str="";
    var resources_array = resources.split('/');
    var belonging_to = _parseResourceAcl(resources_array[1]);
    resources_array = resources_array[0].split('+');
    for (var i=0; i<resources_array.length;i++){
      switch (resources_array[i]){
      case "HOST":
          resources_str+=Locale.tr("Hosts")+", ";
          break;
      case "VM":
          resources_str+=Locale.tr("Virtual Machines")+", ";
          break;
      case "NET":
          resources_str+=Locale.tr("Virtual Networks")+", ";
          break;
      case "IMAGE":
          resources_str+=(Locale.tr("Images")+", ");
          break;
      case "TEMPLATE":
          resources_str+=Locale.tr("VM Templates")+", ";
          break;
      case "USER":
          resources_str+=Locale.tr("Users")+", ";
          break;
      case "GROUP":
          resources_str+=Locale.tr("Groups")+", ";
          break;
      case "CLUSTER":
          resources_str+=Locale.tr("Clusters")+", ";
          break;
      case "DATASTORE":
          resources_str+=Locale.tr("Datastores")+", ";
          break;
      case "DOCUMENT":
          resources_str+=Locale.tr("Documents")+", ";
          break;
      case "ZONE":
          resources_str+=Locale.tr("Zones")+", ";
          break;
      case "SECGROUP":
          resources_str+=Locale.tr("Security Groups")+", ";
          break;
      case "VDC":
          resources_str+=Locale.tr("VDCs")+", ";
          break;
      case "VROUTER":
          resources_str+=Locale.tr("Virtual Routers")+", ";
          break;
      case "MARKETPLACE":
          resources_str+=Locale.tr("Marketplaces")+", ";
          break;
      case "MARKETPLACEAPP":
          resources_str+=Locale.tr("Marketplace Apps")+", ";
          break;
      case "VMGROUP":
          resources_str+=Locale.tr("VM Groups")+", ";
          break;
      }
    }
    //remove ", " from end
    resources_str = resources_str.substring(0,resources_str.length-2);

    //Ops
    var ops_str="";
    var ops_array = rights.split('+');
    for (var i=0; i<ops_array.length;i++){
        ops_str += ops_array[i].toLowerCase()+", ";
    }
    ops_str= ops_str.substring(0,ops_str.length-2);

    //Zone
    var zone_str = _parseZoneAcl(zone);

    return [user_str, resources_str, belonging_to, ops_str, zone_str];
  }

  //Receives a segment of an ACL and translates:
  // * -> All
  // @1 -> Group 1 (tries to translate "1" into group name)
  // #1 -> User 1 (tries to translate "1" into username)
  //Translation of usernames and groupnames depends on
  //group and user plugins tables.
  function _parseUserAcl(user){
    var user_str="";
    if (user[0] == '*'){
      user_str = Locale.tr("All");
    } else {
      if (user[0] == '#'){
        user_str=Locale.tr("User")+" ";
        user_str+= OpenNebulaUser.getName(user.substring(1));
      }
      else if (user[0] == '@'){
        user_str=Locale.tr("Group")+" ";
        user_str+= OpenNebulaGroup.getName(user.substring(1));
      }
    }
    return user_str;
  }

  //Similar to above, but #1 means resource with "ID 1"
  function _parseResourceAcl(user){
    var user_str="";
    if (user[0] == '*'){
      user_str = Locale.tr("All");
    } else {
      if (user[0] == '#'){
        user_str=Locale.tr("ID")+" ";
        user_str+= user.substring(1);
      }
      else if (user[0] == '@'){
        user_str=Locale.tr("Group")+" ";
        user_str+= OpenNebulaGroup.getName(user.substring(1));
      }
      else if (user[0] == '%'){
        user_str=Locale.tr("Cluster ID")+" ";
        user_str+= user.substring(1);
      }
    }
    return user_str;
  }

  //Receives a segment of an ACL and translates:
  // * -> All
  // #1 -> Zone 1 (tries to translate "1" into zone name)
  //Translation of zone names depends on
  //zone plugins tables.
  function _parseZoneAcl(zone){
    var zone_str = "";

    if (zone[0] == '*'){
      zone_str = Locale.tr("All");
    } else if (zone[0] == '#'){
      zone_str = OpenNebulaZone.getName(zone.substring(1));
    }

    return zone_str;
  }

  function _preUpdateView() {
    this.totalACLs = 0;
  }

  function _postUpdateView() {
    $(".total_acl").text(this.totalACLs);
  }

});
