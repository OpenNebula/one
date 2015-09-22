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

  var Locale = require('utils/locale');
  var TemplateHTML = require('hbs!./custom-tags-table/html');
  var RowTemplateHTML = require('hbs!./custom-tags-table/row');
  var VectorRowTemplateHTML = require('hbs!./custom-tags-table/vector-row');
  var VectorAttributeRowTemplateHTML = require('hbs!./custom-tags-table/vector-attribute-row');
  var TemplateUtils = require('utils/template-utils');

  function _html(){
    return TemplateHTML();
  }

  function _setup(context){
    context.off("click", ".add_custom_tag");
    context.on("click", ".add_custom_tag", function(){
      $("tbody.custom_tags", context).append(RowTemplateHTML());
    });

    context.off("click", ".add_vector_attribute");
    context.on("click", ".add_vector_attribute", function(){
      var tbody = $("tbody.custom_vector_attributes", $(this).closest('table'));
      tbody.append(VectorAttributeRowTemplateHTML());
    });

    $(".add_custom_tag", context).trigger("click");

    context.on("click", "tbody.custom_tags i.remove-tab", function(){
      var tr = $(this).closest('tr');
      tr.remove();
    });
  }

  // context is the container div of customTagsHtml()
  function _retrieveCustomTags(context){
    var template_json = {};

    $('tbody.custom_tags tr', context).each(function(){
      if ($('.custom_tag_key', $(this)).val()) {
        template_json[$('.custom_tag_key', $(this)).val()] = $('.custom_tag_value', $(this)).val();
      }

      if ($('.custom_vector_key', $(this)).val()) {
        var vectorAttributes = {};

        $('tbody.custom_vector_attributes tr', $(this)).each(function(){
          var key = $('.custom_vector_attribute_key', $(this)).val();
          if (key) {
            vectorAttributes[key] = $('.custom_vector_attribute_value', $(this)).val();
          }
        });

        if (!$.isEmptyObject(vectorAttributes)){
          template_json[$('.custom_vector_key', $(this)).val()] = vectorAttributes;
        }
      }
    });

    return template_json;
  }

  // context is the container div of customTagsHtml()
  // template_json are the key:values that will be put into the table
  function _fillCustomTags(context, template_json){
    $("tbody.custom_tags i.remove-tab", context).trigger("click");

    $.each(template_json, function(key, value){
      if (typeof value == 'object') {
        $("tbody.custom_tags", context).append(
                              VectorRowTemplateHTML({key: key, value: value}));
      } else {
        $("tbody.custom_tags", context).append(
                                      RowTemplateHTML({key: key, value: value}));
      }
    });
  }

  return {
    'html': _html,
    'setup': _setup,
    'retrieve': _retrieveCustomTags,
    'fill': _fillCustomTags
  };
});
