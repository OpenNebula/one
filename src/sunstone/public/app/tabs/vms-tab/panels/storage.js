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

  var Locale = require('utils/locale');
  var Config = require('sunstone-config');
  var Sunstone = require('sunstone');
  var Humanize = require('utils/humanize');
  var StateActions = require('../utils/state-actions');
  var OpenNebulaVM = require('opennebula/vm');
  var Tree = require('utils/tree');
  var TemplateHtml = require('hbs!./storage/html');
  var DiskDetailsHtml = require('hbs!./storage/disk-details');
  var Navigation = require('utils/navigation');
  var Notifier = require('utils/notifier');
  var Graphs = require('utils/graphs');
  require('flot.navigate');
  require('flot.canvas');

  /*
    CONSTANTS
   */

  var TAB_ID = require('../tabId');
  var PANEL_ID = require('./storage/panelId');
  var ATTACH_DISK_DIALOG_ID = require('../dialogs/attach-disk/dialogId');
  var DISK_SNAPSHOT_DIALOG_ID = require('../dialogs/disk-snapshot/dialogId');
  var DISK_SAVEAS_DIALOG_ID = require('../dialogs/disk-saveas/dialogId');
  var DISK_SNAPSHOT_RENAME_DIALOG_ID = require('../dialogs/disk-snapshot-rename/dialogId');
  var CONFIRM_DIALOG_ID = require('utils/dialogs/generic-confirm/dialogId');
  var DISK_RESIZE_DIALOG_ID = require('../dialogs/disk-resize/dialogId');
  var RESOURCE = "VM"
  var XML_ROOT = "VM"

  var isFirecracker = function(context){
    return context &&
    context.element &&
    context.element.USER_TEMPLATE &&
    context.element.USER_TEMPLATE.HYPERVISOR &&
    context.element.USER_TEMPLATE.HYPERVISOR === "firecracker"
  }

  var validateState = function(context, state){
    var rtn = false;
    if(context && state && context.element && context.element.STATE && context.element.LCM_STATE){
      rtn = StateActions.enabledStateAction(state, context.element.STATE, context.element.LCM_STATE)
    }
    return rtn;
  }

  /*
    CONSTRUCTOR
   */

  function Panel(info) {
    this.panelId = PANEL_ID;
    this.title = Locale.tr("Storage");
    this.icon = "fa-server";

    this.element = info[XML_ROOT];

    return this;
  };

  Panel.PANEL_ID = PANEL_ID;
  Panel.prototype.html = _html;
  Panel.prototype.setup = _setup;
  Panel.prototype.getState = _getState;
  Panel.prototype.setState = _setState;
  Panel.prototype.onShow = _onShow;

  return Panel;

  /*
    FUNCTION DEFINITIONS
   */

  function _html() {
    var diskCost = this.element.TEMPLATE.DISK_COST;

    if (diskCost == undefined){
      diskCost = Config.onedConf.DEFAULT_COST.DISK_COST;
    }

    var html = TemplateHtml({
        element: this.element,
        diskCost: diskCost
      });
    // Do not show statistics for not hypervisors that do not gather net data
    //if (OpenNebulaVM.isNICGraphsSupported(that.element)) {
      html += '\
          <div class="row">\
              <div class="medium-6 columns">\
                <div class="row">\
                  <span>' + Locale.tr("Disk read bytes") + '</span3>\
                </div>\
                <div class="row">\
                  <div class="large-12 columns centered graph" id="vm_st_drb_graph" style="height: 100px;">\
                    <span  id="provision_dashboard_total" style="font-size:80px">\
                      <i class="fas fa-spinner fa-spin"></i>\
                    </span>\
                  </div>\
                </div>\
                <div class="row graph_legend">\
                  <div class="large-12 columns centered" id="vm_net_rx_legend">\
                  </div>\
                </div>\
              </div>\
              <div class="medium-6 columns">\
                <div class="row">\
                  <span>' + Locale.tr("Disk write bytes") + '</span>\
                </div>\
                <div class="row">\
                  <div class="large-12 columns centered graph" id="vm_st_dwb_graph" style="height: 100px;">\
                    <span  id="provision_dashboard_total" style="font-size:80px">\
                      <i class="fas fa-spinner fa-spin"></i>\
                    </span>\
                  </div>\
                </div>\
                <div class="row graph_legend">\
                  <div class="large-12 columns centered" id="vm_net_tx_legend">\
                  </div>\
                </div>\
              </div>\
              <div class="medium-6 columns">\
                <div class="row">\
                  <span>' + Locale.tr("Disk read IOPS") + '</span3>\
                </div>\
                <div class="row">\
                  <div class="large-12 columns centered graph" id="vm_st_drio_graph" style="height: 100px;">\
                    <span  id="provision_dashboard_total" style="font-size:80px">\
                      <i class="fas fa-spinner fa-spin"></i>\
                    </span>\
                  </div>\
                </div>\
                <div class="row graph_legend">\
                  <div class="large-12 columns centered" id="vm_net_rx_speed_legend">\
                  </div>\
                </div>\
              </div>\
              <div class="medium-6 columns">\
                <div class="row">\
                  <span>' + Locale.tr("Disk write IOPS") + '</span3>\
                </div>\
                <div class="row">\
                  <div class="large-12 columns centered graph" id="vm_st_dwio_graph" style="height: 100px;">\
                    <span  id="provision_dashboard_total" style="font-size:80px">\
                      <i class="fas fa-spinner fa-spin"></i>\
                    </span>\
                  </div>\
                </div>\
                <div class="row graph_legend">\
                  <div class="large-12 columns centered" id="vm_net_tx_speed_legend">\
                  </div>\
                </div>\
              </div>\
          </div>\
        </form>';
   // }
    return html;
  }

  function _setup(context) {
    var that = this;

    var snapshots = [];
    if (Array.isArray(this.element.SNAPSHOTS)){
      snapshots = this.element.SNAPSHOTS;
    } else if (!$.isEmptyObject(this.element.SNAPSHOTS)) {
      snapshots = [this.element.SNAPSHOTS];
    }

    var snapshotsSize = {};
    var monitoringSnapshots = [];
    if (Array.isArray(that.element.MONITORING.SNAPSHOT_SIZE))
      monitoringSnapshots = that.element.MONITORING.SNAPSHOT_SIZE;
    else if (!$.isEmptyObject(that.element.MONITORING.SNAPSHOT_SIZE))
      monitoringSnapshots = [that.element.MONITORING.SNAPSHOT_SIZE];

    $.each(monitoringSnapshots, function(index, monitoringSnap){
      if(snapshotsSize[monitoringSnap.DISK_ID] == undefined){
        snapshotsSize[monitoringSnap.DISK_ID] = {};
      }

      snapshotsSize[monitoringSnap.DISK_ID][monitoringSnap.ID] = monitoringSnap.SIZE;
    })

    var snapshotsHtml = {};

    $.each(snapshots, function(){
      var diskId = this.DISK_ID;
      var diskSnapshots = this.SNAPSHOT;

      if (!Array.isArray(diskSnapshots)){
        diskSnapshots = [diskSnapshots];
      }

      var indexedSize = snapshotsSize[diskId];

      if(indexedSize == undefined){
        indexedSize = {};
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
          _makeTree(that, indexedSnapshots[this], indexedSnapshots, indexedSize)
        );
      });

      snapshotsHtml[diskId] = Tree.html(treeRoot);
    });

    var disks = [];
    if (Array.isArray(that.element.TEMPLATE.DISK))
      disks = that.element.TEMPLATE.DISK.slice(0); // clone
    else if (!$.isEmptyObject(that.element.TEMPLATE.DISK))
      disks = [that.element.TEMPLATE.DISK];

    if (!$.isEmptyObject(that.element.TEMPLATE.CONTEXT) && that.element.USER_TEMPLATE.HYPERVISOR != "vcenter") {
      var context_disk = that.element.TEMPLATE.CONTEXT;

      context_disk["IMAGE"] = Locale.tr("Context");
      context_disk["CONTEXT"] = true;

      disks.push(context_disk);
    }

    var disksSize = {};
    var monitoringDisks = [];
    if (Array.isArray(that.element.MONITORING.DISK_SIZE))
      monitoringDisks = that.element.MONITORING.DISK_SIZE;
    else if (!$.isEmptyObject(that.element.MONITORING.DISK_SIZE))
      monitoringDisks = [that.element.MONITORING.DISK_SIZE];

    $.each(monitoringDisks, function(index, monitoringDisk){
      disksSize[monitoringDisk.ID] = monitoringDisk.SIZE;
    });

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
            that.element.LCM_STATE == OpenNebulaVM.LCM_STATES.HOTPLUG_SAVEAS_SUSPENDED ||
            that.element.LCM_STATE == OpenNebulaVM.LCM_STATES.HOTPLUG_SAVEAS_UNDEPLOYED ||
            that.element.LCM_STATE == OpenNebulaVM.LCM_STATES.HOTPLUG_SAVEAS_STOPPED) &&
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
            if (disk.IMAGE_ID && validateState(that,"VM.disk_saveas")) {
                  if(Array.isArray(that.element.HISTORY_RECORDS.HISTORY)){
                    var historyLenght = that.element.HISTORY_RECORDS.HISTORY.length - 1;
                    if(that.element.LCM_STATE != "3" || that.element.HISTORY_RECORDS.HISTORY[historyLenght].VM_MAD != "vcenter"){
                      var render = '<a href="VM.disk_saveas" class="disk_saveas nowrap" >\
                        <i class="fas fa-save fa-fw" title="Saveas"></i>\
                      </a> &emsp;';
                      actions += !isFirecracker(that)? render : "";
                  }
                } else {
                  if(that.element.LCM_STATE != "3" || that.element.HISTORY_RECORDS.HISTORY.VM_MAD != "vcenter"){
                    var render ='<a href="VM.disk_saveas" class="disk_saveas nowrap" >\
                      <i class="fas fa-save fa-fw" title="Saveas"></i>\
                    </a> &emsp;';
                    actions += !isFirecracker(that)? render : "";
                }
              }
              //+ Locale.tr("Save as") + ';'
            }
          }


          if (Config.isTabActionEnabled("vms-tab", "VM.detachdisk")) {
            var vmState = validateState(that,"VM.detachdisk");
            var render = (
              '<a href="VM.detachdisk" class="detachdisk nowrap" >\
                  <i class="fas fa-times fa-fw" title="Detach"></i>\
               </a> &emsp;'
            );
            if(isFirecracker(that) && !vmState){
              actions += render;
            }
            if(!isFirecracker(that) && vmState && !disk.CONTEXT){
              actions += render;
            }
          }

          if (Config.isTabActionEnabled("vms-tab", "VM.disk_snapshot_create")) {
            if (validateState(that,"VM.disk_snapshot_create") && disk.IMAGE_ID) {
              actions += ('<a href="VM.disk_snapshot_create" class="disk_snapshot_create nowrap" >\
              <i class="fas fa-camera fa-fw" title="Snapshot"></i></a> &emsp;');//+ Locale.tr("Snapshot") +
            }
          }

          if (Config.isTabActionEnabled("vms-tab", "VM.disk_resize")) {
            if (validateState(that,"VM.disk_resize") && !disk.CONTEXT) {
              actions += ('<a class="disk_resize nowrap" >\
              <i class="fas fa-expand-arrows-alt fa-fw" title="Resize"></i></a>');
            }
          }
        }

        var sizeStr = "";
        if (disksSize[disk.DISK_ID]) {
          sizeStr += Humanize.sizeFromMB(disksSize[disk.DISK_ID]);
          sizeStr += '/';
          if (disk.SIZE) {
            sizeStr += Humanize.sizeFromMB(disk.SIZE);
          } else {
            sizeStr += '-';
          }
        } else if (disk.SIZE){
          sizeStr += Humanize.sizeFromMB(disk.SIZE);
        }
        else {
          sizeStr += '-';
        }

        var imagetr;

        if (disk.IMAGE != undefined){
          if (disk.IMAGE_ID != undefined){
            imagetr = Navigation.link(disk.IMAGE, "images-tab", disk.IMAGE_ID);
          }else{
            imagetr = disk.IMAGE;
          }
        }else{
          imagetr = (Humanize.sizeFromMB(disk.SIZE) + (disk.FORMAT ? (' - ' + disk.FORMAT) : ''));
        }

        disk_dt_data.push({
          DISK_ID : disk.DISK_ID,
          TARGET : disk.TARGET,
          IMAGE : imagetr,
          SIZE: sizeStr,
          SAVE : ((disk.SAVE && disk.SAVE == 'YES') ? Locale.tr('YES') : Locale.tr('NO')),
          ACTIONS : actions,
          SNAPSHOTS : snapshotsHtml[disk.DISK_ID]
        });
      }
    }

    $("#tab_storage_form .disks_table", context).DataTable({
      "bDeferRender": true,
      "data": disk_dt_data,
      "columns": [
        {
          "class":          'open-control',
          "orderable":      false,
          "data":           null,
          "defaultContent": '<span class="fas fa-fw fa-chevron-down"></span>'
        },
        {"data": "DISK_ID",   "defaultContent": ""},
        {"data": "TARGET",    "defaultContent": ""},
        {"data": "IMAGE",     "defaultContent": "", "orderable": false},
        {"data": "SIZE",      "defaultContent": ""},
        {"data": "SAVE",      "defaultContent": "", "orderable": false},
        {"data": "ACTIONS",   "defaultContent": "", "orderable": false}
      ],

      "fnRowCallback": function(nRow, aData) {
        if (aData.SNAPSHOTS == undefined || aData.SNAPSHOTS.length == 0) {
          $("td.open-control", nRow).html("").removeClass('open-control');
        }

        $(nRow).attr("disk_id", aData.DISK_ID);
      }
    });

    $("#tab_storage_form .disks_table", context).dataTable().fnSort([[1, 'asc']]);

    // Add event listener for opening and closing each row details
    context.off('click', '#tab_storage_form .disks_table td.open-control');
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
      var vmState = validateState(that,"VM.attachdisk");

      if((isFirecracker(that) && vmState) || (!isFirecracker(that) && !vmState)){
        $('#attach_disk', context).attr("disabled", "disabled");
      }

      context.off('click', '#attach_disk');
      context.on('click', '#attach_disk', function() {
        var dialog = Sunstone.getDialog(ATTACH_DISK_DIALOG_ID);
        dialog.setElement(that.element);
        if(that.element.USER_TEMPLATE.HYPERVISOR && that.element.USER_TEMPLATE.HYPERVISOR == 'vcenter'){
          $('.hypervisor.only_kvm').hide();
          $('.hypervisor.only_vcenter').show();
        }
        dialog.reset();
        dialog.show();
        return false;
      });
    }

    if (Config.isTabActionEnabled("vms-tab", "VM.detachdisk")) {
      context.off('click', '.detachdisk');
      context.on('click', '.detachdisk', function() {
        var disk_id = $(this).parents('tr').attr('disk_id');
        Sunstone.getDialog(CONFIRM_DIALOG_ID).setParams({
          //header :
          headerTabId: TAB_ID,
          body : Locale.tr("This will detach the disk immediately"),
          //question :
          submit : function(){
            Sunstone.runAction('VM.detachdisk', that.element.ID, disk_id);
            return false;
          }
        });

        Sunstone.getDialog(CONFIRM_DIALOG_ID).reset();
        Sunstone.getDialog(CONFIRM_DIALOG_ID).show();

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
      if(that.element.STATE == "3"){
        $(".disk_snapshot_revert", snapshotsSection).hide();
      }
      else{
        $(".disk_snapshot_revert", snapshotsSection).show();
      }

      // Unselect other check inputs
      var checked = $(this).is(':checked');
      $('.snapshot_check_item:checked', snapshotsSection).prop('checked', false);
      $(this).prop('checked', checked);

      // Enable/disable buttons
      if ($(this).is(":checked")) {
        $(".disk_snapshot_saveas", snapshotsSection).prop('disabled', false);
        $(".disk_snapshot_rename", snapshotsSection).prop('disabled', false);
        $(".disk_snapshot_revert", snapshotsSection).prop('disabled', false);
        $(".disk_snapshot_delete", snapshotsSection).prop('disabled', false);
      } else {
        $(".disk_snapshot_saveas", snapshotsSection).prop('disabled', true);
        $(".disk_snapshot_rename", snapshotsSection).prop('disabled', true);
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

    if (Config.isTabActionEnabled("vms-tab", "VM.disk_snapshot_rename")) {
      context.off('click', '.disk_snapshot_rename');
      context.on('click', '.disk_snapshot_rename', function() {
        var snapshotsSection = $(this).closest('.snapshots');

        var disk_id = snapshotsSection.attr('disk_id');
        var snapshot_id = $(".snapshot_check_item:checked", snapshotsSection).attr('snapshot_id');

        var dialog = Sunstone.getDialog(DISK_SNAPSHOT_RENAME_DIALOG_ID);
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
          headerTabId: TAB_ID,
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
    if (Config.isTabActionEnabled("vms-tab", "VM.disk_resize")) {
      context.off('click', '.disk_resize');
      context.on('click', '.disk_resize', function() {

        // Error message when try to resize a disk on a
        // VM with VCenter hypervisor and snapshots.
        if (that && that.element &&
            that.element.TEMPLATE && that.element.TEMPLATE.SNAPSHOT &&
            that.element.USER_TEMPLATE && that.element.USER_TEMPLATE.HYPERVISOR=="vcenter"){
          Notifier.notifyError("'disk-resize' operation not supported for VMs with snapshots");
          return false;
        }

        var disk_id = $(this).parents('tr').attr('disk_id');
        var disk_size = "";
        if(Array.isArray(that.element.TEMPLATE.DISK)){
          $.each(that.element.TEMPLATE.DISK, function(){
            if (this.DISK_ID == disk_id){
              disk_size = this.SIZE;
            }
          });
        } else {
            disk_size = that.element.TEMPLATE.DISK.SIZE;
        }
        var dialog = Sunstone.getDialog(DISK_RESIZE_DIALOG_ID);
        dialog.setParams(
          { element: that.element,
            diskId: disk_id,
            diskSize: disk_size,
            diskCost: that.element.TEMPLATE.DISK_COST
          });

        dialog.reset();
        dialog.show();
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
    $.each(state["openDisksDetails"], function(){
      $('#tab_storage_form .disks_table tr[disk_id="'+this+'"] td.open-control', context).click();
    });

    $.each(state["checkedSnapshots"], function(){
      $('#tab_storage_form .disks_table .snapshots[disk_id="'+this.disk_id+'"] '+
        '.snapshot_check_item[snapshot_id="'+this.snapshot_id+'"]', context).click();
    });
  }

  function _makeTree(that, snapshot, indexedSnapshots, indexedSize){
    var SPACE = '&nbsp;&nbsp;&nbsp;&nbsp;';

    var subTree = [];

    if (snapshot.CHILDREN){
      $.each(snapshot.CHILDREN.split(","), function(){
        subTree.push(
          _makeTree(that, indexedSnapshots[this], indexedSnapshots, indexedSize)
        );
      });
    }

    var html = '<div class="snapshot_row nowrap">'+
      '<input class="snapshot_check_item" type="checkbox" snapshot_id="'+snapshot.ID+'"/>'+
      SPACE + snapshot.ID + SPACE;

    var active = (snapshot.ACTIVE == "YES");

    if(active){
      html += '<i class="fas fa-play-circle fa-lg" title="'+
                Locale.tr("Active")+'"/>' + SPACE;
    }

    var sizeStr = "";
    if (indexedSize[snapshot.ID]) {
      sizeStr += Humanize.sizeFromMB(indexedSize[snapshot.ID]);
    } else {
      sizeStr += '-';
    }

    sizeStr += '/';
    if (snapshot.SIZE) {
      sizeStr += Humanize.sizeFromMB(snapshot.SIZE);
    } else {
      sizeStr += '-';
    }

    html += Humanize.prettyTime(snapshot.DATE) + SPACE + sizeStr + SPACE +
            (snapshot.NAME ? snapshot.NAME + SPACE : '');

    html += '</div>';

    return {
      htmlStr : html,
      subTree : subTree
    };
  }

  function _onShow(context) {
    var that = this;
    var vmState = validateState(that,"VM.attachdisk");
    if((isFirecracker(that) && vmState)){
      $('#attach_disk', context).attr("disabled", "disabled");
    }

    if (OpenNebulaVM.isDiskGraphsSupported(that.element)) {
      OpenNebulaVM.monitor({
        data: {
          id: that.element.ID,
          monitor: {
            monitor_resources : "DISKRDBYTES,DISKWRBYTES,DISKRDIOPS,DISKWRIOPS"
          }
        },
        success: function(req, response) {
          var vmGraphs = [
            {
              labels : Locale.tr("Disk read bytes"),
              monitor_resources : "DISKRDBYTES",
              humanize_figures : true,
              convert_from_bytes : true,
               derivative : true,
              div_graph : $("#vm_st_drb_graph")
            },
            {
              labels : Locale.tr("Disk write bytes"),
              monitor_resources : "DISKWRBYTES",
              humanize_figures : true,
              convert_from_bytes : true,
               derivative : true,
              div_graph : $("#vm_st_dwb_graph")
            },
            {
              labels : Locale.tr("Disk read IOPS"),
              monitor_resources : "DISKRDIOPS",
              //humanize_figures : true,
              //convert_from_bytes : true,
              y_sufix : "IOPS/s",
              derivative : true,
              div_graph : $("#vm_st_drio_graph")
            },
            {
              labels : Locale.tr("Disk write IOPS"),
              monitor_resources : "DISKWRIOPS",
              //humanize_figures : true,
              //convert_from_bytes : true,
              y_sufix : "IOPS/s",
              derivative : true,
              div_graph : $("#vm_st_dwio_graph")
            }
          ];

          for (var i = 0; i < vmGraphs.length; i++) {
            Graphs.plot(response, vmGraphs[i]);
          }
        },
        error: Notifier.onError
      });
    }
  }
});
