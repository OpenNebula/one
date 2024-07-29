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
require 'openssl'
require 'yaml'

##############################################################################
# Module VCenterDriver
##############################################################################
module VCenterDriver

    ##########################################################################
    # Class VIClient
    ##########################################################################
    class VIClient

        attr_accessor :vim
        attr_accessor :rp
        attr_accessor :vc_name
        attr_accessor :ccr_ref

        def initialize(opts, host_id = -1)
            opts = { :insecure => true }.merge(opts)
            @host_id = host_id
            @vim = RbVmomi::VIM.connect(opts)
            @vc_name = opts[:host] if opts[:host]

            # Get ccr and get rp
            @ccr_ref = opts.delete(:ccr)

            return unless @ccr_ref

            ccr = RbVmomi::VIM::ClusterComputeResource.new(@vim, @ccr_ref)

            # Get ref for rp

            return unless ccr

            rp = opts.delete(:rp)

            return unless rp

            rp_list = get_resource_pools(ccr)
            rp_ref =
                rp_list
                .select {|r| r[:name] == rp }.first[:ref] rescue nil
            @rp = RbVmomi::VIM::ResourcePool(@vim, rp_ref) if rp_ref
        end

        def rp_confined?
            !!@rp
        end

        def host_credentials(one_client)
            raise 'no host id defined!' if @host_id == -1

            host =
                OpenNebula::Host
                .new_with_id(
                    @host_id,
                    one_client
                )
            rc = host.info
            if OpenNebula.is_error?(rc)
                raise "Could not get host info \
                for ID: #{@host_id} - #{rc.message}"
            end

            { :pass => host['TEMPLATE/VCENTER_PASSWORD'],
             :user => host['TEMPLATE/VCENTER_USER'],
             :host => @vc_name }
        end

        def get_resource_pools(ccr, rp = nil, parent_prefix = '', rp_array = [])
            current_rp = ''

            if !rp
                rp = ccr.resourcePool
            else
                if !parent_prefix.empty?
                    current_rp << parent_prefix
                    current_rp << '/'
                end
                current_rp << rp.name
            end

            if rp.resourcePool.empty?
                rp_info = {}
                rp_info[:name] = current_rp
                rp_info[:ref]  = rp._ref
                rp_array << rp_info
            else
                rp.resourcePool.each do |child_rp|
                    get_resource_pools(ccr, child_rp, current_rp, rp_array)
                end
                rp_info = {}
                rp_info[:name] = current_rp
                rp_info[:ref]  = rp._ref
                rp_array << rp_info unless current_rp.empty?
            end

            rp_array
        end

        def close_connection
            @vim.close
        end

        # @return RbVmomi::VIM::<type> objects
        def self.get_entities(folder, type, entities = [])
            if folder == []
                # rubocop:disable Style/ReturnNil
                return nil
                # rubocop:enable Style/ReturnNil
            end

            folder.childEntity.each do |child|
                the_name, _junk = child.to_s.split('(')
                case the_name
                when 'Folder'
                    get_entities(child, type, entities)
                when type
                    entities.push(child)
                end
            end

            entities
        end

        def self.new_from_host(host_id, client = nil)
            client = OpenNebula::Client.new if client.nil?
            host = OpenNebula::Host.new_with_id(host_id, client)
            rc = host.info(true)
            if OpenNebula.is_error?(rc)
                raise "Could not get host info for \
                ID: #{host_id} - #{rc.message}"
            end

            connection = {
                :host     => host['TEMPLATE/VCENTER_HOST'],
                :user     => host['TEMPLATE/VCENTER_USER'],
                :rp       => host['TEMPLATE/VCENTER_RESOURCE_POOL'],
                :ccr      => host['TEMPLATE/VCENTER_CCR_REF'],
                :password => host['TEMPLATE/VCENTER_PASSWORD']
            }

            vc_port = host['TEMPLATE/VCENTER_PORT']
            connection[:port] = vc_port unless vc_port.nil?

            new(connection, host_id)
        end

        def self.new_from_datastore(datastore_id)
            client = OpenNebula::Client.new
            datastore =
                OpenNebula::Datastore
                .new_with_id(
                    datastore_id,
                    client
                )
            rc = datastore.info
            if OpenNebula.is_error?(rc)
                raise "Could not get datastore info \
                for ID: #{datastore_id} - #{rc.message}"
            end

            vcenter_id = datastore['TEMPLATE/VCENTER_INSTANCE_ID']

            host_pool = OpenNebula::HostPool.new(client)
            rc = host_pool.info
            if OpenNebula.is_error?(rc)
                raise "Could not get hosts information - #{rc.message}"
            end

            user = ''
            password = ''
            port = 0
            host_pool.each do |host|
                vc_instance_id = host['TEMPLATE/VCENTER_INSTANCE_ID']
                next unless vc_instance_id == vcenter_id

                host_decrypted =
                    OpenNebula::Host
                    .new_with_id(
                        host['ID'],
                        client
                    )
                host_decrypted.info(true)
                user = host_decrypted['TEMPLATE/VCENTER_USER']
                password = host_decrypted['TEMPLATE/VCENTER_PASSWORD']
                port = host_decrypted['TEMPLATE/VCENTER_PORT']
            end
            if password.empty? || user.empty?
                raise "Error getting \
                credentials for datastore #{datastore_id}"
            end

            connection = {
                :host     => datastore['TEMPLATE/VCENTER_HOST'],
                :user     => user,
                :password => password
            }

            connection[:port] = port unless port.nil?

            new(connection)
        end

        def self.decrypt(msg, token)
            begin
                cipher = OpenSSL::Cipher.new('aes-256-cbc')

                cipher.decrypt

                # Truncate for Ruby 2.4 (in previous versions this was being
                #  automatically truncated)
                cipher.key = token[0..31]

                msg =  cipher.update(Base64.decode64(msg))
                msg << cipher.final
            rescue StandardError
                raise 'Error decrypting secret.'
            end
        end

        def self.in_silence
            begin
                orig_stderr = $stderr.clone
                orig_stdout = $stdout.clone
                $stderr.reopen File.new('/dev/null', 'w')
                $stdout.reopen File.new('/dev/null', 'w')
                retval = yield
            rescue StandardError => e
                $stdout.reopen orig_stdout
                $stderr.reopen orig_stderr
                raise e
            ensure
                $stdout.reopen orig_stdout
                $stderr.reopen orig_stderr
            end
            retval
        end

        def self.in_stderr_silence
            begin
                orig_stderr = $stderr.clone
                $stderr.reopen File.new('/dev/null', 'w')
                retval = yield
            rescue StandardError => e
                $stderr.reopen orig_stderr
                raise e
            ensure
                $stderr.reopen orig_stderr
            end
            retval
        end

    end

end
# module VCenterDriver
