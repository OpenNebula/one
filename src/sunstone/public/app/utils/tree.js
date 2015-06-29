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