# -------------------------------------------------------------------------- #
# Copyright 2002-2018, OpenNebula Project, OpenNebula Systems                #
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
        feature_2253()

        return true
    end

    private

    def feature_2253()
        @db.transaction do
            # update virtual networks
            @db.fetch("SELECT * FROM network_pool") do |row|
                doc = Nokogiri::XML(row[:body], nil, NOKOGIRI_ENCODING) {|c|
                    c.default_xml.noblanks
                }

                next unless doc.root.at_xpath("BRIDGE_TYPE").to_s.empty?

                vn_mad = doc.root.at_xpath("/VNET/VN_MAD").text

                bridge_type = doc.create_element("BRIDGE_TYPE")
                bridge_type.add_child(bridge_type_by_vn_mad(vn_mad))

                doc.root.at_xpath("/VNET").add_child(bridge_type)

                @db.run("UPDATE network_pool SET body = '#{doc.root.to_s}' "\
                        "where oid = #{row[:oid]}")
            end
        end

        @db.transaction do
            # updates VM's nics
            @db.fetch("SELECT * FROM vm_pool") do |row|
                doc = Nokogiri::XML(row[:body], nil, NOKOGIRI_ENCODING) {|c|
                    c.default_xml.noblanks
                }

                next if doc.root.at_xpath("TEMPLATE/NIC").to_s.empty?

                doc.root.xpath("//NIC").map do |nic|
                    next unless nic.xpath("BRIDGE_TYPE").to_s.empty?

                    vn_mad = nic.xpath("VN_MAD").text

                    bridge_type = doc.create_element("BRIDGE_TYPE")
                    bridge_type.add_child(bridge_type_by_vn_mad(vn_mad))
                    nic.add_child(bridge_type)
                end

                @db.run("UPDATE vm_pool SET body = '#{doc.root.to_s}' where" \
                        "oid = #{row[:oid]}")
            end
        end
    end

    def bridge_type_by_vn_mad(vn_mad)
        #TODO CASE
        if vn_mad == "vcenter"
            return "vcenter_port_groups"
        elsif vn_mad == "ovswitch" || vn_mad == "ovswitch_vxlan"
            return "openvswitch"
        else
            return "linux"
        end
    end

end
