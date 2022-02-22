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

require 'pathname'

module OneProvision

    # Provision configuration class
    #
    # Class to manage configuration file used to deploy a provision
    #
    # STEPS
    ############################################################################
    #
    # 1. Load configuration file
    # 2. Parse configuration to add provision defaults sections
    # 3. Check that objects have specific sections
    # 4. Check evaluation rules they should follow:
    #
    #   ${object.name.attr}
    #
    # where:
    #
    #   - object: valid values Resource::EVAL_KEYS
    #   - name: any alphanumeric string
    #   - attr: object attribute located at first level
    class ProvisionConfig

        # Class constructor
        #
        # @param template [String/Hash]
        #   String -> Path to configuration YAML file
        #   Hash -> configuration file already loaded
        # @param inputs [Hash] User inputs values
        def initialize(template, inputs = nil)
            @inputs = inputs

            case template
            when Hash
                @config = template
            else
                @config_file = template
            end
        end

        # Loads configuration file
        def load
            @config = partial_load(@config_file)
        end

        # Parses configuration hash to add defaults into each section
        #
        # @param eval_ui [Boolean] True to get values, false otherwise
        def parse(eval_ui = false)
            begin
                defaults = @config['defaults']

                ################################################################
                # Cluster
                ################################################################

                if @config['cluster'].nil?
                    @config['cluster'] = { 'name' => @config['name'] }
                end

                @config['cluster']['provision'] ||= {}

                if defaults && defaults.key?('provision')
                    @config['cluster']['provision'].merge!(
                        defaults['provision']
                    )
                end

                ################################################################
                # Hosts
                ################################################################

                if @config['hosts']
                    sections = %w[connection provision configuration]

                    @config['hosts'].map! do |host|
                        sections.each do |section|
                            data = CONFIG_DEFAULTS[section] || {}

                            if @config['defaults']
                                defaults = @config['defaults'][section]
                            end

                            h_sec = host[section]

                            # merge defaults with globals
                            # and device specific params
                            data.merge!(defaults) unless defaults.nil?
                            data.merge!(h_sec) unless h_sec.nil?

                            host[section] = data
                        end

                        host
                    end
                end

                ################################################################
                # Datastores & Networks
                ################################################################

                %w[datastores networks].each do |r|
                    next unless @config[r]

                    @config[r].map! do |x|
                        x['provision'] ||= {}

                        if defaults && defaults.key?('provision')
                            x['provision'].merge!(defaults['provision'])
                        end

                        x
                    end
                end

                # Add provision ID into ARs to evaluate it later
                if @config['networks']
                    @config['networks'].each do |vnet|
                        next unless vnet['ar']

                        unless vnet['ar'].is_a? Array
                            raise 'ar should be an array'
                        end

                        vnet['ar'].each do |ar|
                            ar['provision_id'] = '${provision_id}'
                        end
                    end
                end

                ################################################################
                # User inputs
                ################################################################
                return unless eval_ui

                eval_user_inputs
            rescue StandardError => e
                Utils.fail("Failed to read configuration: #{e}")
            end
        end

        # Checks configuration file for some specifics attributes
        #
        #   - Each host should have im_mad, vm_mad and hostname
        #   - Each datastore should have tm_mad and ds_mad
        #   - Each network should have vn_mad
        def check
            if @config['name'].nil?
                Utils.fail('in your configuration file: no name given')
            end

            if @config['hosts']
                unless @config['hosts'].is_a? Array
                    Utils.fail('hosts should be an array')
                end

                @config['hosts'].each_with_index do |h, i|
                    if h['im_mad'].nil?
                        Utils.fail("in configuration file: no im_mad #{i + 1}")
                    end

                    if h['vm_mad'].nil?
                        Utils.fail("in configuration file: no vm_mad #{i + 1}")
                    end

                    next unless h['provision']['hostname'].nil?

                    Utils.fail("in configuration file: no hostname #{i + 1}")
                end
            end

            if @config['datastores']
                unless @config['datastores'].is_a? Array
                    Utils.fail('datastores should be an array')
                end

                @config['datastores'].each_with_index do |d, i|
                    if d['tm_mad'].nil?
                        Utils.fail("in configuration file: no tm_mad #{i + 1}")
                    end

                    next if d['type']

                    next if d['ds_mad']

                    Utils.fail("in configuration file: no ds_mad #{i + 1}")
                end
            end

            return unless @config['networks']

            unless @config['networks'].is_a? Array
                Utils.fail('networks should be an array')
            end

            @config['networks'].each_with_index do |n, i|
                next unless n['vn_mad'].nil?

                Utils.fail("in configuration file: no vn_mad #{i + 1}")
            end
        end

        # Checks evaluation rules
        def check_rules
            iterate(@config) do |value|
                rc = check_rule(value)

                next if rc[0]

                Utils.fail("expression #{value}: #{rc[1]}")
            end
        end

        # Evaluates all rules
        #
        # @param provision [Provision] Provision object
        def eval_rules(provision)
            iterate(@config, true) do |value|
                matches = value.to_s.scan(/\$\{(.*?)\}/).flatten

                unless matches.empty?
                    matches.each do |match|
                        # match[0]: object
                        # match[1]: name
                        # match[2]: attribute
                        match = match.split('.')

                        if match.size == 1
                            if @config['provision']
                                index = @config['provision']['index']
                            end

                            value.gsub!('${provision}', provision.name.to_s)
                            value.gsub!('${provision_id}', provision.id.to_s)

                            value.gsub!('${index}', index.to_s) if index
                        else
                            objects = provision.info_objects("#{match[0]}s")
                            obj_int = Integer(match[1]) rescue false

                            if obj_int
                                object = objects[obj_int]
                            else
                                object = objects.find do |o|
                                    o['NAME'] == match[1]
                                end
                            end

                            key     = match[2].upcase
                            object  = object.to_hash
                            object  = object[object.keys[0]]
                            replace = object[key]

                            replace ||= object['TEMPLATE'][key]
                            replace ||= object['TEMPLATE']['PROVISION'][key]

                            value.gsub!("${#{match.join('.')}}", replace)
                        end
                    end
                end

                value
            end
        end

        # Validates the configuration file
        #
        #   Check if file can be loaded
        #   Parse it to merge different sections
        #   Check specific attributes
        #   Check all evaluation rules
        #
        # @param check_load [Boolean] True to check yaml load operacion
        def validate(check_load = true)
            self.load if check_load

            @config.delete_if {|_k, v| v.nil? }

            parse

            check

            check_rules

            @config
        end

        ########################################################################
        # Helper functions
        ########################################################################

        # Modifies configuration hash
        #
        # @param path  [String] Path separated with /
        # @param value [String] Value to set
        def []=(path, value)
            path = path.split('/')
            hash = dsearch(path[0..-2])

            hash[path[-1]] = value
        end

        # Gets value from configuration hash
        #
        # @param path [String] Path separated with /
        #
        # @return [String] Value in the path
        def [](path)
            dsearch(path.split('/'))
        end

        # Gets extra information from the template
        #
        # @return [Hash] Extra information
        def extra
            ret = {}

            reject = %w[cluster
                        datastores
                        defaults
                        extends
                        flowtemplates
                        hosts
                        images
                        inputs
                        marketplaceapps
                        name
                        networks
                        playbook
                        templates
                        vntemplates
                        name
                        description
                        state
                        provider
                        provision
                        start_time]

            @config.each do |key, value|
                next if reject.include?(key)

                ret[key] = value
            end

            ret
        end

        private

        # Reads configuration content
        #
        # @param name [String] Path to the configuration file
        #
        # @return [Hash] Configuration content
        def partial_load(name)
            begin
                yaml = YAML.load_file(name) || {}
            rescue StandardError => e
                Utils.fail("Failed to read template: #{e}")
            end

            if yaml['extends']
                yaml['extends'] = [yaml['extends']].flatten

                yaml['extends'].reverse.each do |f|
                    unless Pathname.new(f).absolute?
                        f = "#{File.expand_path('..', name)}/#{f}"
                    end

                    base = partial_load(f)

                    yaml.delete('extends')

                    base['defaults'] ||= {}
                    yaml['defaults'] ||= {}

                    if base['playbook']
                        playbooks = []

                        playbooks << base['playbook']
                        playbooks << yaml['playbook'] if yaml['playbook']

                        playbooks.flatten!

                        yaml['playbook'] = playbooks

                        base.delete('playbook')
                    end

                    if yaml['playbook']
                        yaml['playbook'] = [yaml['playbook']]
                        yaml['playbook'].flatten!
                    end

                    # replace scalars or append array from child YAML
                    yaml.each do |key, value|
                        next if key == 'defaults'

                        if (value.is_a? Array) && (base[key].is_a? Array)
                            base[key].concat(value)
                        else
                            base[key] = value
                        end
                    end

                    # merge each defaults section separately
                    %w[connection provision configuration].each do |section|
                        base['defaults'][section] ||= {}
                        yaml['defaults'][section] ||= {}
                        defaults = yaml['defaults'][section]

                        base['defaults'][section].merge!(defaults)
                    end

                    yaml = base
                end
            end

            yaml
        end

        # Iterates over objects
        #
        # @param objects [Object]  Objects to iterate over
        # @param ev      [Boolean] True to assign value
        def iterate(objects, ev = false, &block)
            if objects.is_a? Hash
                objects.each do |key, value|
                    case value
                    when Hash
                        iterate(value, ev, &block)
                    when Array
                        if ev
                            value.map! {|el| iterate(el, ev, &block) }
                        else
                            value.each {|el| iterate(el, ev, &block) }
                        end
                    else
                        ret = yield(value)

                        objects[key] = ret if ev
                    end
                end
            else
                yield(objects)
            end
        end

        # Check that evaluation rule fixes the format
        #
        # @param rule [String] Rule to check
        #
        # @return [Boolean, String]
        #   True, '' if rule is correct
        #   False, 'Error message' otherwhise
        def check_rule(rule)
            rule    = rule.to_s
            matches = rule.scan(/\$\{(.*?)\}/).flatten

            # Skip the rule as it does not fit in ${} pattern
            return [true, ''] if matches.empty?

            matches.each do |match|
                match = match.split('.')

                ################################################################
                # Special evaluation for keys provision, provision_id and idx
                ################################################################

                if match.size == 1 && !Resource::S_EVAL_KEYS.include?(match[0])
                    return [false, "key #{match[0]} invalid"]
                end

                next if match.size == 1

                ################################################################
                # User inputs
                ################################################################

                if match.size == 2 && match[0] != 'input'
                    return [false, "key #{match[0]} invalid for user inputs"]
                end

                if match.size == 2
                    unless @config['inputs']
                        return [false, 'user inputs not found']
                    end

                    input = @config['inputs'].find {|v| v['name'] == match[1] }

                    unless input
                        return [false, "user input #{match[1]} not found"]
                    end

                    case input['type']
                    when 'boolean'
                        next unless input['default']

                        next if %w[NO YES].include?(input['default'])

                        return [false, "default #{input['default']} is invalid"]
                    when 'list'
                        unless input['options']
                            return [false, 'input type list needs options']
                        end

                        next unless input['default']

                        next if input['options'].include?(input['default'])

                        return [false, "default #{input['default']} " \
                                        'is not in list']
                    when 'array'
                        next unless input['default']

                        next if input['default'].match(/(\w+)(;\s*\w+)*/)

                        return [false, "default #{input['default']} " \
                                       'invalid format']
                    when 'range'
                        unless input['min_value'] && input['max_value']
                            return [false,
                                    'input type range needs min_value ' \
                                    'and max_value']
                        end

                        begin
                            Integer(input['min_value'])
                            Integer(input['max_value'])
                        rescue StandardError
                            return [false,
                                    'min_value and max_value ' \
                                    'must be integer']
                        end

                        next
                    else
                        next
                    end
                end

                ################################################################
                # Rules can only access to first level they must be
                #   resource.name.attr
                ################################################################

                return [false, 'there are no 3 elements'] if match.size != 3

                # Only a group of key words is available
                unless Resource::EVAL_KEYS.include?(match[0])
                    return [false, "key #{match[0]} is not valid"]
                end

                # Every part of the rule can only have numbers, letters, _ and -
                rc = match.each do |m|
                    next if m[/[a-zA-Z0-9_-]+/] == m

                    break [false, "#{m} has invalid characters"]
                end

                return rc if rc[0] == false

                # Check that referenced names can be found in @config
                elements = @config[match[0]] || @config["#{match[0]}s"] || []
                elements = [elements].flatten

                # Add market apps so user can refer to them
                if @config['marketplaceapps']
                    elements += @config['marketplaceapps']
                end

                elem_int = Integer(match[1]) rescue false

                if elem_int
                    elem = elements[elem_int]
                else
                    elem = elements.find do |o|
                        o['NAME'] == match[1] || o['name'] == match[1]
                    end
                end

                return [false, "#{match[0]} #{match[1]} not found"] if elem.nil?
            end

            [true, '']
        end

        # Search inside path
        #
        # @param path [String] Path to search on
        def dsearch(path)
            hash = @config

            path.delete_if {|s| s.nil? || s.empty? }

            path.each do |p|
                if hash.is_a? Hash
                    if hash[p]
                        hash = hash[p]
                    else
                        hash = nil
                        break
                    end
                else
                    hash = nil
                    break
                end
            end

            hash
        end

        # Evaluates user inputs
        def eval_user_inputs
            return unless @config['inputs']

            iterate(@config, true) do |value|
                matches = value.to_s.scan(/\$\{(.*?)\}/).flatten

                unless matches.empty?
                    matches.each do |match|
                        # match[0]: input
                        # match[1]: name
                        match = match.split('.')

                        next unless match[0] == 'input'

                        if @config['inputs']
                            input = @config['inputs'].find do |v|
                                v['name'] == match[1]
                            end
                        end

                        if @inputs
                            # Add CLI user inputs values
                            i_value = @inputs.find do |v|
                                v['name'] == match[1]
                            end

                            input['value'] = i_value['value']
                        end

                        if input['value']
                            i_value = input['value']
                        else
                            if $stdout.isatty
                                i_value = ProvisionConfig.ask_user_inputs(input)
                            elsif input['default']
                                i_value = input['default']
                            else
                                Utils.fail(
                                    "Cannot parse user input #{input['name']}"
                                )
                            end

                            input['value'] = i_value
                        end

                        case input['type']
                        when 'array'
                            value = []
                            value << i_value.split(';')
                            value.flatten!
                        else
                            value.gsub!("${#{match.join('.')}}", i_value.to_s)
                        end
                    end
                end

                value
            end
        end

        # Asks for user input value
        #
        # @param input [Hash] User input information
        # rubocop:disable Lint/IneffectiveAccessModifier
        def self.ask_user_inputs(input)
            # rubocop:enable Lint/IneffectiveAccessModifier

            puts

            desc = input['description']
            puts desc if desc && !desc.empty?

            case input['type']
            when 'text', 'text64'
                print "Text `#{input['name']}` (default=#{input['default']}): "

                answer = STDIN.readline.chop
                answer = input['default'] if !answer || answer.empty?

                if input['type'] == 'text64'
                    answer = Base64.encode64(answer).strip.delete("\n")
                end
            when 'boolean'
                until %w[YES NO].include?(answer)
                    print "Bool `#{input['name']}` " \
                          "(default=#{input['default']}): "

                    answer = STDIN.readline.chop
                    answer = input['default'] if !answer || answer.empty?

                    # Add default in case no default value is given
                    answer = 'NO' if !answer || answer.empty?

                    unless %w[YES NO].include?(answer)
                        puts "Invalid boolean #{answer} " \
                             'boolean has to be YES or NO'
                    end
                end
            when 'password'
                print "Pass `#{input['name']}` (default=#{input['default']}): "

                STDIN.noecho {|io| answer = io.gets }

                answer = answer.chop! if answer
                answer = input['default'] if !answer || answer.empty?
            when 'number', 'number-float'
                valid = false

                until valid
                    print "Num `#{input['name']}` " \
                          "(default=#{input['default']}): "

                    answer = STDIN.readline.chop
                    answer = input['default'] if !answer || answer.empty?

                    # Add default in case no default value is given
                    answer ||= 0

                    begin
                        if input['type'] == 'number'
                            answer = Integer(answer)
                        else
                            answer = Float(answer)
                        end
                    rescue ArgumentError
                        puts 'Wrong format'
                        next
                    end

                    valid = true
                end
            when 'range', 'range-float'
                min   = input['min_value']
                max   = input['max_value']
                valid = false

                until valid
                    print "Range `#{input['name']}` [#{min}..#{max}] " \
                          "(default=#{input['default']}): "

                    answer = STDIN.readline.chop
                    answer = input['default'] if !answer || answer.empty?

                    # Add default in case no default value is given
                    answer ||= input['min_value']

                    begin
                        if input['type'] == 'range'
                            answer = Integer(answer)
                        else
                            answer = Float(answer)
                        end

                        if answer < min || answer > max
                            puts 'Not in range'
                            next
                        end
                    rescue ArgumentError
                        puts 'Wrong format'
                        next
                    end

                    valid = true
                end
            when 'list'
                puts
                input['options'].each_with_index do |opt, i|
                    puts "    #{i}  #{opt}"
                end
                puts

                until input['options'].include?(answer)
                    print 'Please select the option ' \
                          "(default=#{input['default']}): "

                    answer = STDIN.readline.chop
                    answer = input['default'] if !answer || answer.empty?

                    # Add default in case no default value is given
                    answer = input['options'][0] if !answer || answer.empty?
                end
            when 'array'
                answer = ''

                until answer.match(/(\w+)(;\s*\w+)*/)
                    print "Array `#{input['name']}` " \
                          "(default=#{input['default']}): "

                    answer = STDIN.readline.chop
                    answer = input['default'] if !answer || answer.empty?
                end
            when 'fixed'
                answer = input['default']
            end

            answer
        end

    end

end
