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

  var Locale = require('utils/locale');
  var DomDataTable = require('utils/dom-datatable');

  /*
    TEMPLATES
   */

  var TemplateHTML = require('hbs!./pci/html');

  /*
    CONSTANTS
   */

  var TAB_ID = require('../tabId');
  var PANEL_ID = require('./pci/panelId');
  var RESOURCE = "Host"
  var XML_ROOT = "HOST"

  /*
    CONSTRUCTOR
   */

  function Panel(info) {
    this.title = Locale.tr("PCI");
    this.icon = "fa-list-ul";

    this.element = info[XML_ROOT];

    this.panelId = PANEL_ID;

    // Do not create an instance of this panel if no pci devices are found
    if (this.element.HOST_SHARE.PCI_DEVICES.PCI == undefined) {
      throw "Panel not available for this element";
    }

    return this;
  }

  Panel.PANEL_ID = PANEL_ID;
  Panel.prototype.html = _html;
  Panel.prototype.setup = _setup;

  return Panel;

  /*
    FUNCTION DEFINITIONS
   */

  function _html() {
    var pcis = [];

    if(this.element.HOST_SHARE &&
       this.element.HOST_SHARE.PCI_DEVICES &&
       this.element.HOST_SHARE.PCI_DEVICES.PCI){

      pcis = this.element.HOST_SHARE.PCI_DEVICES.PCI;

      if (!Array.isArray(pcis)){ // If only 1 convert to array
        pcis = [pcis];
      }

      $.each(pcis, function(){
        if(this.VMID == "-1"){
          this.VMID = "";
        }
      });
    }

    return TemplateHTML({
      'pcis': pcis,
      'panelId': this.panelId
    });
  }

  function _setup(context) {
    this.pciDataTable = new DomDataTable(
      'datatable_pci_'+this.panelId,
      {
        actions: false,
        info: false,
        dataTableOptions: {
          "bAutoWidth": false,
          "bSortClasses" : false,
          "bDeferRender": true,
          "ordering": false,
          "aoColumnDefs": [
          ]
        }
      });

    this.pciDataTable.initialize();

    return false;
  }
});
