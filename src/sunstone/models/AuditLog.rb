module OpenNebula
  class AuditLog < OpenNebula::Pool
    def initialize(client)
      super(client)
    end

    def query(filter = {}, page = 0, per_page = 100)
      # Call to oned's audit_log.query method
      req = Request.new('audit_log.query', filter.merge(offset: page * per_page, limit: per_page))
      resp = @client.call(req)
      if resp.is_a?(OpenNebula::Error)
        return resp
      end
      entries = resp['entries'].map { |e| AuditLogElement.new(e) }
      entries
    end
  end

  class AuditLogElement
    attr_reader :id, :user_id, :group_id, :request_id, :method, :arguments, :result, :remote_ip, :timestamp, :resource_type, :resource_id, :success

    def initialize(hash)
      @id = hash['id']
      @user_id = hash['user_id']
      # ... etc
    end
  end
end
