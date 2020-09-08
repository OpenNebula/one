#!/usr/bin/ruby

$LOAD_PATH << "#{__dir__}/../.."

require 'vnmmad'
require 'open3'

def clean_host_nic(veth)
    cmd = "ip link show #{veth}"
    _o, _e, s = Open3.capture3(cmd)

    return unless s == 0

    cmd = "sudo -n ip link delete #{veth}"
    OpenNebula.log "Found lingering nic #{veth}\n Running #{cmd}"

    o, e, s = Open3.capture3(cmd)
    OpenNebula.log "#{o}\n#{e}" unless s == 0
end

###############
# Start patch #
###############

template64 = STDIN.read
vnm = VNMMAD::NoVLANDriver.from_base64(template64, nil, nil)

vm = vnm.vm

exit 0 unless vm.hypervisor == 'lxd'
OpenNebula.log 'running lxd network post cleanup'

# Detect nics from XML
nics = []
vm.nics.each do |nic|
    next unless nic[:nic]

    nics << nic
end

# Detect if shutdown/reboot or nic hotplug calls vnm clean.
# Assumes only 1 nic detachable at once.
nics.each do |nic|
    if nic[:nic][:attach] == 'YES'
        clean_host_nic(nic[:nic][:target])
        exit 0
    end
end

# rubocop:disable Style/CombinableLoops
nics.each {|nic| clean_host_nic(nic[:nic][:target]) }
# rubocop:enable Style/CombinableLoops
