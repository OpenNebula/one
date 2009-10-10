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

module OpenNebula
    class Image < Sequel::Model
        plugin :schema
        plugin :hook_class_methods
        
        # Creates the database table asociated with the model. It first
        # checks for table existence before creating it so it is reasonably
        # safe to call it when you load the library.
        def self.initialize_table
            set_schema do
                primary_key :id, :type => Integer
                varchar :uuid
                int     :owner
                varchar :name
                varchar :description
                varchar :path
                int     :size
                varchar :md5
            end

            create_table unless table_exists?
        end
        
        # Makes sure the image is deleted from the repository after
        # the record is deleted. Make sure that you use destroy and not
        # delete as delete method does not call hooks.
        before_destroy do
            FileUtils.rm(self.path)
        end
        
        # Specifies the directory where images will be stored
        # dir:: _String_ directory where the images are stored
        def self.image_dir=(dir)
            @@image_dir=dir
        end
        
        # Strips out non user writable columns
        # metadata:: _Hash_ hash containing the data to add to the db
        # [return] _Hash_ clean metadata
        def self.sanitize_metadata(metadata)
            metadata.reject {|key,value|
                ![:name, :description].include? key
            }
        end
        
        # Creates a new Image object, fills it, copies the image
        # to the repository and saves to the database
        # uuid:: _String_ UUID identifier for the image
        # owner:: _Integer_ identifier of the user that owns this image
        # path:: _String_ place where to copy the image from
        # metadata:: _Hash_ extra data to add to the image, like name and description
        # [return] _Image_ newly created image
        def self.create_image(uuid, owner, path, metadata={})
            sanitized_metadata=sanitize_metadata(metadata)
        
            data={
                :uuid => uuid,
                :owner => owner,
            }.merge(sanitized_metadata)
        
            image=Image.new(data)
        
            # TODO: make copy or movement configurable
            image.copy_image(path, true)
            image.get_image_info
            image.save
        
            # set metadata
        end
        
        # Updates the image with the metadata provided. Currently only
        # name and description can be changed
        def change_metadata(metadata)
            update(Image.sanitize_metadata(metadata))
        end
        
        # Copies the image from the source path to the image repository.
        # Its name will be the image uuid. It also stores its new location
        # in the object.
        def copy_image(path, move=false)
            if move
                FileUtils.mv(path, image_path)
            else
                FileUtils.cp(path, image_path)
            end
            self.path=image_path
        end
        
        # Returns the filename and path of the image file associated with
        # this Image object.
        def image_path
            @@image_dir||='images'
            File.join(@@image_dir, uuid)
        end
        
        # Extracts md5 and size from the image file and stores these data
        # in the object.
        def get_image_info
            self.md5=`md5sum #{image_path}`.split.first
            self.size=File.size(image_path)
        end
        
        # Adds a user to the list of allowed users of this image
        def add_acl(user)
            acl=ImageAcl.new({:uuid => self.uuid, :user => user})
            acl.save
        end

        # Deletes a user fom the list of allowed users of this image
        def del_acl(user)
            acl=ImageAcl[:uuid => self.uuid, :user => user]
            acl.destroy if acl
        end
        
        # Checks if a user has permissions to use this image
        def has_permission?(user)
            return true if self.owner==user
            ImageAcl[:uuid => self.uuid, :user => user]!=nil
        end
        
        # Returns the xml representation of the image.
        def to_xml
            xml="<IMAGE>\n"
            xml<<"  <ID>#{uuid}</ID>\n"
            xml<<"  <OWNER>#{owner}</OWNER>\n"
            xml<<"  <NAME>#{name}</NAME>\n"
            xml<<"  <DESCRIPTION>#{description}</DESCRIPTION>\n"
            xml<<"  <PATH>#{path}</PATH>\n"
            xml<<"  <SIZE>#{size}</SIZE>\n"
            xml<<"  <MD5>#{md5}</MD5>\n"
            xml<<"</IMAGE>\n"
        end
        
        # Like to_xml but does not show image file path data
        def to_xml_lite
            xml="<IMAGE>\n"
            xml<<"  <ID>#{uuid}</ID>\n"
            xml<<"  <OWNER>#{owner}</OWNER>\n"
            xml<<"  <NAME>#{name}</NAME>\n"
            xml<<"  <DESCRIPTION>#{description}</DESCRIPTION>\n"
            xml<<"  <SIZE>#{size}</SIZE>\n"
            xml<<"  <MD5>#{md5}</MD5>\n"
            xml<<"</IMAGE>\n"
        end
    end
    
    class ImageAcl < Sequel::Model
        plugin :schema
        
        def self.initialize_table
            set_schema do
                primary_key :id, :type => Integer
                varchar :uuid
                int     :user
            end
            
            create_table unless table_exists?
        end
    end
end
