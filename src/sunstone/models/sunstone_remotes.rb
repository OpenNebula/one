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

require 'rubygems'
require 'json'
require 'opennebula'

# The following states are the ones where
# the remote connections are allowed.
ALLOWED_CONSOLE_STATES = [
    # '0',  # LCM_INIT
    # '1',  # PROLOG
    # '2',  # BOOT
    '3',  # RUNNING
    '4',  # MIGRATE
    # '5',  # SAVE_STOP
    # '6',  # SAVE_SUSPEND
    # '7',  # SAVE_MIGRATE
    # '8',  # PROLOG_MIGRATE
    # '9',  # PROLOG_RESUME
    # '10', # EPILOG_STOP
    # '11', # EPILOG
    '12', # SHUTDOWN
    '13', # CANCEL
    # '14', # FAILURE
    # '15', # CLEANUP_RESUBMIT
    '16', # UNKNOWN
    '17', # HOTPLUG
    '18', # SHUTDOWN_POWEROFF
    # '19', # BOOT_UNKNOWN
    # '20', # BOOT_POWEROFF
    # '21', # BOOT_SUSPENDED
    # '22', # BOOT_STOPPED
    # '23', # CLEANUP_DELETE
    '24', # HOTPLUG_SNAPSHOT
    '25', # HOTPLUG_NIC
    '26', # HOTPLUG_SAVEAS
    '27', # HOTPLUG_SAVEAS_POWEROFF
    '28', # HOTPLUG_SAVEAS_SUSPENDED
    '29', # SHUTDOWN_UNDEPLOY
    # '30', # EPILOG_UNDEPLOY
    # '31', # PROLOG_UNDEPLOY
    # '32', # BOOT_UNDEPLOY
    # '33', # HOTPLUG_PROLOG_POWEROFF
    # '34', # HOTPLUG_EPILOG_POWEROFF
    # '35', # BOOT_MIGRATE
    # '36', # BOOT_FAILURE
    # '37', # BOOT_MIGRATE_FAILURE
    # '38', # PROLOG_MIGRATE_FAILURE
    # '39', # PROLOG_FAILURE
    # '40', # EPILOG_FAILURE
    # '41', # EPILOG_STOP_FAILURE
    # '42', # EPILOG_UNDEPLOY_FAILURE
    # '43', # PROLOG_MIGRATE_POWEROFF
    # '44', # PROLOG_MIGRATE_POWEROFF_FAILURE
    # '45', # PROLOG_MIGRATE_SUSPEND
    # '46', # PROLOG_MIGRATE_SUSPEND_FAILURE
    # '47', # BOOT_UNDEPLOY_FAILURE
    # '48', # BOOT_STOPPED_FAILURE
    # '49', # PROLOG_RESUME_FAILURE
    # '50', # PROLOG_UNDEPLOY_FAILURE
    # '51', # DISK_SNAPSHOT_POWEROFF
    # '52', # DISK_SNAPSHOT_REVERT_POWEROFF
    # '53', # DISK_SNAPSHOT_DELETE_POWEROFF
    # '54', # DISK_SNAPSHOT_SUSPENDED
    # '55', # DISK_SNAPSHOT_REVERT_SUSPENDED
    # '56', # DISK_SNAPSHOT_DELETE_SUSPENDED
    '57', # DISK_SNAPSHOT
    '58', # DISK_SNAPSHOT_REVERT
    # '59', # DISK_SNAPSHOT_DELETE
    # '60', # PROLOG_MIGRATE_UNKNOWN
    # '61', # PROLOG_MIGRATE_UNKNOWN_FAILURE
    '62' # DISK_RESIZE
    # '63', # DISK_RESIZE_POWEROFF
    # '64', # DISK_RESIZE_UNDEPLOYED
    # '65', # HOTPLUG_NIC_POWEROFF
    # '66', # HOTPLUG_RESIZE
    # '67', # HOTPLUG_SAVEAS_UNDEPLOYED
    # '68', # HOTPLUG_SAVEAS_STOPPED
]

# This class provides an abstracion with the common code
# inside the remote connections classes.
class SunstoneRemoteConnections

    attr_accessor :options, :logger

    def initialize(logger, options = {})
        opts = {
            :json_errors => true
        }.merge(options)

        @options = opts
        @logger = logger
    end

    def allowed_console_states
        ALLOWED_CONSOLE_STATES
    end

    protected

    def error(code, msg)
        @logger.error(msg)

        [code, OpenNebula::Error.new(msg).to_json]
    end

end
