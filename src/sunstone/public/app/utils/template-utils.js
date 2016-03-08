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
  var Sunstone = require('sunstone');

  //Escape doublequote in a string and return it
  function _escapeDoubleQuotes(string) {
    if (string != undefined) {
      return string.replace(/\\/g, '\\').replace(/"/g, '\\"');
    } else {
      return string;
    }
  }

  function _htmlDecode(value) {
    return $('<div/>').html(value).text();
  }

  // Convert from hash to string
  function _convert_template_to_string(template_json, unshown_values) {
    if (unshown_values)
      template_json = $.extend({}, template_json, unshown_values);

    var template_str = "\n";
    $.each(template_json, function(key, value) {
      // value can be an array
      if (!value) {
        template_str = template_str + key + "=\n";
      } else {
        if (value.constructor == Array) {
          var it = null;
          $.each(value, function(index, element) {
            if (!element) return true;
            // current value can be an object
            if (typeof element == 'object') {
              template_str += key + "=[";
              for (var current_key in element) {
                template_str += current_key + "=\"" + element[current_key].toString().replace(/"/g, "\\\"") + "\",";
              }
              template_str = template_str.substring(0, template_str.length - 1);
              template_str += "]\n";
            } else // or a string
              {
                template_str = template_str + key + "=\"" + element.toString().replace(/"/g, "\\\"") + "\"\n";
              }
          });
        } else // or a single value
        {
          // which in turn can be an object
          if (typeof value == 'object') {
            template_str += key + "=[";
            for (var current_key in value) {
              template_str += current_key + "=\"" + value[current_key].toString().replace(/"/g, "\\\"") + "\",";
            }
            template_str = template_str.substring(0, template_str.length - 1);
            template_str += "]\n";
          } else // or a string
          {
            template_str = template_str + key + "=\"" + value.toString().replace(/"/g, "\\\"") + "\"\n";
          }
        }
      }
    });

    return _htmlDecode(template_str);
  }

  return {
    'templateToString': _convert_template_to_string,
    'htmlDecode': _htmlDecode,
    'escapeDoubleQuotes': _escapeDoubleQuotes
  };
});

