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

require 'OpenNebula'

# This class retrieves and caches vms and its consuption grouped
# by users. 'update_user' method should be called to fill data for
# a user before any calculation is made
class OneUsage
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
            :proc_total => 'TEMPLATE/SIZE'
        }
    }

    RESOURCES = ["VM", "IMAGE"]

    def initialize()
        @client = OpenNebula::Client.new
        @usage =  Hash.new
    end

    def total(user_id, resource=nil, force=false)
        usage = Hash.new

        if force
            resources = [resource] if RESOURCES.include?(resource)

            resources.each{ |res|
                pool = get_pool(res, user_id)

                base_xpath = "/#{res}_POOL/#{resource}"
                OneUsage.const_get("#{res}_USAGE".to_sym).each { |key, params|
                    usage[key] ||= 0
                    pool.each_xpath("#{base_xpath}/#{params[:xpath]}") { |elem|
                        usage[key] += params[:count] ? 1 : elem.to_i
                    }
                }

                @usage[:user_id] ||= Hash.new
                @usage[:user_id].merge!(usage)
            }
        else
            usage = get_usage(user_id)
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

    private

    def get_usage(user_id)
        usage = @usage[:user_id]

        unless usage
            usage = Hash.new

            keys = VM_USAGE.keys + IMAGE_USAGE.keys
            keys.each { |key|
                usage[key] = 0
            }

            @usage[:user_id] = usage
        end

        usage
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
