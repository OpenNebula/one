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

require 'fileutils'
require 'tempfile'
require 'CommandManager'

require 'one_helper'

# Check differences between files and copy them
class Replicator

    SSH_OPTIONS = '-o stricthostkeychecking=no -o passwordauthentication=no'
    ONE_AUTH    = '/var/lib/one/.one/one_auth'
    FED_ATTRS   = %w[MODE ZONE_ID SERVER_ID MASTER_ONED]

    FILES = [
        { :name    => 'az_driver.conf',
          :service => 'opennebula' },
        { :name    => 'az_driver.default',
          :service => 'opennebula' },
        { :name    => 'ec2_driver.conf',
          :service => 'opennebula' },
        { :name    => 'ec2_driver.default',
          :service => 'opennebula' },
        { :name    => 'monitord.conf',
          :service => 'opennebula' },
        { :name    => 'oneflow-server.conf',
          :service => 'opennebula-flow' },
        { :name    => 'onegate-server.conf',
          :service => 'opennebula-gate' },
        { :name    => 'sched.conf',
          :service => 'opennebula' },
        { :name    => 'sunstone-logos.yaml',
          :service => 'opennebula-sunstone' },
        { :name    => 'sunstone-server.conf',
          :service => 'opennebula-sunstone' },
        { :name    => 'vcenter_driver.default',
          :service => 'opennebula' }
    ]

    FOLDERS = [
        { :name => 'sunstone-views', :service => 'opennebula-sunstone' },
        { :name => 'auth', :service => 'opennebula' },
        { :name => 'hm', :service => 'opennebula' },
        { :name => 'sunstone-views', :service => 'opennebula' },
        { :name => 'vmm_exec', :service => 'opennebula' }
    ]

    # Class constructor
    #
    # @param ssh_key [String] SSH key file path
    # @param server  [String] OpenNebula server IP address
    def initialize(ssh_key, server)
        @oneadmin_identity_file = ssh_key
        @remote_server          = server

        # Get local configuration
        l_credentials = File.read(ONE_AUTH).gsub("\n", '')
        l_endpoint    = 'http://localhost:2633/RPC2'
        local_client  = Client.new(l_credentials, l_endpoint)

        @l_config = OpenNebula::System.new(local_client).get_configuration
        @l_config_elements = { :raw => @l_config }
        @l_fed_elements    = { :raw => @l_config }

        if OpenNebula.is_error?(@l_config)
            STDERR.puts 'Unable to read OpenNebula configuration. ' \
                        'Is OpenNebula running?'
            exit(-1)
        end

        fetch_db_config(@l_config_elements)
        fetch_fed_config(@l_fed_elements)

        # Get remote configuration
        r_credentials = ssh("cat #{ONE_AUTH}").stdout.gsub("\n", '')
        r_endpoint    = "http://#{server}:2633/RPC2"
        remote_client = Client.new(r_credentials, r_endpoint)

        @r_config = OpenNebula::System.new(remote_client).get_configuration
        @r_config_elements = { :raw => @r_config }
        @r_fed_elements    = { :raw => @r_config }

        fetch_db_config(@r_config_elements)
        fetch_fed_config(@r_fed_elements)

        # Set OpenNebula services to not restart
        @opennebula_services = { 'opennebula'          => false,
                                 'opennebula-sunstone' => false,
                                 'opennebula-gate'     => false,
                                 'opennebula-flow'     => false }
    end

    # Process files and folders
    #
    # @param sync_database [Boolean] True to sync database
    def process_files(sync_database)
        # Files to be copied
        copy_onedconf

        FILES.each do |file|
            copy_and_check(file[:name], file[:service])
        end

        # Folders to be copied
        FOLDERS.each do |folder|
            copy_folder(folder[:name], folder[:service])
        end

        restart_services

        # Sync database
        sync_db if sync_database
    end

    private

    # Get database configuration
    #
    # @param configs [Object] Configuration
    def fetch_db_config(configs)
        configs.store(:backend, configs[:raw]['/OPENNEBULA_CONFIGURATION/DB/BACKEND'])

        if configs[:backend] == 'mysql'
            configs.store(:server, configs[:raw]['/OPENNEBULA_CONFIGURATION/DB/SERVER'])
            configs.store(:user, configs[:raw]['/OPENNEBULA_CONFIGURATION/DB/USER'])
            configs.store(:password, configs[:raw]['/OPENNEBULA_CONFIGURATION/DB/PASSWD'])
            configs.store(:dbname, configs[:raw]['/OPENNEBULA_CONFIGURATION/DB/DB_NAME'])
            configs.store(:port, configs[:raw]['/OPENNEBULA_CONFIGURATION/DB/PORT'])
            configs[:port] = '3306' if configs[:port] == '0'
        else
            STDERR.puts 'No mysql backend configuration found'
            exit(-1)
        end
    end

    # Get federation configuration
    #
    # @param configs [Object] Configuration
    def fetch_fed_config(configs)
        configs.store(:server_id,
                      configs[:raw]['/OPENNEBULA_CONFIGURATION/FEDERATION/SERVER_ID'])
        configs.store(:zone_id,
                      configs[:raw]['/OPENNEBULA_CONFIGURATION/FEDERATION/ZONE_ID'])
    end

    # Replaces a file with the version located on a remote server
    # Only replaces the file if it's different from the remote one
    #
    # @param file    [String] File to check
    # @param service [String] Service to restart
    def copy_and_check(file, service)
        puts "Checking #{file}"

        temp_file = Tempfile.new("#{file}-temp")

        scp("/etc/one/#{file}", temp_file.path)

        if !FileUtils.compare_file(temp_file, "/etc/one/#{file}")
            FileUtils.cp(temp_file.path, "/etc/one/#{file}")

            puts "#{file} has been replaced by #{@remote_server}:#{file}"

            @opennebula_services[service] = true
        end
    ensure
        temp_file.unlink
    end

    # Copy folders
    #
    # @param folder  [String] Folder to copy
    # @param service [String] Service to restart
    def copy_folder(folder, service)
        puts "Checking #{folder}"

        rc = run_command(
            "rsync -ai\
            -e \"ssh #{SSH_OPTIONS} -i #{@oneadmin_identity_file}\" " \
            "#{@remote_server}:/etc/one/#{folder}/ " \
            "/etc/one/#{folder}/"
        )

        unless rc
            rc = run_command(
                "rsync -ai\
                -e \"ssh #{SSH_OPTIONS} -i #{@oneadmin_identity_file}\" " \
                "oneadmin@#{@remote_server}:/etc/one/#{folder}/ " \
                "/etc/one/#{folder}/"
            )
        end

        unless rc
            STDERR.puts 'ERROR'
            STDERR.puts "Fail to sync #{folder}"
            exit(-1)
        end

        output = rc.stdout

        return if output.empty?

        puts "Folder #{folder} has been sync with #{@remote_server}:#{folder}"

        @opennebula_services[service] = true
    end

    # oned.conf file on distributed environments will always be different,
    # due to the federation section.
    # Replace oned.conf based on a remote server's version maintaining
    # the old FEDERATION section
    def copy_onedconf
        puts 'Checking oned.conf'

        # Create temporarhy files
        l_oned = Tempfile.new('l_oned')
        r_oned = Tempfile.new('r_oned')

        l_oned.close
        r_oned.close

        # Copy remote and local oned.conf files to temporary files
        scp('/etc/one/oned.conf', r_oned.path)

        FileUtils.cp('/etc/one/oned.conf', l_oned.path)

        # Create augeas objects to manage oned.conf files
        l_work_file_dir  = File.dirname(l_oned.path)
        l_work_file_name = File.basename(l_oned.path)

        r_work_file_dir = File.dirname(r_oned.path)
        r_work_file_name = File.basename(r_oned.path)

        l_aug = Augeas.create(:no_modl_autoload => true,
                              :no_load          => true,
                              :root             => l_work_file_dir,
                              :loadpath         => l_oned.path)

        l_aug.clear_transforms
        l_aug.transform(:lens => 'Oned.lns', :incl => l_work_file_name)
        l_aug.context = "/files/#{l_work_file_name}"
        l_aug.load

        r_aug = Augeas.create(:no_modl_autoload => true,
                              :no_load          => true,
                              :root             => r_work_file_dir,
                              :loadpath         => r_oned.path)

        r_aug.clear_transforms
        r_aug.transform(:lens => 'Oned.lns', :incl => r_work_file_name)
        r_aug.context = "/files/#{r_work_file_name}"
        r_aug.load

        # Get local federation information
        fed_attrs = []

        FED_ATTRS.each do |attr|
            fed_attrs << l_aug.get("FEDERATION/#{attr}")
        end

        # Remove federation section
        l_aug.rm('FEDERATION')
        r_aug.rm('FEDERATION')

        # Save augeas files in temporary directories
        l_aug.save
        r_aug.save

        return if FileUtils.compare_file(l_oned.path, r_oned.path)

        time_based_identifier = Time.now.to_i

        # backup oned.conf
        FileUtils.cp('/etc/one/oned.conf',
                     "/etc/one/oned.conf#{time_based_identifier}")

        FED_ATTRS.zip(fed_attrs) do |name, value|
            r_aug.set("FEDERATION/#{name}", value)
        end

        r_aug.save

        FileUtils.cp(r_oned.path, '/etc/one/oned.conf')

        puts 'oned.conf has been replaced by ' \
             "#{@remote_server}:/etc/one/oned.conf"

        puts 'A copy of your old oned.conf file is located here: ' \
             "/etc/one/oned.conf#{time_based_identifier}"

        @opennebula_services['opennebula'] = true
    end

    # Sync database
    def sync_db
        puts "Dumping and fetching database from #{@remote_server}, " \
             'this could take a while'

        ssh(
            "onedb backup -f -t #{@r_config_elements[:backend]} " \
            "-u #{@r_config_elements[:user]} " \
            "-p #{@r_config_elements[:password]} " \
            "-d #{@r_config_elements[:dbname]} " \
            "-P #{@r_config_elements[:port]} /tmp/one_db_dump.sql"
        )

        scp('/tmp/one_db_dump.sql', '/tmp/one_db_dump.sql')

        puts "Local OpenNebula's database will be replaced, hang tight"

        service_action('opennebula', 'stop')

        puts 'Restoring database'

        run_command(
            "onedb restore -f -t #{@l_config_elements[:backend]}" \
            "-u #{@l_config_elements[:user]} " \
            "-p #{@l_config_elements[:password]} " \
            "-d #{@l_config_elements[:dbname]} " \
            "-P #{@l_config_elements[:port]} " \
            "-h #{@l_config_elements[:server]}" \
            '/tmp/one_db_dump.sql',
            true
        )

        service_action('opennebula', 'start')
    end

    # Run local command
    #
    # @param cmd          [String]  Command to run
    # @param print_output [Boolean] True to show output
    def run_command(cmd, print_output = false)
        output = LocalCommand.run(cmd)

        if output.code == 0
            output
        else
            return false unless print_output

            STDERR.puts 'ERROR'
            STDERR.puts "Failed to run: #{cmd}"
            STDERR.puts output.stderr

            false
        end
    end

    # Execute SSH command
    #
    # @param cmd [String] Command to execute
    def ssh(cmd)
        rc = run_command(
            "ssh -i #{@oneadmin_identity_file} " \
            "#{SSH_OPTIONS} #{@remote_server} " \
            "#{cmd}"
        )

        # if default users doesn't work, try with oneadmin
        unless rc
            rc = run_command(
                "ssh -i #{@oneadmin_identity_file} " \
                "#{SSH_OPTIONS} oneadmin@#{@remote_server} " \
                "#{cmd}"
            )
        end

        # if oneadmin doesn't work neither, fail
        unless rc
            STDERR.puts 'ERROR'
            STDERR.puts "Couldn't execute command #{cmd} on remote host"
            exit(-1)
        end

        rc
    end

    # Execute SCP command
    #
    # @param src  [String] Source path
    # @param dest [String] Destination path
    def scp(src, dest)
        rc = run_command(
            "scp -i #{@oneadmin_identity_file} " \
            "#{SSH_OPTIONS} #{@remote_server}:/#{src} #{dest}"
        )

        # if default users doesn't work, try with oneadmin
        unless rc
            rc = run_command(
                "scp -i #{@oneadmin_identity_file} " \
                "#{SSH_OPTIONS} oneadmin@#{@remote_server}:#{src} #{dest}"
            )
        end

        # if oneadmin doesn't work neither, fail
        unless rc
            STDERR.puts 'ERROR'
            STDERR.puts "Couldn't execute command #{cmd} on remote host"
            exit(-1)
        end
    end

    # Restart OpenNebula services
    def restart_services
        restarted = false

        @opennebula_services.each do |service, status|
            next unless status

            service_action(service)

            restarted = true
        end

        return if restarted

        puts 'Everything seems synchronized, nothing was replaced.'
    end

    # Service action
    #
    # @param service [String] Service to restart
    # @param action  [String] Action to execute (start, stop, restart)
    def service_action(service, action = 'try-restart')
        if `file /sbin/init`.include? 'systemd'
            puts "#{action}ing #{service} via systemd"
            run_command("systemctl #{action} #{service}", true)
        else
            puts "#{action}ing #{service} via init"
            run_command("service #{service} #{action}", true)
        end
    end

end

class OneZoneHelper < OpenNebulaHelper::OneHelper

    SERVER_NAME={
        :name => "server_name",
        :short => "-n server_name",
        :large => "--name",
        :format => String,
        :description => "Zone server name"
    }

    SERVER_ENDPOINT={
        :name => "server_rpc",
        :short => "-r rpc endpoint",
        :large => "--rpc",
        :format => String,
        :description => "Zone server RPC endpoint"
    }

    def show_resource(id, options)
        resource = retrieve_resource(id)

        rc = resource.info_extended
        return -1, rc.message if OpenNebula.is_error?(rc)

        if options[:xml]
            return 0, resource.to_xml(true)
        elsif options[:json]
            # If body is set, the resource contains a JSON inside
            if options[:body]
                return 0, check_resource_xsd(resource)
            else
                return 0, ::JSON.pretty_generate(
                    check_resource_xsd(resource)
                )
            end
        elsif options[:yaml]
            return 0, check_resource_xsd(resource).to_yaml(:indent => 4)
        else
            format_resource(resource, options)
            return 0
        end
    end

    def self.rname
        "ZONE"
    end

    def self.conf_file
        "onezone.yaml"
    end

    def self.state_to_str(id)
        id        = id.to_i
        state_str = Zone::ZONE_STATES[id]

        Zone::SHORT_ZONE_STATES[state_str]
    end

    def format_pool(options)
        config_file = self.class.table_conf

        table = CLIHelper::ShowTable.new(config_file, self) do
            column :CURRENT, "Active Zone", :size=>1 do |d|
                "*" if helper.client.one_endpoint.strip ==
                       d["TEMPLATE"]['ENDPOINT'].strip
            end

            column :ID, "ONE identifier for the Zone", :size=>5 do |d|
                d["ID"]
            end

            column :NAME, "Name of the Zone", :left, :size=>25 do |d|
                d["NAME"]
            end

            column :ENDPOINT, "Endpoint of the Zone", :left, :size=>45 do |d|
                d["TEMPLATE"]['ENDPOINT']
            end

            column :FED_INDEX, "Federation index", :left, :size=>10 do |d|
                helper.get_fed_index(d["TEMPLATE"]['ENDPOINT'])
            end

            column :STAT, 'Zone status', :left, :size => 6 do |d|
                OneZoneHelper.state_to_str(d['STATE'])
            end

            default :CURRENT, :ID, :NAME, :ENDPOINT, :FED_INDEX, :STAT
        end

        table
    end

    def get_fed_index(endpoint)
        client = OpenNebula::Client.new(nil, endpoint, :timeout => 5)
        xml    = client.call('zone.raftstatus')

        return '-' if OpenNebula.is_error?(xml)

        xml    = Nokogiri::XML(xml)

        if xml.xpath('RAFT/FEDLOG_INDEX')
            xml.xpath('RAFT/FEDLOG_INDEX').text
        else
            '-'
        end
    end

    def set_zone(zone_id, temporary_zone)
        zone = factory(zone_id)
        rc = zone.info

        if OpenNebula.is_error?(rc)
            return -1, rc.message
        end

        if !zone['TEMPLATE/ENDPOINT']
            return -1, "No Endpoint defined for Zone #{zone_id}"
        end

        if temporary_zone
            puts "Type: export ONE_XMLRPC=#{zone['TEMPLATE/ENDPOINT']}"
        else
            File.open(ENV['HOME']+"/.one/one_endpoint", 'w'){|f|
                f.puts zone['TEMPLATE/ENDPOINT']
            }
            puts "Endpoint changed to \"#{zone['TEMPLATE/ENDPOINT']}\" in " <<
                "#{ENV['HOME']}/.one/one_endpoint"
        end

        return 0 unless zone['TEMPLATE/ONEFLOW_ENDPOINT']

        # Set ONEFLOW_ENDPOINT
        if temporary_zone
            puts "Type: export ONEFLOW_URL=#{zone['TEMPLATE/ONEFLOW_ENDPOINT']}"
        else
            File.open(ENV['HOME'] + '/.one/oneflow_endpoint', 'w') do |f|
                f.puts zone['TEMPLATE/ONEFLOW_ENDPOINT']
            end

            puts 'OneFlow Endpoint changed to ' \
                 "\"#{zone['TEMPLATE/ONEFLOW_ENDPOINT']}\" in " <<
                 "#{ENV['HOME']}/.one/oneflow_endpoint"
        end

        0
    end

    private

    def factory(id=nil)
        if id
            OpenNebula::Zone.new_with_id(id, @client)
        else
            xml=OpenNebula::Zone.build_xml
            OpenNebula::Zone.new(xml, @client)
        end
    end

    def factory_pool(user_flag=-2)
        OpenNebula::ZonePool.new(@client)
    end

    def format_resource(zone, options = {})
        str="%-18s: %-20s"
        str_h1="%-80s"

        CLIHelper.print_header(str_h1 % "ZONE #{zone['ID']} INFORMATION")
        puts str % ["ID",   zone.id.to_s]
        puts str % ["NAME", zone.name]
        puts str % ["STATE",zone.state_str]
        puts

        zone_hash=zone.to_hash

        if zone.has_elements?("/ZONE/SERVER_POOL/SERVER")

            puts
            CLIHelper.print_header(str_h1 % "ZONE SERVERS",false)

            CLIHelper::ShowTable.new(nil, self) do

                column :"ID", "", :size=>2 do |d|
                    d["ID"] if !d.nil?
                end

                column :"NAME", "", :left, :size=>15 do |d|
                    d["NAME"] if !d.nil?
                end

                column :"ENDPOINT", "", :left, :size=>63 do |d|
                    d["ENDPOINT"] if !d.nil?
                end
            end.show([zone_hash['ZONE']['SERVER_POOL']['SERVER']].flatten, {})

            puts
            CLIHelper.print_header(str_h1 % "HA & FEDERATION SYNC STATUS",false)

            CLIHelper::ShowTable.new(nil, self) do

                column :"ID", "", :size=>2 do |d|
                    d["ID"] if !d.nil?
                end

                column :"NAME", "", :left, :size=>15 do |d|
                    d["NAME"] if !d.nil?
                end

                column :"STATE", "", :left, :size=>10 do |d|
                    d["STATE"] = case d["STATE"]
                        when "0" then "solo"
                        when "1" then "candidate"
                        when "2" then "follower"
                        when "3" then "leader"
                        else "error"
                    end
                    d["STATE"] if !d.nil?
                end

                column :"TERM", "", :left, :size=>10 do |d|
                    d["TERM"] if !d.nil?
                end

                column :"INDEX", "", :left, :size=>10 do |d|
                    d["LOG_INDEX"] if !d.nil?
                end

                column :"COMMIT", "", :left, :size=>10 do |d|
                    d["COMMIT"] if !d.nil?
                end

                column :"VOTE", "", :left, :size=>5 do |d|
                    d["VOTEDFOR"] if !d.nil?
                end

                column :"FED_INDEX", "", :left, :size=>10 do |d|
                    d["FEDLOG_INDEX"] if !d.nil?
                end

            end.show([zone_hash['ZONE']['SERVER_POOL']['SERVER']].flatten, {})
        end

        puts

        CLIHelper.print_header(str_h1 % "ZONE TEMPLATE", false)
        puts zone.template_str
    end
end
