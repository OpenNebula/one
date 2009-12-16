# -------------------------------------------------------------------------- #
# Copyright 2002-2009, Distributed Systems Architecture Group, Universidad   #
# Complutense de Madrid (dsa-research.org)                                   #
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

require 'OpenNebula'
require 'erb'

include OpenNebula

module ImageOCCI
    OCCI_IMAGE = %q{
        <DISK>
            <ID><%= self.id %></ID>
            <NAME><%= name %></NAME>
            <SIZE><%= ((size/1024)/1024).to_s %></SIZE>
            <URL><%= description %></URL>
        </DISK>
    }.gsub(/^        /, '')


    # Creates the OCCI representation of an Image
    def to_occi()
        occi = ERB.new(OCCI_IMAGE)
        return occi.result(binding)
    end
end
