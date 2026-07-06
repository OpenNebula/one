module OpenNebula
  class RequestManager
    alias_method :original_process_request, :process_request

    def process_request(request, user_id)
      # Extract request details
      method = request.method
      params = request.params.to_json rescue '{}'

      # Call original method
      result = original_process_request(request, user_id)

      # Determine objects involved (simplified)
      objects = ''
      if request.params && request.params[:id]
        objects = "#{request.resource_type}:#{request.params[:id]}"
      end

      # Log to audit table
      db = OpenNebula::DBConnection.instance
      db.execute(
        "INSERT INTO audit_log (user_id, request_method, request_params, result, objects_involved) VALUES (?, ?, ?, ?, ?)",
        user_id, method, params, result.to_json, objects
      )

      result
    end
  end
end