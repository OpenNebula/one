# -------------------------------------------------------------------------- #
# Copyright 2002-2015, OpenNebula Project (OpenNebula.org), C12G Labs        #
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

require 'json'
require 'openssl'
require 'digest/md5'
require 'net_ssh_replacement'

module Keypair
    ############################################################################
    # Extends the OpenNebula::User class to include Keypair management
    ############################################################################
    class ::OpenNebula::User

        EC2_KP_XPATH = '/USER/TEMPLATE/EC2_KEYPAIRS'
        EC2_KP_ELEM  = 'EC2_KEYPAIRS'

        ########################################################################
        #  Extracts a key pair for the user. Keypairs are stored in the user
        #  template as base64 json documents
        #    @param [OpenNebula::User] the user
        #
        #    @return [Hash] with the keypairs. It may be empty
        ########################################################################
        def add_keypair(keypairs)
            kp   = keypairs.to_json
            kp64 = Base64.encode64(kp)

            add_element('TEMPLATE', EC2_KP_ELEM => kp64)

            return update(template_xml)
        end

        ########################################################################
        #  Extracts a key pair for the user. Keypairs are stored in the user
        #  template as base64 json documents
        #    @param [OpenNebula::User] the user
        #
        #    @return [Hash] with the keypairs. It may be empty
        ########################################################################
        def get_keypair
            if has_elements?(EC2_KP_XPATH)
                kp64 = Base64.decode64(self[EC2_KP_XPATH])
                kp   = JSON.parse(kp64)
            else
                kp = Hash.new
            end

            return kp
        end
    end

    ############################################################################
    # KeyPair managment functions for EC2 Query API Server
    ############################################################################

    ############################################################################
    #
    ############################################################################
    def create_keypair(params)
        erb_version   = params['Version']
        erb_keyname   = params['KeyName']
        erb_user_name = params['AWSAccessKeyId']

        user = User.new_with_id(OpenNebula::User::SELF, @client)
        user.info

        begin
            kp     = user.get_keypair
            rsa_kp = OpenSSL::PKey::RSA.generate(2048)
        rescue Exception => e
           return OpenNebula::Error.new("Error in create_keypair: #{e.message}")
        end

        erb_private_key = rsa_kp
        erb_public_key  = rsa_kp.public_key

        erb_key_fingerprint = Digest::MD5.hexdigest(rsa_kp.to_blob)
        erb_key_fingerprint.gsub!(/(.{2})(?=.)/, '\1:\2')

        erb_ssh_public_key  = erb_public_key.ssh_type <<
                              " " <<
                              [ erb_public_key.to_blob ].pack('m0').gsub(/\n/, '') <<
                              " " <<
                              erb_keyname
        kp[erb_keyname] = {
            "fingerprint" => erb_key_fingerprint,
            "public_key"  => erb_ssh_public_key
        }

        rc = user.add_keypair(kp)

        return rc if OpenNebula::is_error?(rc)

        response = ERB.new(File.read(@config[:views]+"/create_keypair.erb"))
        return response.result(binding), 200
    end

    ############################################################################
    #
    ############################################################################
    def describe_keypairs(params)
        erb_version   = params['Version']
        erb_user_name = params['AWSAccessKeyId']

        user = User.new_with_id(OpenNebula::User::SELF, @client)
        user.info

        erb_keypairs = user.get_keypair

        response = ERB.new(File.read(@config[:views]+"/describe_keypairs.erb"))
        return response.result(binding), 200
    end

    ############################################################################
    #
    ############################################################################
    def delete_keypair(params)
        erb_version   = params['Version']
        erb_user_name = params['AWSAccessKeyId']
        erb_key_name  = params['KeyName']
        erb_result    = "false"

        vmpool = VirtualMachinePool.new(@client, OpenNebula::Pool::INFO_ALL)
        vmpool.info

        if !vmpool["/VM_POOL/VM/TEMPLATE/CONTEXT[EC2_KEYNAME=\'#{erb_key_name}\']"]
            user = User.new_with_id(OpenNebula::User::SELF, @client)
            user.info

            kp = user.get_keypair

            if kp.has_key?(erb_key_name)
                kp.delete(erb_key_name)
                rc = user.add_keypair(kp)

                erb_result = "true" if !OpenNebula::is_error?(rc)
            end
        end

        response = ERB.new(File.read(@config[:views]+"/delete_keypair.erb"))
        return response.result(binding), 200
    end

    ############################################################################
    #
    ############################################################################
    def fetch_publickey(params)
        keyname = params['KeyName']

        user = User.new_with_id(OpenNebula::User::SELF, @client)
        user.info

        kp = user.get_keypair

        return nil if keyname.nil? || kp.empty? || kp[keyname].nil?

        kp[keyname]['public_key']
    end
end
