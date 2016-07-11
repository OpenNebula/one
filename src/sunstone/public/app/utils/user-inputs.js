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
    'attributeInput': _attributeInput,
    'insertAttributeInputMB': _insertAttributeInputMB
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

        if (templateJSON[key] != undefined){
          attr.initial = templateJSON[key];
        }

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

    opts.div = div;
    opts.user_inputs = inputs;
    opts.defaults = $.extend({}, template_json.VMTEMPLATE.TEMPLATE);

    return _generateInstantiateUserInputs(opts);
  }

  // It will replace the div's html with a row for each USER_INPUTS
  // opts.text_header: header text for the text & password inputs
  // opts.network_header: header text for the network inputs
  // returns true if at least one input was inserted
  function _generateServiceTemplateUserInputs(div, template_json, opts) {
    if(opts == undefined){
      opts = {};
    }

    opts.div = div;
    opts.user_inputs = template_json.DOCUMENT.TEMPLATE.BODY.custom_attrs;

    return _generateInstantiateUserInputs(opts);
  }

  // It will replace the div's html with a row for each USER_INPUTS
  // opts.div: where to insert the html
  // opts.user_inputs: Object with the USER_INPUTS section
  // opts.defaults: Object with the first level attributes (TEMPLATE)
  // opts.text_header: header text for the text & password inputs
  // opts.network_header: header text for the network inputs
  // returns true if at least one input was inserted
  function _generateInstantiateUserInputs(opts) {
    var div = opts.div;
    var user_inputs = opts.user_inputs;

    var defaults = opts.defaults;
    if (defaults == undefined){
      defaults = {};
    }

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

      if (defaults[key] != undefined){
        attrs.initial = opts.defaults[key];
      }

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
                TemplateUtils.htmlEncode(vnet_attr.description) +
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
                TemplateUtils.htmlEncode(custom_attr.description) +
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
   *                        { "mandatory": true/false
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
   * Inserts an html <input> for the given user input attribute, plus a selector
   * to change between MB and GB. The source attr is supposed to be in MB
   * @param  {object} attr structure as returned by parse
   * @param  {jQuery} div jQuery selector for the div to attach the html to
   */
  function _insertAttributeInputMB(attr, div) {
    // Modified input for GB
    var attr_gb = $.extend({}, attr);

    if (attr.type == "range"){
      attr.tick_size = 1024;
    }

    delete attr_gb.initial;

    attr_gb.wizard_field_disabled = true;

    if (attr_gb.type == "range"){
      attr_gb.type = "range-float";
      attr_gb.min = Math.ceil((attr_gb.min / 1024));
      attr_gb.max = Math.floor((attr_gb.max / 1024));
      attr_gb.step = "1";
      attr_gb.tick_size = 1;

    } else if (attr_gb.type == "list"){
      attr_gb.options = attr_gb.options.map(function(e){
                          return e / 1024;
                        });

    } else if (attr_gb.type == "number"){
      attr_gb.type = "number-float";
      attr_gb.step = "1";
    }

    div.html(
      '<div class="input-group mb_input_wrapper">'+
        '<div class="mb_input input-group-field">' +
          _attributeInput(attr) +
        '</div>' +
        '<div class="gb_input input-group-field">' +
          _attributeInput(attr_gb) +
        '</div>' +
        '<div class="input-group-button">'+
          '<select id="mb_input_unit">' +
            '<option value="MB">'+Locale.tr("MB")+'</option>' +
            '<option value="GB" selected>'+Locale.tr("GB")+'</option>' +
          '</select>' +
        '</div>'+
      '</div>');

    _setupAttributeInputMB(div);

    // Update attr_gb with the value set in attr
    $("input, select", $("div.mb_input", div)).trigger("input");

    var input_val = $("input, select", $("div.mb_input", div)).val();
    if (input_val == "" || (input_val >= 1024 && (input_val % 1024 == 0))){
      $("#mb_input_unit", div).val("GB").change();
    } else {
      $("#mb_input_unit", div).val("MB").change();
    }
  }

  function _setupAttributeInputMB(context) {
    // MB to GB
    $("div.mb_input", context).on("change", "input, select", function(){
      var val = "";

      if (this.value && this.value >= 0) {
        val = this.value / 1024;
      }

      $("input, select", $("div.gb_input", context)).val(val);
    });

    // GB to MB
    $("div.gb_input", context).on("change", "input, select", function(){
      var val = "";

      if (this.value && this.value >= 0) {
        val = Math.floor(this.value * 1024);
      }

      $("input, select", $("div.mb_input", context)).val(val);
    });

    var gb_inputs = $("div.gb_input", context).children().detach();

    // Unit select
    $("#mb_input_unit", context).on('change', function() {
      var mb_input_unit_val = $('#mb_input_unit :selected', context).val();

      if (mb_input_unit_val == 'GB') {
        $("div.mb_input", context).hide();
        gb_inputs.appendTo($("div.gb_input", context));

        $("input, select", $("div.mb_input",context)).trigger("change");
      } else {
        $("div.mb_input", context).show();
        gb_inputs = $("div.gb_input", context).children().detach();
      }
    });

    $("#mb_input_unit", context).change();
  }

  /**
   * Returns an html <input> for the given user input attribute
   * @param  {object} attr structure as returned by parse
   * @return {string}             string containing an html <input> element
   */
  function _attributeInput(attr) {
    var input;

    var required = (attr.mandatory ? "required" : "");

    var wizard_field = 'wizard_field="' + TemplateUtils.htmlEncode(attr.name) + '"';

    if (attr.wizard_field_disabled == true){
      wizard_field = "";
    }

    var value = "";

    if (attr.initial != undefined){
      value = TemplateUtils.htmlEncode(attr.initial);
    }

    switch (attr.type) {
      case "text":
        input = '<textarea type="text" rows="1" '+wizard_field+' '+required+'>'+TemplateUtils.htmlEncode(value)+'</textarea>';
        break;
      case "text64":
        try {
          input = '<textarea type="text" rows="1" wizard_field_64="true" '+wizard_field+' '+required+'>'+TemplateUtils.htmlEncode(atob(value))+'</textarea>';
        } catch(e){
          console.error(e.message);
          input = "<p>"+e.message+"</p>";
        }
        break;
      case "password":
        input = '<input type="password" value="'+value+'" '+wizard_field+' '+required+'/>';
        break;
      case "number":
      case "number-float":
        var min = attr.min != undefined ? 'min="'+attr.min+'"' : "";
        var max = attr.max != undefined ? 'max="'+attr.max+'"' : "";

        input = '<input type="number" step="'+attr.step+'" '+min+' '+max+' value="'+value+'" '+wizard_field+' '+required+'/>';
        break;
      case "range":
      case "range-float":
        input = RangeSlider.html(attr);

        break;
      case "list":
        input = '<select '+wizard_field+' '+required+'>';

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
        input = '<input type="text" value="'+value+'" '+wizard_field+' '+required+' disabled/>';
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
