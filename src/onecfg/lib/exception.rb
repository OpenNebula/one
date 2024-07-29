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

    module Exception

        # Generic OneCfg exception
        class Generic < RuntimeError

            attr_reader :text

            def initialize(text = nil)
                @text = text
                super(text)
            end

        end

        # OneCfg config exception when file not found
        class FileNotFound < Generic

            def initialize(text = 'File not found')
                super(text)
            end

        end

        # OneCfg config exception on file read
        # rubocop:disable Lint/UselessMethodDefinition
        class FileReadError < Generic

        end

        # OneCfg config exception on file write
        class FileWriteError < Generic

        end
        # rubocop:enable Lint/UselessMethodDefinition

        # OneCfg parser exception on file
        # rubocop:disable Lint/UselessMethodDefinition
        class FileParseError < Generic

        end
        # rubocop:enable Lint/UselessMethodDefinition

    end

end
