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

require 'rubygems'
require 'uri'
require 'ipaddress'

require 'digest/sha1'
require 'net/https'

require "rexml/document"

begin
    require 'rexml/formatters/pretty'
    REXML_FORMATTERS=true
rescue LoadError
    REXML_FORMATTERS=false
end

begin
    require 'curb'
    CURL_LOADED=true
rescue LoadError
    CURL_LOADED=false
end

begin
    require 'net/http/post/multipart'
    MULTIPART_LOADED=true
rescue LoadError
    MULTIPART_LOADED=false
end

###############################################################################
# The CloudClient module contains general functionality to implement a
# Cloud Client
###############################################################################
module CloudClient

    # OpenNebula version
    VERSION = '6.10.0'

    # #########################################################################
    # Default location for the authentication file
    # #########################################################################

    if ENV["HOME"]
        DEFAULT_AUTH_FILE = ENV["HOME"]+"/.one/one_auth"
    else
        DEFAULT_AUTH_FILE = "/var/lib/one/.one/one_auth"
    end

    # #########################################################################
    # Gets authorization credentials from ONE_AUTH or default
    # auth file.
    #
    # Raises an error if authorization is not found
    # #########################################################################

    def self.get_one_auth
        if ENV["ONE_AUTH"] and !ENV["ONE_AUTH"].empty? and
            File.file?(ENV["ONE_AUTH"])
            one_auth=File.read(ENV["ONE_AUTH"]).strip.split(':')
        elsif File.file?(DEFAULT_AUTH_FILE)
            one_auth=File.read(DEFAULT_AUTH_FILE).strip.split(':')
        else
            raise "No authorization data present"
        end

        raise "Authorization data malformed" if one_auth.length < 2

        one_auth
    end

    # #########################################################################
    # Starts an http connection and calls the block provided. SSL flag
    # is set if needed.
    # #########################################################################
    def self.http_start(url, timeout, &block)
        host = nil
        port = nil

        if ENV['http_proxy']
            uri_proxy  = URI.parse(ENV['http_proxy'])
            flag = false

            # Check if we need to bypass the proxy
            if ENV['no_proxy']
                ENV['no_proxy'].split(',').each do |item|
                    item = item.rstrip.lstrip

                    unless (IPAddress(url.host) rescue nil).nil?
                        unless (IPAddress(item) rescue nil).nil?
                            flag |= IPAddress(item).include? IPAddress(url.host)
                        end
                    else
                        if (IPAddress(item) rescue nil).nil?
                            flag |= (item == url.host)
                        end
                    end
                end
            end

            unless flag
                host = uri_proxy.host
                port = uri_proxy.port
            end
        end

        http = Net::HTTP::Proxy(host, port).new(url.host, url.port)

        if timeout
            http.read_timeout = timeout.to_i
        end

        if url.scheme=='https'
            http.use_ssl = true
            http.verify_mode=OpenSSL::SSL::VERIFY_NONE
        end

        begin
            res = http.start do |connection|
                block.call(connection)
            end
        rescue Errno::ECONNREFUSED => e
            str =  "Error connecting to server (#{e.to_s}).\n"
            str << "Server: #{url.host}:#{url.port}"

            return CloudClient::Error.new(str,"503")
        rescue Errno::ETIMEDOUT => e
            str =  "Error timeout connecting to server (#{e.to_s}).\n"
            str << "Server: #{url.host}:#{url.port}"

            return CloudClient::Error.new(str,"504")
        rescue Timeout::Error => e
            str =  "Error timeout while connected to server (#{e.to_s}).\n"
            str << "Server: #{url.host}:#{url.port}"

            return CloudClient::Error.new(str,"504")
        rescue SocketError => e
            str =  "Error timeout while connected to server (#{e.to_s}).\n"

            return CloudClient::Error.new(str,"503")
        rescue
            return CloudClient::Error.new($!.to_s,"503")
        end

        if res.is_a?(Net::HTTPSuccess)
            res
        else
            CloudClient::Error.new(res.body, res.code)
        end
    end

    # #########################################################################
    # The Error Class represents a generic error in the Cloud Client
    # library. It contains a readable representation of the error.
    # #########################################################################
    class Error
        attr_reader :message
        attr_reader :code

        # +message+ a description of the error
        def initialize(message=nil, code="500")
            @message=message
            @code=code
        end

        def to_s()
            @message
        end
    end

    # #########################################################################
    # Returns true if the object returned by a method of the OpenNebula
    # library is an Error
    # #########################################################################
    def self.is_error?(value)
        value.class==CloudClient::Error
    end
end

# Command line help functions
module CloudCLI
    def print_xml(xml_text)
        begin
            doc = REXML::Document.new(xml_text)
        rescue REXML::ParseException => e
            return e.message, -1
        end

        xml = doc.root

        if xml.nil?
            return xml_text, -1
        end

        str = String.new
        if REXML_FORMATTERS
            formatter = REXML::Formatters::Pretty.new
            formatter.compact = true

            formatter.write(xml,str)
        else
            str = xml.to_s
        end

        return str, 0
    end

    # Returns the command name
    def cmd_name
        File.basename($0)
    end

    def version_text
        version=<<EOT
OpenNebula #{CloudClient::VERSION}
Copyright 2002-2024, OpenNebula Project, OpenNebula Systems

Licensed under the Apache License, Version 2.0 (the "License"); you may
not use this file except in compliance with the License. You may obtain
a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
EOT
    end
end
