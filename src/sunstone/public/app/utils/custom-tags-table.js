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
  var TemplateHTML = require("hbs!./custom-tags-table/html");
  var RowTemplateHTML = require("hbs!./custom-tags-table/row");
  var VectorRowTemplateHTML = require("hbs!./custom-tags-table/vector-row");
  var VectorAttributeRowTemplateHTML = require("hbs!./custom-tags-table/vector-attribute-row");
  var TemplateUtils = require("utils/template-utils");
  var WizardFields = require("utils/wizard-fields");
  var Sunstone = require("sunstone");
  var removedStyles = false;

  var showMandatory = false;
  var showDefault = false;
  var deleteTags = ["VCENTER_CUSTOMIZATION_SPEC", "LXC_UNPRIVILEGED"];

  function _reset(){
    showDefault = false;
    showMandatory = false;
  }

  function _html(classTable, classButton, removeStyles, mandatory, deflt){
    var classTableName = classTable && classTable.length>0 ? classTable : "";
    var classButtonName = classButton && classButton.length>0 ? classButton : "";
    if(mandatory){
      showMandatory = true;
    }
    if(deflt){
      showDefault = true;
    }
    if(removeStyles){
      removedStyles = removeStyles;
    }

    return TemplateHTML({
      "titleKey": Locale.tr("Name"),
      "titleMandatory": showMandatory ? Locale.tr("Type") : "",
      "titleValue": Locale.tr("Value"),
      "titleDefault": showDefault? Locale.tr("Default Value"): "",
      "classTable": classTableName,
      "classButton": classButtonName
    });
  }

  function _setup(context, hide_vector_button, resourceType, element, elementID){
    if (!hide_vector_button) {
      hide_vector_button = false;
    }
    context.off("click", ".add_custom_tag");
    context.on("click", ".add_custom_tag", function(){
      $("tbody.custom_tags", context).append(
        RowTemplateHTML({
          styles: !removedStyles,
          mandatory: showMandatory? "M" : "",
          valueDefault: showDefault? " " : ""
        })
      );
      if(hide_vector_button){
        $(".change_to_vector_attribute", context).hide();
        $(".custom_tag_value",context).focusout(function(){
          var key = $(".custom_tag_key",this.parentElement.parentElement).val();
          if(element && !element.CAPACITY){
            element.CAPACITY = {};
          }
          if(element && element.CAPACITY){
            element.CAPACITY[key] = this.value;
            Sunstone.runAction(resourceType+".update_template",elementID, TemplateUtils.templateToString(element));
          }
        });
      }
    });

    //remove selected optional mandatory
    context.off("change", ".custom_tag_mandatory");
    context.on("change", ".custom_tag_mandatory", function(e){
      var select = $(this);
      var selected = select.find("option:selected");
      selected.attr("selected","selected");
      select.find("option[value!="+selected.val()+"]").removeAttr("selected");
    });

    context.off("click", ".add_vector_attribute");
    context.on("click", ".add_vector_attribute", function(){
      var tbody = $("tbody.custom_vector_attributes", $(this).closest("table"));
      tbody.append(VectorAttributeRowTemplateHTML());
    });

    context.off("click", ".change_to_vector_attribute");
    context.on("click", ".change_to_vector_attribute", function(){
      var td = $($(this).closest("table")).parent();
      var tr = $(td).parent();
      $(".change_to_vector_attribute", td).addClass("add_vector_attribute").removeClass("change_to_vector_attribute");
      $("tbody.custom_body", td).addClass("custom_vector_attributes").removeClass("custom_body");
      $(".custom_tag_key", tr).addClass("custom_vector_key").removeClass("custom_tag_key").css("margin-top", "5px");
      $("tbody.custom_vector_attributes", td).append(VectorAttributeRowTemplateHTML({
        key: $("textarea.custom_tag_value", td).val()
      }));
      $("textarea.custom_tag_value", td).remove();
    });

    $(".add_custom_tag", context).trigger("click");
    context.on("click", "tbody.custom_tags i.remove-tab", function(){
      var tr = $(this).closest("tr");
      tr.remove();
      if(hide_vector_button){
        var key = $(".custom_tag_key",this.parentElement.parentElement.parentElement).val();
        if(element && element.CAPACITY && element.CAPACITY[key] && elementID){
          delete element.CAPACITY[key];
          Sunstone.runAction(resourceType+".update_template",elementID, TemplateUtils.templateToString(element));
        }
      }
    });
  }

  // context is the container div of customTagsHtml()
  function _retrieveCustomTags(context){
    var template_json = {};
    $("tbody.custom_tags tr", context).each(function(){
      if ($(".custom_tag_key", $(this)).val()) {
        var key = WizardFields.retrieveInput($(".custom_tag_key", $(this)));
        template_json[key] = WizardFields.retrieveInput($(".custom_tag_value", $(this)));
      }

      if ($(".custom_vector_key", $(this)).val()) {
        var vectorAttributes = {};

        $("tbody.custom_vector_attributes tr", $(this)).each(function(){
          var key = WizardFields.retrieveInput($(".custom_vector_attribute_key", $(this)));
          if (key) {
            vectorAttributes[key] = WizardFields.retrieveInput($(".custom_vector_attribute_value", $(this)));
          }
        });

        if (!$.isEmptyObject(vectorAttributes)){
          var key = WizardFields.retrieveInput($(".custom_vector_key", $(this)));
          template_json[key] = vectorAttributes;
        }
      }
    });

    return template_json;
  }

  // context is the container div of customTagsHtml()
  // template_json are the key:values that will be put into the table
  function _fillCustomTags(context, templateJson){
    $("tbody.custom_tags i.remove-tab", context).trigger("click");

    var template_json = $.extend({}, templateJson);

    //remove tags
    deleteTags.forEach(element => {
      delete template_json[element];
    });

    $.each(template_json, function(key, value){
      if (typeof value === "object") {
        $("tbody.custom_tags", context).append(
          VectorRowTemplateHTML({key: key, value: value})
        );
      } else {
        var val = TemplateUtils.escapeDoubleQuotes(value);
        $("tbody.custom_tags", context).append(
          RowTemplateHTML({
            key: key,
            value: val,
            mandatory: showMandatory ? "M": "",
            valueDefault: showDefault? " ": ""
          })
        );
      }
    });
  }

  return {
    "html": _html,
    "setup": _setup,
    "retrieve": _retrieveCustomTags,
    "fill": _fillCustomTags,
    "reset": _reset
  };
});
