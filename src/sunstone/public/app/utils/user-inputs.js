define(function(require) {
  var Locale = require('utils/locale');
  var TemplateUtils = require('utils/template-utils');
  var VNetsTable = require('tabs/vnets-tab/datatable');

  //==============================================================================
  // VM & Service user inputs
  //==============================================================================

  return {
    'vmTemplateInsert': _generateVMTemplateUserInputs,
    'serviceTemplateInsert': _generateServiceTemplateUserInputs
  }

  // It will replace the div's html with a row for each USER_INPUTS
  // opts.text_header: header text for the text & password inputs
  // opts.network_header: header text for the network inputs
  // returns true if at least one input was inserted
  function _generateVMTemplateUserInputs(div, template_json, opts) {
    return _generateInstantiateUserInputs(
        div, template_json.VMTEMPLATE.TEMPLATE.USER_INPUTS, opts);
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
    var text_attrs = [];

    $.each(user_inputs, function(key, value) {
      var parts = value.split("|");
      // 0 mandatory; 1 type; 2 desc;
      var attrs = {
        "name": key,
        "mandatory": parts[0],
        "type": parts[1],
        "description": parts[2],
      }

      switch (parts[1]) {
        case "vnet_id":
          network_attrs.push(attrs)
          break;
        case "text":
          text_attrs.push(attrs)
          break;
        case "password":
          text_attrs.push(attrs)
          break;
      }
    });

    if (network_attrs.length > 0) {
      if (opts.network_header.length > 0) {
        div.append(
        '<br>' +
        '<div class="row">' +
          '<div class="large-12 large-centered columns">' +
            '<h3 class="subheader">' +
              opts.network_header +
            '</h3>' +
          '</div>' +
        '</div>');
      }

      div.append('<div class="instantiate_user_inputs"/>');

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

        $("input#selected_resource_id_" + unique_id, div).attr(
            "wizard_field", vnet_attr.name);

        $("input#selected_resource_id_" + unique_id, div).attr("required", "")
      });
    }

    if (text_attrs.length > 0) {
      if (opts.text_header.length > 0) {
        div.append(
        '<br>' +
        '<div class="row">' +
          '<div class="large-12 large-centered columns">' +
            '<h3 class="subheader">' +
              opts.text_header +
            '</h3>' +
          '</div>' +
        '</div>');
      }

      div.append('<div class="instantiate_user_inputs"/>');

      $.each(text_attrs, function(index, custom_attr) {
            $(".instantiate_user_inputs", div).append(
              '<div class="row">' +
                '<div class="large-12 large-centered columns">' +
                  '<label>' +
                    TemplateUtils.htmlDecode(custom_attr.description) +
                    '<input type="' + custom_attr.type + '" wizard_field="' + custom_attr.name + '" required/>' +
                  '</label>' +
                '</div>' +
              '</div>');
          });
    }

    return (network_attrs.length > 0 || text_attrs.length > 0);
  }
})
