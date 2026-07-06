# PCI Group Scheduling Extension for Affinity/Antiaffinity

## Overview
This extension enhances OpenNebula's scheduler to support affinity and antiaffinity rules for PCI devices, specifically designed for SR-IOV virtual functions. It allows VMs to request that multiple PCI devices (e.g., virtual functions) be placed on different physical NICs (antiaffinity) or on the same physical NIC (affinity).

## Usage
1. **VM Template**: Define PCI pass-through devices with `affinity_group` and `affinity_type` attributes.
   ```
   PCI_PASSTHROUGH = [
       "vendor=0x8086, device=0x10fb, affinity_group=g1, affinity_type=antiaffinity",
       "vendor=0x8086, device=0x10fb, affinity_group=g1, affinity_type=antiaffinity"
   ]
   ```
   - `affinity_group`: A string to group devices that have mutual constraints.
   - `affinity_type`: Either `affinity` (use same physical function) or `antiaffinity` (use different physical functions).

2. **Scheduler Integration**: The `PCIAffinityScheduler` class filters hosts based on the requirements. Integrate it into the host selection phase of the OpenNebula scheduler.

3. **Host PCI Discovery**: Host PCI devices must include `parent_bus` or `bus` fields to identify the physical function for SR-IOV. This extension assumes that devices with the same `parent_bus` are under the same physical NIC.

## Dependencies
- OpenNebula 5.x or later (tested with 5.12)
- Python 3.6+

## Configuration
Add the filter to the scheduler's host ranking or filter stage. Example:
```python
from pci_affinity_scheduler import PCIAffinityScheduler
# ... during host selection
selected_hosts = PCIAffinityScheduler.filter_hosts(all_hosts, vm_request)
# Continue with other filters
```

## Notes
- For antiaffinity, the scheduler ensures each device in a group is assigned to a distinct physical NIC (different `parent_bus`).
- For affinity, all devices in a group are placed on the same physical NIC.
- If a device cannot be matched, the host is considered unsuitable.
