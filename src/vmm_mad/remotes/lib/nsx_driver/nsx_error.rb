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
module NSXDriver

    class NSXError < StandardError

        # Class IncorrectResponseCodeError
        class IncorrectResponseCodeError < NSXError

            def initialize(msg = 'Incorrect response code')
                super(msg)
            end

        end

        # Class ObjectNotFound
        class ObjectNotFound < NSXError

            def initialize(msg = 'Object not found')
                super(msg)
            end

        end

        # Class UnknownObject
        class UnknownObject < NSXError

            def initialize(msg = 'Unknown object type')
                super(msg)
            end

        end

        # Class CreateError
        class CreateError < NSXError

            def initialize(msg = 'Error creating NSX object')
                super(msg)
            end

        end

        # Class DeleteError
        class DeleteError < NSXError

            def initialize(msg = 'Error deleting NSX object')
                super(msg)
            end

        end

        # Class DeleteError
        class MissingParameter < NSXError

            def initialize(parameter)
                msg = "Missing NSX parameter #{parameter}"
                super(msg)
            end

        end

    end

end
