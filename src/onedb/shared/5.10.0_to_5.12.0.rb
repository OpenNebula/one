# -------------------------------------------------------------------------- #
# Copyright 2019-2020, OpenNebula Systems S.L.                               #
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

include OpenNebula

module Migrator

    def db_version
        '5.12.0'
    end

    def one_version
        'OpenNebula 5.12.0'
    end

    def up
        feature_3600
        feature_4089
        true
    end

    private

    # Rename acl column name from user to userset to support postgresql
    def feature_3600
        @db.run 'DROP TABLE IF EXISTS old_acl;'
        @db.run 'ALTER TABLE acl RENAME TO old_acl;'

        create_table(:acl)

        @db.transaction do
            @db.fetch('SELECT * FROM old_acl') do |row|
                row[:userset] = row.delete(:user)

                @db[:acl].insert(row)
            end
        end

        @db.run "DROP TABLE old_acl;"
    end

    # Add DockerHub marketplace
    def feature_4089
        @db.transaction do
            @db.fetch('SELECT max(oid) as maxid FROM marketplace_pool') do |row|
                next_oid = row[:maxid] + 1

                body = "<MARKETPLACE><ID>#{next_oid}</ID><UID>0</UID><GID>0" \
                        '</GID><UNAME>oneadmin</UNAME><GNAME>oneadmin' \
                        '</GNAME><NAME>DockerHub</NAME><MARKET_MAD>' \
                        '<![CDATA[dockerhub]]></MARKET_MAD><ZONE_ID>' \
                        '<![CDATA[0]]></ZONE_ID><TOTAL_MB>0</TOTAL_MB>' \
                        '<FREE_MB>0</FREE_MB><USED_MB>0</USED_MB>' \
                        '<MARKETPLACEAPPS/><PERMISSIONS><OWNER_U>1</OWNER_U>' \
                        '<OWNER_M>1</OWNER_M><OWNER_A>1</OWNER_A>' \
                        '<GROUP_U>1</GROUP_U><GROUP_M>0</GROUP_M>' \
                        '<GROUP_A>0</GROUP_A><OTHER_U>1</OTHER_U>' \
                        '<OTHER_M>0</OTHER_M><OTHER_A>0</OTHER_A>' \
                        '</PERMISSIONS><TEMPLATE>' \
                        '<DESCRIPTION><![CDATA[DockerHub is the world\'s' \
                        ' largest library and  community for container' \
                        ' images hosted at hub.docker.com/]]></DESCRIPTION>' \
                        '<MARKET_MAD><![CDATA[dockerhub]]></MARKET_MAD>' \
                        '</TEMPLATE></MARKETPLACE>'

                new_row = {
                    :oid => next_oid,
                    :name => 'DockerHub',
                    :body => body,
                    :uid => 0,
                    :gid => 0,
                    :owner_u => 1,
                    :group_u => 1,
                    :other_u => 1
                }

                @db[:marketplace_pool].insert(new_row)
            end
        end
    end

end
