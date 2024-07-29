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

module OneCfg

    # Transactional operations with configuration files
    class Transaction

        attr_accessor :prefix
        attr_accessor :read_from
        attr_accessor :unprivileged
        attr_accessor :no_operation
        attr_accessor :hook_post_copy

        def initialize
            # TODO: move common defaults on a single place
            @prefix         = '/'
            @read_from      = nil
            @unprivileged   = false
            @no_operation   = false
            @hook_post_copy = nil
        end

        # Runs a passed code block on a copy of configuration files in
        # a transaction-like way. If block finishes successfully,
        # the changed configuration files are copied back to their
        # right place. Code gets transactino prefix directory and
        # file FileOperation object.
        #
        # @yield [tr_prefix, fops] Execute custom code with
        #
        # @return [Boolean,Nil] True on successful migration.
        def execute
            OneCfg::LOG.ddebug("Preparing transaction for prefix '#{@prefix}'")

            check_symlinks(@prefix)
            check_symlinks(@read_from) if @read_from

            ### emergency backup ### <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
            backup = backup_dirs
            ### emergency backup ### <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<

            tr_prefix = Dir.mktmpdir

            # copy data from @read_from/@prefix into transaction_prefix
            # rubocop:disable Style/RedundantCondition
            OneCfg::Common::Backup.restore_dirs(
                @read_from ? @read_from : @prefix,
                OneCfg::CONFIG_BACKUP_DIRS,
                tr_prefix
            )
            # rubocop:enable Style/RedundantCondition

            # file operations will be locked to transaction prefix
            fops = OneCfg::Config::FileOperation.new(tr_prefix, @unprivileged)

            # run custom code
            OneCfg::LOG.ddebug("Running transaction in '#{tr_prefix}'")
            ret = yield(tr_prefix, fops)

            # in no-operation mode, we finish before copying
            # changed configuration back
            if @no_operation
                OneCfg::LOG.ddebug('Transaction code successful, but ' \
                                   'executed in no-op mode. Changes will ' \
                                   'NOT BE SAVED!')

                OneCfg::LOG.info('Changes ARE NOT saved in no-op mode!')

                return(ret)
            end

            OneCfg::LOG.ddebug('Transaction code successful')

            # Copy updated configuration back from transaction_prefix
            # to original @prefix location. Restore on any failure.
            begin
                # We copy back from transaction_prefix only CONFIG_UPDATE_DIRS,
                # which should be a subset of directories we have
                # backuped. This enables to work with whole remotes/,
                # but copy back only remotes/etc.
                OneCfg::Common::Backup.restore_dirs(
                    tr_prefix,
                    OneCfg::CONFIG_UPDATE_DIRS, # <-- !!!
                    @prefix
                )

                if @hook_post_copy
                    OneCfg::LOG.ddebug('Running transaction post-copy hook')
                    @hook_post_copy.call(ret)
                end
            rescue StandardError
                restore_dirs(backup)

                raise
            end

            OneCfg::LOG.ddebug('Transaction done')

            ret
        ensure
            # cleanup temporary transaction directory
            if defined?(tr_prefix) && !tr_prefix.nil? && File.exist?(tr_prefix)
                FileUtils.rm_r(tr_prefix)
            end
        end

        private

        # Checks there are no symlinks in backup directories.
        # Raise exception in case of error.
        #
        # @param custom_prefix [String] Custom prefix to check
        def check_symlinks(custom_prefix = @prefix)
            OneCfg::CONFIG_BACKUP_DIRS.each do |dir|
                pre_dir = OneCfg::Config::Utils.prefixed(dir, custom_prefix)
                OneCfg::LOG.dddebug("Checking symbolic links in '#{pre_dir}'")

                Dir["#{pre_dir}/**/**"].each do |f|
                    if File.symlink?(f)
                        raise OneCfg::Config::Exception::FatalError,
                              "Found symbolic links in '#{f}'"
                    end
                end
            end
        end

        # Backup all dirs inside prefix. This is intended as
        # backup for emergency cases, when upgrade fails and
        # we need to revert changes back.
        #
        # @return [String] Backup path
        def backup_dirs
            backup = OneCfg::Common::Backup.backup_dirs(
                OneCfg::CONFIG_BACKUP_DIRS,
                nil, # backup name autogenerated
                @prefix
            )

            OneCfg::LOG.unknown("Backup stored in '#{backup}'")

            backup
        rescue StandardError => e
            raise OneCfg::Config::Exception::FatalError,
                  "Error making backup due to #{e.message}"
        end

        # Restore all dirs inside prefix. This is intended as
        # restore after upgrade failure of production directories.
        #
        # @param backup [String] Backup path
        def restore_dirs(backup)
            OneCfg::LOG.unknown('Restoring from backups')

            OneCfg::Common::Backup.restore_dirs(
                backup,
                OneCfg::CONFIG_BACKUP_DIRS,
                @prefix
            )

            OneCfg::LOG.debug('Restore successful')
        rescue StandardError
            msg = 'Fatal error on restore, we are very sorry! ' \
                  'You have to restore following directories ' \
                  'manually:'

            OneCfg::CONFIG_BACKUP_DIRS.each do |dir|
                src = File.join(backup, dir)
                dst = prefixed(dir)

                msg << "\n\t- copy #{src} into #{dst}"
            end

            OneCfg::LOG.fatal(msg)

            raise
        end

    end

end
