# -------------------------------------------------------------------------- #
# Copyright 2002-2010, OpenNebula Project Leads (OpenNebula.org)             #
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

require 'one_usage'

# Quota functionality for auth driver. Stores in database limits for each
# user and using OneUsage is able to retrieve resource usage from
# OpenNebula daemon and check if it is below limits
class Quota
    attr_accessor :defaults
    
    TABLE_NAME=:quotas
    
    # 'db' is a Sequel database where to store user limits and client
    # is OpenNebula::Client used to connect to OpenNebula daemon
    def initialize(db, client, conf={})
        @db=db
        @client=client
        @conf={
            :defaults => {
                :cpu => nil,
                :memory => nil
            }
        }.merge(conf)
        
        @defaults=@conf[:defaults]
        
        @usage=OneUsage.new(@client)
        
        create_table
        @table=@db[TABLE_NAME]
    end
    
    # Creates database quota table if it does not exist
    def create_table
        @db.create_table?(TABLE_NAME) do
            primary_key :id
            Integer     :uid
            Float       :cpu
            Integer     :memory
            Integer     :num_vms
            index       :uid
        end
    end
    
    # Adds new user limits
    def set(uid, cpu, memory, num_vms)
        data={
            :cpu        => cpu,
            :memory     => memory,
            :num_vms    => num_vms
        }

        quotas=@table.filter(:uid => uid)
        
        if quotas.first
            quotas.update(data)
        else
            @table.insert(data.merge!(:uid => uid))
        end
    end
    
    # Gets user limits
    def get(uid)
        limit=@table.filter(:uid => uid).first
        if limit
            limit
        else
            @defaults
        end
    end
    
    # Checks if the user is below resource limits. If new_vm is defined
    # checks if its requirements fit in limits
    def check(user, new_vm=nil)
        usage=@usage.total(user)
        user_quota=get(user)
        if new_vm
            usage.cpu+=new_vm.cpu
            usage.memory+=new_vm.memory
        end
        
        (!user_quota[:cpu] || usage.cpu<=user_quota[:cpu]) &&
            (!user_quota[:memory] || usage.memory<=user_quota[:memory])
    end
    
    # Updates user resource consuption
    def update(user)
        @usage.update_user(user)
    end
    
    # Get cache for the user
    def get_user(user)
        @usage.vms(user)
    end
end

