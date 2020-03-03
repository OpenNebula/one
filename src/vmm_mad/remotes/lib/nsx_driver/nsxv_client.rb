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

    # Class NSXVClient
    class NSXVClient < NSXClient

        # ATTIBUTES
        attr_accessor :nsxmgr
        attr_accessor :nsx_user
        attr_accessor :nsx_password
        attr_accessor :nsx_type

        # CONSTRUCTORS
        def initialize(nsxmgr, nsx_user, nsx_password)
            super(nsxmgr, nsx_user, nsx_password)
            @nsx_type = NSXConstants::NSXV
        end

        # Prepare headers
        def add_headers(aditional_headers = [])
            headers = NSXConstants::HEADER_XML.clone
            unless aditional_headers.empty?
                aditional_headers.each do |header|
                    headers[header.keys[0]] = header.values[0]
                end
            end
            headers
        end

        # METHODS
        def get(url, aditional_headers = [], valid_codes = [])
            if valid_codes.empty?
                valid_codes = [NSXConstants::CODE_OK,
                               NSXConstants::CODE_NO_CONTENT]
            end
            uri = URI.parse(@nsxmgr + url)
            headers = add_headers(aditional_headers)
            request = Net::HTTP::Get.new(uri.request_uri, headers)
            request.basic_auth(@nsx_user, @nsx_password)
            response = Net::HTTP.start(uri.host, uri.port, :use_ssl => true,
                :verify_mode => OpenSSL::SSL::VERIFY_NONE) do |https|
                    https.request(request)
                end
            response = check_response(response, valid_codes)
            Nokogiri::XML response.body
        end

        def get_full_response(url, aditional_headers = [], valid_codes = [])
            if valid_codes.empty?
                valid_codes = [NSXConstants::CODE_OK,
                               NSXConstants::CODE_NO_CONTENT]
            end
            uri = URI.parse(@nsxmgr + url)
            headers = add_headers(aditional_headers)
            request = Net::HTTP::Get.new(uri.request_uri, headers)
            request.basic_auth(@nsx_user, @nsx_password)
            response = Net::HTTP.start(uri.host, uri.port, :use_ssl => true,
                :verify_mode => OpenSSL::SSL::VERIFY_NONE) do |https|
                    https.request(request)
                end
            response = check_response(response, valid_codes)
            response
        end

        # Return: id of the created object
        def post(url, data, aditional_headers = [], valid_codes = [])
            if valid_codes.empty?
                valid_codes = [NSXConstants::CODE_CREATED,
                               NSXConstants::CODE_OK]
            end
            uri = URI.parse(@nsxmgr + url)
            headers = add_headers(aditional_headers)
            request = Net::HTTP::Post.new(uri.request_uri, headers)
            request.body = data
            request.basic_auth(@nsx_user, @nsx_password)
            response = Net::HTTP.start(uri.host, uri.port, :use_ssl => true,
                :verify_mode => OpenSSL::SSL::VERIFY_NONE) do |https|
                    https.request(request)
                end
            response = check_response(response, valid_codes)
            response.body
        end

        def put(url, data, aditional_headers = [], valid_codes = [])
            if valid_codes.empty?
                valid_codes = [NSXConstants::CODE_CREATED,
                               NSXConstants::CODE_OK]
            end
            uri = URI.parse(@nsxmgr + url)
            headers = add_headers(aditional_headers)
            request = Net::HTTP::Put.new(uri.request_uri, headers)
            request.body = data
            request.basic_auth(@nsx_user, @nsx_password)
            response = Net::HTTP.start(uri.host, uri.port, :use_ssl => true,
                :verify_mode => OpenSSL::SSL::VERIFY_NONE) do |https|
                    https.request(request)
                end
            response = check_response(response, valid_codes)
            response.body
        end

        def delete(url, aditional_headers = [], valid_codes = [])
            if valid_codes.empty?
                valid_codes = [NSXConstants::CODE_OK,
                               NSXConstants::CODE_NO_CONTENT]
            end
            uri = URI.parse(@nsxmgr + url)
            headers = add_headers(aditional_headers)
            request = Net::HTTP::Delete.new(uri.request_uri, headers)
            request.basic_auth(@nsx_user, @nsx_password)
            response = Net::HTTP.start(uri.host, uri.port, :use_ssl => true,
                :verify_mode => OpenSSL::SSL::VERIFY_NONE) do |https|
                    https.request(request)
                end
            response = check_response(response, valid_codes)
            response
        end

        def get_token(url, aditional_headers = [], valid_codes = [])
            if valid_codes.empty?
                valid_codes = [NSXConstants::CODE_OK]
            end
            uri = URI.parse(@nsxmgr + url)
            headers = add_headers(aditional_headers)
            request = Net::HTTP::Post.new(uri.request_uri, headers)
            request.basic_auth(@nsx_user, @nsx_password)
            response = Net::HTTP.start(uri.host, uri.port, :use_ssl => true,
                :verify_mode => OpenSSL::SSL::VERIFY_NONE) do |https|
                    https.request(request)
                end
            response = check_response(response, valid_codes)
            response_xml = Nokogiri::XML response.body
            token = response_xml.xpath('//authToken/value').text
            { 'token' => token }.to_json
        end

    end

end
