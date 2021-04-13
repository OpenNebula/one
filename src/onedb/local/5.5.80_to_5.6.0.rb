# -------------------------------------------------------------------------- #
# Copyright 2019-2020, OpenNebula Systems S.L.                               #
#                                                                            #
# Licensed under the OpenNebula Software License                             #
# (the "License"); you may not use this file except in compliance with       #
# the License. You may obtain a copy of the License as part of the software  #
# distribution.                                                              #
#                                                                            #
# See https://github.com/OpenNebula/one/blob/master/LICENSE.onsla            #
# (or copy bundled with OpenNebula in /usr/share/doc/one/).                  #
#                                                                            #
# Unless agreed to in writing, software distributed under the License is     #
# distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY   #
# KIND, either express or implied. See the License for the specific language #
# governing permissions and  limitations under the License.                  #
# -------------------------------------------------------------------------- #

require 'set'
require 'base64'
require 'zlib'
require 'pathname'
require 'yaml'
require 'opennebula'

$: << File.dirname(__FILE__)

include OpenNebula

module Migrator
    def db_version
        "5.6.0"
    end

    def one_version
        "OpenNebula 5.6.0"
    end

    def up
        return true
    end
end
