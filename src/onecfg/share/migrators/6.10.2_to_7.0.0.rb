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
    ['/etc/one/fireedge/sunstone/',
     '/etc/one/fireedge/sunstone/profiles/',
     '/etc/one/fireedge/sunstone/views',
     '/etc/one/fireedge/sunstone/views/admin',
     '/etc/one/fireedge/sunstone/views/cloud',
     '/etc/one/fireedge/sunstone/views/groupadmin',
     '/etc/one/fireedge/sunstone/views/user',
     '/etc/one/schedulers/'].each do |dir|
      @fops.mkdir(dir)
      @fops.chown(dir, 'root', 'oneadmin')
      @fops.chmod(dir, 0o750)
    end
  end

  # Upgrade steps
  def up
    process('/etc/one/sunstone-views.yaml', 'Yaml') do |r_old, _r_new|
      break unless r_old && r_old['labels_groups']

      process('/etc/one/fireedge/sunstone/default-labels.yaml', 'Yaml') do |_f_old, f_new|
        break unless f_new && f_new['group']

        feature6648_system_labels(r_old['labels_groups'], f_new['group'])
      end
    end

    process('/etc/one/sched.conf', 'Augeas::ONE') do |s_old, _s_new|
      break unless s_old

      process('/etc/one/oned.conf', 'Augeas::ONE') do |o_old, o_new|
        break unless o_old && o_new

        feature1550_sched_to_oned(s_old, o_new)
      end

      process('/etc/one/schedulers/rank.conf', 'Augeas::ONE') do |_r_old, r_new|
        break unless r_new

        feature1550_sched_to_rank(s_old, r_new)
      end
    end
  end

  def feature6648_system_labels(r_labels, f_labels)
    sanitize_label = ->(label) { label.gsub(/[^A-Za-z0-9_-]/, '_') }
    return unless r_labels.is_a?(Hash)

    r_labels.each do |group, labels|
      next unless labels.is_a?(Array) && group

      f_labels[group] ||= {}
      labels.each do |label_path|
        parts = label_path&.split('/')&.map { |part| sanitize_label.call(part) }
        current = f_labels[group]

        parts.each do |part|
          current[part] ||= {}
          current = current[part]
        end
      end
    end
  end

  def feature1550_sched_to_oned(s_old, o_new)
    # oned.conf:COLD_MIGRATE_MODE <- sched.conf:COLD_MIGRATE_MODE
    o_new.set('COLD_MIGRATE_MODE', s_old.get('COLD_MIGRATE_MODE'))

    # oned.conf:LIVE_RESCHEDS <- sched.conf:LIVE_RESCHEDS
    o_new.set('LIVE_RESCHEDS', s_old.get('LIVE_RESCHEDS'))

    # oned.conf:MAX_ACTIONS_PER_CLUSTER <- sched.conf:MAX_DISPATCH
    o_new.set('MAX_ACTIONS_PER_CLUSTER', s_old.get('MAX_DISPATCH'))

    # oned.conf:MAX_ACTIONS_PER_HOST <- sched.conf:MAX_HOST
    o_new.set('MAX_ACTIONS_PER_HOST', s_old.get('MAX_HOST'))
  end

  def feature1550_sched_to_rank(s_old, r_new)
    # rank.conf:LOG/DEBUG_LEVEL <- sched.conf:LOG/DEBUG_LEVEL
    r_new.set('LOG/DEBUG_LEVEL', s_old.get('LOG/DEBUG_LEVEL'))
  end
end
