# -------------------------------------------------------------------------- #
# Copyright 2019-2025, OpenNebula Systems S.L.                               #
#                                                                            #
# Licensed under the OpenNebula Software License                             #
# (the "License"); you may not use this file except in compliance with       #
# the License. You may obtain a copy of the License as part of the software  #
# distribution.                                                              #
#                                                                            #
# See https://github.com/OpenNebula/one/blob/master/LICENSE.onsla            #
# (or copy bundled with OpenNebula in /usr/share/doc/one/).                  #
#                                                                            #
# Unless agreed to in writing, software distributed under the License is     #
# distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY   #
# KIND, either express or implied. See the License for the specific language #
# governing permissions and  limitations under the License.                  #
# -------------------------------------------------------------------------- #

# rubocop:disable Style/ClassAndModuleChildren
module OneCfg::EE

    # EE Commands module
    module Commands

        # TODO, avoid duplicated options (ce and ee)

        ########################################################################
        # Global Options
        ########################################################################

        DESCRIPTOR_NAME = {
            :name => 'descriptor_name',
            :large => '--descriptor-name name',
            :description => 'Automatic update descriptor file name',
            :format => String
        }

        UNPRIVILEGED = {
            :name => 'unprivileged',
            :large => '--unprivileged',
            :description => 'Skip privileged operations (e.g., chown)'
        }

        FORCE = {
            :name => 'force',
            :short => '-f',
            :large => '--force',
            :description => 'Overwrite settings file'
        }

        DIFF_FORMAT = {
            :name => 'format',
            :large => '--format format',
            :description => 'Specify the differential output format. ' \
                            'Supported values are:' \
                            ' "text" (easy human-readable format),' \
                            ' "line" (single line format),' \
                            ' "yaml" (YAML format).',
            :format => String
        }

        DIFF_FORMATS = ['text', 'line', 'yaml']

        ########################################################################
        # Upgrade/ Downgrade options
        ########################################################################

        PATCH_MODES = {
            :name => 'patch_modes',
            :large => '--patch-modes modes',
            :multiple => true,
            :description => 'Patch modes per file and version in format ' \
                            '"MODES" (for general modes), "MODES:FILE_NAME" ' \
                            '(for modes specific to particular file) or ' \
                            '"MODES:FILE_NAME:VERSION" (for modes specific to '\
                            'particular files and target migration version). ' \
                            'Parameter can be used several times. Examples: ' \
                            '--patch-modes skip ' \
                            '--patch-modes skip:/etc/one/oned.conf ' \
                            '--patch-modes skip:/etc/one/oned.conf;force:... ' \
                            '--patch-modes skip,force:/etc/one/oned.conf ' \
                            '--patch-modes skip:/etc/one/oned.conf:5.4 ' \
                            '--patch-modes skip,force:/etc/one/oned.conf:5.4',
            :format => String
        }

        PATCH_STRICT = {
            :name => 'patch_strict',
            :large => '--patch-strict',
            :description => 'Don\'t use the default patch mode for each file class'
        }

        NO_OPERATION = {
            :name => 'noop',
            :short => '-n',
            :large => '--noop',
            :description => 'Runs update without changing system state'
        }

        PREFIX = {
            :name => 'prefix',
            :large => '--prefix prefix',
            :description => 'Root location prefix (default: /)',
            :format => String
        }

        FROM_VERSION = {
            :name => 'from_version',
            :large => '--from version',
            :description => 'Source config. version (default: current version)',
            :format => String
        }

        TO_VERSION = {
            :name => 'to_version',
            :large => '--to version',
            :description => 'Target config. version (default: autodetected)',
            :format => String
        }

        READ_FROM = {
            :name => 'read_from',
            :large => '--read-from dir',
            :description => 'Directory to read files for upgrade. ' \
                            'If the parameter is not specified, the tool will '\
                            'try to read from /etc/config.yaml file, if not ' \
                            'it will read from installation directory',
            :format => String
        }

        RECREATE = {
            :name => 'recreate',
            :large => '--recreate',
            :description => 'Recreate deleted files (only required by upgrade)'
        }

        ########################################################################
        # Logging modes
        ########################################################################

        VERBOSE = {
            :name => 'verbose',
            :short => '-d',
            :large => '--verbose',
            :description => 'Set verbose logging mode'
        }

        DEBUG = {
            :name => 'debug',
            :large => '--debug',
            :description => 'Set debug logging mode'
        }

        DDEBUG = {
            :name => 'ddebug',
            :large => '--ddebug',
            :description => 'Set extra debug logging mode'
        }

        DDDEBUG = {
            :name => 'dddebug',
            :large => '--dddebug',
            :description => 'Set extra debug logging mode'
        }

        # logging modes
        LOG_MODES = [VERBOSE, DEBUG, DDEBUG, DDDEBUG]

        # upgrade/downgrade options
        OPERATIONS = [FROM_VERSION,
                      TO_VERSION,
                      NO_OPERATION,
                      UNPRIVILEGED,
                      PATCH_MODES,
                      PATCH_STRICT,
                      RECREATE,
                      PREFIX,
                      READ_FROM] + LOG_MODES

        OP_UPGRADE = OPERATIONS

        def self.load_commands(cmd_parser, args, helper)
            options = cmd_parser.options

            ####################################################################
            # Configuration Commands
            ####################################################################

            gen_desc = <<-EOT.unindent
                INTERNAL: Generates automatic migration descriptor between 2 versions
            EOT

            cmd_parser.command :generate, gen_desc,
                               :git, :source_version, :target_version,
                               [:ruby_migrator, nil],
                               :options => [DESCRIPTOR_NAME] +
                                           CommandParser::OPTIONS + LOG_MODES \
            do
                Signal.trap('INT') { exit(-1) }

                OneCfg::LOG.get_logger(options)

                begin
                    git_path = args[0] # Path to git repository
                    source   = args[1] # Source version
                    target   = args[2] # Target version
                    migrator = args[3] # Path to migrator file

                    OneCfg::LOG.ddebug('Service request on config/generate')

                    generate = OneCfg::EE::Migrators::Generate.new
                    generate.generate(git_path,
                                      source,
                                      target,
                                      migrator,
                                      options)
                rescue StandardError => e
                    OneCfg::LOG.fatal("FAILED - #{e}")
                    exit(-1)
                end

                0
            end

            ###

            init_desc = <<-EOT.unindent
                Initialize OneCfg configuration version based on OpenNebula version
            EOT

            cmd_parser.command :init, init_desc,
                               :options => [FORCE, TO_VERSION] +
                                           CommandParser::OPTIONS + LOG_MODES \
            do
                OneCfg::LOG.get_logger(options)

                begin
                    force = options.key?(:force)   # Override current file
                    version = options[:to_version] # Specific conf. version
                    if File.exist?(OneCfg::CONFIG_CFG) && !force
                        OneCfg::LOG.unknown('Already initialized')
                    else
                        OneCfg::LOG.debug("Creating '#{OneCfg::CONFIG_CFG}'")

                        versions = OneCfg::EE::Config::Versions.new

                        unless version
                            if versions.one_version
                                version = versions.one_version
                            else
                                raise OneCfg::Config::Exception::FatalError,
                                      'Could not detect OpenNebula version ' \
                                      'to initialize on'
                            end
                        end

                        version ||= versions.one_version
                        versions.settings.reset
                        versions.settings.version = version
                        versions.settings.save

                        OneCfg::LOG.info("Initialized on version #{version}")
                    end
                rescue StandardError => e
                    OneCfg::LOG.fatal("FAILED - #{e}")
                    exit(-1)
                end

                0
            end

            ###

            status_desc = <<-EOT.unindent
                Show information about current installation
            EOT

            cmd_parser.command :status, status_desc,
                               :options => CommandParser::OPTIONS + LOG_MODES \
            do
                OneCfg::LOG.get_logger(cmd_parser.options)

                begin
                    vers = OneCfg::EE::Config::Versions.new

                    out, ret = vers.dump_status

                    puts out
                    ret
                rescue StandardError => e
                    OneCfg::LOG.fatal("FAILED - #{e}")
                    exit(-1)
                end
            end

            ###

            validate_desc = <<-EOT.unindent
                Read all base configuration files and check validity
            EOT

            cmd_parser.command :validate, validate_desc,
                               :options => [PREFIX] +
                                           CommandParser::OPTIONS + LOG_MODES \
            do
                Signal.trap('INT') { exit(-1) }

                OneCfg::LOG.get_logger(options)

                prefix = options[:prefix] || '/'

                begin
                    OneCfg::LOG.ddebug('Service request on config/validate')

                    # Validate files can be read, parsed and saved
                    files = OneCfg::Config::Files.new
                    files.validate(prefix)
                rescue StandardError => e
                    OneCfg::LOG.fatal("FAILED - #{e}")
                    exit(-1)
                end
            end

            ###

            up_desc = <<-EOT.unindent
                Upgrade configuration files
            EOT

            cmd_parser.command :upgrade, up_desc,
                               :options => OP_UPGRADE + CommandParser::OPTIONS \
            do
                Signal.trap('INT') { exit(-1) }

                OneCfg::LOG.get_logger(options)

                if options[:patch_modes]
                    options[:patch_modes] = \
                        helper.parse_patch_modes(options[:patch_modes])
                end

                begin
                    OneCfg::LOG.ddebug('Service request on config/upgrade')

                    apply = OneCfg::EE::Migrators::Apply.new(
                        options[:from_version],
                        options[:to_version]
                    )

                    # rubocop:disable Layout/LineLength
                    apply.prefix = options[:prefix] if options.key?(:prefix)
                    apply.unprivileged = true if options.key?(:unprivileged)
                    apply.deleted_create = true if options.key?(:recreate)
                    apply.read_from = options[:read_from] if options.key?(:read_from)
                    apply.modes = options[:patch_modes] if options.key?(:patch_modes)
                    apply.patch_strict = true if options.key?(:patch_strict)
                    apply.no_operation = true if options.key?(:noop)
                    # rubocop:enable Layout/LineLength

                    apply.update
                rescue StandardError => e
                    OneCfg::LOG.fatal("FAILED - #{e}")
                    exit(-1)
                end

                0
            end

            ###

            diff_desc = <<-EOT.unindent
                Detect changes in configuration files
            EOT

            cmd_parser.command :diff, diff_desc,
                               :options => [PREFIX, DIFF_FORMAT] +
                                           CommandParser::OPTIONS + LOG_MODES \
            do
                OneCfg::LOG.get_logger(options)

                begin
                    prefix = options[:prefix] || '/'
                    format = options[:format] unless options[:format].nil?

                    if !format.nil? && !DIFF_FORMATS.include?(format)
                        STDERR.puts "Unsupported format '#{format}'. " \
                                    'Available formats - ' +
                                    DIFF_FORMATS.join(', ')
                        exit(-1)
                    end

                    OneCfg::LOG.ddebug('Service request on config/diff')

                    files = OneCfg::Config::Files.new
                    puts files.diff(prefix, format)
                rescue StandardError => e
                    OneCfg::LOG.fatal("FAILED - #{e}")
                    exit(-1)
                end

                0
            end
        end

    end

end
# rubocop:enable Style/ClassAndModuleChildren
