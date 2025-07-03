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

require 'singleton'

# rubocop:disable Style/ClassAndModuleChildren
module OneCfg::EE

    # Migrators management
    class Migrators

        attr_reader :list

        def initialize
            load_migrators
        end

        def all_from
            @list.first.from
        end

        def all_to
            @list.last.to
        end

        def all_bumped_to
            @list.last.bumped_to
        end

        # Checks is version is within relaxed versions range of migrators.
        def supported?(version)
            return false unless version

            version = Gem::Version.new(version) if version.is_a?(String)

            version >= all_from && version < all_bumped_to

            # TODO: fail also on beta/rc versions ???
        end

        # Gets latest (highest) configuration version matching
        # available for the OpenNebula version.
        def latest(version)
            get_migrators_range(all_from, version).last.to
        rescue OneCfg::Config::Exception::UnsupportedVersion
            nil
        end

        # Check if there is any update for version range.
        def upgrades?(from, to)
            !get_migrators_range(from, to).empty?
        rescue OneCfg::Config::Exception::UnsupportedVersion
            false
        end

        def load_migrators
            @list = []

            OneCfg::LOG.debug('Loading migrators')
            dir = Dir["#{OneCfg::MIGR_DIR}/*_to_*.{rb,yaml}"]

            dir.each do |full_name|
                base  = File.basename(full_name)
                match = base.match(/^([\d\.]+)_to_([\d\.]+)\.(rb|yaml)$/)

                if match
                    m = get_migrator(match[1], match[2])

                    # if we didn't find migrator in the list,
                    # we create new empty one and put on list
                    unless m
                        m = Migrator.new(match[1], match[2])
                        @list << m
                    end

                    # update object with filenames of migrators
                    case match[3]
                    when 'rb'
                        m.name_ruby = full_name
                    when 'yaml'
                        m.name_yaml = full_name
                    end
                else
                    # migrator should have an expected name
                    raise OneCfg::Config::Exception::FatalError,
                          "Invalid migrator name '#{base}'"
                end
            end

            sort!

            validate

            @list
        end

        # Finds a migrator for specific version change
        # described as 'from' and 'to' version string.
        def get_migrator(from, to)
            from = Gem::Version.new(from) if from.is_a?(String)
            to   = Gem::Version.new(to)   if to.is_a?(String)

            @list.each do |m|
                return m if (m.from == from) && (m.to == to)
            end

            nil
        end

        # Gets list of migrators for specific range
        def get_migrators_range(from, to)
            from = Gem::Version.new(from) if from.is_a?(String)
            to   = Gem::Version.new(to)   if to.is_a?(String)

            unless supported?(from)
                raise OneCfg::Config::Exception::UnsupportedVersion,
                      "Unsupported from version #{from}"
            end

            unless supported?(to)
                raise OneCfg::Config::Exception::UnsupportedVersion,
                      "No migrators to version #{to}"
            end

            ###

            ret = []
            idx = 0
            started = false # we found a range, get migrators

            while idx < @list.length
                # Take starting range, e.g.
                # from=5.4.5, range=<5.4.0, 5.6.0)
                # Starting range can't contain both from/to.
                if !started &&
                   @list[idx].include?(from, false) &&
                   !@list[idx].include?(to, false)

                    ret << @list[idx]
                    started = true
                elsif started
                    # end on final range, e.g.
                    # to=5.8.5, range=<5.8.0, 5.10.0) ... SKIP
                    # rubocop:disable Style/GuardClause
                    if @list[idx].include?(to, false)
                        return(ret)
                    else
                        ret << @list[idx]
                    end
                    # rubocop:enable Style/GuardClause
                end

                idx += 1
            end

            # TODO: probably these checks are now obsolete if
            # we do initial supported? checks ???
            if ret.empty?
                # unless list.last.include?(to, false, true)
                unless started
                    raise OneCfg::Config::Exception::UnsupportedVersion,
                          "No migrators available from version #{from}"
                end
            else
                # We found migrators, but reached the end of list.
                # The migration doesn't cover target version precisely
                # (e.g., we looked for 5.10.5, but found up to 5.10.0).
                # Still we can make it if we propose all 5.10.* versions
                # to be compatible with migrator to version 5.10.0.
                unless ret.last.include?(to, false, true)
                    raise OneCfg::Config::Exception::UnsupportedVersion,
                          "No migrators available to version #{to}"
                end
            end

            ret
        end

        def validate
            # validate each migrator
            @list.each do |m|
                m.validate
            end

            # check list is contiguous
            @list.each_cons(2) do |m1, m2|
                next if m1.to == m2.from

                raise OneCfg::Config::Exception::FatalError,
                      'Migrators not contiguous, expected ' \
                      "'to' version #{m1.to} to be same as " \
                      "'from' version #{m2.to} version."
            end
        end

        def sort!
            @list.sort_by! {|m| m.from }
        end

        def each(&block)
            @list.each do |migrator|
                block.call(migrator)
            end
        end

    end

end
# rubocop:enable Style/ClassAndModuleChildren

require_relative 'migrators/migrator'
require_relative 'migrators/generate'
require_relative 'migrators/apply'
