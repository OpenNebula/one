define(function(require) {
  /*
    DEPENDENCIES
   */
  
  var Locale = require('utils/locale');
  var Config = require('sunstone-config');
  var Sunstone = require('sunstone');
  var Humanize = require('utils/humanize');
  var StateActions = require('../utils/state-actions');

  /*
    CONSTANTS
   */
  
  var TAB_ID = require('../tabId');
  var PANEL_ID = require('./storage/panelId');
  var ATTACH_DISK_DIALOG_ID = require('../dialogs/attach-disk/dialogId');
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
    var html = '<form id="hotplugging_form" vmid="' + that.element.ID + '" >\
       <div class="row">\
       <div class="large-12 columns">\
          <table class="info_table dataTable extended_table">\
            <thead>\
              <tr>\
                 <th>' + Locale.tr("ID") + '</th>\
                 <th>' + Locale.tr("Target") + '</th>\
                 <th>' + Locale.tr("Image / Format-Size") + '</th>\
                 <th>' + Locale.tr("Persistent") + '</th>\
                 <th>' + Locale.tr("Save as") + '</th>\
                 <th colspan="">' + Locale.tr("Actions") + '</th>\
                 <th>';

    if (Config.isTabActionEnabled("vms-tab", "VM.attachdisk")) {
      if (StateActions.enabledStateAction("VM.attachdisk", that.element.STATE, that.element.LCM_STATE)) {
        html += '\
            <button id="attach_disk" class="button tiny success right radius" >' + Locale.tr("Attach disk") + '</button>'
      } else {
        html += '\
            <button id="attach_disk" class="button tiny success right radius" disabled="disabled">' + Locale.tr("Attach disk") + '</button>'
      }
    }

    html += '</th>\
               </tr>\
            </thead>\
            <tbody>';

    var disks = []
    if ($.isArray(that.element.TEMPLATE.DISK))
        disks = that.element.TEMPLATE.DISK
    else if (!$.isEmptyObject(that.element.TEMPLATE.DISK))
        disks = [that.element.TEMPLATE.DISK]

    if (!$.isEmptyObject(that.element.TEMPLATE.CONTEXT)) {
      var context_disk = that.element.TEMPLATE.CONTEXT;

      context_disk["IMAGE"] = Locale.tr("Context");
      context_disk["CONTEXT"] = true;

      disks.push(context_disk);
    }

    if (!disks.length) {
      html += '\
           <tr id="no_disks_tr">\
             <td colspan="6">' + Locale.tr("No disks to show") + '</td>\
           </tr>';
    } else {

      for (var i = 0; i < disks.length; i++) {
        var disk = disks[i];

        var save_as;
        // Snapshot deferred
        if (
           (// ACTIVE
            that.element.STATE == "3") &&
           (// HOTPLUG_SAVEAS HOTPLUG_SAVEAS_POWEROFF HOTPLUG_SAVEAS_SUSPENDED
            that.element.LCM_STATE == "26" || that.element.LCM_STATE == "27" || that.element.LCM_STATE == "28") &&
           (//
            disk.SAVE_AS_ACTIVE == "YES")
           ) {
          save_as = Locale.tr("in progress");
          actions = Locale.tr('deferred snapshot in progress');
        }
        // Snapshot Hot
        else if (
           (// ACTIVE
            that.element.STATE == "3") &&
           (// HOTPLUG_SAVEAS HOTPLUG_SAVEAS_POWEROFF HOTPLUG_SAVEAS_SUSPENDED
            that.element.LCM_STATE == "26" || that.element.LCM_STATE == "27" || that.element.LCM_STATE == "28") &&
           (//
            disk.HOTPLUG_SAVE_AS_ACTIVE == "YES")
           ) {
          save_as = (disk.SAVE_AS ? disk.SAVE_AS : '-');
          actions = Locale.tr('hot snapshot in progress');
        }
        // Attach / Detach
        else if (
           (// ACTIVE
            that.element.STATE == "3") &&
           (// HOTPLUG_SAVEAS HOTPLUG_SAVEAS_POWEROFF HOTPLUG_SAVEAS_SUSPENDED
            that.element.LCM_STATE == "17") &&
           (//
            disk.ATTACH = "YES")
           ) {
          save_as = (disk.SAVE_AS ? disk.SAVE_AS : '-');
          actions = Locale.tr('attach/detach in progress');
        } else {
          save_as = (disk.SAVE_AS ? disk.SAVE_AS : '-');

          actions = '';

          if (disk.SAVE == "YES") {
            /* TODO if (Config.isTabActionEnabled("vms-tab", "VM.disk_snapshot_cancel")) {
              if (StateActions.enabledStateAction("VM.disk_snapshot_cancel", that.element.STATE, that.element.LCM_STATE)) {
                actions += '<a href="VM.disk_snapshot_cancel" class="disk_snapshot_cancel" >\
                       <i class="fa fa-times"/></span>' + Locale.tr("Cancel Snapshot") + '</a> &emsp;'
              }
            } */
          } else {
            /* TODO if (Config.isTabActionEnabled("vms-tab", "VM.saveas")) {
              // Check if it's volatile
              if (disk.IMAGE_ID &&
                   StateActions.enabledStateAction("VM.saveas", that.element.STATE, that.element.LCM_STATE)) {
                actions += '<a href="VM.saveas" class="saveas" ><i class="fa fa-save"/>' + Locale.tr("Snapshot") + '</a> &emsp;'
              }
            } */
          }

          if (Config.isTabActionEnabled("vms-tab", "VM.detachdisk")) {
            if (StateActions.enabledStateAction("VM.detachdisk", that.element.STATE, that.element.LCM_STATE) && !disk.CONTEXT) {
              actions += '<a href="VM.detachdisk" class="detachdisk" ><i class="fa fa-times"/>' + Locale.tr("Detach") + '</a>'
            }
          }
        }

        html += '\
               <tr disk_id="' + (disk.DISK_ID) + '">\
                 <td>' + disk.DISK_ID + '</td>\
                 <td>' + disk.TARGET + '</td>\
                 <td>' + (disk.IMAGE ? disk.IMAGE : (Humanize.sizeFromMB(disk.SIZE) + (disk.FORMAT ? (' - ' + disk.FORMAT) : ''))) + '</td>\
                 <td>' + ((disk.SAVE && disk.SAVE == 'YES') ? Locale.tr('YES') : Locale.tr('NO')) + '</td>\
                 <td>' + save_as + '</td>\
                 <td>' + actions + '</td>\
             </tr>';
      }
    }

    html += '\
               </tbody>\
             </table>\
           </div>\
         </div>\
       </form>';

    return html;
  }

  function _setup(context) {
    var that = this;
    /* TODO if (Config.isTabActionEnabled("vms-tab", "VM.saveas")) {
      setupSaveAsDialog();

      $('a.saveas').live('click', function(){
          var b = $(this);
          var vm_id = b.parents('form').attr('vmid');
          var disk_id = b.parents('tr').attr('disk_id');

          popUpSaveAsDialog(vm_id, disk_id);

          //b.html(spinner);
          return false;
      });
    } */

    /* TODO if (Config.isTabActionEnabled("vms-tab", "VM.disk_snapshot_cancel")) {
      $('a.disk_snapshot_cancel').live('click', function(){
          var b = $(this);
          var vm_id = b.parents('form').attr('vmid');
          var disk_id = b.parents('tr').attr('disk_id');

          Sunstone.runAction('VM.disk_snapshot_cancel', vm_id, disk_id);

          return false;
      });
    } */

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
  }
});
