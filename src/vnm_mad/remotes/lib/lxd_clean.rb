#!/usr/bin/ruby

$LOAD_PATH << "#{__dir__}/../.."

require 'vnmmad'

template64 = STDIN.read
vnm = VNMMAD::NoVLANDriver.from_base64(template64, nil, nil)

exit 0 unless vnm.vm.hypervisor == 'lxd'
STDERR.puts 'running lxd nic clean hook'

exit 0
