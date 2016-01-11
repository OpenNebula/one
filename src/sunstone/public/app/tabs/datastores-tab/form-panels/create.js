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
  /*
    DEPENDENCIES
   */

  require('foundation.tab');
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
    if (!cluster_id) cluster_id = "-1";

    var cluster_id_raw = $("div#datastore_cluster_raw .resource_list_select", dialog).val();
    if (!cluster_id_raw) cluster_id_raw = "-1";

    ResourceSelect.insert('div#cluster_id', dialog, "Cluster", cluster_id, false);
    ResourceSelect.insert('div#datastore_cluster_raw', dialog, "Cluster", cluster_id_raw, false);

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

    $('#presets', dialog).change(function() {
      _hideAll(dialog);
      var choice_str = $(this).val();

      // Disable all required attributes except for those that come in the
      // template.
      $('input[required_active]', dialog).removeAttr('required')
                                         .removeAttr('required_active');

      switch (choice_str)
      {
        case 'fs':
          _selectFilesystem(dialog);
          break;
        case 'vmware_vmfs':
          _selectVmwareVmfs(dialog);
          break;
        case 'block_lvm':
          _selectBlockLvm(dialog);
          break;
        case 'fs_lvm':
          _selectFsLvm(dialog);
          break;
        case 'ceph':
          _selectCeph(dialog);
          break;
        case 'gluster':
          _selectGluster(dialog);
          break;
        case 'dev':
          _selectDevices(dialog);
          break;
        case 'iscsi':
          _selectISCSI(dialog);
          break;
        case 'custom':
          _selectCustom(dialog);
          break;
      }
    });

    $('#presets', dialog).change();

    // Hide disk_type
    $('select#disk_type', dialog).parent().hide();

    _hideAll(dialog);
    _selectFilesystem(dialog);
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
    var base_path       = $('#base_path', dialog).val();
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

    if (base_path)
        ds_obj.datastore.base_path = base_path;

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

  function _hideAll(dialog) {
    // Hide all the options that depends on datastore type
    // and reset the selects

    $('input#image_ds_type', dialog).click();
    $('input[name=ds_type]', dialog).removeAttr('disabled', 'disabled');

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
    $('label[for="limit_transfer_bw"],input#limit_transfer_bw', dialog).parent().hide();
    $('label[for="no_decompress"],input#no_decompress', dialog).parent().hide();
    $('select#ds_mad', dialog).removeAttr('disabled');
    $('select#tm_mad', dialog).removeAttr('disabled');
    $('select#tm_mad', dialog).children('option').each(function() {
        $(this).removeAttr('disabled');
      });
    $('select#disk_type', dialog).removeAttr('disabled');
    $('select#disk_type', dialog).children('option').each(function() {
        $(this).removeAttr('disabled');
      });

    $('input[name="ds_tab_custom_ds_mad"]', dialog).parent().hide();
    $('input[name="ds_tab_custom_tm_mad"]', dialog).parent().hide();
  }

  function _selectFilesystem(dialog) {
    $('select#ds_mad', dialog).val('fs').change();
    $('select#tm_mad', dialog).val('shared');
    $('select#ds_mad', dialog).attr('disabled', 'disabled');
    $('select#tm_mad', dialog).children('option').each(function() {
        var value_str = $(this).val();
        $(this).attr('disabled', 'disabled');
        if (value_str == "qcow2"  ||
            value_str == "shared" ||
            value_str == "ssh") {
          $(this).removeAttr('disabled');
        }
      });
    $('select#disk_type', dialog).val('file');
    $('select#disk_type', dialog).attr('disabled', 'disabled');
    $('label[for="limit_transfer_bw"],input#limit_transfer_bw', dialog).parent().fadeIn();
    $('label[for="no_decompress"],input#no_decompress', dialog).parent().fadeIn();
    $('label[for="datastore_capacity_check"],input#datastore_capacity_check', dialog).parent().fadeIn();
    $('input#safe_dirs', dialog).removeAttr('disabled');
    $('select#disk_type', dialog).removeAttr('disabled');
    $('input#base_path', dialog).removeAttr('disabled');
    $('input#limit_mb', dialog).removeAttr('disabled');
    $('input#restricted_dirs', dialog).removeAttr('disabled');
    $('label[for="bridge_list"],input#bridge_list', dialog).parent().fadeIn();
    $('label[for="staging_dir"],input#staging_dir', dialog).parent().fadeIn();
  }

  function _selectVmwareVmfs(dialog) {
    $('label[for="bridge_list"],input#bridge_list', dialog).parent().fadeIn();
    $('label[for="ds_tmp_dir"],input#ds_tmp_dir', dialog).parent().fadeIn();
    $('select#ds_mad', dialog).val('vmfs').change();
    $('select#ds_mad', dialog).attr('disabled', 'disabled');
    $('select#tm_mad', dialog).val('vmfs');
    $('select#tm_mad', dialog).attr('disabled', 'disabled');
    $('label[for="limit_transfer_bw"],input#limit_transfer_bw', dialog).parent().fadeIn();
    $('label[for="no_decompress"],input#no_decompress', dialog).parent().fadeIn();
    $('label[for="datastore_capacity_check"],input#datastore_capacity_check', dialog).parent().fadeIn();
    $('select#disk_type', dialog).val('file');
    $('select#disk_type', dialog).attr('disabled', 'disabled');
    $('input#safe_dirs', dialog).removeAttr('disabled');
    $('input#base_path', dialog).removeAttr('disabled');
    $('input#limit_mb', dialog).removeAttr('disabled');
    $('input#restricted_dirs', dialog).removeAttr('disabled');
  }

  function _selectCeph(dialog) {
    $('input#image_ds_type', dialog).click();
    $('input#file_ds_type', dialog).attr('disabled', 'disabled');
    $('select#ds_mad', dialog).val('ceph').change();
    $('select#ds_mad', dialog).attr('disabled', 'disabled');
    $('select#tm_mad', dialog).val('ceph');
    $('select#tm_mad', dialog).attr('disabled', 'disabled');
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
    $('select#disk_type', dialog).attr('disabled', 'disabled');
    $('input#safe_dirs', dialog).removeAttr('disabled');
    $('input#base_path', dialog).removeAttr('disabled');
    $('input#limit_mb', dialog).removeAttr('disabled');
    $('input#restricted_dirs', dialog).removeAttr('disabled');
  }

  function _selectBlockLvm(dialog) {
    $('select#ds_mad', dialog).val('lvm').change();
    $('select#ds_mad', dialog).attr('disabled', 'disabled');
    $('select#tm_mad', dialog).val('lvm');
    $('select#tm_mad', dialog).attr('disabled', 'disabled');
    $('input#image_ds_type', dialog).click();
    $('input[name=ds_type]', dialog).attr('disabled', 'disabled');
    $('label[for="bridge_list"],input#bridge_list', dialog).parent().fadeIn();
    $('label[for="vg_name"],input#vg_name', dialog).fadeIn();
    $('label[for="limit_transfer_bw"],input#limit_transfer_bw', dialog).parent().fadeIn();
    $('label[for="no_decompress"],input#no_decompress', dialog).parent().fadeIn();
    $('label[for="datastore_capacity_check"],input#datastore_capacity_check', dialog).parent().fadeIn();
    $('select#disk_type', dialog).val('block');
    $('select#disk_type', dialog).attr('disabled', 'disabled');
    $('input#safe_dirs', dialog).removeAttr('disabled');
    $('input#base_path', dialog).removeAttr('disabled');
    $('input#limit_mb', dialog).removeAttr('disabled');
    $('input#restricted_dirs', dialog).removeAttr('disabled');
  }

  function _selectFsLvm(dialog) {
    $('select#ds_mad', dialog).val('fs').change();
    $('select#ds_mad', dialog).attr('disabled', 'disabled');
    $('select#tm_mad', dialog).val('fs_lvm');
    $('select#tm_mad', dialog).attr('disabled', 'disabled');
    $('input#image_ds_type', dialog).click();
    $('input[name=ds_type]', dialog).attr('disabled', 'disabled');
    $('label[for="limit_transfer_bw"],input#limit_transfer_bw', dialog).parent().fadeIn();
    $('label[for="no_decompress"],input#no_decompress', dialog).parent().fadeIn();
    $('label[for="datastore_capacity_check"],input#datastore_capacity_check', dialog).parent().fadeIn();
    $('select#disk_type', dialog).val('block');
    $('select#disk_type', dialog).attr('disabled', 'disabled');
    $('input#safe_dirs', dialog).removeAttr('disabled');
    $('input#base_path', dialog).removeAttr('disabled');
    $('input#limit_mb', dialog).removeAttr('disabled');
    $('input#restricted_dirs', dialog).removeAttr('disabled');
  }

  function _selectGluster(dialog) {
    $('select#ds_mad', dialog).val('fs').change();
    $('select#ds_mad', dialog).attr('disabled', 'disabled');
    $('select#tm_mad', dialog).val('shared');
    $('select#tm_mad', dialog).children('option').each(function() {
        var value_str = $(this).val();
        $(this).attr('disabled', 'disabled');
        if (value_str == "shared"  ||
            value_str == "ssh") {
          $(this).removeAttr('disabled');
        }
      });
    $('input#image_ds_type', dialog).click();
    $('input[name=ds_type]', dialog).attr('disabled', 'disabled');
    $('select#disk_type', dialog).val('gluster');
    $('select#disk_type', dialog).attr('disabled', 'disabled');
    $('label[for="gluster_host"],input#gluster_host', dialog).parent().fadeIn();
    $('label[for="gluster_volume"],input#gluster_volume', dialog).parent().fadeIn();
    $('label[for="limit_transfer_bw"],input#limit_transfer_bw', dialog).parent().fadeIn();
    $('label[for="no_decompress"],input#no_decompress', dialog).parent().fadeIn();
    $('label[for="datastore_capacity_check"],input#datastore_capacity_check', dialog).parent().fadeIn();
    $('input#safe_dirs', dialog).removeAttr('disabled');
    $('input#base_path', dialog).removeAttr('disabled');
    $('input#limit_mb', dialog).removeAttr('disabled');
    $('input#restricted_dirs', dialog).removeAttr('disabled');
  }

  function _selectDevices(dialog) {
    $('select#ds_mad', dialog).val('dev').change();
    $('select#ds_mad', dialog).attr('disabled', 'disabled');
    $('select#tm_mad', dialog).val('dev');
    $('select#tm_mad', dialog).attr('disabled', 'disabled');
    $('input#image_ds_type', dialog).click();
    $('input[name=ds_type]', dialog).attr('disabled', 'disabled');
    $('select#disk_type', dialog).val('block');
    $('select#disk_type', dialog).attr('disabled', 'disabled');
    $('label[for="limit_transfer_bw"],input#limit_transfer_bw', dialog).parent().hide();
    $('label[for="no_decompress"],input#no_decompress', dialog).parent().hide();
    $('label[for="datastore_capacity_check"],input#datastore_capacity_check', dialog).parent().hide();
    $('input#safe_dirs', dialog).attr('disabled', 'disabled');
    $('input#base_path', dialog).attr('disabled', 'disabled');
    $('input#limit_mb', dialog).attr('disabled', 'disabled');
    $('input#restricted_dirs', dialog).attr('disabled', 'disabled');
  }

  function _selectISCSI(dialog) {
    $('select#ds_mad', dialog).val('iscsi').change();
    $('select#ds_mad', dialog).attr('disabled', 'disabled');
    $('select#tm_mad', dialog).val('iscsi');
    $('select#tm_mad', dialog).attr('disabled', 'disabled');
    $('input#image_ds_type', dialog).click();
    $('input[name=ds_type]', dialog).attr('disabled', 'disabled');
    $('label[for="iscsi_host"],input#iscsi_host', dialog).parent().fadeIn();
    $('label[for="iscsi_user"],input#iscsi_user', dialog).parent().fadeIn();
    $('label[for="iscsi_usage"],input#iscsi_usage', dialog).parent().fadeIn();
    $('select#disk_type', dialog).val('iscsi');
    $('select#disk_type', dialog).attr('disabled', 'disabled');
    $('label[for="limit_transfer_bw"],input#limit_transfer_bw', dialog).parent().hide();
    $('label[for="no_decompress"],input#no_decompress', dialog).parent().hide();
    $('label[for="datastore_capacity_check"],input#datastore_capacity_check', dialog).parent().hide();
    $('input#safe_dirs', dialog).attr('disabled', 'disabled');
    $('input#base_path', dialog).attr('disabled', 'disabled');
    $('input#limit_mb', dialog).attr('disabled', 'disabled');
    $('input#restricted_dirs', dialog).attr('disabled', 'disabled');
  }

  function _selectCustom(dialog) {
    _hideAll(dialog);
    $('select#ds_mad', dialog).val('fs').change();
    $('select#tm_mad', dialog).val('shared');
    $('input#safe_dirs', dialog).removeAttr('disabled');
    $('select#disk_type', dialog).removeAttr('disabled');
    $('input#base_path', dialog).removeAttr('disabled');
    $('input#limit_mb', dialog).removeAttr('disabled');
    $('input#restricted_dirs', dialog).removeAttr('disabled');
    $('label[for="limit_transfer_bw"],input#limit_transfer_bw', dialog).parent().fadeIn();
    $('label[for="no_decompress"],input#no_decompress', dialog).parent().fadeIn();
    $('label[for="datastore_capacity_check"],input#datastore_capacity_check', dialog).parent().fadeIn();
  }

  function _setRequiredFields(dialog, mad) {
    $.each(Config.dsMadConf, function(i, e){
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
});

