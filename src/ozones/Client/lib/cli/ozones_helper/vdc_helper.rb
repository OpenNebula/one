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

require 'cli/ozones_helper'
require 'cli/one_helper'

class VDCHelper < OZonesHelper::OZHelper
    def initialize(kind, user=nil, pass=nil, endpoint_str=nil,
                       timeout=nil, debug_flag=true)
        @vdc_str = kind
        super(user, pass, endpoint_str, timeout, debug_flag)
    end

    def create_resource(template)
      super(@vdc_str,template)
    end

    def list_pool(options)
        super(@vdc_str,options)
    end

    def show_resource(id, options)
        super(@vdc_str,id, options)
    end
    
    def delete_resource(id, options)
        super(@vdc_str,id, options)
    end

    def addhost(id, host_array, options)
        rc = @client.get_resource(@vdc_str, id)
    
        if OZonesClient::is_error?(rc) 
            return [-1, rc.message] 
        else
            vdc = OZonesClient::parse_json(rc.body, @vdc_str.upcase)
        end

        hosts = vdc['hosts'].split(',').collect!{|x| x.to_i}
        host_array.concat(hosts).uniq!

        new_host = host_array.join(',')
        template = "ID=#{id}\nHOSTS=#{new_host}\n"
       
        rc = @client.put_resource(@vdc_str, id, template) 

        if OZonesClient::is_error?(rc) 
            return [-1, rc.message] 
        end

        [0, ""]
    end
    
    def delhost(id, host_array, options)
        rc = @client.get_resource(@vdc_str, id)
    
        if OZonesClient::is_error?(rc) 
            return [-1, rc.message] 
        else
            vdc = OZonesClient::parse_json(rc.body, @vdc_str.upcase)
        end

        hosts = vdc['hosts'].split(',').collect!{|x| x.to_i}

        new_host = (hosts - host_array).join(',')
        template = "ID=#{id}\nHOSTS=#{new_host}\n"
       
        rc = @client.put_resource(@vdc_str, id, template) 

        if OZonesClient::is_error?(rc) 
            return [-1, rc.message] 
        end

        [0, ""]
    end

    private

    def format_resource(vdc, options)
        str_h1="%-60s"
        str="%-10s: %-20s"
        
        CLIHelper.print_header(str_h1 % ["VDC #{vdc['name']} INFORMATION"])
    
        puts str % ["ID ",       vdc['id'].to_s]
        puts str % ["NAME ",     vdc['name'].to_s]
        puts str % ["GROUP_ID ", vdc['group_id'].to_s]
        puts str % ["ZONEID ",   vdc['zones_id'].to_s]
        puts str % ["VDCADMIN ", vdc['vdcadminname'].to_s]        
        puts str % ["HOST IDs ", vdc['hosts'].to_s]        
        puts
        
        return 0
    end

    def format_pool(pool, options)    
        st=CLIHelper::ShowTable.new(nil) do
            column :ID, "Identifier for VDC", :size=>4 do |d,e|
                d["id"]
            end

            column :NAME, "Name of the VDC", :right, :size=>15 do |d,e|
                d["name"]
            end

            column :ZONEID, "Id of the Zone where it belongs", 
                             :right, :size=>40 do |d,e|
                d["zones_id"]
            end
        
            default :ID, :NAME, :ZONEID
        end      
        st.show(pool[@vdc_str.upcase], options)
        
        return 0
    end
end
