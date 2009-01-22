#!/usr/bin/env ruby

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

ONE_LOCATION=ENV["ONE_LOCATION"]
DEBUG_LEVEL=ENV["ONE_MAD_DEBUG"]

if !ONE_LOCATION
    RUBY_LIB_LOCATION="/usr/lib/one/ruby"
else
    RUBY_LIB_LOCATION=ONE_LOCATION+"/lib/ruby"
end

$: << RUBY_LIB_LOCATION

require 'pp'

require 'one_mad'
require 'one_ssh'
require 'open3'


class DM < ONEMad
    
    ###########################
    # Constructor             #
    ###########################
    
    def initialize
        super(5, 4)
        
        if DEBUG_LEVEL and !DEBUG_LEVEL.empty? 
            set_logger(STDERR,DEBUG_LEVEL)
        end
    end
    
    ###########################
    # Actions                 #
    ###########################
    
    def action_init(args)
        send_message("INIT", "SUCCESS")
    end
        
    def action_deploy(args)
        action_number=args[1]
        action_host=args[2]
        remote_deployment_file=args[3]
        action_name="DEPLOY"
        
        # Get local deployment file
        local_deployment_file=get_local_deployment_file(remote_deployment_file)
        
        # If we can copy the deployment file
        if local_deployment_file
            # TODO: review this way of copying files
            # This command copies deployment file to remote machine
            # when shared directories are not used
            copy_deploy="scp #{local_deployment_file} "+
                "#{action_host}:#{remote_deployment_file}"
            mad_log("DEPLOY", action_number, "Command: #{copy_deploy}")
            copy_deploy_exit=execute_local_command(copy_deploy)

            if copy_deploy_exit
                mad_log("DEPLOY", action_number, 
                    "Error: "+copy_deploy_exit.to_s)
            else
                mad_log("DEPLOY", action_number,
                    "Copy success")
            end
        end
        
        command="create #{remote_deployment_file}"
        std=exec_kvm_command(action_host, command)
        stdout=std[1].read
        stderr=std[2].read
        
        if !stderr.empty?
            mad_log("DEPLOY", action_number, stderr)
        end     
        
        write_response(action_name, stdout, stderr, args)
        
        #std_action("DEPLOY", "create #{args[3]}", args)
    end
    
    def action_shutdown(args)
        std_action("SHUTDOWN", "shutdown #{args[3]}", args)
    end
    
    def action_cancel(args)
        std_action("CANCEL", "destroy #{args[3]}", args)
    end
    
    def action_checkpoint(args)
        send_message("CHECKPOINT", "FAILURE", args[1], "action not supported for KVM")
    end

    def action_save(args)
        std_action("SAVE", "save #{args[3]} #{args[4]}", args)
    end

    def action_restore(args)
        std_action("RESTORE", "restore #{args[3]}", args)
    end
    
    def action_migrate(args)
        std_action("MIGRATE", "migrate --live #{args[3]} qemu+tcp://#{args[4]}/session", args)
    end
    
    def action_poll(args)
        action_number=args[1]
        
        std=Open3.popen3(
            "ssh -n #{args[2]} virsh dominfo #{args[3]};"+
            " echo ExitCode: $? 1>&2")
        stdout=std[1].read
        stderr=std[2].read
        
        if !stderr.empty?
            mad_log("POLL", action_number, stderr)
        end
        
        exit_code=get_exit_code(stderr)
        
        if exit_code!=0   
            tmp=stderr.scan(/^error: failed to get domain '#{args[3]}'/)
            if tmp[0]
                send_message("POLL", "SUCCESS", args[1], "STATE=d")
            else
                send_message("POLL", "FAILURE", args[1])
            end
            return nil
        end
        
        info = parse_virsh_dominfo(stdout)      

        # TODO -> Get more info, like NET info. Need to know the iface name (e.g. tap0)
                        
        send_message("POLL", "SUCCESS", args[1], info)
    end
    
    ###########################
    # Common action functions #
    ###########################
    
    def std_action(name, command, args)
        action_number=args[1]
        std=exec_kvm_command(args[2], command)
        stdout=std[1].read
        stderr=std[2].read
        
        if !stderr.empty?
            mad_log(name, action_number, stderr)
        end     
                
        write_response(name, stdout, stderr, args)
    end
        
    def exec_kvm_command(host, command)
        Open3.popen3(
            "ssh -n #{host} virsh #{command} ;"+
            " echo ExitCode: $? 1>&2")
    end
    
    def write_response(action, stdout, stderr, args)
        exit_code=get_exit_code(stderr)
        
        if exit_code==0
            domain_name=get_domain_name(stdout)
            send_message(action, "SUCCESS", args[1], domain_name)
        else
            error_message=get_error_message(stderr)
            send_message(action, "FAILURE", args[1], error_message)
        end

    end
    

    #########################################
    # Parsers for virsh output              #
    #########################################

    # From STDERR if exit code == 1
    def get_exit_code(str)
        tmp=str.scan(/^ExitCode: (\d*)$/)
        return nil if !tmp[0]
        tmp[0][0].to_i
    end
    
    # From STDERR if exit code == 1
    def get_error_message(str)
        tmp=str.scan(/^error: (.*)$/)
        return "Unknown error" if !tmp[0]
        tmp[0][0]
    end

    # From STDOUT if exit code == 0
    def get_domain_name(str)
        tmp=str.scan(/^Domain (.*) created from .*$/)
        return nil if !tmp[0]
        tmp[0][0]
    end
    
    
    ###############################
    # Get information from virsh  #
    ###############################
        
    
    def parse_virsh_dominfo(returned_info)
        
        info  = ""
        state = "u"
        
        returned_info.each_line {|line|
         
            columns=line.split(":").collect {|c| c.strip }
            case columns[0]
                when 'Used memory'
                        info += "USEDMEMORY=" + (columns[1].to_i).to_s
                when 'State'
                      case columns[1]
                          when "running","blocked","shutdown","dying"
                              state = "a"
                          when "paused"
                              state = "p"
                          when "crashed"
                              state = "e"
                      end   
                end     
        }    
        
        info += " STATE=" + state 
    
        return info
    end
    
end

dm=DM.new
dm.loop
