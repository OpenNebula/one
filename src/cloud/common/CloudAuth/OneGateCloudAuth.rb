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

require 'openssl'
require 'base64'

module OneGateCloudAuth
    CIPHER = "aes-256-cbc"

    #
    #  Do custom initializations for the module
    #
    def initialize_auth
        @conf[:use_user_pool_cache] = false
    end

    def do_auth(env, params={})
        token = env['HTTP_X_ONEGATE_TOKEN']
        vmid  = env['HTTP_X_ONEGATE_VMID'] || params[:id] # DEPRECATED

        if token.nil?
            logger.error {"X_ONEGATE_TOKEN header not preset"}
            return nil
        elsif vmid.nil?
            logger.error {"X_ONEGATE_VMID header not preset"}
            return nil
        else
            vm = VirtualMachine.new_with_id(vmid, client)
            rc = vm.info

            if OpenNebula.is_error?(rc)
                logger.error {"VMID:#{vmid} vm.info" \
                    " error: #{rc.message}"}
                return nil
            end

            user_id = vm['TEMPLATE/CREATED_BY']

            if user_id.nil?
                logger.error {"VMID:#{vmid} CREATED_BY not present" \
                    " in the VM TEMPLATE"}
                return nil
            end

            user = User.new_with_id(user_id, client)
            rc   = user.info

            if OpenNebula.is_error?(rc)
                logger.error {"VMID:#{vmid} user.info" \
                    " error: #{rc.message}"}
                return nil
            end

            token_password = user['TEMPLATE/TOKEN_PASSWORD']

            if token_password.nil?
                logger.error {"VMID:#{vmid} TOKEN_PASSWORD not present"\
                    " in the USER:#{user_id} TEMPLATE"}
                return nil
            end

            begin
                decrypted_token = decrypt(token_password, token)
                token_vm_id, token_vm_stime = decrypted_token.split(':')

                if (token_vm_id.nil? || (token_vm_id != vm['ID']) ||
                    token_vm_stime.nil? || (token_vm_stime != vm['STIME']))
                    logger.error {"VMID:#{vmid} token content does not" \
                        " match"}
                    return nil
                end
            rescue => e
                logger.error {"VMID:#{vmid} token decrypt error:" \
                    " #{e.message}"}
                return nil
            end

            return vm['UNAME']
        end
    end

    private

    def encrypt(data, token_password)
        cipher = OpenSSL::Cipher.new(CIPHER)

        cipher.encrypt
        cipher.key = token_password

        rc = cipher.update(data)
        rc << cipher.final

        return rc
    end

    def decrypt(token_password, data)
        cipher = OpenSSL::Cipher.new(CIPHER)

        cipher.decrypt
        cipher.key = token_password[0..31]

        rc = cipher.update(Base64::decode64(data))
        rc << cipher.final

        return rc
    end
end
