#!/usr/bin/ruby

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

require 'net/http'
require 'socket'
require 'json'

#
# LXD API Client. This class is used to interact with LXD. Wraps API calls
# through the REST API
#
class LXDClient

    # API Configuration Attributes

    API    = '/1.0'.freeze
    HEADER = { 'Host' => 'localhost' }.freeze

    attr_reader :lxd_path

    def initialize
        paths = ['/var/lib/lxd', '/var/snap/lxd/common/lxd']

        @socket = nil
        @lxd_path = nil

        paths.each do |path|
            begin
                @socket = socket(path)
                @lxd_path = path
                break
            rescue
                next
            end
        end

        raise 'Failed to open LXD socket' unless @socket
    end

    # Performs HTTP::Get
    # Params:
    # +uri+:: +string+ API path
    def get(uri)
        get_response(Net::HTTP::Get.new("#{API}/#{uri}", HEADER), data = nil)
    end

    # Performs HTTP::Delete
    # Params:
    # +uri+:: +string+ API path
    def delete(uri)
        get_response(Net::HTTP::Delete.new("#{API}/#{uri}", HEADER), data = nil)
    end

    # Performs HTTP::Put
    # Params:
    # +uri+:: +string+ API path
    def put(uri, data)
        get_response(Net::HTTP::Put.new("#{API}/#{uri}", HEADER), data)
    end

    # Performs HTTP::Post
    # Params:
    # +uri+:: +string+ API path
    def post(uri, data)
        get_response(Net::HTTP::Post.new("#{API}/#{uri}", HEADER), data)
    end

    # Performs HTTP::Patch
    # Params:
    # +uri+:: +string+ API path
    def patch(uri, data)
        get_response(Net::HTTP::Patch.new("#{API}/#{uri}", HEADER), data)
    end

    # Waits for an operation returned in response to be completed
    def wait(response, timeout)
        operation_id = response['operation'].split('/').last

        timeout = "?timeout=#{timeout}" if timeout

        response = get("operations/#{operation_id}/wait#{timeout}")

        raise LXDError, response if response['metadata']['status'] == 'Failure'

        response
    end

    private

    # Enable communication with LXD via unix socket
    def socket(lxd_path)
        Net::BufferedIO.new(UNIXSocket.new("#{lxd_path}/unix.socket"))
    end

    # Returns the HTTPResponse body as a hash
    # Params:
    # +request+:: +Net::HTTP::Request+ made to the http server
    # +data+:: +string+ for post/put/patch requests that send data to the server
    # (may be nil)

    def get_response(request, data)
        request.body = JSON.dump(data) unless data.nil?

        request.exec(@socket, '1.1', request.path)

        response = nil

        loop do
            response = Net::HTTPResponse.read_new(@socket)
            break unless response.is_a?(Net::HTTPContinue)
        end

        response.reading_body(@socket, request.response_body_permitted?) {}

        response = JSON.parse(response.body)

        raise LXDError, response if response['type'] == 'error'

        response
    end
end

# Error used for raising LXDClient exception when response is error return value
class LXDError < StandardError

    attr_reader :body, :error, :error_code, :type

    def initialize(msg = 'LXD API error')
        @body = msg
        @error = @body['error']
        @error_code = @body['error_code']
        @type = @body['type']
        super
    end

end
