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

# rubocop:disable Style/ClassAndModuleChildren
module OneCfg::EE

    # Migrators management
    class Migrators::Migrator

        attr_reader   :from
        attr_reader   :to
        attr_reader   :bumped_to
        attr_reader   :yaml
        attr_accessor :name_ruby

        # Class constructor
        def initialize(from, to, name_yaml = nil, name_ruby = nil)
            @from       = Gem::Version.new(from)
            @to         = Gem::Version.new(to)
            @bumped_to  = Gem::Version.new(to).bump
            @name_yaml  = name_yaml
            @name_ruby  = name_ruby
            @yaml       = nil

            validate(true)

            OneCfg::LOG.ddebug("Migrator from #{@from} to #{@to}")
        end

        def to_s
            "\#<#{self.class}:#{@from},#{@to}" \
            "#{yaml? ? ',YAML' : ''}" \
            "#{ruby? ? ',Ruby' : ''}" \
            "#{!yaml? && !ruby? ? ',no migrators' : ''}>"
        end

        def label
            "#{@from} -> #{@to}"
        end

        # Returns true if version is within the range of migrator
        def include?(version, to_closed = true, to_bumped = false)
            version = Gem::Version.new(version) if version.is_a?(String)

            @from <= version &&
                ((version < @to) ||
                 (to_closed && version <= @to) ||
                 (to_bumped && version < @bumped_to))
        end

        def ruby?
            !@name_ruby.to_s.empty?
        end

        def yaml?
            !@name_yaml.to_s.empty?
        end

        # rubocop:disable Style/TrivialAccessors
        def name_yaml
            @name_yaml
        end
        # rubocop:enable Style/TrivialAccessors

        def name_yaml=(name)
            @name_yaml = name

            @yaml = load_yaml
        end

        def load_yaml
            raise OneCfg::Exception::FileNotFound unless yaml? # TODO: different

            if Psych::VERSION > '4.0'
              YAML.load_file(@name_yaml, aliases: true)
            else
              YAML.load_file(@name_yaml)
            end
        end

        def validate(init = false)
            # versions must be growing
            if @from >= @to
                raise OneCfg::Config::Exception::FatalError,
                      'Migrator versions not increasing ' \
                      "(from #{@from} >= to #{@to})"
            end

            # both versions must have 3 components
            [@from, @to].each do |v|
                next if v.segments.length == 3

                raise OneCfg::Config::Exception::FatalError,
                      "Migrator version #{v} must have 3 components"
            end

            # rubocop:disable Style/GuardClause
            unless init || yaml? || ruby?
                # this should never happen
                raise OneCfg::Config::Exception::FatalError,
                      'No YAML or Ruby migrator?'
            end
            # rubocop:enable Style/GuardClause

            # read Ruby?
            # read YAML?
        end

    end

end
# rubocop:enable Style/ClassAndModuleChildren
