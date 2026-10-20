#!/usr/bin/env ruby

# -------------------------------------------------------------------------- #
# Copyright 2002-2025, OpenNebula Project, OpenNebula Systems                #
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


# PENDING: ADDING RSYNC USER PUBLIC KEY TO ALL HOSTS'S ONEADMIN USER. FOR NOW THE "ONEADMIN" FE USER IS THE RSYNC USER

require 'opennebula'

ENDPOINT = "http://localhost:2633/RPC2"

# Check if the script is run by 'oneadmin'
if ENV['USER'] != 'oneadmin'
  puts "This script must be run by the user 'oneadmin'."
  exit 1
end

puts "Running as oneadmin..."

# Check if passwordless SSH is already set up
def passwordless_ssh?
  result = system("ssh -o BatchMode=yes -o ConnectTimeout=5 oneadmin@localhost echo success 2>/dev/null")
  result
end

if passwordless_ssh?
  puts "Passwordless SSH access is already configured."
else
  puts "Passwordless SSH access is not configured. Setting it up..."


  # Generate SSH key if it doesn't exist
  ssh_key = File.expand_path("~/.ssh/id_rsa")
  unless File.exist?(ssh_key)
    puts "Generating SSH key..."
    system("ssh-keygen -t rsa -b 2048 -f #{ssh_key} -N ''")
  end

  # Add public key to authorized_keys
  authorized_keys = File.expand_path("~/.ssh/authorized_keys")
  public_key = File.read("#{ssh_key}.pub")

  unless File.exist?(authorized_keys)
    File.write(authorized_keys, "")
    system("chmod 600 #{authorized_keys}")
  end

  if File.readlines(authorized_keys).grep(/#{Regexp.escape(public_key.strip)}/).empty?
    File.open(authorized_keys, 'a') { |f| f.puts(public_key) }
    puts "Public key added to authorized_keys."
  else
    puts "Public key is already in authorized_keys."
  end

  puts "Passwordless SSH access configured."
end



client = OpenNebula::Client.new(nil, ENDPOINT)


def find_backup_ds(client)
  ds_pool = OpenNebula::DatastorePool.new(client)
  rc = ds_pool.info

  if OpenNebula.is_error?(rc)
    puts "Error: #{rc.message}"
    exit 1
  end
  # puts ds_pool.to_xml
  ds_hash = ds_pool.to_hash
  ds_list = ds_hash["DATASTORE_POOL"]["DATASTORE"]

  ds_list.each do |ds|
    if ds.dig("TEMPLATE", "VEEAM_DS") == "YES"
      return ds['ID'].to_i
    end
  end
  return nil
end

if find_backup_ds(client) != nil
  puts "Veeam Datastore already present, terminating..."
  exit 0
end

# Create datastore template
datastore_template = <<-TEMPLATE
NAME="Veeam_DS"
DS_MAD="rsync"
TM_MAD="-"
TYPE="BACKUP_DS"
VEEAM_DS="YES"
RESTIC_COMPRESSION="-"
RESTRICTED_DIRS="/"
RSYNC_HOST="localhost"
RSYNC_USER="oneadmin"
SAFE_DIRS="/var/tmp"
TEMPLATE

# Allocate new datastore
datastore = OpenNebula::Datastore.new(OpenNebula::Datastore.build_xml, client)
rc = datastore.allocate(datastore_template, -1)

if OpenNebula.is_error?(rc)
  puts "Error creating datastore: #{rc.message}"
  exit 1
else
  puts "Datastore 'Veeam_DS' created successfully."
end


