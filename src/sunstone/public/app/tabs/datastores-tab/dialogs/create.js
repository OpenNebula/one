define(function(require) {
  var TemplateHTML = require('hbs!./create/html');
  var Sunstone = require('sunstone');
  var Notifier = require('utils/notifier');
  var Tips = require('utils/tips');
  var ResourceSelect = require('utils/resource-select')
  var DIALOG_ID = require('./create/dialogId');

  var _html = function() {
    return TemplateHTML({dialogId: DIALOG_ID});
  }

  var _submit = function() {
    var name = $('#zonename', this).val();
    var endpoint = $("#endpoint", this).val();
    var zoneJSON = {"zone" : {"name" : name, "endpoint" : endpoint}};
    Sunstone.runAction("Zone.create", zoneJSON);
    return false;
  }

  var _onShow = function(dialog) {
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
      if ($(this).val() == "custom")
          $('input[name="ds_tab_custom_ds_mad"]').parent().show();
      else
          $('input[name="ds_tab_custom_ds_mad"]').parent().hide();
    });

    $('select#tm_mad', dialog).change(function() {
      if ($(this).val() == "custom")
          $('input[name="ds_tab_custom_tm_mad"]').parent().show();
      else
          $('input[name="ds_tab_custom_tm_mad"]').parent().hide();
    });

    $('#presets').change(function() {
      _hideAll(dialog);
      var choice_str = $(this).val();
      switch (choice_str)
      {
        case 'fs':
          _selectFilesystem();
          break;
        case 'vmware_vmfs':
          _selectVmwareVmfs();
          break;
        case 'block_lvm':
          _selectBlockLvm();
          break;
        case 'fs_lvm':
          _selectFsLvm();
          break;
        case 'ceph':
          _selectCeph();
          break;
        case 'gluster':
          _selectGluster();
          break;
        case 'dev':
          _selectDevices();
          break;
        case 'custom':
          _selectCustom();
          break;
      }
    });

    $('#create_datastore_submit', dialog).click(function() {
      var name            = $('#name', dialog).val();
      var cluster_id      = $(".resource_list_select", $('#cluster_id', dialog)).val();
      var ds_type         = $('input[name=ds_type]:checked', dialog).val();
      var ds_mad          = $('#ds_mad', dialog).val();
      ds_mad              = ds_mad == "custom" ? $('input[name="ds_tab_custom_ds_mad"]').val() : ds_mad;
      var tm_mad          = $('#tm_mad', dialog).val();
      tm_mad              = tm_mad == "custom" ? $('input[name="ds_tab_custom_tm_mad"]').val() : tm_mad;
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

      if (!name) {
        Notifier.notifyError("Please provide a name");
        return false;
      };

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

      Sunstone.runAction("Datastore.create", ds_obj);
      return false;
    });

    $('#create_datastore_submit_manual', dialog).click(function() {
      var template   = $('#template', dialog).val();
      var cluster_id = $(".resource_list_select", $('#datastore_cluster_raw', dialog)).val();

      if (!cluster_id) {
        Notifier.notifyError(tr("Please select a cluster for this datastore"));
        return false;
      };

      var ds_obj = {
        "datastore" : {
          "datastore_raw" : template
        },
        "cluster_id" : cluster_id
      };
      Sunstone.runAction("Datastore.create", ds_obj);
      return false;
    });

    $('#wizard_ds_reset_button').click(function() {
      dialog.html("");
      setupCreateDatastoreDialog();

      popUpCreateDatastoreDialog();
    });

    $('#advanced_ds_reset_button').click(function() {
      dialog.html("");
      setupCreateDatastoreDialog();

      popUpCreateDatastoreDialog();
      $("a[href='#datastore_manual']").click();
    });

    // Hide disk_type
    $('select#disk_type').parent().hide();

    _hideAll(dialog);
    _selectFilesystem();
  }

  var _hideAll = function(dialog) {
    // Hide all the options that depends on datastore type
    // and reset the selects

    $('input#image_ds_type').attr('checked', 'true');
    $('input[name=ds_type]').removeAttr('disabled', 'disabled');

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
    $('label[for="limit_transfer_bw"],input#limit_transfer_bw', dialog).parent().hide();
    $('label[for="no_decompress"],input#no_decompress', dialog).parent().hide();
    $('select#ds_mad').removeAttr('disabled');
    $('select#tm_mad').removeAttr('disabled');
    $('select#tm_mad').children('option').each(function() {
        $(this).removeAttr('disabled');
      });
    $('select#disk_type').removeAttr('disabled');
    $('select#disk_type').children('option').each(function() {
        $(this).removeAttr('disabled');
      });

    $('input[name="ds_tab_custom_ds_mad"]', dialog).parent().hide();
    $('input[name="ds_tab_custom_tm_mad"]', dialog).parent().hide();
  }

  var _selectFilesystem = function(dialog) {
    $('select#ds_mad').val('fs');
    $('select#tm_mad').val('shared');
    $('select#ds_mad').attr('disabled', 'disabled');
    $('select#tm_mad').children('option').each(function() {
        var value_str = $(this).val();
        $(this).attr('disabled', 'disabled');
        if (value_str == "qcow2"  ||
            value_str == "shared" ||
            value_str == "ssh") {
          $(this).removeAttr('disabled');
        }
      });
    $('select#disk_type').val('file');
    $('select#disk_type').attr('disabled', 'disabled');
    $('label[for="limit_transfer_bw"],input#limit_transfer_bw').parent().fadeIn();
    $('label[for="no_decompress"],input#no_decompress').parent().fadeIn();
    $('label[for="datastore_capacity_check"],input#datastore_capacity_check').parent().fadeIn();
    $('input#safe_dirs').removeAttr('disabled');
    $('select#disk_type').removeAttr('disabled');
    $('input#base_path').removeAttr('disabled');
    $('input#limit_mb').removeAttr('disabled');
    $('input#restricted_dirs').removeAttr('disabled');
    $('label[for="bridge_list"],input#bridge_list').parent().fadeIn();
    $('label[for="staging_dir"],input#staging_dir').parent().fadeIn();
  }

  var _selectVmwareVmfs = function(dialog) {
    $('label[for="bridge_list"],input#bridge_list').parent().fadeIn();
    $('label[for="ds_tmp_dir"],input#ds_tmp_dir').parent().fadeIn();
    $('select#ds_mad').val('vmfs');
    $('select#ds_mad').attr('disabled', 'disabled');
    $('select#tm_mad').val('vmfs');
    $('select#tm_mad').attr('disabled', 'disabled');
    $('label[for="limit_transfer_bw"],input#limit_transfer_bw').parent().fadeIn();
    $('label[for="no_decompress"],input#no_decompress').parent().fadeIn();
    $('label[for="datastore_capacity_check"],input#datastore_capacity_check').parent().fadeIn();
    $('select#disk_type').val('file');
    $('select#disk_type').attr('disabled', 'disabled');
    $('input#safe_dirs').removeAttr('disabled');
    $('input#base_path').removeAttr('disabled');
    $('input#limit_mb').removeAttr('disabled');
    $('input#restricted_dirs').removeAttr('disabled');
  }

  var _selectCeph = function(dialog) {
    $('input#image_ds_type').attr('checked', 'true');
    $('input[name=ds_type]').attr('disabled', 'disabled');
    $('select#ds_mad').val('ceph');
    $('select#ds_mad').attr('disabled', 'disabled');
    $('select#tm_mad').val('ceph');
    $('select#tm_mad').attr('disabled', 'disabled');
    $('label[for="bridge_list"],input#bridge_list').parent().fadeIn();
    $('label[for="pool_name"],input#pool_name').parent().fadeIn();
    $('label[for="ceph_host"],input#ceph_host').parent().fadeIn();
    $('label[for="ceph_secret"],input#ceph_secret').parent().fadeIn();
    $('label[for="ceph_user"],input#ceph_user').parent().fadeIn();
    $('label[for="rbd_format"],input#rbd_format').parent().fadeIn();
    $('label[for="staging_dir"],input#staging_dir').parent().fadeIn();
    $('label[for="limit_transfer_bw"],input#limit_transfer_bw').parent().fadeIn();
    $('label[for="no_decompress"],input#no_decompress').parent().fadeIn();
    $('label[for="datastore_capacity_check"],input#datastore_capacity_check').parent().fadeIn();
    $('select#disk_type').val('RBD');
    $('select#disk_type').attr('disabled', 'disabled');
    $('input#safe_dirs').removeAttr('disabled');
    $('input#base_path').removeAttr('disabled');
    $('input#limit_mb').removeAttr('disabled');
    $('input#restricted_dirs').removeAttr('disabled');
  }

  var _selectBlockLvm = function(dialog) {
    $('select#ds_mad').val('lvm');
    $('select#ds_mad').attr('disabled', 'disabled');
    $('select#tm_mad').val('lvm');
    $('select#tm_mad').attr('disabled', 'disabled');
    $('input#image_ds_type').attr('checked', 'true');
    $('input[name=ds_type]').attr('disabled', 'disabled');
    $('label[for="bridge_list"],input#bridge_list').parent().fadeIn();
    $('label[for="vg_name"],input#vg_name').fadeIn();
    $('label[for="limit_transfer_bw"],input#limit_transfer_bw').parent().fadeIn();
    $('label[for="no_decompress"],input#no_decompress').parent().fadeIn();
    $('label[for="datastore_capacity_check"],input#datastore_capacity_check').parent().fadeIn();
    $('select#disk_type').val('block');
    $('select#disk_type').attr('disabled', 'disabled');
    $('input#safe_dirs').removeAttr('disabled');
    $('input#base_path').removeAttr('disabled');
    $('input#limit_mb').removeAttr('disabled');
    $('input#restricted_dirs').removeAttr('disabled');
  }

  var _selectFsLvm = function(dialog) {
    $('select#ds_mad').val('fs');
    $('select#ds_mad').attr('disabled', 'disabled');
    $('select#tm_mad').val('fs_lvm');
    $('select#tm_mad').attr('disabled', 'disabled');
    $('input#image_ds_type').attr('checked', 'true');
    $('input[name=ds_type]').attr('disabled', 'disabled');
    $('label[for="limit_transfer_bw"],input#limit_transfer_bw').parent().fadeIn();
    $('label[for="no_decompress"],input#no_decompress').parent().fadeIn();
    $('label[for="datastore_capacity_check"],input#datastore_capacity_check').parent().fadeIn();
    $('select#disk_type').val('block');
    $('select#disk_type').attr('disabled', 'disabled');
    $('input#safe_dirs').removeAttr('disabled');
    $('input#base_path').removeAttr('disabled');
    $('input#limit_mb').removeAttr('disabled');
    $('input#restricted_dirs').removeAttr('disabled');
  }

  var _selectGluster = function(dialog) {
    $('select#ds_mad').val('fs');
    $('select#ds_mad').attr('disabled', 'disabled');
    $('select#tm_mad').val('shared');
    $('select#tm_mad').children('option').each(function() {
        var value_str = $(this).val();
        $(this).attr('disabled', 'disabled');
        if (value_str == "shared"  ||
            value_str == "ssh") {
          $(this).removeAttr('disabled');
        }
      });
    $('input#image_ds_type').attr('checked', 'true');
    $('input[name=ds_type]').attr('disabled', 'disabled');
    $('select#disk_type').val('gluster');
    $('select#disk_type').attr('disabled', 'disabled');
    $('label[for="gluster_host"],input#gluster_host').parent().fadeIn();
    $('label[for="gluster_volume"],input#gluster_volume').parent().fadeIn();
    $('label[for="limit_transfer_bw"],input#limit_transfer_bw').parent().fadeIn();
    $('label[for="no_decompress"],input#no_decompress').parent().fadeIn();
    $('label[for="datastore_capacity_check"],input#datastore_capacity_check').parent().fadeIn();
    $('input#safe_dirs').removeAttr('disabled');
    $('input#base_path').removeAttr('disabled');
    $('input#limit_mb').removeAttr('disabled');
    $('input#restricted_dirs').removeAttr('disabled');
  }

  var _selectDevices = function(dialog) {
    $('select#ds_mad').val('dev');
    $('select#ds_mad').attr('disabled', 'disabled');
    $('select#tm_mad').val('dev');
    $('select#tm_mad').attr('disabled', 'disabled');
    $('input#image_ds_type').attr('checked', 'true');
    $('input[name=ds_type]').attr('disabled', 'disabled');
    $('select#disk_type').val('block');
    $('select#disk_type').attr('disabled', 'disabled');
    $('label[for="limit_transfer_bw"],input#limit_transfer_bw').parent().hide();
    $('label[for="no_decompress"],input#no_decompress').parent().hide();
    $('label[for="datastore_capacity_check"],input#datastore_capacity_check').parent().hide();
    $('input#safe_dirs').attr('disabled', 'disabled');
    $('input#base_path').attr('disabled', 'disabled');
    $('input#limit_mb').attr('disabled', 'disabled');
    $('input#restricted_dirs').attr('disabled', 'disabled');
  }

  var _selectCustom = function(dialog) {
    _hideAll(dialog);
    $('select#ds_mad').val('fs');
    $('select#tm_mad').val('shared');
    $('input#safe_dirs').removeAttr('disabled');
    $('select#disk_type').removeAttr('disabled');
    $('input#base_path').removeAttr('disabled');
    $('input#limit_mb').removeAttr('disabled');
    $('input#restricted_dirs').removeAttr('disabled');
    $('label[for="limit_transfer_bw"],input#limit_transfer_bw').parent().fadeIn();
    $('label[for="no_decompress"],input#no_decompress').parent().fadeIn();
    $('label[for="datastore_capacity_check"],input#datastore_capacity_check').parent().fadeIn();
  }

  return {
    'dialogId': DIALOG_ID,
    'html': _html,
    'setup': _setup,
    'onShow': _onShow
  }
});
