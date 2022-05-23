# -------------------------------------------------------------------------- #
# Copyright 2002-2022, OpenNebula Project, OpenNebula Systems                #
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

require 'open3'

# Command helper class
class Command

    def initialize(remote_user = nil, remote_host = nil)
        @local = true
        @host = nil
        @user = nil

        # Set up host if provided
        if !remote_host.nil? && !remote_host.empty?
            @host = remote_host
            @local = false
        end

        # Return if no user provided
        return if remote_user.nil? || remote_user.empty?

        # Fail if user provided but not host
        raise 'Remote user provided, but host is empty.' unless @host

        @user = remote_user
    end

    # Executes a command either locally on remotely depending on the
    # configuration.
    #
    # The comand and each arg will be wraped by single quotes to avoid
    # injections attacks.
    #
    #   @return [String, String, Process::Status] the standard output,
    #                                             standard error and
    #                                             status returned by
    def run(cmd, *args)
        if cmd.split.size > 1
            raise 'Cannot run cmd for security reasons.' \
                  'Check run_insecure method'
        end

        cmd  = "'#{cmd}'"
        args = quote_args(args)

        run_insecure(cmd, args)
    end

    # Executes a command either locally on remotely depending on the
    # configuration. And redirect the stdout and stderr to the path
    # contained in the corresponding variables
    #
    # The comand and each arg will be wraped by single quotes to avoid
    # injections attacks.
    #
    #   @return [String, String, Process::Status] the standard output,
    #                                             standard error and
    #                                             status returned by
    def run_redirect_output(cmd, stdout, stderr, *args)
        cmd  = "'#{cmd}'"
        args = quote_args(args)

        args << "> #{stdout}" if !stdout.nil?  && !stdout.empty?
        args << "2> #{stderr}" if !stderr.nil? && !stderr.empty?

        run_insecure(cmd, args)
    end

    # Executes a command either locally on remotely depending on the
    # configuration. And redirect the stdout and stderr to the path
    # contained in the corresponding variables
    #
    # This method won't validate the input, hence the command execution
    # is prone to injection attacks. Ensure both cmd and arguments have
    # been validated before using this method and when possible use secure
    # methods instead.
    #
    #   @return [String, String, Process::Status] the standard output,
    #                                             standard error and
    #                                             status returned by
    def run_insecure(cmd, *args)
        if @local
            run_local(cmd, args)
        else
            run_ssh(@user, @host, cmd, args)
        end
    end

    private

    # Executes a command locally
    #   @return [String, String, Process::Status] the standard output,
    #                                             standard error and
    #                                             status returned by
    #                                             Open3.capture3
    def run_local(cmd, *args)
        cmd_str = "#{cmd} #{args.join(' ')}"

        Open3.capture3(cmd_str)
    end

    # Executes a command remotely via SSH
    #   @return [String, String, Process::Status] the standard output,
    #                                             standard error and
    #                                             status returned by
    #                                             Open3.capture3
    def run_ssh(user, host, cmd, *args)
        ssh_usr = ''

        ssh_usr = "-l \"#{user}\"" if !user.nil? && !user.empty?

        # TODO, should we make this configurabe?
        ssh_opts = '-o ForwardAgent=yes -o ControlMaster=no ' \
                   '-o ControlPath=none -o StrictHostKeyChecking=no'

        cmd_str = "ssh #{ssh_opts} #{ssh_usr} '#{host}' "
        cmd_str << "bash -s <<EOF\n"
        cmd_str << "export LANG=C\n"
        cmd_str << "export LC_ALL=C\n"
        cmd_str << "#{cmd} #{args.join(' ')}\n"
        cmd_str << 'EOF'

        Open3.capture3(cmd_str)
    end

    def quote_args(args)
        args.map do |arg|
            "'#{arg}'"
        end
    end

end
