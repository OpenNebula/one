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
module NSXDriver

    ONE_LOCATION = ENV['ONE_LOCATION'] unless defined?(ONE_LOCATION)

    if !ONE_LOCATION
        RUBY_LIB_LOCATION = '/usr/lib/one/ruby' \
            unless defined?(RUBY_LIB_LOCATION)
        GEMS_LOCATION     = '/usr/share/one/gems' \
            unless defined?(GEMS_LOCATION)
    else
        RUBY_LIB_LOCATION = ONE_LOCATION + '/lib/ruby' \
            unless defined?(RUBY_LIB_LOCATION)
        GEMS_LOCATION     = ONE_LOCATION + '/share/gems' \
            unless defined?(GEMS_LOCATION)
    end

    if File.directory?(GEMS_LOCATION)
        Gem.use_paths(GEMS_LOCATION)
    end

    $LOAD_PATH << RUBY_LIB_LOCATION

    require 'net/http'
    require 'json'
    require 'nokogiri'
    require 'opennebula'
    require 'vcenter_driver'
    require 'nsx_driver'

    # Class NSXClient
    class NSXClient

        # ATTIBUTES
        attr_accessor :nsxmgr
        attr_accessor :nsx_user
        attr_accessor :nsx_password

        # CONSTRUCTORS
        def initialize(nsxmgr, nsx_user, nsx_password)
            @nsxmgr = nsxmgr
            @nsx_user = nsx_user
            @nsx_password = nsx_password
        end

        def self.new_child(nsxmgr, nsx_user, nsx_password, type)
            case type.upcase
            when NSXDriver::NSXConstants::NSXT
                NSXDriver::NSXTClient.new(nsxmgr, nsx_user, nsx_password)
            when NSXDriver::NSXConstants::NSXV
                NSXDriver::NSXVClient.new(nsxmgr, nsx_user, nsx_password)
            else
                raise NSXDriver::NSXException::UnknownObject, \
                      'Unknown object type'
            end
        end

        def self.new_from_id(host_id)
            client = OpenNebula::Client.new
            host = OpenNebula::Host.new_with_id(host_id, client)
            rc = host.info

            if OpenNebula.is_error?(rc)
                raise "Could not get host info for ID: \
                        #{host_id} - #{rc.message}"
            end

            nsxmgr = host['TEMPLATE/NSX_MANAGER']
            nsx_user = host['TEMPLATE/NSX_USER']
            nsx_password = NSXDriver::NSXClient
                           .nsx_pass(host['TEMPLATE/NSX_PASSWORD'])
            nsx_type = host['TEMPLATE/NSX_TYPE']

            new_child(nsxmgr, nsx_user, nsx_password, nsx_type)
        end

        # METHODS

        def check_response(response, codes_array)
            codes_array.each do |code|
                return true if response.code.to_i == code
            end
            false
        end

        def self.nsx_pass(nsx_pass_enc)
            client = OpenNebula::Client.new
            system = OpenNebula::System.new(client)
            config = system.get_configuration

            if OpenNebula.is_error?(config)
                raise "Error getting oned configuration : #{config.message}"
            end

            token = config['ONE_KEY']
            @nsx_password = VCenterDriver::VIClient
                            .decrypt(nsx_pass_enc, token)
        end

        def get(url); end

        # Return: id of the created object
<<<<<<< HEAD
        def post(url, ls_data); end
=======
        def post_xml(url, data)
            uri = URI.parse(url)
            request = Net::HTTP::Post.new(uri.request_uri, HEADER_XML)
            request.body = data
            request.basic_auth(@nsx_user, @nsx_password)
            response = Net::HTTP.start(uri.host, uri.port, :use_ssl => true,
              :verify_mode => OpenSSL::SSL::VERIFY_NONE) do |https|
                  https.request(request)
              end
            return response.body if check_response(response, [200, 201])
        end

        def put_xml(url, data)
            uri = URI.parse(url)
            request = Net::HTTP::Put.new(uri.request_uri, HEADER_XML)
            request.body = data
            request.basic_auth(@nsx_user, @nsx_password)
            response = Net::HTTP.start(uri.host, uri.port, :use_ssl => true,
              :verify_mode => OpenSSL::SSL::VERIFY_NONE) do |https|
                  https.request(request)
              end
            return response.body if check_response(response, [200, 201])
        end
>>>>>>> F #3440: Added put_json and put_xml methods

        def delete(url); end

<<<<<<< HEAD
        def get_token(url); end
=======
        # Return: id of the created object
        def post_json(url, data)
            uri = URI.parse(url)
            request = Net::HTTP::Post.new(uri.request_uri, HEADER_JSON)
            request.body = data
            request.basic_auth(@nsx_user, @nsx_password)
            response = Net::HTTP.start(uri.host, uri.port, :use_ssl => true,
              :verify_mode => OpenSSL::SSL::VERIFY_NONE) do |https|
                  https.request(request)
              end
            return JSON.parse(response.body)['id'] \
                if check_response(response, [200, 201])
        end

        def put_json(url, data)
            uri = URI.parse(url)
            request = Net::HTTP::Put.new(uri.request_uri, HEADER_JSON)
            request.body = data
            request.basic_auth(@nsx_user, @nsx_password)
            response = Net::HTTP.start(uri.host, uri.port, :use_ssl => true,
              :verify_mode => OpenSSL::SSL::VERIFY_NONE) do |https|
                  https.request(request)
              end
            return JSON.parse(response.body)['id'] \
                if check_response(response, [200, 201])
        end

        def delete(url, header)
            uri = URI.parse(url)
            request = Net::HTTP::Delete.new(uri.request_uri, header)
            request.basic_auth(@nsx_user, @nsx_password)
            response = Net::HTTP.start(uri.host, uri.port, :use_ssl => true,
              :verify_mode => OpenSSL::SSL::VERIFY_NONE) do |https|
                  https.request(request)
              end
            check_response(response, [200])
        end

        def get_token(url, header)
            uri = URI.parse(url)
            request = Net::HTTP::Post.new(uri.request_uri, header)
            request.basic_auth(@nsx_user, @nsx_password)
            response = Net::HTTP.start(uri.host, uri.port, :use_ssl => true,
              :verify_mode => OpenSSL::SSL::VERIFY_NONE) do |https|
                  https.request(request)
              end
            if header[:'Content-Type'] == 'application/json'
                response.body if check_response(response, 200)
            elsif header[:'Content-Type'] == 'application/xml'
                response_xml = Nokogiri::XML response.body \
                                  if check_response(response, 200)
                token = response_xml.xpath('//authToken/value').text
                { 'token' => token }.to_json
            else
                nil
            end
        end
>>>>>>> F #3440: Added put_json and put_xml methods

    end

end
