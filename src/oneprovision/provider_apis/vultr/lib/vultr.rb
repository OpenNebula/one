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

require 'json'
require 'net/http'

# Vultr error
class VultrError < StandardError

    # Check if error is really an error
    #
    # @param error [Object] Error to check
    #
    # @return [Boolean] True if it is an error, false otherwise
    def self.error?(error)
        error.class == VultrError
    end

end

# Ruby bindings to interact with Vultr provider
class Vultr

    ############################################################################
    #
    # This Vultr binding has been developed following methods specified here:
    #   https://www.vultr.com/api
    #
    ############################################################################

    # API base URL
    BASE_URL = 'https://api.vultr.com/v2'

    # API instances URL
    INSTANCE_URL = "#{BASE_URL}/instances"

    # API bare-metal instances
    BAREMETAL_URL = "#{BASE_URL}/bare-metals"

    # API networks URL
    NETWORK_URL = "#{BASE_URL}/reserved-ips"

    # HTTP codes that are good
    GOOD_CODES = [Net::HTTPOK, Net::HTTPNoContent, Net::HTTPCreated]

    # Class constructor
    #
    # @param key [String] Vultr API key
    def initialize(key)
        @key = key
    end

    ############################################################################
    # Baremetal Methods
    ############################################################################
    def list_metals
        get(BAREMETAL_URL)
    end

    # Delete baremetal
    #
    # @param id [String] Baremetal ID
    #
    # @return [Nil, Error] nil if no error, error othwerise
    def delete_metal(id)
        delete("#{BAREMETAL_URL}/#{id}")
    end

    ############################################################################
    # Instances Methods
    ############################################################################

    # List instances
    #
    # @return [Hash, Error] hash with instances, error otherwise
    def list_instances
        get(INSTANCE_URL)
    end

    # Get instances information
    #
    # @param id [String] Instances ID
    #
    # @return [Hash, Error] hash with instance data if no error, error othwerise
    def instance(id)
        rc = get("#{INSTANCE_URL}/#{id}")

        return rc if VultrError.error?(rc)

        JSON.parse(rc)['instance']
    end

    # Delete instance
    #
    # @param id [String] Instances ID
    #
    # @return [Nil, Error] nil if no error, error othwerise
    def delete_instance(id)
        delete("#{INSTANCE_URL}/#{id}")
    end

    # Attach Reserved IP to an Instance
    #
    # @param id     [String] Instance ID
    # @param nic_id [String] The Reserved IP id to attach to this Instance
    #
    # @return [nil, Error] nil if no error, error othwerise
    def attach_nic(id, nic_id)
        data                = {}
        data['instance_id'] = id

        post("#{NETWORK_URL}/#{nic_id}/attach", data)
    end

    # Detach Reserved IP from an Instance
    #
    # @param id     [String] Instance ID
    # @param nic_id [String] The Reserved IP id to detach from this Instance
    #
    # @return [nil, Error] nil if no error, error othwerise
    def detach_nic(id, nic_id)
        data                = {}
        data['instance_id'] = id

        post("#{NETWORK_URL}/#{nic_id}/detach", data)
    end

    ############################################################################
    # Network methods
    ############################################################################

    # List IPs
    #
    # @return [Hash, Error] hash with IPs, error otherwise
    def list_ips
        get(NETWORK_URL)
    end

    # Create a new Reserved IP in a region
    #
    # @param region  [String] Create the Reserved IP in this Region id
    # @param ip_type [String] IP version, it can be v4 or v6
    #
    # @return [Hash, Error] Reserved IP hash if no error, error othwerise
    def create_nic(region, ip_type = 'v4')
        data            = {}
        data['region']  = region
        data['ip_type'] = ip_type

        rc = post(NETWORK_URL, data)

        return rc if VultrError.error?(rc)

        JSON.parse(rc)['reserved_ip']
    end

    # Delete aPrivate Network
    #
    # @param nic_id [String] The Network ID
    #
    # @return [nil, Error] nil if no error, error othwerise
    def delete_nic(nic_id)
        delete("#{NETWORK_URL}/#{nic_id}")
    end

    private

    ############################################################################
    # HTTP methods
    ############################################################################

    # Execute HTTP Get operation
    #
    # @param url [String] URL to call
    #
    # @return [Object, Error] Response if everything went well, error othwerise
    def get(url)
        req(url, :get)
    end

    # Execute HTTP Post operation
    #
    # @param url  [String] URL to call
    # @param data [JSON]   Data to send in the request
    #
    # @return [Object, Error] Response if everything went well, error othwerise
    def post(url, data)
        req(url, :post, data)
    end

    # Execute HTTP Delete operation
    #
    # @param url [String] URL to call
    #
    # @return [object, error] response if everything went well, error othwerise
    def delete(url)
        req(url, :delete)
    end

    ############################################################################
    # Helpers
    ############################################################################

    # Execute an HTTP request
    #
    # @param url    [String] URL to call
    # @param method [Symbol] HTTP method to use
    # @param data   [JSON]   Data to send
    #
    # @return [object, error] response if everything went well, error othwerise
    def req(url, method, data = nil)
        uri = URI(url)

        case method
        when :get
            req = Net::HTTP::Get.new(uri)
        when :post
            req = Net::HTTP::Post.new(uri)
        when :delete
            req = Net::HTTP::Delete.new(uri)
        else
            raise "Undefined method #{method}"
        end

        req['Accept']        = 'application/json'
        req['Authorization'] = "Bearer #{@key}"
        req.body             = data.to_json if data

        res         = Net::HTTP.new(uri.hostname, uri.port)
        res.use_ssl = true

        response = res.request(req)

        unless GOOD_CODES.include?(response.class)
            return VultrError.new(JSON.parse(response.body)['error'])
        end

        response.body
    end

end
