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

require 'json'
require 'nokogiri'
require 'yaml'

$: << File.dirname(__FILE__)

include OpenNebula

module Migrator

    ONEFORM_STATES = {
        0  => 'PENDING',
        1  => 'INIT',
        2  => 'PLANNING',
        3  => 'APPLYING',
        4  => 'CONFIGURING_PROVISION',
        5  => 'CONFIGURING_PROVISION',
        6  => 'RUNNING',
        7  => 'SCALING',
        8  => 'DEPROVISIONING_ONE',
        9  => 'DEPROVISIONING',
        10 => 'DONE',
        11 => 'INIT_FAILURE',
        12 => 'PLANNING_FAILURE',
        13 => 'APPLYING_FAILURE',
        14 => 'CONFIGURING_PROVISION_FAILURE',
        15 => 'CONFIGURING_PROVISION_FAILURE',
        16 => 'SCALING_FAILURE',
        17 => 'DEPROVISIONING_ONE_FAILURE',
        18 => 'DEPROVISIONING_FAILURE',
        19 => 'DONE_FAILURE'
    }

    def db_version
        "7.6.0"
    end

    def one_version
        "OpenNebula 7.6.0"
    end

    def up
        init_log_time

        oneform_provision_bodies

        log_time

        true
    end

    # Migrate OneForm provision data to its ODS representation.
    def oneform_provision_bodies
        @db.transaction do
            @db[:document_pool].where(:type => 104).each do |row|
                doc = nokogiri_doc(row[:body], 'document_pool')
                provision_body = doc.at_xpath('/DOCUMENT/TEMPLATE/PROVISION_BODY')
                next if provision_body.nil?

                body  = JSON.parse(provision_body.text)
                hosts = body.dig('one_objects', 'hosts')

                changed = false

                # Convert legacy numeric states to the ODS state machine names
                state = body['state']
                if state.is_a?(Integer)
                    state_name = ONEFORM_STATES[state]
                    raise "Invalid legacy OneForm provision state: #{state}" unless state_name

                    body['state'] = state_name
                    changed = true
                end

                # Keep Terraform resource identities under the ODS UUID field
                if hosts.is_a?(Array)
                    hosts.each do |host|
                        next unless host.is_a?(Hash) && host.key?('resource_id')

                        host['uuid'] = host['resource_id'] if host['uuid'].to_s.empty?
                        host.delete('resource_id')
                        changed = true
                    end
                end

                next unless changed

                provision_body.children.first.content = body.to_json
                @db[:document_pool].where(:oid => row[:oid]).update(:body => doc.root.to_s)
            end
        end
    end
end
