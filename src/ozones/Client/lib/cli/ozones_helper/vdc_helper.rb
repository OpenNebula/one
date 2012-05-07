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

require 'zona'

class VDCHelper < OZonesHelper::OZHelper
    NAME_REG = /[\w\d_-]+/
    VAR_REG  = /\s*(#{NAME_REG})\s*=\s*/

    SVAR_REG = /^#{VAR_REG}([^\[]+?)(#.*)?$/

    def initialize(kind, user=nil, pass=nil, endpoint_str=nil,
                   timeout=nil, debug_flag=true)
        @vdc_str = kind
        super(user, pass, endpoint_str, timeout, debug_flag)
    end

    def create_resource(template, options)
        tmpl_str  = File.read(template)
        tmpl_hash = Hash.new

        tmpl_str.scan(SVAR_REG) do | m |
            key   = m[0].strip.upcase
            value = m[1].strip

            tmpl_hash[key] = value
        end

        hosts = tmpl_hash.delete("HOSTS")
        ds    = tmpl_hash.delete("DATASTORES")
        nets  = tmpl_hash.delete("NETWORKS")

        tmpl_hash["RESOURCES"] = { "HOSTS"      => eval("[#{hosts}]"), 
                                   "DATASTORES" => eval("[#{ds}]"),
                                   "NETWORKS"   => eval("[#{nets}]") }
        if options[:force]
            tmpl_hash["FORCE"] = "YES"
        end

        vdc = { "#{@vdc_str.upcase}" => tmpl_hash }

        rc  = @client.post_resource(@vdc_str,Zona::OZonesJSON.to_json(vdc))

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

    def add(id, options)
        vdc = Zona::VDC.new(Zona::VDC.build_json(id), @client)
        rc  = vdc.info

        return [-1, rc.message] if Zona::is_error?(rc)

        exit_code = 0
        message   = ""

        rc  = vdc.add_hosts(options[:hosts], :FORCE => options[:force])

        if Zona::is_error?(rc)
            message << "Error adding hosts to VDC:\n\t#{rc.message}\n"
            exit_code = -1
        end

        rc  = vdc.add_networks(options[:networks])

        if Zona::is_error?(rc)
            message << "Error adding networks to VDC:\n#{rc.message}\n"
            exit_code = -1
        end

        rc  = vdc.add_datastores(options[:datastores])

        if Zona::is_error?(rc)
            message << "Error adding datastores to VDC:\n\t#{rc.message}\n"
            exit_code = -1
        end

        return [exit_code, message]
    end

    def del(id, options)
        vdc = Zona::VDC.new(Zona::VDC.build_json(id), @client)
        rc  = vdc.info

        return [-1, rc.message] if Zona::is_error?(rc)

        exit_code = 0
        message   = ""

        rc  = vdc.del_hosts(options[:hosts])

        if Zona::is_error?(rc)
            message << "Error deleting to VDC:\n\t#{rc.message}\n"
            exit_code = -1
        end

        rc  = vdc.del_networks(options[:networks])

        if Zona::is_error?(rc)
            message << "Error deleting networks to VDC:\n#{rc.message}\n"
            exit_code = -1
        end

        rc  = vdc.del_datastores(options[:datastores])

        if Zona::is_error?(rc)
            message << "Error deleting datastores to VDC:\n\t#{rc.message}\n"
            exit_code = -1
        end

        return [exit_code, message]
    end

    private

    def format_resource(vdc, options)
        str_h1="%-60s"
        str="%-12s: %-20s"

        CLIHelper.print_header(str_h1 % ["VDC #{vdc['name']} INFORMATION"])

        puts str % ["ID ",          vdc[:ID].to_s]
        puts str % ["NAME ",        vdc[:NAME].to_s]
        puts str % ["ZONE_ID ",     vdc[:ZONES_ID].to_s]
        puts str % ["CLUSTER_ID ",  vdc[:CLUSTER_ID].to_s]
        puts str % ["GROUP_ID ",    vdc[:GROUP_ID].to_s]
        puts str % ["VDCADMIN ",    vdc[:VDCADMINNAME].to_s]
        puts str % ["HOSTS ",       vdc[:RESOURCES][:HOSTS].join(',')]
        puts str % ["DATASTORES ",  vdc[:RESOURCES][:DATASTORES].join(',')]
        puts str % ["NETWORKS ",    vdc[:RESOURCES][:NETWORKS].join(',')]
        puts

        return 0
    end

    def format_pool(pool, options)
        st=CLIHelper::ShowTable.new(nil) do
            column :ID, "Identifier for VDC", :size=>4 do |d,e|
                d[:ID]
            end

            column :NAME, "Name of the VDC", :left, :size=>15 do |d,e|
                d[:NAME]
            end

            column :ZONE, "Id of the Zone where it belongs",
            :right, :size=>5 do |d,e|
                d[:ZONES_ID]
            end

            column :CLUSTER, "Cluster where it belongs",
            :right, :size=>7 do |d,e|
                d[:CLUSTER_ID]
            end

            column :HOSTS, "Number of hosts in the VDC",
            :right, :size=>5 do |d,e|
                d[:RESOURCES][:HOSTS].size
            end

            column :DATASTORES, "Number of datastores in the VDC",
            :right, :size=>10 do |d,e|
                d[:RESOURCES][:DATASTORES].size
            end

            column :NETWORKS, "Number of networks in the VDC",
            :right, :size=>8 do |d,e|
                d[:RESOURCES][:NETWORKS].size
            end

            default :ID, :ZONE, :CLUSTER, :NAME, :HOSTS, :NETWORKS, :DATASTORES
        end
        st.show(pool[:VDC], options)

        return 0
    end
end
