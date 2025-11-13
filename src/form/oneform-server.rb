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

require_relative 'config/environment'

module OneFormServer

    # OneForm Server
    class FormServer < Sinatra::Base

        conf = ConfigLoader.instance.conf

        # Sinatra configuration
        set :bind, conf[:host]
        set :port, conf[:port]
        set :config, conf
        set :dump_errors, true
        set :raise_errors, false
        set :show_exceptions, false

        LogConfig.configure_sinatra_logger(self, conf)
        Log.info 'Starting server'

        register AppRoutes

        run! if app_file == $PROGRAM_NAME

    end

end
