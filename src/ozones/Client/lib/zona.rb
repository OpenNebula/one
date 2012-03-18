# -------------------------------------------------------------------------- #
# Copyright 2002-2012, OpenNebula Project Leads (OpenNebula.org)             #
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


require 'rubygems'
require 'uri'
require 'net/https'

require 'zona/OZonesJSON'

require 'zona/OZonesPool'
require 'zona/OZonesElement'

require 'zona/ZonePool'
require 'zona/ZoneElement'

require 'zona/VDCPool'
require 'zona/VDCElement'

################################################################################
# This module contains all the OZones API related classes and utilities.
################################################################################
module Zona

    ############################################################################
    # OZones Client provides functionality to send and retrieve information
    # from the OZones server side. It is used by CLI and API to handle the
    # http requests to the server and basic error control on the
    # responses.
    ############################################################################
    class Client

        # Provides current version information.
        # Should match server's oZones version.
        OZONES_VERSION = <<EOT
oZones 1.0
Copyright 2002-2012, OpenNebula Project Leads (OpenNebula.org)

Licensed under the Apache License, Version 2.0 (the "License"); you may
not use this file except in compliance with the License. You may obtain
a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
EOT

        # Initialize client instance
        # @param [String] user oZones username
        # @param [String] pass oZones password
        # @param [String] endpoint Server endpoint
        # @param [Integer] timeout client timout, defaults means no timeout
        # @param [Boolean] debug_flag produce debug information
        # @return [Client] Client instance
        def initialize(user=nil, pass=nil, endpoint_str=nil,
                       timeout=nil, debug_flag=true)
            @debug   = debug_flag
            @timeout = timeout

            # Server location
            if endpoint_str
                @endpoint =  endpoint_str
            elsif ENV["OZONES_URL"]
                @endpoint = ENV["OZONES_URL"]
            else
                @endpoint = "http://localhost:6121"
            end

            # Autentication
            if user && pass
                @ozonesauth = [user, pass]
            elsif ENV['OZONES_AUTH']
                @ozonesauth=File.read(ENV['OZONES_AUTH']).strip.split(':')
            end

            if !@ozonesauth
                raise "No authorization data present"
            end

            if @ozonesauth.size != 2
                raise "Authorization data malformed"
            end
        end

        # Retrieves all elements of a kind (pool)
        # @param [String] kind element kind
        # @return [String, Zone::Error] Response string or Error
        def get_pool(kind)
            url = URI.parse(@endpoint+"/" + kind)
            req = Net::HTTP::Get.new(url.path)

            req.basic_auth @ozonesauth[0], @ozonesauth[1]

            res = Client.http_start(url, @timeout) {|http|
                http.request(req)
            }

            return Client.parse_error(res, kind)
        end

        # Creates a resource from an opennebula template file
        # @param [String] kind resource kind: vdc,zone...
        # @param [String] template path to template file
        # @return [String, Zona::Error] Response string or Error
        def post_resource_file(kind, template)
            tmpl_str = File.read(template)
            post_resource_str(kind, tmpl_str)
        end

        # Creates a resource from an OpenNebula template string
        # @param [String] kind resource kind: vdc,zone...
        # @param [String] tmpl_str OpenNebula template string
        # @return [String, Zona::Error] Response string or Error
        def post_resource_str(kind, tmpl_str)
            tmpl_json = Zona.parse_template(kind, tmpl_str)
            post_resource(kind, tmpl_json)
        end

        # Creates a resource
        # @param [String] kind resource kind: vdc, zone...
        # @param [String] tmpl_json JSON template
        # @return [String, Zona::Error] Response string or Error
        def post_resource(kind, tmpl_json)
            url = URI.parse("#{@endpoint}/#{kind}")

            req = Net::HTTP::Post.new(url.path)
            req.body=tmpl_json

            req.basic_auth @ozonesauth[0], @ozonesauth[1]

            res = Client.http_start(url, @timeout) do |http|
                http.request(req)
            end

            return Client.parse_error(res, kind)
        end

        # Modifies a resource from an OpenNebula template string
        # @param [String] kind resource kind: vdc, zone...
        # @param [String] tmpl_str OpenNebula template string
        # @return [String, Zona::Error] Response string or Error
        def put_resource_str(kind, id, tmpl_str)
            tmpl_json = Zona.parse_template(kind, tmpl_str)
            put_resource(kind, id, tmpl_json)
        end

        # Modifies a resource
        # @param [String] kind resource kind: vdc, zone...
        # @param [String] tmpl_json JSON template
        # @return [String, Zona::Error] Response string or Error
        def put_resource(kind, id, tmpl_json)
            url = URI.parse("#{@endpoint}/#{kind}/#{id}")

            req = Net::HTTP::Put.new(url.path)
            req.body=tmpl_json

            req.basic_auth @ozonesauth[0], @ozonesauth[1]

            res = Client.http_start(url, @timeout) do |http|
                http.request(req)
            end

            return Client.parse_error(res, kind)
        end


        # Retrieves a resource
        # @param [String] Kind resource kind: vdc, zone...
        # @param [#to_i] id resource id
        # @return [String, Zona::Error] Response string or Error
        def get_resource(kind, id)
            url = URI.parse("#{@endpoint}/#{kind}/#{id}")
            req = Net::HTTP::Get.new(url.path)

            req.basic_auth @ozonesauth[0], @ozonesauth[1]

            res = Client.http_start(url, @timeout) {|http|
                http.request(req)
            }

            return Client.parse_error(res, kind)
        end

        # Retrieves a pool belonging to a specific resource
        # @param [String] Kind resource kind: vdc, zone...
        # @param [#to_i] id resource id
        # @param [String] Kind of pool: image, vm, host, etc
        # @return [String, Zona::Error] Response string or Error
        def get_resource_pool(kind, id, pool)
            url = URI.parse("#{@endpoint}/#{kind}/#{id}/#{pool}")
            req = Net::HTTP::Get.new(url.path)

            req.basic_auth @ozonesauth[0], @ozonesauth[1]

            res = Client.http_start(url, @timeout) {|http|
                http.request(req)
            }
            return Client.parse_error(res, kind)
        end

        # Deletes a resource
        # @param [String] kind resource kind: vdc, zone...
        # @param [#to_i] id resource id
        # @return [String, Zona::Error] Response string or Error
        def delete_resource(kind, id)
            url = URI.parse("#{@endpoint}/#{kind}/#{id}")
            req = Net::HTTP::Delete.new(url.path)

            req.basic_auth @ozonesauth[0], @ozonesauth[1]

            res = Client.http_start(url, @timeout) {|http|
                http.request(req)
            }

            return Client.parse_error(res, kind)
        end

        private

        # Starts an http connection and calls the block provided. SSL flag
        # is set if needed.
        def self.http_start(url, timeout, &block)
            http = Net::HTTP.new(url.host, url.port)

            if timeout
                http.read_timeout = timeout.to_i
            end

            if url.scheme=='https'
                http.use_ssl = true
                http.verify_mode=OpenSSL::SSL::VERIFY_NONE
            end

            begin
                http.start do |connection|
                    block.call(connection)
                end
            rescue Errno::ECONNREFUSED => e
                str =  "Error connecting to server (#{e.to_s}).\n"
                str << "Server: #{url.host}:#{url.port}"
                return Error.new(str)
            rescue Errno::ETIMEDOUT => e
                str =  "Error timeout connecting to server (#{e.to_s}).\n"
                str << "Server: #{url.host}:#{url.port}"
                return Error.new(str)
            rescue Timeout::Error => e
                str =  "Error timeout while connected to server (#{e.to_s}).\n"
                str << "Server: #{url.host}:#{url.port}"
                return Error.new(str)
            rescue Errno::ENETUNREACH => e
                str = "Error trying to reach network (#{e.to_s}).\n"
                str << "Server: #{url.host}:#{url.port}"
                return Error.new(str)
            end
        end

        # Parses a response
        # @param [String] value response string
        # @param [String] kind resource kind
        # @return [String, Zona::Error] Returns the value or Error if found
        def self.parse_error(value, kind)
            if Zona.is_error?(value)
                return value
            end

            if Zona.is_http_error?(value)
                str = "Operating with #{kind} failed with HTTP error"
                str += " code: #{value.code}\n"

                if value.body
                    ehash = OZonesJSON.parse_json(value.body,"error")

                    str << ehash[:message] if !ehash.nil? and !Zona.is_error?(ehash)
                end

                return Error.new(str)
            end

            value # If it is not an error, return it as-is
        end
    end

    # Parses a OpenNebula template string and turns it into a JSON string
    # @param [String] kind element kind
    # @param [String] tmpl_str template
    # @return [String, Zona::Error] JSON string or Error
    def self.parse_template(kind, tmpl_str)
        name_reg     =/[\w\d_-]+/
        variable_reg =/\s*(#{name_reg})\s*=\s*/
        single_variable_reg =/^#{variable_reg}([^\[]+?)(#.*)?$/

        tmpl = Hash.new

        tmpl_str.scan(single_variable_reg) do | m |
            key = m[0].strip.upcase
            value = m[1].strip
            tmpl[key] = value
        end

        res  = { "#{kind.upcase}" => tmpl }

        return OZonesJSON.to_json(res)
    end

    # @return [Boolean] Returns true if instance of {Zona::Error}
    def self.is_error?(value)
        value.class==Zona::Error
    end

    # @return [Boolean] Returns true if HTTP return code is not OK
    def self.is_http_error?(value)
        value.class != Net::HTTPOK
    end

    # The Error Class represents a generic error in the Zona
    # library. It contains a readable representation of the error.
    class Error
        attr_reader :message

        # @param [String] A description of the error
        def initialize(message=nil)
            @message=message
        end

        # @return [String] Error message description
        def to_s()
            @message
        end
    end
end
