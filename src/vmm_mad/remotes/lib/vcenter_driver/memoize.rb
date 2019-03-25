# -------------------------------------------------------------------------- #
# Copyright 2002-2019, OpenNebula Project, OpenNebula Systems                #
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


module Memoize
    def [](property)
        @memoize = {} if !defined?(@memoize)

        if (value = @memoize[property])
            return value
        end

        current_item = @item

        property_path = ""

        property.split(".").each do |elem|
            if property_path.empty?
                property_path << elem
            else
                property_path << "." << elem
            end

            if (val = @memoize[property_path])
                current_item = val
            else
                begin
                    current_item = current_item.send(elem)
                rescue Exception => e
                    current_item = nil
                end
            end

            break if current_item.nil?

            @memoize[property_path] = current_item

        end

        @memoize[property] = current_item
    end

    def []=(property, value)
        @memoize = {} if !defined?(@memoize)

        @memoize[property] = value
    end
end # module Memoize
