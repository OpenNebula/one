#ifndef PCI_AFFINITY_H
#define PCI_AFFINITY_H

#include <string>
#include <vector>

struct PCIDevice {
    std::string pci_address;
    std::string parent_pci;  // PCI address of the physical NIC
    std::string vendor;
    std::string device_id;
};

struct PCIAffinityPolicy {
    bool use_parent;
    std::vector<std::string> affinity_addresses;   // addresses that must be on same parent
    std::vector<std::string> antiaffinity_addresses; // addresses that must be on different parents
};

bool check_pci_affinity(const std::vector<PCIDevice>& selected,
                        const PCIAffinityPolicy& policy);

#endif // PCI_AFFINITY_H