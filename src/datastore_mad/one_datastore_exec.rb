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

require 'DriverExecHelper'

#####
#  TODO COMMENTS
####
# This module provides an abstraction to generate an execution context for
# datastore operations
class DatastoreExecDriver

    include DriverExecHelper

    # Inits the driver
    def initialize
        initialize_helper('datastore', {})

        @drivers = Dir["#{@local_scripts_path}/*/"].map do |d|
            d.split('/')[-1]
        end
    end

    #####
    #  TODO COMMENTS
    ####
    def do_datastore_action(id, command, stdin = nil)
        cmd  = command[0].downcase
        ds   = command[1]
        args = command[2..-1].map {|e| Shellwords.escape(e) }.join(' ')

        if !@drivers.include?(ds)
            return RESULT[:failure], "Datastore Driver '#{ds}' not available"
        end

        path = File.join(@local_scripts_path, ds, cmd)

        rc = LocalCommand.run("#{path} #{args}", log_method(id), stdin)

        result, info = get_info_from_execution(rc)

        [result, info]
    end

end
