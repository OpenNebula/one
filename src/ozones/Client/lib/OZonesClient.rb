# -------------------------------------------------------------------------- #
# Copyright 2002-2011, OpenNebula Project Leads (OpenNebula.org)             #
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
require 'json'

module OZonesClient
    class Client
        
        OZONES_VERSION = <<EOT
oZones 1.0
Copyright 2002-2011, OpenNebula Project Leads (OpenNebula.org)

Licensed under the Apache License, Version 2.0 (the "License"); you may
not use this file except in compliance with the License. You may obtain
a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
EOT

        ######################################################################
        # Initialize client library
        ######################################################################
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
        
        #####################################
        # General Resource Request Methods #
        ####################################
        
        ######################################################################
        # Retieves all elements on a pool
        # :zonetemplate
        ######################################################################        
        def get_pool(kind)
            url = URI.parse(@endpoint+"/" + kind)
            req = Net::HTTP::Get.new(url.path)

            req.basic_auth @ozonesauth[0], @ozonesauth[1]

            res = OZonesClient::http_start(url, @timeout) {|http|
                http.request(req)
            }
            
            return OZonesClient::parse_error(res, kind)
        end
        
        ######################################################################
        # Post a new Resource to the relevant OZones Pool
        # :zonetemplate
        ######################################################################
        def post_resource(kind, template)
            template=File.read(template)
            
            body_str = ""
            
            template.strip.each{|line|
                line.strip!
                key,value = line.split("=")
                body_str = body_str + key + "=" + URI.escape(value) + "&"
            }

            body_str = body_str[0..-1]
            
            url = URI.parse(@endpoint+"/"+kind)

            req = Net::HTTP::Post.new(url.path)
            req.body=body_str

            req.basic_auth @ozonesauth[0], @ozonesauth[1]

            res = OZonesClient::http_start(url, @timeout) do |http|
                http.request(req)
            end

            return  OZonesClient::parse_error(res, kind)
        end

        
        def get_resource(kind, id)
            url = URI.parse(@endpoint+"/#{kind}/" + id.to_s)
            req = Net::HTTP::Get.new(url.path)
            
            req.basic_auth @ozonesauth[0], @ozonesauth[1]

            res = OZonesClient::http_start(url, @timeout) {|http|
                http.request(req)
            }

            return OZonesClient::parse_error(res, kind)
        end
        
        def delete_resource(kind, id)
            url = URI.parse(@endpoint+"/#{kind}/" + id.to_s)
            req = Net::HTTP::Delete.new(url.path)
 
            req.basic_auth @ozonesauth[0], @ozonesauth[1]

            res = OZonesClient::http_start(url, @timeout) {|http|
                http.request(req)
            }

            return OZonesClient::parse_error(res, kind)
        end
    end
    
    # #########################################################################
    # The Error Class represents a generic error in the OZones Client
    # library. It contains a readable representation of the error.
    # #########################################################################
    class Error
        attr_reader :message

        # +message+ a description of the error
        def initialize(message=nil)
            @message=message
        end

        def to_s()
            @message
        end
    end

    # #########################################################################
    # Error handling functions
    # #########################################################################
    def self.is_error?(value)
        value.class==OZonesClient::Error
    end
    
    def self.is_http_error?(value)
        value.class == Net::HTTPInternalServerError ||
        value.class == Net::HTTPBadRequest ||
        value.class == Net::HTTPNotFound ||
        value.class == Net::HTTPUnauthorized
    end
    
    def self.parse_error(value, kind)
        if OZonesClient::is_error?(value)
            return value
        else
            if OZonesClient::is_http_error?(value)
                str = "Operating with #{kind.upcase} failed with HTTP error " 
                str = str + "code: #{value.code}\n"
                if value.body
                    # Try to extract error message
                    begin
                         str << "Body: " <<
                             OZonesClient::parse_json(value.body, 
                                                         "error")["message"]
                    rescue
                        str.gsub!("\nBody:","")
                    end
                end
                return OZonesClient::Error.new str
            end
        end
        return value # If it is not an error, return it as-is
    end
    
    # #########################################################################
    # Starts an http connection and calls the block provided. SSL flag
    # is set if needed.
    # #########################################################################
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

            return OZonesClient::Error.new(str)
        rescue Errno::ETIMEDOUT => e
            str =  "Error timeout connecting to server (#{e.to_s}).\n"
            str << "Server: #{url.host}:#{url.port}"

            return OZonesClient::Error.new(str)
        rescue Timeout::Error => e
            str =  "Error timeout while connected to server (#{e.to_s}).\n"
            str << "Server: #{url.host}:#{url.port}"

            return OZonesClient::Error.new(str)
        end
    end
    
    ##########################################################################
    # JSON utils
    ##########################################################################
    
    def self.parse_json(json_str, root_element)
        begin
            hash = JSON.parse(json_str)
        rescue Exception => e
            return OZonesClient::Error.new(e.message)
        end

        if hash.has_key?(root_element)
            return hash[root_element]
        else
            return OZonesClient::Error.new("Error parsing JSON: Wrong resource type")
        end
    end
    
    def self.to_json(hash_to_convert)
        begin
            JSON.pretty_generate hash_to_convert
        rescue Exception => e
            OZonesClient::Error.new(e.message)
        end
    end
end