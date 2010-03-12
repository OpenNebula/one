# -------------------------------------------------------------------------- #
# Copyright 2002-2010, OpenNebula Project Leads (OpenNebula.org)             #
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
require 'fileutils'
require 'sequel'
require 'logger'

module OpenNebula
    class RepoManager
        def initialize(rm_db=nil)
            raise "DB not defined" if !rm_db
            
            @db=Sequel.sqlite(rm_db)

            require 'image'

            Image.initialize_table
            ImageAcl.initialize_table
        end
        
        def add(owner, path, metadata={})
            Image.create_image(owner, path, metadata)
        end
        
        def get(image_id)
            Image[:id => image_id]
        end
        
        def update(image_id, metadata)
            image=get(image_id)
            image.update(metadata)
        end
        
        
    end
    
end

=begin
OpenNebula::Image.create_image(10, 'repo_manager.rb',
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
