# -------------------------------------------------------------------------- #
# Copyright 2002-2012, OpenNebula Project Leads (OpenNebula.org)             #
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

    def create_resource(template, options)
        tmpl_str = File.read(template)

        if options[:force]
            tmpl_str << "FORCE=YES\n"
        end

        rc = @client.post_resource_str(@vdc_str, tmpl_str)

        if Zona::is_error?(rc)
            [-1, rc.message]
        else
            id = get_id(rc)
            [0, "ID: #{id}"]
        end
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

        if Zona::is_error?(rc)
            return [-1, rc.message]
        else
            vdc = Zona::OZonesJSON.parse_json(rc.body, @vdc_str.upcase)
        end

        hosts = vdc[:HOSTS].split(',').collect!{|x| x.to_i}
        host_array.concat(hosts).uniq!

        new_host = host_array.join(',')
        template = "ID=#{id}\nHOSTS=#{new_host}\n"

        if options[:force]
            template << "FORCE=YES\n"
        end

        rc = @client.put_resource_str(@vdc_str, id, template)

        if Zona::is_error?(rc)
            return [-1, rc.message]
        end

        [0, ""]
    end

    def delhost(id, host_array, options)
        rc = @client.get_resource(@vdc_str, id)

        if Zona::is_error?(rc)
            return [-1, rc.message]
        else
            vdc = Zona::OZonesJSON.parse_json(rc.body, @vdc_str.upcase)
        end

        hosts = vdc[:HOSTS].split(',').collect!{|x| x.to_i}

        new_host = (hosts - host_array).join(',')
        template = "ID=#{id}\nHOSTS=#{new_host}\n"

        rc = @client.put_resource_str(@vdc_str, id, template)

        if Zona.is_error?(rc)
            return [-1, rc.message]
        end

        [0, ""]
    end

    private

    def format_resource(vdc, options)
        str_h1="%-60s"
        str="%-10s: %-20s"

        CLIHelper.print_header(str_h1 % ["VDC #{vdc['name']} INFORMATION"])

        puts str % ["ID ",       vdc[:ID].to_s]
        puts str % ["NAME ",     vdc[:NAME].to_s]
        puts str % ["GROUP_ID ", vdc[:GROUP_ID].to_s]
        puts str % ["ZONEID ",   vdc[:ZONES_ID].to_s]
        puts str % ["VDCADMIN ", vdc[:VDCADMINNAME].to_s]
        puts str % ["HOST IDs ", vdc[:HOSTS].to_s]
        puts

        return 0
    end

    def format_pool(pool, options)
        st=CLIHelper::ShowTable.new(nil) do
            column :ID, "Identifier for VDC", :size=>4 do |d,e|
                d[:ID]
            end

            column :NAME, "Name of the VDC", :right, :size=>15 do |d,e|
                d[:NAME]
            end

            column :ZONEID, "Id of the Zone where it belongs",
            :right, :size=>40 do |d,e|
                d[:ZONES_ID]
            end

            default :ID, :NAME, :ZONEID
        end
        st.show(pool[:VDC], options)

        return 0
    end
end
