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
  var Locale = require('utils/locale');
  var Humanize = require('utils/humanize');
  var LabelsUtils = require('utils/labels/utils');
  var Tree = require('utils/labels/tree');

  /*
    CONSTANTS
   */

  var RESOURCE = "Template";
  var XML_ROOT = "VMTEMPLATE";
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

  return Table;

  /*
    FUNCTION DEFINITIONS
   */

  function _elementArray(element_json) {
    var element = element_json[XML_ROOT];

    var labelsStr = LabelsUtils.labelsStr(element);
    if (labelsStr) {
      this.labels.push(labelsStr);
    }

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
    this.labels = [];
  }

  function _postUpdateView() {
    var that = this;
    var labels = LabelsUtils.deserializeLabels(this.labels.join(','));
    /*var labelsDropdown = $('#' + TAB_NAME + 'LabelsDropdown');
    labelsDropdown.html(Tree.html(LabelsUtils.makeTree(labels)));
    labelsDropdown.on('change', '.labelCheckbox', function() {
      var regExp = [];
      var label;
      $('.labelCheckbox:checked', labelsDropdown).each(function() {
        label = $(this).closest('span').attr('one-label-full-name');
        regExp.push('^' + label + '$');
        regExp.push(',' + label + '$');
        regExp.push('^' + label + ',');
        regExp.push(',' + label + ',');
      });

      that.dataTable.fnFilter(regExp.join('|'), 6, true, false);
    });*/
    $('.labels-tree', '#li_' + TAB_NAME).remove();
    $('#li_' + TAB_NAME).append(Tree.html(LabelsUtils.makeTree(labels), true));
    Tree.setup($('.labels-tree', '#li_' + TAB_NAME));

    $('#' + TAB_NAME + 'LabelsDropdown').html(
      '<div>' +
      '<h6>' + Locale.tr('Edit Labels') + '</h6>' +
      Tree.html(LabelsUtils.makeTree(labels), false) +
      '<div class="input-container">' +
        '<input type="text" placeholder="' + Locale.tr("Add Label") + '"/>' +
      '</div>' +
      '</div>');

    $('#li_' + TAB_NAME).off('click', '.one-label');
    $('#li_' + TAB_NAME).on('click', '.one-label', function() {
      var regExp = [];
      var label = $(this).attr('one-label-full-name');
      regExp.push('^' + label + '$');
      regExp.push(',' + label + '$');
      regExp.push('^' + label + ',');
      regExp.push(',' + label + ',');
      that.dataTable.fnFilter(regExp.join('|'), 6, true, false);
      return false;
    });


    /*$('#li_' + TAB_NAME).off('change', '.labelCheckbox');
    $('#li_' + TAB_NAME).on('change', '.labelCheckbox', function() {
      var regExp = [];
      var label;
      $('.labelCheckbox:checked', '#li_' + TAB_NAME).each(function() {
        label = $(this).closest('span').attr('one-label-full-name');
        regExp.push('^' + label + '$');
        regExp.push(',' + label + '$');
        regExp.push('^' + label + ',');
        regExp.push(',' + label + ',');
      });

      that.dataTable.fnFilter(regExp.join('|'), 6, true, false);
      return false;
    });*/
  }

  function _clearLabelsFilter() {
    this.dataTable.fnFilter('', 6, true, false);
  }
});
