# ---------------------------------------------------------------------------- #
# Copyright 2010-2011, C12G Labs S.L                                           #
#                                                                              #
# Licensed under the Apache License, Version 2.0 (the "License"); you may      #
# not use this file except in compliance with the License. You may obtain      #
# a copy of the License at                                                     #
#                                                                              #
# http://www.apache.org/licenses/LICENSE-2.0                                   #
#                                                                              #
# Unless required by applicable law or agreed to in writing, software          #
# distributed under the License is distributed on an "AS IS" BASIS,            #
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.     #
# See the License for the specific language governing permissions and          #
# limitations under the License.                                               #
# ---------------------------------------------------------------------------- #

# ---------------------------------------------------------------------------- #
# Set up the environment for the driver                                        #
# ---------------------------------------------------------------------------- #

ONE_LOCATION = ENV["ONE_LOCATION"] if !defined?(ONE_LOCATION)

if !ONE_LOCATION
    BIN_LOCATION      = "/usr/bin"  if !defined?(BIN_LOCATION)
    ETC_LOCATION      = "/etc/one/" if !defined?(ETC_LOCATION)
    RUBY_LIB_LOCATION = "/usr/lib/one/ruby" if !defined?(RUBY_LIB_LOCATION)
else
    BIN_LOCATION      = ONE_LOCATION + "/bin" if !defined?(BIN_LOCATION)
    ETC_LOCATION      = ONE_LOCATION  + "/etc/" if !defined?(ETC_LOCATION)
    if !defined?(RUBY_LIB_LOCATION)
        RUBY_LIB_LOCATION = ONE_LOCATION  + "/lib/ruby" 
    end
end

$: << RUBY_LIB_LOCATION

require "OpenNebulaDriver"
require "CommandManager"

# Do host sustitution in the libvirt URI
LIBVIRT_URI.gsub!('@HOST@', @host)

# Common functions
def perform_action(command)
    command = BIN_LOCATION + "/tty_expect -u " + USERNAME + " -p " + PASSWORD + " " + command

    action_result = LocalCommand.run(command)

    if action_result.code == 0
        return action_result.stdout
    else
        log(command, action_result.stderr, action_result.stdout)
        return action_result.code
    end
end

def log(cmd, stdout, stderr)
    STDERR.puts "[VMWARE] cmd failed [" + cmd +
                "]. Stderr: " + stderr + ". Stdout: " + stdout
end
