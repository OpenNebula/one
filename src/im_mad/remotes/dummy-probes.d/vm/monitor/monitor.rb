#!/usr/bin/env ruby
# -------------------------------------------------------------------------- #
# Copyright 2002-2019, OpenNebula Project, OpenNebula Systems                #
#                                                                            #
# Licensed under the Apache License, Version 2.0 (the "License"); you may    #
# not use this file except in compliance with the License. You may obtain    #
# a copy of the License at                                                   #
#                                                                            #
# http://www.apache.org/licenses/LICENSE-2.0                                 #
#                                                                            #
# Unless required by applicable law or agreed to in writing, software        #
# distributed under the License is distributed on an "AS IS" BASIS,          #
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.   #
# See the License for the specific language governing permissions and        #
# limitations under the License.                                             #
# -------------------------------------------------------------------------- #

ONE_LOCATION = ENV['ONE_LOCATION']

if !ONE_LOCATION
    RUBY_LIB_LOCATION = '/usr/lib/one/ruby'
    GEMS_LOCATION     = '/usr/share/one/gems'
    ETC_LOCATION      = '/etc/one/'
else
    RUBY_LIB_LOCATION = ONE_LOCATION + '/lib/ruby'
    GEMS_LOCATION     = ONE_LOCATION + '/share/gems'
    ETC_LOCATION      = ONE_LOCATION + '/etc/'
end

if File.directory?(GEMS_LOCATION)
    Gem.use_paths(GEMS_LOCATION)
end

$LOAD_PATH << RUBY_LIB_LOCATION

require 'opennebula'

def unindent(s)
    m = s.match(/^(\s*)/)
    spaces = m[1].size
    s.gsub!(/^ {#{spaces}}/, '')
end

hid   = ARGV[1]
hname = ARGV[2]

client = OpenNebula::Client.new

vmpool = OpenNebula::VirtualMachinePool.new(client,
             OpenNebula::VirtualMachinePool::INFO_ALL_VM)

rc = vmpool.info

return if OpenNebula.is_error?(rc)

result = ''
vmpool.each do |vm|
    begin
        next if vm['HISTORY_RECORDS/HISTORY/HID'].to_i != hid.to_i

        max_memory = 256
        if vm['TEMPLATE/MEMORY']
            max_memory = vm['TEMPLATE/MEMORY'].to_i * 1024
        end

        max_cpu = 100
        if vm['TEMPLATE/CPU']
            max_cpu = vm['TEMPLATE/CPU'].to_i * 100
        end

        base_net = Time.now.to_i % 10000

        mon_s = unindent(<<-EOS)
          NETTX=#{base_net+(50*rand(3))}
          NETRX=#{base_net+(100*rand(4))}
          MEMORY=#{max_memory * (rand(80)+20)/100}
          CPU=#{max_cpu * (rand(95)+5)/100}
          DISKRDBYTES=#{rand(1000)}
          DISKWRBYTES=#{rand(1000)}
          DISKRDIOPS=#{rand(1000)}
          DISKWRIOPS=#{rand(1000)}
        EOS

        mon_s64 = Base64.strict_encode64(mon_s)

        result << "VM = [ ID=\"#{vm['ID']}\", DEPLOY_ID=\"#{vm['DEPLOY_ID']}\","
        result << " MONITOR=\"#{mon_s64}\"]\n"
    rescue StandardError
        next
    end
end

puts result
