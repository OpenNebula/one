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
            :proc_total => lambda {|resource| resource['TEMPLATE']['CPU']}
        },
        :memory => {
            :proc_info  => lambda {|template| template['MEMORY']},
            :proc_total => lambda {|resource| resource['TEMPLATE']['MEMORY']}
        },
        :num_vms => {
            :proc_info  => lambda {|template| 1 },
            :proc_total => lambda {|resource| 1 }
        }
    }

    IMAGE_USAGE = {
        :storage => {
            :proc_info  => lambda {|template| File.size(template['PATH']) },
            :proc_total => lambda {|resource| File.size(resource['TEMPLATE']['SOURCE']) }
        }
    }

    def initialize()
        @client = OpenNebula::Client.new

        @usage =  Hash.new

        keys = VM_USAGE.keys + IMAGE_USAGE.keys
        keys.each { |key|
            @usage[key] = 0
        }

    end


    def total(resource, user_id)
        pool_array = pool_to_array(resource, user_id)

        usage = Hash.new
        pool_array.each { |elem|
            OneUsage.const_get("#{resource}_USAGE".to_sym).each { |key, params|
                usage[key] ||= 0
                usage[key] += params[:proc_total].call(elem).to_i
            }
        }

        usage
    end

    # Retrieve the useful information of the template for the specified
    # kind of resource
    def get_info(resource, xml_template)
        template = OpenNebula::XMLElement.new
        template.initialize_xml(xml_template, 'TEMPLATE')

        info = Hash.new

        self.class.const_get("#{resource}_USAGE").each { |key, params|
            info[key] = params[:proc_info].call(template).to_i
        }

        info
    end

    private

    # Returns a an Array than contains the elements of the resource Pool
    def pool_to_array(resource, user_id)
        pool = case resource
        when "VM"    then OpenNebula::VirtualMachinePool.new(@client, user_id)
        when "IMAGE" then OpenNebula::ImagePool.new(@client, user_id)
        end

        rc = pool.info

        phash = pool.to_hash

        if phash["#{resource}_POOL"] &&
                phash["#{resource}_POOL"]["#{resource}"]
            if phash["#{resource}_POOL"]["#{resource}"].instance_of?(Array)
                parray = phash["#{resource}_POOL"]["#{resource}"]
            else
                parray = [phash["#{resource}_POOL"]["#{resource}"]]
            end
        else
            parray = Array.new
        end

        return parray
    end
end
