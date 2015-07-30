define(function(require) {
  /*
    DEPENDENCIES
   */

  var Locale = require('utils/locale');
  var Config = require('sunstone-config');
  var Sunstone = require('sunstone');
  var Humanize = require('utils/humanize');
  var StateActions = require('../utils/state-actions');
  var OpenNebulaVM = require('opennebula/vm');
  var Tree = require('utils/tree');
  var TemplateHtml = require('hbs!./storage/html');
  var DiskDetailsHtml = require('hbs!./storage/disk-details');

  /*
    CONSTANTS
   */

  var TAB_ID = require('../tabId');
  var PANEL_ID = require('./storage/panelId');
  var ATTACH_DISK_DIALOG_ID = require('../dialogs/attach-disk/dialogId');
  var DISK_SNAPSHOT_DIALOG_ID = require('../dialogs/disk-snapshot/dialogId');
  var DISK_SAVEAS_DIALOG_ID = require('../dialogs/disk-saveas/dialogId');
  var CONFIRM_DIALOG_ID = require('utils/dialogs/generic-confirm/dialogId');
  var RESOURCE = "VM"
  var XML_ROOT = "VM"

  /*
    CONSTRUCTOR
   */

  function Panel(info) {
    this.panelId = PANEL_ID;
    this.title = Locale.tr("Storage");
    this.icon = "fa-tasks";

    this.element = info[XML_ROOT];

    return this;
  };

  Panel.PANEL_ID = PANEL_ID;
  Panel.prototype.html = _html;
  Panel.prototype.setup = _setup;
  Panel.prototype.getState = _getState;
  Panel.prototype.setState = _setState;

  return Panel;

  /*
    FUNCTION DEFINITIONS
   */

  function _html() {
    return TemplateHtml({element: this.element});
  }

  function _setup(context) {
    var that = this;

    var snapshots = [];
    if ($.isArray(this.element.SNAPSHOTS)){
      snapshots = this.element.SNAPSHOTS;
    } else if (!$.isEmptyObject(this.element.SNAPSHOTS)) {
      snapshots = [this.element.SNAPSHOTS];
    }

    var snapshotsHtml = {};

    $.each(snapshots, function(){
      var diskId = this.DISK_ID;
      var diskSnapshots = this.SNAPSHOT;

      if (!$.isArray(diskSnapshots)){
        diskSnapshots = [diskSnapshots];
      }

      var treeRoot = {
        htmlStr : '',
        subTree : []
      };

      var indexedSnapshots = {};
      var noParent = [];

      $.each(diskSnapshots, function(){
        indexedSnapshots[this.ID] = this;

        if(this.PARENT == "-1"){
          noParent.push(this.ID);
        }
      });

      $.each(noParent, function(){
        treeRoot.subTree.push(
          _makeTree(that, indexedSnapshots[this], indexedSnapshots)
        );
      });

      snapshotsHtml[diskId] = Tree.html(treeRoot);
    });

    var disks = [];
    if ($.isArray(that.element.TEMPLATE.DISK))
      disks = that.element.TEMPLATE.DISK;
    else if (!$.isEmptyObject(that.element.TEMPLATE.DISK))
      disks = [that.element.TEMPLATE.DISK];

    if (!$.isEmptyObject(that.element.TEMPLATE.CONTEXT)) {
      var context_disk = that.element.TEMPLATE.CONTEXT;

      context_disk["IMAGE"] = Locale.tr("Context");
      context_disk["CONTEXT"] = true;

      disks.push(context_disk);
    }

    var disksSize = {};
    var monitoringDisks = [];
    if ($.isArray(that.element.MONITORING.DISK_SIZE))
      monitoringDisks = that.element.MONITORING.DISK_SIZE;
    else if (!$.isEmptyObject(that.element.MONITORING.DISK_SIZE))
      monitoringDisks = [that.element.MONITORING.DISK_SIZE];

    $.each(monitoringDisks, function(index, monitoringDisk){
      disksSize[monitoringDisk.ID] = monitoringDisk.SIZE;
    })

    var disk_dt_data = [];
    if (disks.length) {

      for (var i = 0; i < disks.length; i++) {
        var disk = disks[i];

        // Save as
        if (
           (
            that.element.STATE == OpenNebulaVM.STATES.ACTIVE) &&
           (
            that.element.LCM_STATE == OpenNebulaVM.LCM_STATES.HOTPLUG_SAVEAS ||
            that.element.LCM_STATE == OpenNebulaVM.LCM_STATES.HOTPLUG_SAVEAS_POWEROFF ||
            that.element.LCM_STATE == OpenNebulaVM.LCM_STATES.HOTPLUG_SAVEAS_SUSPENDED) &&
           (
            disk.HOTPLUG_SAVE_AS_ACTIVE == "YES")
           ) {
          actions = Locale.tr('Save as in progress');
        }
        // Attach / Detach
        else if (
           (
            that.element.STATE == OpenNebulaVM.STATES.ACTIVE) &&
           (
            that.element.LCM_STATE == OpenNebulaVM.LCM_STATES.HOTPLUG) &&
           (
            disk.ATTACH = "YES")
           ) {
          actions = Locale.tr('attach/detach in progress');
        } else {
          actions = '';


          if (Config.isTabActionEnabled("vms-tab", "VM.disk_saveas")) {
            // Check if it's volatile
            if (disk.IMAGE_ID &&
                 StateActions.enabledStateAction("VM.disk_saveas", that.element.STATE, that.element.LCM_STATE)) {
              actions += '<a href="VM.disk_saveas" class="disk_saveas nowrap" >\
              <i class="fa fa-save fa-fw"></i>' + Locale.tr("Save as") + '</a> &emsp;';
            }
          }


          if (Config.isTabActionEnabled("vms-tab", "VM.detachdisk")) {
            if (StateActions.enabledStateAction("VM.detachdisk", that.element.STATE, that.element.LCM_STATE) && !disk.CONTEXT) {
              actions += ('<a href="VM.detachdisk" class="detachdisk nowrap" >\
              <i class="fa fa-times fa-fw"></i>' + Locale.tr("Detach") +
              '</a> &emsp;');
            }
          }

          if (Config.isTabActionEnabled("vms-tab", "VM.disk_snapshot_create")) {
            if (StateActions.enabledStateAction("VM.disk_snapshot_create", that.element.STATE, that.element.LCM_STATE) && !disk.CONTEXT) {
              actions += ('<a href="VM.disk_snapshot_create" class="disk_snapshot_create nowrap" >\
              <i class="fa fa-camera fa-fw"></i>' + Locale.tr("Snapshot") +
              '</a>');
            }
          }
        }

        var sizeStr = "";
        if (disk.SIZE) {
          sizeStr += Humanize.sizeFromMB(disk.SIZE);
        } else {
          sizeStr += '-';
        }
        sizeStr += '/';
        if (disksSize[disk.DISK_ID]) {
          sizeStr += Humanize.sizeFromMB(disksSize[disk.DISK_ID]);
        } else {
          sizeStr += '-';
        }

        disk_dt_data.push({
          DISK_ID : disk.DISK_ID,
          TARGET : disk.TARGET,
          IMAGE : (disk.IMAGE ? disk.IMAGE : (Humanize.sizeFromMB(disk.SIZE) + (disk.FORMAT ? (' - ' + disk.FORMAT) : ''))),
          SIZE: sizeStr,
          SAVE : ((disk.SAVE && disk.SAVE == 'YES') ? Locale.tr('YES') : Locale.tr('NO')),
          ACTIONS : actions,
          SNAPSHOTS : snapshotsHtml[disk.DISK_ID]
        });
      }
    }

    var disks_table = $("#tab_storage_form .disks_table", context).DataTable({
      "bDeferRender": true,
      "data": disk_dt_data,
      "columns": [
        {
          "class":          'open-control',
          "orderable":      false,
          "data":           null,
          "defaultContent": '<span class="fa fa-fw fa-chevron-down"></span>'
        },
        {"data": "DISK_ID",   "defaultContent": ""},
        {"data": "TARGET",    "defaultContent": ""},
        {"data": "IMAGE",     "defaultContent": "", "orderable": false},
        {"data": "SIZE",      "defaultContent": ""},
        {"data": "SAVE",      "defaultContent": "", "orderable": false},
        {"data": "ACTIONS",   "defaultContent": "", "orderable": false}
      ],

      "fnRowCallback": function(nRow, aData, iDisplayIndex, iDisplayIndexFull) {

        if (aData.SNAPSHOTS == undefined ||
            aData.SNAPSHOTS.length == 0) {

          $("td.open-control", nRow).html("").removeClass('open-control');
        }

        $(nRow).attr("disk_id", aData.DISK_ID);
      }
    });

    $("#tab_storage_form .disks_table", context).dataTable().fnSort([[1, 'asc']]);

    // Add event listener for opening and closing each row details
    context.off('click', '#tab_storage_form .disks_table td.open-control')
    context.on('click', '#tab_storage_form .disks_table td.open-control', function () {
      var row = $(this).closest('table').DataTable().row($(this).closest('tr'));

      if (row.child.isShown()) {
        row.child.hide();
        $(this).children("span").addClass('fa-chevron-down');
        $(this).children("span").removeClass('fa-chevron-up');
      } else {
        var html = DiskDetailsHtml({
          diskId: row.data().DISK_ID,
          snapshotsHTML: row.data().SNAPSHOTS
        });

        row.child(html).show();
        $(this).children("span").removeClass('fa-chevron-down');
        $(this).children("span").addClass('fa-chevron-up');
      }
    });

    if (Config.isTabActionEnabled("vms-tab", "VM.disk_saveas")) {
      context.off('click', '.disk_saveas');
      context.on('click', '.disk_saveas', function() {
        var disk_id = $(this).parents('tr').attr('disk_id');

        var dialog = Sunstone.getDialog(DISK_SAVEAS_DIALOG_ID);
        dialog.setParams(
          { element: that.element,
            diskId: disk_id
          });

        dialog.reset();
        dialog.show();
        return false;
      });
    }

    if (Config.isTabActionEnabled("vms-tab", "VM.attachdisk")) {
      if (!StateActions.enabledStateAction("VM.attachdisk", that.element.STATE, that.element.LCM_STATE)){
        $('#attach_disk', context).attr("disabled", "disabled");
      }

      context.off('click', '#attach_disk');
      context.on('click', '#attach_disk', function() {
        var dialog = Sunstone.getDialog(ATTACH_DISK_DIALOG_ID);
        dialog.setElement(that.element);
        dialog.show();
        return false;
      });
    }

    if (Config.isTabActionEnabled("vms-tab", "VM.detachdisk")) {
      context.off('click', '.detachdisk');
      context.on('click', '.detachdisk', function() {
        var disk_id = $(this).parents('tr').attr('disk_id');
        Sunstone.runAction('VM.detachdisk', that.element.ID, disk_id);
        return false;
      });
    }

    if (Config.isTabActionEnabled("vms-tab", "VM.disk_snapshot_create")) {
      context.off('click', '.disk_snapshot_create');
      context.on('click', '.disk_snapshot_create', function() {
        var disk_id = $(this).parents('tr').attr('disk_id');

        var dialog = Sunstone.getDialog(DISK_SNAPSHOT_DIALOG_ID);
        dialog.setParams(
          { element: that.element,
            diskId: disk_id
          });

        dialog.reset();
        dialog.show();
        return false;
      });
    }

    context.off("change", ".snapshot_check_item");
    context.on("change", ".snapshot_check_item", function() {
      var snapshotsSection = $(this).closest('.snapshots');

      // Unselect other check inputs
      var checked = $(this).is(':checked');
      $('.snapshot_check_item:checked', snapshotsSection).prop('checked', false);
      $(this).prop('checked', checked);

      // Enable/disable buttons
      if ($(this).is(":checked")) {
        $(".disk_snapshot_saveas", snapshotsSection).prop('disabled', false);
        $(".disk_snapshot_revert", snapshotsSection).prop('disabled', false);
        $(".disk_snapshot_delete", snapshotsSection).prop('disabled', false);
      } else {
        $(".disk_snapshot_saveas", snapshotsSection).prop('disabled', true);
        $(".disk_snapshot_revert", snapshotsSection).prop('disabled', true);
        $(".disk_snapshot_delete", snapshotsSection).prop('disabled', true);
      }
    });

    if (Config.isTabActionEnabled("vms-tab", "VM.disk_saveas")) {
      context.off('click', '.disk_snapshot_saveas');
      context.on('click', '.disk_snapshot_saveas', function() {
        var snapshotsSection = $(this).closest('.snapshots');

        var disk_id = snapshotsSection.attr('disk_id');
        var snapshot_id = $(".snapshot_check_item:checked", snapshotsSection).attr('snapshot_id');

        var dialog = Sunstone.getDialog(DISK_SAVEAS_DIALOG_ID);
        dialog.setParams(
          { element: that.element,
            diskId: disk_id,
            snapshotId: snapshot_id
          });

        dialog.reset();
        dialog.show();
        return false;
      });
    }

    if (Config.isTabActionEnabled("vms-tab", "VM.disk_snapshot_revert")) {
      context.off('click', '.disk_snapshot_revert');
      context.on('click', '.disk_snapshot_revert', function() {
        var snapshotsSection = $(this).closest('.snapshots');

        var disk_id = snapshotsSection.attr('disk_id');
        var snapshot_id = $(".snapshot_check_item:checked", snapshotsSection).attr('snapshot_id');

        Sunstone.runAction(
          'VM.disk_snapshot_revert',
          that.element.ID,
          { "disk_id": disk_id,
            "snapshot_id": snapshot_id
          });

        return false;
      });
    }

    if (Config.isTabActionEnabled("vms-tab", "VM.disk_snapshot_delete")) {
      context.off('click', '.disk_snapshot_delete');
      context.on('click', '.disk_snapshot_delete', function() {
        var snapshotsSection = $(this).closest('.snapshots');

        var disk_id = snapshotsSection.attr('disk_id');
        var snapshot_id = $(".snapshot_check_item:checked", snapshotsSection).attr('snapshot_id');

        Sunstone.getDialog(CONFIRM_DIALOG_ID).setParams({
          //header :
          body : Locale.tr("This will delete the disk snapshot "+snapshot_id),
          //question :
          submit : function(){
            Sunstone.runAction(
              'VM.disk_snapshot_delete',
              that.element.ID,
              { "disk_id": disk_id,
                "snapshot_id": snapshot_id
              });
          }
        });

        Sunstone.getDialog(CONFIRM_DIALOG_ID).reset();
        Sunstone.getDialog(CONFIRM_DIALOG_ID).show();

        return false;
      });
    }

    Tree.setup(context);
  }

  function _getState(context) {
    var state = {
      openDisksDetails : [],
      checkedSnapshots : []
    };

    $.each($("#tab_storage_form .disks_table .fa-chevron-up", context), function(){
      state.openDisksDetails.push($(this).closest("tr").attr("disk_id"));
    });

    $.each($('#tab_storage_form .disks_table .snapshot_check_item:checked', context), function(){
      state.checkedSnapshots.push({
        snapshot_id : $(this).attr("snapshot_id"),
        disk_id : $(this).closest(".snapshots").attr('disk_id')
      });
    });

    return state;
  }

  function _setState(state, context) {
    var that = this;

    $.each(state["openDisksDetails"], function(){
      $('#tab_storage_form .disks_table tr[disk_id="'+this+'"] td.open-control', context).click();
    });

    $.each(state["checkedSnapshots"], function(){
      $('#tab_storage_form .disks_table .snapshots[disk_id="'+this.disk_id+'"] '+
        '.snapshot_check_item[snapshot_id="'+this.snapshot_id+'"]', context).click();
    });
  }

  function _makeTree(that, snapshot, indexedSnapshots){
    var SPACE = '&nbsp;&nbsp;&nbsp;&nbsp;';

    var subTree = [];

    if (snapshot.CHILDREN){
      $.each(snapshot.CHILDREN.split(","), function(){
        subTree.push(
          _makeTree(that, indexedSnapshots[this], indexedSnapshots)
        );
      });
    }

    var html = '<div class="snapshot_row nowrap">'+
      '<input class="snapshot_check_item" type="checkbox" snapshot_id="'+snapshot.ID+'"/>'+
      SPACE + snapshot.ID + SPACE;

    var active = (snapshot.ACTIVE == "YES");

    if(active){
      html += '<i class="fa fa-play-circle-o fa-lg" title="'+
                Locale.tr("Active")+'"/>' + SPACE;
    }

    html += Humanize.prettyTime(snapshot.DATE) + SPACE +
            Humanize.sizeFromMB(snapshot.SIZE) + SPACE +
            (snapshot.NAME ? snapshot.NAME + SPACE : '');

    html += '</div>';

    return {
      htmlStr : html,
      subTree : subTree
    };
  }
});
