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

  var Tree = require('utils/tree');
  var TemplateUtils = require('utils/template-utils');
  var TableTemplate = require('hbs!./tag-filter/table');
  var Sunstone = require('sunstone');

  var TEMPLATE_ATTR = 'TEMPLATE';
  var TAGS_ATTR = 'TAGS';

  /* CONSTRUCTOR */

  /*
    @param {Object} opts Options for the slider
      opts.element
      opts.resource
      opts.xmlRoot
   */
  function TagFilter(opts) {
    this.element = opts.element;
    this.resource = opts.resource;
    this.xmlRoot = opts.xmlRoot;
    this.tags = opts.element[TEMPLATE_ATTR][TAGS_ATTR];

    return this;
  };

  TagFilter.prototype.html = _html;
  TagFilter.prototype.setup = _setup;

  return TagFilter;

  /* FUNCTION DEFINITIONS */

  function _html() {
    var tagsTreeHTML = Tree.html(_makeTree(_deserializeTags(this.tags)));
    return TableTemplate({
      'tagsTreeHTML': tagsTreeHTML
    })
  }

  function _setup(context) {
    var that = this;
    context.off("click", ".addTag");
    context.on("click", ".addTag", function(){
      var tags = _retrieveTags(context);
      var newTag = $(".newTag", context).val();
      tags.push(newTag);

      var templateObj = that.element[TEMPLATE_ATTR];
      templateObj[TAGS_ATTR] = tags.join();
      templateStr  = TemplateUtils.templateToString(templateObj);

      Sunstone.runAction(that.resource + ".update_template", that.element.ID, templateStr);
      return false;
    });

    // Capture the enter key
    context.off("keypress", '.newTag');
    context.on("keypress", '.newTag', function(e) {
      var ev = e || window.event;
      var key = ev.keyCode;

      if (key == 13 && !ev.altKey) {
        //Get the button the user wants to have clicked
        $('.addTag', context).click();
        ev.preventDefault();
      }
    });

    context.off('click', '.remove-tab');
    context.on('click', '.remove-tab', function() {
      $(this).closest('li').remove();
      
      var tags = _retrieveTags(context);
      var templateObj = that.element[TEMPLATE_ATTR];
      templateObj[TAGS_ATTR] = tags.join();
      templateStr  = TemplateUtils.templateToString(templateObj);
      Sunstone.runAction(that.resource + ".update_template", that.element.ID, templateStr);
      return false;
    });
  }

  function _retrieveTags(context) {
    return $('.one-tag', context).map(function() {
      return $(this).attr('one-tag-full-name');
    }).get();
  }

  function _deserializeTags(tags) {
    var indexedTags = {};

    if (tags) {
      var parent;
      $.each(tags.split(','), function() {
        parent = indexedTags;
        $.each(this.split('/'), function() {
          if (parent[this] == undefined) {
            parent[this] = {};
          }
          parent = parent[this];
        });
      });
    }

    return indexedTags;
  }

  function _makeTree(indexedTags) {
    var treeRoot = {
      htmlStr : '',
      subTree : []
    };

    $.each(indexedTags, function(folderName, childs) {
      treeRoot.subTree.push(_makeSubTree('', folderName, childs));
    });

    return treeRoot;
  }

  function _makeSubTree(parentName, folderName, childs) {
    var fullName = parentName + folderName;
    var htmlStr = 
      '<span class="label secondary one-tag" one-tag-full-name="' + fullName + '">' + 
        folderName + 
        ' <i class="fa fa-times-circle remove-tab"></i>' + 
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
