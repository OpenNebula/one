Sequel.migration do
  up do
    create_table(:audit_log) do
      primary_key :id
      Integer :timestamp, null: false
      Integer :user_id, null: false
      String  :action, null: false
      Text    :arguments
      Text    :result
      Text    :objects
      String  :acl_rule
      TrueClass :session_cached, default: false

      index :user_id
      index :timestamp
      index :action
    end
  end

  down do
    drop_table(:audit_log)
  end
end
