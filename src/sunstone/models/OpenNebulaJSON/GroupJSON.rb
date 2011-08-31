# -------------------------------------------------------------------------- #
# Copyright 2002-2011, OpenNebula Project Leads (OpenNebula.org)             #
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

require 'OpenNebulaJSON/JSONUtils'

if ONE_LOCATION
    GROUP_DEFAULT=ONE_LOCATION+"/etc/group.default"
else
    GROUP_DEFAULT="/etc/one/group.default"
end

module OpenNebulaJSON
    class GroupJSON < OpenNebula::Group
        include JSONUtils

        def create(template_json)
            group_hash = parse_json(template_json,'group')
            if OpenNebula.is_error?(group_hash)
                return group_hash
            end

            rc_alloc = self.allocate(group_hash['name'])

            #if group allocation was successful
            if !OpenNebula.is_error?(rc_alloc)
                #create default ACL rules - inspired by cli's onegroup_helper.rb

                File.open(GROUP_DEFAULT).each_line{ |l|
                    next if l.match(/^#/)

                    rule = "@#{self.id} #{l}"
                    parse = OpenNebula::Acl.parse_rule(rule)
                    if OpenNebula.is_error?(parse)
                        puts "Error parsing rule #{rule}"
                        puts "Error message" << parse.message
                        next
                    end

                    xml = OpenNebula::Acl.build_xml
                    acl = OpenNebula::Acl.new(xml, @client)
                    rc = acl.allocate(*parse)
                    if OpenNebula.is_error?(rc)
                        puts "Error creating rule #{rule}"
                        puts "Error message" << rc.message
                        next
                    end
                }
            end

            return rc_alloc
        end

        def perform_action(template_json)
            action_hash = parse_json(template_json, 'action')
            if OpenNebula.is_error?(action_hash)
                return action_hash
            end

            rc = case action_hash['perform']
                 when "chown"    then self.chown(action_hash['params'])
                 else
                     error_msg = "#{action_hash['perform']} action not " <<
                         " available for this resource"
                     OpenNebula::Error.new(error_msg)
                 end
        end

        def chown(params=Hash.new)
            super(params['owner_id'].to_i)
        end
    end
end
