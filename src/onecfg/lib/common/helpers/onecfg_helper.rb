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

require 'tempfile'
require 'yaml'

# OneCfg helper
class OneCfgHelper

    # Check path operation mode is correct
    #
    # @param options [Hash] CLI options
    def check_modes(modes)
        modes.each do |mode|
            unless SUPPORTED_PATCH_MODES.include?(mode)
                warn "Unsupported mode '#{mode}'"
                exit(-1)
            end
        end
    end

    # Parse patch file modes string argument providing default mode,
    # per-file, per-file with version modes. Data handled as Hash:
    #
    #   { file => { version => [modes] } }
    #
    # Notes:
    # - Nil file    applies to all files without overrides
    # - Nil version applies to all files versions without overrides
    #
    # Example:
    # {
    #   nil => {                              # nil = all files
    #     nil => [:skip, :force, :replace]    # nil = all versions
    #   },
    #   "/etc/one/oned.conf" => {
    #     nil   => [:replace],                # nil = all versions
    #     "5.0" => [:skip]
    #   }
    # }
    #
    # @param modes [String] Patch modes per file
    #
    # @return [Hash] Parsed modes
    def parse_patch_modes(modes)
        ret = {}

        modes.each do |mode|
            mode.split(';').each do |m|
                mode, file, version = m.split(':', 3)

                # TODO: how about 'skip::5.8.0' ???

                ret[file] ||= {}
                ret[file][version] ||= []
                ret[file][version] << mode.split(',').map {|v| v.to_sym }
                ret[file][version].flatten!
                ret[file][version].uniq!

                check_modes(ret[file][version])
            end
        end

        ret
    rescue StandardError
        STDERR.puts('ERROR: Wrong modes format, check documentation.')
        exit(-1)
    end

end
