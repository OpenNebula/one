require 'OpenNebula/Pool'
require 'fileutils'

module OpenNebula
    class Image < PoolElement
        # ---------------------------------------------------------------------
        # Constants and Class Methods
        # ---------------------------------------------------------------------
        IMAGE_METHODS = {
            :info     => "image.info",
            :allocate => "image.allocate",
            :update   => "image.update",
            :rmattr   => "image.rmattr",
            :enable   => "image.enable",
            :publish  => "image.publish",
            :delete   => "image.delete"
        }

        IMAGE_STATES=%w{INIT LOCKED READY USED DISABLED}

        SHORT_IMAGE_STATES={
            "INIT"      => "init",
            "LOCKED"    => "lock",
            "READY"     => "rdy",
            "USED"      => "used",
            "DISABLED"  => "disa"
        }

        IMAGE_TYPES=%w{OS CDROM DATABLOCK}

        SHORT_IMAGE_TYPES={
            "OS"         => "OS",
            "CDROM"      => "CD",
            "DATABLOCK"  => "DB"
        }

        # Creates an Image description with just its identifier
        # this method should be used to create plain Image objects.
        # +id+ the id of the image
        #
        # Example:
        #   image = Image.new(Image.build_xml(3),rpc_client)
        #
        def Image.build_xml(pe_id=nil)
            if pe_id
                image_xml = "<IMAGE><ID>#{pe_id}</ID></IMAGE>"
            else
                image_xml = "<IMAGE></IMAGE>"
            end

            XMLUtilsElement.initialize_xml(image_xml, 'IMAGE')
        end

        # Class constructor
        def initialize(xml, client)
            super(xml,client)

            @client = client
            @immanager = ImageManager.new
        end

        #######################################################################
        # XML-RPC Methods for the Image Object
        #######################################################################

        def info()
            super(IMAGE_METHODS[:info], 'IMAGE')
        end

        def allocate(description)
            super(IMAGE_METHODS[:allocate],description)
        end

        def update(name, value)
            super(IMAGE_METHODS[:update], name, value)
        end

        def remove_attr(name)
            do_rm_attr(name)
        end

        def enable
            set_enabled(true)
        end

        def disable
            set_enabled(false)
        end

        def publish
            set_publish(true)
        end

        def unpublish
            set_publish(false)
        end

        def delete()
            super(IMAGE_METHODS[:delete])
        end

        def copy(path, source)
            @immanager.copy(path, source)
        end

        def mk_datablock(size, fstype, source)
            rc = @immanager.dd(size, source)

            return rc if OpenNebula.is_error?(rc)

            @immanager.mkfs(fstype, source)
        end

        #######################################################################
        # Helpers to get Image information
        #######################################################################

        # Returns the state of the Image (numeric value)
        def state
            self['STATE'].to_i
        end

        # Returns the state of the Image (string value)
        def state_str
            IMAGE_STATES[state]
        end

        # Returns the state of the Image (string value)
        def short_state_str
            SHORT_IMAGE_STATES[state_str]
        end

        # Returns the type of the Image (numeric value)
        def type
            self['TYPE'].to_i
        end

        # Returns the type of the Image (string value)
        def type_str
            IMAGE_TYPES[type]
        end

        # Returns the state of the Image (string value)
        def short_type_str
            SHORT_IMAGE_TYPES[type_str]
        end

    private

        def set_enabled(enabled)
            return Error.new('ID not defined') if !@pe_id

            rc = @client.call(IMAGE_METHODS[:enable], @pe_id, enabled)
            rc = nil if !OpenNebula.is_error?(rc)

            return rc
        end

        def set_publish(published)
            return Error.new('ID not defined') if !@pe_id

            rc = @client.call(IMAGE_METHODS[:publish], @pe_id, published)
            rc = nil if !OpenNebula.is_error?(rc)

            return rc
        end

        def do_rm_attr(name)
            return Error.new('ID not defined') if !@pe_id

            rc = @client.call(IMAGE_METHODS[:rmattr], @pe_id, name)
            rc = nil if !OpenNebula.is_error?(rc)

            return rc
        end

    end

    class ImageManager
        # ---------------------------------------------------------------------
        # Constants and Class Methods
        # ---------------------------------------------------------------------
        FS_UTILS = {
            :dd     => "/bin/dd",
            :mkfs   => "/bin/mkfs"
        }

        def copy(path, source)
            if source.nil? or path.nil?
                return OpenNebula::Error.new("copy Image: missing parameters.")
            end

            if !FileUtils.copy(path, source)
                return OpenNebula::Error.new("copy Image: in File.copy")
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
            command << " obs=1048576 oseek=#{size}"

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
    end
end
