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

require 'sequel'
require 'base64'
require 'yaml'

class Quota
    ###########################################################################
    # Constants with paths to relevant files and defaults
    ###########################################################################
    ONE_LOCATION=ENV["ONE_LOCATION"]

    if !ONE_LOCATION
        VAR_LOCATION = "/var/lib/one"
        ETC_LOCATION = "/etc/one"
    else
        VAR_LOCATION = ONE_LOCATION + "/var"
        ETC_LOCATION = ONE_LOCATION + "/etc"
    end

    CONF_FILE = ETC_LOCATION + "/auth/quota.conf"

    CONF = {
        :db => "sqlite://#{VAR_LOCATION}/onequota.db",
        :defaults => {
            :cpu     => nil,
            :memory  => nil,
            :num_vms => nil,
            :storage => nil
        }
    }

    ###########################################################################
    # Schema for the USAGE and QUOTA tables
    ###########################################################################
    DB_QUOTA_SCHEMA = {
        :cpu     => Float,
        :memory  => Integer,
        :num_vms => Integer,
        :storage => Integer
    }

    QUOTA_TABLE = :quotas
    USAGE_TABLE = :usage

    ###########################################################################
    # Usage params to calculate each quota
    ###########################################################################
    VM_USAGE = {
        :cpu => {
            :proc_info  => lambda {|template| template['CPU']},
            :xpath => 'TEMPLATE/CPU'
        },
        :memory => {
            :proc_info  => lambda {|template| template['MEMORY']},
            :xpath => 'TEMPLATE/MEMORY'
        },
        :num_vms => {
            :proc_info  => lambda {|template| 1 },
            :xpath => 'ID',
            :count => true
        }
    }

    IMAGE_USAGE = {
        :storage => {
            :proc_info  => lambda {|template| File.size(template['PATH']) },
            :xpath => 'SIZE'
        }
    }

    RESOURCES = ["VM", "IMAGE"]

    ###########################################################################
    # DB handling
    ###########################################################################
    def initialize
        conf = YAML.load_file(CONF_FILE)
        @conf=CONF.merge(conf) {|key,h1,h2|
            if h1.instance_of?(Hash) && h2.instance_of?(Hash)
                h1.merge(h2)
            else
                if h2
                    h2
                else
                    h1
                end
            end
        }

        @client = OpenNebula::Client.new

        @db=Sequel.connect(@conf[:db])

        create_table(QUOTA_TABLE)
        create_table(USAGE_TABLE)
    end

    # Creates database quota table if it does not exist
    def create_table(table)
        @db.create_table?(table) do
            Integer     :uid

            DB_QUOTA_SCHEMA.each { |key,value|
                column key, value
            }

            primary_key :uid
            index       :uid
        end
    end

    # Adds new user limits
    def set(table, uid, quota={})
        data=quota.delete_if{|key,value| !DB_QUOTA_SCHEMA.keys.include?(key)}

        quotas=@db[table].filter(:uid => uid)

        if quotas.first
            quotas.update(data)
        else
            @db[table].insert(data.merge!(:uid => uid))
        end
    end

    # Gets user limits
    def get(table, uid=nil)
        if uid
            @db[table].filter(:uid => uid).first
        else
            @db[table].all
        end
    end

    # Delete user limits
    def delete(table, uid)
        quotas=@db[table].filter(:uid => uid)

        if quotas.first
            quotas.delete
        end
    end

    ###########################################################################
    # Quota Client
    ###########################################################################
    def set_quota(uid, quota={})
        set(QUOTA_TABLE, uid, quota)
    end

    def get_quota(uid=nil)
        limit = get(QUOTA_TABLE, uid)
        limit ? limit : @conf[:defaults].merge!(:uid => uid)
    end

    def delete_quota(uid)
        delete(QUOTA_TABLE, uid)
    end

    ###########################################################################
    # Authorization
    ###########################################################################
    def authorize(user_id, request)
        obj, template_or_id, op, owner, pub, acl_eval = request.split(':')

        if acl_eval.to_i == 0
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
        info  = get_resources(obj, template)
        total = get_usage(user_id, obj, true)
        quota = get_quota(user_id)

        msg = ""
        separator = ""
        info.each { |qname, quota_requested|
            unless quota[qname]
                next
            end

            used = send(DB_QUOTA_SCHEMA[qname].name.to_sym, total[qname])
            request = send(DB_QUOTA_SCHEMA[qname].name.to_sym, quota_requested)
            limit = send(DB_QUOTA_SCHEMA[qname].name.to_sym, quota[qname])
            spent = used + request

            if spent > limit
                msg << separator
                msg << " #{qname.to_s.upcase} quota exceeded "
                msg << "(Quota: #{limit}, "
                msg << "Used: #{used}, "
                msg << "Requested: #{request})"

                separator = ";"
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

    ###########################################################################
    # Usage
    ###########################################################################
    def get_usage(user_id, resource=nil, force=false)
        if force
            if RESOURCES.include?(resource)
                resources = [resource]
            else
                resources = RESOURCES
            end

            usage = Hash.new

            resources.each{ |res|
                pool = get_pool(res, user_id)
                base_xpath = "/#{res}_POOL/#{resource}"
                Quota.const_get("#{res}_USAGE".to_sym).each { |key, params|
                    pool.each_xpath("#{base_xpath}/#{params[:xpath]}") { |elem|
                        if elem
                            usage[key] ||= 0
                            if params[:count]
                                usage[key] += 1
                            else
                                usage[key] += send(DB_QUOTA_SCHEMA[key].name.to_sym, elem)
                            end
                        end
                    }
                }

                set(USAGE_TABLE, user_id, usage) unless usage.empty?
                usage.merge!(:uid => user_id)
            }
        else
            usage = get(USAGE_TABLE, user_id)
            usage ||= {:uid => user_id}
        end

        usage
    end

    # Retrieve the useful information of the template for the specified
    # kind of resource
    def get_resources(resource, xml_template)
        template = OpenNebula::XMLElement.new
        template.initialize_xml(xml_template, 'TEMPLATE')

        info = Hash.new

        self.class.const_get("#{resource}_USAGE").each { |key, params|
            info[key] = params[:proc_info].call(template).to_i
        }

        info
    end

    # Returns a an Array than contains the elements of the resource Pool
    def get_pool(resource, user_id)
        pool = case resource
        when "VM"    then OpenNebula::VirtualMachinePool.new(@client, user_id)
        when "IMAGE" then OpenNebula::ImagePool.new(@client, user_id)
        end

        rc = pool.info
        return pool
    end
end
