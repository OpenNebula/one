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
  var OpenNebulaUser = require('opennebula/user');
  var Sunstone = require('sunstone');
  var TemplateUtils = require('utils/template-utils');

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
      html = '<ul class="labels-tree is-active">'+_innerHtml(tree, collapsed)+'</ul>';
    } else {
      html = '<ul class="labels-tree">';
      $.each(tree.subTree, function(){
        html += _innerHtml(this, collapsed);
      });
      html += '</ul>';
    }

    return html;
  }

  function _innerHtml(tree, collapsed){
    var html = "";

    if (collapsed) {
      if (tree.subTree.length > 0) {
        html = '<li><i class="left tree-toggle fas fa-fw fa-angle-right"></i> ';
      } else {
        var title = $(tree.htmlStr).attr('title');
        var persis = $(tree.htmlStr).attr('persis');
        var yaml = $(tree.htmlStr).attr('yaml');
        var color = _labelHue(title);

        if (title != undefined && title != "") {
          html = '<li style="color:hsl(' + color + ', 90%, 70%);">';
        } else {
          html = '<li>';
        }

        html += '<i class="left fas fa-fw fa-tag"></i> ';
      }

      html += '<div class="labeltree-line">';

      html += tree.htmlStr;
      html += '</div>';
      html += '<ul class="is-active" hidden>';
    } else {
      if (tree.subTree.length > 0) {
        html = '<li><i class="left tree-toggle fas fa-fw fa-angle-down"></i> ';
      } else {
        var title = $(tree.htmlStr).attr('title');
        var persis = $(tree.htmlStr).attr('persis');
        var yaml = $(tree.htmlStr).attr('yaml');
        var color = _labelHue(title);

        if (title != undefined && title != "") {
          html = '<li style="color:hsl(' + color + ', 90%, 70%);">';
        } else {
          html = '<li>';
        }
        if (!yaml) {
          if (!persis) {
            html += '<a class="lock" type="unlock" title="' + title + '"><i class="left fas fa-fw fa-unlock" style="color:hsl(' + color + ', 90%, 70%);"></i></a>';
          } else {
            html += '<a class="lock" type="lock" title="' + title + '"><i class="left fas fa-fw fa-lock" style="color:hsl(' + color + ', 90%, 70%);"></i></a>';
          }
        }
        html += '<i class="left fas fa-fw fa-tag"></i> ';
      }

      html += '<div class="labeltree-line">';
      html += '<i class="fas fa-fw fa-square labelsCheckbox"></i> ';

      html += tree.htmlStr;
      html += '</div>';
      html += '<ul class="is-active">';
    }

    $.each(tree.subTree, function(){
      html += _innerHtml(this, collapsed);
    });
    html += '</ul></li>';

    return html;
  }

  function _setup(context){
    context.on('click', '.fa-angle-right', function() {
      $('ul:first', $(this).closest('li')).show();
      $(this).removeClass('fa-angle-right');
      $(this).addClass('fa-angle-down');
    });

    context.on('click', '.fa-angle-down', function() {
      $('ul:first', $(this).closest('li')).hide();
      $(this).removeClass('fa-angle-down');
      $(this).addClass('fa-angle-right');
    });

    context.on('click', '.labeltree-line', function() {
      var active = $('.one-label',this).hasClass('active');

      $('.one-label', context).removeClass('active');

      if (!active){
        $('.one-label', this).addClass('active');
      }
    });

    $(".lock", context).on("click", function(){
      var type = $(this).attr("type");
      var title = $(this).attr("title");
      if (type == "unlock"){
        $(".fa-unlock", this).attr("class", "left fas fa-fw fa-lock");
        $(this).attr("type", "lock");
      } else {
        $(".fa-lock", this).attr("class", "left fas fa-fw fa-unlock");
        $(this).attr("type", "unlock");
      }
      var that = this;
      OpenNebulaUser.show({
        data : {
          id: config['user_id']
        },
        success: function(request, user_json) {
          var final_template = {};
          if (user_json["USER"]["TEMPLATE"]) {
            if (user_json["USER"]["TEMPLATE"]["LABELS"]) {
              var titles = user_json["USER"]["TEMPLATE"]["LABELS"].split(",");
              var pos = titles.indexOf(title);
              if (type == "lock" && pos != -1){ //unlock
                titles.splice(pos, 1);
                $(this).removeAttr("locked");
              } else if (type == "unlock" && pos == -1) { //lock
                titles.push(title);
                $(this).attr("locked", "true");
              }
              user_json["USER"]["TEMPLATE"]["LABELS"] = titles.join(",");
            } else {
              user_json["USER"]["TEMPLATE"]["LABELS"] = title;
            }
            if (user_json["USER"]["TEMPLATE"]["LABELS"] == ""){
              delete user_json["USER"]["TEMPLATE"]["LABELS"];
            }
            template_str = TemplateUtils.templateToString(user_json["USER"]["TEMPLATE"]);
            Sunstone.runAction("User.update_template", config['user_id'], template_str);
          }
        }
        });
    });
  }

  // http://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/
  function _labelHue(s) {
    var hash = 0, i, chr, len;
    if (s.length === 0) return hash;
    for (i = 0, len = s.length; i < len; i++) {
      chr   = s.charCodeAt(i);
      hash  = ((hash << 5) - hash) + chr;
      hash |= 0; // Convert to 32bit integer
    }
    return (Math.abs(hash) % 37) * 10;
  };
});
