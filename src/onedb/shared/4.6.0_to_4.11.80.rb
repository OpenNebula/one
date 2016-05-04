# -------------------------------------------------------------------------- #
# Copyright 2002-2016, OpenNebula Project, OpenNebula Systems                #
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

require 'nokogiri'

module Migrator
    def db_version
        "4.11.80"
    end

    def one_version
        "OpenNebula 4.11.80"
    end

    CLUSTER_ALL = 10
    VDC_ALL     = -10

    EMPTY_VDC = <<EOT
        <VDC>
          <ID></ID>
          <NAME></NAME>
          <GROUPS>
          </GROUPS>
          <CLUSTERS>
          </CLUSTERS>
          <HOSTS/>
          <DATASTORES/>
          <VNETS/>
          <TEMPLATE/>
        </VDC>
EOT

    def up

        init_log_time()

        ########################################################################
        # VDC
        ########################################################################

        @db.run "CREATE TABLE vdc_pool (oid INTEGER PRIMARY KEY, name VARCHAR(128), body MEDIUMTEXT, uid INTEGER, gid INTEGER, owner_u INTEGER, group_u INTEGER, other_u INTEGER, UNIQUE(name));"

        # The defat vdc in a bootstrap contains the group users and cluster ALL.
        # But this may have changed, so the default VDC is left empty and
        # a new VDC 'users' is be created with the current resource providers
        @db.run "INSERT INTO vdc_pool VALUES(0,'default','<VDC><ID>0</ID><NAME>default</NAME><GROUPS></GROUPS><CLUSTERS></CLUSTERS><HOSTS></HOSTS><DATASTORES></DATASTORES><VNETS></VNETS><TEMPLATE></TEMPLATE></VDC>',0,0,1,0,0);"

        vdc_last_oid = 99

        @db.run "ALTER TABLE group_pool RENAME TO old_group_pool;"
        @db.run "CREATE TABLE group_pool (oid INTEGER PRIMARY KEY, name VARCHAR(128), body MEDIUMTEXT, uid INTEGER, gid INTEGER, owner_u INTEGER, group_u INTEGER, other_u INTEGER, UNIQUE(name));"

        @db.transaction do
            @db.fetch("SELECT * FROM old_group_pool") do |row|
                vdc_doc = Nokogiri::XML(EMPTY_VDC,nil,NOKOGIRI_ENCODING){|c| c.default_xml.noblanks}

                doc = Nokogiri::XML(row[:body],nil,NOKOGIRI_ENCODING){|c| c.default_xml.noblanks}

                ["GROUP_ADMIN_VIEWS", "SUNSTONE_VIEWS", "DEFAULT_VIEW"].each do |elem_name|
                    elem = doc.at_xpath("/GROUP/TEMPLATE/#{elem_name}")

                    if (!elem.nil?)
                        elem.remove

                        newtext = (elem.text.split(",").map { |s|
                            s.strip.
                                gsub(/^vcenter$/, "admin_vcenter").
                                gsub(/^vdcadmin$/, "groupadmin")
                        }).join(",")

                        # The cleaner doc.create_cdata(txt) is not supported in
                        # old versions of nokogiri
                        doc.at_xpath("/GROUP/TEMPLATE").add_child(
                            doc.create_element(elem_name)).
                            add_child(Nokogiri::XML::CDATA.new(doc, newtext))
                    end
                end

                admin_v_elem = doc.at_xpath("/GROUP/TEMPLATE/GROUP_ADMIN_VIEWS")

                if (!admin_v_elem.nil?)
                    aux_e = doc.at_xpath("/GROUP/TEMPLATE/GROUP_ADMIN_DEFAULT_VIEW")
                    aux_e.remove if !aux_e.nil?

                    doc.at_xpath("/GROUP/TEMPLATE").add_child(
                        doc.create_element("GROUP_ADMIN_DEFAULT_VIEW")).
                        add_child(Nokogiri::XML::CDATA.new(
                            doc,
                            admin_v_elem.text))
                end

                admins_elem = doc.root.add_child( doc.create_element("ADMINS") )

                elem = doc.at_xpath("/GROUP/TEMPLATE/GROUP_ADMINS")

                if (!elem.nil?)
                    elem.remove

                    elem.text.split(",").each do |uname|
                        @db.fetch("SELECT oid FROM user_pool \
                            WHERE name=\"#{uname.strip}\"") do |user_row|

                            # Check that user is part of this group first
                            if !doc.at_xpath("/GROUP/USERS/ID[.=#{user_row[:oid]}]").nil?
                                admins_elem.add_child(
                                    doc.create_element("ID") ).content =
                                    user_row[:oid]
                            end
                        end
                    end
                end

                res_providers = doc.xpath("/GROUP/RESOURCE_PROVIDER")

                res_providers.each do |provider|
                    zone_id     = provider.at_xpath("ZONE_ID").text
                    cluster_id  = provider.at_xpath("CLUSTER_ID").text

                    if cluster_id == CLUSTER_ALL
                        cluster_id = VDC_ALL
                    end

                    cluster_elem = vdc_doc.create_element("CLUSTER")

                    cluster_elem.add_child(
                        vdc_doc.create_element("ZONE_ID")).content = zone_id

                    cluster_elem.add_child(
                        vdc_doc.create_element("CLUSTER_ID")).content = cluster_id

                    vdc_doc.at_xpath("/VDC/CLUSTERS").add_child(cluster_elem)
                end

                res_providers.remove

                @db[:group_pool].insert(
                    :oid        => row[:oid],
                    :name       => row[:name],
                    :body       => doc.root.to_s,
                    :uid        => row[:uid],
                    :gid        => row[:gid],
                    :owner_u    => row[:owner_u],
                    :group_u    => row[:group_u],
                    :other_u    => row[:other_u])

                # Do not create a VDC for the oneadmin group
                if row[:oid] != 0
                    vdc_last_oid += 1

                    vdc_doc.at_xpath("/VDC/ID").content = vdc_last_oid.to_s
                    vdc_doc.at_xpath("/VDC/NAME").content = row[:name]

                    vdc_doc.at_xpath("/VDC/GROUPS").add_child(
                        vdc_doc.create_element("ID")).content = row[:oid]

                    @db[:vdc_pool].insert(
                        :oid        => vdc_last_oid.to_s,
                        :name       => row[:name],
                        :body       => vdc_doc.root.to_s,
                        :uid        => 0,
                        :gid        => 0,
                        :owner_u    => 1,
                        :group_u    => 0,
                        :other_u    => 0)
                end
            end
        end

        @db.run "DROP TABLE old_group_pool;"

        # Update last_oid in pool control
        @db.run "INSERT INTO pool_control VALUES('vdc_pool',#{vdc_last_oid});"

        log_time()


        @db.run "ALTER TABLE user_pool RENAME TO old_user_pool;"
        @db.run "CREATE TABLE user_pool (oid INTEGER PRIMARY KEY, name VARCHAR(128), body MEDIUMTEXT, uid INTEGER, gid INTEGER, owner_u INTEGER, group_u INTEGER, other_u INTEGER, UNIQUE(name));"

        @db.transaction do
            @db.fetch("SELECT * FROM old_user_pool") do |row|
                doc = Nokogiri::XML(row[:body],nil,NOKOGIRI_ENCODING){|c| c.default_xml.noblanks}

                elem = doc.at_xpath("/USER/TEMPLATE/DEFAULT_VIEW")

                if (!elem.nil?)
                    elem.remove

                    newtext = (elem.text.split(",").map { |s|
                        s.strip.
                            gsub(/^vcenter$/, "admin_vcenter").
                            gsub(/^vdcadmin$/, "groupadmin")
                    }).join(",")

                    doc.at_xpath("/USER/TEMPLATE").add_child(
                        doc.create_element("DEFAULT_VIEW")).
                        add_child(Nokogiri::XML::CDATA.new(doc,newtext))
                end

                @db[:user_pool].insert(
                    :oid        => row[:oid],
                    :name       => row[:name],
                    :body       => doc.root.to_s,
                    :uid        => row[:uid],
                    :gid        => row[:gid],
                    :owner_u    => row[:owner_u],
                    :group_u    => row[:group_u],
                    :other_u    => row[:other_u])
            end
        end

        @db.run "DROP TABLE old_user_pool;"

        log_time()

        return true
    end
end
