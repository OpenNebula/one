require 'cli/ozones_helper'
require 'cli/one_helper/onehost_helper'
require 'cli/one_helper/onevm_helper'
require 'cli/one_helper/oneimage_helper'
require 'cli/one_helper/onevnet_helper'
require 'cli/one_helper/onetemplate_helper'
require 'cli/one_helper/oneuser_helper'
require 'cli/one_helper/onecluster_helper'
require 'cli/one_helper/onedatastore_helper'

class ZonesHelper < OZonesHelper::OZHelper
    def initialize(kind, user=nil, pass=nil, endpoint_str=nil,
                   timeout=nil, debug_flag=true)
        @zone_str = kind
        super(user, pass, endpoint_str, timeout, debug_flag)
    end

    def create_resource(template)
        super(@zone_str,template)
    end

    def list_pool(options)
        super(@zone_str,options)
    end

    def show_resource(id, options)
        super(@zone_str,id, options)
    end

    def delete_resource(id, options)
        super(@zone_str,id, options)
    end

    private

    def format_resource(zone, options)
        str_h1="%-61s"
        str="%-15s: %-20s"

        CLIHelper.print_header(str_h1 % ["ZONE #{zone[:NAME]} INFORMATION"])

        puts str % ["ID ",        zone[:ID].to_s]
        puts str % ["NAME ",      zone[:NAME].to_s]
        puts str % ["ZONE ADMIN ",zone[:ONENAME].to_s]
        puts str % ["ZONE PASS ", zone[:ONEPASS].to_s]
        puts str % ["ENDPOINT ",  zone[:ENDPOINT].to_s]
        puts str % ["SUNSENDPOINT ",  zone[:SUNSENDPOINT].to_s]
        puts str % ["SELFENDPOINT ",  zone[:SELFENDPOINT].to_s]
        puts str % ["# VDCS ",    zone[:VDCS].size.to_s]
        puts

        if zone[:VDCS].size == 0
            return [0, zone]
        end

        CLIHelper.print_header(str_h1 % ["VDCS INFORMATION"], false)

        st=CLIHelper::ShowTable.new(nil) do
            column :ID, "Identifier for VDC", :size=>5 do |d,e|
                d[:ID]
            end

            column :NAME, "Name of the VDC", :left, :size=>15 do |d,e|
                d[:NAME]
            end

            default :ID, :NAME
        end

        st.show(zone[:VDCS], options)

        return [0, zone]
    end

    def format_pool(pool, options)
        st=CLIHelper::ShowTable.new(nil) do
            column :ID, "Identifier for Zone", :size=>4 do |d,e|
                d[:ID]
            end

            column :NAME, "Name of the Zone", :right, :size=>15 do |d,e|
                d[:NAME]
            end

            column :ENDPOINT, "Endpoint of the Zone", :right, :size=>40 do |d,e|
                d[:ENDPOINT]
            end

            default :ID, :NAME, :ENDPOINT
        end
        st.show(pool[:ZONE], options)

        return 0
    end
end
