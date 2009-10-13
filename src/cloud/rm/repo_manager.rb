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
require 'uuid'
require 'fileutils'
require 'sequel'
require 'logger'

module OpenNebula
    class RepoManager
        def initialize(rm_db=nil)
            # Seems that database should be opened before defining models
            # TODO: fix this
            #if rm_db
            #    DB=Sequel.sqlite(rm_db)
            #else
            #    DB=Sequel.sqlite('database.db')
            #end
            
            @db=Sequel.sqlite(rm_db)

            require 'image'

            @uuid=UUID.new

            Image.initialize_table
            ImageAcl.initialize_table
        end
        
        def add(owner, path, metadata={})
            uuid=@uuid.generate

            Image.create_image(uuid, owner, path, metadata)
        end
        
        def get(uuid)
            Image[:uuid => uuid]
        end
        
        def update(uuid, metadata)
            image=get(uuid)
            image.update(metadata)
        end
        
        
    end
    
end

=begin
OpenNebula::Image.create_image('uid', 10, 'repo_manager.rb',
    :name => 'nombre',
    :noexiste => 'nada'
)
=end

if $0 == __FILE__
    rm=OpenNebula::RepoManager.new
    img=rm.add_image(rand(100), 'image.rb', 
        :name => 'nombre', 
        :description => 'desc')
    puts img.to_xml
end
