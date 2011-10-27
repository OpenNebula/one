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

require 'OpenNebulaJSON'

require 'OZones/Zones'
require 'OZones/VDC'
require 'OZones/ProxyRules'
require 'OZones/ApacheWritter'
require 'OZones/AggregatedPool'
require 'OZones/AggregatedHosts'
require 'OZones/AggregatedVirtualMachines'
require 'OZones/AggregatedVirtualNetworks'
require 'OZones/AggregatedImages'
require 'OZones/AggregatedUsers'
require 'OZones/AggregatedTemplates'

require 'openssl'
require 'digest/sha1'
require 'base64'

module OZones

    CIPHER="aes-256-cbc"
    # -------------------------------------------------------------------------
    # The Error Class represents a generic error in the OZones
    # library. It contains a readable representation of the error.
    # Any function in the OZones module will return an Error
    # object in case of error.
    # -------------------------------------------------------------------------
    class Error
        attr_reader :message

        # +message+ a description of the error
        def initialize(message=nil)
            @message=message
        end

        def to_str
            @message
        end

        def to_json
            message = { :message => @message }
            error_hash = { :error => message }

            return JSON.pretty_generate error_hash
        end
    end

    # -------------------------------------------------------------------------
    # Returns true if the object returned by a method of the OZones
    # library is an Error
    # -------------------------------------------------------------------------
    def self.is_error?(value)
        value.class==OZones::Error
    end

    def self.str_to_json(str)
        return JSON.pretty_generate({:message  => str})
    end

    def self.readKey
        begin
            credentials = IO.read(ENV['OZONES_AUTH']).strip
            return Digest::SHA1.hexdigest(credentials);
        rescue
            return "";
        end
    end

    def self.encrypt(plain_txt)
        #prepare cipher object
        cipher = OpenSSL::Cipher.new(CIPHER)
        cipher.encrypt
        cipher.key = OZones.readKey

        enc_txt = cipher.update(plain_txt)
        enc_txt << cipher.final

        Base64::encode64(enc_txt).strip.delete("\n")
    end

    def self.decrypt(b64_txt)
        #prepare cipher object
        cipher = OpenSSL::Cipher.new(CIPHER)
        cipher.decrypt
        cipher.key = OZones.readKey

        enc_txt = Base64::decode64(b64_txt)

        plain_txt = cipher.update(enc_txt)
        plain_txt << cipher.final
    end
end
