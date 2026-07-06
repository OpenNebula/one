class Audit
  def self.search(filters = {})
    ds = DB[:audit_log]

    if filters[:user_id]
      ds = ds.where(user_id: filters[:user_id])
    end

    if filters[:resource_type] && filters[:resource_id]
      ds = ds.where(resource_type: filters[:resource_type], resource_id: filters[:resource_id])
    end

    if filters[:start_time] && filters[:end_time]
      ds = ds.where(timestamp: filters[:start_time]..filters[:end_time])
    end

    if filters[:action]
      ds = ds.where(action: filters[:action])
    end

    ds.order(Sequel.desc(:timestamp)).limit(100)
  end
end