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
  var Locale = require("utils/locale");
  var Notifier = require("utils/notifier");

  //Replaces all class"tip" divs with an information icon that
  //displays the tip information on mouseover.
  var _setup = function(context, input) {
    if (!context) {
      context = $(document);
    }

    //For each lock in this context
    $('.lock', context).each(function() {
      //replace the text with an icon and spans
      $(this).append($("<i/>",{ class:'fas fa-lock' }));

      // input is default lock
      changeState($(this));

      $(this).click(function() {
        $(this).toggleClass("is-lock is-unlock");
        $(this).find("i").toggleClass("fa-lock fa-unlock");
        changeState($(this));
      });
    });
  }

  function changeState(span) {
    if (span && span instanceof $) {
      var input = span.parent().next();
      var title = span.data("title") || Locale.tr("Unlocked!");
      var message = span.data("msg") || "";

      if (span.hasClass("is-unlock")) {
        changeStateInput(input, false);
        Notifier.notifyCustom(title, message);
      }
      else changeStateInput(input, true);
    }
  }

  function changeStateInput(input, disabled) {
    if (input && input instanceof $ && input.is("input, textarea")) {
      input.attr("disabled", disabled);
    }
  }

  return {
    'setup': _setup
  }
})
