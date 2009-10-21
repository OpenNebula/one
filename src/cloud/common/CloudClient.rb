# -------------------------------------------------------------------------- #
# Copyright 2002-2009, Distributed Systems Architecture Group, Universidad   #
# Complutense de Madrid (dsa-research.org)                                   #
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

require 'rubygems'
require 'uri'
require 'OpenNebula'

require 'net/https'

begin
    require 'curb'
    CURL_LOADED=true
rescue LoadError
    CURL_LOADED=false
end

begin
    require 'net/http/post/multipart'
rescue LoadError
end

class CloudClient
    # Gets authorization credentials from ONE_AUTH or default
    # auth file.
    #
    # Raises an error if authorization is not found
    def get_one_auth
        if ENV["ONE_AUTH"] and !ENV["ONE_AUTH"].empty? and
                File.file?(ENV["ONE_AUTH"])
            one_auth=File.read(ENV["ONE_AUTH"]).strip.split(':')
        elsif File.file?(ENV["HOME"]+"/.one/one_auth")
            one_auth=File.read(ENV["HOME"]+"/.one/one_auth").strip.split(':')
        else
            raise "No authorization data present"
        end
        
        raise "Authorization data malformed" if one_auth.length < 2
        
        one_auth
    end
    
    # Starts an http connection and calls the block provided. SSL flag
    # is set if needed.
    def http_start(url, &block)
        http = Net::HTTP.new(url.host, url.port)
        if url.scheme=='https'
            http.use_ssl = true
            http.verify_mode=OpenSSL::SSL::VERIFY_NONE
        end
        
        begin
            http.start do |connection|
                block.call(connection)
            end
        rescue Errno::ECONNREFUSED => e
            puts "Error connecting to server (" + e.to_s + ")."
            puts "Server: #{url.host}:#{url.port}"
            exit -1
        end
    end
    
    # Command line help functions
    module CLIHelpers
        # Returns the command name
        def cmd_name
            File.basename($0)
        end
    end
end

