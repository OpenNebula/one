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
  //Replaces all class"tip" divs with an information icon that
  //displays the tip information on mouseover.
  var _setup = function(context, position) {
    if (!context) {
      context = $(document);
    }

    $('.tooltip').remove();

    //For each tip in this context
    $('.tip', context).each(function() {
      var obj = $(this);
      obj.removeClass('tip');
      var tip = obj.html();

      obj.html(_html(tip));
    });
  }

  var _html = function(tip) {
    var html =  '<div class="opennebula-tooltip">' +
                  '<i class="fas fa-question-circle"></i>' + 
                  '<span class="opennebula-tooltiptext">' + $.trim(tip) + '</span>' +
                '</div>';
    return html;
  }

  return {
    'setup': _setup,
    'html': _html
  }
})
