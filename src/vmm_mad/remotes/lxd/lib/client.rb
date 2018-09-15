# -------------------------------------------------------------------------- #
# Copyright 2002-2018, OpenNebula Project, OpenNebula Systems                #
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
# Base requests to interact with LXD. This class wraps API calls through the
# rest interface
#
module LXDRequests

    # Enable communication with LXD via unix socket
    begin
        SOCK = Net::BufferedIO.new(UNIXSocket.new('/var/lib/lxd/unix.socket'))
    rescue StandardError
        STDERR.puts('ERROR: Could not open LXD socket')
    end

    #
    # TODO rescue errors on socket creation
    #
    def initialize
        @sock = Net::BufferedIO.new(UNIXSocket.new('/var/lib/lxd/unix.socket'))

        @api    = '/1.0/'
        @header = { 'Host' => 'localhost' }
    end

    # Returns the HTTPResponse body as a hash
    # Params:
    # +request+:: +Net::HTTP::Request+ made to the http server
    # +data+:: +string+ for post/put requests (may be nil)
    def get_response(request, data)
        request.body = JSON.dump(data) unless data.nil?

        request.exec(@sock, '1.1', request.path)

        loop do
            response = Net::HTTPResponse.read_new(@sock)

            break unless response.is_a?(Net::HTTPContinue)
        end

        response.reading_body(@sock, request.response_body_permitted?) {}

        JSON.parse(response.body)
    end

    # Performs HTTP::Get
    # Params:
    # +uri+:: +string+ API path
    def get(uri)
        get_response(Net::HTTP::Get.new("#{@api}#{uri}", @header), nil)
    end

    # Performs HTTP::Delete
    # Params:
    # +uri+:: +string+ API path
    def delete(uri)
        get_response(Net::HTTP::Delete.new("#{@api}#{uri}", @header), nil)
    end

    # Performs HTTP::Put
    # Params:
    # +uri+:: +string+ API path
    def put(uri, data)
        get_response(Net::HTTP::Put.new("#{@api}#{uri}", @header), data)
    end

    # Performs HTTP::Post
    # Params:
    # +uri+:: +string+ API path
    def post(uri, data)
        get_response(Net::HTTP::Post.new("#{@api}#{uri}", @header), data)
    end

    # Performs HTTP::Patch
    # Params:
    # +uri+:: +string+ API path
    def patch(uri, data)
        get_response(Net::HTTP::Patch.new("#{@api}#{uri}", @header), data)
    end

end

# LXD API Client. This class is used to interact with lxd
#
class LXDClient

    include LXDRequests

    def initialize
        super

        @containers = "#{@api}containers/"
        @operations = "#{@api}operations/"
    end

    # # Containers
    # module Containers
    #   # Retrieve all containers.
    #   def all; end

    #   # Returns boolean indicating if the container exists.
    #   def exist(name); end

    #   # Get a specific container, by its name
    #   def get(name); end9

    #   # Create a new containerputs. This method requires the container config as the first parameter.
    #   def create(sock, uri)
    #     request = Net::HTTP::Post.new("/1.0/#{uri}", initheader = { 'Host' => 'localhost' })

    #     request.body = JSON.dump(
    #       'name' => 'ruby',
    #       'source' => {
    #         'type' => 'none'
    #       }
    #     )

    #     request.exec(sock, '1.1', "/1.0/#{uri}")
    #     request
    #   end

    # end

    # # Operations
    # module Operations
    #   # Get a specific operation, by its id.
    #   def get(operation); end

    #   # get an operation, but wait until it is complete before returning the operation object.
    #   def wait_for(operation); end
    # end

end
