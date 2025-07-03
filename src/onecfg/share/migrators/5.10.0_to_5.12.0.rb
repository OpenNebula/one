# -------------------------------------------------------------------------- #
# Copyright 2019-2025, OpenNebula Systems S.L.                               #
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
        ['/var/lib/one/remotes/etc/im/firecracker-probes.d',
         '/var/lib/one/remotes/etc/vmm/firecracker'].each do |dir|
            @fops.mkdir(dir)
            @fops.chown(dir, 'oneadmin', 'oneadmin')
            @fops.chmod(dir, 0o750)
        end
    end

    # Upgrade steps
    def up
        process('/etc/one/oned.conf', 'Augeas::ONE') do |o_old, o_new|
            break unless o_old && o_new

            process('/etc/one/monitord.conf', 'Augeas::ONE') do |_m_old, m_new|
                break unless m_new

                feature3859(o_old, o_new, m_new)
            end
        end
    end

    def feature3859(oned_old, oned_new, monitord)
        oned_values     = oned_old.match('IM_MAD')
        monitord_values = monitord.match('IM_MAD')

        # New index of the sections where we should append
        new_idx = monitord_values.size + 1

        # Migrate IM_MADs from old oned.conf to new monitord.conf
        oned_values.each do |o_path|
            o_name     = oned_old.get("#{o_path}/NAME")
            o_sun_name = oned_old.get("#{o_path}/SUNSTONE_NAME")
            o_exe      = oned_old.get("#{o_path}/EXECUTABLE")
            o_args     = oned_old.get("#{o_path}/ARGUMENTS")

            # we don't migrate collectd, it'll be dropped
            next if o_name =~ /^"?collectd"?$/

            m_path = monitord_values.find do |v|
                monitord.get("#{v}/NAME") == o_name
            end

            unless m_path
                # If value is not found in the monitord file should
                # create a new section for it
                m_path = "IM_MAD[#{new_idx}]"
                new_idx += 1
            end

            # replace matching IM_MAD[] or append
            monitord.set("#{m_path}/NAME", o_name) if o_name
            monitord.set("#{m_path}/SUNSTONE_NAME", o_sun_name) if o_sun_name
            monitord.set("#{m_path}/EXECUTABLE", o_exe) if o_exe
            monitord.set("#{m_path}/ARGUMENTS", o_args) if o_args
        end

        # Remove extra IM_MADs from monitord.conf
        monitord_values.each do |m_path|
            m_name = monitord.get("#{m_path}/NAME")

            # don't remove new IM_MADs introduced just in monitord.conf
            next if m_name =~ /^"?firecracker"?$/

            # remove from monitord.conf if not found in old oned.conf
            unless oned_old.get("IM_MAD[NAME = '#{m_name}']/NAME")
                monitord.rm(m_path)
            end
        end

        # From new oned.conf remove all IM_MADs except 'monitord',
        # all should be already migrated by in monitord.conf
        oned_new.rm('IM_MAD[NAME != \'"monitord"\']')

        ###

        # Migrate MONITORING_INTERVAL_HOST from oned.conf
        monit_interval = oned_old.get('MONITORING_INTERVAL_HOST')

        if monit_interval
            if monit_interval.to_i < 30
                STDERR.puts 'WARNING: The value of MONITORING_INTERVAL_HOST' \
                            ' is too low to migrate. It should be at' \
                            ' least 30. Skiping.'

            elsif monit_interval.to_i != 180
                monitord.set('MONITORING_INTERVAL_HOST', monit_interval)
                monitord.set('PROBES_PERIOD/BEACON_HOST',
                             (monit_interval.to_i / 6).to_s)
            end
        end

        # Adjust PROBES_PERIODs based on original collectd interval (-i)
        col_args = oned_old.get('IM_MAD[NAME = \'"collectd"\']/ARGUMENTS')

        # rubocop:disable Style/GuardClause
        # rubocop:disable Style/MultilineIfThen
        if col_args && col_args.match(/-i\s*(\d+)/) &&
           Regexp.last_match[1] != '60'
        then
            i = Regexp.last_match[1]

            monitord.set('PROBES_PERIOD/SYSTEM_HOST', (i.to_i * 10).to_s)
            monitord.set('PROBES_PERIOD/MONITOR_HOST', i)
            monitord.set('PROBES_PERIOD/MONITOR_VM', i)
        end
        # rubocop:enable Style/GuardClause
        # rubocop:enable Style/MultilineIfThen
    end

end
