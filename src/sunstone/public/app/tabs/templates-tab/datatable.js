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
    var labels = LabelsUtils.deserializeLabels(that.labels.join(','));

    /*
      Add labels tree to the left menu
     */
    $('.labels-tree', '#li_' + TAB_NAME).remove();
    $('#li_' + TAB_NAME).append(Tree.html(LabelsUtils.makeTree(labels), true));
    Tree.setup($('.labels-tree', '#li_' + TAB_NAME));

    /*
      Filter datatable when a label in the left menu is clicked
     */
    $('#li_' + TAB_NAME).off('click', '.one-label');
    $('#li_' + TAB_NAME).on('click', '.one-label', function() {
      var regExp = [];
      var label = $(this).attr('one-label-full-name');
      regExp.push('^' + label + '$');
      regExp.push(',' + label + '$');
      regExp.push('^' + label + ',');
      regExp.push(',' + label + ',');
      that.setLabelsFilter(regExp.join('|'));
      return false;
    });

    /*
      Generate labels dropdown content
     */
    $('#' + TAB_NAME + 'LabelsDropdown').html(
      '<div>' +
      '<h6>' + Locale.tr('Edit Labels') + '</h6>' +
      Tree.html(LabelsUtils.makeTree(labels), false) +
      '<div class="input-container">' +
        '<input type="text" class="newLabelInput" placeholder="' + Locale.tr("Add Label") + '"/>' +
      '</div>' +
      '</div>');

    recountLabels();

    // Check label & Update Templates
    $('#' + TAB_NAME + 'LabelsDropdown').off('click');
    $('#' + TAB_NAME + 'LabelsDropdown').on('click', '.labelsCheckbox', function() {
      var action;
      if ($(this).hasClass('fa-square-o')) {
        action = 'add';
        $(this).removeClass('fa-square-o').addClass('fa-check-square-o');
      } else {
        action = 'remove';
        $(this).removeClass('fa-check-square-o fa-minus-square-o').addClass('fa-square-o');
      }

      var labelName = $('.one-label', $(this).parent('li')).attr('one-label-full-name');
      var resourceId, aData, labelsArray, labelIndex;
      $('.check_item:checked', that.dataTable).each(function() {
        resourceId = $(this).val();
        aData = that.dataTable.fnGetData($(this).closest('tr'));
        labelsArray = aData[LABELS_COLUMN] != '' ? aData[LABELS_COLUMN].split(',') : [];
        labelIndex = $.inArray(labelName, labelsArray);

        if (action == 'add' && labelIndex == -1) {
          labelsArray.push(labelName)
          updateResouceLabels(resourceId, labelsArray);
        } else if (action == 'remove' && labelIndex != -1) {
          labelsArray.splice(labelIndex, 1);
          updateResouceLabels(resourceId, labelsArray);
        }
      });
    });

    // Capture the enter key
    $('#' + TAB_NAME + 'LabelsDropdown').off('keypress', '.newLabelInput');
    $('#' + TAB_NAME + 'LabelsDropdown').on('keypress', '.newLabelInput', function(e) {
      var ev = e || window.event;
      var key = ev.keyCode;

      if (key == 13 && !ev.altKey) {
        var labelName = $(this).val();
        var resourceId, aData, labelsArray, labelIndex;
        $('.check_item:checked', that.dataTable).each(function() {
          resourceId = $(this).val();
          aData = that.dataTable.fnGetData($(this).closest('tr'));
          labelsArray = aData[LABELS_COLUMN] != '' ? aData[LABELS_COLUMN].split(',') : [];
          labelIndex = $.inArray(labelName, labelsArray);
          if (labelIndex == -1) {
            labelsArray.push(labelName)
            that.labels.push(labelName)
            updateResouceLabels(resourceId, labelsArray);
          }
        });

        ev.preventDefault();
      }
    });

    function updateResouceLabels(resourceId, labelsArray) {
      var templateStr = LabelsUtils.LABELS_ATTR + '="' + labelsArray.join(',') + '"';

      OpenNebula[RESOURCE].append({
        timeout: true,
        data : {
            id: resourceId,
            extra_param: templateStr
        },
        success: function(request) {
          OpenNebula[RESOURCE].show({
            timeout: true,
            data : {
                id: resourceId
            },
            success: function(request, response) {
              that.updateElement(request, response);
              that.postUpdateView();
            },
            error: Notifier.onError
          });
        },
        error: Notifier.onError
      })
    }

    /* 
      DataTable Checkbox Listener
     */
    that.dataTable.on('change', 'tbody .check_item', recountLabels);

    /*
      Update Dropdown with selected items
      [v] If all the selected items has a label
      [-] If any of the selected items has a label
      [ ] If no selected item has an existing label
     */
    function recountLabels() {
      // Generate Hash with labels and number of items
      var aData, labelsStr, labelsIndexed = {};
      var selectedItems = $('.check_item:checked', that.dataTable);
      selectedItems.each(function() {
        aData = that.dataTable.fnGetData($(this).closest('tr'));
        labelsStr = aData[LABELS_COLUMN];
        if (labelsStr != '') {
          $.each(labelsStr.split(','), function(){
            if (labelsIndexed[this]) {
              labelsIndexed[this] += 1
            } else {
              labelsIndexed[this] = 1
            }
          })
        }
      });

      // Reset label checkboxes
      $('.labelsCheckbox', labelsDropdown)
        .removeClass('fa-minus-square-o')
        .removeClass('fa-check-square-o')
        .addClass('fa-square-o');

      // Set checkboxes (check|minus) depending on the number of items
      var selectedItemsLength = selectedItems.length;
      var labelsCheckbox;
      var labelsDropdown = $('#' + TAB_NAME + 'LabelsDropdown');
      $.each(labelsIndexed, function(labelName, numberOfItems) {
        labelsCheckbox = $('.labelsCheckbox', 
          $('[one-label-full-name="' + labelName + '"]', labelsDropdown).closest('li'));
        if (labelsCheckbox.length > 0) {
          if (numberOfItems == selectedItemsLength) {
            $(labelsCheckbox[0])
              .removeClass('fa-square-o')
              .addClass('fa-check-square-o');
          } else {
            $(labelsCheckbox[0])
              .removeClass('fa-square-o')
              .addClass('fa-minus-square-o');
          }
        }
      });
    }
  }

  function _setLabelsFilter(regExp) {
    this.dataTable.fnFilter(regExp, LABELS_COLUMN, true, false);
  }

  function _clearLabelsFilter() {
    this.dataTable.fnFilter('', LABELS_COLUMN, true, false);
  }
});
