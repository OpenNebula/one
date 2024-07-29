# -------------------------------------------------------------------------- #
# Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                #
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
        REJECT_KEYS = ['meta']

        # Valid keys in template evaluation
        EVAL_KEYS = ['cluster',
                     'datastore',
                     'host',
                     'image',
                     'network',
                     'template',
                     'vntemplate',
                     'marketplaceapp']

        S_EVAL_KEYS = ['index',
                       'provision',
                       'provision_id']

        # @one  ONE object
        # @pool ONE pool
        attr_reader :one, :pool

        # Class constructor
        #
        # @param p_template [Hash] Resource information in hash form
        def initialize(p_template)
            @client     = OpenNebula::Client.new
            @p_template = p_template
        end

        # Evaluate provision template rules that reference other objects
        # in the provision.
        #
        # Rules with format ${object.name.attr} will be transformed by the
        # real value.
        #
        # All the references to provision or provision_id will be changed by
        # the provision name and the provision ID.
        #
        # @param provision [Provision] Provision information
        def evaluate_rules(provision)
            config = ProvisionConfig.new(@p_template)

            config.eval_rules(provision)
        end

        # Create operation is implemented in childs
        def create
            raise 'Operation not implemented'
        end

        # Factory to return new object
        #
        # @param type       [String]   Object type
        # @param provider   [Provider] Provider to execute remote operations
        # @param p_template [Hash]     Resource information in hash form
        def self.object(type, provider = nil, p_template = nil)
            type = type.downcase[0..-2].to_sym

            case type
            when :cluster
                Cluster.new(provider, p_template)
            when :datastore
                Datastore.new(provider, p_template)
            when :host
                Host.new(provider, p_template)
            when :image
                Image.new(p_template)
            when :network
                Network.new(provider, p_template)
            when :template
                Template.new(p_template)
            when :vntemplate
                VnTemplate.new(p_template)
            when :flowtemplate
                FlowTemplate.new(p_template)
            when :marketplaceapp
                MarketPlaceApp.new(p_template)
            else
                nil
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

            chown(uid, gid)
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
        def delete(_ = nil, _ = nil, _ = nil)
            @one.info
            @one.delete
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

        # Add provision info to ONE object
        #
        # @param info [Hash] Information to add in provision section
        def update_provision_info(info)
            update_str = 'PROVISION=['

            info.each do |key, value|
                next if value.nil?

                update_str << "#{key.upcase}=\"#{value}\","
            end

            update_str = update_str[0..-2]
            update_str << ']'

            @one.update(update_str, true)
        end

        private

        # Change owner and group
        #
        # @param user  [Integer] UID
        # @param group [Integer] GID
        def chown(user, group)
            return if @one.id == -1

            user  ||= 0
            group ||= 0

            if user == Integer(@one['UID']) || group == Integer(@one['GID'])
                OneProvisionLogger.debug(
                    "Ownership for #{@type} #{@one.id} is already " \
                    "#{user}:#{group}"
                )
            else
                OneProvisionLogger.debug(
                    "Chown #{@type} #{@one.id} #{user}:#{group}"
                )

                rc = @one.chown(Integer(user), Integer(group))

                return unless OpenNebula.is_error?(rc)

                raise OneProvisionLoopException, rc.message
            end
        end

        # Change object permissions
        #
        # @param mode [String] Permissions in octet format
        def chmod(mode)
            return if @one.id == -1

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
