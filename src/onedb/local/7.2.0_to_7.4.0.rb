# -------------------------------------------------------------------------- #
# Copyright 2019-2026, OpenNebula Systems S.L.                               #
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

require 'fileutils'
require 'json'
require 'nokogiri'
require 'yaml'

$: << File.dirname(__FILE__)

include OpenNebula

module Migrator
    def db_version
        "7.4.0"
    end

    def one_version
        "OpenNebula 7.4.0"
    end

    def up
        init_log_time

        bug7244
        feature7676

        feature_7490

        feature_7490_vnet_template_id

        feature_server_auth_files

        log_time

        true
    end

    # Server auth files are only written when the DB is bootstrapped, so
    # upgraded installations lack the ones added after their bootstrap.
    # They all hold the same serveradmin secret, copy it from a sibling.
    def feature_server_auth_files
        auth_dir = File.join(VAR_LOCATION, '.one')

        source = ['sunstone_auth', 'onegate_auth', 'oneflow_auth'].find do |name|
            File.exist?(File.join(auth_dir, name))
        end

        if source.nil?
            puts 'Could not find an existing server auth file in ' <<
                 "#{auth_dir}, skipping."
            return
        end

        source = File.join(auth_dir, source)

        ['oneform_auth', 'oneks_auth'].each do |name|
            target = File.join(auth_dir, name)

            next if File.exist?(target)

            begin
                FileUtils.cp(source, target, :preserve => true)
            rescue StandardError => e
                puts "Error copying #{source} to #{target}: #{e.message}"
                puts 'Please copy the file manually.'
            end
        end
    end

    # Backfill UUID for existing OneKS groups
    def bug7244
        @db.transaction do
            @db[:document_pool].where(:type => 121).each do |row|
                doc = nokogiri_doc(row[:body], 'document_pool')

                group_body = doc.at_xpath('/DOCUMENT/TEMPLATE/GROUP_BODY')
                json       = JSON.parse(group_body.text)

                next if json.key?('uuid')

                json['uuid'] = json['name']
                group_body.children[0].content = json.to_json

                @db[:document_pool].where(:oid => row[:oid]).update(:body => doc.root.to_s)
            end
        end
    end

    # Move existing OneKS cluster networks into the deployment section
    def feature7676
        @db.transaction do
            @db[:document_pool].where(:type => 120).each do |row|
                doc = nokogiri_doc(row[:body], 'document_pool')

                cluster_body = doc.at_xpath('/DOCUMENT/TEMPLATE/CLUSTER_BODY')
                json         = JSON.parse(cluster_body.text)

                next if json.key?('deployment')

                public_network  = json.delete('public_network')
                private_network = json.delete('private_network')

                next if public_network.nil? || private_network.nil?

                json['deployment'] = {
                    'cluster'  => { 'id' => 0 },
                    'networks' => {
                        'public'  => { 'id' => public_network },
                        'private' => { 'id' => private_network }
                    }
                }

                cluster_body.children[0].content = json.to_json

                @db[:document_pool].where(:oid => row[:oid]).update(:body => doc.root.to_s)
            end
        end
    end

    # VLAN ID rules
    def feature_7490
        create_table(:group_vlans)
    end

    # Move VN Template ID from the VNET template to a first-class VNET attribute
    def feature_7490_vnet_template_id
        @db.transaction do
            @db[:network_pool].each do |row|
                doc = nokogiri_doc(row[:body], 'network_pool')

                template_id = doc.at_xpath('/VNET/TEMPLATE/TEMPLATE_ID')

                next if template_id.nil?

                if doc.at_xpath('/VNET/TEMPLATE_ID').nil?
                    elem = doc.create_element('TEMPLATE_ID')

                    elem.content = template_id.text

                    doc.root.add_child(elem)
                end

                template_id.remove

                @db[:network_pool].where(:oid => row[:oid]).update(:body => doc.root.to_s)
            end
        end
    end
end
