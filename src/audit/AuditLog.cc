#include "AuditLog.h"
#include <sqlite3.h>
#include <sstream>
#include <iostream>

AuditLog::AuditLog() : db_handle(nullptr) {}

AuditLog::~AuditLog() {
    if (db_handle) sqlite3_close((sqlite3*)db_handle);
}

bool AuditLog::init(const std::string& db_path) {
    int rc = sqlite3_open(db_path.c_str(), (sqlite3**)&db_handle);
    if (rc != SQLITE_OK) {
        std::cerr << "Cannot open audit database: " << sqlite3_errmsg((sqlite3*)db_handle) << std::endl;
        return false;
    }
    return true;
}

void AuditLog::insert(const AuditEntry& entry) {
    std::stringstream sql;
    sql << "INSERT INTO audit_trail (timestamp, user_id, request, args, result, objects, acl_rule_id, session_cached) VALUES ("
        << entry.timestamp << ", "
        << entry.user_id << ", '"
        << entry.request << "', '"
        << entry.args << "', '"
        << entry.result << "', '"
        << entry.objects << "', "
        << entry.acl_rule_id << ", "
        << (entry.session_cached ? 1 : 0) << ")";
    execute(sql.str());
}

std::vector<AuditEntry> AuditLog::query(const std::string& filter) {
    std::vector<AuditEntry> results;
    std::string sql = "SELECT * FROM audit_trail WHERE " + filter;
    sqlite3_stmt* stmt;
    int rc = sqlite3_prepare_v2((sqlite3*)db_handle, sql.c_str(), -1, &stmt, nullptr);
    if (rc != SQLITE_OK) {
        std::cerr << "Query error: " << sqlite3_errmsg((sqlite3*)db_handle) << std::endl;
        return results;
    }
    while (sqlite3_step(stmt) == SQLITE_ROW) {
        AuditEntry entry;
        entry.timestamp = sqlite3_column_int64(stmt, 1);
        entry.user_id = sqlite3_column_int(stmt, 2);
        entry.request = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 3));
        entry.args = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 4));
        entry.result = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 5));
        entry.objects = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 6));
        entry.acl_rule_id = sqlite3_column_int(stmt, 7);
        entry.session_cached = sqlite3_column_int(stmt, 8) != 0;
        results.push_back(entry);
    }
    sqlite3_finalize(stmt);
    return results;
}

void AuditLog::execute(const std::string& sql) {
    char* errMsg = nullptr;
    int rc = sqlite3_exec((sqlite3*)db_handle, sql.c_str(), nullptr, nullptr, &errMsg);
    if (rc != SQLITE_OK) {
        std::cerr << "SQL error: " << errMsg << std::endl;
        sqlite3_free(errMsg);
    }
}