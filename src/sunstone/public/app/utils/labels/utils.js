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
  /* DEPENDENCIES */

  var Tree = require('./tree');
  var Sunstone = require('sunstone');
  var OpenNebula = require('opennebula');
  var Locale = require('utils/locale');
  var Notifier = require('utils/notifier');

  var LABELS_ATTR = 'LABELS';

  return {
    'labelsStr': _labelsStr,
    'deserializeLabels': _deserializeLabels,
    'makeTree': _makeTree,
    'insertLabelsMenu': _insertLabelsMenu,
    'insertLabelsDropdown': _insertLabelsDropdown,
    'clearLabelsFilter': _clearLabelsFilter,
    'setLabelsFilter': _setLabelsFilter,
    'getLabels': _getLabels,
    'getLabel': _getLabel
  };

  /* FUNCTION DEFINITIONS */

  /*
    Add labels tree to the left menu
   */
  function _insertLabelsMenu(context, dataTable, labelsColumn, labelsPath) {
    var labels = _getLabels(dataTable, labelsColumn, labelsPath);
    $('.labels-tree', context).remove();
    context.append(Tree.html(_makeTree(labels), true));
    Tree.setup($('.labels-tree', context));

    /*
      Filter datatable when a label in the left menu is clicked
     */
    context.off('click', '.one-label');
    context.on('click', '.one-label', function() {
      var regExp = [];
      var label = $(this).attr('one-label-full-name');
      regExp.push('^' + label + '$');
      regExp.push(',' + label + '$');
      regExp.push('^' + label + ',');
      regExp.push(',' + label + ',');
      _setLabelsFilter(dataTable, labelsColumn, regExp.join('|'));
      return false;
    });
  }

  /*
    Generate labels dropdown
   */
  function _insertLabelsDropdown(tabName) {
    var tabTable = Sunstone.getDataTable(tabName);
    var dataTable = tabTable.dataTable;
    var labelsColumn = tabTable.labelsColumn;

    var labels = _getLabels(dataTable, labelsColumn);
    $('#' + tabName + 'LabelsDropdown').html(
      '<div>' +
      '<h6>' + Locale.tr('Edit Labels') + '</h6>' +
      Tree.html(_makeTree(labels), false) +
      '<div class="input-container">' +
        '<input type="text" class="newLabelInput" placeholder="' + Locale.tr("Add Label") + '"/>' +
      '</div>' +
      '</div>');

    /*
      Update Dropdown with selected items
      [v] If all the selected items has a label
      [-] If any of the selected items has a label
      [ ] If no selected item has an existing label
     */
    function recountLabels() {
      // Generate Hash with labels and number of items
      var labelsStr, labelsIndexed = {};

      var selectedItems = tabTable.elements();
      $.each(selectedItems, function(index, resourceId) {
        labelsStr = _getLabel(dataTable, labelsColumn, resourceId);
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

      // Set checkboxes (check|minus) depending on the number of items
      var labelsDropdown = $('#' + tabName + 'LabelsDropdown');

      // Reset label checkboxes
      $('.labelsCheckbox', labelsDropdown)
        .removeClass('fa-minus-square-o')
        .removeClass('fa-check-square-o')
        .addClass('fa-square-o');

      var labelsCheckbox;
      $.each(labelsIndexed, function(labelName, numberOfItems) {
        labelsCheckbox = $('.labelsCheckbox', 
          $('[one-label-full-name="' + labelName + '"]', labelsDropdown).closest('li'));
        if (labelsCheckbox.length > 0) {
          if (numberOfItems == selectedItems.length) {
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

      $('.newLabelInput', labelsDropdown).focus();
    }
    
    recountLabels();
    $('[data-dropdown="' + tabName + 'LabelsDropdown"]').off('click');
    $('[data-dropdown="' + tabName + 'LabelsDropdown"]').on('click', function(){
      recountLabels();
    });

    /*
      Check/Uncheck label & Update Templates
     */
    $('#' + tabName + 'LabelsDropdown').off('click', '.labelsCheckbox');
    $('#' + tabName + 'LabelsDropdown').on('click', '.labelsCheckbox', function() {
      var action;
      if ($(this).hasClass('fa-square-o')) {
        action = 'add';
        $(this).removeClass('fa-square-o').addClass('fa-check-square-o');
      } else {
        action = 'remove';
        $(this).removeClass('fa-check-square-o fa-minus-square-o').addClass('fa-square-o');
      }

      var labelName = $('.one-label', $(this).parent('li')).attr('one-label-full-name');
      var labelsArray, labelIndex;
      var selectedItems = tabTable.elements();
      $.each(selectedItems, function(index, resourceId) {
        labelsStr = _getLabel(dataTable, labelsColumn, resourceId);
        if (labelsStr != '') {
          labelsArray = labelsStr.split(',')
        } else {
          labelsArray = []
        }

        labelIndex = $.inArray(labelName, labelsArray);
        if (action == 'add' && labelIndex == -1) {
          labelsArray.push(labelName)
          _updateResouceLabels(tabName, resourceId, labelsArray);
        } else if (action == 'remove' && labelIndex != -1) {
          labelsArray.splice(labelIndex, 1);
          _updateResouceLabels(tabName, resourceId, labelsArray);
        }
      });
    });

    /*
      Add a new label when ENTER is presed in the input
     */
    $('#' + tabName + 'LabelsDropdown').off('keypress', '.newLabelInput');
    $('#' + tabName + 'LabelsDropdown').on('keypress', '.newLabelInput', function(e) {
      var ev = e || window.event;
      var key = ev.keyCode;

      if (key == 13 && !ev.altKey) {
        var labelName = $(this).val();
        var labelsArray, labelIndex;
        var selectedItems = tabTable.elements();
        $.each(selectedItems, function(index, resourceId) {
          labelsStr = _getLabel(dataTable, labelsColumn, resourceId);
          if (labelsStr != '') {
            labelsArray = labelsStr.split(',')
          } else {
            labelsArray = []
          }

          labelIndex = $.inArray(labelName, labelsArray);
          if (labelIndex == -1) {
            labelsArray.push(labelName);
            _updateResouceLabels(tabName, resourceId, labelsArray);
          }
        });

        ev.preventDefault();
      }
    });
  }

  function _updateResouceLabels(tabName, resourceId, labelsArray) {
    var templateStr = LABELS_ATTR + '="' + labelsArray.join(',') + '"';
    var resource = Sunstone.getResource(tabName);
    var tabTable = Sunstone.getDataTable(tabName);

    OpenNebula[resource].append({
      timeout: true,
      data : {
          id: resourceId,
          extra_param: templateStr
      },
      success: function(request) {
        OpenNebula[resource].show({
          timeout: true,
          data : {
              id: resourceId
          },
          success: function(request, response) {
            tabTable.updateElement(request, response);
            if (Sunstone.rightInfoVisible($('#' + tabName))) {
              Sunstone.insertPanels(tabName, response);
            }

            _insertLabelsMenu(tabName);
            _insertLabelsDropdown(tabName);
          },
          error: Notifier.onError
        });
      },
      error: Notifier.onError
    })
  }

  function _labelsStr(elementTemplate) {
    return elementTemplate[LABELS_ATTR];
  }

  function _deserializeLabels(labelsStr) {
    var indexedLabels = {};

    if (labelsStr) {
      var parent;
      $.each(labelsStr.split(','), function() {
        parent = indexedLabels;
        $.each(this.split('/'), function() {
          if (parent[this] == undefined) {
            parent[this] = {};
          }
          parent = parent[this];
        });
      });
    }

    return indexedLabels;
  }

  function _makeTree(indexedLabels) {
    var treeRoot = {
      htmlStr : '',
      subTree : []
    };

    $.each(indexedLabels, function(folderName, childs) {
      treeRoot.subTree.push(_makeSubTree('', folderName, childs));
    });

    return treeRoot;
  }

  function _makeSubTree(parentName, folderName, childs) {
    var fullName = parentName + folderName;
    var htmlStr = 
      '<span class="secondary one-label" title="' + fullName + '" one-label-full-name="' + fullName + '">' +
        folderName +
      '</span>';

    var tree = {
      htmlStr: htmlStr,
      subTree: []
    };

    $.each(childs, function(subFolderName, subChilds) {
      tree.subTree.push(_makeSubTree(fullName + '/', subFolderName, subChilds));
    });

    return tree;
  }

  /*
    dataTable Filters
   */

  function _setLabelsFilter(dataTable, labelsColumn, regExp) {
    dataTable.fnFilter(regExp, labelsColumn, true, false);
  }

  function _clearLabelsFilter(dataTable, labelsColumn) {
    dataTable.fnFilter('', labelsColumn, true, false);
  }

  function _getLabels(dataTable, labelsColumn, labelsPath) {
    var labels = [];
    var tmp;
    $.each(dataTable.fnGetData(), function() {
      if (labelsPath) {
        tmp = this;
        $.each(labelsPath.split('.'), function() {
          if (tmp) {
            tmp = tmp[this];
          }
        });
        if (tmp && tmp != '') {
          labels.push(tmp);
        }
      } else {
        if (this[labelsColumn] != '') {
          labels.push(this[labelsColumn]);
        }
      }
    })
    return _deserializeLabels(labels.join(','));
  }

  function _getLabel(dataTable, labelsColumn, resourceId) {
    var nodes = dataTable.fnGetNodes();
    var tr = $('.check_item[value="' + resourceId + '"]', nodes).closest('tr');
    var aData = dataTable.fnGetData(tr);
    return aData[labelsColumn];
  }
});
