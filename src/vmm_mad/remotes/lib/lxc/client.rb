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
#--------------------------------------------------------------------------- #

require 'command'

# LXC Cli Client. Runs LXC commands listed in COMMANDS and returns their
# output in convenient data structures
class LXCClient

    # LXC CLI Commands
    COMMANDS = {
        :attach     => 'lxc-attach',
        :config     => 'lxc-config',
        :console    => 'lxc-console',
        :create     => 'lxc-create',
        :destroy    => 'lxc-destroy',
        :info       => 'lxc-info',
        :ls         => 'lxc-ls',
        :start      => 'lxc-start',
        :stop       => 'lxc-stop'
    }

    COMMANDS.each_value do |value|
        value.prepend 'sudo '
    end

    # Returns LXC version
    def version
        _, rc, = Command.execute_log("#{COMMANDS[:ls]} --version")
        rc
    end

    #-----------------------------------------------------------------------
    # Life Cycle Operations
    #-----------------------------------------------------------------------

    def start(name, options = {})
        cmd = append_options("#{COMMANDS[:start]} -n '#{name}'", options)
        Command.container_cmd(name, cmd)
    end

    def stop(name, options = {})
        cmd = append_options("#{COMMANDS[:stop]} -n '#{name}'", options)
        Command.container_cmd(name, cmd)
    end

    def create(name, options = {})
        options[:template] ||= 'none' # Template is mandatory

        cmd = append_options("#{COMMANDS[:create]} -n '#{name}'", options)
        Command.container_cmd(name, cmd)
    end

    def destroy(name, options = {})
        cmd = append_options("#{COMMANDS[:destroy]} -n '#{name}'", options)
        Command.container_cmd(name, cmd)
    end

    #-----------------------------------------------------------------------
    # Monitoring
    #-----------------------------------------------------------------------

    # Creates a hash from lxc-info
    # Example output of the command
    # Name:           one-lxc
    # State:          RUNNING
    # PID:            3706092
    # CPU use:        0.33 seconds
    # BlkIO use:      6.06 MiB
    # Memory use:     10.19 MiB
    # KMem use:       3.13 MiB
    def info(name, options = {})
        cmd = append_options("#{COMMANDS[:info]} -n '#{name}'", options)
        rc, stdout, = Command.execute_log(cmd)

        if rc == false
            return
        end

        hash_out(stdout)
    end

    # Returns a list of container
    def list(options = {})
        cmd = append_options(COMMANDS[:ls], options)
        rc, stdout, = Command.execute_log(cmd)

        if rc == false
            return
        end

        stdout.split
    end

    private

    # append options to cmd string
    # options name should match an existing comand option.
    # If the option has no value it should look like {:option => nil}
    def append_options(cmd, options)
        rc = cmd

        options.each do |opt, val|
            if opt.size == 1
                rc << " -#{opt}"
            else
                rc << " --#{opt}"
            end

            rc << " #{val}" if val
        end

        rc
    end

    # lxc-info like out
    def hash_out(output)
        hash = {}

        output.split("\n").each do |element|
            element.strip!
            info = element.split(/:\s+/)

            if hash[info[0]]
                hash[info[0]] = Array(hash[info[0]])
                hash[info[0]] << info[1]
            else
                hash[info[0]] = info[1]
            end
        end

        hash
    end

end
