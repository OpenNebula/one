require 'OpenNebula/Pool'

module OpenNebula
    class Host < PoolElement
        #######################################################################
        # Constants and Class Methods
        #######################################################################
        HOST_METHODS = {
            :info     => "host.info",
            :allocate => "host.allocate",
            :delete   => "host.delete",
            :enable   => "host.enable"
        }

        HOST_STATES=%w{INIT MONITORING MONITORED ERROR DISABLED}

        SHORT_HOST_STATES={
            "INIT"          => "on",
            "MONITORING"    => "on",
            "MONITORED"     => "on",
            "ERROR"         => "err",
            "DISABLED"      => "off"
        }

        # Creates a Host description with just its identifier
        # this method should be used to create plain Host objects.
        # +id+ the id of the host
        #
        # Example:
        #   host = Host.new(Host.build_xml(3),rpc_client)
        #
        def Host.build_xml(pe_id=nil)
            if pe_id
                host_xml = "<HOST><ID>#{pe_id}</ID></HOST>"
            else
                host_xml = "<HOST></HOST>"
            end

            XMLUtilsElement.initialize_xml(host_xml, 'HOST')
        end

        #######################################################################
        # Class constructor
        #######################################################################
        def initialize(xml, client)
            super(xml,client)

            @client = client
            @pe_id  = self['ID'].to_i if self['ID']
        end

        #######################################################################
        # XML-RPC Methods for the Host
        #######################################################################
        def info()
            super(HOST_METHODS[:info], 'HOST')
        end

        def allocate(hostname,im,vmm,tm)
            super(HOST_METHODS[:allocate],hostname,im,vmm,tm)
        end

        def delete()
            super(HOST_METHODS[:delete])
        end

        def enable()
            set_enabled(true)
        end

        def disable()
            set_enabled(false)
        end

        #######################################################################
        # Helpers to get Host information
        #######################################################################

        # Returns the state of the Host (numeric value)
        def state
            self['STATE'].to_i
        end

        # Returns the state of the Host (string value)
        def state_str
            HOST_STATES[state]
        end


        # Returns the state of the Host (string value)
        def short_state_str
            SHORT_HOST_STATES[state_str]
        end


    private
        def set_enabled(enabled)
            return Error.new('ID not defined') if !@pe_id

            rc = @client.call(HOST_METHODS[:enable], @pe_id, enabled)
            rc = nil if !OpenNebula.is_error?(rc)
        
            return rc
        end
    end
end
