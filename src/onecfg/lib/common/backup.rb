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

require 'date'
require 'English'

# rubocop:disable Style/ClassAndModuleChildren
module OneCfg::Common

    # File backup module
    module Backup

        # Make a directory backup
        #
        # @param dir    [String] Dir path
        # @param backup [String] Backup path
        #
        # @return [String] Path to the backup
        def self.backup(dir, backup = nil)
            unless File.directory?(dir)
                raise OneCfg::Exception::FileNotFound,
                      "Directory '#{dir}' to backup doesn't exist."
            end

            # rubocop:disable Style/FormatStringToken
            backup ||= format('%s/%s%s_%i',
                              OneCfg::BACKUP_DIR,
                              DateTime.now.strftime('%Y-%m-%d_%H:%M:%S'),
                              dir.split('/').join('_'),
                              $PID)
            # rubocop:enable Style/FormatStringToken

            OneCfg::LOG.debug("Backing up #{dir} in #{backup}")
            rsync(dir, backup)

            backup
        end

        # Restore the directory backup
        #
        # @param backup [String] Backup path
        # @param dir    [String] Dir path
        def self.restore(backup, dir)
            unless File.exist?(backup)
                raise OneCfg::Exception::FileNotFound,
                      "Backup location '#{backup}' doesn't exist."
            end

            OneCfg::LOG.debug("Restoring #{backup} to #{dir}")
            rsync(backup, dir)
        end

        # Backup all dirs at once. Directories are specified
        # NON-PREFIXED, with optional prefix argument (default: /).
        #
        # @param dirs   [Array]  NON-PREFIXED dirs to backup
        # @param backup [String] Backup path
        # @param prefix [String] Prefix to prepend source dirs with
        #
        # @return [String] Path to the backup
        #
        # Example:
        # ['/etc/one, '/var/lib/one/remotes'], nil, '/']
        # ['/etc/one, '/var/lib/one/remotes'], nil, '/tmp/prefix']
        def self.backup_dirs(dirs, backup = nil, prefix = '/')
            # rubocop:disable Style/FormatStringToken
            backup ||= format('%s/%s_%i',
                              OneCfg::BACKUP_DIR,
                              DateTime.now.strftime('%Y-%m-%d_%H:%M:%S'),
                              $PID)
            # rubocop:enable Style/FormatStringToken

            OneCfg::LOG.debug("Backing up multiple dirs into '#{backup}'")

            dirs.each do |dir|
                src = OneCfg::Config::Utils.prefixed(dir, prefix)
                dst = File.join(backup, dir)

                backup(src, dst)
            end

            begin
                versions    = OneCfg::EE::Config::Versions.new
                cfg_version = versions.cfg_version
            rescue NameError
            end

            if cfg_version
                File.open("#{backup}/version", 'w') do |file|
                    file.write(cfg_version)
                end
            end

            backup
        end

        # Restore all dirs at once. Directories are specified
        # NON-PREFIXED, with optional prefix argument (default: /).
        #
        # @param backup [String] Backup path
        # @param dirs   [Array]  NON-PREFIXED dirs to restore
        # @param prefix [String] Prefix to prepend target dirs with
        #
        # @return [String] Path to the backup
        #
        # Example:
        # '/var/backup/xxxx', ['/etc/one', /var/lib/one/remotes'], '/'
        # '/var/backup/xxxx', ['/etc/one', /var/lib/one/remotes'], '/tmp/prefix'
        def self.restore_dirs(backup, dirs, prefix = '/')
            OneCfg::LOG.debug("Restoring multiple dirs from '#{backup}'")

            dirs.each do |dir|
                src = File.join(backup, dir)
                dst = OneCfg::Config::Utils.prefixed(dir, prefix)

                restore(src, dst)
            end
        end

        # Sync content of both directories
        #
        # @param source [String] Source dir path
        # @param target [String] Target dir path
        def self.rsync(source, target)
            unless ::File.exist?(target)
                FileUtils.mkdir_p(target)
            end

            # trigger rsync
            cmd = "rsync -acvh #{source}/ #{target} --delete --delete-after"

            OneCfg::LOG.ddebug("Synchronizing '#{source}' to " \
                                 "'#{target}' with command: #{cmd}")

            _o, e, rtn = OneCfg::Config::Type::Base.run_shell_command(cmd)

            # handle errors
            return if rtn.success?

            OneCfg::LOG.ddebug('Failure on synchronization ' \
                                    "due to - '#{e}'")

            raise OneCfg::Exception::Generic, # TODO: better exception
                  'Data synchronization failed'
        end

    end

end
# rubocop:enable Style/ClassAndModuleChildren

#
# Create directory tar
#
# @param dir          [String] Dir path
# @param tar_location [String] Tar path
# def tar(dir, tar_location = nil)
#     if tar_location.nil?
#         tar_location = "/tmp/#{rand(36**8).to_s(36)}"
#     end
#
#     cmd = 'tar --selinux --acls --xattrs ' \
#             "-zcvf #{tar_location} -C #{dir} ./"
#     _o, e, rtn = OneCfg::Config::Type::Base.run_shell_command(cmd)
#
#     unless rtn.exitstatus == 0
#         raise OneCfg::Config::GenericException, e
#     end
#
#     tar_location
# end
#
# Untar file into directory
#
# @param tar_location   [String] Tar path
# @param untar_location [String] Untar directory path
#
# @return [String] Untar path
# def untar(tar_location, untar_location = nil)
#     untar_location ||= Dir.mktmpdir
#
#     cmd = "tar -xf #{tar_location} -C #{untar_location}"
#     _o, e, rtn = OneCfg::Config::Type::Base.run_shell_command(cmd)
#
#     unless rtn.exitstatus == 0
#         raise OneCfg::Config::GenericException, e
#     end
#
#     untar_location
# end
#
