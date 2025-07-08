# -------------------------------------------------------------------------- #
# Copyright 2019-2024, OpenNebula Systems S.L.                               #
#                                                                            #
# Licensed under the OpenNebula Software License                             #
# (the "License"); you may not use this file except in compliance with       #
# the License. You may obtain a copy of the License as part of the software  #
# distribution.                                                              #
#                                                                            #
# See https://github.com/OpenNebula/one/blob/master/LICENSE.onsla            #
# (or copy bundled with OpenNebula in /usr/share/doc/one/).                  #
#                                                                            #
# Unless agreed to in writing, software distributed under the License is     #
# distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY   #
# KIND, either express or implied. See the License for the specific language #
# governing permissions and  limitations under the License.                  #
# -------------------------------------------------------------------------- #

require 'json'
require 'nokogiri'
require 'yaml'

$LOAD_PATH << File.dirname(__FILE__)

ACCEPTED_TABLES_6648 = %i[
  acl
  marketplaceapp_pool
  backupjob_pool
  network_pool
  cluster_pool
  schedaction_pool
  secgroup_pool
  datastore_pool
  template_pool
  group_pool
  vdc_pool
  vm_pool
  host_pool
  vmgroup_pool
  image_pool
  vn_template_pool
  vrouter_pool
  zone_pool
  marketplace_pool
]

RESOURCE_NAMES_6648 = {
  acl: 'acl',
  backupjob_pool: 'backupjobs',
  cluster_pool: 'cluster',
  datastore_pool: 'datastore',
  group_pool: 'group',
  host_pool: 'host',
  image_pool: 'image',
  marketplace_pool: 'marketplace',
  marketplaceapp_pool: 'marketplace-app',
  network_pool: 'virtual-network',
  secgroup_pool: 'security-group',
  template_pool: 'vm-template',
  user_pool: 'user',
  vdc_pool: 'virtual-data-center',
  vm_pool: 'vm',
  vmgroup_pool: 'vm-group',
  vn_template_pool: 'network-template',
  vrouter_pool: 'vrouter',
  zone_pool: 'zone'
}

def sanitize_label(label)
  label.gsub(/[^A-Za-z0-9_-]/, '_')
end

# OpenNebula DB migrator to 7.0
module Migrator
  def db_version
    '7.0.0'
  end

  def one_version
    'OpenNebula 7.0.0'
  end

  def up
    init_log_time

    feature_6648

    feature_6723

    feature_6680_6682

    feature_7067

    feature_1550

    feature_1550_plan

    feature_1550_history

    log_time

    true
  end

  def feature_6648
    unless @db.table_exists?(:user_pool)
      puts "User pool table doesn't exist, exiting..."
      return
    end

    sunstone_default_labels = "#{ETC_LOCATION}/sunstone-views.yaml"
    rsunstone_def_group_labels = if File.exist?(sunstone_default_labels)
                                   YAML.load_file(sunstone_default_labels)
                                       &.dig('labels_groups')
                                       &.transform_values do |labels|
                                           next unless labels
                                           [labels].flatten.map { |label| "$#{sanitize_label(label&.strip)}" }
                                       end
                                 else
                                   {}
                                 end

    # Migrate default labels as user labels
    default_labels = rsunstone_def_group_labels&.fetch('default', []) || []
    group_labels = (rsunstone_def_group_labels || {})&.reject { |k, _| k == 'default' }

    rsunstone_group_names = group_labels&.keys || []

    group_name_id_hash = @db[:group_pool]
                         &.where(name: rsunstone_group_names)
                         &.to_hash(:name, :oid)

    user_labels = {}
    user_label_index = {}
    group_label_index = {}

    @db[:user_pool].each do |user|
      xml_content = user[:body]
      next unless xml_content.is_a?(String)

      begin
        xml = nokogiri_doc(xml_content, :user_pool)
        labels = xml.at_xpath('//TEMPLATE/LABELS')&.text
        next if labels.nil? || labels.strip.empty?

        parsed_labels = labels.strip.split(',').map { |label| "$#{sanitize_label(label&.strip)}" }

        user_labels[user[:oid]] = (parsed_labels + default_labels).flatten
        user_label_index[user[:oid]] = {}
      rescue StandardError => e
        puts "Error parsing XML for user #{user[:oid]}: #{e.message}"
      end
    end

    ACCEPTED_TABLES_6648.each do |table|
      next unless @db.table_exists?(table)

      @db[table].each do |resource|
        xml_content = resource[:body]
        next unless xml_content.is_a?(String)

        begin
          xml = nokogiri_doc(xml_content, table)
          raw_labels = xml.at_xpath('//TEMPLATE/LABELS')&.text || xml.at_xpath('//USER_TEMPLATE/LABELS')&.text

          resource_labels = raw_labels&.split(',')&.map { |label| "$#{sanitize_label(label&.strip)}" }
          next unless resource_labels&.any?

          resource_type =
            if table == :template_pool
              xml.at_xpath('//TEMPLATE/VROUTER') ? 'vrouter-template' : 'vm-template'
            else
              RESOURCE_NAMES_6648[table] || table.to_s
            end

          resource_id = resource[:oid] || resource[:id]

          resource_labels.each do |label|
            user_labels.each do |user_id, user_label_list|
              next unless user_label_list.include?(label)

              user_label_index[user_id][label] ||= {}
              user_label_index[user_id][label][resource_type] ||= []
              user_label_index[user_id][label][resource_type] << resource_id.to_s
            end
            group_labels.each do |group_name, group_label_list|
              next unless group_label_list.include?(label)

              group_id = group_name_id_hash&.dig(group_name)
              next unless group_id

              group_label_index[group_id] ||= {}
              group_label_index[group_id][label] ||= {}
              group_label_index[group_id][label][resource_type] ||= []
              group_label_index[group_id][label][resource_type] << resource_id.to_s
            end
          rescue StandardError => e
            puts "[#{table}] Error parsing XML: #{e.message}"
          end
        end
      end
    end

    @db.transaction do
      user_label_index.each do |user_id, label_data|
        row = @db[:user_pool].where(oid: user_id).first
        next unless row

        xml_content = row[:body]
        next unless xml_content.is_a?(String)

        begin
          xml = nokogiri_doc(xml_content, :user_pool)&.root

          next if xml.nil? || xml.children.empty?

          template_node = xml&.at_xpath('//TEMPLATE')
          user_template_node = xml&.at_xpath('//USER_TEMPLATE')

          old_label_node = template_node&.at_xpath('LABELS')
          old_user_label_node = user_template_node&.at_xpath('LABELS')

          old_label_node&.remove
          old_user_label_node&.remove

          new_label_node = Nokogiri::XML::Node.new('LABELS', xml)
          new_label_node.content = JSON.generate(JSON.generate(label_data)) # THIS IS INTENTIONAL, WE WANT 2X ENCODING

          template_node.add_child(new_label_node)

          new_body = xml.to_xml

          @db[:user_pool].where(oid: user_id).update(body: new_body)
        rescue StandardError => e
          puts "Failed to update user #{user_id}: #{e.message}"
        end
      end

      group_label_index.each do |group_id, label_data|
        row = @db[:group_pool].where(oid: group_id).first
        next unless row

        xml_content = row[:body]
        next unless xml_content.is_a?(String)

        begin
          xml = nokogiri_doc(xml_content, :group_pool)&.root

          next if xml.nil? || xml.children.empty?

          template_node = xml&.at_xpath('//TEMPLATE')

          old_sunstone_node = template_node.at_xpath('SUNSTONE')

          old_sunstone_labels = old_sunstone_node&.at_xpath('LABELS')

          old_sunstone_labels&.remove

          new_fireedge_node = template_node.at_xpath('FIREEDGE') || Nokogiri::XML::Node.new('FIREEDGE',
                                                                                            xml).tap do |node|
            template_node.add_child(node)
          end

          new_label_node = Nokogiri::XML::Node.new('LABELS', xml)
          new_label_node.content = JSON.generate(JSON.generate(label_data)) # THIS IS INTENTIONAL, WE WANT 2X ENCODING

          new_fireedge_node.add_child(new_label_node)

          new_body = xml.to_xml

          @db[:group_pool].where(oid: group_id).update(body: new_body)
        rescue StandardError => e
          puts "Failed to update group #{group_id}: #{e.message}"
        end
      end
    end
  end

  # Remove vm_import table
  def feature_6723
    unless @db.table_exists?(:vm_import)
      puts "VM import table doesn't exist, exiting..."
      return
    end

    vms = []

    # Delete vm_import table
    @db.transaction do
      return if @db[:vm_import].empty?

      @db[:vm_import].each do |row|
        vms << { id: row[:vmid], deploy_id: row[:deploy_id] }
      end
    end

    @db.run 'DROP TABLE IF EXISTS vm_import;'

    return if vms.empty?

    wild_ids = vms.map { |vm| vm[:id] }

    @db.transaction do
      # Set all imported wild VMs to done state
      @db[:vm_pool].filter(oid: wild_ids).each do |row|
        doc = nokogiri_doc(row[:body], 'vm_pool')

        state = doc.at_xpath('VM/STATE').content.to_i

        next if state == 6

        now = Time.now.to_i

        doc.at_xpath('VM/STATE').content = '6'
        doc.at_xpath('VM/LCM_STATE').content = '0'
        doc.at_xpath('VM/ETIME').content = now

        short_doc = nokogiri_doc(row[:short_body], 'vm_pool')
        short_doc.at_xpath('VM/STATE').content = '6'
        short_doc.at_xpath('VM/LCM_STATE').content = '0'
        short_doc.at_xpath('VM/ETIME').content = now

        json = JSON.parse(row[:body_json])
        json['VM']['STATE'] = 6
        json['VM']['LCM_STATE'] = 0
        json['VM']['ETIME'] = now

        @db[:vm_pool].filter(oid: row[:oid]).update(body: doc.root.to_s,
                                                    short_body: short_doc.root.to_s,
                                                    state: 6,
                                                    lcm_state: 0,
                                                    body_json: json.to_json)
      end

      # Update history etime
      @db[:history].filter(vid: wild_ids, etime: 0).each do |row|
        doc = nokogiri_doc(row[:body], 'history')

        now = Time.now.to_i

        doc.at_xpath('HISTORY/ETIME').content = now

        retime = doc.at_xpath('HISTORY/RETIME')
        retime.content = now if retime.content.to_i == 0

        @db[:history].filter(vid: row[:vid], seq: row[:seq]).update(body: doc.root.to_s, etime: now)
      end

      # The following tables will be updated by 'onedb fsck'
      #  - quotas
      #  - image_pool
      #  - network_pool
    end

    # Print warning
    puts "\033[1mWarning\033[0m: Found #{vms.size} imported wild VMs. "    \
         'Support for imported wild VMs was removed in release 7.0.0. '    \
         'The imported VMs are removed from OpenNebula management, '       \
         "you can find them as wild VMs on hosts. List of imported VMs:\n" \
         "\tID\tDEPLOY_ID"
    vms.each { |vm| puts "\t#{vm[:id]}\t#{vm[:deploy_id]}" }
  end

  # Rework of OneFlow schema and VR support
  def feature_6680_6682
    @db.run 'DROP TABLE IF EXISTS old_document_pool;'
    @db.run 'ALTER TABLE document_pool RENAME TO old_document_pool;'

    create_table(:document_pool)

    @db.transaction do
      # OneFlow Templates
      @db.fetch('SELECT * FROM old_document_pool WHERE type IN (100, 101)') do |row|
        doc = nokogiri_doc(row[:body], 'old_document_pool')

        json = JSON.parse(doc.xpath('//BODY').text)

        json['roles'].each do |role|
          # Mandatory
          role['template_id'] = role['vm_template']
          role['type'] = 'vm'

          # Optional attributes
          role['user_inputs']        = role['custom_attrs'] if role['custom_attrs']
          json['user_inputs_values'] = role['custom_attrs_values'] if json['custom_attrs_values']

          # Change name and type (string -> object)
          if role['vm_template_contents']
            role['template_contents'] = upgrade_template_contents(
              role['vm_template_contents']
            )
          end

          role.delete('vm_template')
          role.delete('vm_template_contents') if role['vm_template_contents']
          role.delete('custom_attrs') if role['custom_attrs']
          role.delete('custom_attrs_values') if role['custom_attrs_values']
        end

        json['user_inputs'] = json['custom_attrs'] if json['custom_attrs']
        json['user_inputs_values'] = json['custom_attrs_values'] if json['custom_attrs_values']

        json.delete('custom_attrs') if json['custom_attrs']
        json.delete('custom_attrs_values') if json['custom_attrs_values']

        doc.xpath('DOCUMENT/TEMPLATE/BODY')[0].children[0].content = json.to_json

        row[:body] = doc.root.to_s

        @db[:document_pool].insert(row)
      end
    end

    @db.run 'DROP TABLE IF EXISTS old_document_pool;'
  end

  # Add MODTIME to all Images
  def feature_7067
    @db.run 'ALTER TABLE image_pool RENAME TO old_image_pool;'

    create_table(:image_pool)

    @db.transaction do
      @db.fetch('SELECT * FROM old_image_pool') do |row|
        doc = nokogiri_doc(row[:body], 'old_image_pool')

        regtime = doc.root.xpath('REGTIME').text
        doc.root.add_child(doc.create_element('MODTIME')).content = regtime

        row[:body] = doc.root.to_s
        @db[:image_pool].insert(row)
      end
    end

    @db.run 'DROP TABLE old_image_pool;'
  end

  # DRS feature.
  #   Add reched column to vm_pool table
  def feature_1550
    @db.run 'ALTER TABLE vm_pool RENAME TO old_vm_pool;'

    create_table(:vm_pool)

    @db.transaction do
      @db.fetch('SELECT * FROM old_vm_pool') do |row|
        doc = nokogiri_doc(row[:body], 'old_vm_pool')

        resched = doc.xpath('VM/RESCHED').text.to_i
        resched = 0 unless [0, 1].include? resched

        @db[:vm_pool].insert(
          oid: row[:oid],
          name: row[:name],
          body: row[:body],
          uid: row[:uid],
          gid: row[:gid],
          state: row[:state],
          lcm_state: row[:lcm_state],
          resched: resched,
          owner_u: row[:owner_u],
          group_u: row[:group_u],
          other_u: row[:other_u],
          short_body: row[:short_body],
          body_json: row[:body_json]
        )
      end
    end

    @db.run 'DROP TABLE old_vm_pool;'
  end

  # DRS feature.
  #   Crate Plan table
  def feature_1550_plan
    create_table(:plan_pool)

    @db.transaction do
      # Insert default placement plan
      body = '<PLAN><ID>-1</ID><STATE>-1</STATE></PLAN>'
      @db[:plan_pool].insert(
        cid: -1,
        state: -1,
        body: body
      )

      # Insert default cluster plans
      @db.fetch('SELECT * FROM cluster_pool') do |row|
        doc = nokogiri_doc(row[:body], 'cluster_pool')

        cid = doc.xpath('CLUSTER/ID').text.to_i

        body = "<PLAN><ID>#{cid}</ID><STATE>-1</STATE></PLAN>"
        @db[:plan_pool].insert(
          cid: cid,
          state: -1,
          body: body
        )
      end
    end
  end

  # DRS feature.
  #   Add plan_id and action_id to history records
  def feature_1550_history
    @db.run 'ALTER TABLE history RENAME TO old_history;'

    create_table(:history)

    @db.transaction do
      @db.fetch('SELECT * FROM old_history') do |row|
        doc = nokogiri_doc(row[:body], 'old_history')

        doc.root.add_child(doc.create_element('PLAN_ID')).content = -2
        doc.root.add_child(doc.create_element('ACTION_ID')).content = -1

        row[:body] = doc.root.to_s

        @db[:history].insert(row)
      end
    end

    @db.run 'DROP TABLE old_history;'
  end

  # Converts a RAW string in the form KEY = VAL to a hash
  #
  # @param template [String]          Raw string content in the form KEY = VAL,
  #                                   representing vm_template_contents
  # @return [Hash, OpenNebula::Error] Hash representation of the raw content,
  #                                   or an OpenNebula Error if the conversion fails
  def upgrade_template_contents(vm_template_contents)
    return {} if vm_template_contents.nil? || vm_template_contents.empty?

    result = {}

    vm_template_contents.split(/\n(?![^\[]*\])/).each do |line|
      next unless line.include?('=')

      key, value = line.split('=', 2).map(&:strip)
      value = value.tr('"', '')

      # If the value is an array (e.g., NIC = [ ... ]),
      # process the content inside the brackets
      if value.start_with?('[') && value.end_with?(']')
        # Split the elements inside the brackets by commas
        array_elements = value[1..-2].split(/\s*,\s*/)

        # Create a hash combining all key-value pairs in the array
        array_result = {}
        array_elements.each do |element|
          sub_key, sub_value = element.split('=', 2).map(&:strip)
          array_result[sub_key] = sub_value
        end

        value = [array_result]
      else
        value = [value]
      end

      # If the key already exists in the result hash, add the new value
      if result[key]
        if result[key].is_a?(Array)
          result[key] << value.first
        else
          result[key] = [result[key], value.first]
        end
      else
        result[key] = value.first
      end
    end

    result.each do |key, val|
      result[key] = [val] if val.is_a?(Hash)
    end

    result
  end
end
