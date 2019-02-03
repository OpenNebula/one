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
#--------------------------------------------------------------------------- #
require 'openssl'
require 'yaml'

module VCenterDriver

class VIClient
    attr_accessor :vim
    attr_accessor :rp
    attr_accessor :vc_name

    def initialize(opts, host_id = -1)
        opts = {:insecure => true}.merge(opts)
        @host_id = host_id
        @vim = RbVmomi::VIM.connect(opts)
        @vc_name = opts[:host] if opts[:host]

        # Get ccr and get rp
        ccr_ref = opts.delete(:ccr)
        if ccr_ref
            ccr = RbVmomi::VIM::ClusterComputeResource.new(@vim, ccr_ref)

            #Get ref for rp
            if ccr
                rp = opts.delete(:rp)
                if rp
                    rp_list = get_resource_pools(ccr)
                    rp_ref = rp_list.select { |r| r[:name] == rp }.first[:ref] rescue nil
                    @rp = RbVmomi::VIM::ResourcePool(@vim, rp_ref) if rp_ref
                end
            end
        end
    end

    def rp_confined?
        !!@rp
    end

    def get_host_credentials()
        raise "no host id defined!" if @host_id == -1

        host = OpenNebula::Host.new_with_id(@host_id, OpenNebula::Client.new)
        rc = host.info
        if OpenNebula.is_error?(rc)
            raise "Could not get host info for ID: #{host_id} - #{rc.message}"
        end

        {pass: host["TEMPLATE/VCENTER_PASSWORD"],
         user: host["TEMPLATE/VCENTER_USER"],
         host: @vc_name }

    end

    def get_resource_pools(ccr, rp = nil, parent_prefix = "", rp_array = [])

        current_rp = ""

        if !rp
            rp = ccr.resourcePool
        else
            if !parent_prefix.empty?
                current_rp << parent_prefix
                current_rp << "/"
            end
            current_rp << rp.name
        end

        if rp.resourcePool.size == 0
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
            rp_array << rp_info if !current_rp.empty?
        end

        rp_array
    end

    def close_connection
        @vim.close
    end

    # @return RbVmomi::VIM::<type> objects
    def self.get_entities(folder, type, entities=[])
        if folder == []
            return nil
        end

        folder.childEntity.each do |child|
            the_name, junk = child.to_s.split('(')
            case the_name
            when "Folder"
                get_entities(child, type, entities)
            when type
                entities.push(child)
            end
        end

        return entities
    end

    def self.new_from_host(host_id)
        begin
            client = OpenNebula::Client.new
            host = OpenNebula::Host.new_with_id(host_id, client)
            rc = host.info
            if OpenNebula.is_error?(rc)
                raise "Could not get host info for ID: #{host_id} - #{rc.message}"
            end

            password = host["TEMPLATE/VCENTER_PASSWORD"]

            system = OpenNebula::System.new(client)
            config = system.get_configuration
            if OpenNebula.is_error?(config)
                raise "Error getting oned configuration : #{config.message}"
            end

            token = config["ONE_KEY"]

            password = VIClient::decrypt(password, token)

            connection = {
                :host     => host["TEMPLATE/VCENTER_HOST"],
                :user     => host["TEMPLATE/VCENTER_USER"],
                :rp       => host["TEMPLATE/VCENTER_RESOURCE_POOL"],
                :ccr      => host["TEMPLATE/VCENTER_CCR_REF"],
                :password => password
            }

            self.new(connection, host_id)

        rescue Exception => e
            raise e
        end
    end

    def self.new_from_datastore(datastore_id)
        begin
            client = OpenNebula::Client.new
            datastore = OpenNebula::Datastore.new_with_id(datastore_id, client)
            rc = datastore.info
            if OpenNebula.is_error?(rc)
                raise "Could not get datastore info for ID: #{datastore_id} - #{rc.message}"
            end

            password = datastore["TEMPLATE/VCENTER_PASSWORD"]

            system = OpenNebula::System.new(client)
            config = system.get_configuration
            if OpenNebula.is_error?(config)
                raise "Error getting oned configuration : #{config.message}"
            end

            token = config["ONE_KEY"]

            password = VIClient::decrypt(password, token)

            connection = {
                :host     => datastore["TEMPLATE/VCENTER_HOST"],
                :user     => datastore["TEMPLATE/VCENTER_USER"],
                :password => password
            }

            self.new(connection)

        rescue Exception => e
            raise e
        end
    end

    def self.decrypt(msg, token)
        begin
            cipher = OpenSSL::Cipher.new("aes-256-cbc")

            cipher.decrypt

            # Truncate for Ruby 2.4 (in previous versions this was being
            #  automatically truncated)
            cipher.key = token[0..31]

            msg =  cipher.update(Base64::decode64(msg))
            msg << cipher.final
        rescue
            raise "Error decrypting secret."
        end
    end

    def self.in_silence
        begin
          orig_stderr = $stderr.clone
          orig_stdout = $stdout.clone
          $stderr.reopen File.new('/dev/null', 'w')
          $stdout.reopen File.new('/dev/null', 'w')
          retval = yield
        rescue Exception => e
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
        rescue Exception => e
          $stderr.reopen orig_stderr
          raise e
        ensure
          $stderr.reopen orig_stderr
        end
       retval
    end
end

end # module VCenterDriver
