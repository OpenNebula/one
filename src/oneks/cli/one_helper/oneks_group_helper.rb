# -------------------------------------------------------------------------- #
# Copyright 2002-2026, OpenNebula Project, OpenNebula Systems                #
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

require 'ods_helper'
require 'one_helper/oneks_helper'
require 'cloud/CloudClient'

# OneKS group helper
class OneKSGroupHelper < ODSHelper

    include OneKSHelper

    ONEKS_ENDPOINT = 'http://localhost:10780'
    DEFAULT_FAMILY = 'general'
    CAPACITY_ATTRS = [:cpu, :vcpu, :memory, :disk_size]

    def self.conf_file
        'ks_group.yaml'
    end

    def self.client_class
        OneKS::Client
    end

    def self.template_tag
        :GROUP_BODY
    end

    def self.update_from_editor(client, group_id)
        super(client, group_id, :get_group)
    end

    def list(client, options)
        list_resources(client, :list_groups, options) do |response|
            table = format_pool

            table.show(response, options)
            table.describe_columns if options[:describe]
        end
    end

    def top(client, options)
        top_resources(options[:delay]) do
            list(client, options)
        end
    end

    def show(client, group_id, options = {})
        show_resource(client, :get_group, group_id, options) do |response|
            str    = '%-20s: %-20s'
            str_h1 = '%-80s'

            body     = response[:TEMPLATE][:GROUP_BODY]
            reg_time = OpenNebulaHelper.time_to_str(body[:registration_time])

            CLIHelper.print_header(
                str_h1 % "ONEKS GROUP #{response[:ID]} INFORMATION"
            )

            puts Kernel.format str, 'ID', response[:ID]
            puts Kernel.format str, 'NAME', response[:NAME]
            puts Kernel.format str, 'DESCRIPTION', body[:description] if body[:description]
            puts Kernel.format str, 'ROLE', body[:type]
            puts Kernel.format str, 'CLUSTER ID', body[:cluster_id]
            puts Kernel.format str, 'USER', response[:UNAME]
            puts Kernel.format str, 'GROUP', response[:GNAME]
            puts Kernel.format str, 'STATE', body[:state]
            puts Kernel.format str, 'ENDPOINT', body[:endpoint] if body[:endpoint]
            puts Kernel.format str, 'REGISTRATION TIME', reg_time

            puts

            CLIHelper.print_header(str_h1 % 'PERMISSIONS', false)

            ['OWNER', 'GROUP', 'OTHER'].each do |e|
                mask = '---'
                permissions_hash = response[:PERMISSIONS]
                mask[0] = 'u' if permissions_hash["#{e}_U".to_sym] == '1'
                mask[1] = 'm' if permissions_hash["#{e}_M".to_sym] == '1'
                mask[2] = 'a' if permissions_hash["#{e}_A".to_sym] == '1'

                puts Kernel.format str, e, mask
            end

            puts

            CLIHelper.print_header(str_h1 % 'GROUP CONFIGURATION', false)

            puts Kernel.format(str, 'FAMILY', body[:family]          || '--')
            puts Kernel.format(str, 'FLAVOUR', body[:flavour]        || '--')
            format_capacity(body[:user_inputs_values])
            puts Kernel.format(str, 'VM IDS', body[:vms].join(',') || '--')

            puts

            format_dependencies(body[:dependencies])

            CLIHelper.print_header('GROUP HISTORIC', false)
            CLIHelper::ShowTable.new(nil, self) do
                column :ACTION, '', :left, :size => 30, :adjust => true do |d|
                    d[:action]
                end

                column :DESCRIPTION, '', :left, :size => 50, :adjust => true do |d|
                    d[:description]
                end

                column :TIME, '', :left, :size => 15 do |d|
                    OpenNebulaHelper.time_to_str(d[:time])
                end

                default :TIME, :ACTION, :DESCRIPTION
            end.show(Array(body[:historic]), {})

            remaining = body.reject do |k, _|
                [
                    :uuid,
                    :name,
                    :description,
                    :cluster_id,
                    :family,
                    :flavour,
                    :type,
                    :state,
                    :vms,
                    :dependencies,
                    :user_inputs_values,
                    :historic,
                    :endpoint,
                    :registration_time
                ].include?(k)
            end

            if remaining.any?
                CLIHelper.print_header('USER TEMPLATE', false)
                puts JSON.pretty_generate(remaining)
            end

            0
        end
    end

    def create(client, cluster_id, body = nil)
        # Check that cluster ID exists
        cluster = resolve_cluster(client, cluster_id)
        return cluster if is_error?(cluster)

        body ||= ask_group_body(client)
        return body if is_error?(body)

        rc = client.create_cluster_nodegroup(cluster_id, body)

        if CloudClient.is_error?(rc)
            [rc[:err_code], rc[:message]]
        else
            puts "ID: #{rc[:ID]}"

            0
        end
    end

    def update(client, group_id, body)
        cluster_id = resolve_cluster_group(client, group_id)
        return cluster_id if is_error?(cluster_id)

        response = client.update_cluster_nodegroup(cluster_id, group_id, body)

        if CloudClient.is_error?(response)
            [response[:err_code], response[:message]]
        else
            0
        end
    end

    def rename(client, group_id, name)
        cluster_id = resolve_cluster_group(client, group_id)
        return cluster_id if is_error?(cluster_id)

        client.update_cluster_nodegroup(cluster_id, group_id, { :name => name })
    end

    def scale(client, group_id, target)
        cluster_id = resolve_cluster_group(client, group_id)
        return cluster_id if is_error?(cluster_id)

        rc = client.scale_cluster_nodegroup(cluster_id, group_id, { :target => target })
        return [rc[:err_code], rc[:message]] if CloudClient.is_error?(rc)

        0
    end

    def recover(client, group_id)
        cluster_id = resolve_cluster_group(client, group_id)
        return cluster_id if is_error?(cluster_id)

        rc = client.recover_cluster_nodegroup(cluster_id, group_id)
        return [rc[:err_code], rc[:message]] if CloudClient.is_error?(rc)

        0
    end

    def delete(client, group_ids)
        group_ids.each do |group_id|
            cluster_id = resolve_cluster_group(client, group_id)
            return cluster_id if is_error?(cluster_id)

            rc = client.delete_cluster_nodegroup(cluster_id, group_id)
            return [rc[:err_code], rc[:message]] if CloudClient.is_error?(rc)
        end

        0
    end

    private

    def format_pool
        config_file = self.class.table_conf

        CLIHelper::ShowTable.new(config_file, self) do
            column :ID, 'ID', :size => 4 do |d|
                d[:ID]
            end

            column :USER, 'Username', :left, :size => 15 do |d|
                d[:UNAME]
            end

            column :GROUP, 'Group', :left, :size => 15 do |d|
                d[:GNAME]
            end

            column :NAME, 'Name', :left, :expand => true do |d|
                d[:NAME]
            end

            column :ROLE, 'Role', :left, :size => 10 do |d|
                group_body = d[:TEMPLATE][:GROUP_BODY]
                group_body[:type].downcase || 'N/A'
            end

            column :FLAVOUR, 'Flavour', :left, :size => 10 do |d|
                group_body = d[:TEMPLATE][:GROUP_BODY]
                group_body[:flavour].downcase || 'N/A'
            end

            column :STATE, 'State', :left, :size => 20 do |d|
                group_body = d[:TEMPLATE][:GROUP_BODY]
                group_body[:state] || 'N/A'
            end

            column :REGTIME,
                   'Registration time of the OneKS group',
                   :size => 15 do |d|
                begin
                    group_body = d[:TEMPLATE][:GROUP_BODY]
                    timestamp  = group_body[:registration_time]

                    OpenNebulaHelper.time_to_str(timestamp)
                rescue NoMethodError, KeyError, TypeError
                    'N/A'
                end
            end

            default :ID, :USER, :GROUP, :NAME, :ROLE, :CLUSTER, :STATE, :REGTIME
        end
    end

    def format_dependencies(dependencies)
        deps = Array(dependencies)
        return if deps.empty?

        header = '%-80s'

        CLIHelper.print_header(header % 'DEPENDENCIES', false)
        CLIHelper::ShowTable.new(nil, self) do
            column :NAME, '', :left, :size => 24 do |d|
                d[:name].upcase || '--'
            end

            column :ID, '', :left, :size => 12 do |d|
                d[:id] || '--'
            end

            column :READY, '', :left, :size => 8 do |d|
                d[:ready] ? 'YES' : 'NO'
            end

            default :NAME, :ID, :READY
        end.show(deps, {})

        puts
    end

    def format_capacity(values)
        str = '%-20s: %-20s'

        CAPACITY_ATTRS.each do |key|
            next unless values.key?(key)

            value = values[key]
            puts Kernel.format(str, key.to_s.upcase, value.to_s)
        end
    end

    def ask_group_body(client)
        # Inputs processed in prompt order
        name   = ask_required_value('Nodegroup name')
        family = resolve_family(client, :get_nodegroup_family, DEFAULT_FAMILY)
        return family if is_error?(family)

        flavour         = resolve_flavour(family, 'Nodegroup')
        user_inputs     = resolve_inputs(
            client, :get_nodegroup_inputs, family[:family], flavour[:name]
        )
        return user_inputs if is_error?(user_inputs)

        values = get_user_values(user_inputs)

        # Build group body
        {
            :name               => name,
            :family             => family[:family],
            :flavour            => flavour[:name],
            :user_inputs_values => values
        }.compact
    end

end
