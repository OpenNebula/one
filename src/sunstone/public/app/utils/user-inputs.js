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
  var TemplateUtils = require('utils/template-utils');
  var VNetsTable = require('tabs/vnets-tab/datatable');
  var RangeSlider = require('utils/range-slider');

  var TemplateHTML = require('hbs!./user-inputs/table');
  var RowTemplateHTML = require('hbs!./user-inputs/row');


  //==============================================================================
  // VM & Service user inputs
  //==============================================================================

  return {
    // User inputs edition
    'html': _html,
    'setup': _setup,
    'fill': _fill,
    'retrieve': _retrieve,

    // Instantiate
    'vmTemplateInsert': _generateVMTemplateUserInputs,
    'serviceTemplateInsert': _generateServiceTemplateUserInputs,

    // Utils
    'marshall': _marshall,
    'unmarshall': _unmarshall,
    'parse': _parse,
    'generateInputElement': _generateInputElement,
    'attributeInput': _attributeInput
  };

  function _html(){
    return TemplateHTML();
  }

  function _setup(context){
    context.on("click", ".add_user_input_attr", function() {
      $(".user_input_attrs tbody", context).append(RowTemplateHTML());

      $("select.user_input_type", context).change();
    });

    context.on("change", "select.user_input_type", function() {
      var row = $(this).closest("tr");

      $(".user_input_type_right", row).hide();
      $(".user_input_type_right."+this.value, row).show();
    });

    context.on("click", ".user_input_attrs i.remove-tab", function() {
      $(this).closest('tr').remove();
    });
  }

  function _retrieve(context){
    var userInputsJSON = {};

    $(".user_input_attrs tbody tr", context).each(function() {
      if ($(".user_input_name", $(this)).val()) {
        var attr = {};
        attr.name = $(".user_input_name", $(this)).val();
        attr.mandatory = true;
        attr.type = $(".user_input_type", $(this)).val();
        attr.description = $(".user_input_description", $(this)).val();

        switch(attr.type){
          case "number":
          case "number-float":
          case "fixed":
            attr.initial = $("."+attr.type+" input.user_input_initial", $(this)).val();
            break;

          case "range":
          case "range-float":
            var min = $("."+attr.type+" input.user_input_params_min", $(this)).val();
            var max = $("."+attr.type+" input.user_input_params_max", $(this)).val();
            attr.params  = min + ".." + max;
            attr.initial = $("."+attr.type+" input.user_input_initial", $(this)).val();
            break;
          case "list":
            attr.params  = $("."+attr.type+" input.user_input_params", $(this)).val();
            attr.initial = $("."+attr.type+" input.user_input_initial", $(this)).val();
            break;
        }

        userInputsJSON[attr.name] = _marshall(attr);
      }
    });

    return userInputsJSON;
  }

  function _fill(context, templateJSON){
    var userInputsJSON = templateJSON['USER_INPUTS'];

    if (userInputsJSON) {
      $.each(userInputsJSON, function(key, value) {
        $(".add_user_input_attr", context).trigger("click");

        var trcontext = $(".user_input_attrs tbody tr", context).last();

        $(".user_input_name", trcontext).val(key);

        var attr = _unmarshall(value);

        $(".user_input_type", trcontext).val(attr.type).change();
        $(".user_input_description", trcontext).val(attr.description);

        switch(attr.type){
          case "number":
          case "number-float":
          case "fixed":
            $("."+attr.type+" input.user_input_initial", trcontext).val(attr.initial);
            break;

          case "range":
          case "range-float":
            var values = attr.params.split("..");  // "2..8"

            if (values.length == 2){
              $("."+attr.type+" input.user_input_params_min", trcontext).val(values[0]);
              $("."+attr.type+" input.user_input_params_max", trcontext).val(values[1]);
            } else {
              console.error('Wrong user input parameters for "'+key+'". Expected "MIN..MAX", received "'+attr.params+'"');
            }

            $("."+attr.type+" input.user_input_initial", trcontext).val(attr.initial);

            break;

          case "list":
            $("."+attr.type+" input.user_input_params", trcontext).val(attr.params);
            $("."+attr.type+" input.user_input_initial", trcontext).val(attr.initial);
            break;
        }
      });
    }
  }

  // It will replace the div's html with a row for each USER_INPUTS
  // opts.text_header: header text for the text & password inputs
  // opts.network_header: header text for the network inputs
  // returns true if at least one input was inserted
  function _generateVMTemplateUserInputs(div, template_json, opts) {
    // Delete the special user inputs for the capacity
    var inputs = $.extend({}, template_json.VMTEMPLATE.TEMPLATE.USER_INPUTS);

    delete inputs["CPU"];
    delete inputs["MEMORY"];
    delete inputs["VCPU"];

    return _generateInstantiateUserInputs(div, inputs, opts);
  }

  // It will replace the div's html with a row for each USER_INPUTS
  // opts.text_header: header text for the text & password inputs
  // opts.network_header: header text for the network inputs
  // returns true if at least one input was inserted
  function _generateServiceTemplateUserInputs(div, template_json, opts) {
    return _generateInstantiateUserInputs(
        div, template_json.DOCUMENT.TEMPLATE.BODY.custom_attrs, opts);
  }

  // It will replace the div's html with a row for each USER_INPUTS
  // opts.text_header: header text for the text & password inputs
  // opts.network_header: header text for the network inputs
  // returns true if at least one input was inserted
  function _generateInstantiateUserInputs(div, user_inputs, opts) {
    div.empty();

    var html = '';

    if (user_inputs == undefined) {
      return false;
    }

    if (opts == undefined) {
      opts = {};
    }

    if (opts.text_header == undefined) {
      opts.text_header = Locale.tr("Custom Attributes");
    }

    if (opts.network_header == undefined) {
      opts.network_header = Locale.tr("Network");
    }

    var network_attrs = [];
    var input_attrs = [];

    $.each(user_inputs, function(key, value) {
      var attrs = _parse(key, value);

      if (attrs.type == "vnet_id"){
        network_attrs.push(attrs);
      } else {
        input_attrs.push(attrs);
      }
    });

    if (network_attrs.length > 0) {
      html += '<fieldset>';
      if (opts.network_header.length > 0) {
        html += '<legend>' +
            opts.network_header +
          '</legend>' +
          '</div>';
      }

      html += '<div class="instantiate_user_inputs">' +
          '</div>' +
        '</fieldset>';

      div.append(html);

      var separator = "";

      var vnetsTable;
      $.each(network_attrs, function(index, vnet_attr) {
        var unique_id = "user_input_" + (vnet_attr.name.replace(/ /g, "_"));
        vnetsTable = new VNetsTable(unique_id, {'select': true});

        $(".instantiate_user_inputs", div).append(
          '<div class="row">' +
            '<div class="large-12 large-centered columns">' +
              separator +
              '<h5>' +
                TemplateUtils.htmlDecode(vnet_attr.description) +
              '</h5>' +
              vnetsTable.dataTableHTML +
            '</div>' +
          '</div>');

        separator = "<hr/>";

        vnetsTable.initialize();

        $('#refresh_button_' + unique_id).click();

        vnetsTable.idInput().attr("wizard_field", vnet_attr.name).attr("required", "");
      });
    }

    if (input_attrs.length > 0) {
      html += '<fieldset>';
      if (opts.text_header.length > 0) {
        html += '<legend>' +
            opts.text_header +
          '</legend>' +
          '</div>';
      }

      html += '<div class="instantiate_user_inputs">' +
          '</div>' +
        '</fieldset>';

      div.append(html);

      $.each(input_attrs, function(index, custom_attr) {
        $(".instantiate_user_inputs", div).append(
          '<div class="row">' +
            '<div class="large-12 large-centered columns">' +
              '<label>' +
                TemplateUtils.htmlDecode(custom_attr.description) +
                _attributeInput(custom_attr) +
              '</label>' +
            '</div>' +
          '</div>');
      });
    }

    return (network_attrs.length > 0 || input_attrs.length > 0);
  }

  /**
   * Transforms a user input object to a string
   * @param  {object} attr user input object, e.g.
   *                        { "name":
   *                          "mandatory": true/false
   *                          "type":
   *                          "description":
   *                          ["params":] "2..8" / "2,4,8"
   *                          ["initial":] "3"
   *                        }
   * @return {string}      String in the form "M|range|Description here|2..8|4"
   */
  function _marshall(attr) {
    var st = "";

    st += (attr.mandatory ? "M" : "O") + "|" +
          (attr.type != undefined ? attr.type : "text") + "|" +
          (attr.description != undefined ? attr.description : "");

    switch (attr.type) {
      case "number":
      case "number-float":
      case "fixed":
        st += ("| |" + (attr.initial != undefined ? attr.initial : "") );

        break;
      case "range":
      case "range-float":
      case "list":
        st += ("|" + (attr.params != undefined ? attr.params : "") +
               "|" + (attr.initial != undefined ? attr.initial : "") );

        break;
    }

    return st;
  }

  /**
   * Transforms a user input string to an object
   * @param  {string} value String in the form "M|range|Description here|2..8|4"
   * @return {object} user input object, e.g.
   *                        { "mandatory": true/false
   *                          "type":
   *                          "description":
   *                          ["params":] "2..8" / "2,4,8"
   *                          ["initial":] "3"
   *                        }
   */
  function _unmarshall(value) {
    var parts = value.split("|");

    var attr = {
      "mandatory": (parts[0] == "M"),
      "type": parts[1],
      "description": parts[2],
      "initial": ""
    };

    if (parts[3] != undefined){
      attr.params = parts[3];
    }

    if (parts[4] != undefined){
      attr.initial = parts[4];
    }

    return attr;
  }

  /**
   * Returns a structure with the user input parameters
   * @param  {string} name  Template Attribute name, e.g. USER_PASSWORD
   * @param  {string} value Template Attribute value,
   *                        e.g. "M|range|Description here|2..8|4"
   * @return {object}       { "name":
                              "mandatory":
                              "type":
                              "description":
                              ["params":] "2..8" / "2,4,8"
                              ["initial":]
                              ["min":]
                              ["max":]
                              ["step":]
                              ["options":]
                              ["tick_size":] For range inputs, the tick positions
                                             starting from 0, not min
                            }
   */
  function _parse(name, value) {
    var attr = _unmarshall(value);

    attr.name = name;

    // TODO: error management (params undefined)

    switch (attr.type) {
      case "number":
        attr.step = "1";
        break;

      case "number-float":
        attr.step = "any";
        break;

      case "range":
        var params = attr.params.split("..");  // "2..8"

        attr.min = parseInt( params[0] );
        attr.max = parseInt( params[1] );
        attr.step = "1";

        attr.tick_size = 1;
        while ((attr.max - attr.min) / attr.tick_size > 10 ){
          attr.tick_size *= 10;
        }

        break;

      case "range-float":
        var params = attr.params.split("..");  // "2.4..8.75"

        attr.min = parseFloat( params[0] );
        attr.max = parseFloat( params[1] );
        attr.step = "any";

        attr.tick_size = 1;
        while ((attr.max - attr.min) / attr.tick_size > 10 ){
          attr.tick_size *= 10;
        }

        break;

      case "list":
        attr.options = attr.params.split(",");  // "2,4,16"

        break;
    }

    return attr;
  }

  /**
   * Returns an html <input> for the given user input attribute
   * @param  {object} attr structure as returned by parse
   * @return {string}             string containing an html <input> element
   */
  function _attributeInput(attr) {
    var input;

    var required = (attr.mandatory ? "required" : "");

    switch (attr.type) {
      case "text":
        input = '<textarea type="text" rows="1" wizard_field="' + attr.name + '" '+required+'/>';
        break;
      case "text64":
        input = '<textarea type="text" rows="1" wizard_field_64="true" wizard_field="' + attr.name + '" '+required+'/>';
        break;
      case "password":
        input = '<input type="password" wizard_field="' + attr.name + '" '+required+'/>';
        break;
      case "number":
      case "number-float":
        input = '<input type="number" step="'+attr.step+'" value="'+attr.initial+'" wizard_field="' + attr.name + '" '+required+'/>';
        break;
      case "range":
      case "range-float":
        input = RangeSlider.html(attr);

        break;
      case "list":
        input = '<select wizard_field="' + attr.name + '" '+required+'>';

        $.each(attr.options, function(){
          var selected = (attr.initial == this);

          input +=  '<option value="'+this+'" '+
                    (selected? 'selected' : '')+'>'+
                      this+
                    '</option>';
        });

        input += '</select>';

        break;
      case "fixed":
        input = '<input type="text" value="'+attr.initial+'" wizard_field="' + attr.name + '" '+required+' disabled/>';
        break;
    }

    return input;
  }

  /**
   * Returns an html <input> for the given USER_INPUT attribute
   * @param  {string} name  Template Attribute name, e.g. USER_PASSWORD
   * @param  {string} value Template Attribute value,
   *                        e.g. "M|range|Description here|2..8|4"
   * @return {string}       string containing an html <input> element
   */
  function _generateInputElement(name, value) {
    var attrs = _parse(name, value);

    return _attributeInput(attrs);
  }
});
