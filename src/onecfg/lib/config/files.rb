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

# rubocop:disable Style/ClassAndModuleChildren
module OneCfg::Config

    # Class to scan and validate configuration files
    class Files < OneCfg::Settings

        # Base name prefix for configuration classes
        TYPE_CLASS_NAME = 'OneCfg::Config::Type'

        # Class constructor
        def initialize
            super(OneCfg::FILES_CFG, [:auto_load, :read_only])

            # we really need the classification data
            # rubocop:disable Style/GuardClause
            if !@content.is_a?(Array) || @content.empty?
                raise OneCfg::Config::Exception::FatalError,
                      'Missing classification of configuration files'
            end
            # rubocop:enable Style/GuardClause
        end

        def scan(prefix = '/', strict = true)
            ret = {}

            # fileops provides sandboxed operations
            fops = OneCfg::Config::FileOperation.new(prefix)

            @content.each do |file|
                fops.glob(file['name'], false).each do |match|
                    next if fops.directory?(match)

                    if file.key?('class')
                        # file already scanned matched once again
                        if ret.key?(match)
                            raise OneCfg::Config::Exception::FatalError,
                                  "File '#{match}' already scanned. " \
                                  'Duplicate expressions matching same file.'
                        else
                            ret[match] = file.dup

                            # replace stripped class with real Ruby class
                            begin
                                ret[match]['ruby_class'] = \
                                    self.class.type_class(file['class'])
                            rescue NameError
                                raise OneCfg::Config::Exception::FatalError,
                                      "File '#{match}' has invalid class " \
                                      "'#{file['class']}'"
                            end
                        end

                    # fail in strict mode if we found some files
                    # matched by catch-all expressions
                    elsif strict && !ret.key?(match)
                        raise OneCfg::Config::Exception::FatalError,
                              "File '#{match}' doesn't have classification."
                    end
                end
            end

            ret
        end

        # Validates all known files from specified prefix can be read and
        # and written into temporary location. Checks that files and
        # OneCfg code is OK.
        #
        # @param prefix [String]  Root prefix
        #
        # @return [Boolean] True if all valid
        def validate(prefix = '/')
            ret = true

            scan(prefix, false).each do |name, data|
                begin
                    # create type object and load
                    pre_name = OneCfg::Config::Utils.prefixed(name, prefix)

                    OneCfg::LOG.debug("Load '#{pre_name}' " \
                                        "with #{data['ruby_class']}")

                    file = data['ruby_class'].new(pre_name)
                    file.load

                    # valid file and OneCfg code must evaluate file
                    # as same, similar and without diff on self
                    unless file.same?(file) &&
                           file.similar?(file) &&
                           file.diff(file).nil?
                        raise OneCfg::Config::Exception::StructureError,
                              'Error when comparing file content with self'
                    end

                    # test save into temporary file
                    Tempfile.open('validate') do |temp|
                        OneCfg::LOG.debug("Save '#{pre_name}' " \
                                            "into '#{temp.path}'")

                        temp.close
                        file.save(temp.path)
                    end

                    OneCfg::LOG.info("File '#{pre_name}' - OK")
                rescue StandardError => e
                    ret = false

                    # if any error, just print it and continue with the rest
                    OneCfg::LOG.error('Unable to process file ' \
                                        "'#{name}' - #{e.message}")
                end
            end

            ret
        end

        # Show hintings based on diffs
        #
        # @param prefix [String] Path to OpenNebula installation
        #
        # @return [String] Returns string with diff
        def diff(prefix, diff_format)
            versions  = OneCfg::EE::Config::Versions.new
            migrators = versions.migrators
            migrators = migrators.get_migrators_range(migrators.all_from,
                                                      versions.cfg_version)
            migrators.select! {|m| m.yaml? }

            migrator = migrators.last

            # load YAML descriptor
            if migrator.nil?
                raise OneCfg::Config::Exception::UnsupportedVersion,
                      'Could not find suitable migrator with files'
            end

            migrator.load_yaml

            if !migrator.yaml || !migrator.yaml['patches']
                # this should not happen
                raise OneCfg::Config::Exception::FatalError,
                      "Migrator for #{migrator.label} doesn't have valid YAML"
            end

            ###

            OneCfg::LOG.debug('Comparing against state from ' \
                                "#{migrator.label} migrator")

            patch_gen = OneCfg::EE::Patch::Generate.new(prefix)

            # process each file from descriptor
            migrator.yaml['patches'].each do |name, info|
                patch_gen.add(name, info)
            end

            case diff_format
            when 'yaml'
                patch_gen.generate_yaml
            when 'line'
                patch_gen.generate_line
            else
                patch_gen.generate_hintings
            end
        end

        # Get configuration type class from stripped string.
        #
        # @param [String] Stripped class name
        #
        # @return [Class] Ruby class
        def self.type_class(name)
            Kernel.const_get("#{TYPE_CLASS_NAME}::#{name}")
        end

        # Filters single file metadata entry returned by scan function
        # for suitable keys, which can be used for generated YAML migrator.
        #
        # @param [Hash] File data
        #
        # @return [Hash] Filtered file data
        def file4desc(data)
            data.select do |k, _v|
                ['class', 'owner', 'group', 'mode'].include?(k)
            end
        end

    end

end
# rubocop:enable Style/ClassAndModuleChildren

__END__

        def cfg_version
            ret = nil

            @settings.load

            if @settings.content && @settings.content['version']
                ret = Gem::Version.new(@settings.content['version'])
            end

            ret
        rescue StandardError
            nil
        end

        def cfg_version=(version)
            unless version
                raise OneCfg::Config::Exception::FatalError,
                      'Missing configuration version to save'
            end

            # TODO: can fail?
            @settings.load
            @settings.content['version'] = version.to_s
            @settings.save
        end

        # Return installed OpenNebula version
        #
        # @param prefix [String] Location prefix
        #
        # @return [Gem::Version, Nil] ) Gem::Version or Nil for unknown.
        def one_version(prefix = nil)
            ret = nil

            if prefix
                cmd = "#{prefix}/bin/oned --version"
            else
                cmd = 'oned --version'
            end

            o, _e, s = Open3.capture3(cmd)

            if s.success?
                matches = o.match(/^OpenNebula (\d+\.\d+.\d+) /)

                if matches
                    ret = Gem::Version.new(matches[1])
                end
            end

            # TODO: add alternative methods (e.g., query packager)

            ret
        rescue StandardError
            nil
        end

        # Return first defined version.
        def defaults(ver1, ver2)
            # take first defined version
            ret = ver1
            ret ||= ver2
            ret = Gem::Version.new(ret) if ret && !ret.is_a?(Gem::Version)

            unless ret
                raise OneCfg::Config::Exception::UnsupportedVersion,
                      'Unknown OpenNebula or config. version. Check status.'
            end

            # check version is supported by migrators
            unless @migrators.supported?(ret)
                raise OneCfg::Config::Exception::UnsupportedVersion,
                      "Unsupported version #{ret}"
            end

            ret
        end

        # Dumps versions status for poor humans beings
        #
        # @return[[String, Integer]] Returns twin with String and Integer.
        #                            String is a text to show to the user.
        #                            Integer is the exit status.
        def dump_status
            ret = ''

            ret << "--- Versions -----------------\n"

            ret << format("%-11s %-8s\n",
                          'OpenNebula:',
                          one_version ? one_version : 'unknown')

            ret << format("%-11s %-8s\n",
                          'Config:',
                          cfg_version ? cfg_version : 'unknown')

            unless one_version
                ret << "ERROR: Unknown OpenNebula version\n"
                return([ret, -1])
            end

            if !supported?(one_version)
                ret << "ERROR: Unsupported OpenNebula version #{one_version}\n"
                return([ret, -1])
            end

            unless cfg_version
                ret << "ERROR: Unknown config version\n"
                return([ret, -1])
            end

            if !supported?(cfg_version)
                ret << "ERROR: Unsupported config version #{cfg_version}\n"
                return([ret, -1])
            end

            ret << "\n--- Available updates --------\n"

            if cfg_version && latest && latest > cfg_version
                ret << format("%-11s %-8s\n", 'New config:', latest)
            end

            # TODO: test for downgrade
            if upgrades?
                get_migrators.each do |u|
                    ret << "- from #{u.from} to #{u.to} ("
                    ret << 'YAML' if u.yaml?
                    ret << ',' if u.yaml? && u.ruby?
                    ret << 'Ruby' if u.ruby?
                    ret << ")\n"
                end

                return([ret, 1])
            elsif cfg_version && latest && latest > cfg_version
                # TODO: how this can happen?
                ret << "No updates available, but config. is not latest!?!\n"
            else
                ret << "No updates available.\n"
            end

            [ret, 0]
        end

        ### Proxy methods into migrators ###

        # Gets latest (highest) configuration version matching
        # current OpenNebula version.
        def latest(v = one_version)
            @migrators.latest(v)
        end

        # Check if there is any update.
        def upgrades?(v1 = cfg_version, v2 = one_version)
            @migrators.upgrades?(v1, v2)
        end

        # Check if version is supported
        def supported?(version)
            @migrators.supported?(version)
        end

        def get_migrators(v1 = cfg_version, v2 = one_version)
            @migrators.get_migrators_range(v1, v2)
        end

    end

end
# rubocop:enable Style/ClassAndModuleChildren
