define(function(require) {

  var OpenNebulaVM = require('opennebula/vm');
  var Locale = require('utils/locale');
  var Humanize = require('utils/humanize');
  var TemplateUtils = require('utils/template-utils');

  var RESOURCE = "VM";
  var XML_ROOT = "VM";

  var _columns = [
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
    "",
    Locale.tr("Hidden Template")
  ];

  return {
    'elementArray': _elementArray,
    'emptyElementArray': _emptyElementArray,
    'columns': _columns
  };

  function _elementArray(element_json) {
    var element = element_json[XML_ROOT];

    var state;

    if (state == OpenNebulaVM.STATES.ACTIVE) {
      state = OpenNebulaVM.shortLcmStateStr(element.LCM_STATE);
    } else {
      state = OpenNebulaVM.stateStr(element.STATE);
    }

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

  function _emptyElementArray(vmId) {
    return [
      '<input class="check_item" type="checkbox" id="' + RESOURCE.toLowerCase() + '_' +
                             vmId + '" name="selected_items" value="' +
                             vmId + '"/>',
       vmId,
       "",
       "",
       "",
       "",
       "",
       "",
       "",
       "",
       "",
       "",
       ""
    ];
  }
});
