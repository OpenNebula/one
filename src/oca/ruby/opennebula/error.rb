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
    # The Error Class represents a generic error in the OpenNebula
    # library. It contains a readable representation of the error.
    # Any function in the OpenNebula module will return an Error
    # object in case of error.
    class Error
        ESUCCESS        = 0x0000
        EAUTHENTICATION = 0x0100
        EAUTHORIZATION  = 0x0200
        ENO_EXISTS      = 0x0400
        EACTION         = 0x0800
        EXML_RPC_API    = 0x1000
        EINTERNAL       = 0x2000
        EALLOCATE       = 0x4000
        ENOTDEFINED     = 0xF001
        EXML_RPC_CALL   = 0xF002

        attr_reader :message, :errno


        # +message+ Description of the error
        # +errno+   OpenNebula code error
        def initialize(message=nil, errno=0x1111)
            @message = message
            @errno   = errno
        end

        def to_str()
            @message
        end

        alias inspect to_str

        def is_exml_rpc_call?()
            @errno == EXML_RPC_CALL
        end

    end

    # Returns true if the object returned by a method of the OpenNebula
    # library is an Error
    def self.is_error?(value)
        value.class==OpenNebula::Error
    end

end
