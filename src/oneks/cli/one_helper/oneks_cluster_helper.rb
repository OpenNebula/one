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

# OneKS cluster helper
class OneKSClusterHelper < ODSHelper

    include OneKSHelper

    ONEKS_ENDPOINT = 'http://localhost:10780'
    DEFAULT_FAMILY = 'general'

    def self.conf_file
        'ks_cluster.yaml'
    end

    def self.client_class
        OneKS::Client
    end

    def self.template_tag
        :CLUSTER_BODY
    end

    def self.update_from_editor(client, cluster_id)
        super(client, cluster_id, :get_cluster)
    end

    def list(client, options)
        list_resources(client, :list_clusters, options) do |response|
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

    def show(client, cluster_id, options)
        response = client.get_cluster(cluster_id, :expand => true)
        return [response[:err_code], response[:message]] if CloudClient.is_error?(response)

        body = response[:TEMPLATE][:CLUSTER_BODY]
        applications = Array(body[:applications]).reject do |application|
            application[:parent]
        end

        render_response(response, options) do
            str    = '%-20s: %-20s'
            str_h1 = '%-80s'

            reg_time = OpenNebulaHelper.time_to_str(body[:registration_time])

            cp     = body[:control_plane] || {}
            vm_ids = Array(cp[:vms]).map {|vm| vm[:id] }

            CLIHelper.print_header(
                str_h1 % "ONEKS CLUSTER #{response[:ID]} INFORMATION"
            )

            puts Kernel.format str, 'ID', response[:ID]
            puts Kernel.format str, 'NAME', response[:NAME]
            puts Kernel.format str, 'DESCRIPTION', body[:description] if body[:description]
            puts Kernel.format str, 'USER', response[:UNAME]
            puts Kernel.format str, 'GROUP', response[:GNAME]
            puts Kernel.format str, 'STATE', body[:state]
            puts Kernel.format str, 'KUBERNETES VERSION', body[:kubernetes_version]
            puts Kernel.format(str, 'ENDPOINT', cp[:endpoint] || 'N/A')
            puts Kernel.format str, 'REGISTRATION TIME', reg_time

            puts

            print_document_error(body[:error])

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

            CLIHelper.print_header(str_h1 % 'DEPLOYMENT', false)

            deployment = body[:deployment] || {}
            networks   = deployment[:networks] || {}

            puts Kernel.format(
                str, 'OPENNEBULA_CLUSTER',
                deployment.dig(:cluster, :id).nil? ? '--' : deployment.dig(:cluster, :id).to_s
            )
            puts Kernel.format(
                str, 'PUBLIC_NETWORK',
                networks.dig(:public, :id).nil? ? '--' : networks.dig(:public, :id).to_s
            )
            puts Kernel.format(
                str, 'PRIVATE_NETWORK',
                networks.dig(:private, :id).nil? ? '--' : networks.dig(:private, :id).to_s
            )

            puts

            CLIHelper.print_header(str_h1 % 'CONTROL PLANE', false)

            puts Kernel.format(str, 'ID',      cp[:id]      || '--')
            puts Kernel.format(str, 'NAME',    cp[:name]    || '--')
            puts Kernel.format(str, 'FAMILY',  cp[:family]  || '--')
            puts Kernel.format(str, 'FLAVOUR', cp[:flavour] || '--')
            puts Kernel.format(str, 'STATE',   cp[:state]   || '--')
            puts Kernel.format(str, 'VM IDS',  vm_ids.empty? ? '--' : vm_ids.join(','))

            puts

            CLIHelper.print_header(str_h1 % 'NODE GROUPS', false)

            node_groups = Array(body[:node_groups])

            if node_groups.empty?
                puts '--'
            else
                CLIHelper::ShowTable.new(nil, self) do
                    column :ID, '', :left, :size => 4, :adjust => true do |d|
                        d[:id] || '--'
                    end

                    column :NAME, '', :left, :size => 25, :adjust => true do |d|
                        d[:name] || '--'
                    end

                    column :FAMILY, '', :left, :size => 15, :adjust => true do |d|
                        d[:family] || '--'
                    end

                    column :FLAVOUR, '', :left, :size => 15, :adjust => true do |d|
                        d[:flavour] || '--'
                    end

                    column :STATE, '', :left, :size => 20, :adjust => true do |d|
                        d[:state] || '--'
                    end

                    column :VMS, '', :left, :size => 4, :adjust => true do |d|
                        Array(d[:vms]).size
                    end

                    default :ID, :NAME, :FAMILY, :FLAVOUR, :STATE, :VMS
                end.show(node_groups, {})
            end

            puts

            CLIHelper.print_header(str_h1 % 'APPLICATIONS', false)
            format_applications(applications)

            remaining = body.reject do |k, _|
                [
                    :name,
                    :description,
                    :kubernetes_version,
                    :target_kubernetes_version,
                    :state,
                    :features,
                    :deployment,
                    :control_plane,
                    :node_groups,
                    :applications,
                    :registration_time,
                    :historic,
                    :error,
                    :active_job
                ].include?(k)
            end

            if remaining.any?
                CLIHelper.print_header('USER TEMPLATE', false)
                puts JSON.pretty_generate(remaining)
            end

            0
        end
    end

    def historic(client, cluster_id, options = {})
        response = client.get_cluster_historic(cluster_id)
        render_response(response, options) {|events| format_historic(events) }
    end

    def kubeconfig(client, cluster_id, options = {})
        response = client.get_cluster_kubeconfig(cluster_id)

        render_response(response, options) do |data|
            puts data[:kubeconfig] || ''
        end
    end

    def observations(client, cluster_id, options = {})
        response = client.get_cluster_observations(cluster_id)

        render_response(response, options) do |data|
            format_observations(data)
        end
    end

    def pods(client, cluster_id, options = {})
        response = client.get_cluster_pods(cluster_id)

        render_response(response, options) do |data|
            format_pods(data, :aggregate => true)
        end
    end

    def application(client, cluster_id, release_name, options = {})
        response = client.get_cluster_application(cluster_id, release_name)

        render_response(response, options) do |data|
            format_application(data, cluster_id)
        end
    end

    def create(client, body = nil, options = {})
        body ||= ask_cluster_body(client)
        return body if is_error?(body)

        rc = client.create_cluster(body)

        if CloudClient.is_error?(rc)
            [rc[:err_code], rc[:message]]
        else
            cluster_id = rc[:ID]
            puts "ID: #{cluster_id}"

            if options[:wait] && cluster_id
                puts '---'
                logs(client, cluster_id, :follow => true, :all => true)
            end

            0
        end
    end

    def update(client, cluster_id, body)
        rc = client.update_cluster(cluster_id, body)
        return [rc[:err_code], rc[:message]] if CloudClient.is_error?(rc)

        0
    end

    def rename(client, cluster_id, name)
        client.update_cluster(cluster_id, { :name => name })
    end

    def chown(client, cluster_id, owner_id, group_id = nil)
        rc = client.chown_cluster(cluster_id, owner_id, group_id)
        return [rc[:err_code], rc[:message]] if CloudClient.is_error?(rc)

        0
    end

    def chgrp(client, cluster_id, group_id)
        rc = client.chgrp_cluster(cluster_id, group_id)
        return [rc[:err_code], rc[:message]] if CloudClient.is_error?(rc)

        0
    end

    def chmod(client, cluster_id, octet)
        rc = client.chmod_cluster(cluster_id, octet)
        return [rc[:err_code], rc[:message]] if CloudClient.is_error?(rc)

        0
    end

    def recover(client, ids, action = :retry)
        ids.each do |id|
            rc = client.recover_cluster(id, action)
            return [rc[:err_code], rc[:message]] if CloudClient.is_error?(rc)
        end

        0
    end

    def upgrade(client, cluster_id, options = {})
        cluster = client.get_cluster(cluster_id, :expand => true)
        return [cluster[:err_code], cluster[:message]] if CloudClient.is_error?(cluster)

        family_name = cluster.dig(:TEMPLATE, :CLUSTER_BODY, :control_plane, :family)
        return [-1, "Unable to determine control plane family for cluster #{cluster_id}"] \
            if family_name.nil? || family_name.to_s.empty?

        family = client.get_cluster_family(family_name)
        return [family[:err_code], family[:message]] if CloudClient.is_error?(family)

        current_version = cluster.dig(:TEMPLATE, self.class.template_tag, :kubernetes_version)
        puts "Current Kubernetes version: #{current_version}"

        version = resolve_k8s_version(family, options[:kubernetes_version])
        rc = client.upgrade_cluster(cluster_id, version)

        return [rc[:err_code], rc[:message]] if CloudClient.is_error?(rc)

        0
    end

    def delete(client, ids, options = {})
        opts = options[:force] == true ? { :force => true } : {}

        ids.each do |id|
            rc = client.delete_cluster(id, opts)
            return [rc[:err_code], rc[:message]] if CloudClient.is_error?(rc)
        end

        0
    end

    def logs(client, cluster_id, options = {})
        all_logs = options[:all] || false
        follow   = options[:follow] || false

        rc = client.get_cluster_logs(cluster_id, all_logs, :follow => follow)
        return [rc[:err_code], rc[:message]] if CloudClient.is_error?(rc)

        Array(rc&.dig(:lines)).each do |entry|
            level = entry[:level] || entry['level'] || 'info'
            text  = entry[:text]  || entry['text']  || ''

            if $stdout.tty? && level == 'error'
                puts "#{CLIHelper::ANSI_RED}#{text}#{CLIHelper::ANSI_RESET}"
            elsif $stdout.tty? && level == 'warn'
                puts "#{CLIHelper::ANSI_YELLOW}#{text}#{CLIHelper::ANSI_RESET}"
            else
                puts text
            end
        end

        0
    end

    def check(client, body)
        body ||= {}

        if body[:cluster_id]
            body = cluster_networks(client, body[:cluster_id])
        elsif body.empty?
            body = ask_cluster_check(body)
            puts '---'
        end

        return body if is_error?(body)

        failed  = false
        printer = EventProgressPrinter.new

        client.check_cluster_deployment(body) do |_event, data|
            failed ||= data[:state].to_s == EventProgressPrinter::FAILURE
            printer.print_event(data[:name], data[:state], data[:context])
        end

        failed ? 1 : 0
    rescue StandardError => e
        [-1, e.message]
    ensure
        printer&.close
    end

    private

    def format_applications(applications)
        applications = Array(applications)
        if applications.empty?
            puts '--'
            return
        end

        failures = applications.select {|application| application[:state] == 'error' }

        failures.each do |application|
            puts "#{CLIHelper::ANSI_RED}ERROR#{CLIHelper::ANSI_RESET}: " \
                 "#{application[:release_name]} is in error state: " \
                 "#{application[:error_msg]}"
        end
        puts unless failures.empty?

        CLIHelper::ShowTable.new(nil, self) do
            column :'RELEASE NAME', '', :left, :size => 30, :adjust => true do |application|
                application[:release_name] || '--'
            end

            column :STATE, '', :left, :size => 15, :adjust => true do |application|
                application[:state]&.upcase || '--'
            end

            default :'RELEASE NAME', :STATE
        end.show(applications, {})
    end

    def format_application(application, cluster_id)
        str      = '%-20s: %s'
        metadata = application[:metadata] || {}

        CLIHelper.print_header(
            "ONEKS #{application[:release_name].upcase} APPLICATION IN CLUSTER #{cluster_id}"
        )
        puts Kernel.format(str, 'ID', application[:id] || '--')

        metadata.reject {|key, _value| key.to_sym == :about }.each do |key, value|
            puts Kernel.format(str, metadata_label(key), display_value(value))
        end

        puts Kernel.format(str, 'RELEASE NAME', application[:release_name] || '--')
        puts Kernel.format(str, 'VERSION', application[:version] || '--')
        puts Kernel.format(str, 'STATE', application[:state]&.upcase || '--')
        puts Kernel.format(str, 'PARENT', application[:parent] || '--')
        puts Kernel.format(str, 'ERROR', application[:error_msg]) if application[:error_msg]

        dependencies = Array(application[:dependencies])
        unless dependencies.empty?
            puts
            CLIHelper.print_header('DEPENDENCIES', false)
            format_applications(dependencies)
        end

        format_about(metadata[:about]) if metadata[:about]
    end

    def format_observations(observations)
        CLIHelper::ShowTable.new(nil, self) do
            column :NAMESPACE, '', :left, :size => 24,
                   :adjust => true, :expand => true do |item|
                item[:namespace] || '--'
            end

            column :RESOURCE, '', :left, :size => 18, :adjust => true do |item|
                item[:resource] || '--'
            end

            column :NAME, '', :left, :size => 30,
                   :adjust => true, :expand => true do |item|
                item[:name] || '--'
            end

            column :PATH, '', :left, :size => 28, :adjust => true do |item|
                item[:path] || '--'
            end

            column :VALUE, '', :left, :size => 16, :adjust => true do |item|
                value = item[:value]
                value = value.upcase if value.is_a?(String)
                value.nil? ? '--' : value
            end

            column :TIME, '', :left, :size => 15 do |item|
                OpenNebulaHelper.time_to_str(item[:createdAt])
            end

            default :NAMESPACE, :RESOURCE, :NAME, :PATH, :VALUE, :TIME
        end.show(Array(observations), {})
    end

    def format_pool
        config_file = self.class.table_conf

        CLIHelper::ShowTable.new(config_file, self) do
            column :ID, 'ID', :size => 10 do |d|
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

            column :STATE, 'State', :left, :size => 20 do |d|
                cluster_body = d[:TEMPLATE][:CLUSTER_BODY]
                cluster_body[:state] ||= 'N/A'
            end

            column :REGTIME,
                   'Registration time of the OneKS Cluster',
                   :size => 15 do |d|
                begin
                    cluster_body = d[:TEMPLATE][:CLUSTER_BODY]
                    timestamp    = cluster_body[:registration_time]

                    OpenNebulaHelper.time_to_str(timestamp)
                rescue NoMethodError, KeyError, TypeError
                    'N/A'
                end
            end

            default :ID, :USER, :GROUP, :NAME, :STATE, :REGTIME
        end
    end

    def ask_cluster_body(client)
        str_h1 = '%-80s'

        # Inputs processed in prompt order
        name = ask_required_value('Cluster name')

        puts
        CLIHelper.print_header(str_h1 % 'DEPLOYMENT PLACEMENT')

        cluster_id      = ask_required_integer('OpenNebula cluster ID')
        public_network  = ask_required_integer('Public network ID')
        private_network = ask_required_integer('Private network ID')

        deployment = {
            :cluster  => { :id => cluster_id },
            :networks => {
                :public  => { :id => public_network },
                :private => { :id => private_network }
            }
        }

        rc = client.validate_cluster_deployment(deployment)
        return [rc[:err_code], rc[:message]] if CloudClient.is_error?(rc)

        puts
        CLIHelper.print_header(str_h1 % 'ONEKS SPEC')

        family = resolve_family(client, :get_cluster_family, DEFAULT_FAMILY)
        return family if is_error?(family)

        k8s_version = resolve_k8s_version(family)
        flavour     = resolve_flavour(family, 'Cluster')

        user_inputs = resolve_inputs(
            client, :get_cluster_inputs, family[:family], flavour[:name]
        )
        return user_inputs if is_error?(user_inputs)

        unless user_inputs.empty?
            puts
            CLIHelper.print_header(str_h1 % 'USER INPUTS')
        end

        values = get_user_values(user_inputs)

        puts

        # Build cluster body
        {
            :name               => name,
            :kubernetes_version => k8s_version,
            :deployment         => deployment,
            :spec               => {
                :family             => family[:family],
                :flavour            => flavour[:name],
                :user_inputs_values => values
            }.compact
        }.compact
    end

    def cluster_networks(client, cluster_id)
        cluster = client.get_cluster(cluster_id)
        if CloudClient.is_error?(cluster)
            return [-1, cluster[:message] || "Cluster #{cluster_id} not found"]
        end

        body = cluster.dig(:TEMPLATE, self.class.template_tag)
        return [-1, "Missing #{self.class.template_tag} for cluster #{cluster_id}"] unless body

        deployment = (body[:deployment] || {}).dup
        deployment_id   = deployment.dig(:cluster, :id)
        public_network  = deployment.dig(:networks, :public, :id)
        private_network = deployment.dig(:networks, :private, :id)
        missing         = []

        missing << 'deployment.cluster.id' if deployment_id.nil?
        missing << 'deployment.networks.public.id' if public_network.nil?
        missing << 'deployment.networks.private.id' if private_network.nil?

        return [
            -1, "Cluster #{cluster[:ID]} is missing #{missing.join(' and ')}"
        ] unless missing.empty?

        deployment
    rescue StandardError => e
        [-1, e.message]
    end

    def ask_cluster_check(body = {})
        cluster_id      = body.dig(:cluster, :id)
        public_network  = body.dig(:networks, :public, :id)
        private_network = body.dig(:networks, :private, :id)

        cluster_id      ||= ask_required_integer('OpenNebula cluster ID') if cluster_id.nil?
        public_network  ||= ask_required_integer('Public network ID')
        private_network ||= ask_required_integer('Private network ID')

        {
            :cluster  => { :id => cluster_id },
            :networks => {
                :public  => { :id => public_network },
                :private => { :id => private_network }
            }
        }
    end

end
