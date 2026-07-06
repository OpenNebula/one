# Sunstone model for AuditLog (using the XML-RPC API)

require 'opennebula'

module OpenNebula
    class AuditLog < OpenNebula::PoolElement
        attr_accessor :id, :uid, :gid, :request, :arguments, :result, :result_msg,
                      :timestamp, :object_type, :object_id, :acl_rule, :session

        XML_ELEMENT_ROOT = 'AUDIT_LOG'

        def initialize(client, id=nil)
            super(client, id)
        end

        def info
            super
            # Parse XML into attributes
            if @xml
                @id = @xml['ID'].to_i
                @uid = @xml['UID'].to_i
                @gid = @xml['GID'].to_i
                @request = @xml['REQUEST']
                @arguments = @xml['ARGUMENTS']
                @result = @xml['RESULT']
                @result_msg = @xml['RESULT_MSG']
                @timestamp = @xml['TIMESTAMP'].to_i
                @object_type = @xml['OBJECT_TYPE']
                @object_id = @xml['OBJECT_ID'].to_i
                @acl_rule = @xml['ACL_RULE']
                @session = @xml['SESSION']
            end
        end
    end

    class AuditLogPool < OpenNebula::Pool
        def initialize(client)
            super(client, 'AUDIT_LOG_POOL', 'AUDIT_LOG', AuditLog)
        end

        def get_all(filters={})
            filter_xml = ''
            # Build filter XML for the backend
            # This depends on the XML-RPC implementation
            info(filter_xml)
            # Filtering can be client-side or better server-side via a new method
            # For now, we get all and filter in Ruby
            pool = super()
            pool.select do |log|
                match = true
                match &&= (log.uid == filters[:uid]) if filters[:uid]
                match &&= (log.timestamp >= filters[:start_time]) if filters[:start_time]
                match &&= (log.timestamp <= filters[:end_time]) if filters[:end_time]
                match &&= (log.object_type == filters[:object_type]) if filters[:object_type]
                match &&= (log.object_id == filters[:object_id]) if filters[:object_id]
                match &&= (log.request == filters[:request]) if filters[:request]
                match &&= (log.result == filters[:result]) if filters[:result]
                match
            end
        end
    end
end
