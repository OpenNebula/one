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

require 'json'
require 'cloud/CloudClient'

# OneKS helper utilities
module OneKSHelper

    def self.client(options = {})
        OneKS::Client.new(
            :username => options[:username],
            :password => options[:password],
            :endpoint => options[:endpoint] || options[:server],
            :opts     => {
                :version    => options[:api_version],
                :user_agent => USER_AGENT
            }
        )
    end

    def resolve_cluster(client, cluster_id)
        rc = client.get_cluster(cluster_id)
        return [rc[:err_code], rc[:message]] if CloudClient.is_error?(rc)

        rc
    end

    def resolve_cluster_group(client, group_id)
        rc = client.get_group(group_id)
        return [rc[:err_code], rc[:message]] if CloudClient.is_error?(rc)

        template = rc[:TEMPLATE]
        return [-1, "Missing TEMPLATE for GROUP ID #{group_id}"] unless template

        body = template[self.class.template_tag]
        return [-1, "Missing #{self.class.template_tag} for GROUP ID #{group_id}"] unless body

        cluster_id = body[:cluster_id]
        return [-1, "Missing cluster_id for GROUP ID #{group_id}"] unless cluster_id

        cluster_id
    end

    # Renders the aggregate history returned by /clusters/:id/historic.
    def format_historic(events)
        CLIHelper::ShowTable.new(nil, self) do
            column :TIME, '', :left, :size => 16 do |event|
                OpenNebulaHelper.time_to_str(event[:time])
            end

            column :ACTION, '', :left, :size => 30 do |event|
                event[:action]
            end

            column :DESCRIPTION, '', :left, :expand => true do |event|
                event[:description]
            end

            column :KIND, '', :left, :size => 15 do |event|
                event[:kind]
            end

            column :RESOURCE_ID, '', :left, :size => 11 do |event|
                event[:resource_id]
            end

            default :TIME, :ACTION, :DESCRIPTION, :KIND, :RESOURCE_ID
        end.show(Array(events), {})
    end

    # Renders pods returned by a Group or the aggregate Cluster endpoint.
    def format_pods(pods, aggregate: false)
        pods = Array(pods).sort_by {|pod| pod[:namespace].to_s }

        CLIHelper::ShowTable.new(nil, self) do
            column :NAMESPACE, '', :left, :size => 24,
                   :adjust => true, :expand => true do |pod|
                pod[:namespace] || '--'
            end

            column :POD, '', :left, :size => 30,
                   :adjust => true, :expand => true do |pod|
                pod[:pod] || '--'
            end

            column :STATE, '', :left, :size => 16, :adjust => true do |pod|
                pod[:state]&.upcase || '--'
            end

            if aggregate
                column :KIND, '', :left, :size => 14, :adjust => true do |pod|
                    pod[:role] || '--'
                end

                column :GROUP_ID, '', :left, :size => 10, :adjust => true do |pod|
                    pod[:group_id] || '--'
                end
            end

            column :'VM ID', '', :left, :size => 8, :adjust => true do |pod|
                pod[:vm_id] || '--'
            end

            column :REASON, '', :left, :size => 30, :adjust => true do |pod|
                reason = pod[:reason]
                reason.nil? || reason.empty? ? '--' : reason
            end

            columns = [:NAMESPACE, :POD, :STATE]
            columns.concat([:KIND, :GROUP_ID]) if aggregate
            columns.concat([:'VM ID', :REASON])
            default(*columns)
        end.show(pods, {})
    end

    def resolve_inputs(client, inputs_method, family, flavour)
        rc = client.public_send(inputs_method, family, flavour, :exclude_defaults => true)
        return [rc[:err_code], rc[:message]] if CloudClient.is_error?(rc)

        inputs = rc[:user_inputs]
        return [
            -1, "Invalid response: missing user_inputs for family=#{family}, flavour=#{flavour}"
        ] if inputs.nil?

        inputs
    end

    def resolve_family(client, family_method, family_name)
        rc = client.public_send(family_method, family_name)
        return [rc[:err_code], rc[:message]] if CloudClient.is_error?(rc)

        rc
    end

    def resolve_flavour(family, label)
        flavours = Array(family[:flavours])
        return if flavours.empty?
        return flavours.first[:name] if flavours.size == 1

        puts "> Select a flavour for the #{label}:"
        flavours.each_with_index do |flavour, index|
            puts "    #{index}: #{flavour[:label]}"

            description = render_indented(flavour[:description], '       ')
            puts description unless description.empty?

            values = format_flavour_defaults(flavour[:defaults])
            puts "       #{values}" unless values.empty?

            puts
        end

        select_by_index(flavours)
    end

    def resolve_k8s_version(family, version = nil)
        versions = Array(family[:supported_k8s_versions])

        if version
            return version if versions.include?(version)

            STDERR.puts(
                "Kubernetes version '#{version}' not valid. " \
                "Valid versions: #{versions.join(', ')}"
            )
            exit(-1)
        end

        return if versions.empty?
        return versions.first if versions.size == 1

        puts '> Select a Kubernetes version for the Cluster:'
        versions.each_with_index do |item, index|
            puts "    #{index}: #{item}"
        end
        puts

        select_by_index(versions)
    end

    private

    def metadata_label(key)
        key.to_s.gsub(/([a-z\d])([A-Z])/, '\\1 \\2').tr('_', ' ').upcase
    end

    def display_value(value)
        case value
        when Array
            if value.all? {|item| !item.is_a?(Hash) && !item.is_a?(Array) }
                value.join(', ')
            else
                JSON.generate(value)
            end
        when Hash
            JSON.generate(value)
        else
            value.to_s
        end
    end

    def format_about(about)
        items = Array(about)
        return if items.empty?

        puts
        CLIHelper.print_header('ABOUT', false)

        items.each_with_index do |item, index|
            puts if index.positive?
            format_about_item(item)
        end
    end

    def format_about_item(item, depth = 0, bullet = false)
        return unless item.is_a?(Hash)

        title       = item[:title] || item['title']
        description = item[:description] || item['description']
        code        = item[:code] || item['code']
        steps       = item[:steps] || item['steps']
        prefix      = ('  ' * depth) + (bullet ? '- ' : '')
        indent      = '  ' * (depth + (bullet ? 1 : 0))

        puts "#{prefix}#{title}" unless title.to_s.empty?
        puts "#{indent}#{description}" unless description.to_s.empty?

        unless code.to_s.empty?
            puts "#{indent}Run:"
            code.to_s.each_line {|line| puts "#{indent}  #{line.chomp}" }
        end

        Array(steps).each do |step|
            format_about_item(step, depth + (bullet ? 1 : 0), true)
        end
    end

    def print_document_error(error)
        return unless error

        time = OpenNebulaHelper.time_to_str(error[:timestamp])

        puts "#{CLIHelper::ANSI_RED}ERROR#{CLIHelper::ANSI_RESET}: " \
             "#{error[:message]} (#{time})"
        puts
    end

    def format_flavour_defaults(defaults)
        defaults = defaults.to_h

        values = []

        count = defaults[:count] || defaults['count']
        values << "#{count} #{count.to_i == 1 ? 'node' : 'nodes'}" unless count.nil?

        cpu = defaults[:cpu] || defaults['cpu']
        values << "#{cpu} CPU" unless cpu.nil?

        vcpu = defaults[:vcpu] || defaults['vcpu']
        values << "#{vcpu} vCPU" unless vcpu.nil?

        memory = defaults[:memory] || defaults['memory']
        values << "#{format_size_gb(memory)} GB RAM" unless memory.nil?

        disk_size = defaults[:disk_size] || defaults['disk_size']
        values << "#{format_size_gb(disk_size)} GB Storage" unless disk_size.nil?

        values.join(' | ')
    end

    def format_size_gb(value_mb)
        value_gb = value_mb.to_f / 1024

        return value_gb.to_i if value_gb == value_gb.to_i

        format('%.1f', value_gb)
    end

    def render_indented(text, indent)
        rendered = CLIHelper.render_html(text).to_s
        return '' if rendered.empty?

        indent + rendered.gsub(/\r?\n/, "\n#{indent}")
    end

end
