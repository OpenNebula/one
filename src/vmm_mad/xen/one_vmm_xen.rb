#!/usr/bin/env ruby

XENTOP_PATH=ENV["XENTOP_PATH"]
XM_PATH=ENV["XM_PATH"]

ONE_LOCATION=ENV["ONE_LOCATION"]

DEBUG_LEVEL=ENV["ONE_MAD_DEBUG"]

if !ONE_LOCATION
	puts "ONE_LOCATION not set"
	exit -1
end

$: << ONE_LOCATION+"/lib/ruby"

require 'pp'

require 'one_mad'
require 'open3'
require 'one_ssh'

class DM < ONEMad
	include SSHActionController
	
	def initialize
		super(5, 4)
		
		if DEBUG_LEVEL and !DEBUG_LEVEL.empty? 
			set_logger(STDERR,DEBUG_LEVEL)
		end
		
		init_actions(50)
	end
	
	def action_init(args)
		send_message("INIT", "SUCCESS")
	end
		
	def action_deploy(args)
		#std_action("DEPLOY", "create #{args[3]}", args)
		
		# Get local deployment file
		one_location=ENV["ONE_LOCATION"]
		m=args[3].match(/.*?\/(\d+)\/images\/(deployment.\d+)$/)
		
		# If matched the we can read the file and get more configuration values
		if m
			local_deployment_file="#{one_location}/var/#{m[1]}/#{m[2]}"

            # TODO: review this way of copying files
            # This command copies deployment file to remote machine
            # when shared directories are not used
            copy_deploy="scp #{local_deployment_file} #{args[2]}:#{args[3]}"
            copy_deploy_exit=system(copy_deploy)
            STDERR.puts("Command: #{copy_deploy}")
            STDERR.puts(copy_deploy_exit)
            STDERR.flush

		   
			# TODO: check for error
			file=open(local_deployment_file)
			f=file.read
			file.close
		
			# Get values passed in the deployment file, the form is:
			#   [["CPU_CREDITS", "3"], ["OTHER_VARIABLE", "value"]]
			values=f.scan(/^#O (.*?) = (.*)$/)

			# Gets the first pair with the name provided or nil if not found
			credits=values.assoc("CPU_CREDITS")
			credits=credits[1] if credits

			# Get the name of the VM (used to set credit scheduling)
			match_name=f.match(/^name = '(.*?)'$/)
			if match_name
			    vm_name=match_name[1]
			else
			    credits=nil
			end
		end

		action_number=args[1]
		action_host=args[2]
		
		cmd_str="sudo #{XM_PATH} create #{args[3]}"
		
		# Add sched-cred command if credits are defined
		if(credits)
		    cmd_str+=" \\&\\& sudo #{XM_PATH} sched-cred -d #{vm_name} -w #{credits}"
		    log("Setting credits for the VM",ONEMad::DEBUG)
			log("Command: #{cmd_str}",ONEMad::DEBUG)
		end
		
		cmd=SSHCommand.new(cmd_str)
		cmd.callback=lambda do |a, num|
			write_response("DEPLOY", a.stdout, a.stderr, args)
		end
		
		action=SSHAction.new(action_number, action_host, cmd)
		send_ssh_action(action)
	end
	
	def action_shutdown(args)
		std_action("SHUTDOWN", "shutdown #{args[3]} \\&\\& sudo #{XM_PATH} destroy #{args[3]} \\&\\& sleep 4", args)
	end
	
	def action_cancel(args)
		std_action("CANCEL", "destroy #{args[3]}", args)
	end
	
	def action_checkpoint(args)
		std_action("CHECKPOINT", "save -c #{args[3]} #{args[4]}", args)
	end

	def action_save(args)
		std_action("SAVE", "save #{args[3]} #{args[4]}", args)
	end

	def action_restore(args)
		std_action("RESTORE", "restore #{args[3]}", args)
	end
	
	def action_migrate(args)
		std_action("MIGRATE", "migrate -l #{args[3]} #{args[4]}", args)
	end
	
	def action_poll(args)	
		action_number=args[1]
		action_host=args[2]
		
		cmd=SSHCommand.new("sudo #{XENTOP_PATH} -bi2")
		cmd.callback=lambda do |a,num|
		
			stdout=a.stdout
			stderr=a.stderr
			
			if !stderr.empty?
				log(stderr,ONEMad::ERROR)
			end
		
			exit_code=get_exit_code(stderr)
		
			if exit_code!=0
				send_message("POLL", "FAILURE", args[1])
				return nil
			end
		
			values=parse_xentop(args[3], stdout)
		
			if !values
				send_message("POLL", "SUCCESS", args[1], "STATE=d")
				return nil
			end
		
			info=values.map do |k,v|
				k+"="+v
			end.join(" ")
		
			send_message("POLL", "SUCCESS", args[1], info)
		end # End of callback
		
		action=SSHAction.new(action_number, action_host, cmd)
		send_ssh_action(action)
	end
	
	###########################
	# Common action functions #
	###########################
	
	def std_action(name, command, args)
		action_number=args[1]
		action_host=args[2]
		
		cmd=SSHCommand.new("sudo #{XM_PATH} "+command)
		cmd.callback=lambda do |a, num|
			write_response(name, a.stdout, a.stderr, args)
		end
		
		action=SSHAction.new(action_number, action_host, cmd)
		send_ssh_action(action)
	end
	
	def write_response(action, stdout, stderr, args)
		exit_code=get_exit_code(stderr)
		
		if !stderr.empty?
			log(stderr,ONEMad::ERROR)
		end
		
		if exit_code==0
			domain_name=get_domain_name(stdout)
			send_message(action, "SUCCESS", args[1], domain_name)
		else
			error_message=get_error_message(stderr)
			send_message(action, "FAILURE", args[1], error_message)
		end


	end
	

	#########################################
	# Get information form xm create output #
	#########################################

	# From STDERR if exit code == 1
	def get_exit_code(str)
		tmp=str.scan(/^ExitCode: (\d*)$/)
		return nil if !tmp[0]
		tmp[0][0].to_i
	end
	
	# From STDERR if exit code == 1
	def get_error_message(str)
		tmp=str.scan(/^Error: (.*)$/)
		return "Unknown error" if !tmp[0]
		tmp[0][0]
	end

	# From STDOUT if exit code == 0
	def get_domain_name(str)
		tmp=str.scan(/^Started domain (.*)$/)
		return nil if !tmp[0]
		tmp[0][0]
	end
	
	
	###############################
	# Get information from xentop #
	###############################
	
	# COLUMNS
	#
	# 00 -> NAME
	# 01 -> STATE
	# 02 -> CPU(sec)
	# 03 -> CPU(%)
	# 04 -> MEM(k) 
	# 05 -> MEM(%)	
	# 06 -> MAXMEM(k) 
	# 07 -> MAXMEM(%) 
	# 08 -> VCPUS 
	# 09 -> NETS 
	# 10 -> NETTX(k) 
	# 11 -> NETRX(k) 
	# 12 -> VBDS   
	# 13 -> VBD_OO	 
	# 14 -> VBD_RD	 
	# 15 -> VBD_WR 
	# 16 -> SSID
	
	ColumnNames=[
		"name", "STATE", "cpu_sec", "USEDCPU", "USEDMEMORY", "mem_percent", 
		"maxmem_k", "maxmem_percent", "vcpus", "nets", "NETTX", "NETRX",
		"vdbs", "vdb_oo", "vdb_rd", "vdb_wr", "ssid"
	]
	
	ColumnsToPrint=[ "USEDMEMORY", "USEDCPU", "NETRX", "NETTX", "STATE"]
	
	def parse_xentop(name, stdout)
		line=stdout.split(/$/).select{|l| l.match(/^ *(migrating-)?#{name} /) }[-1]
		
		return nil if !line
		
		line.gsub!("no limit", "no_limit")
		data=line.split
		values=Hash.new
		
		# Get status code
		index=ColumnNames.index("STATE")
		state=data[index]
		state.gsub!("-", "")
		
		case state
		when "r", "b", "s","d"
			state="a" # alive
		when "p"
			state="p" # paused
		when "c"
		    state="e" # error
		else
			state="u" # unknown
		end
		
		data[index]=state
		
		ColumnNames.each_with_index do |n, i|
			values[n]=data[i] if ColumnsToPrint.include? n
		end
	
		values
	end
	
end

dm=DM.new
dm.loop
