class CreateAuditLogs < ActiveRecord::Migration
  def change
    create_table :audit_logs do |t|
      t.integer  :user_id, null: false
      t.string   :session, null: false
      t.string   :action, null: false
      t.text     :arguments, null: false
      t.text     :result
      t.integer  :object_id
      t.string   :object_type
      t.integer  :acl_rule_id
      t.datetime :created_at, null: false
    end
    add_index :audit_logs, :user_id
    add_index :audit_logs, :created_at
    add_index :audit_logs, :object_type
    add_index :audit_logs, :object_id
  end
end
