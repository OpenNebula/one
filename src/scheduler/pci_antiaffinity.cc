#include "pci_antiaffinity.h"
#include <set>
#include <sstream>

namespace opennebula {

bool CheckPCIAntiaffinity(const std::vector<std::string>& pci_addresses) {
    std::set<std::string> bus_slot_set;

    for (const auto& addr : pci_addresses) {
        // Parse address: domain:bus:slot.function
        std::istringstream iss(addr);
        std::string domain, bus, slot_func, slot, function;
        std::getline(iss, domain, ':');
        std::getline(iss, bus, ':');
        std::getline(iss, slot_func, '.');
        std::getline(iss, function, '.');

        // Build bus:slot key
        std::string key = bus + ":" + slot_func;

        if (!bus_slot_set.insert(key).second) {
            // Duplicate bus:slot found
            return false;
        }
    }

    return true;
}

}  // namespace opennebula
