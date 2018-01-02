#!/usr/bin/env ruby

# -------------------------------------------------------------------------- */
# Copyright 2002-2018, OpenNebula Project, OpenNebula Systems                #
# Licensed under the Apache License, Version 2.0 (the "License"); you may    */
# not use this file except in compliance with the License. You may obtain    */
# a copy of the License at                                                   */
#                                                                            */
# http://www.apache.org/licenses/LICENSE-2.0                                 */
#                                                                            */
# Unless required by applicable law or agreed to in writing, software        */
# distributed under the License is distributed on an "AS IS" BASIS,          */
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.   */
# See the License for the specific language governing permissions and        */
# limitations under the License.                                             */
# -------------------------------------------------------------------------- */

# ----------------------------------------------------------------------------
# Set up the environment for the driver
# ----------------------------------------------------------------------------

ONE_LOCATION = ENV["ONE_LOCATION"]

if !ONE_LOCATION
    RUBY_LIB_LOCATION = "/usr/lib/one/ruby"
    VAR_LOCATION      = "/var/lib/one"
else
    RUBY_LIB_LOCATION = ONE_LOCATION + "/lib/ruby"
    VAR_LOCATION      = ONE_LOCATION + "/var"
end

$: << RUBY_LIB_LOCATION

require "OpenNebulaDriver"
require 'getoptlong'
require 'base64'
require 'rexml/document'

# This class provides basic messaging and logging functionality
# to implement Datastore Drivers. A datastore driver
# is a program (or a set of) that  specialize the OpenNebula behavior
# by interfacing with specific infrastructure storage solutions.
class DatastoreDriver < OpenNebulaDriver

    # Image Driver Protocol constants
    ACTION = {
        :cp      => "CP",
        :rm      => "RM",
        :mkfs    => "MKFS",
        :log     => "LOG",
        :stat    => "STAT",
        :clone   => "CLONE",
        :monitor => "MONITOR",
        :snap_delete => "SNAP_DELETE",
        :snap_revert => "SNAP_REVERT",
        :snap_flatten=> "SNAP_FLATTEN"
    }

    # Default System datastores for OpenNebula, override in oned.conf
    SYSTEM_DS_TYPES = [
      "shared",
      "ssh",
      "ceph"
    ]

    # Register default actions for the protocol
    def initialize(ds_type, sys_ds_type, options={})
        @options={
            :concurrency => 10,
            :threaded => true,
            :retries => 0,
            :local_actions => {
                ACTION[:stat]    => nil,
                ACTION[:cp]      => nil,
                ACTION[:rm]      => nil,
                ACTION[:mkfs]    => nil,
                ACTION[:clone]   => nil,
                ACTION[:monitor] => nil,
                ACTION[:snap_delete] => nil,
                ACTION[:snap_revert] => nil,
                ACTION[:snap_flatten] => nil
            }
        }.merge!(options)

        super("datastore/", @options)

        if ds_type == nil
            @types = Dir["#{@local_scripts_path}/*/"].map do |d|
                d.split('/')[-1]
            end
        elsif ds_type.class == String
            @types = [ds_type]
        else
            @types = ds_type
        end

        if sys_ds_type == nil
            @sys_types = SYSTEM_DS_TYPES
        elsif sys_ds_type.class == String
            @sys_types = [sys_ds_type]
        else
            @sys_types = sys_ds_type
        end

        @local_tm_scripts_path = File.join(@local_scripts_base_path, 'tm/')

        register_action(ACTION[:cp].to_sym, method("cp"))
        register_action(ACTION[:rm].to_sym, method("rm"))
        register_action(ACTION[:mkfs].to_sym, method("mkfs"))
        register_action(ACTION[:stat].to_sym, method("stat"))
        register_action(ACTION[:clone].to_sym, method("clone"))
        register_action(ACTION[:monitor].to_sym, method("monitor"))
        register_action(ACTION[:snap_delete].to_sym, method("snap_delete"))
        register_action(ACTION[:snap_revert].to_sym, method("snap_revert"))
        register_action(ACTION[:snap_flatten].to_sym, method("snap_flatten"))
    end

    ############################################################################
    # Image Manager Protocol Actions (generic implementation)
    ############################################################################

    def cp(id, drv_message)
        ds, sys = get_ds_type(drv_message)
        do_image_action(id, ds, :cp, "#{drv_message} #{id}")
    end

    def rm(id, drv_message)
        ds, sys = get_ds_type(drv_message)
        do_image_action(id, ds, :rm, "#{drv_message} #{id}")
    end

    def mkfs(id, drv_message)
        ds, sys = get_ds_type(drv_message)
        do_image_action(id, ds, :mkfs, "#{drv_message} #{id}")
    end

    def stat(id, drv_message)
        ds, sys = get_ds_type(drv_message)
        do_image_action(id, ds, :stat, "#{drv_message} #{id}")
    end

    def clone(id, drv_message)
        ds, sys = get_ds_type(drv_message)
        do_image_action(id, ds, :clone, "#{drv_message} #{id}")
    end

    def monitor(id, drv_message)
        ds, sys = get_ds_type(drv_message)
        do_image_action(id, ds, :monitor, "#{drv_message} #{id}", sys, true)
    end

    def snap_delete(id, drv_message)
        ds, sys = get_ds_type(drv_message)
        do_image_action(id, ds, :snap_delete, "#{drv_message} #{id}")
    end

    def snap_revert(id, drv_message)
        ds, sys = get_ds_type(drv_message)
        do_image_action(id, ds, :snap_revert, "#{drv_message} #{id}")
    end

    def snap_flatten(id, drv_message)
        ds, sys = get_ds_type(drv_message)
        do_image_action(id, ds, :snap_flatten, "#{drv_message} #{id}")
    end

    private

    def is_available?(ds, id, action)
        if @types.include?(ds)
            return true
        else
            send_message(ACTION[action], RESULT[:failure], id,
                "Datastore driver '#{ds}' not available")
            return false
        end
    end

    def is_sys_available?(sys, id, action)
        if @sys_types.include?(sys)
            return true
        else
            send_message(ACTION[action], RESULT[:failure], id,
                "System datastore driver '#{sys}' not available")
            return false
        end
    end

    def do_image_action(id, ds, action, arguments, sys='', encode64=false)

        if !sys.empty?
            return if not is_sys_available?(sys, id, action)
            path = File.join(@local_tm_scripts_path, sys)
        else
            return if not is_available?(ds, id, action)
            path = File.join(@local_scripts_path, ds)
        end

        cmd  = File.join(path, ACTION[action].downcase)
        cmd << " " << arguments

        rc = LocalCommand.run(cmd, log_method(id))

        result, info = get_info_from_execution(rc)

        info = Base64::encode64(info).strip.delete("\n") if encode64

        send_message(ACTION[action], result, id, info)
    end

    def get_ds_type(drv_message)
        message = Base64.decode64(drv_message)
        xml_doc = REXML::Document.new(message)

        dstxt = dssys = ''

        dsxml = xml_doc.root.elements['/DS_DRIVER_ACTION_DATA/DATASTORE/DS_MAD']
        dstxt = dsxml.text if dsxml

        dsxml = xml_doc.root.elements['/DS_DRIVER_ACTION_DATA/DATASTORE/TYPE']

        if dsxml && dsxml.text == '1'
          dsxml = xml_doc.root.elements['/DS_DRIVER_ACTION_DATA/DATASTORE/TM_MAD']
          dssys = dsxml.text if dsxml
        end

        return dstxt, dssys
    end
end

################################################################################
################################################################################
# DatastoreDriver Main program
################################################################################
################################################################################

opts = GetoptLong.new(
    [ '--threads',         '-t', GetoptLong::OPTIONAL_ARGUMENT ],
    [ '--ds-types',        '-d', GetoptLong::OPTIONAL_ARGUMENT ],
    [ '--system-ds-types', '-s', GetoptLong::OPTIONAL_ARGUMENT ],
    [ '--timeout',         '-w', GetoptLong::OPTIONAL_ARGUMENT ]
)

ds_type     = nil
sys_ds_type = nil
threads     = 15
timeout     = nil

begin
    opts.each do |opt, arg|
        case opt
            when '--threads'
                threads = arg.to_i
            when '--ds-types'
                ds_type = arg.split(',').map {|a| a.strip }
            when '--system-ds-types'
                sys_ds_type = arg.split(',').map {|a| a.strip }
            when '--timeout'
                timeout = arg.to_i
        end
    end
rescue Exception => e
    exit(-1)
end

ds_driver = DatastoreDriver.new(ds_type, sys_ds_type,
                                :concurrency    => threads,
                                :timeout        => timeout)
ds_driver.start_driver
