define(function(require) {
  var OpenNebulaVm = require('opennebula/vm');

  var VNC_STATES = [
    OpenNebulaVm.lcm_state.RUNNING,
    OpenNebulaVm.lcm_state.SHUTDOWN,
    OpenNebulaVm.lcm_state.SHUTDOWN_POWEROFF,
    OpenNebulaVm.lcm_state.UNKNOWN,
    OpenNebulaVm.lcm_state.HOTPLUG,
    OpenNebulaVm.lcm_state.CANCEL,
    OpenNebulaVm.lcm_state.MIGRATE,
    OpenNebulaVm.lcm_state.HOTPLUG_SNAPSHOT,
    OpenNebulaVm.lcm_state.HOTPLUG_NIC,
    OpenNebulaVm.lcm_state.HOTPLUG_SAVEAS,
    OpenNebulaVm.lcm_state.HOTPLUG_SAVEAS_POWEROFF,
    OpenNebulaVm.lcm_state.HOTPLUG_SAVEAS_SUSPENDED,
    OpenNebulaVm.lcm_state.SHUTDOWN_UNDEPLOY
  ];

  return {
    'VNCEnabled': _VNCEnabled,
    'SPICEEnabled': _SPICEEnabled,
    'vncIcon': _vncIcon
  }

  function _VNCEnabled(vm) {
    var graphics = vm.TEMPLATE.GRAPHICS;
    var state = parseInt(vm.LCM_STATE);

    return (graphics &&
        graphics.TYPE &&
        graphics.TYPE.toLowerCase() == "vnc"  &&
        $.inArray(state, VNC_STATES) != -1);
  }
  
  function _SPICEEnabled(vm) {
    var graphics = vm.TEMPLATE.GRAPHICS;
    var state = parseInt(vm.LCM_STATE);

    return (graphics &&
        graphics.TYPE &&
        graphics.TYPE.toLowerCase() == "spice" &&
        $.inArray(state, VNC_STATES) != -1);
  }

  function _vncIcon(vm) {
    var gr_icon;

    if (_VNCEnabled(vm)) {
      gr_icon = '<a class="vnc" href="#" vm_id="' + vm.ID + '">';
      gr_icon += '<i class="fa fa-desktop" style="color: rgb(111, 111, 111)"/>';
    } else if (_SPICEEnabled(vm)) {
      gr_icon = '<a class="spice" href="#" vm_id="' + vm.ID + '">';
      gr_icon += '<i class="fa fa-desktop" style="color: rgb(111, 111, 111)"/>';
    } else {
      gr_icon = '';
    }

    gr_icon += '</a>'
    return gr_icon;
  }
})
