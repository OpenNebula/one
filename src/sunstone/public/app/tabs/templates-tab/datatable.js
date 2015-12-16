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
  /*
    DEPENDENCIES
   */

  var TabDataTable = require('utils/tab-datatable');
  var SunstoneConfig = require('sunstone-config');
  var Sunstone = require('sunstone');
  var OpenNebula = require('opennebula');
  var Locale = require('utils/locale');
  var Humanize = require('utils/humanize');
  var LabelsUtils = require('utils/labels/utils');
  var Tree = require('utils/labels/tree');
  var Notifier = require('utils/notifier');

  /*
    CONSTANTS
   */

  var RESOURCE = "Template";
  var XML_ROOT = "VMTEMPLATE";
  var TAB_NAME = require('./tabId');
  var LABELS_COLUMN = 6;

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
      "bAutoWidth": false,
      "bSortClasses" : false,
      "bDeferRender": true,
      "aoColumnDefs": [
          {"bSortable": false, "aTargets": ["check"]},
          {"sWidth": "35px", "aTargets": [0]},
          {"bVisible": true, "aTargets": SunstoneConfig.tabTableColumns(TAB_NAME)},
          {"bVisible": false, "aTargets": ['_all']}
      ]
    }

    this.columns = [
      Locale.tr("ID") ,
      Locale.tr("Owner") ,
      Locale.tr("Group"),
      Locale.tr("Name"),
      Locale.tr("Registration time"),
      Locale.tr("Labels")
    ];

    this.selectOptions = {
      "id_index": 1,
      "name_index": 4,
      "select_resource": Locale.tr("Please select a Template from the list"),
      "you_selected": Locale.tr("You selected the following Template:"),
      "select_resource_multiple": Locale.tr("Please select one or more Templates from the list"),
      "you_selected_multiple": Locale.tr("You selected the following Templates:")
    };

    this.labels = [];

    TabDataTable.call(this);
  };

  Table.prototype = Object.create(TabDataTable.prototype);
  Table.prototype.constructor = Table;
  Table.prototype.elementArray = _elementArray;
  Table.prototype.preUpdateView = _preUpdateView;
  Table.prototype.postUpdateView = _postUpdateView;
  Table.prototype.clearLabelsFilter = _clearLabelsFilter;
  Table.prototype.setLabelsFilter = _setLabelsFilter;
  Table.prototype.getLabels = _getLabels;
  Table.prototype.getLabel = _getLabel;
  Table.prototype.LABELS_COLUMN = LABELS_COLUMN;

  return Table;

  /*
    FUNCTION DEFINITIONS
   */

  function _elementArray(element_json) {
    var element = element_json[XML_ROOT];

    var labelsStr = LabelsUtils.labelsStr(element);

    return [
        '<input class="check_item" type="checkbox" id="' + RESOURCE.toLowerCase() + '_' +
                             element.ID + '" name="selected_items" value="' +
                             element.ID + '"/>',
        element.ID,
        element.UNAME,
        element.GNAME,
        element.NAME,
        Humanize.prettyTime(element.REGTIME),
        (labelsStr||'')
    ];
  }

  function _preUpdateView() {
  }

  function _postUpdateView() {
    LabelsUtils.insertLabelsMenu(TAB_NAME);
    LabelsUtils.insertLabelsDropdown(TAB_NAME);
  }

  function _setLabelsFilter(regExp) {
    this.dataTable.fnFilter(regExp, LABELS_COLUMN, true, false);
  }

  function _clearLabelsFilter() {
    this.dataTable.fnFilter('', LABELS_COLUMN, true, false);
  }

  function _getLabels() {
    var labels = [];
    $.each(this.dataTable.fnGetData(), function() {
      if (this[LABELS_COLUMN] != '') {
        labels.push(this[LABELS_COLUMN]);
      }
    })
    return LabelsUtils.deserializeLabels(labels.join(','));
  }

  function _getLabel(resourceId) {
    var aData = this.getElementData(resourceId, RESOURCE.toLowerCase());
    return aData[this.LABELS_COLUMN];
  }
});
