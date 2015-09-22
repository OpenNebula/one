/* -------------------------------------------------------------------------- */
/* Copyright 2002-2015, OpenNebula Project (OpenNebula.org), C12G Labs        */
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
  require('foundation.tooltip');
  //Replaces all class"tip" divs with an information icon that
  //displays the tip information on mouseover.
  var _setup = function(context, position) {
    if (!context) {
      context = $(document);
    }

    //For each tip in this context
    $('.tip', context).each(function() {
      var obj = $(this);
      obj.removeClass('tip');
      var tip = obj.html();

      var tip_classes = ['has-tip']
      if (position) {
        tip_classes.push(position)
      }
      //replace the text with an icon and spans
      //obj.html('<span data-tooltip class="' + tip_classes.join(' ') + '" data-width="210" title="' + tip + '"><i class="fa fa-question-circle"></i></span>');
      obj.html('<span title="' + tip + '"><i class="fa fa-question-circle"></i></span>');
    });
  }

  var _html = function(str) {
    //return '<span data-tooltip class="" data-width="210" title="' + str + '"><i class="fa fa-question-circle"></i></span>'
    return '<span title="' + str + '"><i class="fa fa-question-circle"></i></span>';
  }

  return {
    'setup': _setup,
    'html': _html
  }
})
