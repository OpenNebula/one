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

    # Class to manages running migrators
    class Migrators::Apply

        # @from  Source version
        # @to    Target version
        attr_reader   :from
        attr_reader   :to

        # @modes         Patch modes
        # @unprivileged  Unprivileged operations
        # @read_from     Backup to read from
        attr_accessor :prefix
        attr_accessor :modes
        attr_accessor :patch_strict
        attr_accessor :unprivileged
        attr_accessor :read_from
        attr_accessor :deleted_create
        attr_accessor :no_operation

        # @fops Sandboxed file operations for migrators
        attr_reader :fops

        # Base type module
        MODULE = 'OneCfg::Config::Type'

        # Class constructor
        def initialize(from = nil, to = nil)
            @versions     = OneCfg::EE::Config::Versions.new
            @prefix       = '/'
            @new_files    = {}
            @old_files    = {}

            # set from/to versions on command line or take
            # 'from' version persisted in configuration and
            # 'to' as current OpenNebula version
            @from = @versions.defaults(from, @versions.cfg_version)
            @to   = @versions.defaults(to,   @versions.one_version)

            # NOTE: Target version must be >= 5.6.0, we don't
            # support dealing with remotes configuration outside
            # the etc/ directory.
            if @to < Gem::Version.new('5.6.0')
                raise OneCfg::Config::Exception::UnsupportedVersion,
                      "We don't support updates to #{to}"
            end

            # default parameters
            @modes          = {}
            @patch_strict   = false
            @unprivileged   = false
            @deleted_create = false
            @no_operation   = false
            @read_from      = nil
        end

        # Update configuration based on parameters specified in
        # constructor and additional attributes. Method doesn't
        # accept any parameters.
        #
        # @return [Boolean,Nil] True on successful migration.
        def update
            OneCfg::LOG.info("Checking updates from #{@from} to #{@to}")

            begin
                settings = OneCfg::EE::Config::Settings.new
                settings.load
            rescue StandardError
                # ignore any errors, really
            end

            if settings.backup
                OneCfg::LOG.unknown('Found backed up configuration to process!')

                OneCfg::LOG.debug("Backup location '#{settings.backup}'")
            end

            unless @versions.upgrades?(@from, @to)

                # if there was a backup (~read_from) to process,
                # we can silently drop this information as there
                # is nothing to process...
                if !@no_operation && settings.content.delete('backup')
                    settings.save

                    OneCfg::LOG.unknown('No updates for backed up ' \
                                          'configuration. Considering as ' \
                                          'processed.')

                    return(true)
                else
                    OneCfg::LOG.unknown('No updates available')
                end

                return
            end

            migrators = @versions.get_migrators(@from, @to)

            if migrators.empty?
                # this should never happen
                raise OneCfg::Config::Exception::FatalError,
                      'We expected updates, but no migrator found at the end.'
            end

            ###

            select_read_from = @read_from

            # catch outdated configuration state!
            if settings.outdated?
                raise OneCfg::Config::Exception::FatalError,
                      "Configuration can't be processed as it looks " \
                      "outdated! You must have missed to run 'onecfg " \
                      "update' after previous OpenNebula upgrade."
            end

            # use backup location from configuration as read_from
            if !select_read_from && settings.content['backup']
                select_read_from = settings.content['backup']
            end

            # if we are going to use "read_from" location,
            # we have to better tell explicitly to the user and
            # also pass simple validations checks on that location
            if select_read_from
                OneCfg::LOG.unknown('Snapshot to update from ' \
                                      "'#{select_read_from}'")
            end

            ###

            tr = OneCfg::Transaction.new
            tr.prefix       = @prefix
            tr.read_from    = select_read_from
            tr.unprivileged = @unprivileged
            tr.no_operation = @no_operation

            # Post-copy hook saves new version into configuration file,
            # but in case of failure, whole transaction is rollbacked.
            # Exit value from transaction code is passed to hook.
            tr.hook_post_copy = lambda do |ret|
                # ideally we would use @versions
                # @versions.cfg_version = ret

                # dirty approach
                settings.load
                settings.content['version'] = ret.to_s
                settings.content.delete('backup')
                settings.save
            end

            version = @from

            # run upgrade in transaction
            tr.execute do |tr_prefix, fops|
                # TODO: Ruby migrators probably need this as instance variable
                @fops = fops

                OneCfg::LOG.info("Updating from #{@from} to #{@to}")

                begin
                    # Iterate over all versions, for each of them:
                    #   - get descriptor/migrator
                    #   - call pre_up if defined
                    #   - apply the patches/create the files/delete the files
                    #   - call up if it's defined
                    migrators.each do |migr|
                        # load migrators
                        if migr.ruby?
                            OneCfg::LOG.debug('Using migrator ' +
                                               migr.name_ruby)

                            load(migr.name_ruby)
                            extend Migrator
                            OneCfg::LOG.ddebug('Migrator loaded')
                        end

                        if migr.yaml?
                            OneCfg::LOG.debug('Using descriptor ' +
                                               migr.name_yaml)
                        end

                        # trigger Ruby/YAML migrators
                        migrate(migr, tr_prefix)

                        version = migr.to
                    end
                rescue StandardError => e
                    msg = '** TERMINATING UPDATE WITHOUT CHANGING SYSTEM ** '
                    msg << "Can't process files due to a fatal error ("
                    msg << e.class.to_s
                    msg << ", desc. '#{e.message}'" unless e.message.to_s.empty?
                    msg << '). Use --verbose/--debug modes to get more '
                    msg << 'information.'

                    OneCfg::LOG.fatal(msg)
                    OneCfg::LOG.debug('--- EXCEPTION BACKTRACE ---')
                    OneCfg::LOG.debug(e.backtrace.join("\n\t"))
                    OneCfg::LOG.debug('--- EXCEPTION BACKTRACE ---')

                    raise
                end

                version
            end

            # in no-operation mode, we finish before copying
            # changed configuration back
            return(true) if @no_operation

            OneCfg::LOG.unknown("Configuration updated to #{version}")

            true
        end

        private

        # Execute all steps (Ruby pre, YAML descriptor, Ruby)
        # for single migrator.
        #
        # @param migr        [Object] Migrator object
        # @param temp_prefix [String] Update temporary prefix
        def migrate(migr, temp_prefix)
            OneCfg::LOG.info('Incremental update from ' \
                             "#{migr.from} to #{migr.to}")

            # it's more transparent to always load new
            # old and new files to work with with each round :-(
            @old_files = {}
            @new_files = {}

            # run Ruby pre_up migrators
            if migr.ruby? && defined?(pre_up)
                OneCfg::LOG.debug("#{migr.label} - Running Ruby pre_up")
                pre_up
                OneCfg::LOG.ddebug("#{migr.label} - Finished Ruby pre_up")
            else
                OneCfg::LOG.debug("#{migr.label} - No Ruby pre_up available")
            end

            # process patches in YAML descriptor
            migrate_yaml(migr, temp_prefix) if migr.yaml?

            # run Ruby up migrators
            if migr.ruby? && defined?(up)
                OneCfg::LOG.debug("#{migr.label} - Running Ruby up")
                up
                OneCfg::LOG.ddebug("#{migr.label} - Finished Ruby up")
            else
                OneCfg::LOG.debug("#{migr.label} - No Ruby up available")
            end
        end

        # Process all steps from YAML descriptor of single migrator.
        #
        # @param migr        [Object] Migrator object
        # @param temp_prefix [String] Update temporary prefix
        def migrate_yaml(migr, temp_prefix)
            return if !migr.yaml || !migr.yaml['patches']

            migr.yaml['patches'].each do |name, info|
                next unless info['action']

                # add the current prefix to file name
                pre_name = prefixed(name, temp_prefix)
                type_class = file_class(info['class'])

                OneCfg::LOG.dddebug("Real file #{pre_name}")

                @old_files[name] = type_class.new(pre_name)
                @new_files[name] = type_class.new(pre_name)

                # This is quite ineffective, but to make mechanism clear,
                # we load old / new at the start if file exists.
                if @fops.exist?(name)
                    @old_files[name].load
                    @new_files[name].load
                end

                # process change (diff/patch) in file
                case info['action']
                when 'apply'
                    # We have patch to apply on file whch was deleted,
                    # or wasn't installed. We can choose if we recreate
                    # from content we have persisted in YAML descriptor.
                    unless @fops.exist?(name)
                        if @deleted_create
                            OneCfg::LOG.info('Recreating missing ' \
                                               "file '#{name}'")

                            file_create(name, info)

                            # reload for Ruby migrator
                            @new_files[name].load
                        else
                            OneCfg::LOG.info("Skip file '#{name}' - missing")
                        end

                        # in both cases, we skip
                        next
                    end

                    file = @new_files[name]

                    # === Patching ===

                    OneCfg::LOG.info("Update file '#{name}'")

                    # get file/version specific file mode
                    patch_modes = file_patch_modes(name, migr.to)

                    # add the patch safe mode unless user wants strict
                    unless @patch_strict
                        patch_modes << type_class::PATCH_SAFE_MODES
                        patch_modes.flatten!
                    end

                    OneCfg::LOG.ddebug("Patching '#{pre_name}' with " \
                                         "modes #{patch_modes}")
                    begin
                        # patch and report!
                        _ret, rep = file.patch(info['change'], patch_modes)

                        OneCfg::LOG.debug("--- PATCH REPORT '#{name}' --- ")
                        file.hintings(info['change'], rep).each do |l|
                            OneCfg::LOG.debug("Patch #{l}")
                        end
                    rescue StandardError
                        OneCfg::LOG.error("Error updating file '#{name}'")

                        raise
                    end

                    file.save

                    # ================

                    # if saved file is similar to new content, replace
                    # TODO: this should be done **AFTER** up phase
                    if info['content']
                        Tempfile.open('onescape-') do |tmp|
                            replace = false

                            begin
                                tmp.write(info['content'])
                                tmp.close

                                dist_new = type_class.new(tmp.path)
                                dist_new.load

                                # If new patched file is not 1:1 same
                                # to distribution file, but is similar,
                                # we replace file by distribution one.
                                replace = file.similar?(dist_new) &&
                                          !file.same?(dist_new)
                            rescue StandardError
                                # we are going to ignore any errors
                            end

                            if replace
                                OneCfg::LOG.ddebug(
                                    'Replacing patched similar ' \
                                    "#{pre_name} with stock content"
                                )

                                @fops.file_write(name, info['content'])

                                # reload file
                                file.load
                            end
                        end
                    end

                # create new file
                when 'create'
                    if @fops.exist?(name)
                        OneCfg::LOG.info("Skip file '#{name}' - " \
                                           'already exists')
                    else
                        if @fops.directory?(File.dirname(name))
                            OneCfg::LOG.info("Create file '#{name}'")

                            file_create(name, info)

                            # load for Ruby migrator
                            @new_files[name].load
                        else
                            OneCfg::LOG.warn("Skip file '#{name}' - " \
                                               'missing parent dir')
                        end
                    end

                # delete old file
                when 'delete'
                    if @fops.exist?(name)
                        OneCfg::LOG.info("Delete file '#{name}'")

                        @fops.delete(name)

                        @new_files[name].reset
                    end
                end
            end
        end

        # Create file with name (within @fops object) with
        # content and attributes specified in descriptor hash.
        #
        # @param name [String] File name
        # @param info [Hash]
        def file_create(name, info)
            @fops.file_write(name, info['content'])

            # Set ownership and permissions only if they are
            # specified in YAML descriptor. Only for new files.
            @fops.chown(name, info['owner'])        if info.key?('owner')
            @fops.chown(name, nil, info['group'])   if info.key?('group')
            @fops.chmod(name, info['mode'].to_i(8)) if info.key?('mode')
        end

        # Process configuration file with given block. This method
        # is intended to be executed from inside Ruby migrators.
        #
        # @param name        [String] File name
        # @param short_class [String] File class
        def process(name, short_class)
            return unless block_given?

            type_class = file_class(short_class)

            # Use-case for this is pure Ruby migrator, without any
            # YAML descriptor. We have to handle reading of old and
            # new and save new at the end. In case we miss one of them,
            # we better reload both from filesystem.
            unless @old_files.key?(name) && @new_files.key?(name)
                unless @fops.exist?(name)
                    OneCfg::LOG.warn("Missing file '#{name}' for Ruby migrator")
                    return
                end

                @old_files[name] = type_class.new(@fops.prefixed(name))
                @old_files[name].load

                @new_files[name] = type_class.new(@fops.prefixed(name))
                @new_files[name].load
            end

            old = @old_files[name]
            new = @new_files[name]

            # configuration classes in YAML and Ruby migrator must be same
            if !old.instance_of?(type_class) || !new.instance_of?(type_class)
                raise OneCfg::Config::Exception::FatalError,
                      'File class type mismatch in Ruby ' \
                      "migrator for file '#{name}' (" \
                      "Ruby migrator=#{type_class}; " \
                      "YAML migrator old=#{old.class}, " \
                      "new=#{new.class})"
            end

            skip_save = new.content.nil?

            if skip_save
                OneCfg::LOG.debug('Triggering Ruby migrator even on ' \
                                    "deleted file '#{name}', no changes will " \
                                    'be persisted.')
            else
                OneCfg::LOG.info("Updating '#{name}' via Ruby migrator")
            end

            yield(old.content, new.content)

            # It shouln't happen that migrator creates missing or
            # completely new file. Migrator is expected only to
            # work with existing, new or delete files.
            new.save unless new.content.nil? || skip_save
        end

        # Fetch patch file modes from the arguments provided
        # by user and find the most suitable ones regarding the
        # file name and version we upgrade to.
        #
        # @param name    [String] File name
        # @param version [Hash]   Version we upgrade to
        #
        # @return [Array] List of suitable patch modes
        def file_patch_modes(name, version)
            ret = []

            # global defaults for all files
            if @modes.key?(nil)
                # w/o version
                if @modes[nil].key?(nil)
                    ret = @modes[nil][nil]
                end

                # w/ version
                @modes[nil].each do |v, m|
                    next if v.nil?

                    if Gem::Version.new(v) == version
                        ret = m
                        break
                    end
                end
            end

            # file specific modes
            if @modes.key?(name)
                # w/o version
                if @modes[name].key?(nil)
                    ret = @modes[name][nil]
                end

                # w/ version
                @modes[name].each do |v, m|
                    next if v.nil?

                    if Gem::Version.new(v) == version
                        ret = m
                        break
                    end
                end
            end

            ret
        end

        # Get file class from string
        #
        # @param [String] Short file types class name
        #
        # @return [Class] Ruby class corresponding short_class
        def file_class(short_class)
            Kernel.const_get("#{MODULE}::#{short_class}")
        end

        # Get prefixed path
        #
        # @param path          [String] File path
        # @param custom_prefix [String] Custom prefix
        #
        # @return [String] Prefixed path
        def prefixed(path, custom_prefix = @prefix)
            OneCfg::Config::Utils.prefixed(path, custom_prefix)
        end

        # Get path without prefix
        #
        # @param path          [String] Prefixed path
        # @param custom_prefix [String] Custom prefix
        #
        # @param [String] Unprefixed path
        def unprefixed(path, custom_prefix = @prefix)
            OneCfg::Config::Utils.unprefixed(path, custom_prefix)
        end

    end

end
# rubocop:enable Style/ClassAndModuleChildren
