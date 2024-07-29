#!/usr/bin/env ruby

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

##############################################################################
# Script to implement host failure tolerance
#   One of the following modes must be chosen
#           -m resched VMs to another host. (Only for images in shared storage!)
#           -r recreate VMs running in the host. State will be lost.
#           -d delete VMs running in the host
#
#   Additional flags
#           -f resubmit suspended and powered off VMs (only for recreate)
#           -p <n> avoid resubmission if host comes back after n monitoring
#                 cycles. 0 to disable it. Default is 2.
#           -u disables fencing. Fencing is enabled by default. Don't disable it
#                 unless you are very sure about what you're doing
##############################################################################

ONE_LOCATION = ENV['ONE_LOCATION']

if !ONE_LOCATION
    RUBY_LIB_LOCATION = '/usr/lib/one/ruby'
    GEMS_LOCATION     = '/usr/share/one/gems'
    VMDIR             = '/var/lib/one'
    CONFIG_FILE       = '/var/lib/one/config'
    LOG_FILE          = '/var/log/one/host_error.log'
else
    RUBY_LIB_LOCATION = ONE_LOCATION + '/lib/ruby'
    GEMS_LOCATION     = ONE_LOCATION + '/share/gems'
    VMDIR             = ONE_LOCATION + '/var'
    CONFIG_FILE       = ONE_LOCATION + '/var/config'
    LOG_FILE          = ONE_LOCATION + '/var/host_error.log'
end

FENCE_HOST = File.dirname(__FILE__) + '/fence_host.sh'

# %%RUBYGEMS_SETUP_BEGIN%%
if File.directory?(GEMS_LOCATION)
    real_gems_path = File.realpath(GEMS_LOCATION)
    if !defined?(Gem) || Gem.path != [real_gems_path]
        $LOAD_PATH.reject! {|l| l =~ /vendor_ruby/ }

        # Suppress warnings from Rubygems
        # https://github.com/OpenNebula/one/issues/5379
        begin
            verb = $VERBOSE
            $VERBOSE = nil
            require 'rubygems'
            Gem.use_paths(real_gems_path)
        ensure
            $VERBOSE = verb
        end
    end
end
# %%RUBYGEMS_SETUP_END%%

$LOAD_PATH << RUBY_LIB_LOCATION

require 'opennebula'
include OpenNebula

require 'getoptlong'
require 'base64'
require 'open3'

################################################################################
# Arguments
################################################################################

# Get arguments from standard input
standard_input = STDIN.read
ARGV.replace(standard_input.split(' '))

raw_host_template = Base64.decode64(ARGV[0])
xml_host_template = Nokogiri::XML(raw_host_template)

HOST_ID = xml_host_template.xpath('HOST/ID').text

################################################################################
# Methods
################################################################################

def log(msg, level="I")
    File.open(LOG_FILE, 'a') do |f|
        msg.lines do |l|
            f.puts "[#{Time.now}][HOST #{HOST_ID}][#{level}] #{l}"
        end
    end
end

def log_error(msg)
    log(msg, "E")
end

def exit_error
    log_error("Exiting due to previous error.")
    exit(-1)
end

def states_xpath(*arr)
    arr.map{|e| "STATE=#{e}"}.join(" or ")
end

################################################################################
# Options
################################################################################

mode    = nil    # **must** be set to something other than nil using the options
force   = false  # By default, don't recreate/delete suspended and poweroff VMs
repeat  = 2      # By default, wait for 2 monitorization cycles
fencing = true

opts = GetoptLong.new(
            ['--migrate',     '-m', GetoptLong::NO_ARGUMENT],
            ['--delete',      '-d', GetoptLong::NO_ARGUMENT],
            ['--recreate',    '-r', GetoptLong::NO_ARGUMENT],
            ['--force',       '-f', GetoptLong::NO_ARGUMENT],
            ['--pause',       '-p', GetoptLong::REQUIRED_ARGUMENT],
            ['--no-fencing',  '-u', GetoptLong::NO_ARGUMENT]
        )

begin
    opts.each do |opt, arg|
        case opt
            when '--migrate'
                mode = :migrate
            when '--delete'
                mode = :delete
            when '--recreate'
                mode = :recreate
            when '--force'
                force = true
            when '--pause'
                repeat = arg.to_i
            when '--no-fencing'
                fencing = false
        end
    end
rescue Exception => e
    log_error e.to_s
    exit_error
end

if mode.nil?
    log_error "Exiting. A mode must be supplied."
    exit_error
end

################################################################################
# Main
################################################################################

log "Hook launched"

begin
    client = Client.new()
rescue Exception => e
    log_error e.to_s
    exit_error
end

sys  = OpenNebula::System.new(client)
conf = sys.get_configuration

begin
    MONITORING_INTERVAL = conf['MONITORING_INTERVAL_HOST'] || 60
rescue Exception => e
    log_error "Could not get MONITORING_INTERVAL_HOST"
    log_error e.to_s
    exit_error
end

# Retrieve hostname
host = OpenNebula::Host.new_with_id(HOST_ID, client)
rc   = host.info

if OpenNebula.is_error?(rc)
    log_error "Could not get host info"
    exit_error
end

log "hostname: #{host.name}"

if repeat > 0
    log "Wait #{repeat} cycles."

    # Sleep through the desired number of monitor interval
    period = repeat * MONITORING_INTERVAL.to_i

    log "Sleeping #{period} seconds."
    sleep(period)

    rc = host.info
    if OpenNebula.is_error?(rc)
        log_error "Could not get host info"
        exit_error
    end

    # If the host came back, exit! avoid duplicated VMs
    if host.state != 3 && host.state != 5
        log "Exiting. Host came back after waiting."
        exit 0
    end
end

# Do fencing
if fencing
    host64 = Base64::strict_encode64(host.to_xml)

    log "Fencing enabled"

    begin
        oe, w = Open3.capture2e(FENCE_HOST, :stdin_data=>host64)
        if w.success?
            log oe
            log "Fencing success"
        else
            raise oe << "\n" << "Fencing error"
        end
    rescue Exception => e
        log_error e.to_s
        exit_error
    end
else
    log "WARNING: Fencing disabled"
end

# Loop through all vms
vms = VirtualMachinePool.new(client)
rc  = vms.info_all

if OpenNebula.is_error?(rc)
    exit_error "Could not get vm pool"
end

ds_pool = OpenNebula::DatastorePool.new(client)
rc = ds_pool.info_all

if OpenNebula.is_error?(rc)
    exit_error "Could not get datastore pool"
end

# STATE=3: ACTIVE (LCM unknown)
# STATE=5: SUSPENDED
# STATE=8: POWEROFF

if mode == :recreate && !force
    log "states: 3"
    state = states_xpath(3)
else
    log "states: 3, 5, 8"
    state = states_xpath(3, 5, 8)
end

xpath = "/VM_POOL/VM[#{state}]/HISTORY_RECORDS/HISTORY[HOSTNAME=\"#{host.name}\" and last()]"
vm_ids_array = vms.retrieve_elements("#{xpath}/../../ID")

if vm_ids_array
    log "vms: #{vm_ids_array}"

    vm_ids_array.each do |vm_id|
        vm = OpenNebula::VirtualMachine.new_with_id(vm_id, client)
        rc = vm.info

        if OpenNebula.is_error?(rc)
            log_error "Could not get info of VM #{vm_id}"
            next
        end

        case mode
        when :recreate
            log "recreate #{vm_id}"
            vm.delete(true)
        when :delete
            log "delete #{vm_id}"
            vm.delete
        when :migrate
            begin
                vm_ds_id  = vm.retrieve_elements('/VM/HISTORY_RECORDS/HISTORY[last()]/DS_ID')[0]

                ds_xpath  = "/DATASTORE_POOL/DATASTORE[ID=\"#{vm_ds_id}\"]/TEMPLATE/SHARED"
                is_shared = ds_pool.retrieve_elements(ds_xpath)[0]

                if is_shared.upcase == "NO"
                    log "Skipping VM #{vm_id} deployed on non-shared datastore"
                    next
                end
            rescue
                log_error "Could not get Datastore ID or SHARED attribute for VM #{vm_id}"
                next
            end

            log "resched #{vm_id}"
            vm.resched
        else
            log_error "unknown mode '#{mode}'"
            exit_error
        end
    end
else
    log "No VMs found."
end

log "Hook finished"
exit 0
