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
  var OpenNebulaNetwork = require('opennebula/network');
  var Utils = require('tabs/vnets-tab/utils/common');
  var Notifier = require('utils/notifier');
  var ProgressBar = require('utils/progress-bar');

  /*
    CONSTRUCTOR
   */

  /**
   * Constructor
   * @param {string} dataTableId
   * @param {object} conf        Same options as TabDatatable constructor, plus
   *                             conf.vnetId
   */
  function Table(dataTableId, conf) {
    this.conf = conf || {};
    this.dataTableId = dataTableId;

    //this.tabId = TAB_NAME;
    //this.resource = RESOURCE;
    //this.xmlRoot = XML_ROOT;

    this.vnetId = conf.vnetId;

    this.dataTableOptions = {
      "bSortClasses" : false,
      "bDeferRender": true,
      "aoColumnDefs": [
        //{ "bSortable": false, "aTargets": [3,4] },
      ]
    };

    this.columns = [
      Locale.tr("Address Range"),
      Locale.tr("Type"),
      Locale.tr("Start"),
      Locale.tr("End"),
      Locale.tr("Leases")
    ];

    this.selectOptions = {
      "id_index": 1,
      "name_index": 1,
      "select_resource": Locale.tr("Please select an Address Range from the list"),
      "you_selected": Locale.tr("You selected the following Address Range:")
    };

    TabDataTable.call(this);
  }

  Table.prototype = Object.create(TabDataTable.prototype);
  Table.prototype.constructor = Table;
  Table.prototype.elementArray = _elementArray;
  Table.prototype.updateFn = _updateFn;

  return Table;

  /*
    FUNCTION DEFINITIONS
   */

  function _updateFn() {
    var that = this;

    OpenNebulaNetwork.show({
      data : {
        id: that.vnetId
      },
      timeout: true,
      success: function (request, vn){
        var ar_list_array = [];

        var ar_list = Utils.getARList(vn.VNET);

        $.each(ar_list, function(){
          var ar = this;
          var id = ar.AR_ID;
          var divider = "<br>";
          var startips = [];
          var endips = [];

          (ar.IP ? startips.push("IP: "+ar.IP+divider) : null);
          (ar.IP_END ? endips.push("IP: "+ar.IP_END+divider) : null);
          (ar.IP6 ? startips.push("IP6: "+ar.IP6+divider) : null);
          (ar.IP6_END ? endips.push("IP6: "+ar.IP6_END+divider) : null);
          (ar.MAC ? startips.push("MAC: "+ar.MAC+divider) : null);
          (ar.MAC_END ? endips.push("MAC: "+ar.MAC_END+divider) : null);

          ar_list_array.push([
            null,
            id,
            (ar.TYPE ? ar.TYPE : "--"),
            startips,
            endips,
            ProgressBar.html(ar.USED_LEASES, ar.SIZE)
            ]);
        });

        that.updateView(null, ar_list_array, true);
      },
      error: Notifier.onError
    });
  }

  function _elementArray(element_json) {
    return [];
  }
});
