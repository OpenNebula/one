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
#--------------------------------------------------------------------------- #

#-------------------------------------------------------------------------------
#  This class represents a base domain, information includes:
#-------------------------------------------------------------------------------
class BaseDomain

    attr_reader :vm, :name

    def initialize(name)
        @name = name
        @vm   = {}
    end

    # Get domain attribute by name.
    def [](name)
        @vm[name]
    end

    def []=(name, value)
        @vm[name] = value
    end

    # Merge hash value into the domain attributes
    def merge!(map)
        @vm.merge!(map)
    end

    #  Builds an OpenNebula Template with the monitoring keys. E.g.
    #    CPU=125.2
    #    MEMORY=1024
    #    NETTX=224324
    #    NETRX=213132
    #    ...
    #
    #  Keys are defined in MONITOR_KEYS constant
    #
    #  @return [String] OpenNebula template encoded in base64
    def to_monitor
        mon_s = ''

        MONITOR_KEYS.each do |k|
            next unless @vm[k.to_sym]

            mon_s << "#{k.upcase}=\"#{@vm[k.to_sym]}\"\n"
        end

        Base64.strict_encode64(mon_s)
    end

    MONITOR_KEYS = ['cpu', 'memory', 'netrx', 'nettx', 'diskrdbytes', 'diskwrbytes', 'diskrdiops',
                    'diskwriops']

end

#-------------------------------------------------------------------------------
#  This class represents a base domains
#-------------------------------------------------------------------------------
class BaseDomains

    include ProcessList

    def initialize
        @vms = {}
    end

    # Get the list of VMs (known to OpenNebula) and their monitor info
    # including process usage
    #
    #   @return [Hash] with KVM Domain classes indexed by their uuid
    def info
        info_each(true) do |name|
            vm = Domain.new name

            next if vm.info == -1

            vm
        end
    end

    # Get the list of VMs and their info
    # not including process usage.
    #
    #   @return [Hash] with KVM Domain classes indexed by their uuid
    def state_info
        info_each(false) do |name|
            vm = Domain.new name

            next if vm.info == -1

            vm
        end
    end

    # Return a message string with VM monitor information
    def to_monitor
        mon_s = ''

        @vms.each do |_uuid, vm|
            mon_s << "VM = [ ID=\"#{vm[:id]}\","
            mon_s << " DEPLOY_ID=\"#{vm[:deploy_id]}\","
            mon_s << " MONITOR=\"#{vm.to_monitor}\"]\n"
        end

        mon_s
    end

    private

    # Generic build method for the info list. It filters and builds the
    # domain list based on the given block
    #   @param[Boolean] do_process, to get process information
    def info_each(do_process)
        return unless block_given?

        vm_ps = ProcessList.process_list if do_process

        names = ProcessList.retrieve_names

        return @vms if names.empty?

        names.each do |name|
            vm = yield(name)

            @vms[vm[:uuid]] = vm if vm
        end

        return @vms unless do_process

        vm_ps.each do |uuid, ps|
            next unless @vms[uuid]

            @vms[uuid].merge!(ps)
        end

        @vms
    end

end
