# PCI Group Scheduling Extension

## Overview
This extension allows SR-IOV vNICs to enforce affinity or antiaffinity based on PCI address.
- **Antiaffinity**: vNICs must use different physical NICs (different PCI addresses).
- **Affinity**: vNICs must use the same physical NIC (same PCI address).

## Usage
Add the following attributes to NIC templates:
- `PCI_AFFINITY` = "affinity" | "antiaffinity"
- `PCI_ADDRESS` = "<PCI bus address>" (e.g., "0000:03:00.0")

The scheduler will filter hosts accordingly.

## Files
- `pci_affinity_manager.rb`: Core logic for checking constraints.
- `scheduler_hook.rb`: Example integration into OpenNebula's scheduler.

## Integration
Place `pci_affinity_manager.rb` in the appropriate library path (e.g., `/usr/lib/one/ruby/`).
Modify the scheduler (e.g., `mm_sched`) to call the `pci_affinity_filter` function during host evaluation.
