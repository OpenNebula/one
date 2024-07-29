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
  function _html(tree){
    var html;

    if (tree.htmlStr && tree.htmlStr != ""){
      html = '<ul class="tree">'+_innerHtml(tree)+'</ul>';
    } else {
      html = '<ul class="tree">';
      $.each(tree.subTree, function(){
        html += _innerHtml(this);
      });
      html += '</ul>';
    }

    return html;
  }

  function _innerHtml(tree){
    var html = '<li>'+tree.htmlStr;

    html += '<ul>';
    $.each(tree.subTree, function(){
      html += _innerHtml(this);
    });
    html += '</ul>';

    return html;
  }

  function _setup(context){
  }
});
