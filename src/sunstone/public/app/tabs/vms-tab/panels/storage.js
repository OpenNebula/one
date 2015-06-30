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

  /*
    CONSTANTS
   */
  
  var TAB_ID = require('../tabId');
  var PANEL_ID = require('./storage/panelId');
  var ATTACH_DISK_DIALOG_ID = require('../dialogs/attach-disk/dialogId');
  var DISK_SNAPSHOT_DIALOG_ID = require('../dialogs/disk-snapshot/dialogId');
  var DISK_SAVEAS_DIALOG_ID = require('../dialogs/disk-saveas/dialogId');
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

  return Panel;

  /*
    FUNCTION DEFINITIONS
   */

  function _html() {
    var that = this;
    var html = '<form id="tab_storage_form" vmid="' + that.element.ID + '" >\
       <div class="row">\
       <div class="large-12 columns">\
          <table class="disks_table no-hover info_table dataTable extended_table">\
            <thead>\
              <tr>\
                 <th></th>\
                 <th>' + Locale.tr("ID") + '</th>\
                 <th>' + Locale.tr("Target") + '</th>\
                 <th>' + Locale.tr("Image / Format-Size") + '</th>\
                 <th>' + Locale.tr("Persistent") + '</th>\
                 <th>' + Locale.tr("Actions");

    if (Config.isTabActionEnabled("vms-tab", "VM.attachdisk")) {
      if (StateActions.enabledStateAction("VM.attachdisk", that.element.STATE, that.element.LCM_STATE)) {
        html += '\
          <span class="right">\
            <button id="attach_disk" class="button tiny success right radius" >' + Locale.tr("Attach disk") + '</button>\
          </span>';
      } else {
        html += '\
          <span class="right">\
            <button id="attach_disk" class="button tiny success right radius" disabled="disabled">' + Locale.tr("Attach disk") + '</button>\
          </span>';
      }
    }

    html +=     '</th>\
              </tr>\
            </thead>\
            <tbody>\
            </tbody>\
          </table>\
        </div>\
      </div>\
    </form>';

    return html;
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
          _makeTree(indexedSnapshots[this], indexedSnapshots)
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
              <i class="fa fa-save"></i>' + Locale.tr("Save as") + '</a> &emsp;';
            }
          }


          if (Config.isTabActionEnabled("vms-tab", "VM.detachdisk")) {
            if (StateActions.enabledStateAction("VM.detachdisk", that.element.STATE, that.element.LCM_STATE) && !disk.CONTEXT) {
              actions += ('<a href="VM.detachdisk" class="detachdisk nowrap" >\
              <i class="fa fa-times"></i>' + Locale.tr("Detach") +
              '</a> &emsp;');
            }
          }

          if (Config.isTabActionEnabled("vms-tab", "VM.disk_snapshot_create")) {
            // TODO: set disk_snapshot_create in state-actions.js
            //if (StateActions.enabledStateAction("VM.disk_snapshot_create", that.element.STATE, that.element.LCM_STATE) && !disk.CONTEXT) {
            if (!disk.CONTEXT) {
              actions += ('<a href="VM.disk_snapshot_create" class="disk_snapshot_create nowrap" >\
              <i class="fa fa-camera"></i>' + Locale.tr("Snapshot") +
              '</a>');
            }
          }
        }

        disk_dt_data.push({
          DISK_ID : disk.DISK_ID,
          TARGET : disk.TARGET,
          IMAGE : (disk.IMAGE ? disk.IMAGE : (Humanize.sizeFromMB(disk.SIZE) + (disk.FORMAT ? (' - ' + disk.FORMAT) : ''))),
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
        var html = '<div class="snapshots" disk_id='+row.data().DISK_ID+
                   ' style="padding-left: 30px; width:900px; overflow-x:auto">'+
          row.data().SNAPSHOTS+
          '</div>';

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

      context.off('click', '.disk_snapshot_saveas');
      context.on('click', '.disk_snapshot_saveas', function() {
        var disk_id = $(this).parents('.snapshots').attr('disk_id');
        var snapshot_id = $(this).parents('.snapshot_row').attr('snapshot_id');

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

    if (Config.isTabActionEnabled("vms-tab", "VM.attachdisk")) {
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

    if (Config.isTabActionEnabled("vms-tab", "VM.disk_snapshot_revert")) {
      context.off('click', '.disk_snapshot_revert');
      context.on('click', '.disk_snapshot_revert', function() {
        var disk_id = $(this).parents('.snapshots').attr('disk_id');
        var snapshot_id = $(this).parents('.snapshot_row').attr('snapshot_id');

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
        var disk_id = $(this).parents('.snapshots').attr('disk_id');
        var snapshot_id = $(this).parents('.snapshot_row').attr('snapshot_id');

        Sunstone.runAction(
          'VM.disk_snapshot_delete',
          that.element.ID,
          { "disk_id": disk_id,
            "snapshot_id": snapshot_id
          });

        return false;
      });
    }

    Tree.setup(context);
  }

  function _makeTree(snapshot, indexedSnapshots){
    var SPACE = '&nbsp;&nbsp;&nbsp;&nbsp;';

    var subTree = [];

    if (snapshot.CHILDREN){
      $.each(snapshot.CHILDREN.split(","), function(){
        subTree.push(
          _makeTree(indexedSnapshots[this], indexedSnapshots)
        );
      });
    }

    var html = '<div class="snapshot_row nowrap" snapshot_id='+snapshot.ID+'>';

    var active = (snapshot.ACTIVE == "YES");

    if(active){
      html += snapshot.ID + SPACE + '<i class="fa fa-play-circle-o fa-lg" data-tooltip title="'+Locale.tr("Active")+'"/>' + SPACE;
    } else {
      html += snapshot.ID + SPACE;
    }

    html += Humanize.prettyTime(snapshot.DATE) + SPACE +
            (snapshot.TAG ? snapshot.TAG + SPACE : '');

    if (Config.isTabActionEnabled("vms-tab", "VM.disk_saveas")) {
      html += '<a href="" class="disk_snapshot_saveas" >\
              <i class="fa fa-save"></i>' + Locale.tr("Save as") + '</a> &emsp;';
    }

    if(!active){
      if (Config.isTabActionEnabled("vms-tab", "VM.disk_snapshot_revert")) {
        html += '<a href="VM.disk_snapshot_revert" class="disk_snapshot_revert" ><i class="fa fa-reply"/>' + Locale.tr("Revert") + '</a> &emsp;';
      }

      if (Config.isTabActionEnabled("vms-tab", "VM.disk_snapshot_delete")) {
        html += '<a href="VM.disk_snapshot_delete" class="disk_snapshot_delete" ><i class="fa fa-times"/>' + Locale.tr("Delete") + '</a>';
      }
    }

    html += '</div>';

    return {
      htmlStr : html,
      subTree : subTree
    };
  }
});