# -------------------------------------------------------------------------- #
# Copyright 2002-2012, OpenNebula Project Leads (OpenNebula.org)             #
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

module OZones

    class ProxyRules
        def initialize(type, file_path)
            @type      = type
            if file_path
                @file_path = file_path
            else
                if !ENV["ONE_LOCATION"]
                    @file_path="/var/lib/one/.htaccess"
                else
                    @file_path=ENV["ONE_LOCATION"]+"/var/.htaccess"
                end
            end

            # Let's check for file permissions
            if !File.writable?(@file_path) and
                    !File.writable?(File.dirname(@file_path))
                raise "#{@file_path} is not writable"
            end
        end

        def update
            case @type
            when "apache"
                apWritter = OZones::ApacheWritter.new @file_path
                apWritter.update
            end
        end
    end

end
