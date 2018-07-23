# ---------------------------------------------------------------------------- #
# Copyright 2002-2018, OpenNebula Project, OpenNebula Systems                  #
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
   BIN_LOCATION = '/usr/bin'     unless defined?(BIN_LOCATION)
   LIB_LOCATION = '/usr/lib/one' unless defined?(LIB_LOCATION)
   ETC_LOCATION = '/etc/one/'    unless defined?(ETC_LOCATION)
   VAR_LOCATION = '/var/lib/one' unless defined?(VAR_LOCATION)
else
   BIN_LOCATION = ONE_LOCATION + '/bin'  unless defined?(BIN_LOCATION)
   LIB_LOCATION = ONE_LOCATION + '/lib'  unless defined?(LIB_LOCATION)
   ETC_LOCATION = ONE_LOCATION + '/etc/' unless defined?(ETC_LOCATION)
   VAR_LOCATION = ONE_LOCATION + '/var/' unless defined?(VAR_LOCATION)
end

ENV['LANG'] = 'C'

$LOAD_PATH << LIB_LOCATION + '/ruby/vendors/rbvmomi/lib'
$LOAD_PATH << LIB_LOCATION + '/ruby'
$LOAD_PATH << LIB_LOCATION + '/ruby/vcenter_driver'

require 'rbvmomi'
require 'yaml'
require 'opennebula'
require 'base64'
require 'openssl'

# ---------------------------------------------------------------------------- #
# vCenter Library                                                              #
# ---------------------------------------------------------------------------- #

require 'vcenter_importer.rb'
require 'memoize'
require 'vi_client'
require 'vi_helper'
require 'datacenter'
require 'host'
require 'datastore'
require 'virtual_machine'
require 'network'
require 'file_helper'
require 'importer'

CHECK_REFS = true
# ---------------------------------------------------------------------------- #
# Helper functions                                                             #
# ---------------------------------------------------------------------------- #

def error_message(message)
    error_str = "ERROR MESSAGE --8<------\n"
    error_str << message
    error_str << "\nERROR MESSAGE ------>8--"

    error_str
end

def check_valid(parameter, label)
    if parameter.nil? || parameter.empty?
        STDERR.puts error_message("The parameter '#{label}' is required for this action.")
        exit(-1)
    end
end

def check_item(item, target_class)
    begin
        item.name if CHECK_REFS
        if target_class
            if !item.instance_of?(target_class)
                raise "Expecting type 'RbVmomi::VIM::#{target_class}'. " \
                        "Got '#{item.class} instead."
            end
        end
    rescue RbVmomi::Fault => e
        raise "Reference \"#{item._ref}\" error [#{e.message}]. The reference does not exist"
    end
end
