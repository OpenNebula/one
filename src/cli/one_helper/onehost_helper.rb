# -------------------------------------------------------------------------- #
# Copyright 2002-2018, OpenNebula Project, OpenNebula Systems                #
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
require 'one_helper/onevm_helper'
require 'rubygems'

class OneHostHelper < OpenNebulaHelper::OneHelper
    TEMPLATE_XPATH  = '//HOST/TEMPLATE'
    HYBRID = {
        :ec2 => {
            :help => <<-EOT.unindent,
                #-----------------------------------------------------------------------
                # Supported EC2 AUTH ATTRIBUTTES:
                #
                #  REGION_NAME = <the name of the ec2 region>
                #
                #  EC2_ACCESS = <Your ec2 access key id>
                #  EC2_SECRET = <Your ec2 secret key>
                #
                #  CAPACITY = [
                #    M1_SMALL  = <number of machines m1.small>,
                #    M1_XLARGE = <number of machines m1.xlarge>,
                #    M1_LARGE  = <number of machines m1.large>
                #  ]
                #
                # You can set any machine type supported by ec2
                # See your ec2_driver.conf for more information
                #
                #-----------------------------------------------------------------------
                EOT
        },
        :az => {
            :help => <<-EOT.unindent,
                #-----------------------------------------------------------------------
                # Supported AZURE AUTH ATTRIBUTTES:
                #
                #  AZ_ID   = <azure classic id>
                #  AZ_CERT = <azure classic certificate>
                #
                #  REGION_NAME = <the name of the azure region>
                #
                #  CAPACITY = [
                #    Small = <number of small machines>,
                #    Medium = <number of medium machines>,
                #    Large = <number of large machines
                #  ]
                #
                # You can set any machine type supported by azure classic
                # See your az_driver.conf for more information
                #
                # Optionally you can set a endpoint
                #
                #  AZ_ENDPOINT = <endpoint address>
                #
                #-----------------------------------------------------------------------
                EOT
        }
    }


    VERSION_XPATH   = "#{TEMPLATE_XPATH}/VERSION"

    def self.rname
        "HOST"
    end

    def self.conf_file
        "onehost.yaml"
    end

    def self.state_to_str(id)
        id        = id.to_i
        state_str = Host::HOST_STATES[id]

        return Host::SHORT_HOST_STATES[state_str]
    end

    def format_pool(options)
        config_file = self.class.table_conf

        table = CLIHelper::ShowTable.new(config_file, self) do
            column :ID, "ONE identifier for Host", :size=>4 do |d|
                d["ID"]
            end

            column :NAME, "Name of the Host", :left, :size=>15 do |d|
                d["NAME"]
            end

            column :CLUSTER, "Name of the Cluster", :left, :size=>9 do |d|
                OpenNebulaHelper.cluster_str(d["CLUSTER"])
            end

            column :RVM, "Number of Virtual Machines running", :size=>3 do |d|
                d["HOST_SHARE"]["RUNNING_VMS"]
            end

            column :ZVM, "Number of Virtual Machine zombies", :size=>3 do |d|
                d["TEMPLATE"]["TOTAL_ZOMBIES"] || 0
            end

            column :TCPU, "Total CPU percentage", :size=>4 do |d|
                d["HOST_SHARE"]["MAX_CPU"]
            end

            column :FCPU, "Free CPU percentage", :size=>4 do |d|
                d["HOST_SHARE"]["MAX_CPU"].to_i-
                    d["HOST_SHARE"]["USED_CPU"].to_i
            end

            column :ACPU, "Available cpu percentage (not reserved by VMs)",
                    :size=>4 do |d|
                max_cpu=d["HOST_SHARE"]["MAX_CPU"].to_i
                max_cpu=100 if max_cpu==0
                max_cpu-d["HOST_SHARE"]["CPU_USAGE"].to_i
            end

            column :TMEM, "Total Memory", :size=>7 do |d|
                OpenNebulaHelper.unit_to_str(
                    d["HOST_SHARE"]["MAX_MEM"].to_i,
                    options)
            end

            column :FMEM, "Free Memory", :size=>7 do |d|
                OpenNebulaHelper.unit_to_str(
                    d["HOST_SHARE"]["FREE_MEM"].to_i,
                    options)
            end

            column :AMEM, "Available Memory (not reserved by VMs)",
                    :size=>7 do |d|
                acpu=d["HOST_SHARE"]["MAX_MEM"].to_i-
                    d["HOST_SHARE"]["MEM_USAGE"].to_i
                OpenNebulaHelper.unit_to_str(acpu,options)
            end

            column :REAL_CPU, "Real CPU", :size=>18 do |d|
                max_cpu  = d["HOST_SHARE"]["MAX_CPU"].to_i

                if max_cpu != 0
                    used_cpu = d["HOST_SHARE"]["USED_CPU"].to_i
                    ratio    = (used_cpu*100) / max_cpu
                    "#{used_cpu} / #{max_cpu} (#{ratio}%)"
                else
                    '-'
                end
            end

            column :ALLOCATED_CPU, "Allocated CPU)", :size=>18 do |d|
                max_cpu  = d["HOST_SHARE"]["MAX_CPU"].to_i
                cpu_usage = d["HOST_SHARE"]["CPU_USAGE"].to_i

                if max_cpu == 0 && cpu_usage == 0
                    '-'
                else
                    cpu_usage = d["HOST_SHARE"]["CPU_USAGE"].to_i

                    if max_cpu != 0
                        ratio    = (cpu_usage*100) / max_cpu
                        "#{cpu_usage} / #{max_cpu} (#{ratio}%)"
                    else
                        "#{cpu_usage} / -"
                    end
                end
            end

            column :REAL_MEM, "Real MEM", :size=>18 do |d|
                max_mem  = d["HOST_SHARE"]["MAX_MEM"].to_i

                if max_mem != 0
                    used_mem = d["HOST_SHARE"]["USED_MEM"].to_i
                    ratio    = (used_mem*100) / max_mem
                    "#{OpenNebulaHelper.unit_to_str(used_mem,options)} / #{OpenNebulaHelper.unit_to_str(max_mem,options)} (#{ratio}%)"
                else
                    '-'
                end
            end

            column :ALLOCATED_MEM, "Allocated MEM", :size=>18 do |d|
                max_mem  = d["HOST_SHARE"]["MAX_MEM"].to_i
                mem_usage = d["HOST_SHARE"]["MEM_USAGE"].to_i

                if max_mem == 0 && mem_usage == 0
                    '-'
                else
                    if max_mem != 0
                        ratio    = (mem_usage*100) / max_mem
                        "#{OpenNebulaHelper.unit_to_str(mem_usage,options)} / #{OpenNebulaHelper.unit_to_str(max_mem,options)} (#{ratio}%)"
                    else
                        "#{OpenNebulaHelper.unit_to_str(mem_usage,options)} / -"
                    end
                end
            end

            column :STAT, "Host status", :left, :size=>6 do |d|
                OneHostHelper.state_to_str(d["STATE"])
            end

            default :ID, :NAME, :CLUSTER, :RVM, :ALLOCATED_CPU, :ALLOCATED_MEM, :STAT
        end

        table
    end

    def set_hybrid(type, path)
        k = type.to_sym
        if HYBRID.key?(k)
            str = path.nil? ?  OpenNebulaHelper.editor_input(HYBRID[k][:help]): File.read(path)
        end
    end

    NUM_THREADS = 15
    def sync(host_ids, options)
        if `id -u`.to_i == 0 || `id -G`.split.collect{|e| e.to_i}.include?(0)
            STDERR.puts("Cannot run 'onehost sync' as root")
            exit -1
        end

        begin
            current_version = File.read(REMOTES_LOCATION+'/VERSION').strip
        rescue
            STDERR.puts("Could not read #{REMOTES_LOCATION}/VERSION")
            exit(-1)
        end

        if current_version.empty?
            STDERR.puts "Remotes version can not be empty"
            exit(-1)
        end

        begin
            current_version = Gem::Version.new(current_version)
        rescue
            STDERR.puts "VERSION file is malformed, use semantic versioning."
        end

        cluster_id = options[:cluster]

        # Get remote_dir (implies oneadmin group)
        rc = OpenNebula::System.new(@client).get_configuration
        return -1, rc.message if OpenNebula.is_error?(rc)

        conf = rc
        remote_dir = conf['SCRIPTS_REMOTE_DIR']

        # Verify the existence of REMOTES_LOCATION
        if !File.directory? REMOTES_LOCATION
            error_msg = "'#{REMOTES_LOCATION}' does not exist. " <<
                            "This command must be run in the frontend."
            return -1,error_msg
        end

        # Touch the update file
        FileUtils.touch(File.join(REMOTES_LOCATION,'.update'))

        # Get the Host pool
        filter_flag ||= OpenNebula::Pool::INFO_ALL

        pool = factory_pool(filter_flag)

        rc = pool.info
        return -1, rc.message if OpenNebula.is_error?(rc)

        # Assign hosts to threads
        i = 0
        queue = Array.new

        pool.each do |host|
            if host_ids
                next if !host_ids.include?(host['ID'].to_i)
            elsif cluster_id
                next if host['CLUSTER_ID'].to_i != cluster_id
            end

            vm_mad = host['VM_MAD'].downcase
            remote_remotes = host['TEMPLATE/REMOTE_REMOTES']
            state = host['STATE']

            # Skip this host from remote syncing if it's a PUBLIC_CLOUD host
            next if host['TEMPLATE/PUBLIC_CLOUD'] == 'YES'

            # Skip this host from remote syncing if it's OFFLINE
            next if Host::HOST_STATES[state.to_i] == 'OFFLINE'

            host_version=host['TEMPLATE/VERSION']

            begin
                host_version = Gem::Version.new(host_version)
            rescue
            end

            if !options[:force]
                begin
                    next if host_version && host_version >= current_version
                rescue
                    STDERR.puts "Error comparing versions for host #{host['NAME']}."
                end
            end

            puts "* Adding #{host['NAME']} to upgrade"

            queue << host
        end

        # Run the jobs in threads
        host_errors = Array.new
        queue_lock = Mutex.new
        error_lock = Mutex.new
        total = queue.length

        if total==0
            puts "No hosts are going to be updated."
            exit(0)
        end

        ts = (1..NUM_THREADS).map do |t|
            Thread.new do
                while true do
                    host = nil
                    size = 0

                    queue_lock.synchronize do
                        host=queue.shift
                        size=queue.length
                    end

                    break if !host

                    print_update_info(total-size, total, host['NAME'])

                    if options[:rsync]
                        sync_cmd = "rsync -Laz --delete #{REMOTES_LOCATION}" <<
                            " #{host['NAME']}:#{remote_dir}"
                    else
                        sync_cmd = "scp -rp #{REMOTES_LOCATION}/. " <<
                            "#{host['NAME']}:#{remote_dir} 2> /dev/null"
                    end

                    `#{sync_cmd} 2>/dev/null`

                    if !$?.success?
                        error_lock.synchronize {
                            host_errors << host['NAME']
                        }
                    else
                        update_version(host, current_version)
                    end
                end
            end
        end

        # Wait for threads to finish
        ts.each{|t| t.join}

        puts

        if host_errors.empty?
            puts "All hosts updated successfully."
            0
        else
            STDERR.puts "Failed to update the following hosts:"
            host_errors.each{|h| STDERR.puts "* #{h}"}
            -1
        end
    end

    private

    def print_update_info(current, total, host)
        bar_length=40

        percentage=current.to_f/total.to_f
        done=(percentage*bar_length).floor

        bar="["
        bar+="="*done
        bar+="-"*(bar_length-done)
        bar+="]"

        info="#{current}/#{total}"

        str="#{bar} #{info} "
        name=host[0..(79-str.length)]
        str=str+name
        str=str+" "*(80-str.length)

        print "#{str}\r"
        STDOUT.flush
    end

    def update_version(host, version)
        if host.has_elements?(VERSION_XPATH)
            host.delete_element(VERSION_XPATH)
        end

        host.add_element(TEMPLATE_XPATH, 'VERSION' => version)

        template=host.template_str
        host.update(template)
    end

    def factory(id=nil)
        if id
            OpenNebula::Host.new_with_id(id, @client)
        else
            xml=OpenNebula::Host.build_xml
            OpenNebula::Host.new(xml, @client)
        end
    end

    def factory_pool(user_flag=-2)
        #TBD OpenNebula::HostPool.new(@client, user_flag)
        OpenNebula::HostPool.new(@client)
    end

    def format_resource(host, options = {})
        str    = "%-22s: %-20s"
        str_h1 = "%-80s"

        CLIHelper.print_header(
            str_h1 % "HOST #{host.id.to_s} INFORMATION", true)

        puts str % ["ID", host.id.to_s]
        puts str % ["NAME", host.name]
        puts str % ["CLUSTER", OpenNebulaHelper.cluster_str(host['CLUSTER'])]
        puts str % ["STATE", host.state_str]
        puts str % ["IM_MAD", host['IM_MAD']]
        puts str % ["VM_MAD", host['VM_MAD']]
        puts str % ["LAST MONITORING TIME", OpenNebulaHelper.time_to_str(host['LAST_MON_TIME'])]
        puts

        CLIHelper.print_header(str_h1 % "HOST SHARES", false)
        puts str % ["RUNNING VMS", host['HOST_SHARE/RUNNING_VMS']]

        CLIHelper.print_header(str_h1 % "MEMORY", false)
          puts str % ["  TOTAL", OpenNebulaHelper.unit_to_str(host['HOST_SHARE/TOTAL_MEM'].to_i, {})]
          puts str % ["  TOTAL +/- RESERVED", OpenNebulaHelper.unit_to_str(host['HOST_SHARE/MAX_MEM'].to_i, {})]
          puts str % ["  USED (REAL)", OpenNebulaHelper.unit_to_str(host['HOST_SHARE/USED_MEM'].to_i, {})]
          puts str % ["  USED (ALLOCATED)", OpenNebulaHelper.unit_to_str(host['HOST_SHARE/MEM_USAGE'].to_i, {})]

        CLIHelper.print_header(str_h1 % "CPU", false)
          puts str % ["  TOTAL", host['HOST_SHARE/TOTAL_CPU']]
          puts str % ["  TOTAL +/- RESERVED", host['HOST_SHARE/MAX_CPU']]
          puts str % ["  USED (REAL)", host['HOST_SHARE/USED_CPU']]
          puts str % ["  USED (ALLOCATED)", host['HOST_SHARE/CPU_USAGE']]
        puts

        datastores = host.to_hash['HOST']['HOST_SHARE']['DATASTORES']['DS']

        if datastores.nil?
            datastores = []
        else
            datastores = [datastores].flatten
        end

        datastores.each do |datastore|
            CLIHelper.print_header(str_h1 % "LOCAL SYSTEM DATASTORE ##{datastore['ID']} CAPACITY", false)
            puts str % ["TOTAL:", OpenNebulaHelper.unit_to_str(datastore['TOTAL_MB'].to_i, {},'M')]
            puts str % ["USED: ", OpenNebulaHelper.unit_to_str(datastore['USED_MB'].to_i, {},'M')]
            puts str % ["FREE:",  OpenNebulaHelper.unit_to_str(datastore['FREE_MB'].to_i, {},'M')]
            puts
        end

        CLIHelper.print_header(str_h1 % "MONITORING INFORMATION", false)

        wilds = host.wilds

        begin
            pcis = [host.to_hash['HOST']['HOST_SHARE']['PCI_DEVICES']['PCI']]
            pcis = pcis.flatten.compact
        rescue
            pcis = nil
        end

        host.delete_element("TEMPLATE/VM")
        host.delete_element("TEMPLATE_WILDS")

        puts host.template_str

        if pcis && !pcis.empty?
            print_pcis(pcis)
        end

        puts
        CLIHelper.print_header("WILD VIRTUAL MACHINES", false)
        puts

        format = "%-30.30s %36s %4s %10s"
        CLIHelper.print_header(format % ["NAME", "IMPORT_ID", "CPU", "MEMORY"],
                               true)

        wilds.each do |wild|
          if wild['IMPORT_TEMPLATE']
            wild_tmplt = Base64::decode64(wild['IMPORT_TEMPLATE']).split("\n")
            name   = wild['VM_NAME']
            import = wild_tmplt.select { |line|
                       line[/^IMPORT_VM_ID/]
                     }[0].split("=")[1].gsub("\"", " ").strip
            memory = wild_tmplt.select { |line|
                       line[/^MEMORY/]
                     }[0].split("=")[1].gsub("\"", " ").strip
            cpu    = wild_tmplt.select { |line|
                        line[/^CPU/]
                     }[0].split("=")[1].gsub("\"", " ").strip
          else
            name     = wild['DEPLOY_ID']
            import   = memory = cpu = "-"
          end

          puts format % [name, import, cpu, memory]
        end

        puts
        CLIHelper.print_header("VIRTUAL MACHINES", false)
        puts

        onevm_helper=OneVMHelper.new
        onevm_helper.client=@client
        onevm_helper.list_pool({:filter=>["HOST=#{host.name}"]}, false)
    end

    def print_pcis(pcis)
        puts
        CLIHelper.print_header("PCI DEVICES", false)
        puts

        table=CLIHelper::ShowTable.new(nil, self) do
            column :VM, "Used by VM", :size => 5, :left => false do |d|
                if d["VMID"] == "-1"
                    ""
                else
                    d["VMID"]
                end
            end

            column :ADDR, "PCI Address", :size => 7, :left => true do |d|
                d["SHORT_ADDRESS"]
            end

            column :TYPE, "Type", :size => 14, :left => true do |d|
                d["TYPE"]
            end

            column :CLASS, "Class", :size => 12, :left => true do |d|
                d["CLASS_NAME"]
            end

            column :NAME, "Name", :size => 50, :left => true do |d|
                d["DEVICE_NAME"]
            end

            column :VENDOR, "Vendor", :size => 8, :left => true do |d|
                d["VENDOR_NAME"]
            end

            default :VM, :ADDR, :TYPE, :NAME

        end

        table.show(pcis)
    end
end
