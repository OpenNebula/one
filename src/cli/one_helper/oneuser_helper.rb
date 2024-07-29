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
require 'one_helper/onequota_helper'

require 'digest/md5'

# Interface for OpenNebula generated tokens.
class TokenAuth
    def login_token(username, expire)
        return OpenNebulaHelper::OneHelper.get_password
    end
end

class OneUserHelper < OpenNebulaHelper::OneHelper
    if ENV['ONE_AUTH']
        ONE_AUTH = ENV['ONE_AUTH']
    else
        if ENV['HOME']
            ONE_AUTH = ENV['HOME']+'/.one/one_auth'
        else
            ONE_AUTH = "/var/lib/one/.one/one_auth"
        end
    end

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
            require 'opennebula/x509_auth'
            password = OpenNebula::X509Auth.escape_dn(password)
        end

        if options[:sha256] || options[:driver] == OpenNebula::User::CIPHER_AUTH
            require 'digest/sha2'
            password = Digest::SHA256.hexdigest(password)
        end

        return 0, password
    end

    def password(options)
        case options[:driver]
        when OpenNebula::User::SSH_AUTH
            if !options[:key]
                return -1, "You have to specify the --key option"
            end

            require 'opennebula/ssh_auth'

            begin
                auth = OpenNebula::SshAuth.new(:private_key=>options[:key])
            rescue Exception => e
                return -1, e.message
            end
        when OpenNebula::User::X509_AUTH
            options[:cert] ||= ENV['X509_USER_CERT']

            if !options[:cert]
                return -1, "You have to specify the --cert option"
            end

            require 'opennebula/x509_auth'

            begin
                cert = [File.read(options[:cert])]
                auth = OpenNebula::X509Auth.new(:certs_pem=>cert)
            rescue Exception => e
                return -1, e.message
            end
        else
            return 0, ''
        end

        return 0, auth.password
    end

    def auth_file(auth_string)
        auth_filename = Digest::MD5.hexdigest(auth_string)
        ENV['HOME'] + "/.one/#{auth_filename}.token"
    end

    def get_login_client(username, options)
        #-----------------------------------------------------------------------
        # Init the associated Authentication class to generate the token.
        #-----------------------------------------------------------------------
        case options[:driver]
        when OpenNebula::User::SSH_AUTH
            require 'opennebula/ssh_auth'

            options[:key]  ||= ENV['HOME']+'/.ssh/id_rsa'

            begin
                auth = OpenNebula::SshAuth.new(:private_key=>options[:key])
            rescue Exception => e
                return -1, e.message
            end

        when OpenNebula::User::X509_AUTH
            require 'opennebula/x509_auth'

            options[:cert] ||= ENV['X509_USER_CERT']
            options[:key]  ||= ENV['X509_USER_KEY']

            begin
                certs = [File.read(options[:cert])]
                key   = File.read(options[:key])

                auth = OpenNebula::X509Auth.new(:certs_pem=>certs, :key_pem=>key)
            rescue Exception => e
                return -1, e.message
            end

        when OpenNebula::User::X509_PROXY_AUTH
            require 'opennebula/x509_auth'

            options[:proxy] ||= ENV['X509_PROXY_CERT']

            begin
                proxy = File.read(options[:proxy])

                certs = proxy.scan(/(-+BEGIN CERTIFICATE-+\n[^-]*\n-+END CERTIFICATE-+)/)
                certs.flatten!

                rc = proxy.match(/(-+BEGIN RSA PRIVATE KEY-+\n[^-]*\n-+END RSA PRIVATE KEY-+)/)
                key= rc[1]

                auth = OpenNebula::X509Auth.new(:certs_pem=>certs, :key_pem=>key)
            rescue => e
                return -1, e.message
            end

        else
            auth = TokenAuth.new() #oned generated token
        end

        #-----------------------------------------------------------------------
        # Authenticate with oned using the token/passwd and set/generate the
        # authentication token for the user
        #-----------------------------------------------------------------------

        # This breaks the CLI SSL support for Ruby 1.8.7, but is necessary
        # in order to do template updates, otherwise you get the broken pipe
        # error (bug #3341)
        if RUBY_VERSION < '1.9'
            sync = false
        else
            sync = true
        end

        if options[:stdin_password]
            token = STDIN.read.strip
        else
            token = auth.login_token(username, options[:time])
        end

        OpenNebula::Client.new("#{username}:#{token}", nil, :sync => sync)
    end

    ############################################################################
    # Generates a token and stores it in ONE_AUTH path as defined in this class
    ############################################################################
    def login(username, options, use_client=false)
        if use_client
            login_client = OpenNebulaHelper::OneHelper.get_client
        else
            login_client = self.get_login_client(username, options)
        end

        if (login_client.is_a? Array) && login_client[0] == -1
            return login_client
        end

        user = OpenNebula::User.new(User.build_xml, login_client)

        egid = options[:group] || -1

        token_oned = user.login(username, "", options[:time], egid)

        return -1, token_oned.message if OpenNebula.is_error?(token_oned)

        token_info = "Authentication Token is:\n#{username}:#{token_oned}"

        #-----------------------------------------------------------------------
        # Check that ONE_AUTH target can be written
        #-----------------------------------------------------------------------
        if File.file?(ONE_AUTH) && !options[:force]
            puts "  * Do you want to overwrite the file #{ONE_AUTH}? (Y|N): "

            answer = STDIN.readline.chop

            case answer
            when 'Y', 'y', 'yes', 'YES', 'Yes'
                puts "overwriting #{ONE_AUTH} ..."
            when 'N', 'n', 'no', 'NO', 'No'
                return 0, "File #{ONE_AUTH} exists, use --force to overwrite."\
                "\n#{token_info}"
            else
                puts "Not valid option."
                return -1
            end
        end

        #-----------------------------------------------------------------------
        # Store the token in ONE_AUTH.
        #-----------------------------------------------------------------------
        begin
            FileUtils.mkdir_p(File.dirname(ONE_AUTH))
        rescue Errno::EEXIST
        end

        file = File.open(ONE_AUTH, "w")
        file.write("#{username}:#{token_oned}")
        file.close

        File.chmod(0600, ONE_AUTH)

        return 0, token_info
    end

    def format_pool(options)
        config_file = self.class.table_conf

        table = CLIHelper::ShowTable.new(config_file, self) do
            def pool_default_quotas(path)
                @data.dsearch('/USER_POOL/DEFAULT_USER_QUOTAS/'+path)
            end

            def quotas
                if !defined?(@quotas)
                    quotas = @data.dsearch('USER_POOL/QUOTAS')
                    @quotas = Hash.new

                    if (!quotas.nil?)
                        quotas = [quotas].flatten

                        quotas.each do |q|
                            @quotas[q['ID']] = q
                        end
                    end
                end
                @quotas
            end

            column :ID, "ONE identifier for the User", :size=>4 do |d|
                d["ID"]
            end

            column :NAME, "Name of the User", :left, :size=>15 do |d|
                d["NAME"]
            end

            column :ENABLED, "User is enabled", :left, :size=>4 do |d|
                if d["ENABLED"] == "1"
                    "yes"
                else
                    "no"
                end
            end

            column :GROUP, "Group of the User", :left, :size=>10 do |d|
                helper.group_name(d, options)
            end

            column :AUTH, "Auth driver of the User", :left, :size=>8 do |d|
                d["AUTH_DRIVER"]
            end

            column :VMS , "Number of VMS", :size=>9 do |d|
                begin
                    q = quotas[d['ID']]

                    if q['VM_QUOTA']['VM'].nil? && d["ID"].to_i != 0
                        q['VM_QUOTA']['VM'] = {
                            "VMS"                   => OneQuotaHelper::LIMIT_DEFAULT,
                            "VMS_USED"              => "0",
                            "CPU"                   => OneQuotaHelper::LIMIT_DEFAULT,
                            "CPU_USED"              => "0",
                            "MEMORY"                => OneQuotaHelper::LIMIT_DEFAULT,
                            "MEMORY_USED"           => "0",
                            "RUNNING_VMS"           => OneQuotaHelper::LIMIT_DEFAULT,
                            "RUNNING_VMS_USED"      => "0",
                            "RUNNING_CPU"           => OneQuotaHelper::LIMIT_DEFAULT,
                            "RUNNING_CPU_USED"      => "0",
                            "RUNNING_MEMORY"        => OneQuotaHelper::LIMIT_DEFAULT,
                            "RUNNING_MEMORY_USED"   => "0",
                            "SYSTEM_DISK_SIZE"      => OneQuotaHelper::LIMIT_DEFAULT,
                            "SYSTEM_DISK_SIZE_USED" => "0"
                        }

                        quotas[d['ID']] = q
                    end

                    limit = q['VM_QUOTA']['VM']["VMS"]

                    if limit == OneQuotaHelper::LIMIT_DEFAULT
                        limit = pool_default_quotas("VM_QUOTA/VM/VMS")
                        if limit.nil? || limit == ""
                            limit = OneQuotaHelper::LIMIT_UNLIMITED
                        end
                    end

                    if limit == OneQuotaHelper::LIMIT_UNLIMITED
                        "%3d /   -" % [q['VM_QUOTA']['VM']["VMS_USED"]]
                    else
                        "%3d / %3d" % [q['VM_QUOTA']['VM']["VMS_USED"], limit]
                    end

                rescue NoMethodError
                    "-"
                end
            end

            column :MEMORY, "Total memory allocated to user VMs", :size=>17 do |d|
                begin
                    q = quotas[d['ID']]

                    if q['VM_QUOTA']['VM'].nil? && d["ID"].to_i != 0
                        q['VM_QUOTA']['VM'] = {
                            "VMS"                   => OneQuotaHelper::LIMIT_DEFAULT,
                            "VMS_USED"              => "0",
                            "CPU"                   => OneQuotaHelper::LIMIT_DEFAULT,
                            "CPU_USED"              => "0",
                            "MEMORY"                => OneQuotaHelper::LIMIT_DEFAULT,
                            "MEMORY_USED"           => "0",
                            "RUNNING_VMS"           => OneQuotaHelper::LIMIT_DEFAULT,
                            "RUNNING_VMS_USED"      => "0",
                            "RUNNING_CPU"           => OneQuotaHelper::LIMIT_DEFAULT,
                            "RUNNING_CPU_USED"      => "0",
                            "RUNNING_MEMORY"        => OneQuotaHelper::LIMIT_DEFAULT,
                            "RUNNING_MEMORY_USED"   => "0",
                            "SYSTEM_DISK_SIZE"      => OneQuotaHelper::LIMIT_DEFAULT,
                            "SYSTEM_DISK_SIZE_USED" => "0"
                        }

                        quotas[d['ID']] = q
                    end

                    limit = q['VM_QUOTA']['VM']["MEMORY"]

                    if limit == OneQuotaHelper::LIMIT_DEFAULT
                        limit = pool_default_quotas("VM_QUOTA/VM/MEMORY")
                        if limit.nil? || limit == ""
                            limit = OneQuotaHelper::LIMIT_UNLIMITED
                        end
                    end

                    if limit == OneQuotaHelper::LIMIT_UNLIMITED
                        "%7s /       -" % [
                            OpenNebulaHelper.unit_to_str(q['VM_QUOTA']['VM']["MEMORY_USED"].to_i,{},"M")]
                    else
                        "%7s / %7s" % [
                            OpenNebulaHelper.unit_to_str(q['VM_QUOTA']['VM']["MEMORY_USED"].to_i,{},"M"),
                            OpenNebulaHelper.unit_to_str(limit.to_i,{},"M")]
                    end

                rescue NoMethodError
                    "-"
                end
            end

            column :CPU, "Total CPU allocated to user VMs", :size=>11 do |d|
                begin
                    q = quotas[d['ID']]

                    if q['VM_QUOTA']['VM'].nil? && d["ID"].to_i != 0
                        q['VM_QUOTA']['VM'] = {
                            "VMS"                   => OneQuotaHelper::LIMIT_DEFAULT,
                            "VMS_USED"              => "0",
                            "CPU"                   => OneQuotaHelper::LIMIT_DEFAULT,
                            "CPU_USED"              => "0",
                            "MEMORY"                => OneQuotaHelper::LIMIT_DEFAULT,
                            "MEMORY_USED"           => "0",
                            "RUNNING_VMS"           => OneQuotaHelper::LIMIT_DEFAULT,
                            "RUNNING_VMS_USED"      => "0",
                            "RUNNING_CPU"           => OneQuotaHelper::LIMIT_DEFAULT,
                            "RUNNING_CPU_USED"      => "0",
                            "RUNNING_MEMORY"        => OneQuotaHelper::LIMIT_DEFAULT,
                            "RUNNING_MEMORY_USED"   => "0",
                            "SYSTEM_DISK_SIZE"      => OneQuotaHelper::LIMIT_DEFAULT,
                            "SYSTEM_DISK_SIZE_USED" => "0"
                        }

                        quotas[d['ID']] = q
                    end

                    limit = q['VM_QUOTA']['VM']["CPU"]

                    if limit == OneQuotaHelper::LIMIT_DEFAULT
                        limit = pool_default_quotas("VM_QUOTA/VM/CPU")
                        if limit.nil? || limit == ""
                            limit = OneQuotaHelper::LIMIT_UNLIMITED
                        end
                    end

                    if limit == OneQuotaHelper::LIMIT_UNLIMITED
                        "%3.1f /   -" % [q['VM_QUOTA']['VM']["CPU_USED"]]
                    else
                        "%3.1f / %3.1f" % [q['VM_QUOTA']['VM']["CPU_USED"], limit]
                    end

                rescue NoMethodError
                    "-"
                end
            end

            column :PASSWORD, "Password of the User", :size=>50 do |d|
                d['PASSWORD']
            end

            default :ID, :NAME, :ENABLED, :GROUP, :AUTH, :VMS, :MEMORY, :CPU
        end

        table
    end

    def find_token(user, token, group=nil, show_expired=false)
        user_hash = user.to_hash

        valid_tokens = [user_hash["USER"]["LOGIN_TOKEN"]].flatten.compact

        return [] if valid_tokens.empty?

        valid_tokens.map! do |e|
            if token
                next if !e["TOKEN"].start_with?(token)
            end

            exp_time = e["EXPIRATION_TIME"].to_i
            if group
                next if e["EGID"].to_i != group.to_i
            end

            if !show_expired
                next if exp_time != -1 && Time.now > Time.at(exp_time)
            end

            e
        end.compact!

        # Sort the tokens so it returns first the one that will expire the
        # latest.

        valid_tokens.sort! do |a,b|
            a_exp = a["EXPIRATION_TIME"].to_i
            b_exp = b["EXPIRATION_TIME"].to_i

            if a_exp == -1 || b_exp == -1
                a_exp <=> b_exp
            else
                b_exp <=> a_exp
            end
        end

        valid_tokens
    end

    def get_client_user
        user = self.retrieve_resource(OpenNebula::User::SELF)
        rc   = user.info
        if OpenNebula.is_error?(rc)
            puts rc.message
            exit 1
        end
        user
    end

    def token_create(args, options)
        options[:time] ||= 36000

        if args[0]
            username = args[0]
            use_client = false
        else
            if !defined?(@@client)
                return -1, "No username in the argument or valid ONE_AUTH found."
            end

            user = self.get_client_user
            username = user['NAME']
            use_client = true
        end

        self.login(username, options, use_client)
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
        @user_pool = OpenNebula::UserPool.new(@client)
        return @user_pool
    end

    def format_resource(user, options = {})
        system = System.new(@client)

        str="%-16s: %-20s"
        str_h1="%-80s"

        CLIHelper.print_header(str_h1 % "USER #{user['ID']} INFORMATION")
        puts str % ["ID",          user.id.to_s]
        puts str % ["NAME",        user.name]
        puts str % ["GROUP",       user['GNAME']]
        groups = user.retrieve_elements("GROUPS/ID")
        puts str % ["SECONDARY GROUPS", groups.join(',') ] if groups.size > 1
        puts str % ["PASSWORD",    user['PASSWORD']]
        puts str % ["AUTH_DRIVER", user['AUTH_DRIVER']]
        puts str % ["ENABLED",
            OpenNebulaHelper.boolean_to_str(user['ENABLED'])]
        puts

        user_hash = user.to_hash
        client    = @client

        gid = user['GID']
        tokens = [user_hash['USER']['LOGIN_TOKEN']].flatten.compact

        CLIHelper.print_header(str_h1 % "TOKENS",false)
        if tokens && !tokens.empty?
            CLIHelper::ShowTable.new(nil, self) do
                column :ID, "", :size=>7 do |d|
                    d["TOKEN"]
                end

                column :EGID, "", :left, :size=>5 do |d|
                    d["EGID"].to_i == -1 ? "*" + gid : d["EGID"]
                end

                column :EGROUP, "", :left, :size=>10 do |d|
                    client = OpenNebulaHelper::OneHelper.get_client

                    egid = d["EGID"].to_i == -1 ? gid : d["EGID"]

                    group = Group.new_with_id(egid, client)
                    rc = group.info

                    if OpenNebula.is_error?(rc)
                        "-"
                    else
                        group['NAME']
                    end
                end

                column :EXPIRATION, "", :left, :size=>20 do |d|
                    etime = d["EXPIRATION_TIME"]
                    expired = Time.now >= Time.at(d["EXPIRATION_TIME"].to_i)
                    case etime
                    when nil  then ""
                    when "-1" then "forever"
                    else
                        if expired
                            "expired"
                        else
                            Time.at(etime.to_i).to_s
                        end
                    end
                end
            end.show(tokens,{})
        end

        puts

        CLIHelper.print_header(str_h1 % "USER TEMPLATE",false)
        puts user.template_str

        default_quotas = nil

        user.each('/USER/DEFAULT_USER_QUOTAS') { |elem|
            default_quotas = elem
        }

        helper = OneQuotaHelper.new(@client)
        helper.format_quota(user_hash['USER'], default_quotas, user.id)
    end

end
