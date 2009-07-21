
require 'rubygems'
#require 'storage_pool'
require 'uuid'
require 'fileutils'
gem 'sequel', '< 3.0'
require 'sequel'
require 'logger'

# Seems that database should be opened before defining models
# TODO: fix this
DB=Sequel.sqlite('database.db')
#DB.loggers << Logger.new($stdout)
require 'image'


IMAGE_DIR='images'

module OpenNebula
    class RepoManager
        def initialize
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
