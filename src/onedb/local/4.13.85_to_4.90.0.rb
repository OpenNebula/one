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

    ############################################################################
    # 4369
    ############################################################################

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

    @db.run "ALTER TABLE vm_pool RENAME TO old_vm_pool;"
    @db.run "CREATE TABLE vm_pool (oid INTEGER PRIMARY KEY, name VARCHAR(128), body MEDIUMTEXT, uid INTEGER, gid INTEGER, last_poll INTEGER, state INTEGER, lcm_state INTEGER, owner_u INTEGER, group_u INTEGER, other_u INTEGER)"

    @db.transaction do
      @db.fetch("SELECT * FROM old_vm_pool") do |row|
        if row[:state] != 6
          doc = Nokogiri::XML(row[:body],nil,NOKOGIRI_ENCODING){|c| c.default_xml.noblanks}

          cid = doc.root.at_xpath("HISTORY_RECORDS/HISTORY[last()]/CID").text.to_i rescue nil

          if cid == -1
            doc.root.at_xpath("HISTORY_RECORDS/HISTORY[last()]/CID").content = 0
          end

          # Bug #4467

          elem = doc.at_xpath("/VM/USER_TEMPLATE/EC2")

          if (!elem.nil?)
            elem.name = "PUBLIC_CLOUD"

            if elem.at_xpath("TYPE").nil?
              elem.add_child(doc.create_element("TYPE")).content = "ec2"
            end
          end

          row[:body] = doc.root.to_s
        end

        @db[:vm_pool].insert(row)
      end
    end

    @db.run "DROP TABLE old_vm_pool;"

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

    ############################################################################
    # 4215
    ############################################################################

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

        # Bug #4467

        elem = doc.at_xpath("/VMTEMPLATE/TEMPLATE/EC2")

        if (!elem.nil?)
          elem.name = "PUBLIC_CLOUD"

          if elem.at_xpath("TYPE").nil?
            elem.add_child(doc.create_element("TYPE")).content = "ec2"
          end
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

    ############################################################################
    # Feature #4217
    ############################################################################

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

    ############################################################################
    # Feature #3204
    ############################################################################

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

    # Bug #4248 - Remove Firewall Drivers

    vms_with_fw = []
    @db.transaction do
      @db.fetch("SELECT * FROM vm_pool WHERE state != 6") do |row|
        doc = Nokogiri::XML(row[:body],nil,NOKOGIRI_ENCODING){|c| c.default_xml.noblanks}

        has_fw_attrs = !doc.root.xpath("TEMPLATE/NIC[ICMP|WHITE_PORTS_TCP|WHITE_PORTS_UDP|BLACK_PORTS_TCP|BLACK_PORTS_UDP]").empty?

        vms_with_fw << row[:oid].to_i if has_fw_attrs
      end
    end

    if !vms_with_fw.empty?
      puts "**************************************************************"
      puts "*  WARNING  WARNING WARNING WARNING WARNING WARNING WARNING  *"
      puts "**************************************************************"
      puts
      puts "The old driver 'fw' has been removed from OpenNebula. It was  "
      puts "deprecated in 4.12:                                           "
      puts "http://docs.opennebula.org/4.12/release_notes/release_notes/compatibility.html"
      puts
      puts "We have detected that you still have active VMs with these    "
      puts "attributes: ICMP, WHITE_PORTS_TCP, WHITE_PORTS_UDP,           "
      puts "BLACK_PORTS_TCP, BLACK_PORTS_UDP.                             "
      puts
      puts "The list of affected VMs is:                                  "
      vms_with_fw.each{|vm| puts "- #{vm}"}
      puts
      puts "Please note that OpenNebula will not modify the current       "
      puts "iptables rules, so you will need to manually clean them when  "
      puts "any of VMs is removed."
      puts
      puts "Please consider switching to Security Groups                  "
    end

    log_time()

    ############################################################################
    # Remove Xen, VMware and SoftLayer Drivers
    ############################################################################

    @db.run "ALTER TABLE host_pool RENAME TO old_host_pool;"

    @db.run "CREATE TABLE host_pool (oid INTEGER PRIMARY KEY, name VARCHAR(128), body MEDIUMTEXT, state INTEGER, last_mon_time INTEGER, uid INTEGER, gid INTEGER, owner_u INTEGER, group_u INTEGER, other_u INTEGER, cid INTEGER);"

    has_xen_hosts    = false
    has_vmware_hosts = false
    has_sl_hosts     = false

    @db.transaction do
      @db.fetch("SELECT * FROM old_host_pool") do |row|
        do_disable = false

        doc = Nokogiri::XML(row[:body],nil,NOKOGIRI_ENCODING){|c| c.default_xml.noblanks}

        vm_mad = doc.root.at_xpath("VM_MAD").text
        im_mad = doc.root.at_xpath("IM_MAD").text

        if vm_mad.match(/xen/) || im_mad.match(/xen/)
          do_disable    = true
          has_xen_hosts = true
        end

        if vm_mad.match(/vmware/) || im_mad.match(/vmware/)
          do_disable       = true
          has_vmware_hosts = true
        end


        if vm_mad.match(/sl/) || im_mad.match(/sl/)
          do_disable       = true
          has_sl_hosts = true
        end

        if do_disable
          doc.root.at_xpath('STATE').content = 4

          row[:state] = 4
          row[:body]  = doc.root.to_s
        end

        @db[:host_pool].insert(row)
      end
    end

    @db.run "DROP TABLE old_host_pool;"

    if has_xen_hosts
      puts "**************************************************************"
      puts "*  WARNING  WARNING WARNING WARNING WARNING WARNING WARNING  *"
      puts "**************************************************************"
      puts
      puts "Xen is no longer included in the core distribution. It is"
      puts "however available as an addon which must be manually installed:"
      puts "https://github.com/OpenNebula/addon-xen"
      puts
      puts "Note that the host has been automatically disabled. After installing"
      puts "the addon you can manually enable it."
      puts
    end

    if has_vmware_hosts
      puts "**************************************************************"
      puts "*  WARNING  WARNING WARNING WARNING WARNING WARNING WARNING  *"
      puts "**************************************************************"
      puts
      puts "VMware is no longer supported. You are encouraged to migrate"
      puts "to the vCenter driver:"
      puts "http://docs.opennebula.org/stable/administration/virtualization/vcenterg.html"
      puts
      puts "Note that the host has been automatically disabled, but not removed."
      puts
    end

    if has_sl_hosts
      puts "**************************************************************"
      puts "*  WARNING  WARNING WARNING WARNING WARNING WARNING WARNING  *"
      puts "**************************************************************"
      puts
      puts "SoftLayer is no longer included in the core distribution. It is"
      puts "however available as an addon which must be manually installed:"
      puts "https://github.com/OpenNebula/addon-softlayer"
      puts
      puts "Note that the host has been automatically disabled. After installing"
      puts "the addon you can manually enable it."
      puts
    end

    log_time()

    ############################################################################
    # Move HOST/VN_MAD --> VNET/VN_MAD
    ############################################################################

    # Build net_vnmad
    net_vnmad = {}
    @db.transaction do
      @db.fetch("SELECT * FROM vm_pool WHERE state != 6") do |row|
        doc = Nokogiri::XML(row[:body],nil,NOKOGIRI_ENCODING){|c| c.default_xml.noblanks}
        state = row[:state].to_i

        vnmads = Set.new
        doc.root.xpath("HISTORY_RECORDS/HISTORY/VNMMAD").collect{|v| vnmads << v.text }

        doc.root.xpath("TEMPLATE/NIC/NETWORK_ID").each do |net_id|
            net_id = net_id.text.to_i

            net_vnmad[net_id] ||= Set.new
            net_vnmad[net_id] += vnmads
        end
      end
    end

    # Build cluster_vnmad and fix hosts
    @db.run "ALTER TABLE host_pool RENAME TO old_host_pool;"
    @db.run "CREATE TABLE host_pool (oid INTEGER PRIMARY KEY, name VARCHAR(128), body MEDIUMTEXT, state INTEGER, last_mon_time INTEGER, uid INTEGER, gid INTEGER, owner_u INTEGER, group_u INTEGER, other_u INTEGER, cid INTEGER);"

    cluster_vnmad = {}
    @db.transaction do
      @db.fetch("SELECT * FROM old_host_pool") do |row|
        doc = Nokogiri::XML(row[:body],nil,NOKOGIRI_ENCODING){|c| c.default_xml.noblanks}

        # Get cluster
        cluster_id = doc.root.xpath('CLUSTER_ID').text.to_i

        # Store VN_MAD
        vnmad = doc.root.xpath('VN_MAD').text

        cluster_vnmad[cluster_id] ||= Set.new
        cluster_vnmad[cluster_id] << vnmad

        # Remove VN_MAD
        doc.root.xpath('//VN_MAD').remove

        row[:body] = doc.root.to_s
        @db[:host_pool].insert(row)
      end
    end
    @db.run "DROP TABLE old_host_pool;"

    # Fix Networks

    # So far we have two hashes: net_vnmad, which lists the specific vnmad found
    # for each network, based on the nics of the VMs, and cluster_vnmad, with
    # the vnmad found in the hosts.
    #
    # We will report a warning if either the cluster or the network has more
    # than one vnmad. We will automatically choose one vnmad from the network
    # list, or if empty from the cluster list.
    #
    # That vnmad may be changed through onedb patch.
    #
    # It could happen that no network is found in the net or in the cluster, in
    # which case the admin **must** run the onedb patch, it's not optional any
    # more.

    @db.run "ALTER TABLE network_pool RENAME TO old_network_pool;"
    @db.run "CREATE TABLE network_pool (oid INTEGER PRIMARY KEY, name VARCHAR(128), body MEDIUMTEXT, uid INTEGER, gid INTEGER, owner_u INTEGER, group_u INTEGER, other_u INTEGER, pid INTEGER, UNIQUE(name,uid));"

    reserved_vlan_ids = Set.new
    final_net_vnmad = {}
    manual_intervention = false
    @db.transaction do
      @db.fetch("SELECT * FROM old_network_pool") do |row|
        doc = Nokogiri::XML(row[:body],nil,NOKOGIRI_ENCODING){|c| c.default_xml.noblanks}

        net_id   = row[:oid]
        net_name = row[:name]

        cluster_id = doc.root.xpath('CLUSTERS/ID').first.text.to_i

        # Get possible VN_MADs
        net_vnmad_len     = net_vnmad[net_id].length rescue 0
        cluster_vnmad_len = cluster_vnmad[cluster_id].length rescue 0

        # Check if the network has VLAN=NO
        vlan = doc.root.xpath('VLAN').text rescue nil
        vlan_no = (vlan == "0")

        # Remove the VLAN attributes
        doc.root.xpath('//VLAN').remove

        vnmad = nil
        other_vnmads = nil

        # Get vnmad
        #
        # net_vnmad_len == 1 => that one
        # net_vnmad_len > 1 => interactive
        # net_vnmad_len == 0 && cluster_vnmad_len == 1 => that one
        # net_vnmad_len == 0 && cluster_vnmad_len > 1 => interactive
        # net_vnmad_len == 0 && cluster_vnmad_len == 0 => interactive

        if net_vnmad_len == 1
          vnmad = net_vnmad[net_id].first
        elsif net_vnmad_len > 1
          other_vnmads = net_vnmad[net_id]
        elsif net_vnmad_len == 0 && cluster_vnmad_len == 1
          vnmad = cluster_vnmad[cluster_id].first
        elsif net_vnmad_len == 0 && cluster_vnmad_len > 1
          other_vnmads = cluster_vnmad[cluster_id]
        end

        # Ambiguous vnmad, require user input (TODO)
        if vnmad.nil?

          if !manual_intervention
            manual_intervention = true
            puts
            puts  "Manual Intervention required. Please input the VN_MAD " <<
                  " for the following networks:"
            puts
          end

          suggested = if other_vnmads
            " (suggested: [#{other_vnmads.to_a.join(', ')}])"
          else
            ""
          end

          input = ""
          while (input.empty?) do
            puts "* Net ##{net_id} (#{net_name}) VN_MAD#{suggested}:"
            input = STDIN.gets.chomp.strip

            if input.match(/[^\w\-.]/)
              puts "Invalid char found."
              input = ""
            end
          end

          vnmad = input
        end

        # If VLAN = NO => don't use isolated VN_MADs
        if vlan_no && vnmad && ["802.1q", "ovswitch", "vxlan", "ebtables"].include?(vnmad.downcase)
            input = ""
            while (input.empty?) do
              puts "Net ##{net_id} (#{net_name}) has VN_MAD='#{vnmad}' but it also has VLAN=NO. Change to 'fw'? (y/n)"

              input = STDIN.gets.chomp.strip

              case input
              when 'y'
                vnmad = 'fw'
              when 'n'
              else
                puts "Invalid value."
                input = ""
              end
            end
        end

        if vnmad.nil?
          STDERR.puts "Error getting VN_MAD for Network #{net_id}."
          exit 1
        end

        # Create the VN_MAD element:
        final_net_vnmad[net_id] = vnmad
        doc.root.add_child(doc.create_element("VN_MAD")).content = vnmad

        # Create/Move the VLAN_ID and VLAN_ID_AUTOMATIC attributes:
        #
        # Manual    => VLAN_ID exists
        # Automatic => VLAN_ID does not exist
        #
        # If VLAN has been set automatically,
        #
        #   top-level <VLAN_ID><![CDATA[20]]></VLAN_ID>
        #   top-level <VLAN_ID_AUTOMATIC>1</VLAN_ID_AUTOMATIC>
        #   remove VLAN_ID from <TEMPLATE>
        #
        # If VLAN has been set manually,
        #
        #   top-level <VLAN_ID><![CDATA[20]]></VLAN_ID>
        #   top-level <VLAN_ID_AUTOMATIC>0</VLAN_ID_AUTOMATIC>
        #   keep VLAN_ID in <TEMPLATE>
        #
        if vnmad && ["802.1q", "ovswitch", "vxlan"].include?(vnmad.downcase)
          vlan_id = doc.root.xpath('TEMPLATE/VLAN_ID').text rescue nil

          if vlan_id && !vlan_id.empty?
            vlan_id_automatic = false
          else
            # TODO: get from configuration?
            start_vlan = 2

            vlan_id = start_vlan + (net_id % (4095 - start_vlan))
            vlan_id_automatic = true

            # Only automatic vlans will be reserved
            if ["802.1q", "ovswitch"].include?(vnmad.downcase)
              reserved_vlan_ids << vlan_id
            end

            doc.root.xpath("//VLAN_ID[not(parent::AR)]").each {|e| e.remove }
          end

          doc.root.add_child(doc.create_element("VLAN_ID")).content = vlan_id
          doc.root.add_child(doc.create_element("VLAN_ID_AUTOMATIC")).content = vlan_id_automatic ? "1" : "0"
        end

        row[:body] = doc.root.to_s
        @db[:network_pool].insert(row)
      end
    end

    @db.run "DROP TABLE old_network_pool;"

    # Fix VMs

    @db.run "ALTER TABLE vm_pool RENAME TO old_vm_pool;"
    @db.run "CREATE TABLE vm_pool (oid INTEGER PRIMARY KEY, name VARCHAR(128), body MEDIUMTEXT, uid INTEGER, gid INTEGER, last_poll INTEGER, state INTEGER, lcm_state INTEGER, owner_u INTEGER, group_u INTEGER, other_u INTEGER)"

    @db.transaction do
      @db.fetch("SELECT * FROM old_vm_pool") do |row|
        doc = Nokogiri::XML(row[:body],nil,NOKOGIRI_ENCODING){|c| c.default_xml.noblanks}
        state = row[:state].to_i

        if state != 6
          # Remove vnmad from the history records
          doc.root.xpath("HISTORY_RECORDS//VNMMAD").remove

          # Rename VMMMAD -> VM_MAD and TMMAD -> TM_MAD
          doc.root.xpath("HISTORY_RECORDS//VMMMAD").each {|e| e.name = "VM_MAD"}
          doc.root.xpath("HISTORY_RECORDS//TMMAD").each  {|e| e.name = "TM_MAD"}

          # Add vnmad to the nics
          doc.root.xpath('TEMPLATE/NIC').each do |nic|
            net_id = nic.xpath("NETWORK_ID").text.to_i rescue nil # NICs without network may exist

            next unless net_id

            vnmad = final_net_vnmad[net_id]

            if vnmad
                nic.add_child(doc.create_element("VN_MAD")).content = vnmad
            end
          end

          # Remove DS_LOCATION (Feature #4316 - Remove BASE_PATH)
          doc.root.xpath("HISTORY_RECORDS//DS_LOCATION").remove

          row[:body] = doc.root.to_s
        end

        @db[:vm_pool].insert(row)
      end
    end
    @db.run "DROP TABLE old_vm_pool;"

    log_time()

    ############################################################################
    # Bug #4376 - VLAN IDs Bitmap
    ############################################################################

    ## Create and bootstrap 'vlan_bitmap' table

    # Create Table
    @db.run "CREATE TABLE network_vlan_bitmap (id INTEGER, map LONGTEXT, PRIMARY KEY(id));"

    size = 4096

    map = ""
    size.times.each do |i|
        map << (reserved_vlan_ids.include?(size - 1 - i) ? "1" : "0")
    end

    map_encoded = Base64::strict_encode64(Zlib::Deflate.deflate(map))

    @db[:network_vlan_bitmap].insert(
      :id      => 0,
      :map     => map_encoded
    )

    log_time()

    ############################################################################
    # VNC Bitmap
    ############################################################################

    cluster_vnc = {}
    @db.transaction do
      @db.fetch("SELECT * FROM vm_pool WHERE state != 6") do |row|
        doc = Nokogiri::XML(row[:body],nil,NOKOGIRI_ENCODING){|c| c.default_xml.noblanks}

        port = doc.root.at_xpath('TEMPLATE/GRAPHICS[translate(TYPE,"vnc","VNC")="VNC"]/PORT').text.to_i rescue nil
        cluster_id = doc.root.at_xpath('HISTORY_RECORDS/HISTORY[last()]/CID').text.to_i rescue nil

        # skip if no port is defined or if it's not assigned to a cluster (not deployed yet!)
        next if cluster_id.nil? || port.nil?

        cluster_id = 0 if cluster_id == -1

        cluster_vnc[cluster_id] ||= Set.new
        cluster_vnc[cluster_id] << port
      end
    end

    # Create Table
    @db.run "CREATE TABLE cluster_vnc_bitmap (id INTEGER, map LONGTEXT, PRIMARY KEY(id));"

    vnc_pool_size = 65536

    @db.transaction do
      @db.fetch("SELECT * FROM cluster_pool") do |row|
        cluster_id = row[:oid]

        if cluster_vnc[cluster_id]
          map = ""
          vnc_pool_size.times.each do |i|
            map << (cluster_vnc[cluster_id].include?(vnc_pool_size - 1 - i) ? "1" : "0")
          end

          map_encoded = Base64::strict_encode64(Zlib::Deflate.deflate(map))
        else
          map_encoded = "eJztwYEAAAAAgCCl/ekWqQoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABqFo8C0Q=="
        end

        @db[:cluster_vnc_bitmap].insert(
          :id  => cluster_id,
          :map => map_encoded
        )
      end
    end

    log_time()

    ############################################################################
    # Feature #4316 - Remove BASE_PATH
    ############################################################################

    conf_datastore_location = File.read(File.join(VAR_LOCATION, 'config')).match(/DATASTORE_LOCATION=(.*)$/)[1] rescue nil

    @db.run "ALTER TABLE datastore_pool RENAME TO old_datastore_pool;"
    @db.run "CREATE TABLE datastore_pool (oid INTEGER PRIMARY KEY, name VARCHAR(128), body MEDIUMTEXT, uid INTEGER, gid INTEGER, owner_u INTEGER, group_u INTEGER, other_u INTEGER);"

    has_lvm = false
    @db.transaction do
      @db.fetch("SELECT * FROM old_datastore_pool") do |row|
        doc = Nokogiri::XML(row[:body],nil,NOKOGIRI_ENCODING){|c| c.default_xml.noblanks}

        ds_id   = row[:oid]
        ds_name = row[:name]

        base_path = doc.root.at_xpath("TEMPLATE/BASE_PATH").remove rescue nil

        if base_path
          base_path = base_path.text

          if Pathname(base_path).cleanpath != Pathname(conf_datastore_location).cleanpath
            puts "**************************************************************"
            puts "*  WARNING  WARNING WARNING WARNING WARNING WARNING WARNING  *"
            puts "**************************************************************"
            puts
            puts "The Datastore Attribute BASE_PATH has been deprecated. It has been removed from"
            puts "the Datastore template."
            puts
            puts "We have detected that for the datastore ##{ds_id} (#{ds_name}), it does not match"
            puts "the global DATASTORE_LOCATION."
            puts
            puts "You **MUST** create a symbolic link in the nodes to link them:"
            puts "$ ln -s #{base_path} #{conf_datastore_location}"
            puts
          end

          row[:body] = doc.root.to_s
        end

        ds_mad = doc.root.at_xpath("DS_MAD").text rescue nil
        has_lvm = true if ds_mad.upcase == "LVM"

        @db[:datastore_pool].insert(row)
      end
    end

    @db.run "DROP TABLE old_datastore_pool;"

    if has_lvm
      puts "**************************************************************"
      puts "*  WARNING  WARNING WARNING WARNING WARNING WARNING WARNING  *"
      puts "**************************************************************"
      puts
      puts "The LVM driver is no longer included in the core distribution. It is"
      puts "however available as an addon which must be manually installed:"
      puts "https://github.com/OpenNebula/addon-lvm"
      puts
      puts "You have LVM datastores which will not work until you install the"
      puts "add-on."
      puts
      puts "Note that OpenNebula officially recommends using the fs_lvm drivers:"
      puts "http://docs.opennebula.org/5.0/deployment/open_cloud_storage_setup/lvm_drivers.html"
      puts
    end

    log_time()

    return true
  end

end
