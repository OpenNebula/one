define(function(require) {
  /*
    DEPENDENCIES
   */
  
  var TabDataTable = require('utils/tab-datatable');
  var SunstoneConfig = require('sunstone-config');
  var Locale = require('utils/locale');
  var Humanize = require('utils/humanize');
  var TemplateUtils = require('utils/template-utils');
  var OpenNebulaVM = require('opennebula/vm');
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

    this.columns = [
      Locale.tr("ID") ,
      Locale.tr("Owner") ,
      Locale.tr("Group"),
      Locale.tr("Name"),
      Locale.tr("Status"),
      Locale.tr("Used CPU"),
      Locale.tr("Used Memory"),
      Locale.tr("Host"),
      Locale.tr("IPs"),
      Locale.tr("Start Time"),
      Locale.tr(""),
      Locale.tr("Hidden Template")
    ];

    this.selectOptions = {
      "id_index": 1,
      "name_index": 4,
      "select_resource": Locale.tr("Please select a VM from the list"),
      "you_selected": Locale.tr("You selected the following VM:"),
      "select_resource_multiple": Locale.tr("Please select one or more VMs from the list"),
      "you_selected_multiple": Locale.tr("You selected the following VMs:")
    };

    TabDataTable.call(this);
  };

  Table.prototype = Object.create(TabDataTable.prototype);
  Table.prototype.constructor = Table;
  Table.prototype.elementArray = _elementArray;
  Table.prototype.onUpdateView = _onUpdateView;
  Table.prototype.initialize = _initialize;

  return Table;

  /*
    FUNCTION DEFINITIONS
   */

  function _elementArray(element_json) {
    var element = element_json[XML_ROOT];

    var state = OpenNebulaVM.stateStr(element.STATE);

    /* TODO
    switch (state) {
      case tr("INIT"):
      case tr("PENDING"):
      case tr("HOLD"):
        pending_vms++;
        break;
      case tr("FAILED"):
        failed_vms++;
        break;
      case tr("ACTIVE"):
        active_vms++;
        break;
      case tr("STOPPED"):
      case tr("SUSPENDED"):
      case tr("POWEROFF"):
        off_vms++;
        break;
      default:
        break;
    }*/

    if (state == "ACTIVE") {
      state = OpenNebulaVM.shortLcmStateStr(element.LCM_STATE);
    };

    // VNC icon
    var vncIcon;
    if (OpenNebulaVM.isVNCSupported(element)) {
      vncIcon = '<a class="vnc" href="#" vm_id="' + element.ID + '"><i class="fa fa-desktop"/></a>';
    } else if (OpenNebulaVM.isSPICESupported(element)) {
      vncIcon = '<a class="spice" href="#" vm_id="' + element.ID + '"><i class="fa fa-desktop"/></a>';
    } else {
      vncIcon = '';
    }

    return [
      '<input class="check_item" type="checkbox" id="' + RESOURCE.toLowerCase() + '_' +
                             element.ID + '" name="selected_items" value="' +
                             element.ID + '"/>',
       element.ID,
       element.UNAME,
       element.GNAME,
       element.NAME,
       state,
       element.CPU,
       Humanize.size(element.MEMORY),
       OpenNebulaVM.hostnameStr(element),
       OpenNebulaVM.ipsStr(element),
       Humanize.prettyTime(element.STIME),
       vncIcon,
       TemplateUtils.templateToString(element)
    ];
  }

  function _onUpdateView() {
    StateActions.resetStateButtons();
  }

  function _initialize(opts) {
    TabDataTable.prototype.initialize.call(this, opts);

    $('#' + this.dataTableId).on("click", '.vnc', function() {
      var vmId = $(this).attr('vm_id');

      if (!Vnc.lockStatus()) {
        Spice.lock();
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
        Notifier.notifyError(tr("SPICE Connection in progress"))
      }

      return false;
    });
  }
});
