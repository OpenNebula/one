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

module OneFormServer

    # Error Controller
    module ErrorController

        def self.registered(app)
            app.error 500 do
                if env['sinatra.error']
                    e = env['sinatra.error']

                    error_msg = 'Internal server error'
                    reason    = e.message
                    backtrace = e.backtrace.join('\n') \
                        if settings.config[:log][:level] == 'debug'

                    context = {
                        'reason'    => reason,
                        'backtrace' => backtrace
                    }.compact

                    internal_error(error_msg, 500, context)
                end
            end
        end

    end

end
