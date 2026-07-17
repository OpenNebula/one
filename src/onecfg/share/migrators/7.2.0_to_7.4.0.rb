# -------------------------------------------------------------------------- #
# Copyright 2019-2026, OpenNebula Systems S.L.                               #
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

# frozen_string_literal: true

# Migrator
module Migrator

    # Preupgrade steps
    def pre_up
        ['/var/lib/one/remotes/etc/onebex'].each do |dir|
            @fops.mkdir(dir)
            @fops.chown(dir, 'oneadmin', 'oneadmin')
            @fops.chmod(dir, 0o750)
        end
    end

    # Upgrade steps
    def up
        process('/etc/one/onegate-server.conf', 'Yaml') do |old, new|
            break unless old.is_a?(Hash) && new.is_a?(Hash)

            feature7226_sinatra_conf(old, new)
        end
    end

    def feature7226_sinatra_conf(old, new)
        host = old[:host]
        port = old[:port]

        new.delete(:host)
        new.delete(:port)

        new[:server] ||= {}
        new[:server][:bind] = host if old.key?(:host)
        new[:server][:port] = port if old.key?(:port)
    end

end
