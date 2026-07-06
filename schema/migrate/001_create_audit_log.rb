Sequel.migration do
  up do
    create_table(:audit_log) do
      primary_key :id
      Integer :user_id, null: false
      String :session_id
      String :resource_type, null: false  # e.g., 'VM', 'HOST', 'IMAGE'
      Integer :resource_id, null: false
      String :action, null: false          # e.g., 'create', 'delete', 'action'
      Text :parameters                      # JSON string
      TrueClass :result, null: false        # true/false
      Text :result_info                     # JSON string
      DateTime :timestamp, null: false, default: Sequel::CURRENT_TIMESTAMP
      index [:user_id]
      index [:resource_type, :resource_id]
      index [:timestamp]
    end
  end

  down do
    drop_table(:audit_log)
  end
end