#include <set>
#include <string>
#include "NebulaLog.h"

namespace OVSValidator {

void warn_on_conflicting_vlan(int tag, const std::set<int>& trunks) {
    if (trunks.find(tag) != trunks.end()) {
        std::string msg = "OVS VLAN tag " + std::to_string(tag) + " is also present in trunks list. This is a misconfiguration.";
        NebulaLog::log("VNM", Log::WARNING, msg);
    }
}

} // namespace OVSValidator
