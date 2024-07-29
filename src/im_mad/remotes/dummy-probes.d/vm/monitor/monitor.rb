#!/usr/bin/env ruby
# -------------------------------------------------------------------------- #
# Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                #
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
# rubocop:disable Layout/ArgumentAlignment
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

# %%RUBYGEMS_SETUP_BEGIN%%
if File.directory?(GEMS_LOCATION)
    real_gems_path = File.realpath(GEMS_LOCATION)
    if !defined?(Gem) || Gem.path != [real_gems_path]
        $LOAD_PATH.reject! {|l| l =~ /vendor_ruby/ }

        # Suppress warnings from Rubygems
        # https://github.com/OpenNebula/one/issues/5379
        begin
            verb = $VERBOSE
            $VERBOSE = nil
            require 'rubygems'
            Gem.use_paths(real_gems_path)
        ensure
            $VERBOSE = verb
        end
    end
end
# %%RUBYGEMS_SETUP_END%%

$LOAD_PATH << RUBY_LIB_LOCATION

require 'opennebula'

def unindent(s)
    m = s.match(/^(\s*)/)
    spaces = m[1].size
    s.gsub!(/^ {#{spaces}}/, '')
end

hid = ARGV[1]
_hname = ARGV[2]

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
          NETTX=#{base_net + (rand(1..3) * 50)}
          NETRX=#{base_net + (rand(1..4) * 100)}
          MEMORY=#{max_memory * rand(20..100)/100}
          CPU=#{max_cpu * rand(5..100)/100}
          DISKRDBYTES=#{rand(1..1000)}
          DISKWRBYTES=#{rand(1..1000)}
          DISKRDIOPS=#{rand(1..1000)}
          DISKWRIOPS=#{rand(1..1000)}
        EOS

        mon_s64 = Base64.strict_encode64(mon_s)

        result << "VM = [ ID=\"#{vm['ID']}\", DEPLOY_ID=\"#{vm['DEPLOY_ID']}\","
        result << " MONITOR=\"#{mon_s64}\"]\n"
    rescue StandardError
        next
    end
end

puts result

# rubocop:enable Layout/ArgumentAlignment
