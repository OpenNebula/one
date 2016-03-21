# -------------------------------------------------------------------------- #
# Copyright 2002-2015, OpenNebula Project, OpenNebula Systems                #
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


require 'opennebula/pool_element'
require 'base64'

module OpenNebula
    class Host < PoolElement
        #######################################################################
        # Constants and Class Methods
        #######################################################################


        HOST_METHODS = {
            :info       => "host.info",
            :allocate   => "host.allocate",
            :delete     => "host.delete",
            :enable     => "host.enable",
            :update     => "host.update",
            :monitoring => "host.monitoring",
            :rename     => "host.rename"
        }

        HOST_STATES=%w{INIT MONITORING_MONITORED MONITORED ERROR DISABLED MONITORING_ERROR MONITORING_INIT MONITORING_DISABLED}

        SHORT_HOST_STATES={
            "INIT"                 => "init",
            "MONITORING_MONITORED" => "update",
            "MONITORED"            => "on",
            "ERROR"                => "err",
            "DISABLED"             => "off",
            "MONITORING_ERROR"     => "retry",
            "MONITORING_INIT"      => "init",
            "MONITORING_DISABLED"  => "off"
        }

        # Creates a Host description with just its identifier
        # this method should be used to create plain Host objects.
        # +id+ the id of the host
        #
        # Example:
        #   host = Host.new(Host.build_xml(3),rpc_client)
        #
        def Host.build_xml(pe_id=nil)
            if pe_id
                host_xml = "<HOST><ID>#{pe_id}</ID></HOST>"
            else
                host_xml = "<HOST></HOST>"
            end

            XMLElement.build_xml(host_xml, 'HOST')
        end

        # Class constructor
        def initialize(xml, client)
            super(xml,client)

            @client = client
            @pe_id  = self['ID'].to_i if self['ID']
        end

        #######################################################################
        # XML-RPC Methods for the Host
        #######################################################################

        # Retrieves the information of the given Host.
        def info()
            super(HOST_METHODS[:info], 'HOST')
        end

        alias_method :info!, :info

        # Allocates a new Host in OpenNebula
        #
        # @param hostname [String] Name of the new Host.
        # @param im [String] Name of the im_driver (information/monitoring)
        # @param vmm [String] Name of the vmm_driver (hypervisor)
        # @param vnm [String] Name of the vnm_driver (networking)
        # @param cluster_id [String] Id of the cluster, -1 to use default
        #
        # @return [Integer, OpenNebula::Error] the new ID in case of
        #   success, error otherwise
        def allocate(hostname,im,vmm,vnm,cluster_id=ClusterPool::NONE_CLUSTER_ID)
            super(HOST_METHODS[:allocate],hostname,im,vmm,vnm,cluster_id)
        end

        # Deletes the Host
        def delete()
            super(HOST_METHODS[:delete])
        end

        # Enables the Host
        def enable()
            set_enabled(true)
        end

        # Disables the Host
        def disable()
            set_enabled(false)
        end

        def flush()
            self.disable

            vm_pool = OpenNebula::VirtualMachinePool.new(@client,
                                                VirtualMachinePool::INFO_ALL_VM)

            rc = vm_pool.info
            if OpenNebula.is_error?(rc)
                 puts rc.message
                 exit -1
            end

            vm_pool.each do |vm|
                hid = vm['HISTORY_RECORDS/HISTORY[last()]/HID']
                if hid == self['ID']
                    vm.resched
                end
            end
        end

        # Replaces the template contents
        #
        # @param new_template [String] New template contents
        # @param append [true, false] True to append new attributes instead of
        #   replace the whole template
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def update(new_template, append=false)
            super(HOST_METHODS[:update], new_template, append ? 1 : 0)
        end

        # Retrieves this Host's monitoring data from OpenNebula
        #
        # @param [Array<String>] xpath_expressions Elements to retrieve.
        #
        # @return [Hash<String, Array<Array<int>>>, OpenNebula::Error] Hash with
        #   the requested xpath expressions, and an Array of 'timestamp, value'.
        #
        # @example
        #   host.monitoring( ['HOST_SHARE/FREE_CPU', 'HOST_SHARE/RUNNING_VMS'] )
        #
        #   { "HOST_SHARE/RUNNING_VMS" =>
        #       [["1337266000", "1"],
        #        ["1337266044", "1"],
        #        ["1337266088", "3"]],
        #     "HOST_SHARE/FREE_CPU" =>
        #       [["1337266000", "800"],
        #        ["1337266044", "800"],
        #        ["1337266088", "800"]]
        #   }
        def monitoring(xpath_expressions)
            return super(HOST_METHODS[:monitoring], 'HOST',
                'LAST_MON_TIME', xpath_expressions)
        end

        # Retrieves this Host's monitoring data from OpenNebula, in XML
        #
        # @return [String] Monitoring data, in XML
        def monitoring_xml()
            return Error.new('ID not defined') if !@pe_id

            return @client.call(HOST_METHODS[:monitoring], @pe_id)
        end

        # Renames this Host
        #
        # @param name [String] New name for the Host.
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def rename(name)
            return call(HOST_METHODS[:rename], @pe_id, name)
        end

        # Imports a wild VM from the host and puts it in running state
        #
        # @param name [String] Name of the VM to import
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def import_wild(name)
            vms = importable_wilds.select {|vm| vm['VM_NAME'] == name }

            if vms.length == 0
                return OpenNebula::Error.new("No importable wilds with name " <<
                    "'#{name}' found.")
            elsif vms.length > 1
                return OpenNebula::Error.new("More than one importable wild " <<
                    "with name '#{name}' found.")
            end

            wild = vms.first

            template = Base64.decode64(wild['IMPORT_TEMPLATE'])

            xml = OpenNebula::VirtualMachine.build_xml
            vm = OpenNebula::VirtualMachine.new(xml, @client)

            rc = vm.allocate(template)

            return rc if OpenNebula.is_error?(rc)

            vm.deploy(id, false)
            return vm.id
        end

        #######################################################################
        # Helpers to get Host information
        #######################################################################

        # Returns the state of the Host (numeric value)
        def state
            self['STATE'].to_i
        end

        # Returns the state of the Host (string value)
        def state_str
            HOST_STATES[state]
        end

        # Returns the state of the Host (string value)
        def short_state_str
            SHORT_HOST_STATES[state_str]
        end

        # Returns the <TEMPLATE> element in text form
        # indent:: _Boolean_ indents the resulting string, default true
        def template_str(indent=true)
            template_like_str('TEMPLATE', indent)
        end

        # Get wild VMs in the host
        def wilds
            [self.to_hash['HOST']['TEMPLATE']['VM']].flatten.compact
        end

        # Get importable wild VMs in the host
        def importable_wilds
            wilds.select {|w| Hash === w && w['IMPORT_TEMPLATE'] }
        end

    private
        def set_enabled(enabled)
            return Error.new('ID not defined') if !@pe_id

            rc = @client.call(HOST_METHODS[:enable], @pe_id, enabled)
            rc = nil if !OpenNebula.is_error?(rc)

            return rc
        end
    end
end
