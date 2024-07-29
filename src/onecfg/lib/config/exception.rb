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

# rubocop:disable Style/ClassAndModuleChildren
# rubocop:disable Lint/UselessMethodDefinition
module OneCfg::Config::Exception

    # OneCfg critical error, which shouldn't happen
    class FatalError < OneCfg::Exception::Generic

    end

    # Unsupported OpenNebula version exception
    class UnsupportedVersion < OneCfg::Exception::Generic

    end

    # Invalid file structure.
    class StructureError < OneCfg::Exception::Generic

    end

    # OneCfg config exception when content is not initialized
    class NoContent < OneCfg::Exception::Generic

    end

    ### Patch Exceptions #############################

    # Generic Patch Exception
    class PatchException < OneCfg::Exception::Generic

        # Failed diff operation
        attr_accessor :data

    end

    # Patch exception when value can't be placed on desired place
    class PatchPathNotFound < PatchException

        attr_reader :path

        def initialize(path)
            if path.empty?
                path_str = '(top level)'
            else
                path_str = path.join('/')
            end

            super("Patch path '#{path_str}' not found")

            @path = path
        end

    end

    # Patch exception when we would create or remove multiple
    # configuration parameters on place where where it doesn't
    # make sense.
    class PatchInvalidMultiple < PatchException

        attr_reader :path

        def initialize(path)
            super("Wrong multiple use of parameter '#{path}'")

            @path = path
        end

    end

    # Patch exception when we found unexpected unspecified data structure.
    class PatchUnexpectedData < PatchException

        attr_reader :type
        attr_reader :expected

        def initialize(type)
            @type = type

            if defined?(@expected)
                super("Expected #{@expected} but got #{@type}")
            else
                super("Unexpected data type #{type} found")
            end
        end

    end

    # Patch exception when we found different data type on
    # a place where Hash was expected.
    class PatchExpectedHash < PatchUnexpectedData

        def initialize(type)
            @expected = 'Hash'

            super(type)
        end

    end

    # Patch exception when we found different data type on
    # a place where Array was expected.
    class PatchExpectedArray < PatchUnexpectedData

        def initialize(type)
            @expected = 'Array'

            super(type)
        end

    end

    # Value we expected on specified structure index to
    # use for old value remove or as context for new
    # value, wasn't found.
    class PatchValueNotFound < PatchException

        attr_reader :value

        def initialize(value)
            super("Value '#{value}' not found")

            @value = value
        end

    end

    # Exception to indicate that the current patch
    # operation should be restarted by searching
    # the place in a tree and reapplication.
    class PatchRetryOperation < PatchException

        def initialize
            super('Retrying patch operation')
        end

    end

end
# rubocop:enable Style/ClassAndModuleChildren
# rubocop:enable Lint/UselessMethodDefinition
