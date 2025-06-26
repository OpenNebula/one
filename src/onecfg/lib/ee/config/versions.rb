# -------------------------------------------------------------------------- #
# Copyright 2019-2023, OpenNebula Systems S.L.                               #
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

require 'open3'

# rubocop:disable Style/ClassAndModuleChildren
module OneCfg::EE::Config

    # All version management related to the configurations
    class Versions

        attr_reader :settings
        attr_reader :migrators

        # Class constructor
        def initialize
            @settings  = OneCfg::EE::Config::Settings.new
            @migrators = OneCfg::EE::Migrators.new
        end

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
                matches = o.match(/^OpenNebula (\d+\.\d+.\d+(\.\d+)?) /)

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

            ret << "--- Versions ------------------------------\n"

            # rubocop:disable Style/FormatStringToken
            ret << format("%-12s %-9s\n",
                          'OpenNebula:',
                          one_version || 'unknown')

            ret << format("%-12s %-9s\n",
                          'Config:',
                          cfg_version || 'unknown')
            # rubocop:enable Style/FormatStringToken

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

            if settings.outdated?
                ret << "ERROR: Configurations metadata are outdated.\n"

                return([ret, -1])
            end

            # one-shot configuration snapshot (backup) to process
            # rubocop:disable Style/FormatStringToken
            if settings.backup
                ret << "\n--- Backup to Process ---------------------\n"
                ret << format("%-12s %-9s\n", 'Snapshot:', settings.backup)
                ret << "(will be used as one-shot source for next update)\n"
            end

            ret << "\n--- Available Configuration Updates -------\n"

            if cfg_version && latest && latest > cfg_version
                ret << format("%-12s %-9s\n", 'New config:', latest)
            end
            # rubocop:enable Style/FormatStringToken

            if upgrades?
                get_migrators.each do |u|
                    # ret << format('- from %-9s to %-9s (', u.from, u.to)
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
                if settings.backup
                    ret << 'No updates available, but update request ' \
                           "for backup must be cleared.\n"

                    return([ret, 1])
                else
                    ret << "No updates available.\n"
                end
            end

            [ret, 0]
        end

        ### Proxy methods into migrators ###

        # Check if version is supported
        def supported?(version)
            @migrators.supported?(version)
        end

        # Gets latest (highest) configuration version matching
        # current OpenNebula version.
        def latest(v = one_version)
            @migrators.latest(v)
        end

        # Check if there is any update
        def upgrades?(v1 = cfg_version, v2 = one_version)
            @migrators.upgrades?(v1, v2)
        end

        # Get migrators
        def get_migrators(v1 = cfg_version, v2 = one_version)
            @migrators.get_migrators_range(v1, v2)
        end

    end

end
# rubocop:enable Style/ClassAndModuleChildren
