require 'OpenNebula/Image'
require 'fileutils'

module OpenNebula
    class ImageRepository

        def create(image, template, copy=true)
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

            if image['TEMPLATE/PATH']
                if copy
                    # --- CDROM, DATABLOCK or OS based on a PATH ---
                    file_path = image['TEMPLATE/PATH']

                    if !File.exists?(file_path)
                        error_msg = "Image file could not be found, aborting."
                        return OpenNebula::Error.new(error_msg)
                    end

                    result = copy(file_path, image['SOURCE'])
                end
            elsif image['TEMPLATE/SIZE'] and image['TEMPLATE/FSTYPE'] and  \
                            image['TEMPLATE/TYPE'] == 'DATABLOCK'
                # --- Empty DATABLOCK ---
                result = dd(image['TEMPLATE/SIZE'], image['SOURCE'])

                if !OpenNebula.is_error?(result)
                    result = mkfs(image['TEMPLATE/FSTYPE'], image['SOURCE'])
                end
            else
                error_msg = "Image not present, aborting."
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

        def copy(path, source)
            if source.nil? or path.nil?
                return OpenNebula::Error.new("copy Image: missing parameters.")
            end

            begin
                FileUtils.copy(path, source)
                FileUtils.chmod(0660, source)
            rescue Exception => e
                return OpenNebula::Error.new(e.message)
            end

            return nil
        end

        def move(path, source)
            if source.nil? or path.nil?
                return OpenNebula::Error.new("copy Image: missing parameters.")
            end

            begin
                FileUtils.move(path, source)
                FileUtils.chmod(0660, source)
            rescue Exception => e
                return OpenNebula::Error.new(e.message)
            end

            return nil
        end

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

        def remove(source)
            if File.exists?(source)
                begin
                    FileUtils.rm(source)
                rescue Exception => e
                    return OpenNebula::Error.new(e.message)
                end
            end

            return nil
        end
    end
end