#!/usr/bin/ruby

$LOAD_PATH << "#{__dir__}/../.."

require 'vnmmad'
require 'open3'

# Deletes the switch port. Unlike libvirt, LXD doesn't handle this.
def del_bridge_port(nic)
    return true unless /ovswitch/ =~ nic['VN_MAD']

    cmd = 'sudo ovs-vsctl --if-exists del-port '\
    "#{nic['BRIDGE']} #{nic['TARGET']}"

    rc, _o, e = Command.execute(cmd, false)

    return true if rc.zero?

    OpenNebula.log_error "#{__method__}: #{e}"
    false
end

# Remove nic from ovs-switch if needed
@one.get_nics.each do |nic|
    del_bridge_port(nic) # network driver matching implemented here
end
