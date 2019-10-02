#!/usr/bin/ruby

$LOAD_PATH << "#{__dir__}/../.."

require 'vnmmad'
require 'open3'

template64 = STDIN.read
vnm = VNMMAD::NoVLANDriver.from_base64(template64, nil, nil)

vm = vnm.vm

exit 0 unless vm.hypervisor == 'lxd'
OpenNebula.log 'running lxd network post cleanup'

vm.nics.each do |nic|
    next unless nic[:nic]

    veth = nic[:nic][:target]

    cmd = "ip link show #{veth}"

    _o, _e, s = Open3.capture3(cmd)

    next unless s == 0

    cmd = "sudo ip link delete #{veth}"
    OpenNebula.log "Found lingering nic #{veth}\n Running #{cmd}"

    o, e, _s = Open3.capture3(cmd)

    OpenNebula.log "#{o}\n#{e}"
end
