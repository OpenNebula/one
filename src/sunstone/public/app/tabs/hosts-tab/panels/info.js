/* -------------------------------------------------------------------------- */
/* Copyright 2002-2015, OpenNebula Project (OpenNebula.org), C12G Labs        */
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

  var Locale = require('utils/locale');
  var Humanize = require('utils/humanize');
  var RenameTr = require('utils/panel/rename-tr');
  var TemplateTable = require('utils/panel/template-table');
  var PermissionsTable = require('utils/panel/permissions-table');
  var ClusterTr = require('utils/panel/cluster-tr');
  var OpenNebulaHost = require('opennebula/host');
  var CPUBars = require('../utils/cpu-bars');
  var MemoryBars = require('../utils/memory-bars');
  var DatastoresCapacityTable = require('../utils/datastores-capacity-table');
  var CanImportWilds = require('../utils/can-import-wilds');

  /*
    TEMPLATES
   */

  var TemplateInfo = require('hbs!./info/html');

  /*
    CONSTANTS
   */

  var TAB_ID = require('../tabId');
  var PANEL_ID = require('./info/panelId');
  var RESOURCE = "Host"
  var XML_ROOT = "HOST"

  /*
    CONSTRUCTOR
   */

  function Panel(info) {
    var that = this;
    that.title = Locale.tr("Info");
    that.icon = "fa-info-circle";

    that.element = info[XML_ROOT];

    that.canImportWilds = CanImportWilds(that.element);

    // Hide information of the Wild VMs of the Host and the ESX Hosts
    //  in the template table. Unshow values are stored in the unshownTemplate
    //  object to be used when the host info is updated.
    that.unshownTemplate = {};
    that.strippedTemplate = {};
    var unshownKeys = ['HOST', 'VM', 'WILDS'];
    $.each(that.element.TEMPLATE, function(key, value) {
      if ($.inArray(key, unshownKeys) > -1) {
        that.unshownTemplate[key] = value;
      } else {
        that.strippedTemplate[key] = value;
      }
    });

    return this;
  };

  Panel.PANEL_ID = PANEL_ID;
  Panel.prototype.html = _html;
  Panel.prototype.setup = _setup;

  return Panel;

  /*
    FUNCTION DEFINITIONS
   */

  function _html() {
    var templateTableHTML = TemplateTable.html(
                                      this.strippedTemplate,
                                      RESOURCE,
                                      Locale.tr("Attributes"));

    var renameTrHTML = RenameTr.html(RESOURCE, this.element.NAME);
    var clusterTrHTML = ClusterTr.html(this.element.CLUSTER);
    var permissionsTableHTML = PermissionsTable.html(TAB_ID, RESOURCE, this.element);
    var cpuBars = CPUBars.html(this.element);
    var memoryBars = MemoryBars.html(this.element);
    var datastoresCapacityTableHTML = DatastoresCapacityTable.html(this.element);

    return TemplateInfo({
      'element': this.element,
      'renameTrHTML': renameTrHTML,
      'clusterTrHTML': clusterTrHTML,
      'templateTableHTML': templateTableHTML,
      'permissionsTableHTML': permissionsTableHTML,
      'cpuBars': cpuBars,
      'memoryBars': memoryBars,
      'stateStr': OpenNebulaHost.stateStr(this.element.STATE),
      'datastoresCapacityTableHTML': datastoresCapacityTableHTML
    });
  }

  function _setup(context) {
    $('.resource-info-header', '#' + TAB_ID).text(this.element.NAME);
    RenameTr.setup(RESOURCE, this.element.ID, context);
    ClusterTr.setup(RESOURCE, this.element.ID, this.element.CLUSTER_ID, context);
    TemplateTable.setup(this.strippedTemplate, RESOURCE, this.element.ID, context, this.unshownTemplate);
    PermissionsTable.setup(TAB_ID, RESOURCE, this.element, context);
    return false;
  }
});
