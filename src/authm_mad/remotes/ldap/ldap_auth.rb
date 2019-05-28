# ---------------------------------------------------------------------------- #
# Copyright 2002-2019, OpenNebula Project, OpenNebula Systems                  #
#                                                                              #
# Licensed under the Apache License, Version 2.0 (the "License"); you may      #
# not use this file except in compliance with the License. You may obtain      #
# a copy of the License at                                                     #
#                                                                              #
# http://www.apache.org/licenses/LICENSE-2.0                                   #
#                                                                              #
# Unless required by applicable law or agreed to in writing, software          #
# distributed under the License is distributed on an "AS IS" BASIS,            #
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.     #
# See the License for the specific language governing permissions and          #
# limitations under the License.                                               #
# ---------------------------------------------------------------------------- #

require 'rubygems'
require 'opennebula'
require 'net/ldap'
require 'yaml'

if !defined?(ONE_LOCATION)
    ONE_LOCATION=ENV["ONE_LOCATION"]
end

if !ONE_LOCATION
    VAR_LOCATION="/var/lib/one/"
else
    VAR_LOCATION=ONE_LOCATION+"/var/"
end

module OpenNebula; end

class OpenNebula::LdapAuth
    def initialize(options)
        @options={
            :host               => 'localhost',
            :port               => 389,
            :user               => nil,
            :password           => nil,
            :base               => nil,
            :group_base         => nil,
            :auth_method        => :simple,
            :user_field         => 'cn',
            :user_group_field   => 'dn',
            :group_field        => 'member',
            :mapping_generate   => true,
            :mapping_timeout    => 300,
            :mapping_filename   => 'server1.yaml',
            :mapping_key        => 'GROUP_DN',
            :mapping_default    => 1,
            :attributes         => [ "memberOf" ],
            :rfc2307bis         => true
        }.merge(options)

        ops={}

        if @options[:user]
            ops[:auth] = {
                :method => @options[:auth_method],
                :username => @options[:user],
                :password => @options[:password]
            }
        end

        if !@options[:rfc2307bis]
            @options[:attributes] << @options[:user_field]
        end

        # fetch the user group field only if we need that
        if @options[:group] or !@options[:rfc2307bis]
            @options[:attributes] << @options[:user_group_field]
        end

        ops[:host]=@options[:host] if @options[:host]
        ops[:port]=@options[:port].to_i if @options[:port]
        ops[:encryption]=@options[:encryption] if @options[:encryption]

        @options[:mapping_file_path] = VAR_LOCATION + @options[:mapping_filename]
        generate_mapping if @options[:mapping_generate]
        load_mapping

        @ldap=Net::LDAP.new(ops)
    end

    def generate_mapping
        file=@options[:mapping_file_path]
        generate = false

        if File.exists?(file)
            stat = File.stat(file)
            age = Time.now.to_i - stat.mtime.to_i
            generate = true if age > @options[:mapping_timeout]
        else
            generate = true
        end

        return if !generate

        client = OpenNebula::Client.new
        group_pool = OpenNebula::GroupPool.new(client)
        group_pool.info

        groups = group_pool.to_hash['']
        groups=[group_pool.get_hash['GROUP_POOL']['GROUP']].flatten

        yaml={}

        groups.each do |group|
            if group['TEMPLATE'] && group['TEMPLATE'][@options[:mapping_key]]
                yaml[group['TEMPLATE'][@options[:mapping_key]]] = group['ID']
            end
        end

        File.open(file, 'w') do |f|
            f.write(yaml.to_yaml)
        end
    end

    def load_mapping
        file=@options[:mapping_file_path]

        @mapping = {}

        if File.exists?(file)
            @mapping = YAML.load(File.read(file))
        end

        if @mapping.class != Hash
            @mapping = {}
        end
    end

    def find_user(name)
        filter = Net::LDAP::Filter.equals(@options[:user_field], name)

        result = @ldap.search(
            :base       => @options[:base],
            :attributes => @options[:attributes],
            :filter     => filter
        )

        if result && result.first
            @user = result.first
            [@user.dn, @user[@options[:user_group_field]]]
        else
            result=@ldap.search(:base => name)

            if result && result.first
                @user = result.first
                [name, @user[@options[:user_group_field]]]
            else
                [nil, nil]
            end
        end
    end

    def is_in_group?(user, group)
        username = user.first.force_encoding(Encoding::UTF_8)
        result=@ldap.search(
                    :base   => group,
                    :attributes => [@options[:group_field]],
                    :filter => "(#{@options[:group_field]}=#{username})")

        if result && result.first
            true
        else
            false
        end
    end

    def authenticate(user, password)
        ldap=@ldap.clone

        auth={
            :method => @options[:auth_method],
            :username => user,
            :password => password
        }

        if ldap.bind(auth)
            true
        else
            false
        end
    end

    def in_hash_ignore_case?(hash, key)
        return hash.keys.find {|k| key.downcase == k.downcase}
    end

    def get_groups
        groups = []

        if @options[:rfc2307bis]
            [@user['memberOf']].flatten.each do |group|
                if (g = in_hash_ignore_case?(@mapping, group))
                    groups << @mapping[g]
                end
            end
        else
            group_base = @options[:group_base] ? @options[:group_base] : @options[:base]
            filter = Net::LDAP::Filter.equals(@options[:group_field], @user[@options[:user_group_field]].first)
            @ldap.search(
                :base       => group_base,
                :attributes => [ "dn" ],
                :filter     => filter
            ) do |entry|
                if (g = in_hash_ignore_case?(@mapping, entry.dn))
                    groups << @mapping[g]
                end

            end
        end

        groups.delete(false)
        groups.compact.uniq
    end
end
