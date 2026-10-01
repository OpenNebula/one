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
    def pre_up; end

    # Upgrade steps
    def up
        process('/etc/one/oneform-server.conf', 'Yaml') do |old, new|
            break unless old.is_a?(Hash) && new.is_a?(Hash)

            host = old[:host]
            port = old[:port]

            new.delete(:host)
            new.delete(:port)

            new[:server] ||= {}
            new[:server][:bind] = host if old.key?(:host)
            new[:server][:port] = port if old.key?(:port)
        end

        process('/etc/one/oned.conf', 'Augeas::ONE') do |old, new|
            break unless old && new

            bug7899_scripts_remote_dir(new)
        end

        process('/etc/one/onehem-server.conf', 'Yaml') do |old, new|
            break unless old.is_a?(Hash) && new.is_a?(Hash)

            bug7899_remote_hook_base_path(old, new)
        end
    end

    # Since 7.5.80 the remote scripts directory is fixed to
    # /var/lib/one-remotes; the configuration attribute is gone
    def bug7899_scripts_remote_dir(new)
        new.rm('SCRIPTS_REMOTE_DIR')
    end

    # Since 7.5.80 the remote hooks are executed from the hooks
    # directory inside the fixed remote scripts directory. Drop the old
    # stock value so that the new default applies; keep custom paths.
    def bug7899_remote_hook_base_path(old, new)
        return unless old[:remote_hook_base_path] == '/var/tmp/one/hooks'

        new.delete(:remote_hook_base_path)
    end

end
