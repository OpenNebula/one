# -------------------------------------------------------------------------- #
# Copyright 2010-2012, C12G Labs S.L.                                        #
#                                                                            #
# Licensed under the C12G Commercial Open-source License (the                #
# "License"); you may not use this file except in compliance                 #
# with the License. You may obtain a copy of the License as part             #
# of the software distribution.                                              #
#                                                                            #
# Unless agreed to in writing, software distributed under the                #
# License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES             #
# OR CONDITIONS OF ANY KIND, either express or implied. See the              #
# License for the specific language governing permissions and                #
# limitations under the License.                                             #
#--------------------------------------------------------------------------- #

require 'rubygems'
require 'mongo'
require 'yaml'

begin
    CONF      = YAML.load_file(CONFIGURATION_FILE)
rescue Exception => e
    STDERR.puts "Error parsing config file #{CONFIGURATION_FILE}: #{e.message}"
    exit 1
end

db_name = 'market'
DB = Mongo::Connection.new(CONF['db_host'], CONF['db_port']).db(db_name)