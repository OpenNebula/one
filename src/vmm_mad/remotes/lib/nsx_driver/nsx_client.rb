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

    ONE_LOCATION = ENV['ONE_LOCATION']

    if !ONE_LOCATION
        RUBY_LIB_LOCATION = '/usr/lib/one/ruby'
        GEMS_LOCATION     = '/usr/share/one/gems'
    else
        RUBY_LIB_LOCATION = ONE_LOCATION + '/lib/ruby'
        GEMS_LOCATION     = ONE_LOCATION + '/share/gems'
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

    # Class NSXClient
    class NSXClient

        # ATTIBUTES
        attr_accessor :nsxmgr
        attr_accessor :nsx_user
        attr_accessor :nsx_password
        HEADER_JSON = { :'Content-Type' => 'application/json' }
        HEADER_XML = { :'Content-Type' => 'application/xml' }

        # CONSTRUCTORS
        def initialize(host_id)
            client = OpenNebula::Client.new
            host = OpenNebula::Host.new_with_id(host_id, client)
            rc = host.info

            if OpenNebula.is_error?(rc)
                raise "Could not get host info for ID: \
                        #{host_id} - #{rc.message}"
            end

            @nsxmgr = host['TEMPLATE/NSX_MANAGER']
            @nsx_user = host['TEMPLATE/NSX_USER']
            @nsx_password = nsx_pass(host['TEMPLATE/NSX_PASSWORD'])
        end

        def self.new_nsxmgr(nsxmgr, nsx_user, nsx_password)
            @nsxmgr = nsxmgr
            @nsx_user = nsx_user
            @nsx_password = nsx_pass(nsx_password)
        end

        # METHODS

        def check_response(response, code)
            response.code.to_i == code
        end

        def nsx_pass(nsx_pass_enc)
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

        def get_xml(url)
            uri = URI.parse(url)
            request = Net::HTTP::Get.new(uri.request_uri, HEADER_XML)
            request.basic_auth(@nsx_user, @nsx_password)
            response = Net::HTTP.start(uri.host, uri.port, :use_ssl => true,
              :verify_mode => OpenSSL::SSL::VERIFY_NONE) do |https|
                  https.request(request)
              end
            return Nokogiri::XML response.body if check_response(response, 200)
        end

        # Return: id of the created object
        def post_xml(url, ls_data)
            uri = URI.parse(url)
            request = Net::HTTP::Post.new(uri.request_uri, HEADER_XML)
            request.body = ls_data
            request.basic_auth(@nsx_user, @nsx_password)
            response = Net::HTTP.start(uri.host, uri.port, :use_ssl => true,
              :verify_mode => OpenSSL::SSL::VERIFY_NONE) do |https|
                  https.request(request)
              end
            return response.body if check_response(response, 201)
        end

        def get_json(url)
            uri = URI.parse(url)
            request = Net::HTTP::Get.new(uri.request_uri, HEADER_JSON)
            request.basic_auth(@nsx_user, @nsx_password)
            response = Net::HTTP.start(uri.host, uri.port, :use_ssl => true,
              :verify_mode => OpenSSL::SSL::VERIFY_NONE) do |https|
                  https.request(request)
              end
            return JSON.parse(response.body) \
                if check_response(response, 200)
        end

        # Return: id of the created object
        def post_json(url, ls_data)
            uri = URI.parse(url)
            request = Net::HTTP::Post.new(uri.request_uri, HEADER_JSON)
            request.body = ls_data
            request.basic_auth(@nsx_user, @nsx_password)
            response = Net::HTTP.start(uri.host, uri.port, :use_ssl => true,
              :verify_mode => OpenSSL::SSL::VERIFY_NONE) do |https|
                  https.request(request)
              end
            return JSON.parse(response.body)['id'] \
                if check_response(response, 201)
        end

        def delete(url, header)
            uri = URI.parse(url)
            request = Net::HTTP::Delete.new(uri.request_uri, header)
            request.basic_auth(@nsx_user, @nsx_password)
            response = Net::HTTP.start(uri.host, uri.port, :use_ssl => true,
              :verify_mode => OpenSSL::SSL::VERIFY_NONE) do |https|
                  https.request(request)
              end
            check_response(response, 200)
        end

    end

end
