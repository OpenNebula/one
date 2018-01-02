/* -------------------------------------------------------------------------- */
/* Copyright 2002-2018, OpenNebula Project, OpenNebula Systems                */
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
  var WizardFields = require('utils/wizard-fields');
  var Sunstone = require('sunstone');

  function _html(){
    return TemplateHTML();
  }

  function _setup(context, hide_vector_button, resourceType, element, elementID){
    if (!hide_vector_button) {
      hide_vector_button = false;
    }
    context.off("click", ".add_custom_tag");
    context.on("click", ".add_custom_tag", function(){
      $("tbody.custom_tags", context).append(RowTemplateHTML());
      if(hide_vector_button){
        $(".change_to_vector_attribute", context).hide();
        $(".custom_tag_value",context).focusout(function(){
          var key = $(".custom_tag_key",this.parentElement.parentElement).val();
          if(element && !element.CAPACITY){
            element.CAPACITY = {};
          }
          element.CAPACITY[key] = this.value;
          Sunstone.runAction(resourceType+".update_template",elementID, TemplateUtils.templateToString(element));
        });
      }
    });

    context.off("click", ".add_vector_attribute");
    context.on("click", ".add_vector_attribute", function(){
      var tbody = $("tbody.custom_vector_attributes", $(this).closest('table'));
      tbody.append(VectorAttributeRowTemplateHTML());
    });

    context.off("click", ".change_to_vector_attribute");
    context.on("click", ".change_to_vector_attribute", function(){
      var td = $($(this).closest('table')).parent();
      var tr = $(td).parent();
      $('.change_to_vector_attribute', td).addClass('add_vector_attribute').removeClass('change_to_vector_attribute');
      $('tbody.custom_body', td).addClass('custom_vector_attributes').removeClass('custom_body');
      $('.custom_tag_key', tr).addClass('custom_vector_key').removeClass('custom_tag_key').css('margin-top', '5px');
      $('tbody.custom_vector_attributes', td).append(VectorAttributeRowTemplateHTML({
        key: $('textarea.custom_tag_value', td).val()
      }));
      $('textarea.custom_tag_value', td).remove();
    });

    $(".add_custom_tag", context).trigger("click");

    context.on("click", "tbody.custom_tags i.remove-tab", function(){
      var tr = $(this).closest('tr');
      tr.remove();
      if(hide_vector_button){
        var key = $(".custom_tag_key",this.parentElement.parentElement.parentElement).val()
        if(element && element.CAPACITY && element.CAPACITY[key]){
          delete element.CAPACITY[key];
          Sunstone.runAction(resourceType+".update_template",elementID, TemplateUtils.templateToString(element));
        }
      }
    });
  }

  // context is the container div of customTagsHtml()
  function _retrieveCustomTags(context){
    var template_json = {};

    $('tbody.custom_tags tr', context).each(function(){
      if ($('.custom_tag_key', $(this)).val()) {
        var key = WizardFields.retrieveInput($('.custom_tag_key', $(this)));
        template_json[key] = WizardFields.retrieveInput($('.custom_tag_value', $(this)));
      }

      if ($('.custom_vector_key', $(this)).val()) {
        var vectorAttributes = {};

        $('tbody.custom_vector_attributes tr', $(this)).each(function(){
          var key = WizardFields.retrieveInput($('.custom_vector_attribute_key', $(this)));
          if (key) {
            vectorAttributes[key] = WizardFields.retrieveInput($('.custom_vector_attribute_value', $(this)));
          }
        });

        if (!$.isEmptyObject(vectorAttributes)){
          var key = WizardFields.retrieveInput($('.custom_vector_key', $(this)));
          template_json[key] = vectorAttributes;
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
        var val = TemplateUtils.escapeDoubleQuotes(value);

        $("tbody.custom_tags", context).append(
                            RowTemplateHTML({
                                key: key,
                                value: val
                              })
                            );
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
