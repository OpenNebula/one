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
        def initialize(template)
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
        def parse
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
                            value.gsub!('${provision}', provision.name.to_s)
                            value.gsub!('${provision_id}', provision.id.to_s)

                            if provision.idx
                                value.gsub!('${index}', provision.idx.to_s)
                            end
                        else
                            objects = provision.info_objects("#{match[0]}s")
                            object  = objects.find do |obj|
                                obj['NAME'] == match[1]
                            end

                            object  = object.to_hash
                            object  = object[object.keys[0]]

                            value.gsub!("${#{match.join('.')}}",
                                        object[match[2].upcase])
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
        def validate
            self.load

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

        private

        # Reads configuration content
        #
        # @param name [String] Path to the configuration file
        #
        # @return [Hash] Configuration content
        def partial_load(name)
            begin
                yaml = YAML.load_file(name)
            rescue StandardError => e
                Utils.fail("Failed to read template: #{e}")
            end

            if yaml['extends']
                yaml['extends'] = [yaml['extends']].flatten

                yaml['extends'].reverse.each do |f|
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

                # Special evaluation for keys provision, provison_id and idx
                if match.size == 1 && !Resource::S_EVAL_KEYS.include?(match[0])
                    return [false, "key #{match[0]} invalid"]
                end

                next if match.size == 1

                # Rules can only access to first level they must be
                #   resource.name.attr
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

                unless elements.find {|v| v['name'] == match[1] }
                    return [false, "#{match[0]} #{match[1]} not found"]
                end
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

    end

end
