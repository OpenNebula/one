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
  var Notifier = require('utils/notifier');

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

  function _merge_templates(template_master, template_slave, advanced){
    if(!advanced)
      template_slave = _convert_string_to_template(template_slave);
    else
      template_master = _convert_string_to_template(template_master);
    if((advanced && template_master) || (!advanced && template_slave)){
      var template_final = {};
      $.extend(true, template_final, template_slave, template_master);
      return template_final;
    }else{
      Notifier.notifyError(Locale.tr("Advanced template malformed"));
    } 
    return template_master;
  }
  // Transforms an object to an opennebula template string
  function _convert_string_to_template(string_json, unshown_values) {
    string_json = string_json.split("\n").join(" ");
    string_json = string_json.split("   ").join(" ");
    string_json = string_json.split("  ").join(" ");
    var match_symbols = "=[,]"
    var template_json = {};
    var array_string = string_json.split(" ");
    var i = 0;
    var array = false;
    while(i < array_string.length-1){
      if(!array_string[i].match('"') && !array_string[i].match(match_symbols)){ //is key
        var key = array_string[i];
        if(template_json[key]){ //exists key, generate Array
          if(!Array.isArray(template_json[key])){
            var obj = template_json[key];
            template_json[key] = [];
            template_json[key].push(obj);
          }
          array = true;
        }
        else{
          array = false;
        }
        template_json[key];
        i+=1;
        if(array_string[i] == "="){
          i+=1;
          if(array_string[i] != "["){
            var value = "";
            if(key == "DESCRIPTION" && array_string[i][0] == '"' && array_string[i][array_string[i].length-1] != '"'){
              while (array_string[i][array_string[i].length-1] != '"' && i < array_string.length-1){
                value += array_string[i] + " ";
                i+=1;
              }
              if(!value.match("="))
                value = value.split('"').join("");
              else{
                value  = value .slice(0,-1);
                value = value .slice(1);
              }
              if(array){
                template_json[key].push(value);
              }else{
                template_json[key] = value;
              }
              i+=1;
            }
            else if(array_string[i].match('"')){
              value = array_string[i];
              if(!value.match("="))
                value = value.split('"').join("");
              else{
                value  = value .slice(0,-1);
                value = value .slice(1);
              }
              if(array){
                template_json[key].push(value);
              }else{
                template_json[key] = value;
              }
              i+=1;
            }
            else return false;
          }else{
            var obj = {}
            i+=1;
            while(array_string[i] != ']' && i < array_string.length-1){
              var sub_key; 
              if(!array_string[i].match('"') && !array_string[i].match(match_symbols)){
                sub_key = array_string[i];
                i+=1;
                if(array_string[i] == "="){
                  i+=1;
                  if(array_string[i].match('"')){
                    if(array_string[i][array_string[i].length-1] == ","){
                      array_string[i] = array_string[i].slice(0,-1);
                    }
                    var value = array_string[i];
                    obj[sub_key] = value;
                    obj[sub_key] = obj[sub_key].split('"').join("");
                    i+=1;
                  }else return false;
                }else return false;
              }else return false;
            }
            if(array){
              template_json[key].push(obj);
            }else{
              template_json[key] = {};
              template_json[key] = obj;
            }
            i+=1;
          }
        }else return false;
      }else return false; 
    }
    return template_json;
  }

  return {
    'mergeTemplates'  : _merge_templates,
    'stringToTemplate': _convert_string_to_template,
    'templateToString': _convert_template_to_string,
    'htmlDecode': _htmlDecode,
    'htmlEncode': _htmlEncode,
    'escapeDoubleQuotes': _escapeDoubleQuotes
  };
});

