#include <iostream>
#include <string>
#include <vector>
#include <cstdlib>
#include "AuditLog.h"
#include "Nebula.h"

int main(int argc, char **argv) {
    // Simple argument parser (for demonstration)
    int uid = -1, oid = -1, limit = 50, offset = 0;
    std::string otype = "";
    time_t start = 0, end = 0;

    // parse --uid, --oid, --type, --start, --end, --limit, --offset
    // ... (omitted for brevity) ...

    Nebula::instance().initialize_db();

    std::vector<std::string> results = AuditLog::query(uid, oid, otype, start, end, limit, offset);

    // Print header
    std::cout << "timestamp\tmethod\tuid\tobject\toid\tresult" << std::endl;

    // Process results (assuming 9 columns per row)
    for (size_t i=0; i<results.size(); i+=9) {
        std::cout << results[i+1] << "\t" << results[i+2] << "\t" << results[i+3]
                  << "\t" << results[i+7] << "\t" << results[i+5] << "\t" << results[i+8] << std::endl;
    }

    return 0;
}
