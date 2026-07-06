require 'sqlite3' if defined?(SQLite3)

db_path = "/var/lib/one/one_audit.db"
unless File.exist?(db_path)
  db = SQLite3::Database.new(db_path)
  db.execute <<-SQL
    CREATE TABLE audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      request TEXT,
      arguments TEXT,
      timestamp INTEGER,
      result TEXT,
      objects TEXT,
      acl_rule TEXT,
      session_cached INTEGER
    );
  SQL
  puts "Audit log table created."
else
  puts "Audit log database already exists."
end