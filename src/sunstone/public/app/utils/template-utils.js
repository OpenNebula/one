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
  var Sunstone = require("sunstone");
  var Notifier = require("utils/notifier");

  //Escape doublequote in a string and return it
  function _escapeDoubleQuotes(string) {
    if (string != undefined && typeof(string) === "string") {
      // Recursive to deal with strings like: 'aa""b"'
      // The second " would not match

      var prev;
      var result = string;

      do {
        prev = result;
        result = prev.replace(/([^\\]|^)"/g, "$1\\\"");
      } while (prev != result);

      return result;
    } else {
      return string;
    }
  }

  // Transforms text:
  //  input:      &lt;b&gt;bold&lt;/b&gt; "text"
  //  output:     <b>bold</b> "text"
  function _htmlDecode(value) {
    return $("<div/>").html(value).text();
  }

  // Transforms text:
  //  input:      <b>bold</b> "text"
  //  output:     &lt;b&gt;bold&lt;/b&gt; "text"
  function _htmlEncode(value) {
    return $("<div/>").text(value).html();
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

        if (Array.isArray(value)){
          values = value;
        }else{
          values = [value];
        }

        $.each(values, function(index, element) {
          if (!element) return true;
          // current value can be an object
          if (typeof element === "object") {
            template_str += key + " = [\n";

            template_str += Object.keys(element).map(function(k){
              return "  " + k + " = \"" + _escapeDoubleQuotes(element[k] ? element[k].toString() : "") + "\"";
            }).join(",\n");

            template_str += " ]\n";
          } else { // or a string
            template_str += key + " = \"" + _escapeDoubleQuotes(element? element.toString() : "") + "\"\n";
          }
        });
      }
    });

    return template_str;
  }

  // Transforms an object to an opennebula template string
  function _convert_string_to_template(string_json, unshown_values) {
    var i = 0;
    var characters = [];
    var symbols = [];
    var key, sub_key, value;
    var template_json = {}, obj_aux = {};
    var array = false;
    if(string_json){
      while (i <= string_json.length-1){
        var symbol = symbols[symbols.length-1];
        if(string_json[i] != " " && string_json[i] != "," && string_json[i] != "\n" || symbol == "\""){
          if(string_json[i] == "=" && symbol != "\"" && characters.length > 0 && (!symbol || (symbol && symbol == "["))){
            var key_aux = "";
            while(characters.length > 0){
              key_aux += characters.shift();
            }
            if(!symbol){
              key = key_aux;
              if(template_json[key]){ //exists key, generate Array
                if(!Array.isArray(template_json[key])){
                  var obj = template_json[key];
                  template_json[key] = [];
                  template_json[key].push(obj);
                }
                array = true;
              }else{
                template_json[key] = {};
                array = false;
              }
            }else{
              sub_key = key_aux;
            }
          }
          else if(string_json[i] == "\"" && symbol && symbol == "\"" && characters[characters.length-1] != "\\"){
            symbols.pop();
            var value_aux = "";
            while(characters.length > 0){
              value_aux += characters.shift();
            }
            if(sub_key){
              if (array) {
                obj_aux[sub_key] = value_aux;
              }
              else{
                template_json[key][sub_key] = value_aux;
              }
              sub_key = undefined;
            }else{
              template_json[key] = value_aux;
            }
          }
          else if(string_json[i] == "[" && !symbol){
            symbols.push("[");
          }
          else if(string_json[i] == "\"" && characters[characters.length-1] != "\\"){
            symbols.push("\"");
          }
          else if(string_json[i] == "]" && symbol && symbol == "["){
            symbols.pop();
            if(array){
              template_json[key].push(obj_aux);
              obj_aux = {};
            }
          }
          else{
            if(JSON.stringify(template_json[key]) === "{}" && symbols.length <= 0){ //Empty
              return false;
            }
            else{
              characters.push(string_json[i]);
            }
          }
        }
        i+=1;
      }
    }
    return template_json;
  }

  function _removeHTMLTags(string){
    var rtn = string;
    if(rtn){
      rtn = String(string).replace(/<[^0-9\s=>]+>/g, '');
    }
    return rtn;
  }

  function _fetchOvmfValues() {
    return $.ajax({
      url: '/ovmf_uefis',
      method: 'GET'
    });
  }

  return {
    "stringToTemplate": _convert_string_to_template,
    "templateToString": _convert_template_to_string,
    "htmlDecode": _htmlDecode,
    "htmlEncode": _htmlEncode,
    "escapeDoubleQuotes": _escapeDoubleQuotes,
    "removeHTMLTags": _removeHTMLTags,
    "fetchOvmfValues": _fetchOvmfValues,
  };
});

