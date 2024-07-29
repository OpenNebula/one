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
  // Dependencies
  var Locale = require('utils/locale');
  var Tips = require('utils/tips');
  var CustomTagsTable = require('utils/custom-tags-table');
  var WizardFields = require('utils/wizard-fields');
  var SecurityGroupsTable = require('tabs/secgroups-tab/datatable');

  var TemplateHTML = require('hbs!./ar-tab/html');

  function ArTab() {
    return this;
  }

  ArTab.prototype = {
    'html': _generate_ar_tab_content,
    'setup': _setup_ar_tab_content,
    'onShow': _onShow,
    'fill': _fill_ar_tab_data,
    'retrieve': _retrieve_ar_tab_data
  };
  ArTab.prototype.constructor = ArTab;

  return ArTab;

  function _generate_ar_tab_content(str_ar_tab_id){
    var opts = {
      info: false,
      select: true,
      selectOptions: {"multiple_choice": true}
    };

    this.securityGroupsTable = new SecurityGroupsTable(str_ar_tab_id, opts);

    return TemplateHTML({
          'str_ar_tab_id': str_ar_tab_id,
          'customTagsHTML': CustomTagsTable.html(),
          'securityGroupsTableHTML': this.securityGroupsTable.dataTableHTML
        });
  }

  function _setup_ar_tab_content(ar_section, str_ar_tab_id) {

    this.ar_section = ar_section;

    $('input[name$="ar_type"]',ar_section).change(function(){
      $('div.ar_input', ar_section).hide();

      $('input[wizard_field="IP"]',ar_section).removeAttr('required');

      switch($(this).val()){
      case "IP4":
        $('div.type_ip4', ar_section).show();
        $('input[wizard_field="IP"]',ar_section).attr('required', '');

        break;
      case "IP4_6":
        $('div.type_ip4_6', ar_section).show();
        $('input[wizard_field="IP"]',ar_section).attr('required', '');

        break;
      case "IP6":
        $('div.type_ip6', ar_section).show();
        break;
      case "ETHER":
        $('div.type_ether', ar_section).show();
        break;
      }
    });

    $('input.slaac',ar_section).prop('checked',true);
    $('.slaac_false', ar_section).hide();

    $('input.slaac',ar_section).on('change', function(){
      var slaac = $(this).prop('checked');
      if(slaac){
        $('.slaac_true', ar_section).show();
        $('.slaac_false', ar_section).hide();
        $('input#'+str_ar_tab_id+'_size',ar_section).attr("required", "required");
      }else{
        $('.slaac_true', ar_section).hide();
        $('.slaac_false', ar_section).show();
        $('input#'+str_ar_tab_id+'_size',ar_section).removeAttr("required");
      }
    });

    $('input#'+str_ar_tab_id+'_ar_type_ip4',ar_section).prop('checked', true);
    $('input#'+str_ar_tab_id+'_ar_type_ip4',ar_section).change();

    CustomTagsTable.setup($('#'+str_ar_tab_id+'_custom_tags',ar_section));

    this.securityGroupsTable.initialize();

    Tips.setup(ar_section);
  }

  function _onShow(){
    this.securityGroupsTable.refreshResourceTableSelect();
    
    // Deletes required on IPV4 when IPAM selected
    $("input[wizard_field=\"IPAM_MAD\"]").change(function(){
      var prefix_id = this.id.split("_")[0];
      
      // Obtain the correct id for add_ar window
      if (prefix_id == "add"){
        prefix_id += "_ar";
      }

      var dynamic_id = "#" + prefix_id + "_ip_start";
      
      if($(this).val().length>0){
        $(dynamic_id).removeAttr("wizard_field");
        $(dynamic_id).removeAttr("required");
      }else{
        $(dynamic_id).attr("wizard_field","IP");
        $(dynamic_id).attr("required","required");
      }
    });    

    $("input.slaac", this.ar_section).change();
  }

  function _retrieve_ar_tab_data(){
    var data  = {};

    var ar_type = $('input[name$="ar_type"]:checked',this.ar_section).val();

    var fields = [];

    switch(ar_type){
      case "IP4":
        fields = $('div.type_ip4', this.ar_section).children("input");
        break;
      case "IP4_6":
        fields = $('div.type_ip4_6', this.ar_section).children("input");
        if(!$('input.slaac',this.ar_section).prop('checked')){
          ar_type += "_STATIC";
        }
        break;
      case "IP6":
        fields = $('div.type_ip6', this.ar_section).children("input");
        if(!$('input.slaac',this.ar_section).prop('checked')){
          ar_type += "_STATIC";
        }
        break;
      case "ETHER":
        fields = $('div.type_ether', this.ar_section).children("input");
        break;
    }

    fields.each(function(){
      var field=$(this);

      if (field.val() != null && field.val().length){ //if has a length
        if (field.attr('name') === "SLAAC") {
          if (field[0].checked)
            data[field.attr('name')] = "on";
          else
            data[field.attr('name')] = "off";
        } else {
          data[field.attr('name')] = field.val();
        }
      }

    });

    if (!$.isEmptyObject(data)) {
      data["TYPE"] = ar_type;
    }

    $.extend(data, CustomTagsTable.retrieve(this.ar_section));

    var str_ar_tab_id = $('div[name="str_ar_tab_id"]', this.ar_section).attr("str_ar_tab_id");

    var secgroups = this.securityGroupsTable.retrieveResourceTableSelect();
    if (secgroups != undefined && secgroups.length != 0){
      data["SECURITY_GROUPS"] = secgroups.join(",");
    }

    var ipam = $('input[name="IPAM_MAD"]', this.ar_section).val();
    if(ipam != ""){
      data["IPAM_MAD"] = ipam;
    }

    return data;
  }

  function _fill_ar_tab_data(ar_json){

    if (ar_json["TYPE"] && ar_json["TYPE"].indexOf("_STATIC") >= 0 ){
      ar_json["TYPE"] = ar_json["TYPE"].replace("_STATIC", "");
      ar_json["SLAAC"] = "off";
    }

    WizardFields.fill(this.ar_section, ar_json);

    if (ar_json["SLAAC"] && ar_json["SLAAC"] === "off"){
      $("input.slaac", this.ar_section)[0].checked = false;
    }

    $("input.slaac", this.ar_section).prop("disabled", true);

    var fields = $('[wizard_field]',this.ar_section);

    fields.each(function(){
      var field = $(this);
      var field_name = field.attr('wizard_field');

      // Delete so these attributes don't end in the custom tags table also
      delete ar_json[field_name];
    });

    delete ar_json["AR_ID"];
    delete ar_json["USED_LEASES"];
    delete ar_json["LEASES"];
    delete ar_json["MAC_END"];
    delete ar_json["IP_END"];
    delete ar_json["IP6_ULA"];
    delete ar_json["IP6_ULA_END"];
    delete ar_json["IP6_GLOBAL"];
    delete ar_json["IP6_GLOBAL_END"];

    if (ar_json["SECURITY_GROUPS"] != undefined &&
        ar_json["SECURITY_GROUPS"].length != 0){

      var secgroups = ar_json["SECURITY_GROUPS"].split(",");

      this.securityGroupsTable.selectResourceTableSelect({ids: secgroups});
    }

    delete ar_json["SECURITY_GROUPS"];

    CustomTagsTable.fill(this.ar_section, ar_json);

    $('input[name$="ar_type"]',this.ar_section).prop("disabled", true);
    $('input[wizard_field="IPAM_MAD"]',this.ar_section).prop("disabled", true);
    $('input[wizard_field="IP"]',this.ar_section).prop("disabled", true);
    $('input[wizard_field="MAC"]',this.ar_section).prop("disabled", true);

    if (ar_json["PARENT_NETWORK_AR_ID"]){
      $("#update_ar_size", this.ar_section).prop("disabled", true);
      delete ar_json["PARENT_NETWORK_AR_ID"];
    }
  }
});
