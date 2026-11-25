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
module OneKS

    # Helper methods for loading and processing OneKS families
    module FamilyHelper

        COMP = 'K8S'
        CONF_MAP = {
            'controlplanes' => 'controlplane.conf',
            'nodegroups'    => 'nodegroup.conf'
        }

        # List all families inside families_dir
        #
        # @param families_dir [String] path to controlplanes/ or nodegroups/
        # @return [Array<Hash>, OpenNebula::Error]
        def self.families(families_dir)
            return OpenNebula::Error.new(
                "Family location '#{families_dir}' not found",
                OpenNebula::Error::ENO_EXISTS
            ) unless Dir.exist?(families_dir)

            dirs = Dir.children(families_dir)
                      .select {|d| File.directory?(File.join(families_dir, d)) }

            return OpenNebula::Error.new(
                "No families found in #{families_dir}",
                OpenNebula::Error::ENO_EXISTS
            ) if dirs.empty?

            list = dirs.filter_map do |dir|
                tpl = family_by_name(families_dir, dir)
                tpl unless tpl.is_a?(OpenNebula::Error)
            end

            return OpenNebula::Error.new(
                "No valid family found in #{families_dir}",
                OpenNebula::Error::ENO_EXISTS
            ) if list.empty?

            list
        rescue StandardError => e
            OpenNebula::Error.new(
                "Error accessing families in #{families_dir}: #{e.message}",
                OpenNebula::Error::EACTION
            )
        end

        # Load metadata for a specific family
        #
        # @param families_dir [String]
        # @param name [String] folder name (e.g. "general")
        # @return [Hash, OpenNebula::Error]
        def self.family_by_name(families_dir, name)
            conf = load_family_conf(families_dir, name)
            return conf if OpenNebula.is_error?(conf)

            err = validate_family(conf)
            return err if OpenNebula.is_error?(err)

            {
                :name                   => conf[:name],
                :description            => conf[:description],
                :family                 => name,
                :supported_k8s_versions => Array(conf[:supported_k8s_versions]),
                :user_inputs            => Array(conf[:user_inputs]),
                :flavours               => build_flavours(conf[:flavours]),
                :templates              => load_family_templates(families_dir, name),
                :dependencies           => build_dependencies(conf[:dependencies])
            }
        rescue StandardError => e
            OpenNebula::Error.new(
                "Error reading family '#{name}': #{e.message}",
                OpenNebula::Error::EACTION
            )
        end

        # Load and parse configuration for a family group
        #
        # @param families_dir [String]
        # @param family [String]
        # @return [Hash, OpenNebula::Error]
        def self.load_family_conf(families_dir, family)
            base = File.basename(families_dir)
            conf_file = CONF_MAP[base] or raise "Unsupported configuration resource '#{base}'"

            path = File.join(families_dir, family, conf_file)

            return OpenNebula::Error.new(
                "Family '#{family}' not found",
                OpenNebula::Error::ENO_EXISTS
            ) unless File.file?(path)

            raw  = File.read(path, :encoding => 'UTF-8')
            data = YAML.safe_load(raw, :aliases => false)

            return OpenNebula::Error.new(
                "Invalid YAML structure in #{path}",
                OpenNebula::Error::EACTION
            ) unless data.is_a?(Hash)

            data.deep_symbolize_keys
        rescue Psych::Exception => e
            OpenNebula::Error.new(
                "YAML error in family '#{family}': #{e.message}",
                OpenNebula::Error::EACTION
            )
        rescue StandardError => e
            OpenNebula::Error.new(
                "Error reading family '#{family}': #{e.message}",
                OpenNebula::Error::EACTION
            )
        end

        # Build user_inputs (including default values)
        #
        # @param conf [Hash] parsed family YAML
        # @param flavour [String, Symbol]
        # @param overrides [Hash]
        # @return [Array(user_inputs), Hash(values)]
        def self.build_inputs_for_flavour(family, flavour_name, overrides = {})
            inputs      = family[:user_inputs]
            flavour     = family[:flavours].find {|f| f[:name] == flavour_name }
            overrides ||= {}

            raise(
                ArgumentError, "Unknown flavour '#{flavour_name}' for family #{family[:family]}"
            ) if flavour.nil?

            defaults         = flavour[:defaults] || {}
            override_allowed = flavour.fetch(:override_defaults, true)

            # Build user_inputs array with :default injected
            inputs_with_defaults = inputs.map do |input|
                name = input[:name].to_sym
                defaults.key?(name) ? input.merge(:default => defaults[name]) : input
            end

            # Apply flavour defaults + optional overrides
            # When owerride alloed, overrides values (user values) have preference
            values = override_allowed ? defaults.merge(overrides) : overrides.merge(defaults)

            [inputs_with_defaults, values]
        end

        # Read spec.erb for a given family nodegroup
        #
        # @param dir [String]
        # @param conf_name [String]
        # @return [String]
        def self.spec_content(families_dir, family)
            spec_path = File.join(families_dir, family, 'spec.erb')
            raise "Template file not found: #{spec_path}" unless File.file?(spec_path)

            File.read(spec_path)
        rescue Errno::ENOENT
            raise "Template file not found: #{spec_path}"
        rescue Errno::EACCES
            raise "Permission denied while reading family: #{spec_path}"
        rescue StandardError => e
            raise "Error reading spec file '#{spec_path}': #{e.message}"
        end

        # Loads all ERB templates under <families_dir>/<family>/templates/
        #
        # @param families_dir [String]
        # @param family [String]
        # @return [Hash<String,String>] map of template_name => erb content
        def self.load_family_templates(families_dir, family)
            base = File.join(families_dir, family, 'templates')
            return {} unless Dir.exist?(base)

            Dir.children(base).each_with_object({}) do |file, h|
                next unless file.end_with?('.erb')

                name    = File.basename(file, '.erb')
                path    = File.join(base, file)

                h[name.to_sym] = File.read(path, :encoding => 'UTF-8')
            end
        rescue StandardError => e
            raise "Error reading family templates for #{family}: #{e.message}"
        end

        # Validate required fields of a family conf
        #
        # @param data [Hash]
        # @return [nil, OpenNebula::Error]
        def self.validate_family(data)
            missing = []

            missing << :name        unless data[:name]
            missing << :description unless data[:description].is_a?(String)
            missing << :user_inputs unless data[:user_inputs].is_a?(Array)
            missing << :flavours    if data.key?(:flavours) && !data[:flavours].is_a?(Hash)
            missing << :supported_k8s_versions unless data[:supported_k8s_versions]

            return if missing.empty?

            OpenNebula::Error.new(
                "Invalid family configuration: missing/invalid #{missing.join(', ')}",
                OpenNebula::Error::EACTION
            )
        end

        # Convert flavours into array
        #
        # @param flavours [Hash]
        # @return [Array<Hash>]
        def self.build_flavours(flavours)
            return [] unless flavours.is_a?(Hash)

            flavours.map do |name, cfg|
                next unless cfg.is_a?(Hash)

                {
                    :name              => name.to_s,
                    :label             => cfg[:label],
                    :description       => cfg[:description],
                    :override_defaults => cfg.fetch(:override_defaults, true),
                    :defaults          => cfg[:defaults] || {}
                }
            end.compact
        end

        # Convert dependencies into array
        #
        # @param dependencies [Array<Hash>]
        # @return [Array<Hash>]
        def self.build_dependencies(dependencies)
            return [] unless dependencies.is_a?(Array)

            dependencies.map do |dep|
                {
                    :type => dep[:object],
                    :opts => dep[:options] || {}
                }
            end
        end

    end

end
