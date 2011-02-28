# -------------------------------------------------------------------------- #
# Copyright 2002-2011, OpenNebula Project Leads (OpenNebula.org)             #
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

class ClientMock
    def initialize(mock_data)
        @mock_data=mock_data
    end
    
    def search_method(methods, args)
        keys=methods.keys
        
        if keys.include? args[0]
            value=methods[args[0]]
            if value.class != Hash
                return value
            elsif args.length>1
                return search_method(value, args[1..-1])
            else
                nil
            end
        else
            nil
        end
    end
    
    def call(action, *args)
        value=search_method(@mock_data, [action]+args.flatten)
        if value
            if value.class==Proc
                value.call(action, args.flatten)
            else
                value
            end
        else
            message="Action '#{action}(#{args.join(',')})' not defined"
            STDERR.puts message
            OpenNebula::Error.new(message)
        end
    end
end


