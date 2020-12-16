# -------------------------------------------------------------------------- #
# Copyright 2002-2020, OpenNebula Project, OpenNebula Systems                #
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

require 'exception'
require 'common'
require 'settings'
require 'version'
require 'config'

begin
    require 'ee'
rescue LoadError
end

# OneCfg main module
module OneCfg

    ONE_LOCATION = ENV['ONE_LOCATION']

    # Global directories
    # TODO: improve
    if ONE_LOCATION
        BIN_DIR    = File.join(ONE_LOCATION, 'bin')
        ETC_DIR    = '/tmp/onescape/etc'
        BACKUP_DIR = '/tmp/onescape/backups'
        SHARE_DIR  = ONE_LOCATION + '/share/onecfg'

        [ETC_DIR, BACKUP_DIR].each do |d|
            OneCfg::LOG.warn("Using local state in #{d}")
            FileUtils.mkdir_p(d)
        end
    else
        BIN_DIR    = '/usr/bin'
        ETC_DIR    = '/etc/onescape'
        BACKUP_DIR = '/var/lib/one/backups/config'
        SHARE_DIR = '/usr/share/one/onecfg'
    end

    LOG = OneCfg::Common::CliLogger

    # Project local directories
    CONF_DIR  = File.join(SHARE_DIR, 'etc')
    MIGR_DIR  = File.join(SHARE_DIR, 'migrators')
    LENS_DIR  = File.join(SHARE_DIR, 'augeas')

    # Individual files
    FILES_CFG  = File.join(CONF_DIR, 'files.yaml')
    CONFIG_CFG = File.join(ETC_DIR,  'config.yaml')

    # Configuration management releated constants
    CONFIG_BACKUP_DIRS    = ['/etc/one', '/var/lib/one/remotes']
    CONFIG_UPDATE_DIRS    = ['/etc/one', '/var/lib/one/remotes/etc']
    CONFIG_LOCAL_FIX_DIRS = { '/etc' => '/etc/one', '/var' => '/var/lib/one' }

end
