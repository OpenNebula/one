# -------------------------------------------------------------------------- #
# Copyright 2002-2012, OpenNebula Project Leads (OpenNebula.org)             #
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

class OneUserHelper < OpenNebulaHelper::OneHelper
    def self.rname
        "USER"
    end

    def self.conf_file
        "oneuser.yaml"
    end

    def self.password_to_str_desc
        "User password"
    end

    def self.password_to_str(arg, options)
        if options[:read_file]
            begin
                password = File.read(arg).split("\n").first
            rescue
                return -1, "Cannot read file: #{arg}"
            end
        else
            password = arg.dup
        end

        if options[:driver] == OpenNebula::User::X509_AUTH
            password.delete!("\s")
        end

        if options[:sha1] || options[:driver] == OpenNebula::User::CIPHER_AUTH
            require 'digest/sha1'
            password = Digest::SHA1.hexdigest(password)
        end

        return 0, password
    end

    def password(options)
        case options[:driver]
        when OpenNebula::User::SSH_AUTH
            if !options[:key]
                return -1, "You have to specify the --key option"
            end

            require 'ssh_auth'

            begin
                auth = SshAuth.new(:private_key=>options[:key])
            rescue Exception => e
                return -1, e.message
            end
        when OpenNebula::User::X509_AUTH
            options[:cert] ||= ENV['X509_USER_CERT']

            if !options[:cert]
                return -1, "You have to specify the --cert option"
            end

            require 'x509_auth'

            begin
                cert = [File.read(options[:cert])]
                auth = X509Auth.new(:certs_pem=>cert)
            rescue Exception => e
                return -1, e.message
            end
        else
            return -1, "You have to specify an Auth method or define a password"
        end

        return 0, auth.password
    end

    def self.login(username, options)
        case options[:driver]
        when OpenNebula::User::SSH_AUTH
            require 'ssh_auth'

            options[:key]  ||= ENV['HOME']+'/.ssh/id_rsa'

            begin
                auth = SshAuth.new(:private_key=>options[:key])
            rescue Exception => e
                return -1, e.message
            end
        when OpenNebula::User::X509_AUTH
            require 'x509_auth'

            options[:cert] ||= ENV['X509_USER_CERT']
            options[:key]  ||= ENV['X509_USER_KEY']

            begin
                certs = [File.read(options[:cert])]
                key   = File.read(options[:key])

                auth = X509Auth.new(:certs_pem=>certs, :key_pem=>key)
            rescue Exception => e
                return -1, e.message
            end
        when OpenNebula::User::X509_PROXY_AUTH
            require 'x509_auth'

            options[:proxy] ||= ENV['X509_PROXY_CERT']

            begin
                proxy = File.read(options[:proxy])

                certs = proxy.scan(/(-+BEGIN CERTIFICATE-+\n[^-]*\n-+END CERTIFICATE-+)/)
                certs.flatten!

                rc = proxy.match(/(-+BEGIN RSA PRIVATE KEY-+\n[^-]*\n-+END RSA PRIVATE KEY-+)/)
                key= rc[1]

                auth = X509Auth.new(:certs_pem=>certs, :key_pem=>key)
            rescue => e
                return -1, e.message
            end
        else
            return -1, "You have to specify an Auth method"
        end

        options[:time] ||= 3600

        auth.login(username, Time.now+options[:time])

        return 0, 'export ONE_AUTH=' << auth.class::LOGIN_PATH
    end

    def format_pool(options)
        config_file = self.class.table_conf

        table = CLIHelper::ShowTable.new(config_file, self) do
            column :ID, "ONE identifier for the User", :size=>4 do |d|
                d["ID"]
            end

            column :NAME, "Name of the User", :left, :size=>15 do |d|
                d["NAME"]
            end

            column :GROUP, "Group of the User", :left, :size=>8 do |d|
                helper.group_name(d, options)
            end

            column :AUTH, "Auth driver of the User", :left, :size=>8 do |d|
                d["AUTH_DRIVER"]
            end

            column :VMS, "Number of VMS", :size=>8 do |d|             
                if d.has_key?('VM_QUOTA') and d['VM_QUOTA'].has_key?('VM')
                    d['VM_QUOTA']['VM']['VMS']
                else
                    "0"
                end                
            end

            column :MEMORY, "Total memory allocated to user VMs", :size=>8 do |d|
                if d.has_key?('VM_QUOTA') and d['VM_QUOTA'].has_key?('VM')
                    d['VM_QUOTA']['VM']['MEMORY_USED']
                else
                    "0"
                end
            end

            column :CPU, "Total CPU allocated to user VMs", :size=>8 do |d|
                if d.has_key?('VM_QUOTA') and d['VM_QUOTA'].has_key?('VM')
                    d['VM_QUOTA']['VM']['CPU_USED']
                else
                    "0"
                end
            end

            column :PASSWORD, "Password of the User", :size=>50 do |d|
                d['PASSWORD']
            end

            default :ID, :GROUP, :NAME, :AUTH, :VMS, :MEMORY, :CPU
        end

        table
    end

    def format_ds_quota()
        table = CLIHelper::ShowTable.new(nil, self) do
            column :"DATASTORE ID", "", :left, :size=>12 do |d|
                d["ID"] if !d.nil?
            end

            column :"IMAGES (used)", "", :right, :size=>14 do |d|
                d["IMAGES_USED"] if !d.nil?
            end

            column :"IMAGES (limit)", "", :right, :size=>14 do |d|
                d["IMAGES"] if !d.nil?
            end

            column :"SIZE (used)", "", :right, :size=>14 do |d|
                d["SIZE_USED"] if !d.nil?
            end

            column :"SIZE (limit)", "", :right, :size=>14 do |d|
                d["SIZE"] if !d.nil?
            end
        end

        table
    end

    def format_net_quota()
        table = CLIHelper::ShowTable.new(nil, self) do
            column :"NETWORK ID", "", :left, :size=>12 do |d|
                d["ID"] if !d.nil?
            end

            column :"LEASES (used)", "", :right, :size=>14 do |d|
                d["LEASES_USED"] if !d.nil?
            end

            column :"LEASES (limit)", "", :right, :size=>14 do |d|
                d["LEASES"] if !d.nil?
            end
        end

        table
    end

    def format_vm_quota()
        table = CLIHelper::ShowTable.new(nil, self) do
            column :"VMS", "", :left, :size=>12 do |d|
                d["VMS"] if !d.nil?
            end

            column :"MEMORY (used)", "", :right, :size=>14 do |d|
                d["MEMORY_USED"] if !d.nil?
            end

            column :"MEMORY (limit)", "", :right, :size=>14 do |d|
                d["MEMORY"] if !d.nil?
            end

            column :"CPU (used)", "", :right, :size=>14 do |d|
                d["CPU_USED"] if !d.nil?
            end

            column :"CPU (limit)", "", :right, :size=>14 do |d|
                d["CPU"] if !d.nil?
            end
        end

        table
    end

    def format_image_quota()
        table = CLIHelper::ShowTable.new(nil, self) do
            column :"IMAGE ID", "", :left, :size=>12 do |d|
                d["ID"] if !d.nil?
            end

            column :"RVMS (used)", "", :right, :size=>14 do |d|
                d["INSTANCES_USED"] if !d.nil?
            end

            column :"RVMS (limit)", "", :right, :size=>14 do |d|
                d["INSTANCES"] if !d.nil?
            end
        end

        table
    end

    HELP_QUOTA = <<-EOT.unindent
        #-----------------------------------------------------------------------
        # Supported quota limits for users
        #-----------------------------------------------------------------------
        #  DATASTORE = [
        #    ID     = <ID of the datastore>
        #    IMAGES = <Max. number of images in the datastore>
        #    SIZE   = <Max. storage capacity (Mb) used in the datastore>
        #  ]
        #
        #  VM = [
        #    VMS    = <Max. number of VMs>
        #    MEMORY = <Max. allocated memory (Mb)>
        #    CPU    = <Max. allocated CPU>
        #  ]
        #
        #  NETWORK = [
        #    ID     = <ID of the network>
        #    LEASES = <Max. number of IP leases from the network>
        #  ]
        #
        #  IMAGE = [
        #    ID        = <ID of the image>
        #    RVMS = <Max. number of VMs using the image>
        #  ]
        #
        #  In any quota 0 means unlimited. The usage counters "*_USED" are
        #  shown for information purposes and will NOT be modified.
        #-----------------------------------------------------------------------
    EOT

    def self.set_quota(id, resource, path)
        unless path
            require 'tempfile'

            tmp  = Tempfile.new(id.to_s)
            path = tmp.path

            rc = resource.info

            if OpenNebula.is_error?(rc)
                puts rc.message
                exit -1
            end

            tmp << HELP_QUOTA
            tmp << resource.template_like_str("DATASTORE_QUOTA") << "\n"
            tmp << resource.template_like_str("VM_QUOTA") << "\n"
            tmp << resource.template_like_str("NETWORK_QUOTA") << "\n"
            tmp << resource.template_like_str("IMAGE_QUOTA") << "\n"

            tmp.flush

            editor_path = ENV["EDITOR"] ? ENV["EDITOR"] : EDITOR_PATH
            system("#{editor_path} #{path}")

            unless $?.exitstatus == 0
                puts "Editor not defined"
                exit -1
            end

            tmp.close
        end

        str = File.read(path)
        str
    end

    private

    def factory(id=nil)
        if id
            OpenNebula::User.new_with_id(id, @client)
        else
            xml=OpenNebula::User.build_xml
            OpenNebula::User.new(xml, @client)
        end
    end

    def factory_pool(user_flag=-2)
        #TBD OpenNebula::UserPool.new(@client, user_flag)
        OpenNebula::UserPool.new(@client)
    end

    def format_resource(user)
        str="%-15s: %-20s"
        str_h1="%-80s"

        CLIHelper.print_header(str_h1 % "USER #{user['ID']} INFORMATION")
        puts str % ["ID",          user.id.to_s]
        puts str % ["NAME",        user.name]
        puts str % ["GROUP",       user['GNAME']]
        puts str % ["PASSWORD",    user['PASSWORD']]
        puts str % ["AUTH_DRIVER", user['AUTH_DRIVER']]

        puts str % ["ENABLED",
            OpenNebulaHelper.boolean_to_str(user['ENABLED'])]

        puts

        CLIHelper.print_header(str_h1 % "USER TEMPLATE",false)
        puts user.template_str

        user_hash = user.to_hash

        puts

        CLIHelper.print_header(str_h1 % "RESOURCE USAGE & QUOTAS",false)

        puts

        ds_quotas = [user_hash['USER']['DATASTORE_QUOTA']['DATASTORE']].flatten
        if !ds_quotas[0].nil?
            table_ds = format_ds_quota
            table_ds.show(ds_quotas, {})
            puts
        end

        vm_quotas = [user_hash['USER']['VM_QUOTA']['VM']].flatten
        if !vm_quotas[0].nil?
            table_net = format_vm_quota
            table_net.show(vm_quotas, {})
            puts
        end

        net_quotas = [user_hash['USER']['NETWORK_QUOTA']['NETWORK']].flatten
        if !net_quotas[0].nil?
            table_net = format_net_quota
            table_net.show(net_quotas, {})
            puts
        end

        image_quotas = [user_hash['USER']['IMAGE_QUOTA']['IMAGE']].flatten
        if !image_quotas[0].nil?
            table_image = format_image_quota
            table_image.show(image_quotas, {})
        end

    end
end
