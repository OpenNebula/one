require 'set'
require 'base64'
require 'zlib'
require 'pathname'
require 'yaml'
require 'opennebula'

$: << File.dirname(__FILE__)

include OpenNebula

module Migrator
    def db_version
        "5.6.0"
    end

    def one_version
        "OpenNebula 5.6.0"
    end

    def up
        return true
    end

    private

    def feature_2253()
        @db.run "DROP TABLE IF EXISTS old_network_pool;"
        @db.run "ALTER TABLE network_pool RENAME TO old_network_pool;"

        @db.transaction do
            @db.fetch("SELECT * FROM old_network_pool") do |row|
                doc = Nokogiri::XML(row[:body],nil,NOKOGIRI_ENCODING) { |c|
                    c.default_xml.noblanks
                }

                if doc.root.at_xpath("BRIDGE_TYPE").to_s == ""
                    vn_mad = doc.root.at_xpath("/VNET/VN_MAD").text

                    bridge_type = doc.create_element("BRIDGE_TYPE")
                    bridge_type.add_child(bridge_type_by_vn_mad(vn_mad))
                    doc.root.at_xpath("/VNET").add_child(bridge_type)

                    row[:body] = doc.root.to_s
                    @db[:network_pool].insert(row)
                end
            end
        end

        @db.run "DROP TABLE old_vnet_pool;"
    end

    def bridge_type_by_vn_mad(vn_mad)
        if vn_mad == "vcenter"
            return "vcenter_port_groups"
        elsif vn_mad == "ovswitch" || vn_mad == "ovswitch_vxlan"
            return "openvswitch"
        else
            return "linux"
        end
    end
end
