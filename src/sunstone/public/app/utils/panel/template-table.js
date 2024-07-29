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
  /*
    This module insert a table with the template of the resource.
    New KEY=VALUE entries can be added and existing ones can be edited
   */

  var Locale = require('utils/locale');
  var Notifier = require('utils/notifier');
  var Sunstone = require('sunstone');
  var TemplateUtils = require('utils/template-utils');

  // This attributes has special restrictions
  var special_restrictions = {
    // vCenter
    VCENTER_CCR_REF: { edit: false, delete: false },
    VCENTER_HOST: { edit: false, delete: false },
    VCENTER_INSTANCE_ID: { edit: false, delete: false },
    VCENTER_PASSWORD: { edit: true, delete: false },
    VCENTER_USER: { edit: false, delete: false },
    VCENTER_VERSION: { edit: false, delete: false },
    HOT_RESIZE: { edit: false, delete: false, show: false }
  }

  /**
   * Generate the table HTML with the template of the resource and an edit icon
   * @param {Object} templateJSON Resource template (e.g: ZONE.TEMPLATE, IMAGE.TEMPLATE...)
   * @param {String} resourceType Resource type (e.g: Zone, Host, Image...)
   * @param {String} tableName Header of the table (e.g: Locale.tr("Attributes"))
   * @param {String} tableName Header of the table (e.g: Locale.tr("Attributes"))
   * @returns {String} HTML table
   */
  function _html(templateJSON, resourceType, tableName, blockModify) {
    // Start - TEMPLATE TABLE
    const modify = blockModify? false : true
    var html = '<table id="' + resourceType.toLowerCase() + '_template_table" class="dataTable configuration_attrs">\
      <thead>\
        <tr><th colspan="3">' + tableName + '</th></tr>\
      </thead>' +
      fromJSONtoHTMLTable(templateJSON, resourceType, undefined, undefined, modify);

    // Row with form to create new attribute
    html += '<tr>\
      <td class="key_td">\
        <input type="text" name="new_key" id="new_key" />\
      </td>\
      <td class="value_td">\
        <textarea type="text" name="new_value" id="new_value" />\
      </td>\
      <td class="text-right">\
        <button type="button" id="button_add_value" class="button small secondary">\
          <i class="fas fa-lg fa-plus-circle" />\
        </button>\
      </td>\
    </tr>';

    // Close - TEMPLATE TABLE
    html += '</table>';

    return html;
  }

  /**
   * Initialize the table, clicking the edit icon will add an input to edit the value
   * @param {Object} templateJSON Resource template (e.g: ZONE.TEMPLATE, IMAGE.TEMPLATE...)
   * @param {String} resourceType Resource type (e.g: Zone, Host, Image...)
   * @param {String} resourceId ID of the resource
   * @param {jQuery Object} context Selector including the tr
   * @param {Object} unshownValues Values from the original resource template that
   *   have been deleted from the templateJSON param. Without this, a template
   *   update would permanently delete the missing values from OpenNebula
   */
  var _setup = function(templateJSON, resourceType, resourceId, context, unshownValues, templateJSON_Others) {
    if (!templateJSON_Others) {
      templateJSON_Others = templateJSON;
    }

    // Remove previous listeners
    context.off("keypress", "#new_key");
    context.off("keypress", "#new_value");
    context.off("keypress", "#new_value_vectorial");
    context.off("click", "#div_minus");
    context.off("click", "#div_edit");
    context.off("change", ".input_edit_value");
    context.off("click", "#div_edit_vectorial");
    context.off("change", ".input_edit_value_vectorial");
    context.off("click", "#div_minus_vectorial");
    context.off("click", "#button_add_value");
    context.off("click", "#button_add_value_vectorial");
    context.off("click", "#div_add_vectorial");

    // Add listener for add key and add value for Extended Template
    context.on("click", '#button_add_value', function() {
      new_value = $('#new_value', $(this).parent().parent()).val();
      new_key   = $('#new_key', $(this).parent().parent()).val();
      if (!templateJSON[new_key]){
        if (new_key != "") {
          templateJSON = $.extend({}, templateJSON_Others, templateJSON);
          var templateJSON_bk = $.extend({},templateJSON);
          if (templateJSON[$.trim(new_key)] && (templateJSON[$.trim(new_key)] instanceof Array)) {
            templateJSON[$.trim(new_key)].push($.trim(new_value));
          } else {
            templateJSON[$.trim(new_key)] = $.trim(new_value);
          }
          template_str  = TemplateUtils.templateToString(templateJSON, unshownValues);
          Sunstone.runAction(resourceType + ".update_template", resourceId, template_str);
          templateJSON = templateJSON_bk;
        }
      } else {
        Notifier.notifyError(Locale.tr("Not valid attribute"));
      }
    });

    // Capture the enter key
    context.on("keypress", '#new_value', function(e) {
      var ev = e || window.event;
      var key = ev.keyCode;
      if (key == 13 && !ev.altKey) {
        //Get the button the user wants to have clicked
        $('#button_add_value', $(this).parent().parent()).click();
        ev.preventDefault();
      }
    });

    // Listener for single values

    // Listener for key,value pair remove action
    context.on("click", "#div_minus", function() {
      // Remove div_minus_ from the id
      var field = this.firstElementChild.id.substring(10, this.firstElementChild.id.length);
      var list_of_classes = this.firstElementChild.className.split(" ");
      var ocurrence = null;

      if (list_of_classes.length != 1) {
        $.each(list_of_classes, function(_, value) {
          if (value.match(/^ocurrence_/))
          ocurrence = value.substring(10, value.length);;
        });
      }

      var newTemplate = $.extend({}, templateJSON, templateJSON_Others);

      // Erase the value from the template
      if (ocurrence != null) {
        newTemplate[field].splice(ocurrence, 1);
      } else {
          delete newTemplate[field];
      }

      template_str = TemplateUtils.templateToString(newTemplate, unshownValues);

      Sunstone.runAction(resourceType + ".update_template", resourceId, template_str);
    });

    // Listener for key,value pair edit action
    context.on("click", "#div_edit", function() {
      var key_str = this.firstElementChild.id.substring(9, this.firstElementChild.id.length);
      var value_str = $("#value_td_input_" + key_str).text();
      input = $("#value_td_input_" + key_str).html('<textarea class="input_edit_value" id="input_edit_' + key_str + '" type="text"></textarea>');
      $('#input_edit_' + key_str).val(value_str);
      // Capture the enter key
      context.off("keypress", '#input_edit_' + key_str);
      context.on("keypress", '#input_edit_' + key_str, function(e) {
        var ev = e || window.event;
        var key = ev.keyCode;
        if (key == 13 && !ev.altKey) {
          $('#input_edit_' + key_str).blur();
        }
      });
    });

    context.on("change", ".input_edit_value", function() {
      var key_str = $.trim(this.id.substring(11, this.id.length));
      var value_str = $.trim(this.value);
      
      var templateJSON_bk = $.extend({}, templateJSON_Others);

      delete templateJSON_Others[key_str];
      templateJSON_Others[key_str] = value_str;

      templateJSON = $.extend({}, templateJSON, templateJSON_Others);
      template_str = TemplateUtils.templateToString(templateJSON, unshownValues);

      Sunstone.runAction(resourceType + ".update_template", resourceId, template_str);
      templateJSON = templateJSON_bk;
    });

    // Listeners for vectorial attributes
    // Listener for key,value pair edit action for subelement of vectorial key
    context.on("click", "#div_edit_vectorial", function() {
      var key_str = $.trim(this.firstElementChild.id.substring(9, this.firstElementChild.id.length));
      var list_of_classes = this.firstElementChild.className.split(" ");
      var ocurrence = " ";
      var vectorial_key = null;
      if (list_of_classes.length != 1) {
        $.each(list_of_classes, function(index, value) {
          if (value.match(/^ocurrence_/)){
            ocurrence += value + " ";
          }
        });
      }
      if (list_of_classes.length != 1) {
        $.each(list_of_classes, function(index, value) {
          if (value.match(/^vectorial_key_/)){
            vectorial_key = value;
          }
        });
      }
      var value_str = "";
      if (ocurrence != " ") {
        value_str = $.trim($(".value_td_input_" + key_str + "." + ocurrence.substring(1, ocurrence.length - 1) + "." + vectorial_key).text());
        $(".value_td_input_" + key_str + "." + ocurrence.substring(1, ocurrence.length - 1) + "." + vectorial_key).html('<input class="input_edit_value_vectorial' + ocurrence + vectorial_key + '" id="input_edit_' + key_str + '" type="text" value="' + value_str + '"/>');
      } else {
        value_str = $.trim($(".value_td_input_" + key_str + "." + vectorial_key).text());
        $(".value_td_input_" + key_str + "." + vectorial_key).html('<input class="input_edit_value_vectorial' + ocurrence + vectorial_key + '" id="input_edit_' + key_str + '" type="text" value="' + value_str + '"/>');
      }
    });

    context.on("change", ".input_edit_value_vectorial", function() {
      var key_str          = $.trim(this.id.substring(11, this.id.length));
      var value_str        = $.trim(this.value);
      var templateJSON_bk = $.extend({}, templateJSON_Others);
      var list_of_classes  = this.className.split(" ");
      var ocurrence        = null;
      var vectorial_key    = null;
      if (list_of_classes.length != 1) {
        $.each(list_of_classes, function(index, value) {
          if (value.match(/^ocurrence_/)){
            ocurrence = value.substring(10, value.length);
          }
        });
      }
      if (list_of_classes.length != 1) {
        $.each(list_of_classes, function(index, value) {
          if (value.match(/^vectorial_key_/)){
            vectorial_key = value.substring(14, value.length);
          }
        });
      }
      if (ocurrence != null){
        templateJSON_Others[vectorial_key][ocurrence][key_str] = value_str;
      }else{
        templateJSON_Others[vectorial_key][key_str] = value_str;
      }
      templateJSON = $.extend({}, templateJSON_Others, templateJSON);
      template_str = TemplateUtils.templateToString(templateJSON, unshownValues);
      // Let OpenNebula know
      Sunstone.runAction(resourceType + ".update_template", resourceId, template_str);
      templateJSON = templateJSON_bk;
    });
    // Listener for key,value pair remove action
    context.on("click", "#div_minus_vectorial", function() {
      // Remove div_minus_ from the id
      var field = this.firstElementChild.id.substring(10, this.firstElementChild.id.length);
      var list_of_classes = this.firstElementChild.className.split(" ");
      var ocurrence = null;
      var vectorial_key = null;
      if (list_of_classes.length != 1) {
        $.each(list_of_classes, function(_, value) {
          if (value.match(/^ocurrence_/)){
            ocurrence = value.substring(10, value.length);
          }
        });
      }

      if (list_of_classes.length != 1) {
        $.each(list_of_classes, function(_, value) {
          if (value.match(/^vectorial_key_/)){
            vectorial_key = value.substring(14, value.length);
          }
        });
      }
      // Erase the value from the template
      if (ocurrence != null){
        delete templateJSON_Others[vectorial_key][ocurrence][field];
      }else{
        delete templateJSON_Others[vectorial_key][field];
      }
      templateJSON = $.extend({}, templateJSON_Others, templateJSON);
      template_str = TemplateUtils.templateToString(templateJSON, unshownValues);
      // Let OpenNebula know
      Sunstone.runAction(resourceType + ".update_template", resourceId, template_str);
    });
    // Listener for vectorial key,value pair add action
    context.on("click", "#div_add_vectorial", function() {
      if (!$('#button_add_value_vectorial').html()) {
        var list_of_classes = this.firstElementChild.className.split(" ");
        var ocurrence = null;
        var vectorial_key = null;
        if (list_of_classes.length != 1) {
          $.each(list_of_classes, function(_, value) {
            if (value.match(/^ocurrence_/)){
              ocurrence = value;
            }
          });
        }
        if (list_of_classes.length != 1) {
          $.each(list_of_classes, function(_, value) {
            if (value.match(/^vectorial_key_/)){
              vectorial_key = value;
            }
          });
        }
        $(this).parent().parent().after('<tr><td class="key_td"><input type="text" style="text-align:center" name="new_key_vectorial" id="new_key_vectorial" /></td><td class="value_td"><input type="text" name="new_value" id="new_value_vectorial" /></td><td class=""><button class="' + vectorial_key + " " + ocurrence + '" id="button_add_value_vectorial">' + "+" + '</button>\</td></tr>');
      }
    });

    // Add listener for add key and add value for Extended Template
    context.on("click", '#button_add_value_vectorial', function() {
      if ($('#new_value_vectorial').val() != "" && $('#new_key_vectorial').val() != "") {
        var list_of_classes  = this.className.split(" ");
        var ocurrence        = null;
        var vectorial_key    = null;
        var templateJSON_bk = $.extend({}, templateJSON_Others);

        if (list_of_classes.length != 1) {
          $.each(list_of_classes, function(_, value) {
            if (value.match(/^vectorial_key_/)){
              vectorial_key = value;
            }
          });
        }

        if (list_of_classes.length != 1) {
          $.each(list_of_classes, function(index, value) {
            if (value.match(/^ocurrence_/)){
              ocurrence = value;
            }
          });
        }

        vectorial_key = vectorial_key.substring(14, vectorial_key.length);

        if (ocurrence != null) {
          ocurrence = ocurrence.substring(10, ocurrence.length);
          templateJSON_Others[vectorial_key][ocurrence][$('#new_key_vectorial').val()] = $.trim($('#new_value_vectorial').val());
        } else {
          templateJSON_Others[vectorial_key][$('#new_key_vectorial').val()] = $.trim($('#new_value_vectorial').val());
        }
        templateJSON = $.extend({}, templateJSON_Others, templateJSON);
        template_str  = TemplateUtils.templateToString(templateJSON, unshownValues);
        Sunstone.runAction(resourceType + ".update_template", resourceId, template_str);
        // This avoids to get a messed template if the update fails
        templateJSON = templateJSON_bk;
      }
    });

    // Capture the enter key
    context.on("keypress", '#new_value_vectorial', function(e) {
      var ev = e || window.event;
      var key = ev.keyCode;
      if (key == 13) {
        //Get the button the user wants to have clicked
        $('#button_add_value_vectorial').click();
        ev.preventDefault();
      }
    });
  }

  // Returns an HTML string with the json keys and values
  function fromJSONtoHTMLTable(templateJSON, resourceType, vectorial, ocurrence, modify) {
    var str = "";
    if (!templateJSON) { 
      return "Not defined";
    }
    var field = null;
    // Iterate for each value in the JSON object
    for (field in templateJSON) {
      str += fromJSONtoHTMLRow(
        field,
        templateJSON[field],
        resourceType,
        vectorial,
        ocurrence,
        modify
      );
    }
    return str;
  }

  // Helper for fromJSONtoHTMLTable function
  function fromJSONtoHTMLRow(field, value, resourceType, vectorial_key, ocurrence, modify) {
    var str = "";
    // value can be an array
    if (value.constructor == Array) {
      var it = null;
      for (it = 0; it < value.length; ++it) {
        var current_value = value[it];
        // if value is object, we are dealing with a vectorial value
        if (typeof current_value == 'object') {
          str += '<tr id="' + resourceType.toLowerCase() + '_template_table_' + field + '"><td class="key_td key_vectorial_td">' + Locale.tr(field) + '</td><td class="value_vectorial_td"></td>';
          if (modify) {
            str += '<td class="text-right nowrap"><span id="div_add_vectorial"><a id="div_add_vectorial_' + field + '" class="add_vectorial_a ocurrence_' + it + ' vectorial_key_' + field + '" href="#"><i class="fas fa-plus-sign"/></a></span>&emsp;<span id="div_minus"><a id="div_minus_' + field + '" class="remove_vectorial_x ocurrence_' + it + '" href="#"><i class="fas fa-trash-alt"/></a></span></td>';
          }
          str += '</tr>';
          str += fromJSONtoHTMLTable(current_value, resourceType, field, it, modify);
        } else {
          // if it is a single value, create the row for this occurrence of the key
          if (!special_restrictions[field] || (special_restrictions[field] && special_restrictions[field]['show'])){
            str += fromJSONtoHTMLRow(field, current_value, resourceType, false, it, modify);
          } 
        }
      }
    }else{
      var ocurrence_str = "";
      if (ocurrence != null){
        ocurrence_str = " ocurrence_" + ocurrence;
      }
      // If it comes from a vectorial daddy key, then reflect so in the html
      if (vectorial_key) {
        str += '<tr><td class="key_td key_vectorial_td">&emsp;&emsp;' + Locale.tr(field) + '</td><td class="value_td value_vectorial_td value_td_input_' + field + ocurrence_str + ' vectorial_key_' + vectorial_key + '" id="value_td_input_' + field + '">' + TemplateUtils.htmlEncode(value) + '</td>';
        if (modify) {
          str += '<td class="text-right nowrap"><span id="div_edit_vectorial"><a id="div_edit_' + field + '" class="edit_e' + ocurrence_str + ' vectorial_key_' + vectorial_key + '" href="#"><i class="fas fa-edit"/></a></span>&emsp;<span id="div_minus_vectorial"><a id="div_minus_' + field + '" class="remove_x' + ocurrence_str + ' vectorial_key_' + vectorial_key + '" href="#"><i class="fas fa-trash-alt"/></a></span></td>';
        }
        str += '</tr>';
      } else {
        // If it is not comming from a vectorial daddy key, it can still vectorial itself
        if (typeof value == 'object') {
          if (!special_restrictions[field] || (special_restrictions[field] && special_restrictions[field]['show'])){
            str += '<tr id="' + resourceType.toLowerCase() + '_template_table_' + field + '"><td class="key_td key_vectorial_td">' + Locale.tr(field) + '</td><td class="value_vectorial_td"></td>';
            if (modify) {
              str += '<td class="text-right nowrap"><span id="div_add_vectorial"><a id="div_add_vectorial_' + field + '" class="add_vectorial_a' + ocurrence_str + ' vectorial_key_' + field + '" href="#"><i class="fas fa-plus-sign"/></a></span>&emsp;<span id="div_minus"><a id="div_minus_' + field + '" class="remove_vectorial_x' + ocurrence_str + '" href="#"><i class="fas fa-trash-alt"/></a></span></td>';
            }
            str += fromJSONtoHTMLTable(value, resourceType, field, ocurrence, modify);
          }
        } else {
          str += '<tr><td class="key_td">' + Locale.tr(field) + '</td><td class="value_td" id="value_td_input_' + field + '">';
          str += (field.toLowerCase() === "link")
            ? '<a target="_blank" href="'+TemplateUtils.htmlEncode(value)+'">' + TemplateUtils.htmlEncode(value) + '</a></td>'
            : TemplateUtils.htmlEncode(value) + '</td>';
          
          if (modify) {
            var edit_html = "";
            var delete_html = "";
            if (!special_restrictions[field] || (special_restrictions[field] && special_restrictions[field]['edit'])){
              edit_html = '<span id="div_edit"><a id="div_edit_' + field + '" class="edit_e' + ocurrence_str + '" href="#"><i class="fas fa-edit"/></a></span>';
            }
            if (!special_restrictions[field] || (special_restrictions[field] && special_restrictions[field]["delete"])){
              delete_html = '<span id="div_minus"><a id="div_minus_' + field + '" class="remove_x' + ocurrence_str + '" href="#"><i class="fas fa-trash-alt"/></a></span>';
            }
            str += '<td class="text-right nowrap">' + edit_html + '&emsp;' + delete_html + '</td>';
          }
          str += '</tr>';
        }
      }

    }
    return str;
  }

  /**
   * @param {Object} template Template from database resource (vm, host, etc)
   * @param {Object} options Options to filter attributes
   * @param {Array} options.hidden Array of attribute names to hide
   * @param {RegExp} options.regexVCenter Regex to split vCenter attributes
   * @param {RegExp} options.regexNSX Regex to split NSX attributes
   * @return {{
   *  general: Object,
   *  nsx: Object,
   *  vcenter: Object,
   *  hidden: Object
   * }} All resource attributes
   */
  function getTemplatesAttributes(template, options) {
    var options = $.extend({
      regexHidden: /^$/,
      regexVCenter: /^VCENTER_/,
      regexNSX: /^$/,
    }, options);

    var general = {}, nsx = {}, vcenter = {}, hidden = {};

    $.each(template, function(key, value) {
      if (key.match(options.regexHidden)) {
        hidden[key] = value
      }
      else if (key.match(options.regexNSX)) {
        nsx[key] = value;
      }
      else if (key.match(options.regexVCenter)) {
        vcenter[key] = value;
      }
      else {
        general[key] = value;
      }
    });

    return { general, nsx, vcenter, hidden }
  }
  
  return {
    getTemplatesAttributes: getTemplatesAttributes,
    html: _html,
    setup: _setup,
  };
});
