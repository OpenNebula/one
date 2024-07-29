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

# rubocop:disable Style/ClassAndModuleChildren
module OneCfg::Config::Type

    # Simple file class
    class Simple < Base

        # Patch Safe Default Modes
        # Empty array, means there is no default mode
        PATCH_SAFE_MODES = []

        # Class constructor
        #
        # @param name [String] File name (optional)
        def initialize(name = nil)
            super(name)
        end

        # Load file content
        #
        # @param name [String] Custom file name
        #
        # @return [Object] Read content
        def load(name = @name)
            reset

            file_operation(name, 'r') do |file|
                @content = file.read
            end

            @content
        end

        # Save content into a file
        #
        # @param name [String] Custom file name
        def save(name = @name)
            raise OneCfg::Config::Exception::NoContent if @content.nil?

            file_operation(name, 'w') do |file|
                file.write(@content)
            end
        end

    end

end
# rubocop:enable Style/ClassAndModuleChildren
