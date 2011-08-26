# -------------------------------------------------------------------------- #
# Copyright 2002-2011, OpenNebula Project Leads (OpenNebula.org)             #
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
require 'sequel'
require 'base64'

# Quota functionality for auth driver. Stores in database limits for each
# user and using OneUsage is able to retrieve resource usage from
# OpenNebula daemon and check if it is below limits
class Quota
    attr_accessor :defaults

    TABLE_NAME = :quotas

    DB_QUOTA_SCHEMA = {
        :cpu     => Float,
        :memory  => Integer,
        :num_vms => Integer,
        :storage => Integer
    }

    CONF = {
        :db => "sqlite:///tmp/onequota.db",
        :defaults => {
            :cpu     => nil,
            :memory  => nil,
            :num_vms => nil,
            :storage => nil
        }
    }

    # 'db' is a Sequel database where to store user limits and client
    # is OpenNebula::Client used to connect to OpenNebula daemon
    def initialize(conf={})
        # TBD merge with the conf file
        @conf=CONF

        @defaults=@conf[:defaults]

        @db=Sequel.connect(@conf[:db])

        create_table
        @table=@db[TABLE_NAME]

        @one_usage=OneUsage.new
    end

    ###########################################################################
    # DB handling
    ###########################################################################

    # Creates database quota table if it does not exist
    def create_table
        @db.create_table?(TABLE_NAME) do
            Integer     :uid

            DB_QUOTA_SCHEMA.each { |key,value|
                column key, value
            }

            primary_key :uid
            index       :uid
        end
    end

    # Adds new user limits
    def set(uid, quota={})
        data=quota.delete_if{|key,value| !DB_QUOTA_SCHEMA.keys.include?(key)}

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
            @conf[:defaults]
        end
    end


    ###########################################################################
    # Authorization
    ###########################################################################

    def check_request(user_id, request)
        obj, template_or_id, op, owner, pub, acl_eval = request.split(':')

        if acl_eval == 0
            return "ACL evaluation denied"
        end

        # Check if this op needs to check the quota
        return false unless with_quota?(obj, op)

        # If the object is a template the info should be retrived from the
        # VM pool.
        obj = "VM" if obj == "TEMPLATE"
        template = Base64::decode64(template_or_id)

        check_quotas(user_id.to_i, obj, template)
    end

    def check_quotas(user_id, obj, template)
        info  = @one_usage.get_info(obj, template)
        total = @one_usage.total(obj, user_id)
        quota = get(user_id)

        msg = ""
        info.each { |quota_name, quota_requested|
            spent = total[quota_name].to_i + quota_requested.to_i
            if spent > quota[quota_name].to_i
                msg << " #{quota_name.to_s.upcase} quota exceeded "
                msg << "(Quota: #{quota[quota_name].to_i}, "
                msg << "Used: #{spent.to_i}, "
                msg << "Asked: #{quota_requested.to_i})."
            end
        }

        if msg==""
            return false
        else
            return msg.strip
        end
    end

    def with_quota?(obj, op)
        return (obj == "VM"       && op == "CREATE") ||
               (obj == "IMAGE"    && op == "CREATE") ||
               (obj == "TEMPLATE" && op == "INSTANTIATE")
    end
end

