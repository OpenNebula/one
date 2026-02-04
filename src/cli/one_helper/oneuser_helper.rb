# -------------------------------------------------------------------------- #
# Copyright 2002-2025, OpenNebula Project, OpenNebula Systems                #
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
require 'opennebula/user'
require 'opennebula/user_pool'

require 'fileutils'
require 'digest/md5'

# Interface for OpenNebula generated tokens.
class TokenAuth

    def login_token(_username, _expire)
        return OpenNebulaHelper::OneHelper.get_password
    end

end

# CLI helper for oneuser command
class OneUserHelper < OpenNebulaHelper::OneHelper

    if ENV['ONE_AUTH']
        ONE_AUTH = ENV['ONE_AUTH']
    else
        if Dir.home
            ONE_AUTH = Dir.home + '/.one/one_auth'
        else
            ONE_AUTH = '/var/lib/one/.one/one_auth'
        end
    end

    def self.rname
        'USER'
    end

    def self.conf_file
        'oneuser.yaml'
    end

    def self.password_to_str_desc
        'User password'
    end

    def self.password_to_str(arg, options)
        if options[:read_file]
            begin
                password = File.read(arg).split("\n").first
            rescue StandardError
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
                return -1, 'You have to specify the --key option'
            end

            require 'opennebula/ssh_auth'

            begin
                auth = OpenNebula::SshAuth.new(:private_key=>options[:key])
            rescue StandardError => e
                return -1, e.message
            end
        when OpenNebula::User::X509_AUTH
            options[:cert] ||= ENV['X509_USER_CERT']

            if !options[:cert]
                return -1, 'You have to specify the --cert option'
            end

            require 'opennebula/x509_auth'

            begin
                cert = [File.read(options[:cert])]
                auth = OpenNebula::X509Auth.new(:certs_pem=>cert)
            rescue StandardError => e
                return -1, e.message
            end
        else
            return 0, ''
        end

        return 0, auth.password
    end

    def auth_file(auth_string)
        auth_filename = Digest::MD5.hexdigest(auth_string)
        Dir.home + "/.one/#{auth_filename}.token"
    end

    def get_login_client(username, options)
        #-----------------------------------------------------------------------
        # Init the associated Authentication class to generate the token.
        #-----------------------------------------------------------------------
        case options[:driver]
        when OpenNebula::User::SSH_AUTH
            require 'opennebula/ssh_auth'

            options[:key] ||= Dir.home + '/.ssh/id_rsa'

            begin
                auth = OpenNebula::SshAuth.new(:private_key=>options[:key])
            rescue StandardError => e
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
            rescue StandardError => e
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
            rescue StandardError => e
                return -1, e.message
            end

        else
            auth = TokenAuth.new # oned generated token
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
    def login(username, options, use_client = false)
        if use_client
            login_client = OpenNebulaHelper::OneHelper.get_client
        else
            login_client = get_login_client(username, options)
        end

        if (login_client.is_a? Array) && login_client[0] == -1
            return login_client
        end

        user = OpenNebula::User.new(User.build_xml, login_client)

        egid = options[:group] || -1

        token_oned = user.login(username, '', options[:time], egid)

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
                puts 'Not valid option.'
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

        file = File.open(ONE_AUTH, 'w')
        file.write("#{username}:#{token_oned}")
        file.close

        File.chmod(0o0600, ONE_AUTH)

        return 0, token_info
    end

    def format_pool(options)
        config_file = self.class.table_conf

        # rubocop:disable Style/FormatStringToken
        CLIHelper::ShowTable.new(config_file, self) do
            pool_default_quotas = lambda do |path|
                limit = @data.dsearch('/USER_POOL/DEFAULT_USER_QUOTAS/'+path)
                limit = OneQuotaHelper::LIMIT_UNLIMITED if limit.nil? || limit.empty?
                limit
            end

            quotas_proc = lambda do
                if !defined?(@quotas)
                    quotas = @data.dsearch('USER_POOL/QUOTAS')
                    @quotas = {}

                    if !quotas.nil?
                        quotas = [quotas].flatten

                        quotas.each do |q|
                            # Fix rare bug, when there are multiple VM_QUOTA values
                            vm_quota = q['VM_QUOTA']
                            if vm_quota.is_a?(Array)
                                q['VM_QUOTA'] = vm_quota.max_by {|h| h.size }
                            end

                            @quotas[q['ID']] = q
                        end
                    end
                end
                @quotas
            end

            column :ID, 'ONE identifier for the User', :size=>4 do |d|
                d['ID']
            end

            column :NAME, 'Name of the User', :left, :size=>5 do |d|
                d['NAME']
            end

            column :ENABLED, 'User is enabled', :left, :size=>4 do |d|
                if d['ENABLED'] == '1'
                    'yes'
                else
                    'no'
                end
            end

            column :GROUP, 'Group of the User', :left, :size=>10 do |d|
                helper.group_name(d, options)
            end

            column :AUTH, 'Auth driver of the User', :left, :size=>8 do |d|
                d['AUTH_DRIVER']
            end

            column :VMS, 'Number of VMS', :size=>9 do |d|
                begin
                    q = quotas_proc.call[d['ID']]['VM_QUOTA']['VM']

                    if q.nil? && d['ID'].to_i != 0
                        q = OneQuotaHelper::DEFAULT_VM_QUOTA
                    end

                    # In case of multiple quotas, use the global quota or the first
                    if q.is_a?(Array)
                        global_q = q.find {|h| h['CLUSTER_IDS'].nil? || h['CLUSTER_IDS'].empty? }
                        q = global_q || q[0]
                    end

                    limit = q['VMS']
                    limit = pool_default_quotas.call('VM_QUOTA/VM/VMS') if limit == OneQuotaHelper::LIMIT_DEFAULT

                    if limit == OneQuotaHelper::LIMIT_UNLIMITED
                        format('%3d /   -', q['VMS_USED'])
                    else
                        format('%3d / %3d', q['VMS_USED'], limit)
                    end
                rescue NoMethodError
                    '-'
                end
            end

            column :MEMORY, 'Total memory allocated to user VMs', :size=>15 do |d|
                begin
                    q = quotas_proc.call[d['ID']]['VM_QUOTA']['VM']

                    if q.nil? && d['ID'].to_i != 0
                        q = OneQuotaHelper::DEFAULT_VM_QUOTA
                    end

                    # In case of multiple quotas, use the global quota or the first
                    if q.is_a?(Array)
                        global_q = q.find {|h| h['CLUSTER_IDS'].nil? || h['CLUSTER_IDS'].empty? }
                        q = global_q || q[0]
                    end

                    limit = q['MEMORY']
                    limit = pool_default_quotas.call('VM_QUOTA/VM/MEMORY') if limit == OneQuotaHelper::LIMIT_DEFAULT

                    if limit == OneQuotaHelper::LIMIT_UNLIMITED
                        format('%6s /      -',
                               OpenNebulaHelper.unit_to_str(q['MEMORY_USED'].to_i, {}, 'M'))
                    else
                        format('%6s / %6s',
                               OpenNebulaHelper.unit_to_str(q['MEMORY_USED'].to_i, {}, 'M'),
                               OpenNebulaHelper.unit_to_str(limit.to_i, {}, 'M'))
                    end
                rescue NoMethodError
                    '-'
                end
            end

            column :CPU, 'Total CPU allocated to user VMs', :size=>11 do |d|
                begin
                    q = quotas_proc.call[d['ID']]['VM_QUOTA']['VM']

                    if q.nil? && d['ID'].to_i != 0
                        q = OneQuotaHelper::DEFAULT_VM_QUOTA
                    end

                    # In case of multiple quotas, use the global quota or the first
                    if q.is_a?(Array)
                        global_q = q.find {|h| h['CLUSTER_IDS'].nil? || h['CLUSTER_IDS'].empty? }
                        q = global_q || q[0]
                    end

                    limit = q['CPU']
                    limit = pool_default_quotas.call('VM_QUOTA/VM/CPU') if limit == OneQuotaHelper::LIMIT_DEFAULT

                    if limit == OneQuotaHelper::LIMIT_UNLIMITED
                        format('%3.1f /   -', q['CPU_USED'])
                    else
                        format('%3.1f / %3.1f', q['CPU_USED'], limit)
                    end
                rescue NoMethodError
                    '-'
                end
            end

            column :PCI, 'Total PCIs allocated to user VMs', :size=>9 do |d|
                begin
                    q = quotas_proc.call[d['ID']]['VM_QUOTA']['VM']

                    if q.nil? && d['ID'].to_i != 0
                        q = OneQuotaHelper::DEFAULT_VM_QUOTA
                    end

                    # In case of multiple quotas, use the global quota or the first
                    if q.is_a?(Array)
                        global_q = q.find {|h| h['CLUSTER_IDS'].nil? || hash['CLUSTER_IDS'].empty? }
                        q = global_q || q[0]
                    end

                    limit = q['PCI_DEV']
                    limit = pool_default_quotas.call('VM_QUOTA/VM/PCI_DEV') if limit == OneQuotaHelper::LIMIT_DEFAULT

                    if limit == OneQuotaHelper::LIMIT_UNLIMITED
                        format('%3s /   -', q['PCI_DEV_USED'])
                    else
                        format('%3s / %3s', q['PCI_DEV_USED'], limit)
                    end
                rescue NoMethodError
                    '-'
                end
            end

            column :PASSWORD, 'Password of the User', :size=>50 do |d|
                d['PASSWORD']
            end

            default :ID, :NAME, :ENABLED, :GROUP, :AUTH, :VMS, :MEMORY, :CPU, :PCI
        end
        # rubocop:enable Style/FormatStringToken
    end

    def find_token(user, token, group = nil, show_expired = false)
        user_hash = user.to_hash

        valid_tokens = [user_hash['USER']['LOGIN_TOKEN']].flatten.compact

        return [] if valid_tokens.empty?

        valid_tokens.map! do |e|
            next if token && !e['TOKEN'].start_with?(token)

            next if group && e['EGID'].to_i != group.to_i

            exp_time = e['EXPIRATION_TIME'].to_i
            next if !show_expired && exp_time != -1 && Time.now > Time.at(exp_time)

            e
        end.compact!

        # Sort the tokens so it returns first the one that will expire the
        # latest .

        valid_tokens.sort! do |a, b|
            a_exp = a['EXPIRATION_TIME'].to_i
            b_exp = b['EXPIRATION_TIME'].to_i

            if a_exp == -1 || b_exp == -1
                a_exp <=> b_exp
            else
                b_exp <=> a_exp
            end
        end

        valid_tokens
    end

    def read_user
        user = retrieve_resource(OpenNebula::User::SELF)
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
                return -1, 'No username in the argument or valid ONE_AUTH found.'
            end

            user = read_user
            username = user['NAME']
            use_client = true
        end

        login(username, options, use_client)
    end

    private

    def factory(id = nil)
        if id
            OpenNebula::User.new_with_id(id, @client)
        else
            xml=OpenNebula::User.build_xml
            OpenNebula::User.new(xml, @client)
        end
    end

    def factory_pool(_user_flag = -2)
        @user_pool = OpenNebula::UserPool.new(@client)
    end

    def format_resource(user, _options = {})
        str='%-16s: %-20s'
        str_h1='%-80s'

        CLIHelper.print_header(str_h1 % "USER #{user['ID']} INFORMATION")
        puts format(str, 'ID',          user.id.to_s)
        puts format(str, 'NAME',        user.name)
        puts format(str, 'GROUP',       user['GNAME'])
        groups = user.retrieve_elements('GROUPS/ID')
        puts format(str, 'SECONDARY GROUPS', groups.join(',')) if groups.size > 1
        puts format(str, 'PASSWORD',    user['PASSWORD'])
        puts format(str, 'AUTH_DRIVER', user['AUTH_DRIVER'])
        puts format(str, 'ENABLED',     OpenNebulaHelper.boolean_to_str(user['ENABLED']))
        puts

        user_hash = user.to_hash
        client    = @client

        gid = user['GID']
        tokens = [user_hash['USER']['LOGIN_TOKEN']].flatten.compact

        CLIHelper.print_header(str_h1 % 'TOKENS', false)
        if tokens && !tokens.empty?
            CLIHelper::ShowTable.new(nil, self) do
                column :ID, '', :size=>7 do |d|
                    d['TOKEN']
                end

                column :EGID, '', :left, :size=>5 do |d|
                    d['EGID'].to_i == -1 ? '*' + gid : d['EGID']
                end

                column :EGROUP, '', :left, :size=>10 do |d|
                    client = OpenNebulaHelper::OneHelper.get_client

                    egid = d['EGID'].to_i == -1 ? gid : d['EGID']

                    group = Group.new_with_id(egid, client)
                    rc = group.info

                    if OpenNebula.is_error?(rc)
                        '-'
                    else
                        group['NAME']
                    end
                end

                column :EXPIRATION, '', :left, :size=>20 do |d|
                    etime = d['EXPIRATION_TIME']
                    expired = Time.now >= Time.at(d['EXPIRATION_TIME'].to_i)
                    case etime
                    when nil  then ''
                    when '-1' then 'forever'
                    else
                        if expired
                            'expired'
                        else
                            Time.at(etime.to_i).to_s
                        end
                    end
                end
            end.show(tokens, {})
        end

        puts

        CLIHelper.print_header(str_h1 % 'USER TEMPLATE', false)
        puts user.template_str

        default_quotas = nil

        user.each('/USER/DEFAULT_USER_QUOTAS') {|elem| default_quotas = elem }

        helper = OneQuotaHelper.new(@client)
        helper.format_quota(user_hash['USER'], default_quotas, user.id)
    end

end
