#include <iostream>
#include <vector>
#include <string>
#include <getopt.h>
#include "AuditLog.h"

void print_help() {
    std::cout << "Usage: oneaudit [options]\n"
              << "Options:\n"
              << "  -u, --user UID       Filter by user ID\n"
              << "  -s, --start TIMESTAMP Filter from timestamp\n"
              << "  -e, --end TIMESTAMP   Filter until timestamp\n"
              << "  -o, --object ID      Filter by object ID (VM/Host/Image)\n"
              << "  -r, --request TYPE   Filter by request type\n"
              << "  -f, --file DB_PATH   Audit database path (default: /var/lib/one/oneaudit.db)\n"
              << "  -h, --help           Show this help\n";
}

int main(int argc, char* argv[]) {
    int opt;
    int user_id = -1;
    long long start = -1, end = -1;
    std::string object, request, db_path = "/var/lib/one/oneaudit.db";
    
    static struct option long_options[] = {
        {"user", required_argument, 0, 'u'},
        {"start", required_argument, 0, 's'},
        {"end", required_argument, 0, 'e'},
        {"object", required_argument, 0, 'o'},
        {"request", required_argument, 0, 'r'},
        {"file", required_argument, 0, 'f'},
        {"help", no_argument, 0, 'h'},
        {0, 0, 0, 0}
    };
    
    while ((opt = getopt_long(argc, argv, "u:s:e:o:r:f:h", long_options, nullptr)) != -1) {
        switch (opt) {
            case 'u': user_id = std::stoi(optarg); break;
            case 's': start = std::stoll(optarg); break;
            case 'e': end = std::stoll(optarg); break;
            case 'o': object = optarg; break;
            case 'r': request = optarg; break;
            case 'f': db_path = optarg; break;
            case 'h': print_help(); return 0;
            default: print_help(); return 1;
        }
    }
    
    AuditLog audit;
    if (!audit.init(db_path)) {
        std::cerr << "Failed to open audit database." << std::endl;
        return 1;
    }
    
    std::string filter;
    bool first = true;
    if (user_id != -1) {
        if (!first) filter += " AND ";
        filter += "user_id = " + std::to_string(user_id);
        first = false;
    }
    if (start != -1) {
        if (!first) filter += " AND ";
        filter += "timestamp >= " + std::to_string(start);
        first = false;
    }
    if (end != -1) {
        if (!first) filter += " AND ";
        filter += "timestamp <= " + std::to_string(end);
        first = false;
    }
    if (!object.empty()) {
        if (!first) filter += " AND ";
        filter += "objects LIKE '%" + object + "%'";
        first = false;
    }
    if (!request.empty()) {
        if (!first) filter += " AND ";
        filter += "request = '" + request + "'";
        first = false;
    }
    
    if (first) {
        // No filter, show all
        filter = "1=1";
    }
    
    std::vector<AuditEntry> results = audit.query(filter);
    for (const auto& e : results) {
        std::cout << "Timestamp: " << e.timestamp
                  << " User: " << e.user_id
                  << " Request: " << e.request
                  << " Objects: " << e.objects
                  << " Result: " << e.result << std::endl;
    }
    return 0;
}