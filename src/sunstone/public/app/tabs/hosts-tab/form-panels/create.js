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
    DEPENDENCIES
   */

  var BaseFormPanel = require('utils/form-panels/form-panel');
  var Sunstone = require('sunstone');
  var Locale = require('utils/locale');
  var Tips = require('utils/tips');
  var Notifier = require('utils/notifier');
  var ResourceSelect = require('utils/resource-select');
  var VCenterClusters = require('utils/vcenter/clusters');
  var Config = require('sunstone-config');
  var WizardFields = require('utils/wizard-fields');

  /*
    TEMPLATES
   */

  var TemplateWizardHTML = require('hbs!./create/wizard');

  /*
    CONSTANTS
   */

  var FORM_PANEL_ID = require('./create/formPanelId');
  var TAB_ID = require('../tabId');

  /*
    CONSTRUCTOR
   */

  function FormPanel() {
    this.formPanelId = FORM_PANEL_ID;
    this.tabId = TAB_ID;
    this.actions = {
      'create': {
        'title': Locale.tr("Create Host"),
        'buttonText': Locale.tr("Create"),
        'resetButton': true
      }
    }

    this.vCenterClusters = new VCenterClusters();

    var that = this;

    that.vmMadNameList = [];
    if (Config.onedConf.VM_MAD !== undefined) {
      $.each(Config.onedConf.VM_MAD, function(index, vmMad) {
        if (vmMad.SUNSTONE_NAME !== undefined) {
          that.vmMadNameList.push({
              'displayName': vmMad["SUNSTONE_NAME"],
              'driverName' : vmMad["NAME"]
          });
        }
      });
    }

    BaseFormPanel.call(this);
  };

  FormPanel.FORM_PANEL_ID = FORM_PANEL_ID;
  FormPanel.prototype = Object.create(BaseFormPanel.prototype);
  FormPanel.prototype.constructor = FormPanel;
  FormPanel.prototype.htmlWizard = _htmlWizard;
  FormPanel.prototype.submitWizard = _submitWizard;
  FormPanel.prototype.onShow = _onShow;
  FormPanel.prototype.setup = _setup;

  return FormPanel;

  /*
    FUNCTION DEFINITIONS
   */

  function _htmlWizard() {
    return TemplateWizardHTML({
      'formPanelId': this.formPanelId,
      'vCenterClustersHTML': this.vCenterClusters.html(),
      'vmMadNameList': this.vmMadNameList
    });
  }

  function _setup(context) {
    var that = this;

    $(".drivers", context).hide();

    $("#host_type_mad", context).on("change", function() {
      $("#vmm_mad", context).val(this.value).change();
      $("#im_mad", context).val(this.value).change();
      $(".vcenter_credentials", context).hide();
      $(".ec2_extra", context).hide();
      $(".one_extra", context).hide();
      $(".drivers", context).hide();
      $("#name_container", context).show();

      if (this.value == "custom") {
        Sunstone.showFormPanelSubmit(TAB_ID);
        $(".drivers", context).show();
      } else if (this.value == "vcenter") {
        $("#name_container", context).hide();
        $(".vcenter_credentials", context).show();
        Sunstone.hideFormPanelSubmit(TAB_ID);
      } else if (this.value == "ec2") {
        $(".ec2_extra", context).show();
        Sunstone.showFormPanelSubmit(TAB_ID);
      } else if (this.value == "one") {
        $(".one_extra", context).show();
        Sunstone.showFormPanelSubmit(TAB_ID);
      } else {
        Sunstone.showFormPanelSubmit(TAB_ID);
      }
    });

    context.off("click", ".add_custom_tag");
    context.on("click", ".add_custom_tag", function(){
      $("tbody.capacity_ec2", context).append(
          "<tr class='row_capacity'>\
            <td style='display: flex; justify-content: flex-start'>\
              <input class='capacity_key' type='text' name='key'>\
            </td>\
            <td>\
              <input class='capacity_value' type='number' min='0' name='value'>\
            </td>\
            <td style='width: 150%; display: flex; justify-content: flex-end'>\
              <a href='#''><i class='fas fa-times-circle remove-capacity'></i></a>\
            </td>\
          </tr>");
    });

    context.on("click", "tbody.capacity_ec2 i.remove-capacity", function(){
      var tr = $(this).closest('tr');
      tr.remove();
    });

    context.off("click", ".add_custom_tag", context);
    context.on("click", ".add_custom_tag", context, function(){
      $("tbody.capacity_one", context).append(
          "<tr class='row_capacity_one'>\
            <td style='display: flex; justify-content: flex-start'>\
              <input class='capacity_key' type='text' name='key'>\
            </td>\
            <td>\
              <input class='capacity_value' type='number' min='0' name='value'>\
            </td>\
            <td style='width: 150%; display: flex; justify-content: flex-end'>\
              <a href='#'><i class='fas fa-times-circle remove-capacity'></i></a>\
            </td>\
          </tr>");
    });

    context.on("click", "tbody.capacity_one i.remove-capacity", function(){
      var tr = $(this).closest('tr');
      tr.remove();
    });

    $("#host_type_mad", context).change();

    $("form.vcenter_credentials", context)
      .off('forminvalid.zf.abide').off('formvalid.zf.abide').off("submit");

    Foundation.reInit($("form.vcenter_credentials", context));

    $("form.vcenter_credentials", context)
      .on('forminvalid.zf.abide', function(ev, frm) {
      })
      .on('formvalid.zf.abide', function(ev, frm) {
        var vcenter_user = $("#vcenter_user", context).val();
        var vcenter_password = $("#vcenter_password", context).val();
        var vcenter_host = $("#vcenter_host", context).val();

        that.vCenterClusters.insert({
          container: context,
          vcenter_user: vcenter_user,
          vcenter_password: vcenter_password,
          vcenter_host: vcenter_host,
          success: function(){
            $("#vcenter_user", context).attr("disabled", "disabled");
            $("#vcenter_password", context).attr("disabled", "disabled");
            $("#vcenter_host", context).attr("disabled", "disabled");
            $(".import_vcenter_clusters_div", context).show();
          }
        });
        $("#import_vcenter_clusters", this.parentElement).prop("disabled", false);
      })
      .on("submit", function(ev) {
        ev.preventDefault();
      });

    $("#import_vcenter_clusters", context).on("click", function() {
      var cluster_id = $('#host_cluster_id .resource_list_select', context).val();
      if (!cluster_id) cluster_id = "-1";

      that.vCenterClusters.import(context, cluster_id);

      return false;
    });

    // Show custom driver input only when custom is selected in selects
    $('input[name="custom_vmm_mad"],' + 'input[name="custom_im_mad"]',
        context).parent().hide();

    $('select#vmm_mad', context).change(function() {
      if ($(this).val() == "custom")
          $('input[name="custom_vmm_mad"]').parent().show();
      else
          $('input[name="custom_vmm_mad"]').parent().hide();
    });

    $('select#im_mad', context).change(function() {
      if ($(this).val() == "custom")
          $('input[name="custom_im_mad"]').parent().show();
      else
          $('input[name="custom_im_mad"]').parent().hide();
    });

    Tips.setup();
    return false;
  }

  function _submitWizard(context) {
    var name = WizardFields.retrieveInput($('#name', context));

    var cluster_id = $('#host_cluster_id .resource_list_select', context).val();
    if (!cluster_id) cluster_id = "-1";

    var vmm_mad = $('select#vmm_mad', context).val();
    vmm_mad = vmm_mad == "custom" ? WizardFields.retrieveInput($('input[name="custom_vmm_mad"]')) : vmm_mad;
    var im_mad = $('select#im_mad', context).val();
    im_mad = im_mad == "custom" ? WizardFields.retrieveInput($('input[name="custom_im_mad"]')) : im_mad;

    var host_json = {
      "host": {
        "name": name,
        "vm_mad": vmm_mad,
        "im_mad": im_mad,
        "cluster_id": cluster_id
      }
    };

    if(vmm_mad == "ec2"){
      var capacity = [];
      var key = "";
      var value = "";
      var obj = {};
      var region_name = $('input[name="REGION_NAME"]').val();
      var ec2_access = $('input[name="EC2_ACCESS"]').val();
      var ec2_secret = $('input[name="EC2_SECRET"]').val();
      $('tr.row_capacity',context).each(function() {
        key = $("input[name='key']", this).val();
        value = $("input[name='value']", this).val();
        obj[key] = value;
        capacity.push(obj);
      });

      host_json["host"]["region_name"] = region_name;
      host_json["host"]["ec2_secret"] = ec2_secret;
      host_json["host"]["ec2_access"] = ec2_access;
      if (capacity.length > 0){
        host_json["host"]["capacity"] = capacity;
      }
    }

    if(vmm_mad == "one"){
      var user = $('input[name="ONE_USER"]').val();
      var pass = $('input[name="ONE_PASSWORD"]').val();
      var endpoint = $('input[name="ONE_ENDPOINT"]').val();
      var cpu = $('input[name="ONE_CAPACITY_CPU"]').val();
      var memory = $('input[name="ONE_CAPACITY_MEMORY"]').val();

      host_json["host"]["ONE_USER"] = user;
      host_json["host"]["ONE_PASSWORD"] = pass;
      host_json["host"]["ONE_ENDPOINT"] = endpoint;
      host_json["host"]["ONE_CAPACITY"] = {};
      host_json["host"]["ONE_CAPACITY"]["CPU"] = cpu;
      host_json["host"]["ONE_CAPACITY"]["MEMORY"] = memory;
    }
    //Create the OpenNebula.Host.
    //If it is successfull we refresh the list.
    Sunstone.runAction("Host.create", host_json);
    return false;
  }

  function _onShow(context) {
    $("#name", context).focus();

    var cluster_id = $("#host_cluster_id .resource_list_select", context).val();
    if (!cluster_id) cluster_id = "0";

    ResourceSelect.insert({
        context: $('#host_cluster_id', context),
        resourceName: 'Cluster',
        initValue: cluster_id
      });

    $("#host_type_mad", context).change();

    return false;
  }
});
