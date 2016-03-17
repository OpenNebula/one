# -------------------------------------------------------------------------- #
# Copyright 2002-2015, OpenNebula Project, OpenNebula Systems                #
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

require 'opennebula'

include OpenNebula

module Migrator
  def db_version
    "4.90.0"
  end

  def one_version
    "OpenNebula 4.90.0"
  end

  TEMPLATE_TRANSFORM_ATTRS = {
    'SUNSTONE_NETWORK_SELECT'   => 'NETWORK_SELECT'
  }

  def up
    init_log_time()

    # 4369

    @db.run "CREATE TABLE cluster_datastore_relation (cid INTEGER, oid INTEGER, PRIMARY KEY(cid, oid));"
    @db.run "CREATE TABLE cluster_network_relation (cid INTEGER, oid INTEGER, PRIMARY KEY(cid, oid));"


    @db.run "ALTER TABLE host_pool RENAME TO old_host_pool;"
    @db.run "CREATE TABLE host_pool (oid INTEGER PRIMARY KEY, name VARCHAR(128), body MEDIUMTEXT, state INTEGER, last_mon_time INTEGER, uid INTEGER, gid INTEGER, owner_u INTEGER, group_u INTEGER, other_u INTEGER, cid INTEGER);"

    host_ids = []

    @db.transaction do
      @db.fetch("SELECT * FROM old_host_pool") do |row|
        doc = Nokogiri::XML(row[:body],nil,NOKOGIRI_ENCODING){|c| c.default_xml.noblanks}

        cid_elem = doc.root.at_xpath("CLUSTER_ID")
        cid = cid_elem.text.to_i

        if (cid == -1)
          cid = 0
          cid_elem.content = "0"
          doc.root.at_xpath("CLUSTER").content = "default"

          host_ids << row[:oid]
        end

        @db[:host_pool].insert(
          :oid            => row[:oid],
          :name           => row[:name],
          :body           => doc.root.to_s,
          :state          => row[:state],
          :last_mon_time  => row[:last_mon_time],
          :uid            => row[:uid],
          :gid            => row[:gid],
          :owner_u        => row[:owner_u],
          :group_u        => row[:group_u],
          :other_u        => row[:other_u],
          :cid            => cid)
      end
    end

    @db.run "DROP TABLE old_host_pool;"

    log_time()

    @db.run "ALTER TABLE datastore_pool RENAME TO old_datastore_pool;"
    @db.run "CREATE TABLE datastore_pool (oid INTEGER PRIMARY KEY, name VARCHAR(128), body MEDIUMTEXT, uid INTEGER, gid INTEGER, owner_u INTEGER, group_u INTEGER, other_u INTEGER);"

    ds_ids = []

    @db.transaction do
      @db.fetch("SELECT * FROM old_datastore_pool") do |row|
        doc = Nokogiri::XML(row[:body],nil,NOKOGIRI_ENCODING){|c| c.default_xml.noblanks}

        doc.root.at_xpath("CLUSTER").remove

        cid_elem = doc.root.at_xpath("CLUSTER_ID")
        cid = cid_elem.text.to_i

        cid_elem.remove

        if (cid == -1)
          cid = 0
          ds_ids << row[:oid]
        end

        cluster_ids_elem = doc.create_element("CLUSTERS")
        cluster_ids_elem.add_child(doc.create_element("ID")).content = cid.to_s

        doc.root.add_child(cluster_ids_elem)

        @db[:datastore_pool].insert(
          :oid      => row[:oid],
          :name     => row[:name],
          :body     => doc.root.to_s,
          :uid      => row[:uid],
          :gid      => row[:gid],
          :owner_u  => row[:owner_u],
          :group_u  => row[:group_u],
          :other_u  => row[:other_u])

        @db[:cluster_datastore_relation].insert(
          :cid => cid,
          :oid => row[:oid])
      end
    end

    @db.run "DROP TABLE old_datastore_pool;"

    log_time()

    @db.run "ALTER TABLE network_pool RENAME TO old_network_pool;"
    @db.run "CREATE TABLE network_pool (oid INTEGER PRIMARY KEY, name VARCHAR(128), body MEDIUMTEXT, uid INTEGER, gid INTEGER, owner_u INTEGER, group_u INTEGER, other_u INTEGER, pid INTEGER, UNIQUE(name,uid));"

    vnet_ids = []

    @db.transaction do
      @db.fetch("SELECT * FROM old_network_pool") do |row|
        doc = Nokogiri::XML(row[:body],nil,NOKOGIRI_ENCODING){|c| c.default_xml.noblanks}

        doc.root.at_xpath("CLUSTER").remove

        cid_elem = doc.root.at_xpath("CLUSTER_ID")
        cid = cid_elem.text.to_i

        cid_elem.remove

        if (cid == -1)
          cid = 0
          vnet_ids << row[:oid]
        end

        cluster_ids_elem = doc.create_element("CLUSTERS")
        cluster_ids_elem.add_child(doc.create_element("ID")).content = cid.to_s

        doc.root.add_child(cluster_ids_elem)

        @db[:network_pool].insert(
          :oid      => row[:oid],
          :name     => row[:name],
          :body     => doc.root.to_s,
          :uid      => row[:uid],
          :gid      => row[:gid],
          :owner_u  => row[:owner_u],
          :group_u  => row[:group_u],
          :other_u  => row[:other_u],
          :pid      => row[:pid])

        @db[:cluster_network_relation].insert(
          :cid => cid,
          :oid => row[:oid])
      end
    end

    @db.run "DROP TABLE old_network_pool;"

    log_time()

    default_cl_xml = '<CLUSTER><ID>0</ID><NAME>default</NAME><HOSTS></HOSTS><DATASTORES></DATASTORES><VNETS></VNETS><TEMPLATE><RESERVED_CPU><![CDATA[]]></RESERVED_CPU><RESERVED_MEM><![CDATA[]]></RESERVED_MEM></TEMPLATE></CLUSTER>'
    doc = Nokogiri::XML(default_cl_xml,nil,NOKOGIRI_ENCODING){|c| c.default_xml.noblanks}

    hosts_elem = doc.root.at_xpath("HOSTS")
    host_ids.each { |id|
      hosts_elem.add_child(doc.create_element("ID")).content = id.to_s
    }

    ds_elem = doc.root.at_xpath("DATASTORES")
    ds_ids.each { |id|
      ds_elem.add_child(doc.create_element("ID")).content = id.to_s
    }

    vnets_elem = doc.root.at_xpath("VNETS")
    vnet_ids.each { |id|
      vnets_elem.add_child(doc.create_element("ID")).content = id.to_s
    }

    @db[:cluster_pool].insert(
      :oid      => 0,
      :name     => 'default',
      :body     => doc.root.to_s,
      :uid      => 0,
      :gid      => 0,
      :owner_u  => 1,
      :group_u  => 0,
      :other_u  => 0)

    log_time()

    # 4215

    @db.run "CREATE TABLE vrouter_pool (oid INTEGER PRIMARY KEY, name VARCHAR(128), body MEDIUMTEXT, uid INTEGER, gid INTEGER, owner_u INTEGER, group_u INTEGER, other_u INTEGER);"

    @db.run "ALTER TABLE network_pool RENAME TO old_network_pool;"
    @db.run "CREATE TABLE network_pool (oid INTEGER PRIMARY KEY, name VARCHAR(128), body MEDIUMTEXT, uid INTEGER, gid INTEGER, owner_u INTEGER, group_u INTEGER, other_u INTEGER, pid INTEGER, UNIQUE(name,uid));"

    @db.transaction do
      @db.fetch("SELECT * FROM old_network_pool") do |row|
        doc = Nokogiri::XML(row[:body],nil,NOKOGIRI_ENCODING){|c| c.default_xml.noblanks}

        doc.root.add_child(doc.create_element("VROUTERS"))

        @db[:network_pool].insert(
          :oid      => row[:oid],
          :name     => row[:name],
          :body     => doc.root.to_s,
          :uid      => row[:uid],
          :gid      => row[:gid],
          :owner_u  => row[:owner_u],
          :group_u  => row[:group_u],
          :other_u  => row[:other_u],
          :pid      => row[:pid])
      end
    end

    @db.run "DROP TABLE old_network_pool;"

    log_time()

    @db.run "ALTER TABLE template_pool RENAME TO old_template_pool;"
    @db.run "CREATE TABLE template_pool (oid INTEGER PRIMARY KEY, name VARCHAR(128), body MEDIUMTEXT, uid INTEGER, gid INTEGER, owner_u INTEGER, group_u INTEGER, other_u INTEGER);"

    @db.transaction do
      @db.fetch("SELECT * FROM old_template_pool") do |row|
        doc = Nokogiri::XML(row[:body],nil,NOKOGIRI_ENCODING){|c| c.default_xml.noblanks}

        # Feature #3671

        TEMPLATE_TRANSFORM_ATTRS.each do |old_name, new_name|
          elem = doc.at_xpath("/VMTEMPLATE/TEMPLATE/#{old_name}")

          if (!elem.nil?)
            elem.remove

            elem.name = new_name

            if (doc.at_xpath("/VMTEMPLATE/TEMPLATE/SUNSTONE").nil?)
              doc.at_xpath("/VMTEMPLATE/TEMPLATE").add_child(
                doc.create_element("SUNSTONE"))
            end

            doc.at_xpath("/VMTEMPLATE/TEMPLATE/SUNSTONE").add_child(elem)
          end
        end

        # Feature #4317

        elem = doc.at_xpath("/VMTEMPLATE/TEMPLATE/SUNSTONE_CAPACITY_SELECT")

        if elem.nil?
          capacity_edit = true
        else
          elem.remove
          capacity_edit = (elem.text != "NO")
        end

        if !capacity_edit
          cpu_e = doc.at_xpath("/VMTEMPLATE/TEMPLATE/CPU")
          memory_e = doc.at_xpath("/VMTEMPLATE/TEMPLATE/MEMORY")
          vcpu_e = doc.at_xpath("/VMTEMPLATE/TEMPLATE/VCPU")

          cpu    = cpu_e != nil ? cpu_e.text : ""
          memory = memory_e != nil ? memory_e.text : ""
          vcpu   = vcpu_e != nil ? vcpu_e.text : ""

          user_inputs = doc.at_xpath("/VMTEMPLATE/TEMPLATE/USER_INPUTS")

          if user_inputs.nil?
            user_inputs = doc.create_element("USER_INPUTS")
            doc.at_xpath("/VMTEMPLATE/TEMPLATE").add_child(user_inputs)
          end

          user_inputs.add_child(doc.create_element("CPU")).content = "O|fixed|||#{cpu}"
          user_inputs.add_child(doc.create_element("MEMORY")).content = "O|fixed|||#{memory}"
          user_inputs.add_child(doc.create_element("VCPU")).content = "O|fixed|||#{vcpu}"
        end

        @db[:template_pool].insert(
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

    @db.run "DROP TABLE old_template_pool;"

    log_time()

    # Feature #4217

    @db.run "ALTER TABLE image_pool RENAME TO old_image_pool;"
    @db.run "CREATE TABLE image_pool (oid INTEGER PRIMARY KEY, name VARCHAR(128), body MEDIUMTEXT, uid INTEGER, gid INTEGER, owner_u INTEGER, group_u INTEGER, other_u INTEGER, UNIQUE(name,uid) );"

    @db.transaction do
      @db.fetch("SELECT * FROM old_image_pool") do |row|
        doc = Nokogiri::XML(row[:body],nil,NOKOGIRI_ENCODING){|c| c.default_xml.noblanks}

        doc.root.add_child(doc.create_element("APP_CLONES"))

        @db[:image_pool].insert(
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

    @db.run "DROP TABLE old_image_pool;"

    log_time()

    # Feature #3204

    @db.run "ALTER TABLE secgroup_pool RENAME TO old_secgroup_pool;"
    @db.run "CREATE TABLE secgroup_pool (oid INTEGER PRIMARY KEY, name VARCHAR(128), body MEDIUMTEXT, uid INTEGER, gid INTEGER, owner_u INTEGER, group_u INTEGER, other_u INTEGER, UNIQUE(name,uid));"

    @db.transaction do
      @db.fetch("SELECT * FROM old_secgroup_pool") do |row|
        doc = Nokogiri::XML(row[:body],nil,NOKOGIRI_ENCODING){|c| c.default_xml.noblanks}

        doc.root.at_xpath("VMS").name = "UPDATED_VMS"
        doc.root.add_child(doc.create_element("OUTDATED_VMS"))
        doc.root.add_child(doc.create_element("UPDATING_VMS"))
        doc.root.add_child(doc.create_element("ERROR_VMS"))

        @db[:secgroup_pool].insert(
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

    @db.run "DROP TABLE old_secgroup_pool;"

    log_time()

    return true
  end

end
