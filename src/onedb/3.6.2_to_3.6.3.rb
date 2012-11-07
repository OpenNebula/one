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

class String
    def red
        colorize(31)
    end

private

    def colorize(color_code)
        "\e[#{color_code}m#{self}\e[0m"
    end
end

module Migrator
    def db_version
        "3.6.3"
    end

    def one_version
        "OpenNebula 3.6.3"
    end

    def up
        puts
        puts "ATTENTION: manual intervention required".red
        puts <<-END.gsub(/^ {8}/, '')
        Virtual Machine deployment files have been moved from /var/lib/one to
        /var/lib/one/vms. You need to move these files manually:

            $ mv /var/lib/one/[0-9]* /var/lib/one/vms

        END
        return true
    end
end
