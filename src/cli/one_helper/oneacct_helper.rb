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

require 'one_helper'
require 'optparse/time'

class AcctHelper < OpenNebulaHelper::OneHelper
    START_TIME_ACCT = {
        :name   => "start_time",
        :short  => "-s TIME",
        :large  => "--start TIME" ,
        :description => "First day of the data to retrieve",
        :format => Time
    }

    END_TIME_ACCT = {
        :name   => "end_time",
        :short  => "-e TIME",
        :large  => "--end TIME" ,
        :description => "Last day of the data to retrieve",
        :format => Time
    }

    START_TIME_SHOWBACK = {
        :name   => "start_time",
        :short  => "-s TIME",
        :large  => "--start TIME" ,
        :description => "First month of the data",
        :format => Time
    }

    END_TIME_SHOWBACK = {
        :name   => "end_time",
        :short  => "-e TIME",
        :large  => "--end TIME" ,
        :description => "Last month of the data",
        :format => Time
    }

    USERFILTER = {
        :name   => "userfilter",
        :short  => "-u user",
        :large  => "--userfilter user" ,
        :description => "User name or id to filter the results",
        :format => String,
        :proc => lambda { |o, options|
            OpenNebulaHelper.rname_to_id(o, "USER")
        }
    }

    GROUP = {
        :name   => "group",
        :short  => "-g group",
        :large  => "--group group" ,
        :description => "Group name or id to filter the results",
        :format => String,
        :proc => lambda { |o, options|
            OpenNebulaHelper.rname_to_id(o, "GROUP")
        }
    }

    HOST = {
        :name   => "host",
        :short  => "-H HOST",
        :large  => "--host HOST" ,
        :description => "Host name or id to filter the results",
        :format => String,
        :proc => lambda { |o, options|
            OpenNebulaHelper.rname_to_id(o, "HOST")
        }
    }

    XPATH = {
        :name   => "xpath",
        :large  => "--xpath XPATH_EXPRESSION" ,
        :description => "Xpath expression to filter the results. \
            For example: oneacct --xpath 'HISTORY[ETIME>0]'",
        :format => String
    }

    SPLIT={
        :name  => "split",
        :large => "--split",
        :description => "Split the output in a table for each VM"
    }

    ACCT_OPTIONS     = [START_TIME_ACCT, END_TIME_ACCT, USERFILTER, GROUP, HOST, XPATH, SPLIT]
    SHOWBACK_OPTIONS = [START_TIME_SHOWBACK, END_TIME_SHOWBACK, USERFILTER, GROUP, OpenNebulaHelper::FORMAT]

    ACCT_OPTIONS << OpenNebulaHelper::XML
    ACCT_OPTIONS << OpenNebulaHelper::JSON

    ACCT_TABLE = CLIHelper::ShowTable.new(self.table_conf("oneacct.yaml"), nil) do
        column :UID, "User ID", :size=>4 do |d|
            d["UID"]
        end

        column :VID, "Virtual Machine ID", :size=>4 do |d|
            d["OID"]
        end

        column :SEQ, "History record sequence number", :size=>3 do |d|
            d["SEQ"]
        end

        column :HOSTNAME, "Host name", :left, :size=>15 do |d|
            d["HOSTNAME"]
        end

        column :"ACTION", "VM state change action", :left, :size=>16 do |d|
            VirtualMachine.get_history_action d["ACTION"]
        end

        column :START_TIME, "Start time", :size=>14 do |d|
            OpenNebulaHelper.time_to_str(d['STIME'])
        end

        column :END_TIME, "End time", :size=>14 do |d|
            OpenNebulaHelper.time_to_str(d['ETIME'])
        end

        column :MEMORY, "Assigned memory", :size=>6 do |d|
            OpenNebulaHelper.unit_to_str(d["VM"]["TEMPLATE"]["MEMORY"].to_i, {}, 'M') rescue "-"
        end

        column :CPU, "Number of CPUs", :size=>3 do |d|
            d["VM"]["TEMPLATE"]["CPU"] rescue "-"
        end

        column :NETRX, "Data received from the network", :size=>6 do |d|
            # NET is measured in bytes, unit_to_str expects KBytes
            OpenNebulaHelper.unit_to_str(d["VM"]["MONITORING"]["NETRX"].to_i / 1024.0, {}) rescue "-"
        end

        column :NETTX, "Data sent to the network", :size=>6 do |d|
            # NET is measured in bytes, unit_to_str expects KBytes
            OpenNebulaHelper.unit_to_str(d["VM"]["MONITORING"]["NETTX"].to_i / 1024.0, {}) rescue "-"
        end

        column :DISK, "Total disk size used", :size=>6 do |d|
            # DISK size is measured in mb, unit_to_str expects KBytes
            begin
                total_disk_size = 0

                vm_id = d["VM"]["ID"].to_i

                disks_all = [d["VM"]["TEMPLATE"]["DISK"]].flatten.compact rescue []
                disks_all.each do |disk|
                    total_disk_size += disk["SIZE"].to_i
                end

                snapshots_all = [d["VM"]["SNAPSHOTS"]].flatten.compact rescue []
                snapshots_all.each do |snapshot|
                    snapshot_disk = [snapshot["SNAPSHOT"]].flatten.compact rescue []
                    snapshot_disk.each do |snapshot|
                        total_disk_size += snapshot["SIZE"].to_i
                    end
                end

                OpenNebulaHelper.unit_to_str(total_disk_size * 1024.0, {})
            rescue
                "-"
            end
        end

        default :VID, :HOSTNAME, :ACTION, :START_TIME, :END_TIME, :MEMORY, :CPU, :NETRX, :NETTX, :DISK
    end

    SHOWBACK_TABLE = CLIHelper::ShowTable.new(self.table_conf("oneshowback.yaml"), nil) do
        column :UID, "User ID", :size=>4 do |d|
            d["UID"]
        end

        column :USER_NAME, "User name", :left, :size=>12 do |d|
            d["UNAME"]
        end

        column :GID, "Group ID", :size=>4 do |d|
            d["GID"]
        end

        column :GROUP_NAME, "Group name", :left, :size=>12 do |d|
            d["GNAME"]
        end

        column :VM_ID, "Virtual Machine ID", :size=>6 do |d|
            d["VMID"]
        end

        column :VM_NAME, "Virtual Machine name", :left, :size=>12 do |d|
            d["VMNAME"]
        end

        column :MONTH, "Month", :size=>5 do |d|
            d["MONTH"]
        end

        column :YEAR, "Year", :size=>5 do |d|
            d["YEAR"]
        end

        column :HOURS, "Hours", :size=>6 do |d|
            d["HOURS"]
        end

        column :RUNNING_HOURS, "Running hours", :size=>7 do |d|
            d["RHOURS"] || '-'
        end

        column :COST, "Cost", :size=>15 do |d|
            d["TOTAL_COST"]
        end

        default :USER_NAME, :GROUP_NAME, :VM_ID, :VM_NAME, :MONTH, :YEAR, :HOURS, :RUNNING_HOURS, :COST
    end

    def self.print_start_end_time_header(start_time, end_time)
        print "Showing active history records from "

        CLIHelper.scr_bold
        if ( start_time != -1 )
            print Time.at(start_time).to_s
        else
            print "-"
        end

        CLIHelper.scr_restore
        print " to "

        CLIHelper.scr_bold
        if ( end_time != -1 )
            print Time.at(end_time).to_s
        else
            print "-"
        end

        CLIHelper.scr_restore
        puts
        puts
    end

    def self.print_user_header(user_id)
        CLIHelper.scr_bold
        CLIHelper.scr_underline
        puts "# User #{user_id}".ljust(80)
        CLIHelper.scr_restore
        puts
    end

    def self.print_month_header(year, month)
        CLIHelper.scr_bold
        CLIHelper.scr_underline
        puts "# Showback for #{month}/#{year}".ljust(80)
        CLIHelper.scr_restore
        puts
    end
end
