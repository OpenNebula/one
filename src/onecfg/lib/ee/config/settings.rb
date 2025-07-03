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
module OneCfg::EE::Config

    # Versions management class
    class Settings < OneCfg::Settings

        # include Singleton

        def initialize
            @defaults = {
                'version' => nil
            }

            super(OneCfg::CONFIG_CFG)

            # rubocop:disable Style/GuardClause
            unless @content.is_a?(Hash)
                # this should never happen
                raise OneCfg::Config::Exception::FatalError,
                      'Invalid settings content'
            end
            # rubocop:enable Style/GuardClause
        end

        def version
            Gem::Version.new(@content['version']) if @content['version']
        end

        def version=(value)
            @content['version'] = value.to_s
            save
        end

        def backup
            @content['backup']
        end

        def outdated?
            @content['outdated'] == true
        end

    end

end
# rubocop:enable Style/ClassAndModuleChildren
