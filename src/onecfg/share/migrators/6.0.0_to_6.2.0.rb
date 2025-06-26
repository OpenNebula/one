# -------------------------------------------------------------------------- #
# Copyright 2019-2022, OpenNebula Systems S.L.                               #
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
        ['/var/lib/one/remotes/etc/vmm/lxc/profiles'].each do |dir|
            @fops.mkdir(dir)
            @fops.chown(dir, 'oneadmin', 'oneadmin')
            @fops.chmod(dir, 0o750)
        end

        ['/etc/one/fireedge',
         '/etc/one/fireedge/provision',
         '/etc/one/fireedge/provision/providers.d',
         '/etc/one/fireedge/sunstone',
         '/etc/one/fireedge/sunstone/admin',
         '/etc/one/fireedge/sunstone/user'].each do |dir|
            @fops.mkdir(dir)
            @fops.chown(dir, 'root', 'oneadmin')
            @fops.chmod(dir, 0o750)
        end
    end

    # Upgrade steps
    def up
        # Copy oneprovision_prepend_command +
        #      oneprovision_optional_create_command
        # from /etc/one/fireedge-server.conf
        # to   /etc/one/fireedge/provision/provision-server.conf
        process('/etc/one/fireedge/provision/provision-server.conf',
                'Yaml') do |_p_old, p_new|
            break unless p_new

            process('/etc/one/fireedge-server.conf', 'Yaml') do |f_old, _f_new|
                break unless f_old

                %w[oneprovision_prepend_command
                   oneprovision_optional_create_command].each do |attr|
                    p_new[attr] = f_old[attr] if f_old[attr]
                end
            end
        end

        # Copy :token_remote_support
        # from /etc/one/sunstone-server.conf
        # to   /etc/one/fireedge/sunstone/sunstone-server.conf
        process('/etc/one/fireedge/sunstone/sunstone-server.conf',
                'Yaml') do |_f_old, f_new|
            break unless f_new

            process('/etc/one/sunstone-server.conf', 'Yaml') do |s_old, _s_new|
                break unless s_old

                f_new['support_token'] = s_old[:token_remote_support] \
                    if s_old[:token_remote_support]
            end
        end
    end

end
