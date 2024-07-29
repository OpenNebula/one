#!/usr/bin/ruby

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
# -------------------------------------------------------------------------- #

# Utilities for LXD based marketplaces
module LXDMarket

    class << self

        # TODO: Make configurable
        def template(options = {})
            unindent(<<-EOS)
        SCHED_REQUIREMENTS = \"HYPERVISOR=\\\"lx*\\\"\"
        CPU = \"#{options[:cpu]}\"
        VCPU = \"#{options[:vcpu]}\"
        MEMORY = \"#{options[:memory]}\"
        LXC_UNPRIVILEGED = \"#{!options[:privileged]}\"
        GRAPHICS = [
            LISTEN  =\"0.0.0.0\",
            TYPE  =\"vnc\"
        ]
        CONTEXT = [
            NETWORK  =\"YES\",
            SSH_PUBLIC_KEY  =\"$USER[SSH_PUBLIC_KEY]\",
            SET_HOSTNAME  =\"$NAME\"
        ]"
            EOS
        end

        def unindent(str)
            m = str.match(/^(\s*)/)
            spaces = m[1].size
            str.gsub!(/^ {#{spaces}}/, '')
        end

    end

end
