# -------------------------------------------------------------------------- #
# Copyright 2002-2025, OpenNebula Project, OpenNebula Systems                #
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

# Response handler
module ResponseHelper

    #----------------------------------------------------------------------------
    # Error response processing
    #----------------------------------------------------------------------------

    VALIDATION_EC = 400 # bad request by the client
    OPERATION_EC  = 405 # operation not allowed (e.g: in current state)
    GENERAL_EC    = 500 # general error

    # Set status error and return the error msg
    #
    # @param error_msg  [String]  Error message
    # @param error_code [Integer] Http error code
    def internal_error(error, error_code, context = {})
        # error can be an string or an hash with msg and context
        error_msg     = error.is_a?(Hash) ? error['message'] : error
        error_context = error.is_a?(Hash) ? error['context'].merge(context) : context

        # Log the error in the log file
        debug_level = settings.config[:log][:level]

        log_msg  = "Error code #{error_code}: #{error_msg}"
        log_msg += ", context: #{error_context}" if debug_level == 'debug'

        Log.error log_msg

        # Prepare an error response to the client
        # It also cleans the message in case it contains xmlrpc methods
        msg = error_msg.is_a?(Exception) ? error_msg.message : error_msg.to_s

        response = {
            'err_code' => error_code,
            'message'  => msg.gsub(/\[one\.[^\]]+\]\s*|\[(\d+)\]/, '\1').sub(/\.$/, '')
        }

        # Context can contain additional information about the error
        # like objects information or backtraces
        response['context'] = error_context unless error_context.empty?

        status error_code
        body process_response(response)
    end

    # Get HTTP error code based on OpenNebula eror code
    #
    # @param error [Integer] OpenNebula error code
    def one_error_to_http(error)
        case error
        when OpenNebula::Error::ESUCCESS
            200  # Success
        when OpenNebula::Error::ENOTDEFINED, VALIDATION_EC
            400  # Bad Request (undefined parameter)
        when OpenNebula::Error::EAUTHORIZATION
            401  # Unauthorized
        when OpenNebula::Error::EAUTHENTICATION
            403  # Forbidden
        when OpenNebula::Error::ENO_EXISTS
            404  # Not Found
        when OpenNebula::Error::EACTION, OPERATION_EC
            405  # Method Not Allowed (invalid action)
        when OpenNebula::Error::ERPC_API, OpenNebula::Error::EXML_RPC_CALL
            502  # Bad Gateway (XML-RPC API failure)
        when OpenNebula::Error::EINTERNAL
            500  # Internal Server Error
        when OpenNebula::Error::EALLOCATE
            507  # Resource allocation failed
        else
            500  # Default: Internal Server Error
        end
    end

    # --------------------------------------------------------------------------
    # Response processing
    # --------------------------------------------------------------------------
    def process_response(response)
        content_type = request.env['CONTENT_TYPE'] || 'application/json'

        case content_type
        when 'application/json'
            content_type(:json)
            response.to_json
        else
            content_type(:text)
            response.to_s
        end
    rescue StandardError => e
        internal_error("Error processing response: #{e.message}", GENERAL_EC)
    end

end
