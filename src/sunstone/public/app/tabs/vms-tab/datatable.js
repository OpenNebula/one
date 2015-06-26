define(function(require) {
  /*
    DEPENDENCIES
   */
  
  var TabDataTable = require('utils/tab-datatable');
  var VMsTableUtils = require('./utils/datatable-common');
  var OpenNebulaVM = require('opennebula/vm');
  var SunstoneConfig = require('sunstone-config');
  var Locale = require('utils/locale');
  var StateActions = require('./utils/state-actions');
  var Sunstone = require('sunstone');
  var Vnc = require('utils/vnc');
  var Spice = require('utils/spice');
  var Notifier = require('utils/notifier');
  
  /*
    CONSTANTS
   */
  
  var RESOURCE = "VM";
  var XML_ROOT = "VM";
  var TAB_NAME = require('./tabId');


  /*
    CONSTRUCTOR
   */
  
  function Table(dataTableId, conf) {
    this.conf = conf || {};
    this.tabId = TAB_NAME;
    this.dataTableId = dataTableId;
    this.resource = RESOURCE;
    this.xmlRoot = XML_ROOT;

    this.dataTableOptions = {
      "bAutoWidth": false,
      "bSortClasses" : false,
      "bDeferRender": true,
      "aoColumnDefs": [
          {"bSortable": false, "aTargets": ["check", 6, 7, 11]},
          {"sWidth": "35px", "aTargets": [0]},
          {"bVisible": true, "aTargets": SunstoneConfig.tabTableColumns(TAB_NAME)},
          {"bVisible": false, "aTargets": ['_all']}
      ]
    }

    this.columns = VMsTableUtils.columns;

    this.selectOptions = {
      "id_index": 1,
      "name_index": 4,
      "select_resource": Locale.tr("Please select a VM from the list"),
      "you_selected": Locale.tr("You selected the following VM:"),
      "select_resource_multiple": Locale.tr("Please select one or more VMs from the list"),
      "you_selected_multiple": Locale.tr("You selected the following VMs:")
    };

    this.totalVms = 0;
    this.activeVms = 0;
    this.pendingVms = 0;
    this.failedVms = 0;
    this.offVms = 0;

    TabDataTable.call(this);
  };

  Table.prototype = Object.create(TabDataTable.prototype);
  Table.prototype.constructor = Table;
  Table.prototype.elementArray = _elementArray;
  Table.prototype.initialize = _initialize;
  Table.prototype.preUpdateView = _preUpdateView;
  Table.prototype.postUpdateView = _postUpdateView;

  return Table;

  /*
    FUNCTION DEFINITIONS
   */

  function _elementArray(element_json) {
    var element = element_json[XML_ROOT];
    var state = parseInt(element.STATE);

    this.totalVms++;
    switch (state) {
      case OpenNebulaVM.STATES.INIT:
      case OpenNebulaVM.STATES.PENDING:
      case OpenNebulaVM.STATES.HOLD:
        this.pendingVms++;
        break;
      case OpenNebulaVM.STATES.ACTIVE:
        if (OpenNebulaVM.isFailureState(element.LCM_STATE)) {
          this.failedVms++;
        } else {
          this.activeVms++;
        }
        break;
      case OpenNebulaVM.STATES.STOPPED:
      case OpenNebulaVM.STATES.SUSPENDED:
      case OpenNebulaVM.STATES.POWEROFF:
        this.offVms++;
        break;
      default:
        break;
    }

    return VMsTableUtils.elementArray(element_json);
  }

  function _preUpdateView() {
    StateActions.resetStateButtons();

    this.totalVms = 0;
    this.activeVms = 0;
    this.pendingVms = 0;
    this.failedVms = 0;
    this.offVms = 0;
  }

  function _postUpdateView() {
    $(".total_vms").text(this.totalVms);
    $(".active_vms").text(this.activeVms);
    $(".pending_vms").text(this.pendingVms);
    $(".failed_vms").text(this.failedVms);
    $(".off_vms").text(this.offVms);
  }

  function _initialize(opts) {
    TabDataTable.prototype.initialize.call(this, opts);

    $('#' + this.dataTableId).on("click", '.vnc', function() {
      var vmId = $(this).attr('vm_id');

      if (!Vnc.lockStatus()) {
        Vnc.lock();
        Sunstone.runAction("VM.startvnc_action", vmId);
      } else {
        Notifier.notifyError(tr("VNC Connection in progress"))
      }

      return false;
    });

    $('#' + this.dataTableId).on("click", '.spice', function() {
      var vmId = $(this).attr('vm_id');

      if (!Spice.lockStatus()) {
        Spice.lock();
        Sunstone.runAction("VM.startspice_action", vmId);
      } else {
        Notifier.notifyError(Locale.tr("SPICE Connection in progress"))
      }

      return false;
    });
  }
});
