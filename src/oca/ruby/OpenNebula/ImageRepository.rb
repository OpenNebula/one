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

require 'OpenNebula/Image'
require 'fileutils'
require 'CommandManager'

module OpenNebula

    ############################################################################
    #  The ImageRepository class represents and abstraction of the Image
    #  Repository, and it provides basic operations to manage and mantain it.
    #  This class is used by the OpenNebula daemon (through the image hook) to
    #  save and update images, and by the OpenNebula CLI to create and delete
    #  them
    ############################################################################
    class ImageRepository
        ########################################################################
        #
        ########################################################################
        def create(image, template)
            if image.nil?
                error_msg = "Image could not be found, aborting."
                return OpenNebula::Error.new(error_msg)
            end

            # ------ Allocate the Image ------
            result = image.allocate(template)

            if OpenNebula.is_error?(result)
                return result
            end


            # ------ Copy the Image file ------
            image.info

            if image['SOURCE'] and File.exists?(image['SOURCE'])
                error_msg =
                        "Destination file for image already exists, aborting."
                result = OpenNebula::Error.new(error_msg)

            elsif image['TEMPLATE/PATH'] and image['TEMPLATE/SOURCE'].nil?
                # --- CDROM, DATABLOCK or OS based on a PATH ---
                file_path = image['TEMPLATE/PATH']

                if !File.exists?(file_path)
                    error_msg = "Image file could not be found, aborting."
                    result = OpenNebula::Error.new(error_msg)
                end

                if !OpenNebula.is_error?(result)
                    result = copy(file_path, image['SOURCE'])
                end

                # If the copy failed, the file should be removed
                if OpenNebula.is_error?(result)
                    remove(image['SOURCE'])
                end

            elsif image['TEMPLATE/SIZE'] and image['TEMPLATE/FSTYPE'] and  \
                            image['TEMPLATE/TYPE'] == 'DATABLOCK'
                # --- Empty DATABLOCK ---
                result = dd(image['TEMPLATE/SIZE'], image['SOURCE'])

                if !OpenNebula.is_error?(result)
                    result = mkfs(image['TEMPLATE/FSTYPE'], image['SOURCE'])
                end

                # If the dd or mkfs failed, the file should be removed
                if OpenNebula.is_error?(result)
                    remove(image['SOURCE'])
                end

            elsif image['TEMPLATE/PATH'].nil? and image['TEMPLATE/SOURCE'].nil?
                error_msg = "Image path not present, aborting."
                result = OpenNebula::Error.new(error_msg)

            elsif image['TEMPLATE/PATH'] and image['TEMPLATE/SOURCE']
                error_msg = "Template malformed, PATH and SOURCE are" <<
                            " mutuallly exclusive"
                result = OpenNebula::Error.new(error_msg)

            end

            # ------ Enable the Image ------
            if !OpenNebula.is_error?(result)
                image.enable
            else
                image.delete
            end

            return result
        end

        ########################################################################
        #
        ########################################################################
        def delete(image)
            if image.nil?
                error_msg = "Image could not be found, aborting."
                return OpenNebula::Error.new(error_msg)
            end

            result = image.info

            if !OpenNebula.is_error?(result)
                file_path = image['SOURCE']

                result = image.delete

                if !OpenNebula.is_error?(result)
                    result = remove(file_path)
                end
            end

            return result
        end

        ########################################################################
        #
        ########################################################################
        def update_source(image, source)
            if image.nil?
                error_msg = "Image could not be found, aborting."
                return OpenNebula::Error.new(error_msg)
            end

            result = image.info

            if !OpenNebula.is_error?(result)
                result = move(source, image['SOURCE'])

                image.enable
            end

            return result
        end

    private
        FS_UTILS = {
            :dd     => "env dd",
            :mkfs   => "env mkfs"
        }

        ########################################################################
        #
        ########################################################################
        def set_permissions(source)
            if File.directory?(source)
                perms = 0770
            else
                perms = 0660
            end

            FileUtils.chmod(perms, source)
        end

        ########################################################################
        #
        ########################################################################
        def copy(path, source)
            if source.nil? or path.nil?
                return OpenNebula::Error.new("copy Image: missing parameters.")
            end

            begin
                FileUtils.copy(path, source)
                set_permissions(source)
            rescue Exception => e
                return OpenNebula::Error.new(e.message)
            end

            return nil
        end

        ########################################################################
        #
        ########################################################################
        def move(path, source)
            if source.nil? || path.nil? || File.identical?(path,source)
                return nil
            end

            begin
                FileUtils.move(path, source)
                set_permissions(source)
            rescue Exception => e
                return OpenNebula::Error.new(e.message)
            end

            return nil
        end

        ########################################################################
        #
        ########################################################################
        def dd(size, source)
            if source.nil? or size.nil?
                return OpenNebula::Error.new("dd Image: missing parameters.")
            end

            command = ""
            command << FS_UTILS[:dd]
            command << " if=/dev/zero of=#{source} ibs=1 count=1"
            command << " obs=1048576 seek=#{size}"

            local_command=LocalCommand.run(command)

            if local_command.code!=0
                return OpenNebula::Error.new("dd Image: in dd command.")
            end

            return nil
        end

        ########################################################################
        #
        ########################################################################
        def mkfs(fstype, source)
            if source.nil? or fstype.nil?
                return OpenNebula::Error.new("mkfs Image: missing parameters.")
            end

            command = ""
            command << FS_UTILS[:mkfs]
            command << " -t #{fstype} -F #{source}"

            local_command=LocalCommand.run(command)

            if local_command.code!=0
                return OpenNebula::Error.new("mkfs Image: in mkfs command.")
            end

            return nil
        end

        ########################################################################
        #
        ########################################################################
        def remove(source)
            if !File.exists?(source)
                return nil
            end
       
            begin
                if File.directory?(source)
                    FileUtils.rmdir(source)
                else
                    FileUtils.rm(source)
                end
            rescue Exception => e
                return OpenNebula::Error.new(e.message)
            end

            return nil
        end
    end
end
