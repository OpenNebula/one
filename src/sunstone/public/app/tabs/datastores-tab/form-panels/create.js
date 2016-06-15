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
  /*
    DEPENDENCIES
   */

  //require('foundation.tab');
  var BaseFormPanel = require('utils/form-panels/form-panel');
  var Sunstone = require('sunstone');
  var Locale = require('utils/locale');
  var Notifier = require('utils/notifier');
  var Tips = require('utils/tips');
  var ResourceSelect = require('utils/resource-select');
  var Config = require('sunstone-config');

  /*
    TEMPLATES
   */

  var TemplateWizardHTML = require('hbs!./create/wizard');
  var TemplateAdvancedHTML = require('hbs!./create/advanced');

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
        'title': Locale.tr("Create Datastore"),
        'buttonText': Locale.tr("Create"),
        'resetButton': true
      }
    };

    BaseFormPanel.call(this);
  }

  FormPanel.FORM_PANEL_ID = FORM_PANEL_ID;
  FormPanel.prototype = Object.create(BaseFormPanel.prototype);
  FormPanel.prototype.constructor = FormPanel;
  FormPanel.prototype.htmlWizard = _htmlWizard;
  FormPanel.prototype.htmlAdvanced = _htmlAdvanced;
  FormPanel.prototype.submitWizard = _submitWizard;
  FormPanel.prototype.submitAdvanced = _submitAdvanced;
  FormPanel.prototype.onShow = _onShow;
  FormPanel.prototype.setup = _setup;

  return FormPanel;

  /*
    FUNCTION DEFINITIONS
   */

  function _htmlWizard() {
    return TemplateWizardHTML({
      'formPanelId': this.formPanelId,
    });
  }

  function _htmlAdvanced() {
    return TemplateAdvancedHTML({formPanelId: this.formPanelId});
  }

  function _onShow(dialog) {
    $("#name", dialog).focus();

    var cluster_id = $("div#cluster_id .resource_list_select", dialog).val();
    if (!cluster_id) cluster_id = "0";

    var cluster_id_raw = $("div#datastore_cluster_raw .resource_list_select", dialog).val();
    if (!cluster_id_raw) cluster_id_raw = "0";

    ResourceSelect.insert({
        context: $('#cluster_id', dialog),
        resourceName: 'Cluster',
        initValue: cluster_id
      });

    ResourceSelect.insert({
        context: $('#datastore_cluster_raw', dialog),
        resourceName: 'Cluster',
        initValue: cluster_id_raw
      });

    return false;
  }

  // Set up the create datastore dialog
  function _setup(dialog) {
    Tips.setup(dialog);

    // Show custom driver input only when custom is selected in selects
    $('input[name="ds_tab_custom_ds_mad"],' +
      'input[name="ds_tab_custom_tm_mad"]', dialog).parent().hide();

    $('select#ds_mad', dialog).change(function() {
      if ($(this).val() == "custom") {
          $('input[name="ds_tab_custom_ds_mad"]', dialog).parent().show();
      } else {
        _setRequiredFields(dialog, $(this).val());
        $('input[name="ds_tab_custom_ds_mad"]', dialog).parent().hide();
      }
    });

    $('select#tm_mad', dialog).change(function() {
      if ($(this).val() == "custom")
          $('input[name="ds_tab_custom_tm_mad"]', dialog).parent().show();
      else
          $('input[name="ds_tab_custom_tm_mad"]', dialog).parent().hide();
    });

    $('input[name="custom_vcenter_adapter_type"]',dialog).parent().hide();
    $('select#vcenter_adapter_type',dialog).change(function(){
      if ($(this).val() == "custom"){
        $('input[name="custom_vcenter_adapter_type"]',dialog).attr("required", true).parent().show();
      } else {
        $('input[name="custom_vcenter_adapter_type"]',dialog).attr("required", false).parent().hide();
      }
    });

    $('input[name="custom_vcenter_disk_type"]',dialog).parent().hide();
    $('select#vcenter_disk_type',dialog).change(function(){
      if ($(this).val() == "custom"){
        $('input[name="custom_vcenter_disk_type"]',dialog).attr("required", true).parent().show();
      } else {
        $('input[name="custom_vcenter_disk_type"]',dialog).attr("required", false).parent().hide();
      }
    });

    $('#presets', dialog).change(function() {
      _hideAll(dialog);
      var choice_str = $(this).val();

      if (choice_str == "custom"){
        $(".drivers", dialog).show();
      } else {
        $(".drivers", dialog).hide();

        var opt = $("option:checked", $(this));

        $('select#ds_mad', dialog).val($(opt).attr("ds")).change();
        $('select#tm_mad', dialog).val($(opt).attr("tm")).change();
      }

      $('select#vcenter_adapter_type', dialog).attr('required', false);
      $('select#vcenter_disk_type', dialog).attr('required', false);

      $('input[name="custom_vcenter_adapter_type"]',dialog).attr('required', false);
      $('input[name="custom_vcenter_disk_type"]',dialog).attr('required', false);

      switch (choice_str){
        case "fs_shared":
          _selectFilesystem(dialog);
          break;
        
        case "fs_ssh":
          _selectFilesystem(dialog);
          break;
        
        case "fs_qcow2":
          $('input#file_ds_type', dialog).attr('disabled', 'disabled');
          _selectFilesystem(dialog);
          break;
        
        case "ceph":
          $('input#file_ds_type', dialog).attr('disabled', 'disabled');
          _selectCeph(dialog);
          break;
        
        case "vcenter":
          $('input#system_ds_type', dialog).attr('disabled', 'disabled');
          $('input#file_ds_type', dialog).attr('disabled', 'disabled');

          $('select#vcenter_adapter_type', dialog).attr('required', true);
          $('select#vcenter_disk_type', dialog).attr('required', true);

          _selectvCenter(dialog);
          break;
        
        case "lvm":
          $('input#file_ds_type', dialog).attr('disabled', 'disabled');
          _selectFsLvm(dialog);
          break;
        
        case "raw":
          $('input#system_ds_type', dialog).attr('disabled', 'disabled');
          $('input#file_ds_type', dialog).attr('disabled', 'disabled');
          _selectDevices(dialog);
          break;
        
        case "iscsi_libvirt":
          $('input#system_ds_type', dialog).attr('disabled', 'disabled');
          $('input#file_ds_type', dialog).attr('disabled', 'disabled');
          _selectISCSI(dialog);
          break;
        
        case 'custom':
          _selectCustom(dialog);
          break;
      }
    });

    $('#presets', dialog).change();
  }


  function _submitWizard(dialog) {
    var name            = $('#name', dialog).val();
    var cluster_id      = $(".resource_list_select", $('#cluster_id', dialog)).val();
    var ds_type         = $('input[name=ds_type]:checked', dialog).val();
    var ds_mad          = $('#ds_mad', dialog).val();
    ds_mad              = ds_mad == "custom" ? $('input[name="ds_tab_custom_ds_mad"]', dialog).val() : ds_mad;
    var tm_mad          = $('#tm_mad', dialog).val();
    tm_mad              = tm_mad == "custom" ? $('input[name="ds_tab_custom_tm_mad"]', dialog).val() : tm_mad;
    var type            = $('#disk_type', dialog).val();

    var safe_dirs       = $('#safe_dirs', dialog).val();
    var restricted_dirs = $('#restricted_dirs', dialog).val();
    var limit_transfer_bw = $('#limit_transfer_bw', dialog).val();
    var datastore_capacity_check = $('#datastore_capacity_check', dialog).is(':checked');
    var no_decompress   = $('#no_decompress', dialog).is(':checked');

    var bridge_list     = $('#bridge_list', dialog).val();
    var ds_tmp_dir     = $('#ds_tmp_dir', dialog).val();
    var vg_name         = $('#vg_name', dialog).val();
    var limit_mb        = $('#limit_mb', dialog).val();
    var gluster_host    = $('#gluster_host', dialog).val();
    var gluster_volume  = $('#gluster_volume', dialog).val();
    var pool_name       = $('#pool_name', dialog).val();
    var ceph_host       = $('#ceph_host', dialog).val();
    var ceph_secret     = $('#ceph_secret', dialog).val();
    var ceph_user       = $('#ceph_user', dialog).val();
    var rbd_format      = $('#rbd_format', dialog).val();
    var staging_dir     = $('#staging_dir', dialog).val();
    var ceph_conf       = $('#ceph_conf', dialog).val();
    var iscsi_host      = $('#iscsi_host', dialog).val();
    var iscsi_user      = $('#iscsi_user', dialog).val();
    var iscsi_usage     = $('#iscsi_usage', dialog).val();
    var vcenter_cluster = $('#vcenter_cluster', dialog).val();
    var vcenter_adapter_type  = $('#vcenter_adapter_type', dialog).val();
    vcenter_adapter_type      = vcenter_adapter_type == "custom" ? $('input[name="custom_vcenter_adapter_type"]', dialog).val() : vcenter_adapter_type;
    var vcenter_disk_type     = $('#vcenter_disk_type', dialog).val();
    vcenter_disk_type         = vcenter_disk_type == "custom" ? $('input[name="custom_vcenter_disk_type"]', dialog).val() : vcenter_disk_type;
    var ds_obj = {
      "datastore" : {
        "name" : name,
        "tm_mad" : tm_mad,
        "disk_type" : type,
        "type" : ds_type
      },
      "cluster_id" : cluster_id
    };

    // If we are adding a system datastore then
    // we do not use ds_mad
    if (ds_type != "SYSTEM_DS")
        ds_obj.datastore.ds_mad = ds_mad;

    if (safe_dirs)
        ds_obj.datastore.safe_dirs = safe_dirs;

    if (restricted_dirs)
        ds_obj.datastore.restricted_dirs = restricted_dirs;

    if (limit_transfer_bw)
        ds_obj.datastore.limit_transfer_bw = limit_transfer_bw;

    if (no_decompress)
        ds_obj.datastore.no_decompress = "YES";

    if (datastore_capacity_check)
        ds_obj.datastore.datastore_capacity_check = "YES";

    if (bridge_list)
        ds_obj.datastore.bridge_list = bridge_list;

    if (ds_tmp_dir)
        ds_obj.datastore.ds_tmp_dir = ds_tmp_dir;

    if (vg_name)
        ds_obj.datastore.vg_name = vg_name;

    if (limit_mb)
        ds_obj.datastore.limit_mb = limit_mb;

    if (gluster_host)
        ds_obj.datastore.gluster_host = gluster_host;

    if (gluster_volume)
        ds_obj.datastore.gluster_volume = gluster_volume;

    if (pool_name)
        ds_obj.datastore.pool_name = pool_name;

    if (ceph_host)
        ds_obj.datastore.ceph_host = ceph_host;

    if (ceph_secret)
        ds_obj.datastore.ceph_secret = ceph_secret;

    if (ceph_user)
        ds_obj.datastore.ceph_user = ceph_user;

    if (rbd_format)
        ds_obj.datastore.rbd_format = rbd_format;

    if (staging_dir)
        ds_obj.datastore.staging_dir = staging_dir;

    if (ceph_conf)
        ds_obj.datastore.ceph_conf = ceph_conf;

    if (iscsi_host)
        ds_obj.datastore.iscsi_host = iscsi_host;

    if (iscsi_user)
        ds_obj.datastore.iscsi_user = iscsi_user;

    if (iscsi_usage)
        ds_obj.datastore.iscsi_usage = iscsi_usage;

    if (vcenter_cluster)
        ds_obj.datastore.vcenter_cluster = vcenter_cluster;

    if (vcenter_adapter_type)
        ds_obj.datastore.adapter_type = vcenter_adapter_type;

    if (vcenter_disk_type)
        ds_obj.datastore.disk_type = vcenter_disk_type;

    Sunstone.runAction("Datastore.create", ds_obj);
    return false;
  }

  function _submitAdvanced(dialog) {
    var template   = $('#template', dialog).val();
    var cluster_id = $(".resource_list_select", $('#datastore_cluster_raw', dialog)).val();

    if (!cluster_id) {
      Notifier.notifyError(Locale.tr("Please select a cluster for this datastore"));
      return false;
    }

    var ds_obj = {
      "datastore" : {
        "datastore_raw" : template
      },
      "cluster_id" : cluster_id
    };

    Sunstone.runAction("Datastore.create", ds_obj);
    return false;
  }

  /**
   * Hide all the options that depend on datastore type, and resets default
   * values for selects
   */
  function _hideAll(dialog) {
    $('label[for="bridge_list"],input#bridge_list', dialog).parent().hide();
    $('label[for="ds_tmp_dir"],input#ds_tmp_dir', dialog).parent().hide();
    $('label[for="vg_name"],input#vg_name', dialog).hide();
    $('label[for="gluster_host"],input#gluster_host', dialog).parent().hide();
    $('label[for="gluster_volume"],input#gluster_volume', dialog).parent().hide();
    $('label[for="pool_name"],input#pool_name', dialog).parent().hide();
    $('label[for="ceph_host"],input#ceph_host', dialog).parent().hide();
    $('label[for="ceph_secret"],input#ceph_secret', dialog).parent().hide();
    $('label[for="ceph_user"],input#ceph_user', dialog).parent().hide();
    $('label[for="rbd_format"],input#rbd_format', dialog).parent().hide();
    $('label[for="staging_dir"],input#staging_dir', dialog).parent().hide();
    $('label[for="ceph_conf"],input#ceph_conf', dialog).parent().hide();
    $('label[for="iscsi_host"],input#iscsi_host', dialog).parent().hide();
    $('label[for="iscsi_user"],input#iscsi_user', dialog).parent().hide();
    $('label[for="iscsi_usage"],input#iscsi_usage', dialog).parent().hide();
    $('label[for="vcenter_cluster"],input#vcenter_cluster', dialog).parent().hide();
    $('label[for="vcenter_adapter_type"],input#vcenter_adapter_type', dialog).parent().hide();
    $('label[for="vcenter_disk_type"],input#vcenter_disk_type', dialog).parent().hide();
    $('label[for="limit_transfer_bw"],input#limit_transfer_bw', dialog).parent().hide();
    $('label[for="no_decompress"],input#no_decompress', dialog).parent().hide();

    $('input[name="ds_tab_custom_ds_mad"]', dialog).parent().hide();
    $('input[name="ds_tab_custom_tm_mad"]', dialog).parent().hide();

    $(".disk_type_wrapper", dialog).hide();

    _resetAll(dialog);
  }

  function _showAll(dialog) {
    $('label[for="bridge_list"],input#bridge_list', dialog).parent().show();
    $('label[for="ds_tmp_dir"],input#ds_tmp_dir', dialog).parent().show();
    $('label[for="vg_name"],input#vg_name', dialog).show();
    $('label[for="gluster_host"],input#gluster_host', dialog).parent().show();
    $('label[for="gluster_volume"],input#gluster_volume', dialog).parent().show();
    $('label[for="pool_name"],input#pool_name', dialog).parent().show();
    $('label[for="ceph_host"],input#ceph_host', dialog).parent().show();
    $('label[for="ceph_secret"],input#ceph_secret', dialog).parent().show();
    $('label[for="ceph_user"],input#ceph_user', dialog).parent().show();
    $('label[for="rbd_format"],input#rbd_format', dialog).parent().show();
    $('label[for="staging_dir"],input#staging_dir', dialog).parent().show();
    $('label[for="ceph_conf"],input#ceph_conf', dialog).parent().show();
    $('label[for="iscsi_host"],input#iscsi_host', dialog).parent().show();
    $('label[for="iscsi_user"],input#iscsi_user', dialog).parent().show();
    $('label[for="iscsi_usage"],input#iscsi_usage', dialog).parent().show();
    $('label[for="vcenter_cluster"],input#vcenter_cluster', dialog).parent().show();
    $('label[for="vcenter_adapter_type"],input#vcenter_adapter_type', dialog).parent().show();
    $('label[for="vcenter_disk_type"],input#vcenter_disk_type', dialog).parent().show();
    $('label[for="limit_transfer_bw"],input#limit_transfer_bw', dialog).parent().show();
    $('label[for="no_decompress"],input#no_decompress', dialog).parent().show();

    $('input[name="ds_tab_custom_ds_mad"]', dialog).parent().show();
    $('input[name="ds_tab_custom_tm_mad"]', dialog).parent().show();

    $(".disk_type_wrapper", dialog).show();

    _resetAll(dialog);
  }

  function _resetAll(dialog) {
    $('input#image_ds_type', dialog).click();
    $('input[name=ds_type]', dialog).removeAttr('disabled', 'disabled');

    $('select#ds_mad', dialog).removeAttr('disabled');
    $('select#tm_mad', dialog).removeAttr('disabled');
    $('select#tm_mad', dialog).children('option').each(function() {
        $(this).removeAttr('disabled');
      });
    $('select#disk_type', dialog).removeAttr('disabled');
    $('select#disk_type', dialog).children('option').each(function() {
        $(this).removeAttr('disabled');
      });
  }

  function _selectFilesystem(dialog) {
    $('select#disk_type', dialog).val('file');
    $('label[for="limit_transfer_bw"],input#limit_transfer_bw', dialog).parent().fadeIn();
    $('label[for="no_decompress"],input#no_decompress', dialog).parent().fadeIn();
    $('label[for="datastore_capacity_check"],input#datastore_capacity_check', dialog).parent().fadeIn();
    $('input#safe_dirs', dialog).removeAttr('disabled');
    $('input#limit_mb', dialog).removeAttr('disabled');
    $('input#restricted_dirs', dialog).removeAttr('disabled');
    $('label[for="bridge_list"],input#bridge_list', dialog).parent().fadeIn();
    $('label[for="staging_dir"],input#staging_dir', dialog).parent().fadeIn();
  }

  function _selectCeph(dialog) {
    $('label[for="bridge_list"],input#bridge_list', dialog).parent().fadeIn();
    $('label[for="pool_name"],input#pool_name', dialog).parent().fadeIn();
    $('label[for="ceph_host"],input#ceph_host', dialog).parent().fadeIn();
    $('label[for="ceph_secret"],input#ceph_secret', dialog).parent().fadeIn();
    $('label[for="ceph_user"],input#ceph_user', dialog).parent().fadeIn();
    $('label[for="rbd_format"],input#rbd_format', dialog).parent().fadeIn();
    $('label[for="staging_dir"],input#staging_dir', dialog).parent().fadeIn();
    $('label[for="ceph_conf"],input#ceph_conf', dialog).parent().fadeIn();
    $('label[for="limit_transfer_bw"],input#limit_transfer_bw', dialog).parent().fadeIn();
    $('label[for="no_decompress"],input#no_decompress', dialog).parent().fadeIn();
    $('label[for="datastore_capacity_check"],input#datastore_capacity_check', dialog).parent().fadeIn();
    $('select#disk_type', dialog).val('RBD');
    $('input#safe_dirs', dialog).removeAttr('disabled');
    $('input#limit_mb', dialog).removeAttr('disabled');
    $('input#restricted_dirs', dialog).removeAttr('disabled');
  }

  function _selectFsLvm(dialog) {
    $('label[for="limit_transfer_bw"],input#limit_transfer_bw', dialog).parent().fadeIn();
    $('label[for="no_decompress"],input#no_decompress', dialog).parent().fadeIn();
    $('label[for="datastore_capacity_check"],input#datastore_capacity_check', dialog).parent().fadeIn();
    $('select#disk_type', dialog).val('block');
    $('input#safe_dirs', dialog).removeAttr('disabled');
    $('input#limit_mb', dialog).removeAttr('disabled');
    $('input#restricted_dirs', dialog).removeAttr('disabled');
  }

  function _selectDevices(dialog) {
    $('select#disk_type', dialog).val('block');
    $('label[for="limit_transfer_bw"],input#limit_transfer_bw', dialog).parent().hide();
    $('label[for="no_decompress"],input#no_decompress', dialog).parent().hide();
    $('label[for="datastore_capacity_check"],input#datastore_capacity_check', dialog).parent().hide();
    $('input#safe_dirs', dialog).attr('disabled', 'disabled');
    $('input#limit_mb', dialog).attr('disabled', 'disabled');
    $('input#restricted_dirs', dialog).attr('disabled', 'disabled');
  }

  function _selectISCSI(dialog) {
    $('label[for="iscsi_host"],input#iscsi_host', dialog).parent().fadeIn();
    $('label[for="iscsi_user"],input#iscsi_user', dialog).parent().fadeIn();
    $('label[for="iscsi_usage"],input#iscsi_usage', dialog).parent().fadeIn();
    $('select#disk_type', dialog).val('iscsi');
    $('label[for="limit_transfer_bw"],input#limit_transfer_bw', dialog).parent().hide();
    $('label[for="no_decompress"],input#no_decompress', dialog).parent().hide();
    $('label[for="datastore_capacity_check"],input#datastore_capacity_check', dialog).parent().hide();
    $('input#safe_dirs', dialog).attr('disabled', 'disabled');
    $('input#limit_mb', dialog).attr('disabled', 'disabled');
    $('input#restricted_dirs', dialog).attr('disabled', 'disabled');
  }

  function _selectvCenter(dialog) {
    $('select#disk_type', dialog).val('block');
    $('label[for="limit_transfer_bw"],input#limit_transfer_bw', dialog).parent().hide();
    $('label[for="no_decompress"],input#no_decompress', dialog).parent().hide();
    $('label[for="datastore_capacity_check"],input#datastore_capacity_check', dialog).parent().hide();
    $('input#safe_dirs', dialog).attr('disabled', 'disabled');
    $('input#limit_mb', dialog).attr('disabled', 'disabled');
    $('input#restricted_dirs', dialog).attr('disabled', 'disabled');
    $('label[for="vcenter_cluster"],input#vcenter_cluster', dialog).parent().fadeIn();
    $('label[for="vcenter_adapter_type"],input#vcenter_adapter_type', dialog).parent().fadeIn();
    $('label[for="vcenter_disk_type"],input#vcenter_disk_type', dialog).parent().fadeIn();
  }

  function _selectCustom(dialog) {
    _showAll(dialog);

    $('select#ds_mad', dialog).val('fs').change();
    $('select#tm_mad', dialog).val('shared').change();
    $('input#safe_dirs', dialog).removeAttr('disabled');
    $('input#limit_mb', dialog).removeAttr('disabled');
    $('input#restricted_dirs', dialog).removeAttr('disabled');
    $('label[for="limit_transfer_bw"],input#limit_transfer_bw', dialog).parent().fadeIn();
    $('label[for="no_decompress"],input#no_decompress', dialog).parent().fadeIn();
    $('label[for="datastore_capacity_check"],input#datastore_capacity_check', dialog).parent().fadeIn();
  }

  function _setRequiredFields(dialog, mad) {
    // Disable all required attributes except for those that come in the
    // template.
    $('[required_active]', dialog).removeAttr('required')
                                       .removeAttr('required_active');

    if (Config.onedConf.DS_MAD_CONF !== undefined) {
      $.each(Config.onedConf.DS_MAD_CONF, function(i, e){
          if (e["NAME"] == mad) {
            if (!$.isEmptyObject(e["REQUIRED_ATTRS"])) {
              $.each(e["REQUIRED_ATTRS"].split(","), function(i, e){
                $('#' + e.toLowerCase(), dialog).attr('required', true).attr('required_active', '');
              });
            }
            return false;
          }
        }
      );
    }
  }
});

