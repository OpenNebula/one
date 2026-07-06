# PCI Address Affinity / Anti-affinity Scheduling Policy

## Overview
This scheduling policy allows users to control the placement of VMs that use SR-IOV virtual NICs based on the PCI addresses of the physical NICs. It supports two modes:
- **Affinity**: The VM will be placed on a host that already has the same PCI addresses in use (e.g., to keep VMs on the same physical NIC).
- **Anti-affinity**: The VM will be placed on a host that does not have any of the VM's PCI addresses in use (e.g., to spread VMs across different physical NICs).

## How to Use
Define the following attributes in the VM template:
- `PCI_ADDRESS_AFFINITY="YES"` for affinity.
- `PCI_ADDRESS_ANTIAFFINITY="YES"` for anti-affinity.

These attributes are mutually exclusive; if both are present, affinity takes precedence (but it's recommended to use only one).

The policy automatically extracts the PCI addresses from the VM's NIC definitions (attribute `PCI_ADDRESS` each NIC).

## Configuration
Add this policy to the OpenNebula scheduler configuration file (`/etc/one/sched.conf` or similar):
```
SCHED_POLICY = PciAddressAffinityPolicy
```
Make sure the policy file is placed in the scheduler's policies directory.

## Dependencies
- The host must report used PCI addresses via the `VM_PCI` attribute (automatically populated by the VMM driver).
- VM templates must include `PCI_ADDRESS` in their NIC definitions.

## Limitations
- Currently only considers PCI addresses shared among running VMs; does not consider free PCI slots.
- Affinity mode requires that the host already has exactly the same PCI addresses; it does not restrict to available ones.

## Testing
Run the unit tests:
```
ruby test/scheduler/test_pci_address_affinity_policy.rb
```
