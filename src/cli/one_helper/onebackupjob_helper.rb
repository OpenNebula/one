# -------------------------------------------------------------------------- #
# Copyright 2002-2023, OpenNebula Project, OpenNebula Systems                #
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

require 'one_helper'

# Helper for onebackupjob command
class OneBackupJobHelper < OpenNebulaHelper::OneHelper

    def self.rname
        'BACKUPJOB'
    end

    def self.conf_file
        'onebackupjob.yaml'
    end

    TEMPLATE_OPTIONS = [
        {
            :name => 'name',
            :large => '--name name',
            :format => String,
            :description => 'Name of the new backup job'
        },
        {
            :name => 'description',
            :large => '--description description',
            :format => String,
            :description => 'Description for the new Image'
        },
        {
            :name => 'backup_vms',
            :large => '--vms "vm_id1,vm_id2..."',
            :format => String,
            :description => 'List of VM IDs to backup'
        },
        {
            :name => 'keep_last',
            :large => '--keep N',
            :format => String,
            :description => 'Keep N backups for the VMs in this backup job'
        },
        {
            :name => 'mode',
            :large => '--mode <increment|full>',
            :format => String,
            :description => 'Backup mode'
        }
    ]

    def format_pool(options)
        config_file = self.class.table_conf

        CLIHelper::ShowTable.new(config_file, self) do
            column :ID, 'ONE identifier for the Backup Job', :size=>4 do |d|
                d['ID']
            end

            column :USER, 'Username of the Backup Job owner', :left,
                   :size=>15 do |d|
                helper.user_name(d, options)
            end

            column :GROUP, 'Group of the Backup Job', :left, :size=>15 do |d|
                helper.group_name(d, options)
            end

            column :PRIO, 'Priority of the Backup Job', :left, :size=>4 do |d|
                d['PRIORITY'].to_i
            end

            column :NAME, 'Date for the last backup operation', :left, :size=>15 do |d|
                d['NAME']
            end

            column :LAST, 'Date for the last backup operation', :size => 15 do |d|
                begin
                    btime = d['LAST_BACKUP_TIME'].to_i
                rescue StandardError
                    btime = 0
                end
                OpenNebulaHelper.time_to_str(btime, false, true, true)
            end

            column :VMS, 'VM IDs part of this backup job', :size => 15 do |d|
                begin
                    vm = d['TEMPLATE']['BACKUP_VMS']
                    vm[12..-1]='...' if vm.size > 15
                    vm
                rescue StandardError
                    '-'
                end
            end

            default :ID, :USER, :GROUP, :PRIO, :NAME, :LAST, :VMS
        end
    end

    def schedule_actions(ids, options, warning = nil)
        # Verbose by default
        options[:verbose] = true

        message = if options[:schedule].class == Integer
                      "backup scheduled at #{Time.at(options[:schedule])}"
                  else
                      "backup scheduled after #{options[:schedule]}s"
                  end

        tmp_str = OpenNebulaHelper.schedule_action_tmpl(options, nil, warning)

        perform_actions(ids, options, message) do |bj|
            rc = bj.sched_action_add(tmp_str)

            if OpenNebula.is_error?(rc)
                STDERR.puts rc.message
                exit(-1)
            end
        end
    end

    # Update schedule action
    #
    # @param id        [Integer] BackupJob ID
    # @param action_id [Integer] Sched action ID
    # @param file      [String]  File path with update content
    # @param options
    def update_schedule_action(id, action_id, file, options)
        perform_action(id, options, 'Sched action updated') do |bj|
            rc = bj.info

            if OpenNebula.is_error?(rc)
                STDERR.puts "Error #{rc.message}"
                exit(-1)
            end

            xpath = "TEMPLATE/SCHED_ACTION[ID=#{action_id}]"

            unless bj.retrieve_elements(xpath)
                STDERR.puts "Sched action #{action_id} not found"
                exit(-1)
            end

            # Get user information
            if file
                str = File.read(file)
            else
                str = OpenNebulaHelper.update_template(id, bj, nil, xpath)
            end

            # Add the modified sched action
            tmp_str = "\nSCHED_ACTION = ["
            tmp_str << str.split("\n").join(',')
            tmp_str << ']'

            rc = bj.sched_action_update(action_id, tmp_str)

            if OpenNebula.is_error?(rc)
                STDERR.puts "Error updating: #{rc.message}"
                exit(-1)
            end
        end
    end

    def self.create_backupjob_template(options)
        template_options = TEMPLATE_OPTIONS.map do |o|
            o[:name].to_sym
        end

        template_options << :name

        t = ''
        template_options.each do |n|
            t << "#{n.to_s.upcase}=\"#{options[n]}\"\n" if options[n]
        end

        t
    end

    private

    def factory(id = nil)
        if id
            OpenNebula::BackupJob.new_with_id(id, @client)
        else
            xml=OpenNebula::BackupJob.build_xml
            OpenNebula::BackupJob.new(xml, @client)
        end
    end

    def factory_pool(user_flag = -2)
        OpenNebula::BackupJobPool.new(@client, user_flag)
    end

    def format_resource(bj, options = {})
        bj_hash = bj.to_hash

        str='%-15s: %-20s'
        str_h1='%-80s'

        # ----------------------------------------------------------------------
        CLIHelper.print_header(
            str_h1 % "BACKUP JOB #{bj['ID']} INFORMATION"
        )
        # ----------------------------------------------------------------------
        puts format(str, 'ID', bj.id.to_s)
        puts format(str, 'NAME', bj.name)
        puts format(str, 'USER', bj['UNAME'])
        puts format(str, 'GROUP', bj['GNAME'])
        puts format(str, 'LOCK', OpenNebulaHelper.level_lock_to_str(bj['LOCK/LOCKED']))

        CLIHelper.print_header(str_h1 % 'PERMISSIONS', false)

        ['OWNER', 'GROUP', 'OTHER'].each do |e|
            mask = '---'
            mask[0] = 'u' if bj["PERMISSIONS/#{e}_U"] == '1'
            mask[1] = 'm' if bj["PERMISSIONS/#{e}_M"] == '1'
            mask[2] = 'a' if bj["PERMISSIONS/#{e}_A"] == '1'

            puts format(str, e, mask)
        end
        puts

        # ----------------------------------------------------------------------
        CLIHelper.print_header(
            str_h1 % 'LAST BACKUP JOB EXECUTION INFORMATION'
        )
        # ----------------------------------------------------------------------
        puts format(str, 'TIME', OpenNebulaHelper.time_to_str(bj['LAST_BACKUP_TIME']))
        puts format(str, 'DURATION', OpenNebulaHelper.period_to_str(bj['LAST_BACKUP_DURATION']))
        puts

        # ----------------------------------------------------------------------
        CLIHelper.print_header(
            str_h1 % 'VIRTUAL MACHINE BACKUP STATUS'
        )
        # ----------------------------------------------------------------------
        up  = bj.retrieve_elements('UPDATED_VMS/ID')
        out = bj.retrieve_elements('OUTDATED_VMS/ID')
        act = bj.retrieve_elements('BACKING_UP_VMS/ID')
        err = bj.retrieve_elements('ERROR_VMS/ID')

        up  = [] if up.nil?
        out = [] if out.nil?
        act = [] if act.nil?
        err = [] if err.nil?

        puts format(str, 'UPDATED', up.join(','))
        puts format(str, 'OUTDATED', out.join(','))
        puts format(str, 'ONGOING', act.join(','))
        puts format(str, 'ERROR', err.join(','))

        if bj.has_elements?('/BACKUPJOB/TEMPLATE/SCHED_ACTION')
            puts
            CLIHelper.print_header(str_h1 % 'SCHEDULED ACTIONS', false)

            table = OpenNebulaHelper.scheduled_action_table(self)
            table.show([bj_hash['BACKUPJOB']['TEMPLATE']['SCHED_ACTION']].flatten, {})
        end

        if !options[:all]
            bj.delete_element('/BACKUPJOB/TEMPLATE/SCHED_ACTION')
        end

        puts

        # ----------------------------------------------------------------------
        CLIHelper.print_header(str_h1 % 'TEMPLATE CONTENTS', false)
        # ----------------------------------------------------------------------
        puts bj.template_str
    end

end
