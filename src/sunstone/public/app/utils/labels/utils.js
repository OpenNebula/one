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

  var TEMPLATE_ATTR = 'TEMPLATE';
  var LABELS_ATTR = 'LABELS';

  return {
    'TEMPLATE_ATTR': TEMPLATE_ATTR,
    'LABELS_ATTR': LABELS_ATTR,
    'labelsStr': _labelsStr,
    'deserializeLabels': _deserializeLabels,
    'makeTree': _makeTree
  };

  /* FUNCTION DEFINITIONS */

  function _labelsStr(element) {
    return element[TEMPLATE_ATTR][LABELS_ATTR];
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
      '<span class="secondary one-label" one-label-full-name="' + fullName + '">' + 
        //'<input type="checkbox" class="labelCheckbox"/> ' + 
        folderName + 
        //' <i class="fa fa-times-circle remove-tab"></i>' + 
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
});
