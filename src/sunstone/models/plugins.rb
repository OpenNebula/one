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

require 'yaml'
require 'json'

class Plugins # TODO SunstonePlugins
    USER_PLUGIN_POLICY = false # or true to enable them by default

    attr_reader :plugins_conf

    def initialize
        load_conf
        check_plugins
    end

    def load_conf
        @plugins_conf = YAML.load(File.read(PLUGIN_CONFIGURATION_FILE)) #TODO load file
    end

    def check_plugins
        base_path = SUNSTONE_ROOT_DIR+'/public/js/'

        @installed_plugins = Array.new

        # read user plugins
        modified = false
        Dir[base_path+'user-plugins/*.js'].each do |p| #TODO cambiar p
            m = p.match(/^#{base_path}(.*)$/)
            if m and plugin = m[1]
                @installed_plugins << plugin
                if !plugins.include? plugin
                    @plugins_conf << {plugin=>{:ALL     => USER_PLUGIN_POLICY,
                                               :user    => nil,
                                               :group   => nil}}
                    modified = true
                end
            end
        end
        write_conf if modified

        # read base plugins
        Dir[base_path+'plugins/*.js'].each do |p|
            m = p.match(/^#{base_path}(.*)$/)
            if m and plugin = m[1]
                @installed_plugins << plugin
            end
        end
    end

    def plugins
        @plugins_conf.collect{|p| p.keys[0]}
    end

    def installed?(plugin)
        @installed_plugins.include? plugin
    end

    def authorized_plugins(user,group=nil)
        p = {"user-plugins"=>Array.new, "plugins"=>Array.new} #TODO cambiar p

        @plugins_conf.each do |plugin_conf|
            plugin = plugin_conf.keys.first
            perms = plugin_conf[plugin]
            if installed?(plugin)
                p_path, p_name = plugin.split('/')

                if perms[:user] and perms[:user][user]
                    p[p_path] << p_name
                elsif perms[:group] and perms[:group][group]
                    p[p_path] << p_name
                elsif perms[:ALL]
                    p[p_path] << p_name
                end
            end
        end
        p
    end

    def write_conf
        File.open(PLUGIN_CONFIGURATION_FILE,'w') {|f| f.write(@plugins_conf.to_yaml)}
    end

    def to_json
        @plugins_conf.to_json
    end
end
