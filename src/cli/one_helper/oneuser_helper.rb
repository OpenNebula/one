# -------------------------------------------------------------------------- #
# Copyright 2002-2011, OpenNebula Project Leads (OpenNebula.org)             #
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
                return -1, "Can not read file: #{arg}"
            end
        else
            if options[:plain]
                password = arg.gsub(/\s/, '')
            else
                password = Digest::SHA1.hexdigest(arg)
            end
        end

        return 0, password
    end

    def password(options)
        if options[:ssh]
            require 'ssh_auth'

            options[:key] ||= ENV['HOME']+'/.ssh/id_rsa'

            begin
                sshauth = SshAuth.new(:private_key=>options[:key])
            rescue Exception => e
                return -1, e.message
            end

            return 0, sshauth.public_key
        elsif options[:x509]
            require 'x509_auth'

            options[:cert] ||= ENV['X509_USER_CERT']

            begin
                cert     = [File.read(options[:cert])]
                x509auth = X509Auth.new(:certs_pem=>cert)
            rescue Exception => e
                return -1, e.message
            end

            return 0, x509auth.dn
        else
            return -1, "You have to specify an Auth method or define a password"
        end
    end

    def login(username, options)
        if options[:ssh]
            require 'ssh_auth'

            options[:key]  ||= ENV['HOME']+'/.ssh/id_rsa'

            begin
                auth = SshAuth.new(:private_key=>options[:key])
            rescue Exception => e
                return -1, e.message
            end
        elsif options[:x509]
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
        elsif options[:x509_proxy]
            require 'x509_auth'

            options[:proxy] ||= ENV['X509_PROXY_CERT']
            
            begin  
                proxy = File.read(options[:proxy])

                rc = proxy.scan(/(-+BEGIN CERTIFICATE-+\n[^-]*\n-+END CERTIFICATE-+)/)
                certs = rc.flatten!

                rc = proxy.match(/(-+BEGIN RSA PRIVATE KEY-+\n[^-]*\n-+END RSA PRIVATE KEY-+)/)

                key  = rc[1]

                auth = X509Auth.new(:cert=>certs, :key=>key)
            rescue => e
                return -1, e.message
            end
        else
            return -1, "You have to specify an Auth method"
        end
        
        options[:time] ||= 3600

        auth.login(username, options[:time])

        return 0, 'export ONE_AUTH=' << auth.class::LOGIN_PATH
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
        puts str % ["ID",       user.id.to_s]
        puts str % ["NAME",     user.name]
        puts str % ["GROUP",    user.gid]
        puts str % ["PASSWORD", user['PASSWORD']]
        puts str % ["ENABLED",
            OpenNebulaHelper.boolean_to_str(user['ENABLED'])]
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

            column :PASSWORD, "Password of the User", :size=>50 do |d|
                d['PASSWORD']
            end

            default :ID, :GROUP, :NAME, :PASSWORD
        end

        table
    end
end
