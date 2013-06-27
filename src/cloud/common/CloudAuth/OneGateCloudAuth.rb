# -------------------------------------------------------------------------- #
# Copyright 2002-2013, OpenNebula Project (OpenNebula.org), C12G Labs        #
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

require 'openssl'
require 'base64'

module OneGateCloudAuth
    CIPHER = "aes-256-cbc"

    #
    #  Do custom initializations for the module
    #
    def initialize_auth
        @conf[:use_user_pool_cache] = false
        @cipher = OpenSSL::Cipher::Cipher.new(CIPHER)
    end

    def do_auth(env, params={})
        token = env['HTTP_X_ONEGATE_TOKEN']
        if token.nil?
                STDERR.puts "token"
            return nil
        else
            vm = VirtualMachine.new_with_id(params[:id], client)
            rc = vm.info
            if OpenNebula.is_error?(rc)
                STDERR.puts "vm info"
                # TODO Add log message
                return nil
            end

            user_id = vm['TEMPLATE/CREATED_BY']
            if user_id.nil?
                # TODO Add log message
                STDERR.puts "CREATED_BY"
                return nil
            end

            user = User.new_with_id(user_id, client)
            rc = user.info
            if OpenNebula.is_error?(rc)
                STDERR.puts "user info"
                # TODO Add log message
                return nil
            end

            token_password = user['TEMPLATE/TOKEN_PASSWORD']
            if token_password.nil?
                STDERR.puts "token password nil"
                # TODO Add log message
                return nil
            end

            begin
                decrypted_token = decrypt(token_password, token)
                token_vm_id, token_vm_stime = decrypted_token.split(':')

                if (token_vm_id.nil? || (token_vm_id != vm['ID']) ||
                    token_vm_stime.nil? || (token_vm_stime != vm['STIME']))
                    STDERR.puts "token content check"
                    return nil
                end
            rescue => e
                STDERR.puts e.message
                # TODO Add log message
                return nil
            end


            return vm['UNAME']
        end
    end

    private

    def encrypt(data)
        @cipher.encrypt
        @cipher.key = @key

        rc = @cipher.update(data)
        rc << @cipher.final

        return rc
    end

    def decrypt(token_password, data)
        @cipher.decrypt
        @cipher.key = token_password

        rc = @cipher.update(Base64::decode64(data))
        rc << @cipher.final

        return rc
    end
end