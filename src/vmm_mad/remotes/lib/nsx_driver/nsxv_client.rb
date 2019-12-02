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
    class NSXVClient < NSXDriver::NSXClient

        # ATTIBUTES
        attr_accessor :nsxmgr
        attr_accessor :nsx_user
        attr_accessor :nsx_password
        attr_accessor :nsx_type

        # CONSTRUCTORS
        def initialize(nsxmgr, nsx_user, nsx_password)
            super(nsxmgr, nsx_user, nsx_password)
            @nsx_type = NSXDriver::NSXConstants::NSXV
        end

        # METHODS
        def get(url)
            uri = URI.parse(@nsxmgr + url)
            request = Net::HTTP::Get.new(uri.request_uri,
                                         NSXDriver::NSXConstants::HEADER_XML)
            request.basic_auth(@nsx_user, @nsx_password)
            begin
                response = Net::HTTP
                           .start(uri.host,
                                  uri.port,
                                  :use_ssl => true,
                                  :verify_mode => OpenSSL::SSL::VERIFY_NONE)\
                                  do |https|
                                      https.request(request)
                                  end
            rescue StandardError => e
                raise e
            end
            return Nokogiri::XML response.body \
                if check_response(response, [NSXDriver::NSXConstants::CODE_OK])
        end

        def get_full_response(url)
            uri = URI.parse(@nsxmgr + url)
            request = Net::HTTP::Get.new(uri.request_uri,
                                         NSXDriver::NSXConstants::HEADER_XML)
            request.basic_auth(@nsx_user, @nsx_password)
            begin
                response = Net::HTTP
                           .start(uri.host,
                                  uri.port,
                                  :use_ssl => true,
                                  :verify_mode => OpenSSL::SSL::VERIFY_NONE)\
                                  do |https|
                                      https.request(request)
                                  end
            rescue StandardError => e
                raise e
            end
            return response \
                if check_response(response, [NSXDriver::NSXConstants::CODE_OK])
        end

        # Return: id of the created object
        def post(url, data)
            uri = URI.parse(@nsxmgr + url)
            request = Net::HTTP::Post.new(uri.request_uri,
                                          NSXDriver::NSXConstants::HEADER_XML)
            request.body = data
            request.basic_auth(@nsx_user, @nsx_password)
            response = Net::HTTP.start(uri.host, uri.port, :use_ssl => true,
              :verify_mode => OpenSSL::SSL::VERIFY_NONE) do |https|
                  https.request(request)
              end

            # If response is different as expected raise the message
            unless check_response(response,
                                  [NSXDriver::NSXConstants::CODE_CREATED,
                                   NSXDriver::NSXConstants::CODE_OK])
                response_json = JSON.parse(response.body)
                nsx_error = "\nNSX error code: " \
                            "#{response_json['errorCode']}, " \
                            "\nNSX error details: " \
                            "#{response_json['details']}"
                raise NSXDriver::NSXError::IncorrectResponseCodeError, \
                      nsx_error
            end

            response.body
        end

        def put(url, data)
            uri = URI.parse(@nsxmgr + url)
            request = Net::HTTP::Put.new(uri.request_uri,
                                         NSXDriver::NSXConstants::HEADER_XML)
            request.body = data
            request.basic_auth(@nsx_user, @nsx_password)
            response = Net::HTTP.start(uri.host, uri.port, :use_ssl => true,
              :verify_mode => OpenSSL::SSL::VERIFY_NONE) do |https|
                  https.request(request)
              end

            # If response is different as expected raise the message
            unless check_response(response,
                                  [NSXDriver::NSXConstants::CODE_CREATED])
                response_json = JSON.parse(response.body)
                nsx_error = "\nNSX error code: " \
                            "#{response_json['errorCode']}, " \
                            "\nNSX error details: " \
                            "#{response_json['details']}"
                raise NSXDriver::NSXError::IncorrectResponseCodeError, \
                      nsx_error
            end

            response.body
        end

        def delete(url)
            uri = URI.parse(@nsxmgr + url)
            request = Net::HTTP::Delete.new(uri.request_uri,
                                            NSXDriver::NSXConstants::HEADER_XML)
            request.basic_auth(@nsx_user, @nsx_password)
            response = Net::HTTP.start(uri.host, uri.port, :use_ssl => true,
              :verify_mode => OpenSSL::SSL::VERIFY_NONE) do |https|
                  https.request(request)
              end
            check_response(response, [NSXDriver::NSXConstants::CODE_OK])
        end

        def get_token(url)
            uri = URI.parse(@nsxmgr + url)
            request = Net::HTTP::Post.new(uri.request_uri,
                                          NSXDriver::NSXConstants::HEADER_XML)
            request.basic_auth(@nsx_user, @nsx_password)
            response = Net::HTTP.start(uri.host, uri.port, :use_ssl => true,
              :verify_mode => OpenSSL::SSL::VERIFY_NONE) do |https|
                  https.request(request)
              end

            return unless check_response(response,
                                         [NSXDriver::NSXConstants::CODE_OK])

            response_xml = Nokogiri::XML response.body
            token = response_xml.xpath('//authToken/value').text
            { 'token' => token }.to_json
        end

    end

end
