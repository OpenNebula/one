# ---------------------------------------------------------------------------- #
# Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                  #
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

ONE_LOCATION = ENV['ONE_LOCATION'] unless defined?(ONE_LOCATION)

if !ONE_LOCATION
    BIN_LOCATION  = '/usr/bin'     unless defined?(BIN_LOCATION)
    LIB_LOCATION  = '/usr/lib/one' unless defined?(LIB_LOCATION)
    ETC_LOCATION  = '/etc/one/'    unless defined?(ETC_LOCATION)
    VAR_LOCATION  = '/var/lib/one' unless defined?(VAR_LOCATION)
    GEMS_LOCATION = '/usr/share/one/gems' unless defined?(GEMS_LOCATION)
else
    BIN_LOCATION  = ONE_LOCATION + '/bin' unless defined?(BIN_LOCATION)
    LIB_LOCATION  = ONE_LOCATION + '/lib'  unless defined?(LIB_LOCATION)
    ETC_LOCATION  = ONE_LOCATION + '/etc/' unless defined?(ETC_LOCATION)
    VAR_LOCATION  = ONE_LOCATION + '/var/' unless defined?(VAR_LOCATION)
    GEMS_LOCATION = ONE_LOCATION + '/share/gems' unless defined?(GEMS_LOCATION)
end

ENV['LANG'] = 'C'

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

$LOAD_PATH << LIB_LOCATION + '/ruby/vendors/rbvmomi/lib'
$LOAD_PATH << LIB_LOCATION + '/ruby'
$LOAD_PATH << LIB_LOCATION + '/ruby/vcenter_driver'

# Holds vCenter configuration parameters
class VCenterConf < Hash

    DEFAULT_CONFIGURATION = {
        :delete_images => false,
        :vm_poweron_wait_default => 300,
        :debug_information => false,
        :retries => 3,
        :retry_interval => 1
    }

    def initialize
        replace(DEFAULT_CONFIGURATION)
        begin
            vcenterrc_path = "#{VAR_LOCATION}/remotes/etc/vmm/vcenter/vcenterrc"
            merge!(YAML.load_file(vcenterrc_path))
        rescue StandardError => e
            STDERR.puts "Couldn't load vcenterrc. Reason #{e.message}."
        end

        super
    end

end

require 'rbvmomi'
require 'yaml'
require 'opennebula'
require 'base64'
require 'openssl'
require 'digest'
require 'resolv'

# ---------------------------------------------------------------------------- #
# vCenter Library                                                              #
# ---------------------------------------------------------------------------- #

require 'vcenter_importer'
require 'memoize'
require 'vi_client'
begin
    require 'rest_client'
    REST_CLIENT=true
rescue LoadError
    REST_CLIENT=false
end
require 'vi_helper'
require 'datacenter'
require 'host'
require 'datastore'
require 'vm_template'
require 'virtual_machine'
require 'network'
require 'file_helper'
require 'vm_folder'
require 'vmm_importer'
require 'vm_device'
require 'vm_disk'
require 'vm_nic'
require 'vm_helper'

CHECK_REFS = true

module VCenterDriver

    CONFIG = VCenterConf.new

end

# ---------------------------------------------------------------------------- #
# Helper functions                                                             #
# ---------------------------------------------------------------------------- #

def check_valid(parameter, label)
    return unless parameter.nil? || parameter.empty?

    STDERR.puts "The parameter '#{label}' is required for this action."
    exit(-1)
end

def check_item(item, target_class)
    item.name if CHECK_REFS
    if target_class && !item.instance_of?(target_class)
        raise "Expecting type 'RbVmomi::VIM::#{target_class}'. " \
              "Got '#{item.class} instead."
    end
rescue RbVmomi::Fault => e
    raise "Reference \"#{item._ref}\" error [#{e.message}]. \
           The reference does not exist"
end
