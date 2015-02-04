# -------------------------------------------------------------------------- #
# Copyright 2002-2014, OpenNebula Project (OpenNebula.org), C12G Labs        #
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

require 'yaml'
require 'json'

require 'pp'


# This class is used by Sunstone to set and return the views available to a user
# as well as available tabs.
class SunstoneViews

    ############################################################################
    # Class Constants:
    #   - Configuration files
    #   - sunstone-views.yaml includes default group views
    ############################################################################
    VIEWS_CONFIGURATION_FILE = ETC_LOCATION + "/sunstone-views.yaml"
    VIEWS_CONFIGURATION_DIR  = ETC_LOCATION + "/sunstone-views/"

	def initialize
		@views_config = YAML.load_file(VIEWS_CONFIGURATION_FILE)

		base_path = SUNSTONE_ROOT_DIR+'/public/js/'

        @views = Hash.new

        Dir[VIEWS_CONFIGURATION_DIR+'*.yaml'].each do |p_path|
            m = p_path.match(/^#{VIEWS_CONFIGURATION_DIR}(.*).yaml$/)
            if m && m[1]
                @views[m[1]] = YAML.load_file(p_path)
            end
        end
	end

	def view(user_name, group_name, view_name=nil)
        available_views = available_views(user_name, group_name)

		if view_name && available_views.include?(view_name)
			return @views[view_name]
		else
			return @views[available_views.first]
		end
	end

    # Return the name of the views avialable to a user. Those defined in the
    # group template and configured in sunstone. If no view is defined in a
    # group defaults in sunstone-views.yaml will be used.
    #
    def available_views(user_name, group_name)
        onec = $cloud_auth.client(user_name)
        user = OpenNebula::User.new_with_id(OpenNebula::User::SELF, onec)

        available = Array.new

        rc = user.info
        if OpenNebula.is_error?(rc)
            return available
        end

        user.groups.each { |gid|
            group = OpenNebula::Group.new_with_id(gid, onec)

            rc = group.info
            if OpenNebula.is_error?(rc)
                return available.uniq
            end

            if group["TEMPLATE/SUNSTONE_VIEWS"]
                views_array = group["TEMPLATE/SUNSTONE_VIEWS"].split(",")
                available << views_array.each{|v| v.strip!}
            elsif @views_config['groups']
                available << @views_config['groups'][group.name]
            end

            gadmins       = group.admin_ids
            gadmins_views = group["TEMPLATE/GROUP_ADMIN_VIEWS"]

            if gadmins && gadmins.include?(user.id) && gadmins_views
                views_array = gadmins_views.split(",")
                available << views_array.each{|v| v.strip!}
            end
        }

        available.flatten!

        available.reject!{|v| !@views.has_key?(v)} #sanitize array views

        return available.uniq if !available.empty?

        # Fallback to default views if none is defined in templates

        available << @views_config['users'][user_name] if @views_config['users']
        if @views_config['groups']
            available << @views_config['groups'][group_name]
        end
        available << @views_config['default']

        available.flatten!

        available.reject!{|v| !@views.has_key?(v)} #sanitize array views

        return available.uniq
    end

    def get_all_views
        @views.keys
    end

    def available_tabs
        @views_config['available_tabs']
    end

    def logo
        @views_config['logo']
    end
end
