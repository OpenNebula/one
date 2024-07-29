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

module OpenNebula
    # we use this file to extend opennebula oca functionalities
    # It contains generic methods that can be used in oca context
    # to help other components

    # receive a object key => value format
    # returns hashed values
    def self.encrypt(opts, token)
        res = {}
        opts.each do |key, value|
            cipher = OpenSSL::Cipher::AES.new(256,:CBC)
            cipher.encrypt.key = token[0..31]
            encrypted = cipher.update(value) + cipher.final
            res[key] = Base64::encode64(encrypted).gsub("\n", "")
        end
        return res
    end

    # receive hashed values (res) with a token
    # returns original values
    def self.decrypt(res, token)
        opts = {}

        res.each do |key, encrypted_value|
            decipher = OpenSSL::Cipher::AES.new(256,:CBC)
            decipher.decrypt
            decipher.key = token[0..31]
            plain = decipher.update(Base64::decode64(encrypted_value)) + decipher.final
            opts[key] = plain
        end
        return opts
    end

    # >> /var/log/one/oned.log
    def self.handle_driver_exception(action, ex, host, did = nil, id = nil, file = nil)

        file    ||= ""
        id      ||= ""
        did     ||= ""
        OpenNebula::log_error(action + " of VM #{id} #{did} on host #{host} #{file} "+
                    "due to \"#{ex.message}\"" +
                    "\n********* STACK TRACE *********\n" +
                    "\t#{ex.backtrace.join("\n\t")}" +
                    "\n*******************************\n")

        OpenNebula.error_message("There is a problem: #{ex.message}")
        exit (-1)
    end




end
