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
  var TemplateUtils = require("utils/template-utils");
  var VNetsTable = require("tabs/vnets-tab/datatable");
  var VNetsTemplateTable = require("tabs/vnets-templates-tab/datatable");
  var RangeSlider = require("utils/range-slider");
  var UniqueId = require("utils/unique-id");

  var TemplateHTML = require("hbs!./user-inputs/table");
  var RowTemplateHTML = require("hbs!./user-inputs/row");

  var network_attrs = [];
  var custom_attrs = [];
  var vmgroups_attrs = [];
  var network_attrs_class = "network_attrs_class";
  var custom_attr_class = "custom_attr_class";
  var vmgroups_attr_class = "vmgroups_class";

  //==============================================================================
  // VM & Service user inputs
  //==============================================================================

  return {
    // User inputs edition
    "html": _html,
    "setup": _setup,
    "fill": _fill,
    "retrieve": _retrieve,

    // Instantiate
    "vmTemplateInsert": _generateVMTemplateUserInputs,
    "serviceTemplateInsert": _generateServiceTemplateUserInputs,

    // Utils
    "marshall": _marshall,
    "unmarshall": _unmarshall,
    "parse": _parse,
    "generateInputElement": _generateInputElement,
    "attributeInput": _attributeInput,
    "insertAttributeInputMB": _insertAttributeInputMB,
    "retrieveOrder": _retrieveOrder
  };

  function _html(){
    return TemplateHTML();
  }

  function _setup(context){
    $(".add_user_input_attr", context).bind("click", function() {
      $(".user_input_attrs tbody", context).append(RowTemplateHTML({"idInput": UniqueId.id()}));
      $("tbody label").css("cursor", "pointer");
      $("select.user_input_type", context).change();
    });

    $("tbody", context).sortable();

    context.on("change", "select.user_input_type", function() {
      var row = $(this).closest("tr");

      $(".user_input_type_right", row).hide();
      $(".user_input_type_right."+this.value, row).show();
    });

    context.on("click", ".user_input_attrs i.remove-tab", function() {
      $(this).closest("tr").remove();
    });
  }

  function _retrieveOrder(){
    if (this.order){
      return this.order;
    }
    return "";
  }

  function _retrieve(context){
    var userInputsJSON = {};
    var order_inputs = "";

    $(".user_input_attrs tbody tr").each(function(key, value){
      order_inputs += $(".user_input_name", $(this)).val().toUpperCase() + ",";
    });

    this.order = order_inputs.slice(0,-1);

    $(".user_input_attrs tbody tr", context).each(function() {

      if ($(".user_input_name", $(this)).val()) {
        var attr = {};
        attr.name = $(".user_input_name", $(this)).val();
        if($(".user_input_mandatory", $(this)).prop("checked")){
          attr.mandatory = true;
        } else {
          attr.mandatory = false;
        }

        attr.type = $(".user_input_type", $(this)).val();
        attr.description = $(".user_input_description", $(this)).val();

        switch(attr.type){
          case "text":
          case "text64":
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
          case "list-multiple":
            attr.params  = $("."+attr.type+" input.user_input_params", $(this)).val();
            attr.initial = $("."+attr.type+" input.user_input_initial", $(this)).val();
            break;
          case "boolean":
            attr.initial = $(".user_input_initial:checked", $(this)).val();
            break;
        }

        userInputsJSON[attr.name] = _marshall(attr);
      }
    });

    return userInputsJSON;
  }

  function _fill(context, templateJSON){
    var userInputsJSON = templateJSON["USER_INPUTS"];

    if(userInputsJSON){
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

        if (attr.mandatory){
          $(".user_input_mandatory", trcontext).attr("checked", "checked");
        } else {
          $(".user_input_mandatory", trcontext).removeAttr("checked");
        }

        switch(attr.type){
          case "text":
          case "text64":
          case "number":
          case "number-float":
          case "fixed":
            $("."+attr.type+" input.user_input_initial", trcontext).val(attr.initial);
            break;
          case "boolean":
            if(attr.initial == "YES"){
              $("input#radio_yes", trcontext).attr("checked", "checked");
              $("input#radio_no", trcontext).removeAttr("checked");
            }
            else {
              $("input#radio_yes", trcontext).removeAttr("checked");
              $("input#radio_no", trcontext).attr("checked", "checked");
            }
            break;
          case "range":
          case "range-float":
            var values = attr.params.split("..");  // "2..8"

            if (values.length == 2){
              $("."+attr.type+" input.user_input_params_min", trcontext).val(values[0]);
              $("."+attr.type+" input.user_input_params_max", trcontext).val(values[1]);
            } else {
              console.error("Wrong user input parameters for \""+key+"\". Expected \"MIN..MAX\", received \""+attr.params+"\"");
            }

            $("."+attr.type+" input.user_input_initial", trcontext).val(attr.initial);

            break;

          case "list":
          case "list-multiple":
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
    opts.customs = inputs;
    opts.defaults = $.extend({}, template_json.VMTEMPLATE.TEMPLATE);
    return _generateInstantiateUserInputs(opts);
  }

  // It will replace the div's html with a row for each USER_INPUTS
  // opts.text_header: header text for the text & password inputs
  // opts.network_header: header text for the network inputs
  // returns true if at least one input was inserted
  function _generateServiceTemplateUserInputs(div, template_json, opts) {
    if(opts == undefined){
      opts = {
        select_networks: true,
        pass: false
      };
    }

    opts.div = div;
    opts.networks = {};
    opts.custom_attrs = {};
    if(
      template_json &&
      template_json.DOCUMENT &&
      template_json.DOCUMENT.TEMPLATE &&
      template_json.DOCUMENT.TEMPLATE.BODY &&
      template_json.DOCUMENT.TEMPLATE.BODY.networks &&
      opts.select_networks
    ){
      opts.networks = template_json.DOCUMENT.TEMPLATE.BODY.networks;
    }
    if(
      template_json &&
      template_json.DOCUMENT &&
      template_json.DOCUMENT.TEMPLATE &&
      template_json.DOCUMENT.TEMPLATE.BODY &&
      template_json.DOCUMENT.TEMPLATE.BODY.custom_attrs
    ){
      opts.customs = template_json.DOCUMENT.TEMPLATE.BODY.custom_attrs;
    }
    return _generateInstantiateUserInputs(opts);
  }

  // It will replace the div's html with a row for each USER_INPUTS
  // opts.div: where to insert the html
  // opts.customs: Object with the USER_INPUTS section
  // opts.defaults: Object with the first level attributes (TEMPLATE)
  // opts.text_header: header text for the text & password inputs
  // opts.network_header: header text for the network inputs
  // returns true if at least one input was inserted
  function _generateInstantiateUserInputs(opts) {
    var div = opts.div;
    var networks = opts && opts.networks ? opts.networks : null;
    var customs = opts && opts.customs ? opts.customs : null;
    var vmgroups = opts && opts.vmgroups ? opts.vmgroups : null;
    var check = {networks:false, customs:false, vmgroups:false};

    var defaults = opts.defaults;
    if (defaults == undefined){
      defaults = {};
    }
    div.empty();

    var html = "";

    if (opts == undefined) {
      opts = {};
    }

    if (opts.text_header == undefined && customs) {
      opts.text_header = Locale.tr("Custom Attributes");
    }

    if (opts.network_header == undefined && networks) {
      opts.network_header = Locale.tr("Network");
    }

    if (opts.vmgroups_header == undefined && vmgroups) {
      opts.vmgroups_header = Locale.tr("Vm group");
    }

    function checkItemInArray(object={}, list=[], index="name") {
      var rtn = true;
      if(typeof object === "object" && Array.isArray(list)){
        if(
          list.some(
            function(item){
              return (item[index] === object[index]);
            }
          )
        ){
          rtn = false;
        }
      }
      return rtn;
    }

    function addInVar(iterator, store){
      if(iterator && store && Array.isArray(store)){
        $.each(iterator, function(key, value) {
          var attrs = _parse(key, value);
          if (defaults[key] != undefined){
            attrs.initial = opts.defaults[key];
          }
          if(checkItemInArray(attrs, store, "name")){
            store.push(attrs);
          }
        });
      }
    }

    addInVar(networks, network_attrs);
    addInVar(customs, custom_attrs);
    if(vmgroups){
      vmgroups_attrs = vmgroups;
      check.vmgroups = true;
    }

    // Render networks
    if (network_attrs.length > 0) {
      html += "<fieldset>";
      if (opts && opts.network_header && opts.network_header.length > 0) {
        html += "<legend>" + opts.network_header + "</legend>";
      }
      html += "<div class='"+network_attrs_class+"'></div>";
      html += "</fieldset>";
      div.append(html);
      html = "";
      var separator = $("<div>");
      $.each(network_attrs, function(index, vnet_attr) {
        // 0 type; 1 id; 3(optional) extra
        var info = vnet_attr.initial.split(":");
        var type = info[0];
        var id = info[1];
        var extra = info.slice(2).join("");

        var unique_id = "vnet_user_input_" + UniqueId.id();
        if(type === "reserve_from" || type === "id") {
          var table = new VNetsTable(unique_id, {"select": true});
        }else {
          var table = new VNetsTemplateTable(unique_id, {"select": true});
        }

        if(opts && opts.select_networks){
          $("."+network_attrs_class, div).append(
            $("<div>", {class:"row"}).append(
              $("<div>",{class: "large-12 large-centered columns"}).append(
                separator.add(
                  $("<h6>").text(TemplateUtils.htmlEncode(vnet_attr.name)).add(
                    $("<div>",{class: "row"}).append(
                      $("<div>",{class:"columns small-12"}).append(
                        $("<select>",{
                          class: "changePlaceDatatable",
                          wizard_field: "type_"+vnet_attr.name,
                          "data-nametable": vnet_attr.name,
                          "data-idtable": unique_id,
                          "data-id": index
                        }).append(
                            $("<option>",{ value: "id" }).text(Locale.tr("Existing")
                          ).add(
                            $("<option>", {value: "template_id"}).text(Locale.tr("Create"))
                          ).add(
                            $("<option>", {value: "reserve_from"}).text(Locale.tr("Reserve"))
                          )
                        )
                      ).add(
                        $("<div>",
                          {
                            class:"columns small-12",
                            id:"placeDatatable_"+index
                          }
                        ).html(table.dataTableHTML)
                      )
                    )
                  )
                )
              )
            )
          );
        }
        separator = $("<hr/>");
        table.initialize();
        $("#refresh_button_" + unique_id).click();
        table.idInput().attr("wizard_field", vnet_attr.name).attr("required", "");

        // Fill type, id of vnet/vnet-template and extra
        $(".changePlaceDatatable[data-id="+index+"]").val(type);
        table.selectResourceTableSelect({ "ids": String(id) });
        if (type === "template_id" || type === "reserve_from") {
          $("#placeDatatable_"+index).append(
            $("<div/>",{"class": "row addExtra_"+id}).append(
              $("<div/>",{"class": "columns small-12"}).append(
                $("<label/>").text(Locale.tr("Extra")).add(
                  $("<input/>",{
                    "wizard_field": "extra_"+vnet_attr.name,
                    "type": "text",
                    "name": "extra",
                    "id": "extra",
                    "placeholder": Locale.tr("Extra")
                  }).val(extra)
                )
              )
            )
          );
        }
      });
      if(opts && opts.select_networks){
        $(".changePlaceDatatable").change(function(e){
          e.preventDefault();
          var element = $(this);
          var id = element.attr("data-id");
          var idtable = element.attr("data-idtable");
          var nametable = element.attr("data-nametable");
          var value = element.val();
          var place = $("#placeDatatable_"+id);
          if(value === "reserve_from" || value === "id"){
            var table = new VNetsTable(idtable, {"select": true});
          }else{
            var table = new VNetsTemplateTable(idtable, {"select": true});
          }
          place.empty().append(table.dataTableHTML);
          table.initialize();
          $("#refresh_button_"+idtable).click();
          table.idInput().attr("wizard_field", nametable).attr("required", "");

          // create input extra
          if(value === "template_id" || value === "reserve_from"){
            // falta colocar el render de las diferentes tablas!!!
            if(!place.find(".addExtra_"+id).length){
              place.append(
                $("<div/>",{class:"row addExtra_"+id}).append(
                  $("<div/>",{class:"columns small-12"}).append(
                    $("<label/>").text(Locale.tr("Extra")).add(
                      $("<input/>",{
                        "wizard_field": "extra_"+nametable,
                        "type": "text",
                        "name": "extra",
                        "id": "extra",
                        "placeholder": Locale.tr("Extra")
                      })
                    )
                  )
                )
              );
            }
          }else{
            place.find(".addExtra_"+id).remove();
          }
        });
      }
    }

    //render Custom_attr_values
    if (custom_attrs.length > 0) {
      html += "<fieldset>";
      if (opts && opts.text_header && opts.text_header.length > 0) {
        html += "<legend>"+opts.text_header+"</legend>";
      }
      html += "<div class='"+custom_attr_class+"'></div>";
      html += "</fieldset>";
      div.append(html);
      html = "";

      $.each(custom_attrs, function(_, custom_attr) {
        var tooltip = "";
        if (custom_attr.type === "list-multiple"){
          tooltip = " <span class=\"tip\">" + Locale.tr("Use ctrl key for multiple selection") + "</span>";
        }
        $("."+custom_attr_class, div).append(
          "<div class=\"row\">" +
            "<div class=\"large-12 large-centered columns\">" +
              "<label>" +
                TemplateUtils.htmlEncode(custom_attr.description) +
                tooltip +
                _attributeInput(custom_attr) +
              "</label>" +
            "</div>" +
          "</div>");
      });
    }

    //render Vmgroups_attr_values
    if (vmgroups_attrs.length > 0 && opts.role) {
      var options = "<option value=\"\">"+Locale.tr("Without VM Group")+"</option>";
      vmgroups_attrs.map(function(vmgroup){
        if(
          vmgroup &&
          vmgroup.VM_GROUP &&
          vmgroup.VM_GROUP.NAME &&
          vmgroup.VM_GROUP.ID &&
          vmgroup.VM_GROUP.TEMPLATE
        ){
          vmGroupDescription = vmgroup.VM_GROUP.TEMPLATE.DESCRIPTION? "("+vmgroup.VM_GROUP.TEMPLATE.DESCRIPTION+")": "";
          options += "<option value='"+vmgroup.VM_GROUP.ID+"'>"+vmgroup.VM_GROUP.NAME+vmGroupDescription+"</option>";
        }
      });

      if (opts && opts.text_header && opts.text_header.length > 0) {
        html += "<div>"+opts.text_header+"</div>";
      }
      html += "<div class='"+vmgroups_attr_class+"'>";
      html += "<select data-role='"+opts.role+"'>"+options+"</select>";
      html += "</div>";
      div.append(html);
    }

    network_attrs = [];
    custom_attrs = [];
    vmgroups_attrs = [];
    return (check.networks || check.customs || check.vmgroups);
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
      case "text":
      case "text64":
      case "number":
      case "number-float":
      case "boolean":
      case "fixed":
        st += ("| |" + (attr.initial != undefined ? attr.initial : "") );
      break;
      case "range":
      case "range-float":
      case "list":
      case "list-multiple":
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
      case "list-multiple":
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
  function _insertAttributeInputMB(attr, div, displayUnit=true, editUnit = true) {
    // Modified input for GB
    var attr_gb = $.extend({}, attr);
    if (attr.type == "range"){
      attr.tick_size = 1024;
    }
    var select = "";
    var selectInput = editUnit? "": "disabled";
    if(displayUnit){
      var select = "<select class=\"mb_input_unit\" "+selectInput+">" +
        "<option value=\"MB\">"+Locale.tr("MB")+"</option>" +
        "<option value=\"GB\">"+Locale.tr("GB")+"</option>" +
        "<option value=\"TB\">"+Locale.tr("TB")+"</option>" +
      "</select>";
    }

    div.html(
      "<div class=\"input-group mb_input_wrapper\" style=\"display:flex;align-items:center;\"" + ">"+
        "<div class=\"mb_input input-group-field\">" +
          _attributeInput(attr) +
        "</div>"+
          "<div class=\"input-group-button\">"+
            select+
          "</div>"+
        "</div>");
    _setupAttributeInputMB(div);
  }

  function _setupAttributeInputMB(context) {
    var base = 1024;
    var baseCal = 1;
    var unit = "MB";
    var valueInMB = 0;
    var contextElement = $("div.mb_input", context);

    // Fill in the input with your unit the first time
    $("input, select", contextElement).trigger("input");
    var element = $("input.uinput-slider-val", contextElement);
    var value = element.val();
    var valueInUnit = value;
    var min = parseInt(element.attr("min"),10);

    if (value == ""){
      $(".mb_input_unit", context).val("MB").trigger("change");
    }else{
      // If you are going to put a new unit you must put it up in the html, here and down in the change
      if(value / (base*base) >= 1){
        baseCal = base*base;
        unit = "TB";
      }else if(value / base >= 1){
        baseCal = base;
        unit = "GB";
      }
      if (value >= 0) {
        valueInMB = value;
        if(!isNaN(min) && parseInt(min, 10) > valueInMB ){
          valueInMB = min;
        }
        $("input, select", contextElement).val(valueInMB);
        valueInUnit = valueInMB / baseCal;
      }
      $("input.visor", contextElement).val(valueInUnit);
      var contextUnit = contextElement.siblings(".input-group-button");
      $(".mb_input_unit", contextUnit).val(unit).trigger("change");
    }

    $("div.mb_input", context).on("change", "input.visor, select", function(e){
      var element = $(this);
      var step = '1'
      var baseCal = 1;
      var unit = "MB";
      var min = parseInt(element.attr("data-min"),10);
      var max = parseInt(element.attr("data-max"),10);
      var value = element.val();
      var valueInUnit = value;
      var mb_input_unit_val = $(".mb_input_unit :selected", context).val();
      switch (mb_input_unit_val) {
        case "TB":
          baseCal = base*base;
          step = '0.001'
          unit = "TB";
        break;
        case "GB":
          baseCal = base;
          step = '0.01'
          unit = "GB";
        break;
      }
      if (value >= 0) {
        valueInMB = value * baseCal;
        if(!isNaN(min) && parseInt(min, 10) > valueInMB ){
          valueInMB = min;
        }
        $("input, select", contextElement).val(Math.ceil(valueInMB));
        valueInUnit = valueInMB / baseCal;
      }
      $("input.visor", contextElement).attr('step', step).val(valueInUnit);
      var contextUnit = contextElement.siblings(".input-group-button");
      $(".mb_input_unit", contextUnit).val(unit);
    });

    // Unit select
    $(".mb_input_unit", context).on("change", function() {
      var mb_input_unit_val = $(".mb_input_unit :selected", context).val();
      $("input, select", $("div.mb_input",context)).trigger("change");
    });
  }

  /**
   * Returns an html <input> for the given user input attribute
   * @param  {object} attr structure as returned by parse
   * @return {string}             string containing an html <input> element
   */
  function _attributeInput(attr) {
    var input;
    var clss = "";
    var required = (attr.mandatory ? "required" : "");
    var wizard_field = "wizard_field='" + TemplateUtils.htmlEncode(attr.name) + "'";
    if (attr.wizard_field_disabled == true){
      wizard_field = "";
    }
    var value = "";
    if (attr.initial != undefined){
      value = TemplateUtils.htmlEncode(attr.initial);
    }
    if(attr.visor){
      clss = "hide";
    }
    switch (attr.type) {
      case "text64":
        try {
          input = "<textarea type='text' rows='1' wizard_field_64='true' "+wizard_field+" "+required+">"+TemplateUtils.htmlEncode(value)+"</textarea>";
        } catch(e){
          console.error(e.message);
          input = "<p>"+e.message+"</p>";
        }
        break;
      case "password":
        input = "<br><input type='password' value='"+value+"' "+wizard_field+" "+required+"/>";
        break;
      case "boolean":
        var id = UniqueId.id();
        if(value == "YES"){
          input = "<br>" + Locale.tr("YES ") + "<input style='margin-right: 20px' checked type='radio' name='bool_" +id + "' value='YES'" + wizard_field + " " + required + "/>";
          input += Locale.tr("NO ") + "<input type='radio' name='bool_" + id + "' value='NO'" + wizard_field + " " + required + "/>";
        } else if(value == "NO"){
          input = "<br>" + Locale.tr("YES ") + "<input style='margin-right: 20px' type='radio' name='bool_" + id + "' value='YES'" + wizard_field + " " + required + "/>";
          input += Locale.tr("NO ") + "<input checked type='radio' name='bool_" + id + "' value='NO'" + wizard_field + " " + required + "/>";
        } else {
          input = "<br>" + Locale.tr("YES ") + "<input style='margin-right: 20px' type='radio' name='bool_" + id + "' value='YES'" + wizard_field + " " + required + "/>";
          input += Locale.tr("NO ") + "<input type='radio' name='bool_" + id + "' value='NO'" + wizard_field + " " + required + "/>";
        }
        break;
      case "number":
      case "number-float":
        var step = !attr.visor && attr.step? "step='"+attr.step+"'" : "";
        var min = attr.min != undefined ? "min='"+attr.min+"'" : "";
        var max = attr.max != undefined ? "max='"+attr.max+"'" : "";
        input = "<input class='uinput-slider-val "+clss+"' type='number' "+step+" "+min+" "+max+" value='"+value+"' "+wizard_field+" "+required+"/>";
        break;
      case "range":
      case "range-float":
        if(attr.max_value != ""){
          attr.max_value = attr.max;
        }
        input = RangeSlider.html(attr);
        break;
      case "list":
        input = "<select "+wizard_field+" "+required+">";
        $.each(attr.options, function(){
          var selected = (attr.initial == this);
          var trimmedValue = $.trim(this);
          input +=  "<option value='"+trimmedValue+"' "+(selected? "selected" : "")+">"+trimmedValue+"</option>";
        });
        input += "</select>";
      break;
      case "list-multiple":
        input = "<select multiple='multiple' "+wizard_field+" "+required+">";
        $.each(attr.options, function(key, value){
          var defaultR = attr.initial.split(",");
          var selected = (defaultR.includes(value));
          input +=  "<option value='"+value+"' "+(selected? "selected" : "")+">"+value+"</option>";
        });
        input += "</select>";
      break;
      case "fixed":
        input = "<input type='text' value='"+value+"' "+wizard_field+" "+required+" disabled/>";
      break;
      default:
          input = "<textarea type='text' rows='1' "+wizard_field+" "+required+">"+TemplateUtils.htmlEncode(value)+"</textarea>";
      break;
    }
    if(attr.visor){
      var step = attr.step? "step='"+attr.step+"'" : "";
      input += "<input type='number' class='visor' "+step+" value='"+value+"' required>";
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
