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

    def initialize(mode)

        raise "Sunstone configuration file does not contain default view mode, aborting" if mode.nil?

        if Psych::VERSION > '4.0'
            @views_config = YAML.load_file(VIEWS_CONFIGURATION_FILE, aliases: true)
        else
            @views_config = YAML.load_file(VIEWS_CONFIGURATION_FILE)
        end

        base_path = SUNSTONE_ROOT_DIR+'/public/js/'

        @views = Hash.new

        raise "The #{mode} view directory does not exists, aborting" if Dir[VIEWS_CONFIGURATION_DIR + mode].empty?

        raise "The #{mode} view directory is empty, aborting" if Dir[VIEWS_CONFIGURATION_DIR + mode + '/*.yaml'].empty?

        Dir[VIEWS_CONFIGURATION_DIR + mode + '/*.yaml'].each do |p_path|
            reg = VIEWS_CONFIGURATION_DIR + mode + '/'
            m = p_path.match(/^#{reg}(.*).yaml$/)
            if m && m[1]
                if Psych::VERSION > '4.0'
                    @views[m[1]] = YAML.load_file(p_path, aliases: true)
                else
                    @views[m[1]] = YAML.load_file(p_path)
                end
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

            if group["TEMPLATE/SUNSTONE/VIEWS"]
                views_array = group["TEMPLATE/SUNSTONE/VIEWS"].split(",")
                available << views_array.each{|v| v.strip!}
            elsif @views_config['groups']
                available << @views_config['groups'][group.name]
            end

            gadmins       = group.admin_ids
            gadmins_views = group["TEMPLATE/SUNSTONE/GROUP_ADMIN_VIEWS"]

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

        group = OpenNebula::Group.new_with_id(user.gid, onec)

        rc = group.info
        if !OpenNebula.is_error?(rc)
            gadmins = group.admin_ids
            if gadmins && gadmins.include?(user.id)
                available << @views_config['default_groupadmin']
            end
        end

        available.flatten!

        available.reject!{|v| !@views.has_key?(v)} #sanitize array views

        return available.uniq
    end

    def get_all_views
        @views.keys
    end

    def get_all_labels(group_name)
        labels = []
        if @views_config['labels_groups']
            if @views_config['labels_groups'][group_name]
                @views_config['labels_groups'][group_name].each{|l| labels.push(l)}
            end
            if @views_config['labels_groups']['default']
                @views_config['labels_groups']['default'].each{|l| labels.push(l)}
            end
        end
        return labels
    end

    def logo
        @views_config['logo']
    end
end
