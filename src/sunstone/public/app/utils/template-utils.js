/* -------------------------------------------------------------------------- */
/* Copyright 2002-2016, OpenNebula Project, OpenNebula Systems                */
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
    if (string != undefined && typeof(string) == "string") {
      // Recursive to deal with strings like: 'aa""b"'
      // The second " would not match

      var prev;
      var result = string;

      do {
        prev = result;
        result = prev.replace(/([^\\]|^)"/g, '$1\\"');
      } while (prev != result)

      return result;
    } else {
      return string;
    }
  }

  // Transforms text:
  //  input:      &lt;b&gt;bold&lt;/b&gt; "text"
  //  output:     <b>bold</b> "text"
  function _htmlDecode(value) {
    return $('<div/>').html(value).text();
  }

  // Transforms text:
  //  input:      <b>bold</b> "text"
  //  output:     &lt;b&gt;bold&lt;/b&gt; "text"
  function _htmlEncode(value) {
    return $('<div/>').text(value).html();
  }

  // Transforms an object to an opennebula template string
  function _convert_template_to_string(template_json, unshown_values) {
    if (unshown_values)
      template_json = $.extend({}, template_json, unshown_values);

    var template_str = "";
    $.each(template_json, function(key, value) {
      if (!value) {
        template_str += key + " = \"\"\n";
      } else {
        var values;

        if ($.isArray(value)){
          values = value;
        }else{
          values = [value];
        }

        $.each(values, function(index, element) {
          if (!element) return true;
          // current value can be an object
          if (typeof element == 'object') {
            template_str += key + " = [\n";

            template_str += Object.keys(element).map(function(k){
              return "  " + k + " = \"" + _escapeDoubleQuotes(element[k].toString()) + "\"";
            }).join(",\n")

            template_str += " ]\n";
          } else { // or a string
            template_str += key + " = \"" + _escapeDoubleQuotes(element.toString()) + "\"\n";
          }
        });
      }
    });

    return template_str;
  }

  return {
    'templateToString': _convert_template_to_string,
    'htmlDecode': _htmlDecode,
    'htmlEncode': _htmlEncode,
    'escapeDoubleQuotes': _escapeDoubleQuotes
  };
});

