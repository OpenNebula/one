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

    # Class NSXTClient
    class NSXTClient < NSXDriver::NSXClient

        # ATTIBUTES
        attr_accessor :nsxmgr
        attr_accessor :nsx_user
        attr_accessor :nsx_password
        attr_accessor :nsx_type

        # CONSTRUCTORS
        def initialize(nsxmgr, nsx_user, nsx_password)
            super(nsxmgr, nsx_user, nsx_password)
            @nsx_type = NSXDriver::NSXConstants::NSXT
        end

        # METHODS
        def get(url)
            uri = URI.parse(@nsxmgr + url)
            request = Net::HTTP::Get.new(uri.request_uri,
                                         NSXDriver::NSXConstants::HEADER_JSON)
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
            return JSON.parse(response.body) \
                if check_response(response, [NSXDriver::NSXConstants::CODE_OK])
        end

        def get_full_response(url)
            uri = URI.parse(@nsxmgr + url)
            request = Net::HTTP::Get.new(uri.request_uri,
                                         NSXDriver::NSXConstants::HEADER_JSON)
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
                                          NSXDriver::NSXConstants::HEADER_JSON)
            request.body = data
            request.basic_auth(@nsx_user, @nsx_password)
            response = Net::HTTP.start(uri.host, uri.port, :use_ssl => true,
              :verify_mode => OpenSSL::SSL::VERIFY_NONE) do |https|
                  https.request(request)
              end

            response_json = JSON.parse(response.body)
            # If response is different as expected raise the message
            unless check_response(response,
                                  [NSXDriver::NSXConstants::CODE_CREATED])
                error_msg = "\nNSX error code: " \
                            "#{response_json['errorCode']}, " \
                            "\nNSX error details: " \
                            "#{response_json['details']}"
                error = NSXDriver::NSXError::IncorrectResponseCodeError
                        .new(error_msg)
                raise error
            end

            response_json['id']
        end

        def put(url, data)
            uri = URI.parse(@nsxmgr + url)
            request = Net::HTTP::Put.new(uri.request_uri,
                                         NSXDriver::NSXConstants::HEADER_JSON)
            request.body = data
            request.basic_auth(@nsx_user, @nsx_password)
            response = Net::HTTP.start(uri.host, uri.port, :use_ssl => true,
              :verify_mode => OpenSSL::SSL::VERIFY_NONE) do |https|
                  https.request(request)
              end

            response_json = JSON.parse(response.body)
            # If response is different as expected raise the message
            unless check_response(response,
                                  [NSXDriver::NSXConstants::CODE_CREATED])
                error_msg = "\nNSX error code: " \
                            "#{response_json['errorCode']}, " \
                            "\nNSX error details: " \
                            "#{response_json['details']}"
                error = NSXDriver::NSXError::IncorrectResponseCodeError
                        .new(error_msg)
                raise error
            end

            response_json['id']
        end

        def delete(url)
            uri = URI.parse(@nsxmgr + url)
            request = Net::HTTP::Delete
                      .new(uri.request_uri,
                           NSXDriver::NSXConstants::HEADER_JSON)
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
                                          NSXDriver::NSXConstants::HEADER_JSON)
            request.basic_auth(@nsx_user, @nsx_password)
            response = Net::HTTP.start(uri.host, uri.port, :use_ssl => true,
              :verify_mode => OpenSSL::SSL::VERIFY_NONE) do |https|
                  https.request(request)
              end

            return unless check_response(response,
                                         [NSXDriver::NSXConstants::CODE_OK])

            response.body
        end

    end

end
