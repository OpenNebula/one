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

  var Locale = require("utils/locale");
  var Utils = require("../utils/common");
  var ResourcesTab = require("../utils/resources-tab");
  var OpenNebulaZone = require("opennebula/zone");
  var OpenNebula = require("opennebula");

  /*
    CONSTANTS
   */

  var TAB_ID = require("../tabId");
  var PANEL_ID = require("./resources/panelId");
  var RESOURCE = "Vdc";
  var XML_ROOT = "VDC";
  var ZONES = [];

  /*
    CONSTRUCTOR
   */

  function Panel(info) {
    this.title = Locale.tr("Resources");
    this.icon = "fa-th";
    this.element = info[XML_ROOT];
    window.VDCId = this.element.ID;
    window.VDCInfo = this.element;
    this.resourcesTab = new ResourcesTab("vdc_info_panel");
    return this;
  }

  Panel.PANEL_ID = PANEL_ID;
  Panel.prototype.html = _html;
  Panel.prototype.setup = _setup;
  Panel.prototype.onShow = _onShow;

  return Panel;

  /*
    FUNCTION DEFINITIONS
   */

  function _html() {
    return this.resourcesTab.html();
  }

  function _onShow(context) {
    var renderZones = "";
    $("select.vdc_zones_select", context).empty();
    if(ZONES && ZONES.length) {
      ZONES.map(function(zone) {
        if(zone.ZONE) {
          renderZones += "<option value=\""+zone.ZONE.ID+"\">"+zone.ZONE.NAME+"</option>";
        }
      });
      $("select.vdc_zones_select", context).append(renderZones);
    }
  }

  function _setup(context) {
    var that = this;
    var indexed_resources = Utils.indexedVdcResources(that.element);

    if(indexed_resources && !indexed_resources.ZONE) {
      OpenNebula.Zone.list({ success: function(_, obj_list) {
        ZONES = obj_list;
      }});
    }

    $.each(indexed_resources, function(zone_id,objects) {
      that.resourcesTab.addResourcesZone(
        zone_id,
        OpenNebulaZone.getName(zone_id),
        context,
        indexed_resources);
    });

    that.resourcesTab.setup(context);
    that.resourcesTab.onShow(context);
  }
});
