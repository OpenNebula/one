#include "pci_affinity.h"
#include <algorithm>
#include <map>

bool check_pci_affinity(const std::vector<PCIDevice>& selected,
                        const PCIAffinityPolicy& policy)
{
    if (!policy.use_parent)
        return true;  // no parent-based checking

    // Build a map from parent PCI to list of selected PCI devices
    std::map<std::string, std::vector<std::string>> parent_to_devices;
    for (const auto& dev : selected)
    {
        if (!dev.parent_pci.empty())
            parent_to_devices[dev.parent_pci].push_back(dev.pci_address);
        else
            parent_to_devices[dev.pci_address].push_back(dev.pci_address);
    }

    // Check affinity: all affinity devices must be on the same parent
    if (!policy.affinity_addresses.empty())
    {
        std::string common_parent;
        for (const auto& addr : policy.affinity_addresses)
        {
            bool found = false;
            for (const auto& [parent, devices] : parent_to_devices)
            {
                if (std::find(devices.begin(), devices.end(), addr) != devices.end())
                {
                    if (common_parent.empty())
                        common_parent = parent;
                    else if (common_parent != parent)
                        return false;  // devices on different parents
                    found = true;
                    break;
                }
            }
            if (!found)
                return false;  // device not found in selected
        }
    }

    // Check antiaffinity: all antiaffinity devices must be on different parents
    if (!policy.antiaffinity_addresses.empty())
    {
        for (size_t i = 0; i < policy.antiaffinity_addresses.size(); ++i)
        {
            for (size_t j = i + 1; j < policy.antiaffinity_addresses.size(); ++j)
            {
                const auto& addr1 = policy.antiaffinity_addresses[i];
                const auto& addr2 = policy.antiaffinity_addresses[j];
                std::string parent1, parent2;
                bool found1 = false, found2 = false;

                for (const auto& [parent, devices] : parent_to_devices)
                {
                    if (std::find(devices.begin(), devices.end(), addr1) != devices.end())
                    {
                        parent1 = parent;
                        found1 = true;
                    }
                    if (std::find(devices.begin(), devices.end(), addr2) != devices.end())
                    {
                        parent2 = parent;
                        found2 = true;
                    }
                }

                if (found1 && found2 && parent1 == parent2)
                    return false;  // antiaffinity violated
            }
        }
    }

    return true;
}
