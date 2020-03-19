# -------------------------------------------------------------------------- #
# Copyright 2002-2019, OpenNebula Project, OpenNebula Systems                #
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

module OneProvision

    # Represents the ONE object and pool
    class Resource

        # Keys to remove from template
        REJECT_KEYS = %w[meta]

        # @one  ONE object
        # @pool ONE pool
        attr_reader :one, :pool

        # Class constructor
        def initialize
            @client = OpenNebula::Client.new
        end

        # Create operation is implemented in childs
        def create
            raise 'Operation not implemented'
        end

        # Factory to return new object
        #
        # @param type [String] Object type
        def self.object(type)
            type = type.downcase.delete_suffix('s').to_sym

            case type
            when :cluster
                Cluster.new
            when :datastore
                Datastore.new
            when :host
                Host.new
            when :image
                Image.new
            when :network
                Network.new
            when :template
                Template.new
            when :vntemplate
                VnTemplate.new
            when :flowtemplate
                FlowTemplate.new
            when :marketplaceapp
                MarketPlaceApp.new
            else
                nil
            end
        end

        # Gets all resources or just provision resources
        #
        # @param id [Integer]  ID of the provision
        #
        # @return [Array] with provision resource if id!=nil
        #                 with all resources if if==nil
        def get(id = nil)
            Utils.exception(@pool.info_all)

            if id
                @pool.select do |resource|
                    resource['TEMPLATE/PROVISION/PROVISION_ID'] == id
                end
            else
                @pool.reject do |resource|
                    resource['TEMPLATE/PROVISION/PROVISION_ID'].nil?
                end
            end
        end

        # Change resource ownership
        #
        # @param template [Hash] Object information
        def template_chown(template)
            meta = template['meta']

            return unless meta

            uid = meta['uid']
            gid = meta['gid']

            uname = meta['uname']
            gname = meta['gname']

            if uname
                users = OpenNebula::UserPool.new(@client)

                rc = users.info
                Utils.exception(rc)

                uid = users.find {|u| u.name == uname }.id

                OneProvisionLogger.debug("using uname #{uname} id #{uid}")
            end

            if gname
                groups = OpenNebula::GroupPool.new(@client)

                rc = groups.info
                Utils.exception(rc)

                gid = groups.find {|g| g.name == gname }.id

                OneProvisionLogger.debug("using gname #{gname} id #{gid}")
            end

            chown(gid, uid)
        end

        # Change object permissions
        #
        # @param template [Hash] Object information
        def template_chmod(template)
            meta = template['meta']

            return unless meta

            chmod(meta['mode'])
        end

        # Deletes the ONE object
        def delete
            @one.info
            @one.delete
        end

        # Append one object to provision for ERB evaluation
        #
        # @param provision [OneProvision::Provision] Full provision
        def append_object(provision)
            objects   = provision.instance_variable_get("@#{@type}s")
            objects ||= []

            objects << @one
            provision.instance_variable_set("@#{@type}s", objects)
        end

        protected

        # Get template in string format
        #
        # @param template [Hash] Key value template
        def format_template(template)
            Utils.template_like_str(obj_template(template))
        end

        # Add provision information to object
        #
        # @param template [Hash] Current object template
        # @param info     [Hash] Information to add in provision section
        def add_provision_info(template, info)
            template['provision'] = {} unless template['provision']

            info.each do |key, value|
                next if value.nil?

                template['provision'][key] = value.to_s
            end
        end

        # Add provision ID to object
        #
        # @param template     [Hash]   Current object template
        # @param provision_id [String] Provision ID
        def add_provision_id(template, provision_id)
            template['provision'] = {} unless template['provision']

            template['provision']['provision_id'] = provision_id
        end

        # Add provision info to ONE object
        #
        # @param info [Hash] Information to add in provision section
        def update_provision_info(info)
            update_str = 'PROVISION=['

            info.each do |key, value|
                next if value.nil?

                update_str << "#{key.upcase}=\"#{value}\","
            end

            update_str.delete_suffix!(',')
            update_str << ']'

            @one.update(update_str, true)
        end

        # Add provision ID to ONE object
        #
        # @param provision_id [String] Provision ID
        def update_provision_id(provision_id)
            @one.update("PROVISION=[PROVISION_ID=#{provision_id}]", true)
        end

        private

        # Change owner and group
        #
        # @param user  [Integer] UID
        # @param group [Integer] GID
        def chown(user, group)
            user  ||= 0
            group ||= 0

            if user == @one['UID'].to_i && group == @one['GID'].to_i
                OneProvisionLogger.debug(
                    "Ownership for #{@type} #{@one.id} is already " \
                    "#{user}:#{group}"
                )
            else
                OneProvisionLogger.debug(
                    "Chown #{@type} #{@one.id} #{user}:#{group}"
                )

                rc = @one.chown(user, group)

                return unless OpenNebula.is_error?(rc)

                raise OneProvisionLoopException, rc.message
            end
        end

        # Change object permissions
        #
        # @param mode [String] Permissions in octet format
        def chmod(mode)
            OneProvisionLogger.debug("Chmod #{@type} #{@one.id} #{mode}")

            rc = @one.chmod_octet(mode.to_s)

            return unless OpenNebula.is_error?(rc)

            raise OneProvisionLoopException, rc.message
        end

        # Remove from template all unneeded information
        #
        # @param template [Hash] Object information
        def obj_template(template)
            template.reject {|k| REJECT_KEYS.include?(k) }
        end

    end

end
