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
require 'digest'
require 'shellwords'

# Configures host mirrors shared by VMs on the same OVS bridge.
# A shared host lock protects reading OVSDB, planning changes and applying the
# transaction. Ordinary NIC operations keep their existing locking policy.
class OpenvSwitchMirrors

    LOCK_FILE = '/var/lock/one/onevnm-ovs-mirrors-lock'.freeze

    MIRROR_NAME = /\Aone-pm-(\d+)-(\d+)\z/
    OUTPUT_NAME = /\Aone-m-[0-9a-f]{9}\z/

    MIRROR_COLUMNS = [
        '_uuid',
        'name',
        'select_all',
        'select_src_port',
        'select_dst_port',
        'select_vlan',
        'output_port',
        'output_vlan'
    ].freeze

    # Context for one VNet on a bridge; touched contains this callback's port UUIDs.
    Network = Struct.new(:bridge, :vm_id, :nics, :ports, :touched)

    # Sets the commands used to configure OVS and inspect host addresses.
    #   @param ovs_vsctl [String] ovs-vsctl command
    #   @param ip [String] ip command
    def initialize(ovs_vsctl, ip)
        @ovs_vsctl = ovs_vsctl
        @ip        = ip
    end

    # Loads mirror definitions and reconciles the affected NICs under a host lock.
    #   @param event [Symbol] NIC callback event (:activate, :update or :deactivate)
    #   @param vm_id [Integer] VM owning the affected NICs
    #   @param nics [Array<VNMMAD::VNMNetwork::Nic>] affected NICs
    #   @param mirrors [Array<REXML::Element>] MIRROR defs. from the VM template
    def reconcile(event, vm_id, nics, mirrors)
        @definitions = mirrors.each_with_object({}) do |mirror, definitions|
            definition = {}

            mirror.elements.each do |attribute|
                definition[attribute.name.downcase.to_sym] = attribute.text
            end

            key = [
                Integer(definition.fetch(:network_id)),
                Integer(definition.fetch(:mirror_id))
            ]

            definitions[key] = definition
        end

        with_lock { reconcile_locked(event, vm_id, nics) }
    end

    private

    # Runs the supplied block with exclusive access to host mirror state.
    #   @yield mirror reconciliation to serialize
    def with_lock
        File.open(LOCK_FILE, 'w') do |lock|
            lock.flock(File::LOCK_EX)
            yield
        end
    end

    # Reads OVS state, plans mirror changes and applies them in one transaction.
    #   @param event [Symbol] NIC callback event
    #   @param vm_id [Integer] VM owning the affected NICs
    #   @param nics [Array<VNMMAD::VNMNetwork::Nic>] affected NICs
    def reconcile_locked(event, vm_id, nics)
        read_state

        @commands = []
        @result   = @mirrors.map(&:dup)
        @outputs  = tunnel_outputs
        @sequence = 0

        nics.group_by {|nic| [nic[:bridge], Integer(nic[:network_id])] }
            .each do |key, members|
            bridge, network_id = key
            next if bridge.to_s.empty?

            reconcile_network(event, vm_id, bridge, network_id, members)
        end

        bridges = nics.map {|nic| nic[:bridge] }.uniq

        release_outputs(bridges)

        execute(@commands) unless @commands.empty?
    end

    # Runs a command and returns stdout, raising an error on failure.
    #   @param command [String] shell command to execute
    #   @return [String] command stdout
    def run(command)
        result = LocalCommand.run(command,
                                  OpenNebula::DriverLogger.method(:log_error))

        raise result.stderr unless result.success?

        result.stdout
    end

    # Executes the queued OVS operations in a single ovs-vsctl transaction.
    #   @param commands [Array<String>] escaped ovs-vsctl subcommands
    def execute(commands)
        run("#{@ovs_vsctl} -- #{commands.join(' -- ')}")
    end

    # Reads OVSDB rows and converts their values to Ruby objects.
    #   @param table [String] OVSDB table name
    #   @param columns [Array<String>] columns to retrieve
    #   @return [Array<Hash>] rows with column names as keys
    def read_table(table, columns)
        cmd = "#{@ovs_vsctl} --format=json --columns=#{columns.join(',')} " \
              "list #{table}"

        data     = JSON.parse(run(cmd))
        headings = data.fetch('headings')

        data.fetch('data').map do |row|
            headings.zip(row.map {|value| decode(value) }).to_h
        end
    end

    # Converts an OVSDB JSON value to a Ruby scalar, array or hash.
    #   @param value [Object] value from the OVSDB JSON response
    #   @return [Object] decoded value, with UUIDs represented as strings
    def decode(value)
        return value unless value.is_a?(Array)

        case value.first
        when 'uuid', 'named-uuid' then value.last
        when 'set' then value.last.map {|item| decode(item) }
        when 'map' then value.last.to_h
        else value
        end
    end

    # Loads the bridges, ports, interfaces and mirrors used for reconciliation.
    def read_state
        @bridges    = read_table('Bridge', ['_uuid', 'name', 'ports', 'mirrors'])
        @ports      = read_table('Port', ['_uuid', 'name', 'interfaces'])
        @interfaces = read_table('Interface', ['_uuid', 'name', 'type', 'options'])
        @mirrors    = read_table('Mirror', MIRROR_COLUMNS)
    end

    # Returns the NIC's mirror definitions indexed by mirror ID.
    #   @param nic [VNMMAD::VNMNetwork::Nic] NIC with network_id and mirror_ids attributes
    #   @return [Hash<Integer, Hash>] definitions referenced by the NIC
    def mirror_definitions(nic)
        nid = Integer(nic[:network_id])

        nic[:mirror_ids].to_s.split(',').map do |id|
            mid = Integer(id)
            [mid, @definitions.fetch([nid, mid])]
        end.to_h
    end

    # Plans mirror changes for one virtual network on a host bridge.
    #   @param event [Symbol] NIC callback event
    #   @param vm_id [Integer] VM owning the affected NICs
    #   @param bridge_name [String] OVS bridge name
    #   @param network_id [Integer] virtual network ID
    #   @param nics [Array<VNMMAD::VNMNetwork::Nic>] affected NICs in this network
    def reconcile_network(event, vm_id, bridge_name, network_id, nics)
        bridge = @bridges.find {|row| row['name'] == bridge_name }

        return if !bridge && event == :deactivate

        raise "Mirror bridge #{bridge_name} does not exist" unless bridge

        ports = @ports.select {|port| Array(bridge['ports']).include?(port['_uuid']) }

        touched = nics.map do |nic|
            port = ports.find {|row| row['name'] == (nic[:tap] || nic[:target]) }

            if !port && event != :deactivate
                raise "Mirror port #{nic[:tap] || nic[:target]} is not on #{bridge_name}"
            end

            port && port['_uuid']
        end.compact

        definitions = {}

        nics.each do |nic|
            mirror_definitions(nic).each do |id, definition|
                definitions[id] = definition
            end
        end unless event == :deactivate

        installed = @mirrors.select do |row|
            match = MIRROR_NAME.match(row['name'].to_s)

            match &&
                match[1].to_i == network_id &&
                Array(bridge['mirrors']).include?(row['_uuid'])
        end

        installed = installed.group_by {|row| MIRROR_NAME.match(row['name'])[2].to_i }
        network   = Network.new(bridge_name, vm_id, nics, ports, touched)

        (installed.keys | definitions.keys).each do |id|
            rows       = installed.fetch(id, [])
            definition = definitions[id]
            desired    = desired_mirror(network, rows, definition)

            replace_mirror(bridge, network_id, id, rows, desired)
        end
    end

    # Builds the desired mirror fields, or returns nil when no mirror is needed.
    #   @param network [Network] bridge and affected NIC context
    #   @param rows [Array<Hash>] installed OVSDB rows for this mirror
    #   @param definition [Hash, nil] definition referenced by this callback's NICs
    #   @return [Hash, nil] desired fields, or nil when no source ports remain
    def desired_mirror(network, rows, definition)
        src = rows.flat_map {|row| Array(row['select_src_port']) }.uniq - network.touched
        dst = rows.flat_map {|row| Array(row['select_dst_port']) }.uniq - network.touched

        local_ports = network.ports.map {|port| port['_uuid'] }

        src &= local_ports
        dst &= local_ports

        if !definition
            return if src.empty? && dst.empty?

            return rows.first.merge('select_src_port' => src, 'select_dst_port' => dst)
        end

        selected = definition[:ports].to_s.split(',')
        vlans    = definition[:vlans].to_s.split(',').map {|vlan| Integer(vlan) }

        return if selected.empty?

        members = src | dst
        # Enrol only NICs belonging to this callback. Discovering other VMs'
        # selected ports here could re-add a source between its mirror removal
        # and its ordinary NIC teardown. Other VMs reconcile their own membership.
        network.nics.each do |nic|
            next unless selected.include?("#{network.vm_id}:#{Integer(nic[:nic_id])}")

            port = network.ports.find {|row| row['name'] == (nic[:tap] || nic[:target]) }
            members << port['_uuid'] if port
        end

        members.uniq!

        return if members.empty?

        src = definition[:direction] != 'IN' ? members : []
        dst = definition[:direction] != 'OUT' ? members : []

        output = resolve_output(network.bridge, definition, rows)

        {
            'select_all'      => false,
            'select_src_port' => src,
            'select_dst_port' => dst,
            'select_vlan'     => vlans,
            'output_port'     => output.fetch(:port, []),
            'output_vlan'     => output.fetch(:vlan, [])
        }
    end

    # Queues creation, update or removal of a mirror and removes duplicate rows.
    #   @param bridge [Hash] OVSDB bridge row
    #   @param network_id [Integer] virtual network ID
    #   @param id [Integer] mirror ID within the network
    #   @param rows [Array<Hash>] installed OVSDB rows for this mirror
    #   @param desired [Hash, nil] desired fields, or nil to remove the mirror
    def replace_mirror(bridge, network_id, id, rows, desired)
        name     = "one-pm-#{network_id}-#{id}"
        survivor = rows.find {|row| row['name'] == name } || rows.first

        if desired
            desired = desired.reject {|key, _| ['_uuid', 'name'].include?(key) }

            desired['name'] = name

            if survivor
                changes = desired.reject {|key, value| equal_field?(survivor[key], value) }

                if !changes.empty?
                    @commands << command('set', 'Mirror', survivor['_uuid'], *assignments(changes))
                end

                @result.find {|row| row['_uuid'] == survivor['_uuid'] }.merge!(desired)
            else
                uuid = next_id('mirror')

                @commands << command("--id=#{uuid}", 'create', 'Mirror', *assignments(desired))
                @commands << command('add', 'Bridge', bridge['_uuid'], 'mirrors', uuid)

                @result << desired.merge('_uuid' => uuid)

                survivor = { '_uuid' => uuid }
            end
        end

        rows.each do |row|
            next if desired && row['_uuid'] == survivor['_uuid']

            @commands << command('remove', 'Bridge', bridge['_uuid'], 'mirrors', row['_uuid'])
            @commands << command('--if-exists', 'destroy', 'Mirror', row['_uuid'])

            @result.reject! {|item| item['_uuid'] == row['_uuid'] }
        end
    end

    # Compares OVSDB field values, ignoring array order.
    #   @param current [Object] installed field value
    #   @param desired [Object] desired field value
    def equal_field?(current, desired)
        if current.is_a?(Array) || desired.is_a?(Array)
            Array(current).sort == Array(desired).sort
        else
            current == desired
        end
    end

    # Formats OVSDB fields as ovs-vsctl assignments.
    #   @param fields [Hash] column names and values
    def assignments(fields)
        fields.map do |key, value|
            value = "[#{value.join(',')}]" if value.is_a?(Array)
            "#{key}=#{value}"
        end
    end

    # Builds a shell-escaped ovs-vsctl subcommand.
    #   @param arguments [Array<Object>] command arguments
    def command(*arguments)
        Shellwords.join(arguments.map(&:to_s))
    end

    # Generates a unique named UUID reference within the current transaction.
    #   @param kind [String] reference prefix, such as mirror or output
    def next_id(kind)
        @sequence += 1
        "@#{kind}#{@sequence}"
    end

    # Selects the RSPAN output VLAN or queues GRE/ERSPAN tunnel configuration.
    #   @param bridge [String] OVS bridge name
    #   @param definition [Hash] desired mirror definition
    #   @param mirrors [Array<Hash>] installed rows for this logical mirror
    #   @return [Hash] :vlan ID or :port UUID, which may be a transaction reference
    def resolve_output(bridge, definition, mirrors)
        case definition[:type]
        when 'RSPAN'
            { :vlan => Integer(definition[:output_vlan]) }
        when 'GRE', 'ERSPAN'
            options  = { 'remote_ip' => definition.fetch(:remote_ip) }
            local_ip = resolve_local_ip(definition[:local_ip])

            options['local_ip'] = local_ip if local_ip

            type = definition[:type] == 'GRE' ? 'gre' : 'erspan'

            if type == 'erspan'
                options['key'] = Integer(definition.fetch(:erspan_key)).to_s

                if definition[:erspan_type] == 'II'
                    options['erspan_ver'] = '1'
                    options['erspan_idx'] = "0x#{Integer(definition.fetch(:erspan_index)).to_s(16)}"
                else
                    options['erspan_ver'] = '2'
                    options['erspan_dir'] = '1'
                    options['erspan_hwid'] = "0x#{Integer(definition.fetch(:erspan_hwid)).to_s(16)}"
                end
            end

            { :port => tunnel_output(bridge, type, options, mirrors) }
        else
            raise "Unsupported mirror type #{definition[:type]}"
        end
    end

    # Resolves a tunnel source address, or returns nil when none is specified.
    #   @param value [String, nil] IPv4 address or interface:<name> reference
    #   @return [String, nil] IPv4 address; interface references must resolve uniquely
    def resolve_local_ip(value)
        return if value.to_s.empty?
        return value unless value.start_with?('interface:')

        interface = value.delete_prefix('interface:')
        data      = JSON.parse(
            run("#{@ip} -j -4 address show dev #{Shellwords.escape(interface)}")
        )

        addresses = data.flat_map do |link|
            link.fetch('addr_info', []).reject {|address| address['scope'] == 'host' }
                .map {|address| address.fetch('local') }
        end.uniq

        raise "Mirror interface #{interface} must have exactly "\
              'one IPv4 address' unless addresses.one?

        addresses.first
    end

    # Collects GRE and ERSPAN ports, including unmanaged ports for conflict checks.
    #   @return [Array<Hash>] outputs with :port, :bridge, :type and :options
    def tunnel_outputs
        @ports.map do |port|
            interface = @interfaces.find {|row| Array(port['interfaces']) == [row['_uuid']] }

            next unless interface && ['gre', 'erspan'].include?(interface['type'])

            bridge = @bridges.find {|row| Array(row['ports']).include?(port['_uuid']) }

            {
                :port    => port,
                :bridge  => bridge && bridge['name'],
                :type    => interface['type'],
                :options => normalize_options(interface['options'])
            }
        end.compact
    end

    # Normalizes tunnel options for comparison with the desired configuration.
    #   @param options [Hash] OVSDB interface options
    def normalize_options(options)
        options.transform_values(&:to_s).map do |key, value|
            if ['erspan_idx', 'erspan_hwid'].include?(key) && value != 'flow'
                value = "0x#{Integer(value, 16).to_s(16)}"
            end

            [key, value]
        end.to_h
    end

    # Builds the tunnel identity from its type, endpoints and key.
    #   @param type [String] OVS tunnel type (gre or erspan)
    #   @param options [Hash] tunnel interface options
    def tunnel_identity(type, options)
        local = options['local_ip'].to_s
        local = '' if local == '0.0.0.0'

        key = options.fetch('in_key', options.fetch('key', '0'))
        key = Integer(key, 0).to_s unless key == 'flow'

        [type, local, options['remote_ip'], key]
    end

    # Reuses a compatible managed tunnel or queues its creation/reconfiguration.
    # Rejects changes that would conflict with another tunnel or mirror.
    #   @param bridge [String] OVS bridge name
    #   @param type [String] OVS tunnel type (gre or erspan)
    #   @param options [Hash] desired tunnel interface options
    #   @param mirrors [Array<Hash>] installed rows for this logical mirror
    #   @return [String] output port UUID or named reference in this transaction
    def tunnel_output(bridge, type, options, mirrors)
        identity   = tunnel_identity(type, options)
        candidates = @outputs.select do |output|
            tunnel_identity(output[:type], output[:options]) == identity
        end

        compatible = candidates.find do |output|
            owned_output?(output) && output[:bridge] == bridge && output[:options] == options
        end

        return compatible[:port]['_uuid'] if compatible

        if !candidates.empty?
            # Metadata can change in place only if every reference belongs to
            # this logical mirror. A different name cannot resolve a conflicting
            # GRE endpoint/key tuple in OVS.
            exclusive = candidates.find do |output|
                owned_output?(output) &&
                output[:bridge] == bridge &&
                exclusive_output?(output, mirrors)
            end

            raise 'Mirror tunnel configuration conflicts with another OVS output' unless exclusive

            configure_tunnel(exclusive[:port]['name'], type, options)

            exclusive[:options] = options

            return exclusive[:port]['_uuid']
        end

        name = unused_output_name(bridge, type, options)
        uuid = next_id('output')

        @commands << command('--may-exist', 'add-port', bridge, name)

        configure_tunnel(name, type, options)

        @commands << command("--id=#{uuid}", 'get', 'Port', name)
        @outputs <<
        {
            :port => {
                '_uuid' => uuid,
                'name'  => name
            },
            :bridge  => bridge,
            :type    => type,
            :options => options
        }

        uuid
    end

    # Checks whether a tunnel output uses the driver-managed naming scheme.
    #   @param output [Hash] tunnel output with a :port row
    def owned_output?(output)
        OUTPUT_NAME.match?(output[:port]['name'])
    end

    # Checks whether only the supplied mirror rows reference this output.
    #   @param output [Hash] tunnel output with a :port row
    #   @param mirrors [Array<Hash>] installed rows for this logical mirror
    def exclusive_output?(output, mirrors)
        references = @result.select do |row|
            Array(row['output_port']).include?(output[:port]['_uuid'])
        end

        references.all? {|row| mirrors.any? {|mirror| mirror['_uuid'] == row['_uuid'] } }
    end

    # Queues replacement of an interface's tunnel type and options.
    #   @param name [String] OVS interface name
    #   @param type [String] OVS tunnel type (gre or erspan)
    #   @param options [Hash] desired tunnel interface options
    def configure_tunnel(name, type, options)
        @commands << command('clear', 'Interface', name, 'options')
        @commands << command('set',
                             'Interface',
                             name,
                             "type=#{type}",
                             *options.map {|key, value| "options:#{key}=#{value}" })
    end

    # Generates an available driver-managed port name for the tunnel.
    #   @param bridge [String] OVS bridge name
    #   @param type [String] OVS tunnel type (gre or erspan)
    #   @param options [Hash] desired tunnel interface options
    def unused_output_name(bridge, type, options)
        occupied = (@ports + @outputs.map {|output| output[:port] }).map {|port| port['name'] }
        salt     = 0

        loop do
            digest = Digest::SHA256.hexdigest(
                JSON.generate([bridge, type, options.sort, salt])
            )
            name   = "one-m-#{digest[0, 9]}"

            return name unless occupied.include?(name)

            salt += 1
        end
    end

    # Queues removal of managed tunnel ports unreferenced by the planned mirror state.
    #   @param bridges [Array<String>] bridge names affected by this callback
    def release_outputs(bridges)
        referenced = @result.flat_map {|row| Array(row['output_port']) }

        @outputs.each do |output|
            port = output[:port]

            next if !bridges.include?(output[:bridge]) ||
                    !OUTPUT_NAME.match?(port['name'])

            next if referenced.include?(port['_uuid'])

            @commands << command('--if-exists', 'del-port', output[:bridge], port['name'])
        end
    end

end
