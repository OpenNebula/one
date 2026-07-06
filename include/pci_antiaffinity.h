#ifndef PCI_ANTIAFFINITY_H_
#define PCI_ANTIAFFINITY_H_

#include <vector>
#include <string>

namespace opennebula {

/**
 * Check if a set of PCI addresses satisfies antiaffinity: all devices must
 * have different bus:slot (i.e., belong to different physical NICs).
 * @param pci_addresses List of PCI addresses in "domain:bus:slot.function" format.
 * @return true if all addresses have unique bus:slot pairs, false otherwise.
 */
bool CheckPCIAntiaffinity(const std::vector<std::string>& pci_addresses);

}  // namespace opennebula

#endif  // PCI_ANTIAFFINITY_H_
