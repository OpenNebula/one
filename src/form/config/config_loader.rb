# -------------------------------------------------------------------------- #
# Copyright 2002-2025, OpenNebula Project, OpenNebula Systems                #
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

# Class to load configuration files
class ConfigLoader

    include Singleton

    attr_reader :conf

    def load_config(file)
        @conf = YAML.load_file(File.absolute_path(file))
    end

    # Validates configuration values
    def check_values(values)
        work_dir = Pathname.new(values[:work_dir].to_s)
        raise 'Invalid work_dir, does not exist or is not a directory' \
        unless work_dir.exist? && work_dir.directory?

        xmlrpc = values[:one_xmlrpc]
        raise 'Invalid one_xmlrpc URI' unless valid_url?(xmlrpc)

        host = values[:host]
        raise 'Invalid host' unless host.is_a?(String) && !host.empty?

        port = values[:port]
        raise 'Invalid port' unless port.is_a?(Integer) && port > 0 && port < 65536

        tags = values[:onedeploy_tags]
        raise 'Invalid onedeploy_tags' unless tags.is_a?(String) || tags.is_a?(Array)

        valid_auths      = ['opennebula']
        valid_core_auths = ['cipher', 'x509']
        raise 'Invalid auth'      unless valid_auths.include?(values[:auth].to_s)
        raise 'Invalid core_auth' unless valid_core_auths.include?(values[:core_auth].to_s)

        log = values[:log]
        raise 'Invalid log config' unless log.is_a?(Hash)
        raise 'Invalid log level'  unless (0..3).include?(log[:level].to_i)
        raise 'Invalid log system' unless ['file', 'syslog'].include?(log[:system].to_s)
    end

    private

    def valid_url?(url)
        uri = URI.parse(url)
        ['http', 'https'].include?(uri.scheme) && !uri.host.nil?
    rescue URI::InvalidURIError
        false
    end

end
