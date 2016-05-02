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
  var Locale = require('utils/locale');

  /*
    CONSTRUCTOR
   */

  return {
    'html': _html,
    'setup': _setup
  };

  /*
    FUNCTION DEFINITIONS
   */

  /**
   * Returns a <ul> html tree
   * @param  {object} tree Recursive structure of elements with attributes
   *                       htmlStr: html to be inserted in this line,
   *                       subTree: array of tree elements. Must exist, can be empty
   * @return {string}      html string
   */
  function _html(tree, collapsed){
    var html;

    if (tree.htmlStr && tree.htmlStr != ""){
      html = '<ul class="labels-tree menu vertical is-active">'+_innerHtml(tree, collapsed)+'</ul>';
    } else {
      html = '<ul class="labels-tree menu vertical">';
      $.each(tree.subTree, function(){
        html += _innerHtml(this, collapsed);
      });
      html += '</ul>';
    }

    return html;
  }

  function _innerHtml(tree, collapsed){
    var html = '<li>';

    if (collapsed) {
      if (tree.subTree.length > 0) {
        html += '<i class="fa fa-fw fa-angle-right"></i> ';
      } else {
        html += '<i class="fa fa-fw fa-tag"></i> ';
      }

      html += tree.htmlStr;
      html += '<ul class="menu vertical is-active" hidden>';
    } else {
      if (tree.subTree.length > 0) {
        html += '<i class="fa fa-fw fa-angle-down"></i> ';
      } else {
        html += '<i class="fa fa-fw fa-tag"></i> ';
      }

      html += tree.htmlStr;
      html += '<i class="fa fa-fw fa-square-o labelsCheckbox right"></i> ';
      html += '<ul class="menu vertical is-active">';
    }

    $.each(tree.subTree, function(){
      html += _innerHtml(this, collapsed);
    });
    html += '</ul></li>';

    return html;
  }

  function _setup(context){
    context.on('click', '.fa-angle-right', function() {
      $('ul:first', $(this).parent('li')).show();
      $(this).removeClass('fa-angle-right');
      $(this).addClass('fa-angle-down');
    });

    context.on('click', '.fa-angle-down', function() {
      $('ul:first', $(this).parent('li')).hide();
      $(this).removeClass('fa-angle-down');
      $(this).addClass('fa-angle-right');
    });

    context.on('click', '.one-label', function() {
      $('.one-label', context).removeClass('active');
      $(this).addClass('active');
    });
  }
});
