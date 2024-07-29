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

# rubocop: disable all
# %%RUBYGEMS_SETUP_BEGIN%%
if File.directory?(GEMS_LOCATION)
    real_gems_path = File.realpath(GEMS_LOCATION)
    if !defined?(Gem) || Gem.path != [real_gems_path]
        $LOAD_PATH.reject! {|l| l =~ /vendor_ruby/ }

        # Suppress warnings from Rubygems
        # https://github.com/OpenNebula/one/issues/5379
        begin
            verb = $VERBOSE
            $VERBOSE = nil
            require 'rubygems'
            Gem.use_paths(real_gems_path)
        ensure
            $VERBOSE = verb
        end
    end
end
# %%RUBYGEMS_SETUP_END%%
# rubocop: enable all

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
            [nsxmgr, nsx_user, nsx_password, type].each do |v|
                next if !v.nil? && !v.empty?

                return nil
            end

            case type.upcase
            when NSXConstants::NSXT
                NSXTClient.new(nsxmgr, nsx_user, nsx_password)
            when NSXConstants::NSXV
                NSXVClient.new(nsxmgr, nsx_user, nsx_password)
            else
                error_msg = "Unknown NSX type: #{type}"
                error     = NSXError::UnknownObject.new(error_msg)
                raise error
            end
        end

        def self.new_from_host(host)
            nsxmgr = host['TEMPLATE/NSX_MANAGER']
            nsx_user = host['TEMPLATE/NSX_USER']
            nsx_password = host['TEMPLATE/NSX_PASSWORD']
            nsx_type = host['TEMPLATE/NSX_TYPE']

            new_child(nsxmgr, nsx_user, nsx_password, nsx_type)
        end

        def self.new_from_id(hid)
            client = OpenNebula::Client.new
            host   = OpenNebula::Host.new_with_id(hid, client)

            rc = host.info(true)

            if OpenNebula.is_error?(rc)
                raise "Could not get host info for ID: #{hid} - #{rc.message}"
            end

            new_from_host(host)
        end

        # METHODS

        # Return response if match with responses codes, If response not match
        # with expected responses codes then raise an IncorrectResponseCodeError
        def check_response(response, codes_array)
            unless response.nil?
                return response if codes_array.include?(response.code.to_i)

                response_json = JSON.parse(response.body)
                nsx_error = "\nNSX error code: " \
                            "#{response_json['errorCode']}, " \
                            "\nNSX error details: " \
                            "#{response_json['details']}"
                raise NSXError::IncorrectResponseCodeError, nsx_error
            end
            raise NSXError::IncorrectResponseCodeError, nsx_error
        end

        # Return: respose.body
        def get(url, aditional_headers = []); end

        # Return: response
        def get_full_response(url, aditional_headers = []); end

        # Return: id of the created object
        def post(url, data, aditional_headers = []); end

        def put(url, data, aditional_headers = []); end

        def delete(url); end

        def get_token(url); end

        # Prepare headers
        def add_headers(aditional_headers = []); end

    end

end
